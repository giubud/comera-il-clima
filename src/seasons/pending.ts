import { headerMarkup } from '../ui/header';
import type { Theme } from '../lib/theme';
import { applyAppearance, type Sort } from '../lib/theme';
export function pendingSeasons(theme: Theme): string {
  return (
    headerMarkup({ theme }) +
    '<main id="console"><section class="panel initial-status" ' +
    'role="status"><h1>Archivio stagionale in preparazione</h1><p>' +
    'I dati pubblicati contengono ancora soltanto le estati. Le altre stagioni e i nuovi ' +
    'indicatori saranno disponibili dopo il download e la validazione del nuovo archivio.</p>' +
    '<a href="?city=roma&metric=meanTemperatureC">Torna ai dati estivi disponibili</a>' +
    '</section></main>'
  );
}
export function bindPendingTheme(root: HTMLDivElement, model: { theme: Theme; sort: Sort }): void {
  root.addEventListener('click', (event) => {
    const theme = (event.target as Element).closest<HTMLElement>('button[data-theme]')?.dataset
      .theme;
    if (theme === 'auto' || theme === 'light' || theme === 'dark') {
      model.theme = theme;
      applyAppearance(model.theme, model.sort);
      root.innerHTML = pendingSeasons(model.theme);
    }
  });
}
