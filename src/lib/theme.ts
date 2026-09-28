export type Theme = 'auto' | 'light' | 'dark';
export type Sort = 'north' | 'alpha' | 'delta';

const key = 'comera-console';

export function loadAppearance(): { theme: Theme; sort: Sort } {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? '{}') as Partial<{ theme: Theme; sort: Sort }>;
    return { theme: saved.theme === 'dark' || saved.theme === 'light' ? saved.theme : 'auto', sort: saved.sort === 'alpha' || saved.sort === 'delta' ? saved.sort : 'north' };
  } catch {
    return { theme: 'auto', sort: 'north' };
  }
}

export function applyAppearance(theme: Theme, sort: Sort): void {
  if (theme === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  localStorage.setItem(key, JSON.stringify({ theme, sort }));
}
