import type { SeasonMetric as Metric } from '../data/schema';
import { formatValue, formatSigned } from '../lib/format';
import { warmth } from '../lib/aggregate';
export const meta: Record<Metric, { label: string; short: string; unit: string }> = {
  meanTemperatureC: {
    label: 'Temperatura media stagionale',
    short: 'Temperatura media',
    unit: '°C',
  },
  hotDays: { label: 'Giorni con massima >30 °C', short: 'Giorni >30 °C', unit: 'giorni' },
  precipitationMm: {
    label: 'Precipitazioni totali stagionali',
    short: 'Precipitazioni',
    unit: 'mm',
  },
  frostDays: { label: 'Giorni di gelo (Tmin <0 °C)', short: 'Giorni di gelo', unit: 'giorni' },
  heavyPrecipitationDays: {
    label: 'Giorni con precipitazioni ≥20 mm',
    short: 'Giorni ≥20 mm',
    unit: 'giorni',
  },
};
export const escapeHtml = (value: string) =>
  value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
export function number(value: number | null, metric: Metric, annual = false): string {
  if (value === null) return 'Non applicabile';
  return annual && meta[metric].unit === 'giorni'
    ? value.toLocaleString('it-IT', { maximumFractionDigits: 0 })
    : formatValue(value);
}
export function withUnit(value: number | null, metric: Metric, annual = false): string {
  return value === null
    ? 'Non applicabile'
    : number(value, metric, annual) + ' ' + meta[metric].unit;
}
export const signed = (value: number | null) =>
  value === null ? 'Non applicabile' : formatSigned(value);
export const tone = (value: number | null, metric: Metric) =>
  value === null ? 'unavailable' : warmth(value, metric) >= 0 ? 'warm' : 'cool';
