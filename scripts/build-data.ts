import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cities } from '../src/data/cities';
import type { CityDataset, DailyResponse, Manifest } from '../src/data/schema';
import { aggregateSummer, summarizePeriod } from '../src/lib/aggregate';

type CachedResponse = { url: string; retrievedAt: string; sha256: string; response: DailyResponse };

const root = process.cwd();
const cacheRoot = join(root, '.cache', 'open-meteo');
const publicRoot = join(root, 'public');
const output = join(publicRoot, 'data');
const stage = join(publicRoot, '.data-next');
const backup = join(publicRoot, '.data-previous');
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');
const stableJson = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

async function datasetForCity(city: (typeof cities)[number]): Promise<CityDataset> {
  const cachedItems: CachedResponse[] = [];
  const years = [];
  for (let year = 1961; year <= 2020; year += 1) {
    const path = join(cacheRoot, city.id, `${year}.json`);
    let cached: CachedResponse;
    try {
      cached = JSON.parse(await readFile(path, 'utf8')) as CachedResponse;
    } catch {
      throw new Error(`Cache mancante o illeggibile: ${city.id}/${year}.json.`);
    }
    if (sha256(JSON.stringify(cached.response)) !== cached.sha256) throw new Error(`Hash cache non valido: ${city.id} ${year}.`);
    years.push(aggregateSummer(cached.response, year));
    cachedItems.push(cached);
  }
  const first = cachedItems[0]!.response;
  for (const [index, cached] of cachedItems.entries()) {
    const response = cached.response;
    if (response.latitude !== first.latitude || response.longitude !== first.longitude || response.elevation !== first.elevation || response.timezone !== first.timezone) {
      throw new Error(`Metadati geografici incoerenti: ${city.id} ${1961 + index}.`);
    }
  }
  return {
    schemaVersion: 1,
    cityId: city.id,
    season: 'JJA',
    source: {
      provider: 'Open-Meteo',
      model: 'era5',
      timezone: 'Europe/Rome',
      requestedCoordinates: { latitude: city.latitude, longitude: city.longitude },
      returnedCoordinates: { latitude: first.latitude, longitude: first.longitude },
      elevationM: first.elevation,
      cellSelection: 'nearest',
      elevationCorrection: 'disabled',
      requests: cachedItems.map(({ url, retrievedAt, sha256: hash }) => ({ url, retrievedAt, sha256: hash })),
    },
    years,
    periods: { a: summarizePeriod(years, 1961, 1990), b: summarizePeriod(years, 1991, 2020) },
  };
}

async function main(): Promise<void> {
  await rm(stage, { recursive: true, force: true });
  await mkdir(stage, { recursive: true });
  const datasets: CityDataset[] = [];
  const cityEntries: Manifest['cities'] = [];
  for (const city of cities) {
    const dataset = await datasetForCity(city);
    const json = stableJson(dataset);
    await writeFile(join(stage, `${city.id}.json`), json, 'utf8');
    datasets.push(dataset);
    cityEntries.push({ id: city.id, name: city.name, file: `${city.id}.json`, sha256: sha256(json), periods: dataset.periods });
  }
  const logicalContent = datasets.map(({ cityId, years, periods }) => ({ cityId, years, periods }));
  const manifest: Manifest = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    dataVersion: sha256(JSON.stringify(logicalContent)).slice(0, 16),
    season: 'JJA',
    periods: { a: [1961, 1990], b: [1991, 2020] },
    hotDayThresholdC: 30,
    units: { meanTemperatureC: '°C', hotDays: 'days', precipitationMm: 'mm' },
    attribution: {
      label: 'Open-Meteo Historical Weather API · ERA5',
      url: 'https://open-meteo.com/en/docs/historical-weather-api',
      licence: 'CC BY 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
    },
    cities: cityEntries,
  };
  await writeFile(join(stage, 'manifest.json'), stableJson(manifest), 'utf8');

  await rm(backup, { recursive: true, force: true });
  try {
    await rename(output, backup);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
  }
  try {
    await rename(stage, output);
    await rm(backup, { recursive: true, force: true });
  } catch (error) {
    try { await rename(backup, output); } catch { /* Nessun output precedente da ripristinare. */ }
    throw error;
  }
  console.log(`Generati 10 dataset, 600 estati. dataVersion=${manifest.dataVersion}`);
}

await main();
