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
function renderSunPathCompareCharts(epwDataA, epwDataB) {
    const chartRefs = {};
    const contentArea = d3.select("#compare-content-area").html('');
    contentArea.append('div').attr('id', 'compare-sun-path-chart').attr('class', 'chart-container');
    renderSunPathCompareControls('#compare-pane .left-panel', chartRefs);
    renderSunPathComparison('#compare-sun-path-chart', epwDataA, epwDataB, chartRefs);
}

/**
 * Controls for the left panel
 * @param {string} panelSelector
 * @param {object} chartRefs
 */
function renderSunPathCompareControls(panelSelector, chartRefs) {
    const panel = d3.select(panelSelector);

    const sunPathControls = panel.append('div').attr('class', 'chart-controls-group');
    sunPathControls.append('h6').text('Annual Sun Path Options');

    const sunPathSlidersGroup = sunPathControls.append('div').attr('class', 'chart-controls-group');
    sunPathSlidersGroup.append('h6').text('Date & Time Selection').style('font-size', '0.9rem').style('font-weight', '600');
    const sunPathSlidersContainer = sunPathSlidersGroup.append('div').attr('class', 'sliders-container-left-panel');
    sunPathSlidersGroup.append('p')
    .attr('class', 'info-note')
    .html('<strong>Note</strong>: The selected time is applied as the <strong>local time</strong> for each location, not as a simultaneous UTC moment.');
    const sunPathMonthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    const createSunPathSlider = (parent, { label, id, min, max, value, step = 1, onInput }) => {
        const container = parent.append('div').attr('class', 'slider-control-item');
        const header = container.append('div').attr('class', 'slider-header');
        header.append('label').attr('for', id).text(label);
        const valueDisplay = header.append('span').attr('id', `${id}-value`).attr('class', 'slider-value-display');

        const slider = container.append('input')
            .attr('type', 'range').attr('id', id).attr('min', min).attr('max', max).attr('value', value).attr('step', step);

        slider.on('input', function() {
            const currentValue = +d3.select(this).property('value');
            if (id === 'sun-path-month-slider-compare') {
                valueDisplay.text(sunPathMonthNames[currentValue - 1]);
                const year = new Date().getFullYear();
                const daysInMonth = new Date(year, currentValue, 0).getDate();
                const daySlider = d3.select('#sun-path-day-slider-compare');
                daySlider.attr('max', daysInMonth);
                if (+daySlider.property('value') > daysInMonth) {
                    daySlider.property('value', daysInMonth);
                    d3.select('#sun-path-day-slider-compare-value').text(daysInMonth);
                }
            } else {
                 valueDisplay.text(currentValue);
            }
            onInput();
        });
        
        if (id === 'sun-path-month-slider-compare') {
            valueDisplay.text(sunPathMonthNames[value - 1]);
        } else {
            valueDisplay.text(value);
        }
    };
    
    const onSunPathSliderInput = () => {
        if (chartRefs.sunpath && chartRefs.sunpath.updateInteractive) {
            const month = +d3.select('#sun-path-month-slider-compare').property('value');
            const day = +d3.select('#sun-path-day-slider-compare').property('value');
            const hour = +d3.select('#sun-path-hour-slider-compare').property('value');
            chartRefs.sunpath.updateInteractive(month, day, hour);
        }
    };
    
    const year = new Date().getFullYear();
    const initialSunPathMonth = 6;
    const initialSunPathDay = 21;
    const daysInInitialSunPathMonth = new Date(year, initialSunPathMonth, 0).getDate();

    createSunPathSlider(sunPathSlidersContainer, { label: 'Month', id: 'sun-path-month-slider-compare', min: 1, max: 12, value: initialSunPathMonth, onInput: onSunPathSliderInput });
    createSunPathSlider(sunPathSlidersContainer, { label: 'Day', id: 'sun-path-day-slider-compare', min: 1, max: daysInInitialSunPathMonth, value: initialSunPathDay, onInput: onSunPathSliderInput });
    createSunPathSlider(sunPathSlidersContainer, { label: 'Hour', id: 'sun-path-hour-slider-compare', min: 0, max: 23, value: 12, onInput: onSunPathSliderInput });

    const sunPathIrradianceGroup = sunPathControls.append('div').attr('class', 'chart-controls-group');
    sunPathIrradianceGroup.append('h6').text('Irradiance Data Type').style('font-size', '0.9rem').style('font-weight', '600');
    const sunPathIrradianceContainer = sunPathIrradianceGroup.append('div').attr('class', 'controls-list radio-group');

    const sunPathIrradianceTypes = [
        { id: 'dni', label: 'Direct Normal Irradiance (DNI)', checked: true },
        { id: 'ghi', label: 'Global Horizontal Irradiance (GHI)', checked: false },
        { id: 'dhi', label: 'Diffuse Horizontal Irradiance (DHI)', checked: false }
    ];

    sunPathIrradianceTypes.forEach(type => {
        const item = sunPathIrradianceContainer.append('div').attr('class', 'control-item');
        const radioContainer = item.append('div').attr('class', 'form-check');
        
        radioContainer.append('input')
            .attr('class', 'form-check-input')
            .attr('type', 'radio')
            .attr('name', 'sunpath-irradiance-type-compare')
            .attr('id', `radio-sunpath-${type.id}-compare`)
            .attr('value', type.id)
            .property('checked', type.checked)
            .on('change', function() {
                if (chartRefs.sunpath && chartRefs.sunpath.updateIrradianceType) {
                    chartRefs.sunpath.updateIrradianceType(this.value);
                }
            });

        radioContainer.append('label')
            .attr('class', 'form-check-label')
            .attr('for', `radio-sunpath-${type.id}-compare`)
            .text(type.label);
    });

    const sunPathShowHideGroup = sunPathControls.append('div').attr('class', 'chart-controls-group');
    sunPathShowHideGroup.append('h6').text('Show/Hide Items').style('font-size', '0.9rem').style('font-weight', '600');
    const sunPathControlsContainer = sunPathShowHideGroup.append('div').attr('class', 'controls-list');
    
    const staticComponents = [
        { id: 'toggle-direction-labels-compare', key: 'showDirectionLabels', label: 'Direction Labels' },
        { id: 'toggle-angle-labels-compare', key: 'showAzimuthLabels', label: 'Azimuth Angle Labels' },
        { id: 'toggle-altitude-angles-compare', key: 'showAltitudeLabels', label: 'Altitude Angle Labels' },
        { id: 'toggle-altitude-circles-compare', key: 'showAltitudeCircles', label: 'Altitude Circles' },
        { id: 'toggle-azimuth-lines-compare', key: 'showAzimuthLines', label: 'Azimuth Lines' },
        { id: 'toggle-selected-azimuth-compare', key: 'showSelectedAzimuth', label: 'Selected Azimuth Indicator' },
        { id: 'toggle-selected-altitude-compare', key: 'showSelectedAltitude', label: 'Selected Altitude Circle' },
        { id: 'toggle-solstice-lines-compare', key: 'showSolsticePaths', label: 'Solstice & Equinox Paths' },
        { id: 'toggle-analemmas-compare', key: 'showAnalemmas', label: 'Hourly Analemmas' },
        { id: 'toggle-sun-path-legend-compare', key: 'showSunPathLegend', label: 'Sun Path Legend' }
    ];
    
    staticComponents.forEach(comp => {
        const item = sunPathControlsContainer.append('div').attr('class', 'control-item');
        const switchContainer = item.append('div').attr('class', 'form-check form-switch');
        
        switchContainer.append('input')
            .attr('class', 'form-check-input')
            .attr('type', 'checkbox')
            .attr('id', comp.id)
            .property('checked', true)
            .on('change', function() {
                if (chartRefs.sunpath && chartRefs.sunpath.update) {
                    chartRefs.sunpath.update({ [comp.key]: d3.select(this).property('checked') });
                }
            });

        switchContainer.append('label')
            .attr('class', 'form-check-label')
            .attr('for', comp.id)
            .text(comp.label);
    });
    
    const analysisToggleItem = sunPathControlsContainer.append('div').attr('class', 'control-item');
    const analysisSwitchContainer = analysisToggleItem.append('div').attr('class', 'form-check form-switch');
    analysisSwitchContainer.append('input')
        .attr('class', 'form-check-input')
        .attr('type', 'checkbox')
        .attr('id', 'toggle-analysis-details-compare')
        .property('checked', true)
        .on('change', function() {
            const isChecked = d3.select(this).property('checked');
            if (chartRefs.sunpath && chartRefs.sunpath.update) {
                chartRefs.sunpath.update({ 
                    showSunSign: isChecked,
                    showIrradianceLegend: isChecked,
                    showInfoPanel: isChecked 
                });
            }
        });
    analysisSwitchContainer.append('label')
        .attr('class', 'form-check-label')
        .attr('for', 'toggle-analysis-details-compare')
        .text('Analysis Details');
}

/**
 * Sun path diagrams
 * @param {string} selector
 * @param {object} dataA
 * @param {object} dataB
 * @param {object} chartRefs
 */
function renderSunPathComparison(selector, dataA, dataB, chartRefs) {
    function createDateAsUTC(year, month, day, hour, timeZone) {
        return new Date(Date.UTC(year, month - 1, day, hour - timeZone));
    }
    const mainContainer = d3.select(selector).html('');
    const locNameA = formatSimpleLocation(dataA.metadata.location.city, dataA.metadata.location.country, 'primary');
    const locNameB = formatSimpleLocation(dataB.metadata.location.city, dataB.metadata.location.country, 'comparison');
    const legendNameA = formatCityNameOnly(dataA.metadata.location.city, 'primary');
    const legendNameB = formatCityNameOnly(dataB.metadata.location.city, 'comparison');

    addExportButton(selector, `sun-path-${locNameA}-vs-${locNameB}`, `${locNameA} vs. ${locNameB}`);

    mainContainer.append('style').text(`
        .table.info-table td {
            text-align: center;
            vertical-align: middle;
        }
    `);

    const chartTitleElement = mainContainer.append('h5').attr('class', 'chart-title-main');
    const svgWrapper = mainContainer.append('div').attr('id', 'sun-path-svg-wrapper-compare');
    
    const diameter = 380;
    const radius = diameter / 2;
    const margin = { top: 60, right: 20, bottom: 20, left: 20 };
    const gap = 40;
    const baseWidth = (diameter * 2) + gap + margin.left + margin.right;
    
    const timeHeaderHeight = 30;
    const sunPathLegendHeight = 50;
    const irradianceLegendHeight = 70;
    const componentPadding = 15;

    const svg = svgWrapper.append("svg")
        .attr("viewBox", `0 0 ${baseWidth} ${diameter + margin.top + margin.bottom}`)
        .attr("font-family", `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`);

    const defs = svg.append('defs');
    defs.append('style').text(`
        .foreign-html { background-color: transparent; color: #212529; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; }
        .irradiance-legend-container { display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; }
        .right-legend { flex-grow: 0; max-width: 400px; margin: 0 auto; }
        .legend-title { font-size: 12px; font-weight: 600; color: #495057; text-align: center; margin-bottom: 4px; }
        .second-legend-container { display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 0.8rem 1.5rem; padding: 0.5rem; max-width: 650px; margin: 0.5rem auto 0; }
        .second-legend-item { display: flex; align-items: center; gap: 0.5rem; font-size: 9px; }
        .second-legend-item span { white-space: nowrap; }
        .second-legend-item svg { flex-shrink: 0; width: 16px; height: 16px; }
        .info-header-compare { font-size: 14px; font-weight: 500; margin-top: 5px; text-align: center; }
        @keyframes flicker { 0% { opacity: 1; transform: scale(1.1); } 25% { opacity: 0.5; transform: scale(1); } 50% { opacity: 0.8; transform: scale(1.15); } 75% { opacity: 0.4; transform: scale(1.05); } 100% { opacity: 1; transform: scale(1.1); } }
        .flickering-rays .ray { transform-origin: 50px 50px; animation: flicker 2s linear infinite; }
    `);

    const chartGroupA = svg.append("g").attr("transform", `translate(${margin.left + radius}, ${margin.top + radius})`);
    const chartGroupB = svg.append("g").attr("transform", `translate(${margin.left + diameter + gap + radius}, ${margin.top + radius})`);

    chartGroupA.append('text').attr('class', 'location-title').attr('y', -radius - 35).attr('text-anchor', 'middle').style('font-size', '15px').style('font-weight', 'bold').text(legendNameA);
    chartGroupB.append('text').attr('class', 'location-title').attr('y', -radius - 35).attr('text-anchor', 'middle').style('font-size', '15px').style('font-weight', 'bold').text(legendNameB);
    
    let currentIrradianceType = 'dni';
    const irradianceInfo = {
        dni: { key: 'directNormalRadiation', name: 'DNI', fullName: 'Direct Normal Irradiance' },
        ghi: { key: 'globalHorizontalRadiation', name: 'GHI', fullName: 'Global Horizontal Irradiance' },
        dhi: { key: 'diffuseHorizontalRadiation', name: 'DHI', fullName: 'Diffuse Horizontal Irradiance' }
    };
    let irradianceMax = Math.max(d3.max(dataA.data, d => d[irradianceInfo.dni.key]), d3.max(dataB.data, d => d[irradianceInfo.dni.key]));
    let colorScale = d3.scaleSequential(d3.interpolateTurbo).domain([0, irradianceMax]).clamp(true);
    const visibilityState = {
        showDirectionLabels: true, showAzimuthLabels: true, showAltitudeLabels: true,
        showAltitudeCircles: true, showAzimuthLines: true, showSelectedAzimuth: true,
        showSelectedAltitude: true, showSunSign: true, showSolsticePaths: true, 
        showAnalemmas: true, showIrradianceLegend: true, showSunPathLegend: true, showInfoPanel: true
    };
    const getHourAngle = (date, lat, lon) => ((date.getTime() - SunCalc.getTimes(date, lat, lon).solarNoon.getTime()) / 36e5) * 15;

    const drawSingleSunPath = (chartGroup, epwData) => {
        const location = epwData.metadata.location;
        const hourlyData = epwData.data;
        const year = new Date(hourlyData[0].datetime).getFullYear();
        const r = d3.scaleLinear().domain([0, 90]).range([radius, 0]);

        const getSunPositionForPlot = (date) => {
            const pos = SunCalc.getPosition(date, location.latitude, location.longitude);
            const altitudeDeg = pos.altitude * 180 / Math.PI;
            if (altitudeDeg < 0) return null;
            const R = r(altitudeDeg);
            const azimuthFromNorth = (pos.azimuth * 180 / Math.PI) + 180;
            const azimuthRad = azimuthFromNorth * Math.PI / 180;
            return { x: R * Math.sin(azimuthRad), y: -R * Math.cos(azimuthRad), azimuth: azimuthFromNorth, altitude: altitudeDeg };
        };
        
        const grid = chartGroup.append('g').attr('class', 'sun-path-grid');
        grid.append('circle').attr('r', radius).attr('class', 'sun-path-bg').style('fill', '#f8f9fa').style('stroke', '#878787').style('stroke-width', 0.6);
        grid.append('g').attr('class', 'altitude-circles').selectAll('circle').data([10, 20, 30, 40, 50, 60, 70, 80]).join('circle').attr('r', d => r(d)).style('fill', 'none').style('stroke', '#b0b0b0').style('stroke-width', 0.4).style('stroke-dasharray', '3,3');
        grid.append('g').attr('class', 'altitude-labels').selectAll('text').data([10, 20, 30, 40, 50, 60, 70, 80]).join('text').attr('x', 5).attr('y', d => -r(d) + 8).style('font-size', '8px').style('fill', '#6c757d').text(d => d + '°');
        grid.append('g').attr('class', 'azimuth-lines').selectAll('line').data(d3.range(0, 360, 15)).join('line').attr('x1', 0).attr('y1', 0).attr('x2', d => radius * Math.sin(d * Math.PI / 180)).attr('y2', d => -radius * Math.cos(d * Math.PI / 180)).style('stroke', '#d0d0d0').style('stroke-width', d => d % 90 === 0 ? 0.7 : 0.5).style('stroke-dasharray', d => d % 90 === 0 ? 'none' : '2,2');
        const directions = [{ label: 'N', angle: 0 }, { label: 'E', angle: 90 }, { label: 'S', angle: 180 }, { label: 'W', angle: 270 }];
        grid.append('g').attr('class', 'direction-labels').selectAll('text').data(directions).join('text').attr('x', d => (radius + 8) * Math.sin(d.angle * Math.PI / 180)).attr('y', d => -(radius + 15) * Math.cos(d.angle * Math.PI / 180)).attr('text-anchor', 'middle').attr('dominant-baseline', 'middle').style('font-size', '11px').style('font-weight', 'bold').style('fill', '#495057').text(d => d.label);
        grid.append('g').attr('class', 'azimuth-labels').selectAll('text').data(d3.range(0, 360, 30).filter(d => d % 90 !== 0)).join('text').attr('x', d => (radius + 12) * Math.sin(d * Math.PI / 180)).attr('y', d => -(radius + 12) * Math.cos(d * Math.PI / 180)).attr('text-anchor', 'middle').attr('dominant-baseline', 'middle').style('font-size', '9px').style('font-weight', '300').style('fill', '#495057').text(d => d);
        
        const pathGroup = chartGroup.append('g').attr('class', 'day-paths');
        const dayPathLine = d3.line().x(d => d.x).y(d => d.y).curve(d3.curveBasis).defined(d => d !== null);

        const isSouthernHemisphere = location.latitude < 0;
        const summerColor = '#d9534f';
        const winterColor = '#5bc0de';

        const keyDates = [
            {
                date: isSouthernHemisphere ? new Date(year, 11, 21) : new Date(year, 5, 21),
                color: summerColor,
                class: 'summer-solstice'
            },
            {
                date: new Date(year, 2, 20),
                color: '#5cb85c',
                class: 'spring-equinox'
            },
            {
                date: isSouthernHemisphere ? new Date(year, 5, 21) : new Date(year, 11, 21),
                color: winterColor,
                class: 'winter-solstice'
            }
        ];

        keyDates.forEach(dateInfo => { const pathData = d3.range(0, 24, 0.25).map(hour => { const testDate = new Date(dateInfo.date); testDate.setHours(Math.floor(hour), (hour % 1) * 60); return getSunPositionForPlot(testDate); }); if (pathData.filter(d => d).length > 1) { pathGroup.append('path').datum(pathData).attr('d', dayPathLine).style('fill', 'none').style('stroke', dateInfo.color).style('stroke-width', 1.2).attr('class', `sun-path-day-line ${dateInfo.class}`); } });
        
        const analemmaGroup = chartGroup.append('g').attr('class', 'analemmas');
        const hourlyGroups = d3.group(hourlyData, d => d.hour);
        const analemmaLine = d3.line().x(d => d.pos.x).y(d => d.pos.y).curve(d3.curveBasis).defined(d => d.pos !== null);
        
        hourlyGroups.forEach(hourData => {
            const analemmaData = hourData.map(d => {
                const dt = d.datetime;
                const correctDate = createDateAsUTC(dt.getFullYear(), dt.getMonth() + 1, dt.getDate(), dt.getHours(), location.timeZone);
                return { ...d, pos: getSunPositionForPlot(correctDate) };
            }).filter(d => d.pos);

            if (analemmaData.length > 1) {
                analemmaGroup.append('path')
                    .datum(analemmaData)
                    .attr('d', analemmaLine)
                    .style('fill', 'none').style('stroke', '#999').style('stroke-width', '0.7px');
            }
        });
        
        const interactiveGroup = chartGroup.append('g').attr('class', 'interactive-elements');
        const altitudeCircle = interactiveGroup.append('circle').attr('class', 'altitude-circle').style('fill', 'none').style('stroke', '#d9534f').style('stroke-width', 1).style('stroke-dasharray', '4,4');
        const azimuthIndicator = interactiveGroup.append('circle').attr('class', 'azimuth-indicator').attr('r', 4).style('fill', '#d9534f').style('stroke', 'white').style('stroke-width', 0.8);
        
        const sunIconGroup = interactiveGroup.append('g').attr('class', 'current-sun-icon');
        sunIconGroup.append('circle').attr('cx', 50).attr('cy', 50).attr('r', 25).style('fill', 'none');
        sunIconGroup.style('display', 'none');
        const rayGroup = sunIconGroup.append('g').attr('class', 'flickering-rays');
        const raysData = [{ x1: 50, y1: 24, x2: 50, y2: 9 }, { x1: 50, y1: 76, x2: 50, y2: 91 }, { x1: 24, y1: 50, x2: 9, y2: 50 }, { x1: 76, y1: 50, x2: 91, y2: 50 }, { x1: 32.3, y1: 32.3, x2: 18.2, y2: 18.2 }, { x1: 67.7, y1: 67.7, x2: 81.8, y2: 81.8 }, { x1: 32.3, y1: 67.7, x2: 18.2, y2: 81.8 }, { x1: 67.7, y1: 32.3, x2: 81.8, y2: 18.2 }];
        rayGroup.selectAll('line.ray').data(raysData).join('line').attr('class', 'ray').style('stroke-width', 3).attr('x1', d => d.x1).attr('y1', d => d.y1).attr('x2', d => d.x2).attr('y2', d => d.y2);

        return { getSunPositionForPlot, r, interactiveGroup, sunIconGroup, azimuthIndicator, altitudeCircle };
    };

    const chartA = drawSingleSunPath(chartGroupA, dataA);
    const chartB = drawSingleSunPath(chartGroupB, dataB);

    const timeHeaderFO = svg.append('foreignObject')
        .attr('class', 'time-header-fo')
        .attr('x', 0)
        .attr('width', baseWidth)
        .attr('height', timeHeaderHeight);
    const timeHeaderContainer = timeHeaderFO.append('xhtml:div').attr('class', 'foreign-html');
    const timeHeader = timeHeaderContainer.append('h6').attr('class', 'info-header-compare');
    timeHeader.append('strong').text('Selected Time: ');
    timeHeader.append('span').attr('id', 'info-date-heading-compare');
    
    const irradianceLegendFO = svg.append('foreignObject').attr('class', 'irradiance-legend-container-fo').attr('x', 0).attr('width', baseWidth).attr('height', irradianceLegendHeight);
    const legendContainer = irradianceLegendFO.append('xhtml:div').attr('class', 'foreign-html irradiance-legend-container');
    const rightLegend = legendContainer.append('div').attr('class', 'right-legend');
    const legendTitle = rightLegend.append('div').attr('class', 'legend-title');
    const legendSvg = rightLegend.append('svg').attr('width', '100%').attr('height', 45);
    const legendGradient = legendSvg.append("defs").append("linearGradient").attr("id", "sun-path-irradiance-gradient-horizontal-compare").attr("x1", "0%").attr("x2", "100%");
    legendSvg.append("rect").attr("x", "5%").attr("y", 5).attr("width", "90%").attr("height", 15).style("fill", "url(#sun-path-irradiance-gradient-horizontal-compare)");
    
    const drawIrradianceAxis = () => {
        legendGradient.selectAll("stop").data(d3.range(0, 1.01, 0.1)).join("stop").attr("offset", d => `${d*100}%`).attr("stop-color", t => colorScale.interpolator()(t));
        const svgWidth = rightLegend.node() ? rightLegend.node().getBoundingClientRect().width : baseWidth * 0.9;
        if (svgWidth === 0) return;
        legendSvg.select(".irradiance-axis-ticks").remove();
        const axisScale = d3.scaleLinear().domain([0, irradianceMax]).range([svgWidth * 0.05, svgWidth * 0.95]);
        const generatedTicks = axisScale.ticks(5);
        const finalTicks = [...new Set([...generatedTicks.filter(t => t < irradianceMax * 0.9), irradianceMax])].sort(d3.ascending);
        const legendTicks = legendSvg.append('g').attr('class', 'irradiance-axis-ticks').attr('transform', 'translate(0, 24)');
        legendTicks.selectAll('text').data(finalTicks).join('text').attr('x', d => axisScale(d)).attr('y', 9).attr('text-anchor', 'middle').style('font-size', '10px').style('fill', '#333').text(d => d3.format('.0f')(d));
    };
    
    const sunPathLegendFO = svg.append('foreignObject').attr('class', 'second-legend-container-fo').attr('x', 0).attr('width', baseWidth).attr('height', sunPathLegendHeight);
    const sunPathLegendContainer = sunPathLegendFO.append('xhtml:div').attr('class', 'foreign-html second-legend-container');
    const sunPathLegendData = [
        { key: 'showSolsticePaths', icon: '<svg viewBox="0 0 25 15"><line x1="0" y1="7.5" x2="25" y2="7.5" stroke="#d9534f" stroke-width="2"></line></svg>', text: 'Summer Solstice' },
        { key: 'showSolsticePaths', icon: '<svg viewBox="0 0 25 15"><line x1="0" y1="7.5" x2="25" y2="7.5" stroke="#5cb85c" stroke-width="2"></line></svg>', text: 'Equinoxes' },
        { key: 'showSolsticePaths', icon: '<svg viewBox="0 0 25 15"><line x1="0" y1="7.5" x2="25" y2="7.5" stroke="#5bc0de" stroke-width="2"></line></svg>', text: 'Winter Solstice' },
        { key: 'showAnalemmas', icon: '<svg viewBox="0 0 25 15"><path d="M2,7.5 Q12.5,0 23,7.5" stroke="#999" stroke-width="1.2" fill="none"></path></svg>', text: 'Hourly Analemmas' },
        { key: 'showSelectedAzimuth', icon: '<svg viewBox="0 0 14 14"><circle cx="7" cy="7" r="3" fill="#d9534f" stroke="white" stroke-width="0.5"></circle></svg>', text: 'Azimuth' },
        { key: 'showSelectedAltitude', icon: '<svg viewBox="0 0 14 14"><circle cx="7" cy="7" r="5" stroke="#d9534f" stroke-width="1.5" stroke-dasharray="2,2" fill="none"></circle></svg>', text: 'Altitude' }
    ];
    sunPathLegendData.forEach(itemData => {
        const item = sunPathLegendContainer.append('div').attr('class', `second-legend-item legend-item-${itemData.key}`);
        item.html(itemData.icon); item.append('span').text(itemData.text);
    });

    const infoPanelDiv = mainContainer.append('div').attr('class', 'info-panel-container mt-3');
    const infoTableContainer = infoPanelDiv.append('div').attr('class', 'table-responsive');
    const infoTable = infoTableContainer.append('table').attr('class', 'table table-bordered table-sm mt-2 info-table');
    infoPanelDiv.append('p')
    .attr('class', 'info-note text-center small mt-2')
    .html('<strong>Note</strong>: Solar radiation values (DNI, DHI, GHI) represent the total energy (Wh/m²) accumulated during the one-hour period preceding the indicated time.');

    const tableHeader = infoTable.append('thead').append('tr');
    tableHeader.append('th').text('Parameter');
    tableHeader.append('th').text(legendNameA);
    tableHeader.append('th').text(legendNameB);

    const tableBody = infoTable.append('tbody');
    const rowsData = [
        { label: 'Time Zone', id: 'time-zone' }, { label: 'Latitude', id: 'latitude' },
        { label: 'Longitude', id: 'longitude' }, { label: 'Sunrise', id: 'sunrise' },
        { label: 'Sunset', id: 'sunset' }, { label: 'Altitude', id: 'altitude' },
        { label: 'Azimuth', id: 'azimuth' }, { label: 'Hour Angle', id: 'hour-angle' },
        { label: 'DNI (Wh/m²)', id: 'dni' }, { label: 'DHI (Wh/m²)', id: 'dhi' },
        { label: 'GHI (Wh/m²)', id: 'ghi' }
    ];
    
    rowsData.forEach(rowData => {
        const row = tableBody.append('tr');
        row.append('th').attr('scope', 'row').text(rowData.label);
        row.append('td').attr('id', `info-${rowData.id}-a`);
        row.append('td').attr('id', `info-${rowData.id}-b`);
    });

    const updateInteractiveElements = (month, day, hour) => {
        const year = new Date().getFullYear();
        d3.select('#info-date-heading-compare').text(d3.timeFormat('%B %d, %H:%M')(new Date(year, month - 1, day, hour)));

        const updateLocation = (epwData, chart, suffix) => {
            const location = epwData.metadata.location;
            const selectedDate = createDateAsUTC(year, month, day, hour, location.timeZone);
            const sunPos = chart.getSunPositionForPlot(selectedDate);
            const epwHourData = epwData.data.find(h => 
                (h.datetime.getMonth() + 1) === month && 
                h.datetime.getDate() === day && 
                h.datetime.getHours() === hour
            );
            
            if (sunPos) {
                const irradianceValue = epwHourData ? epwHourData[irradianceInfo[currentIrradianceType].key] : 0;
                const sunColor = colorScale(irradianceValue);
                chart.sunIconGroup.attr('transform', `translate(${sunPos.x}, ${sunPos.y}) scale(0.25) translate(-50, -50)`);
                chart.sunIconGroup.select('circle').style('fill', sunColor);
                chart.sunIconGroup.selectAll('line').style('stroke', sunColor);
                const azimuthRad = sunPos.azimuth * Math.PI / 180;
                chart.azimuthIndicator.attr('cx', radius * Math.sin(azimuthRad)).attr('cy', -radius * Math.cos(azimuthRad));
                chart.altitudeCircle.attr('r', chart.r(sunPos.altitude));
            }
            chart.azimuthIndicator.style('display', sunPos && visibilityState.showSelectedAzimuth ? 'block' : 'none');
            chart.altitudeCircle.style('display', sunPos && visibilityState.showSelectedAltitude ? 'block' : 'none');
            chart.sunIconGroup.style('display', sunPos && visibilityState.showSunSign ? 'block' : 'none');
            
            const dayTimes = SunCalc.getTimes(selectedDate, location.latitude, location.longitude);
            d3.select(`#info-time-zone-${suffix}`).text(`GMT${location.timeZone >= 0 ? '+' : ''}${location.timeZone}`);
            d3.select(`#info-latitude-${suffix}`).text(`${location.latitude.toFixed(2)}°`);
            d3.select(`#info-longitude-${suffix}`).text(`${location.longitude.toFixed(2)}°`);
            const tzOffsetMilliseconds = location.timeZone * 3600 * 1000;

            const sunriseInLST = new Date(dayTimes.sunrise.getTime() + tzOffsetMilliseconds);
            const sunsetInLST = new Date(dayTimes.sunset.getTime() + tzOffsetMilliseconds);

            d3.select(`#info-sunrise-${suffix}`).text(d3.utcFormat('%H:%M')(sunriseInLST));
            d3.select(`#info-sunset-${suffix}`).text(d3.utcFormat('%H:%M')(sunsetInLST));
            if (sunPos) {
                d3.select(`#info-azimuth-${suffix}`).text(`${sunPos.azimuth.toFixed(1)}°`);
                d3.select(`#info-altitude-${suffix}`).text(`${sunPos.altitude.toFixed(1)}°`);
                d3.select(`#info-hour-angle-${suffix}`).text(`${getHourAngle(selectedDate, location.latitude, location.longitude).toFixed(1)}°`);
                d3.select(`#info-dni-${suffix}`).text(epwHourData ? `${epwHourData.directNormalRadiation}` : 'N/A');
                d3.select(`#info-dhi-${suffix}`).text(epwHourData ? `${epwHourData.diffuseHorizontalRadiation}` : 'N/A');
                d3.select(`#info-ghi-${suffix}`).text(epwHourData ? `${epwHourData.globalHorizontalRadiation}` : 'N/A');
            } else {
                [`#info-azimuth-${suffix}`, `#info-altitude-${suffix}`, `#info-hour-angle-${suffix}`, `#info-dni-${suffix}`, `#info-dhi-${suffix}`, `#info-ghi-${suffix}`].forEach(id => d3.select(id).text('Below Horizon'));
            }
        };
        updateLocation(dataA, chartA, 'a');
        updateLocation(dataB, chartB, 'b');
    };

    const updateStaticTextAndScale = () => {
        const info = irradianceInfo[currentIrradianceType];
        chartTitleElement.text(`Annual Sun Path Comparison with ${info.fullName} Intensity`);
        legendTitle.text(`${info.name} (Wh/m²)`);
        irradianceMax = Math.max(d3.max(dataA.data, d => d[info.key]), d3.max(dataB.data, d => d[info.key]));
        colorScale.domain([0, irradianceMax]);
        drawIrradianceAxis();
    };

    chartRefs.sunpath = {
        update: (options = {}) => {
            Object.assign(visibilityState, options);
            let newTotalHeight = diameter + margin.top + margin.bottom;

            if (visibilityState.showInfoPanel) { 
                newTotalHeight += componentPadding + timeHeaderHeight;
            }
            if (visibilityState.showIrradianceLegend) { 
                newTotalHeight += componentPadding + irradianceLegendHeight; 
            }
            if (visibilityState.showSunPathLegend) { 
                newTotalHeight += componentPadding + sunPathLegendHeight; 
            }
            
            svg.attr("viewBox", `0 0 ${baseWidth} ${newTotalHeight}`);
            
            let currentYUpdate = diameter + margin.top + margin.bottom;
            const repositionElement = (selector, isVisible, elementHeight) => {
                const fo = svg.select(selector);
                if (isVisible) {
                    fo.style('display', 'block');
                    currentYUpdate += componentPadding;
                    fo.attr('y', currentYUpdate);
                    currentYUpdate += elementHeight;
                } else { fo.style('display', 'none'); }
            };

            repositionElement('.time-header-fo', visibilityState.showInfoPanel, timeHeaderHeight);
            repositionElement('.irradiance-legend-container-fo', visibilityState.showIrradianceLegend, irradianceLegendHeight);
            repositionElement('.second-legend-container-fo', visibilityState.showSunPathLegend, sunPathLegendHeight);
            
            infoPanelDiv.style('display', visibilityState.showInfoPanel ? 'block' : 'none');
            
            [chartGroupA, chartGroupB].forEach(chartGroup => {
                const setVisible = (selector, isVisible) => chartGroup.select(selector).style('display', isVisible ? 'block' : 'none');
                setVisible('.direction-labels', visibilityState.showDirectionLabels);
                setVisible('.azimuth-labels', visibilityState.showAzimuthLabels);
                setVisible('.altitude-labels', visibilityState.showAltitudeLabels);
                setVisible('.altitude-circles', visibilityState.showAltitudeCircles);
                setVisible('.azimuth-lines', visibilityState.showAzimuthLines);
                setVisible('.day-paths', visibilityState.showSolsticePaths);
                setVisible('.analemmas', visibilityState.showAnalemmas);
            });
            
            const setLegendItemVisible = (key, isVisible) => sunPathLegendContainer.selectAll(`.legend-item-${key}`).style('display', isVisible ? 'flex' : 'none');
            setLegendItemVisible('showSolsticePaths', visibilityState.showSolsticePaths);
            setLegendItemVisible('showAnalemmas', visibilityState.showAnalemmas);
            setLegendItemVisible('showSelectedAzimuth', visibilityState.showSelectedAzimuth);
            setLegendItemVisible('showSelectedAltitude', visibilityState.showSelectedAltitude);
            
            if (visibilityState.showIrradianceLegend) setTimeout(drawIrradianceAxis, 0);
            const month = +d3.select('#sun-path-month-slider-compare').property('value');
            const day = +d3.select('#sun-path-day-slider-compare').property('value');
            const hour = +d3.select('#sun-path-hour-slider-compare').property('value');
            updateInteractiveElements(month, day, hour);
        },
        updateInteractive: (month, day, hour) => {
            updateInteractiveElements(month, day, hour);
        },
        updateIrradianceType: (newType) => {
            currentIrradianceType = newType;
            updateStaticTextAndScale();
            const month = +d3.select('#sun-path-month-slider-compare').property('value');
            const day = +d3.select('#sun-path-day-slider-compare').property('value');
            const hour = +d3.select('#sun-path-hour-slider-compare').property('value');
            updateInteractiveElements(month, day, hour);
        }
    };

    updateStaticTextAndScale();
    setTimeout(() => {
        if (chartRefs.sunpath && chartRefs.sunpath.update) {
            chartRefs.sunpath.update();
        }
        if (d3.select('#sun-path-month-slider-compare').node()) {
            const month = +d3.select('#sun-path-month-slider-compare').property('value');
            const day = +d3.select('#sun-path-day-slider-compare').property('value');
            const hour = +d3.select('#sun-path-hour-slider-compare').property('value');
            if (chartRefs.sunpath && chartRefs.sunpath.updateInteractive) {
                 chartRefs.sunpath.updateInteractive(month, day, hour);
            }
        }
    }, 100);
}