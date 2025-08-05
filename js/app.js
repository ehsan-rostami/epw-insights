/*
 * EPW Insights
 * Author: Ehsan Rostami (https://github.com/ehsan-rostami)
 * Copyright (c) 2025 Ehsan Rostami
 * Released under the MIT License.
*/

let epwDataObject = null;
let comparisonDataObject = null;

window.customLocationNames = {
    primary: { city: null, station: null },
    comparison: { city: null, station: null },
};

const statusIcons = {
    inactive: ``,
    success: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/></svg>`,
    failure: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/></svg>`
};

document.addEventListener('DOMContentLoaded', () => {
    updateFileStatus('primary', 'inactive', 'No file loaded');
    updateFileStatus('comparison', 'inactive', 'Compare disabled');

    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input-control');
    setupFileInput(dropZone, fileInput, (file) => handleFile(file, 'primary'));

    const dropZoneCompare = document.getElementById('drop-zone-compare');
    const fileInputCompare = document.getElementById('file-input-compare');
    setupFileInput(dropZoneCompare, fileInputCompare, (file) => handleFile(file, 'comparison'));

    const compareToggle = document.getElementById('compare-toggle-checkbox');
    compareToggle.addEventListener('change', function() {
        const comparisonWrapper = document.getElementById('comparison-drop-zone-wrapper');
        comparisonWrapper.classList.toggle('inactive', !this.checked);
        if (!this.checked) {
            comparisonDataObject = null;
            if (!document.getElementById('load-example-toggle').checked) {
                updateFileStatus('comparison', 'inactive', 'Compare disabled');
            }
        } else {
             if (!document.getElementById('load-example-toggle').checked) {
                updateFileStatus('comparison', 'inactive', 'No file loaded');
            }
        }
        updateCompareTabVisibility();
        setupLocationEditor();
    });

    const loadExampleToggle = document.getElementById('load-example-toggle');
    loadExampleToggle.addEventListener('change', function() {
        const isChecked = this.checked;
        const compareToggle = document.getElementById('compare-toggle-checkbox');

        if (isChecked) {
            toggleExampleMode(true);
            loadExampleFiles();
        } else {
            epwDataObject = null;
            comparisonDataObject = null;
            
            resetUI();
            updateFileStatus('primary', 'inactive', 'No file loaded');
            updateFileStatus('comparison', 'inactive', 'Compare disabled');

            compareToggle.checked = false;
            compareToggle.dispatchEvent(new Event('change'));

            toggleExampleMode(false);
        }
    });

    const vizTabs = document.querySelectorAll('#viz-tabs button[data-bs-toggle="tab"]');
    vizTabs.forEach(tab => {
        tab.addEventListener('shown.bs.tab', (event) => {
            if (epwDataObject) { renderVisibleTabCharts(event.target.id); }
        });
    });

    document.getElementById('primary-city-input').addEventListener('input', (e) => handleNameChange('primary', 'city', e.target.value));
    document.getElementById('primary-station-input').addEventListener('input', (e) => handleNameChange('primary', 'station', e.target.value));
    document.getElementById('comparison-city-input').addEventListener('input', (e) => handleNameChange('comparison', 'city', e.target.value));
    document.getElementById('comparison-station-input').addEventListener('input', (e) => handleNameChange('comparison', 'station', e.target.value));

    document.getElementById('toggle-editor-btn').addEventListener('click', toggleEditorVisibility);
    document.getElementById('close-editor-btn').addEventListener('click', toggleEditorVisibility);
});

function toggleEditorVisibility() {
    const notesPanel = document.getElementById('notes-panel');
    const editorPanel = document.getElementById('location-editor-panel');
    const isEditorVisible = editorPanel.style.display === 'block';

    notesPanel.style.display = isEditorVisible ? 'block' : 'none';
    editorPanel.style.display = isEditorVisible ? 'none' : 'block';
}

function handleNameChange(fileType, nameType, value) {
    window.customLocationNames[fileType][nameType] = value.trim() !== '' ? value.trim() : null;

    if (epwDataObject) {
        displayLocationSummary(epwDataObject);
    }
    renderAllCharts();
}

function setupLocationEditor() {
    if (!epwDataObject) return;

    document.getElementById('toggle-editor-btn').style.display = 'block';

    const locPrimary = epwDataObject.metadata.location;
    document.getElementById('primary-city-input').value = formatCityNameOnly(locPrimary.city, 'primary') || '';
    document.getElementById('primary-station-input').value = formatStationDetail(locPrimary.city, 'primary') || '';

    const comparisonHeader = document.getElementById('comparison-header');
    const comparisonCityInput = document.getElementById('comparison-city-input');
    const comparisonStationInput = document.getElementById('comparison-station-input');
    const compareToggle = document.getElementById('compare-toggle-checkbox');

    if (comparisonDataObject && compareToggle.checked) {
        const locCompare = comparisonDataObject.metadata.location;
        comparisonHeader.style.display = 'block';
        comparisonCityInput.style.display = 'block';
        comparisonStationInput.style.display = 'block';
        
        comparisonCityInput.value = formatCityNameOnly(locCompare.city, 'comparison') || '';
        comparisonStationInput.value = formatStationDetail(locCompare.city, 'comparison') || '';

        document.querySelector('.location-editor-grid').style.gridTemplateColumns = 'auto 1fr 1fr';
    } else {
        comparisonHeader.style.display = 'none';
        comparisonCityInput.style.display = 'none';
        comparisonStationInput.style.display = 'none';
        document.querySelector('.location-editor-grid').style.gridTemplateColumns = 'auto 1fr';

    }
}

function toggleExampleMode(isExampleMode) {
    const primaryDropZoneWrapper = document.getElementById('drop-zone').parentElement;
    const comparisonDropZoneWrapper = document.getElementById('comparison-drop-zone-wrapper');
    const compareToggle = document.getElementById('compare-toggle-checkbox');
    const compareToggleLabel = document.querySelector('label[for="compare-toggle-checkbox"]');

    if (isExampleMode) {
        primaryDropZoneWrapper.style.pointerEvents = 'none';
        primaryDropZoneWrapper.style.opacity = '0.5';
        comparisonDropZoneWrapper.style.pointerEvents = 'none';
        comparisonDropZoneWrapper.style.opacity = '0.5';
        
        compareToggle.disabled = true;
        compareToggleLabel.classList.add('text-muted');

        compareToggle.checked = true;
        compareToggle.dispatchEvent(new Event('change'));

    } else {
        primaryDropZoneWrapper.style.pointerEvents = 'auto';
        primaryDropZoneWrapper.style.opacity = '1';
        
        comparisonDropZoneWrapper.style.pointerEvents = '';
        comparisonDropZoneWrapper.style.opacity = '';

        compareToggle.disabled = false;
        compareToggleLabel.classList.remove('text-muted');
    }
}

async function loadExampleFiles() {
    showLoadingIndicator();
    hideError();

    const primaryFilePath = 'epw/Tehran.epw';
    const comparisonFilePath = 'epw/London.epw';

    try {
        const [primaryResponse, comparisonResponse] = await Promise.all([
            fetch(primaryFilePath),
            fetch(comparisonFilePath)
        ]);

        if (!primaryResponse.ok || !comparisonResponse.ok) {
            throw new Error('Could not fetch one or both example EPW files.');
        }

        const [primaryText, comparisonText] = await Promise.all([
            primaryResponse.text(),
            comparisonResponse.text()
        ]);
        
        epwDataObject = parseEPW(primaryText);
        comparisonDataObject = parseEPW(comparisonText);

        if (!epwDataObject || !comparisonDataObject) {
            throw new Error("Failed to parse one or both example files.");
        }

        window.customLocationNames = { primary: { city: null, station: null }, comparison: { city: null, station: null } };

        updateFileStatus('primary', 'success', 'Tehran.epw');
        updateFileStatus('comparison', 'success', 'London.epw');

        resetUI();
        displayLocationSummary(epwDataObject);
        const loc = epwDataObject.metadata.location;
        if (loc) { displayLocationOnMap(loc.latitude, loc.longitude, loc.city); }
        document.getElementById('visualization-container').classList.remove('visually-hidden');
        renderAllCharts();
        updateCompareTabVisibility();
        setupLocationEditor();

    } catch (error) {
        showError(error.message);
        updateFileStatus('primary', 'failure', 'Example load failed');
        updateFileStatus('comparison', 'failure', 'Example load failed');
        epwDataObject = null;
        comparisonDataObject = null;
        resetUI();
    } finally {
        hideLoadingIndicator();
    }
}

function setupFileInput(dropZone, fileInput, callback) {
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.add('drag-over'); });
    dropZone.addEventListener('dragleave', (e) => { e.preventDefault(); e.stopPropagation(); dropZone.classList.remove('drag-over'); });
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault(); e.stopPropagation();
        dropZone.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        if (files.length) { callback(files[0]); }
    });
    fileInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files.length) { callback(files[0]); }
    });
}

function updateFileStatus(type, status, message) {
    const indicator = d3.select(`#${type}-file-status`);
    indicator.html(`${statusIcons[status]} ${message}`)
        .attr('class', `file-status-indicator status-${status}`);
}

function handleFile(file, type) {
    if (!file.name.toLowerCase().endsWith('.epw')) {
        showError('Invalid file type. Please select an EPW file.');
        updateFileStatus(type, 'failure', 'Invalid file type');
        return;
    }
    showLoadingIndicator();
    hideError();

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const parsedData = parseEPW(e.target.result);
            if (!parsedData || !parsedData.data || parsedData.data.length === 0) {
                throw new Error("Parsed data is empty or invalid.");
            }
            updateFileStatus(type, 'success', file.name);

            if (type === 'primary') {
                epwDataObject = parsedData;
                window.customLocationNames.primary = { city: null, station: null };
                resetUI();
                displayLocationSummary(epwDataObject);
                const loc = epwDataObject.metadata.location;
                if (loc) { displayLocationOnMap(loc.latitude, loc.longitude, loc.city); }
                document.getElementById('visualization-container').classList.remove('visually-hidden');
                renderAllCharts();
            } else {
                comparisonDataObject = parsedData;
                window.customLocationNames.comparison = { city: null, station: null };
            }
            updateCompareTabVisibility();
            setupLocationEditor();
        } catch (error) {
            showError(error.message);
            updateFileStatus(type, 'failure', 'Parsing failed');
        } finally {
            hideLoadingIndicator();
        }
    };
    reader.onerror = () => { 
        hideLoadingIndicator(); 
        showError('Error reading the selected file.');
        updateFileStatus(type, 'failure', 'Read error');
    };
    reader.readAsText(file);
}

function updateCompareTabVisibility() {
    const compareToggle = document.getElementById('compare-toggle-checkbox');
    const compareTabButton = document.getElementById('compare-tab');
    if (compareToggle.checked && epwDataObject && comparisonDataObject) {
        compareTabButton.classList.remove('disabled');
        compareTabButton.removeAttribute('tabindex');
    } else {
        compareTabButton.classList.add('disabled');
        compareTabButton.setAttribute('tabindex', '-1');
    }
}

function renderVisibleTabCharts(tabId) {
    if (!epwDataObject) return;
    switch (tabId) {
        case 'air-temp-tab': if (typeof renderAirTemperatureCharts === 'function') { renderAirTemperatureCharts(epwDataObject); } break;
        case 'rel-humidity-tab': if (typeof renderRelativeHumidityCharts === 'function') { renderRelativeHumidityCharts(epwDataObject); } break;
        case 'sky-cover-tab': if (typeof renderSkyCoverCharts === 'function') { renderSkyCoverCharts(epwDataObject); } break;
        case 'wind-tab': if (typeof renderWindCharts === 'function') { renderWindCharts(epwDataObject); } break;
        case 'solar-rad-tab': if (typeof renderSolarRadiationCharts === 'function') { renderSolarRadiationCharts(epwDataObject); } break;
        case 'sun-path-tab': if (typeof renderSunPathChart === 'function') { renderSunPathChart(epwDataObject); } break;
        case 'psychro-chart-tab': if (typeof renderPsychrometricChart === 'function') { renderPsychrometricChart(epwDataObject); } break;
        case 'data-tables-tab': if (typeof renderDataTables === 'function') { renderDataTables(epwDataObject); } break;
        case 'compare-tab': if (typeof renderCompareCharts === 'function') { renderCompareCharts(epwDataObject, comparisonDataObject); } break;
    }
}

function resetUI() {
    hideError();
    document.getElementById('visualization-container').classList.add('visually-hidden');
    document.querySelectorAll('.chart-container, .left-panel, .data-table-container, #monthly-wind-roses-chart').forEach(container => {
        if(container) container.innerHTML = '';
    });
    document.getElementById('summary-content').innerHTML = '';
    if (window.map) {
        window.map.remove();
        window.map = null;
        document.getElementById('map-container').innerHTML = '';
    }
    
    document.getElementById('notes-panel').style.display = 'block';
    document.getElementById('location-editor-panel').style.display = 'none';
    document.getElementById('toggle-editor-btn').style.display = 'none';
}

function showLoadingIndicator() { d3.select('#loading-indicator').style('display', 'flex'); }
function hideLoadingIndicator() { d3.select('#loading-indicator').style('display', 'none'); }
function showError(message) { d3.select('#error-alert').text(message).style('display', 'block'); }
function hideError() { d3.select('#error-alert').style('display', 'none'); }

function renderAllCharts() {
    const activeTab = document.querySelector('#viz-tabs .nav-link.active');
    if (activeTab) {
        renderVisibleTabCharts(activeTab.id);
    }
}