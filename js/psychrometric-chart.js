/*
 * EPW Insights
 * Author: Ehsan Rostami (https://github.com/ehsan-rostami)
 * Copyright (c) 2025 Ehsan Rostami
 * Released under the MIT License.
*/

function renderPsychrometricChart(epwData) {
    const chartRefs = { psychro: {} };
    const chartContainerSelector = '#psychrometric-chart';
    renderPsychroControls('.tab-pane.active .left-panel', chartRefs, epwData);
    renderPsychroChart(chartContainerSelector, epwData, chartRefs);
}

function renderPsychroControls(panelSelector, chartRefs, epwData) {
    const panel = d3.select(panelSelector).html('');
    const visualControls = panel.append('div').attr('class', 'chart-controls-group');
    visualControls.append('h6').text('Visualization');
    const vizSwitches = [
        { id: 'heatmap-toggle', label: 'Show Data Heatmap', checked: true },
        { id: 'points-toggle', label: 'Show Data Points', checked: false },
        { id: 'indicator-toggle', label: 'Show Position Indicator', checked: true }
    ];
    vizSwitches.forEach(s => {
         const item = visualControls.append('div').attr('class', 'control-item');
         item.append('div').attr('class', 'form-check form-switch')
            .html(`<input class="form-check-input" type="checkbox" id="psychro-${s.id}" ${s.checked ? 'checked' : ''}><label class="form-check-label" for="psychro-${s.id}">${s.label}</label>`);
    });

    const chartMetrics = panel.append('div').attr('class', 'chart-controls-group');
    chartMetrics.append('h6').text('Chart Metrics');
    const metrics = [
        { id: 'dbt', label: 'Dry Bulb Temperature', checked: true },
        { id: 'hr', label: 'Humidity Ratio', checked: true },
        { id: 'rh', label: 'Relative Humidity', checked: true },
        { id: 'wb', label: 'Wet Bulb Temperature', checked: false },
        { id: 'enthalpy', label: 'Enthalpy', checked: false },
        { id: 'vp', label: 'Vapor Pressure', checked: false }
    ];
    
    metrics.forEach(m => {
        const item = chartMetrics.append('div').attr('class', 'control-item');
        item.append('div').attr('class', 'form-check form-switch')
            .html(`<input class="form-check-input" type="checkbox" id="psychro-${m.id}-toggle" ${m.checked ? 'checked' : ''}><label class="form-check-label" for="psychro-${m.id}-toggle">${m.label}</label>`);
    });

    const comfortOverlay = panel.append('div').attr('class', 'chart-controls-group');
    comfortOverlay.append('h6').text('Comfort Analysis');

    const comfortModels = [
        { id: 'none', label: 'None', checked: true },
        { id: 'ashrae', label: 'ASHRAE 55 Comfort Zone', checked: false },
        { id: 'iso', label: 'ISO 7730 PMV Map', checked: false }
    ];
    
    const modelSelector = comfortOverlay.append('div').attr('class', 'comfort-model-selector');
    modelSelector.selectAll('.control-item').data(comfortModels).join('div').attr('class', 'control-item')
        .append('div').attr('class', 'form-check')
        .html(m => `<input class="form-check-input" type="radio" name="comfortModel" id="comfort-model-${m.id}" value="${m.id}" ${m.checked ? 'checked' : ''}>
                    <label class="form-check-label" for="comfort-model-${m.id}">${m.label}</label>`);

    const comfortOptionsContainer = comfortOverlay.append('div').attr('id', 'comfort-options-container');
    const slidersContainer = comfortOptionsContainer.append('div').attr('class', 'sliders-container-left-panel');
    
    const comfortParams = [
        { id: 'mrt', label: 'Mean Radiant Temp (°C)', value: 24, min: 0, max: 50, step: 0.5 },
        { id: 'wind-speed', label: 'Wind Speed (m/s)', value: 0.1, min: 0, max: 2, step: 0.1 },
        { id: 'met-rate', label: 'Metabolic Rate (met)', value: 1.0, min: 0.7, max: 4, step: 0.1 },
        { id: 'clo-level', label: 'Clothing Level (clo)', value: 1.0, min: 0, max: 2, step: 0.1 }
    ];

    const modelDefaults = {
        ashrae: { mrt: 24.0, 'wind-speed': 0.1, 'met-rate': 1.0, 'clo-level': 1.0 },
        iso:    { mrt: 20.0, 'wind-speed': 0.2, 'met-rate': 1.0, 'clo-level': 1.0 }
    };

    comfortParams.forEach(p => {
        const item = slidersContainer.append('div').attr('class', 'slider-control-item');
        const header = item.append('div').attr('class', 'slider-header');
        header.append('label').attr('for', `psychro-${p.id}`).text(p.label);
        header.append('span').attr('id', `psychro-${p.id}-value`).attr('class', 'slider-value-display').text(p.value.toFixed(1));
        
        item.append('input').attr('type', 'range').attr('class', 'form-range')
            .attr('id', `psychro-${p.id}`).attr('min', p.min).attr('max', p.max).attr('step', p.step).attr('value', p.value);
    });

    const ackGroup = panel.append('div').attr('class', 'chart-controls-group');
    ackGroup.append('h6').text('Acknowledgements');
    const infoNote = ackGroup.append('p').attr('class', 'info-note');

    infoNote.html('This interactive chart was inspired by several well-regarded tools in building science: <a href="https://www.ladybug.tools/" target="_blank"><strong>Ladybug Tools</strong></a>, <a href="https://drajmarsh.bitbucket.io/psychro-chart2d.html" target="_blank"><strong>Dr. Andrew Marsh\'s Psychrometric Chart</strong></a>, and the <a href="https://www.sbse.org/resources/climate-consultant" target="_blank"><strong>UCLA Climate Consultant</strong></a>.');

    const updateChart = () => {
        if (chartRefs.psychro && chartRefs.psychro.update) {
            let comfortModel = d3.select('input[name="comfortModel"]:checked').property('value');
            let params = {
                mrt: +d3.select('#psychro-mrt').property('value'),
                windSpeed: +d3.select('#psychro-wind-speed').property('value'),
                metRate: +d3.select('#psychro-met-rate').property('value'),
                cloLevel: +d3.select('#psychro-clo-level').property('value'),
                pmvLimit: 0.5
            };
            
            chartRefs.psychro.update({
                showDBT: d3.select('#psychro-dbt-toggle').property('checked'),
                showHR: d3.select('#psychro-hr-toggle').property('checked'),
                showRH: d3.select('#psychro-rh-toggle').property('checked'),
                showWB: d3.select('#psychro-wb-toggle').property('checked'),
                showEnthalpy: d3.select('#psychro-enthalpy-toggle').property('checked'),
                showVP: d3.select('#psychro-vp-toggle').property('checked'),
                showHeatmap: d3.select('#psychro-heatmap-toggle').property('checked'),
                showPoints: d3.select('#psychro-points-toggle').property('checked'),
                comfortModel: comfortModel,
                comfortParams: params,
            });
        }
    };

    const updateDependentControls = () => {
        const selectedModel = d3.select('input[name="comfortModel"]:checked').property('value');
        const isModelActive = selectedModel !== 'none';
        
        comfortOptionsContainer.style('opacity', isModelActive ? 1 : 0.5);
        slidersContainer.selectAll('input').property('disabled', !isModelActive);

        if (isModelActive && modelDefaults[selectedModel]) {
            const defaults = modelDefaults[selectedModel];
            comfortParams.forEach(p => {
                d3.select(`#psychro-${p.id}`).property('value', defaults[p.id]);
                d3.select(`#psychro-${p.id}-value`).text(defaults[p.id].toFixed(1));
            });
        }
    };

    panel.selectAll('input').on('input', function() {
        if (this.name === 'comfortModel') {
            updateDependentControls();
        }
        
        comfortParams.forEach(p => {
             d3.select(`#psychro-${p.id}-value`).text((+d3.select(`#psychro-${p.id}`).property('value')).toFixed(1));
        });
        updateChart();
    });

    updateDependentControls();
}


const PsychroLib = (() => {
    const P_atm = 101325;

    const getSatVaporPressure = (T) => {
        const T_k = T + 273.15;
        if (T < 0) {
            const C1 = -5.6745359e3, C2 = 6.3925247, C3 = -9.677843e-3, C4 = 6.2215701e-7, C5 = 2.0747825e-9, C6 = -9.484024e-13, C7 = 4.1635019;
            return Math.exp(C1/T_k + C2 + T_k*(C3 + T_k*(C4 + T_k*C5)) + C7*Math.log(T_k));
        } else {
            const C1 = -5.8002206e3, C2 = 1.3914993, C3 = -4.8640239e-2, C4 = 4.1764768e-5, C5 = -1.4452093e-8, C6 = 6.5459673;
            return Math.exp(C1/T_k + C2 + T_k*(C3 + T_k*(C4 + T_k*C5)) + C6*Math.log(T_k));
        }
    };

    const getVaporPressureFromW = (W) => (W * P_atm) / (0.621945 + W);
    const getHumidityRatio = (T_db, RH_percent) => {
        const P_w = getSatVaporPressure(T_db) * (RH_percent / 100);
        return 0.621945 * (P_w / (P_atm - P_w));
    };
    const getRelHumidity = (T_db, W) => {
        const P_w = getVaporPressureFromW(W);
        const P_ws = getSatVaporPressure(T_db);
        return Math.min(100.0, (P_w / P_ws) * 100);
    };
    const getDewPoint = (W) => {
        const pw = getVaporPressureFromW(W);
        if (pw < 611.2) return NaN;
        const alpha = Math.log(pw / 611.2);
        return (243.5 * alpha) / (17.67 - alpha);
    };
    const getEnthalpy = (T_db, W) => (1.006 * T_db) + (W * (2501 + 1.86 * T_db));
    const getTdbFromEnthalpyAndW = (h, W) => (h - 2501 * W) / (1.006 + 1.86 * W);
    
    const getWetBulb = (T_db, W) => {
        const targetEnthalpy = getEnthalpy(T_db, W);
        let low = -50, high = T_db;
        for (let i = 0; i < 30; i++) {
            let mid = (low + high) / 2;
            let w_sat_mid = getHumidityRatio(mid, 100);
            let h_sat_mid = getEnthalpy(mid, w_sat_mid);
            if (h_sat_mid < targetEnthalpy) low = mid;
            else high = mid;
        }
        return high;
    };

    const getPMV = (ta, tr, vel, rh, met, clo, wme = 0) => {
        const pa = getSatVaporPressure(ta) * rh / 100;
        const icl = 0.155 * clo;
        const m = met * 58.15;
        const w = wme * 58.15;
        const mw = m - w;
        let fcl = icl < 0.078 ? 1.0 + 1.29 * icl : 1.05 + 0.645 * icl;
        const hcf = 12.1 * Math.sqrt(vel);
        const taa = ta + 273.15;
        const tra = tr + 273.15;
        
        let tcl = ta;
        for (let i = 0; i < 15; i++) {
            const hc = Math.max(hcf, 2.38 * Math.pow(Math.abs(tcl - ta), 0.25));
            const tcla_iter = tcl + 273.15;
            const tcl_new = 35.7 - 0.028 * mw - icl * (
                3.96e-8 * fcl * (Math.pow(tcla_iter, 4) - Math.pow(tra, 4)) +
                fcl * hc * (tcl - ta)
            );
            if (Math.abs(tcl_new - tcl) < 0.01) {
                tcl = tcl_new;
                break;
            }
            tcl = (tcl + tcl_new) / 2;
        }

        const tcla = tcl + 273.15;
        const L = 0.303 * Math.exp(-0.036 * m) + 0.028;
        const C = fcl * Math.max(hcf, 2.38*Math.pow(Math.abs(tcl - ta), 0.25)) * (tcl - ta);
        const R = 3.96 * fcl * (Math.pow(tcla/100, 4) - Math.pow(tra/100, 4));
        const Edif = 3.05e-3 * (5733 - 6.99 * mw - pa);
        const Eres = 1.7e-5 * m * (5867 - pa);
        const Cres = 0.0014 * m * (34 - ta);
        const Esw = mw > 58.15 ? 0.42 * (mw - 58.15) : 0;
        
        return L * (mw - Edif - Esw - Eres - Cres - R - C);
    };

    return { getSatVaporPressure, getVaporPressureFromW, getHumidityRatio, getRelHumidity, getDewPoint, getEnthalpy, getWetBulb, getTdbFromEnthalpyAndW, getPMV };
})();

const ComfortLib = (() => {
    const getComfortTemperatures = (tr, vel, rh, met, clo, pmvLimit, wme = 0) => {
        let lowerT = NaN, upperT = NaN;
        const pmvLimitAbs = Math.abs(pmvLimit);
        let low = -50, high = 50;
        for(let i=0; i<30; i++) {
            let mid = (low + high) / 2;
            if (mid === low || mid === high) break;
            let pmv = PsychroLib.getPMV(mid, tr, vel, rh, met, clo, wme);
            if (isNaN(pmv) || pmv < -pmvLimitAbs) low = mid;
            else high = mid;
        }
        lowerT = high;
        low = -50; high = 50;
        for(let i=0; i<30; i++) {
            let mid = (low + high) / 2;
            if (mid === low || mid === high) break;
            let pmv = PsychroLib.getPMV(mid, tr, vel, rh, met, clo, wme);
            if (isNaN(pmv) || pmv > pmvLimitAbs) high = mid;
            else low = mid;
        }
        upperT = low;
        if (lowerT >= upperT || isNaN(lowerT) || isNaN(upperT)) return null;
        return { lower: lowerT, upper: upperT };
    };

    const getComfortPolygon = (params) => {
        const rhPoints = [1, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
        const upperCurve = [];
        const lowerCurve = [];
        rhPoints.forEach(rh => {
            const temps = getComfortTemperatures(params.mrt, params.windSpeed, rh, params.metRate, params.cloLevel, params.pmvLimit);
            if (temps) {
                const w_low = PsychroLib.getHumidityRatio(temps.lower, rh);
                const w_high = PsychroLib.getHumidityRatio(temps.upper, rh);
                upperCurve.push({ t: temps.upper, w: w_high });
                lowerCurve.unshift({ t: temps.lower, w: w_low });
            }
        });
        if (upperCurve.length < 2 || lowerCurve.length < 2) return [];
        return upperCurve.concat(lowerCurve);
    };

    return { getComfortPolygon };
})();

function createDataHeatmap(data, xDomain, yDomain, xBins, yBins) {
    const xBinWidth = (xDomain[1] - xDomain[0]) / xBins;
    const yBinWidth = (yDomain[1] - yDomain[0]) / yBins;
    const bins = new Map();
    data.forEach(d => {
        const xBinIndex = Math.floor((d.t - xDomain[0]) / xBinWidth);
        const yBinIndex = Math.floor((d.w - yDomain[0]) / yBinWidth);
        if (xBinIndex >= 0 && xBinIndex < xBins && yBinIndex >= 0 && yBinIndex < yBins) {
            const key = `${xBinIndex},${yBinIndex}`;
            if (!bins.has(key)) {
                bins.set(key, { x0: xDomain[0] + xBinIndex * xBinWidth, x1: xDomain[0] + (xBinIndex + 1) * xBinWidth, y0: yDomain[0] + yBinIndex * yBinWidth, y1: yDomain[0] + (yBinIndex + 1) * yBinWidth, count: 0, });
            }
            bins.get(key).count++;
        }
    });
    return Array.from(bins.values());
}

function renderPsychroChart(selector, epwData, chartRefs) {
    const container = d3.select(selector).html('');

    const hourlyData = epwData.data;
    const location = epwData.metadata.location;
    const formattedLocationSimple = formatSimpleLocation(location.city, location.country, 'primary');

    addExportButton(selector, 'psychrometric-chart', formattedLocationSimple);
    container.append('h5').text('Psychrometric Chart').attr('class', 'chart-title-main');
    const chartArea = container.append('div').attr('class', 'chart-area-wrapper').style('position', 'relative');
    
    const margin = { top: 20, right: 90, bottom: 170, left: 80 };
    const width = Math.max(600, chartArea.node().getBoundingClientRect().width - margin.left - margin.right);
    const height = Math.max(400, width * 0.7) - margin.top - margin.bottom;
    
    const svg = chartArea.append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);
      
    const t_min = -10, t_max = 50, w_min = 0, w_max = 0.030;
    const x = d3.scaleLinear().domain([t_min, t_max]).range([0, width]);
    const y = d3.scaleLinear().domain([w_min, w_max]).range([height, 0]);
    const y_vp = d3.scaleLinear().domain([
        PsychroLib.getVaporPressureFromW(w_min),
        PsychroLib.getVaporPressureFromW(w_max)
    ]).range([height, 0]);

    svg.append("rect").attr("width", width).attr("height", height).attr("fill", "white").attr("stroke", "#dee2e6");

    svg.append("g").attr("class", "grid x-grid").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(x).tickSize(-height).tickFormat('').ticks(12));
    svg.append("g").attr("class", "grid y-grid").attr("transform", `translate(${width}, 0)`).call(d3.axisRight(y).tickSize(-width).tickFormat('').ticks(15));
    svg.append("g").attr("class", "grid y-grid-vp").call(d3.axisLeft(y_vp).tickSize(-width).tickFormat('').ticks(10));
    svg.selectAll(".grid.x-grid .tick line, .grid.y-grid .tick line").attr("stroke", "#e9ecef");
    svg.selectAll(".grid.y-grid-vp .tick line").attr("stroke", "#6c757d").style("stroke-dasharray", "3,3");

    const xAxis = svg.append("g").attr('class', 'axis x-axis').attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(x).ticks(60).tickSize(5).tickSizeOuter(0).tickPadding(8).tickFormat((d) => d % 5 === 0 ? d : ''));
    xAxis.selectAll('.tick line').attr('stroke-width', (d) => d % 5 === 0 ? 1 : 0.5);
    xAxis.selectAll('text')
        .style('font-family', 'sans-serif')
        .style('font-size', '11px')
        .style('fill', '#212529');

    const yAxis = svg.append("g").attr('class', 'axis y-axis').attr("transform", `translate(${width}, 0)`)
        .call(d3.axisRight(y).ticks(30).tickSize(5).tickSizeOuter(0).tickPadding(8).tickFormat(d => {
            const val = d * 1000;
            return val % 2 === 0 ? val.toFixed(0) : '';
        }));
    yAxis.selectAll('.tick line').attr('stroke-width', (d) => (d * 1000) % 2 === 0 ? 1 : 0.5);
    yAxis.selectAll('text')
        .style('font-family', 'sans-serif')
        .style('font-size', '11px')
        .style('fill', '#212529');

    const yAxisVP = svg.append("g").attr('class', 'axis y-axis-vp')
        .call(d3.axisLeft(y_vp).ticks(10).tickSize(5).tickPadding(8));
    yAxisVP.selectAll('text')
        .style('font-family', 'sans-serif')
        .style('font-size', '11px')
        .style('fill', '#212529');
    
    svg.append("text")
        .attr("x", width / 2).attr("y", height + 40)
        .attr("text-anchor", "middle")
        .style("font-family", "sans-serif")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text("Dry Bulb Temperature (°C)");

    svg.append("text")
        .attr("transform", `translate(${width + 55}, ${height/2}) rotate(-90)`)
        .attr("text-anchor", "middle")
        .style("font-family", "sans-serif")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text("Humidity Ratio (g/kg)");

    const yAxisVPTitle = svg.append("text")
        .attr("transform", `translate(-55, ${height/2}) rotate(-90)`)
        .attr("text-anchor", "middle")
        .style("font-family", "sans-serif")
        .style("font-size", "12px")
        .style("font-weight", "bold")
        .style("fill", "#333")
        .text("Vapor Pressure (Pa)");

    const line = d3.line().x(d => x(d.t)).y(d => y(d.w)).curve(d3.curveCatmullRom);
    const satCurveData = d3.range(t_min, t_max + 0.2, 0.2).map(t => ({ t: t, w: Math.min(w_max, PsychroLib.getHumidityRatio(t, 100)) }));
    svg.append('path').datum(satCurveData.filter(d => d.w <= w_max)).attr('d', line).attr('fill', 'none').attr('stroke', 'black').attr('stroke-width', 2);

    const dataPoints = hourlyData.map(d => ({ t: d.dryBulbTemperature, w: PsychroLib.getHumidityRatio(d.dryBulbTemperature, d.relativeHumidity) })).filter(d => d.t >= t_min && d.t <= t_max && d.w >= w_min && d.w <= w_max);
    
    const infoContainer = chartArea.append('div').attr('class', 'hover-info-panel').style('display', 'none');
    const infoItems = { 'Dry bulb temperature': '°C', 'Relative humidity': '%', 'Humidity ratio': 'g/kg', 'Wet bulb temp': '°C', 'Dew point temp': '°C', 'Enthalpy': 'kJ/kg' };
    const infoItemsGrid = infoContainer.append('div').attr('class', 'info-items-psychrometric-grid');
    Object.entries(infoItems).forEach(([label, unit]) => {
        infoItemsGrid.append('div').attr('class', 'info-item').append('span').attr('class', 'label').text(label + ':').append('span').attr('class', 'value').attr('id', `info-${label.toLowerCase().replace(/ /g, '-')}`).html(`-- ${unit}`);
    });
    
    const defs = svg.append('defs');
    defs.append('clipPath').attr('id', 'chart-area').append('rect').attr('width', width).attr('height', height);
    const gradient = defs.append('linearGradient').attr('id', 'ashrae-gradient').attr('x1', '0%').attr('y1', '100%').attr('x2', '0%').attr('y2', '0%');
    gradient.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(27, 173, 209, 0.2)');
    gradient.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(15, 58, 199, 0.6)');

    const heatmapGroup = svg.append('g').attr('class', 'data-heatmap');
    const isoPmvOverlayGroup = svg.append('g').attr('class', 'iso-pmv-overlay');
    const pointsGroup = svg.append('g').attr('class', 'data-points'); 
    const comfortGroup = svg.append('g').attr('class', 'comfort-zone').attr('clip-path', 'url(#chart-area)');
    const lineGroup = svg.append('g').attr('class', 'psychro-lines');
    const labelGroup = svg.append('g').attr('class', 'psychro-labels');
    const legendsGroup = svg.append('g').attr('class', 'psychro-legends');
    const indicator = svg.append('g').style('display', 'none').attr('class', 'indicator');
    indicator.append('circle').attr('r', 6).attr('fill', 'none').attr('stroke', '#dc2626').attr('stroke-width', 2);
    
    chartRefs.psychro.update = (options) => {
        heatmapGroup.selectAll('*').remove();
        pointsGroup.selectAll('*').remove();
        lineGroup.selectAll('*').remove();
        labelGroup.selectAll('*').remove();
        comfortGroup.selectAll('*').remove();
        isoPmvOverlayGroup.selectAll('*').remove();
        legendsGroup.selectAll('*').remove();
        
        [xAxis].forEach(sel => sel.style('display', options.showDBT ? 'block' : 'none'));
        [yAxis].forEach(sel => sel.style('display', options.showHR ? 'block' : 'none'));
        [yAxisVP, svg.select('.y-grid-vp'), yAxisVPTitle].forEach(sel => sel.style('display', options.showVP ? 'block' : 'none'));
       
        if (options.showHeatmap) {
            const heatmapData = createDataHeatmap(dataPoints, [t_min, t_max], [w_min, w_max], 70, 35);
            const maxCount = d3.max(heatmapData, d => d.count);
            const colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, maxCount]);
            heatmapGroup.selectAll('rect').data(heatmapData).join('rect').attr('x', d => x(d.x0)).attr('y', d => y(d.y1)).attr('width', d => x(d.x1) - x(d.x0)).attr('height', d => y(d.y0) - y(d.y1)).attr('fill', d => colorScale(d.count)).attr('opacity', 0.7);
        }
        
        if (options.comfortModel === 'ashrae') {
            const polygonData = ComfortLib.getComfortPolygon(options.comfortParams);
            if (polygonData.length > 0) {
                comfortGroup.append('path')
                    .attr('d', d3.line().x(d => x(d.t)).y(d => y(d.w))(polygonData) + 'Z')
                    .attr('fill', 'url(#ashrae-gradient)')
                    .attr('stroke', 'rgba(18, 79, 172, 0.9)')
                    .attr('stroke-width', 1.5);
                
                const pixelPolygon = polygonData.map(p => [x(p.t), y(p.w)]);
                const [cx, cy] = d3.polygonCentroid(pixelPolygon);
                if (!isNaN(cx) && !isNaN(cy)) {
                     labelGroup.append('text')
                        .attr('x', cx).attr('y', cy).attr('text-anchor', 'middle').attr('dy', '0.35em')
                        .style('font-family', 'sans-serif')
                        .style('font-size', '14px')
                        .style('font-weight', 'bold')
                        .style('fill', '#eeeeeeff')
                        .style('text-shadow', '0 1px 3px rgba(0,0,0,0.6)')
                        .style('pointer-events', 'none')
                        .text('COMFORT');
                }
            }
        } else if (options.comfortModel === 'iso') {
            const p = options.comfortParams;
            const pmvColorScale = d3.scaleDiverging([3, 0, -3], d3.interpolateRdBu).clamp(true);
            
            const gridData = [];
            const tStep = 1.0, wStep = 0.0005;
            for (let t = t_min; t < t_max; t += tStep) {
                const w_sat = PsychroLib.getHumidityRatio(t, 100);
                for (let w = w_min; w < Math.min(w_max, w_sat); w += wStep) {
                    const rh = PsychroLib.getRelHumidity(t, w);
                    const pmv = PsychroLib.getPMV(t, p.mrt, p.windSpeed, rh, p.metRate, p.cloLevel);
                    gridData.push({t: t, w: w, pmv: pmv});
                }
            }

            isoPmvOverlayGroup.selectAll('rect').data(gridData).join('rect')
                .attr('x', d => x(d.t)).attr('y', d => y(d.w + wStep))
                .attr('width', x(t_min + tStep) - x(t_min))
                .attr('height', y(w_min) - y(w_min + wStep))
                .attr('fill', d => pmvColorScale(d.pmv))
                .attr('opacity', 0.6);

            const contours = [-2.5, -1.5, -0.5, 0.5, 1.5, 2.5];
            contours.forEach(level => {
                const contourData = [];
                for (let t = t_min; t <= t_max; t += 1) {
                    let low = 0, high = 100;
                    for(let i=0; i<15; i++) {
                        let mid_rh = (low + high) / 2;
                        let pmv = PsychroLib.getPMV(t, p.mrt, p.windSpeed, mid_rh, p.metRate, p.cloLevel);
                        if (pmv < level) low = mid_rh; else high = mid_rh;
                    }
                    const w = PsychroLib.getHumidityRatio(t, high);
                    if(w >= w_min && w <= w_max) contourData.push({ t, w });
                }
                if (contourData.length > 1) {
                    isoPmvOverlayGroup.append('path').datum(contourData).attr('d', line).attr('fill', 'none').attr('stroke', '#343a40').attr('stroke-width', 0.7).attr('opacity', 0.4).attr('clip-path', 'url(#chart-area)');
                }
            });
        }
        
        if (options.showPoints) {
            pointsGroup.selectAll('circle').data(dataPoints.filter((d, i) => i % 10 === 0)).join('circle')
                .attr('cx', d => x(d.t)).attr('cy', d => y(d.w))
                .attr('r', 1.5).attr('fill', '#2f4f4f').attr('opacity', 0.6);
        }
        
        if (options.showRH) {
            [10, 20, 30, 40, 50, 60, 70, 80, 90].forEach(rh => {
                const rhData = d3.range(t_min, t_max + 0.5, 0.5).map(t => ({ t: t, w: PsychroLib.getHumidityRatio(t, rh) }));
                const rhDataFiltered = rhData.filter(d => d.w <= w_max && d.w >= w_min && x(d.t) <= width);
                lineGroup.append('path').datum(rhDataFiltered).attr('d', line).attr('fill', 'none').attr('stroke', options.comfortModel === 'iso' ? '#808080' : '#6c757d').attr('stroke-width', 1).attr('opacity', 0.8).style("stroke-dasharray", ("3, 3"));
                if (rhDataFiltered.length > 1) {
                    const lastPoint = rhDataFiltered[rhDataFiltered.length - 1];
                    const labelX = x(lastPoint.t);
                    const labelY = y(lastPoint.w);

                    let finalY = labelY;
                    let verticalOffset = '-0.3em';
                    let anchor = 'end'; 

                    if (labelY < 15) { 
                        finalY = 0;
                        verticalOffset = '-0.5em';
                        anchor = 'middle';
                    }

                    labelGroup.append('text')
                        .attr('x', labelX - 2)
                        .attr('y', finalY)
                        .attr('dy', verticalOffset)
                        .attr('text-anchor', anchor)
                        .style('font-family', 'sans-serif')
                        .style('font-size', '10px')
                        .style('fill', options.comfortModel === 'iso' ? '#28282B' : '#6c757d')
                        .text(`${rh}%`);
                }
            });
        }
        if (options.showWB) {
             d3.range(-10, 35, 5).forEach(wbt => {
                const h_wb = PsychroLib.getEnthalpy(wbt, PsychroLib.getHumidityRatio(wbt, 100));
                const wbDataPoints = d3.range(wbt, t_max + 0.5, 0.5).map(t => ({ t, w: (h_wb - 1.006 * t) / (2501 + 1.86 * t) })).filter(p => p.w >= w_min && p.w <= w_max && p.t >= wbt);
                if (wbDataPoints.length > 1) {
                    lineGroup.append('path').datum(wbDataPoints).attr('d', line).attr('fill', 'none').attr('stroke', options.comfortModel === 'iso' ? '#808080' : '#17a2b8').attr('stroke-width', 1).attr('stroke-dasharray', '4,4');
                    
                    const labelPoint = wbDataPoints[0];
                    if (x(labelPoint.t) >= 0 && y(labelPoint.w) <= height) {
                        let labelX = x(labelPoint.t);
                        let labelY = y(labelPoint.w);
                        let textAnchor = 'end';
                        let dx = -8;
                        let dy = -8;

                        if (labelX < 20) {
                            textAnchor = 'start';
                            dx = 8;
                        }
                        
                        if (labelY < 15) {
                            dy = 15;
                        }

                        labelGroup.append('text')
                            .attr('x', labelX)
                            .attr('y', labelY)
                            .attr('dx', dx)
                            .attr('dy', dy)
                            .attr('text-anchor', textAnchor)
                            .style('font-family', 'sans-serif')
                            .style('font-size', '10px')
                            .style('fill', options.comfortModel === 'iso' ? '#28282B' : '#17a2b8')
                            .text(`${wbt}°`);
                    }
                }
            });
        }
        if (options.showEnthalpy) {
            d3.range(-10, 121, 10).forEach(h => {
                const p_bottom = { t: PsychroLib.getTdbFromEnthalpyAndW(h, 0), w: 0 };
                const p_top = { t: PsychroLib.getTdbFromEnthalpyAndW(h, w_max), w: w_max };

                lineGroup.append('line')
                    .attr('x1', x(p_bottom.t)).attr('y1', y(p_bottom.w))
                    .attr('x2', x(p_top.t)).attr('y2', y(p_top.w))
                    .attr('stroke', options.comfortModel === 'iso' ? '#808080' : '#28a745').attr('stroke-width', 1)
                    .attr('stroke-dasharray', '5,3').attr('clip-path', 'url(#chart-area)');

                let labelPos = null;

                const t_at_w_max = PsychroLib.getTdbFromEnthalpyAndW(h, w_max);
                if (t_at_w_max > t_min && t_at_w_max <= t_max) {
                    labelPos = { x: x(t_at_w_max), y: y(w_max), anchor: 'middle', dy: 12 };
                }
                else {
                    const w_at_t_min = (h - 1.006 * t_min) / (2501 + 1.86 * t_min);
                    if (w_at_t_min > w_min && w_at_t_min < w_max) {
                        labelPos = { x: x(t_min), y: y(w_at_t_min), anchor: 'start', dx: 5, dy: -6 };
                    }
                }
                if (!labelPos) {
                    const w_at_t_max = (h - 1.006 * t_max) / (2501 + 1.86 * t_max);
                    if (w_at_t_max >= w_min && w_at_t_max < w_max) {
                        labelPos = { x: x(t_max), y: y(w_at_t_max), anchor: 'end', dx: -5, dy: -10 };
                    }
                }

                if (labelPos && labelPos.x >= 0 && labelPos.x <= width && labelPos.y >= 0 && labelPos.y <= height) {
                    labelGroup.append('text')
                        .attr('x', labelPos.x)
                        .attr('y', labelPos.y)
                        .attr('dx', labelPos.dx || 0)
                        .attr('dy', labelPos.dy || 0)
                        .attr('text-anchor', labelPos.anchor)
                        .style('font-family', 'sans-serif')
                        .style('font-size', '10px')
                        .style('fill', options.comfortModel === 'iso' ? '#28282B' : '#28a745')
                        .text(h);
                }
            });
        }

        defs.selectAll('linearGradient[id$="-legend-gradient"]').remove();
        const legendYPosition = height + 75;
        const legendWidth = 250;

        const drawHeatmapLegend = (lx, ly) => {
            const heatmapLegend = legendsGroup.append('g')
                .attr('class', 'heatmap-legend')
                .attr('transform', `translate(${lx}, ${ly})`);

            const legendGradient = defs.append('linearGradient').attr('id', 'heatmap-legend-gradient').attr('x1', '0%').attr('x2', '100%');
            legendGradient.selectAll('stop').data(d3.range(0, 1.01, 0.1)).join('stop').attr('offset', d => `${d*100}%`).attr('stop-color', t => d3.interpolateYlOrRd(t));

            heatmapLegend.append('rect').attr('x', 0).attr('y', 15).attr('width', legendWidth).attr('height', 10).style('fill', 'url(#heatmap-legend-gradient)');
            heatmapLegend.append('text').attr('x', 0).attr('y', 40).attr('text-anchor', 'start').style('font-family', 'sans-serif').style('font-size', '10px').style('fill', '#333').text('Fewer Hours');
            heatmapLegend.append('text').attr('x', legendWidth).attr('y', 40).attr('text-anchor', 'end').style('font-family', 'sans-serif').style('font-size', '10px').style('fill', '#333').text('More Hours');
            heatmapLegend.append('text').attr('x', legendWidth / 2).attr('y', 10).attr('text-anchor', 'middle').style('font-family', 'sans-serif').style('font-size', '11px').style('font-weight', 'bold').style('fill', '#333').text('Annual Weather Data Distribution');
        };

        const drawIsoLegend = (lx, ly) => {
            const isoLegend = legendsGroup.append('g')
                .attr('class', 'iso-legend')
                .attr('transform', `translate(${lx}, ${ly})`);
            
            const emojiMap = { '-3': '🥶', '-2': '', '-1': '', '0': '😊', '1': '', '2': '', '3': '🥵' };

            const pmvColorScale = d3.scaleDiverging([3, 0, -3], d3.interpolateRdBu);
            const legendGradient = defs.append('linearGradient').attr('id', 'pmv-legend-gradient').attr('x1', '0%').attr('x2', '100%');
            legendGradient.selectAll('stop').data(d3.range(-3, 3.01, 0.5)).join('stop').attr('offset', d => `${((d + 3) / 6) * 100}%`).attr('stop-color', t => pmvColorScale(t));

            isoLegend.append('rect').attr('x', 0).attr('y', 15).attr('width', legendWidth).attr('height', 10).style('fill', 'url(#pmv-legend-gradient)');
            const legendScale = d3.scaleLinear().domain([-3, 3]).range([0, legendWidth]);
            const legendTicks = [-3, -2, -1, 0, 1, 2, 3];
            
            isoLegend.selectAll('text.legend-tick-label').data(legendTicks).join('text')
                .attr('x', d => legendScale(d)).attr('y', 40).attr('text-anchor', 'middle').style('font-family', 'sans-serif').style('font-size', '10px').style('fill', '#333')
                .text(d => d > 0 ? `+${d}` : d);

            isoLegend.selectAll('text.legend-emoji-label').data(legendTicks).join('text')
                .attr('x', d => legendScale(d)).attr('y', 60).attr('text-anchor', 'middle').style('font-size', '16px')
                .text(d => emojiMap[d]);

            isoLegend.append('text').attr('x', legendWidth / 2).attr('y', 10).attr('text-anchor', 'middle').style('font-family', 'sans-serif').style('font-size', '11px').style('font-weight', 'bold').style('fill', '#333').text('Predicted Mean Vote (PMV)');
        };

        const showHeatmapLegend = options.showHeatmap;
        const showIsoLegend = options.comfortModel === 'iso';

        if (showHeatmapLegend && showIsoLegend) {
            const legendGap = 40;
            const totalLegendsWidth = legendWidth * 2 + legendGap;
            const startX = (width - totalLegendsWidth) / 2;
            drawHeatmapLegend(startX, legendYPosition);
            drawIsoLegend(startX + legendWidth + legendGap, legendYPosition);
        } else if (showHeatmapLegend) {
            const legendX = (width - legendWidth) / 2;
            drawHeatmapLegend(legendX, legendYPosition);
        } else if (showIsoLegend) {
            const legendX = (width - legendWidth) / 2;
            drawIsoLegend(legendX, legendYPosition);
        }

        const showComfortParams = options.comfortModel === 'ashrae' || options.comfortModel === 'iso';
        if (showComfortParams) {
            const params = options.comfortParams;
            const paramsYPosition = height + 157; 
            const paramsTextLine = legendsGroup.append('text')
                .attr('x', width / 2)
                .attr('y', paramsYPosition)
                .attr('text-anchor', 'middle');

            paramsTextLine.append('tspan')
                .style('font-family', 'sans-serif')
                .style('font-size', '11px')
                .style('font-weight', 'bold')
                .style('fill', '#333')
                .text('Comfort Analysis Parameters: ');

            const valuesString = `Mean Radiant Temp: ${params.mrt.toFixed(1)} °C  │  Wind Speed: ${params.windSpeed.toFixed(1)} m/s  │  Metabolic Rate: ${params.metRate.toFixed(1)} met  │  Clothing Level: ${params.cloLevel.toFixed(1)} clo`;
            paramsTextLine.append('tspan')
                .style('font-family', 'sans-serif')
                .style('font-size', '10px')
                .style('fill', '#333')
                .text(valuesString);
        }
    };
    
    svg.append('rect').attr('width', width).attr('height', height).attr('opacity', 0).style('cursor', 'crosshair')
        .on('mousemove', function(event) {
            if (!d3.select('#psychro-indicator-toggle').property('checked')) return;
            const [mx, my] = d3.pointer(event, this);
            const t = x.invert(mx), w = Math.max(0, y.invert(my));
            if (w > PsychroLib.getHumidityRatio(t, 100) || t < t_min || t > t_max || mx > width || mx < 0 || my > height || my < 0) {
                indicator.style('display', 'none'); infoContainer.style('display', 'none'); return;
            }
            indicator.style('display', 'block').attr('transform', `translate(${mx}, ${my})`);
            infoContainer.style('display', 'block');
            const rh = PsychroLib.getRelHumidity(t, w), h = PsychroLib.getEnthalpy(t, w), wbt = PsychroLib.getWetBulb(t, w), dpt = PsychroLib.getDewPoint(w);
                d3.select('#info-dry-bulb-temperature').text(` ${t.toFixed(1)} °C`); d3.select('#info-humidity-ratio').text(` ${(w * 1000).toFixed(1)} g/kg`); 
                d3.select('#info-relative-humidity').text(` ${rh.toFixed(1)} %`); d3.select('#info-wet-bulb-temp').text(` ${wbt.toFixed(1)} °C`); 
                d3.select('#info-enthalpy').text(` ${h.toFixed(1)} kJ/kg`); d3.select('#info-dew-point-temp').text(dpt ? ` ${dpt.toFixed(1)} °C` : ' -- °C');
        })
        .on('mouseout', () => { indicator.style('display', 'none'); infoContainer.style('display', 'none'); });

    container.append('style').text(`
        .hover-info-panel { position: absolute; background-color: rgba(255, 255, 255, 0.9); border: 1px solid #ccc; border-radius: 6px; padding: 8px; font-size: 11px; box-shadow: 0 2px 5px rgba(0,0,0,0.15); pointer-events: none; top: ${margin.top + 10}px; left: ${margin.left + 10}px; }
        .info-items-psychrometric-grid { display: grid; grid-template-columns: auto auto; gap: 2px 8px; }
        .info-item-psychrometric .label { font-weight: bold; } .info-item-psychrometric .value { text-align: right; }
        #comfort-options-container { transition: opacity 0.3s ease; }
    `);

    const initialUpdate = () => {
        if (chartRefs.psychro && chartRefs.psychro.update) {
            d3.select('input[name="comfortModel"]').dispatch('input');
        } else { setTimeout(initialUpdate, 50); }
    };
    initialUpdate();
}