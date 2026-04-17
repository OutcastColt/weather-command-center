# Weather Command Center — Backend API Reference

Base URL (local dev): `http://localhost:3001`

All responses are JSON. Cached responses include `"cached": true`.

---

## Health

### `GET /health`

Returns server status.

**Response**
```json
{ "status": "ok", "timestamp": "2026-04-17T19:00:00.000Z" }
```

---

## Weather

### `GET /api/weather/current`

Returns current conditions from Open-Meteo for a given location.

**Query parameters**

| Param | Type   | Required | Description |
|-------|--------|----------|-------------|
| city  | string | either/or | One of `corpus-christi`, `brownsville`, `mcallen` |
| lat   | number | either/or | Latitude (use with `lon`) |
| lon   | number | either/or | Longitude (use with `lat`) |

**Example**
```
GET /api/weather/current?city=corpus-christi
```

**Response**
```json
{
  "city": "Corpus Christi",
  "latitude": 27.8006,
  "longitude": -97.3964,
  "time": "2026-04-17T19:00",
  "temperature_c": 28.4,
  "wind_speed_kmh": 22.1,
  "wind_direction_deg": 135,
  "cloud_cover_pct": 40,
  "precipitation_mm": 0.0,
  "weather_code": 2,
  "cached": false
}
```

**Weather codes** follow the WMO Weather interpretation codes standard (e.g. 0 = clear sky, 2 = partly cloudy, 61 = rain, 95 = thunderstorm).

---

### `GET /api/weather/forecast`

Returns 7-day hourly forecast from Open-Meteo.

**Query parameters** — same as `/current` above.

**Example**
```
GET /api/weather/forecast?city=brownsville
```

**Response**
```json
{
  "city": "Brownsville",
  "latitude": 25.9017,
  "longitude": -97.4975,
  "hourly": [
    {
      "time": "2026-04-17T00:00",
      "temperature_c": 24.1,
      "wind_speed_kmh": 14.3,
      "wind_direction_deg": 120,
      "cloud_cover_pct": 20,
      "precipitation_mm": 0.0
    }
  ],
  "cached": false
}
```

---

### `GET /api/weather/alerts`

Returns active NWS weather alerts for South Texas (Cameron, Hidalgo, Nueces counties and surrounding coastal-bend zones).

No query parameters required.

**Example**
```
GET /api/weather/alerts
```

**Response**
```json
{
  "alerts": [
    {
      "id": "https://api.weather.gov/alerts/urn:oid:2.49...",
      "event": "Heat Advisory",
      "severity": "Moderate",
      "urgency": "Expected",
      "certainty": "Likely",
      "headline": "Heat Advisory issued April 17 at 10:00AM CDT",
      "description": "A heat advisory is in effect...",
      "instruction": "Drink plenty of fluids...",
      "effective": "2026-04-17T15:00:00-05:00",
      "expires": "2026-04-17T21:00:00-05:00",
      "areas": "Nueces; San Patricio",
      "sender": "NWS Corpus Christi TX"
    }
  ],
  "fetchedAt": "2026-04-17T19:00:00.000Z",
  "cached": false
}
```

Returns `"alerts": []` when no active advisories apply to South Texas.

---

## Caching

| Endpoint | Default TTL | Env var |
|----------|------------|---------|
| `/current` | 15 min | `WEATHER_CACHE_TTL_MINUTES` |
| `/forecast` | 15 min | `WEATHER_CACHE_TTL_MINUTES` |
| `/alerts` | 5 min | `ALERTS_CACHE_TTL_MINUTES` |

Cache is in-process memory. Restarting the server clears it. The `cached` field in each response indicates whether the result came from cache.

---

## Error responses

```json
{ "error": "Unknown city: xyz. Supported: corpus-christi, brownsville, mcallen" }
```

| HTTP status | Meaning |
|-------------|---------|
| 400 | Bad request (missing params or unknown city) |
| 502 | Upstream API (Open-Meteo or NWS) failed |
| 500 | Internal server error |

---

## Data sources

- **Current & forecast weather:** [Open-Meteo](https://open-meteo.com/) — free, no API key required, open license.
- **Weather alerts:** [NWS/NOAA Alerts API](https://api.weather.gov/) — public, no API key required.
