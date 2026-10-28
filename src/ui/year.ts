import { cityYears, orderedCities, selectedYear } from '../app/selectors';
import type { AppState } from '../app/state';
import { metrics } from '../data/schema';
import { rangeStats, warmth, zLevel } from '../lib/aggregate';
import { formatSigned, metricMeta } from '../lib/format';
import { requireDefined } from '../lib/required';
import { valueWithUnit } from './display';

export function yearMarkup(model: Readonly<AppState>): string {
  const year = selectedYear(model),
    summers = cityYears(model, model.state.city),
    row = requireDefined(summers[year - 1961]);
  const warmest = requireDefined(
    [...summers].sort(
      (a, b) =>
        warmth(b[model.state.metric], model.state.metric) -
        warmth(a[model.state.metric], model.state.metric),
    )[0],
  ).year;
  const mildest = requireDefined(
    [...summers].sort(
      (a, b) =>
        Math.abs(
          a[model.state.metric] - rangeStats(summers, model.state.metric, ...model.state.a).mean,
        ) -
        Math.abs(
          b[model.state.metric] - rangeStats(summers, model.state.metric, ...model.state.a).mean,
        ),
    )[0],
  ).year;
  return [
    '<section class="year-panel panel" aria-labelledby="year-heading">',
    '<div class="panel-bar"><div><p class="eyebrow">04 / Un’estate da ',
    'vicino</p><h2 id="year-heading">L’estate del ',
    `${year}`,
    '</h2></div><div class="year-nav"><button type="button" ',
    'data-year-step="-1" aria-label="Anno precedente" ',
    `${year <= 1961 ? 'disabled' : ''}`,
    '>←</button><select id="year-select" aria-label="Seleziona anno">',
    `${summers
      .map((item) =>
        [
          '<option value="',
          `${item.year}`,
          '" ',
          `${item.year === year ? 'selected' : ''}`,
          '>',
          `${item.year}`,
          '</option>',
        ].join(''),
      )
      .join('')}`,
    '</select><button type="button" data-year-step="1" ',
    'aria-label="Anno successivo" ',
    `${year >= 2020 ? 'disabled' : ''}`,
    '>→</button></div></div>\n    <div class="year-chips"><span>Vai ',
    'a:</span>',
    `${[
      [warmest, 'Più estrema'],
      [mildest, 'Più vicina alla media'],
      [2003, '2003'],
      [2020, '2020'],
    ]
      .map(([value, label]) => `<button type="button" data-year="${value}">${label}</button>`)
      .join('')}`,
    '</div>\n    <div class="year-cards">',
    `${metrics
      .map((metric) => {
        const rank =
          [...summers]
            .sort((a, b) => warmth(b[metric], metric) - warmth(a[metric], metric))
            .findIndex((item) => item.year === year) + 1;
        const a = rangeStats(summers, metric, ...model.state.a);
        return [
          '<div><span>',
          `${metricMeta[metric].shortLabel}`,
          '</span><strong>',
          `${valueWithUnit(row[metric], metric)}`,
          '</strong><small>',
          `${formatSigned(row[metric] - a.mean)}`,
          ' sulla media A · ',
          `${rank}`,
          'ª su 60</small></div>',
        ].join('');
      })
      .join('')}`,
    '</div>\n    <div class="year-city-grid"><h3>',
    `${year}`,
    ' nelle dieci città</h3><div>',
    `${orderedCities(model)
      .map((city) => {
        const years = cityYears(model, city.id),
          value = requireDefined(years[year - 1961])[model.state.metric],
          a = rangeStats(years, model.state.metric, ...model.state.a);
        const level = zLevel(
          warmth(value, model.state.metric),
          warmth(a.mean, model.state.metric),
          a.sd,
        );
        return [
          '<button type="button" data-city="',
          `${city.id}`,
          '" class="year-city z',
          `${level}`,
          ' ',
          `${city.id === model.state.city ? 'active' : ''}`,
          '"><strong>',
          `${city.name}`,
          '</strong><span>',
          `${valueWithUnit(value, model.state.metric)}`,
          '</span></button>',
        ].join('');
      })
      .join('')}`,
    '</div></div></section>',
  ].join('');
}
