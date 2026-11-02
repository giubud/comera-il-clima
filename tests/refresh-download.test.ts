import { describe, expect, it, vi } from 'vitest';
import { downloadYear, retryDelay } from '../scripts/fetch-client';
import { QuotaPause } from '../scripts/fetch-quota';
import { annualDates } from '../src/data/calendar';

function daily(year: number) {
  const time = annualDates(year);
  return {
    latitude: 45.5,
    longitude: 9.25,
    elevation: 120,
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
      temperature_2m_max: time.map(() => 25),
      temperature_2m_min: time.map(() => 5),
      precipitation_sum: time.map(() => 1),
    },
  };
}

describe('download degli aggiornamenti: quote, dati e tentativi limitati', () => {
  const reserve = vi.fn(async () => undefined);
  const pause = vi.fn(async (): Promise<never> => {
    throw new QuotaPause('Pausa richiesta');
  });
  it('conta ogni tentativo e si ferma dopo tre 429 senza produrre dati', async () => {
    const request = vi.fn(
      async () => new Response('', { status: 429, headers: { 'Retry-After': '90' } }),
    );
    reserve.mockClear();
    pause.mockClear();
    await expect(
      downloadYear('https://example.test/', 2021, { request, reserve, pause }),
    ).rejects.toThrow(/429.*3/);
    expect(request).toHaveBeenCalledTimes(3);
    expect(reserve).toHaveBeenCalledTimes(3);
    expect(pause).toHaveBeenCalledWith(90);
  });
  it('riprende dopo un 429 solo passando di nuovo dal controllo delle quote', async () => {
    const request = vi
      .fn()
      .mockResolvedValueOnce(new Response('', { status: 429 }))
      .mockResolvedValueOnce(Response.json(daily(2021)));
    reserve.mockClear();
    const result = await downloadYear('https://example.test/', 2021, { request, reserve, pause });
    expect(result.response.daily.time).toHaveLength(365);
    expect(result.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(reserve).toHaveBeenCalledTimes(2);
  });
  it('non forza altre richieste quando il registro impone una pausa', async () => {
    const request = vi.fn(async () => Response.json(daily(2021)));
    const blocked = async () => {
      throw new QuotaPause('Riprendi domani');
    };
    await expect(
      downloadYear('https://example.test/', 2021, { request, reserve: blocked, pause }),
    ).rejects.toThrow('Riprendi domani');
    expect(request).not.toHaveBeenCalled();
  });
  it('rispetta Retry-After espresso come data e rifiuta risposte incomplete', async () => {
    expect(retryDelay('Mon, 02 Nov 2026 12:02:00 GMT', Date.UTC(2026, 10, 2, 12))).toBe(120);
    expect(retryDelay(null, 0)).toBe(60);
    const request = async () => Response.json({ daily: { time: [] } });
    await expect(
      downloadYear('https://example.test/', 2021, { request, reserve, pause }),
    ).rejects.toThrow();
  });
});
