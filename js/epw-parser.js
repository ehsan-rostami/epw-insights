/*
 * EPW Insights
 * Author: Ehsan Rostami (https://github.com/ehsan-rostami)
 * Copyright (c) 2025 Ehsan Rostami
 * Released under the MIT License.
*/

/**
 * Parses the text content of an EPW file
 * @param {string} epwString
 * @returns {object}
 */
function parseEPW(epwString) {
    try {
        const lines = epwString.split(/\r\n|\n|\r/);
        const result = {
            metadata: {},
            data: []
        };

        const dataFieldHeaders = [
            'year', 'month', 'day', 'hour', 'minute', 'dataSource',
            'dryBulbTemperature', 'dewPointTemperature', 'relativeHumidity',
            'atmosphericStationPressure', 'extraterrestrialHorizontalRadiation',
            'extraterrestrialDirectNormalRadiation', 'horizontalInfraredRadiationIntensity',
            'globalHorizontalRadiation', 'directNormalRadiation', 'diffuseHorizontalRadiation',
            'globalHorizontalIlluminance', 'directNormalIlluminance', 'diffuseHorizontalIlluminance',
            'zenithLuminance', 'windDirection', 'windSpeed', 'totalSkyCover',
            'opaqueSkyCover', 'visibility', 'ceilingHeight', 'presentWeatherObservation',
            'presentWeatherCodes', 'precipitableWater', 'aerosolOpticalDepth',
            'snowDepth', 'daysSinceLastSnowfall', 'albedo', 'liquidPrecipitationDepth',
            'liquidPrecipitationQuantity'
        ];

        const headerLines = lines.slice(0, 8);
        headerLines.forEach(line => {
            const parts = line.split(',');
            const type = parts[0].trim();
            
            switch (type) {
                case 'LOCATION':
                    result.metadata.location = {
                        city: parts[1].trim(),
                        stateProvince: parts[2].trim(),
                        country: parts[3].trim(),
                        source: parts[4].trim(),
                        wmoStationNumber: parts[5].trim(),
                        latitude: parseFloat(parts[6]),
                        longitude: parseFloat(parts[7]),
                        timeZone: parseFloat(parts[8]),
                        elevation: parseFloat(parts[9])
                    };
                    break;
                case 'DESIGN CONDITIONS':
                    if (!result.metadata.designConditions) result.metadata.designConditions = [];
                    result.metadata.designConditions.push(parts.slice(1));
                    break;
                case 'TYPICAL/EXTREME PERIODS':
                     if (!result.metadata.typicalExtremePeriods) result.metadata.typicalExtremePeriods = [];
                    result.metadata.typicalExtremePeriods.push(parts.slice(1));
                    break;
                case 'GROUND TEMPERATURES':
                     if (!result.metadata.groundTemperatures) result.metadata.groundTemperatures = [];
                    result.metadata.groundTemperatures.push(parts.slice(1));
                    break;
                case 'HOLIDAYS/DAYLIGHT SAVING':
                    result.metadata.holidays = {
                        leapYearObserved: parts[1].trim(),
                        daylightSavingStartDate: parts[2].trim(),
                        daylightSavingEndDate: parts[3].trim(),
                        numberOfHolidays: parseInt(parts[4], 10),
                    };
                    break;
                case 'COMMENTS 1':
                    result.metadata.comments1 = parts.slice(1).join(',').trim();
                    break;
                case 'COMMENTS 2':
                    result.metadata.comments2 = parts.slice(1).join(',').trim();
                    break;
                case 'DATA PERIODS':
                    if (!result.metadata.dataPeriods) result.metadata.dataPeriods = [];
                    result.metadata.dataPeriods.push({
                        numberOfPeriods: parseInt(parts[1], 10),
                        recordsPerHour: parseInt(parts[2], 10),
                        periodName: parts[3].trim(),
                        startDayOfWeek: parts[4].trim(),
                        startDate: parts[5].trim(),
                        endDate: parts[6].trim()
                    });
                    break;
            }
        });
        
        const dataLines = lines.slice(8);
        dataLines.forEach(line => {
            if (line.trim() === '') return;

            const values = line.split(',');
            const hourlyData = {};
            
            dataFieldHeaders.forEach((header, index) => {
                const value = values[index];
                if (index !== 5) {
                    const cleanValue = value.trim().startsWith('99') ? 'NaN' : value;
                    hourlyData[header] = parseFloat(cleanValue);
                } else {
                    hourlyData[header] = value;
                }
            });

            const jsHour = hourlyData.hour - 1;
            const jsMinute = hourlyData.minute === 60 ? 0 : hourlyData.minute;

            const date = new Date(
                hourlyData.year,
                hourlyData.month - 1,
                hourlyData.day,
                jsHour,
                jsMinute 
            );
            
            hourlyData.datetime = date;
            result.data.push(hourlyData);
        });

        if (result.data.length < 8760 && result.data.length > 0) {
            console.warn(`Parsed EPW file contains ${result.data.length} data records. A full year is 8760.`);
        }
        return result;

    } catch (error) {
        console.error("Error parsing EPW file:", error);
        throw new Error("Failed to parse the EPW file. Please ensure it is a valid, text-based EPW file.");
    }
}