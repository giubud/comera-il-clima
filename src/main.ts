import './styles.css';
import { getCity } from './data/cities';
import { assertCityDataset, type CityDataset, type Manifest, type Metric } from './data/schema';
import { parseUrlState, searchForState, type UrlState } from './lib/url-state';
import { applyAppearance, loadAppearance, type Density, type Theme } from './lib/theme';
import { cardsMarkup } from './ui/cards';
import { chartMarkup } from './ui/chart';
import { metricControls } from './ui/controls';
import { railMarkup } from './ui/rail';
import { rankingMarkup } from './ui/ranking';
import { stripesMarkup } from './ui/stripes';
import { datasetCsv, tableMarkup } from './ui/table';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Elemento principale non trovato.');

let state: UrlState = parseUrlState(window.location.search);
let { theme, density } = loadAppearance();
let manifest: Manifest | null = null;
let currentDataset: CityDataset | null = null;
let activeRequest = 0;
const cache = new Map<string, CityDataset>();

function appearanceButton(kind: 'theme' | 'density', value: string, label: string, active: boolean): string {
  return `<button type="button" class="tab" data-${kind}="${value}" aria-pressed="${active}">${label}</button>`;
}

app.innerHTML = `
  <a class="skip-link" href="#console">Vai ai dati</a>
  <header class="topbar">
    <div class="brand"><span>C</span><strong>Com’era il clima</strong><small>ERA5 · JJA · 1961—2020</small></div>
    <div class="toolbar">
      <div class="toolbar-group"><span>Densità</span><div role="group" aria-label="Densità" id="density-controls"></div></div>
      <div class="toolbar-group"><span>Tema</span><div role="group" aria-label="Tema" id="theme-controls"></div></div>
      <button type="button" class="download" id="download-csv" disabled>CSV ↓</button>
    </div>
  </header>
  <main id="console"><div class="initial-status" role="status">Caricamento della console climatica…</div></main>
  <footer class="site-footer"><span>Com’era il clima — la memoria delle stagioni</span><span>10 città · 600 estati · aggregazioni del progetto</span></footer>
`;

const consoleRoot = document.querySelector<HTMLElement>('#console')!;
const download = document.querySelector<HTMLButtonElement>('#download-csv')!;

function updateAppearance(): void {
  applyAppearance(theme, density);
  document.querySelector('#theme-controls')!.innerHTML =
    appearanceButton('theme', 'light', 'Chiaro', theme === 'light') + appearanceButton('theme', 'dark', 'Scuro', theme === 'dark');
  document.querySelector('#density-controls')!.innerHTML =
    appearanceButton('density', 'comfortable', 'Comoda', density === 'comfortable') + appearanceButton('density', 'compact', 'Compatta', density === 'compact');
}

function methodsMarkup(): string {
  return `<section class="methods panel" aria-labelledby="methods-heading"><div class="panel-bar"><h3 id="methods-heading">Metodo e limiti</h3></div>
    <div class="methods-grid">
      <article><h4>Cosa confrontiamo</h4><p>Due trentenni consecutivi, 1961—1990 e 1991—2020. Ogni estate copre i 92 giorni dal 1 giugno al 31 agosto.</p></article>
      <article><h4>Da dove arrivano</h4><p>ERA5 è una rianalisi su griglia di circa 0,25°. Ogni città usa la cella più vicina, senza correzione altimetrica: non è una stazione meteo.</p></article>
      <article><h4>Come sono calcolati</h4><p>Media dei 92 valori giornalieri, conteggio delle massime oltre 30 °C, somma delle precipitazioni. Le medie di periodo sono su 30 estati.</p></article>
      <article class="sources"><h4>Fonti</h4><p><a href="https://open-meteo.com/en/docs/historical-weather-api" rel="noreferrer">Open-Meteo Historical Weather API</a>, modello ERA5, <a href="https://creativecommons.org/licenses/by/4.0/" rel="noreferrer">CC BY 4.0</a>. Codice su <a href="https://github.com/giubud/comera-il-clima" rel="noreferrer">GitHub</a>.</p></article>
    </div>
  </section>`;
}

function loadingMarkup(source: Manifest): string {
  return `<div class="dashboard-grid">${railMarkup(source, state.city)}<section class="kpi-panel panel loading-panel" aria-live="polite"><div class="panel-bar"><h2>${getCity(state.city)?.name} · estate</h2></div><p>Caricamento dei dati…</p><div class="placeholder"></div></section></div>`;
}

function render(dataset: CityDataset): void {
  if (!manifest) return;
  const city = getCity(dataset.cityId);
  if (!city) throw new Error('Città non riconosciuta nel dataset.');
  currentDataset = dataset;
  consoleRoot.innerHTML = `
    <div class="dashboard-grid">
      ${railMarkup(manifest, state.city)}
      <section class="kpi-panel panel" aria-labelledby="kpi-heading">
        <div class="panel-bar kpi-bar"><h2 id="kpi-heading">${city.name}<span> · estate</span></h2><div class="metric-tabs" role="radiogroup" aria-label="Indicatore">${metricControls(state.metric)}</div></div>
        ${cardsMarkup(dataset, state.metric)}
        ${stripesMarkup(dataset, state.metric)}
      </section>
    </div>
    ${chartMarkup(dataset, city.name, state.metric)}
    <div class="lower-grid">${rankingMarkup(manifest, state.metric, state.city)}${tableMarkup(dataset, city.name)}</div>
    ${methodsMarkup()}
  `;
  download.disabled = false;
}

function persistState(): void {
  history.replaceState(null, '', `${window.location.pathname}${searchForState(state)}`);
}

async function loadCity(cityId: string): Promise<void> {
  if (!manifest) return;
  const requestId = ++activeRequest;
  currentDataset = null;
  download.disabled = true;
  consoleRoot.innerHTML = loadingMarkup(manifest);
  try {
    let dataset = cache.get(cityId);
    if (!dataset) {
      const response = await fetch(`${import.meta.env.BASE_URL}data/${cityId}.json`);
      if (!response.ok) throw new Error(`Dati non disponibili (${response.status}).`);
      const value: unknown = await response.json();
      assertCityDataset(value);
      if (value.cityId !== cityId) throw new Error('Il file ricevuto appartiene a un’altra città.');
      dataset = value;
      cache.set(cityId, dataset);
    }
    if (requestId !== activeRequest || state.city !== cityId) return;
    render(dataset);
  } catch (error) {
    if (requestId !== activeRequest) return;
    const message = error instanceof Error ? error.message : 'Errore inatteso.';
    consoleRoot.innerHTML = `<div class="dashboard-grid">${railMarkup(manifest, state.city)}<section class="kpi-panel panel error" role="alert"><div class="panel-bar"><h2>Dati non disponibili</h2></div><p>Non è stato possibile caricare i dati. ${message}</p><button type="button" id="retry">Riprova</button></section></div>`;
  }
}

app.addEventListener('click', (event) => {
  const target = event.target as HTMLElement;
  const cityButton = target.closest<HTMLButtonElement>('[data-city]');
  if (cityButton) {
    state = { ...state, city: cityButton.dataset.city! };
    persistState();
    void loadCity(state.city);
    return;
  }
  const metricButton = target.closest<HTMLButtonElement>('[data-metric]');
  if (metricButton && currentDataset) {
    state = { ...state, metric: metricButton.dataset.metric as Metric };
    persistState();
    render(currentDataset);
    return;
  }
  const themeButton = target.closest<HTMLButtonElement>('button[data-theme]');
  if (themeButton) {
    theme = themeButton.dataset.theme as Theme;
    updateAppearance();
    return;
  }
  const densityButton = target.closest<HTMLButtonElement>('button[data-density]');
  if (densityButton) {
    density = densityButton.dataset.density as Density;
    updateAppearance();
    return;
  }
  if (target.closest('#retry')) void loadCity(state.city);
});

download.addEventListener('click', () => {
  if (!currentDataset) return;
  const url = URL.createObjectURL(new Blob([datasetCsv(currentDataset)], { type: 'text/csv;charset=utf-8' }));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `comera-il-clima-${currentDataset.cityId}.csv`;
  anchor.click();
  URL.revokeObjectURL(url);
});

async function start(): Promise<void> {
  updateAppearance();
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}data/manifest.json`);
    if (!response.ok) throw new Error(`Manifest non disponibile (${response.status}).`);
    manifest = await response.json() as Manifest;
    if (manifest.schemaVersion !== 1 || manifest.cities.length !== 10 || manifest.cities.some((city) => !city.periods)) throw new Error('Manifest non valido.');
    await loadCity(state.city);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Errore inatteso.';
    consoleRoot.innerHTML = `<section class="initial-status error" role="alert">Non è stato possibile avviare la console. ${message}</section>`;
  }
}

void start();
