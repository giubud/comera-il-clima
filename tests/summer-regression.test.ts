import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';
import { cities } from '../src/data/cities';

type PreviousYear = {
  year: number;
  validDays: number;
  meanTemperatureC: number;
  hotDays: number;
  precipitationMm: number;
};
type PreviousSummary = Omit<PreviousYear, 'year' | 'validDays'> & {
  startYear: number;
  endYear: number;
  validYears: number;
};
type PreviousSeason = {
  years: PreviousYear[];
  periods: { a: PreviousSummary; b: PreviousSummary };
};
const previousMetrics = (row: PreviousSummary) => ({
  startYear: row.startYear,
  endYear: row.endYear,
  validYears: row.validYears,
  meanTemperatureC: row.meanTemperatureC,
  hotDays: row.hotDays,
  precipitationMm: row.precipitationMm,
});

describe('regressione estiva: riferimento pubblicato 129d25d, indipendente dal generatore', () => {
  it('conserva esattamente 1.800 valori annuali, riepiloghi e precisione compatta', async () => {
    const baseline: unknown = JSON.parse(
      await readFile('tests/fixtures/summer-baseline.json', 'utf8'),
    );
    const projected: Record<string, PreviousSeason> = {};
    for (const { id } of cities) {
      const data = JSON.parse(await readFile(`public/data/${id}.json`, 'utf8')) as
        PreviousSeason | { seasons: { JJA: PreviousSeason } };
      const summer = 'seasons' in data ? data.seasons.JJA : data;
      projected[id] = {
        years: summer.years.map((row) => ({
          year: row.year,
          validDays: row.validDays,
          meanTemperatureC: row.meanTemperatureC,
          hotDays: row.hotDays,
          precipitationMm: row.precipitationMm,
        })),
        periods: {
          a: previousMetrics(summer.periods.a),
          b: previousMetrics(summer.periods.b),
        },
      };
    }
    const manifest = JSON.parse(await readFile('public/data/manifest.json', 'utf8')) as {
      schemaVersion: number;
    };
    const file = manifest.schemaVersion === 1 ? 'summers.json' : 'seasons/JJA.json';
    const compact = JSON.parse(await readFile(`public/data/${file}`, 'utf8')) as {
      cities: Record<string, unknown[][]>;
    };
    expect({
      commit: '129d25d03961e623fa1d14c1b92c35b5fd9c18d9',
      cities: projected,
      compact: Object.fromEntries(
        Object.entries(compact.cities).map(([id, rows]) => [
          id,
          rows.map((row) => row.slice(0, 3)),
        ]),
      ),
    }).toEqual(baseline);
  });
});
