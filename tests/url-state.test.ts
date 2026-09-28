import { describe, expect, it } from 'vitest';
import { defaultState, parseUrlState, periodWarnings, searchForState } from '../src/lib/url-state';

describe('stato URL', () => {
  it('accetta soltanto città e indicatori noti', () => {
    expect(parseUrlState('?city=milano&metric=hotDays')).toEqual({ ...defaultState, city: 'milano', metric: 'hotDays' });
    expect(parseUrlState('?city=atlantide&metric=segreto')).toEqual(defaultState);
  });

  it('serializza lo stato condivisibile', () => {
    expect(searchForState({ ...defaultState, metric: 'precipitationMm' })).toBe('?city=roma&metric=precipitationMm');
  });

  it('conserva periodi, città confronto, anno e smoothing validi', () => {
    const state = parseUrlState('?city=milano&metric=hotDays&a=1980-1961&b=2011-2020&vs=roma&year=2003&smooth=1');
    expect(state).toEqual({ city: 'milano', metric: 'hotDays', a: [1961, 1980], b: [2011, 2020], vs: 'roma', year: 2003, smooth: true });
    expect(parseUrlState('?a=1950-1990&b=1991-2040&vs=roma&year=2040')).toEqual(defaultState);
    expect(searchForState(state)).toContain('a=1961-1980');
  });

  it('segnala periodi sovrapposti, disuguali o troppo brevi', () => {
    expect(periodWarnings([1961, 1965], [1965, 2020])).toHaveLength(3);
    expect(periodWarnings([1961, 1990], [1991, 2020])).toEqual([]);
  });
});

