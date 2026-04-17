import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { CityConfig, CityWeather, WeatherState } from '../types';
import { DEFAULT_CITIES } from './useCities';

export { DEFAULT_CITIES as CITIES };

const OPEN_METEO = 'https://api.open-meteo.com/v1/forecast';
const AIR_QUALITY_API = 'https://air-quality-api.open-meteo.com/v1/air-quality';

function weatherCodeToDesc(code: number): string {
  if (code === 0) return 'Clear Sky';
  if (code <= 3)  return code === 1 ? 'Mainly Clear' : code === 2 ? 'Partly Cloudy' : 'Overcast';
  if (code <= 49) return 'Foggy';
  if (code <= 57) return 'Drizzle';
  if (code <= 67) return 'Rainy';
  if (code <= 77) return 'Snow';
  if (code <= 82) return 'Showers';
  if (code <= 86) return 'Snow Showers';
  return 'Thunderstorm';
}

function weatherCodeToIcon(code: number): string {
  if (code === 0) return '☀️';
  if (code <= 2)  return '🌤️';
  if (code <= 3)  return '⛅';
  if (code <= 49) return '🌫️';
  if (code <= 67) return '🌧️';
  if (code <= 77) return '❄️';
  if (code <= 82) return '🌦️';
  return '⛈️';
}

async function fetchCityWeather(city: CityConfig): Promise<CityWeather> {
  const params = {
    latitude: city.lat,
    longitude: city.lon,
    current: [
      'temperature_2m',
      'windspeed_10m',
      'winddirection_10m',
      'relativehumidity_2m',
      'precipitation',
      'cloudcover',
      'weathercode',
    ].join(','),
    temperature_unit: 'fahrenheit',
    windspeed_unit: 'mph',
    precipitation_unit: 'inch',
  };

  const [weatherRes, aqiRes] = await Promise.allSettled([
    axios.get(OPEN_METEO, { params }),
    axios.get(AIR_QUALITY_API, {
      params: { latitude: city.lat, longitude: city.lon, current: 'us_aqi' },
    }),
  ]);

  if (weatherRes.status === 'rejected') throw (weatherRes as PromiseRejectedResult).reason;

  const c = (weatherRes as PromiseFulfilledResult<{ data: { current: Record<string, number> } }>).value.data.current;
  const aqiData = aqiRes.status === 'fulfilled'
    ? (aqiRes as PromiseFulfilledResult<{ data: { current: { us_aqi?: number } } }>).value.data.current
    : null;

  return {
    cityId:        city.id,
    tempF:         Math.round(c.temperature_2m),
    windSpeed:     Math.round(c.windspeed_10m),
    windDir:       Math.round(c.winddirection_10m),
    humidity:      Math.round(c.relativehumidity_2m),
    precipitation: c.precipitation,
    cloudCover:    Math.round(c.cloudcover),
    weatherCode:   c.weathercode,
    aqi:           aqiData?.us_aqi ?? undefined,
    loading:       false,
    error:         false,
  };
}

function windDirToCardinal(deg: number): string {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

export function weatherCodeToDescription(code: number) { return weatherCodeToDesc(code); }
export function weatherCodeIcon(code: number) { return weatherCodeToIcon(code); }
export function windCardinal(deg: number) { return windDirToCardinal(deg); }

export function useWeatherData(refreshIntervalMins: number, cities: CityConfig[]) {
  const [state, setState] = useState<WeatherState>({
    cities: {},
    lastUpdated: null,
    loading: true,
  });

  const fetchAll = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    const results = await Promise.all(
      cities.map(city =>
        fetchCityWeather(city).catch((): CityWeather => ({
          cityId: city.id, tempF: 0, windSpeed: 0, windDir: 0, humidity: 0,
          precipitation: 0, cloudCover: 0, weatherCode: 0, loading: false, error: true,
        }))
      )
    );
    const citiesMap: Record<string, CityWeather> = {};
    results.forEach(r => { citiesMap[r.cityId] = r; });
    setState({ cities: citiesMap, lastUpdated: new Date(), loading: false });
  }, [cities]);

  useEffect(() => {
    fetchAll();
    const ms = refreshIntervalMins * 60 * 1000;
    const timer = setInterval(fetchAll, ms);
    return () => clearInterval(timer);
  }, [fetchAll, refreshIntervalMins]);

  return { ...state, refetch: fetchAll };
}
