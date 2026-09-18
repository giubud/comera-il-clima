import type { CityDataset, Metric } from '../data/schema';
import { formatValue, metricMeta } from '../lib/format';

const L = 70, R = 966, T = 20, B = 320;

export function chartMarkup(dataset: CityDataset, cityName: string, metric: Metric): string {
  const values = dataset.years.map((summer) => summer[metric]);
  const rawMin = Math.min(...values), rawMax = Math.max(...values);
  const pad = (rawMax - rawMin) * 0.12 || 1;
  const low = metric === 'meanTemperatureC' ? rawMin - pad : Math.max(0, rawMin - pad);
  const high = rawMax + pad;
  const x = (index: number) => L + index * (R - L) / 59;
  const y = (value: number) => B - (value - low) / (high - low) * (B - T);
  const points = (start: number, end: number) => values.slice(start, end).map((value, index) => `${x(index + start).toFixed(2)},${y(value).toFixed(2)}`).join(' ');
  const ticks = Array.from({ length: 5 }, (_, index) => low + (high - low) * index / 4);
  const years = [1961, 1970, 1980, 1990, 2000, 2010, 2020];
  const record = metric === 'precipitationMm' ? rawMin : rawMax;
  const recordIndex = values.indexOf(record);
  const title = `${metricMeta[metric].label} · ${cityName} · 60 estati`;
  return `<section class="series-panel panel" aria-labelledby="series-heading">
    <div class="panel-bar"><h3 id="series-heading">Serie annuale</h3><span>${title}</span></div>
    <figure class="chart-figure"><svg class="chart" viewBox="0 0 1000 380" role="img" aria-labelledby="chart-title chart-desc">
      <title id="chart-title">${title}</title><desc id="chart-desc">Serie annuale dal 1961 al 2020 con medie dei due periodi.</desc>
      ${ticks.map((tick) => `<line class="grid-line" x1="${L}" x2="${R}" y1="${y(tick)}" y2="${y(tick)}"/>`).join('')}
      <rect class="period-band" x="${L}" y="${T}" width="${x(29.5) - L}" height="${B - T}"/>
      <line class="average average-a" x1="${L}" x2="${x(29.5)}" y1="${y(dataset.periods.a[metric])}" y2="${y(dataset.periods.a[metric])}"/>
      <line class="average average-b" x1="${x(29.5)}" x2="${R}" y1="${y(dataset.periods.b[metric])}" y2="${y(dataset.periods.b[metric])}"/>
      <polyline class="series series-a" points="${points(0, 30)}"/><polyline class="series series-b" points="${points(29, 60)}"/>
      <line class="period-divider" x1="${x(29.5)}" x2="${x(29.5)}" y1="${T}" y2="${B}"/>
      <circle class="record-point" cx="${x(recordIndex)}" cy="${y(record)}" r="4"/>
      ${ticks.map((tick) => `<text class="axis-label" x="60" y="${y(tick) + 4}" text-anchor="end">${formatValue(tick)}</text>`).join('')}
      ${years.map((year) => `<text class="axis-label" x="${x(year - 1961)}" y="350" text-anchor="middle">${year}</text>`).join('')}
      <text class="record-label" x="${x(recordIndex) + (recordIndex > 40 ? -10 : 10)}" y="${y(record) - 12}" text-anchor="${recordIndex > 40 ? 'end' : 'start'}">${dataset.years[recordIndex]!.year} · ${formatValue(record)} ${metricMeta[metric].unit}</text>
    </svg><figcaption class="chart-legend"><span><i class="legend-a"></i>1961—1990</span><span><i class="legend-b"></i>1991—2020</span><span><i class="legend-average"></i>Media di periodo</span></figcaption></figure>
  </section>`;
}
