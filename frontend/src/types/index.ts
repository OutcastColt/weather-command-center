export type OverlayKey = 'wind' | 'cloud' | 'rain' | 'temp';
export type MapType = 'standard' | 'satellite' | 'terrain';

export interface CityConfig {
  id: string;
  name: string;
  lat: number;
  lon: number;
  mapX: string;
  mapY: string;
  zipCode?: string;
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
  aqi?: number;
  loading: boolean;
  error: boolean;
}

export interface WeatherState {
  cities: Record<string, CityWeather>;
  lastUpdated: Date | null;
  loading: boolean;
}

export type RefreshInterval = 5 | 15 | 30 | 60;
