import { useState, useCallback } from 'react';
import axios from 'axios';
import { CityConfig } from '../types';

const STORAGE_KEY = 'wcc-cities-v2';

export const DEFAULT_CITIES: CityConfig[] = [
  { id: 'corpus',      name: 'Corpus Christi', lat: 27.8006, lon: -97.3964, mapX: '42%', mapY: '38%', zipCode: '78401' },
  { id: 'brownsville', name: 'Brownsville',    lat: 25.9017, lon: -97.4975, mapX: '55%', mapY: '72%', zipCode: '78520' },
  { id: 'mcallen',     name: 'McAllen',        lat: 26.2034, lon: -98.2300, mapX: '43%', mapY: '65%', zipCode: '78501' },
];

function loadCities(): CityConfig[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CityConfig[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}
  return DEFAULT_CITIES;
}

function saveCities(cities: CityConfig[]): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cities)); } catch {}
}

export function useCities() {
  const [cities, setCities] = useState<CityConfig[]>(loadCities);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeError, setGeocodeError] = useState<string | null>(null);

  const addCity = useCallback(async (query: string): Promise<boolean> => {
    setGeocoding(true);
    setGeocodeError(null);
    try {
      const res = await axios.get('https://nominatim.openstreetmap.org/search', {
        params: { q: query, format: 'json', limit: 1, addressdetails: 1 },
        headers: { 'Accept-Language': 'en', 'User-Agent': 'WeatherCommandCenter/2.0' },
      });
      if (!res.data.length) {
        setGeocodeError('Location not found. Try a different address or ZIP code.');
        return false;
      }
      const r = res.data[0];
      const addr = r.address || {};
      const name = addr.city || addr.town || addr.village || addr.county || r.display_name.split(',')[0].trim();
      const id = `city_${Date.now()}`;
      const newCity: CityConfig = {
        id,
        name,
        lat: parseFloat(r.lat),
        lon: parseFloat(r.lon),
        mapX: '50%',
        mapY: '50%',
        zipCode: query,
      };
      setCities(prev => {
        const updated = [...prev, newCity];
        saveCities(updated);
        return updated;
      });
      return true;
    } catch {
      setGeocodeError('Geocoding failed. Check your connection and try again.');
      return false;
    } finally {
      setGeocoding(false);
    }
  }, []);

  const removeCity = useCallback((id: string) => {
    setCities(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveCities(updated.length ? updated : DEFAULT_CITIES);
      return updated.length ? updated : DEFAULT_CITIES;
    });
  }, []);

  const resetToDefaults = useCallback(() => {
    setCities(DEFAULT_CITIES);
    saveCities(DEFAULT_CITIES);
  }, []);

  const clearError = useCallback(() => setGeocodeError(null), []);

  return { cities, addCity, removeCity, resetToDefaults, geocoding, geocodeError, clearError };
}
