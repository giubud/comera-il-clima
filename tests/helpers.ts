import type { DailyResponse, Summer } from '../src/data/schema';

export function syntheticResponse(year: number, overrides: Partial<DailyResponse['daily']> = {}): DailyResponse {
  const start = Date.UTC(year, 5, 1);
  const time = Array.from({ length: 92 }, (_, index) => new Date(start + index * 86_400_000).toISOString().slice(0, 10));
  return {
    latitude: 42,
    longitude: 12.5,
    elevation: 137,
    timezone: 'Europe/Rome',
    daily_units: { time: 'iso8601', temperature_2m_mean: '°C', temperature_2m_max: '°C', precipitation_sum: 'mm' },
    daily: {
      time,
      temperature_2m_mean: Array(92).fill(20),
      temperature_2m_max: Array(92).fill(30),
      precipitation_sum: Array(92).fill(1),
      ...overrides,
    },
  };
}

export function constantSummer(year: number, meanTemperatureC: number, hotDays = 10, precipitationMm = 92): Summer {
  return { year, validDays: 92, meanTemperatureC, hotDays, precipitationMm };
}

