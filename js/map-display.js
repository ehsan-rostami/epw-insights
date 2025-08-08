/*
 * EPW Insights
 * Author: Ehsan Rostami (https://github.com/ehsan-rostami)
 * Copyright (c) 2025 Ehsan Rostami
 * Released under the MIT License.
*/

var map = null;

/**
 * Initializes
 * @param {number} latitude
 * @param {number} longitude
 * @param {string} locationName
 */
function displayLocationOnMap(latitude, longitude, locationName) {
    const mapContainer = document.getElementById('map-container');
    if (!mapContainer) {
        console.error('Map container not found!');
        return;
    }

    if (map) {
        map.remove();
        map = null;
    }

    map = L.map('map-container', {
        scrollWheelZoom: false,
        zoomControl: false
    }).setView([latitude, longitude], 4);

    L.control.zoom({
    position: 'bottomright'
    }).addTo(map);

    map.on('click', function() {
        if (map.scrollWheelZoom.enabled()) {
            map.scrollWheelZoom.disable();
        } else {
            map.scrollWheelZoom.enable();
        }
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd'
    }).addTo(map);

    var customIcon = L.icon({
        iconUrl: 'img/marker-icon.png',
        iconSize: [28, 28],
        iconAnchor: [19, 38],
        popupAnchor: [0, -38],
        className: 'my-custom-marker'
    });

    L.marker([latitude, longitude], {icon: customIcon}).addTo(map);

    setTimeout(() => {
        if (map) {
            map.invalidateSize();
        }
    }, 100);

    setupMapResizeHandler();
}

function setupMapResizeHandler() {
    let resizeTimeout;
    
    function handleMapResize() {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            if (map) {
                map.invalidateSize({
                    animate: false,
                    pan: false
                });
                
                setTimeout(() => {
                    if (map) {
                        map.invalidateSize(true);
                    }
                }, 50);
            }
        }, 100);
    }
    
    window.addEventListener('resize', handleMapResize);
    
    window.addEventListener('orientationchange', () => {
        setTimeout(handleMapResize, 200);
    });
    
    if (window.ResizeObserver) {
        const mapContainer = document.getElementById('map-container');
        if (mapContainer) {
            const resizeObserver = new ResizeObserver(handleMapResize);
            resizeObserver.observe(mapContainer);
        }
    }
}