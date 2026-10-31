import type { CityDataset, DailyResponse } from './legacy';
import type { metrics as newMetricList, seasons } from './season-meta';
export * from './legacy';
export { legacyMetrics as metrics, isLegacyMetric as isMetric } from './legacy';
export {
  metrics as seasonMetrics,
  seasons,
  isMetric as isSeasonMetric,
  isSeason,
} from './season-meta';
export { assertSeasonCity, assertSeasonCompact, assertSeasonManifest } from './validate-seasons';
export type Metric = import('./legacy').LegacyMetric;
export type SeasonMetric = (typeof newMetricList)[number];
export type Season = (typeof seasons)[number];
export type Metrics = Record<SeasonMetric, number | null>;
export type SeasonYear = Metrics & {
  year: number;
  validDays: number;
  meanTemperatureC: number;
  precipitationMm: number;
};
export type SeasonSummary = Metrics & {
  startYear: number;
  endYear: number;
  validYears: number;
  meanTemperatureC: number;
  precipitationMm: number;
};
export type SeasonData = {
  years: SeasonYear[];
  periods: { a: SeasonSummary; b: SeasonSummary };
};
export type SeasonCityDataset = {
  schemaVersion: 2;
  cityId: string;
  source: SeasonSource;
  summerSource: SeasonSource;
  seasons: Record<Season, SeasonData>;
};
export type SeasonManifest = {
  schemaVersion: 2;
  generatedAt: string;
  dataVersion: string;
  firstYear: 1961;
  lastYear: 2020;
  seasons: readonly Season[];
  winterYear: 'ending-year';
  thresholds: { hotDays: 30; frostDays: 0; heavyPrecipitationDays: 20 };
  applicability: Record<Season, Record<SeasonMetric, string | null>>;
  periods: { a: [1961, 1990]; b: [1991, 2020] };
  units: Record<SeasonMetric, string>;
  attribution: import('./legacy').Manifest['attribution'];
  cities: {
    id: string;
    name: string;
    file: string;
    sha256: string;
    seasons: Record<Season, SeasonData['periods']>;
  }[];
};
export type CompactSeason = {
  schemaVersion: 2;
  season: Season;
  firstYear: 1961;
  lastYear: 2020;
  metrics: readonly SeasonMetric[];
  cities: Record<string, [number, number | null, number, number | null, number | null][]>;
};
export type DailyYearResponse = DailyResponse & {
  utc_offset_seconds: number;
  daily_units: DailyResponse['daily_units'] & { temperature_2m_min: string };
  daily: DailyResponse['daily'] & { temperature_2m_min: unknown[] };
};
export type AnyCityDataset = CityDataset | SeasonCityDataset;
export type AnyManifest = import('./legacy').Manifest | SeasonManifest;
export type SeasonSource = CityDataset['source'] & { utcOffsetSeconds: number };
