import type { CityDataset, Metric } from '../data/schema';
import { periodDelta } from '../lib/aggregate';
import { formatSigned, formatValue, metricMeta } from '../lib/format';

export function cardsMarkup(dataset: CityDataset, metric: Metric): string {
  const { a, b } = dataset.periods;
  const delta = periodDelta(a, b, metric);
  const values = dataset.years.map((summer) => summer[metric]);
  const record = metric === 'precipitationMm' ? Math.min(...values) : Math.max(...values);
  const summer = dataset.years.find((item) => item[metric] === record)!;
  const recordLabel = metric === 'precipitationMm' ? 'estate più secca' : metric === 'hotDays' ? 'più giorni sopra 30 °C' : 'estate più calda';
  const unit = metricMeta[metric].unit;
  return `<div class="cards" aria-label="Confronto per ${metricMeta[metric].label}">
    <article class="value-card period-a"><p class="card-kicker"><i></i>A · 1961—1990</p><p class="card-value">${formatValue(a[metric])}<span>${unit}</span></p><p>Media delle prime 30 estati</p></article>
    <article class="value-card period-b"><p class="card-kicker"><i></i>B · 1991—2020</p><p class="card-value">${formatValue(b[metric])}<span>${unit}</span></p><p>Media delle ultime 30 estati</p></article>
    <article class="value-card delta-card"><p class="card-kicker">Δ · B meno A</p><p class="card-value">${formatSigned(delta)}<span>${unit}</span></p><p>${metricMeta[metric].shortLabel.toLowerCase()} · secondo trentennio meno primo</p></article>
    <article class="value-card record-card"><p class="card-kicker">Estate record</p><p class="card-value">${summer.year}</p><p>${recordLabel}: ${formatValue(record)} ${unit}</p></article>
  </div>`;
}
