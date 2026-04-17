import { Router, Request, Response } from 'express';
import { AirQualityService } from '../services/airQualityService';

const router = Router();
const airQualityService = new AirQualityService();

router.get('/', async (req: Request, res: Response) => {
  const { lat, lon } = req.query;

  if (!lat || !lon) {
    return res.status(400).json({ error: 'Query parameters "lat" and "lon" are required' });
  }

  const latitude = Number(lat);
  const longitude = Number(lon);

  if (isNaN(latitude) || isNaN(longitude)) {
    return res.status(400).json({ error: '"lat" and "lon" must be valid numbers' });
  }

  try {
    const result = await airQualityService.getAirQuality(latitude, longitude);
    return res.json(result);
  } catch (err: any) {
    return res.status(502).json({ error: err.message || 'Failed to fetch air quality data' });
  }
});

export default router;
