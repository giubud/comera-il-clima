import { readFile, writeFile, mkdir, rename, rm } from 'node:fs/promises';
import { resolve, dirname, join } from 'node:path';
import { cities } from '../src/data/cities';
import { seasons } from '../src/data/season-meta';
import { assertSeasonCity, assertSeasonCompact } from '../src/data/schema';
import { compactSeason } from '../src/data/season-compact';
const root = resolve('public/data');
const stage = resolve('.cache/season-summaries-next');
const backup = resolve('.cache/season-summaries-previous');
for (const target of [stage, backup]) {
  if (dirname(target) !== resolve('.cache')) throw new Error('Staging non valido.');
}
const manifest = JSON.parse(await readFile(join(root, 'manifest.json'), 'utf8')) as {
  schemaVersion: number;
};
if (manifest.schemaVersion === 1) await import('./build-summers-v1');
else if (manifest.schemaVersion === 2) {
  const datasets = await Promise.all(
    cities.map(async (city) => {
      const data: unknown = JSON.parse(await readFile(join(root, city.id + '.json'), 'utf8'));
      assertSeasonCity(data);
      return data;
    }),
  );
  await rm(stage, { recursive: true, force: true });
  await mkdir(stage, { recursive: true });
  for (const season of seasons) {
    const data = compactSeason(datasets, season);
    assertSeasonCompact(
      data,
      cities.map((c) => c.id),
    );
    await writeFile(join(stage, season + '.json'), JSON.stringify(data) + '\n');
  }
  await rm(backup, { recursive: true, force: true });
  await rename(join(root, 'seasons'), backup);
  try {
    await rename(stage, join(root, 'seasons'));
  } catch (error) {
    await rename(backup, join(root, 'seasons'));
    throw error;
  }
  await rm(backup, { recursive: true, force: true });
  console.log('Rigenerati i quattro riepiloghi stagionali.');
} else throw new Error('Versione non riconosciuta.');
