// Synthetic non-summer values are test data only. Nothing here is written to public/data.
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { cities } from '../src/data/cities';
import type { SeasonCityDataset, SeasonManifest, Summer } from '../src/data/schema';
import { seasons, applicability } from '../src/data/season-meta';
import { seasonDates } from '../src/data/calendar';
import { summarizeSeason } from '../src/lib/season-aggregate';
import { requestUrl } from '../scripts/open-meteo';
import { seasonRequestUrl } from '../scripts/season-source';
import { compactSeason } from '../src/data/season-compact';
export async function seasonalFixture() {
  const baseline = JSON.parse(await readFile('tests/fixtures/summer-baseline.json', 'utf8')) as {
    cities: Record<string, { years: Summer[] }>;
  };
  const datasets = cities.map((city, index): SeasonCityDataset => {
    const makeSource = (summer: boolean) => ({
      provider: 'Open-Meteo' as const,
      model: 'era5' as const,
      timezone: 'Europe/Rome' as const,
      cellSelection: 'land' as const,
      elevationCorrection: 'enabled' as const,
      utcOffsetSeconds: summer ? 7200 : 3600,
      elevationM: 50,
      requestedCoordinates: { latitude: city.latitude, longitude: city.longitude },
      returnedCoordinates: { latitude: city.latitude, longitude: city.longitude },
      requests: Array.from({ length: 60 }, (_, i) => ({
        url: summer
          ? requestUrl(city.latitude, city.longitude, 1961 + i)
          : seasonRequestUrl(city.latitude, city.longitude, 1961 + i),
        retrievedAt: '2026-10-30T00:00:00.000Z',
        sha256: '0'.repeat(64),
      })),
    });
    return {
      schemaVersion: 2,
      cityId: city.id,
      source: makeSource(false),
      summerSource: makeSource(true),
      seasons: Object.fromEntries(
        seasons.map((season) => {
          const years = Array.from({ length: 60 }, (_, i) => {
            const year = 1961 + i,
              old = baseline.cities[city.id]?.years[i];
            if (!old) throw new Error('Missing test baseline');
            return {
              year,
              validDays: seasonDates(season, year).length,
              meanTemperatureC:
                season === 'JJA' ? old.meanTemperatureC : 5 + index + i * (0.02 + index * 0.003),
              hotDays: season === 'DJF' ? null : season === 'JJA' ? old.hotDays : i % 4,
              precipitationMm: season === 'JJA' ? old.precipitationMm : 100 + index * 7 + (i % 10),
              frostDays: season === 'JJA' ? null : (i % 7) + index,
              heavyPrecipitationDays: i % 4,
            };
          });
          return [
            season,
            {
              years,
              periods: {
                a: summarizeSeason(years, season, 1961, 1990),
                b: summarizeSeason(years, season, 1991, 2020),
              },
            },
          ];
        }),
      ) as SeasonCityDataset['seasons'],
    };
  });
  const json = (v: unknown) => JSON.stringify(v, null, 2) + '\n';
  const hash = (text: string) => createHash('sha256').update(text).digest('hex');
  const manifest: SeasonManifest = {
    schemaVersion: 2,
    generatedAt: '2026-10-30T00:00:00.000Z',
    dataVersion: hash(
      JSON.stringify(
        datasets.map(({ cityId, seasons: records }) => ({ cityId, seasons: records })),
      ),
    ).slice(0, 16),
    firstYear: 1961,
    lastYear: 2020,
    seasons,
    winterYear: 'ending-year',
    thresholds: { hotDays: 30, frostDays: 0, heavyPrecipitationDays: 20 },
    applicability: applicability(),
    periods: { a: [1961, 1990], b: [1991, 2020] },
    units: {
      meanTemperatureC: '°C',
      hotDays: 'days',
      precipitationMm: 'mm',
      frostDays: 'days',
      heavyPrecipitationDays: 'days',
    },
    attribution: {
      label: 'Test fixture',
      url: 'https://open-meteo.com/en/docs/historical-weather-api',
      licence: 'CC BY 4.0',
      licenceUrl: 'https://creativecommons.org/licenses/by/4.0/',
    },
    cities: datasets.map((d, i) => ({
      id: d.cityId,
      name: cities[i]?.name ?? d.cityId,
      file: d.cityId + '.json',
      sha256: hash(json(d)),
      seasons: Object.fromEntries(
        seasons.map((s) => [s, d.seasons[s].periods]),
      ) as SeasonManifest['cities'][number]['seasons'],
    })),
  };
  const files: Record<string, string> = { 'manifest.json': json(manifest) };
  for (const d of datasets) files[d.cityId + '.json'] = json(d);
  for (const s of seasons)
    files['seasons/' + s + '.json'] = JSON.stringify(compactSeason(datasets, s)) + '\n';
  return { manifest, datasets, files };
}
