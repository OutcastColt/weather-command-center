import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';
import { CityConfig, CityWeather, MapType, OverlayKey } from '../types';
import { weatherCodeIcon, windCardinal } from '../hooks/useWeatherData';

const SOUTH_TEXAS_CENTER: [number, number] = [26.8, -97.8];
const SOUTH_TEXAS_ZOOM = 8;
const ZOOM_DETAIL_THRESHOLD = 9;

const TILE_LAYERS: Record<MapType, { url: string; attribution: string; maxZoom: number }> = {
  standard: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, GeoEye, Earthstar Geographics',
    maxZoom: 19,
  },
  terrain: {
    url: 'https://tiles.stadiamaps.com/tiles/stamen_terrain/{z}/{x}/{y}{r}.png',
    attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a> &copy; <a href="https://stamen.com/">Stamen Design</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    maxZoom: 18,
  },
};

interface Props {
  activeOverlays: Set<OverlayKey>;
  cityWeather: Record<string, CityWeather>;
  selectedCity: string;
  onSelectCity: (id: string) => void;
  cities: CityConfig[];
  mapType: MapType;
  onMapTypeChange: (t: MapType) => void;
}

function aqiLabel(aqi: number): { text: string; color: string } {
  if (aqi <= 50)  return { text: 'Good',     color: '#22c55e' };
  if (aqi <= 100) return { text: 'Moderate', color: '#f59e0b' };
  if (aqi <= 150) return { text: 'USG',      color: '#f97316' };
  return { text: 'Unhealthy', color: '#ef4444' };
}

function buildMarkerIcon(city: CityConfig, weather: CityWeather | undefined, zoomedIn: boolean) {
  const temp = weather ? `${weather.tempF}°F` : '…';
  const icon = weather ? weatherCodeIcon(weather.weatherCode) : '…';

  let extraBadges = '';
  if (zoomedIn && weather && !weather.error) {
    if (weather.precipitation > 0.01) {
      extraBadges += `<span class="cm-rain-badge" title="Precipitation: ${weather.precipitation}&quot;">🌧</span>`;
    }
    if (weather.aqi !== undefined && weather.aqi > 50) {
      const { text, color } = aqiLabel(weather.aqi);
      extraBadges += `<span class="cm-aqi-badge" style="color:${color}" title="AQI: ${weather.aqi}">AQI ${text}</span>`;
    }
  }

  return L.divIcon({
    className: 'city-marker-icon',
    html: `
      <div class="cm-wrapper${zoomedIn ? ' cm-zoomed' : ''}">
        <div class="cm-label">
          <span class="cm-name">${city.name}</span>
          <span class="cm-badge">${temp}</span>
          ${extraBadges}
        </div>
        <div class="cm-pin"></div>
        <div class="cm-icon" aria-hidden="true">${icon}</div>
      </div>`,
    iconAnchor: [0, 40],
    popupAnchor: [60, -50],
  });
}

function WindOverlayPane({ cityWeather, cities }: { cityWeather: Record<string, CityWeather>; cities: CityConfig[] }) {
  const map = useMap();
  const paneRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const paneName = 'wind-arrows-pane';
    if (!map.getPane(paneName)) {
      map.createPane(paneName);
      const pane = map.getPane(paneName)!;
      (pane as HTMLElement).style.zIndex = '450';
      (pane as HTMLElement).style.pointerEvents = 'none';
    }
    paneRef.current = map.getPane(paneName) as HTMLDivElement;
  }, [map]);

  useEffect(() => {
    if (!paneRef.current) return;
    const markers: L.Marker[] = [];
    cities.forEach(city => {
      const w = cityWeather[city.id];
      if (!w) return;
      const speed = w.windSpeed;
      const dur = Math.max(0.4, 2.5 - speed * 0.04).toFixed(2);
      const rows = 3; const cols = 4;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const latOffset = (r - 1) * 0.4;
          const lonOffset = (c - 1.5) * 0.5;
          const rotation = w.windDir + (Math.random() - 0.5) * 15;
          const opacity = (0.4 + Math.random() * 0.5).toFixed(2);
          const delay = (Math.random() * 2).toFixed(2);
          const icon = L.divIcon({
            className: 'wind-arrow-icon',
            html: `<div class="wind-arrow-outer" style="transform:rotate(${rotation}deg);--dur:${dur}s;--delay:${delay}s">
                     <div class="wind-arrow" style="--wind-opacity:${opacity}"></div>
                   </div>`,
            iconSize: [20, 28],
            iconAnchor: [10, 14],
          });
          const m = L.marker([city.lat + latOffset, city.lon + lonOffset], {
            icon,
            pane: 'wind-arrows-pane',
            interactive: false,
          } as L.MarkerOptions);
          m.addTo(map);
          markers.push(m);
        }
      }
    });
    return () => { markers.forEach(m => m.remove()); };
  }, [map, cityWeather, cities]);

  return null;
}

function TempOverlayPane({ cityWeather, cities }: { cityWeather: Record<string, CityWeather>; cities: CityConfig[] }) {
  const map = useMap();

  useEffect(() => {
    const svgOverlays: L.SVGOverlay[] = [];
    cities.forEach(city => {
      const w = cityWeather[city.id];
      if (!w) return;
      const t = w.tempF;
      const r = t > 90 ? 239 : t > 80 ? 245 : 34;
      const g = t > 90 ? 68  : t > 80 ? 158 : 197;
      const b = t > 90 ? 68  : t > 80 ? 11  : 94;
      const color = `rgba(${r},${g},${b},0.18)`;
      const bounds: L.LatLngBoundsExpression = [
        [city.lat - 0.8, city.lon - 0.8],
        [city.lat + 0.8, city.lon + 0.8],
      ];
      const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svgEl.setAttribute('viewBox', '0 0 100 100');
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      circle.setAttribute('cx', '50'); circle.setAttribute('cy', '50');
      circle.setAttribute('rx', '50'); circle.setAttribute('ry', '50');
      circle.setAttribute('fill', color);
      svgEl.appendChild(circle);
      const overlay = L.svgOverlay(svgEl, bounds, { opacity: 1, interactive: false, pane: 'overlayPane' });
      overlay.addTo(map);
      svgOverlays.push(overlay);
    });
    return () => { svgOverlays.forEach(o => o.remove()); };
  }, [map, cityWeather, cities]);

  return null;
}

function CloudOverlayPane({ cityWeather, cities }: { cityWeather: Record<string, CityWeather>; cities: CityConfig[] }) {
  const map = useMap();

  useEffect(() => {
    const svgOverlays: L.SVGOverlay[] = [];
    cities.forEach(city => {
      const w = cityWeather[city.id];
      if (!w || w.cloudCover < 10) return;

      // Color-coded tiers: 0-25% light, 25-75% medium, 75-100% dense
      let color: string;
      if (w.cloudCover <= 25) {
        color = `rgba(147,210,255,${(w.cloudCover / 100 * 0.25).toFixed(2)})`;
      } else if (w.cloudCover <= 75) {
        color = `rgba(100,150,230,${(0.12 + (w.cloudCover - 25) / 100 * 0.18).toFixed(2)})`;
      } else {
        color = `rgba(60,80,160,${(0.22 + (w.cloudCover - 75) / 100 * 0.18).toFixed(2)})`;
      }

      const bounds: L.LatLngBoundsExpression = [
        [city.lat - 1.0, city.lon - 1.2],
        [city.lat + 1.0, city.lon + 1.2],
      ];
      const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svgEl.setAttribute('viewBox', '0 0 100 100');
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      el.setAttribute('cx', '50'); el.setAttribute('cy', '50');
      el.setAttribute('rx', '50'); el.setAttribute('ry', '50');
      el.setAttribute('fill', color);
      svgEl.appendChild(el);
      const overlay = L.svgOverlay(svgEl, bounds, { opacity: 1, interactive: false });
      overlay.addTo(map);
      svgOverlays.push(overlay);
    });
    return () => { svgOverlays.forEach(o => o.remove()); };
  }, [map, cityWeather, cities]);

  return null;
}

function RainOverlayPane({ cityWeather, cities }: { cityWeather: Record<string, CityWeather>; cities: CityConfig[] }) {
  const map = useMap();

  useEffect(() => {
    const svgOverlays: L.SVGOverlay[] = [];
    cities.forEach(city => {
      const w = cityWeather[city.id];
      if (!w || w.precipitation < 0.01) return;
      const alpha = Math.min(w.precipitation * 2, 0.3);
      const color = `rgba(61,155,255,${alpha.toFixed(2)})`;
      const bounds: L.LatLngBoundsExpression = [
        [city.lat - 0.6, city.lon - 0.6],
        [city.lat + 0.6, city.lon + 0.6],
      ];
      const svgEl = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svgEl.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
      svgEl.setAttribute('viewBox', '0 0 100 100');
      const el = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
      el.setAttribute('cx', '50'); el.setAttribute('cy', '50');
      el.setAttribute('rx', '50'); el.setAttribute('ry', '50');
      el.setAttribute('fill', color);
      svgEl.appendChild(el);
      const overlay = L.svgOverlay(svgEl, bounds, { opacity: 1, interactive: false });
      overlay.addTo(map);
      svgOverlays.push(overlay);
    });
    return () => { svgOverlays.forEach(o => o.remove()); };
  }, [map, cityWeather, cities]);

  return null;
}

function CityMarkers({
  cityWeather, selectedCity, onSelectCity, cities,
}: {
  cityWeather: Record<string, CityWeather>;
  selectedCity: string;
  onSelectCity: (id: string) => void;
  cities: CityConfig[];
}) {
  const map = useMap();
  const markersRef = useRef<L.Marker[]>([]);
  const [zoom, setZoom] = useState(map.getZoom());

  useMapEvents({
    zoomend: () => setZoom(map.getZoom()),
  });

  const zoomedIn = zoom >= ZOOM_DETAIL_THRESHOLD;

  useEffect(() => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    cities.forEach(city => {
      const w = cityWeather[city.id];
      const icon = buildMarkerIcon(city, w, zoomedIn);
      const marker = L.marker([city.lat, city.lon], {
        icon,
        title: city.name,
        alt: city.name,
        riseOnHover: true,
      });

      if (w && !w.error) {
        const aqiRow = w.aqi !== undefined
          ? `<div class="popup-row"><span>AQI</span><span class="popup-val">${w.aqi} (${aqiLabel(w.aqi).text})</span></div>`
          : '';
        const popupContent = `
          <div class="map-popup">
            <div class="popup-title">${city.name}</div>
            <div class="popup-row"><span>Temperature</span><span class="popup-val">${w.tempF}°F</span></div>
            <div class="popup-row"><span>Humidity</span><span class="popup-val">${w.humidity}%</span></div>
            <div class="popup-row"><span>Wind</span><span class="popup-val">${w.windSpeed} mph ${windCardinal(w.windDir)}</span></div>
            <div class="popup-row"><span>Cloud Cover</span><span class="popup-val">${w.cloudCover}%</span></div>
            <div class="popup-row"><span>Precip</span><span class="popup-val">${w.precipitation}"</span></div>
            ${aqiRow}
          </div>`;
        marker.bindPopup(popupContent, { maxWidth: 200 });
      }

      marker.on('click', () => { onSelectCity(city.id); });
      marker.addTo(map);
      markersRef.current.push(marker);
    });

    return () => { markersRef.current.forEach(m => m.remove()); markersRef.current = []; };
  }, [map, cityWeather, onSelectCity, cities, zoomedIn]);

  useEffect(() => {
    const city = cities.find(c => c.id === selectedCity);
    if (city) { map.panTo([city.lat, city.lon], { animate: true, duration: 0.5 }); }
  }, [map, selectedCity, cities]);

  return null;
}

function MapTypeSelector({ mapType, onMapTypeChange }: { mapType: MapType; onMapTypeChange: (t: MapType) => void }) {
  const options: { key: MapType; label: string }[] = [
    { key: 'standard',  label: 'Standard'  },
    { key: 'satellite', label: 'Satellite' },
    { key: 'terrain',   label: 'Terrain'   },
  ];
  return (
    <div className="map-type-selector" role="group" aria-label="Map type">
      {options.map(({ key, label }) => (
        <button
          key={key}
          className={`map-type-btn${mapType === key ? ' active' : ''}`}
          onClick={() => onMapTypeChange(key)}
          aria-pressed={mapType === key}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

export default function MapView({ activeOverlays, cityWeather, selectedCity, onSelectCity, cities, mapType, onMapTypeChange }: Props) {
  const hasData = Object.keys(cityWeather).length > 0;
  const tile = TILE_LAYERS[mapType];

  return (
    <div className="map-wrapper" role="region" aria-label="Interactive weather map">
      <MapContainer
        center={SOUTH_TEXAS_CENTER}
        zoom={SOUTH_TEXAS_ZOOM}
        scrollWheelZoom
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl
      >
        <TileLayer
          key={mapType}
          url={tile.url}
          attribution={tile.attribution}
          maxZoom={tile.maxZoom}
        />

        {hasData && (
          <>
            <CityMarkers
              cityWeather={cityWeather}
              selectedCity={selectedCity}
              onSelectCity={onSelectCity}
              cities={cities}
            />
            {activeOverlays.has('wind')  && <WindOverlayPane  cityWeather={cityWeather} cities={cities} />}
            {activeOverlays.has('temp')  && <TempOverlayPane  cityWeather={cityWeather} cities={cities} />}
            {activeOverlays.has('cloud') && <CloudOverlayPane cityWeather={cityWeather} cities={cities} />}
            {activeOverlays.has('rain')  && <RainOverlayPane  cityWeather={cityWeather} cities={cities} />}
          </>
        )}
      </MapContainer>

      <MapTypeSelector mapType={mapType} onMapTypeChange={onMapTypeChange} />
    </div>
  );
}
