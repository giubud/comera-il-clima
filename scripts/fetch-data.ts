import { createHash } from 'node:crypto';
import { mkdir, open, readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cities, getCity } from '../src/data/cities';
import { assertDailyYear } from '../src/lib/season-aggregate';
import type { DailyYearResponse } from '../src/data/schema';
import { requireDefined } from '../src/lib/required';
import { seasonCacheRoot, seasonRequestUrl } from './season-source';
import { originalSummer } from './summer-source';
import { QuotaPause } from './fetch-quota';
import { downloadYear } from './fetch-client';
type CachedYear = { url: string; retrievedAt: string; sha256: string; response: DailyYearResponse };
const sha256 = (value: unknown) => createHash('sha256').update(JSON.stringify(value)).digest('hex');
function work() {
  const args = process.argv.slice(2);
  const option = (name: string, fallback: string) => {
    const index = args.indexOf(name);
    return index < 0 ? fallback : requireDefined(args[index + 1]);
  };
  const id = option('--city', '');
  const from = Number(option('--from', '1961')),
    to = Number(option('--to', '2020'));
  const limit = Number(option('--limit', '300'));
  if (
    (!args.includes('--all') && !getCity(id)) ||
    !Number.isInteger(from) ||
    !Number.isInteger(to) ||
    from < 1961 ||
    to > Math.max(2020, new Date().getUTCFullYear() - 1) ||
    from > to ||
    !Number.isInteger(limit) ||
    limit < 1 ||
    limit > 600
  ) {
    throw new Error('Usa --all o --city <id>, anni dal 1961 all’ultimo completo, --limit 1–600.');
  }
  return {
    cities: args.includes('--all') ? cities : [requireDefined(getCity(id))],
    from,
    to,
    limit,
  };
}
async function readCache(file: string, url: string, year: number): Promise<CachedYear | null> {
  let text: string;
  try {
    text = await readFile(file, 'utf8');
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw error;
  }
  const cached = JSON.parse(text) as CachedYear;
  if (cached.url !== url || sha256(cached.response) !== cached.sha256)
    throw new Error(`Cache incoerente: ${file}. File conservato per la diagnosi.`);
  assertDailyYear(cached.response, year);
  return cached;
}
async function main(): Promise<void> {
  const selected = work();
  await mkdir(seasonCacheRoot, { recursive: true });
  const lockPath = join(seasonCacheRoot, '.download.lock');
  const lock = await open(lockPath, 'wx').catch(async (error: unknown) => {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') throw error;
    const pid = Number(await readFile(lockPath, 'utf8'));
    if (!Number.isInteger(pid) || pid <= 0) throw new Error('Lock del download non valido.');
    try {
      process.kill(pid, 0);
    } catch (failure) {
      if ((failure as NodeJS.ErrnoException).code === 'ESRCH') {
        await unlink(lockPath);
        return open(lockPath, 'wx');
      }
      throw failure;
    }
    throw new Error('Un download stagionale è già attivo.');
  });
  await lock.writeFile(String(process.pid));
  try {
    let downloaded = 0,
      reused = 0,
      pending = 0;
    for (const city of selected.cities) {
      const directory = join(seasonCacheRoot, city.id);
      await mkdir(directory, { recursive: true });
      for (let year = selected.from; year <= selected.to; year++) {
        const file = join(directory, `${year}.json`);
        const url = seasonRequestUrl(city.latitude, city.longitude, year);
        let cached = await readCache(file, url, year);
        if (cached) reused++;
        else {
          if (downloaded >= selected.limit) {
            pending++;
            continue;
          }
          cached = await downloadYear(url, year);
          await writeFile(file + '.tmp', JSON.stringify(cached, null, 2) + '\n');
          await rename(file + '.tmp', file);
          downloaded++;
        }
        if (year <= 2020) await originalSummer(city.id, year);
        console.log(`${city.name} ${year}: dati annuali validi.`);
      }
    }
    console.log(`Lotto: ${downloaded} scaricati, ${reused} riutilizzati, ${pending} da scaricare.`);
    if (pending) console.log('Cache incompleta: ripeti lo stesso comando per continuare.');
    else console.log('Intervallo richiesto completo. La build pubblica non è stata modificata.');
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}
await main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = error instanceof QuotaPause ? 2 : 1;
});
