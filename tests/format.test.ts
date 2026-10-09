import { describe, expect, it } from 'vitest';
import {
  deltaWording, formatSigned, formatValue, metricMeta, normalizeDisplayed,
} from '../src/lib/format';

describe('formattazione degli indicatori', () => {
  it('mostra i giorni di un singolo anno come conteggi interi', () => {
    const context = { metric: 'hotDays', kind: 'annual' } as const;
    expect(`${formatValue(78, context)} ${metricMeta.hotDays.unit}`).toBe('78 giorni');
    expect(formatValue(0, context)).toBe('0');
  });

  it('mantiene un decimale nelle medie, anche quando la media è intera', () => {
    const context = { metric: 'hotDays', kind: 'period' } as const;
    expect(formatValue(26.7, context)).toBe('26,7');
    expect(formatValue(78, context)).toBe('78,0');
    expect(formatValue(0, context)).toBe('0,0');
  });

  it('mantiene un decimale per temperature e precipitazioni in entrambi i contesti', () => {
    for (const kind of ['annual', 'period'] as const) {
      expect(formatValue(27.38, { metric: 'meanTemperatureC', kind })).toBe('27,4');
      expect(formatValue(34.9, { metric: 'precipitationMm', kind })).toBe('34,9');
      expect(formatValue(0, { metric: 'precipitationMm', kind })).toBe('0,0');
    }
  });

  it('conserva il formato predefinito e le differenze rispetto alle medie', () => {
    expect(formatValue(78)).toBe('78,0');
    expect(formatSigned(1.7)).toBe('+1,7');
    expect(formatSigned(-1.7)).toBe('−1,7');
  });
});

describe('formattazione differenze', () => {
  it('gestisce negativo, positivo e valore vicino a zero secondo la precisione visualizzata', () => {
    expect(deltaWording(-0.2)).toBe('più bassa');
    expect(deltaWording(0.2)).toBe('più alta');
    expect(deltaWording(-0.01)).toBe('uguale');
    expect(normalizeDisplayed(-0.01)).toBe(0);
    expect(formatValue(-0.01)).toBe('0,0');
  });
});

