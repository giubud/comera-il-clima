import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cities, getCity } from '../src/data/cities';
import type { DailyResponse } from '../src/data/schema';
import { aggregateSummer } from '../src/lib/aggregate';

type CachedResponse = {
  url: string;
  retrievedAt: string;
  sha256: string;
  response: DailyResponse;
};

const cacheRoot = join(process.cwd(), '.cache', 'open-meteo');
const sleep = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

function selectedWork(): { cityIds: string[]; from: number; to: number } {
  const args = process.argv.slice(2);
  const all = args.includes('--all');
  const cityIndex = args.indexOf('--city');
  const fromIndex = args.indexOf('--from');
  const toIndex = args.indexOf('--to');
  const cityId = cityIndex >= 0 ? args[cityIndex + 1] : undefined;
  const from = fromIndex >= 0 ? Number(args[fromIndex + 1]) : 1961;
  const to = toIndex >= 0 ? Number(args[toIndex + 1]) : 2020;
  if ((!all && !cityId) || (cityId && !getCity(cityId))) {
    throw new Error('Usa --all oppure --city <id> [--from 1961 --to 2020].');
  }
  if (!Number.isInteger(from) || !Number.isInteger(to) || from < 1961 || to > 2020 || from > to) {
    throw new Error('Intervallo non valido: sono ammessi anni dal 1961 al 2020.');
  }
  return { cityIds: all ? cities.map((city) => city.id) : [cityId!], from, to };
}

function requestUrl(latitude: number, longitude: number, year: number): string {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    start_date: `${year}-06-01`,
    end_date: `${year}-08-31`,
    daily: 'temperature_2m_mean,temperature_2m_max,precipitation_sum',
    models: 'era5',
    timezone: 'Europe/Rome',
    temperature_unit: 'celsius',
    precipitation_unit: 'mm',
    cell_selection: 'nearest',
    elevation: 'nan',
  });
  return `https://archive-api.open-meteo.com/v1/archive?${params.toString()}`;
}

function assertResponse(response: DailyResponse, year: number): void {
  if (response.timezone !== 'Europe/Rome') throw new Error(`Fuso inatteso per ${year}: ${response.timezone}.`);
  aggregateSummer(response, year);
}

async function validCache(path: string, url: string, year: number): Promise<boolean> {
  try {
    const cached = JSON.parse(await readFile(path, 'utf8')) as CachedResponse;
    if (cached.url !== url) return false;
    const raw = JSON.stringify(cached.response);
    if (createHash('sha256').update(raw).digest('hex') !== cached.sha256) return false;
    assertResponse(cached.response, year);
    return true;
  } catch {
    return false;
  }
}

async function download(url: string): Promise<{ raw: string; response: DailyResponse }> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(60_000) });
      if (!response.ok) {
        const message = `Open-Meteo ha risposto ${response.status} ${response.statusText}.`;
        if (response.status >= 400 && response.status < 500 && response.status !== 408 && response.status !== 429) {
          throw new Error(message);
        }
        const retryAfter = Number(response.headers.get('retry-after'));
        if (attempt < 3) {
          const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter * 1_000
            : response.status === 429 ? 60_000 : attempt * 1_000;
          await sleep(waitMs);
        }
        lastError = new Error(message);
        continue;
      }
      const raw = await response.text();
      return { raw, response: JSON.parse(raw) as DailyResponse };
    } catch (error) {
      lastError = error;
      if (attempt < 3) await sleep(attempt * 1_000);
    }
  }
  throw lastError instanceof Error ? lastError : new Error('Scaricamento non riuscito dopo tre tentativi.');
}

async function main(): Promise<void> {
  const work = selectedWork();
  let downloaded = 0;
  let reused = 0;
  for (const cityId of work.cityIds) {
    const city = getCity(cityId)!;
    const cityDirectory = join(cacheRoot, city.id);
    await mkdir(cityDirectory, { recursive: true });
    for (let year = work.from; year <= work.to; year += 1) {
      const path = join(cityDirectory, `${year}.json`);
      const url = requestUrl(city.latitude, city.longitude, year);
      if (await validCache(path, url, year)) {
        reused += 1;
        continue;
      }
      const { raw, response } = await download(url);
      assertResponse(response, year);
      const cached: CachedResponse = {
        url,
        retrievedAt: new Date().toISOString(),
        sha256: createHash('sha256').update(JSON.stringify(response)).digest('hex'),
        response,
      };
      await writeFile(path, `${JSON.stringify(cached, null, 2)}\n`, 'utf8');
      downloaded += 1;
      process.stdout.write(`${city.name} ${year}: scaricato e validato\n`);
      // Una richiesta estiva di 92 giorni pesa più di una chiamata semplice.
      // Questo intervallo mantiene il ritmo sotto il limite ponderato al minuto.
      await sleep(1_100);
    }
  }
  console.log(`Completato: ${downloaded} scaricati, ${reused} riutilizzati dalla cache.`);
}

await main();
