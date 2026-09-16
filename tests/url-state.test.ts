import { describe, expect, it } from 'vitest';
import { parseUrlState, searchForState } from '../src/lib/url-state';

describe('stato URL', () => {
  it('accetta soltanto città e indicatori noti', () => {
    expect(parseUrlState('?city=milano&metric=hotDays')).toEqual({ city: 'milano', metric: 'hotDays' });
    expect(parseUrlState('?city=atlantide&metric=segreto')).toEqual({ city: 'roma', metric: 'meanTemperatureC' });
  });

  it('serializza lo stato condivisibile', () => {
    expect(searchForState({ city: 'roma', metric: 'precipitationMm' })).toBe('?city=roma&metric=precipitationMm');
  });
});

