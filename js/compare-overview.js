/*
 * EPW Insights
 * Author: Ehsan Rostami (https://github.com/ehsan-rostami)
 * Copyright (c) 2025 Ehsan Rostami
 * Released under the MIT License.
*/

/**
 * Side-by-side infographic
 * @param {object} epwDataA
 * @param {object} epwDataB
 */
async function renderOverviewCompare(epwDataA, epwDataB) {
    const container = d3.select("#compare-content-area").html('');
    showEnhancedLoadingIndicator(container);

    try {
        const locNameA = formatSimpleLocation(epwDataA.metadata.location.city, epwDataA.metadata.location.country, 'primary');
        const locNameB = formatSimpleLocation(epwDataB.metadata.location.city, epwDataB.metadata.location.country, 'comparison');

        const mainTitle = 'Climate Comparison Overview';
        const locationText = `${locNameA} vs. ${locNameB}`;

        container.html('');
        const chartWrapper = container.append('div').attr('class', 'chart-container');
        addExportButton(chartWrapper.node(), `overview-${locNameA}-vs-${locNameB}`, locationText);
        chartWrapper.append('h5').attr('class', 'chart-title-main').style('display', 'none').text(mainTitle);

        const margin = { top: 40, right: 40, bottom: 80, left: 40 };
        const width = 1200 - margin.left - margin.right;
        const height = 940 - margin.top - margin.bottom;

        const svg = chartWrapper.append("svg")
            .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
            .classed("comparison-overview-svg", true)
            .attr("font-family", "'Inter', 'Poppins', sans-serif");

        const defs = svg.append('defs');
        const bgGradient = defs.append('linearGradient')
            .attr('id', 'mainBgGradient')
            .attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%');
        bgGradient.append('stop').attr('offset', '0%').attr('stop-color', '#667eea');
        bgGradient.append('stop').attr('offset', '100%').attr('stop-color', '#764ba2');

        defs.append('pattern')
            .attr('id', 'bgPattern')
            .attr('width', 60).attr('height', 60)
            .attr('patternUnits', 'userSpaceOnUse')
            .append('circle')
            .attr('cx', 30).attr('cy', 30).attr('r', 2)
            .attr('fill', 'rgba(255,255,255,0.03)');

        const style = defs.append('style');
        style.text(`
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }
            .pattern-animate { animation: float 20s ease-in-out infinite; }
            @keyframes pulse {
                0% { r: 8; opacity: 0.4; }
                70% { r: 16; opacity: 0; }
                100% { r: 8; opacity: 0; }
            }
            .map-marker-glow-anim { animation: pulse 2s infinite ease-out; }
        `);

        const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
        
        svg.insert('rect', ':first-child')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .attr('fill', 'url(#mainBgGradient)');
            
        svg.insert('rect', ':first-child')
            .attr('width', width + margin.left + margin.right)
            .attr('height', height + margin.top + margin.bottom)
            .attr('fill', 'url(#bgPattern)')
            .attr('class', 'pattern-animate');

        const extractPeriodOfRecord = (metadata) => {
            const comments1 = metadata['COMMENTS 1'] || metadata.comments1 || '';
            if (comments1) {
                const match = comments1.match(/Period of Record=([\d]{4}-[\d]{4})/);
                if (match && match[1]) return match[1];
            }
            return 'N/A';
        };

        const processData = (epwData, fileType) => {
            const data = epwData.data;
            const location = epwData.metadata.location;
            const metadata = epwData.metadata;
            const n = data.length;

            const calcPrevailingWind = (data) => {
                if (!data || data.length === 0) return 'N/A';
                const directions = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
                const binSize = 360 / 16;
                const directionCounts = new Array(16).fill(0);
                data.forEach(h => {
                    if (h.windSpeed > 0.5) { 
                        const bin = Math.floor(h.windDirection / binSize) % 16;
                        directionCounts[bin]++;
                    }
                });
                if (d3.sum(directionCounts) === 0) return "Calm";
                return directions[d3.maxIndex(directionCounts)];
            };
            
            return {
                city: formatCityNameOnly(location.city, fileType),
                station: formatStationDetail(location.city, fileType),
                country: countryNameMap[location.country] || location.country,
                countryCode2: countryCodeMap[location.country],
                countryCode3: location.country,
                wmo: location.wmoStationNumber || 'N/A',
                period: extractPeriodOfRecord(metadata),
                lat: location.latitude,
                lon: location.longitude,
                elevation: location.elevation.toFixed(0) + ' m',
                avgTemp: (d3.sum(data, d => d.dryBulbTemperature) / n).toFixed(1) + ' °C',
                avgHumidity: (d3.sum(data, d => d.relativeHumidity) / n).toFixed(0) + ' %',
                avgSkyCover: (d3.sum(data, d => d.totalSkyCover) / n).toFixed(0) + '/10',
                annualSolar: (d3.sum(data, d => d.globalHorizontalRadiation) / 1000).toFixed(0) + ' kWh/m²',
                avgWind: (d3.sum(data, d => d.windSpeed) / n).toFixed(1) + ' m/s',
                windDirection: calcPrevailingWind(data)
            };
        };

        const dataA = processData(epwDataA, 'primary');
        const dataB = processData(epwDataB, 'comparison');

        g.append('defs').append('linearGradient').attr('id', 'titleGradient')
            .selectAll('stop').data([{offset: '0%', color: '#ffffff'}, {offset: '100%', color: '#e0e7ff'}])
            .join('stop').attr('offset', d => d.offset).attr('stop-color', d => d.color);

        g.append('text').attr('x', width / 2).attr('y', 30).attr('text-anchor', 'middle').attr('font-size', '36px')
            .attr('font-weight', '700').attr('fill', 'url(#titleGradient)').text('Climate Comparison');
        g.append('text').attr('x', width / 2).attr('y', 60).attr('text-anchor', 'middle').attr('font-size', '16px')
            .attr('font-weight', '400').attr('fill', 'rgba(255,255,255,0.8)').text(`${dataA.city} vs. ${dataB.city}`);

        const metrics = [
            { y: 140, title: 'Geographic Coordinates', valueA: `${dataA.lat.toFixed(2)}°N, ${dataA.lon.toFixed(2)}°E`, valueB: `${dataB.lat.toFixed(2)}°N, ${dataB.lon.toFixed(2)}°E`, icon: '🌍' },
            { y: 200, title: 'Elevation Above Sea Level', valueA: dataA.elevation, valueB: dataB.elevation, icon: '⛰️' },
            { y: 260, title: 'Average Temperature', valueA: dataA.avgTemp, valueB: dataB.avgTemp, icon: '🌡️' },
            { y: 320, title: 'Relative Humidity', valueA: dataA.avgHumidity, valueB: dataB.avgHumidity, icon: '💧' },
            { y: 380, title: 'Sky Cover', valueA: dataA.avgSkyCover, valueB: dataB.avgSkyCover, icon: '☁️' },
            { y: 440, title: 'Annual Solar Energy', valueA: dataA.annualSolar, valueB: dataB.annualSolar, icon: '☀️' },
            { y: 500, title: 'Wind Speed', valueA: dataA.avgWind, valueB: dataB.avgWind, icon: '💨' },
            { y: 560, title: 'Prevailing Wind', valueA: dataA.windDirection, valueB: dataB.windDirection, icon: '🧭' }
        ];

        const cardWidth = 380;
        const centerWidth = width - (2 * cardWidth);
        const cardSpacing = 40;
        const leftCardX = 0;
        const rightCardX = width - cardWidth;
        const centerX = leftCardX + cardWidth + (centerWidth / 2);

        const leftGradient = defs.append('linearGradient').attr('id', 'leftCardGradient').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%');
        leftGradient.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(59, 130, 246, 0.9)');
        leftGradient.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(29, 78, 216, 0.9)');
        const rightGradient = defs.append('linearGradient').attr('id', 'rightCardGradient').attr('x1', '0%').attr('y1', '0%').attr('x2', '100%').attr('y2', '100%');
        rightGradient.append('stop').attr('offset', '0%').attr('stop-color', 'rgba(168, 85, 247, 0.9)');
        rightGradient.append('stop').attr('offset', '100%').attr('stop-color', 'rgba(126, 34, 206, 0.9)');

async function renderModernCard(svgGroup, x, data, isLeft, gradientId) {
    const cardGroup = svgGroup.append('g').attr('transform', `translate(${x}, 100)`);

    cardGroup.append('rect').attr('width', cardWidth).attr('height', 680).attr('rx', 24)
        .attr('fill', `url(#${gradientId})`).attr('stroke', 'rgba(255,255,255,0.2)').attr('stroke-width', 1)
        .style('filter', 'drop-shadow(0 20px 40px rgba(0,0,0,0.3))');

    const headerGroup = cardGroup.append('g').attr('transform', 'translate(40, 40)');
    const contentCenterX = (cardWidth - 80) / 2;
    const flagWidth = 64, flagHeight = 48;
    const flagUrl = `https://flagcdn.com/h120/${(data.countryCode2 || '').toLowerCase()}.png`;

    const embeddedFlagUrl = await embedImageAsDataURL(flagUrl, 'https://placehold.co/64x48/666/fff?text=No+Flag');
    
    headerGroup.append('rect').attr('x', contentCenterX - (flagWidth + 8) / 2).attr('y', 0).attr('width', flagWidth + 8)
        .attr('height', flagHeight + 8).attr('rx', 8).attr('fill', 'rgba(255,255,255,0.2)');
    headerGroup.append('image').attr('href', embeddedFlagUrl).attr('x', contentCenterX - flagWidth / 2).attr('y', 4)
        .attr('width', flagWidth).attr('height', flagHeight);

    headerGroup.append('text').text(data.city).attr('x', contentCenterX).attr('y', flagHeight + 38).attr('text-anchor', 'middle')
        .attr('font-size', '28px').attr('font-weight', '700').attr('fill', 'white');
    headerGroup.append('text').text(data.country).attr('x', contentCenterX).attr('y', flagHeight + 61).attr('text-anchor', 'middle')
        .attr('font-size', '16px').attr('font-weight', '400').attr('fill', 'rgba(255,255,255,0.8)');

    const mapGroup = headerGroup.append('g').attr('transform', `translate(${contentCenterX - 60}, ${flagHeight + 80})`);
    await renderModernCountryMap(mapGroup, data.countryCode3, data.lat, data.lon);

    metrics.forEach((metric, i) => {
        const dataGroup = headerGroup.append('g').attr('transform', `translate(0, ${flagHeight + 220 + i * 45})`);
        dataGroup.append('rect').attr('x', 0).attr('y', -15).attr('width', cardWidth - 80).attr('height', 35).attr('rx', 8)
            .attr('fill', 'rgba(255,255,255,0.1)').attr('stroke', 'rgba(255,255,255,0.2)');
        dataGroup.append('text').text(`${metric.icon}   ${isLeft ? metric.valueA : metric.valueB}`)
            .attr('x', contentCenterX).attr('y', 5).attr('text-anchor', 'middle').attr('dominant-baseline', 'middle')
            .attr('font-size', '20px').attr('font-weight', '500').attr('fill', 'white');
    });
}

function renderCenterColumn(centerGroup) {
    const vsGroup = centerGroup.append('g').attr('transform', `translate(0, 60)`);
    vsGroup.append('circle').attr('r', 35).attr('fill', 'rgba(255,255,255,0.2)').attr('stroke', 'rgba(255,255,255,0.4)').attr('stroke-width', 2);
    vsGroup.append('text').text('VS').attr('text-anchor', 'middle').attr('dominant-baseline', 'middle').attr('font-size', '18px').attr('font-weight', '700').attr('fill', 'white');

    metrics.forEach((metric, i) => {
        const y = 314 + i * 45;
        const lineGroup = centerGroup.append('g');
        const labelHalfWidth = 110;
        const lineWidth = centerWidth - cardSpacing;

        lineGroup.append('line').attr('x1', -lineWidth / 2).attr('y1', y).attr('x2', -labelHalfWidth).attr('y2', y).attr('stroke', 'rgba(255,255,255,0.3)').attr('stroke-width', 1).attr('stroke-dasharray', '8,4');
        lineGroup.append('line').attr('x1', labelHalfWidth).attr('y1', y).attr('x2', lineWidth / 2).attr('y2', y).attr('stroke', 'rgba(255,255,255,0.3)').attr('stroke-width', 1).attr('stroke-dasharray', '8,4');
        lineGroup.append('rect').attr('x', -labelHalfWidth).attr('y', y - 15).attr('width', 220).attr('height', 35).attr('rx', 15).attr('fill', 'rgba(255,255,255,0.15)').attr('stroke', 'rgba(255,255,255,0.3)');
        lineGroup.append('text').text(metric.title).attr('x', 0).attr('y', y + 2).attr('text-anchor', 'middle').attr('dominant-baseline', 'middle').attr('font-size', '16px').attr('font-weight', '500').attr('fill', 'white');
    });
}

async function renderAllComponents() {
    const centerGroup = g.append('g').attr('transform', `translate(${centerX}, 100)`);
    renderCenterColumn(centerGroup);
    
    await Promise.all([
        renderModernCard(g, leftCardX, dataA, true, 'leftCardGradient'),
        renderModernCard(g, rightCardX, dataB, false, 'rightCardGradient')
    ]);
}

    await renderAllComponents();

        const footerY = height + 5;
        const footer = g.append('foreignObject')
            .attr('x', 0).attr('y', footerY).attr('width', width).attr('height', 60);

        const formatLocationDetail = (data) => {
            const wmo = data.wmo !== 'N/A' ? `WMO: ${data.wmo}` : '';
            const period = data.period !== 'N/A' ? `Period of Record: ${data.period}` : '';
            const details = [wmo, period].filter(Boolean).join(' - ');
            const detailString = details ? ` (${details})` : '';
            const station = (data.station && data.station !== data.city) ? `the <strong>${data.station}</strong> station in ` : '';
            return `${station}<strong>${data.city}</strong>${detailString}`;
        };

        const textA = formatLocationDetail(dataA);
        const textB = formatLocationDetail(dataB);
        
        footer.append('xhtml:div')
            .style('font-size', '14px').style('color', 'rgba(255, 255, 255, 0.75)')
            .style('text-align', 'center').style('line-height', '1.5')
            .html(`This comparison is based on data from the EPW files for ${textA} and ${textB}. For a more accurate and reliable comparison, it is recommended to use the most recent EPW files released for each location.`);


    } catch (error) {
        console.error("Error rendering overview comparison:", error);
        renderErrorState(container);
    }
}

/**
 * Fetches an image and converts it to a base64 data URL
 * @param {string} url
 * @param {string} fallbackUrl
 * @returns {Promise<string>}
 */
async function embedImageAsDataURL(url, fallbackUrl) {
    const fetchImage = async (imgUrl) => {
        const response = await fetch(imgUrl);
        if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    };

    try {
        return await fetchImage(url);
    } catch (error) {
        console.warn(`Primary image fetch failed for ${url}. Trying fallback.`, error);
        try {
            return await fetchImage(fallbackUrl);
        } catch (fallbackError) {
            console.error(`Fallback image fetch also failed for ${fallbackUrl}.`, fallbackError);
            return 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
        }
    }
}

function showEnhancedLoadingIndicator(container) {
    const loadingDiv = container.append('div').attr('class', 'loading-indicator')
        .style('display', 'flex').style('flex-direction', 'column').style('align-items', 'center')
        .style('justify-content', 'center').style('height', '500px').style('text-align', 'center')
        .style('background', 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)')
        .style('border-radius', '20px').style('color', 'white');
    
    loadingDiv.append('h3').style('color', 'white').style('margin', '20px 0 10px 0').style('font-size', '24px')
        .style('font-weight', '600').text('🌍 Analyzing Climate Data');
    loadingDiv.append('p').style('color', 'rgba(255,255,255,0.8)').style('margin', '0').style('font-size', '16px')
        .text('Creating your comparison dashboard...');
}

async function renderModernCountryMap(container, countryCode3, lat, lon) {
    const width = 120, height = 90;
    container.append('rect').attr('width', width).attr('height', height).attr('rx', 12)
        .attr('fill', 'rgba(255,255,255,0.1)').attr('stroke', 'rgba(255,255,255,0.3)');

    const geoSources = [
        'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json',
        'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_admin_0_countries.geojson'
    ];

    let worldData = null;

    for (const source of geoSources) {
        try {
            const data = await d3.json(source);
            if (data.type === "Topology") {
                if (typeof topojson === 'undefined') {
                    throw new Error("TopoJSON library is not loaded.");
                }
                worldData = topojson.feature(data, data.objects.countries);
            } else {
                worldData = data;
            }
            break; 
        } catch (error) {
            console.warn(`Failed to load from ${source}:`, error);
        }
    }

    if (!worldData) {
        renderModernFallbackMap(container, width, height, lat, lon);
        return;
    }

    try {
        const countryGeo = worldData.features.find(d =>
            d.properties.ISO_A3 === countryCode3 ||
            d.properties.ADM0_A3 === countryCode3 ||
            d.properties.iso_a3 === countryCode3 ||
            d.properties.sovereignt === countryCode3 ||
            d.properties.gu_a3 === countryCode3
        );

        if (!countryGeo) {
            renderModernFallbackMap(container, width, height, lat, lon);
            return;
        }

        let geometryForFitting = countryGeo;
        let geometryForDrawing = countryGeo;

        if (countryGeo.geometry.type === 'MultiPolygon' && countryGeo.geometry.coordinates.length > 1) {
            const largestPolygonIndex = d3.maxIndex(countryGeo.geometry.coordinates, p => d3.geoArea({ type: 'Polygon', coordinates: p }));
            const mainlandFeature = {
                type: 'Polygon',
                coordinates: countryGeo.geometry.coordinates[largestPolygonIndex]
            };

            const point = [lon, lat];
            const isPointInMainland = d3.geoContains(mainlandFeature, point);

            if (isPointInMainland) {
                geometryForFitting = mainlandFeature;
                geometryForDrawing = mainlandFeature;
            }
        }
        const projection = d3.geoMercator().fitSize([width - 4, height - 4], geometryForFitting);
        const path = d3.geoPath().projection(projection);

        container.append('g')
            .attr('transform', 'translate(2, 2)')
            .append('path')
            .datum(geometryForDrawing)
            .attr('d', path)
            .attr('fill', 'rgba(255,255,255,0.8)')
            .attr('stroke', 'rgba(255,255,255,0.9)')
            .attr('stroke-width', 1);

        const [x, y] = projection([lon, lat]);

        if (x && y && x > 0 && y > 0 && x < width - 4 && y < height - 4) {
            const markerGroup = container.append('g').attr('transform', `translate(${x + 2}, ${y + 2})`);
            markerGroup.append('circle').attr('class', 'map-marker-glow-anim').attr('fill', 'rgba(255, 0, 0, 0.4)');
            markerGroup.append('circle').attr('r', 4).attr('fill', 'white').attr('stroke', 'rgba(0,0,0,0.3)');
        }

    } catch (error) {
        console.error("Map rendering failed:", error);
        renderModernFallbackMap(container, width, height, lat, lon);
    }
}

function renderModernFallbackMap(container, width, height, lat, lon) {
    container.append('text').attr('x', width / 2).attr('y', height / 2 - 5).attr('text-anchor', 'middle')
        .attr('font-size', '12px').attr('font-weight', '500').attr('fill', 'rgba(255,255,255,0.9)').text('📍 Location');
    container.append('text').attr('x', width / 2).attr('y', height / 2 + 12).attr('text-anchor', 'middle')
        .attr('font-size', '10px').attr('fill', 'rgba(255,255,255,0.7)').text(`${lat.toFixed(1)}°, ${lon.toFixed(1)}°`);
}

function renderErrorState(container) {
    container.html('').append('div')
        .style('display', 'flex').style('flex-direction', 'column').style('align-items', 'center')
        .style('justify-content', 'center').style('height', '400px').style('text-align', 'center')
        .style('background', 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)')
        .style('border-radius', '20px').style('color', 'white').style('padding', '40px')
        .html(`<div style="font-size: 48px; margin-bottom: 20px;">⚠️</div>
               <h3 style="margin: 0 0 10px 0; font-size: 24px; font-weight: 600;">Unable to Load Comparison</h3>
               <p style="margin: 0; font-size: 16px; opacity: 0.9;">Please check data files and try again.</p>`);
}