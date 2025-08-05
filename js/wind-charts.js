/*
 * EPW Insights
 * Author: Ehsan Rostami (https://github.com/ehsan-rostami)
 * Copyright (c) 2025 Ehsan Rostami
 * Released under the MIT License.
*/

function degToRad(degrees) {
    return degrees * (Math.PI / 180);
}

function renderWindCharts(epwData) {
    const chartRefs = { windBar: {}, monthlyRose: {} };
    renderMonthlyWindRoses('#monthly-wind-roses-chart', epwData, chartRefs);
    renderAvgWindSpeedBarChart('#avg-wind-speed-chart', epwData, chartRefs);
    renderWindControls('.tab-pane.active .left-panel', epwData, chartRefs);
}

function renderWindControls(panelSelector, epwData, chartRefs) {
    const panel = d3.select(panelSelector).html('');

    const dynamicControls = panel.append('div').attr('class', 'chart-controls-group');
    dynamicControls.append('h6').text('Interactive Wind Rose Options');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const updateAndRenderDynamicWindRose = () => {
        const year = new Date().getFullYear();
        const startMonth = +d3.select('#start-month-slider').property('value');
        const startDay = +d3.select('#start-day-slider').property('value');
        const startHour = +d3.select('#start-hour-slider').property('value');

        const startDateNum = startMonth * 10000 + startDay * 100 + startHour;
        const endDateNum = +d3.select('#end-month-slider').property('value') * 10000 +
                           +d3.select('#end-day-slider').property('value') * 100 +
                           +d3.select('#end-hour-slider').property('value');

        if (endDateNum < startDateNum) {
            d3.select('#end-month-slider').property('value', startMonth);
            d3.select('#end-month-slider-value').text(monthNames[startMonth - 1]);

            const daysInMonth = new Date(year, startMonth, 0).getDate();
            d3.select('#end-day-slider').attr('max', daysInMonth);
            
            d3.select('#end-day-slider').property('value', startDay);
            d3.select('#end-day-slider-value').text(startDay);

            d3.select('#end-hour-slider').property('value', startHour);
            d3.select('#end-hour-slider-value').text(startHour);
        }

        const filters = {
            start: {
                month: startMonth,
                day: startDay,
                hour: startHour,
            },
            end: {
                month: +d3.select('#end-month-slider').property('value'),
                day: +d3.select('#end-day-slider').property('value'),
                hour: +d3.select('#end-hour-slider').property('value'),
            }
        };

        const displaySettings = {
            showDirections: d3.select('#wind-rose-directions-toggle').property('checked'),
            showSpeedLabels: d3.select('#wind-rose-speed-toggle').property('checked'),
            showTime: d3.select('#wind-rose-time-toggle').property('checked'),
            showLegend: d3.select('#wind-rose-legend-toggle').property('checked'),
            colorBy: d3.select('input[name="colorBy"]:checked').property('value'),
            filters
        };
        
        renderDynamicWindRose('#dynamic-wind-rose-chart', epwData, displaySettings);
    };

    const dateTimeGroup = dynamicControls.append('div').attr('class', 'chart-controls-group');
    dateTimeGroup.append('label').text('Date & Time Selection').attr('class', 'fw-bold mb-2')
        .style('display', 'block')
        .style('text-align', 'center');

    const selectionContainer = dateTimeGroup.append('div')
        .style('display', 'grid')
        .style('grid-template-columns', '1fr 1fr')
        .style('gap', '1.5rem');

    const startContainer = selectionContainer.append('div');
    startContainer.append('h6').text('Start').style('text-align', 'center').style('font-weight', '600').style('color', '#0d6efd');

    const endContainer = selectionContainer.append('div');
    endContainer.append('h6').text('End').style('text-align', 'center').style('font-weight', '600').style('color', '#0d6efd');
    
    const createSlider = (parent, { label, id, min, max, value, onInput, isMonth = false, daySliderId = null }) => {
        const container = parent.append('div').attr('class', 'slider-control-item');
        const header = container.append('div').attr('class', 'slider-header');
        header.append('label').attr('for', id).text(label);
        const valueDisplay = header.append('span').attr('id', `${id}-value`).attr('class', 'slider-value-display');

        const slider = container.append('input')
            .attr('type', 'range').attr('id', id).attr('min', min).attr('max', max).attr('value', value).attr('step', 1);

        slider.on('input', function() {
            const currentValue = +d3.select(this).property('value');
            if (isMonth) {
                valueDisplay.text(monthNames[currentValue - 1]);
                const year = new Date().getFullYear();
                const daysInMonth = new Date(year, currentValue, 0).getDate();
                if (daySliderId) {
                    const daySlider = d3.select(`#${daySliderId}`);
                    daySlider.attr('max', daysInMonth);
                    if (+daySlider.property('value') > daysInMonth) {
                        daySlider.property('value', daysInMonth);
                        d3.select(`#${daySliderId}-value`).text(daysInMonth);
                    }
                }
            } else {
                 valueDisplay.text(currentValue);
            }
            onInput();
        });
        
        if (isMonth) {
            valueDisplay.text(monthNames[value - 1]);
        } else {
            valueDisplay.text(value);
        }
    };

    const year = new Date().getFullYear();
    createSlider(startContainer, { label: 'Month', id: 'start-month-slider', min: 1, max: 12, value: 1, onInput: updateAndRenderDynamicWindRose, isMonth: true, daySliderId: 'start-day-slider' });
    createSlider(startContainer, { label: 'Day', id: 'start-day-slider', min: 1, max: new Date(year, 1, 0).getDate(), value: 1, onInput: updateAndRenderDynamicWindRose });
    createSlider(startContainer, { label: 'Hour', id: 'start-hour-slider', min: 0, max: 23, value: 0, onInput: updateAndRenderDynamicWindRose });

    createSlider(endContainer, { label: 'Month', id: 'end-month-slider', min: 1, max: 12, value: 12, onInput: updateAndRenderDynamicWindRose, isMonth: true, daySliderId: 'end-day-slider' });
    createSlider(endContainer, { label: 'Day', id: 'end-day-slider', min: 1, max: new Date(year, 12, 0).getDate(), value: 31, onInput: updateAndRenderDynamicWindRose });
    createSlider(endContainer, { label: 'Hour', id: 'end-hour-slider', min: 0, max: 23, value: 23, onInput: updateAndRenderDynamicWindRose });
    
    const displayOptions = dynamicControls.append('div').attr('class', 'control-item mt-3');
    displayOptions.append('label').text('Display Options').attr('class', 'fw-bold mb-2 d-block');
    displayOptions.append('div').attr('class', 'form-check form-switch').html(`<input class="form-check-input" type="checkbox" id="wind-rose-directions-toggle" checked><label class="form-check-label" for="wind-rose-directions-toggle">Show Directions</label>`);
    displayOptions.append('div').attr('class', 'form-check form-switch').html(`<input class="form-check-input" type="checkbox" id="wind-rose-speed-toggle" checked><label class="form-check-label" for="wind-rose-speed-toggle">Show Freq. Labels</label>`);
    displayOptions.append('div').attr('class', 'form-check form-switch').html(`<input class="form-check-input" type="checkbox" id="wind-rose-time-toggle" checked><label class="form-check-label" for="wind-rose-time-toggle">Show Selected Time Panel</label>`);
    displayOptions.append('div').attr('class', 'form-check form-switch').html(`<input class="form-check-input" type="checkbox" id="wind-rose-legend-toggle" checked><label class="form-check-label" for="wind-rose-legend-toggle">Show Legend</label>`);

    const colorByGroup = dynamicControls.append('div').attr('class', 'control-item mt-3');
    colorByGroup.append('label').text('Color By:').attr('class', 'fw-bold mb-1');
    colorByGroup.append('div').attr('class', 'form-check').html(`<input class="form-check-input" type="radio" name="colorBy" value="temperature" id="colorByTemp" checked><label class="form-check-label" for="colorByTemp">Temperature</label>`);
    colorByGroup.append('div').attr('class', 'form-check').html(`<input class="form-check-input" type="radio" name="colorBy" value="humidity" id="colorByRH"><label class="form-check-label" for="colorByRH">Relative Humidity</label>`);
    
    const monthlyRoseControls = panel.append('div').attr('class', 'chart-controls-group');
    monthlyRoseControls.append('h6').text('Monthly Wind Roses Options');
    const monthlyDisplayOptions = monthlyRoseControls.append('div').attr('class', 'control-item');
    monthlyDisplayOptions.append('div').attr('class', 'form-check form-switch').html(`<input class="form-check-input" type="checkbox" id="monthly-rose-directions-toggle" checked><label class="form-check-label" for="monthly-rose-directions-toggle">Show Directions</label>`);
    monthlyDisplayOptions.append('div').attr('class', 'form-check form-switch').html(`<input class="form-check-input" type="checkbox" id="monthly-rose-freq-toggle" checked><label class="form-check-label" for="monthly-rose-freq-toggle">Show Freq. Labels</label>`);
    
    d3.selectAll('#wind-rose-directions-toggle, #wind-rose-speed-toggle, #wind-rose-time-toggle, #wind-rose-legend-toggle, input[name="colorBy"]').on('change', updateAndRenderDynamicWindRose);
    d3.select('#monthly-rose-directions-toggle').on('change', () => chartRefs.monthlyRose.toggleDirections(d3.select('#monthly-rose-directions-toggle').property('checked')));
    d3.select('#monthly-rose-freq-toggle').on('change', () => chartRefs.monthlyRose.toggleFreq(d3.select('#monthly-rose-freq-toggle').property('checked')));

    updateAndRenderDynamicWindRose();
}

function renderDynamicWindRose(selector, epwData, settings) {
    const container = d3.select(selector).html('');

    const hourlyData = epwData.data;
    const location = epwData.metadata.location;
    const formattedLocation = formatSimpleLocation(location.city, location.country);
    addExportButton(selector, 'interactive-wind-rose', formattedLocation);

    container.append('h5').text('Interactive Wind Rose').attr('class', 'chart-title-main');

    const wrapper = container.append('div')
        .style('margin', '0 auto')
        .style('max-width', '500px');

    const exportScaleFactor = 2.5;

    const f = settings.filters;
    const startFilterVal = f.start.month * 10000 + f.start.day * 100 + f.start.hour;
    const endFilterVal = f.end.month * 10000 + f.end.day * 100 + f.end.hour;

    const filteredData = hourlyData.filter(d => {
        const dVal = d.month * 10000 + d.day * 100 + d.hour;
        return dVal >= startFilterVal && dVal <= endFilterVal;
    });
    
    const margin = {
        top: 10 * exportScaleFactor,
        right: 25 * exportScaleFactor,
        bottom: 55 * exportScaleFactor,
        left: 25 * exportScaleFactor
    };
    const diameter = 160 * exportScaleFactor;
    const radius = diameter / 2;
    const innerRadius = radius * 0.15;

    const svg = wrapper.append("svg")
        .attr("viewBox", `0 0 ${diameter + margin.left + margin.right} ${diameter + margin.top + margin.bottom}`)
        .append("g").attr("transform", `translate(${margin.left + radius}, ${margin.top + radius})`);

    const nDirections = 16, directionStep = 360 / nDirections;
    const getDirectionBin = (d) => Math.round(d / directionStep) % nDirections;
    const speedBins = [0, 2, 4, 6, 8, 10, 12, 14, 100];

    const dataByDirection = d3.group(filteredData.filter(d => d.windSpeed > 0), d => getDirectionBin(d.windDirection));
    let maxFreq = d3.max(Array.from(dataByDirection.values()), d => d.length) || 0;
    const totalHours = filteredData.length;
    if (totalHours === 0) { svg.append("text").attr("text-anchor", "middle").text("No data for this period."); return; }

    const maxPercent = (maxFreq / totalHours) * 100;
    const rScale = d3.scaleLinear().domain([0, Math.ceil(maxPercent / 5) * 5 || 5]).range([innerRadius, radius]);

    svg.append("circle").attr("r", radius).attr("fill", "#f8f9fa").attr("stroke", "#777777").attr("stroke-width", "0.5px");
    svg.selectAll(".grid-circle").data(rScale.ticks(5).filter(d => rScale(d) < radius)).join("g").attr("class", "grid-circle")
    .call(g => g.append("circle")
        .attr("r", d => rScale(d))
        .style("fill", "none")
        .style("stroke", "#bebebe")
        .style("stroke-dasharray", "2,2")
        .style("stroke-width", "0.2px"))
    .call(g => settings.showSpeedLabels ? g.append("text")
        .attr("class", "wind-rose-freq-label")
        .attr("y", d => -rScale(d) - (1 * exportScaleFactor))
        .style("font-size", `${0.2 * exportScaleFactor}rem`)
        .style("font-family", "sans-serif")
        .attr("text-anchor", "middle")
        .attr("fill", "#555")
        .text(d => `${d}%`) : null);
    
    const getTempColor = (t) => { if (t === undefined) return '#a3a3a3'; if (t < 0) return '#053061'; if (t < 21) return '#92c5de'; if (t < 27) return '#f4a582'; if (t < 38) return '#d6604d'; return '#67001f'; };
    const getRHColor = (rh) => { if (rh === undefined) return '#a3a3a3'; if (rh < 30) return '#ffffb2'; if (rh < 70) return '#74c476'; return '#006d2c'; };
    const colorFunc = settings.colorBy === 'temperature' ? (data) => getTempColor(d3.mean(data, d => d.dryBulbTemperature)) : (data) => getRHColor(d3.mean(data, d => d.relativeHumidity));

    for (let i = 0; i < nDirections; i++) {
        const directionData = dataByDirection.get(i) || [];
        const petal = svg.append('g').attr('class', 'wind-rose-petal').attr('transform', `rotate(${i * directionStep})`);
        const hist = d3.bin().value(d => d.windSpeed).domain([0, 16]).thresholds(speedBins)(directionData);
        let cumulativeFreq = 0;
        hist.forEach(bin => {
            const freqPercent = (bin.length / totalHours) * 100;
            if (freqPercent === 0) return;
            const startRadius = rScale(cumulativeFreq);
            cumulativeFreq += freqPercent;
            const endRadius = rScale(cumulativeFreq);
            const arc = d3.arc().innerRadius(startRadius).outerRadius(endRadius).startAngle(degToRad(-directionStep / 2 * 0.9)).endAngle(degToRad(directionStep / 2 * 0.9));
            petal.append("path").attr("d", arc).attr("fill", colorFunc(bin)).style("stroke", "#000").style("stroke-width", "0.1px").style("stroke-opacity", 0.7);
        });
    }

    if (settings.showDirections) {
        const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
        const labelRadius = radius + (6 * exportScaleFactor);
        svg.selectAll(".dir-label").data(directions).join("text").attr("class", "wind-rose-direction-label")
            .attr("transform", (d, i) => {
                const angle = i * directionStep;
                return `translate(${labelRadius * Math.sin(degToRad(angle))}, ${-labelRadius * Math.cos(degToRad(angle))})`
            })
            .attr("dy", "0.33em")
            .style("font-size", `${4 * exportScaleFactor}px`)
            .style("font-family", "sans-serif")
            .style("font-weight", 500)
            .attr("text-anchor", "middle")
            .attr("fill", "#333")
            .text(d => d); 
    }
    
    if (settings.showLegend) {
        const legendData = {
            temperature: { title: 'Temperature (°C)', bins: [{color: '#67001f', label: '> 38'},{color: '#d6604d', label: '27 - 38'}, {color: '#f4a582', label: '21 - 27'}, {color: '#92c5de', label: '0 - 21'}, {color: '#053061', label: '< 0'}]},
            humidity: { title: 'Relative humidity (%)', bins: [{color: '#006d2c', label: '> 70'}, {color: '#74c476', label: '30-70'}, {color: '#ffffb2', label: '< 30'}]}
        };
        const activeLegendData = legendData[settings.colorBy];
        const legendGroup = svg.append("g").attr("class", "wind-rose-bottom-legend");
        const legendTitle = legendGroup.append("text")
            .attr("class", "legend-title").attr("text-anchor", "middle").attr("y", -5 * exportScaleFactor)
            .style("font-size", `${4 * exportScaleFactor}px`)
            .style("font-family", "sans-serif").style("font-weight", "bold").style("fill", "#333").text(activeLegendData.title);
        const legendItems = legendGroup.selectAll("g").data(activeLegendData.bins).enter().append("g").attr("class", "legend-item");
        
        const boxSize = 4 * exportScaleFactor, textPadding = 3 * exportScaleFactor, itemPadding = 10 * exportScaleFactor, fontSize = `${4 * exportScaleFactor}px`;
        const verticalOffset = 22 * exportScaleFactor;

        let totalWidth = 0;
        const itemWidths = [];
        legendItems.each(function(d) {
            const item = d3.select(this);
            const text = item.append("text").style("font-size", fontSize).style("font-family", "sans-serif").text(d.label);
            const textWidth = text.node().getBBox().width;
            text.remove();
            const currentItemWidth = boxSize + textPadding + textWidth;
            itemWidths.push(currentItemWidth);
            totalWidth += currentItemWidth;
        });
        totalWidth += (activeLegendData.bins.length - 1) * itemPadding;
        let currentX = -totalWidth / 2;
        legendItems.each(function(d, i) {
            const item = d3.select(this);
            item.attr("transform", `translate(${currentX}, 0)`);
            item.append("rect").attr("width", boxSize).attr("height", boxSize).style("fill", d.color).style("stroke", "black").style("stroke-width", "0.2");
            item.append("text").attr("x", boxSize + textPadding).attr("y", boxSize / 2).attr("dy", "0.3em").style("font-size", fontSize).style("font-family", "sans-serif").style("fill", "#212529").text(d.label);
            currentX += itemWidths[i] + itemPadding;
        });
        legendGroup.attr("transform", `translate(0, ${radius + verticalOffset})`);
    }

    if (settings.showTime) {
        const totalHoursInYear = hourlyData.length;
        const selectedHours = filteredData.length;
        const percentage = (selectedHours / totalHoursInYear) * 100;
        const timeInfoGroup = svg.append("g")
            .attr("class", "time-info")
            .attr("transform", `translate(0, ${radius + 45 * exportScaleFactor})`);
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        const startStr = `${monthNames[f.start.month - 1]} ${String(f.start.day).padStart(2, '0')}, ${String(f.start.hour).padStart(2, '0')}:00`;
        const endStr = `${monthNames[f.end.month - 1]} ${String(f.end.day).padStart(2, '0')}, ${String(f.end.hour).padStart(2, '0')}:00`;

        const timeSpanText = timeInfoGroup.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0em')
            .style('font-family', 'sans-serif')
            .style('font-size', `${5 * exportScaleFactor}px`)
            .style('fill', '#333');
        timeSpanText.append('tspan')
            .style('font-weight', 'bold')
            .style('font-size', `${6 * exportScaleFactor}px`)
            .text('Time Span: ');
        timeSpanText.append('tspan').text(`${startStr} — ${endStr}`);
        
        const summaryText = timeInfoGroup.append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '1.3em')
            .style('font-family', 'sans-serif')
            .style('font-size', `${5 * exportScaleFactor}px`)
            .style('font-weight', '500')
            .style('fill', '#333');
        if (percentage >= 99.9) {
            summaryText.text(`Annual (${totalHoursInYear} hours)`);
        } else {
            summaryText.append('tspan').style('fill', '#D22B2B').style('font-weight', 'bold').text(`${percentage.toFixed(2)}%`);
            summaryText.append('tspan').text(` of annual hours (`);
            summaryText.append('tspan').style('fill', '#D22B2B').style('font-weight', 'bold').text(`${selectedHours}`);
            summaryText.append('tspan').text(` hours)`);
        }
    }
}

function renderMonthlyWindRoses(selector, epwData, chartRefs) {
    const container = d3.select(selector).html('');
    
    const hourlyData = epwData.data;
    const location = epwData.metadata.location;
    const formattedLocation = formatSimpleLocation(location.city, location.country);
    addExportButton(selector, 'monthly-wind-roses', formattedLocation);

    container.append('h5').text('Monthly Wind Roses').attr('class', 'chart-title-main');

    const N_COLS = 4;
    const N_ROWS = 3;
    const CHART_DIAMETER = 120;
    const CHART_PADDING = 20; 
    const LEGEND_HEIGHT = 50; 
    const TITLE_OFFSET = 20; 
    const totalWidth = N_COLS * CHART_DIAMETER + (N_COLS - 1) * CHART_PADDING;
    const totalHeight = N_ROWS * (CHART_DIAMETER + TITLE_OFFSET) + (N_ROWS - 1) * CHART_PADDING + LEGEND_HEIGHT;
    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${totalWidth} ${totalHeight}`)
        .style("width", "100%")
        .style("height", "auto");
    const defs = svg.append('defs');
    defs.append('style').text(`
        .monthly-rose-title, .monthly-rose-direction-label, .monthly-rose-freq-label-text, .monthly-rose-legend-title, .legend-tick-label {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
        }
        .monthly-rose-title {
            font-size: 9px;
            font-weight: bold;
            fill: #333;
            text-anchor: middle;
        }
        .monthly-outer-ring {
            fill: #f3f1f1; 
            stroke: #5e5e5e; 
            stroke-width: 0.5px; 
            transition: fill 0.5s ease;
        }
        .monthly-outer-ring:hover {
            fill: #f7f7f7; 
        }
       .monthly-rose-grid-circle {
            fill: none;
            stroke: #979797;
            stroke-dasharray: 1,2;
            stroke-width: 0.5px;
        }
        .monthly-rose-freq-label-text {
            font-size: 5px;
            fill: #343a40;
            text-anchor: middle;
        }
       .monthly-rose-direction-label {
            font-size: 7px;
            fill: #343a40;
            font-weight: 500;
            text-anchor: middle;
        }
        .wind-rose-petal path {
            stroke: #000;
            stroke-width: 0.2px;
            stroke-opacity: 0.8;
        }
        .monthly-rose-legend-title {
            font-size: 9px;
            font-weight: bold;
            fill: #333;
            text-anchor: middle;
        }
        .legend-tick-label {
            font-size: 8px;
            fill: #343a40;
            text-anchor: middle;
        }
    `);
    const speedBins = [0, 2, 4, 6, 8, 10, 100];
    const speedColor = d3.scaleSequential(d3.interpolateTurbo).domain([0, 12]);
    const nDirections = 16,
        directionStep = 360 / nDirections;
    const getDirectionBin = (d) => Math.round(d / directionStep) % nDirections;
    const svgs = []; 
    for (let m = 1; m <= 12; m++) {
        const monthData = hourlyData.filter(d => d.month === m && d.windSpeed > 0);
        const row = Math.floor((m - 1) / N_COLS);
        const col = (m - 1) % N_COLS;
        const translateX = col * (CHART_DIAMETER + CHART_PADDING) + CHART_DIAMETER / 2;
        const translateY = row * (CHART_DIAMETER + CHART_PADDING + TITLE_OFFSET) + CHART_DIAMETER / 2 + TITLE_OFFSET;
        const monthGroup = svg.append('g')
            .attr('class', 'monthly-rose-group')
            .attr('transform', `translate(${translateX}, ${translateY})`);
        svgs.push(monthGroup);
        monthGroup.append('text')
            .attr('class', 'monthly-rose-title')
            .attr('y', -CHART_DIAMETER / 2 - TITLE_OFFSET / 2)
            .text(d3.timeFormat('%B')(new Date(2000, m - 1)));
        const radius = CHART_DIAMETER / 2.6;
        const innerRadius = radius * 0.08;
        const dataByDirection = d3.group(monthData, d => getDirectionBin(d.windDirection));
        const maxMonthFrequency = d3.max(Array.from(dataByDirection.values()), dirData => dirData.length) || 0;
        const rScaleDomainMax = Math.ceil((maxMonthFrequency * 1.1) / 50) * 50 || 100;
        const rScale = d3.scaleLinear().domain([0, rScaleDomainMax]).range([innerRadius, radius]);
        monthGroup.append("circle")
            .attr("class", "monthly-outer-ring")
            .attr("r", radius);
        const freqLabelsGroup = monthGroup.append('g').attr('class', 'freq-labels');
        const rTicks = rScale.ticks(4).filter(d => rScale(d) < radius);
        freqLabelsGroup.selectAll(".grid-circle")
            .data(rTicks)
            .join("circle")
            .attr("r", d => rScale(d))
            .attr("class", "monthly-rose-grid-circle");
        const labelAngle = degToRad(45);
        const labelRadiusOffset = 5;
        freqLabelsGroup.selectAll(".freq-label-text")
            .data(rTicks.filter(d => d > 0))
            .join("text")
            .attr("class", "monthly-rose-freq-label-text")
            .attr("x", d => (rScale(d) + labelRadiusOffset) * Math.sin(labelAngle))
            .attr("y", d => -(rScale(d) + labelRadiusOffset) * Math.cos(labelAngle))
            .text(d => d);
        for (let i = 0; i < nDirections; i++) {
            const directionData = dataByDirection.get(i) || [];
            if (directionData.length === 0) continue;
            const petal = monthGroup.append('g')
                .attr('class', 'wind-rose-petal')
                .attr('transform', `rotate(${i * directionStep})`);
            const hist = d3.bin().value(d => d.windSpeed).domain([0, 14]).thresholds(speedBins)(directionData);
            let cumulativeLength = 0;
            hist.forEach(bin => {
                if (bin.length === 0) return;
                const startR = rScale(cumulativeLength);
                cumulativeLength += bin.length;
                const endR = rScale(cumulativeLength);
                const arc = d3.arc().innerRadius(startR).outerRadius(endR).startAngle(degToRad(-directionStep / 2 * 0.9)).endAngle(degToRad(directionStep / 2 * 0.9));
                petal.append("path").attr("d", arc).attr("fill", speedColor(bin.x0));
            });
        }
        const dirLabelsGroup = monthGroup.append('g').attr('class', 'dir-labels');
        const directions = [{ l: "N", a: 0 }, { l: "E", a: 90 }, { l: "S", a: 180 }, { l: "W", a: 270 }];
        const labelOffset = 7;
        dirLabelsGroup.selectAll(".dir-label")
            .data(directions)
            .join("text")
            .attr("class", "monthly-rose-direction-label")
            .attr("transform", d => `translate(${(radius + labelOffset) * Math.sin(degToRad(d.a))}, ${-(radius + labelOffset) * Math.cos(degToRad(d.a))})`)
            .attr("dy", "0.35em")
            .text(d => d.l);
    }
    const legendY = totalHeight - LEGEND_HEIGHT + 10;
    const legendWidth = totalWidth * 0.4;
    const legendX = (totalWidth - legendWidth) / 2;
    const legendGroup = svg.append('g').attr('transform', `translate(0, ${legendY})`);
    legendGroup.append('text')
        .attr('class', 'monthly-rose-legend-title')
        .attr('x', totalWidth / 2)
        .attr('y', 0)
        .text('Wind Speed (m/s)');
    const linearGradient = defs.append('linearGradient')
        .attr('id', 'wind-speed-legend-grad')
        .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '0%');
    linearGradient.selectAll('stop')
        .data(speedColor.ticks().map((t, i, n) => ({ offset: `${100 * i / (n.length - 1)}%`, color: speedColor(t) })))
        .join('stop').attr('offset', d => d.offset).attr('stop-color', d => d.color);
    legendGroup.append('rect')
        .attr('x', legendX)
        .attr('y', 8)
        .attr('width', legendWidth)
        .attr('height', 12)
        .style('fill', 'url(#wind-speed-legend-grad)');
    const legendScale = d3.scaleLinear().domain(speedColor.domain()).range([0, legendWidth]);
    const legendTicks = legendGroup.append('g')
        .attr('transform', `translate(${legendX}, 25)`);
    legendTicks.selectAll('.legend-tick-label')
        .data(speedColor.ticks(7).sort(d3.ascending))
        .join('text')
        .attr('class', 'legend-tick-label')
        .attr('x', d => legendScale(d))
        .attr('y', 5)
        .text(d => d);
    chartRefs.monthlyRose = {
        toggleDirections: (show) => svgs.forEach(g => g.select('.dir-labels').style('display', show ? null : 'none')),
        toggleFreq: (show) => svgs.forEach(g => g.select('.freq-labels').style('display', show ? null : 'none')),
    };
}

function renderAvgWindSpeedBarChart(selector, epwData, chartRefs) {
    const container = d3.select(selector).html('');
    
    const hourlyData = epwData.data;
    const location = epwData.metadata.location;
    const formattedLocation = formatSimpleLocation(location.city, location.country);
    addExportButton(selector, 'average-monthly-wind-speed', formattedLocation);

    container.append('h5').text('Average Monthly Wind Speed').attr('class', 'chart-title-main');
    
    const margin = { top: 20, right: 20, bottom: 50, left: 60 };
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "#f8f9fa")
        .style("transition", "fill 0.3s ease-in-out")
        .on("mouseover", function() {
            d3.select(this).attr("fill", "#f7fafc");
        })
        .on("mouseout", function() {
            d3.select(this).attr("fill", "#f8f9fa");
        });
    const tooltip = d3.select("body").selectAll(".tooltip").data([null]).join("div").attr("class", "tooltip");
    const monthlyData = Array.from(d3.group(hourlyData, d => d.month), ([month, data]) => ({
        month: d3.timeFormat("%b")(new Date(2000, month - 1)),
        mean: d3.mean(data, d => d.windSpeed),
        max: d3.max(data, d => d.windSpeed)
    })).sort((a, b) => new Date('1 ' + a.month + ' 2000') - new Date('1 ' + b.month + ' 2000'));
    const annualData = { month: 'Annual', mean: d3.mean(hourlyData, d => d.windSpeed), max: d3.max(hourlyData, d => d.windSpeed) };
    const plotData = [...monthlyData, annualData];
    const x = d3.scaleBand().domain([...monthlyData.map(d => d.month), "", "Annual"]).range([0, width]).padding(0.2);
    const y = d3.scaleLinear().range([height, 0]);
    const barColor = "#a6cee3";
    svg.append("g").attr("class", "axis x-axis").attr("transform", `translate(0, ${height})`);
    svg.append("g").attr("class", "axis y-axis");
    svg.append("g").attr("class", "grid-line");
    svg.append("text")
        .attr("class", "axis-title")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left + 20)
        .attr("x", -height / 2)
        .attr("text-anchor", "middle")
        .style('font-family', 'sans-serif')
        .style('font-size', '11px')        
        .text("m/s");
    chartRefs.windBar = {
        update: (options = {}) => {
            const { fit, reset } = options;
            let yDomain;
            const maxMean = d3.max(plotData, d => d.mean);
            if (fit) {
                const q99 = d3.quantile(plotData.map(d => d.mean).filter(d => d), 0.99);
                yDomain = [0, (q99 > 0 ? q99 * 1.1 : maxMean * 1.1) || 5];
            } else {
                yDomain = [0, (maxMean * 1.2) || 5];
            }
            const minDisplayMax = 5;
            yDomain[1] = Math.max(yDomain[1], minDisplayMax);
            y.domain(yDomain).nice();
            const grid = svg.select(".grid-line").call(d3.axisLeft(y).tickSize(-width).tickFormat(""));
            grid.selectAll(".tick")
                .filter(d => d === y.domain()[0])
                .remove();
            grid.selectAll("line")
                .attr("stroke", "#b0b0b0")
                .attr("stroke-opacity", 0.6)
                .attr("stroke-dasharray", "3,3");
            grid.select(".domain").remove();
            const xAxis = svg.select(".x-axis").call(d3.axisBottom(x).tickValues(x.domain().filter(d => d !== "")));
            const yAxis = svg.select(".y-axis").transition().duration(500).call(d3.axisLeft(y));
            yAxis.selectAll('text').style('font-family', 'sans-serif').style('font-size', '10px');
            xAxis.selectAll('text').style('font-family', 'sans-serif').style('font-size', '10px');
            svg.selectAll(".avg-wind-speed-bar")
                .data(plotData.filter(d => d.month))
                .join("rect")
                .attr("class", "avg-wind-speed-bar")
                .attr("x", d => x(d.month))
                .attr("width", x.bandwidth())
                .attr("y", y(0))
                .attr("height", 0)
                .attr("stroke", "black")
                .attr("stroke-width", 0.7)
                .attr("stroke-opacity", 0.8)
                .style("transition", "fill 0.3s ease-in-out, stroke-width 0.3s, stroke-opacity 0.3s")
                .on("mouseover", (event, d) => {
                    const target = d3.select(event.currentTarget);
                    target.style('fill', d3.color(barColor).darker(0.2))
                          .style('stroke-width', '1px')
                          .style('stroke-opacity', 1);
                    tooltip.style("opacity", 1).html(`<strong>${d.month}</strong><br>Mean: ${d.mean.toFixed(1)} m/s<br>Max: ${d.max.toFixed(1)} m/s`);
                })
                .on("mousemove", (event) => {
                    tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`);
                })
                .on("mouseout", function(event, d){
                    const target = d3.select(event.currentTarget);
                    target.style('fill', barColor)
                          .style('stroke-width', '0.7px')
                          .style('stroke-opacity', 0.8);
                    tooltip.style("opacity", 0);
                })
                .transition().duration(500)
                .attr("y", d => y(d.mean > 0 ? d.mean : 0))
                .attr("height", d => height - y(d.mean > 0 ? d.mean : 0))
                .attr("fill", barColor);
        }
    };
    chartRefs.windBar.update({ reset: true });
}
