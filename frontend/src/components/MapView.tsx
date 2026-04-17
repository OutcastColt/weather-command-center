import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapView.css';
import { CityWeather, OverlayKey } from '../types';
import { CITIES } from '../hooks/useWeatherData';
import { weatherCodeIcon, windCardinal } from '../hooks/useWeatherData';

// South Texas bounding area
const SOUTH_TEXAS_CENTER: [number, number] = [26.8, -97.8];
const SOUTH_TEXAS_ZOOM = 8;

interface Props {
  activeOverlays: Set<OverlayKey>;
  cityWeather: Record<string, CityWeather>;
  selectedCity: string;
  onSelectCity: (id: string) => void;
}

/* City marker icons */
function buildMarkerIcon(city: { name: string }, weather: CityWeather | undefined) {
  const temp = weather ? `${weather.tempF}°F` : '…';
  const icon = weather ? weatherCodeIcon(weather.weatherCode) : '…';
  return L.divIcon({
    className: 'city-marker-icon',
    html: `
      <div class="cm-wrapper">
        <div class="cm-label">
          <span class="cm-name">${city.name}</span>
          <span class="cm-badge">${temp}</span>
        </div>
        <div class="cm-pin"></div>
        <div class="cm-icon" aria-hidden="true">${icon}</div>
      </div>`,
    iconAnchor: [0, 40],
    popupAnchor: [60, -50],
  });
}

/* Wind arrow SVG overlay rendered over Leaflet as a pane */
function WindOverlayPane({ cityWeather }: { cityWeather: Record<string, CityWeather> }) {
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
    CITIES.forEach(city => {
      const w = cityWeather[city.id];
      if (!w) return;
      const rows = 3; const cols = 4;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const latOffset = (r - 1) * 0.4;
          const lonOffset = (c - 1.5) * 0.5;
          const rotation = w.windDir + (Math.random() - 0.5) * 15;
          const opacity = 0.4 + Math.random() * 0.5;
          const icon = L.divIcon({
            className: 'wind-arrow-icon',
            html: `<div class="wind-arrow" style="transform:rotate(${rotation}deg);opacity:${opacity}"></div>`,
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
  }, [map, cityWeather]);

  return null;
}

/* Temperature heatmap SVG overlay */
function TempOverlayPane({ cityWeather }: { cityWeather: Record<string, CityWeather> }) {
  const map = useMap();

  useEffect(() => {
    const svgOverlays: L.SVGOverlay[] = [];
    CITIES.forEach(city => {
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
  }, [map, cityWeather]);

  return null;
}

/* Cloud coverage overlay */
function CloudOverlayPane({ cityWeather }: { cityWeather: Record<string, CityWeather> }) {
  const map = useMap();

  useEffect(() => {
    const svgOverlays: L.SVGOverlay[] = [];
    CITIES.forEach(city => {
      const w = cityWeather[city.id];
      if (!w || w.cloudCover < 20) return;
      const alpha = (w.cloudCover / 100) * 0.22;
      const color = `rgba(167,139,250,${alpha.toFixed(2)})`;
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
  }, [map, cityWeather]);

  return null;
}

/* Rain overlay */
function RainOverlayPane({ cityWeather }: { cityWeather: Record<string, CityWeather> }) {
  const map = useMap();

  useEffect(() => {
    const svgOverlays: L.SVGOverlay[] = [];
    CITIES.forEach(city => {
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
  }, [map, cityWeather]);

  return null;
}

/* City markers with popups */
function CityMarkers({
  cityWeather, selectedCity, onSelectCity
}: { cityWeather: Record<string, CityWeather>; selectedCity: string; onSelectCity: (id: string) => void }) {
  const map = useMap();
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    CITIES.forEach(city => {
      const w = cityWeather[city.id];
      const icon = buildMarkerIcon(city, w);
      const marker = L.marker([city.lat, city.lon], {
        icon,
        title: city.name,
        alt: city.name,
        riseOnHover: true,
      });

      if (w && !w.error) {
        const popupContent = `
          <div class="map-popup">
            <div class="popup-title">${city.name}</div>
            <div class="popup-row"><span>Temperature</span><span class="popup-val">${w.tempF}°F</span></div>
            <div class="popup-row"><span>Humidity</span><span class="popup-val">${w.humidity}%</span></div>
            <div class="popup-row"><span>Wind</span><span class="popup-val">${w.windSpeed} mph ${windCardinal(w.windDir)}</span></div>
            <div class="popup-row"><span>Cloud Cover</span><span class="popup-val">${w.cloudCover}%</span></div>
            <div class="popup-row"><span>Precip</span><span class="popup-val">${w.precipitation}"</span></div>
          </div>`;
        marker.bindPopup(popupContent, { maxWidth: 200 });
      }

      marker.on('click', () => { onSelectCity(city.id); });
      marker.addTo(map);
      markersRef.current.push(marker);
    });

    return () => { markersRef.current.forEach(m => m.remove()); markersRef.current = []; };
  }, [map, cityWeather, onSelectCity]);

  /* Pan to selected city */
  useEffect(() => {
    const city = CITIES.find(c => c.id === selectedCity);
    if (city) { map.panTo([city.lat, city.lon], { animate: true, duration: 0.5 }); }
  }, [map, selectedCity]);

  return null;
}

export default function MapView({ activeOverlays, cityWeather, selectedCity, onSelectCity }: Props) {
  const hasData = Object.keys(cityWeather).length > 0;

  return (
    <div className="map-wrapper" role="region" aria-label="Interactive weather map of South Texas">
      <MapContainer
        center={SOUTH_TEXAS_CENTER}
        zoom={SOUTH_TEXAS_ZOOM}
        scrollWheelZoom
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          maxZoom={19}
        />

        {hasData && (
          <>
            <CityMarkers
              cityWeather={cityWeather}
              selectedCity={selectedCity}
              onSelectCity={onSelectCity}
            />
            {activeOverlays.has('wind')  && <WindOverlayPane  cityWeather={cityWeather} />}
            {activeOverlays.has('temp')  && <TempOverlayPane  cityWeather={cityWeather} />}
            {activeOverlays.has('cloud') && <CloudOverlayPane cityWeather={cityWeather} />}
            {activeOverlays.has('rain')  && <RainOverlayPane  cityWeather={cityWeather} />}
          </>
        )}
      </MapContainer>
    </div>
  );
}
