# Istruzioni per gli agenti

## Scopo
Com’era il clima confronta le estati di dieci città italiane tra il 1961 e il 2020.
Usa dati ERA5 per temperatura media, giorni con massima >30 °C e precipitazioni totali.
Offre confronti, grafici, mappa, tabella e CSV senza chiamare API climatiche dal browser.

## Comandi
Usa Node.js 22, come indicato in `.nvmrc` e `package.json`.

| Attività | Comando |
| --- | --- |
| Installazione dal lockfile | `npm ci` |
| Sviluppo | `npm run dev` |
| Controllo TypeScript | `npm run typecheck` |
| Test unitari | `npm test` |
| Validazione dati | `npm run data:validate` |
| Build | `npm run build` |
| E2E | `npm run test:e2e` |

Gli E2E avviano il server automaticamente e usano Microsoft Edge in locale.
In CI installa Chromium con `npx playwright install --with-deps chromium` prima degli E2E.
La pipeline dati è separata dalla build: non rigenerare i dataset senza necessità.

## Regole di codice
- Mantieni TypeScript strict, `noUncheckedIndexedAccess` ed `exactOptionalPropertyTypes`.
- Non usare `any`, nemmeno nei cast; usa tipi espliciti o `unknown` con controlli.
- Mantieni ogni riga sotto i 100 caratteri.
- Prima di aggiungere una dipendenza, chiedi e attendi l'approvazione dell'utente.

## Workflow
- Prima di modificare file, presenta un piano e attendi la conferma dell'utente.
- Un'attività = un branch = una pull request; non fare mai commit su `main`.
- Usa Conventional Commits in inglese, per esempio `chore: add agent instructions`.
- Registra ogni decisione rilevante in `docs/DECISIONS.md`.
- Esegui typecheck, test, validazione dati, build ed E2E prima di proporre il merge.
- Fai merge solo con tutti i controlli CI richiesti verdi.
- La CI delle PR esegue typecheck, test, validazione dati e build; gli E2E sono nel deploy.
