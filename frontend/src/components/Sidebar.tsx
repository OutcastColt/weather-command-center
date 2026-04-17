import React from 'react';
import './Sidebar.css';
import { OverlayKey, RefreshInterval } from '../types';

interface Props {
  activeOverlays: Set<OverlayKey>;
  onToggleOverlay: (key: OverlayKey) => void;
  refreshInterval: RefreshInterval;
  onSetRefresh: (mins: RefreshInterval) => void;
  isOpen: boolean;
}

const OVERLAYS: { key: OverlayKey; icon: string; name: string; desc: string }[] = [
  { key: 'wind',  icon: '💨', name: 'Wind',        desc: 'Speed & direction'    },
  { key: 'cloud', icon: '☁️', name: 'Clouds',      desc: 'Coverage & density'   },
  { key: 'rain',  icon: '🌧️', name: 'Rain',        desc: 'Precipitation rate'   },
  { key: 'temp',  icon: '🌡️', name: 'Temperature', desc: 'Surface heat map'     },
];

const LEGEND_DEFS: Record<OverlayKey, { label: string; grad: string }> = {
  wind:  { label: 'Wind speed (calm → strong)',       grad: 'rgba(0,216,232,0.2), rgba(0,216,232,0.8)'   },
  cloud: { label: 'Cloud coverage (clear → overcast)', grad: 'rgba(167,139,250,0.1), rgba(167,139,250,0.7)' },
  rain:  { label: 'Rainfall (light → heavy)',          grad: 'rgba(61,155,255,0.1), rgba(61,155,255,0.8)'  },
  temp:  { label: 'Temperature (cool → hot)',          grad: 'rgba(34,197,94,0.5), rgba(239,68,68,0.7)'   },
};

const REFRESH_OPTIONS: { label: string; value: RefreshInterval }[] = [
  { label: '5 minutes',  value: 5  },
  { label: '15 minutes', value: 15 },
  { label: '30 minutes', value: 30 },
  { label: '1 hour',     value: 60 },
];

export default function Sidebar({ activeOverlays, onToggleOverlay, refreshInterval, onSetRefresh, isOpen }: Props) {
  const activeKeys = OVERLAYS.map(o => o.key).filter(k => activeOverlays.has(k));

  return (
    <aside className={`sidebar${isOpen ? ' open' : ''}`} id="sidebar" aria-label="Map layer controls">

      {/* Overlay Controls */}
      <div className="sidebar-section">
        <div className="section-label">Weather Layers</div>
        <ul className="overlay-list" role="list">
          {OVERLAYS.map(({ key, icon, name, desc }) => {
            const active = activeOverlays.has(key);
            return (
              <li
                key={key}
                className={`overlay-item overlay-${key}${active ? ' active' : ''}`}
                role="switch"
                aria-checked={active}
                tabIndex={0}
                aria-label={`Toggle ${name} overlay`}
                onClick={() => onToggleOverlay(key)}
                onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onToggleOverlay(key); } }}
              >
                <div className="overlay-left">
                  <div className="overlay-icon" aria-hidden="true">{icon}</div>
                  <div>
                    <div className="overlay-name">{name}</div>
                    <div className="overlay-desc">{desc}</div>
                  </div>
                </div>
                <div className="toggle" aria-hidden="true" />
              </li>
            );
          })}
        </ul>
      </div>

      {/* Legend */}
      <div className="sidebar-section">
        <div className="section-label">Legend</div>
        <div className="legend-list" aria-label="Map legend">
          {activeKeys.length === 0
            ? <div className="legend-empty">Enable a layer to see legend.</div>
            : activeKeys.map(k => (
                <div key={k} className="legend-item">
                  <div className="legend-bar" style={{ background: `linear-gradient(to right, ${LEGEND_DEFS[k].grad})` }} />
                  <span className="legend-label">{LEGEND_DEFS[k].label}</span>
                </div>
              ))
          }
        </div>
      </div>

      {/* Refresh Settings */}
      <div className="sidebar-section">
        <div className="section-label">Auto-Refresh</div>
        <div className="refresh-options" role="radiogroup" aria-label="Auto-refresh interval">
          {REFRESH_OPTIONS.map(({ label, value }) => (
            <div
              key={value}
              className={`refresh-option${refreshInterval === value ? ' selected' : ''}`}
              role="radio"
              aria-checked={refreshInterval === value}
              tabIndex={0}
              onClick={() => onSetRefresh(value)}
              onKeyDown={e => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); onSetRefresh(value); } }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>

    </aside>
  );
}
