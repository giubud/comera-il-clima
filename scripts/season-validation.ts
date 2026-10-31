import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cities } from '../src/data/cities';
import { assertSeasonCity, assertSeasonManifest, assertSeasonCompact } from '../src/data/schema';
import type { SeasonCityDataset } from '../src/data/schema';
import { compactSeason } from '../src/data/season-compact';
import { metrics, seasons } from '../src/data/season-meta';
import { summarizeSeason } from '../src/lib/season-aggregate';
import { seasonRequestUrl } from './season-source';
import { requestUrl } from './open-meteo';
import { assertSummerDataset } from './summer-baseline';
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
export async function validateSeasonFolder(root: string): Promise<void> {
  const value: unknown = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8'));
  assertSeasonManifest(
    value,
    cities.map((c) => c.id),
  );
  const datasets: SeasonCityDataset[] = [];
  for (const [index, entry] of value.cities.entries()) {
    const city = cities[index];
    if (!city) throw new Error('Città inattesa.');
    const raw = await readFile(join(root, entry.file), 'utf8');
    if (hash(raw) !== entry.sha256) throw new Error('Impronta del dataset errata.');
    const dataset: unknown = JSON.parse(raw);
    assertSeasonCity(dataset);
    if (dataset.cityId !== city.id) throw new Error('Città errata nel dataset.');
    const first = datasets[0];
    if (
      first &&
      (first.source.utcOffsetSeconds !== dataset.source.utcOffsetSeconds ||
        first.summerSource.utcOffsetSeconds !== dataset.summerSource.utcOffsetSeconds)
    )
      throw new Error('Scarti UTC diversi fra le città.');
    for (const [source, summer] of [
      [dataset.source, false],
      [dataset.summerSource, true],
    ] as const) {
      if (
        source.requestedCoordinates.latitude !== city.latitude ||
        source.requestedCoordinates.longitude !== city.longitude
      )
        throw new Error('Coordinate richieste inattese.');
      for (const [i, request] of source.requests.entries()) {
        const year = 1961 + i;
        const expected = summer
          ? requestUrl(city.latitude, city.longitude, year)
          : seasonRequestUrl(city.latitude, city.longitude, year);
        if (
          request.url !== expected ||
          !/^[a-f0-9]{64}$/.test(request.sha256) ||
          !Number.isFinite(Date.parse(request.retrievedAt))
        )
          throw new Error('Fonte non valida.');
      }
    }
    for (const season of seasons) {
      const record = dataset.seasons[season];
      for (const [key, from] of [
        ['a', 1961],
        ['b', 1991],
      ] as const) {
        const expected = summarizeSeason(record.years, season, from, from + 29);
        for (const metric of metrics) {
          if (
            record.periods[key][metric] !== expected[metric] ||
            entry.seasons[season][key][metric] !== expected[metric]
          )
            throw new Error(`Riepilogo non valido: ${city.id}/${season}/${metric}.`);
        }
      }
    }
    await assertSummerDataset(dataset);
    datasets.push(dataset);
  }
  for (const season of seasons) {
    const summary: unknown = JSON.parse(
      await readFile(join(root, 'seasons', season + '.json'), 'utf8'),
    );
    assertSeasonCompact(
      summary,
      cities.map((c) => c.id),
    );
    if (
      summary.season !== season ||
      JSON.stringify(summary) !== JSON.stringify(compactSeason(datasets, season))
    )
      throw new Error('Riepilogo compatto incoerente.');
  }
  const logical = datasets.map(({ cityId, seasons: records }) => ({ cityId, seasons: records }));
  if (value.dataVersion !== hash(JSON.stringify(logical)).slice(0, 16))
    throw new Error('Versione logica incoerente.');
}
