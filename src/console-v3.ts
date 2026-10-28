import { createDataLoader } from './app/data-loader';
import { bindEvents } from './app/events';
import { createAppState } from './app/state';
import { applyAppearance } from './lib/theme';
import { pageMarkup } from './ui/layout';
import { createMapRenderer } from './ui/map';
import './v3.css';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Elemento principale non trovato.');
const root: HTMLDivElement = app;
const model = createAppState();
const loader = createDataLoader(model, render);
const mapRenderer = createMapRenderer(root, model);

function render(): void {
  if (!model.compact || !model.manifest) return;
  mapRenderer.prepare();
  root.innerHTML = pageMarkup(model);
  mapRenderer.draw();
  mapRenderer.observe();
}

async function start(): Promise<void> {
  applyAppearance(model.theme, model.sort);
  root.innerHTML = [
    '<div class="initial-status" role="status">Caricamento della ',
    'console climatica…</div>',
  ].join('');
  try {
    await loader.loadInitialData();
    render();
    void loader.loadCity(model.state.city);
    try {
      await loader.loadGeography();
      mapRenderer.draw();
    } catch {
      const canvas = root.querySelector('#map-canvas');
      if (canvas)
        canvas.innerHTML = [
          '<p class="map-fallback">Mappa non disponibile. I dati e le ',
          'tabelle restano utilizzabili.</p>',
        ].join('');
    }
  } catch (error) {
    root.innerHTML = [
      '<div class="initial-status error" role="alert">Non è stato ',
      'possibile avviare la console. ',
      String(error instanceof Error ? error.message : 'Errore inatteso.'),
      '</div>',
    ].join('');
  }
}

bindEvents(root, model, render, loader.loadCity);

void start();
