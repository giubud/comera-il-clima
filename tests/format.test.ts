import { describe, expect, it } from 'vitest';
import { deltaWording, formatValue, normalizeDisplayed } from '../src/lib/format';

describe('formattazione differenze', () => {
  it('gestisce negativo, positivo e valore vicino a zero secondo la precisione visualizzata', () => {
    expect(deltaWording(-0.2)).toBe('più bassa');
    expect(deltaWording(0.2)).toBe('più alta');
    expect(deltaWording(-0.01)).toBe('uguale');
    expect(normalizeDisplayed(-0.01)).toBe(0);
    expect(formatValue(-0.01)).toBe('0,0');
  });
});

