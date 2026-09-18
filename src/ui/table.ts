import type { CityDataset } from '../data/schema';
import { formatValue, normalizeDisplayed } from '../lib/format';

export function tableMarkup(dataset: CityDataset, cityName: string): string {
  return `<section class="annual panel" aria-labelledby="annual-heading"><div class="panel-bar"><h3 id="annual-heading">Dati annuali · ${cityName}</h3><span>60 righe</span></div>
    <div class="table-scroll" tabindex="0" aria-label="Tabella scorrevole dei valori annuali"><table><caption class="sr-only">Valori delle 60 estati per ${cityName}</caption>
      <thead><tr><th scope="col">Anno</th><th scope="col">°C</th><th scope="col">gg &gt;30</th><th scope="col">mm</th></tr></thead>
      <tbody>${dataset.years.map((summer) => `<tr${summer.year === 1990 ? ' class="period-end"' : ''}><th scope="row">${summer.year}</th><td class="${summer.year <= 1990 ? 'value-a' : 'value-b'}">${formatValue(summer.meanTemperatureC)}</td><td>${summer.hotDays}</td><td>${formatValue(summer.precipitationMm)}</td></tr>`).join('')}</tbody>
    </table></div></section>`;
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function datasetCsv(dataset: CityDataset): string {
  const rows = [['year', 'mean_temperature_c', 'hot_days_max_gt_30_c', 'precipitation_mm'], ...dataset.years.map((summer) => [
    summer.year, normalizeDisplayed(summer.meanTemperatureC).toFixed(1), summer.hotDays, normalizeDisplayed(summer.precipitationMm).toFixed(1),
  ])];
  return rows.map((row) => row.map(csvCell).join(',')).join('\n') + '\n';
}
