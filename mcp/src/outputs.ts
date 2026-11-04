import { z } from 'zod';
import { seasonMetrics, seasons } from '../../src/data/schema';

const integer = z.number().int();
const explicitNull = z.null().describe('Valore nullo esplicito, distinto dall’assenza del campo.');
const nullableNumber = z.union([z.number().describe('Valore numerico.'), explicitNull]);
const nullableString = z.union([z.string().describe('Valore testuale.'), explicitNull]);
const status = z.enum(['available', 'not_applicable']);
const period = z.object({ start_year: integer, end_year: integer });
const point = z.object({ latitude: z.number(), longitude: z.number() });
const unit = z.string();
const location = { city_id: z.string(), season: z.enum(seasons) };
const envelope = {
  data_version: z.string(),
  archive: z.object({ first_year: integer, last_year: integer, generated_at: z.string() }),
  units: z.record(z.enum(seasonMetrics), unit),
  source: z.object({
    model: z.literal('ERA5'),
    provider: z.literal('Open-Meteo'),
    url: z.string().url(),
    attribution: z.object({
      label: z.string(),
      url: z.string(),
      licence: z.string(),
      licenceUrl: z.string(),
    }),
    basis: z.literal('grid_cells_not_stations'),
  }),
  provenance: z.array(
    z.object({
      years: z.array(integer),
      model: z.literal('ERA5'),
      provider: z.literal('Open-Meteo'),
      dataset_url: z.string().url(),
      requested_coordinates: point,
      grid_coordinates: point,
      elevation_m: nullableNumber,
      cell_selection: z.literal('land'),
      elevation_correction: z.literal('enabled'),
      timezone: z.literal('Europe/Rome'),
      utc_offset_seconds: z.union([z.literal(3600), z.literal(7200)]),
    }),
  ),
  warnings: z.array(z.string()),
  limitations: z.array(z.string()),
};
const measurement = z.object({
  value: nullableNumber,
  unit,
  display: z.string(),
  status,
  reason: nullableString,
});
const comparison = z.object({
  mean_a: nullableNumber,
  mean_b: nullableNumber,
  difference: nullableNumber,
  unit,
  display_a: z.string(),
  display_b: z.string(),
  display_difference: z.string(),
  status,
  reason: nullableString,
});

export const listOutput = z.object({
  ...envelope,
  data: z.object({
    cities: z.array(z.object({ id: z.string(), name: z.string() })),
    seasons: z.array(z.object({ code: z.enum(seasons), label: z.string(), months: z.string() })),
    metrics: z.array(
      z.object({
        id: z.enum(seasonMetrics),
        label: z.string(),
        short: z.string(),
        unit,
      }),
    ),
    applicability: z.record(z.enum(seasons), z.record(z.enum(seasonMetrics), nullableString)),
    winter_year: z.literal('ending-year'),
  }),
});

export const seasonOutput = z.object({
  ...envelope,
  data: z.object({
    ...location,
    year: integer,
    label: z.string(),
    start_date: z.string(),
    end_date: z.string(),
    valid_days: integer,
    metrics: z.record(z.enum(seasonMetrics), measurement),
  }),
});

export const compareOutput = z.object({
  ...envelope,
  data: z.object({
    ...location,
    period_a: period,
    period_b: period,
    valid_years_a: integer,
    valid_years_b: integer,
    difference_definition: z.literal('B - A'),
    metrics: z.record(z.enum(seasonMetrics), comparison),
  }),
});

export const rankOutput = z.object({
  ...envelope,
  data: z.object({
    ...location,
    metric: z.enum(seasonMetrics),
    period,
    order: z.enum(['asc', 'desc']),
    unit,
    status,
    reason: nullableString,
    tie_break: z.literal('year_ascending'),
    entries: z.array(
      z.object({
        position: integer,
        year: integer,
        label: z.string(),
        value: z.number(),
        display: z.string(),
      }),
    ),
  }),
});
