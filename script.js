function updateTime() {
    const now = new Date();
    const d = now.toLocaleDateString('en-US');
    const t = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    document.getElementById('datetime').textContent = `${d} ${t}`;
}
setInterval(updateTime, 1000);
updateTime();

let auraPoints = 9999999;
function claimAura() {
    auraPoints += 100;
    document.getElementById('aura-points').innerHTML = `+${auraPoints.toLocaleString()} <i class="fa-solid fa-sparkles text-gold"></i>`;

    if (Math.random() > 0.65) {
        const mewEl = document.getElementById('mew-streak');
        let days = parseInt(mewEl.textContent.replace(/[^0-9]/g, '')) || 420;
        days += 1;
        mewEl.innerHTML = `<i class="fa-solid fa-comment-slash text-purple" style="margin-right: 6px;"></i> ${days} Days`;
    }
}

let clickerScore = 0;
let clickValue = 1;

function clickTarget(e) {
    clickerScore += clickValue;
    updateClickerUI();
    createFloatingNumber(e);
}

function createFloatingNumber(e) {
    const rect = document.querySelector('.click-target-container').getBoundingClientRect();
    const el = document.createElement('div');
    el.className = 'floating-number';
    el.style.left = `${e.clientX - rect.left}px`;
    el.style.top = `${e.clientY - rect.top}px`;
    el.textContent = `+${clickValue}`;
    document.querySelector('.click-target-container').appendChild(el);
    setTimeout(() => el.remove(), 800);
}

function updateClickerUI() {
    document.getElementById('clicker-score').textContent = Math.floor(clickerScore).toLocaleString();
}

let highestZ = 10;

function makeDraggable(win) {
    win.querySelector('.window-header').onmousedown = e => {
        if (e.target.classList.contains('control-dot')) return;
        e.preventDefault();
        focusWindow(win);
        document.body.classList.add('dragging');
        let x = e.clientX, y = e.clientY;
        document.onmousemove = e => {
            if (win.classList.contains('maximized')) return;
            const top = win.offsetTop + e.clientY - y;
            win.style.top = `${top < 0 ? 0 : top}px`;
            win.style.left = `${win.offsetLeft + e.clientX - x}px`;
            x = e.clientX; y = e.clientY;
        };
        document.onmouseup = () => {
            document.body.classList.remove('dragging');
            document.onmousemove = document.onmouseup = null;
        };
    };
}

function focusWindow(windowEl) {
    highestZ += 1;
    windowEl.style.zIndex = highestZ;
}

function closeWindow(id) {
    const win = document.getElementById(id);
    win.classList.remove('show');
    setTimeout(() => {
        win.style.display = 'none';
    }, 250);
}

function openWindow(id) {
    const win = document.getElementById(id);
    win.style.display = 'flex';
    focusWindow(win);
    setTimeout(() => {
        win.classList.add('show');
    }, 10);
}

function maximizeWindow(id) {
    const win = document.getElementById(id);
    win.classList.toggle('maximized');
}

function minimizeWindow(id) {
    closeWindow(id);
}

const citiesCoords = {
    santacruz: { name: 'Santa Cruz de la Sierra', lat: -17.7833, lon: -63.182 },
    lapaz: { name: 'La Paz', lat: -16.5, lon: -68.15 },
    newyork: { name: 'New York', lat: 40.7128, lon: -74.006 },
    london: { name: 'London', lat: 51.5074, lon: -0.1278 },
    tokyo: { name: 'Tokyo', lat: 35.6762, lon: 139.6503 }
};

const wmoMap = {
    0: ['Clear Sky', 'fa-solid fa-sun'],
    1: ['Partly Cloudy', 'fa-solid fa-cloud-sun'],
    2: ['Partly Cloudy', 'fa-solid fa-cloud-sun'],
    3: ['Cloudy', 'fa-solid fa-cloud'],
    45: ['Foggy', 'fa-solid fa-smog'], 48: ['Foggy', 'fa-solid fa-smog'],
    51: ['Drizzle', 'fa-solid fa-cloud-rain'], 53: ['Drizzle', 'fa-solid fa-cloud-rain'], 55: ['Drizzle', 'fa-solid fa-cloud-rain'],
    61: ['Rainy', 'fa-solid fa-cloud-showers-heavy'], 63: ['Rainy', 'fa-solid fa-cloud-showers-heavy'], 65: ['Rainy', 'fa-solid fa-cloud-showers-heavy'],
    71: ['Snowy', 'fa-solid fa-snowflake'], 73: ['Snowy', 'fa-solid fa-snowflake'], 75: ['Snowy', 'fa-solid fa-snowflake'],
    80: ['Showers', 'fa-solid fa-cloud-showers-heavy'], 81: ['Showers', 'fa-solid fa-cloud-showers-heavy'], 82: ['Showers', 'fa-solid fa-cloud-showers-heavy'],
    95: ['Thunderstorm', 'fa-solid fa-cloud-bolt'], 96: ['Thunderstorm', 'fa-solid fa-cloud-bolt'], 99: ['Thunderstorm', 'fa-solid fa-cloud-bolt']
};
function getWMOInfo(code) {
    const [desc, icon] = wmoMap[code] || ['Cloudy', 'fa-solid fa-cloud'];
    return { desc, icon };
}

function getUVLabel(index) {
    const val = Math.round(index);
    const label = val <= 2 ? 'Low' : val <= 5 ? 'Moderate' : val <= 7 ? 'High' : val <= 10 ? 'Very High' : 'Extreme';
    return `${val} (${label})`;
}

function getDayName(offset) {
    if (offset === 1) return 'Tomorrow';
    const d = new Date();
    d.setDate(d.getDate() + offset);
    return d.toLocaleDateString('en-US', { weekday: 'long' });
}

let currentCityKey = 'santacruz';
let isCelsius = true;
let currentWeatherState = null;

function fetchWeatherData(cityKey) {
    currentCityKey = cityKey;
    const coords = citiesCoords[cityKey];
    
    document.getElementById('weather-city').textContent = coords.name;
    document.getElementById('weather-desc').textContent = 'Loading...';
    document.getElementById('weather-temp').textContent = '--';
    document.getElementById('weather-humidity').textContent = '--';
    document.getElementById('weather-wind').textContent = '--';
    document.getElementById('weather-uv').textContent = '--';

    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lon}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`;

    fetch(url)
        .then(res => res.json())
        .then(data => {
            const currentWmo = getWMOInfo(data.current.weather_code);
            const uvMax = data.daily.uv_index_max[0];
            
            const forecastList = [];
            for (let i = 1; i <= 3; i++) {
                const foreWmo = getWMOInfo(data.daily.weather_code[i]);
                forecastList.push({
                    day: getDayName(i),
                    icon: foreWmo.icon,
                    max: Math.round(data.daily.temperature_2m_max[i]),
                    min: Math.round(data.daily.temperature_2m_min[i])
                });
            }

            currentWeatherState = {
                city: coords.name,
                desc: currentWmo.desc,
                temp: Math.round(data.current.temperature_2m),
                icon: currentWmo.icon,
                humidity: `${data.current.relative_humidity_2m}%`,
                wind: `${data.current.wind_speed_10m} km/h`,
                uv: getUVLabel(uvMax),
                forecast: forecastList
            };
            
            updateWeatherUI();
        })
        .catch(() => {
            document.getElementById('weather-desc').textContent = 'Error loading';
        });
}

function updateWeatherUI() {
    if (!currentWeatherState) return;

    const data = currentWeatherState;

    document.getElementById('weather-city').textContent = data.city;
    document.getElementById('weather-desc').textContent = data.desc;

    const iconEl = document.getElementById('weather-icon');
    iconEl.className = `weather-main-icon ${data.icon}`;

    document.getElementById('weather-humidity').textContent = data.humidity;
    document.getElementById('weather-wind').textContent = data.wind;
    document.getElementById('weather-uv').textContent = data.uv;

    const tempVal = isCelsius ? data.temp : Math.round((data.temp * 9/5) + 32);
    const unitStr = isCelsius ? '°C' : '°F';
    document.getElementById('weather-temp').textContent = `${tempVal}${unitStr}`;

    const forecastGrid = document.getElementById('weather-forecast-grid');
    forecastGrid.innerHTML = '';

    data.forecast.forEach(fore => {
        const card = document.createElement('div');
        card.className = 'weather-forecast-card';

        const maxVal = isCelsius ? fore.max : Math.round((fore.max * 9/5) + 32);
        const minVal = isCelsius ? fore.min : Math.round((fore.min * 9/5) + 32);
        const tempString = `${maxVal}${unitStr} / ${minVal}${unitStr}`;

        card.innerHTML = `
            <span class="weather-fore-day">${fore.day}</span>
            <span class="weather-fore-icon"><i class="${fore.icon}"></i></span>
            <span class="weather-fore-temp">${tempString}</span>
        `;
        forecastGrid.appendChild(card);
    });

    const btn = document.getElementById('weather-unit-toggle');
    btn.textContent = isCelsius ? 'Show in °F' : 'Show in °C';
}

function handleCityChange(cityKey) {
    fetchWeatherData(cityKey);
}

function toggleWeatherUnit() {
    isCelsius = !isCelsius;
    updateWeatherUI();
}

const windows = ['welcome-window', 'clicker-window', 'zero-window', 'weather-window'].map(id => document.getElementById(id));
windows.forEach(win => {
    makeDraggable(win);
    win.addEventListener('mousedown', () => focusWindow(win));
});

function centerWindow(win) {
    const desktop = document.querySelector('.desktop');
    win.style.left = `${(desktop.clientWidth - win.clientWidth) / 2}px`;
    win.style.top = `${(desktop.clientHeight - win.clientHeight) / 2}px`;
}

fetchWeatherData('santacruz');

setTimeout(() => {
    windows.forEach(centerWindow);
    openWindow('welcome-window');
}, 100);

window.addEventListener('resize', () => {
    windows.forEach(win => {
        if (win.style.display !== 'none') centerWindow(win);
    });
});
