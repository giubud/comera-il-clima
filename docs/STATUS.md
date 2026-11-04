# Stato del progetto

## B3 — 4 novembre 2026 — Verifiche locali e prove nell’agente superate

Piano e dipendenze approvati dal proprietario; branch `feat/mcp-server`.
Implementati quattro strumenti stdio in TypeScript strict nel pacchetto `mcp/` separato.
Input Zod, dati JSON pubblici, cache in memoria, hash, tipi e calcoli condivisi con il sito.
Unità, fonte ERA5, limiti, Non applicabile e avviso orario accompagnano le risposte.

Passano 30 test MCP e una prova stdio reale sul sito online con i quattro strumenti e i
numeri delle tre domande del proprietario. Sono documentate le configurazioni di Claude Code,
Claude Desktop e Codex. Il job CI dedicato è configurato con sola lettura del repository.
Verifica completa superata con Node 22: lint, formattazione, limiti dei 60 sorgenti,
TypeScript del sito e del server, 57 test del sito, 30 test MCP, validazione dati,
entrambe le build e 33 E2E. I JSON e i calcoli esistenti restano invariati.
Le tre domande nell’app sono superate. Restano pubblicazione della PR e verifica CI remota.
Il 04/11 il proprietario configura il server stdio in Codex e ne conferma l’abilitazione.
Dopo il riavvio i quattro strumenti sono disponibili in questa chat Codex.
La chiamata reale a list_cities restituisce 10 città, 4 stagioni e 5 indicatori, archivio
1961–2025 e versione 153f99695e250a1e.
Prima domanda superata in questa chat: list_cities e get_season restituiscono le 10 città e
Milano Inverno 2024/25, dal 01/12/2024 al 28/02/2025, 90 giorni validi e 21 giorni di gelo.
Fonte ERA5/Open-Meteo e limite delle celle di griglia espliciti; risultato uguale a Inspector.
Seconda domanda superata in questa chat: compare_periods restituisce per Roma JJA le medie
1961–1990 e 1996–2025: temperatura 23,2 e 25,3 °C (+2,1), caldo 31,7 e 57,9 giorni (+26,2),
precipitazioni 115,6 e 78,9 mm (−36,7). Entrambi i periodi hanno 30 anni validi.
La risposta espone il limite delle celle di griglia e il cambio da UTC+2 a UTC+1 dal 2021.
Terza domanda superata in questa chat con rank_years: autunni più piovosi a Palermo
2003 (389,2 mm), 1976 (337,1), 2019 (332,9), 1997 (332,6), 2021 (321,6).
Tutte le risposte coincidono con le verifiche sui dati pubblici, versione 153f99695e250a1e.
Git e pubblicazione restano al proprietario.
Il proprietario collega Inspector 2.13.0 e verifica list_cities sui dati online.
Corretti gli avvisi di portabilità: schemi espliciti per dati e provenienza e rami anyOf
per i valori null, con test di regressione. Il verificatore di Inspector 2.13.0 applicato
alla build finale segnala zero errori e zero avvisi sui quattro strumenti.
Il proprietario esegue get_season in Inspector: Milano Inverno 2024/25, 90 giorni e 21 di gelo.
Il proprietario riavvia Inspector e conferma visivamente i quattro strumenti senza avvisi.
Sono superati il controllo manuale con Inspector e le tre domande nella chat Codex.
Su PowerShell con script disabilitati si usa npx.cmd, senza cambiare la execution policy.
Nel piano HTML sono inserite le tre domande confermate e note con verifiche passate e pendenti.
La spunta Fatto resta al proprietario; B3 non è ancora pubblicato.

## B2 — 3 novembre 2026 — Completato e pubblicato

PR del codice n. 11 integrata dal proprietario, merge `f068aa3`. Il primo aggiornamento Actions
ha superato due interruzioni HTTP 503 del servizio conservando cache e quote; il terzo tentativo
ha validato 50 risposte annuali 2021–2025, eseguito tutti i controlli e creato la PR dati n. 12.
Il proprietario ha autorizzato la CI n. 32 e integrato la PR il 03/11, merge `902a314`.
CI su main n. 33 e pubblicazione Pages n. 21 riuscite; copia locale aggiornata dal proprietario.

Archivio pubblico 1961–2025, 2.600 stagioni, versione `153f99695e250a1e`:
15 JSON, 1.410.766 byte, storico conservato. Il proprietario conferma Milano Inverno 2024/25 online.
Il secondo avvio Actions, run `41610950006`, termina verde: nessun download, nessun dato nuovo,
versione invariata e proposta PR saltata. Ripassano 57 test unitari e 33 E2E.
Le tre verifiche B2 nel piano personale HTML sono aggiornate; la spunta Fatto è del proprietario.
Le sezioni seguenti descrivono stati storici precedenti alla pubblicazione.

## B2 — 2 novembre 2026 — Implementazione locale, pubblicazione ancora da eseguire

Branch `ci/data-refresh`, lavoro locale completo e controllo manuale del proprietario superato.
Il workflow annuale/manuale prepara aggiornamenti incrementali,
li valida e controlla e propone una PR con permessi separati e minimi. Nessun merge automatico.
L'avvio remoto richiederà prima la pubblicazione del codice a cura del proprietario.

Sono scaricati e validi i 50 blocchi reali 2021–2025: cache annuale 650/650, nessun download attivo.
L'archivio esteso è nella prova separata `.cache/plan-preview/b2-real/`, versione
`153f99695e250a1e`, 2.600 stagioni. I 15 JSON occupano 1.410.766 byte, gzip 156.299.
La ripetizione è identica byte per byte, incluse date e versioni. Tutto lo storico è conservato.
`public/data` resta il riferimento B1: il workflow deve poter proporre la prima vera PR dei dati.

Controlli locali: 57 test unitari e 33 E2E passati. Sei ulteriori casi nel browser usano
l'archivio reale fino al 2025: quattro stagioni, due temi, schermi da 320 a 1440 pixel,
URL dopo ricaricamento, anni bisestili, 65 righe di CSV e punti del grafico entro l'area prevista.
Nessun errore JavaScript, overflow della pagina o chiamata del browser all'API climatica.
La differenza UTC+1/UTC+2 delle nuove estati è dichiarata e visibile nella vista interessata.
Tutte le otto verifiche passano sia sul prodotto attuale sia su una copia isolata del vero
archivio 1961–2025: lint, formattazione, limiti sorgenti, TypeScript, unitari, dati, build ed E2E.
I 52 sorgenti restano entro 300 righe e 100 caratteri. Nessuna nuova dipendenza.

Anteprima separata: `http://127.0.0.1:4184/comera-il-clima/`.
Il proprietario ha confermato Milano Inverno 2024/25, periodo B 1996–2025 e conservazione
delle impostazioni dopo F5. Ha verificato l'avviso della discontinuità oraria in estate e
scaricato il CSV JJA: l'ultima riga inizia con `2025,JJA,2025-06-01,2025-08-31,92,`.
Restano pubblicazione della PR del codice, primo avvio Actions con `to_year=2025`,
revisione e merge della PR automatica, verifica del deploy e secondo avvio senza novità.
Il proprietario esegue i passaggi Git, PR e merge, guidato uno alla volta. B2 non è concluso online.
Prove in `.cache/plan-preview/b2-real/`; procedura in README e CONTRIBUTING.

B1 è concluso: PR n. 10 integrata dal proprietario, merge `e4c855d`, CI n. 29 e deploy n. 19
riusciti; tutti i 21 file pubblicati coincidevano con la build. Le sezioni sotto sono storiche.

## B1 — 31 ottobre 2026 — Completato in locale, PR da preparare

Branch `feat/seasons`, riferimento main `129d25d`. L'archivio reale è completo:
600 risposte annuali valide, dieci città e 2.400 stagioni. Il download è terminato.
Schema 2, versione logica `1fdffa12eabc7b22`. Nessuna nuova dipendenza.
Le cache precedenti sono conservate; nessuna risposta grezza è aggiunta al repository.

Sono disponibili inverno, primavera, estate e autunno, con selettore nell'URL,
giorni di gelo (Tmin <0 °C) e giorni con precipitazioni giornaliere ≥20 mm.
L'inverno appartiene all'anno in cui termina: 1961 = dicembre 1960–febbraio 1961.
HotDays in DJF e frostDays in JJA sono esclusioni esplicite della vista: null con motivo,
“Non applicabile” su sito e CSV. Un conteggio realmente pari a zero resta zero.

Le estati sono ricalcolate dalla fonte giornaliera originale; le altre tre stagioni
usano il nuovo download. `source` e `summerSource` documentano le provenienze e gli scarti
UTC rispettivamente +1 e +2 ore. Il pilota aveva mostrato una differenza fra le fonti;
non la attribuiamo con certezza a una sola causa. Tutti i 1.800 valori estivi precedenti,
le medie e il riepilogo compatto passano il confronto esatto con il riferimento `129d25d`.
Il dubbio sulla rappresentatività di Venezia resta aperto, come nella precedente edizione.

Controlli finali superati con Node 22: lint, formattazione, limiti dei 51 sorgenti,
TypeScript, 42 test unitari, validazione dell'archivio reale completo, build e 32 E2E.
Dei 32 E2E, 14 usano i dati reali e 18 l'archivio di prova, confinato ai test.
Otto ulteriori anteprime della build reale coprono quattro stagioni, due temi e 320–1440 pixel:
nessun errore JavaScript, nessun overflow e nessuna chiamata del browser all'API climatica.
Verificati CSV reali, inverno bisestile, esclusioni e Roma 2003 con 81 giorni >30 °C.

I JSON passano da 12 file e 400.728 byte a 15 file e 1.303.664 byte: +902.936 byte, circa 3,25×.
La somma gzip dei singoli file passa da 54.217 a 143.226 byte. La stima iniziale era 1–1,3 MB.
Il nuovo archivio è stato validato completamente prima della sostituzione di quello locale.
Su Windows il server temporaneo impediva la rinomina delle cartelle: il rollback ha conservato
il dataset precedente; chiudere il server e ripetere la build ha completato lo scambio.
Una risposta non JSON durante il download è stata superata riprendendo dai dati mancanti.

Il proprietario ha verificato Milano nell'anteprima parziale: inverno 1963/64 e 68 giorni di gelo,
esclusioni in inverno ed estate, primavera 1964 conservata dopo ricaricamento, 8 giorni ≥20 mm,
medie A 4,4 e B 3,5 con differenza −0,9, leggibilità nei due temi e riga CSV 1964 coerente.
L'anteprima locale sulla porta 4182 ora mostra la build completa delle dieci città.
Le note B1 del piano HTML sono aggiornate; la spunta “Fatto” resta al proprietario.

Prove in `.cache/plan-preview/seasons-checks/` e `seasons-final/`; dettagli in
[SEASONS.md](SEASONS.md), [METHODOLOGY.md](METHODOLOGY.md) e [DECISIONS.md](DECISIONS.md).
Restano revisione manuale finale, staging, commit, push, PR, CI, merge e verifica del deploy.
Questi passaggi spettano al proprietario, guidato un passaggio alla volta. B1 non è ancora
pubblicato e non è concluso sull'ambiente online. L'agente non esegue operazioni Git al suo posto.
A6 è concluso tramite PR n. 9, con CI e deploy riusciti e gli otto topic verificati dall'utente.
Le sezioni precedenti che seguono descrivono lo stato storico prima delle rispettive pubblicazioni.

## Revisione A6 — 28 ottobre 2026

Stato: presentazione del progetto completata in locale sul branch `docs/showcase`.
Riferimento iniziale: `b829dd9`, A5 concluso tramite PR n. 8 con CI e deploy verdi.
L'header include “Codice su GitHub”, link nativo nella stessa scheda, con colori e focus
dei temi esistenti. Su telefono le azioni sono su una seconda riga. Il vincolo della
colonna centrale consente ai pannelli di rientrare anche nella larghezza di 320 pixel.
La prova dedicata copre cinque larghezze, da 320 a 1440 pixel, in entrambi i temi:
link raggiungibile con Tab, focus visibile, contrasto almeno 4,5:1 e nessun overflow.
Le schermate e i risultati sono in `.cache/plan-preview/a6/`.

Il README apre con frase, badge CI di main, demo, GIF e diagramma della pipeline.
Comandi, licenze e limiti dei dati sono conservati più in basso.
I cinque punti di “Come l'ho costruito” sono stati confermati dal proprietario
prima dell'inserimento; descrivono il lavoro svolto senza aggiungere esperienze inventate.
L'anteprima reale mostra Roma, Milano, giorni >30 °C e tema scuro:
960 × 640 pixel, quattro fotogrammi, 8 secondi, 172.998 byte, riproduzione singola.
Sono presenti anche l'immagine statica e la guida `docs/RECORDING.md`.
Playwright e Pillow già disponibili nell'ambiente hanno prodotto i fotogrammi e la GIF;
nessuna dipendenza del progetto è stata aggiunta o aggiornata.

Passano lint, format:check, source:check, TypeScript, 26 test unitari, dati, build e 14 E2E.
Dati, schema e calcoli sono invariati. Registrare la demo non fa parte della build o CI.
Prossime azioni del proprietario: controllo del link e del README, commit, push e PR,
poi merge con CI verde e verifica della pubblicazione, guidati un passaggio alla volta.
Gli otto topic suggeriti sono nel piano HTML; li imposta il proprietario su GitHub.
La leggibilità del README su GitHub da telefono e l'impostazione dei topic restano da confermare.
A6 rimane aperto fino al completamento di questi passaggi.

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
