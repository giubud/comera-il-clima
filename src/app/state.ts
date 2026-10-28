import type { FeatureCollection, Geometry } from 'geojson';
import type { CityDataset, CompactSummers, Manifest } from '../data/schema';
import { loadAppearance, type Sort, type Theme } from '../lib/theme';
import { parseUrlState, type UrlState } from '../lib/url-state';

export type AppState = {
  state: UrlState;
  theme: Theme;
  sort: Sort;
  compact: CompactSummers | null;
  manifest: Manifest | null;
  geography: FeatureCollection<Geometry> | null;
  cityDataset: CityDataset | null;
  cityError: boolean;
};

export function createAppState(): AppState {
  const state = parseUrlState(location.search);
  const { theme, sort } = loadAppearance();
  return {
    state,
    theme,
    sort,
    compact: null,
    manifest: null,
    geography: null,
    cityDataset: null,
    cityError: false,
  };
}
