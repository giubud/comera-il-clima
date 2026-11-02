import { describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { seasonalFixture } from './season-fixture';
import { annualDates } from '../src/data/calendar';
import { extendCity, planArchive, targetYear } from '../scripts/refresh-data';
import { seasonRequestUrl } from '../scripts/season-source';
import { cities } from '../src/data/cities';
import { requireDefined } from '../src/lib/required';
import type { CachedYear } from '../scripts/fetch-client';

// Artificial daily values are confined to this test; real product downloads use Open-Meteo.
async function annual(cityId: string, year: number): Promise<CachedYear> {
  const city = requireDefined(cities.find((entry) => entry.id === cityId));
  const time = annualDates(year);
  const response = {
    latitude: city.latitude,
    longitude: city.longitude,
    elevation: 50,
    timezone: 'Europe/Rome',
    utc_offset_seconds: 3600,
    daily_units: {
      time: 'iso8601',
      temperature_2m_mean: '°C',
      temperature_2m_max: '°C',
      temperature_2m_min: '°C',
      precipitation_sum: 'mm',
    },
    daily: {
      time,
      temperature_2m_mean: time.map(() => 15),
      temperature_2m_max: time.map(() => 31),
      temperature_2m_min: time.map(() => -1),
      precipitation_sum: time.map(() => 20),
    },
  };
  return {
    url: seasonRequestUrl(city.latitude, city.longitude, year),
    retrievedAt: '2026-11-02T00:00:00.000Z',
    response,
    sha256: createHash('sha256').update(JSON.stringify(response)).digest('hex'),
  };
}

describe('aggiornamento progressivo dell’archivio pubblicato', () => {
  it('aggiunge un anno conservando tutte le stagioni, metriche e fonti precedenti', async () => {
    const previous = requireDefined((await seasonalFixture()).datasets[0]);
    const snapshot = structuredClone(previous);
    const next = await extendCity(previous, 2021, annual);
    expect(previous).toEqual(snapshot);
    for (const season of ['DJF', 'MAM', 'JJA', 'SON'] as const) {
      expect(next.seasons[season].years.slice(0, 60)).toEqual(previous.seasons[season].years);
      expect(next.seasons[season].periods).toEqual(previous.seasons[season].periods);
      expect(next.seasons[season].years.at(-1)?.year).toBe(2021);
    }
    expect(next.source).toEqual(previous.source);
    expect(next.summerSource).toEqual(previous.summerSource);
    expect(next.extensions?.[0]?.source.requests).toHaveLength(1);
  });
  it('un secondo aggiornamento non scarica e non cambia file né generatedAt', async () => {
    const archive = await seasonalFixture();
    const next = await Promise.all(archive.datasets.map((d) => extendCity(d, 2021, annual)));
    const first = planArchive(archive.manifest, next, '2026-11-02T12:00:00Z');
    expect(first.changed).toBe(true);
    expect(first.manifest.lastYear).toBe(2021);
    const fail = async (): Promise<CachedYear> => {
      throw new Error('Download non previsto');
    };
    const same = await Promise.all(next.map((d) => extendCity(d, 2021, fail)));
    const second = planArchive(first.manifest, same, '2027-01-01T00:00:00Z');
    expect(second.changed).toBe(false);
    expect(second.manifest).toEqual(first.manifest);
    expect(second.files).toEqual({});
  });
  it('rifiuta anni incompleti, input non interi e riduzioni dello storico', async () => {
    const now = new Date('2026-11-02T00:00:00Z');
    expect(targetYear('', now)).toBe(2025);
    for (const bad of ['2026', '2021.5', '2025; echo token', '2019'])
      expect(() => targetYear(bad, now)).toThrow();
    const previous = requireDefined((await seasonalFixture()).datasets[0]);
    await expect(extendCity(previous, 2019, annual)).rejects.toThrow();
  });
  it('rifiuta cache manomessa prima di aggiungere dati', async () => {
    const previous = requireDefined((await seasonalFixture()).datasets[0]);
    await expect(
      extendCity(previous, 2021, async (id, year) => ({
        ...(await annual(id, year)),
        sha256: '0'.repeat(64),
      })),
    ).rejects.toThrow(/Cache/);
  });
});
