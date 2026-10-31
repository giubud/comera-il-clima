import type { CompactSeason, Season, SeasonCityDataset, SeasonYear } from './schema';
import { seasonDates } from './calendar';
import { metrics } from './season-meta';
export function compactSeason(
  datasets: readonly SeasonCityDataset[],
  season: Season,
): CompactSeason {
  return {
    schemaVersion: 2,
    season,
    firstYear: 1961,
    lastYear: 2020,
    metrics,
    cities: Object.fromEntries(
      datasets.map((dataset) => [
        dataset.cityId,
        dataset.seasons[season].years.map((row) => [
          Number(row.meanTemperatureC.toFixed(2)),
          row.hotDays,
          Number(row.precipitationMm.toFixed(1)),
          row.frostDays,
          row.heavyPrecipitationDays,
        ]),
      ]),
    ) as CompactSeason['cities'],
  };
}
export function expandSeason(rows: CompactSeason['cities'][string], season: Season): SeasonYear[] {
  return rows.map((row, index) => ({
    year: 1961 + index,
    validDays: seasonDates(season, 1961 + index).length,
    meanTemperatureC: row[0],
    hotDays: row[1],
    precipitationMm: row[2],
    frostDays: row[3],
    heavyPrecipitationDays: row[4],
  }));
}
