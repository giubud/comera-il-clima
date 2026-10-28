import { getCity } from '../data/cities';
import type { Metric } from '../data/schema';
import { requireDefined } from '../lib/required';
import { applyAppearance, type Sort, type Theme } from '../lib/theme';
import { parseUrlState, periodPresets, searchForState, type Period } from '../lib/url-state';
import { datasetCsv } from '../ui/table';
import { selectedYear } from './selectors';
import type { AppState } from './state';
export function bindEvents(
  root: HTMLDivElement,
  model: AppState,
  render: () => void,
  loadCity: (id: string) => Promise<void>,
): void {
  function persist(): void {
    history.replaceState(null, '', `${location.pathname}${searchForState(model.state)}`);
    render();
  }
  function changeCity(id: string): void {
    if (!getCity(id)) return;
    model.state = { ...model.state, city: id, vs: model.state.vs === id ? null : model.state.vs };
    persist();
    void loadCity(id);
  }
  function changeYear(year: number): void {
    if (!Number.isInteger(year) || year < 1961 || year > 2020) return;
    model.state = { ...model.state, year };
    persist();
  }
  root.addEventListener('click', (event) => {
    const target = event.target as Element;
    const city = target.closest<HTMLElement>('[data-city]');
    if (city?.dataset.city) {
      changeCity(city.dataset.city);
      return;
    }
    const metric = target.closest<HTMLElement>('[data-metric]');
    if (metric?.dataset.metric) {
      model.state = { ...model.state, metric: metric.dataset.metric as Metric };
      persist();
      return;
    }
    const themeButton = target.closest<HTMLElement>('[data-theme]');
    if (themeButton?.dataset.theme) {
      model.theme = themeButton.dataset.theme as Theme;
      applyAppearance(model.theme, model.sort);
      render();
      return;
    }
    const year = target.closest<HTMLElement>('[data-year]');
    if (year?.dataset.year) {
      changeYear(Number(year.dataset.year));
      return;
    }
    const step = target.closest<HTMLElement>('[data-year-step]');
    if (step?.dataset.yearStep) {
      changeYear(selectedYear(model) + Number(step.dataset.yearStep));
      return;
    }
    if (target.closest('#retry')) {
      void loadCity(model.state.city);
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
          const button = root.querySelector('#copy-link');
          if (button) button.textContent = 'Copia non riuscita';
        });
      return;
    }
    if (target.closest('#download-csv') && model.cityDataset?.cityId === model.state.city) {
      const url = URL.createObjectURL(
        new Blob([datasetCsv(model.cityDataset)], { type: 'text/csv;charset=utf-8' }),
      );
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `comera-il-clima-${model.cityDataset.cityId}.csv`;
      anchor.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  });
  root.addEventListener('keydown', (event) => {
    if (
      (event.key === 'Enter' || event.key === ' ') &&
      (event.target as Element).matches('.map-point,.chart-point')
    ) {
      event.preventDefault();
      (event.target as Element).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  });
  root.addEventListener('change', (event) => {
    const target = event.target as HTMLSelectElement | HTMLInputElement;
    if (target.id === 'city-sort') {
      model.sort = target.value as Sort;
      applyAppearance(model.theme, model.sort);
      render();
      return;
    }
    if (target.id === 'period-preset' && periodPresets[target.value]) {
      const preset = requireDefined(periodPresets[target.value]);
      model.state = { ...model.state, a: [...preset.a], b: [...preset.b] };
      persist();
      return;
    }
    if (target.dataset.range) {
      const [key, bound] = target.dataset.range.split('-') as ['a' | 'b', 'start' | 'end'];
      const next = [...model.state[key]] as Period;
      next[bound === 'start' ? 0 : 1] = Number(target.value);
      if (next[0] > next[1]) next.reverse();
      model.state = { ...model.state, [key]: next };
      persist();
      return;
    }
    if (target.id === 'compare-city') {
      model.state = {
        ...model.state,
        vs: target.value && getCity(target.value) ? target.value : null,
      };
      persist();
      return;
    }
    if (target.id === 'year-select') {
      changeYear(Number(target.value));
      return;
    }
    if (target.id === 'smooth') {
      model.state = { ...model.state, smooth: (target as HTMLInputElement).checked };
      persist();
    }
  });
  window.addEventListener('popstate', () => {
    model.state = parseUrlState(location.search);
    render();
    void loadCity(model.state.city);
  });
}
