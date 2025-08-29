// forecastSlider.js
import { weatherElements, imageBounds } from './constants.js';
import { showLoading } from './utils.js';

let currentSliderInterval = null;
let isSliderPlaying = false;
let currentForecastLayer = null;
let currentForecastConfig = null;
let mapInstance = null; // Store map instance

export function initForecastSlider(map) {
    mapInstance = map;
    const timeSlider = document.getElementById('timeSlider');
    timeSlider.addEventListener('input', function() {
        const hourIndex = parseInt(this.value);
        updateForecastLayer(hourIndex);
    });

    document.getElementById('sliderBackBtn').addEventListener('click', function() {
        const currentValue = parseInt(timeSlider.value);
        if (currentValue > 0) {
            timeSlider.value = currentValue - 1;
            updateForecastLayer(currentValue - 1);
        }
    });

    document.getElementById('sliderForwardBtn').addEventListener('click', function() {
        const currentValue = parseInt(timeSlider.value);
        if (currentValue < 40) {
            timeSlider.value = currentValue + 1;
            updateForecastLayer(currentValue + 1);
        }
    });

    document.getElementById('sliderPlayBtn').addEventListener('click', function() {
        if (isSliderPlaying) {
            pauseSlider();
        } else {
            playSlider();
        }
    });
}

export function updateForecastLayer(hourIndex) {
    if (!currentForecastLayer || !currentForecastConfig) return;

    const hours = hourIndex * 6;
    const imageUrl = `./images/${currentForecastConfig.folder}/${hours}h_${currentForecastConfig.suffix}`;

    currentForecastLayer.setUrl(imageUrl);
    updateSliderDisplay(hourIndex);
}

export function updateSliderDisplay(hourIndex) {
    if (!currentForecastConfig) return;

    const hours = hourIndex * 6;
    const day = Math.floor(hours / 24) + 1;
    const hour = hours % 24;
    const timeString = `Day ${day} ${hour.toString().padStart(2, '0')}:00 Z`;

    document.getElementById('sliderTimeDisplay').textContent =
        `${currentForecastConfig.name} ${timeString}`;
}

export function playSlider() {
    if (isSliderPlaying) return;

    isSliderPlaying = true;
    document.getElementById('sliderPlayBtn').textContent = '⏸';

    const timeSlider = document.getElementById('timeSlider');
    let currentValue = parseInt(timeSlider.value);

    currentSliderInterval = setInterval(() => {
        if (currentValue >= 40) {
            pauseSlider();
            return;
        }
        currentValue++;
        timeSlider.value = currentValue;
        updateForecastLayer(currentValue);
    }, 1000);
}

export function pauseSlider() {
    isSliderPlaying = false;
    document.getElementById('sliderPlayBtn').textContent = '⏵';
    if (currentSliderInterval) {
        clearInterval(currentSliderInterval);
        currentSliderInterval = null;
    }
}

// Functions to manage the current forecast layer state from outside
export function setCurrentForecastLayer(layer) { currentForecastLayer = layer; }
export function setCurrentForecastConfig(config) { currentForecastConfig = config; }
export function getCurrentForecastLayer() { return currentForecastLayer; }
export function getCurrentForecastConfig() { return currentForecastConfig; }