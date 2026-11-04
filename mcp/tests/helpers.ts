import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { vi } from 'vitest';
import { cities } from '../../src/data/cities';
import { assertSeasonManifest, type SeasonManifest } from '../../src/data/schema';
import { DATA_URL } from '../src/config';

const directory = new URL('../../public/data/', import.meta.url);
const manifestText = readFileSync(new URL('manifest.json', directory), 'utf8');
const value: unknown = JSON.parse(manifestText);
assertSeasonManifest(
  value,
  cities.map(({ id }) => id),
);
export const manifest = value;
const original = new Map<string, string>([
  ['manifest.json', manifestText],
  ...manifest.cities.map(
    ({ file }) => [file, readFileSync(new URL(file, directory), 'utf8')] as const,
  ),
]);

export function fixture() {
  const files = new Map(original);
  const fetcher = vi.fn<typeof fetch>(async (input) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;
    if (!url.startsWith(DATA_URL)) throw new Error('Accesso a una fonte non pubblicata.');
    const text = files.get(url.slice(DATA_URL.length));
    return new Response(text ?? 'Non trovato', {
      status: text === undefined ? 404 : 200,
      headers: { 'Content-Type': 'application/json' },
    });
  });
  return { files, fetcher };
}

export function changeManifest(files: Map<string, string>, modify: (m: SeasonManifest) => void) {
  const copy = structuredClone(manifest);
  modify(copy);
  files.set('manifest.json', JSON.stringify(copy));
}

export function replaceCity(files: Map<string, string>, id: string, text: string) {
  files.set(id + '.json', text);
  changeManifest(files, (m) => {
    const entry = m.cities.find((city) => city.id === id);
    if (!entry) throw new Error('Città di prova mancante.');
    entry.sha256 = createHash('sha256').update(text).digest('hex');
  });
}
