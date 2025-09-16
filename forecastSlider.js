import { weatherElements, imageBounds } from './constants.js';
import { showLoading } from './utils.js';

let currentSliderInterval = null;
let isSliderPlaying = false;
let currentForecastLayer = null;
let currentForecastConfig = null;
let mapInstance = null; // Store map instance

// --- DOM Element Cache ---
const timeSlider = document.getElementById('timeSlider');
const sliderPlayBtn = document.getElementById('sliderPlayBtn');
const iconPlay = sliderPlayBtn.querySelector('.icon-play');
const iconPause = sliderPlayBtn.querySelector('.icon-pause');
const timePrimaryDisplay = document.getElementById('sliderTimePrimary');
const timeSecondaryDisplay = document.getElementById('sliderTimeSecondary');

export function initForecastSlider(map) {
    mapInstance = map;
    
    timeSlider.addEventListener('input', function() {
        const hourIndex = parseInt(this.value);
        updateForecastLayer(hourIndex);
        updateSliderProgress(this);
    });

    document.getElementById('sliderBackBtn').addEventListener('click', function() {
        const currentValue = parseInt(timeSlider.value);
        if (currentValue > 0) {
            timeSlider.value = currentValue - 1;
            updateForecastLayer(currentValue - 1);
            updateSliderProgress(timeSlider);
        }
    });

    document.getElementById('sliderForwardBtn').addEventListener('click', function() {
        const currentValue = parseInt(timeSlider.value);
        if (currentValue < 40) {
            timeSlider.value = currentValue + 1;
            updateForecastLayer(currentValue + 1);
            updateSliderProgress(timeSlider);
        }
    });

    sliderPlayBtn.addEventListener('click', function() {
        if (isSliderPlaying) {
            pauseSlider();
        } else {
            playSlider();
        }
    });
    
    updateSliderProgress(timeSlider); // Initialize slider progress color
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
    const now = new Date();
    const forecastDate = new Date(now.getTime() + hours * 60 * 60 * 1000);
    const dayName = forecastDate.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
    const timeString = forecastDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }) + ' UTC';

    timePrimaryDisplay.textContent = `${currentForecastConfig.name} +${hours} hr`;
    timeSecondaryDisplay.textContent = `${dayName}, ${timeString}`;
}

function updateSliderProgress(slider) {
    const percentage = (slider.value - slider.min) / (slider.max - slider.min) * 100;
    const color = `linear-gradient(90deg, var(--gradient-start) 0%, var(--gradient-end) ${percentage}%, #333 ${percentage}%)`;
    slider.style.background = color;
}

export function playSlider() {
    if (isSliderPlaying) return;

    isSliderPlaying = true;
    iconPlay.style.display = 'none';
    iconPause.style.display = 'block';

    let currentValue = parseInt(timeSlider.value);

    currentSliderInterval = setInterval(() => {
        if (currentValue >= 40) {
            pauseSlider();
            return;
        }
        currentValue++;
        timeSlider.value = currentValue;
        updateForecastLayer(currentValue);
        updateSliderProgress(timeSlider);
    }, 1000);
}

export function pauseSlider() {
    isSliderPlaying = false;
    iconPlay.style.display = 'block';
    iconPause.style.display = 'none';
    
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