import { createHash } from 'node:crypto';
import type { DailyYearResponse } from '../src/data/schema';
import { assertDailyYear } from '../src/lib/season-aggregate';
import { reserveQuota, pauseQuota, QuotaPause } from './fetch-quota';
import { quotaWeight } from './season-source';
export type CachedYear = {
  url: string;
  retrievedAt: string;
  sha256: string;
  response: DailyYearResponse;
};
type Dependencies = {
  request: typeof fetch;
  reserve: (weight: number) => Promise<void>;
  pause: (seconds: number) => Promise<never>;
};
export function retryDelay(header: string | null, now = Date.now()): number {
  if (!header) return 60;
  const seconds = Number(header);
  return Number.isFinite(seconds)
    ? Math.max(60, seconds)
    : Math.max(60, Math.ceil((Date.parse(header) - now) / 1000) || 60);
}
export async function downloadYear(
  url: string,
  year: number,
  dependencies: Dependencies = { request: fetch, reserve: reserveQuota, pause: pauseQuota },
): Promise<CachedYear> {
  let error: unknown;
  for (let attempt = 1; attempt <= 3; attempt++) {
    await dependencies.reserve(quotaWeight(year));
    let response: Response;
    try {
      response = await dependencies.request(url, { signal: AbortSignal.timeout(60_000) });
    } catch (failure) {
      error = failure;
      continue;
    }
    if (response.status === 429) {
      try {
        await dependencies.pause(retryDelay(response.headers.get('retry-after')));
      } catch (failure) {
        if (!(failure instanceof QuotaPause)) throw failure;
        error = failure;
      }
      if (attempt === 3)
        throw new Error(
          'Open-Meteo: HTTP 429 ripetuto 3 volte. Cache e quote conservate. ' +
            (error instanceof Error ? error.message : 'Riprovare dopo la pausa del fornitore.'),
        );
      // The next reservation enforces Retry-After; a long quota pause exits without retrying.
      continue;
    }
    if (!response.ok) {
      error = new Error(`Open-Meteo: HTTP ${response.status}.`);
      if (response.status < 500) throw error;
      continue;
    }
    const value: unknown = await response.json();
    assertDailyYear(value, year);
    return {
      url,
      retrievedAt: new Date().toISOString(),
      sha256: createHash('sha256').update(JSON.stringify(value)).digest('hex'),
      response: value,
    };
  }
  throw error instanceof Error ? error : new Error('Download fallito dopo tre tentativi.');
}
