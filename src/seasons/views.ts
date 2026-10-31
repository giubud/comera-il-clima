import type { Model } from './model';
import { difference, orderedCities, stats } from './model';
import { meta, signed, number, tone, escapeHtml } from './format';
import { metrics, notApplicable, seasons, seasonLabels, seasonMonths } from '../data/season-meta';
import { headerMarkup } from '../ui/header';
import { periodFields } from '../ui/sidebar';
import { periodWarnings } from '../lib/url-state';
import { getCity } from '../data/cities';
import { yearMarkup, annualMarkup, comparisonMarkup } from './tables';
import { plotsMarkup } from './plots';
import { mapMarkup } from './map';
import { legalMarkup } from '../ui/legal';

function sidebar(model: Model): string {
  return (
    '<aside class="sidebar panel" aria-label="Città"><div class="sidebar-section">' +
    '<label class="preset-label">Stagione<select id="season-select" aria-label="Stagione">' +
    seasons
      .map(
        (s) =>
          '<option value="' +
          s +
          '" ' +
          (s === model.state.season ? 'selected' : '') +
          '>' +
          seasonLabels[s] +
          ' · ' +
          seasonMonths[s] +
          '</option>',
      )
      .join('') +
    '</select></label>' +
    '<h2>Scegli i periodi</h2><p class="quiet">Dal 1961 al 2020. ' +
    'L’inverno è assegnato all’anno in cui termina.</p>' +
    periodFields('a', model.state.a) +
    periodFields('b', model.state.b) +
    '<label class="preset-label">Confronti rapidi<select id="period-preset" ' +
    'aria-label="Confronto rapido"><option value="">Personalizzato</option>' +
    '<option value="standard">1961–1990 / 1991–2020</option>' +
    '<option value="decades">Primo / ultimo decennio</option>' +
    '<option value="twenty">1961–1980 / 2001–2020</option></select></label>' +
    periodWarnings(model.state.a, model.state.b)
      .map(
        (w) =>
          '<p class="period-warning" role="status">' + w.replaceAll('estati', 'stagioni') + '</p>',
      )
      .join('') +
    '</div><div class="sidebar-section"><h2>Dieci città</h2>' +
    '<label class="preset-label">Ordina città<select id="city-sort" aria-label="Ordina città">' +
    [
      ['north', 'Nord → sud'],
      ['alpha', 'A → Z'],
      ['delta', 'Δ maggiore'],
    ]
      .map(
        ([value, label]) =>
          '<option value="' +
          value +
          '" ' +
          (model.sort === value ? 'selected' : '') +
          '>' +
          label +
          '</option>',
      )
      .join('') +
    '</select></label><div class="city-list">' +
    orderedCities(model)
      .map((city) => {
        const delta = model.compact ? difference(model, city.id) : null;
        return (
          '<button class="city-item ' +
          (model.state.city === city.id ? 'active' : '') +
          '" data-city="' +
          city.id +
          '" aria-pressed="' +
          (model.state.city === city.id) +
          '"><strong>' +
          city.name +
          '</strong><span class="city-delta ' +
          tone(delta, model.state.metric) +
          '">' +
          (model.compact ? signed(delta) : '—') +
          '</span></button>'
        );
      })
      .join('') +
    '</div></div></aside>'
  );
}
function overview(model: Model): string {
  const metric = model.state.metric,
    change = difference(model, model.state.city);
  return (
    '<section class="hero panel"><div><p class="eyebrow">Osservatorio stagionale</p><h1>' +
    getCity(model.state.city)?.name +
    '<span> · ' +
    seasonLabels[model.state.season].toLowerCase() +
    '</span></h1><p>Medie ' +
    model.state.a.join('–') +
    ' e ' +
    model.state.b.join('–') +
    ' · ' +
    seasonMonths[model.state.season] +
    '</p></div><div class="hero-number ' +
    tone(change, metric) +
    '"><span>Variazione · ' +
    meta[metric].short +
    '</span><strong>' +
    signed(change) +
    (change === null ? '' : ' <small>' + meta[metric].unit + '</small>') +
    '</strong><em>Media B meno media A</em></div></section>' +
    '<section class="metric-section panel"><div class="panel-bar"><h2>' +
    'Cinque misure della stagione</h2></div><div class="metric-tabs" role="radiogroup" ' +
    'aria-label="Indicatore">' +
    metrics
      .map(
        (m) =>
          '<button role="radio" data-metric="' +
          m +
          '" aria-checked="' +
          (m === metric) +
          '">' +
          meta[m].short +
          '</button>',
      )
      .join('') +
    '</div><div class="metric-cards">' +
    metrics
      .map((m) => {
        const a = stats(model, model.state.city, m, model.state.a);
        const b = stats(model, model.state.city, m, model.state.b);
        const delta = a && b ? b.mean - a.mean : null;
        return (
          '<button class="metric-card ' +
          (m === metric ? 'selected' : '') +
          '" data-metric="' +
          m +
          '"><span>' +
          meta[m].label +
          '</span><strong class="' +
          tone(delta, m) +
          '">' +
          signed(delta) +
          (delta === null ? '' : ' <small>' + meta[m].unit + '</small>') +
          '</strong><span class="metric-periods">A ' +
          number(a?.mean ?? null, m) +
          ' → B ' +
          number(b?.mean ?? null, m) +
          '</span><small>' +
          (a ? 'σ periodo A: ' + number(a.sd, m) : notApplicable(model.state.season, m)) +
          '</small></button>'
        );
      })
      .join('') +
    '</div></section>'
  );
}
export function pageMarkup(model: Model): string {
  let main: string;
  if (!model.compact) {
    main =
      '<section class="panel initial-status" role="' +
      (model.error ? 'alert' : 'status') +
      '">' +
      (model.error
        ? escapeHtml(model.error) + ' <button id="retry">Riprova</button>'
        : 'Caricamento dei dati stagionali…') +
      '</section>';
  } else {
    const reason = notApplicable(model.state.season, model.state.metric);
    main =
      overview(model) +
      (model.error
        ? '<p role="alert">' + escapeHtml(model.error) + ' <button id="retry">Riprova</button></p>'
        : '') +
      (reason
        ? '<section class="panel unavailable-note" role="status"><h2>Non applicabile</h2><p>' +
          reason +
          '</p><p>Scegli un altro indicatore per vedere grafici e mappa.</p></section>'
        : '<div class="visual-grid">' +
          mapMarkup(model) +
          plotsMarkup(model, true) +
          '</div>' +
          plotsMarkup(model, false)) +
      yearMarkup(model);
  }
  return (
    headerMarkup(model, true) +
    '<main id="console" class="season-console">' +
    '<div class="intro"><span class="eyebrow">La memoria delle stagioni</span>' +
    '<p>Dieci città · quattro stagioni meteorologiche · cinque indicatori · 1961–2020.</p></div>' +
    '<div class="dashboard-grid">' +
    sidebar(model) +
    '<div class="main-column">' +
    main +
    '</div></div>' +
    (model.compact ? comparisonMarkup(model) + annualMarkup(model) : '') +
    legalMarkup(true) +
    '</main><footer class="site-footer"><span>Com’era il clima</span>' +
    '<a href="https://github.com/giubud/comera-il-clima/blob/main/DATA_LICENSE.md">' +
    'Licenze, crediti e avvertenze</a></footer>'
  );
}
