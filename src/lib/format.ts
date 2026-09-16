import type { Metric } from '../data/schema';

const formatter = new Intl.NumberFormat('it-IT', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export const metricMeta: Record<Metric, { label: string; shortLabel: string; unit: string }> = {
  meanTemperatureC: { label: 'Temperatura media estiva', shortLabel: 'Temperatura media', unit: '°C' },
  hotDays: { label: 'Giorni con massima >30 °C', shortLabel: 'Giorni >30 °C', unit: 'giorni' },
  precipitationMm: { label: 'Precipitazioni totali estive', shortLabel: 'Precipitazioni', unit: 'mm' },
};

export function normalizeDisplayed(value: number): number {
  const rounded = Math.round((value + Number.EPSILON) * 10) / 10;
  return Object.is(rounded, -0) ? 0 : rounded;
}

export function formatValue(value: number): string {
  return formatter.format(normalizeDisplayed(value));
}

export function deltaWording(value: number): 'più alta' | 'più bassa' | 'uguale' {
  const displayed = normalizeDisplayed(value);
  if (displayed > 0) return 'più alta';
  if (displayed < 0) return 'più bassa';
  return 'uguale';
}

