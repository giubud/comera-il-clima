import type { FeatureCollection, Geometry } from 'geojson';
import { cities } from '../data/cities';
import { assertCityDataset, assertSummers, type CityDataset, type Manifest } from '../data/schema';
import type { AppState } from './state';
export function createDataLoader(model: AppState, render: () => void) {
  let requestNumber = 0;
  const cityCache = new Map<string, CityDataset>();
  async function loadCity(id: string): Promise<void> {
    const request = ++requestNumber;
    model.cityDataset = null;
    model.cityError = false;
    render();
    try {
      let data = cityCache.get(id);
      if (!data) {
        const response = await fetch(`${import.meta.env.BASE_URL}data/${id}.json`);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const value: unknown = await response.json();
        assertCityDataset(value);
        if (value.cityId !== id) throw new Error('Città inattesa nel dataset.');
        data = value;
        cityCache.set(id, data);
      }
      if (request === requestNumber) {
        model.cityDataset = data;
        render();
      }
    } catch {
      if (request === requestNumber) {
        model.cityError = true;
        render();
      }
    }
  }
  async function loadInitialData(): Promise<void> {
    const [manifestResponse, summersResponse] = await Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/manifest.json`),
      fetch(`${import.meta.env.BASE_URL}data/summers.json`),
    ]);
    if (!manifestResponse.ok || !summersResponse.ok) throw new Error('Dati non disponibili.');
    model.manifest = (await manifestResponse.json()) as Manifest;
    const value: unknown = await summersResponse.json();
    if (model.manifest.schemaVersion !== 1 || model.manifest.cities.length !== 10)
      throw new Error('Manifest non valido.');
    assertSummers(
      value,
      cities.map((city) => city.id),
    );
    model.compact = value;
  }
  async function loadGeography(): Promise<void> {
    const response = await fetch(`${import.meta.env.BASE_URL}geo/italia-110m.json`);
    if (!response.ok) throw new Error('Confini locali non disponibili.');
    model.geography = (await response.json()) as FeatureCollection<Geometry>;
    if (!Array.isArray(model.geography.features)) throw new Error('Geografia non valida.');
  }
  return { loadCity, loadInitialData, loadGeography };
}
