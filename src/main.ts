import './styles.css';
import { getCity } from './data/cities';
import { assertCityDataset, type CityDataset, type Metric } from './data/schema';
import { parseUrlState, searchForState, type UrlState } from './lib/url-state';
import { metricMeta } from './lib/format';
import { cardsMarkup } from './ui/cards';
import { chartMarkup } from './ui/chart';
import { cityOptions, metricControls } from './ui/controls';
import { datasetCsv, tableMarkup } from './ui/table';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Elemento principale non trovato.');

let state: UrlState = parseUrlState(window.location.search);
let activeRequest = 0;
const cache = new Map<string, CityDataset>();

app.innerHTML = `
  <a class="skip-link" href="#confronto">Vai al confronto</a>
  <main>
    <header class="masthead">
      <div>
        <p class="eyebrow">Prima edizione · Le estati</p>
        <h1>Com’era il clima</h1>
        <p class="subtitle">La memoria delle stagioni</p>
      </div>
      <p class="intro">Come sono cambiate le estati nella tua città?</p>
    </header>

    <section class="control-panel" aria-labelledby="city-heading">
      <div>
        <p class="section-number" aria-hidden="true">01</p>
        <h2 id="city-heading">Scegli una città</h2>
      </div>
      <label class="select-label" for="city-select">Città italiana
        <select id="city-select">${cityOptions(state.city)}</select>
      </label>
      <div class="period-note">
        <strong>60 estati a confronto</strong>
        <span>1961–1990 <i>contro</i> 1991–2020</span>
        <small>Estate = 1 giugno–31 agosto</small>
      </div>
    </section>

    <section id="confronto" class="comparison" aria-labelledby="comparison-heading">
      <div class="section-heading">
        <div><p class="section-number" aria-hidden="true">02</p><h2 id="comparison-heading">Il confronto</h2></div>
        <div class="metric-tabs" role="radiogroup" aria-label="Indicatore">${metricControls(state.metric)}</div>
      </div>
      <p id="loading" class="status" role="status">Caricamento dei dati…</p>
      <div id="error" class="error" role="alert" hidden></div>
      <div id="results" hidden></div>
    </section>
  </main>
`;

const citySelect = document.querySelector<HTMLSelectElement>('#city-select')!;
const results = document.querySelector<HTMLDivElement>('#results')!;
const loading = document.querySelector<HTMLParagraphElement>('#loading')!;
const errorBox = document.querySelector<HTMLDivElement>('#error')!;

function updateMetricButtons(): void {
  document.querySelectorAll<HTMLButtonElement>('[data-metric]').forEach((button) => {
    button.setAttribute('aria-checked', String(button.dataset.metric === state.metric));
  });
}

function render(dataset: CityDataset): void {
  const city = getCity(dataset.cityId);
  if (!city) throw new Error('Città non riconosciuta nel dataset.');
  results.innerHTML = `
    <p class="metric-name">${metricMeta[state.metric].label}</p>
    ${cardsMarkup(dataset, city.name, state.metric)}
    <section class="history" aria-labelledby="history-heading">
      <div class="subheading"><p class="section-number" aria-hidden="true">03</p><h2 id="history-heading">Estate per estate</h2></div>
      ${chartMarkup(dataset, city.name, state.metric)}
    </section>
    <section class="data-section" aria-labelledby="data-heading">
      <div class="data-heading-row">
        <div class="subheading"><p class="section-number" aria-hidden="true">04</p><h2 id="data-heading">I dati annuali</h2></div>
        <div class="actions">
          <button type="button" class="action-button" id="download-csv">Scarica CSV</button>
          <button type="button" class="action-button" id="copy-link">Copia collegamento</button>
        </div>
      </div>
      <p id="action-status" class="sr-only" aria-live="polite"></p>
      <div id="copy-fallback" class="copy-fallback" hidden>
        <label for="share-url">Copia manualmente questo collegamento</label>
        <input id="share-url" type="text" readonly value="${window.location.href}">
      </div>
      ${tableMarkup(dataset, city.name)}
      <p class="data-credit">Dati: <a href="https://open-meteo.com/en/docs/historical-weather-api" rel="noreferrer">Open-Meteo Historical Weather API</a>, modello ERA5 · <a href="https://creativecommons.org/licenses/by/4.0/" rel="noreferrer">CC BY 4.0</a>. Aggregazioni del progetto.</p>
    </section>
    <details class="methodology">
      <summary>Come leggere questi dati</summary>
      <div class="methodology-grid">
        <div><h3>Che cosa confrontiamo</h3><p>Due periodi consecutivi di 30 estati: 1961–1990 e 1991–2020. Ogni estate comprende i 92 giorni dal 1 giugno al 31 agosto.</p></div>
        <div><h3>Da dove arrivano i valori</h3><p>ERA5 è una rianalisi su griglia di circa 0,25°. La città identifica la cella più vicina, senza correzione altimetrica locale: non è una stazione né la media del comune.</p></div>
        <div><h3>Come sono calcolati</h3><p>Temperatura media dei 92 valori giornalieri; conteggio delle massime strettamente superiori a 30 °C; somma delle precipitazioni. Le medie di periodo sono calcolate sulle 30 estati.</p></div>
      </div>
    </details>
    <footer class="site-footer">
      <p>Progetto open source · <a href="https://github.com/giubud/comera-il-clima">Codice e documentazione su GitHub</a></p>
    </footer>
  `;
  results.hidden = false;
  loading.hidden = true;
  errorBox.hidden = true;
  document.querySelector<HTMLButtonElement>('#download-csv')?.addEventListener('click', () => {
    const blob = new Blob([datasetCsv(dataset)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `comera-il-clima-${dataset.cityId}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
    const status = document.querySelector('#action-status');
    if (status) status.textContent = `CSV di ${city.name} preparato.`;
  });
  document.querySelector<HTMLButtonElement>('#copy-link')?.addEventListener('click', async () => {
    const button = document.querySelector<HTMLButtonElement>('#copy-link')!;
    const fallback = document.querySelector<HTMLDivElement>('#copy-fallback')!;
    const input = document.querySelector<HTMLInputElement>('#share-url')!;
    const status = document.querySelector('#action-status');
    input.value = window.location.href;
    try {
      await navigator.clipboard.writeText(window.location.href);
      button.textContent = 'Collegamento copiato';
      fallback.hidden = true;
      if (status) status.textContent = 'Collegamento copiato negli appunti.';
    } catch {
      fallback.hidden = false;
      input.focus();
      input.select();
      if (status) status.textContent = 'Copia automatica non disponibile: il collegamento è selezionato.';
    }
  });
}

async function loadCity(cityId: string): Promise<void> {
  const requestId = ++activeRequest;
  results.hidden = true;
  errorBox.hidden = true;
  loading.hidden = false;
  loading.textContent = `Caricamento dei dati di ${getCity(cityId)?.name ?? 'questa città'}…`;
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
    loading.hidden = true;
    results.hidden = true;
    errorBox.hidden = false;
    const message = error instanceof Error ? error.message : 'Errore inatteso.';
    errorBox.innerHTML = `<p>Non è stato possibile caricare i dati. ${message}</p><button type="button" id="retry">Riprova</button>`;
    document.querySelector<HTMLButtonElement>('#retry')?.addEventListener('click', () => void loadCity(state.city));
  }
}

function persistState(): void {
  history.replaceState(null, '', `${window.location.pathname}${searchForState(state)}`);
}

citySelect.addEventListener('change', () => {
  state = { ...state, city: citySelect.value };
  persistState();
  void loadCity(state.city);
});

document.querySelector('.metric-tabs')?.addEventListener('click', (event) => {
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('[data-metric]');
  if (!button) return;
  state = { ...state, metric: button.dataset.metric as Metric };
  updateMetricButtons();
  persistState();
  const dataset = cache.get(state.city);
  if (dataset) render(dataset);
});

void loadCity(state.city);
