let map;
let markers = {};
let currentData = {};

const weatherColors = {
    sunny: { bg: "#FFD700", border: "#FFC107", text: "#333" },
    cloudy: { bg: "#78909C", border: "#546E7A", text: "#FFF" },
    rain: { bg: "#546E7A", border: "#37474F", text: "#FFF" },
    storm: { bg: "#37474F", border: "#000", text: "#FFF" },
    wind: { bg: "#80CBC4", border: "#4DB6AC", text: "#333" },
    snow: { bg: "#B3E5FC", border: "#81D4FA", text: "#333" }
};

const weatherIcons = {
    sunny: "☀️",
    cloudy: "☁️",
    rain: "🌧️",
    storm: "⛈️",
    wind: "💨",
    snow: "❄️"
};

async function init() {
    await loadData();
    initMap();
    startAutoUpdate();
}

async function loadData() {
    showLoading(true);
    try {
        const response = await fetch("/api/data");
        const data = await response.json();
        currentData = data.cities;
        updateStats(data.stats);
        updateCityList();
        updateMap();
        showNotification("Данные обновлены");
    } catch (error) {
        console.error("Ошибка загрузки:", error);
        showNotification("Ошибка загрузки", "error");
    } finally {
        showLoading(false);
    }
}

async function updateCity(city) {
    const response = await fetch(`/api/update/${city}`);
    await loadData();
}

async function updateAll() {
    showLoading(true);
    const response = await fetch("/api/update-all");
    setTimeout(loadData, 1000);
}

function initMap() {
    map = L.map("map").setView([55, 50], 3);
    
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '© OpenStreetMap',
        maxZoom: 12
    }).addTo(map);
}

function updateMap() {
    Object.values(markers).forEach(marker => map.removeLayer(marker));
    markers = {};
    
    for (const [city, data] of Object.entries(currentData)) {
        const weather = data.weather;
        const colors = weatherColors[weather];
        
        const marker = L.marker([data.coords.lat, data.coords.lon], {
            icon: L.divIcon({
                html: createMarkerHTML(city, data),
                className: "custom-marker",
                iconSize: [80, 100],
                iconAnchor: [40, 50]
            })
        }).addTo(map);
        
        marker.bindPopup(createPopupHTML(city, data));
        markers[city] = marker;
    }
}

function createMarkerHTML(city, data) {
    const weather = data.weather;
    const colors = weatherColors[weather];
    const icon = weatherIcons[weather];
    
    return `
        <div style="
            background: ${colors.bg};
            border: 3px solid ${colors.border};
            border-radius: 20px;
            padding: 10px;
            color: ${colors.text};
            font-weight: bold;
            text-align: center;
            min-width: 80px;
            box-shadow: 0 10px 20px rgba(0,0,0,0.2);
            transform: translate(-50%, -100%);
        ">
            <div style="font-size: 24px;">${icon}</div>
            <div style="font-size: 12px;">${city}</div>
            <div style="font-size: 14px;">${data.mood > 0 ? "+" : ""}${data.mood}</div>
        </div>
    `;
}

function createPopupHTML(city, data) {
    const colors = weatherColors[data.weather];
    
    return `
        <div style="min-width: 250px;">
            <div style="
                background: ${colors.bg};
                color: ${colors.text};
                padding: 15px;
                border-radius: 12px 12px 0 0;
                text-align: center;
            ">
                <div style="font-size: 32px;">${weatherIcons[data.weather]}</div>
                <h3 style="margin: 10px 0;">${city}</h3>
                <div>Настроение: <strong>${data.mood > 0 ? "+" : ""}${data.mood}</strong></div>
                <div>Постов: ${data.posts}</div>
            </div>
            <div style="padding: 15px;">
                <h4>Примеры сообщений:</h4>
                ${data.sample.map(post => `
                    <div style="
                        background: #f5f5f5;
                        padding: 8px;
                        margin: 5px 0;
                        border-radius: 6px;
                        font-size: 14px;
                    ">${post}</div>
                `).join("")}
                <button onclick="updateCity('${city}')" style="
                    width: 100%;
                    padding: 10px;
                    margin-top: 10px;
                    background: #667eea;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    cursor: pointer;
                ">Обновить данные</button>
            </div>
        </div>
    `;
}

function updateStats(stats) {
    document.getElementById("city-count").textContent = stats.city_count;
    document.getElementById("avg-mood").textContent = stats.avg_mood;
    document.getElementById("total-posts").textContent = stats.total_posts;
    document.getElementById("sunny-cities").textContent = stats.sunny;
    document.getElementById("rainy-cities").textContent = stats.rainy;
}

function updateCityList() {
    const container = document.getElementById("city-list");
    container.innerHTML = "";
    
    Object.entries(currentData).forEach(([city, data]) => {
        const colors = weatherColors[data.weather];
        const moodPercent = ((data.mood + 1) / 2) * 100;
        
        const element = document.createElement("div");
        element.className = "city-item";
        element.onclick = () => {
            map.setView([data.coords.lat, data.coords.lon], 8);
            markers[city].openPopup();
        };
        
        element.innerHTML = `
            <div class="city-header">
                <div class="city-name">${city}</div>
                <div class="weather-icon">${weatherIcons[data.weather]}</div>
            </div>
            <div class="mood-bar">
                <div class="mood-fill" style="
                    width: ${moodPercent}%;
                    background: ${colors.bg};
                "></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 14px;">
                <span>Настроение: ${data.mood > 0 ? "+" : ""}${data.mood}</span>
                <span>${data.posts} постов</span>
            </div>
        `;
        
        container.appendChild(element);
    });
}

function showLoading(show) {
    document.getElementById("loading").style.display = show ? "flex" : "none";
}

function showNotification(message, type = "success") {
    const notification = document.getElementById("notification");
    notification.textContent = message;
    notification.style.background = type === "error" ? "#f44336" : "#4CAF50";
    notification.style.display = "block";
    
    setTimeout(() => {
        notification.style.display = "none";
    }, 3000);
}

function startAutoUpdate() {
    setInterval(loadData, 30000);
}

window.onload = init;
