// main.js
import { initializeMap } from './mapInit.js';
import { loadBoundary, loadMETARs, loadTAFs } from './dataLoaders.js'; // Removed loadSIGMETs import from here
import { setupLayerControls } from './layerControls.js';
import { baseLayers, metarWeatherLayer, boundaryLayer } from './layers.js'; // Removed sigmetLayer import from here

// Wait for the DOM to be fully loaded before initializing
document.addEventListener('DOMContentLoaded', () => {
    const { map, timeControl } = initializeMap();

    // Add default base layer
    baseLayers["Dark"].addTo(map);

    // Add layers that are visible by default
    metarWeatherLayer.addTo(map);
    boundaryLayer.addTo(map);
    // sigmetLayer.addTo(map); // REMOVED: SIGMET will be added on demand via layer control

    // Ensure the map is ready, then load data
    map.whenReady(() => {
        loadBoundary(map);
        loadMETARs();
        loadTAFs();
        // loadSIGMETs(map); // REMOVED: SIGMET data loading is now triggered by its checkbox
        
        // Setup UI controls for layers (including SIGMET checkbox and legend)
        setupLayerControls(map, timeControl);

        // Set up periodic refresh (20 minutes)
        setInterval(() => {
            loadMETARs();
            loadTAFs();
            // loadSIGMETs(map); // REMOVED: SIGMET data loading is now triggered by its checkbox/legend logic
        }, 1200000); // 20 minutes in milliseconds

        // Side panel toggle button
        document.getElementById('toggleBtn').addEventListener('click', () => {
            document.getElementById('sidePanel').classList.toggle('open');
        });
    });
});