// dataLoaders.js
import { showLoading, getWeatherIcon, getSkyCover, formatTime, getSigmetHazardColor } from './utils.js';
import { airportLayer, metarLayer, metarWeatherLayer, tafLayer, boundaryLayer, sigmetLayer } from './layers.js';
import { flightCategoryColors, sigmetIconMap, sigmetHazardLabels, indianFIRs } from './constants.js';
import { createTAFPopup } from './tafRenderer.js';

let tafMarkers = {}; // Keep local if not externally toggled, else export

export function loadAirports(map) {
    showLoading(true);
    Papa.parse("./map/airport.csv", {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            airportLayer.clearLayers();
            results.data.forEach(function(row) {
                if (row.latitude && row.longitude && row.stnid) {
                    L.marker([parseFloat(row.latitude), parseFloat(row.longitude)], {
                        icon: L.divIcon({ className: 'station-label', html: row.stnid, iconSize: [100, 20], iconAnchor: [15, 10] }),
                        interactive: false                    }).addTo(airportLayer);
                    L.circleMarker([parseFloat(row.latitude), parseFloat(row.longitude)], {
                        radius: .1, fillColor: "#0078d4", color: "#fff", weight: .1, opacity: 1, fillOpacity: 0.8, className: 'airport-marker'
                    }).bindPopup(`<strong>${row.stn}</strong><br><b>ICAO:</b> ${row.icao || 'N/A'}<br><b>Station ID:</b> ${row.stnid || 'N/A'}`).addTo(airportLayer);
                }            });
            showLoading(false);
        },
        error: function(error) { console.error("Error loading airport data:", error); showLoading(false); }
    });
}

export function loadMETARs() {
    showLoading(true);
    Papa.parse("./currentwx/metar.csv", {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            metarLayer.clearLayers();
            metarWeatherLayer.clearLayers();
            results.data.forEach(function(row) {
                if (row.latitude && row.longitude && row.raw_text) {
                    const category = (row.flight_category || "Unknown").trim();
                    const color = flightCategoryColors[category] || "#aaaaaa";
                    L.circleMarker([parseFloat(row.latitude), parseFloat(row.longitude)], {
                        radius: 3, fillColor: color, color: "#000", weight: 1, opacity: 1, fillOpacity: 0.8
                    }).addTo(metarLayer).bindPopup(`
                        <strong>${row.station_id}</strong><br>${row.raw_text}<hr>
                        <b>Category:</b> <span style="color:${color}">${category}</span><br>
                        <b>Time:</b> ${row.observation_time}<br>
                        <b>Wind:</b> ${row.wind_dir_degrees}° / ${row.wind_speed_kt} kt<br>
                        <b>Visibility:</b> ${Math.round(parseFloat(row.visibility_statute_mi) * 1609.34)}m<br>
                        <b>Weather:</b> ${row.wx_string || 'N/A'}<br>
                        <b>Clouds:</b> ${row.sky_cover_1}${row.cloud_base_ft_agl_1} ${row.sky_cover_2}${row.cloud_base_ft_agl_2} ${row.sky_cover_3} ${row.cloud_base_ft_agl_3} ${row.sky_cover_4} ${row.cloud_base_ft_agl_4}<br>
                        <b>Temp/Dew Point:</b> ${row.temp_c}°C / ${row.dewpoint_c} °C
                    `);
                    let condition = row.wx_string || getSkyCover(row);
                    let iconUrl = getWeatherIcon(condition);
                    L.marker([parseFloat(row.latitude), parseFloat(row.longitude)], {
                        icon: L.icon({ iconUrl: iconUrl, iconSize: [18, 18] })
                    }).addTo(metarWeatherLayer).bindPopup(`
                        <strong>${row.station_id}</strong><hr>
                        <b>Weather:</b> ${condition} <br>
                        <b>Clouds:</b> ${row.sky_cover_1} ${row.cloud_base_ft_agl_1} ${row.sky_cover_2} ${row.cloud_base_ft_agl_2} ${row.sky_cover_3} ${row.cloud_base_ft_agl_3}
                    `);
                }
            });
            showLoading(false);
        },
        error: function(error) { console.error("Error loading METAR data:", error); showLoading(false); }
    });
}

export function loadTAFs() {
    showLoading(true);
    Papa.parse("./currentwx/tafs.csv", {
        download: true,
        header: true,
        skipEmptyLines: true,
        complete: function(results) {
            tafLayer.clearLayers();
            tafMarkers = {};
            results.data.forEach(row => {
                if (row.latitude && row.longitude && row.raw_text) {
                    let marker = L.circleMarker([parseFloat(row.latitude), parseFloat(row.longitude)], {
                        radius: 4, fillColor: "#800080", color: "#000", weight: 1, opacity: 1, fillOpacity: 0.8
                    }).bindPopup(createTAFPopup(row), { maxWidth: 700 });
                    marker.addTo(tafLayer);
                    tafMarkers[row.station_id] = marker;
                }
            });
            showLoading(false);
        },
        error: function(error) { console.error("Error loading TAF data:", error); showLoading(false); }
    });
}

export function loadBoundary(map) {
    showLoading(true);
    fetch("./map/INDIA_STATES.geojson")
        .then(response => response.json())
        .then(data => {
            L.geoJSON(data, {
                style: {
                    color: "#636161ff",
                    weight: 1.0,
                    fillOpacity: 0
                }
            }).addTo(boundaryLayer);
            showLoading(false);
        })
        .catch(error => {
            console.error("Error loading boundary:", error);            showLoading(false);
        });
}

export function loadSIGMETs(map) { // New Function
    showLoading(true);
    sigmetLayer.clearLayers(); // Clear existing SIGMETs before loading new ones
    fetch("./currentwx/isigmet.json")
        .then(res => res.json())
        .then(data => {
            const foundHazards = new Map();
            let indianSIGMETfound = false;

            data.forEach(sigmet => {
                if (sigmet.geom !== "AREA" || !Array.isArray(sigmet.coords)) return;

                const hazard = sigmet.hazard || "Unknown";
                const qualifier = sigmet.qualifier || "N/A";
                const firId = sigmet.firId?.toUpperCase() || "N/A";
                const firName = sigmet.firName || firId;
                const color = getSigmetHazardColor(hazard);
                const coords = sigmet.coords.map(c => [c.lat, c.lon]);

                if (indianFIRs.includes(firId)) indianSIGMETfound = true;

                const movement = sigmet.dir && sigmet.spd ? `${sigmet.dir} @ ${sigmet.spd} KT` : sigmet.dir || "Stationary";

                const change = {
                    INTSF: "Intensifying", WKN: "Weakening", NC: "No Change"
                }[sigmet.chng] || "Unknown";

                let extraInfo = "";
                if (hazard === "TS") {
                    extraInfo = `<strong>Thunderstorm Type:</strong> ${qualifier}<br/>
                                 <strong>Movement:</strong> ${movement}<br/>
                                 <strong>Trend:</strong> ${change}<br/>`;
                } else if (hazard === "ICE" || hazard === "TURB") {
                    extraInfo = `<strong>Severity:</strong> ${qualifier}<br/>
                                 <strong>Trend:</strong> ${change}<br/>`;
                }

                const popup = `
                    <strong>${hazard} (${qualifier})</strong><br/>
                    <strong>FIR:</strong> ${firName}<br/>
                    <strong>Valid:</strong><br/>
                    ${formatTime(sigmet.validTimeFrom)}Z → ${formatTime(sigmet.validTimeTo)}Z<br/>
                    ${extraInfo}
                    <details><summary>Raw SIGMET</summary><pre>${sigmet.rawSigmet || "N/A"}</pre></details>
                `;

                // Draw polygon
                L.polygon(coords, { color, weight: 1, fillOpacity: 0.2 }) // Changed weight from 2 to 1
                    .bindPopup(popup)
                    .addTo(sigmetLayer);

                // Add icon + label at center
                const [lat, lon] = coords.reduce(([a, b], [c, d]) => [a + c, b + d], [0, 0])
                    .map(val => val / coords.length);

                const icon = sigmetIconMap[hazard] || "default.png";
                const iconHTML = `
                    <div style="text-align:center;">
                        <img src="icons/${icon}" width="16" height="16" /> <!-- Changed width/height from 24 to 16 -->
                        <div style="font-size:10px; font-weight:bold; color:${color}; text-shadow:1px 1px 2px #fff;">
                            ${qualifier}
                        </div>
                    </div>`;

                L.marker([lat, lon], {
                    icon: L.divIcon({
                        className: "sigmet-icon-label",
                        html: iconHTML,
                        iconSize: [20, 20], // Adjusted iconSize to match new image dimensions
                        iconAnchor: [10, 10] // Adjusted iconAnchor
                    }),
                    title: `${hazard} (${qualifier})`
                }).addTo(sigmetLayer);                // Track for legend
                if (!foundHazards.has(hazard)) {
                    foundHazards.set(hazard, { color, label: sigmetHazardLabels[hazard] || hazard, icon });
                }
            });

            // No SIGMET case
            if (!indianSIGMETfound && sigmetLayer.hasLayer(map)) { // Only show "No SIGMET" if layer is actually active
                L.marker([22.5, 82], {
                    icon: L.divIcon({
                        html: '<div style="font-weight:bold; background:white; padding:6px 12px; border-radius:5px; box-shadow:0 0 6px #888;">No SIGMET found over India</div>'
                    })
                }).addTo(sigmetLayer);
            }

            showLoading(false);
        })
        .catch(err => {
            console.error("SIGMET fetch error:", err);
            showLoading(false);
        });
}

		// Function to Toggle TAF Marker Visibility (if needed externally)
		export function toggleTAF(stationID, map) {
			if (tafMarkers[stationID]) {
				if (map.hasLayer(tafMarkers[stationID])) {
				map.removeLayer(tafMarkers[stationID]);
			} else {
            tafMarkers[stationID].addTo(map);
        }
    }
}