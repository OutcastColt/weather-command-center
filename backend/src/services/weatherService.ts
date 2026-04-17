import axios from 'axios';

const OPEN_METEO_URL = 'https://api.open-meteo.com/v1/forecast';
const CACHE_TTL_MS = (Number(process.env.WEATHER_CACHE_TTL_MINUTES) || 15) * 60 * 1000;

const CITIES: Record<string, { lat: number; lon: number; name: string; timezone: string }> = {
  'corpus-christi': { lat: 27.8006, lon: -97.3964, name: 'Corpus Christi', timezone: 'America/Chicago' },
  'corpus christi':  { lat: 27.8006, lon: -97.3964, name: 'Corpus Christi', timezone: 'America/Chicago' },
  'brownsville':     { lat: 25.9017, lon: -97.4975, name: 'Brownsville',    timezone: 'America/Chicago' },
  'mcallen':         { lat: 26.2034, lon: -98.2300, name: 'McAllen',        timezone: 'America/Chicago' },
};

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<unknown>>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key) as CacheEntry<T> | undefined;
  if (entry && Date.now() < entry.expiresAt) return entry.data;
  cache.delete(key);
  return null;
}

function setCached<T>(key: string, data: T): void {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

function resolveCoords(city?: string, lat?: number, lon?: number) {
  if (city) {
    const record = CITIES[city.toLowerCase()];
    if (!record) throw new Error(`Unknown city: ${city}. Supported: corpus-christi, brownsville, mcallen`);
    return { lat: record.lat, lon: record.lon, name: record.name, timezone: record.timezone };
  }
  if (lat !== undefined && lon !== undefined) {
    return { lat, lon, name: `${lat},${lon}`, timezone: 'America/Chicago' };
  }
  throw new Error('Provide either city or lat/lon');
}

export interface CurrentWeather {
  city: string;
  latitude: number;
  longitude: number;
  time: string;
  temperature_c: number;
  wind_speed_kmh: number;
  wind_direction_deg: number;
  cloud_cover_pct: number;
  precipitation_mm: number;
  weather_code: number;
  cached: boolean;
}

export interface HourlyForecast {
  time: string;
  temperature_c: number;
  wind_speed_kmh: number;
  wind_direction_deg: number;
  cloud_cover_pct: number;
  precipitation_mm: number;
}

export interface Forecast {
  city: string;
  latitude: number;
  longitude: number;
  hourly: HourlyForecast[];
  cached: boolean;
}

export class WeatherService {
  async getCurrentWeather(city?: string, lat?: number, lon?: number): Promise<CurrentWeather> {
    const coords = resolveCoords(city, lat, lon);
    const cacheKey = `current:${coords.lat}:${coords.lon}`;
    const cached = getCached<CurrentWeather>(cacheKey);
    if (cached) return { ...cached, cached: true };

    const { data } = await axios.get(OPEN_METEO_URL, {
      params: {
        latitude: coords.lat,
        longitude: coords.lon,
        timezone: coords.timezone,
        current: 'temperature_2m,wind_speed_10m,wind_direction_10m,cloud_cover,precipitation,weather_code',
      },
    });

    const c = data.current;
    const result: CurrentWeather = {
      city: coords.name,
      latitude: coords.lat,
      longitude: coords.lon,
      time: c.time,
      temperature_c: c.temperature_2m,
      wind_speed_kmh: c.wind_speed_10m,
      wind_direction_deg: c.wind_direction_10m,
      cloud_cover_pct: c.cloud_cover,
      precipitation_mm: c.precipitation,
      weather_code: c.weather_code,
      cached: false,
    };

    setCached(cacheKey, result);
    return result;
  }

  async getForecast(city?: string, lat?: number, lon?: number): Promise<Forecast> {
    const coords = resolveCoords(city, lat, lon);
    const cacheKey = `forecast:${coords.lat}:${coords.lon}`;
    const cached = getCached<Forecast>(cacheKey);
    if (cached) return { ...cached, cached: true };

    const { data } = await axios.get(OPEN_METEO_URL, {
      params: {
        latitude: coords.lat,
        longitude: coords.lon,
        timezone: coords.timezone,
        hourly: 'temperature_2m,wind_speed_10m,wind_direction_10m,cloud_cover,precipitation',
        forecast_days: 7,
      },
    });

    const h = data.hourly;
    const hourly: HourlyForecast[] = h.time.map((t: string, i: number) => ({
      time: t,
      temperature_c: h.temperature_2m[i],
      wind_speed_kmh: h.wind_speed_10m[i],
      wind_direction_deg: h.wind_direction_10m[i],
      cloud_cover_pct: h.cloud_cover[i],
      precipitation_mm: h.precipitation[i],
    }));

    const result: Forecast = {
      city: coords.name,
      latitude: coords.lat,
      longitude: coords.lon,
      hourly,
      cached: false,
    };

    setCached(cacheKey, result);
    return result;
  }
}
