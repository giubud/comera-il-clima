import { execFileSync } from 'node:child_process';
import { cpSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { env } from 'node:process';
import console from 'node:console';

// Run only as the trusted, separate GitHub Actions job. No local Git mutations are permitted.
if (env.GITHUB_ACTIONS !== 'true' || env.GITHUB_REF !== 'refs/heads/main' || !env.GH_TOKEN)
  throw new Error('Questo script pubblica proposte solo nel workflow GitHub Actions su main.');
const run = (tool, args) => execFileSync(tool, args, { encoding: 'utf8', stdio: 'pipe' }).trim();
const git = (...args) => run('git', args);
const gh = (...args) => run('gh', args);
const candidate = JSON.parse(readFileSync('.cache/refresh-package/data/manifest.json', 'utf8'));
if (!Number.isInteger(candidate.lastYear) || candidate.lastYear < 2020 || candidate.lastYear > 9999)
  throw new Error('Anno del pacchetto non valido.');
const branch = `automation/data-refresh-${candidate.lastYear}`;
const workspace = resolve('.');
const output = resolve('public/data');
if (!output.startsWith(workspace + sep)) throw new Error('Percorso dati fuori dal workspace.');
const allowed =
  /^(manifest|torino|milano|venezia|bologna|firenze|roma|napoli|bari|palermo|cagliari)\.json$/;
const entries = readdirSync('.cache/refresh-package/data', { withFileTypes: true });
if (
  entries.length !== 12 ||
  entries.some(
    (entry) =>
      entry.isSymbolicLink() ||
      !(entry.isFile()
        ? allowed.test(entry.name)
        : entry.isDirectory() && entry.name === 'seasons'),
  )
)
  throw new Error('Il pacchetto contiene file diversi dai dati previsti.');
const seasonal = readdirSync('.cache/refresh-package/data/seasons', { withFileTypes: true });
if (
  seasonal.length !== 4 ||
  seasonal.some((e) => !e.isFile() || !/^(DJF|MAM|JJA|SON)\.json$/.test(e.name))
)
  throw new Error('Riepiloghi inattesi nel pacchetto.');

git('fetch', 'origin', 'main');
if (git('rev-parse', 'origin/main') !== env.GITHUB_SHA)
  throw new Error('main è cambiato durante il download. Ripeti il workflow: cache conservata.');
git('config', 'user.name', 'github-actions[bot]');
git('config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com');
const remote = git('ls-remote', '--heads', 'origin', 'refs/heads/' + branch);
if (remote) {
  git('fetch', 'origin', 'refs/heads/' + branch);
  git('checkout', '-B', branch, 'FETCH_HEAD');
  const outside = git('diff', '--name-only', 'origin/main...HEAD')
    .split('\n')
    .filter((file) => file && !file.startsWith('public/data/'));
  if (outside.length) throw new Error('Il branch automatico contiene modifiche estranee ai dati.');
  git('merge', '--no-edit', 'origin/main');
} else git('checkout', '-B', branch, 'origin/main');
const existing = JSON.parse(readFileSync('public/data/manifest.json', 'utf8'));
if (existing.dataVersion !== candidate.dataVersion) {
  rmSync(output, { recursive: true });
  cpSync('.cache/refresh-package/data', output, { recursive: true });
  git('add', '--', 'public/data');
  git('commit', '-m', `data: extend climate archive through ${candidate.lastYear}`);
}
git('push', 'origin', 'HEAD:refs/heads/' + branch);
const prs = JSON.parse(
  gh('pr', 'list', '--base', 'main', '--head', branch, '--state', 'open', '--json', 'number'),
);
if (prs.length) {
  const body = readFileSync('.cache/refresh-package/summary.md', 'utf8');
  writeFileSync('.cache/refresh-package/pr-update.json', JSON.stringify({ body }));
  gh(
    'api',
    '--method',
    'PATCH',
    `repos/${env.GITHUB_REPOSITORY}/pulls/${prs[0].number}`,
    '--input',
    '.cache/refresh-package/pr-update.json',
  );
  console.log(`PR n. ${prs[0].number} aggiornata. Il merge resta al proprietario.`);
} else {
  console.log(
    gh(
      'pr',
      'create',
      '--base',
      'main',
      '--head',
      branch,
      '--title',
      `data: extend climate archive through ${candidate.lastYear}`,
      '--body-file',
      '.cache/refresh-package/summary.md',
    ),
  );
}
