export function assertSource(value: unknown, requests: number): void {
  if (!value || typeof value !== 'object') throw new Error('Provenienza mancante.');
  const source = value as Record<string, unknown>;
  if (
    source.provider !== 'Open-Meteo' ||
    source.model !== 'era5' ||
    source.timezone !== 'Europe/Rome' ||
    source.cellSelection !== 'land' ||
    source.elevationCorrection !== 'enabled' ||
    !Array.isArray(source.requests) ||
    source.requests.length !== requests ||
    (source.utcOffsetSeconds !== 3600 && source.utcOffsetSeconds !== 7200)
  )
    throw new Error('Provenienza annuale incoerente.');
  for (const key of ['requestedCoordinates', 'returnedCoordinates']) {
    const value = source[key];
    if (!value || typeof value !== 'object') throw new Error('Coordinate mancanti.');
    const point = value as Record<string, unknown>;
    if (!Number.isFinite(point.latitude) || !Number.isFinite(point.longitude))
      throw new Error('Coordinate non valide.');
  }
  if (source.elevationM !== null && !Number.isFinite(source.elevationM))
    throw new Error('Quota non valida.');
}
export function assertArchiveEnd(value: unknown): asserts value is number {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 2020 || value > 9999)
    throw new Error('Ultimo anno dell’archivio non valido.');
}
