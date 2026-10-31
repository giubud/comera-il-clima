import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { cities } from '../src/data/cities';
import { assertDailyYear } from '../src/lib/season-aggregate';
import { seasonCacheRoot, seasonRequestUrl } from './season-source';
let valid = 0,
  missing = 0,
  invalid = 0;
for (const city of cities) {
  let count = 0;
  for (let year = 1961; year <= 2020; year++) {
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
  console.log(`${city.name}: ${count}/60 anni annuali validi.`);
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
console.log(`Totale: ${valid}/600 validi, ${missing} mancanti, ${invalid} non validi.`);
console.log(active ? 'Download in corso.' : 'Nessun download attivo.');
console.log(
  valid === 600
    ? 'Cache annuale pronta: eseguire data:build e data:validate.'
    : 'Archivio incompleto: i dati pubblicati restano invariati.',
);
if (invalid) process.exitCode = 1;
