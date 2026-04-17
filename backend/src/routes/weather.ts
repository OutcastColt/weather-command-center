import { Router, Request, Response } from 'express';
import { WeatherService } from '../services/weatherService';

const router = Router();
const weatherService = new WeatherService();

router.get('/current', async (req: Request, res: Response) => {
  const { city, lat, lon } = req.query;

  if (!city && (!lat || !lon)) {
    return res.status(400).json({ error: 'Provide either city or lat/lon query params' });
  }

  const data = await weatherService.getCurrentWeather(
    city as string | undefined,
    lat ? Number(lat) : undefined,
    lon ? Number(lon) : undefined,
  );

  return res.json(data);
});

router.get('/forecast', async (req: Request, res: Response) => {
  const { city, lat, lon } = req.query;

  if (!city && (!lat || !lon)) {
    return res.status(400).json({ error: 'Provide either city or lat/lon query params' });
  }

  const data = await weatherService.getForecast(
    city as string | undefined,
    lat ? Number(lat) : undefined,
    lon ? Number(lon) : undefined,
  );

  return res.json(data);
});

export default router;
