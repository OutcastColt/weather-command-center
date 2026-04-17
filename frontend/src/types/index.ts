export type OverlayKey = 'wind' | 'cloud' | 'rain' | 'temp';

export interface CityConfig {
  id: string;
  name: string;
  lat: number;
  lon: number;
  mapX: string; // CSS left % on map
  mapY: string; // CSS top % on map
}

export interface CityWeather {
  cityId: string;
  tempF: number;
  windSpeed: number;
  windDir: number;
  humidity: number;
  precipitation: number;
  cloudCover: number;
  weatherCode: number;
  loading: boolean;
  error: boolean;
}

export interface WeatherState {
  cities: Record<string, CityWeather>;
  lastUpdated: Date | null;
  loading: boolean;
}

export type RefreshInterval = 5 | 15 | 30 | 60;
