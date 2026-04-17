import axios from 'axios';

const AIR_QUALITY_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes

export interface AirQualityResult {
  aqi: number;
  pm10: number;
  pm2_5: number;
  label: string;
  cached: boolean;
}

interface CacheEntry {
  data: AirQualityResult;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function aqiLabel(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

export class AirQualityService {
  async getAirQuality(lat: number, lon: number): Promise<AirQualityResult> {
    const key = `${lat.toFixed(4)}:${lon.toFixed(4)}`;
    const cached = cache.get(key);
    if (cached && Date.now() < cached.expiresAt) return { ...cached.data, cached: true };

    const { data } = await axios.get(AIR_QUALITY_URL, {
      params: {
        latitude: lat,
        longitude: lon,
        current: 'pm10,pm2_5,us_aqi',
      },
    });

    const c = data.current;
    const result: AirQualityResult = {
      aqi: c.us_aqi ?? 0,
      pm10: c.pm10 ?? 0,
      pm2_5: c.pm2_5 ?? 0,
      label: aqiLabel(c.us_aqi ?? 0),
      cached: false,
    };

    cache.set(key, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  }
}
