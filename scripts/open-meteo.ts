import { join } from 'node:path';
import type { SourceSelection } from '../src/data/schema';

export const sourceSelection = {
  cellSelection: 'land',
  elevationCorrection: 'enabled',
} as const satisfies SourceSelection;

// La cache nearest originale rimane disponibile per il confronto prima/dopo.
export const cacheRoot = join(process.cwd(), '.cache', 'open-meteo-land');

export function requestUrl(latitude: number, longitude: number, year: number): string {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    start_date: `${year}-06-01`,
    end_date: `${year}-08-31`,
    daily: 'temperature_2m_mean,temperature_2m_max,precipitation_sum',
    models: 'era5',
    timezone: 'Europe/Rome',
    temperature_unit: 'celsius',
    precipitation_unit: 'mm',
    cell_selection: sourceSelection.cellSelection,
  });
  return `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`;
}

export function matchesSourceSelection(url: URL, source: SourceSelection): boolean {
  const params = url.searchParams;
  return url.origin === 'https://archive-api.open-meteo.com'
    && url.pathname === '/v1/archive'
    && params.get('models') === 'era5'
    && params.get('cell_selection') === source.cellSelection
    && (source.elevationCorrection === 'disabled'
      ? params.get('elevation') === 'nan'
      : !params.has('elevation'));
}
