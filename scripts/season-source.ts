import { join } from 'node:path';
import { annualDates } from '../src/data/calendar';
import { requestUrl, matchesSourceSelection, sourceSelection } from './open-meteo';
export const seasonCacheRoot = join(process.cwd(), '.cache', 'open-meteo-seasons-v2');
export function seasonRequestUrl(latitude: number, longitude: number, year: number): string {
  const url = new URL(requestUrl(latitude, longitude, year));
  url.searchParams.set('start_date', `${year - 1}-12-01`);
  url.searchParams.set('end_date', `${year}-11-30`);
  url.searchParams.set(
    'daily',
    'temperature_2m_mean,temperature_2m_max,temperature_2m_min,precipitation_sum',
  );
  return url.toString();
}
export function matchesSeasonRequest(
  url: string,
  latitude: number,
  longitude: number,
  year: number,
): boolean {
  return (
    url === seasonRequestUrl(latitude, longitude, year) &&
    matchesSourceSelection(new URL(url), sourceSelection)
  );
}
export function quotaWeight(year: number): number {
  return Math.ceil((annualDates(year).length / 14) * 100) / 100;
}
