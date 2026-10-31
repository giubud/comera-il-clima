import { requireDefined } from '../src/lib/required';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { cities } from '../src/data/cities';
import {
  assertCityDataset,
  assertSeasonCity,
  assertSeasonCompact,
  assertSummers,
  type AnyManifest,
  type SeasonCityDataset,
} from '../src/data/schema';
import { compactSummers } from '../src/data/compact';
import { compactSeason } from '../src/data/season-compact';
import { seasons } from '../src/data/season-meta';
describe('dati pubblicati', () => {
  it('contiene dieci città complete e file con hash coerenti', async () => {
    const root = join(process.cwd(), 'public', 'data');
    const manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8')) as AnyManifest;
    expect(manifest.cities.map(({ id }) => id)).toEqual(cities.map(({ id }) => id));
    for (const city of manifest.cities) {
      const raw = await readFile(join(root, city.file), 'utf8');
      expect(createHash('sha256').update(raw).digest('hex')).toBe(city.sha256);
      const dataset: unknown = JSON.parse(raw);
      if (manifest.schemaVersion === 1) {
        assertCityDataset(dataset);
        expect(dataset.years).toHaveLength(60);
        expect(dataset.years[0]?.year).toBe(1961);
        expect(dataset.years[59]?.year).toBe(2020);
      } else {
        assertSeasonCity(dataset);
        for (const season of seasons) expect(dataset.seasons[season].years).toHaveLength(60);
      }
    }
  });
  it('i riepiloghi compatti coincidono con tutti i record originali', async () => {
    const root = join(process.cwd(), 'public', 'data');
    const manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8')) as {
      schemaVersion: number;
    };
    const datasets = await Promise.all(
      cities.map(
        async ({ id }) => JSON.parse(await readFile(join(root, id + '.json'), 'utf8')) as unknown,
      ),
    );
    if (manifest.schemaVersion === 1) {
      const value: unknown = JSON.parse(await readFile(join(root, 'summers.json'), 'utf8'));
      assertSummers(
        value,
        cities.map(({ id }) => id),
      );
      const legacy = datasets.map((data) => {
        assertCityDataset(data);
        return data;
      });
      expect(value).toEqual(compactSummers(legacy));
      expect(() =>
        assertSummers(
          {
            ...value,
            cities: { ...value.cities, roma: requireDefined(value.cities.roma).slice(1) },
          },
          cities.map(({ id }) => id),
        ),
      ).toThrow();
    } else {
      const seasonal: SeasonCityDataset[] = datasets.map((data) => {
        assertSeasonCity(data);
        return data;
      });
      for (const season of seasons) {
        const value: unknown = JSON.parse(
          await readFile(join(root, 'seasons', season + '.json'), 'utf8'),
        );
        assertSeasonCompact(
          value,
          cities.map((c) => c.id),
        );
        expect(value).toEqual(compactSeason(seasonal, season));
      }
    }
  });
});
