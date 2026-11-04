import { z } from 'zod';
import { cities } from '../../src/data/cities';
import { seasonMetrics, seasons } from '../../src/data/schema';

const city = z.enum(cities.map(({ id }) => id)).describe('Identificativo da list_cities.');
const season = z.enum(seasons).describe('DJF inverno, MAM primavera, JJA estate, SON autunno.');
const year = z.number().int().min(1961).max(9999);
export const periodInput = z
  .object({ start_year: year, end_year: year })
  .strict()
  .refine((period) => period.start_year <= period.end_year, {
    message: 'L’anno iniziale deve precedere o coincidere con quello finale.',
  });
export const listInput = z.object({}).strict();
export const seasonInput = z
  .object({
    city_id: city,
    season,
    year: year.describe('Per DJF è l’anno finale: 2025 = dicembre 2024–febbraio 2025.'),
  })
  .strict();
export const compareInput = z
  .object({ city_id: city, season, period_a: periodInput, period_b: periodInput })
  .strict();
export const rankInput = z
  .object({
    city_id: city,
    season,
    metric: z.enum(seasonMetrics),
    period: periodInput,
    order: z.enum(['asc', 'desc']).default('desc').describe('Ordine del valore numerico.'),
    limit: z
      .number()
      .int()
      .min(1)
      .max(9999)
      .optional()
      .describe('Default: 5, o gli anni presenti.'),
  })
  .strict();

export type PeriodInput = z.infer<typeof periodInput>;
export type SeasonInput = z.infer<typeof seasonInput>;
export type CompareInput = z.infer<typeof compareInput>;
export type RankInput = z.infer<typeof rankInput>;
