import type { Manifest } from '../data/schema';
import { formatSigned } from '../lib/format';

export function railMarkup(manifest: Manifest, selected: string): string {
  const deltas = manifest.cities.map((city) => city.periods.b.meanTemperatureC - city.periods.a.meanTemperatureC);
  const maximum = Math.max(...deltas);
  const average = deltas.reduce((total, value) => total + value, 0) / deltas.length;
  return `<aside class="city-rail panel" aria-label="Città">
    <div class="panel-bar"><span>Stazioni</span><span>ΔT °C</span></div>
    <ul>${manifest.cities.map((city, index) => {
      const delta = deltas[index]!;
      return `<li><button type="button" class="city-row" data-city="${city.id}" aria-pressed="${city.id === selected}">
        <i aria-hidden="true" style="height:${6 + Math.round((delta / maximum) * 12)}px;opacity:${(0.35 + 0.65 * delta / maximum).toFixed(2)}"></i>
        <span>${city.name}</span><strong>${formatSigned(delta)}</strong>
      </button></li>`;
    }).join('')}</ul>
    <div class="rail-average"><span>Media 10 città</span><strong>${formatSigned(average)} <small>°C</small></strong></div>
  </aside>`;
}
