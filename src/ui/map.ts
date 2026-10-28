import { geoMercator, geoPath } from 'd3-geo';
import { delta } from '../app/selectors';
import type { AppState } from '../app/state';
import { cities } from '../data/cities';
import { deltaClasses, warmth } from '../lib/aggregate';
import { formatSigned, metricMeta } from '../lib/format';
import { requireDefined } from '../lib/required';

function mapLegendMarkup(model: Readonly<AppState>): string {
  const values = cities.map((city) =>
    warmth(delta(model, city.id, model.state.metric), model.state.metric),
  );
  const min = Math.min(...values),
    max = Math.max(...values);
  const edges = Array.from({ length: 5 }, (_, index) =>
    index === 4 ? max : min + ((max - min) * index) / 4,
  );
  let digits = 2;
  while (digits < 8 && max !== min) {
    const rounded = edges.map((edge) => edge.toFixed(digits));
    if (new Set(rounded).size === edges.length) break;
    digits += 1;
  }
  const formatter = new Intl.NumberFormat('it-IT', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
  const label = (value: number): string => {
    const displayed = Number(value.toFixed(digits));
    const sign = displayed > 0 ? '+' : displayed < 0 ? '−' : '';
    return `${sign}${formatter.format(Math.abs(displayed))}`;
  };
  const unit = metricMeta[model.state.metric].unit;
  const items = (max === min ? [1] : [0, 1, 2, 3])
    .map((index) => {
      const from = warmth(requireDefined(edges[index]), model.state.metric);
      const to = warmth(requireDefined(edges[index + 1]), model.state.metric);
      const lower = Math.min(from, to),
        upper = Math.max(from, to);
      let range = `Δ = ${label(lower)} ${unit}`;
      if (max !== min) {
        const inverted = model.state.metric === 'precipitationMm';
        const left = inverted && index < 3 ? '<' : '≤';
        const right = !inverted && index < 3 ? '<' : '≤';
        range = `${label(lower)} ${left} Δ ${right} ${label(upper)} ${unit}`;
      }
      return `<li class="map-legend-item class-${index}"
      data-lower="${lower}" data-upper="${upper}">
      <i class="map-legend-swatch" aria-hidden="true"></i><span>${range}</span></li>`;
    })
    .join('');
  return `<div class="map-legend" role="group" aria-label="Legenda della mappa">
    <p>Δ = media B − media A${max === min ? ' · un solo valore' : ''}</p>
    <ul>${items}</ul><p class="legend-caption">Limiti arrotondati;
      i colori usano i valori non arrotondati.</p></div>`;
}

export function mapMarkup(model: Readonly<AppState>): string {
  return [
    '<section class="map-panel panel" aria-labelledby="map-heading">\n ',
    '   <div class="panel-bar"><div><p class="eyebrow">La ',
    'geografia</p>\n      <h2 id="map-heading">L’Italia delle ',
    'estati</h2></div>\n      <span class="quiet">Δ ',
    String(metricMeta[model.state.metric].shortLabel),
    '</span></div>\n    <div id="map-canvas" class="map-canvas" ',
    'role="group"\n      aria-label="Mappa interattiva delle città">',
    String(model.geography ? '' : '<p class="map-fallback">Caricamento dei confini locali…</p>'),
    '</div>\n    ',
    String(mapLegendMarkup(model)),
    '\n    <p class="note">Colori in quattro intervalli uguali di ',
    'variazione.\n      I punti indicano città, non l’estensione delle ',
    'celle ERA5. Confini: Natural Earth.</p>\n    </section>',
  ].join('');
}

export function createMapRenderer(root: HTMLDivElement, model: Readonly<AppState>) {
  let mapObserver: ResizeObserver | null = null;
  let mapTimer: number | undefined;
  let lastMapWidth = 0;
  function drawMap(): void {
    const element = root.querySelector<HTMLDivElement>('#map-canvas');
    if (!element || !model.geography) return;
    const width = Math.max(300, element.clientWidth),
      height = Math.max(250, Math.min(390, width * 0.64));
    lastMapWidth = element.clientWidth;
    const italy = model.geography.features.find(
      (item) => String(item.id).padStart(3, '0') === '380',
    );
    if (!italy) {
      element.innerHTML = '<p class="map-fallback">Confine italiano non disponibile.</p>';
      return;
    }
    const projection = geoMercator().fitExtent(
      [
        [34, 18],
        [width - 34, height - 18],
      ],
      italy,
    );
    const path = geoPath(projection);
    const classes = deltaClasses(
      cities.map((city) => warmth(delta(model, city.id, model.state.metric), model.state.metric)),
    );
    element.innerHTML = [
      '<svg viewBox="0 0 ',
      String(width),
      ' ',
      String(height),
      '" role="img" aria-label="Mappa d’Italia con dieci città">\n    ',
      String(
        model.geography.features
          .map((item) =>
            [
              '<path class="map-land ',
              String(String(item.id).padStart(3, '0') === '380' ? 'italy' : 'neighbour'),
              '" d="',
              String(path(item) ?? ''),
              '"/>',
            ].join(''),
          )
          .join(''),
      ),
      '\n    ',
      String(
        cities
          .map((city, index) => {
            const point = projection([city.longitude, city.latitude]);
            if (!point) return '';
            const left = city.id === 'torino' || city.id === 'cagliari';
            return [
              '<g class="map-point class-',
              String(classes[index]),
              ' ',
              String(city.id === model.state.city ? 'active' : ''),
              '" data-city="',
              String(city.id),
              '" role="button" tabindex="0" aria-label="',
              String(city.name),
              ', variazione ',
              String(formatSigned(delta(model, city.id, model.state.metric))),
              ' ',
              String(metricMeta[model.state.metric].unit),
              '" transform="translate(',
              String(point[0]),
              ' ',
              String(point[1]),
              ')"><circle r="',
              String(city.id === model.state.city ? 9 : 7),
              '"/><text x="',
              String(left ? -12 : 12),
              '" y="4" text-anchor="',
              String(left ? 'end' : 'start'),
              '">',
              String(city.name),
              '</text></g>',
            ].join('');
          })
          .join(''),
      ),
      '</svg>',
    ].join('');
  }
  function prepare(): void {
    mapObserver?.disconnect();
    lastMapWidth = 0;
  }
  function observe(): void {
    const canvas = root.querySelector<HTMLElement>('#map-canvas');
    if (canvas) {
      mapObserver = new ResizeObserver(() => {
        if (canvas.clientWidth === lastMapWidth) return;
        window.clearTimeout(mapTimer);
        mapTimer = window.setTimeout(drawMap, 80);
      });
      mapObserver.observe(canvas);
    }
  }
  return { prepare, observe, draw: drawMap };
}
