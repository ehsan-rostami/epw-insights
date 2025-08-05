/*
 * EPW Insights
 * Author: Ehsan Rostami (https://github.com/ehsan-rostami)
 * Copyright (c) 2025 Ehsan Rostami
 * Released under the MIT License.
*/

function displayLocationSummary(epwData) {
    const summarySection = document.getElementById('summary-content');
    if (!summarySection || !epwData || !epwData.metadata || !epwData.metadata.location) {
        console.error('Could not find summary section or location data.');
        return;
    }

    const location = epwData.metadata.location;
    const data = epwData.data;
    if (data.length === 0) {
        summarySection.innerHTML = '<p class="text-danger">No hourly data found to calculate summary.</p>';
        return;
    }

    const countryCode = countryCodeMap[location.country];
    let flagHtml = '';
    if (countryCode) {
        flagHtml = `<img src="https://flagcdn.com/48x36/${countryCode}.png" alt="${location.country} flag" style="margin-right: 10px; height: 24px;">`;
    }

    const formattedLocation = formatLocationName(location.city, location.country, 'primary');

    const tempSum = d3.sum(data, d => d.dryBulbTemperature);
    const humiditySum = d3.sum(data, d => d.relativeHumidity);
    const radiationSum = d3.sum(data, d => d.globalHorizontalRadiation);
    const windSpeedSum = d3.sum(data, d => d.windSpeed);

    const avgTemp = (tempSum / data.length).toFixed(1);
    const avgHumidity = (humiditySum / data.length).toFixed(0);
    const totalRadiationKWh = (radiationSum / 1000).toFixed(0);
    const avgWindSpeed = (windSpeedSum / data.length).toFixed(1);

    summarySection.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-3">
             <div class="d-flex align-items-center">
                ${flagHtml}
                <div class="summary-title">${formattedLocation}</div>
             </div>
             <div class="summary-wmo">WMO: ${location.wmoStationNumber}</div>
        </div>
        <div class="summary-grid">
            <div class="summary-item">
                <img src="img/coordinates.png" alt="Coordinates" class="summary-icon">
                <div>
                    <span class="label">Coordinates</span>
                    <span class="value">${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°</span>
                </div>
            </div>
            <div class="summary-item">
                <img src="img/elevation.png" alt="Elevation" class="summary-icon">
                <div>
                    <span class="label">Elevation</span>
                    <span class="value">${location.elevation.toFixed(0)} m</span>
                </div>
            </div>
             <div class="summary-item">
                <img src="img/temperature.png" alt="Temperature" class="summary-icon">
                <div>
                    <span class="label">Average Dry Bulb Temperature</span>
                    <span class="value">${avgTemp} °C</span>
                </div>
            </div>
            <div class="summary-item">
                <img src="img/humidity.png" alt="Humidity" class="summary-icon">
                <div>
                    <span class="label">Average Relative Humidity</span>
                    <span class="value">${avgHumidity} %</span>
                </div>
            </div>
            <div class="summary-item">
                <img src="img/radiation.png" alt="Radiation" class="summary-icon">
                <div>
                    <span class="label">Annual Solar Energy</span>
                    <span class="value">${totalRadiationKWh} kWh/m²</span>
                </div>
            </div>
            <div class="summary-item">
                <img src="img/wind.png" alt="Wind" class="summary-icon">
                <div>
                    <span class="label">Average Wind Speed</span>
                    <span class="value">${avgWindSpeed} m/s</span>
                </div>
            </div>
        </div>
    `;
}