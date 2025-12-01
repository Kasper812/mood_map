from flask import Flask, render_template, jsonify, send_from_directory
import random
from datetime import datetime
import time
import threading

app = Flask(__name__)

class CityAnalyzer:
    def __init__(self):
        self.cities = {
            "Москва": {"lat": 55.7558, "lon": 37.6173, "color": "#FF6B6B"},
            "Санкт-Петербург": {"lat": 59.9343, "lon": 30.3351, "color": "#4ECDC4"},
            "Новосибирск": {"lat": 55.0084, "lon": 82.9357, "color": "#45B7D1"},
            "Екатеринбург": {"lat": 56.8389, "lon": 60.6057, "color": "#96CEB4"},
            "Казань": {"lat": 55.7961, "lon": 49.1064, "color": "#FFEAA7"},
            "Нижний Новгород": {"lat": 56.3269, "lon": 44.0065, "color": "#DDA0DD"},
            "Краснодар": {"lat": 45.0355, "lon": 38.9753, "color": "#98D8C8"},
            "Сочи": {"lat": 43.5855, "lon": 39.7231, "color": "#F7DC6F"},
            "Владивосток": {"lat": 43.1155, "lon": 131.8855, "color": "#BB8FCE"},
            "Калининград": {"lat": 54.7104, "lon": 20.4522, "color": "#85C1E9"}
        }
        
        self.weather_styles = {
            "sunny": {"icon": "☀️", "color": "#FFD700", "bg": "#FFF9C4"},
            "cloudy": {"icon": "☁️", "color": "#78909C", "bg": "#ECEFF1"},
            "rain": {"icon": "🌧️", "color": "#546E7A", "bg": "#E3F2FD"},
            "storm": {"icon": "⛈️", "color": "#37474F", "bg": "#212121"},
            "wind": {"icon": "💨", "color": "#80CBC4", "bg": "#E0F2F1"},
            "snow": {"icon": "❄️", "color": "#B3E5FC", "bg": "#E1F5FE"}
        }
        
        self.posts = [
            "Сегодня отличный день!",
            "Настроение на высоте",
            "Чувствую себя прекрасно",
            "Все идет по плану",
            "Немного устал сегодня",
            "Погода не радует",
            "Отличные новости!",
            "Жду выходных",
            "Рабочий день удался",
            "Нужен отдых"
        ]
        
        self.data = {}
        self.generate_data()
    
    def generate_data(self):
        for city, info in self.cities.items():
            mood = random.uniform(-0.8, 0.8)
            posts = random.randint(10, 100)
            
            if mood > 0.5:
                weather = "sunny"
            elif mood > 0.2:
                weather = "cloudy"
            elif mood > -0.3:
                weather = "rain"
            elif mood > -0.6:
                weather = "wind"
            else:
                weather = "storm"
            
            sample = random.sample(self.posts, 3)
            
            self.data[city] = {
                "name": city,
                "coords": info,
                "mood": round(mood, 2),
                "weather": weather,
                "posts": posts,
                "sample": sample,
                "time": datetime.now().isoformat()
            }
    
    def get_stats(self):
        moods = [city["mood"] for city in self.data.values()]
        posts = sum(city["posts"] for city in self.data.values())
        
        return {
            "avg_mood": round(sum(moods) / len(moods), 2),
            "total_posts": posts,
            "city_count": len(self.data),
            "sunny": sum(1 for c in self.data.values() if c["weather"] == "sunny"),
            "rainy": sum(1 for c in self.data.values() if c["weather"] == "rain")
        }
    
    def update_city(self, city):
        if city in self.cities:
            mood = random.uniform(-0.8, 0.8)
            
            if mood > 0.5:
                weather = "sunny"
            elif mood > 0.2:
                weather = "cloudy"
            elif mood > -0.3:
                weather = "rain"
            elif mood > -0.6:
                weather = "wind"
            else:
                weather = "storm"
            
            self.data[city].update({
                "mood": round(mood, 2),
                "weather": weather,
                "posts": self.data[city]["posts"] + random.randint(1, 10),
                "time": datetime.now().isoformat()
            })

analyzer = CityAnalyzer()

@app.route("/")
def home():
    return render_template("index.html")

@app.route("/api/data")
def api_data():
    return jsonify({
        "cities": analyzer.data,
        "stats": analyzer.get_stats(),
        "update": datetime.now().isoformat()
    })

@app.route("/api/update/<city>")
def update_city(city):
    analyzer.update_city(city)
    return jsonify({"status": "updated", "city": city})

@app.route("/api/update-all")
def update_all():
    for city in analyzer.cities:
        analyzer.update_city(city)
    return jsonify({"status": "all_updated"})

@app.route("/static/<path:path>")
def static_files(path):
    return send_from_directory("static", path)

def background_update():
    while True:
        time.sleep(30)
        city = random.choice(list(analyzer.cities.keys()))
        analyzer.update_city(city)

threading.Thread(target=background_update, daemon=True).start()

if __name__ == "__main__":
    print("Сервер запущен: http://localhost:5000")
    app.run(port=5000, debug=True)
