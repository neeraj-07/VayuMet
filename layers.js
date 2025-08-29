// layers.js
// Base maps
export const baseLayers = {
    "Dark": L.tileLayer("https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png", {
        attribution: "© CartoDB",
        subdomains: "abcd"
    }),
    "Light": L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png", {
        attribution: "© CartoDB",
        subdomains: "abcd"
    })
};

// Airport layer
export let airportLayer = L.layerGroup({ className: 'airport-layer' });

// RainViewer layers
export let rainviewer_satellite = L.timeDimension.layer.rainviewer(
    "https://api.rainviewer.com/public/weather-maps.json",
    { type: 'satellite', opacity: 0.7 }
);
export let rainviewer_radar = L.timeDimension.layer.rainviewer(
    "https://api.rainviewer.com/public/weather-maps.json",
    { opacity: 0.9 }
);

// Data layers
export let metarLayer = L.layerGroup();
export let tafLayer = L.layerGroup();
export let sigmetLayer = L.layerGroup(); // New SIGMET layer
export let metarWeatherLayer = L.layerGroup(); // Will be added in main.js
export let boundaryLayer = L.layerGroup();     // Will be added in main.js

// Custom wind layer (will be initialized later, but declared here)
export let customLayers = {
    "Wind - Global": null
};