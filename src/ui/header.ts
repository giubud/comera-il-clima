import type { AppState } from '../app/state';
import { type Theme } from '../lib/theme';

function logo(): string {
  return [
    '<span class="logo-mark" aria-hidden="true">',
    [
      String(
        ['#294f79', '#5b8fa9', '#bac7bb', '#e8b272', '#ce7650', '#a7433d']
          .map((color) => `<i style="background:${color}"></i>`)
          .join(''),
      ),
    ].join(''),
    '</span>',
  ].join('');
}

export function headerMarkup(model: Readonly<AppState>): string {
  return [
    '<a class="skip-link" href="#console">Vai ai dati</a><header ',
    'class="topbar">\n    <div class="brand">',
    `${logo()}`,
    '<span><strong>Com’era il clima</strong><small>Atlante delle ',
    'estati italiane · ERA5 1961—2020</small></span></div>\n    <div ',
    'class="top-actions"><span class="edition">10 città · 600 ',
    'estati</span><div class="theme-switch" role="group" ',
    'aria-label="Tema">\n      ',
    `${(['auto', 'light', 'dark'] as Theme[])
      .map((value) =>
        [
          '<button type="button" data-theme="',
          `${value}`,
          '" aria-pressed="',
          `${model.theme === value}`,
          '">',
          `${{ auto: 'Auto', light: 'Chiaro', dark: 'Scuro' }[value]}`,
          '</button>',
        ].join(''),
      )
      .join('')}`,
    '\n    </div></div></header>',
  ].join('');
}
