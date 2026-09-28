import type { CityDataset, CompactSummers, Summer } from './schema';

const round = (value: number, places: number) => Number(value.toFixed(places));

export function compactSummers(datasets: readonly CityDataset[]): CompactSummers {
  return {
    schemaVersion: 1,
    firstYear: 1961,
    lastYear: 2020,
    cities: Object.fromEntries(datasets.map((dataset) => [dataset.cityId, dataset.years.map((summer) => [
      round(summer.meanTemperatureC, 2), summer.hotDays, round(summer.precipitationMm, 1),
    ])])) as CompactSummers['cities'],
  };
}

export function expandSummers(rows: CompactSummers['cities'][string]): Summer[] {
  return rows.map(([meanTemperatureC, hotDays, precipitationMm], index) => ({
    year: 1961 + index, validDays: 92, meanTemperatureC, hotDays, precipitationMm,
  }));
}
