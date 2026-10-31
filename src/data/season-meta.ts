import type { SeasonMetric as Metric, Season } from './schema';
export const metrics = [
  'meanTemperatureC',
  'hotDays',
  'precipitationMm',
  'frostDays',
  'heavyPrecipitationDays',
] as const;
export const seasons = ['DJF', 'MAM', 'JJA', 'SON'] as const;
export const seasonLabels: Record<Season, string> = {
  DJF: 'Inverno',
  MAM: 'Primavera',
  JJA: 'Estate',
  SON: 'Autunno',
};
export const seasonMonths: Record<Season, string> = {
  DJF: 'dicembre–febbraio',
  MAM: 'marzo–maggio',
  JJA: 'giugno–agosto',
  SON: 'settembre–novembre',
};
export function isMetric(value: string | null): value is Metric {
  return value !== null && (metrics as readonly string[]).includes(value);
}
export function isSeason(value: string | null): value is Season {
  return value !== null && (seasons as readonly string[]).includes(value);
}
export function notApplicable(season: Season, metric: Metric): string | null {
  if (season === 'DJF' && metric === 'hotDays')
    return 'Giorni sopra 30 °C esclusi dalla vista invernale.';
  if (season === 'JJA' && metric === 'frostDays')
    return 'Giorni di gelo esclusi dalla vista estiva.';
  return null;
}
export function applicability(): Record<Season, Record<Metric, string | null>> {
  return Object.fromEntries(
    seasons.map((season) => [
      season,
      Object.fromEntries(metrics.map((metric) => [metric, notApplicable(season, metric)])),
    ]),
  ) as Record<Season, Record<Metric, string | null>>;
}
export function isInverted(metric: Metric): boolean {
  return ['precipitationMm', 'frostDays', 'heavyPrecipitationDays'].includes(metric);
}
export function yearLabel(season: Season, year: number): string {
  return season === 'DJF'
    ? `Inverno ${year - 1}/${String(year).slice(-2)}`
    : `${seasonLabels[season]} ${year}`;
}
