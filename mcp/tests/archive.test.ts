import { describe, expect, it } from 'vitest';
import { ArchiveStore } from '../src/archive';
import { CACHE_MS, DATA_URL } from '../src/config';
import { changeManifest, fixture, replaceCity } from './helpers';

describe('cache in memoria e integrità dell’archivio', () => {
  it('deduplica chiamate simultanee e rinnova lo snapshot dopo 10 minuti', async () => {
    const { fetcher, files } = fixture();
    let time = 0;
    const store = new ArchiveStore({ fetch: fetcher, now: () => time });
    const [a, b] = await Promise.all([store.snapshot(), store.snapshot()]);
    expect(a).toBe(b);
    await Promise.all([store.city(a, 'roma'), store.city(b, 'roma')]);
    expect(fetcher).toHaveBeenCalledTimes(2);
    time = CACHE_MS - 1;
    expect(await store.snapshot()).toBe(a);
    changeManifest(files, (m) => {
      m.dataVersion = '0000000000000000';
    });
    time = CACHE_MS;
    const fresh = await store.snapshot();
    expect(fresh.manifest.dataVersion).toBe('0000000000000000');
    expect(a.manifest.dataVersion).not.toBe(fresh.manifest.dataVersion);
    await store.city(fresh, 'roma');
    expect(fetcher).toHaveBeenCalledTimes(4);
    expect(fetcher).toHaveBeenCalledWith(
      DATA_URL + 'roma.json',
      expect.objectContaining({
        redirect: 'error',
        headers: { Accept: 'application/json' },
      }),
    );
  });

  it('non conserva in cache un fallimento di rete', async () => {
    const { fetcher } = fixture();
    fetcher.mockRejectedValueOnce(new Error('offline'));
    const store = new ArchiveStore({ fetch: fetcher });
    await expect(store.snapshot()).rejects.toThrow('non raggiungibile');
    expect((await store.snapshot()).manifest.schemaVersion).toBe(2);
  });

  it('non sostituisce una cache scaduta con una risposta HTTP errata', async () => {
    const { fetcher } = fixture();
    let time = 0;
    const store = new ArchiveStore({ fetch: fetcher, now: () => time });
    await store.snapshot();
    time = CACHE_MS;
    fetcher.mockResolvedValueOnce(new Response('overloaded', { status: 503 }));
    await expect(store.snapshot()).rejects.toThrow('HTTP 503');
    await expect(store.snapshot()).resolves.toHaveProperty('manifest.schemaVersion', 2);
  });

  it('rifiuta JSON non validi o di una versione non supportata', async () => {
    const { fetcher, files } = fixture();
    files.set('manifest.json', '<html>errore</html>');
    const store = new ArchiveStore({ fetch: fetcher });
    await expect(store.snapshot()).rejects.toThrow();
    files.set('manifest.json', '{"schemaVersion":99}');
    await expect(store.snapshot()).rejects.toThrow('non valido');
  });

  it('rifiuta un dataset che non corrisponde all’hash e consente di riprovare', async () => {
    const { fetcher, files } = fixture();
    const original = files.get('roma.json');
    if (!original) throw new Error('Dato di prova mancante.');
    files.set('roma.json', original + ' ');
    const store = new ArchiveStore({ fetch: fetcher });
    const snapshot = await store.snapshot();
    await expect(store.city(snapshot, 'roma')).rejects.toThrow('non coerenti');
    files.set('roma.json', original);
    await expect(store.city(snapshot, 'roma')).resolves.toHaveProperty('cityId', 'roma');
  });

  it('controlla anche lo schema dopo l’hash e non scarica città inesistenti', async () => {
    const { fetcher, files } = fixture();
    replaceCity(files, 'roma', '{"schemaVersion":2,"cityId":"roma"}');
    const store = new ArchiveStore({ fetch: fetcher });
    const snapshot = await store.snapshot();
    await expect(store.city(snapshot, 'roma')).rejects.toThrow();
    await expect(store.city(snapshot, 'atlantide')).rejects.toThrow('non disponibile');
    expect(fetcher).toHaveBeenCalledTimes(2);
  });
});
