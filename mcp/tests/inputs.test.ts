import { describe, expect, it } from 'vitest';
import { compareInput, listInput, rankInput, seasonInput } from '../src/inputs';

describe('input MCP validati con Zod', () => {
  it('accetta solo un oggetto vuoto per list_cities', () => {
    expect(listInput.parse({})).toEqual({});
    expect(listInput.safeParse({ city_id: 'roma' }).success).toBe(false);
  });

  it.each([
    { city_id: 'atlantide', season: 'JJA', year: 2003 },
    { city_id: '../roma', season: 'JJA', year: 2003 },
    { city_id: 'roma', season: 'summer', year: 2003 },
    { city_id: 'roma', season: 'JJA', year: '2003' },
    { city_id: 'roma', season: 'JJA', year: 2003.5 },
    { city_id: 'roma', season: 'JJA', year: 1960 },
    { city_id: 'roma', season: 'JJA', year: 2003, url: 'https://example.com' },
  ])('rifiuta parametri errati e campi aggiuntivi: %j', (input) => {
    expect(seasonInput.safeParse(input).success).toBe(false);
  });

  it('rifiuta un intervallo invertito', () => {
    expect(
      compareInput.safeParse({
        city_id: 'roma',
        season: 'JJA',
        period_a: { start_year: 1990, end_year: 1961 },
        period_b: { start_year: 1991, end_year: 2020 },
      }).success,
    ).toBe(false);
  });

  it('definisce i default e rifiuta limiti o indicatori errati', () => {
    const input = {
      city_id: 'palermo',
      season: 'SON',
      metric: 'precipitationMm',
      period: { start_year: 1961, end_year: 2025 },
    };
    expect(rankInput.parse(input).order).toBe('desc');
    for (const extra of [{ limit: 0 }, { limit: 2.5 }, { metric: 'tropicalNights' }]) {
      expect(rankInput.safeParse({ ...input, ...extra }).success).toBe(false);
    }
  });
});
