import type { Model } from './model';
import { selectedYear } from './model';
import { getCity } from '../data/cities';
import { isMetric, isSeason } from '../data/season-meta';
import { parseSeasonState, searchSeasonState } from '../lib/season-url-state';
import { periodPresets, type Period } from '../lib/url-state';
import { applyAppearance, type Sort, type Theme } from '../lib/theme';
import { seasonalCsv } from './tables';
export function bindSeasonEvents(
  root: HTMLDivElement,
  model: Model,
  render: () => void,
  loadSeason: () => Promise<void>,
  loadCity: () => Promise<void>,
): void {
  const persist = () => {
    history.replaceState(null, '', location.pathname + searchSeasonState(model.state));
    render();
  };
  root.addEventListener('click', (event) => {
    const target = event.target as Element;
    const city = target.closest<HTMLElement>('[data-city]')?.dataset.city;
    const metric = target.closest<HTMLElement>('[data-metric]')?.dataset.metric;
    const theme = target.closest<HTMLElement>('button[data-theme]')?.dataset.theme;
    const year = target.closest<HTMLElement>('[data-year]')?.dataset.year;
    const step = target.closest<HTMLElement>('[data-year-step]')?.dataset.yearStep;
    if (city && getCity(city)) {
      model.state = { ...model.state, city, vs: city === model.state.vs ? null : model.state.vs };
      persist();
      void loadCity();
      return;
    }
    if (metric && isMetric(metric)) {
      model.state = { ...model.state, metric };
      persist();
      return;
    }
    if (theme && ['auto', 'light', 'dark'].includes(theme)) {
      model.theme = theme as Theme;
      applyAppearance(model.theme, model.sort);
      render();
      return;
    }
    if (year || step) {
      const value = year ? Number(year) : selectedYear(model) + Number(step);
      if (Number.isInteger(value) && value >= 1961 && value <= 2020) {
        model.state = { ...model.state, year: value };
        persist();
      }
      return;
    }
    if (target.closest('#retry')) {
      void loadSeason();
      return;
    }
    if (target.closest('#copy-link')) {
      void navigator.clipboard
        .writeText(location.href)
        .then(() => {
          const button = root.querySelector('#copy-link');
          if (button) button.textContent = 'Link copiato';
        })
        .catch(() => {
          const b = root.querySelector('#copy-link');
          if (b) b.textContent = 'Copia non riuscita';
        });
    }
    if (target.closest('#download-csv') && model.dataset?.cityId === model.state.city) {
      const url = URL.createObjectURL(
        new Blob([seasonalCsv(model)], { type: 'text/csv;charset=utf-8' }),
      );
      const a = document.createElement('a');
      a.href = url;
      a.download = 'comera-il-clima-' + model.state.city + '-' + model.state.season + '.csv';
      a.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  });
  root.addEventListener('keydown', (event) => {
    if (
      ['Enter', ' '].includes(event.key) &&
      (event.target as Element).matches('.chart-point,.map-point')
    ) {
      event.preventDefault();
      (event.target as Element).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  });
  root.addEventListener('change', (event) => {
    const target = event.target as HTMLSelectElement;
    if (target.id === 'season-select' && isSeason(target.value)) {
      model.state = { ...model.state, season: target.value };
      model.compact = null;
      model.dataset = null;
      persist();
      void loadSeason();
      return;
    }
    if (target.id === 'city-sort') {
      model.sort = target.value as Sort;
      applyAppearance(model.theme, model.sort);
      render();
      return;
    }
    if (target.id === 'period-preset') {
      const p = periodPresets[target.value];
      if (p) {
        model.state = { ...model.state, a: [...p.a], b: [...p.b] };
        persist();
      }
      return;
    }
    if (target.dataset.range) {
      const [key, bound] = target.dataset.range.split('-') as ['a' | 'b', 'start' | 'end'];
      const period = [...model.state[key]] as Period;
      period[bound === 'start' ? 0 : 1] = Number(target.value);
      if (period[0] > period[1]) period.reverse();
      model.state = { ...model.state, [key]: period };
      persist();
      return;
    }
    if (target.id === 'year-select') {
      const year = Number(target.value);
      if (Number.isInteger(year) && year >= 1961 && year <= 2020) {
        model.state = { ...model.state, year };
        persist();
      }
      return;
    }
    if (target.id === 'compare-city') {
      model.state = { ...model.state, vs: getCity(target.value)?.id ?? null };
      if (model.state.vs === model.state.city) model.state.vs = null;
      persist();
      return;
    }
    if (target.id === 'smooth') {
      model.state = { ...model.state, smooth: (target as unknown as HTMLInputElement).checked };
      persist();
    }
  });
  window.addEventListener('popstate', () => {
    const old = model.state.season;
    model.state = parseSeasonState(location.search);
    if (old !== model.state.season) void loadSeason();
    else {
      render();
      void loadCity();
    }
  });
}
