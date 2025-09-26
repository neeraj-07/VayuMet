// utils.js
import { weatherIcons, sigmetHazardColors, sigmetIconMap, sigmetHazardLabels } from './constants.js'; // Added sigmet related imports

export function showLoading(show) {
    document.getElementById('loadingIndicator').style.display = show ? 'block' : 'none';
}

export function updateTimeDimensionVisibility(timeControl) {
    const satelliteChecked = document.getElementById('weather-Satellite')?.checked;
    const radarChecked = document.getElementById('weather-Radar')?.checked;

    if (satelliteChecked || radarChecked) {
        timeControl.getContainer().style.display = 'block';
    } else {
        timeControl.getContainer().style.display = 'none';
    }
}

export function getWeatherIcon(condition) {
    return encodeURI(`./icon/${weatherIcons[condition] || weatherIcons["CLR"]}`);
}

export function formatDateTime(isoStr) {
    if (!isoStr) return "N/A";
    const d = new Date(isoStr);
    if (isNaN(d)) return isoStr; // fallback if not ISO
    const day = String(d.getUTCDate()).padStart(2, '0');
    const month = String(d.getUTCMonth() + 1).padStart(2, '0');
    const year = d.getUTCFullYear();
    const hours = String(d.getUTCHours()).padStart(2, '0');
    const minutes = String(d.getUTCMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes} UTC`;
}


export function getSkyCover(row) {
    let covers = [row.sky_cover_1, row.sky_cover_2, row.sky_cover_3].filter(c => c);
    if (row.raw_text.includes("CAVOK")) return "CLR/FINE";
    let brokenCloudsCount = covers.filter(c => c === "BKN").length;
    if (brokenCloudsCount >= 2) return "OVC";
    if (covers.length > 0) {
        if (covers.includes("OVC")) return "OVC";
        if (covers.includes("BKN")) return "CLOUDY";
        if (covers.includes("SCT")) return "PCLOUDY";
        if (covers.includes("FEW")) return "FAIR";
    }
    return "CLR/FINE";
}

export function formatForecastTime(isoString) {
    const date = new Date(isoString);
    const day = String(date.getUTCDate()).padStart(2, '0');
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const month = monthNames[date.getUTCMonth()];
    const hours = String(date.getUTCHours()).padStart(2, '0');
    return `${day}-${month}-${hours}:00Z`;
}

export function getWeatherColor(condition) {
    if (condition.includes("TS")) return "color: red;";
    if (condition.includes("RA")) return "color: blue;";
    if (condition.includes("BR")) return "color: gray;";
    if (condition.includes("HZ")) return "color: orange;";
    return "";
}

// SIGMET-related functions
export function formatTime(unix) {
    return unix ? new Date(unix * 1000).toUTCString().slice(5, 22) : "N/A";
}

export function getSigmetHazardColor(hazard) {
    return sigmetHazardColors[hazard] || sigmetHazardColors["Unknown"];
}