import { appendFile, readFile } from 'node:fs/promises';
import { targetYear } from './refresh-data';
import { validateSeasonFolder } from './season-validation';
import type { SeasonManifest } from '../src/data/schema';
await validateSeasonFolder('public/data');
const manifest = JSON.parse(await readFile('public/data/manifest.json', 'utf8')) as SeasonManifest;
const year = targetYear(process.env.TO_YEAR ?? '');
if (year < manifest.lastYear) throw new Error('to_year non può ridurre lo storico pubblicato.');
const output =
  `to=${year}\nfrom=${manifest.lastYear + 1}\n` + `needed=${year > manifest.lastYear}\n`;
if (process.env.GITHUB_OUTPUT) await appendFile(process.env.GITHUB_OUTPUT, output);
console.log(output.trim());
