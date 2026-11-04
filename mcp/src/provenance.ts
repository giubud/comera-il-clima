import type { Season, SeasonCityDataset, SeasonSource } from '../../src/data/schema';
import { DATA_URL, TIME_WARNING } from './config';

function sourceFor(dataset: SeasonCityDataset, season: Season, year: number): SeasonSource {
  if (year <= 2020) return season === 'JJA' ? dataset.summerSource : dataset.source;
  const extension = dataset.extensions?.find((item) => item.year === year);
  if (!extension) throw new Error('Provenienza mancante per l’anno ' + year);
  return extension.source;
}

export function provenance(dataset: SeasonCityDataset, season: Season, years: readonly number[]) {
  const groups = new Map<SeasonSource, number[]>();
  for (const year of [...new Set(years)].sort((a, b) => a - b)) {
    const source = sourceFor(dataset, season, year);
    const group = groups.get(source) ?? [];
    group.push(year);
    groups.set(source, group);
  }
  const sources = [...groups].map(([source, group]) => ({
    years: group,
    model: 'ERA5' as const,
    provider: source.provider,
    dataset_url: new URL(dataset.cityId + '.json', DATA_URL).href,
    requested_coordinates: source.requestedCoordinates,
    grid_coordinates: source.returnedCoordinates,
    elevation_m: source.elevationM,
    cell_selection: source.cellSelection,
    elevation_correction: source.elevationCorrection,
    timezone: source.timezone,
    utc_offset_seconds: source.utcOffsetSeconds,
  }));
  return {
    sources,
    warnings:
      new Set(sources.map((source) => source.utc_offset_seconds)).size > 1 ? [TIME_WARNING] : [],
  };
}
