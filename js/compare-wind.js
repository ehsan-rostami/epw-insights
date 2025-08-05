/*
 * EPW Insights
 * Author: Ehsan Rostami (https://github.com/ehsan-rostami)
 * Copyright (c) 2025 Ehsan Rostami
 * Released under the MIT License.
*/

/**
 * Main function
 * @param {object} epwDataA
 * @param {object} epwDataB
 */
function renderWindCompareCharts(epwDataA, epwDataB) {
    const chartRefs = {};
    const contentArea = d3.select("#compare-content-area").html('');
    contentArea.append('div').attr('id', 'compare-wind-rose-chart').attr('class', 'chart-container mb-5');
    contentArea.append('div').attr('id', 'compare-wind-speed-chart').attr('class', 'chart-container');
    renderWindCompareControls('#compare-pane .left-panel', chartRefs);
    renderWindRoseComparison('#compare-wind-rose-chart', epwDataA, epwDataB, chartRefs);
    renderWindSpeedComparison('#compare-wind-speed-chart', epwDataA, epwDataB);
}

/**
 * Controls for the left panel
 * @param {string} panelSelector
 * @param {object} chartRefs
 */
function renderWindCompareControls(panelSelector, chartRefs) {
    const panel = d3.select(panelSelector);
    const windRoseControls = panel.append('div').attr('class', 'chart-controls-group');
    windRoseControls.append('h6').text('Interactive Wind Rose Options');

    let updateWindRoseComparison;

    const dateTimeGroup = windRoseControls.append('div').attr('class', 'chart-controls-group');
    dateTimeGroup.append('label').text('Date & Time Selection').attr('class', 'fw-bold mb-2').style('display', 'block').style('text-align', 'center');
    const selectionContainer = dateTimeGroup.append('div').style('display', 'grid').style('grid-template-columns', '1fr 1fr').style('gap', '1.5rem');
    const startContainer = selectionContainer.append('div');
    startContainer.append('h6').text('Start').style('text-align', 'center').style('font-weight', '600').style('color', '#0d6efd');
    const endContainer = selectionContainer.append('div');
    endContainer.append('h6').text('End').style('text-align', 'center').style('font-weight', '600').style('color', '#0d6efd');
    
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

    const createSlider = (parent, { label, id, min, max, value, isMonth = false, daySliderId = null, onInputCallback = null }) => {
        const container = parent.append('div').attr('class', 'slider-control-item');
        const header = container.append('div').attr('class', 'slider-header');
        header.append('label').attr('for', id).text(label);
        const valueDisplay = header.append('span').attr('id', `${id}-value`).attr('class', 'slider-value-display');
        const slider = container.append('input').attr('type', 'range').attr('id', id).attr('min', min).attr('max', max).attr('value', value).attr('step', 1).attr('class', 'wind-rose-control');
        
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
            if (onInputCallback) {
                onInputCallback();
            }
        });
        
        if (isMonth) { valueDisplay.text(monthNames[value - 1]); } else { valueDisplay.text(value); }
    };

    const year = new Date().getFullYear();
    updateWindRoseComparison = () => {
        const startMonth = +d3.select('#start-month-slider-compare').property('value');
        const startDay = +d3.select('#start-day-slider-compare').property('value');
        const startHour = +d3.select('#start-hour-slider-compare').property('value');

        const startDateNum = startMonth * 10000 + startDay * 100 + startHour;
        const endDateNum = +d3.select('#end-month-slider-compare').property('value') * 10000 +
                           +d3.select('#end-day-slider-compare').property('value') * 100 +
                           +d3.select('#end-hour-slider-compare').property('value');

        if (endDateNum < startDateNum) {
            d3.select('#end-month-slider-compare').property('value', startMonth);
            d3.select('#end-month-slider-compare-value').text(monthNames[startMonth - 1]);

            const daysInMonth = new Date(year, startMonth, 0).getDate();
            d3.select('#end-day-slider-compare').attr('max', daysInMonth);

            d3.select('#end-day-slider-compare').property('value', startDay);
            d3.select('#end-day-slider-compare-value').text(startDay);

            d3.select('#end-hour-slider-compare').property('value', startHour);
            d3.select('#end-hour-slider-compare-value').text(startHour);
        }

        const settings = {
            filters: {
                start: {
                    month: startMonth,
                    day: startDay,
                    hour: startHour,
                },
                end: {
                    month: +d3.select('#end-month-slider-compare').property('value'),
                    day: +d3.select('#end-day-slider-compare').property('value'),
                    hour: +d3.select('#end-hour-slider-compare').property('value'),
                }
            },
            display: {
                showDirections: d3.select('#wind-rose-directions-toggle-compare').property('checked'),
                showSpeedLabels: d3.select('#wind-rose-speed-toggle-compare').property('checked'),
                showTime: d3.select('#wind-rose-time-toggle-compare').property('checked'),
                showLegend: d3.select('#wind-rose-legend-toggle-compare').property('checked'),
                colorBy: d3.select('input[name="colorBy-compare"]:checked').property('value'),
            }
        };
        if (chartRefs && chartRefs.updateWindRose && typeof chartRefs.updateWindRose === 'function') {
            chartRefs.updateWindRose(settings);
        }
    };
    
    createSlider(startContainer, { label: 'Month', id: 'start-month-slider-compare', min: 1, max: 12, value: 1, isMonth: true, daySliderId: 'start-day-slider-compare', onInputCallback: updateWindRoseComparison });
    createSlider(startContainer, { label: 'Day', id: 'start-day-slider-compare', min: 1, max: new Date(year, 1, 0).getDate(), value: 1, onInputCallback: updateWindRoseComparison });
    createSlider(startContainer, { label: 'Hour', id: 'start-hour-slider-compare', min: 0, max: 23, value: 0, onInputCallback: updateWindRoseComparison });
    createSlider(endContainer, { label: 'Month', id: 'end-month-slider-compare', min: 1, max: 12, value: 12, isMonth: true, daySliderId: 'end-day-slider-compare', onInputCallback: updateWindRoseComparison });
    createSlider(endContainer, { label: 'Day', id: 'end-day-slider-compare', min: 1, max: new Date(year, 12, 0).getDate(), value: 31, onInputCallback: updateWindRoseComparison });
    createSlider(endContainer, { label: 'Hour', id: 'end-hour-slider-compare', min: 0, max: 23, value: 23, onInputCallback: updateWindRoseComparison });

    const displayOptions = windRoseControls.append('div').attr('class', 'control-item mt-3');
    displayOptions.append('label').text('Display Options').attr('class', 'fw-bold mb-2 d-block');
    displayOptions.append('div').attr('class', 'form-check form-switch').html(`<input class="form-check-input wind-rose-control" type="checkbox" id="wind-rose-directions-toggle-compare" checked><label class="form-check-label" for="wind-rose-directions-toggle-compare">Show Directions</label>`);
    displayOptions.append('div').attr('class', 'form-check form-switch').html(`<input class="form-check-input wind-rose-control" type="checkbox" id="wind-rose-speed-toggle-compare" checked><label class="form-check-label" for="wind-rose-speed-toggle-compare">Show Freq. Labels</label>`);
    displayOptions.append('div').attr('class', 'form-check form-switch').html(`<input class="form-check-input wind-rose-control" type="checkbox" id="wind-rose-time-toggle-compare" checked><label class="form-check-label" for="wind-rose-time-toggle-compare">Show Selected Time Panel</label>`);
    displayOptions.append('div').attr('class', 'form-check form-switch').html(`<input class="form-check-input wind-rose-control" type="checkbox" id="wind-rose-legend-toggle-compare" checked><label class="form-check-label" for="wind-rose-legend-toggle-compare">Show Legend</label>`);

    const colorByGroup = windRoseControls.append('div').attr('class', 'control-item mt-3');
    colorByGroup.append('label').text('Color By:').attr('class', 'fw-bold mb-1');
    colorByGroup.append('div').attr('class', 'form-check').html(`<input class="form-check-input wind-rose-control" type="radio" name="colorBy-compare" value="temperature" id="colorByTemp-compare" checked><label class="form-check-label" for="colorByTemp-compare">Temperature</label>`);
    colorByGroup.append('div').attr('class', 'form-check').html(`<input class="form-check-input wind-rose-control" type="radio" name="colorBy-compare" value="humidity" id="colorByRH-compare"><label class="form-check-label" for="colorByRH-compare">Relative Humidity</label>`);
    
    d3.selectAll('.wind-rose-control').on('change', updateWindRoseComparison);
}

/**
 * Interactive wind roses
 * @param {string} selector
 * @param {object} dataA
 * @param {object} dataB
 * @param {object} chartRefs
 */
function renderWindRoseComparison(selector, dataA, dataB, chartRefs) {
    const mainContainer = d3.select(selector);
    const locNameA = formatSimpleLocation(dataA.metadata.location.city, dataA.metadata.location.country, 'primary');
    const locNameB = formatSimpleLocation(dataB.metadata.location.city, dataB.metadata.location.country, 'comparison');
    const legendNameA = formatCityNameOnly(dataA.metadata.location.city, 'primary');
    const legendNameB = formatCityNameOnly(dataB.metadata.location.city, 'comparison');

    const degToRad = (degrees) => degrees * (Math.PI / 180);

    const drawSingleWindRose = (svgGroup, hourlyData, settings, locationName, dims) => {
        const { diameter, scale: exportScaleFactor } = dims;
        const radius = diameter / 2;
        const innerRadius = radius * 0.15;

        const f = settings.filters;
        const startFilterVal = f.start.month * 10000 + f.start.day * 100 + f.start.hour;
        const endFilterVal = f.end.month * 10000 + f.end.day * 100 + f.end.hour;

        const filteredData = hourlyData.filter(d => {
            const dVal = d.month * 10000 + d.day * 100 + d.hour;
            return dVal >= startFilterVal && dVal <= endFilterVal;
        });

        svgGroup.append('text').attr('class', 'chart-title-main').attr('x', 0).attr('y', -radius - (15 * exportScaleFactor)).attr('text-anchor', 'middle').style("font-family", "sans-serif").style('font-size', `${8 * exportScaleFactor}px`).style('font-weight', 'bold').text(locationName);

        const nDirections = 16;
        const directionStep = 360 / nDirections;
        const getDirectionBin = (d) => Math.round(d / directionStep) % nDirections;

        const dataByDirection = d3.group(filteredData.filter(d => d.windSpeed > 0), d => getDirectionBin(d.windDirection));
        const maxFreq = d3.max(Array.from(dataByDirection.values()), d => d.length) || 0;
        const totalHours = filteredData.length;

        if (totalHours === 0) {
            svgGroup.append("text").attr("text-anchor", "middle").text("No data for this period.");
            return { totalHours: hourlyData.length, filteredHours: 0 };
        }

        const maxPercent = (maxFreq / totalHours) * 100;
        const rScale = d3.scaleLinear().domain([0, Math.ceil(maxPercent / 5) * 5 || 5]).range([innerRadius, radius]);

        svgGroup.append("circle").attr("r", radius).attr("fill", "#f8f9fa").attr("stroke", "#777777").attr("stroke-width", "0.5px");
        const gridCircles = svgGroup.selectAll(".grid-circle").data(rScale.ticks(5).filter(d => rScale(d) < radius)).join("g").attr("class", "grid-circle");
        
        gridCircles.append("circle").attr("r", d => rScale(d)).style("fill", "none").style("stroke", "#bebebe").style("stroke-dasharray", "2,2").style("stroke-width", "0.5px");

        if (settings.display.showSpeedLabels) {
            gridCircles.append("text").attr("class", "wind-rose-freq-label").attr("y", d => -rScale(d) - (2 * exportScaleFactor)).style("font-size", `${4.5 * exportScaleFactor}px`).style("font-family", "sans-serif").attr("text-anchor", "middle").attr("fill", "#555").text(d => `${d}%`);
        }

        const getTempColor = (t) => { if (t === undefined) return '#a3a3a3'; if (t < 0) return '#053061'; if (t < 21) return '#92c5de'; if (t < 27) return '#f4a582'; if (t < 38) return '#d6604d'; return '#67001f'; };
        const getRHColor = (rh) => { if (rh === undefined) return '#a3a3a3'; if (rh < 30) return '#ffffb2'; if (rh < 70) return '#74c476'; return '#006d2c'; };
        const colorFunc = settings.display.colorBy === 'temperature' ? (data) => getTempColor(d3.mean(data, d => d.dryBulbTemperature)) : (data) => getRHColor(d3.mean(data, d => d.relativeHumidity));
        const speedBins = [0, 2, 4, 6, 8, 10, 12, 14, 100];

        for (let i = 0; i < nDirections; i++) {
            const directionData = dataByDirection.get(i) || [];
            const petal = svgGroup.append('g').attr('class', 'wind-rose-petal').attr('transform', `rotate(${i * directionStep})`);
            const hist = d3.bin().value(d => d.windSpeed).domain([0, 16]).thresholds(speedBins)(directionData);
            let cumulativeFreq = 0;
            hist.forEach(bin => {
                const freqPercent = (bin.length / totalHours) * 100;
                if (freqPercent === 0) return;
                const startRadius = rScale(cumulativeFreq);
                cumulativeFreq += freqPercent;
                const endRadius = rScale(cumulativeFreq);
                const arc = d3.arc().innerRadius(startRadius).outerRadius(endRadius).startAngle(degToRad(-directionStep / 2 * 0.9)).endAngle(degToRad(directionStep / 2 * 0.9));
                petal.append("path").attr("d", arc).attr("fill", colorFunc(bin)).style("stroke", "#000").style("stroke-width", "0.2px").style("stroke-opacity", 0.7);
            });
        }

        if (settings.display.showDirections) {
            const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
            const labelRadius = radius + (8 * exportScaleFactor);
            svgGroup.selectAll(".dir-label").data(directions).join("text").attr("class", "wind-rose-direction-label").attr("transform", (d, i) => `translate(${labelRadius * Math.sin(degToRad(i * directionStep))}, ${-labelRadius * Math.cos(degToRad(i * directionStep))})`).attr("dy", "0.33em").style("font-size", `${5.5 * exportScaleFactor}px`).style("font-family", "sans-serif").style("font-weight", 500).attr("text-anchor", "middle").attr("fill", "#333").text(d => d);
        }

        return { totalHours: hourlyData.length, filteredHours: filteredData.length };
    };

    function update(settings) {
        mainContainer.html('');
        addExportButton(selector, `wind-rose-${locNameA}-vs-${locNameB}`, `${locNameA} vs. ${locNameB}`);
        mainContainer.append('h5').text('Interactive Wind Rose Comparison').attr('class', 'chart-title-main');

        const exportScaleFactor = 2.0;
        const chartDiameter = 320;
        const chartRadius = chartDiameter / 2;
        const gap = 60 * exportScaleFactor;
        const bottomSectionHeight = 80 * exportScaleFactor;
        const totalWidth = (chartDiameter * 2) + gap;
        const totalHeight = chartDiameter + bottomSectionHeight;
        const margin = { top: 45 * exportScaleFactor, right: 25 * exportScaleFactor, bottom: 5 * exportScaleFactor, left: 25 * exportScaleFactor };

        const svg = mainContainer.append("svg").attr("viewBox", `0 0 ${totalWidth + margin.left + margin.right} ${totalHeight + margin.top + margin.bottom}`).append("g").attr("transform", `translate(${margin.left}, ${margin.top})`);
        const groupA = svg.append("g").attr("transform", `translate(${chartRadius}, ${chartRadius})`);
        const groupB = svg.append("g").attr("transform", `translate(${chartDiameter + gap + chartRadius}, ${chartRadius})`);

        const dims = { diameter: chartDiameter, scale: exportScaleFactor };
        const statsA = drawSingleWindRose(groupA, dataA.data, settings, legendNameA, dims);
        drawSingleWindRose(groupB, dataB.data, settings, legendNameB, dims);

        const bottomGroup = svg.append("g").attr("transform", `translate(${totalWidth / 2}, ${chartDiameter + 40 * exportScaleFactor})`);

        if (settings.display.showLegend) {
            const legendData = {
                temperature: { title: 'Temperature (°C)', bins: [{color: '#053061', label: '< 0'}, {color: '#92c5de', label: '0 - 21'}, {color: '#f4a582', label: '21 - 27'}, {color: '#d6604d', label: '27 - 38'}, {color: '#67001f', label: '> 38'}]},
                humidity: { title: 'Relative humidity (%)', bins: [{color: '#ffffb2', label: '< 30'}, {color: '#74c476', label: '30-70'}, {color: '#006d2c', label: '> 70'}]}
            };
            const activeLegendData = legendData[settings.display.colorBy];
            const legendGroup = bottomGroup.append("g").attr("class", "wind-rose-bottom-legend");
            legendGroup.append("text").attr("class", "legend-title").attr("text-anchor", "middle").attr("y", -5 * exportScaleFactor).style("font-size", `${7 * exportScaleFactor}px`).style("font-family", "sans-serif").style("font-weight", "bold").style("fill", "#333").text(activeLegendData.title);
            const legendItems = legendGroup.selectAll("g.legend-item").data(activeLegendData.bins).enter().append("g").attr("class", "legend-item");
            const boxSize = 5 * exportScaleFactor, textPadding = 3 * exportScaleFactor, itemPadding = 12 * exportScaleFactor, fontSize = `${6 * exportScaleFactor}px`;
            let totalLegendWidth = 0;
            const itemWidths = [];
            legendItems.each(function(d) {
                const text = d3.select(this).append("text").style("font-size", fontSize).text(d.label);
                itemWidths.push(text.node().getBBox().width);
                text.remove();
            });
            totalLegendWidth = d3.sum(itemWidths) + (activeLegendData.bins.length * (boxSize + textPadding)) + ((activeLegendData.bins.length - 1) * itemPadding);
            let currentX = -totalLegendWidth / 2;
            legendItems.each(function(d, i) {
                const item = d3.select(this).attr("transform", `translate(${currentX}, 0)`);
                item.append("rect").attr("width", boxSize).attr("height", boxSize).style("fill", d.color).style("stroke", "black").style("stroke-width", "0.2");
                item.append("text").attr("x", boxSize + textPadding).attr("y", boxSize / 2).attr("dy", "0.3em").style("font-size", fontSize).style("font-family", "sans-serif").text(d.label);
                currentX += itemWidths[i] + boxSize + textPadding + itemPadding;
            });
        }

        if (settings.display.showTime) {
            const timeInfoGroup = bottomGroup.append("g").attr("transform", `translate(0, ${25 * exportScaleFactor})`);
            const { start, end } = settings.filters;
            const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            const startStr = `${monthNames[start.month - 1]} ${String(start.day).padStart(2, '0')}, ${String(start.hour).padStart(2, '0')}:00`;
            const endStr = `${monthNames[end.month - 1]} ${String(end.day).padStart(2, '0')}, ${String(end.hour).padStart(2, '0')}:00`;
            const timeSpanText = timeInfoGroup.append('text').attr('text-anchor', 'middle').style("font-size", `${6 * exportScaleFactor}px`).style('font-family', 'sans-serif');
            timeSpanText.append('tspan').style('font-weight', 'bold').text('Time Span: ');
            timeSpanText.append('tspan').text(`${startStr} — ${endStr}`);
            const percentageA = (statsA.filteredHours / statsA.totalHours) * 100;
            const summaryText = timeInfoGroup.append('text').attr('text-anchor', 'middle').attr('dy', '1.3em').style("font-size", `${6 * exportScaleFactor}px`).style('font-family', 'sans-serif');
            if (percentageA >= 99.9) {
                summaryText.text(`Annual (${statsA.totalHours} hours)`);
            } else {
                summaryText.append('tspan').style('fill', '#D22B2B').style('font-weight', 'bold').text(`${percentageA.toFixed(1)}%`);
                summaryText.append('tspan').text(` of annual hours (`);
                summaryText.append('tspan').style('fill', '#D22B2B').style('font-weight', 'bold').text(`${statsA.filteredHours}`);
                summaryText.append('tspan').text(` hours)`);
            }
        }
    }

    if (chartRefs) {
        chartRefs.updateWindRose = update;
    }
    
    const defaultSettings = {
        filters: { start: { month: 1, day: 1, hour: 0 }, end: { month: 12, day: 31, hour: 23 } },
        display: { showDirections: true, showSpeedLabels: true, showTime: true, showLegend: true, colorBy: 'temperature' }
    };
    update(defaultSettings);
}

/**
 * Average monthly wind speed
 * @param {string} selector
 * @param {object} dataA
 * @param {object} dataB
 */
function renderWindSpeedComparison(selector, dataA, dataB) {
    const container = d3.select(selector).html('');
    const locNameA = formatSimpleLocation(dataA.metadata.location.city, dataA.metadata.location.country, 'primary');
    const locNameB = formatSimpleLocation(dataB.metadata.location.city, dataB.metadata.location.country, 'comparison');
    const legendNameA = formatCityNameOnly(dataA.metadata.location.city, 'primary');
    const legendNameB = formatCityNameOnly(dataB.metadata.location.city, 'comparison');

    addExportButton(selector, `avg-wind-speed-${locNameA}-vs-${locNameB}`, `${locNameA} vs. ${locNameB}`);
    container.append('h5').text('Average Monthly Wind Speed Comparison').attr('class', 'chart-title-main');

    const margin = { top: 20, right: 20, bottom: 80, left: 60 };
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 300 - margin.top - margin.bottom;
    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    svg.append("rect").attr("width", width).attr("height", height).attr("fill", "#f8f9fa").style("transition", "fill 0.3s ease-in-out")
        .on("mouseover", function() { d3.select(this).attr("fill", "#f7fafc"); })
        .on("mouseout", function() { d3.select(this).attr("fill", "#f8f9fa"); });

    const tooltip = d3.select("body").selectAll(".tooltip").data([null]).join("div").attr("class", "tooltip");

    const processData = (hourlyData) => {
        const monthlyData = Array.from(d3.group(hourlyData, d => d.month), ([month, data]) => ({
            month: d3.timeFormat("%b")(new Date(2000, month - 1)),
            mean: d3.mean(data, d => d.windSpeed),
            max: d3.max(data, d => d.windSpeed)
        })).sort((a, b) => new Date('1 ' + a.month + ' 2000') - new Date('1 ' + b.month + ' 2000'));
        const annualData = { month: 'Annual', mean: d3.mean(hourlyData, d => d.windSpeed), max: d3.max(hourlyData, d => d.windSpeed) };
        return [...monthlyData, annualData];
    };

    const plotDataA = processData(dataA.data);
    const plotDataB = processData(dataB.data);
    const dataMapA = new Map(plotDataA.map(d => [d.month, d]));
    const dataMapB = new Map(plotDataB.map(d => [d.month, d]));

    const monthLabels = [...plotDataA.map(d => d.month).slice(0, 12), "", "Annual"];
    const colorA = '#377eb8', colorB = '#4daf4a';
    
    const x0 = d3.scaleBand().domain(monthLabels).rangeRound([0, width]).paddingInner(0.2);
    const x1 = d3.scaleBand().domain(['A', 'B']).rangeRound([0, x0.bandwidth()]).padding(0.05);
    
    const maxMean = d3.max([d3.max(plotDataA, d => d.mean), d3.max(plotDataB, d => d.mean)]);
    const y = d3.scaleLinear().domain([0, maxMean * 1.2 || 5]).nice().range([height, 0]);

    svg.append("g").attr("class", "grid-line").call(d3.axisLeft(y).tickSize(-width).tickFormat("")).selectAll("line").attr("stroke", "#b0b0b0").attr("stroke-opacity", 0.6).attr("stroke-dasharray", "3,3");
    svg.select(".grid-line .domain").remove();

    const xAxis = svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x0));
    xAxis.selectAll(".tick").filter(d => d === "").remove();
    svg.append("g").call(d3.axisLeft(y));
    svg.append("text").attr("class", "y-axis-label axis-title").attr("transform", "rotate(-90)").attr("y", -margin.left + 20).attr("x", -height / 2).attr("text-anchor", "middle").style('font-family', 'sans-serif').style('font-size', '11px').text("m/s");

    const monthGroup = svg.selectAll(".month-group").data(monthLabels).join("g").attr("class", "month-group").attr("transform", d => `translate(${x0(d)},0)`);

    monthGroup.selectAll("rect.bar-a").data(d => d ? [dataMapA.get(d)] : []).join("rect").attr("class", "bar-a").attr("x", x1('A')).attr("y", d => y(d.mean)).attr("width", x1.bandwidth()).attr("height", d => height - y(d.mean)).attr("fill", colorA).style("transition", "fill 0.3s ease-in-out")
        .on("mouseover", function(event, d) {
            d3.select(this).attr("fill", d3.color(colorA).darker(0.3));
            tooltip.style("opacity", 1).html(`<strong>${legendNameA} - ${d.month}</strong><br>Mean: ${d.mean.toFixed(1)} m/s<br>Max: ${d.max.toFixed(1)} m/s`);
        })
        .on("mousemove", event => tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`))
        .on("mouseout", function() {
            d3.select(this).attr("fill", colorA);
            tooltip.style("opacity", 0);
        });

    monthGroup.selectAll("rect.bar-b").data(d => d ? [dataMapB.get(d)] : []).join("rect").attr("class", "bar-b").attr("x", x1('B')).attr("y", d => y(d.mean)).attr("width", x1.bandwidth()).attr("height", d => height - y(d.mean)).attr("fill", colorB).style("transition", "fill 0.3s ease-in-out")
        .on("mouseover", function(event, d) {
            d3.select(this).attr("fill", d3.color(colorB).darker(0.3));
            tooltip.style("opacity", 1).html(`<strong>${legendNameB} - ${d.month}</strong><br>Mean: ${d.mean.toFixed(1)} m/s<br>Max: ${d.max.toFixed(1)} m/s`);
        })
        .on("mousemove", event => tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`))
        .on("mouseout", function() {
            d3.select(this).attr("fill", colorB);
            tooltip.style("opacity", 0);
        });

    let locationHTML = `<div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; justify-content: center; align-items: center; gap: 1.5rem; width: 100%; height: 100%; font-family: sans-serif; font-size: 0.8rem;">`;
    locationHTML += `<div style="display: flex; align-items: center; gap: 0.5rem;"><div style="width: 14px; height: 14px; background-color: ${colorA}; border: 1px solid #555;"></div><span>${legendNameA}</span></div>`;
    locationHTML += `<div style="display: flex; align-items: center; gap: 0.5rem;"><div style="width: 14px; height: 14px; background-color: ${colorB}; border: 1px solid #555;"></div><span>${legendNameB}</span></div>`;
    locationHTML += `</div>`;
    
    svg.append('foreignObject').attr('x', 0).attr('y', height + 40).attr('width', width).attr('height', 30).html(locationHTML);
}