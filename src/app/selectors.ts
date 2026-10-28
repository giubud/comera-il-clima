import { cities } from '../data/cities';
import { expandSummers } from '../data/compact';
import { type Metric, type Summer } from '../data/schema';
import { rangeStats, warmth } from '../lib/aggregate';
import { requireDefined } from '../lib/required';
import type { AppState } from './state';

export const cityYears = (model: Readonly<AppState>, id: string): Summer[] =>
  expandSummers(requireDefined(requireDefined(model.compact).cities[id]));

export const delta = (model: Readonly<AppState>, id: string, metric: Metric): number =>
  rangeStats(cityYears(model, id), metric, ...model.state.b).mean -
  rangeStats(cityYears(model, id), metric, ...model.state.a).mean;

export function selectedYear(model: Readonly<AppState>): number {
  if (model.state.year !== null) return model.state.year;
  const summers = cityYears(model, model.state.city);
  const baseline = rangeStats(summers, model.state.metric, ...model.state.a).mean;
  return summers.reduce((best, row) =>
    warmth(row[model.state.metric] - baseline, model.state.metric) >
    warmth(best[model.state.metric] - baseline, model.state.metric)
      ? row
      : best,
  ).year;
}

export function orderedCities(model: Readonly<AppState>): (typeof cities)[number][] {
  const items = [...cities];
  if (model.sort === 'alpha') return items.sort((a, b) => a.name.localeCompare(b.name, 'it'));
  if (model.sort === 'delta')
    return items.sort(
      (a, b) =>
        warmth(delta(model, b.id, model.state.metric), model.state.metric) -
        warmth(delta(model, a.id, model.state.metric), model.state.metric),
    );
  return items;
}
