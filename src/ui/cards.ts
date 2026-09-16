import type { CityDataset, Metric } from '../data/schema';
import { periodDelta } from '../lib/aggregate';
import { deltaWording, formatValue, metricMeta, normalizeDisplayed } from '../lib/format';

function narrative(cityName: string, metric: Metric, delta: number): string {
  const displayed = normalizeDisplayed(delta);
  if (displayed === 0) {
    return `A ${cityName}, ${metricMeta[metric].label.toLocaleLowerCase('it-IT')} è uguale tra i due periodi, alla precisione visualizzata.`;
  }
  const magnitude = formatValue(Math.abs(displayed));
  if (metric === 'meanTemperatureC') {
    return `A ${cityName}, la temperatura media estiva del 1991–2020 è stata di ${magnitude} °C ${deltaWording(displayed)} rispetto al 1961–1990.`;
  }
  if (metric === 'hotDays') {
    return `A ${cityName}, il numero medio di giorni estivi con massima sopra 30 °C è stato di ${magnitude} ${displayed > 0 ? 'giorni in più' : 'giorni in meno'} nel 1991–2020.`;
  }
  return `A ${cityName}, la media delle precipitazioni totali estive è stata di ${magnitude} mm ${displayed > 0 ? 'maggiore' : 'minore'} nel 1991–2020 rispetto al 1961–1990.`;
}

export function cardsMarkup(dataset: CityDataset, cityName: string, metric: Metric): string {
  const { a, b } = dataset.periods;
  const delta = periodDelta(a, b, metric);
  const unit = metricMeta[metric].unit;
  const sign = normalizeDisplayed(delta) > 0 ? '+' : '';
  return `
    <div class="cards" aria-label="Confronto per ${metricMeta[metric].label}">
      <article class="value-card period-a">
        <p class="card-kicker"><span aria-hidden="true">A</span> 1961–1990</p>
        <p class="card-value">${formatValue(a[metric])} <span>${unit}</span></p>
        <p>Media di 30 estati</p>
      </article>
      <article class="value-card period-b">
        <p class="card-kicker"><span aria-hidden="true">B</span> 1991–2020</p>
        <p class="card-value">${formatValue(b[metric])} <span>${unit}</span></p>
        <p>Media di 30 estati</p>
      </article>
      <article class="value-card delta-card">
        <p class="card-kicker">Differenza B − A</p>
        <p class="card-value">${sign}${formatValue(delta)} <span>${unit}</span></p>
        <p>Secondo periodo meno primo</p>
      </article>
    </div>
    <p class="narrative">${narrative(cityName, metric, delta)}</p>
  `;
}

