import { describe, expect, it } from 'vitest';
import { parseSeasonState, searchSeasonState, seasonPresets } from '../src/lib/season-url-state';
import { periodFields } from '../src/ui/sidebar';
import { headerMarkup } from '../src/ui/header';
import { retainedHistory } from '../scripts/refresh-summary';
import { seasonalFixture } from './season-fixture';
import { requireDefined } from '../src/lib/required';

describe('anni disponibili, collegamenti e protezione dello storico', () => {
  const bounds = { firstYear: 1961, lastYear: 2025 };
  it('conserva anno e periodi recenti nell’URL usando i limiti dell’archivio', () => {
    const state = parseSeasonState('?year=2025&season=DJF&a=1961-1990&b=1996-2025', bounds);
    expect(state.year).toBe(2025);
    expect(state.b).toEqual([1996, 2025]);
    expect(parseSeasonState(searchSeasonState(state), bounds)).toEqual(state);
    expect(parseSeasonState('?year=2026', bounds).year).toBeNull();
    expect(parseSeasonState('', bounds).b).toEqual([1991, 2020]);
  });
  it('espone 65 anni, conta 2.600 stagioni e aggiorna solo i confronti recenti', () => {
    const select = periodFields('b', [1996, 2025], bounds);
    expect(select.match(/<option /g)).toHaveLength(130);
    expect(select).toContain('value="2025" selected');
    expect(headerMarkup({ theme: 'light' }, true, bounds)).toContain('2.600 stagioni');
    expect(headerMarkup({ theme: 'light' }, true, bounds)).toContain('1961—2025');
    expect(seasonPresets(bounds).decades?.b).toEqual([2016, 2025]);
    expect(seasonPresets(bounds).standard?.b).toEqual([1991, 2020]);
  });
  it('blocca una modifica alle stagioni già pubblicate o alla loro provenienza', async () => {
    const original = requireDefined((await seasonalFixture()).datasets[0]);
    expect(() => retainedHistory(original, structuredClone(original))).not.toThrow();
    const edited = structuredClone(original);
    requireDefined(edited.seasons.MAM.years[0]).precipitationMm += 1;
    expect(() => retainedHistory(original, edited)).toThrow(/storico/);
    const source = structuredClone(original);
    source.summerSource.utcOffsetSeconds = 3600;
    expect(() => retainedHistory(original, source)).toThrow(/provenienza/);
  });
});
