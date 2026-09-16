import { getCity } from '../data/cities';
import { isMetric, type Metric } from '../data/schema';

export type UrlState = { city: string; metric: Metric };
export const defaultState: UrlState = { city: 'roma', metric: 'meanTemperatureC' };

export function parseUrlState(search: string): UrlState {
  const params = new URLSearchParams(search);
  const city = params.get('city');
  const metric = params.get('metric');
  return {
    city: city && getCity(city) ? city : defaultState.city,
    metric: isMetric(metric) ? metric : defaultState.metric,
  };
}

export function searchForState(state: UrlState): string {
  const params = new URLSearchParams({ city: state.city, metric: state.metric });
  return `?${params.toString()}`;
}

