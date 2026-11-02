import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const state = vi.hoisted(() => ({
  remote: false,
  updatedMain: false,
  existingPr: false,
  calls: [] as { tool: string; args: string[] }[],
}));
vi.mock('node:child_process', () => ({
  execFileSync: (tool: string, args: string[]) => {
    state.calls.push({ tool, args });
    if (tool === 'git' && args[0] === 'rev-parse') return state.updatedMain ? 'different' : 'base';
    if (tool === 'git' && args[0] === 'ls-remote') return state.remote ? 'remote-head' : '';
    if (tool === 'gh' && args[0] === 'pr' && args[1] === 'list')
      return state.existingPr ? '[{"number":20}]' : '[]';
    return '';
  },
}));
vi.mock('node:fs', () => ({
  readFileSync: (file: string) =>
    file.endsWith('manifest.json')
      ? JSON.stringify(
          file.includes('refresh-package')
            ? { lastYear: 2025, dataVersion: 'new' }
            : { lastYear: 2020, dataVersion: 'old' },
        )
      : 'Riepilogo della proposta',
  readdirSync: (file: string) =>
    file.endsWith('seasons')
      ? ['DJF', 'MAM', 'JJA', 'SON'].map((s) => ({
          name: s + '.json',
          isFile: () => true,
          isSymbolicLink: () => false,
          isDirectory: () => false,
        }))
      : [
          'manifest',
          'torino',
          'milano',
          'venezia',
          'bologna',
          'firenze',
          'roma',
          'napoli',
          'bari',
          'palermo',
          'cagliari',
          'seasons',
        ].map((name) => ({
          name: name === 'seasons' ? name : name + '.json',
          isFile: () => name !== 'seasons',
          isSymbolicLink: () => false,
          isDirectory: () => name === 'seasons',
        })),
  rmSync: vi.fn(),
  cpSync: vi.fn(),
  writeFileSync: vi.fn(),
}));

describe('pubblicazione della proposta: Git e API simulati, nessuna modifica reale', () => {
  beforeEach(() => {
    vi.resetModules();
    state.calls = [];
    state.remote = false;
    state.updatedMain = false;
    state.existingPr = false;
    vi.stubEnv('GITHUB_ACTIONS', 'true');
    vi.stubEnv('GITHUB_REF', 'refs/heads/main');
    vi.stubEnv('GITHUB_SHA', 'base');
    vi.stubEnv('GH_TOKEN', 'test-token');
    vi.stubEnv('GITHUB_REPOSITORY', 'example/climate');
  });
  afterEach(() => vi.unstubAllEnvs());
  it('propone solo public/data su un branch dedicato, senza merge né force push', async () => {
    await import('../scripts/publish-refresh.mjs');
    expect(state.calls).toContainEqual({ tool: 'git', args: ['add', '--', 'public/data'] });
    expect(state.calls).toContainEqual({
      tool: 'git',
      args: ['push', 'origin', 'HEAD:refs/heads/automation/data-refresh-2025'],
    });
    expect(state.calls.some((c) => c.tool === 'gh' && c.args[1] === 'create')).toBe(true);
    expect(state.calls.some((c) => c.args.includes('--force'))).toBe(false);
    expect(state.calls.some((c) => c.tool === 'gh' && c.args.includes('merge'))).toBe(false);
  });
  it('aggiorna la PR esistente senza crearne un’altra', async () => {
    state.remote = true;
    state.existingPr = true;
    await import('../scripts/publish-refresh.mjs');
    expect(state.calls.some((c) => c.tool === 'gh' && c.args[1] === 'create')).toBe(false);
    expect(state.calls.some((c) => c.tool === 'gh' && c.args.includes('PATCH'))).toBe(true);
  });
  it('si ferma se main cambia mentre i dati vengono preparati', async () => {
    state.updatedMain = true;
    await expect(import('../scripts/publish-refresh.mjs')).rejects.toThrow(/main è cambiato/);
    expect(state.calls.some((c) => c.args[0] === 'push')).toBe(false);
  });
  it('rifiuta l’esecuzione locale prima di qualsiasi operazione Git', async () => {
    vi.stubEnv('GITHUB_ACTIONS', '');
    await expect(import('../scripts/publish-refresh.mjs')).rejects.toThrow(/solo nel workflow/);
    expect(state.calls).toHaveLength(0);
  });
});
