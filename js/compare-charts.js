/*
 * EPW Insights
 * Author: Ehsan Rostami (https://github.com/ehsan-rostami)
 * Copyright (c) 2025 Ehsan Rostami
 * Released under the MIT License.
*/

let compareNavInitialized = false;

/**
 * Main function
 * @param {object} epwDataA - Primary EPW.
 * @param {object} epwDataB - Comparison EPW
 */
function renderCompareCharts(epwDataA, epwDataB) {
    const leftPanel = d3.select('#compare-pane .left-panel');
    const mainArea = d3.select('#compare-pane .main-chart-area');

    if (!epwDataA || !epwDataB) {
        mainArea.html(''); 
        leftPanel.html(''); 
        mainArea.insert('div', ':first-child')
            .attr('class', 'alert alert-info mt-3')
            .html('Please load both a <strong>Primary EPW File</strong> and a <strong>Comparison EPW File</strong> to activate this feature.');
        return;
    }

    if (compareNavInitialized) {
        const activeButton = leftPanel.select('.compare-nav-item.active').node();
        if (activeButton) {
            activeButton.click();
        }
        return;
    }
    
    leftPanel.html(''); 
    mainArea.html('').append('div').attr('id', 'compare-content-area'); 

    const navItems = [
        { id: 'overview', label: 'Overview', renderFunc: renderOverviewCompare },
        { id: 'temp', label: 'Air Temperature', renderFunc: renderAirTemperatureCompareCharts },
        { id: 'rh', label: 'Relative Humidity', renderFunc: renderRelativeHumidityCompareCharts },
        { id: 'sky', label: 'Sky Cover', renderFunc: renderSkyCoverCompareCharts },
        { id: 'wind', label: 'Wind', renderFunc: renderWindCompareCharts },
        { id: 'solar', label: 'Solar Radiation', renderFunc: renderSolarRadiationCompareCharts },
        { id: 'sun-path', label: 'Sun Path', renderFunc: renderSunPathCompareCharts }
    ];

    const navGroup = leftPanel.append('div').attr('class', 'compare-nav-group');

    navItems.forEach(item => {
        navGroup.append('button')
            .attr('class', 'compare-nav-item')
            .attr('id', `compare-nav-${item.id}`)
            .text(item.label)
            .on('click', function() {
                
                navGroup.selectAll('.compare-nav-item').classed('active', false);
                d3.select(this).classed('active', true);

                const contentArea = d3.select('#compare-content-area');
                contentArea.html('');

                leftPanel.selectAll('.chart-controls-group').remove();

                if (typeof item.renderFunc === 'function') {
                    item.renderFunc(epwDataA, epwDataB);
                } else {
                    contentArea.html(`<div class="alert alert-warning">Chart function for "${item.label}" is not available.</div>`);
                }
            });
    });

    compareNavInitialized = true;

    leftPanel.select('.compare-nav-item').node().click();
}