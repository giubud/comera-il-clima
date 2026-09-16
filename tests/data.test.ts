import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cities } from '../src/data/cities';
import { assertCityDataset, type Manifest } from '../src/data/schema';

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
});

