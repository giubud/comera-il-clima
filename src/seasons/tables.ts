import type { Model } from './model';
import { difference, orderedCities, rows, selectedYear, stats } from './model';
import { metrics, notApplicable, yearLabel } from '../data/season-meta';
import { seasonDates } from '../data/calendar';
import { getCity } from '../data/cities';
import { meta, number, signed, tone, withUnit } from './format';
import { normalizeDisplayed } from '../lib/format';
export function yearMarkup(model: Model): string {
  const year = selectedYear(model),
    row = rows(model)[year - 1961];
  if (!row) return '';
  return (
    '<section class="year-panel panel" aria-labelledby="year-heading">' +
    '<div class="panel-bar"><div><p class="eyebrow">04 / Una stagione da vicino</p>' +
    '<h2 id="year-heading">' +
    yearLabel(model.state.season, year) +
    '</h2></div>' +
    '<div class="year-nav"><button data-year-step="-1" aria-label="Anno precedente" ' +
    (year === 1961 ? 'disabled' : '') +
    '>←</button><select id="year-select" aria-label="Seleziona anno">' +
    rows(model)
      .map(
        (r) =>
          '<option ' +
          (r.year === year ? 'selected ' : '') +
          'value="' +
          r.year +
          '">' +
          yearLabel(model.state.season, r.year) +
          '</option>',
      )
      .join('') +
    '</select><button data-year-step="1" aria-label="Anno successivo" ' +
    (year === 2020 ? 'disabled' : '') +
    '>→</button></div></div><div class="year-cards">' +
    metrics
      .map((metric) => {
        const a = stats(model, model.state.city, metric, model.state.a);
        const value = row[metric];
        return (
          '<div><span>' +
          meta[metric].short +
          '</span><strong>' +
          withUnit(value, metric, true) +
          '</strong><small>' +
          (a && value !== null
            ? signed(value - a.mean) + ' sulla media A'
            : notApplicable(model.state.season, metric)) +
          '</small></div>'
        );
      })
      .join('') +
    '</div><div class="year-city-grid"><h3>' +
    year +
    ' nelle dieci città</h3><div>' +
    orderedCities(model)
      .map((city) => {
        const value = rows(model, city.id)[year - 1961]?.[model.state.metric] ?? null;
        return (
          '<button class="year-city" data-city="' +
          city.id +
          '"><strong>' +
          city.name +
          '</strong><span>' +
          withUnit(value, model.state.metric, true) +
          '</span></button>'
        );
      })
      .join('') +
    '</div></div></section>'
  );
}
export function comparisonMarkup(model: Model): string {
  return (
    '<section class="comparison panel"><div class="panel-bar"><h2>' +
    'Il confronto completo</h2></div><div class="table-scroll" tabindex="0">' +
    '<table><caption class="sr-only">Cinque indicatori nelle dieci città</caption>' +
    '<thead><tr><th rowspan="2">Città</th>' +
    metrics.map((m) => '<th colspan="3">' + meta[m].short + '</th>').join('') +
    '</tr><tr>' +
    metrics.map(() => '<th>A</th><th>B</th><th>Δ</th>').join('') +
    '</tr></thead><tbody>' +
    orderedCities(model)
      .map(
        (city) =>
          '<tr><th scope="row"><button data-city="' +
          city.id +
          '">' +
          city.name +
          '</button></th>' +
          metrics
            .map((metric) => {
              const a = stats(model, city.id, metric, model.state.a),
                b = stats(model, city.id, metric, model.state.b);
              const delta = difference(model, city.id, metric);
              return (
                '<td>' +
                number(a?.mean ?? null, metric) +
                '</td><td>' +
                number(b?.mean ?? null, metric) +
                '</td><td class="' +
                tone(delta, metric) +
                '">' +
                signed(delta) +
                '</td>'
              );
            })
            .join('') +
          '</tr>',
      )
      .join('') +
    '</tbody></table></div></section>'
  );
}
export function annualMarkup(model: Model): string {
  const metric = model.state.metric,
    a = stats(model, model.state.city, metric, model.state.a);
  return (
    '<section class="annual panel"><div class="panel-bar"><h2>Dati annuali · ' +
    getCity(model.state.city)?.name +
    '</h2><div class="annual-actions">' +
    '<button id="copy-link">Copia link</button><button id="download-csv" ' +
    (model.dataset?.cityId === model.state.city ? '' : 'disabled') +
    '>CSV ↓</button></div></div>' +
    '<div class="table-scroll annual-scroll" tabindex="0" ' +
    'aria-label="Tabella scorrevole dei valori annuali"><table>' +
    '<thead><tr><th>Stagione</th>' +
    metrics.map((m) => '<th>' + meta[m].short + '</th>').join('') +
    '<th>Anomalia</th></tr></thead><tbody>' +
    rows(model)
      .map(
        (row) =>
          '<tr class="' +
          (row.year === selectedYear(model) ? 'selected' : '') +
          '">' +
          '<th scope="row"><button data-year="' +
          row.year +
          '">' +
          (model.state.season === 'JJA' ? row.year : yearLabel(model.state.season, row.year)) +
          '</button></th>' +
          metrics.map((m) => '<td>' + number(row[m], m, true) + '</td>').join('') +
          '<td>' +
          signed(a && row[metric] !== null ? (row[metric] as number) - a.mean : null) +
          '</td></tr>',
      )
      .join('') +
    '</tbody></table></div><p class="note">' +
    'Non applicabile indica un’esclusione dichiarata dalla vista, non un conteggio zero.' +
    '</p></section>'
  );
}
export function seasonalCsv(model: Model): string {
  const data = model.dataset?.seasons[model.state.season];
  if (!data) throw new Error('Dati di dettaglio non disponibili.');
  const headers = ['year', 'season', 'start_date', 'end_date', 'valid_days', ...metrics];
  const lines = data.years.map((row) => {
    const dates = seasonDates(model.state.season, row.year);
    return [
      row.year,
      model.state.season,
      dates[0],
      dates.at(-1),
      row.validDays,
      ...metrics.map((metric) =>
        row[metric] === null
          ? 'Non applicabile'
          : meta[metric].unit === 'giorni'
            ? String(row[metric])
            : normalizeDisplayed(row[metric] as number).toFixed(1),
      ),
    ];
  });
  return [headers, ...lines].map((line) => line.join(',')).join('\n') + '\n';
}
