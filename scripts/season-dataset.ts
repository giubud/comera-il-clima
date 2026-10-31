import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cities } from '../src/data/cities';
import type { DailyYearResponse, SeasonCityDataset, SeasonSource } from '../src/data/schema';
import { aggregateYear, summarizeSeason } from '../src/lib/season-aggregate';
import { seasons } from '../src/data/season-meta';
import { requireDefined } from '../src/lib/required';
import { seasonCacheRoot, seasonRequestUrl } from './season-source';
import { originalSummer } from './summer-source';
import { sourceSelection } from './open-meteo';
import { assertSummerDataset } from './summer-baseline';
type CachedYear = { url: string; retrievedAt: string; sha256: string; response: DailyYearResponse };
type SourceItem = Omit<CachedYear, 'response'> & {
  response: Pick<
    DailyYearResponse,
    'latitude' | 'longitude' | 'elevation' | 'timezone' | 'utc_offset_seconds'
  >;
};
export function sourceFor(
  city: (typeof cities)[number],
  items: readonly SourceItem[],
): SeasonSource {
  const first = requireDefined(items[0]).response;
  for (const { response: r } of items) {
    if (
      r.latitude !== first.latitude ||
      r.longitude !== first.longitude ||
      r.elevation !== first.elevation ||
      r.timezone !== first.timezone ||
      r.utc_offset_seconds !== first.utc_offset_seconds
    )
      throw new Error(`Coordinate, quota o scarto UTC incoerenti: ${city.id}.`);
  }
  return {
    provider: 'Open-Meteo',
    model: 'era5',
    timezone: 'Europe/Rome',
    ...sourceSelection,
    requestedCoordinates: { latitude: city.latitude, longitude: city.longitude },
    returnedCoordinates: { latitude: first.latitude, longitude: first.longitude },
    elevationM: first.elevation,
    utcOffsetSeconds: first.utc_offset_seconds,
    requests: items.map(({ url, retrievedAt, sha256 }) => ({ url, retrievedAt, sha256 })),
  };
}
export async function datasetForCity(city: (typeof cities)[number]): Promise<SeasonCityDataset> {
  const annualItems: CachedYear[] = [];
  const summerItems: SourceItem[] = [];
  const records: Record<(typeof seasons)[number], import('../src/data/schema').SeasonYear[]> = {
    DJF: [],
    MAM: [],
    JJA: [],
    SON: [],
  };
  for (let year = 1961; year <= 2020; year++) {
    const file = join(seasonCacheRoot, city.id, `${year}.json`);
    let cached: CachedYear;
    try {
      cached = JSON.parse(await readFile(file, 'utf8')) as CachedYear;
    } catch {
      throw new Error(`Cache annuale mancante: ${city.id} ${year}. Completa data:fetch.`);
    }
    const hash = createHash('sha256').update(JSON.stringify(cached.response)).digest('hex');
    if (
      cached.url !== seasonRequestUrl(city.latitude, city.longitude, year) ||
      hash !== cached.sha256
    )
      throw new Error(`Cache annuale non valida: ${file}.`);
    const annual = aggregateYear(cached.response, year);
    const summer = await originalSummer(city.id, year);
    // JJA is intentionally recomputed from its original daily source, never from annual responses.
    annual.JJA = summer.row;
    for (const season of seasons) records[season].push(annual[season]);
    annualItems.push(cached);
    summerItems.push(summer.cached);
  }
  const dataset: SeasonCityDataset = {
    schemaVersion: 2,
    cityId: city.id,
    source: sourceFor(city, annualItems),
    summerSource: sourceFor(city, summerItems),
    seasons: Object.fromEntries(
      seasons.map((season) => [
        season,
        {
          years: records[season],
          periods: {
            a: summarizeSeason(records[season], season, 1961, 1990),
            b: summarizeSeason(records[season], season, 1991, 2020),
          },
        },
      ]),
    ) as SeasonCityDataset['seasons'],
  };
  await assertSummerDataset(dataset);
  return dataset;
}
