import React, { useState, useEffect } from 'react';
import { Recommendation } from '../types';
import { GroupType } from '../components/GroupFilter';

interface TimeWeatherPageProps {
  onSearch: (query: any) => void;
  isLoading: boolean;
  userLocation: { lat: number; lng: number } | null;
  selectedGroup: GroupType;
  onGroupChange: (group: GroupType) => void;
}

interface WeatherData {
  temperature: number;
  weatherCode: number;
  condition: string;
  icon: string;
}

const TimeWeatherPage: React.FC<TimeWeatherPageProps> = ({
  onSearch,
  isLoading,
  userLocation,
  selectedGroup,
  onGroupChange
}) => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  const [weatherLoading, setWeatherLoading] = useState(false);

  // Time-based themes
  const timeThemes = {
    morning: {
      bg: 'linear-gradient(135deg, #FFE5B4 0%, #FFCDB2 50%, #FFB6C1 100%)',
      accent: '#FF8C69',
      icon: '🌅',
      title: 'Morning Vibes',
      description: 'Start your day with fresh energy',
      keywords: ['coffee', 'breakfast', 'fresh air', 'morning walk', 'sunrise']
    },
    afternoon: {
      bg: 'linear-gradient(135deg, #87CEEB 0%, #98FB98 50%, #F0E68C 100%)',
      accent: '#32CD32',
      icon: '☀️',
      title: 'Afternoon Adventure',
      description: 'Make the most of daylight hours',
      keywords: ['lunch', 'outdoor', 'active', 'exploration', 'daylight']
    },
    evening: {
      bg: 'linear-gradient(135deg, #FF69B4 0%, #9370DB 50%, #4B0082 100%)',
      accent: '#9370DB',
      icon: '🌆',
      title: 'Evening Magic',
      description: 'Wind down with perfect ambiance',
      keywords: ['romantic', 'dinner', 'sunset', 'relaxing', 'cozy']
    },
    night: {
      bg: 'linear-gradient(135deg, #2C3E50 0%, #34495E 50%, #2C3E50 100%)',
      accent: '#FFD700',
      icon: '🌙',
      title: 'Night Life',
      description: 'Discover the city after dark',
      keywords: ['night', 'entertainment', 'clubs', 'late night', 'city lights']
    }
  };

  // Weather condition mappings
  const weatherConditions = {
    0: { condition: 'clear', icon: '☀️', keywords: ['sunny', 'outdoor', 'bright'] },
    1: { condition: 'mostly_clear', icon: '🌤️', keywords: ['sunny', 'outdoor', 'mild'] },
    2: { condition: 'partly_cloudy', icon: '⛅', keywords: ['cloudy', 'outdoor', 'comfortable'] },
    3: { condition: 'overcast', icon: '☁️', keywords: ['cloudy', 'indoor', 'cozy'] },
    45: { condition: 'foggy', icon: '🌫️', keywords: ['foggy', 'indoor', 'mysterious'] },
    48: { condition: 'rime_fog', icon: '🌫️', keywords: ['foggy', 'indoor', 'unique'] },
    51: { condition: 'light_drizzle', icon: '🌦️', keywords: ['rainy', 'indoor', 'cozy'] },
    53: { condition: 'drizzle', icon: '🌦️', keywords: ['rainy', 'indoor', 'comfortable'] },
    55: { condition: 'heavy_drizzle', icon: '🌧️', keywords: ['rainy', 'indoor', 'dry'] },
    56: { condition: 'light_freezing_drizzle', icon: '🌧️', keywords: ['rainy', 'indoor', 'warm'] },
    57: { condition: 'freezing_drizzle', icon: '🌧️', keywords: ['rainy', 'indoor', 'warm'] },
    61: { condition: 'light_rain', icon: '🌦️', keywords: ['rainy', 'indoor', 'cozy'] },
    63: { condition: 'rain', icon: '🌧️', keywords: ['rainy', 'indoor', 'comfortable'] },
    65: { condition: 'heavy_rain', icon: '🌧️', keywords: ['rainy', 'indoor', 'dry'] },
    66: { condition: 'light_freezing_rain', icon: '🌧️', keywords: ['rainy', 'indoor', 'warm'] },
    67: { condition: 'freezing_rain', icon: '🌧️', keywords: ['rainy', 'indoor', 'warm'] },
    71: { condition: 'light_snow', icon: '🌨️', keywords: ['snowy', 'indoor', 'warm'] },
    73: { condition: 'snow', icon: '❄️', keywords: ['snowy', 'indoor', 'cozy'] },
    75: { condition: 'heavy_snow', icon: '❄️', keywords: ['snowy', 'indoor', 'warm'] },
    77: { condition: 'snow_grains', icon: '❄️', keywords: ['snowy', 'indoor', 'unique'] },
    80: { condition: 'light_rain_showers', icon: '🌦️', keywords: ['rainy', 'indoor', 'cozy'] },
    81: { condition: 'rain_showers', icon: '🌧️', keywords: ['rainy', 'indoor', 'comfortable'] },
    82: { condition: 'heavy_rain_showers', icon: '🌧️', keywords: ['rainy', 'indoor', 'dry'] },
    85: { condition: 'light_snow_showers', icon: '🌨️', keywords: ['snowy', 'indoor', 'warm'] },
    86: { condition: 'snow_showers', icon: '❄️', keywords: ['snowy', 'indoor', 'cozy'] },
    95: { condition: 'thunderstorm', icon: '⛈️', keywords: ['stormy', 'indoor', 'safe'] },
    96: { condition: 'thunderstorm_hail', icon: '⛈️', keywords: ['stormy', 'indoor', 'safe'] },
    99: { condition: 'heavy_thunderstorm_hail', icon: '⛈️', keywords: ['stormy', 'indoor', 'safe'] }
  };

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Determine time of day
  useEffect(() => {
    const hour = currentTime.getHours();
    if (hour >= 5 && hour < 12) {
      setTimeOfDay('morning');
    } else if (hour >= 12 && hour < 17) {
      setTimeOfDay('afternoon');
    } else if (hour >= 17 && hour < 22) {
      setTimeOfDay('evening');
    } else {
      setTimeOfDay('night');
    }
  }, [currentTime]);

  // Fetch weather data
  const fetchWeather = async () => {
    if (!userLocation) return;

    setWeatherLoading(true);
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${userLocation.lat}&longitude=${userLocation.lng}&current_weather=true&hourly=temperature_2m,weathercode&timezone=auto`
      );
      const data = await response.json();

      if (data.current_weather) {
        const weatherCode = data.current_weather.weathercode;
        const condition = weatherConditions[weatherCode as keyof typeof weatherConditions] ||
                         { condition: 'unknown', icon: '❓', keywords: ['indoor'] };

        setWeather({
          temperature: Math.round(data.current_weather.temperature),
          weatherCode,
          condition: condition.condition,
          icon: condition.icon
        });
      }
    } catch (error) {
      console.error('Weather fetch error:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

  // Auto-fetch weather when location is available
  useEffect(() => {
    if (userLocation && !weather) {
      fetchWeather();
    }
  }, [userLocation]);

  // Generate smart search query combining time and weather
  const generateSmartQuery = () => {
    const timeTheme = timeThemes[timeOfDay];
    const weatherKeywords = weather ? weatherConditions[weather.weatherCode as keyof typeof weatherConditions]?.keywords || [] : [];

    // Combine time and weather keywords
    const allKeywords = [...timeTheme.keywords, ...weatherKeywords];

    // Create a natural language query
    const timePhrase = timeTheme.title.toLowerCase();
    const weatherPhrase = weather ? `when it's ${weatherConditions[weather.weatherCode as keyof typeof weatherConditions]?.condition || 'mild'}` : '';

    const queryText = `${timePhrase} ${weatherPhrase} activities in Astana`.trim();

    return {
      location: 'Current location',
      preferences: queryText,
      timeAvailable: '1-2 hours',
      withChildren: false,
      specialRequirements: allKeywords.join(', ')
    };
  };

  const handleSmartSearch = () => {
    const query = generateSmartQuery();
    onSearch(query);
  };

  const currentTheme = timeThemes[timeOfDay];

  return (
    <div className="time-weather-page" style={{ background: currentTheme.bg }}>
      {/* Header */}
      <div className="time-weather-header">
        <div className="time-display">
          <div className="time-icon">{currentTheme.icon}</div>
          <div className="time-info">
            <h1>{currentTheme.title}</h1>
            <p>{currentTheme.description}</p>
            <div className="current-time">
              {currentTime.toLocaleTimeString('ru-RU', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false
              })}
            </div>
          </div>
        </div>

        {/* Weather Display */}
        <div className="weather-display">
          {weatherLoading ? (
            <div className="weather-loading">
              <div className="weather-spinner"></div>
              <span>Loading weather...</span>
            </div>
          ) : weather ? (
            <div className="weather-info">
              <div className="weather-icon">{weather.icon}</div>
              <div className="weather-details">
                <div className="temperature">{weather.temperature}°C</div>
                <div className="condition">
                  {weatherConditions[weather.weatherCode as keyof typeof weatherConditions]?.condition || 'Unknown'}
                </div>
              </div>
            </div>
          ) : (
            <div className="weather-placeholder">
              <span>📍</span>
              <span>Location needed for weather</span>
            </div>
          )}
        </div>
      </div>

      {/* Smart Recommendations */}
      <div className="smart-recommendations">
        <h2>Perfect for Right Now</h2>
        <p>AI-powered suggestions based on current time and weather</p>

        <div className="recommendation-themes">
          <div className="theme-card" style={{ borderColor: currentTheme.accent }}>
            <div className="theme-icon">{currentTheme.icon}</div>
            <div className="theme-content">
              <h3>Time-Based</h3>
              <p>{currentTheme.keywords.slice(0, 3).join(', ')}</p>
            </div>
          </div>

          {weather && (
            <div className="theme-card" style={{ borderColor: currentTheme.accent }}>
              <div className="theme-icon">{weather.icon}</div>
              <div className="theme-content">
                <h3>Weather-Based</h3>
                <p>
                  {weatherConditions[weather.weatherCode as keyof typeof weatherConditions]?.keywords.slice(0, 3).join(', ') || 'indoor activities'}
                </p>
              </div>
            </div>
          )}
        </div>

        <button
          className="smart-search-btn"
          onClick={handleSmartSearch}
          disabled={isLoading}
          style={{ background: currentTheme.accent }}
        >
          {isLoading ? (
            <>
              <div className="btn-spinner"></div>
              Finding perfect activities...
            </>
          ) : (
            <>
              🎯 Discover Perfect Activities
            </>
          )}
        </button>
      </div>

      {/* Quick Time Slots */}
      <div className="quick-slots">
        <h3>Explore by Time</h3>
        <div className="time-slots">
          {Object.entries(timeThemes).map(([key, theme]) => (
            <button
              key={key}
              className={`time-slot ${key === timeOfDay ? 'active' : ''}`}
              onClick={() => {
                const query = {
                  location: 'Current location',
                  preferences: `${theme.title.toLowerCase()} activities in Astana`,
                  timeAvailable: '1-2 hours',
                  withChildren: false,
                  specialRequirements: theme.keywords.join(', ')
                };
                onSearch(query);
              }}
              style={{
                background: key === timeOfDay ? theme.bg : 'rgba(255,255,255,0.1)',
                borderColor: theme.accent
              }}
            >
              <span className="slot-icon">{theme.icon}</span>
              <span className="slot-title">{theme.title}</span>
              <span className="slot-desc">{theme.keywords[0]}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TimeWeatherPage;
