import { cityYears, orderedCities } from '../app/selectors';
import type { AppState } from '../app/state';
import { metrics } from '../data/schema';
import { rangeStats } from '../lib/aggregate';
import { formatSigned, formatValue, metricMeta } from '../lib/format';
import { rangeLabel, tone } from './display';

export function comparisonMarkup(model: Readonly<AppState>): string {
  return [
    '<section class="comparison panel" ',
    'aria-labelledby="comparison-heading"><div class="panel-bar"><div>',
    '<p class="eyebrow">05 / Tutte le città</p><h2 ',
    'id="comparison-heading">Il confronto completo</h2></div><span ',
    'class="quiet">A ',
    `${rangeLabel(model.state.a)}`,
    ' · B ',
    `${rangeLabel(model.state.b)}`,
    '</span></div>\n    <div class="table-scroll" tabindex="0"><table>',
    '<caption class="sr-only">Tre indicatori, medie A e B e ',
    'differenze per dieci città</caption><thead><tr><th rowspan="2" ',
    'scope="col">Città</th>',
    [
      String(
        metrics
          .map((metric) => `<th colspan="3" scope="colgroup">${metricMeta[metric].shortLabel}</th>`)
          .join(''),
      ),
    ].join(''),
    '</tr><tr>',
    [
      String(
        metrics
          .map(() => '<th scope="col">A</th><th scope="col">B</th><th scope="col">Δ</th>')
          .join(''),
      ),
    ].join(''),
    '</tr></thead><tbody>\n    ',
    `${orderedCities(model)
      .map((city) =>
        [
          '<tr class="',
          `${city.id === model.state.city ? 'selected' : ''}`,
          '"><th scope="row"><button type="button" data-city="',
          `${city.id}`,
          '">',
          `${city.name}`,
          '</button></th>',
          `${metrics
            .map((metric) => {
              const years = cityYears(model, city.id),
                a = rangeStats(years, metric, ...model.state.a),
                b = rangeStats(years, metric, ...model.state.b),
                change = b.mean - a.mean;
              return [
                '<td>',
                `${formatValue(a.mean)}`,
                '</td><td>',
                `${formatValue(b.mean)}`,
                '</td><td class="',
                `${tone(change, metric)}`,
                ' ',
                `${Math.abs(change) > a.sd ? 'signal' : ''}`,
                '" title="',
                `${Math.abs(change) > a.sd ? 'Oltre' : 'Entro'}`,
                ' una deviazione standard A">',
                `${formatSigned(change)}`,
                '</td>',
              ].join('');
            })
            .join('')}`,
          '</tr>',
        ].join(''),
      )
      .join('')}`,
    '</tbody></table></div><p class="note">Δ = B − A. Evidenziato ',
    'quando |Δ| supera una deviazione standard del periodo A; non è ',
    'un test di significatività.</p></section>',
  ].join('');
}
