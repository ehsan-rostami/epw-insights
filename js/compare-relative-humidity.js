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
function renderRelativeHumidityCompareCharts(epwDataA, epwDataB) {
    const contentArea = d3.select("#compare-content-area").html('');
    contentArea.append('div').attr('id', 'compare-rh-dist-chart').attr('class', 'chart-container mb-5');
    contentArea.append('div').attr('id', 'compare-rh-diurnal-chart').attr('class', 'chart-container');
    renderRHCompareControls('#compare-pane .left-panel');
    renderRHDistributionComparison('#compare-rh-dist-chart', epwDataA, epwDataB);
    renderRHDiurnalComparison('#compare-rh-diurnal-chart', epwDataA, epwDataB);
}

/**
 * Controls for the left panel
 * @param {string} panelSelector
 */
function renderRHCompareControls(panelSelector) {
    const panel = d3.select(panelSelector);
   
    const rhControls = panel.append('div').attr('class', 'chart-controls-group');
    rhControls.append('h6').text('Humidity Chart Options');
  
}


/**
 * Side-by-side monthly relative humidity chart
 * @param {string} selector
 * @param {object} dataA
 * @param {object} dataB
 */
function renderRHDistributionComparison(selector, dataA, dataB) {
    const container = d3.select(selector).html('');
    const locNameA = formatSimpleLocation(dataA.metadata.location.city, dataA.metadata.location.country, 'primary');
    const locNameB = formatSimpleLocation(dataB.metadata.location.city, dataB.metadata.location.country, 'comparison');
    const legendNameA = formatCityNameOnly(dataA.metadata.location.city, 'primary');
    const legendNameB = formatCityNameOnly(dataB.metadata.location.city, 'comparison');

    const bodyFont = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";

    addExportButton(selector, `rh-dist-${locNameA}-vs-${locNameB}`, `${locNameA} vs. ${locNameB}`);
    container.append('h5').text('Monthly Humidity Distribution Comparison').attr('class', 'chart-title-main');
    const tooltip = d3.select("body").selectAll(".tooltip").data([null]).join("div").attr("class", "tooltip");
    
    const margin = { top: 20, right: 20, bottom: 90, left: 60 };
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    svg.append("rect")
        .attr("width", width)
        .attr("height", height)
        .attr("fill", "#f8f9fa")
        .style("transition", "fill 0.3s ease-in-out")
        .on("mouseover", function() { d3.select(this).attr("fill", "#f7fafc"); })
        .on("mouseout", function() { d3.select(this).attr("fill", "#f8f9fa"); });

    const processData = (hourlyData) => {
        const monthlyData = Array.from(d3.group(hourlyData, d => d.month), ([key, value]) => ({ key, value }))
                                 .sort((a, b) => a.key - b.key);
        
        const allPlotData = [...monthlyData, { key: "Annual", value: hourlyData }];
        
        allPlotData.forEach(d => {
            const rhValues = d.value.map(h => h.relativeHumidity).sort(d3.ascending);
            d.stats = {
                min: d3.min(rhValues), max: d3.max(rhValues),
                q1: d3.quantile(rhValues, 0.25), median: d3.quantile(rhValues, 0.5), q3: d3.quantile(rhValues, 0.75)
            };
            const iqr = d.stats.q3 - d.stats.q1;
            d.stats.lower = Math.max(d.stats.min, d.stats.q1 - 1.5 * iqr);
            d.stats.upper = Math.min(d.stats.max, d.stats.q3 + 1.5 * iqr);
            d.mean = d3.mean(d.value, h => h.relativeHumidity);
        });
        return allPlotData;
    };

    const plotDataA = processData(dataA.data);
    const plotDataB = processData(dataB.data);
    const dataMapA = new Map(plotDataA.map(d => [d.key, d]));
    const dataMapB = new Map(plotDataB.map(d => [d.key, d]));

    const monthLabels = [...d3.range(0, 12).map(i => d3.timeFormat("%b")(new Date(2000, i, 1))), "", "Annual"];
    const colorA = '#75aadb', colorB = '#a1d99b';

    const x0 = d3.scaleBand().domain(monthLabels).rangeRound([0, width]).paddingInner(0.4);
    const x1 = d3.scaleBand().domain(['A', 'B']).rangeRound([0, x0.bandwidth()]).padding(0.25);
    const y = d3.scaleLinear().domain([0, 100]).nice().range([height, 0]);

    svg.append("g").attr("class", "grid-line").call(d3.axisLeft(y).tickSize(-width).tickFormat("")).selectAll("line").attr("stroke", "#e0e0e0").attr("stroke-dasharray", "3,3");
    svg.select(".grid-line .domain").remove();
    
    const xAxis = svg.append("g").attr("transform", `translate(0,${height})`).call(d3.axisBottom(x0)).style("font-family", bodyFont);
    xAxis.selectAll(".tick").filter(d => d === "").remove();

    svg.append("g").call(d3.axisLeft(y).tickFormat(d => `${d}%`)).style("font-family", bodyFont);
    svg.append("text").attr("class", "y-axis-label axis-title").attr("transform", "rotate(-90)").attr("y", -margin.left + 20).attr("x", -height / 2).text("% RH").style("font-family", bodyFont);

    const legendsGroup = svg.append('g').attr('class', 'legends-container');
    const boxPlotLegendHeight = 30;
    const locationLegendHeight = 20;

    let legendItemsData = [
        { icon: `<svg viewBox="0 0 12 12"><rect width="11" height="11" x="0.5" y="0.5" fill="#ffffff" stroke="black" stroke-width="0.5"></rect></svg>`, text: 'Interquartile Range (IQR)' },
        { icon: `<svg viewBox="0 0 12 12"><path d="M6 1 V 11 M 3 1 H 9 M 3 11 H 9" stroke="black" stroke-width="1" fill="none"></path></svg>`, text: '1.5 * IQR' },
        { icon: `<svg viewBox="0 0 12 12"><rect x="0" y="0" width="12" height="12" fill="#ffffff" stroke="black" stroke-width="0.5"></rect><line x1="0" y1="6" x2="12" y2="6" stroke="black" stroke-width="1.5"></line></svg>`, text: 'Median' },
        { icon: `<svg viewBox="0 0 12 12"><rect x="0" y="0" width="12" height="12" fill="#ffffff" stroke="black" stroke-width="0.5"></rect><circle cx="6" cy="6" r="2.5" fill="black"></circle></svg>`, text: 'Mean' }
    ];
    
    let boxPlotHTML = `<div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; justify-content: center; align-items: center; flex-wrap: wrap; gap: 0.5rem 1rem; width: 100%; height: 100%; font-family: ${bodyFont};">`;
    legendItemsData.forEach(item => { boxPlotHTML += `<div style="display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem;"><div style="width: 12px; height: 12px; flex-shrink: 0;">${item.icon}</div><span>${item.text}</span></div>`; });
    boxPlotHTML += `</div>`;
    
    legendsGroup.append('foreignObject').attr('x', 0).attr('y', height + 35).attr('width', width).attr('height', boxPlotLegendHeight).html(boxPlotHTML);
    
    let locationHTML = `<div xmlns="http://www.w3.org/1999/xhtml" style="display: flex; justify-content: center; align-items: center; gap: 1.5rem; width: 100%; height: 100%; font-family: ${bodyFont}; font-size: 0.75rem;">`;
    locationHTML += `<div style="display: flex; align-items: center; gap: 0.5rem;"><div style="width: 14px; height: 14px; background-color: ${colorA}; border: 1px solid #555;"></div><span>${legendNameA}</span></div>`;
    locationHTML += `<div style="display: flex; align-items: center; gap: 0.5rem;"><div style="width: 14px; height: 14px; background-color: ${colorB}; border: 1px solid #555;"></div><span>${legendNameB}</span></div>`;
    locationHTML += `</div>`;
    
    legendsGroup.append('foreignObject').attr('x', 0).attr('y', height + 35 + boxPlotLegendHeight).attr('width', width).attr('height', locationLegendHeight).html(locationHTML);

    const drawBox = (selection, { stats, mean, color, locationName, monthName }) => {
        const boxWidth = x1.bandwidth();
        selection.append("line").attr("x1", boxWidth / 2).attr("x2", boxWidth / 2).attr("y1", y(stats.upper)).attr("y2", y(stats.q3)).attr("stroke", "black").attr("stroke-width", 0.5);
        selection.append("line").attr("x1", boxWidth / 2).attr("x2", boxWidth / 2).attr("y1", y(stats.q1)).attr("y2", y(stats.lower)).attr("stroke", "black").attr("stroke-width", 0.5);
        selection.append("line").attr("x1", boxWidth * 0.25).attr("x2", boxWidth * 0.75).attr("y1", y(stats.upper)).attr("y2", y(stats.upper)).attr("stroke", "black").attr("stroke-width", 0.5);
        selection.append("line").attr("x1", boxWidth * 0.25).attr("x2", boxWidth * 0.75).attr("y1", y(stats.lower)).attr("y2", y(stats.lower)).attr("stroke", "black").attr("stroke-width", 0.5);
        selection.append("rect").attr("x", 0).attr("y", y(stats.q3)).attr("width", boxWidth).attr("height", d => Math.max(0, y(stats.q1) - y(stats.q3))).attr("fill", color).attr("stroke", "black").attr("stroke-width", 0.5).style('transition', 'fill 0.2s ease-in-out').on("mouseover", function(event) {
            d3.select(this).attr("fill", d3.color(color).darker(0.2));
            tooltip.style("opacity", 1).html(`<strong>${locationName} - ${monthName}</strong><br>Max: ${stats.max.toFixed(0)} %<br>Median: ${stats.median.toFixed(0)} %<br>Mean: ${mean.toFixed(0)} %<br>Min: ${stats.min.toFixed(0)} %`);
        }).on("mousemove", event => tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`)).on("mouseout", function() {
            d3.select(this).attr("fill", color);
            tooltip.style("opacity", 0);
        });
        selection.append("line").attr("x1", 0).attr("x2", boxWidth).attr("y1", y(stats.median)).attr("y2", y(stats.median)).attr("stroke", "black").attr("stroke-width", 1.5);
        selection.append("circle").attr("cx", boxWidth / 2).attr("cy", y(mean)).attr("r", 2.5).attr("fill", "black");
    };

    const monthGroup = svg.selectAll(".month-group").data(monthLabels).join("g").attr("class", "month-group").attr("transform", (d) => `translate(${x0(d)},0)`);
    monthGroup.each(function(monthLabel, i) {
        const isAnnual = monthLabel === "Annual";
        const dataKey = isAnnual ? "Annual" : (monthLabel ? i + 1 : null);
        if (dataKey === null) return;
        const monthName = isAnnual ? "Annual" : d3.timeFormat("%B")(new Date(2000, i, 1));
        const d_a = dataMapA.get(dataKey);
        const d_b = dataMapB.get(dataKey);
        if (d_a) d3.select(this).append('g').attr('transform', `translate(${x1('A')}, 0)`).call(drawBox, { ...d_a, color: colorA, locationName: legendNameA, monthName });
        if (d_b) d3.select(this).append('g').attr('transform', `translate(${x1('B')}, 0)`).call(drawBox, { ...d_b, color: colorB, locationName: legendNameB, monthName });
    });
}

/**
 * Side-by-side monthly diurnal relative humidity chart
 * @param {string} selector
 * @param {object} dataA
 * @param {object} dataB
 */
function renderRHDiurnalComparison(selector, dataA, dataB) {
    const container = d3.select(selector).html('');
    const locNameA = formatSimpleLocation(dataA.metadata.location.city, dataA.metadata.location.country, 'primary');
    const locNameB = formatSimpleLocation(dataB.metadata.location.city, dataB.metadata.location.country, 'comparison');
    const legendNameA = formatCityNameOnly(dataA.metadata.location.city, 'primary');
    const legendNameB = formatCityNameOnly(dataB.metadata.location.city, 'comparison');

    addExportButton(selector, `diurnal-rh-${locNameA}-vs-${locNameB}`, `${locNameA} vs. ${locNameB}`);
    container.append('h5').text('Hourly Averages Comparison: Relative Humidity').attr('class', 'chart-title-main');
    
    const tooltip = d3.select("body").selectAll(".tooltip").data([null]).join("div").attr("class", "tooltip");
    const bodyFont = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
    const colorA = '#377eb8', colorB = '#4daf4a';

    const processDiurnalData = (hourlyData) => {
        const monthlyGroups = d3.group(hourlyData, d => d.month);
        const result = new Map();
        for (let m = 1; m <= 12; m++) {
            const monthData = monthlyGroups.get(m) || [];
            const hourlyAvg = d3.rollups(monthData,
                v => d3.mean(v, d => d.relativeHumidity),
                d => d.hour
            ).sort((a,b) => a[0] - b[0]);
            
            result.set(m, {
                values: hourlyAvg,
                meanRh: d3.mean(monthData, d => d.relativeHumidity)
            });
        }
        return result;
    };

    const processedA = processDiurnalData(dataA.data);
    const processedB = processDiurnalData(dataB.data);

    const plotData = [];
    for (let m = 1; m <= 12; m++) {
        plotData.push({
            key: d3.timeFormat("%B")(new Date(2000, m - 1)),
            dataA: processedA.get(m),
            dataB: processedB.get(m)
        });
    }

    const numCols = 4, numRows = 3;
    const legendHeight = 50;
    const chartMargin = { top: 30, right: 20, bottom: 40, left: 45 };
    const chartWidth = 250 - chartMargin.left - chartMargin.right;
    const chartHeight = 200 - chartMargin.top - chartMargin.bottom;
    const totalWidth = numCols * (chartWidth + chartMargin.left + chartMargin.right);
    const totalHeight = numRows * (chartHeight + chartMargin.top + chartMargin.bottom) + legendHeight;

    const svg = container.append('svg').attr('viewBox', `0 0 ${totalWidth} ${totalHeight}`);

    plotData.forEach((d, i) => {
        const col = i % numCols, row = Math.floor(i / numCols);
        const xPos = col * (chartWidth + chartMargin.left + chartMargin.right);
        const yPos = row * (chartHeight + chartMargin.top + chartMargin.bottom);
        
        const g = svg.append("g").attr("transform", `translate(${xPos + chartMargin.left}, ${yPos + chartMargin.top})`);
        
        g.append('rect').attr('class', 'chart-background').attr('width', chartWidth).attr('height', chartHeight).attr("fill", "#f8f9fa").style("transition", "fill 0.3s ease-in-out");
        g.append('text').attr('x', chartWidth/2).attr('y', -10).attr('text-anchor', 'middle').style('font-weight', 'bold').style('font-size', '14px').style("font-family", bodyFont).text(d.key);
        
        const x = d3.scaleLinear().domain([0, 24]).range([0, chartWidth]);
        const y = d3.scaleLinear().domain([0, 100]).range([chartHeight, 0]).nice();

        g.append("g").attr("transform", `translate(0,${chartHeight})`).call(d3.axisBottom(x).tickValues([0, 6, 12, 18, 24])).style("font-family", bodyFont);
        g.append("g").call(d3.axisLeft(y).ticks(5).tickFormat(t => `${t}%`)).style("font-family", bodyFont);
        
        g.append("text").attr("class", "axis-title").attr("x", chartWidth/2).attr("y", chartHeight + 35).style("text-anchor", "middle").text("Hour").style("font-family", bodyFont).style("font-size", "12px");
        g.append("text").attr("class", "axis-title").attr("transform", "rotate(-90)").attr("y", -chartMargin.left + 15).attr("x", -chartHeight/2).style("text-anchor", "middle").text("% RH").style("font-family", bodyFont).style("font-size", "12px");
        
        const line = d3.line().x(p => x(p[0])).y(p => y(p[1]));

        if (d.dataA && d.dataA.values) {
            g.append("path").datum(d.dataA.values).attr("fill", "none").attr("stroke", colorA).attr("stroke-width", 2).attr("d", line);
        }
        if (d.dataB && d.dataB.values) {
            g.append("path").datum(d.dataB.values).attr("fill", "none").attr("stroke", colorB).attr("stroke-width", 2).attr("d", line);
        }
        
        g.append('rect').attr('width', chartWidth).attr('height', chartHeight).attr('fill', 'none').style('pointer-events', 'all')
            .on('mouseover', function() {
                d3.select(this.parentNode).select('.chart-background').attr("fill", "#f7fafc");
                let tooltipHtml = `<strong>${d.key} Averages:</strong>`;
                if (d.dataA && d.dataA.meanRh !== undefined) tooltipHtml += `<br><span style="color:${colorA};">${legendNameA} RH: ${d.dataA.meanRh.toFixed(0)}%</span>`;
                if (d.dataB && d.dataB.meanRh !== undefined) tooltipHtml += `<br><span style="color:${colorB};">${legendNameB} RH: ${d.dataB.meanRh.toFixed(0)}%</span>`;
                tooltip.style("opacity", 1).html(tooltipHtml);
            })
            .on('mousemove', (event) => tooltip.style("top", `${event.pageY - 10}px`).style("left", `${event.pageX + 10}px`))
            .on('mouseout', function() {
                d3.select(this.parentNode).select('.chart-background').attr("fill", "#f8f9fa");
                tooltip.style("opacity", 0);
            });
    });

    const legendYPos = totalHeight - legendHeight;
    const legendHTML = `
        <div xmlns="http://www.w3.org/1999/xhtml" style="font-family: ${bodyFont}; font-size: 0.9em; display: flex; justify-content: center; align-items: center; width: 100%; height: 100%; gap: 2rem; flex-wrap: nowrap; white-space: nowrap;">
            <div style="display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0;">
                <svg width="20" height="15"><line x1="0" y1="7.5" x2="20" y2="7.5" style="stroke: ${colorA}; stroke-width: 2;"></line></svg>
                <span>RH (${legendNameA})</span>
            </div>
            <div style="display: flex; align-items: center; gap: 0.4rem; flex-shrink: 0;">
                <svg width="20" height="15"><line x1="0" y1="7.5" x2="20" y2="7.5" style="stroke: ${colorB}; stroke-width: 2;"></line></svg>
                <span>RH (${legendNameB})</span>
            </div>
        </div>`;

    svg.append('foreignObject').attr('x', 0).attr('y', legendYPos).attr('width', totalWidth).attr('height', legendHeight).html(legendHTML);
}