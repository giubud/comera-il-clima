import type { CityDataset, Metric } from '../data/schema';
import { formatValue, metricMeta } from '../lib/format';

const width = 960;
const height = 360;
const margin = { top: 28, right: 24, bottom: 46, left: 66 };

function path(points: readonly { x: number; y: number }[]): string {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(' ');
}

export function chartMarkup(dataset: CityDataset, cityName: string, metric: Metric): string {
  const values = dataset.years.map((summer) => summer[metric]);
  const rawMin = Math.min(...values);
  const rawMax = Math.max(...values);
  const yMin = metric === 'meanTemperatureC' ? Math.floor(rawMin - 1) : 0;
  const yMaxBase = metric === 'meanTemperatureC' ? Math.ceil(rawMax + 1) : Math.ceil(rawMax * 1.12);
  const yMax = yMaxBase === yMin ? yMin + 1 : yMaxBase;
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;
  const x = (year: number) => margin.left + ((year - 1961) / 59) * plotWidth;
  const y = (value: number) => margin.top + ((yMax - value) / (yMax - yMin)) * plotHeight;
  const points = dataset.years.map((summer) => ({ x: x(summer.year), y: y(summer[metric]), year: summer.year }));
  const first = points.slice(0, 30);
  const second = points.slice(29);
  const yTicks = Array.from({ length: 5 }, (_, index) => yMin + ((yMax - yMin) * index) / 4).reverse();
  const xTicks = [1961, 1970, 1980, 1990, 2000, 2010, 2020];
  const divideX = (x(1990) + x(1991)) / 2;
  const title = `${metricMeta[metric].label} a ${cityName}, estate per estate`;
  const desc = `Serie annuale dal 1961 al 2020. La linea blu continua indica il periodo 1961–1990; la linea terracotta tratteggiata il 1991–2020. Le linee orizzontali più spesse indicano le medie dei rispettivi periodi.`;
  return `
    <figure class="chart-figure">
      <figcaption><strong>${title}</strong><span>Valori annuali e medie dei due periodi</span></figcaption>
      <div class="chart-wrap">
        <svg class="chart" viewBox="0 0 ${width} ${height}" role="img" aria-labelledby="chart-title chart-desc">
          <title id="chart-title">${title}</title>
          <desc id="chart-desc">${desc}</desc>
          ${yTicks.map((tick) => `<g class="axis-tick"><line x1="${margin.left}" x2="${width - margin.right}" y1="${y(tick)}" y2="${y(tick)}"/><text x="${margin.left - 12}" y="${y(tick) + 5}" text-anchor="end">${formatValue(tick)}</text></g>`).join('')}
          ${xTicks.map((tick) => `<text class="x-label" x="${x(tick)}" y="${height - 14}" text-anchor="middle">${tick}</text>`).join('')}
          <text class="unit-label" x="${margin.left}" y="16">${metricMeta[metric].unit}</text>
          <line class="period-divider" x1="${divideX}" x2="${divideX}" y1="${margin.top}" y2="${height - margin.bottom}"/>
          <path class="series series-a" d="${path(first)}"/>
          <path class="series series-b" d="${path(second)}"/>
          ${points.map((point) => `<circle class="point ${point.year <= 1990 ? 'point-a' : 'point-b'}" cx="${point.x}" cy="${point.y}" r="2.2"/>`).join('')}
          <line class="average average-a" x1="${x(1961)}" x2="${x(1990)}" y1="${y(dataset.periods.a[metric])}" y2="${y(dataset.periods.a[metric])}"/>
          <line class="average average-b" x1="${x(1991)}" x2="${x(2020)}" y1="${y(dataset.periods.b[metric])}" y2="${y(dataset.periods.b[metric])}"/>
        </svg>
      </div>
      <div class="chart-legend" aria-hidden="true">
        <span><i class="legend-a"></i>A · 1961–1990</span>
        <span><i class="legend-b"></i>B · 1991–2020</span>
        <span><i class="legend-average"></i>Media del periodo</span>
      </div>
    </figure>
  `;
}

