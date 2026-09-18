import type { Manifest, Metric } from '../data/schema';
import { formatSigned, metricMeta } from '../lib/format';

export function rankingMarkup(manifest: Manifest, metric: Metric, selected: string): string {
  const rows = manifest.cities.map((city) => ({ ...city, delta: city.periods.b[metric] - city.periods.a[metric] }))
    .sort((a, b) => metric === 'precipitationMm' ? a.delta - b.delta : b.delta - a.delta);
  const maximum = Math.max(...rows.map((row) => Math.abs(row.delta)), 1);
  return `<section class="ranking panel" aria-labelledby="ranking-heading">
    <div class="panel-bar"><h3 id="ranking-heading">Confronto città</h3><span>Δ ${metricMeta[metric].unit}</span></div>
    <ol>${rows.map((row, index) => `<li><button type="button" data-city="${row.id}" class="rank-row${row.id === selected ? ' active' : ''}">
      <span>${String(index + 1).padStart(2, '0')}</span><strong>${row.name}</strong><i><b style="width:${Math.abs(row.delta) / maximum * 50}%;${row.delta < 0 ? 'right:50%' : 'left:50%'}"></b></i><em>${formatSigned(row.delta)}</em>
    </button></li>`).join('')}</ol>
  </section>`;
}
