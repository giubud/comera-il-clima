import { readFile } from 'node:fs/promises';
import { validateSeasonFolder } from './season-validation';
const manifest = JSON.parse(await readFile('public/data/manifest.json', 'utf8')) as {
  schemaVersion: number;
  dataVersion: string;
};
if (manifest.schemaVersion === 1) await import('./validate-data-v1');
else if (manifest.schemaVersion === 2) {
  await validateSeasonFolder('public/data');
  console.log(
    `Validazione superata: 10 città, 2.400 stagioni, estate invariata. ${manifest.dataVersion}`,
  );
} else throw new Error('Versione dei dati non riconosciuta.');
