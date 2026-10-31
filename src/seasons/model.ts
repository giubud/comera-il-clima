import { cities } from '../data/cities';
import type {
  CompactSeason,
  SeasonCityDataset,
  SeasonManifest,
  SeasonMetric as Metric,
  SeasonYear,
} from '../data/schema';
import { expandSeason } from '../data/season-compact';
import { notApplicable } from '../data/season-meta';
import { rangeStats, warmth } from '../lib/aggregate';
import type { SeasonState } from '../lib/season-url-state';
import type { Sort, Theme } from '../lib/theme';
export type Model = {
  state: SeasonState;
  theme: Theme;
  sort: Sort;
  manifest: SeasonManifest;
  compact: CompactSeason | null;
  dataset: SeasonCityDataset | null;
  geography: import('geojson').FeatureCollection<import('geojson').Geometry> | null;
  error: string | null;
};
const expanded = new WeakMap<CompactSeason, Map<string, SeasonYear[]>>();
export function rows(model: Model, id = model.state.city) {
  const compact = model.compact;
  const data = compact?.cities[id];
  if (!data) throw new Error('Serie stagionale non disponibile.');
  if (!compact) throw new Error('Riepilogo stagionale non disponibile.');
  let cache = expanded.get(compact);
  if (!cache) {
    cache = new Map();
    expanded.set(compact, cache);
  }
  let records = cache.get(id);
  if (!records) {
    records = expandSeason(data, compact.season);
    cache.set(id, records);
  }
  return records;
}
export function stats(model: Model, id: string, metric: Metric, period: [number, number]) {
  return notApplicable(model.state.season, metric)
    ? null
    : rangeStats(rows(model, id), metric, ...period);
}
export function difference(model: Model, id: string, metric = model.state.metric): number | null {
  const a = stats(model, id, metric, model.state.a),
    b = stats(model, id, metric, model.state.b);
  return a && b ? b.mean - a.mean : null;
}
export function orderedCities(model: Model) {
  const result = [...cities];
  if (model.sort === 'alpha') return result.sort((a, b) => a.name.localeCompare(b.name, 'it'));
  if (
    model.compact &&
    model.sort === 'delta' &&
    !notApplicable(model.state.season, model.state.metric)
  )
    return result.sort(
      (a, b) =>
        warmth(difference(model, b.id) as number, model.state.metric) -
        warmth(difference(model, a.id) as number, model.state.metric),
    );
  return result;
}
export function selectedYear(model: Model): number {
  if (model.state.year !== null) return model.state.year;
  if (notApplicable(model.state.season, model.state.metric)) return 2020;
  const data = rows(model),
    metric = model.state.metric;
  const baseline = stats(model, model.state.city, metric, model.state.a);
  if (!baseline) return 2020;
  return data.reduce((best, row) =>
    warmth((row[metric] as number) - baseline.mean, metric) >
    warmth((best[metric] as number) - baseline.mean, metric)
      ? row
      : best,
  ).year;
}
