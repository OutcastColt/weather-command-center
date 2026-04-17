import React, { useEffect, useState } from 'react';
import axios from 'axios';

interface WeatherData {
  name: string;
  main: { temp: number; humidity: number; feels_like: number };
  weather: { description: string; icon: string }[];
  wind: { speed: number };
}

interface Props {
  city: string;
}

export default function WeatherCard({ city }: Props) {
  const [data, setData] = useState<WeatherData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const apiBase = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3001/api';
    axios
      .get(`${apiBase}/weather/current`, { params: { city } })
      .then((res) => setData(res.data))
      .catch(() => setError('Failed to fetch weather data'))
      .finally(() => setLoading(false));
  }, [city]);

  if (loading) return <p>Loading weather for {city}...</p>;
  if (error) return <p style={{ color: 'red' }}>{error}</p>;
  if (!data) return null;

  return (
    <div style={{ border: '1px solid #ccc', borderRadius: 8, padding: '1rem', maxWidth: 400 }}>
      <h2>{data.name}</h2>
      <p style={{ textTransform: 'capitalize' }}>{data.weather[0].description}</p>
      <p>Temperature: {data.main.temp}°C (feels like {data.main.feels_like}°C)</p>
      <p>Humidity: {data.main.humidity}%</p>
      <p>Wind: {data.wind.speed} m/s</p>
    </div>
  );
}
