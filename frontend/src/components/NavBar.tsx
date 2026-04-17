import React, { useEffect, useRef, useState } from 'react';
import { RefreshInterval } from '../types';

interface Props {
  refreshInterval: RefreshInterval;
  onRefresh: () => void;
  onMenuToggle: () => void;
  onInfoToggle: () => void;
  onSettingsToggle: () => void;
  loading: boolean;
}

export default function NavBar({ refreshInterval, onRefresh, onMenuToggle, onInfoToggle, onSettingsToggle, loading }: Props) {
  const totalSeconds = refreshInterval * 60;
  const [seconds, setSeconds] = useState(totalSeconds);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setSeconds(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (loading) {
      setSeconds(totalSeconds);
    }
  }, [loading, totalSeconds]);

  useEffect(() => {
    timerRef.current = setInterval(() => {
      setSeconds(prev => {
        if (prev <= 1) { return totalSeconds; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [totalSeconds]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, '0');
  const ss = String(seconds % 60).padStart(2, '0');

  return (
    <nav className="nav" role="banner">
      <button
        className="mobile-menu-btn"
        id="menuBtn"
        aria-label="Toggle layer controls"
        onClick={onMenuToggle}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6"/>
          <line x1="3" y1="12" x2="21" y2="12"/>
          <line x1="3" y1="18" x2="21" y2="18"/>
        </svg>
      </button>

      <div className="nav-logo">
        <div className="nav-logo-icon" aria-hidden="true">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M3 15a4 4 0 004 4h9a5 5 0 10-9-4.9"/>
            <path d="M11.5 4.5c1.5-.5 3 0 4 1.5"/>
            <path d="M18 7c1.7 0 3 1.3 3 3"/>
          </svg>
        </div>
        Weather Command Center
      </div>

      <div className="nav-divider" aria-hidden="true" />
      <div className="nav-region">
        <div className="nav-region-dot" aria-hidden="true" />
        South Texas
      </div>

      <div className="nav-spacer" />

      <div className="refresh-indicator" aria-live="polite">
        <div className={`refresh-dot${loading ? ' loading' : ''}`} aria-hidden="true" />
        <span>{loading ? 'Updating' : 'Live'}</span>
        <span className="refresh-countdown" aria-label={`Next refresh in ${mm}:${ss}`}>
          {mm}:{ss}
        </span>
      </div>

      <button
        className="refresh-btn"
        onClick={onRefresh}
        aria-label="Refresh weather data now"
        disabled={loading}
      >
        ↻ {loading ? 'Refreshing…' : 'Refresh'}
      </button>

      <button
        className="settings-nav-btn"
        aria-label="Open city settings"
        onClick={onSettingsToggle}
        title="City Settings"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/>
        </svg>
      </button>

      <button
        className="mobile-info-btn"
        id="infoBtn"
        aria-label="Toggle city data panel"
        onClick={onInfoToggle}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
      </button>
    </nav>
  );
}
