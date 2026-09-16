import { cities } from '../data/cities';
import { metrics, type Metric } from '../data/schema';
import { metricMeta } from '../lib/format';

export function cityOptions(selectedId: string): string {
  return cities.map((city) => `<option value="${city.id}"${city.id === selectedId ? ' selected' : ''}>${city.name}</option>`).join('');
}

export function metricControls(selected: Metric): string {
  return metrics.map((metric) => `
    <button class="metric-tab" type="button" role="radio" aria-checked="${metric === selected}" data-metric="${metric}">
      ${metricMeta[metric].shortLabel}
    </button>
  `).join('');
}

