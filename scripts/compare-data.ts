import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { cities } from '../src/data/cities';
import { assertCityDataset, metrics, type Metric } from '../src/data/schema';

// Versione pubblicata prima del passaggio da nearest a land.
const beforeCommit = '9ef44cd8487f64d9ae779f51e4f1a4c116e6cc7c';
const labels: Record<Metric, string> = {
  meanTemperatureC: 'Temperatura (°C)',
  hotDays: 'Giorni >30 °C',
  precipitationMm: 'Precipitazioni (mm)',
};
const formatter = new Intl.NumberFormat('it-IT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
function format(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return formatter.format(rounded === 0 ? 0 : rounded);
}

async function main(): Promise<void> {
  const rows: Record<string, string>[] = [];
  for (const city of cities) {
    const path = `public/data/${city.id}.json`;
    const before: unknown = JSON.parse(execFileSync(
      'git', ['show', `${beforeCommit}:${path}`], { encoding: 'utf8' },
    ));
    const after: unknown = JSON.parse(await readFile(join(process.cwd(), path), 'utf8'));
    assertCityDataset(before);
    assertCityDataset(after);
    if (before.cityId !== city.id || after.cityId !== city.id) {
      throw new Error(`Città inattesa nel confronto: ${city.name}.`);
    }
    if (before.source.cellSelection !== 'nearest'
      || before.source.elevationCorrection !== 'disabled') {
      throw new Error(`Il riferimento iniziale non usa nearest: ${city.name}.`);
    }
    if (after.source.cellSelection !== 'land'
      || after.source.elevationCorrection !== 'enabled') {
      throw new Error('Prima esegui npm run data:build e npm run data:validate.');
    }
    for (const metric of metrics) {
      const oldA = before.periods.a[metric];
      const oldB = before.periods.b[metric];
      const newA = after.periods.a[metric];
      const newB = after.periods.b[metric];
      rows.push({
        'Città': city.name,
        Indicatore: labels[metric],
        'A prima': format(oldA),
        'B prima': format(oldB),
        'B−A prima': format(oldB - oldA),
        'A dopo': format(newA),
        'B dopo': format(newB),
        'B−A dopo': format(newB - newA),
      });
    }
  }
  console.log('A: 1961–1990; B: 1991–2020. Medie degli indicatori estivi.');
  console.log('Prima: nearest senza correzione quota; dopo: land con correzione quota.');
  console.table(rows);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
