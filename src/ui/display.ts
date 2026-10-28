import { type Metric } from '../data/schema';
import { warmth } from '../lib/aggregate';
import { formatValue, metricMeta } from '../lib/format';
import { type Period } from '../lib/url-state';

export const rangeLabel = ([start, end]: Period): string => `${start}–${end}`;

export const valueWithUnit = (
  value: number,
  metric: Metric,
  kind: 'annual' | 'period' = 'annual',
): string => `${formatValue(value, { metric, kind })} ${metricMeta[metric].unit}`;

export const tone = (change: number, metric: Metric): string =>
  warmth(change, metric) >= 0 ? 'warm' : 'cool';
