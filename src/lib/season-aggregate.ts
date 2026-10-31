import type { DailyYearResponse, Season, SeasonSummary, SeasonYear } from '../data/schema';
import { annualDates, seasonDates } from '../data/calendar';
import { metrics, notApplicable, seasons } from '../data/season-meta';
import { requireDefined } from './required';

const fields = [
  'temperature_2m_mean',
  'temperature_2m_max',
  'temperature_2m_min',
  'precipitation_sum',
] as const;
export function assertDailyYear(value: unknown, year: number): asserts value is DailyYearResponse {
  if (!value || typeof value !== 'object') throw new Error('Risposta annuale non valida.');
  const data = value as Partial<DailyYearResponse>;
  const { daily, daily_units: units } = data;
  const expected = annualDates(year);
  if (data.utc_offset_seconds !== 3600 && data.utc_offset_seconds !== 7200)
    throw new Error('Scarto UTC della fonte non valido.');
  if (data.timezone !== 'Europe/Rome' || !daily || !units || units.time !== 'iso8601')
    throw new Error(`Metadati giornalieri non validi: ${year}.`);
  if (
    !Number.isFinite(data.latitude) ||
    !Number.isFinite(data.longitude) ||
    (data.elevation !== null && !Number.isFinite(data.elevation))
  )
    throw new Error('Coordinate o quota non valide.');
  if (
    !Array.isArray(daily.time) ||
    daily.time.length !== expected.length ||
    daily.time.some((date, index) => date !== expected[index])
  )
    throw new Error(`Date mancanti, duplicate o fuori ordine: ${year}.`);
  for (const field of fields) {
    const items = daily[field];
    if (
      units[field] !== (field === 'precipitation_sum' ? 'mm' : '°C') ||
      !Array.isArray(items) ||
      items.length !== expected.length ||
      items.some((item) => typeof item !== 'number' || !Number.isFinite(item))
    )
      throw new Error(`Variabile ${field} incompleta o con unità errata: ${year}.`);
  }
  for (let index = 0; index < expected.length; index++) {
    const mean = daily.temperature_2m_mean[index] as number;
    const maximum = daily.temperature_2m_max[index] as number;
    const minimum = daily.temperature_2m_min[index] as number;
    if (minimum > mean || mean > maximum || (daily.precipitation_sum[index] as number) < 0)
      throw new Error(`Valori giornalieri incoerenti: ${expected[index]}.`);
  }
}
export function aggregateSeason(
  response: DailyYearResponse,
  season: Season,
  year: number,
): SeasonYear {
  const dates = seasonDates(season, year);
  const start = annualDates(year).indexOf(requireDefined(dates[0]));
  let total = 0,
    rain = 0,
    hot = 0,
    frost = 0,
    heavy = 0;
  for (let index = start; index < start + dates.length; index++) {
    const mean = response.daily.temperature_2m_mean[index] as number;
    const maximum = response.daily.temperature_2m_max[index] as number;
    const minimum = response.daily.temperature_2m_min[index] as number;
    const precipitation = response.daily.precipitation_sum[index] as number;
    if (![mean, maximum, minimum, precipitation].every(Number.isFinite))
      throw new Error('Dati stagionali incompleti.');
    total += mean;
    rain += precipitation;
    if (maximum > 30) hot++;
    if (minimum < 0) frost++;
    if (precipitation >= 20) heavy++;
  }
  return {
    year,
    validDays: dates.length,
    meanTemperatureC: total / dates.length,
    hotDays: notApplicable(season, 'hotDays') ? null : hot,
    precipitationMm: rain,
    frostDays: notApplicable(season, 'frostDays') ? null : frost,
    heavyPrecipitationDays: heavy,
  };
}
export function aggregateYear(value: unknown, year: number): Record<Season, SeasonYear> {
  assertDailyYear(value, year);
  return Object.fromEntries(
    seasons.map((season) => [season, aggregateSeason(value, season, year)]),
  ) as Record<Season, SeasonYear>;
}
export function summarizeSeason(
  rows: readonly SeasonYear[],
  season: Season,
  startYear: number,
  endYear: number,
): SeasonSummary {
  const selected = rows.filter((row) => row.year >= startYear && row.year <= endYear);
  if (selected.length !== endYear - startYear + 1) throw new Error('Periodo incompleto.');
  const values = Object.fromEntries(
    metrics.map((metric) => {
      if (notApplicable(season, metric)) return [metric, null];
      const numbers = selected.map((row) => row[metric]);
      if (numbers.some((value) => value === null || !Number.isFinite(value)))
        throw new Error(`Valori incompleti per ${metric}.`);
      return [
        metric,
        numbers.reduce<number>((sum, value) => sum + (value as number), 0) / numbers.length,
      ];
    }),
  ) as Pick<SeasonSummary, (typeof metrics)[number]>;
  return { startYear, endYear, validYears: selected.length, ...values };
}
