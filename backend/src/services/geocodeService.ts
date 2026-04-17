import axios from 'axios';

const NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const USER_AGENT = 'WeatherCommandCenter/1.0 (weather-command-center; gforceklr650@gmail.com)';

export interface GeocodeResult {
  lat: number;
  lon: number;
  city: string;
  state: string;
  cached: boolean;
}

interface CacheEntry {
  data: GeocodeResult;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

// Nominatim allows 1 req/sec — serialize requests through a simple queue
let lastRequestTime = 0;
async function throttledGet(url: string, params: Record<string, string>) {
  const now = Date.now();
  const wait = 1000 - (now - lastRequestTime);
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastRequestTime = Date.now();
  return axios.get(url, { params, headers: { 'User-Agent': USER_AGENT } });
}

export class GeocodeService {
  async geocode(query: string): Promise<GeocodeResult> {
    const key = query.trim().toLowerCase();
    const cached = cache.get(key);
    if (cached && Date.now() < cached.expiresAt) return { ...cached.data, cached: true };

    const { data } = await throttledGet(NOMINATIM_URL, {
      q: query,
      format: 'json',
      limit: '1',
      countrycodes: 'us',
    });

    if (!data || data.length === 0) {
      throw new Error(`No results found for: ${query}`);
    }

    const place = data[0];
    const displayParts = (place.display_name as string).split(', ');

    // Nominatim display_name format: "name, city, county, state, postcode, country"
    // We extract city and state heuristically
    const state = displayParts[displayParts.length - 2] ?? '';
    const city = displayParts[0] ?? query;

    const result: GeocodeResult = {
      lat: parseFloat(place.lat),
      lon: parseFloat(place.lon),
      city,
      state,
      cached: false,
    };

    cache.set(key, { data: result, expiresAt: Date.now() + CACHE_TTL_MS });
    return result;
  }
}
