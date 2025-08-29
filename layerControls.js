import { baseLayers, airportLayer, rainviewer_satellite, rainviewer_radar, metarLayer, tafLayer, metarWeatherLayer, sigmetLayer, customLayers } from './layers.js';
import { flightCategoryColors, weatherElements, imageBounds, sigmetHazardLabels, sigmetIconMap, indianFIRs } from './constants.js';
import { loadAirports, loadMETARs, loadTAFs, loadSIGMETs } from './dataLoaders.js';
import { updateTimeDimensionVisibility, getSigmetHazardColor } from './utils.js';
import * as forecastSlider from './forecastSlider.js'; // Import all exports from forecastSlider

// ----- Define a separate SIGMET legend control -----
const sigmetLegend = L.control({ position: 'bottomleft' });
sigmetLegend.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'sigmet-legend leaflet-control');
    div.innerHTML = "<strong>Hazards</strong><br/>";
    // Populate SIGMET legend from fetched data
    fetch("./currentwx/isigmet.json")
        .then(res => res.json())
        .then(data => {
            const foundHazards = new Map();
            data.forEach(sigmet => {
                if (sigmet.geom !== "AREA" || !Array.isArray(sigmet.coords)) return;
                const hazard = sigmet.hazard || "Unknown";
                if (!foundHazards.has(hazard)) {
                    foundHazards.set(hazard, {
                        color: getSigmetHazardColor(hazard),
                        label: sigmetHazardLabels[hazard] || hazard,
                        icon: sigmetIconMap[hazard]
                    });
                }
            });
            if (foundHazards.size > 0) {
                foundHazards.forEach((info, hazard) => {
                    div.innerHTML += `
                        <div style="margin-bottom:6px; display:flex; align-items:center;">
                            <img src="icons/${info.icon}" width="16" height="16" style="margin-right:6px;" />
                            <span style="color:${info.color}; font-weight:bold;">
                                ${info.label} (${hazard})
                            </span>
                        </div>`;
                });
            } else {
                div.innerHTML += '<div style="font-size:10px;">No active SIGMETs</div>';
            }
        })
        .catch(err => {
            console.error("SIGMET legend fetch error:", err);
            div.innerHTML = "<strong>Legend unavailable</strong>";
        });
    return div;
};

// ----- Define a separate METAR legend control (Flight Category Legend) -----
const metarLegend = L.control({ position: 'bottomleft' });
metarLegend.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'flight-category-legend leaflet-control');
    div.innerHTML = `
         <strong>Flight Category</strong>
         <div><span style="color:#00aa00">■</span> VFR</div>
         <div><span style="color:#0000ff">■</span> MVFR</div>
         <div><span style="color:#ff0000">■</span> IFR</div>
         <div><span style="color:#aa00aa">■</span> LIFR</div>
    `;
    return div;
};

export function setupLayerControls(map, timeControl) {
    const baseMapsContainer = document.getElementById('baseMapsContainer');
    const weatherLayersContainer = document.getElementById('weatherLayersContainer');
    const forecastElementsContainer = document.getElementById('forecastElementsContainer');

    // ------------------
    // Base maps (only map styles)
    Object.entries(baseLayers).forEach(([name, layer]) => {
        const item = document.createElement('div');
        item.className = 'layer-control-item';
        item.innerHTML = `
            <input type="radio" name="baseMap" id="base-${name}"
                 ${name === "Dark" ? "checked" : ""}>
            <label for="base-${name}">${name}</label>
        `;
        item.querySelector('input').addEventListener('change', () => {
            if (item.querySelector('input').checked) {
                Object.values(baseLayers).forEach(l => map.removeLayer(l));
                layer.addTo(map);
            }
        });
        baseMapsContainer.appendChild(item);
    });

    // ------------------
    // Airport layer checkbox
    document.getElementById('base-Airports').addEventListener('change', (e) => {
        if (e.target.checked) {
            airportLayer.addTo(map);
            loadAirports(map);
        } else {
            map.removeLayer(airportLayer);
        }
    });

    // ------------------
    // Wind layer loading and checkbox insertion (using jQuery)
    $.getJSON("./currentwx/850wind.json", function (data) {
        const velocityLayer = L.velocityLayer({
            displayValues: true,
            displayOptions: { velocityType: "Global Wind", position: "bottomleft", emptyString: "No wind data" },
            data: data, maxVelocity: 20
        });
        customLayers["Wind - Global"] = velocityLayer;
        const item = document.createElement('div');
        item.className = 'layer-control-item';
        item.innerHTML = `<input type="checkbox" id="weather-Wind-Global" checked><label for="weather-Wind-Global">Winds</label>`;
        const checkbox = item.querySelector('input');
        checkbox.addEventListener('change', (e) => {
            if (e.target.checked) { velocityLayer.addTo(map); } else { map.removeLayer(velocityLayer); }
        });
        velocityLayer.addTo(map);
        const firstWeatherItem = weatherLayersContainer.firstChild;
        weatherLayersContainer.insertBefore(item, firstWeatherItem);
    });

    // ------------------
    // Weather layers checkbox controls
    const weatherLayers = {
        "Weather": metarWeatherLayer,
        "METAR": metarLayer,
        "TAF": tafLayer,
        "SIGMET": sigmetLayer,
        "Satellite": rainviewer_satellite,
        "Radar": rainviewer_radar
    };

    Object.entries(weatherLayers).forEach(([name, layer]) => {
        const item = document.createElement('div');
        item.className = 'layer-control-item';
        const iconName = name.toLowerCase().replace(/\s+/g, '');
        item.innerHTML = `
            <img src="icons/${iconName}.png" class="layer-icon" id="weather-${name.replace(/\s+/g, '-')}" alt="${name}" title="${name}">
        `;
        const icon = item.querySelector('img');
        icon.addEventListener('click', (e) => {
            const isActive = icon.classList.toggle('active');
            if (isActive) {
                layer.addTo(map);
                if (name === "METAR") {
                    metarLegend.addTo(map);
                }
                if (name === "SIGMET") {
                    loadSIGMETs(map); // Load SIGMET data when layer is selected
                    map.addLayer(layer);
                    sigmetLegend.addTo(map);
                }
            } else {
                map.removeLayer(layer);
                if (name === "METAR") {
                    map.removeControl(metarLegend);
                }
                if (name === "SIGMET") {
                    map.removeControl(sigmetLegend);
                }
            }
            updateTimeDimensionVisibility(timeControl);
        });
        weatherLayersContainer.appendChild(item);
    });

    // ------------------
    // Forecast elements with checkbox control
    Object.entries(weatherElements).forEach(([key, config]) => {
        const item = document.createElement('div');
        item.className = 'layer-control-item';
        item.innerHTML = `
            <input type="checkbox" id="forecast-${key.replace(/\s+/g, '-')}">
            <label for="forecast-${key.replace(/\s+/g, '-')}">${config.name}</label>
        `;
        const checkbox = item.querySelector('input');

        checkbox.addEventListener('change', (e) => {
            const timeSliderControl = document.getElementById('timeSliderControl');
            if (!timeSliderControl) {
                console.error("Error: timeSliderControl element not found!");
                return;
            }
            if (e.target.checked) {
                // Deactivate any other forecast element checkbox
                document.querySelectorAll('#forecastElementsContainer input[type="checkbox"]').forEach(cb => {
                    if (cb !== checkbox) cb.checked = false;
                });
                const currentFLayer = forecastSlider.getCurrentForecastLayer();
                if (currentFLayer) currentFLayer.remove();
                timeSliderControl.style.display = 'block';
                const newForecastLayer = L.imageOverlay(
                    `./images/${config.folder}/12h_${config.suffix}`,
                    imageBounds,
                    { opacity: config.opacity }
                ).addTo(map);
                forecastSlider.setCurrentForecastLayer(newForecastLayer);
                forecastSlider.setCurrentForecastConfig(config);
                forecastSlider.updateSliderDisplay(2);
                document.getElementById('timeSlider').value = 2;
                forecastSlider.pauseSlider();
            } else {
                const currentFLayer = forecastSlider.getCurrentForecastLayer();
                if (currentFLayer) currentFLayer.remove();
                forecastSlider.setCurrentForecastLayer(null);
                forecastSlider.setCurrentForecastConfig(null);
                timeSliderControl.style.display = 'none';
                forecastSlider.pauseSlider();
            }
        });
        forecastElementsContainer.appendChild(item);
    });

    // Initialize forecast slider controls (attach event listeners)
    forecastSlider.initForecastSlider(map);
}