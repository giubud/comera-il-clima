import { metrics, type Metric } from '../data/schema';
import { metricMeta } from '../lib/format';

export function metricControls(selected: Metric): string {
  return metrics.map((metric) => `<button class="tab" type="button" role="radio" aria-checked="${metric === selected}" data-metric="${metric}">${metricMeta[metric].shortLabel}</button>`).join('');
}
