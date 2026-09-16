import type { CityDataset } from '../data/schema';
import { formatValue, normalizeDisplayed } from '../lib/format';

export function tableMarkup(dataset: CityDataset, cityName: string): string {
  return `
    <div class="table-scroll" tabindex="0" aria-label="Tabella scorrevole dei valori annuali">
      <table>
        <caption>Valori delle 60 estati per ${cityName}</caption>
        <thead><tr><th scope="col">Anno</th><th scope="col">Temperatura media (°C)</th><th scope="col">Giorni con massima &gt;30 °C</th><th scope="col">Precipitazioni (mm)</th></tr></thead>
        <tbody>${dataset.years.map((summer) => `<tr><th scope="row">${summer.year}</th><td>${formatValue(summer.meanTemperatureC)}</td><td>${summer.hotDays}</td><td>${formatValue(summer.precipitationMm)}</td></tr>`).join('')}</tbody>
      </table>
    </div>
  `;
}

function csvCell(value: string | number): string {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function datasetCsv(dataset: CityDataset): string {
  const rows = [
    ['year', 'mean_temperature_c', 'hot_days_max_gt_30_c', 'precipitation_mm'],
    ...dataset.years.map((summer) => [
      summer.year,
      normalizeDisplayed(summer.meanTemperatureC).toFixed(1),
      summer.hotDays,
      normalizeDisplayed(summer.precipitationMm).toFixed(1),
    ]),
  ];
  return rows.map((row) => row.map(csvCell).join(',')).join('\n') + '\n';
}
