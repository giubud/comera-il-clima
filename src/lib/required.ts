export function requireDefined<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) {
    throw new Error('Valore richiesto non disponibile.');
  }
  return value;
}
