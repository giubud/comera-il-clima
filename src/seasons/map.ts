import { geoMercator, geoPath } from 'd3-geo';
import type { Model } from './model';
import { difference } from './model';
import { cities } from '../data/cities';
import { deltaClasses, warmth } from '../lib/aggregate';
import { isInverted } from '../data/season-meta';
import { signed, meta } from './format';
export function mapMarkup(model: Model): string {
  const metric = model.state.metric,
    values = cities.map((c) => warmth(difference(model, c.id) as number, metric));
  const min = Math.min(...values),
    max = Math.max(...values);
  const edges = Array.from({ length: 5 }, (_, i) => (i === 4 ? max : min + ((max - min) * i) / 4));
  let digits = 2;
  while (digits < 8 && max !== min && new Set(edges.map((v) => v.toFixed(digits))).size < 5)
    digits++;
  const label = (v: number) => {
    const rounded = Number(v.toFixed(digits));
    return (
      (rounded > 0 ? '+' : rounded < 0 ? '−' : '') +
      Math.abs(rounded).toLocaleString('it-IT', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
    );
  };
  const ranges = (min === max ? [1] : [0, 1, 2, 3])
    .map((i) => {
      const from = warmth(edges[i] as number, metric),
        to = warmth(edges[i + 1] as number, metric);
      const lower = Math.min(from, to),
        upper = Math.max(from, to),
        inverted = isInverted(metric);
      const text =
        min === max
          ? 'Δ = ' + label(lower)
          : label(lower) +
            ' ' +
            (inverted && i < 3 ? '<' : '≤') +
            ' Δ ' +
            (!inverted && i < 3 ? '<' : '≤') +
            ' ' +
            label(upper);
      return (
        '<li class="map-legend-item class-' +
        i +
        '" data-lower="' +
        lower +
        '" data-upper="' +
        upper +
        '"><i class="map-legend-swatch" aria-hidden="true"></i><span>' +
        text +
        ' ' +
        meta[metric].unit +
        '</span></li>'
      );
    })
    .join('');
  return (
    '<section class="map-panel panel"><div class="panel-bar"><h2>L’Italia delle stagioni' +
    '</h2></div><div id="season-map" class="map-canvas" role="group" ' +
    'aria-label="Mappa interattiva delle città"></div><div class="map-legend" role="group" ' +
    'aria-label="Legenda della mappa"><p>Δ = media B − media A</p><ul>' +
    ranges +
    '</ul>' +
    '<p class="legend-caption">Limiti arrotondati; colori dai valori non arrotondati.</p></div>' +
    '<p class="note">Quattro intervalli uguali. I punti indicano le città, non le celle ERA5. ' +
    'Confini: Natural Earth.</p></section>'
  );
}
export function drawMap(root: HTMLDivElement, model: Model): void {
  const element = root.querySelector<HTMLDivElement>('#season-map');
  if (!element) return;
  const geo = model.geography;
  if (!geo) {
    element.innerHTML = '<p class="map-fallback">Confini locali non disponibili.</p>';
    return;
  }
  const italy = geo.features.find((f) => String(f.id).padStart(3, '0') === '380');
  if (!italy) return;
  const width = Math.max(300, element.clientWidth),
    height = Math.max(250, Math.min(390, width * 0.64));
  const projection = geoMercator().fitExtent(
    [
      [34, 18],
      [width - 34, height - 18],
    ],
    italy,
  );
  const path = geoPath(projection),
    metric = model.state.metric;
  const classes = deltaClasses(
    cities.map((c) => warmth(difference(model, c.id) as number, metric)),
  );
  element.innerHTML =
    '<svg viewBox="0 0 ' +
    width +
    ' ' +
    height +
    '" role="img" aria-label="Mappa d’Italia con dieci città">' +
    geo.features
      .map(
        (f) =>
          '<path class="map-land ' +
          (String(f.id).padStart(3, '0') === '380' ? 'italy' : 'neighbour') +
          '" d="' +
          (path(f) ?? '') +
          '"/>',
      )
      .join('') +
    cities
      .map((city, i) => {
        const point = projection([city.longitude, city.latitude]);
        if (!point) return '';
        const left = city.id === 'torino' || city.id === 'cagliari';
        return (
          '<g class="map-point class-' +
          classes[i] +
          (city.id === model.state.city ? ' active' : '') +
          '" data-city="' +
          city.id +
          '" role="button" tabindex="0" aria-label="' +
          city.name +
          ', variazione ' +
          signed(difference(model, city.id)) +
          ' ' +
          meta[metric].unit +
          '" transform="translate(' +
          point[0] +
          ' ' +
          point[1] +
          ')"><circle r="' +
          (city.id === model.state.city ? 9 : 7) +
          '"/><text x="' +
          (left ? -12 : 12) +
          '" y="4" text-anchor="' +
          (left ? 'end' : 'start') +
          '">' +
          city.name +
          '</text></g>'
        );
      })
      .join('') +
    '</svg>';
}
