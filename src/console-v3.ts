import './v3.css';
import { geoMercator, geoPath } from 'd3-geo';
import type { FeatureCollection, Geometry } from 'geojson';
import { cities, getCity } from './data/cities';
import { expandSummers } from './data/compact';
import { assertCityDataset, assertSummers, metrics, type CityDataset, type CompactSummers, type Manifest, type Metric, type Summer } from './data/schema';
import { deltaClasses, movingAverage, rangeStats, warmth, zLevel } from './lib/aggregate';
import { formatSigned, formatValue, metricMeta } from './lib/format';
import { applyAppearance, loadAppearance, type Sort, type Theme } from './lib/theme';
import { parseUrlState, periodPresets, periodWarnings, searchForState, type Period, type UrlState } from './lib/url-state';
import { datasetCsv } from './ui/table';
import { legalMarkup } from './ui/legal';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) throw new Error('Elemento principale non trovato.');
const root: HTMLDivElement = app;
let state: UrlState = parseUrlState(location.search);
let { theme, sort } = loadAppearance();
let compact: CompactSummers | null = null;
let manifest: Manifest | null = null;
let geography: FeatureCollection<Geometry> | null = null;
let cityDataset: CityDataset | null = null;
let cityError = false;
let requestNumber = 0;
let mapObserver: ResizeObserver | null = null;
const cityCache = new Map<string, CityDataset>();
const cityYears = (id: string): Summer[] => expandSummers(compact!.cities[id]!);
const rangeLabel = ([start, end]: Period): string => `${start}–${end}`;
const valueWithUnit = (
  value: number,
  metric: Metric,
  kind: 'annual' | 'period' = 'annual',
): string => `${formatValue(value, { metric, kind })} ${metricMeta[metric].unit}`;
const delta = (id: string, metric: Metric): number => rangeStats(cityYears(id), metric, ...state.b).mean - rangeStats(cityYears(id), metric, ...state.a).mean;
const tone = (change: number, metric: Metric): string => warmth(change, metric) >= 0 ? 'warm' : 'cool';
function selectedYear(): number {
  if (state.year !== null) return state.year;
  const summers = cityYears(state.city);
  const baseline = rangeStats(summers, state.metric, ...state.a).mean;
  return summers.reduce((best, row) => warmth(row[state.metric] - baseline, state.metric) > warmth(best[state.metric] - baseline, state.metric) ? row : best).year;
}

function orderedCities(): typeof cities[number][] {
  const items = [...cities];
  if (sort === 'alpha') return items.sort((a, b) => a.name.localeCompare(b.name, 'it'));
  if (sort === 'delta') return items.sort((a, b) => warmth(delta(b.id, state.metric), state.metric) - warmth(delta(a.id, state.metric), state.metric));
  return items;
}

function logo(): string {
  return `<span class="logo-mark" aria-hidden="true">${['#294f79','#5b8fa9','#bac7bb','#e8b272','#ce7650','#a7433d'].map((color) => `<i style="background:${color}"></i>`).join('')}</span>`;
}

function headerMarkup(): string {
  return `<a class="skip-link" href="#console">Vai ai dati</a><header class="topbar">
    <div class="brand">${logo()}<span><strong>Com’era il clima</strong><small>Atlante delle estati italiane · ERA5 1961—2020</small></span></div>
    <div class="top-actions"><span class="edition">10 città · 600 estati</span><div class="theme-switch" role="group" aria-label="Tema">
      ${(['auto','light','dark'] as Theme[]).map((value) => `<button type="button" data-theme="${value}" aria-pressed="${theme === value}">${{auto:'Auto',light:'Chiaro',dark:'Scuro'}[value]}</button>`).join('')}
    </div></div></header>`;
}

function periodFields(key: 'a' | 'b', period: Period): string {
  return `<fieldset class="period-fields"><legend>Periodo ${key.toUpperCase()}</legend><label>Dal <select data-range="${key}-start" aria-label="Inizio periodo ${key.toUpperCase()}">${Array.from({length:60},(_,i)=>1961+i).map((year)=>`<option value="${year}" ${year===period[0]?'selected':''}>${year}</option>`).join('')}</select></label><label>al <select data-range="${key}-end" aria-label="Fine periodo ${key.toUpperCase()}">${Array.from({length:60},(_,i)=>1961+i).map((year)=>`<option value="${year}" ${year===period[1]?'selected':''}>${year}</option>`).join('')}</select></label></fieldset>`;
}

function sidebarMarkup(): string {
  const warnings = periodWarnings(state.a, state.b);
  return `<aside class="sidebar panel" aria-label="Città"><div class="sidebar-section"><p class="eyebrow">01 / Confronto</p><h2>Scegli i periodi</h2>
      <p class="quiet">Confronta le medie delle estati, dal 1961 al 2020.</p>${periodFields('a',state.a)}${periodFields('b',state.b)}
      <label class="preset-label">Confronti rapidi<select id="period-preset" aria-label="Confronto rapido"><option value="">Personalizzato</option><option value="standard" ${state.a.join()===periodPresets.standard!.a.join()&&state.b.join()===periodPresets.standard!.b.join()?'selected':''}>1961–1990 / 1991–2020</option><option value="decades">Primo / ultimo decennio</option><option value="twenty">1961–1980 / 2001–2020</option></select></label>
      ${warnings.length ? `<div class="period-warning" role="status">${warnings.join(' ')}</div>` : ''}</div>
    <div class="sidebar-section"><div class="section-heading"><div><p class="eyebrow">02 / Luoghi</p><h2>Dieci città</h2></div><select id="city-sort" aria-label="Ordina città"><option value="north" ${sort==='north'?'selected':''}>Nord → sud</option><option value="alpha" ${sort==='alpha'?'selected':''}>A → Z</option><option value="delta" ${sort==='delta'?'selected':''}>Δ maggiore</option></select></div>
      <div class="city-list">${orderedCities().map((city,index) => `<button type="button" data-city="${city.id}" class="city-item ${state.city===city.id?'active':''}" aria-pressed="${state.city===city.id}"><span class="city-index">${String(index+1).padStart(2,'0')}</span><strong>${city.name}</strong><span class="city-delta ${tone(delta(city.id,state.metric),state.metric)}">${formatSigned(delta(city.id,state.metric))}</span></button>`).join('')}</div></div></aside>`;
}

function heroMarkup(): string {
  const city = getCity(state.city)!;
  const primary = delta(city.id,state.metric);
  return `<section class="hero panel"><div><p class="eyebrow">Osservatorio / Estate italiana</p><h1>${city.name}<span> · estate</span></h1><p>Come sono cambiate le estati tra <strong>${rangeLabel(state.a)}</strong> e <strong>${rangeLabel(state.b)}</strong>? Tre segnali, una storia da esplorare.</p></div>
    <div class="hero-number ${tone(primary,state.metric)}"><span>Variazione · ${metricMeta[state.metric].shortLabel}</span><strong>${formatSigned(primary)} <small>${metricMeta[state.metric].unit}</small></strong><em>Media B meno media A</em></div></section>`;
}

function metricTabs(): string {
  return `<div class="metric-tabs" role="radiogroup" aria-label="Indicatore">${metrics.map((metric) => `<button type="button" role="radio" aria-checked="${state.metric===metric}" data-metric="${metric}">${metricMeta[metric].shortLabel}</button>`).join('')}</div>`;
}

function cardsMarkup(): string {
  const summers = cityYears(state.city);
  return `<section class="metric-section panel" aria-label="Indicatori"><div class="panel-bar"><div><p class="eyebrow">Il confronto</p><h2>Tre misure dell’estate</h2></div><span class="quiet">${rangeLabel(state.a)} → ${rangeLabel(state.b)}</span></div>${metricTabs()}
    <div class="metric-cards">${metrics.map((metric) => {
      const a=rangeStats(summers,metric,...state.a), b=rangeStats(summers,metric,...state.b), change=b.mean-a.mean;
      return `<button type="button" class="metric-card ${state.metric===metric?'selected':''}" data-metric="${metric}" aria-label="${metricMeta[metric].label}: ${formatSigned(change)} ${metricMeta[metric].unit}"><span>${metricMeta[metric].label}</span><strong class="${tone(change,metric)}">${formatSigned(change)} <small>${metricMeta[metric].unit}</small></strong><span class="metric-periods">A ${formatValue(a.mean)} <i>→</i> B ${formatValue(b.mean)}</span><small>σ periodo A: ${formatValue(a.sd)} · ${Math.abs(change)>a.sd?'oltre':'entro'} 1 σ</small></button>`;
    }).join('')}</div></section>`;
}

function linePath(values: readonly (number | null)[], lo: number, hi: number): string {
  return values.map((value,index) => value===null?'':`${index===0||values[index-1]===null?'M':'L'}${42+index*12.2},${214-(value-lo)/(hi-lo)*174}`).join(' ');
}

function chartMarkup(): string {
  const series=cityYears(state.city).map((item)=>item[state.metric]);
  const other=state.vs?cityYears(state.vs).map((item)=>item[state.metric]):null;
  const all=[...series,...(other??[])]; const lo=Math.min(...all)-1, hi=Math.max(...all)+1;
  const smooth=state.smooth?movingAverage(series):null;
  const otherSmooth=state.smooth&&other?movingAverage(other):null;
  const a=rangeStats(cityYears(state.city),state.metric,...state.a);
  const b=rangeStats(cityYears(state.city),state.metric,...state.b);
  const y=(value:number)=>214-(value-lo)/(hi-lo)*174;
  return `<section class="chart-panel panel" aria-labelledby="chart-heading"><div class="panel-bar"><div><p class="eyebrow">03 / Cronologia</p><h2 id="chart-heading">Sessant’anni, estate per estate</h2></div><div class="chart-controls"><label>Confronta con <select id="compare-city" aria-label="Confronta con un'altra città"><option value="">Nessuna città</option>${cities.filter((city)=>city.id!==state.city).map((city)=>`<option value="${city.id}" ${state.vs===city.id?'selected':''}>${city.name}</option>`).join('')}</select></label><label class="check"><input id="smooth" type="checkbox" ${state.smooth?'checked':''}> Media mobile (5)</label></div></div>
    <div class="chart-wrap"><svg class="chart-svg" viewBox="0 0 820 246" role="img" aria-label="Serie annuale ${metricMeta[state.metric].label} di ${getCity(state.city)!.name}">
    <rect x="42" y="25" width="${(state.a[1]-state.a[0]+1)*12.2}" height="189" class="period-shade a" transform="translate(${(state.a[0]-1961)*12.2} 0)"/><rect x="42" y="25" width="${(state.b[1]-state.b[0]+1)*12.2}" height="189" class="period-shade b" transform="translate(${(state.b[0]-1961)*12.2} 0)"/>
    ${[0,1,2,3,4].map((i)=>{const value=lo+(hi-lo)*i/4;return `<line x1="42" y1="${y(value)}" x2="765" y2="${y(value)}" class="gridline"/><text x="5" y="${y(value)+4}" class="axis-label">${formatValue(value)}</text>`;}).join('')}
    <path d="${linePath(series,lo,hi)}" class="data-line"/>${other?`<path d="${linePath(other,lo,hi)}" class="compare-line"/>`:''}${smooth?`<path d="${linePath(smooth,lo,hi)}" class="smooth-line"/>`:''}${otherSmooth?`<path d="${linePath(otherSmooth,lo,hi)}" class="compare-smooth-line"/>`:''}
    ${series.map((value,index)=>`<circle cx="${42+index*12.2}" cy="${y(value)}" r="${1961+index===selectedYear()?5:3}" class="chart-point ${1961+index===selectedYear()?'active':''}" data-year="${1961+index}" tabindex="0" role="button" aria-label="Estate ${1961+index}: ${valueWithUnit(value,state.metric)}"><title>${1961+index}: ${valueWithUnit(value,state.metric)}</title></circle>`).join('')}
    ${[1961,1970,1980,1990,2000,2010,2020].map((year)=>`<text x="${42+(year-1961)*12.2}" y="237" text-anchor="middle" class="axis-label">${year}</text>`).join('')}</svg></div>
    <div class="chart-footer"><span><i class="legend-dot primary"></i>
      ${getCity(state.city)!.name}${state.vs
        ? ` <i class="legend-dot secondary"></i>${getCity(state.vs)!.name}` : ''}</span>
      <span>Media A ${valueWithUnit(a.mean,state.metric,'period')} ·
        Media B ${valueWithUnit(b.mean,state.metric,'period')}</span></div></section>`;
}

function stripesMarkup(): string {
  const summers=cityYears(state.city), baseline=rangeStats(summers,state.metric,...state.a);
  return `<section class="stripes-panel panel" aria-labelledby="stripes-heading"><div class="panel-bar"><div><p class="eyebrow">Anomalie</p><h2 id="stripes-heading">Ogni estate, un segno</h2></div><span class="quiet">Rispetto alla media A · σ campionaria</span></div>
    <div class="stripes" role="group" aria-label="Anomalie annuali">${summers.map((summer)=>{const level=zLevel(warmth(summer[state.metric],state.metric),warmth(baseline.mean,state.metric),baseline.sd);return `<button type="button" data-year="${summer.year}" class="stripe z${level} ${selectedYear()===summer.year?'active':''}" title="${summer.year}: ${valueWithUnit(summer[state.metric],state.metric)}" aria-label="Estate ${summer.year}, anomalia ${level}"></button>`;}).join('')}</div><div class="stripe-labels"><span>1961</span><span>1970</span><span>1980</span><span>1990</span><span>2000</span><span>2010</span><span>2020</span></div><p class="note">Blu = più fresco o più piovoso · rosso = più caldo o più secco. Il colore indica lo scarto dalla media del periodo A, in deviazioni standard.</p></section>`;
}

function yearMarkup(): string {
  const year=selectedYear(), summers=cityYears(state.city), row=summers[year-1961]!;
  const warmest=[...summers].sort((a,b)=>warmth(b[state.metric],state.metric)-warmth(a[state.metric],state.metric))[0]!.year;
  const mildest=[...summers].sort((a,b)=>Math.abs(a[state.metric]-rangeStats(summers,state.metric,...state.a).mean)-Math.abs(b[state.metric]-rangeStats(summers,state.metric,...state.a).mean))[0]!.year;
  return `<section class="year-panel panel" aria-labelledby="year-heading"><div class="panel-bar"><div><p class="eyebrow">04 / Un’estate da vicino</p><h2 id="year-heading">L’estate del ${year}</h2></div><div class="year-nav"><button type="button" data-year-step="-1" aria-label="Anno precedente" ${year<=1961?'disabled':''}>←</button><select id="year-select" aria-label="Seleziona anno">${summers.map((item)=>`<option value="${item.year}" ${item.year===year?'selected':''}>${item.year}</option>`).join('')}</select><button type="button" data-year-step="1" aria-label="Anno successivo" ${year>=2020?'disabled':''}>→</button></div></div>
    <div class="year-chips"><span>Vai a:</span>${[[warmest,'Più estrema'],[mildest,'Più vicina alla media'],[2003,'2003'],[2020,'2020']].map(([value,label])=>`<button type="button" data-year="${value}">${label}</button>`).join('')}</div>
    <div class="year-cards">${metrics.map((metric)=>{const rank=[...summers].sort((a,b)=>warmth(b[metric],metric)-warmth(a[metric],metric)).findIndex((item)=>item.year===year)+1;const a=rangeStats(summers,metric,...state.a);return `<div><span>${metricMeta[metric].shortLabel}</span><strong>${valueWithUnit(row[metric],metric)}</strong><small>${formatSigned(row[metric]-a.mean)} sulla media A · ${rank}ª su 60</small></div>`;}).join('')}</div>
    <div class="year-city-grid"><h3>${year} nelle dieci città</h3><div>${orderedCities().map((city)=>{const years=cityYears(city.id), value=years[year-1961]![state.metric], a=rangeStats(years,state.metric,...state.a);const level=zLevel(warmth(value,state.metric),warmth(a.mean,state.metric),a.sd);return `<button type="button" data-city="${city.id}" class="year-city z${level} ${city.id===state.city?'active':''}"><strong>${city.name}</strong><span>${valueWithUnit(value,state.metric)}</span></button>`;}).join('')}</div></div></section>`;
}

function comparisonMarkup(): string {
  return `<section class="comparison panel" aria-labelledby="comparison-heading"><div class="panel-bar"><div><p class="eyebrow">05 / Tutte le città</p><h2 id="comparison-heading">Il confronto completo</h2></div><span class="quiet">A ${rangeLabel(state.a)} · B ${rangeLabel(state.b)}</span></div>
    <div class="table-scroll" tabindex="0"><table><caption class="sr-only">Tre indicatori, medie A e B e differenze per dieci città</caption><thead><tr><th rowspan="2" scope="col">Città</th>${metrics.map((metric)=>`<th colspan="3" scope="colgroup">${metricMeta[metric].shortLabel}</th>`).join('')}</tr><tr>${metrics.map(()=>'<th scope="col">A</th><th scope="col">B</th><th scope="col">Δ</th>').join('')}</tr></thead><tbody>
    ${orderedCities().map((city)=>`<tr class="${city.id===state.city?'selected':''}"><th scope="row"><button type="button" data-city="${city.id}">${city.name}</button></th>${metrics.map((metric)=>{const years=cityYears(city.id),a=rangeStats(years,metric,...state.a),b=rangeStats(years,metric,...state.b),change=b.mean-a.mean;return `<td>${formatValue(a.mean)}</td><td>${formatValue(b.mean)}</td><td class="${tone(change,metric)} ${Math.abs(change)>a.sd?'signal':''}" title="${Math.abs(change)>a.sd?'Oltre':'Entro'} una deviazione standard A">${formatSigned(change)}</td>`;}).join('')}</tr>`).join('')}</tbody></table></div><p class="note">Δ = B − A. Evidenziato quando |Δ| supera una deviazione standard del periodo A; non è un test di significatività.</p></section>`;
}

function annualMarkup(): string {
  const summers=cityYears(state.city), a=rangeStats(summers,state.metric,...state.a);
  return `<section class="annual panel" aria-labelledby="annual-heading"><div class="panel-bar"><div><p class="eyebrow">06 / Archivio</p><h2 id="annual-heading">Dati annuali · ${getCity(state.city)!.name}</h2></div><div class="annual-actions"><button type="button" id="copy-link">Copia link</button><button type="button" id="download-csv" ${cityDataset?.cityId===state.city?'':'disabled'}>CSV ↓</button></div></div>
    ${cityError?'<div class="data-error" role="alert">Non è stato possibile caricare i dati di dettaglio per il CSV. <button type="button" id="retry">Riprova</button></div>':''}
    <div class="table-scroll annual-scroll" tabindex="0" aria-label="Tabella scorrevole dei valori annuali"><table><caption class="sr-only">Valori delle 60 estati per ${getCity(state.city)!.name}</caption><thead><tr><th scope="col">Anno</th><th scope="col">Periodo</th><th scope="col">°C</th><th scope="col">gg &gt;30</th><th scope="col">mm</th><th scope="col">Anomalia</th></tr></thead><tbody>${summers.map((summer)=>{const val=summer[state.metric]-a.mean;return `<tr class="${summer.year===selectedYear()?'selected':''}"><th scope="row"><button type="button" data-year="${summer.year}">${summer.year}</button></th><td>${summer.year>=state.a[0]&&summer.year<=state.a[1]?'A':summer.year>=state.b[0]&&summer.year<=state.b[1]?'B':'—'}</td><td>${formatValue(summer.meanTemperatureC)}</td><td>${summer.hotDays}</td><td>${formatValue(summer.precipitationMm)}</td><td class="${tone(val,state.metric)}">${formatSigned(val)}</td></tr>`;}).join('')}</tbody></table></div></section>`;
}

function mapMarkup(): string {
  return `<section class="map-panel panel" aria-labelledby="map-heading"><div class="panel-bar"><div><p class="eyebrow">La geografia</p><h2 id="map-heading">L’Italia delle estati</h2></div><span class="quiet">Δ ${metricMeta[state.metric].shortLabel}</span></div><div id="map-canvas" class="map-canvas" role="group" aria-label="Mappa interattiva delle città">${geography?'':'<p class="map-fallback">Caricamento dei confini locali…</p>'}</div><p class="note">Colori in quattro intervalli uguali di variazione. I punti indicano città, non l’estensione delle celle ERA5. Confini: Natural Earth.</p></section>`;
}

let mapTimer: number | undefined;
let lastMapWidth = 0;
function drawMap(): void {
  const element=root.querySelector<HTMLDivElement>('#map-canvas');
  if (!element || !geography) return;
  const width=Math.max(300,element.clientWidth),height=Math.max(250,Math.min(390,width*.64));
  lastMapWidth = element.clientWidth;
  const italy=geography.features.find((item)=>String(item.id).padStart(3,'0')==='380');
  if (!italy) {element.innerHTML='<p class="map-fallback">Confine italiano non disponibile.</p>';return;}
  const projection=geoMercator().fitExtent([[34,18],[width-34,height-18]],italy);
  const path=geoPath(projection);
  const classes=deltaClasses(cities.map((city)=>warmth(delta(city.id,state.metric),state.metric)));
  element.innerHTML=`<svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Mappa d’Italia con dieci città">
    ${geography.features.map((item)=>`<path class="map-land ${String(item.id).padStart(3,'0')==='380'?'italy':'neighbour'}" d="${path(item)??''}"/>`).join('')}
    ${cities.map((city,index)=>{const point=projection([city.longitude,city.latitude]);if(!point)return '';const left=city.id==='torino'||city.id==='cagliari';return `<g class="map-point class-${classes[index]} ${city.id===state.city?'active':''}" data-city="${city.id}" role="button" tabindex="0" aria-label="${city.name}, variazione ${formatSigned(delta(city.id,state.metric))} ${metricMeta[state.metric].unit}" transform="translate(${point[0]} ${point[1]})"><circle r="${city.id===state.city?9:7}"/><text x="${left?-12:12}" y="4" text-anchor="${left?'end':'start'}">${city.name}</text></g>`;}).join('')}</svg>`;
}

function render(): void {
  if (!compact || !manifest) return;
  mapObserver?.disconnect();
  lastMapWidth = 0;
  root.innerHTML=`${headerMarkup()}<main id="console"><div class="intro"><span class="eyebrow">La memoria delle stagioni</span><p>Dieci città italiane. Sessant’anni di estati. I numeri diventano una storia che puoi confrontare.</p></div>
    <div class="dashboard-grid">${sidebarMarkup()}<div class="main-column">${heroMarkup()}${cardsMarkup()}<div class="visual-grid">${mapMarkup()}${stripesMarkup()}</div>${chartMarkup()}${yearMarkup()}</div></div>${comparisonMarkup()}${annualMarkup()}${legalMarkup()}</main>
    <footer class="site-footer"><span>Com’era il clima — la memoria delle stagioni</span><span>10 città · 600 estati · <a href="https://github.com/giubud/comera-il-clima/blob/main/DATA_LICENSE.md">Licenze, crediti e avvertenze</a></span></footer>`;
  drawMap();
  const canvas=root.querySelector<HTMLElement>('#map-canvas');
  if(canvas){mapObserver=new ResizeObserver(()=>{if(canvas.clientWidth===lastMapWidth)return;window.clearTimeout(mapTimer);mapTimer=window.setTimeout(drawMap,80);});mapObserver.observe(canvas);}
}

function persist(): void {
  history.replaceState(null,'',`${location.pathname}${searchForState(state)}`);
  render();
}

async function loadCity(id: string): Promise<void> {
  const request=++requestNumber;
  cityDataset=null;cityError=false;
  render();
  try {
    let data=cityCache.get(id);
    if(!data){
      const response=await fetch(`${import.meta.env.BASE_URL}data/${id}.json`);
      if(!response.ok)throw new Error(`HTTP ${response.status}`);
      const value:unknown=await response.json();
      assertCityDataset(value);
      if(value.cityId!==id)throw new Error('Città inattesa nel dataset.');
      data=value;cityCache.set(id,data);
    }
    if(request===requestNumber){cityDataset=data;render();}
  }catch{
    if(request===requestNumber){cityError=true;render();}
  }
}

function changeCity(id: string): void {
  if(!getCity(id))return;
  state={...state,city:id,vs:state.vs===id?null:state.vs};
  persist();void loadCity(id);
}

function changeYear(year: number): void {
  if(!Number.isInteger(year)||year<1961||year>2020)return;
  state={...state,year};persist();
}

root.addEventListener('click',(event)=>{
  const target=event.target as Element;
  const city=target.closest<HTMLElement>('[data-city]');
  if(city?.dataset.city){changeCity(city.dataset.city);return;}
  const metric=target.closest<HTMLElement>('[data-metric]');
  if(metric?.dataset.metric){state={...state,metric:metric.dataset.metric as Metric};persist();return;}
  const themeButton=target.closest<HTMLElement>('[data-theme]');
  if(themeButton?.dataset.theme){theme=themeButton.dataset.theme as Theme;applyAppearance(theme,sort);render();return;}
  const year=target.closest<HTMLElement>('[data-year]');
  if(year?.dataset.year){changeYear(Number(year.dataset.year));return;}
  const step=target.closest<HTMLElement>('[data-year-step]');
  if(step?.dataset.yearStep){changeYear(selectedYear()+Number(step.dataset.yearStep));return;}
  if(target.closest('#retry')){void loadCity(state.city);return;}
  if(target.closest('#copy-link')){void navigator.clipboard.writeText(location.href).then(()=>{const button=root.querySelector('#copy-link');if(button)button.textContent='Link copiato';}).catch(()=>{const button=root.querySelector('#copy-link');if(button)button.textContent='Copia non riuscita';});return;}
  if(target.closest('#download-csv')&&cityDataset?.cityId===state.city){
    const url=URL.createObjectURL(new Blob([datasetCsv(cityDataset)],{type:'text/csv;charset=utf-8'}));
    const anchor=document.createElement('a');anchor.href=url;anchor.download=`comera-il-clima-${cityDataset.cityId}.csv`;anchor.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
});

root.addEventListener('keydown',(event)=>{
  if((event.key==='Enter'||event.key===' ')&&(event.target as Element).matches('.map-point,.chart-point')){
    event.preventDefault();(event.target as Element).dispatchEvent(new MouseEvent('click',{bubbles:true}));
  }
});

root.addEventListener('change',(event)=>{
  const target=event.target as HTMLSelectElement|HTMLInputElement;
  if(target.id==='city-sort'){sort=target.value as Sort;applyAppearance(theme,sort);render();return;}
  if(target.id==='period-preset'&&periodPresets[target.value]){const preset=periodPresets[target.value]!;state={...state,a:[...preset.a],b:[...preset.b]};persist();return;}
  if(target.dataset.range){
    const [key,bound]=target.dataset.range.split('-') as ['a'|'b','start'|'end'];
    const next=[...state[key]] as Period;next[bound==='start'?0:1]=Number(target.value);
    if(next[0]>next[1])next.reverse();
    state={...state,[key]:next};persist();return;
  }
  if(target.id==='compare-city'){state={...state,vs:target.value&&getCity(target.value)?target.value:null};persist();return;}
  if(target.id==='year-select'){changeYear(Number(target.value));return;}
  if(target.id==='smooth'){state={...state,smooth:(target as HTMLInputElement).checked};persist();}
});

window.addEventListener('popstate',()=>{state=parseUrlState(location.search);render();void loadCity(state.city);});

async function start(): Promise<void> {
  applyAppearance(theme,sort);
  root.innerHTML='<div class="initial-status" role="status">Caricamento della console climatica…</div>';
  try {
    const [manifestResponse,summersResponse]=await Promise.all([
      fetch(`${import.meta.env.BASE_URL}data/manifest.json`),fetch(`${import.meta.env.BASE_URL}data/summers.json`),
    ]);
    if(!manifestResponse.ok||!summersResponse.ok)throw new Error('Dati non disponibili.');
    manifest=await manifestResponse.json() as Manifest;
    const value:unknown=await summersResponse.json();
    if(manifest.schemaVersion!==1||manifest.cities.length!==10)throw new Error('Manifest non valido.');
    assertSummers(value,cities.map((city)=>city.id));compact=value;
    render();void loadCity(state.city);
    try {
      const response=await fetch(`${import.meta.env.BASE_URL}geo/italia-110m.json`);
      if(!response.ok)throw new Error('Confini locali non disponibili.');
      geography=await response.json() as FeatureCollection<Geometry>;
      if(!Array.isArray(geography.features))throw new Error('Geografia non valida.');
      drawMap();
    }catch{const canvas=root.querySelector('#map-canvas');if(canvas)canvas.innerHTML='<p class="map-fallback">Mappa non disponibile. I dati e le tabelle restano utilizzabili.</p>';}
  }catch(error){
    root.innerHTML=`<div class="initial-status error" role="alert">Non è stato possibile avviare la console. ${error instanceof Error?error.message:'Errore inatteso.'}</div>`;
  }
}

void start();
