/*
 * EPW Insights
 * Author: Ehsan Rostami (https://github.com/ehsan-rostami)
 * Copyright (c) 2025 Ehsan Rostami
 * Released under the MIT License.
*/

/**
 * Gathers all CSS rules
 * @param {SVGElement} svgNode
 * @returns {string}
 */
function getSvgStyles(svgNode) {
    let styles = '';
    const sheets = document.styleSheets;
    for (let i = 0; i < sheets.length; i++) {
        try {
            const rules = sheets[i].cssRules;
            if (rules) {
                for (let j = 0; j < rules.length; j++) {
                    const rule = rules[j];
                    if (typeof(rule.style) != "undefined") {
                        const selectorText = rule.selectorText;
                        if (selectorText && svgNode.querySelector(selectorText)) {
                            styles += `${selectorText} { ${rule.style.cssText} }\n`;
                        }
                    }
                }
            }
        } catch (e) {
            if (e.name !== 'SecurityError') throw e;
        }
    }
    return styles;
}


/**
 * Exports an SVG node to a PNG file
 * @param {SVGElement} svgNode
 * @param {string} filename
 * @param {string} chartTitle
 * @param {string} epwLocation
 * @param {number} scale
 */
function exportChartAsPNG(svgNode, filename, chartTitle = '', epwLocation = '', scale = 2.5) {
    if (!svgNode) {
        console.error("SVG node not provided for export.");
        return;
    }
    const headerHeight = 22; 
    const signatureHeight = 15;
    const signatureFontSize = 7;
    const padding = 15;

    const svgClone = svgNode.cloneNode(true);
    const styles = getSvgStyles(svgNode);

    const styleElement = document.createElement("style");
    styleElement.setAttribute("type", "text/css");
    styleElement.innerHTML = `<![CDATA[\n${styles}\n]]>`;

    const defsElement = document.createElement("defs");
    defsElement.appendChild(styleElement);
    svgClone.insertBefore(defsElement, svgClone.firstChild);

    const svgData = new XMLSerializer().serializeToString(svgClone);
    const canvas = document.createElement("canvas");
    const viewBox = svgNode.viewBox.baseVal;
    const svgWidth = viewBox.width;
    const svgHeight = viewBox.height;

    canvas.width = svgWidth * scale;
    canvas.height = (headerHeight * scale) + (svgHeight * scale) + (signatureHeight * scale);
    const ctx = canvas.getContext("2d");
    
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    img.onload = () => {
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, canvas.width, headerHeight * scale);
        
        ctx.fillStyle = '#212529';
        ctx.font = `bold ${11 * scale}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(chartTitle, padding * scale, headerHeight * scale / 2);

        ctx.fillStyle = '#6c757d';
        ctx.font = `italic ${10 * scale}px sans-serif`;
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(epwLocation, canvas.width - (padding * scale), headerHeight * scale / 2);
        
        ctx.drawImage(img, 0, headerHeight * scale, svgWidth * scale, svgHeight * scale);

        const signatureY = headerHeight * scale + svgHeight * scale;
        ctx.fillStyle = '#f0f0f0';
        ctx.fillRect(0, signatureY, canvas.width, signatureHeight * scale);
        ctx.fillStyle = '#555';
        ctx.font = `bold ${signatureFontSize * scale}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const signatureText = "EPW Insights | ehsan-rostami.github.io";
        ctx.fillText(signatureText, canvas.width / 2, signatureY + (signatureHeight * scale / 2));
        
        const a = document.createElement("a");
        a.href = canvas.toDataURL("image/png");
        a.setAttribute("download", `${filename}.png`);
        a.dispatchEvent(new MouseEvent("click"));
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
}


/**
 * Export button
 * @param {string} containerSelector
 * @param {string} filename
 * @param {string} epwLocation
 */
function addExportButton(containerSelector, filename, epwLocation = '') {
    const container = d3.select(containerSelector);
    if (container.empty() || container.select('.export-button').size() > 0) return;

    const button = container.append('div')
        .attr('class', 'export-button')
        .on('click', function() {
            const svgNode = container.select('svg').node();
            const chartTitle = container.select('h5.chart-title-main').text();
            exportChartAsPNG(svgNode, filename, chartTitle, epwLocation);
        });
        
    button.append('img')
        .attr('src', 'img/camera-icon.png')
        .attr('alt', 'Export Chart')
        .style('width', '24px')
        .style('height', '24px');
}