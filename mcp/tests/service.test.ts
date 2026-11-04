import { describe, expect, it } from 'vitest';
import { ArchiveStore } from '../src/archive';
import { ClimateService } from '../src/service';
import { rankInput } from '../src/inputs';
import { fixture, manifest } from './helpers';

function service() {
  const { fetcher } = fixture();
  return new ClimateService(new ArchiveStore({ fetch: fetcher }));
}

describe('risposte MCP sui dati reali pubblicati', () => {
  it('elenca città e copertura dinamica con fonte, unità e limiti', async () => {
    const reply = await service().listCities();
    expect(reply).toMatchObject({
      archive: { first_year: 1961, last_year: manifest.lastYear },
      source: { model: 'ERA5', provider: 'Open-Meteo', basis: 'grid_cells_not_stations' },
      units: { meanTemperatureC: '°C', hotDays: 'days', precipitationMm: 'mm' },
    });
    expect(reply.data.cities).toHaveLength(10);
    expect(reply.data.seasons).toHaveLength(4);
    expect(reply.data.metrics).toHaveLength(5);
    expect(reply.limitations.join(' ')).toContain('non a misurazioni');
  });

  it('domanda 1: Milano inverno 2024/25 ha 21 giorni di gelo e 90 giorni coperti', async () => {
    const reply = await service().getSeason({ city_id: 'milano', season: 'DJF', year: 2025 });
    expect(reply.data).toMatchObject({
      label: 'Inverno 2024/25',
      start_date: '2024-12-01',
      end_date: '2025-02-28',
      valid_days: 90,
      metrics: {
        frostDays: { value: 21, display: '21', unit: 'giorni', status: 'available' },
        hotDays: { value: null, display: 'Non applicabile', status: 'not_applicable' },
      },
    });
    expect(reply.provenance[0]).toMatchObject({ years: [2025], model: 'ERA5' });
  });

  it('conserva i risultati dell’estate 2003 e distingue un vero zero', async () => {
    const instance = service();
    const summer = await instance.getSeason({ city_id: 'roma', season: 'JJA', year: 2003 });
    expect(summer.data).toMatchObject({
      valid_days: 92,
      metrics: {
        hotDays: { value: 81, display: '81' },
        meanTemperatureC: { display: '27,4' },
        precipitationMm: { display: '34,9' },
        frostDays: { value: null, status: 'not_applicable' },
      },
    });
    const winter = await instance.getSeason({ city_id: 'venezia', season: 'DJF', year: 2025 });
    expect(winter.data).toMatchObject({
      metrics: { frostDays: { value: 0, status: 'available' } },
    });
  });

  it('domanda 2: confronta Roma con i numeri visibili nel sito e segnala le fonti orarie', async () => {
    const reply = await service().comparePeriods({
      city_id: 'roma',
      season: 'JJA',
      period_a: { start_year: 1961, end_year: 1990 },
      period_b: { start_year: 1996, end_year: 2025 },
    });
    expect(reply.data).toMatchObject({
      valid_years_a: 30,
      valid_years_b: 30,
      difference_definition: 'B - A',
      metrics: {
        meanTemperatureC: { display_a: '23,2', display_b: '25,3', display_difference: '+2,1' },
        hotDays: { display_a: '31,7', display_b: '57,9', display_difference: '+26,2' },
        precipitationMm: { display_a: '115,6', display_b: '78,9', display_difference: '−36,7' },
        frostDays: { mean_a: null, mean_b: null, difference: null, status: 'not_applicable' },
      },
    });
    expect(reply.warnings.join(' ')).toContain('un’ora');
    expect(new Set(reply.provenance.map((source) => source.utc_offset_seconds))).toEqual(
      new Set([3600, 7200]),
    );
  });

  it('domanda 3: i cinque autunni più piovosi di Palermo, in ordine numerico', async () => {
    const reply = await service().rankYears(
      rankInput.parse({
        city_id: 'palermo',
        season: 'SON',
        metric: 'precipitationMm',
        period: { start_year: 1961, end_year: 2025 },
      }),
    );
    expect(reply.data).toMatchObject({
      order: 'desc',
      unit: 'mm',
      entries: [
        { year: 2003, value: 389.2 },
        { year: 1976, value: 337.1 },
        { year: 2019, value: 332.9 },
        { year: 1997, value: 332.6 },
        { year: 2021, value: 321.6 },
      ],
    });
  });

  it('la classifica crescente cerca i valori minori, con parità per anno', async () => {
    const reply = await service().rankYears(
      rankInput.parse({
        city_id: 'milano',
        season: 'MAM',
        metric: 'frostDays',
        order: 'asc',
        period: { start_year: 2021, end_year: 2025 },
        limit: 5,
      }),
    );
    const rows = reply.data.entries as { year: number; value: number }[];
    expect(
      rows.every((row, index) => {
        const previous = rows[index - 1];
        return (
          !previous ||
          previous.value < row.value ||
          (previous.value === row.value && previous.year < row.year)
        );
      }),
    ).toBe(true);
  });

  it('non inventa una classifica per un indicatore escluso', async () => {
    const reply = await service().rankYears(
      rankInput.parse({
        city_id: 'roma',
        season: 'JJA',
        metric: 'frostDays',
        period: { start_year: 1961, end_year: 2025 },
      }),
    );
    expect(reply.data).toMatchObject({ status: 'not_applicable', entries: [] });
    expect(reply.data.reason).toBeTypeOf('string');
  });

  it('copre l’inverno bisestile e le altre stagioni con lo stesso calendario', async () => {
    for (const [season, days] of [
      ['DJF', 91],
      ['MAM', 92],
      ['JJA', 92],
      ['SON', 91],
    ] as const) {
      const reply = await service().getSeason({ city_id: 'milano', season, year: 2024 });
      expect(reply.data.valid_days).toBe(days);
    }
  });

  it('rifiuta anni non pubblicati e limiti più grandi dell’intervallo', async () => {
    await expect(
      service().getSeason({ city_id: 'roma', season: 'JJA', year: manifest.lastYear + 1 }),
    ).rejects.toThrow('fuori archivio');
    await expect(
      service().rankYears(
        rankInput.parse({
          city_id: 'roma',
          season: 'JJA',
          metric: 'hotDays',
          period: { start_year: 2003, end_year: 2003 },
          limit: 2,
        }),
      ),
    ).rejects.toThrow('limit');
  });
});
