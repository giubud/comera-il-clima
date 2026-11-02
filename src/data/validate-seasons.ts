import type { CompactSeason, SeasonCityDataset, SeasonManifest } from './schema';
import { seasonDates } from './calendar';
import { applicability, isSeason, metrics, notApplicable, seasons } from './season-meta';
import { assertSource, assertArchiveEnd } from './validate-source';
function object(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Oggetto atteso.');
}
function checkMetrics(
  row: Record<string, unknown>,
  season: (typeof seasons)[number],
  days: number,
  integer: boolean,
): void {
  for (const metric of metrics) {
    const value = row[metric];
    if (notApplicable(season, metric)) {
      if (value !== null) throw new Error(`${season}/${metric}: null esplicito richiesto.`);
    } else {
      if (typeof value !== 'number' || !Number.isFinite(value))
        throw new Error(`${season}/${metric}: valore mancante.`);
      if (metric !== 'meanTemperatureC' && value < 0) throw new Error('Valore negativo.');
      if (
        !['meanTemperatureC', 'precipitationMm'].includes(metric) &&
        (value > days || (integer && !Number.isInteger(value)))
      )
        throw new Error('Conteggio stagionale non valido.');
    }
  }
}
export function assertSeasonCity(value: unknown): asserts value is SeasonCityDataset {
  object(value);
  if (value.schemaVersion !== 2 || typeof value.cityId !== 'string')
    throw new Error('Versione del dataset stagionale non riconosciuta.');
  for (const key of ['source', 'summerSource']) {
    assertSource(value[key], 60);
  }
  const extensions = value.extensions ?? [];
  if (!Array.isArray(extensions)) throw new Error('Provenienza degli anni nuovi mancante.');
  extensions.forEach((extension: unknown, index: number) => {
    object(extension);
    if (extension.year !== 2021 + index) throw new Error('Anno della fonte incoerente.');
    assertSource(extension.source, 1);
  });
  object(value.seasons);
  if (Object.keys(value.seasons).sort().join() !== [...seasons].sort().join())
    throw new Error('Sono richieste quattro stagioni.');
  for (const season of seasons) {
    const data = value.seasons[season];
    object(data);
    if (!Array.isArray(data.years) || data.years.length !== 60 + extensions.length)
      throw new Error('Anni incompleti.');
    data.years.forEach((row: unknown, index: number) => {
      object(row);
      const year = 1961 + index,
        days = seasonDates(season, year).length;
      if (row.year !== year || row.validDays !== days) throw new Error('Calendario incoerente.');
      checkMetrics(row, season, days, true);
    });
    object(data.periods);
    for (const [key, first] of [
      ['a', 1961],
      ['b', 1991],
    ] as const) {
      const summary = data.periods[key];
      object(summary);
      if (
        summary.startYear !== first ||
        summary.endYear !== first + 29 ||
        summary.validYears !== 30
      )
        throw new Error('Riepilogo incompleto.');
      checkMetrics(summary, season, 92, false);
    }
  }
}
export function assertSeasonCompact(
  value: unknown,
  ids: readonly string[],
): asserts value is CompactSeason {
  object(value);
  if (
    value.schemaVersion !== 2 ||
    !isSeason(String(value.season)) ||
    value.firstYear !== 1961 ||
    JSON.stringify(value.metrics) !== JSON.stringify(metrics)
  )
    throw new Error('Riepilogo stagionale non valido.');
  assertArchiveEnd(value.lastYear);
  const season = value.season as CompactSeason['season'];
  object(value.cities);
  if (Object.keys(value.cities).sort().join() !== [...ids].sort().join())
    throw new Error('Città mancanti nel riepilogo.');
  for (const id of ids) {
    const rows = value.cities[id];
    if (!Array.isArray(rows) || rows.length !== value.lastYear - 1961 + 1)
      throw new Error('Serie incompleta.');
    rows.forEach((row: unknown, index: number) => {
      if (!Array.isArray(row) || row.length !== metrics.length) throw new Error('Riga non valida.');
      const values = Object.fromEntries(metrics.map((metric, i) => [metric, row[i]]));
      checkMetrics(values, season, seasonDates(season, 1961 + index).length, true);
    });
  }
}
export function assertSeasonManifest(
  value: unknown,
  ids: readonly string[],
): asserts value is SeasonManifest {
  object(value);
  if (
    value.schemaVersion !== 2 ||
    value.firstYear !== 1961 ||
    value.winterYear !== 'ending-year' ||
    typeof value.dataVersion !== 'string' ||
    JSON.stringify(value.seasons) !== JSON.stringify(seasons) ||
    JSON.stringify(value.applicability) !== JSON.stringify(applicability())
  )
    throw new Error('Manifest stagionale non valido.');
  assertArchiveEnd(value.lastYear);
  const expectedThresholds = { hotDays: 30, frostDays: 0, heavyPrecipitationDays: 20 };
  const expectedUnits = {
    meanTemperatureC: '°C',
    hotDays: 'days',
    precipitationMm: 'mm',
    frostDays: 'days',
    heavyPrecipitationDays: 'days',
  };
  if (
    JSON.stringify(value.thresholds) !== JSON.stringify(expectedThresholds) ||
    JSON.stringify(value.units) !== JSON.stringify(expectedUnits) ||
    JSON.stringify(value.periods) !== JSON.stringify({ a: [1961, 1990], b: [1991, 2020] })
  )
    throw new Error('Soglie, unità o periodi del manifest incoerenti.');
  if (
    !Array.isArray(value.cities) ||
    value.cities.length !== ids.length ||
    value.cities.some((entry: unknown, i: number) => {
      object(entry);
      return (
        entry.id !== ids[i] ||
        entry.file !== `${ids[i]}.json` ||
        typeof entry.sha256 !== 'string' ||
        !/^[a-f0-9]{64}$/.test(entry.sha256)
      );
    })
  )
    throw new Error('Elenco città non valido.');
}
