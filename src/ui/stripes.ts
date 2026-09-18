import type { CityDataset, Metric } from '../data/schema';
import { formatSigned, metricMeta } from '../lib/format';

export function stripesMarkup(dataset: CityDataset, metric: Metric): string {
  const baseline = dataset.periods.a[metric];
  const deviations = dataset.years.map((summer) => summer[metric] - baseline);
  const maximum = Math.max(...deviations.map(Math.abs), 1);
  return `<div class="stripes-block">
    <div class="stripes-heading"><span>Anomalia per estate vs A</span><span>${metricMeta[metric].shortLabel.toLowerCase()} · scarto dalla media 1961–1990</span></div>
    <div class="stripes" role="img" aria-label="Anomalie annuali dal 1961 al 2020">${dataset.years.map((summer, index) => {
      const deviation = deviations[index]!;
      const cool = metric === 'precipitationMm' ? deviation > 0 : deviation < 0;
      return `<i title="${summer.year}: ${formatSigned(deviation)} ${metricMeta[metric].unit}" class="${cool ? 'cool' : 'warm'}" style="opacity:${(0.14 + 0.86 * Math.abs(deviation) / maximum).toFixed(2)}"></i>`;
    }).join('')}</div>
    <div class="stripe-years"><span>1961</span><span>1990</span><span>2020</span></div>
  </div>`;
}
