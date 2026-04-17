import axios from 'axios';

const BASE_URL = process.env.WEATHER_API_BASE_URL || 'https://api.openweathermap.org/data/2.5';
const API_KEY = process.env.WEATHER_API_KEY;

export class WeatherService {
  private buildParams(city?: string, lat?: number, lon?: number): Record<string, string | number> {
    const params: Record<string, string | number> = { appid: API_KEY || '', units: 'metric' };
    if (city) {
      params.q = city;
    } else if (lat !== undefined && lon !== undefined) {
      params.lat = lat;
      params.lon = lon;
    }
    return params;
  }

  async getCurrentWeather(city?: string, lat?: number, lon?: number) {
    const response = await axios.get(`${BASE_URL}/weather`, {
      params: this.buildParams(city, lat, lon),
    });
    return response.data;
  }

  async getForecast(city?: string, lat?: number, lon?: number) {
    const response = await axios.get(`${BASE_URL}/forecast`, {
      params: this.buildParams(city, lat, lon),
    });
    return response.data;
  }
}
