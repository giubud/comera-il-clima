import { readFile } from 'node:fs/promises';
import {
  assertCityDataset,
  assertSeasonCity,
  assertSeasonCompact,
  assertSummers,
  type CompactSummers,
} from '../src/data/schema';
import { cities } from '../src/data/cities';
import { seasonalFixture } from './season-fixture';
import type { Page } from '@playwright/test';

export type ArchiveKind = 'published' | 'seasonal-fixture';

export async function mockSeasonArchive(page: Page) {
  const archive = await seasonalFixture();
  await page.route('**/comera-il-clima/data/**', async (route) => {
    const file = new URL(route.request().url()).pathname.split('/data/')[1] ?? '';
    const body = archive.files[file];
    if (body === undefined) await route.abort();
    else await route.fulfill({ contentType: 'application/json', body });
  });
  return archive;
}

async function fileValue(kind: ArchiveKind, file: string): Promise<unknown> {
  const text =
    kind === 'published'
      ? await readFile('public/data/' + file, 'utf8')
      : (await seasonalFixture()).files[file];
  if (!text) throw new Error('Missing E2E file: ' + file);
  return JSON.parse(text) as unknown;
}

export async function archiveVersion(kind: ArchiveKind): Promise<1 | 2> {
  const value = (await fileValue(kind, 'manifest.json')) as { schemaVersion?: unknown };
  if (value.schemaVersion !== 1 && value.schemaVersion !== 2) throw new Error('Unknown schema');
  return value.schemaVersion;
}

export async function summerYears(kind: ArchiveKind) {
  const data = await fileValue(kind, 'roma.json');
  if ((await archiveVersion(kind)) === 1) {
    assertCityDataset(data);
    return data.years;
  }
  assertSeasonCity(data);
  return data.seasons.JJA.years;
}

export async function summerCompact(kind: ArchiveKind): Promise<CompactSummers> {
  const ids = cities.map((c) => c.id);
  if ((await archiveVersion(kind)) === 1) {
    const value = await fileValue(kind, 'summers.json');
    assertSummers(value, ids);
    return value;
  }
  const value = await fileValue(kind, 'seasons/JJA.json');
  assertSeasonCompact(value, ids);
  return {
    schemaVersion: 1,
    firstYear: 1961,
    lastYear: 2020,
    cities: Object.fromEntries(
      Object.entries(value.cities).map(([id, records]) => [
        id,
        records.map(([mean, hot, precipitation]) => {
          if (hot === null) throw new Error('Summer hotDays cannot be null');
          return [mean, hot, precipitation] as [number, number, number];
        }),
      ]),
    ),
  };
}
