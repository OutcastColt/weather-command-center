import React from 'react';
import './InfoPanel.css';
import { CityWeather } from '../types';
import { CITIES, weatherCodeIcon, weatherCodeToDescription, windCardinal } from '../hooks/useWeatherData';

interface Props {
  cityWeather: Record<string, CityWeather>;
  selectedCity: string;
  onSelectCity: (id: string) => void;
  isOpen: boolean;
}

function SkeletonBlock({ w, h }: { w?: string; h?: string }) {
  return <div className="skeleton" style={{ width: w || '100%', height: h || '20px', marginBottom: '4px' }} />;
}

export default function InfoPanel({ cityWeather, selectedCity, onSelectCity, isOpen }: Props) {
  const sel = cityWeather[selectedCity];
  const selCity = CITIES.find(c => c.id === selectedCity);
  const loading = !sel || sel.loading;

  return (
    <aside className={`info-panel${isOpen ? ' open' : ''}`} id="infoPanel" aria-label="Current weather conditions">

      {/* Current Conditions Hero */}
      <div className="conditions-header">
        <div className="conditions-title">Current Conditions</div>
        <div className="conditions-hero" aria-live="polite">
          <div>
            {loading ? (
              <>
                <SkeletonBlock w="80px" h="52px" />
                <SkeletonBlock w="140px" h="18px" />
              </>
            ) : (
              <>
                <div className="conditions-temp" aria-label={`${sel.tempF} degrees Fahrenheit`}>
                  {sel.tempF}<span className="conditions-unit">°F</span>
                </div>
                <div className="conditions-desc">{weatherCodeToDescription(sel.weatherCode)} · {selCity?.name}</div>
              </>
            )}
          </div>
          <div className="conditions-icon" aria-hidden="true">
            {loading ? '…' : weatherCodeIcon(sel.weatherCode)}
          </div>
        </div>
      </div>

      {/* Condition Cards */}
      <div className="conditions-grid">
        <div className="condition-card">
          <div className="condition-icon" aria-hidden="true">💨</div>
          <div className="condition-value">
            {loading ? <SkeletonBlock w="60px" h="22px" /> : `${sel.windSpeed} mph`}
          </div>
          <div className="condition-label">
            {loading ? '' : `Wind ${windCardinal(sel.windDir)}`}
          </div>
        </div>
        <div className="condition-card">
          <div className="condition-icon" aria-hidden="true">💧</div>
          <div className="condition-value">
            {loading ? <SkeletonBlock w="50px" h="22px" /> : `${sel.humidity}%`}
          </div>
          <div className="condition-label">Humidity</div>
        </div>
        <div className="condition-card">
          <div className="condition-icon" aria-hidden="true">🌂</div>
          <div className="condition-value">
            {loading ? <SkeletonBlock w="50px" h="22px" /> : `${sel.precipitation}"`}
          </div>
          <div className="condition-label">Precipitation</div>
        </div>
        <div className="condition-card">
          <div className="condition-icon" aria-hidden="true">☁️</div>
          <div className="condition-value">
            {loading ? <SkeletonBlock w="50px" h="22px" /> : `${sel?.cloudCover ?? '—'}%`}
          </div>
          <div className="condition-label">Cloud Cover</div>
        </div>
      </div>

      {/* City Cards */}
      <div className="city-cards-section">
        <div className="city-cards-title">South Texas Cities</div>
        <div className="city-card-list" role="list">
          {CITIES.map(city => {
            const w = cityWeather[city.id];
            const isSelected = selectedCity === city.id;
            return (
              <div
                key={city.id}
                className={`city-card${isSelected ? ' selected' : ''}`}
                role="listitem"
                tabIndex={0}
                aria-label={`${city.name}${w ? `, ${w.tempF}°F, ${weatherCodeToDescription(w.weatherCode)}` : ''}`}
                onClick={() => onSelectCity(city.id)}
                onKeyDown={e => { if (e.key === 'Enter') onSelectCity(city.id); }}
              >
                <div className="city-card-left">
                  <div className="city-card-name">{city.name}</div>
                  {w ? (
                    <>
                      <div className="city-card-desc">{weatherCodeToDescription(w.weatherCode)}</div>
                      <div className="city-card-wind">
                        <div className="city-card-wind-dot" aria-hidden="true" />
                        {w.windSpeed} mph {windCardinal(w.windDir)}
                      </div>
                    </>
                  ) : (
                    <SkeletonBlock w="80px" h="14px" />
                  )}
                </div>
                <div className="city-card-right">
                  <div>
                    <div className="city-card-temp">
                      {w ? `${w.tempF}°` : '—'}
                    </div>
                  </div>
                  <div className="city-card-icon" aria-hidden="true">
                    {w ? weatherCodeIcon(w.weatherCode) : ''}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Alerts */}
      <AlertsPanel cityWeather={cityWeather} />

      {/* Data Sources */}
      <div className="data-footer">
        <div className="data-footer-label">Data Sources</div>
        <div className="data-footer-sources">
          <span className="data-source-tag">Open-Meteo</span>
          <span className="data-source-tag">NOAA NWS</span>
          <span className="data-source-tag">OpenStreetMap</span>
          <span className="data-source-tag">CARTO</span>
        </div>
      </div>

    </aside>
  );
}

function AlertsPanel({ cityWeather }: { cityWeather: Record<string, CityWeather> }) {
  const alerts: { type: 'warning' | 'info'; icon: string; title: string; body: string }[] = [];

  const temps = CITIES.map(c => cityWeather[c.id]?.tempF ?? 0).filter(Boolean);
  const maxTemp = Math.max(...temps);
  if (maxTemp >= 95) {
    alerts.push({ type: 'warning', icon: '🌡️', title: 'Excessive Heat Warning', body: `Temperatures reaching ${maxTemp}°F. Dangerous heat conditions. Limit outdoor activities.` });
  } else if (maxTemp >= 90) {
    alerts.push({ type: 'warning', icon: '⚠️', title: 'Heat Advisory', body: `High temperatures ${maxTemp}°F expected. Stay hydrated and limit outdoor exposure.` });
  }

  const isRaining = CITIES.some(c => (cityWeather[c.id]?.precipitation ?? 0) > 0.05);
  if (isRaining) {
    alerts.push({ type: 'info', icon: '🌧️', title: 'Rain Observed', body: 'Precipitation detected in the region. Check city cards for specifics.' });
  }

  const highWind = CITIES.find(c => (cityWeather[c.id]?.windSpeed ?? 0) >= 25);
  if (highWind) {
    alerts.push({ type: 'warning', icon: '💨', title: 'High Wind Advisory', body: `Winds exceeding 25 mph near ${highWind.name}. Secure loose objects outdoors.` });
  }

  if (alerts.length === 0) {
    alerts.push({ type: 'info', icon: 'ℹ️', title: 'No Active Notices', body: 'Conditions appear favorable across the region.' });
  }

  return (
    <div className="alerts-section">
      <div className="alerts-title">Notices</div>
      {alerts.map((a, i) => (
        <div key={i} className={`alert-item${a.type === 'info' ? ' info' : ''}`}>
          <div className="alert-icon" aria-hidden="true">{a.icon}</div>
          <div className="alert-text"><strong>{a.title}</strong> — {a.body}</div>
        </div>
      ))}
    </div>
  );
}
