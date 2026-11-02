import { readFile, writeFile, appendFile } from 'node:fs/promises';
import { join } from 'node:path';
import { isDeepStrictEqual } from 'node:util';
import { seasons, seasonLabels, metrics, notApplicable } from '../src/data/season-meta';
import type { SeasonManifest, SeasonCityDataset } from '../src/data/schema';
import { validateSeasonFolder } from './season-validation';
import { requireDefined } from '../src/lib/required';

export function retainedHistory(before: SeasonCityDataset, after: SeasonCityDataset): void {
  if (
    before.cityId !== after.cityId ||
    !isDeepStrictEqual(before.source, after.source) ||
    !isDeepStrictEqual(before.summerSource, after.summerSource) ||
    !isDeepStrictEqual(
      before.extensions ?? [],
      (after.extensions ?? []).slice(0, before.extensions?.length ?? 0),
    )
  )
    throw new Error('La provenienza dello storico pubblicato è cambiata.');
  for (const season of seasons) {
    const old = before.seasons[season],
      next = after.seasons[season];
    if (
      next.years.length < old.years.length ||
      !isDeepStrictEqual(old.years, next.years.slice(0, old.years.length)) ||
      !isDeepStrictEqual(old.periods, next.periods)
    )
      throw new Error(`Modifica inattesa allo storico: ${before.cityId}/${season}.`);
  }
}

export async function refreshSummary(before: string, after: string, file: string): Promise<void> {
  await validateSeasonFolder(before);
  await validateSeasonFolder(after);
  const old = JSON.parse(await readFile(join(before, 'manifest.json'), 'utf8')) as SeasonManifest;
  const next = JSON.parse(await readFile(join(after, 'manifest.json'), 'utf8')) as SeasonManifest;
  const datasets: SeasonCityDataset[] = [];
  for (const city of old.cities) {
    const a = JSON.parse(await readFile(join(before, city.file), 'utf8')) as SeasonCityDataset;
    const b = JSON.parse(await readFile(join(after, city.file), 'utf8')) as SeasonCityDataset;
    retainedHistory(a, b);
    datasets.push(b);
  }
  const changed = next.dataVersion !== old.dataVersion;
  const lines = [
    `Estende l’archivio da ${old.lastYear} a ${next.lastYear}.`,
    '',
    'Dati ERA5 reali: temperatura media, giorni >30 °C, precipitazioni, gelo e giorni ≥20 mm.',
    'Le annualità già pubblicate, le loro fonti e i confronti iniziali restano identici.',
    `Versione dati: \`${old.dataVersion}\` → \`${next.dataVersion}\`.`,
    '',
    '| Città | Anni aggiunti | Record stagionali aggiunti |',
    '| --- | --- | ---: |',
    ...old.cities.map(
      (city) =>
        `| ${city.name} | ` +
        `${changed ? `${old.lastYear + 1}–${next.lastYear}` : 'nessuno'} | ` +
        `${(next.lastYear - old.lastYear) * 4} |`,
    ),
    '',
    `Valori dell’ultimo anno aggiunto (${next.lastYear}), per stagione:`,
  ];
  if (changed)
    for (const season of seasons) {
      lines.push(
        '',
        `### ${seasonLabels[season]}`,
        '',
        '| Città | °C medi | Giorni >30 °C | mm totali | Giorni di gelo | Giorni ≥20 mm |',
        '| --- | ---: | ---: | ---: | ---: | ---: |',
      );
      datasets.forEach((dataset, i) => {
        const row = requireDefined(dataset.seasons[season].years.at(-1));
        const values = metrics.map((metric) =>
          row[metric] === null
            ? 'Non applicabile'
            : notApplicable(season, metric)
              ? 'Non applicabile'
              : Number(row[metric]).toLocaleString('it-IT', { maximumFractionDigits: 2 }),
        );
        lines.push(`| ${old.cities[i]?.name ?? dataset.cityId} | ${values.join(' | ')} |`);
      });
    }
  lines.push(
    '',
    'Controlli prima della proposta: lint, formattazione, limiti sorgenti, ' +
      'TypeScript, test unitari, validazione dati, build ed E2E.',
    'Il merge resta al proprietario, dopo la CI richiesta verde.',
    '',
  );
  await writeFile(file, lines.join('\n'));
  if (process.env.GITHUB_OUTPUT)
    await appendFile(process.env.GITHUB_OUTPUT, `changed=${changed}\n`);
  if (process.env.GITHUB_STEP_SUMMARY)
    await appendFile(process.env.GITHUB_STEP_SUMMARY, lines.join('\n'));
  console.log(changed ? 'Dati nuovi: proposta pronta.' : 'Nessun dato nuovo: nessuna PR.');
}
