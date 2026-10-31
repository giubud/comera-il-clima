import { describe, expect, it } from 'vitest';
import { annualDates, seasonDates } from '../src/data/calendar';
import { aggregateYear } from '../src/lib/season-aggregate';
import { parseSeasonState, searchSeasonState } from '../src/lib/season-url-state';
import { notApplicable, yearLabel } from '../src/data/season-meta';
import { warmth, rangeStats } from '../src/lib/aggregate';
import { quotaDelay } from '../scripts/fetch-quota';
import { quotaWeight, seasonRequestUrl } from '../scripts/season-source';
import type { DailyYearResponse } from '../src/data/schema';

function daily(year: number): DailyYearResponse {
  const time = annualDates(year);
  return {
    latitude: 42,
    longitude: 12.5,
    elevation: 58,
    timezone: 'Europe/Rome',
    utc_offset_seconds: 3600,
    daily_units: {
      time: 'iso8601',
      temperature_2m_mean: '°C',
      temperature_2m_max: '°C',
      temperature_2m_min: '°C',
      precipitation_sum: 'mm',
    },
    daily: {
      time,
      temperature_2m_mean: Array(time.length).fill(20) as number[],
      temperature_2m_max: Array(time.length).fill(30) as number[],
      temperature_2m_min: Array(time.length).fill(0) as number[],
      precipitation_sum: Array(time.length).fill(19.9) as number[],
    },
  };
}
describe('stagioni meteorologiche', () => {
  it('assegna dicembre all’inverno che termina l’anno successivo', () => {
    expect(seasonDates('DJF', 1961)[0]).toBe('1960-12-01');
    expect(seasonDates('DJF', 1961).at(-1)).toBe('1961-02-28');
    expect(yearLabel('DJF', 1961)).toBe('Inverno 1960/61');
    expect(seasonDates('DJF', 2000)).toHaveLength(91);
    expect(seasonDates('DJF', 2020)).toContain('2020-02-29');
    expect(seasonDates('JJA', 2000)).toHaveLength(92);
    expect(seasonDates('MAM', 2000)).toHaveLength(92);
    expect(seasonDates('SON', 2000)).toHaveLength(91);
    expect(annualDates(2000)).toHaveLength(366);
  });
  it('applica <0, >30 e ≥20 senza confondere zero e non applicabile', () => {
    const source = daily(1961);
    source.daily.temperature_2m_min[0] = -0.1;
    source.daily.precipitation_sum[0] = 20;
    const june = source.daily.time.indexOf('1961-06-01');
    source.daily.temperature_2m_max[june] = 30.1;
    const seasons = aggregateYear(source, 1961);
    expect(seasons.DJF.frostDays).toBe(1);
    expect(seasons.DJF.hotDays).toBeNull();
    expect(seasons.DJF.heavyPrecipitationDays).toBe(1);
    expect(seasons.MAM.frostDays).toBe(0);
    expect(seasons.MAM.heavyPrecipitationDays).toBe(0);
    expect(seasons.JJA.hotDays).toBe(1);
    expect(seasons.JJA.frostDays).toBeNull();
    expect(seasons.JJA.meanTemperatureC).toBe(20);
    expect(notApplicable('JJA', 'frostDays')).toBeTruthy();
    expect(() => rangeStats([seasons.DJF], 'hotDays', 1961, 1961)).toThrow();
  });
  it.each(['missing', 'duplicate', 'null', 'minimum', 'negative', 'unit', 'offset'])(
    'rifiuta una fonte annuale non valida: %s',
    (problem) => {
      const source = daily(2000);
      if (problem === 'missing') source.daily.time.pop();
      if (problem === 'duplicate') source.daily.time[1] = source.daily.time[0];
      if (problem === 'null') source.daily.temperature_2m_min[0] = null;
      if (problem === 'minimum') source.daily.temperature_2m_min[0] = 21;
      if (problem === 'negative') source.daily.precipitation_sum[0] = -1;
      if (problem === 'unit') source.daily_units.temperature_2m_min = '°F';
      if (problem === 'offset') source.utc_offset_seconds = 0;
      expect(() => aggregateYear(source, 2000)).toThrow();
    },
  );
  it('mantiene i vecchi link estivi e conserva stagione e indicatore nei nuovi URL', () => {
    expect(parseSeasonState('?city=roma&metric=hotDays').season).toBe('JJA');
    const state = parseSeasonState('?city=milano&season=DJF&metric=frostDays&year=2000');
    expect(parseSeasonState(searchSeasonState(state))).toEqual(state);
    expect(state.metric).toBe('frostDays');
    expect(parseSeasonState('?season=unknown').season).toBe('JJA');
    expect(parseSeasonState('?season=DJF&metric=hotDays').metric).toBe('hotDays');
    expect(warmth(-2, 'frostDays')).toBe(2);
    expect(warmth(2, 'heavyPrecipitationDays')).toBe(-2);
  });
  it('richiede l’intervallo dicembre–novembre con la minima giornaliera', () => {
    const url = new URL(seasonRequestUrl(42, 12, 1961));
    expect(url.searchParams.get('start_date')).toBe('1960-12-01');
    expect(url.searchParams.get('end_date')).toBe('1961-11-30');
    expect(url.searchParams.get('daily')).toContain('temperature_2m_min');
    expect(quotaWeight(2000)).toBeGreaterThan(quotaWeight(1961));
  });
  it('rallenta tra le richieste e rispetta i budget minuto, ora e 24 ore', () => {
    const now = 100_000_000;
    expect(quotaDelay([], 27, now)).toBe(0);
    expect(quotaDelay([{ at: now - 1000, weight: 27 }], 27, now)).toBe(29_000);
    for (const [count, oldest, spacing] of [
      [21, 59_000, 1000],
      [175, 3_500_000, 19_000],
      [345, 86_000_000, 200_000],
    ] as const) {
      const events = Array.from({ length: count }, (_, index) => ({
        at: now - oldest + index * spacing,
        weight: 26.1,
      }));
      expect(quotaDelay(events, 27, now)).toBeGreaterThan(0);
    }
  });
});
