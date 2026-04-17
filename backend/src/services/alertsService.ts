import axios from 'axios';

const NWS_ALERTS_URL = 'https://api.weather.gov/alerts/active';
const CACHE_TTL_MS = (Number(process.env.ALERTS_CACHE_TTL_MINUTES) || 5) * 60 * 1000;

// South Texas NWS zones/counties to filter from state-wide TX feed
const SOUTH_TEXAS_ZONES = new Set([
  'TXZ343', 'TXZ344', 'TXZ345', 'TXZ346', 'TXZ347', // Nueces/Corpus Christi area
  'TXZ348', 'TXZ349', 'TXZ350', 'TXZ351', 'TXZ352', // Coastal bend
  'TXZ353', 'TXZ354', 'TXZ355', 'TXZ356', 'TXZ357', // Cameron/Brownsville area
  'TXZ358', 'TXZ359', 'TXZ360', 'TXZ361', 'TXZ362', // Hidalgo/McAllen area
  'TXC061', 'TXC409', 'TXC427', 'TXC489', // Nueces, Nueces, San Patricio, Webb
  'TXC215', 'TXC031', // Hidalgo, Cameron
]);

export interface WeatherAlert {
  id: string;
  event: string;
  severity: string;
  urgency: string;
  certainty: string;
  headline: string;
  description: string;
  instruction: string | null;
  effective: string;
  expires: string;
  areas: string;
  sender: string;
}

interface AlertsCache {
  alerts: WeatherAlert[];
  fetchedAt: string;
  cached: boolean;
}

let alertsCache: { data: AlertsCache; expiresAt: number } | null = null;

export class AlertsService {
  async getSouthTexasAlerts(): Promise<AlertsCache> {
    if (alertsCache && Date.now() < alertsCache.expiresAt) {
      return { ...alertsCache.data, cached: true };
    }

    const { data } = await axios.get(NWS_ALERTS_URL, {
      params: { area: 'TX' },
      headers: {
        'User-Agent': 'WeatherCommandCenter/1.0 (weather-command-center; gforceklr650@gmail.com)',
        Accept: 'application/geo+json',
      },
    });

    const features: WeatherAlert[] = (data.features || [])
      .filter((f: any) => {
        const zones: string[] = f.properties?.geocode?.UGC || [];
        return zones.some((z) => SOUTH_TEXAS_ZONES.has(z));
      })
      .map((f: any) => {
        const p = f.properties;
        return {
          id: f.id,
          event: p.event,
          severity: p.severity,
          urgency: p.urgency,
          certainty: p.certainty,
          headline: p.headline,
          description: p.description,
          instruction: p.instruction || null,
          effective: p.effective,
          expires: p.expires,
          areas: p.areaDesc,
          sender: p.senderName,
        };
      });

    const result: AlertsCache = {
      alerts: features,
      fetchedAt: new Date().toISOString(),
      cached: false,
    };

    alertsCache = { data: result, expiresAt: Date.now() + CACHE_TTL_MS };
    return result;
  }
}
