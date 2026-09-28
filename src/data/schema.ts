export const metrics = ['meanTemperatureC', 'hotDays', 'precipitationMm'] as const;
export type Metric = (typeof metrics)[number];
export type Metrics = Record<Metric, number>;

export type Summer = Metrics & { year: number; validDays: 92 };
export type CompactSummers = {
  schemaVersion: 1;
  firstYear: 1961;
  lastYear: 2020;
  // Ordered [mean temperature °C, hot days, precipitation mm] for every year.
  cities: Record<string, [number, number, number][]>;
};
export type PeriodSummary = Metrics & {
  startYear: number;
  endYear: number;
  validYears: 30;
};

export type SourceRequest = { url: string; retrievedAt: string; sha256: string };

export type CityDataset = {
  schemaVersion: 1;
  cityId: string;
  season: 'JJA';
  source: {
    provider: 'Open-Meteo';
    model: 'era5';
    timezone: 'Europe/Rome';
    requestedCoordinates: { latitude: number; longitude: number };
    returnedCoordinates: { latitude: number; longitude: number };
    elevationM: number | null;
    cellSelection: 'nearest';
    elevationCorrection: 'disabled';
    requests: SourceRequest[];
  };
  years: Summer[];
  periods: { a: PeriodSummary; b: PeriodSummary };
};

export type Manifest = {
  schemaVersion: 1;
  generatedAt: string;
  dataVersion: string;
  season: 'JJA';
  periods: { a: [1961, 1990]; b: [1991, 2020] };
  hotDayThresholdC: 30;
  units: Record<Metric, string>;
  attribution: { label: string; url: string; licence: string; licenceUrl: string };
  cities: { id: string; name: string; file: string; sha256: string; periods: { a: PeriodSummary; b: PeriodSummary } }[];
};

export type DailyResponse = {
  latitude: number;
  longitude: number;
  elevation: number | null;
  timezone: string;
  daily_units: {
    time: string;
    temperature_2m_mean: string;
    temperature_2m_max: string;
    precipitation_sum: string;
  };
  daily: {
    time: unknown[];
    temperature_2m_mean: unknown[];
    temperature_2m_max: unknown[];
    precipitation_sum: unknown[];
  };
};

export function isMetric(value: string | null): value is Metric {
  return value !== null && (metrics as readonly string[]).includes(value);
}

export function assertSummers(value: unknown, cityIds: readonly string[]): asserts value is CompactSummers {
  if (!value || typeof value !== 'object') throw new Error('Riepilogo estivo non valido.');
  const data = value as Partial<CompactSummers>;
  if (data.schemaVersion !== 1 || data.firstYear !== 1961 || data.lastYear !== 2020 || !data.cities || typeof data.cities !== 'object') {
    throw new Error('Intestazione del riepilogo estivo non valida.');
  }
  if (Object.keys(data.cities).sort().join(',') !== [...cityIds].sort().join(',')) throw new Error('Città mancanti nel riepilogo estivo.');
  for (const id of cityIds) {
    const rows = data.cities[id];
    if (!Array.isArray(rows) || rows.length !== 60) throw new Error(`Estati incomplete: ${id}.`);
    for (const row of rows) {
      if (!Array.isArray(row) || row.length !== 3 || row.some((item) => typeof item !== 'number' || !Number.isFinite(item))) throw new Error(`Valori non validi: ${id}.`);
      if (!Number.isInteger(row[1]) || row[1] < 0 || row[1] > 92 || row[2] < 0) throw new Error(`Indicatori non validi: ${id}.`);
    }
  }
}

export function assertCityDataset(value: unknown): asserts value is CityDataset {
  if (!value || typeof value !== 'object') throw new Error('Dataset non valido: oggetto atteso.');
  const data = value as Partial<CityDataset>;
  if (data.schemaVersion !== 1 || data.season !== 'JJA' || typeof data.cityId !== 'string') {
    throw new Error('Dataset non valido: intestazione non riconosciuta.');
  }
  if (!Array.isArray(data.years) || data.years.length !== 60) {
    throw new Error('Dataset non valido: sono richieste 60 estati.');
  }
  for (const summer of data.years) {
    if (!summer || summer.validDays !== 92 || !Number.isInteger(summer.year)) {
      throw new Error('Dataset non valido: estate incompleta.');
    }
    for (const metric of metrics) {
      if (!Number.isFinite(summer[metric])) throw new Error(`Dataset non valido: ${metric}.`);
    }
  }
  if (!data.periods || data.periods.a.validYears !== 30 || data.periods.b.validYears !== 30) {
    throw new Error('Dataset non valido: riepiloghi dei periodi incompleti.');
  }
}
