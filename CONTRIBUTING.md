# Contribuire

## Preparazione

Usare Node.js 22 e installare le dipendenze dal lockfile:

```bash
npm ci
```

Prima di una modifica leggere `docs/PLAN.md`, `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/METHODOLOGY.md` e `docs/DATA_SOURCES.md`.

## Aggiungere una città

1. Aggiungere ID, nome e coordinate a `src/data/cities.ts`.
2. Documentare la scelta in `docs/DECISIONS.md` e aggiornare la tabella delle coordinate.
3. Eseguire una richiesta pilota limitata e controllare 92 date, unità, null e coordinate restituite.
4. Scaricare l’intervallo completo con `npm run data:fetch -- --city <id>`.
5. Eseguire `npm run data:build` e `npm run data:validate`.
6. Aggiornare i test che fissano il numero e l’ordine delle città.

Non modificare modello o coordinate fra periodi e non sostituire silenziosamente la fonte.

## Rigenerare i dati

```bash
npm run data:fetch -- --all
npm run data:build
npm run data:validate
```

Controllare il diff dei JSON e del manifest. Una revisione del fornitore può cambiare gli
aggregati; registrare la nuova `dataVersion` e il motivo della rigenerazione.
La cache corrente `.cache/open-meteo-land/` e quella originale `.cache/open-meteo/`
non devono essere committate. Non cancellare la cache senza approvazione del proprietario.

Per confrontare la revisione `land` con i dati precedenti, eseguire `npm run data:compare`.
Il riferimento iniziale è il commit `9ef44cd`; il comando mostra A, B e B−A prima/dopo.

`data:build` produce anche `summers.json`. Se cambiano soltanto i dati cittadini già pubblicati, `npm run data:summers` rigenera il riepilogo senza interrogare la fonte. Per la mappa, `npm run geo:build` scarica solo durante la preparazione world-atlas 2.0.2 e salva un GeoJSON locale. Controllare le licenze in `DATA_LICENSE.md`.

## Verifiche richieste

```bash
npm run lint
npm run format:check
npm run source:check
npm run typecheck
npm test
npm run data:validate
npm run build
npm run test:e2e
```

I test ordinari e la build non devono usare la rete. Le pull request non devono contenere credenziali, dati sintetici nel prodotto o risposte giornaliere grezze.

## Formattazione e controlli statici

Prettier usa `printWidth: 100`, apici singoli e fine riga LF. Eseguire
`npx prettier --write .` per applicare la formattazione e `npm run format:check` per verificarla.
La configurazione esclude dati generati, cache, build, immagini e il piano HTML personale.
In particolare, non formattare `public/data/`: le impronte del manifest dipendono dai suoi byte.

ESLint usa le configurazioni recommended di JavaScript e strict di typescript-eslint.
Le versioni degli strumenti sono fissate nel lockfile; TypeScript resta alla versione 6.0.3,
compatibile con typescript-eslint 8.72.1. Le opzioni strict di `tsconfig.json` sono invariate.
Se una regola produce oltre 20 errori, discuterla con il proprietario prima di disattivarla.

Separare i commit di configurazione e correzione da quello di sola formattazione.
Dopo il commit di formattazione, aggiungerne l'hash completo a `.git-blame-ignore-revs`
in un commit successivo. Per usarlo anche in Git locale, eseguire
`git config blame.ignoreRevsFile .git-blame-ignore-revs` quando il file esiste.
Commit, push, PR e merge restano al proprietario, con guida un passaggio alla volta.

## Struttura dell'applicazione

`src/console-v3.ts` coordina l'avvio; `src/app/` gestisce stato, caricamenti e interazioni.
Ogni sezione dell'interfaccia ha un modulo in `src/ui/`. `src/v3.css` importa cinque fogli
in ordine esplicito da `src/styles/`. Il diagramma è in `docs/ARCHITECTURE.md`.

`npm run source:check` verifica tutti i file TypeScript e CSS in `src/`: massimo 300 righe
per file, incluse righe vuote e commenti, e 100 caratteri per riga. Il controllo è nella CI.
Dopo ogni estrazione di un modulo eseguire typecheck, test unitari ed E2E.
