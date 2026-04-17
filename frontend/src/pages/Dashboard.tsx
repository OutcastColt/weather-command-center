import React, { useState } from 'react';
import WeatherCard from '../components/WeatherCard';
import SearchBar from '../components/SearchBar';

export default function Dashboard() {
  const [city, setCity] = useState('');

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Weather Command Center</h1>
      <SearchBar onSearch={setCity} />
      {city && <WeatherCard city={city} />}
    </div>
  );
}
