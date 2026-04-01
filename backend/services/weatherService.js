const axios = require("axios");

exports.getWeather = async () => {
  try {
    const res = await axios.get(
      "https://api.openweathermap.org/data/2.5/weather?q=Bangalore&appid=YOUR_API_KEY"
    );

    return res.data.rain?.["1h"] || 0;
  } catch (err) {
    console.log("⚠️ Weather API failed → using dummy");
    return 70; // fallback
  }
};