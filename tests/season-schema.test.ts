import { describe, it, expect } from 'vitest';
import { seasonalFixture } from './season-fixture';
import { assertSeasonCity, assertSeasonManifest, assertSeasonCompact } from '../src/data/schema';
import { cities } from '../src/data/cities';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { validateSeasonFolder } from '../scripts/season-validation';
describe('schema stagionale 2', () => {
  it('valida l’intero archivio di prova con hash, fonti e regressione estiva', async () => {
    const fixture = await seasonalFixture();
    const root = await mkdtemp(join(tmpdir(), 'comera-seasons-test-'));
    try {
      await mkdir(join(root, 'seasons'));
      for (const [file, body] of Object.entries(fixture.files)) {
        await writeFile(join(root, file), body);
      }
      await expect(validateSeasonFolder(root)).resolves.toBeUndefined();
    } finally {
      await rm(root, { recursive: true, force: true });
    }
  });
  it('valida tutte le stagioni e distingue le esclusioni da valori mancanti', async () => {
    const fixture = await seasonalFixture();
    assertSeasonManifest(
      fixture.manifest,
      cities.map((c) => c.id),
    );
    for (const dataset of fixture.datasets) assertSeasonCity(dataset);
    for (const season of ['DJF', 'MAM', 'JJA', 'SON']) {
      const compact: unknown = JSON.parse(fixture.files['seasons/' + season + '.json'] ?? 'null');
      assertSeasonCompact(
        compact,
        cities.map((c) => c.id),
      );
    }
    const data = structuredClone(fixture.datasets[0]);
    if (!data) throw new Error('Missing fixture');
    const row = data.seasons.JJA.years[0];
    if (!row) throw new Error('Missing year');
    row.frostDays = 0;
    expect(() => assertSeasonCity(data)).toThrow(/null/);
    row.frostDays = null;
    row.heavyPrecipitationDays = null;
    expect(() => assertSeasonCity(data)).toThrow(/mancante/);
  });
  it('rifiuta calendario, versione, città mancanti, valori e soglie incoerenti', async () => {
    const { datasets, manifest } = await seasonalFixture();
    const data = structuredClone(datasets[0]);
    if (!data) throw new Error('Missing fixture');
    const row = data.seasons.DJF.years[0];
    if (!row) throw new Error('Missing year');
    row.validDays = 92;
    expect(() => assertSeasonCity(data)).toThrow(/Calendario/);
    expect(() => assertSeasonCity({ ...data, schemaVersion: 3 })).toThrow();
    expect(() =>
      assertSeasonManifest(
        { ...manifest, thresholds: { ...manifest.thresholds, frostDays: 1 } },
        cities.map((c) => c.id),
      ),
    ).toThrow(/Soglie/);
    expect(() =>
      assertSeasonManifest(
        { ...manifest, cities: manifest.cities.slice(1) },
        cities.map((c) => c.id),
      ),
    ).toThrow();
  });
});
