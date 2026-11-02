import type { SeasonCityDataset, SeasonManifest } from '../src/data/schema';
import { assertSeasonCity } from '../src/data/schema';
import { createHash } from 'node:crypto';
import { cities } from '../src/data/cities';
import { seasons } from '../src/data/season-meta';
import { compactSeason } from '../src/data/season-compact';
import { aggregateYear, assertDailyYear } from '../src/lib/season-aggregate';
import { sourceFor } from './season-dataset';
import { seasonRequestUrl } from './season-source';
import { requireDefined } from '../src/lib/required';
import type { CachedYear } from './fetch-client';
type LoadYear = (cityId: string, year: number) => Promise<CachedYear>;
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
export function targetYear(text: string, now = new Date()): number {
  const lastComplete = now.getUTCFullYear() - 1;
  if (text !== '' && !/^\d{4}$/.test(text)) throw new Error('to_year deve essere un anno intero.');
  const year = text === '' ? lastComplete : Number(text);
  if (year < 2020 || year > lastComplete)
    throw new Error(`to_year deve essere compreso fra 2020 e ${lastComplete}.`);
  return year;
}
export async function extendCity(
  previous: SeasonCityDataset,
  to: number,
  load: LoadYear,
): Promise<SeasonCityDataset> {
  assertSeasonCity(previous);
  const last = requireDefined(previous.seasons.JJA.years.at(-1)).year;
  if (!Number.isInteger(to) || to < last) throw new Error('Non ridurre lo storico pubblicato.');
  if (to === last) return previous;
  const next = structuredClone(previous);
  const city = requireDefined(cities.find((entry) => entry.id === previous.cityId));
  next.extensions ??= [];
  for (let year = last + 1; year <= to; year++) {
    const cached = await load(city.id, year);
    if (
      cached.url !== seasonRequestUrl(city.latitude, city.longitude, year) ||
      hash(JSON.stringify(cached.response)) !== cached.sha256 ||
      !Number.isFinite(Date.parse(cached.retrievedAt))
    )
      throw new Error(`Cache annuale incoerente: ${city.id}/${year}.`);
    assertDailyYear(cached.response, year);
    const annual = aggregateYear(cached.response, year);
    for (const season of seasons) next.seasons[season].years.push(annual[season]);
    next.extensions.push({ year, source: sourceFor(city, [cached]) });
  }
  assertSeasonCity(next);
  return next;
}
export function planArchive(
  previous: SeasonManifest,
  datasets: SeasonCityDataset[],
  now: string,
): { manifest: SeasonManifest; files: Record<string, string>; changed: boolean } {
  const logical = datasets.map(({ cityId, seasons: records }) => ({ cityId, seasons: records }));
  const dataVersion = hash(JSON.stringify(logical)).slice(0, 16);
  if (dataVersion === previous.dataVersion)
    return { manifest: previous, files: {}, changed: false };
  const lastYear = requireDefined(datasets[0]?.seasons.JJA.years.at(-1)).year;
  const files: Record<string, string> = {};
  for (const dataset of datasets) files[dataset.cityId + '.json'] = json(dataset);
  const manifest: SeasonManifest = {
    ...previous,
    dataVersion,
    lastYear,
    generatedAt: now,
    cities: datasets.map((dataset, index) => ({
      ...requireDefined(previous.cities[index]),
      sha256: hash(requireDefined(files[dataset.cityId + '.json'])),
      seasons: Object.fromEntries(
        seasons.map((season) => [season, dataset.seasons[season].periods]),
      ) as SeasonManifest['cities'][number]['seasons'],
    })),
  };
  files['manifest.json'] = json(manifest);
  for (const season of seasons)
    files['seasons/' + season + '.json'] = JSON.stringify(compactSeason(datasets, season)) + '\n';
  return { manifest, files, changed: true };
}
