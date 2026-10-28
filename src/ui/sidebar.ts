import { delta, orderedCities } from '../app/selectors';
import type { AppState } from '../app/state';
import { formatSigned } from '../lib/format';
import { requireDefined } from '../lib/required';
import { periodPresets, periodWarnings, type Period } from '../lib/url-state';
import { tone } from './display';

function periodFields(key: 'a' | 'b', period: Period): string {
  return [
    '<fieldset class="period-fields"><legend>Periodo ',
    `${key.toUpperCase()}`,
    '</legend><label>Dal <select data-range="',
    `${key}`,
    '-start" aria-label="Inizio periodo ',
    `${key.toUpperCase()}`,
    '">',
    [
      String(
        Array.from({ length: 60 }, (_, i) => 1961 + i)
          .map(
            (year) =>
              `<option value="${year}" ${year === period[0] ? 'selected' : ''}>${year}</option>`,
          )
          .join(''),
      ),
    ].join(''),
    '</select></label><label>al <select data-range="',
    `${key}`,
    '-end" aria-label="Fine periodo ',
    `${key.toUpperCase()}`,
    '">',
    [
      String(
        Array.from({ length: 60 }, (_, i) => 1961 + i)
          .map(
            (year) =>
              `<option value="${year}" ${year === period[1] ? 'selected' : ''}>${year}</option>`,
          )
          .join(''),
      ),
    ].join(''),
    '</select></label></fieldset>',
  ].join('');
}

export function sidebarMarkup(model: Readonly<AppState>): string {
  const warnings = periodWarnings(model.state.a, model.state.b);
  return [
    '<aside class="sidebar panel" aria-label="Città"><div ',
    'class="sidebar-section"><p class="eyebrow">01 / Confronto</p><h2>',
    'Scegli i periodi</h2>\n      <p class="quiet">Confronta le medie ',
    'delle estati, dal 1961 al 2020.</p>',
    `${periodFields('a', model.state.a)}`,
    `${periodFields('b', model.state.b)}`,
    '\n      <label class="preset-label">Confronti rapidi<select ',
    'id="period-preset" aria-label="Confronto rapido"><option ',
    'value="">Personalizzato</option><option value="standard" ',
    [
      String(
        model.state.a.join() === requireDefined(periodPresets.standard).a.join() &&
          model.state.b.join() === requireDefined(periodPresets.standard).b.join()
          ? 'selected'
          : '',
      ),
    ].join(''),
    '>1961–1990 / 1991–2020</option><option value="decades">Primo / ',
    'ultimo decennio</option><option value="twenty">1961–1980 / ',
    '2001–2020</option></select></label>\n      ',
    [
      String(
        warnings.length
          ? `<div class="period-warning" role="status">${warnings.join(' ')}</div>`
          : '',
      ),
    ].join(''),
    '</div>\n    <div class="sidebar-section"><div ',
    'class="section-heading"><div><p class="eyebrow">02 / Luoghi</p>',
    '<h2>Dieci città</h2></div><select id="city-sort" ',
    'aria-label="Ordina città"><option value="north" ',
    `${model.sort === 'north' ? 'selected' : ''}`,
    '>Nord → sud</option><option value="alpha" ',
    `${model.sort === 'alpha' ? 'selected' : ''}`,
    '>A → Z</option><option value="delta" ',
    `${model.sort === 'delta' ? 'selected' : ''}`,
    '>Δ maggiore</option></select></div>\n      <div class="city-list">',
    `${orderedCities(model)
      .map((city, index) =>
        [
          '<button type="button" data-city="',
          `${city.id}`,
          '" class="city-item ',
          `${model.state.city === city.id ? 'active' : ''}`,
          '" aria-pressed="',
          `${model.state.city === city.id}`,
          '"><span class="city-index">',
          `${String(index + 1).padStart(2, '0')}`,
          '</span><strong>',
          `${city.name}`,
          '</strong><span class="city-delta ',
          `${tone(delta(model, city.id, model.state.metric), model.state.metric)}`,
          '">',
          `${formatSigned(delta(model, city.id, model.state.metric))}`,
          '</span></button>',
        ].join(''),
      )
      .join('')}`,
    '</div></div></aside>',
  ].join('');
}
