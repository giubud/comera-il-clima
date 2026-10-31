import { readFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import type { SeasonCityDataset, SeasonYear } from '../src/data/schema';
type CoreYear = Pick<
  SeasonYear,
  'year' | 'validDays' | 'meanTemperatureC' | 'hotDays' | 'precipitationMm'
>;
type Baseline = { cities: Record<string, { years: CoreYear[] }> };
let baseline: Promise<Baseline> | undefined;
export async function assertSummerYear(cityId: string, row: SeasonYear): Promise<void> {
  baseline ??= readFile('tests/fixtures/summer-baseline.json', 'utf8').then(
    (text) => JSON.parse(text) as Baseline,
  );
  const old = (await baseline).cities[cityId]?.years[row.year - 1961];
  if (!old) throw new Error(`Riferimento estivo mancante: ${cityId} ${row.year}.`);
  for (const metric of ['meanTemperatureC', 'hotDays', 'precipitationMm', 'validDays'] as const) {
    if (row[metric] !== old[metric]) {
      throw new Error(
        `Regressione estiva ${cityId} ${row.year}, ${metric}: ` +
          `prima ${old[metric]}, dopo ${row[metric]}. Dati pubblicati invariati.`,
      );
    }
  }
}
export async function assertSummerDataset(dataset: SeasonCityDataset): Promise<void> {
  for (const row of dataset.seasons.JJA.years) await assertSummerYear(dataset.cityId, row);
  // This guard is independent from the frozen numbers; the unit regression also checks summaries.
  if (
    !isDeepStrictEqual(
      dataset.seasons.JJA.years.map((row) => row.year),
      Array.from({ length: 60 }, (_, i) => 1961 + i),
    )
  )
    throw new Error('Estati incomplete.');
}
