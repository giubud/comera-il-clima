import { cityYears, selectedYear } from '../app/selectors';
import type { AppState } from '../app/state';
import { cities, getCity } from '../data/cities';
import { movingAverage, rangeStats } from '../lib/aggregate';
import { formatValue, metricMeta } from '../lib/format';
import { requireDefined } from '../lib/required';
import { valueWithUnit } from './display';

function linePath(values: readonly (number | null)[], lo: number, hi: number): string {
  return values
    .map((value, index) =>
      value === null
        ? ''
        : [
            `${index === 0 || values[index - 1] === null ? 'M' : 'L'}`,
            `${42 + index * 12.2}`,
            ',',
            `${214 - ((value - lo) / (hi - lo)) * 174}`,
          ].join(''),
    )
    .join(' ');
}

export function chartMarkup(model: Readonly<AppState>): string {
  const series = cityYears(model, model.state.city).map((item) => item[model.state.metric]);
  const other = model.state.vs
    ? cityYears(model, model.state.vs).map((item) => item[model.state.metric])
    : null;
  const all = [...series, ...(other ?? [])];
  const lo = Math.min(...all) - 1,
    hi = Math.max(...all) + 1;
  const smooth = model.state.smooth ? movingAverage(series) : null;
  const otherSmooth = model.state.smooth && other ? movingAverage(other) : null;
  const a = rangeStats(cityYears(model, model.state.city), model.state.metric, ...model.state.a);
  const b = rangeStats(cityYears(model, model.state.city), model.state.metric, ...model.state.b);
  const y = (value: number) => 214 - ((value - lo) / (hi - lo)) * 174;
  return [
    '<section class="chart-panel panel" ',
    'aria-labelledby="chart-heading"><div class="panel-bar"><div><p ',
    'class="eyebrow">03 / Cronologia</p><h2 id="chart-heading">',
    'Sessant’anni, estate per estate</h2></div><div ',
    'class="chart-controls"><label>Confronta con <select ',
    'id="compare-city" aria-label="Confronta con un\'altra città">',
    '<option value="">Nessuna città</option>',
    `${cities
      .filter((city) => city.id !== model.state.city)
      .map((city) =>
        [
          '<option value="',
          `${city.id}`,
          '" ',
          `${model.state.vs === city.id ? 'selected' : ''}`,
          '>',
          `${city.name}`,
          '</option>',
        ].join(''),
      )
      .join('')}`,
    '</select></label><label class="check"><input id="smooth" ',
    'type="checkbox" ',
    `${model.state.smooth ? 'checked' : ''}`,
    '> Media mobile (5)</label></div></div>\n    <div ',
    'class="chart-wrap"><svg class="chart-svg" viewBox="0 0 820 246" ',
    'role="img" aria-label="Serie annuale ',
    `${metricMeta[model.state.metric].label}`,
    ' di ',
    `${requireDefined(getCity(model.state.city)).name}`,
    '">\n    <rect x="42" y="25" width="',
    `${(model.state.a[1] - model.state.a[0] + 1) * 12.2}`,
    '" height="189" class="period-shade a" transform="translate(',
    `${(model.state.a[0] - 1961) * 12.2}`,
    ' 0)"/><rect x="42" y="25" width="',
    `${(model.state.b[1] - model.state.b[0] + 1) * 12.2}`,
    '" height="189" class="period-shade b" transform="translate(',
    `${(model.state.b[0] - 1961) * 12.2}`,
    ' 0)"/>\n    ',
    `${[0, 1, 2, 3, 4]
      .map((i) => {
        const value = lo + ((hi - lo) * i) / 4;
        return [
          '<line x1="42" y1="',
          `${y(value)}`,
          '" x2="765" y2="',
          `${y(value)}`,
          '" class="gridline"/><text x="5" y="',
          `${y(value) + 4}`,
          '" class="axis-label">',
          `${formatValue(value)}`,
          '</text>',
        ].join('');
      })
      .join('')}`,
    '\n    <path d="',
    `${linePath(series, lo, hi)}`,
    '" class="data-line"/>',
    `${other ? `<path d="${linePath(other, lo, hi)}" class="compare-line"/>` : ''}`,
    `${smooth ? `<path d="${linePath(smooth, lo, hi)}" class="smooth-line"/>` : ''}`,
    [
      String(
        otherSmooth
          ? `<path d="${linePath(otherSmooth, lo, hi)}" class="compare-smooth-line"/>`
          : '',
      ),
    ].join(''),
    '\n    ',
    `${series
      .map((value, index) =>
        [
          '<circle cx="',
          `${42 + index * 12.2}`,
          '" cy="',
          `${y(value)}`,
          '" r="',
          `${1961 + index === selectedYear(model) ? 5 : 3}`,
          '" class="chart-point ',
          `${1961 + index === selectedYear(model) ? 'active' : ''}`,
          '" data-year="',
          `${1961 + index}`,
          '" tabindex="0" role="button" aria-label="Estate ',
          `${1961 + index}`,
          ': ',
          `${valueWithUnit(value, model.state.metric)}`,
          '"><title>',
          `${1961 + index}`,
          ': ',
          `${valueWithUnit(value, model.state.metric)}`,
          '</title></circle>',
        ].join(''),
      )
      .join('')}`,
    '\n    ',
    `${[1961, 1970, 1980, 1990, 2000, 2010, 2020]
      .map((year) =>
        [
          '<text x="',
          `${42 + (year - 1961) * 12.2}`,
          '" y="237" text-anchor="middle" class="axis-label">',
          `${year}`,
          '</text>',
        ].join(''),
      )
      .join('')}`,
    '</svg></div>\n    <div class="chart-footer"><span><i ',
    'class="legend-dot primary"></i>\n      ',
    `${requireDefined(getCity(model.state.city)).name}`,
    `${
      model.state.vs
        ? [
            ' <i class="legend-dot secondary"></i>',
            `${requireDefined(getCity(model.state.vs)).name}`,
          ].join('')
        : ''
    }`,
    '</span>\n      <span>Media A ',
    `${valueWithUnit(a.mean, model.state.metric, 'period')}`,
    ' ·\n        Media B ',
    `${valueWithUnit(b.mean, model.state.metric, 'period')}`,
    '</span></div></section>',
  ].join('');
}
