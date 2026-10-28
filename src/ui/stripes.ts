import { cityYears, selectedYear } from '../app/selectors';
import type { AppState } from '../app/state';
import { type Summer } from '../data/schema';
import { rangeStats, warmth, zLevel } from '../lib/aggregate';
import { formatSigned, normalizeDisplayed } from '../lib/format';
import { valueWithUnit } from './display';

function stripeLabel(model: Readonly<AppState>, summer: Summer, mean: number, sd: number): string {
  if (sd === 0) {
    return `Estate ${summer.year}: scostamento in σ non definito; periodo A senza variabilità`;
  }
  const z = warmth(summer[model.state.metric] - mean, model.state.metric) / sd;
  const displayed = normalizeDisplayed(z);
  let direction = 'nella media A alla precisione mostrata';
  if (displayed !== 0) {
    const positive = displayed > 0;
    if (model.state.metric === 'precipitationMm') {
      direction = `${positive ? 'più secco' : 'più piovoso'} della media A`;
    } else if (model.state.metric === 'hotDays') {
      direction = `${positive ? 'più' : 'meno'} giorni sopra 30 °C della media A`;
    } else {
      direction = `${positive ? 'più caldo' : 'più fresco'} della media A`;
    }
  }
  return `Estate ${summer.year}: ${formatSigned(z)} σ, ${direction}`;
}

export function stripesMarkup(model: Readonly<AppState>): string {
  const summers = cityYears(model, model.state.city),
    baseline = rangeStats(summers, model.state.metric, ...model.state.a);
  return [
    '<section class="stripes-panel panel" ',
    'aria-labelledby="stripes-heading"><div class="panel-bar"><div><p ',
    'class="eyebrow">Anomalie</p><h2 id="stripes-heading">Ogni ',
    'estate, un segno</h2></div><span class="quiet">Rispetto alla ',
    'media A · σ campionaria</span></div>\n    <div class="stripes" ',
    'role="group" aria-label="Anomalie annuali">',
    `${summers
      .map((summer) => {
        const level = zLevel(
          warmth(summer[model.state.metric], model.state.metric),
          warmth(baseline.mean, model.state.metric),
          baseline.sd,
        );
        return [
          '<button type="button" data-year="',
          `${summer.year}`,
          '"\n        class="stripe z',
          `${level}`,
          ' ',
          `${selectedYear(model) === summer.year ? 'active' : ''}`,
          '"\n        title="',
          `${summer.year}`,
          ': ',
          `${valueWithUnit(summer[model.state.metric], model.state.metric)}`,
          '"\n        aria-label="',
          `${stripeLabel(model, summer, baseline.mean, baseline.sd)}`,
          '"></button>',
        ].join('');
      })
      .join('')}`,
    '</div>\n    <div class="stripe-labels"><span>1961</span><span>',
    '1970</span><span>1980</span><span>1990</span>\n      <span>',
    '2000</span><span>2010</span><span>2020</span></div>\n    <p ',
    'class="note">Blu = più fresco o più piovoso · rosso = più caldo ',
    'o più secco.\n      Il colore indica lo scarto dalla media del ',
    'periodo A, in deviazioni standard.\n      Per le precipitazioni ',
    'il segno in σ è invertito: positivo = più secco.</p></section>',
  ].join('');
}
