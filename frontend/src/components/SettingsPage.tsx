import React, { useState, useRef } from 'react';
import './SettingsPage.css';
import { CityConfig } from '../types';

interface Props {
  cities: CityConfig[];
  onAddCity: (query: string) => Promise<boolean>;
  onRemoveCity: (id: string) => void;
  onResetDefaults: () => void;
  geocoding: boolean;
  geocodeError: string | null;
  onClearError: () => void;
  onClose: () => void;
}

export default function SettingsPage({
  cities, onAddCity, onRemoveCity, onResetDefaults,
  geocoding, geocodeError, onClearError, onClose,
}: Props) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    const ok = await onAddCity(trimmed);
    if (ok) setQuery('');
  };

  return (
    <div className="settings-overlay" role="dialog" aria-modal="true" aria-label="City Settings">
      <div className="settings-panel">
        <div className="settings-header">
          <div className="settings-title">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
            </svg>
            City Settings
          </div>
          <button className="settings-close" onClick={onClose} aria-label="Close settings">✕</button>
        </div>

        <div className="settings-body">
          <section className="settings-section">
            <div className="settings-section-label">Add City</div>
            <p className="settings-hint">Enter a ZIP code, city name, or full address.</p>
            <form className="add-city-form" onSubmit={handleAdd}>
              <input
                ref={inputRef}
                className="add-city-input"
                type="text"
                placeholder="e.g. 78401 or San Antonio, TX"
                value={query}
                onChange={e => { setQuery(e.target.value); if (geocodeError) onClearError(); }}
                disabled={geocoding}
                aria-label="City search"
                autoComplete="off"
              />
              <button
                className="add-city-btn"
                type="submit"
                disabled={geocoding || !query.trim()}
              >
                {geocoding ? '…' : 'Add'}
              </button>
            </form>
            {geocodeError && (
              <div className="geocode-error" role="alert">{geocodeError}</div>
            )}
          </section>

          <section className="settings-section">
            <div className="settings-section-label">
              My Cities
              <span className="city-count">{cities.length}</span>
            </div>
            {cities.length === 0 ? (
              <div className="cities-empty">No cities added yet.</div>
            ) : (
              <ul className="city-list" role="list">
                {cities.map(city => (
                  <li key={city.id} className="city-list-item" role="listitem">
                    <div className="city-list-info">
                      <div className="city-list-name">{city.name}</div>
                      <div className="city-list-coords">
                        {city.zipCode && <span className="city-list-zip">{city.zipCode}</span>}
                        <span>{city.lat.toFixed(3)}°N, {Math.abs(city.lon).toFixed(3)}°W</span>
                      </div>
                    </div>
                    <button
                      className="city-remove-btn"
                      onClick={() => onRemoveCity(city.id)}
                      aria-label={`Remove ${city.name}`}
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="settings-footer">
          <button className="settings-reset-btn" onClick={onResetDefaults}>
            Reset to Defaults
          </button>
          <button className="settings-done-btn" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
