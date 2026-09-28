import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { feature } from 'topojson-client';
import type { GeometryCollection, Topology } from 'topojson-specification';

// Build-time only. The committed GeoJSON is the sole geography fetched by the browser.
const source = 'https://cdn.jsdelivr.net/npm/world-atlas@2.0.2/countries-110m.json';
const response = await fetch(source);
if (!response.ok) throw new Error(`Download world-atlas fallito: HTTP ${response.status}.`);
const topology = await response.json() as Topology<{ countries: GeometryCollection }>;
const countries = topology.objects.countries;
if (!countries || countries.type !== 'GeometryCollection') throw new Error('Topologia world-atlas non valida.');
const ids = new Set(['380', '250', '756', '040', '705', '191', '070', '499', '008', '300', '788', '470']);
const selected = { ...countries, geometries: countries.geometries.filter((geometry) => ids.has(String(geometry.id).padStart(3, '0'))) };
if (!selected.geometries.some((geometry) => String(geometry.id).padStart(3, '0') === '380')) throw new Error('Confine Italia assente.');
const geo = feature(topology, selected);
const directory = join(process.cwd(), 'public', 'geo');
await mkdir(directory, { recursive: true });
await writeFile(join(directory, 'italia-110m.json'), `${JSON.stringify(geo)}\n`, 'utf8');
console.log(`Geografia locale generata: ${selected.geometries.length} paesi, fonte world-atlas 2.0.2 / Natural Earth.`);
