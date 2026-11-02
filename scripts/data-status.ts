import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { cities } from '../src/data/cities';
import { assertDailyYear } from '../src/lib/season-aggregate';
import { seasonCacheRoot, seasonRequestUrl } from './season-source';
const args = process.argv.slice(2);
const manifest = JSON.parse(await readFile('public/data/manifest.json', 'utf8')) as {
  lastYear?: number;
};
const argument = (key: string, fallback: number) => {
  const index = args.indexOf(key);
  return index < 0 ? fallback : Number(args[index + 1]);
};
const from = argument('--from', 1961),
  to = argument('--to', manifest.lastYear ?? 2020);
if (
  !Number.isInteger(from) ||
  !Number.isInteger(to) ||
  from < 1961 ||
  from > to ||
  to > Math.max(2020, new Date().getUTCFullYear() - 1)
)
  throw new Error('Intervallo non valido.');
const total = (to - from + 1) * cities.length;
let valid = 0,
  missing = 0,
  invalid = 0;
for (const city of cities) {
  let count = 0;
  for (let year = from; year <= to; year++) {
    try {
      const value = JSON.parse(
        await readFile(join(seasonCacheRoot, city.id, year + '.json'), 'utf8'),
      ) as {
        url: string;
        sha256: string;
        response: unknown;
      };
      assertDailyYear(value.response, year);
      const hash = createHash('sha256').update(JSON.stringify(value.response)).digest('hex');
      if (
        hash !== value.sha256 ||
        value.url !== seasonRequestUrl(city.latitude, city.longitude, year)
      )
        throw new Error('Cache non valida');
      valid++;
      count++;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') missing++;
      else invalid++;
    }
  }
  console.log(`${city.name}: ${count}/${to - from + 1} anni annuali validi.`);
}
let active = false;
try {
  const pid = Number(await readFile(join(seasonCacheRoot, '.download.lock'), 'utf8'));
  if (Number.isInteger(pid) && pid > 0) {
    process.kill(pid, 0);
    active = true;
  }
} catch {
  /* Nessun download attivo. */
}
console.log(`Totale: ${valid}/${total} validi, ${missing} mancanti, ${invalid} non validi.`);
console.log(active ? 'Download in corso.' : 'Nessun download attivo.');
console.log(
  valid === total
    ? 'Cache annuale pronta: eseguire data:build e data:validate.'
    : 'Archivio incompleto: i dati pubblicati restano invariati.',
);
if (invalid) process.exitCode = 1;
