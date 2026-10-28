import type { AppState } from '../app/state';
import { annualMarkup } from './annual';
import { chartMarkup } from './chart';
import { comparisonMarkup } from './comparison';
import { headerMarkup } from './header';
import { legalMarkup } from './legal';
import { mapMarkup } from './map';
import { cardsMarkup, heroMarkup } from './overview';
import { sidebarMarkup } from './sidebar';
import { stripesMarkup } from './stripes';
import { yearMarkup } from './year';
export function pageMarkup(model: Readonly<AppState>): string {
  return [
    String(headerMarkup(model)),
    '<main id="console"><div class="intro"><span class="eyebrow">La ',
    'memoria delle stagioni</span><p>Dieci città italiane. ',
    'Sessant’anni di estati. I numeri diventano una storia che puoi ',
    'confrontare.</p></div>\n    <div class="dashboard-grid">',
    String(sidebarMarkup(model)),
    '<div class="main-column">',
    String(heroMarkup(model)),
    String(cardsMarkup(model)),
    '<div class="visual-grid">',
    String(mapMarkup(model)),
    String(stripesMarkup(model)),
    '</div>',
    String(chartMarkup(model)),
    String(yearMarkup(model)),
    '</div></div>',
    String(comparisonMarkup(model)),
    String(annualMarkup(model)),
    String(legalMarkup()),
    '</main>\n    <footer class="site-footer"><span>Com’era il clima — ',
    'la memoria delle stagioni</span><span>10 città · 600 estati · <a ',
    'href="https://github.com/giubud/comera-il-clima/blob/main/DATA_LI',
    'CENSE.md">Licenze, crediti e avvertenze</a></span></footer>',
  ].join('');
}
