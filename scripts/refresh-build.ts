import { readFile, mkdir, writeFile, rename, rm } from 'node:fs/promises';
import { join, resolve, sep } from 'node:path';
import { cities } from '../src/data/cities';
import { assertSeasonCity, type SeasonCityDataset, type SeasonManifest } from '../src/data/schema';
import { validateSeasonFolder } from './season-validation';
import { extendCity, planArchive } from './refresh-data';
import type { CachedYear } from './fetch-client';

export async function refreshBuild(to: number, root = resolve('public/data')): Promise<void> {
  root = resolve(root);
  const cache = resolve('.cache');
  if (root !== resolve('public/data') && !root.startsWith(cache + sep))
    throw new Error('Percorso di pubblicazione non valido.');
  const stage = root === resolve('public/data') ? join(cache, 'data-next') : root + '.next';
  const backup =
    root === resolve('public/data') ? join(cache, 'data-previous') : root + '.previous';
  await validateSeasonFolder(root);
  const previous = JSON.parse(
    await readFile(join(root, 'manifest.json'), 'utf8'),
  ) as SeasonManifest;
  if (to < previous.lastYear) throw new Error('Non ridurre lo storico pubblicato.');
  if (to === previous.lastYear) {
    console.log('Nessun anno nuovo: archivio e date di generazione invariati.');
    return;
  }
  const datasets: SeasonCityDataset[] = [];
  for (const city of cities) {
    const data: unknown = JSON.parse(await readFile(join(root, city.id + '.json'), 'utf8'));
    assertSeasonCity(data);
    datasets.push(
      await extendCity(data, to, async (id, year) => {
        const file = resolve('.cache/open-meteo-seasons-v2', id, year + '.json');
        try {
          return JSON.parse(await readFile(file, 'utf8')) as CachedYear;
        } catch {
          throw new Error(`Cache annuale mancante: ${id}/${year}. Completa data:fetch.`);
        }
      }),
    );
  }
  const plan = planArchive(previous, datasets, new Date().toISOString());
  if (!plan.changed) return;
  await rm(stage, { recursive: true, force: true });
  await mkdir(join(stage, 'seasons'), { recursive: true });
  for (const [file, body] of Object.entries(plan.files)) await writeFile(join(stage, file), body);
  await validateSeasonFolder(stage);
  await rm(backup, { recursive: true, force: true });
  await rename(root, backup);
  try {
    await rename(stage, root);
  } catch (error) {
    await rename(backup, root);
    throw error;
  }
  await rm(backup, { recursive: true, force: true });
  console.log(`Archivio esteso fino al ${to}; dataVersion=${plan.manifest.dataVersion}.`);
}
