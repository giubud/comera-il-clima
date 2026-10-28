import { cityYears, selectedYear } from '../app/selectors';
import type { AppState } from '../app/state';
import { getCity } from '../data/cities';
import { rangeStats } from '../lib/aggregate';
import { formatSigned, formatValue } from '../lib/format';
import { requireDefined } from '../lib/required';
import { tone } from './display';

export function annualMarkup(model: Readonly<AppState>): string {
  const summers = cityYears(model, model.state.city),
    a = rangeStats(summers, model.state.metric, ...model.state.a);
  return [
    '<section class="annual panel" aria-labelledby="annual-heading">',
    '<div class="panel-bar"><div><p class="eyebrow">06 / Archivio</p>',
    '<h2 id="annual-heading">Dati annuali · ',
    `${requireDefined(getCity(model.state.city)).name}`,
    '</h2></div><div class="annual-actions"><button type="button" ',
    'id="copy-link">Copia link</button><button type="button" ',
    'id="download-csv" ',
    `${model.cityDataset?.cityId === model.state.city ? '' : 'disabled'}`,
    '>CSV ↓</button></div></div>\n    ',
    `${
      model.cityError
        ? [
            '<div class="data-error" role="alert">Non è stato possibile ',
            'caricare i dati di dettaglio per il CSV. <button type="button" ',
            'id="retry">Riprova</button></div>',
          ].join('')
        : ''
    }`,
    '\n    <div class="table-scroll annual-scroll" tabindex="0" ',
    'aria-label="Tabella scorrevole dei valori annuali"><table>',
    '<caption class="sr-only">Valori delle 60 estati per ',
    `${requireDefined(getCity(model.state.city)).name}`,
    '</caption><thead><tr><th scope="col">Anno</th><th scope="col">',
    'Periodo</th><th scope="col">°C</th><th scope="col">gg &gt;30</th>',
    '<th scope="col">mm</th><th scope="col">Anomalia</th></tr></thead>',
    '<tbody>',
    [
      String(
        summers
          .map((summer) => {
            const val = summer[model.state.metric] - a.mean;
            return [
              '<tr class="',
              `${summer.year === selectedYear(model) ? 'selected' : ''}`,
              '"><th scope="row"><button type="button" data-year="',
              `${summer.year}`,
              '">',
              `${summer.year}`,
              '</button></th><td>',
              [
                String(
                  summer.year >= model.state.a[0] && summer.year <= model.state.a[1]
                    ? 'A'
                    : summer.year >= model.state.b[0] && summer.year <= model.state.b[1]
                      ? 'B'
                      : '—',
                ),
              ].join(''),
              '</td><td>',
              `${formatValue(summer.meanTemperatureC)}`,
              '</td><td>',
              `${summer.hotDays}`,
              '</td><td>',
              `${formatValue(summer.precipitationMm)}`,
              '</td><td class="',
              `${tone(val, model.state.metric)}`,
              '">',
              `${formatSigned(val)}`,
              '</td></tr>',
            ].join('');
          })
          .join(''),
      ),
    ].join(''),
    '</tbody></table></div></section>',
  ].join('');
}
