import type { Season, SeasonCityDataset, SeasonMetric, SeasonYear } from '../../src/data/schema';
import { seasonMetrics, seasons } from '../../src/data/schema';
import { compactSeason, expandSeason } from '../../src/data/season-compact';
import { notApplicable, seasonLabels, seasonMonths, yearLabel } from '../../src/data/season-meta';
import { seasonDates } from '../../src/data/calendar';
import { rangeStats } from '../../src/lib/aggregate';
import { meta, number, signed } from '../../src/seasons/format';
import { ArchiveStore, type Snapshot } from './archive';
import type { CompareInput, PeriodInput, RankInput, SeasonInput } from './inputs';
import { DATA_URL, LIMITATION } from './config';
import { provenance } from './provenance';

type Details = ReturnType<typeof provenance>;
export type ToolReply = ReturnType<ClimateService['reply']>;

export class ClimateService {
  constructor(private readonly store = new ArchiveStore()) {}

  reply(snapshot: Snapshot, data: Record<string, unknown>, details?: Details) {
    const manifest = snapshot.manifest;
    return {
      data,
      data_version: manifest.dataVersion,
      archive: {
        first_year: manifest.firstYear,
        last_year: manifest.lastYear,
        generated_at: manifest.generatedAt,
      },
      units: manifest.units,
      source: {
        model: 'ERA5',
        provider: 'Open-Meteo',
        url: DATA_URL,
        attribution: manifest.attribution,
        basis: 'grid_cells_not_stations',
      },
      provenance: details?.sources ?? [],
      warnings: details?.warnings ?? [],
      limitations: [LIMITATION],
    };
  }

  private period(snapshot: Snapshot, input: PeriodInput): number[] {
    if (
      input.start_year > input.end_year ||
      input.start_year < snapshot.manifest.firstYear ||
      input.end_year > snapshot.manifest.lastYear
    ) {
      throw new Error(
        `Periodo fuori archivio: disponibili ${snapshot.manifest.firstYear}–` +
          snapshot.manifest.lastYear +
          '.',
      );
    }
    return Array.from(
      { length: input.end_year - input.start_year + 1 },
      (_, index) => input.start_year + index,
    );
  }

  private rows(dataset: SeasonCityDataset, season: Season): SeasonYear[] {
    const compact = compactSeason([dataset], season);
    const rows = compact.cities[dataset.cityId];
    if (!rows) throw new Error('Serie cittadina non disponibile.');
    return expandSeason(rows, season);
  }

  async listCities() {
    const snapshot = await this.store.snapshot();
    return this.reply(snapshot, {
      cities: snapshot.manifest.cities.map(({ id, name }) => ({ id, name })),
      seasons: seasons.map((code) => ({
        code,
        label: seasonLabels[code],
        months: seasonMonths[code],
      })),
      metrics: seasonMetrics.map((id) => ({ id, ...meta[id] })),
      applicability: snapshot.manifest.applicability,
      winter_year: snapshot.manifest.winterYear,
    });
  }

  async getSeason(input: SeasonInput) {
    const snapshot = await this.store.snapshot();
    this.period(snapshot, { start_year: input.year, end_year: input.year });
    const dataset = await this.store.city(snapshot, input.city_id);
    const row = this.rows(dataset, input.season).find(({ year }) => year === input.year);
    if (!row) throw new Error('Anno non disponibile.');
    const dates = seasonDates(input.season, input.year);
    return this.reply(
      snapshot,
      {
        city_id: input.city_id,
        season: input.season,
        year: input.year,
        label: yearLabel(input.season, input.year),
        start_date: dates[0],
        end_date: dates.at(-1),
        valid_days: row.validDays,
        metrics: Object.fromEntries(
          seasonMetrics.map((metric) => [metric, this.measure(row[metric], metric, input.season)]),
        ),
      },
      provenance(dataset, input.season, [input.year]),
    );
  }

  private measure(value: number | null, metric: SeasonMetric, season: Season) {
    const reason = notApplicable(season, metric);
    return {
      value,
      unit: meta[metric].unit,
      display: number(value, metric, true),
      status: reason ? 'not_applicable' : 'available',
      reason,
    };
  }

  async comparePeriods(input: CompareInput) {
    const snapshot = await this.store.snapshot();
    const aYears = this.period(snapshot, input.period_a);
    const bYears = this.period(snapshot, input.period_b);
    const dataset = await this.store.city(snapshot, input.city_id);
    const rows = this.rows(dataset, input.season);
    return this.reply(
      snapshot,
      {
        city_id: input.city_id,
        season: input.season,
        period_a: input.period_a,
        period_b: input.period_b,
        valid_years_a: aYears.length,
        valid_years_b: bYears.length,
        difference_definition: 'B - A',
        metrics: Object.fromEntries(
          seasonMetrics.map((metric) => {
            const reason = notApplicable(input.season, metric);
            const mean = (period: PeriodInput) =>
              rangeStats(rows, metric, period.start_year, period.end_year).mean;
            const a = reason ? null : mean(input.period_a);
            const b = reason ? null : mean(input.period_b);
            const delta = a === null || b === null ? null : b - a;
            return [
              metric,
              {
                mean_a: a,
                mean_b: b,
                difference: delta,
                unit: meta[metric].unit,
                display_a: number(a, metric),
                display_b: number(b, metric),
                display_difference: signed(delta),
                status: reason ? 'not_applicable' : 'available',
                reason,
              },
            ];
          }),
        ),
      },
      provenance(dataset, input.season, [...aYears, ...bYears]),
    );
  }

  async rankYears(input: RankInput) {
    const snapshot = await this.store.snapshot();
    const years = this.period(snapshot, input.period);
    const limit = input.limit ?? Math.min(5, years.length);
    if (limit > years.length) throw new Error('limit supera il numero di anni nel periodo.');
    const dataset = await this.store.city(snapshot, input.city_id);
    const reason = notApplicable(input.season, input.metric);
    const selected = this.rows(dataset, input.season).filter(({ year }) => years.includes(year));
    const value = (row: SeasonYear): number => {
      const result = row[input.metric];
      if (result === null) throw new Error('Indicatore non disponibile.');
      return result;
    };
    const rows = reason
      ? []
      : selected.sort((a, b) => {
          const delta = value(a) - value(b);
          return (input.order === 'asc' ? delta : -delta) || a.year - b.year;
        });
    return this.reply(
      snapshot,
      {
        city_id: input.city_id,
        season: input.season,
        metric: input.metric,
        period: input.period,
        order: input.order,
        unit: meta[input.metric].unit,
        status: reason ? 'not_applicable' : 'available',
        reason,
        tie_break: 'year_ascending',
        entries: rows.slice(0, limit).map((row, index) => ({
          position: index + 1,
          year: row.year,
          label: yearLabel(input.season, row.year),
          value: value(row),
          display: number(value(row), input.metric, true),
        })),
      },
      provenance(dataset, input.season, years),
    );
  }
}
