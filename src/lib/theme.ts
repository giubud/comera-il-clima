export type Theme = 'light' | 'dark';
export type Density = 'comfortable' | 'compact';

const key = 'comera-console';

export function loadAppearance(): { theme: Theme; density: Density } {
  try {
    const saved = JSON.parse(localStorage.getItem(key) ?? '{}') as Partial<{ theme: Theme; density: Density }>;
    return { theme: saved.theme === 'dark' ? 'dark' : 'light', density: saved.density === 'compact' ? 'compact' : 'comfortable' };
  } catch {
    return { theme: 'light', density: 'comfortable' };
  }
}

export function applyAppearance(theme: Theme, density: Density): void {
  document.documentElement.dataset.theme = theme;
  document.documentElement.dataset.density = density;
  localStorage.setItem(key, JSON.stringify({ theme, density }));
}
