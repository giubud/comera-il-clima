import { isLegacyMetric as isMetric } from '../data/legacy';
import { isSeason, isMetric as isSeasonMetric } from '../data/season-meta';
import type { Season, SeasonMetric } from '../data/schema';
import { parseUrlState, searchForState, type UrlState } from './url-state';
export type SeasonState = Omit<UrlState, 'metric'> & { metric: SeasonMetric; season: Season };
export function parseSeasonState(search: string): SeasonState {
  const params = new URLSearchParams(search),
    base = parseUrlState(search);
  const season = params.get('season'),
    metric = params.get('metric');
  return {
    ...base,
    season: isSeason(season) ? season : 'JJA',
    metric: isSeasonMetric(metric) ? metric : 'meanTemperatureC',
  };
}
export function searchSeasonState(state: SeasonState): string {
  const params = new URLSearchParams(
    searchForState({
      ...state,
      metric: isMetric(state.metric) ? state.metric : 'meanTemperatureC',
    }),
  );
  params.set('metric', state.metric);
  if (state.season !== 'JJA') params.set('season', state.season);
  return '?' + params.toString();
}
