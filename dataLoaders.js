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

export async function loadTAFs() {
    showLoading(true);

    try {
        // Fetch both XML files at the same time for efficiency
        const [tafResponse, stationsResponse] = await Promise.all([
            fetch("./currentwx/taf.xml"),
            fetch("./map/stations.xml") // Make sure this path is correct
        ]);

        const tafStr = await tafResponse.text();
        const stationsStr = await stationsResponse.text();
        const parser = new DOMParser();

        // 1. Create a map of station IDs to station names from stations.xml
        // The key will be the ICAO code (e.g., "KGRK")
        const stationsDoc = parser.parseFromString(stationsStr, "application/xml");
        const stationNodes = stationsDoc.getElementsByTagName("Station");
        const stationNameMap = {};
        for (const node of stationNodes) {
            const id = node.querySelector("station_id")?.textContent;
            const name = node.querySelector("site")?.textContent;
            if (id && name) {
                stationNameMap[id] = name;
            }
        }

        // 2. Parse the TAF data
        const xmlDoc = parser.parseFromString(tafStr, "application/xml");
        tafLayer.clearLayers();
        tafMarkers = {};

        const tafNodes = xmlDoc.getElementsByTagName("TAF");
        for (let i = 0; i < tafNodes.length; i++) {
            const tafNode = tafNodes[i];

            // This is the ICAO code (e.g., "KGRK")
            const stationId = tafNode.querySelector("station_id")?.textContent || "Unknown";
            const lat = parseFloat(tafNode.querySelector("latitude")?.textContent || "0");
            const lon = parseFloat(tafNode.querySelector("longitude")?.textContent || "0");
            
            if (!lat || !lon) continue;

            // ... (rest of your TAF parsing logic for forecasts, etc.)
            const rawText = tafNode.querySelector("raw_text")?.textContent?.trim() || "No raw text";
            const issueTime = tafNode.querySelector("issue_time")?.textContent || "N/A";
            const validFrom = tafNode.querySelector("valid_time_from")?.textContent || "N/A";
            const validTo = tafNode.querySelector("valid_time_to")?.textContent || "N/A";
            const forecastNodes = tafNode.getElementsByTagName("forecast");
            const forecasts = [];
            for (let j = 0; j < forecastNodes.length; j++) {
                const fc = forecastNodes[j];
                const fcstFrom = fc.querySelector("fcst_time_from")?.textContent || "N/A";
                const fcstTo = fc.querySelector("fcst_time_to")?.textContent || "N/A";
                const change = fc.querySelector("change_indicator")?.textContent || "N/A";
                const windDir = fc.querySelector("wind_dir_degrees")?.textContent || "VRB";
                const windSpeed = fc.querySelector("wind_speed_kt")?.textContent || "0";
                const gust = fc.querySelector("wind_gust_kt")?.textContent;
                const wind = gust ? `${windDir}°/${windSpeed} (gust ${gust})` : `${windDir}°/${windSpeed}`;
                const wxStr = fc.querySelector('wx_string')?.textContent || 'N/A';
                const visStr = fc.querySelector("visibility_statute_mi")?.textContent || "N/A";
                let visM = "N/A";
                if (visStr !== "N/A") {
                    const num = parseFloat(visStr);
                    if (!isNaN(num)) {
                        visM = Math.round(num * 1609.34) + " m";
                    }
                }
                forecasts.push({
                    fcst_time_from: fcstFrom,
                    fcst_time_to: fcstTo,
                    change,
                    wind,
                    wxStr,
                    visibility: visM
                });
            }

            // 3. Look up the station name using the ICAO code
            const stationName = stationNameMap[stationId] || stationId; // Fallback to ID if not found

            // 4. Build the data object for the popup
            const popupData = {
                station_name: stationName, // The full name (e.g., "Gray Army Airfield")
                station_id: stationId,     // The ICAO code (e.g., "KGRK")
                raw_text: rawText,
                issue_time: issueTime,
                valid_time_from: validFrom,
                valid_time_to: validTo,
                forecasts
            };

            const marker = L.circleMarker([lat, lon], {
                radius: 4,
                fillColor: "#800080",
                color: "#000",
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            }).bindPopup(createTAFPopup(popupData), { maxWidth: 700 });

            marker.addTo(tafLayer);
            tafMarkers[stationId] = marker;
        }
    } catch (err) {
        console.error("Error loading TAF or Station XML:", err);
    } finally {
        showLoading(false);
    }
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