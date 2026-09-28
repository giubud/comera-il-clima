import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cities } from '../src/data/cities';
import { assertCityDataset, assertSummers, type Manifest } from '../src/data/schema';
import { compactSummers } from '../src/data/compact';

describe('dati pubblicati', () => {
  it('contiene dieci città complete e file con hash coerenti', async () => {
    const root = join(process.cwd(), 'public', 'data');
    const manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8')) as Manifest;
    expect(manifest.cities.map(({ id }) => id)).toEqual(cities.map(({ id }) => id));
    for (const city of manifest.cities) {
      const raw = await readFile(join(root, city.file), 'utf8');
      expect(createHash('sha256').update(raw).digest('hex')).toBe(city.sha256);
      const dataset: unknown = JSON.parse(raw);
      assertCityDataset(dataset);
      expect(dataset.years).toHaveLength(60);
      expect(dataset.years[0]?.year).toBe(1961);
      expect(dataset.years[59]?.year).toBe(2020);
    }
  });

  it('il riepilogo compatto coincide con tutti i 600 record originali', async () => {
    const root = join(process.cwd(), 'public', 'data');
    const value: unknown = JSON.parse(await readFile(join(root, 'summers.json'), 'utf8'));
    assertSummers(value, cities.map(({ id }) => id));
    const datasets = await Promise.all(cities.map(async ({ id }) => JSON.parse(await readFile(join(root, `${id}.json`), 'utf8'))));
    expect(value).toEqual(compactSummers(datasets));
    expect(() => assertSummers({ ...value, cities: { ...value.cities, roma: value.cities.roma!.slice(1) } }, cities.map(({ id }) => id))).toThrow();
  });
});

