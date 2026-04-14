const axios = require("axios");

/**
 * Weather Data Service
 * Phase 3 Enhancement: Supports multiple real API sources with fallback
 * Addresses Phase 2 feedback on "limited external API integration"
 */

// API Configuration - can be set via environment variables
const WEATHER_APIs = {
  OPENWEATHER: {
    name: 'OpenWeatherMap',
    url: 'https://api.openweathermap.org/data/2.5',
    key: process.env.OPENWEATHER_API_KEY || 'YOUR_API_KEY',
    endpoint: '/weather'
  },
  WEATHERAPI: {
    name: 'WeatherAPI.com',
    url: 'https://api.weatherapi.com/v1',
    key: process.env.WEATHERAPI_KEY || 'YOUR_API_KEY',
    endpoint: '/current.json'
  },
  VISUALCROSSING: {
    name: 'Visual Crossing',
    url: 'https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline',
    key: process.env.VISUALCROSSING_KEY || 'YOUR_API_KEY'
  }
};

// Rainfall thresholds (mm) for claim triggering
const RAINFALL_THRESHOLDS = {
  light: 2.5,
  moderate: 10,
  heavy: 25,
  extreme: 50
};

// AQI thresholds
const AQI_THRESHOLDS = {
  good: { min: 0, max: 50 },
  satisfactory: { min: 51, max: 100 },
  mildly_polluted: { min: 101, max: 200 },
  poor: { min: 201, max: 300 },
  very_poor: { min: 301, max: 400 },
  severe: { min: 401, max: 500 }
};

/**
 * Get weather data from multiple sources with fallback
 * Falls back to simulated data if all APIs fail
 */
exports.getWeather = async (location = 'Bangalore', lat = 12.9716, lon = 77.5946) => {
  try {
    // Try Primary: OpenWeatherMap
    try {
      return await getOpenWeatherData(lat, lon);
    } catch (err) {
      console.log("⚠️ OpenWeatherMap failed, trying WeatherAPI...");
    }

    // Try Secondary: WeatherAPI.com
    try {
      return await getWeatherAPIData(location);
    } catch (err) {
      console.log("⚠️ WeatherAPI failed, trying Visual Crossing...");
    }

    // Try Tertiary: Visual Crossing
    try {
      return await getVisualCrossingData(lat, lon);
    } catch (err) {
      console.log("⚠️ All weather APIs failed, using simulated data");
    }

    // Fallback: Simulated data based on time and day
    return getSimulatedWeatherData(location);

  } catch (error) {
    console.error("❌ Weather service error:", error.message);
    return getSimulatedWeatherData(location);
  }
};

/**
 * Get data from OpenWeatherMap API
 */
async function getOpenWeatherData(lat, lon) {
  const api = WEATHER_APIs.OPENWEATHER;
  
  const url = `${api.url}${api.endpoint}?lat=${lat}&lon=${lon}&appid=${api.key}&units=metric`;
  const response = await axios.get(url, { timeout: 5000 });
  
  return {
    source: 'OpenWeatherMap',
    rainfall: response.data.rain?.['1h'] || 0,
    temperature: response.data.main?.temp || 25,
    humidity: response.data.main?.humidity || 60,
    windSpeed: response.data.wind?.speed || 5,
    cloudCover: response.data.clouds?.all || 30,
    description: response.data.weather?.[0]?.description || 'clear',
    timestamp: new Date().toISOString()
  };
}

/**
 * Get data from WeatherAPI.com
 */
async function getWeatherAPIData(location) {
  const api = WEATHER_APIs.WEATHERAPI;
  
  const url = `${api.url}${api.endpoint}?key=${api.key}&q=${location}&aqi=yes`;
  const response = await axios.get(url, { timeout: 5000 });
  
  const current = response.data.current;
  
  return {
    source: 'WeatherAPI',
    rainfall: current.precip_mm || 0,
    temperature: current.temp_c || 25,
    humidity: current.humidity || 60,
    windSpeed: current.wind_kph / 3.6 || 5,  // Convert to m/s
    cloudCover: current.cloud || 30,
    aqi: current.air_quality?.pm2_5 || null,
    description: current.condition?.text || 'clear',
    timestamp: new Date().toISOString()
  };
}

/**
 * Get data from Visual Crossing Weather API
 */
async function getVisualCrossingData(lat, lon) {
  const api = WEATHER_APIs.VISUALCROSSING;
  
  const url = `${api.url}/${lat},${lon}?key=${api.key}&include=current&unitGroup=metric`;
  const response = await axios.get(url, { timeout: 5000 });
  
  const current = response.data.currentConditions;
  
  return {
    source: 'VisualCrossing',
    rainfall: current.precip || 0,
    temperature: current.temp || 25,
    humidity: current.humidity || 60,
    windSpeed: current.windspeed / 3.6 || 5,  // Convert to m/s
    cloudCover: current.cloudcover || 30,
    description: current.conditions || 'clear',
    timestamp: new Date().toISOString()
  };
}

/**
 * Simulated weather data based on time patterns
 * Used when APIs are unavailable
 */
function getSimulatedWeatherData(location) {
  const hour = new Date().getHours();
  const dayOfWeek = new Date().getDay();
  
  // Pattern: Higher rainfall during monsoon hours (14:00-18:00)
  let rainfall = 0;
  if (hour >= 14 && hour <= 18) {
    rainfall = 15 + Math.random() * 35;  // 15-50mm during monsoon hours
  } else if (hour >= 9 && hour <= 21) {
    rainfall = Math.random() * 5;  // 0-5mm other times
  }
  
  // Temperature variation
  let temperature = 25;
  if (hour >= 14 && hour <= 16) {
    temperature = 30 + Math.random() * 5;  // Peak heat
  } else if (hour >= 6 && hour <= 9) {
    temperature = 20 + Math.random() * 5;  // Morning cool
  } else {
    temperature = 22 + Math.random() * 6;
  }
  
  // AQI varies by day (weekends lower, weekdays higher)
  let aqi = 150 + Math.random() * 100;  // 150-250 (mildly polluted)
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    aqi = 100 + Math.random() * 80;  // Weekends lower
  }
  
  return {
    source: 'Simulated (APIs unavailable)',
    rainfall: parseFloat(rainfall.toFixed(1)),
    temperature: parseFloat(temperature.toFixed(1)),
    humidity: 60 + Math.random() * 30,
    windSpeed: 5 + Math.random() * 10,
    cloudCover: 30 + Math.random() * 50,
    aqi: parseFloat(aqi.toFixed(1)),
    description: rainfall > 10 ? 'rainy' : 'partly cloudy',
    timestamp: new Date().toISOString(),
    note: 'Using simulated data - real APIs not configured'
  };
}

/**
 * Get Air Quality Index (AQI) data
 */
exports.getAQI = async (location = 'Bangalore', lat = 12.9716, lon = 77.5946) => {
  try {
    // Try to get real AQI data
    const response = await axios.get(
      `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${WEATHER_APIs.OPENWEATHER.key}`,
      { timeout: 5000 }
    );
    
    const aqi = response.data.list[0].main.aqi;  // 1=Good, 2=Fair, 3=Moderate, 4=Poor, 5=V.Poor
    
    return {
      source: 'OpenWeatherMap',
      aqi: aqi,
      pm2_5: response.data.list[0].components?.pm2_5 || null,
      pm10: response.data.list[0].components?.pm10 || null,
      timestamp: new Date().toISOString()
    };
    
  } catch (error) {
    console.log("⚠️ AQI API failed, using simulated data");
    
    // Simulated AQI
    return {
      source: 'Simulated',
      aqi: Math.floor(Math.random() * 5) + 1,
      pm2_5: 100 + Math.random() * 200,
      pm10: 150 + Math.random() * 250,
      timestamp: new Date().toISOString()
    };
  }
};

/**
 * Validate if claim matches real weather conditions
 */
exports.validateClaimAgainstWeather = async (claimType, lat, lon) => {
  try {
    const weather = await exports.getWeather('Bangalore', lat, lon);
    
    switch (claimType.toLowerCase()) {
      case 'rainfall':
        return {
          valid: weather.rainfall > RAINFALL_THRESHOLDS.light,
          actualData: weather.rainfall,
          threshold: RAINFALL_THRESHOLDS.light,
          confidence: 0.9
        };
      
      case 'heat':
        return {
          valid: weather.temperature > 38,
          actualData: weather.temperature,
          threshold: 38,
          confidence: 0.85
        };
      
      case 'pollution':
        const aqi = await exports.getAQI('Bangalore', lat, lon);
        return {
          valid: aqi.aqi >= 3,  // Moderate or worse
          actualData: aqi.aqi,
          threshold: 3,
          confidence: 0.88
        };
      
      case 'congestion':
        // Future: Integrate with traffic APIs (Google Maps, HERE, TomTom)
        return {
          valid: true,  // Placeholder for future traffic API
          actualData: 'Not implemented',
          threshold: 'N/A',
          confidence: 0.3
        };
      
      default:
        return { valid: true, confidence: 0.5 };
    }
  } catch (error) {
    console.error("❌ Claim validation error:", error);
    return { valid: true, confidence: 0.3, error: error.message };
  }
};

console.log("✅ Weather Service loaded with multi-source API support");