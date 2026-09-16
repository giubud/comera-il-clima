import { describe, expect, it } from 'vitest';
import { aggregateSummer, periodDelta, summarizePeriod } from '../src/lib/aggregate';
import { constantSummer, syntheticResponse } from './helpers';

describe('aggregateSummer', () => {
  it('calcola i tre indicatori e applica la soglia stretta', () => {
    const result = aggregateSummer(syntheticResponse(2000), 2000);
    expect(result.meanTemperatureC).toBe(20);
    expect(result.hotDays).toBe(0);
    expect(result.precipitationMm).toBe(92);
  });

  it('conta 10 massime a 30,1 °C', () => {
    const maxima = [...Array(92).fill(30)];
    maxima.fill(30.1, 0, 10);
    expect(aggregateSummer(syntheticResponse(2000, { temperature_2m_max: maxima }), 2000).hotDays).toBe(10);
  });

  it.each([
    ['data mancante', { time: syntheticResponse(2000).daily.time.slice(1) }],
    ['data duplicata', { time: [...syntheticResponse(2000).daily.time.slice(0, 91), '2000-08-30'] }],
    ['null', { precipitation_sum: [...Array(91).fill(1), null] }],
    ['NaN', { precipitation_sum: [...Array(91).fill(1), Number.NaN] }],
  ])('rifiuta %s', (_label, overrides) => {
    expect(() => aggregateSummer(syntheticResponse(2000, overrides), 2000)).toThrow();
  });

  it('esclude automaticamente date fuori da giugno-agosto e non dipende dal 29 febbraio', () => {
    const dates = syntheticResponse(2000).daily.time;
    expect(dates).not.toContain('2000-05-31');
    expect(dates).not.toContain('2000-09-01');
    expect(dates).not.toContain('2000-02-29');
    expect(aggregateSummer(syntheticResponse(2000), 2000).validDays).toBe(92);
  });
});

describe('periodi', () => {
  it('calcola un delta di +2 °C su due periodi costanti', () => {
    const summers = [
      ...Array.from({ length: 30 }, (_, i) => constantSummer(1961 + i, 20)),
      ...Array.from({ length: 30 }, (_, i) => constantSummer(1991 + i, 22)),
    ];
    expect(periodDelta(summarizePeriod(summers, 1961, 1990), summarizePeriod(summers, 1991, 2020), 'meanTemperatureC')).toBe(2);
  });

  it('calcola 10,5 giorni per conteggi alternati', () => {
    const summers = Array.from({ length: 30 }, (_, i) => constantSummer(1961 + i, 20, i % 2 === 0 ? 10 : 11));
    expect(summarizePeriod(summers, 1961, 1990).hotDays).toBe(10.5);
  });
});

