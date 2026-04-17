import { Router, Request, Response } from 'express';
import { WeatherService } from '../services/weatherService';
import { AlertsService } from '../services/alertsService';

const router = Router();
const weatherService = new WeatherService();
const alertsService = new AlertsService();

router.get('/current', async (req: Request, res: Response) => {
  const { city, lat, lon } = req.query;

  if (!city && (!lat || !lon)) {
    return res.status(400).json({ error: 'Provide either city or lat/lon query params' });
  }

  try {
    const data = await weatherService.getCurrentWeather(
      city as string | undefined,
      lat ? Number(lat) : undefined,
      lon ? Number(lon) : undefined,
    );
    return res.json(data);
  } catch (err: any) {
    const status = err.message?.startsWith('Unknown city') ? 400 : 502;
    return res.status(status).json({ error: err.message || 'Failed to fetch weather data' });
  }
});

router.get('/forecast', async (req: Request, res: Response) => {
  const { city, lat, lon } = req.query;

  if (!city && (!lat || !lon)) {
    return res.status(400).json({ error: 'Provide either city or lat/lon query params' });
  }

  try {
    const data = await weatherService.getForecast(
      city as string | undefined,
      lat ? Number(lat) : undefined,
      lon ? Number(lon) : undefined,
    );
    return res.json(data);
  } catch (err: any) {
    const status = err.message?.startsWith('Unknown city') ? 400 : 502;
    return res.status(status).json({ error: err.message || 'Failed to fetch forecast data' });
  }
});

router.get('/alerts', async (_req: Request, res: Response) => {
  try {
    const data = await alertsService.getSouthTexasAlerts();
    return res.json(data);
  } catch (err: any) {
    return res.status(502).json({ error: err.message || 'Failed to fetch alerts from NWS' });
  }
});

export default router;
