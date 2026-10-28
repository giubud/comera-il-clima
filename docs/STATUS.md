# Stato del progetto

## Revisione A5, Fase 2 — 28 ottobre 2026

Stato: suddivisione completata e verificata in locale sul branch `refactor/split-console`.
Riferimento iniziale: `cc2c538`, Fase 1 pubblicata tramite PR n. 7 con CI e deploy verdi.
`src/console-v3.ts` passa da 641 a 57 righe; `v3.css` importa cinque fogli da `src/styles/`.
Stato, selettori, caricamenti e interazioni sono in `src/app/`; le sezioni sono in `src/ui/`.
La struttura è descritta con diagramma in `docs/ARCHITECTURE.md`.
Tutti i 34 sorgenti TypeScript e CSS rispettano 300 righe per file e 100 caratteri per riga.
Massimo rilevato: 280 righe. `npm run source:check` impone i limiti anche nella CI.
`.gitattributes` mantiene LF su Windows per conservare la conformità a Prettier dopo checkout.
Il riferimento JSON conserva la regola esplicita e le impronte originali.
TypeScript, 26 test unitari e 14 E2E passano dopo ogni estrazione o revisione di un modulo.
Il rapporto `.cache/plan-preview/a5-phase2-checks/summary.jsonl` ha 30 punti, tutti superati.
Controllo finale superato: TypeScript, test, E2E, lint, format:check, source:check, dati e build.
DOM identico prima/dopo nei sei casi desktop/tablet/mobile e temi chiaro/scuro.
Nessuna differenza percettiva tra le immagini con soglia 0,05; alcuni PNG non sono
byte-identici per minime variazioni di colore nel rendering. Font esterni disattivati.
Ordine, selettori e dichiarazioni CSS invariati; CSS compilato byte-identico all'iniziale.
Tutti i moduli raggiungibili dall'avvio, senza dipendenze circolari.
Dati, schema e librerie originali invariati; `dataVersion` resta `4e434940c5eff13b`.
Nessuna nuova dipendenza; nessuna API climatica interrogata o cache dei dati cancellata.
Le prove sono in `.cache/plan-preview/a5-phase2-*`; le note del piano HTML sono aggiornate.
Prossima azione: revisione del proprietario, poi commit, push e PR guidati un passo alla volta.
CI della PR, merge e pubblicazione restano da verificare; A5 non è ancora concluso sul sito.
L'agente non esegue commit, push, PR, merge o aggiornamento di main al posto del proprietario.

## Revisione A5, Fase 1 — 27 ottobre 2026

Stato: configurazione e formattazione verificate sul branch `chore/prettier-eslint`.
Prettier 3.9.10, ESLint 10.13.0 e typescript-eslint 8.72.1 sono installati con Node 22.
Il proprietario approva TypeScript 6.0.3 per la compatibilità con il parser; strict invariato.
`npm run lint` usa recommended JavaScript e strict TypeScript; nessuna regola disattivata.
Corretti 28 non-null assertion tramite `requireDefined` e una variabile inutilizzata.
`npm run format:check` usa printWidth 100 e passa su tutti i file inclusi.
Il proprietario ha creato il commit di configurazione `1e3f750` e quello di formato `c97c4d1`.
I 37 file del secondo commit coincidono esclusivamente con l'output di Prettier sul primo.
Entrambi i comandi sono nella CI; dataset, geografia generata e HTML personale sono esclusi.
Controlli superati: lint, format:check, TypeScript, 26 test unitari, dati, build e 14 E2E.
I dati pubblici sono invariati; `dataVersion` resta `4e434940c5eff13b`.
DOM identico prima/dopo in sei casi desktop/tablet/mobile e temi chiaro/scuro.
Nel confronto finale tutte e sei le immagini PNG coincidono byte per byte con le iniziali.
Le prove, con font esterni disattivati in entrambi i casi, sono in `.cache/plan-preview/a5-*`.
Il limite della Fase 2 è 300 righe per modulo; la divisione resta per una nuova sessione.
L'hash completo del secondo commit è ora registrato nel file `.git-blame-ignore-revs`.
Prossima azione: il proprietario crea il terzo commit con quel file e questi aggiornamenti.
Poi push, PR e merge guidati un passaggio alla volta; merge solo con CI richiesta verde.
La Fase 1 attende CI e pubblicazione; A5 resta aperto fino alla conclusione della Fase 2.

Nota di manutenzione: npm audit segnala quattro pacchetti vulnerabili già nel lockfile
precedente: Vite 8.3.0, Vitest 5.0.1, @vitest/mocker 5.0.1 e source-map-js 1.2.1.
Sono strumenti di sviluppo, non dipendenze introdotte da questa fase; nessun fix automatico.
Il rapporto completo è in `.cache/plan-preview/a5-audit.json` per un intervento dedicato.

## Revisione A4 — 26 ottobre 2026

Stato: pulizia completata in locale sul branch `chore/remove-dead-code`.
Rimossi `src/styles.css` e sei moduli UI senza import in applicazione, script o test:
`cards.ts`, `chart.ts`, `controls.ts`, `rail.ts`, `ranking.ts`, `stripes.ts`.
Conservati `src/ui/table.ts`, `src/ui/legal.ts` e le dichiarazioni `src/vite-env.d.ts`.
Rimossa la copia `PIANO_COMERA_IL_CLIMA.md`; il piano unico resta `docs/PLAN.md`.
Prima della rimozione le due copie differivano soltanto per una riga vuota finale.
Il riferimento operativo nel piano è aggiornato; l'inventario iniziale resta storico.
Build prima/dopo con Node 22.20.0: 17 file, 485.701 byte, differenza di zero byte.
Le impronte SHA-256 coincidono per tutti i file prodotti, non soltanto per le dimensioni.
Verifiche superate: TypeScript, 26 test unitari, validazione dati, build e 14 test E2E.
Dati e applicazione attiva invariati; `dataVersion` resta `4e434940c5eff13b`.
Il runtime Node 22 è nella cache locale ignorata da Git; nessuna dipendenza aggiunta.
La validazione dati ha richiesto l'avvio fuori dal sandbox per un limite di Windows.
Il sandbox ha anche impedito la chiusura del server E2E dopo i test: arrestato soltanto
quel server temporaneo, il comando è terminato con codice zero e `14 passed`.
Le prove delle build sono in `.cache/plan-preview/a4-dist-before.json` e `a4-dist-after.json`.
Le note delle tre verifiche A4 sono aggiornate nel file personale `Verso-la-v4.html`.
Prossima azione: commit, push e PR eseguiti dal proprietario, con guida un passo alla volta.
CI della PR, merge e pubblicazione restano da verificare; A4 non è ancora concluso sul sito.
L'agente non esegue commit, push, PR, merge o aggiornamento di main al posto del proprietario.

## Revisione A3 — 9 ottobre 2026

Stato: implementazione completata in locale sul branch `fix/map-legend-a11y`.
La mappa ha una legenda con soglie reali, unità e limiti inclusi/esclusi.
Legenda e punti condividono la palette esistente, nei temi chiaro e scuro.
La legenda si aggiorna con indicatore e periodi; valori uniformi mostrano un solo colore.
Le strisce hanno nomi accessibili con anno, scostamento in σ a un decimale e direzione.
Per le precipitazioni il segno è invertito, in accordo con i colori caldo/secco.
La deviazione standard nulla è dichiarata, senza mostrare uno scostamento non definito.
Esempi per Roma 1961: `+1,3 σ, più caldo` e `+1,0 σ, più secco`.
Con i dati correnti, Venezia e Bologna condividono la classe 1 della temperatura.
`src/lib/aggregate.ts` e tutti i dati pubblici sono invariati.
Verifiche superate: TypeScript, 26 test unitari, validazione dati, build e 14 test E2E.
Schermate di legenda e nomi nell'albero di accessibilità controllati nei due temi,
su desktop e telefono; nessun errore JavaScript o overflow rilevato.
Decisioni, metodologia e note di verifica A3 nel file personale HTML aggiornate.
Prossima azione: revisione del proprietario, poi commit, push e PR guidati un passo alla volta.
L'agente non esegue commit, push, apertura PR, merge o aggiornamento di main al posto suo.

## Revisione A2 — 9 ottobre 2026

Stato: correzione completata in locale sul branch `fix/hotdays-format`.
Il test dei giorni annuali è stato eseguito prima della correzione: atteso `78 giorni`,
ottenuto `78,0 giorni`. Dopo la modifica i cinque test del formato passano.
Le viste annuali mostrano giorni interi; medie e scarti conservano un decimale.
Temperature, precipitazioni, CSV e dati climatici mantengono i valori precedenti.
Roma 2003: `81 giorni`, `27,4 °C`, `34,9 mm`; medie giorni A/B: `31,7` e `53,8`.
Verifiche superate: TypeScript, 26 test unitari, validazione dati, build e 11 test E2E.
Il nuovo E2E controlla scheda annuale, dieci città, grafico, strisce, medie e ricaricamento.
Corretto anche il problema locale dei fine riga dei JSON su Windows, senza rigenerazione.
La regola `.gitattributes` mantiene validi i byte usati dalle impronte dei dataset.
Versione dei dati invariata: `4e434940c5eff13b`.
Il file personale `Verso-la-v4.html` contiene le note delle tre verifiche A2.
Le spunte del proprietario e i prompt dell'esercitazione non sono stati modificati.
Controllo dei sei punti dell'interfaccia completato dall'agente su desktop e mobile:
schede annuali, dieci città, grafico, strisce, medie, tabella e differenze.
Schermate esaminate; nessun errore JavaScript o overflow della pagina rilevato.
Commit applicativo: `8114d4a`; branch inviato su GitHub su indicazione del proprietario.
Pull request: https://github.com/giubud/comera-il-clima/pull/4
Prossima azione: verifica della CI della PR e merge solo dopo tutti i controlli verdi.

## Revisione A1 — 6 ottobre 2026

Stato: punti 1–4 completati in locale sul branch `fix/era5-land-cells`.
Le richieste usano `land` con adattamento all'altitudine; la cache originale è conservata.
I dati sono stati rigenerati dal proprietario: 10 città, 600 estati.
Versione logica dei dati: `4e434940c5eff13b`.
Il confronto prima/dopo è disponibile con `npm run data:compare`.
Metodologia, fonti, decisioni e istruzioni della pipeline sono aggiornate.
Controlli locali superati: TypeScript, 22 test unitari, validazione dati, build e 10 test E2E.
Il test CSV verifica tutte le 60 righe rispetto al JSON cittadino corrente.
Solo Napoli cambia cella. La rappresentatività della cella di Venezia resta da approfondire,
come registrato in `docs/METHODOLOGY.md` e `docs/DECISIONS.md`.
Le modifiche non sono ancora committate o pubblicate; la CI della PR non è ancora stata eseguita.
Prossima azione: commit, push del proprietario e pull request.
Merge solo con la CI richiesta verde.

## Stato della revisione v3 — 28 settembre 2026

Ultimo aggiornamento: 28 settembre 2026
Fase attiva: Nessuna — revisione v3 pubblicata e verificata.
Fasi completate: Fasi 0–7 originali complete; revisione Claude Design v3 implementata e verificata localmente.
File modificati: console, stile, favicon, aggregati compatti, confini locali, generatori e validatori, test, screenshot e documentazione. Lo ZIP ricevuto resta non tracciato.
Comandi eseguiti ed esito: `typecheck`, 19 test unitari, `data:validate`, `build`, 10 test E2E e screenshot desktop/dark/tablet/mobile senza overflow: tutti superati. CI 36454375709 e deploy Pages 36454375525 riusciti.
Verifiche manuali realmente effettuate: schermate desktop e mobile esaminate; il riepilogo compatto coincide con 600 aggregati reali; geografia scaricata in build da world-atlas 2.0.2 e servita localmente. URL pubblici di pagina, `summers.json` e geografia restituiscono HTTP 200; browser pubblico mostra Roma, 10 città, 10 punti mappa e 60 righe annuali.
Decisioni aggiuntive: periodi interattivi e URL condivisibile; tema/ordine locali; testo legale e CSV conservati; attribuzione Natural Earth e world-atlas aggiunta.
Blocchi e prove del problema: la cache npm esterna era non scrivibile, risolto con `.cache/npm`; Playwright su Windows ha bloccato una trace EBUSY, risolto disabilitando trace solo in locale. Nessun blocco funzionale residuo.
Prossima azione concreta: nessuna. Per una futura sessione, riprendere soltanto da una nuova richiesta o da un controllo di manutenzione esplicito.
Commit applicativo: `5d0473a`.

## Pubblicazione

- Repository: https://github.com/giubud/comera-il-clima
- Sito verificato: https://giubud.github.io/comera-il-clima/
- Query verificata: https://giubud.github.io/comera-il-clima/?city=milano&metric=hotDays
- Workflow riuscito: https://github.com/giubud/comera-il-clima/actions/runs/35128276013
- Workflow aggiornamento console: https://github.com/giubud/comera-il-clima/actions/runs/35385458720
- Workflow crediti e licenze: https://github.com/giubud/comera-il-clima/actions/runs/36440019644
- Workflow revisione v3: https://github.com/giubud/comera-il-clima/actions/runs/36454375525

## Inventario iniziale

- Workspace: `C:\sviluppo\codex\com_era_il_clima`
- Contenuto iniziale: `PIANO_COMERA_IL_CLIMA.md`
- Istruzioni repository: nessun `AGENTS.md` rilevato
- Stato Git iniziale: directory non inizializzata come repository
- Fasi previste: 0 Preparazione; 1 Fonte; 2 Scaffold e calcoli; 3 Pipeline; 4 UI; 5 Grafico e accessibilità; 6 Qualità e documentazione; 7 GitHub Pages
