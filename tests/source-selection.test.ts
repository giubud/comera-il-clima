import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { assertCityDataset } from '../src/data/schema';
import {
  matchesSourceSelection, requestUrl, sourceSelection,
} from '../scripts/open-meteo';

describe('provenienza della selezione ERA5', () => {
  it('riconosce il metodo dichiarato nei dati pubblicati', async () => {
    const value: unknown = JSON.parse(await readFile('public/data/roma.json', 'utf8'));
    assertCityDataset(value);
    for (const request of value.source.requests) {
      expect(matchesSourceSelection(new URL(request.url), value.source)).toBe(true);
    }
    expect(() => assertCityDataset({
      ...value,
      source: { ...value.source, cellSelection: 'land', elevationCorrection: 'disabled' },
    })).toThrow(/quota incoerenti/);
  });

  it('rifiuta la cache nearest presentata come land e land con quota disabilitata', () => {
    const url = new URL(requestUrl(40.8518, 14.2681, 2020));
    expect(matchesSourceSelection(url, sourceSelection)).toBe(true);
    url.searchParams.set('cell_selection', 'nearest');
    url.searchParams.set('elevation', 'nan');
    expect(matchesSourceSelection(url, sourceSelection)).toBe(false);
    url.searchParams.set('cell_selection', 'land');
    expect(matchesSourceSelection(url, sourceSelection)).toBe(false);
  });

  it('rifiuta un altro modello, una quota esplicita o un altro servizio', () => {
    const url = new URL(requestUrl(40.8518, 14.2681, 2020));
    url.searchParams.set('models', 'era5_land');
    expect(matchesSourceSelection(url, sourceSelection)).toBe(false);
    url.searchParams.set('models', 'era5');
    url.searchParams.set('elevation', '19');
    expect(matchesSourceSelection(url, sourceSelection)).toBe(false);
    url.searchParams.delete('elevation');
    url.hostname = 'example.com';
    expect(matchesSourceSelection(url, sourceSelection)).toBe(false);
  });
});
