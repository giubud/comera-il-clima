import { cityYears, delta } from '../app/selectors';
import type { AppState } from '../app/state';
import { getCity } from '../data/cities';
import { metrics } from '../data/schema';
import { rangeStats } from '../lib/aggregate';
import { formatSigned, formatValue, metricMeta } from '../lib/format';
import { requireDefined } from '../lib/required';
import { rangeLabel, tone } from './display';

export function heroMarkup(model: Readonly<AppState>): string {
  const city = requireDefined(getCity(model.state.city));
  const primary = delta(model, city.id, model.state.metric);
  return [
    '<section class="hero panel"><div><p class="eyebrow">Osservatorio ',
    '/ Estate italiana</p><h1>',
    `${city.name}`,
    '<span> · estate</span></h1><p>Come sono cambiate le estati tra ',
    '<strong>',
    `${rangeLabel(model.state.a)}`,
    '</strong> e <strong>',
    `${rangeLabel(model.state.b)}`,
    '</strong>? Tre segnali, una storia da esplorare.</p></div>\n    ',
    '<div class="hero-number ',
    `${tone(primary, model.state.metric)}`,
    '"><span>Variazione · ',
    `${metricMeta[model.state.metric].shortLabel}`,
    '</span><strong>',
    `${formatSigned(primary)}`,
    ' <small>',
    `${metricMeta[model.state.metric].unit}`,
    '</small></strong><em>Media B meno media A</em></div></section>',
  ].join('');
}

function metricTabs(model: Readonly<AppState>): string {
  return [
    '<div class="metric-tabs" role="radiogroup" ',
    'aria-label="Indicatore">',
    `${metrics
      .map((metric) =>
        [
          '<button type="button" role="radio" aria-checked="',
          `${model.state.metric === metric}`,
          '" data-metric="',
          `${metric}`,
          '">',
          `${metricMeta[metric].shortLabel}`,
          '</button>',
        ].join(''),
      )
      .join('')}`,
    '</div>',
  ].join('');
}

export function cardsMarkup(model: Readonly<AppState>): string {
  const summers = cityYears(model, model.state.city);
  return [
    '<section class="metric-section panel" aria-label="Indicatori">',
    '<div class="panel-bar"><div><p class="eyebrow">Il confronto</p>',
    '<h2>Tre misure dell’estate</h2></div><span class="quiet">',
    `${rangeLabel(model.state.a)}`,
    ' → ',
    `${rangeLabel(model.state.b)}`,
    '</span></div>',
    `${metricTabs(model)}`,
    '\n    <div class="metric-cards">',
    `${metrics
      .map((metric) => {
        const a = rangeStats(summers, metric, ...model.state.a),
          b = rangeStats(summers, metric, ...model.state.b),
          change = b.mean - a.mean;
        return [
          '<button type="button" class="metric-card ',
          `${model.state.metric === metric ? 'selected' : ''}`,
          '" data-metric="',
          `${metric}`,
          '" aria-label="',
          `${metricMeta[metric].label}`,
          ': ',
          `${formatSigned(change)}`,
          ' ',
          `${metricMeta[metric].unit}`,
          '"><span>',
          `${metricMeta[metric].label}`,
          '</span><strong class="',
          `${tone(change, metric)}`,
          '">',
          `${formatSigned(change)}`,
          ' <small>',
          `${metricMeta[metric].unit}`,
          '</small></strong><span class="metric-periods">A ',
          `${formatValue(a.mean)}`,
          ' <i>→</i> B ',
          `${formatValue(b.mean)}`,
          '</span><small>σ periodo A: ',
          `${formatValue(a.sd)}`,
          ' · ',
          `${Math.abs(change) > a.sd ? 'oltre' : 'entro'}`,
          ' 1 σ</small></button>',
        ].join('');
      })
      .join('')}`,
    '</div></section>',
  ].join('');
}
