// tafRenderer.js
import { formatForecastTime, getWeatherColor } from './utils.js';

// tafRenderer.js
// import { formatDateTime } from './utils.js';


import { formatDateTime } from './utils.js';

export function createTAFPopup(data) {
    console.log("Creating TAF popup for data:", );
    let popup = `
        <h3>Station: ${data.station_id}</h3>
        <h3>Station Name: ${data.station_name}</h3>
        <p>Valid: ${formatDateTime(data.valid_time_from)} to ${formatDateTime(data.valid_time_to)}</p>
        <div class="raw-text-container">${data.raw_text}</div>
        <h4>Forecast Details</h4>
        <table>
            <thead>
                <tr>
                    <th>Time From</th>
                    <th>Time To</th>
                    <th>Change</th>
                    <th>Wind (kt)</th>
                    <th>Weather</th>
                    <th>Visibility (m)</th>
                </tr>
            </thead>
            <tbody>
    `;

    if (data.forecasts?.length > 0) {
        data.forecasts.forEach(fc => {
            popup += `
                <tr>
                    <td>${formatDateTime(fc.fcst_time_from)}</td>
                    <td>${formatDateTime(fc.fcst_time_to)}</td>
                    <td>${fc.change}</td>
                    <td>${fc.wind}</td>
                    <td style="${getWeatherColor(fc.wxStr)}">${fc.wxStr}</td>
                    <td>${fc.visibility}</td>
                </tr>
            `;
        });
    } else {
        popup += `<tr><td colspan="5">No forecast data available for this station.</td></tr>`;
    }

    popup += `</tbody></table>`;
    return popup;
}



export function createForecastTable(row) {
    let forecastRows = generateForecastRows(row);
    if (!forecastRows.trim()) {
        return `<p>No forecast data available for this station.</p>`;
    }
    return `
        <div style="width: 100%; max-height: 200px; overflow-y: auto;">
            <table style="width: 100%; border-collapse: collapse;">
                <thead>
                    <tr style="background-color: #f2f2f2;">
                        <th>Time From</th><th>Time To</th><th>Change</th><th>Wind (kt)</th><th>Visibility</th><th>Weather</th>
                    </tr>
                </thead>
                <tbody>
                    ${forecastRows}
                </tbody>
            </table>
        </div>
    `;
}

export function generateForecastRows(row) {
    let forecastRows = "";
    for (let i = 1; i <= 5; i++) {
        if (row[`fcst_time_from_${i}`] && row[`fcst_time_to_${i}`]) {
            let windSpeed = parseFloat(row[`wind_speed_kt_${i}`]) || 0;
            let windGust = parseFloat(row[`wind_gust_kt_${i}`]) || 0;
            let visibility = parseFloat(row[`visibility_statute_mi_${i}`]) * 1609.34 || 10000;
            let weatherCondition = row[`wx_string_${i}`] || 'N/A';

            let windColor = windSpeed >= 30 ? "color: red;" : windSpeed >= 20 ? "color: orange;" : "";
            let gustColor = windGust >= 30 ? "color: red;" : windGust >= 20 ? "color: orange;" : "";
            let visibilityColor = visibility < 2000 ? "color: red;" : visibility < 5000 ? "color: orange;" : "";
            let weatherColor = getWeatherColor(weatherCondition);

            forecastRows += `
                <tr>
                    <td>${formatForecastTime(row[`fcst_time_from_${i}`])}</td>
                    <td>${formatForecastTime(row[`fcst_time_to_${i}`])}</td>
                    <td>${row[`change_indicator_${i}`] || 'N/A'}</td>
                    <td style="${windColor}">${row[`wind_dir_degrees_${i}`]}°/ <span style="${gustColor}">${row[`wind_speed_kt_${i}`]} / G ${row[`wind_gust_kt_${i}`] || 'N/A'}</span></td><td style="${visibilityColor}">${Math.round(visibility)}m</td>
                    <td style="${weatherColor}">${weatherCondition}</td>
                </tr>
            `;
        }
    }
    return forecastRows;
}