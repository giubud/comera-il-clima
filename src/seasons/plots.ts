import type { Model } from './model';
import { rows, selectedYear, stats } from './model';
import { movingAverage, warmth, zLevel } from '../lib/aggregate';
import { yearLabel } from '../data/season-meta';
import { cities } from '../data/cities';
import { meta, withUnit, number } from './format';
import { formatSigned } from '../lib/format';
function direction(model: Model, z: number): string {
  const positive = z > 0;
  switch (model.state.metric) {
    case 'precipitationMm':
      return positive ? 'più secco' : 'più piovoso';
    case 'frostDays':
      return positive ? 'meno giorni di gelo' : 'più giorni di gelo';
    case 'heavyPrecipitationDays':
      return positive
        ? 'meno giorni con precipitazioni ≥20 mm'
        : 'più giorni con precipitazioni ≥20 mm';
    case 'hotDays':
      return positive ? 'più giorni sopra 30 °C' : 'meno giorni sopra 30 °C';
    default:
      return positive ? 'più caldo' : 'più fresco';
  }
}
function path(values: readonly (number | null)[], y: (n: number) => number): string {
  return values
    .map((value, i) =>
      value === null
        ? ''
        : (i === 0 || values[i - 1] === null ? 'M' : 'L') + (42 + i * 12.2) + ',' + y(value),
    )
    .join(' ');
}
export function plotsMarkup(model: Model, stripes: boolean): string {
  const metric = model.state.metric,
    year = selectedYear(model),
    data = rows(model);
  const a = stats(model, model.state.city, metric, model.state.a);
  const b = stats(model, model.state.city, metric, model.state.b);
  if (!a || !b) return '';
  if (stripes) {
    return (
      '<section class="stripes-panel panel"><div class="panel-bar"><h2>' +
      'Ogni stagione, un segno</h2></div><div class="stripes" role="group" ' +
      'aria-label="Anomalie annuali">' +
      data
        .map((row) => {
          const value = row[metric] as number;
          const z = a.sd === 0 ? null : warmth(value - a.mean, metric) / a.sd;
          const displayed = z === null ? null : Number(z.toFixed(1));
          const label =
            yearLabel(model.state.season, row.year) +
            ': ' +
            (displayed === null
              ? 'scostamento in σ non definito; periodo A senza variabilità'
              : formatSigned(displayed) +
                ' σ, ' +
                (displayed === 0
                  ? 'nella media A alla precisione mostrata'
                  : direction(model, displayed) + ' della media A'));
          const level = zLevel(warmth(value, metric), warmth(a.mean, metric), a.sd);
          return (
            '<button class="stripe z' +
            level +
            (row.year === year ? ' active' : '') +
            '" data-year="' +
            row.year +
            '" aria-label="' +
            label +
            '" title="' +
            yearLabel(model.state.season, row.year) +
            ': ' +
            withUnit(value, metric, true) +
            '"></button>'
          );
        })
        .join('') +
      '</div><div class="stripe-labels"><span>1961</span><span>1990</span>' +
      '<span>2020</span></div><p class="note">Lo scarto è espresso in deviazioni standard ' +
      'del periodo A. Rosso: ' +
      direction(model, 1) +
      '; blu: verso opposto.' +
      '</p></section>'
    );
  }
  const values = data.map((row) => row[metric] as number);
  const other = model.state.vs
    ? rows(model, model.state.vs).map((row) => row[metric] as number)
    : null;
  const all = [...values, ...(other ?? [])],
    lo = Math.min(...all) - 1,
    hi = Math.max(...all) + 1;
  const y = (value: number) => 214 - ((value - lo) / (hi - lo)) * 174;
  return (
    '<section class="chart-panel panel"><div class="panel-bar"><h2>' +
    'Sessant’anni, stagione per stagione</h2><div class="chart-controls"><label>Confronta con ' +
    '<select id="compare-city" aria-label="Confronta con un’altra città">' +
    '<option value="">Nessuna città</option>' +
    cities
      .filter((c) => c.id !== model.state.city)
      .map(
        (c) =>
          '<option value="' +
          c.id +
          '" ' +
          (c.id === model.state.vs ? 'selected' : '') +
          '>' +
          c.name +
          '</option>',
      )
      .join('') +
    '</select></label><label><input id="smooth" type="checkbox" ' +
    (model.state.smooth ? 'checked' : '') +
    '> Media mobile (5)</label></div></div>' +
    '<div class="chart-wrap"><svg class="chart-svg" viewBox="0 0 820 246" role="img" ' +
    'aria-label="Serie annuale ' +
    meta[metric].label +
    '">' +
    [0, 1, 2, 3, 4]
      .map((i) => {
        const value = lo + ((hi - lo) * i) / 4;
        return (
          '<line class="gridline" x1="42" x2="765" y1="' +
          y(value) +
          '" y2="' +
          y(value) +
          '"/>' +
          '<text class="axis-label" x="4" y="' +
          y(value) +
          '">' +
          number(value, metric) +
          '</text>'
        );
      })
      .join('') +
    '<path class="data-line" d="' +
    path(values, y) +
    '"/>' +
    (other ? '<path class="compare-line" d="' + path(other, y) + '"/>' : '') +
    (model.state.smooth
      ? '<path class="smooth-line" d="' + path(movingAverage(values), y) + '"/>'
      : '') +
    (model.state.smooth && other
      ? '<path class="compare-smooth-line" d="' + path(movingAverage(other), y) + '"/>'
      : '') +
    values
      .map(
        (value, i) =>
          '<circle class="chart-point" data-year="' +
          (1961 + i) +
          '" role="button" tabindex="0" r="' +
          (1961 + i === year ? 5 : 3) +
          '" cx="' +
          (42 + i * 12.2) +
          '" cy="' +
          y(value) +
          '" aria-label="' +
          yearLabel(model.state.season, 1961 + i) +
          ': ' +
          withUnit(value, metric, true) +
          '"><title>' +
          yearLabel(model.state.season, 1961 + i) +
          ': ' +
          withUnit(value, metric, true) +
          '</title></circle>',
      )
      .join('') +
    [1961, 1970, 1980, 1990, 2000, 2010, 2020]
      .map(
        (value) =>
          '<text class="axis-label" x="' +
          (42 + (value - 1961) * 12.2) +
          '" y="237">' +
          value +
          '</text>',
      )
      .join('') +
    '</svg></div><div class="chart-footer"><span>Media A ' +
    withUnit(a.mean, metric) +
    '</span><span>Media B ' +
    withUnit(b.mean, metric) +
    '</span></div></section>'
  );
}
