import type { Season } from './schema';
const dayMs = 86_400_000;
export function seasonDates(season: Season, year: number): string[] {
  const bounds: Record<Season, [number, number]> = {
    DJF: [Date.UTC(year - 1, 11, 1), Date.UTC(year, 2, 1)],
    MAM: [Date.UTC(year, 2, 1), Date.UTC(year, 5, 1)],
    JJA: [Date.UTC(year, 5, 1), Date.UTC(year, 8, 1)],
    SON: [Date.UTC(year, 8, 1), Date.UTC(year, 11, 1)],
  };
  const [start, end] = bounds[season];
  return Array.from({ length: (end - start) / dayMs }, (_, index) =>
    new Date(start + index * dayMs).toISOString().slice(0, 10),
  );
}
export function annualDates(year: number): string[] {
  return (['DJF', 'MAM', 'JJA', 'SON'] as const).flatMap((season) => seasonDates(season, year));
}
