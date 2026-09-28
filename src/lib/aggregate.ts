import type { DailyResponse, Metric, PeriodSummary, Summer } from '../data/schema';

const MS_PER_DAY = 86_400_000;

function expectedDates(year: number): string[] {
  const start = Date.UTC(year, 5, 1);
  return Array.from({ length: 92 }, (_, index) => new Date(start + index * MS_PER_DAY).toISOString().slice(0, 10));
}

function finiteNumber(value: unknown, field: string, date: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new Error(`${field} non finito alla data ${date}.`);
  }
  return value;
}

export function aggregateSummer(response: DailyResponse, year: number): Summer {
  const { daily, daily_units: units } = response;
  if (units.temperature_2m_mean !== '°C' || units.temperature_2m_max !== '°C' || units.precipitation_sum !== 'mm') {
    throw new Error(`Unità inattese per l'anno ${year}.`);
  }
  const arrays = [daily.time, daily.temperature_2m_mean, daily.temperature_2m_max, daily.precipitation_sum];
  if (arrays.some((items) => !Array.isArray(items) || items.length !== 92)) {
    throw new Error(`L'estate ${year} deve contenere 92 valori per campo.`);
  }
  const expected = expectedDates(year);
  const dates = daily.time.map((value, index) => {
    if (typeof value !== 'string') throw new Error(`Data non valida all'indice ${index}.`);
    return value;
  });
  if (new Set(dates).size !== 92) throw new Error(`Date duplicate nell'estate ${year}.`);
  dates.forEach((date, index) => {
    if (date !== expected[index]) throw new Error(`Data inattesa nell'estate ${year}: ${date}, attesa ${expected[index]}.`);
  });

  let temperatureTotal = 0;
  let hotDays = 0;
  let precipitationTotal = 0;
  for (let index = 0; index < 92; index += 1) {
    const date = dates[index]!;
    const mean = finiteNumber(daily.temperature_2m_mean[index], 'temperature_2m_mean', date);
    const maximum = finiteNumber(daily.temperature_2m_max[index], 'temperature_2m_max', date);
    const precipitation = finiteNumber(daily.precipitation_sum[index], 'precipitation_sum', date);
    if (maximum < mean) throw new Error(`temperature_2m_max inferiore alla media alla data ${date}.`);
    if (precipitation < 0) throw new Error(`Precipitazione negativa alla data ${date}.`);
    temperatureTotal += mean;
    precipitationTotal += precipitation;
    if (maximum > 30) hotDays += 1;
  }

  return {
    year,
    validDays: 92,
    meanTemperatureC: temperatureTotal / 92,
    hotDays,
    precipitationMm: precipitationTotal,
  };
}

export function summarizePeriod(summers: readonly Summer[], startYear: number, endYear: number): PeriodSummary {
  const selected = summers.filter(({ year }) => year >= startYear && year <= endYear);
  if (selected.length !== 30) throw new Error(`Il periodo ${startYear}–${endYear} deve contenere 30 estati.`);
  const mean = (metric: Metric) => selected.reduce((sum, summer) => sum + summer[metric], 0) / selected.length;
  return {
    startYear,
    endYear,
    validYears: 30,
    meanTemperatureC: mean('meanTemperatureC'),
    hotDays: mean('hotDays'),
    precipitationMm: mean('precipitationMm'),
  };
}

export function periodDelta(a: PeriodSummary, b: PeriodSummary, metric: Metric): number {
  return b[metric] - a[metric];
}

export type RangeStats = { start: number; end: number; count: number; mean: number; sd: number };

export function rangeStats(summers: readonly Summer[], metric: Metric, start: number, end: number): RangeStats {
  const values = summers.filter((summer) => summer.year >= start && summer.year <= end).map((summer) => summer[metric]);
  if (values.length !== end - start + 1) throw new Error(`Periodo incompleto: ${start}–${end}.`);
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const sd = values.length > 1 ? Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (values.length - 1)) : 0;
  return { start, end, count: values.length, mean, sd };
}

export function movingAverage(values: readonly number[], window = 5): (number | null)[] {
  if (window < 1 || window % 2 !== 1) throw new Error('La finestra deve essere dispari e positiva.');
  const radius = Math.floor(window / 2);
  return values.map((_, index) => index < radius || index + radius >= values.length ? null :
    values.slice(index - radius, index + radius + 1).reduce((sum, value) => sum + value, 0) / window);
}

export function warmth(delta: number, metric: Metric): number {
  return metric === 'precipitationMm' ? -delta : delta;
}

export function zLevel(value: number, mean: number, sd: number): -2 | -1 | 0 | 1 | 2 {
  if (sd === 0) return 0;
  const z = (value - mean) / sd;
  return z >= 1.5 ? 2 : z >= 0.5 ? 1 : z <= -1.5 ? -2 : z <= -0.5 ? -1 : 0;
}

export function deltaClasses(values: readonly number[]): number[] {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return values.map((value) => max === min ? 1 : Math.min(3, Math.floor((value - min) / (max - min) * 4)));
}

