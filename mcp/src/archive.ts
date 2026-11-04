import { createHash } from 'node:crypto';
import { cities } from '../../src/data/cities';
import {
  assertSeasonCity,
  assertSeasonManifest,
  type SeasonCityDataset,
  type SeasonManifest,
} from '../../src/data/schema';
import { CACHE_MS, DATA_URL, REQUEST_TIMEOUT_MS } from './config';

export type Snapshot = {
  manifest: SeasonManifest;
  datasets: Map<string, Promise<SeasonCityDataset>>;
};
type Options = { fetch?: typeof fetch; now?: () => number; ttlMs?: number };

export class ArchiveStore {
  private readonly fetcher: typeof fetch;
  private readonly now: () => number;
  private readonly ttlMs: number;
  private pending: Promise<Snapshot> | undefined;
  private expiresAt = 0;

  constructor(options: Options = {}) {
    this.fetcher = options.fetch ?? fetch;
    this.now = options.now ?? Date.now;
    this.ttlMs = options.ttlMs ?? CACHE_MS;
  }

  private async text(file: string): Promise<string> {
    const url = new URL(file, DATA_URL).href;
    let response: Response;
    try {
      response = await this.fetcher(url, {
        headers: { Accept: 'application/json' },
        redirect: 'error',
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      });
    } catch {
      throw new Error('Archivio pubblico non raggiungibile o richiesta scaduta: ' + url);
    }
    if (!response.ok) throw new Error(`Archivio pubblico: HTTP ${response.status} (${url}).`);
    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > 5_000_000) throw new Error('JSON pubblico troppo grande: ' + file);
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  }

  private async load(): Promise<Snapshot> {
    const value: unknown = JSON.parse(await this.text('manifest.json'));
    assertSeasonManifest(
      value,
      cities.map(({ id }) => id),
    );
    if (
      !/^[a-f0-9]{16}$/.test(value.dataVersion) ||
      !Number.isFinite(Date.parse(value.generatedAt)) ||
      !value.attribution ||
      ['label', 'url', 'licence', 'licenceUrl'].some(
        (key) => typeof Reflect.get(value.attribution, key) !== 'string',
      )
    ) {
      throw new Error('Versione, data o attribuzione dell’archivio non valide.');
    }
    return { manifest: value, datasets: new Map() };
  }

  snapshot(): Promise<Snapshot> {
    if (this.pending && this.now() < this.expiresAt) return this.pending;
    const pending = this.load();
    this.pending = pending;
    this.expiresAt = this.now() + this.ttlMs;
    void pending.catch(() => {
      if (this.pending === pending) this.pending = undefined;
    });
    return pending;
  }

  async city(snapshot: Snapshot, id: string): Promise<SeasonCityDataset> {
    const entry = snapshot.manifest.cities.find((item) => item.id === id);
    if (!entry) throw new Error('Città non disponibile: ' + id);
    const cached = snapshot.datasets.get(id);
    if (cached) return cached;
    const pending = this.loadCity(snapshot.manifest, entry);
    snapshot.datasets.set(id, pending);
    try {
      return await pending;
    } catch (error) {
      if (snapshot.datasets.get(id) === pending) snapshot.datasets.delete(id);
      throw error;
    }
  }

  private async loadCity(
    manifest: SeasonManifest,
    entry: SeasonManifest['cities'][number],
  ): Promise<SeasonCityDataset> {
    const text = await this.text(entry.file);
    if (createHash('sha256').update(text).digest('hex') !== entry.sha256) {
      throw new Error('Dati e manifest non coerenti; riprovare dopo 10 minuti: ' + entry.id);
    }
    const value: unknown = JSON.parse(text);
    assertSeasonCity(value);
    if (value.cityId !== entry.id || value.seasons.JJA.years.at(-1)?.year !== manifest.lastYear) {
      throw new Error('Città o intervallo del dataset incoerenti con il manifest.');
    }
    return value;
  }
}
