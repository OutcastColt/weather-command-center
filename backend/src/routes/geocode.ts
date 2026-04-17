import { Router, Request, Response } from 'express';
import { GeocodeService } from '../services/geocodeService';

const router = Router();
const geocodeService = new GeocodeService();

router.get('/', async (req: Request, res: Response) => {
  const { q } = req.query;

  if (!q || typeof q !== 'string' || q.trim() === '') {
    return res.status(400).json({ error: 'Query parameter "q" is required (zip code or address)' });
  }

  try {
    const result = await geocodeService.geocode(q.trim());
    return res.json(result);
  } catch (err: any) {
    const status = err.message?.startsWith('No results found') ? 404 : 502;
    return res.status(status).json({ error: err.message || 'Geocoding failed' });
  }
});

export default router;
