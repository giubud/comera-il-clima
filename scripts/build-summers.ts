import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cities } from '../src/data/cities';
import { compactSummers } from '../src/data/compact';
import { assertCityDataset, type CityDataset } from '../src/data/schema';

const root = join(process.cwd(), 'public', 'data');
const datasets: CityDataset[] = [];
for (const city of cities) {
  const value: unknown = JSON.parse(await readFile(join(root, `${city.id}.json`), 'utf8'));
  assertCityDataset(value);
  if (value.cityId !== city.id) throw new Error(`Città inattesa: ${city.id}.`);
  datasets.push(value);
}
const compact = compactSummers(datasets);
await writeFile(join(root, 'summers.json'), `${JSON.stringify(compact)}\n`, 'utf8');
console.log('Generato summers.json da 600 estati ERA5 verificate.');
