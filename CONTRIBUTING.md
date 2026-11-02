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
3. Eseguire una richiesta pilota limitata e controllare 365/366 date, unità, valori mancanti
   e coordinate restituite.
4. Scaricare l’intervallo completo con `npm run data:fetch -- --city <id>`.
5. Eseguire `npm run data:build` e `npm run data:validate`.
6. Aggiornare i test che fissano il numero e l’ordine delle città.

Non modificare modello o coordinate fra periodi e non sostituire silenziosamente la fonte.

## Aggiornare i dati

```bash
npm run data:fetch -- --all --from 2021 --to 2025 --limit 300
npm run data:build -- --to 2025
npm run data:validate
```

Questo esempio estende il riferimento B1 fino al 2025. Leggere prima `public/data/manifest.json`:
negli aggiornamenti successivi usare `--from` uguale a `lastYear + 1`. Se l'anno richiesto è già
presente, non avviare il download. La build senza `--to` conserva l'intervallo pubblicato.
Controllare il diff dei JSON e del manifest. Gli aggiornamenti non riscrivono gli anni presenti;
una revisione storica del fornitore richiede un'attività distinta e una motivazione esplicita.
La cache annuale `.cache/open-meteo-seasons-v2/` e quelle estive `.cache/open-meteo-land/`
e `.cache/open-meteo/` non devono essere committate. Non cancellare la cache senza approvazione del proprietario.

Per confrontare la revisione `land` con i dati precedenti, eseguire `npm run data:compare`.
Il riferimento iniziale è il commit `9ef44cd`; il comando mostra A, B e B−A prima/dopo.

`data:build` produce i quattro riepiloghi `seasons/<codice>.json`. Se cambiano soltanto i dati cittadini già pubblicati, `npm run data:summers` rigenera il riepilogo senza interrogare la fonte. Per la mappa, `npm run geo:build` scarica solo durante la preparazione world-atlas 2.0.2 e salva un GeoJSON locale. Controllare le licenze in `DATA_LICENSE.md`.

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

## Archivio stagionale B1

Lo schema 2 e la procedura di ricostruzione sono descritti in [SEASONS.md](docs/SEASONS.md).
`data:fetch` usa la cache annuale separata e un massimo predefinito di 300 risposte nuove;
`data:status` controlla l'avanzamento senza rete. Non eseguire due download insieme.
Solo la ricostruzione storica `npm run data:build -- --rebuild` richiede le 600 risposte annuali
e le 600 estati originali. L'aggiornamento progressivo richiede lo storico JSON e le nuove fonti.
La regressione estiva è un vincolo: non aggiornare il riferimento per nascondere variazioni.
La pipeline mantiene il prodotto precedente se le fonti non sono complete e valide.
I dati sintetici stagionali sono riservati ai test e non devono essere pubblicati.

## Workflow annuale B2

Pubblicare prima la PR del codice B2. Il workflow diventa avviabile quando è presente su `main`.
L'estensione reale viene proposta in una successiva PR di soli dati generata dal workflow.

1. In **Settings → Actions → General → Workflow permissions**, abilitare
   **Allow GitHub Actions to create and approve pull requests**. Il nome include le approvazioni,
   ma il nostro workflow usa questa possibilità soltanto per creare o aggiornare PR.
   Non occorre allargare i permessi predefiniti di tutti i workflow.
2. In **Actions → Refresh climate data → Run workflow**, scegliere `main` e inserire `2025`
   per il primo aggiornamento del riferimento B1. Vuoto seleziona l'anno precedente.
3. Attendere download e controlli. La scheda Summary mostra le differenze per ogni città,
   gli anni aggiunti e i cinque indicatori dell'ultimo anno per ciascuna stagione.
4. Aprire la PR sul branch `automation/data-refresh-2025`. Se GitHub mostra **Approve workflows to run**,
   approvare l'avvio della CI dalla pagina della PR. Attendere `verify` verde e controllare i dati.
5. Fare personalmente il merge e verificare CI e deploy su `main`, come nelle attività precedenti.
6. Ripetere lo stesso avvio: l'esito deve indicare nessun dato nuovo, senza modificare file o date
   e senza aprire un'altra PR. Una PR aperta per gli stessi dati viene riutilizzata.

I permessi sono limitati per job: preparazione `contents: read`; proposta `contents: write`
e `pull-requests: write`. Non si usano PAT, `actions: write`, `pages: write`, `id-token` o
approvazioni automatiche. Il secondo job non installa dipendenze: esegue solo lo script Node
del commit affidabile che ha avviato il workflow e copia il pacchetto verificato dal primo job.
La cache usa il token di runtime delle Actions e non richiede `actions: write`.

Il workflow non si avvia da PR o fork e serializza gli avvii senza cancellare quello in corso.
Il job con permessi di scrittura si ferma se `main` è cambiato durante il download; ripetere
il workflow. Il branch automatico è riservato ai dati: non modificarvi codice a mano.
Non si fanno force push. Il corpo della PR passa da un file, senza interpolazioni nel comando.

`actions/cache` usa `.cache/open-meteo-seasons-v2`, non il vecchio archivio nearest
`.cache/open-meteo`. Ogni tentativo conserva risposte valide e `quota.json`; non salva lock o file
temporanei. Se una quota impone una pausa lunga o i 429 persistono, il workflow fallisce con
l'orario di ripresa o un errore esplicito. Rilanciarlo solo dopo la pausa; non azzerare il registro.
La perdita della cache non obbliga a riscaricare lo storico: i JSON già pubblicati sono validati
prima di essere riutilizzati. L'API gratuita resta soggetta ai termini d'uso non commerciale.

Il cron annuale è `17 5 1 3 *` in UTC. Controllare l'abilitazione del workflow dopo lunghi periodi
di inattività: GitHub può disabilitare la pianificazione dei repository pubblici dopo 60 giorni.
Non vengono creati commit artificiali o avvii aggiuntivi per aggirare questa regola.

Riferimenti verificati il 02/11/2026:
[permessi](https://docs.github.com/en/actions/reference/workflows-and-actions/workflow-syntax#permissions),
[avvio delle CI](https://docs.github.com/en/actions/how-tos/write-workflows/choose-when-workflows-run/trigger-a-workflow),
[cache](https://docs.github.com/en/actions/reference/workflows-and-actions/dependency-caching),
[pianificazioni](https://docs.github.com/en/actions/how-tos/manage-workflow-runs/disable-and-enable-workflows),
[quote Open-Meteo](https://open-meteo.com/en/pricing).
