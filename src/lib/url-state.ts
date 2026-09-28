import { getCity } from '../data/cities';
import { isMetric, type Metric } from '../data/schema';

export type Period = [number, number];
export type UrlState = { city: string; metric: Metric; a: Period; b: Period; vs: string | null; year: number | null; smooth: boolean };
export const defaultState: UrlState = {
  city: 'roma', metric: 'meanTemperatureC', a: [1961, 1990], b: [1991, 2020], vs: null, year: null, smooth: false,
};

function parsePeriod(value: string | null, fallback: Period): Period {
  if (!value || !/^\d{4}-\d{4}$/.test(value)) return [...fallback];
  const [start, end] = value.split('-').map(Number);
  if (start === undefined || end === undefined || start < 1961 || end > 2020 || start > 2020 || end < 1961) return [...fallback];
  return start <= end ? [start, end] : [end, start];
}

export function parseUrlState(search: string): UrlState {
  const params = new URLSearchParams(search);
  const city = params.get('city');
  const metric = params.get('metric');
  const selectedCity = city && getCity(city) ? city : defaultState.city;
  const vs = params.get('vs');
  const year = Number(params.get('year'));
  return {
    city: selectedCity,
    metric: isMetric(metric) ? metric : defaultState.metric,
    a: parsePeriod(params.get('a'), defaultState.a),
    b: parsePeriod(params.get('b'), defaultState.b),
    vs: vs && getCity(vs) && vs !== selectedCity ? vs : null,
    year: params.has('year') && Number.isInteger(year) && year >= 1961 && year <= 2020 ? year : null,
    smooth: params.get('smooth') === '1',
  };
}

export function searchForState(state: UrlState): string {
  const params = new URLSearchParams({ city: state.city, metric: state.metric });
  if (state.a.join('-') !== defaultState.a.join('-')) params.set('a', state.a.join('-'));
  if (state.b.join('-') !== defaultState.b.join('-')) params.set('b', state.b.join('-'));
  if (state.vs) params.set('vs', state.vs);
  if (state.year !== null) params.set('year', String(state.year));
  if (state.smooth) params.set('smooth', '1');
  return `?${params.toString()}`;
}

export function periodWarnings(a: Period, b: Period): string[] {
  const warnings: string[] = [];
  if (a[1] >= b[0] && b[1] >= a[0]) warnings.push('I periodi si sovrappongono.');
  if (a[1] - a[0] !== b[1] - b[0]) warnings.push('I periodi hanno durate diverse.');
  if (a[1] - a[0] < 9 || b[1] - b[0] < 9) warnings.push('Almeno un periodo ha meno di 10 estati.');
  return warnings;
}

export const periodPresets: Record<string, { a: Period; b: Period }> = {
  standard: { a: [1961, 1990], b: [1991, 2020] },
  decades: { a: [1961, 1970], b: [2011, 2020] },
  twenty: { a: [1961, 1980], b: [2001, 2020] },
};
