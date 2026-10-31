import { createHash } from 'node:crypto';
import { access, mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { cities } from '../src/data/cities';
import { assertSeasonCity, type SeasonManifest } from '../src/data/schema';
import { compactSeason } from '../src/data/season-compact';
import { applicability, seasons } from '../src/data/season-meta';
import { datasetForCity } from './season-dataset';
import { validateSeasonFolder } from './season-validation';
const publicRoot = resolve('public');
const output = join(publicRoot, 'data'),
  stage = resolve('.cache/data-next');
const backup = resolve('.cache/data-previous');
if (
  dirname(output) !== publicRoot ||
  [stage, backup].some((target) => dirname(target) !== resolve('.cache'))
)
  throw new Error('Percorso di pubblicazione non valido.');
const hash = (text: string) => createHash('sha256').update(text).digest('hex');
const json = (value: unknown) => JSON.stringify(value, null, 2) + '\n';
async function main(): Promise<void> {
  // Recover the previous public folder if an interrupted swap stopped between renames.
  try {
    await access(output);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
    await rename(backup, output);
    console.log('Ripristinati i dati precedenti dopo uno scambio interrotto.');
  }
  // Read every source and check the summer baseline before touching published files.
  const datasets = [];
  for (const city of cities) {
    const dataset = await datasetForCity(city);
    assertSeasonCity(dataset);
    datasets.push(dataset);
  }
  const old = JSON.parse(await readFile(join(output, 'manifest.json'), 'utf8')) as {
    attribution: SeasonManifest['attribution'];
  };
  const logical = datasets.map(({ cityId, seasons: records }) => ({ cityId, seasons: records }));
  const manifest: SeasonManifest = {
    schemaVersion: 2,
    generatedAt: new Date().toISOString(),
    dataVersion: hash(JSON.stringify(logical)).slice(0, 16),
    firstYear: 1961,
    lastYear: 2020,
    seasons,
    winterYear: 'ending-year',
    applicability: applicability(),
    thresholds: { hotDays: 30, frostDays: 0, heavyPrecipitationDays: 20 },
    periods: { a: [1961, 1990], b: [1991, 2020] },
    attribution: old.attribution,
    units: {
      meanTemperatureC: '°C',
      hotDays: 'days',
      precipitationMm: 'mm',
      frostDays: 'days',
      heavyPrecipitationDays: 'days',
    },
    cities: datasets.map((dataset, i) => ({
      id: dataset.cityId,
      name: cities[i]?.name ?? dataset.cityId,
      file: dataset.cityId + '.json',
      sha256: hash(json(dataset)),
      seasons: Object.fromEntries(
        seasons.map((s) => [s, dataset.seasons[s].periods]),
      ) as SeasonManifest['cities'][number]['seasons'],
    })),
  };
  await rm(stage, { recursive: true, force: true });
  await mkdir(join(stage, 'seasons'), { recursive: true });
  for (const dataset of datasets)
    await writeFile(join(stage, dataset.cityId + '.json'), json(dataset));
  await writeFile(join(stage, 'manifest.json'), json(manifest));
  for (const season of seasons)
    await writeFile(
      join(stage, 'seasons', season + '.json'),
      JSON.stringify(compactSeason(datasets, season)) + '\n',
    );
  await validateSeasonFolder(stage);
  await rm(backup, { recursive: true, force: true });
  await rename(output, backup);
  try {
    await rename(stage, output);
  } catch (error) {
    await rename(backup, output);
    throw error;
  }
  await rm(backup, { recursive: true, force: true });
  console.log(`Generati 2.400 record stagionali, schema 2. dataVersion=${manifest.dataVersion}`);
}
await main();
