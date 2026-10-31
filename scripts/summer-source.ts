import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { DailyResponse, SeasonYear } from '../src/data/schema';
import { cities } from '../src/data/cities';
import { aggregateSummer } from '../src/lib/aggregate';
import { requireDefined } from '../src/lib/required';
import { cacheRoot, requestUrl } from './open-meteo';
import { assertSummerYear } from './summer-baseline';

export type SummerCache = {
  url: string;
  retrievedAt: string;
  sha256: string;
  response: DailyResponse & { utc_offset_seconds: number };
};
export async function originalSummer(
  cityId: string,
  year: number,
): Promise<{
  row: SeasonYear;
  cached: SummerCache;
}> {
  const city = requireDefined(cities.find((item) => item.id === cityId));
  const file = join(cacheRoot, cityId, `${year}.json`);
  const cached = JSON.parse(await readFile(file, 'utf8')) as SummerCache;
  const hash = createHash('sha256').update(JSON.stringify(cached.response)).digest('hex');
  if (
    cached.url !== requestUrl(city.latitude, city.longitude, year) ||
    cached.sha256 !== hash ||
    cached.response.timezone !== 'Europe/Rome'
  )
    throw new Error(`Cache estiva originale incoerente: ${file}.`);
  const summer = aggregateSummer(cached.response, year);
  const row: SeasonYear = {
    ...summer,
    frostDays: null,
    heavyPrecipitationDays: cached.response.daily.precipitation_sum.filter(
      (value) => typeof value === 'number' && value >= 20,
    ).length,
  };
  await assertSummerYear(cityId, row);
  return { row, cached };
}
