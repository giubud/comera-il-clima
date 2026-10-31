import type { Model } from './model';
import type { CompactSeason, SeasonCityDataset, SeasonManifest, Season } from '../data/schema';
import { assertSeasonCompact, assertSeasonCity } from '../data/schema';
import { cities } from '../data/cities';
import { parseSeasonState } from '../lib/season-url-state';
import { loadAppearance, applyAppearance } from '../lib/theme';
import { bindSeasonEvents } from './events';
import { pageMarkup } from './views';
import { drawMap } from './map';
export async function startSeasonConsole(
  root: HTMLDivElement,
  manifest: SeasonManifest,
): Promise<void> {
  const appearance = loadAppearance();
  const model: Model = {
    state: parseSeasonState(location.search),
    ...appearance,
    manifest,
    compact: null,
    dataset: null,
    geography: null,
    error: null,
  };
  applyAppearance(model.theme, model.sort);
  let generation = 0,
    cityGeneration = 0,
    observer: ResizeObserver | undefined,
    resizeTimer: number | undefined;
  const summaries = new Map<Season, CompactSeason>(),
    cityCache = new Map<string, SeasonCityDataset>();
  const url = (file: string) =>
    import.meta.env.BASE_URL + 'data/' + file + '?v=' + manifest.dataVersion;
  function render() {
    observer?.disconnect();
    window.clearTimeout(resizeTimer);
    root.innerHTML = pageMarkup(model);
    drawMap(root, model);
    const canvas = root.querySelector('#season-map');
    if (canvas) {
      let width = canvas.clientWidth;
      observer = new ResizeObserver(() => {
        if (canvas.clientWidth === width) return;
        width = canvas.clientWidth;
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => drawMap(root, model), 80);
      });
      observer.observe(canvas);
    }
  }
  async function loadCity() {
    const request = ++cityGeneration,
      id = model.state.city;
    model.dataset = null;
    render();
    try {
      let data = cityCache.get(id);
      if (!data) {
        const response = await fetch(url(id + '.json'));
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const value: unknown = await response.json();
        assertSeasonCity(value);
        if (value.cityId !== id) throw new Error('Città errata.');
        data = value;
        cityCache.set(id, data);
      }
      if (request === cityGeneration) {
        model.dataset = data;
        render();
      }
    } catch {
      if (request === cityGeneration) {
        model.error = 'Non è stato possibile caricare i dati di dettaglio per il CSV.';
        render();
      }
    }
  }
  async function loadSeason() {
    const request = ++generation,
      season = model.state.season;
    cityGeneration++;
    model.compact = null;
    model.dataset = null;
    model.error = null;
    render();
    try {
      let data = summaries.get(season);
      if (!data) {
        const response = await fetch(url('seasons/' + season + '.json'));
        if (!response.ok)
          throw new Error('Dati stagionali non disponibili: HTTP ' + response.status);
        const value: unknown = await response.json();
        assertSeasonCompact(
          value,
          cities.map((c) => c.id),
        );
        if (value.season !== season) throw new Error('Stagione inattesa nella risposta.');
        data = value;
        summaries.set(season, data);
      }
      if (request !== generation) return;
      model.compact = data;
      render();
      void loadCity();
    } catch (error) {
      if (request === generation) {
        model.error = error instanceof Error ? error.message : 'Dati stagionali non disponibili.';
        render();
      }
    }
  }
  bindSeasonEvents(root, model, render, loadSeason, loadCity);
  void fetch(import.meta.env.BASE_URL + 'geo/italia-110m.json')
    .then(async (response) => {
      if (!response.ok) throw new Error('Geografia non disponibile.');
      const data = (await response.json()) as Model['geography'];
      if (!data || !Array.isArray(data.features)) throw new Error('Geografia non valida.');
      model.geography = data;
      drawMap(root, model);
    })
    .catch(() => {
      model.geography = null;
      drawMap(root, model);
    });
  await loadSeason();
}
