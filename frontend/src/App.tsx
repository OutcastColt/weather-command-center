import React, { useState, useCallback } from 'react';
import './App.css';
import './components/NavBar.css';
import NavBar from './components/NavBar';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import InfoPanel from './components/InfoPanel';
import { OverlayKey, RefreshInterval } from './types';
import { useWeatherData } from './hooks/useWeatherData';

export default function App() {
  const [activeOverlays, setActiveOverlays] = useState<Set<OverlayKey>>(new Set(['wind']));
  const [refreshInterval, setRefreshInterval] = useState<RefreshInterval>(15);
  const [selectedCity, setSelectedCity] = useState('corpus');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [infoPanelOpen, setInfoPanelOpen] = useState(false);

  const { cities, loading, refetch } = useWeatherData(refreshInterval);

  const handleToggleOverlay = useCallback((key: OverlayKey) => {
    setActiveOverlays(prev => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  }, []);

  const handleMenuToggle = useCallback(() => {
    setSidebarOpen(prev => !prev);
    setInfoPanelOpen(false);
  }, []);

  const handleInfoToggle = useCallback(() => {
    setInfoPanelOpen(prev => !prev);
    setSidebarOpen(false);
  }, []);

  const handleCloseAll = useCallback(() => {
    setSidebarOpen(false);
    setInfoPanelOpen(false);
  }, []);

  const handleSelectCity = useCallback((id: string) => {
    setSelectedCity(id);
  }, []);

  const isAnyPanelOpen = sidebarOpen || infoPanelOpen;

  return (
    <>
      <a href="#main-content" className="skip-nav">Skip to main content</a>

      <NavBar
        refreshInterval={refreshInterval}
        onRefresh={refetch}
        onMenuToggle={handleMenuToggle}
        onInfoToggle={handleInfoToggle}
        loading={loading}
      />

      <div className="app" id="main-content">
        <Sidebar
          activeOverlays={activeOverlays}
          onToggleOverlay={handleToggleOverlay}
          refreshInterval={refreshInterval}
          onSetRefresh={setRefreshInterval}
          isOpen={sidebarOpen}
        />

        <MapView
          activeOverlays={activeOverlays}
          cityWeather={cities}
          selectedCity={selectedCity}
          onSelectCity={handleSelectCity}
        />

        <InfoPanel
          cityWeather={cities}
          selectedCity={selectedCity}
          onSelectCity={handleSelectCity}
          isOpen={infoPanelOpen}
        />
      </div>

      {isAnyPanelOpen && (
        <div
          className="backdrop"
          onClick={handleCloseAll}
          aria-hidden="true"
        />
      )}
    </>
  );
}
