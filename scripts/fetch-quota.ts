import { readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { seasonCacheRoot } from './season-source';
export type QuotaEvent = { at: number; weight: number };
type Quota = { events: QuotaEvent[]; blockedUntil: number };
const file = join(seasonCacheRoot, 'quota.json');
export class QuotaPause extends Error {}
export function quotaDelay(events: readonly QuotaEvent[], weight: number, now: number): number {
  let delay = 0;
  for (const [window, limit] of [
    [60_000, 540],
    [3_600_000, 4500],
    [86_400_000, 9000],
  ] as const) {
    const recent = events.filter((event) => event.at > now - window);
    let used = recent.reduce((sum, event) => sum + event.weight, 0);
    for (const event of recent) {
      if (used + weight <= limit) break;
      delay = Math.max(delay, event.at + window - now + 1000);
      used -= event.weight;
    }
  }
  const last = events.at(-1);
  return Math.max(delay, last ? last.at + 30_000 - now : 0);
}
async function load(): Promise<Quota> {
  try {
    const value: unknown = JSON.parse(await readFile(file, 'utf8'));
    const quota = value as Quota;
    if (
      !quota ||
      !Array.isArray(quota.events) ||
      !Number.isFinite(quota.blockedUntil) ||
      quota.events.some(
        (event) =>
          !Number.isFinite(event.at) || !Number.isFinite(event.weight) || event.weight <= 0,
      )
    )
      throw new Error('Registro delle quote non valido; non azzerarlo durante un download.');
    return quota;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return { events: [], blockedUntil: 0 };
    throw error;
  }
}
export async function reserveQuota(weight: number): Promise<void> {
  const quota = await load(),
    now = Date.now();
  quota.events = quota.events.filter((event) => event.at > now - 86_400_000);
  const delay = Math.max(quotaDelay(quota.events, weight, now), quota.blockedUntil - now);
  if (delay > 60_000)
    throw new QuotaPause(
      `Limite prudenziale raggiunto. Riprendi dopo ${new Date(now + delay).toISOString()}.`,
    );
  if (delay > 0) await new Promise((resolve) => setTimeout(resolve, delay));
  quota.events.push({ at: Date.now(), weight });
  await writeFile(file, JSON.stringify(quota) + '\n');
}
export async function pauseQuota(seconds: number): Promise<never> {
  const quota = await load();
  quota.blockedUntil = Date.now() + Math.max(60, seconds) * 1000;
  await writeFile(file, JSON.stringify(quota) + '\n');
  throw new QuotaPause(
    `Open-Meteo ha chiesto una pausa. Riprendi dopo ` +
      `${new Date(quota.blockedUntil).toISOString()}.`,
  );
}
