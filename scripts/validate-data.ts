import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cities } from '../src/data/cities';
import { assertCityDataset, metrics, type CityDataset, type Manifest } from '../src/data/schema';
import { summarizePeriod } from '../src/lib/aggregate';

const dataRoot = join(process.cwd(), 'public', 'data');
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

function near(actual: number, expected: number): boolean {
  return Math.abs(actual - expected) < 1e-10;
}

async function main(): Promise<void> {
  const manifest = JSON.parse(await readFile(join(dataRoot, 'manifest.json'), 'utf8')) as Manifest;
  if (manifest.schemaVersion !== 1 || manifest.cities.length !== 10 || manifest.season !== 'JJA') {
    throw new Error('Manifest incompleto o versione non riconosciuta.');
  }
  const expectedIds = cities.map(({ id }) => id);
  if (manifest.cities.map(({ id }) => id).join(',') !== expectedIds.join(',')) throw new Error('Lista città inattesa nel manifest.');
  const logicalContent: { cityId: string; years: CityDataset['years']; periods: CityDataset['periods'] }[] = [];
  for (const entry of manifest.cities) {
    const raw = await readFile(join(dataRoot, entry.file), 'utf8');
    if (sha256(raw) !== entry.sha256) throw new Error(`Hash non valido: ${entry.file}.`);
    const dataset: unknown = JSON.parse(raw);
    assertCityDataset(dataset);
    if (dataset.cityId !== entry.id || dataset.source.requests.length !== 60) throw new Error(`Provenienza incompleta: ${entry.id}.`);
    const expectedYears = Array.from({ length: 60 }, (_, index) => 1961 + index);
    if (dataset.years.map(({ year }) => year).join(',') !== expectedYears.join(',')) throw new Error(`Anni incompleti: ${entry.id}.`);
    for (const request of dataset.source.requests) {
      const url = new URL(request.url);
      if (url.searchParams.get('models') !== 'era5' || url.searchParams.get('cell_selection') !== 'nearest' || url.searchParams.get('elevation') !== 'nan') {
        throw new Error(`Parametri fonte inattesi: ${entry.id}.`);
      }
    }
    const calculated = { a: summarizePeriod(dataset.years, 1961, 1990), b: summarizePeriod(dataset.years, 1991, 2020) };
    for (const key of ['a', 'b'] as const) {
      for (const metric of metrics) {
        if (!near(dataset.periods[key][metric], calculated[key][metric])) throw new Error(`Riepilogo errato: ${entry.id} ${key} ${metric}.`);
      }
    }
    logicalContent.push({ cityId: dataset.cityId, years: dataset.years, periods: dataset.periods });
  }
  const dataVersion = sha256(JSON.stringify(logicalContent)).slice(0, 16);
  if (manifest.dataVersion !== dataVersion) throw new Error('dataVersion non corrisponde al contenuto aggregato.');
  console.log(`Validazione superata: 10 città, 600 estati, 1.800 indicatori annuali. dataVersion=${dataVersion}`);
}

await main();
