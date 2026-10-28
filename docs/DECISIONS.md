# Decisioni

## 2026-09-16 — Avvio del progetto

- Il workspace iniziale non conteneva un repository Git né file applicativi.
- Si mantiene integralmente la specifica in `docs/PLAN.md`.
- Stack: Vite, TypeScript strict, DOM nativo, CSS, Vitest e Playwright.
- Fonte: Open-Meteo Historical Weather API con modello ERA5 esplicito.
- Distribuzione: GitHub Pages con base `/comera-il-clima/`.
- Non sono state introdotte decisioni aggiuntive né variazioni di ambito.

## 2026-09-16 — Ritmo delle richieste dati

- Le richieste annuali coprono più di due settimane e sono conteggiate in modo ponderato dal fornitore.
- Dopo un HTTP 429 osservato durante il primo scaricamento completo, il downloader è stato impostato a una richiesta ogni 1,1 secondi e a un'attesa di 60 secondi per i 429 privi di `Retry-After`.
- La cache valida ha permesso la ripresa senza ripetere le 365 richieste già completate.

## 2026-09-16 — Direzione visiva

- L'interfaccia adotta un'impostazione editoriale da archivio climatico: carta avorio, griglia verticale discreta, tipografia Georgia e superfici dati ad alto contrasto.
- Non si usano fotografie: i dati e il grafico costituiscono il centro visivo, in coerenza con l'ambito.

## 2026-09-16 — Workflow GitHub Pages

- Le versioni principali delle Actions sono state ricontrollate sulle release ufficiali: `checkout@v7`, `setup-node@v7`, `configure-pages@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5`.
- La CI esegue controlli senza rete climatica. Il workflow di deploy aggiunge i test E2E su Chromium prima di caricare l'artefatto Pages.

## 2026-09-18 — Console dati da handoff Claude Design

- Lo ZIP ricevuto è stato usato come riferimento visivo, non come fonte di dati o logica applicativa.
- L'impostazione editoriale è sostituita da una console dati full-width fedele all'handoff: rail delle città, quattro KPI, strisce di anomalia, serie annuale, classifica, tabella, tema chiaro/scuro e densità.
- Restano invariati stack, sorgente ERA5, formule, schema dei dataset cittadini, CSV e stato URL. Il manifest include ora i riepiloghi di periodo già verificati, così rail e classifica non richiedono il caricamento dei dieci dataset.
- Tema e densità sono preferenze locali (comera-console) e non entrano nel collegamento condivisibile.

## 2026-09-28 — Crediti e avvertenze

- Verificati termini Open-Meteo, CC BY 4.0 e licenza Copernicus sulle fonti ufficiali. Il README e il sito riportano fonte, modifiche ai dati, licenze distinte per dati e codice, credito C3S/ECMWF e la nota di responsabilità prevista dalla licenza Copernicus.
- La restrizione non commerciale riguarda l'uso dell'API gratuita Open-Meteo; il riuso dei dati ottenuti tramite l'API è descritto secondo CC BY 4.0.
- Sono accreditati il design consegnato dal proprietario con Claude Design e i font IBM Plex (SIL OFL 1.1). Le avvertenze distinguono la cella ERA5 dalla misura di stazione e chiariscono che le differenze tra periodi non provano causalità.

## 2026-09-28 — Revisione v3 da Claude Design

- Lo ZIP consegnato è stato trattato come specifica visiva e funzionale, non come fonte climatica. Non viene pubblicato nel repository. Rimangono Vite, TypeScript, ERA5, dieci città e gli stessi JSON cittadini.
- `summers.json` contiene i 600 aggregati annuali derivati dai JSON reali, con temperatura a due decimali, precipitazione a un decimale e giorni caldi interi; `data:validate` li confronta tutti con gli originali. Il CSV continua a usare il JSON cittadino e non è stato modificato.
- I periodi A e B sono selezionabili tra 1961 e 2020; il confronto iniziale rimane 1961–1990 contro 1991–2020. URL include i parametri analitici; tema e ordinamento restano locali. Periodi sovrapposti, disuguali o brevi generano un avviso, non un blocco.
- La mappa carica solo `public/geo/italia-110m.json` dal sito. Il file è generato in preparazione da world-atlas 2.0.2 / Natural Earth, con Italia e vicini. I confini non sono usati per calcolare gli indicatori.
- Le anomalie usano la deviazione standard campionaria del periodo A, la serie opzionale una media mobile centrata su cinque anni; la precipitazione inverte il verso caldo/secco. Sono convenzioni descrittive, non test statistici.
- Le frasi legali e il formato CSV già verificati rimangono identici. Si aggiungono soltanto attribuzione cartografica e descrizione dei nuovi calcoli. Playwright conserva le rispettive asserzioni.
- In locale la traccia Playwright è disabilitata per evitare un blocco EBUSY del file di trace osservato su Windows; nella CI Linux resta `retain-on-failure`.

## 2026-10-06 — Protezione del branch main

- `main` è protetto su GitHub: ogni integrazione passa da una pull request.
- È obbligatorio il controllo `verify`, emesso da GitHub Actions (app ID 15368).
- Il branch della PR deve essere aggiornato rispetto a `main` prima del merge.
- Il controllo comprende TypeScript, test unitari, validazione dati e build.
- Le regole valgono anche per gli amministratori; force push ed eliminazione sono vietati.
- Non sono obbligatorie approvazioni di altri utenti, per consentire il lavoro individuale.
- Gli E2E restano nel deploy; non sono un controllo obbligatorio della PR.
- Configurazione verificata tramite API GitHub dopo l'applicazione.

## 2026-10-06 — Celle ERA5 sulla terraferma e correzione altimetrica

Selezioniamo celle ERA5 sulla terraferma perché una cella marina può attenuare i picchi di
temperatura e rappresentare meno bene le condizioni della città costiera.

- Si usa `cell_selection=land`, mantenendo modello ERA5, coordinate richieste e periodi.
- Il proprietario ha approvato la rimozione di `elevation=nan`: con quel parametro `land`
  ricade su `nearest`, come confermato dal codice ufficiale Open-Meteo e dalle prove API.
- Il parametro `elevation` è ora omesso: Open-Meteo adatta le temperature alla quota del luogo.
  Questo cambia anche i risultati delle città interne; non è solo una scelta fra terra e mare.
- Le 600 risposte nuove sono salvate in `.cache/open-meteo-land/`. La cache precedente resta
  in `.cache/open-meteo/`; non è stata cancellata né sovrascritta.
- Il generatore accetta solo richieste con i nuovi parametri. La validazione riconosce anche
  i dati storici `nearest`, verificando la coerenza fra richieste, metadati e tutte le città.
- Il proprietario ha scaricato e rigenerato i dati. `data:validate` verifica 10 città,
  600 estati e 1.800 indicatori annuali. La nuova `dataVersion` è `4e434940c5eff13b`;
  la precedente era `f7a18f7fd9b26685`.
- `npm run data:compare` confronta i JSON correnti con il commit iniziale
  `9ef44cd8487f64d9ae779f51e4f1a4c116e6cc7c`: medie A, B e B−A dei tre indicatori.
- Solo Napoli cambia cella, da 40,75° N / 14,25° E a 41,00° N / 14,25° E. Nel periodo B
  la media dei giorni >30 °C passa da 0,17 a 20,60. Il confronto include anche la correzione quota.
- Venezia mantiene la cella 45,50° N / 12,25° E: nel periodo B i giorni >30 °C passano da
  6,73 a 6,57. L'eventuale influenza di laguna o mare resta un'ipotesi aperta, non un errore
  accertato né un problema dichiarato risolto. Servono confronti con celle vicine e osservazioni
  locali negli stessi periodi; tali confronti non sono stati eseguiti.

Fonti ufficiali:

- [Parametri dell'API storica](https://open-meteo.com/en/docs/historical-weather-api).
- [Selezione della cella][selezione-era5].

[selezione-era5]: https://github.com/open-meteo/open-meteo/blob/main/Sources/App/Domains/Gridable.swift

## 2026-10-09 — Giorni annuali interi e medie con un decimale

- Il formato distingue esplicitamente un valore annuale da una media di periodo.
  Solo i giorni >30 °C di una singola estate sono mostrati come interi.
- Le medie, anche se numericamente intere, e gli scarti conservano un decimale.
  Temperature e precipitazioni mantengono il formato precedente.
- Prima della correzione il test attendeva `78 giorni` e riceveva `78,0 giorni`.
  Dopo la correzione passano 26 test unitari e 11 test nel browser, compreso il controllo
  di scheda annuale, dieci città, punti del grafico, strisce e medie A/B.
- Con i dati aggiornati in A1, Roma 2003 ha 81 giorni >30 °C; 78 e 26,7 restano esempi
  nei test. La correzione riguarda la presentazione e non rigenera i dati.
- Su Windows `core.autocrlf=true` aveva convertito i fine riga dei JSON e invalidato
  le impronte SHA-256. `.gitattributes` conserva i file `public/data/*.json` con fine riga
  LF. Ripristinando solo i fine riga, i file coincidono con i byte già presenti in Git;
  valori, impronte e `dataVersion` restano invariati.

## 2026-10-09 — Legenda della mappa ed etichette accessibili delle strisce

- La legenda usa i quattro intervalli effettivi della mappa, ricavati dalle dieci variazioni
  B−A per indicatore e periodi correnti. Per le precipitazioni mostra i limiti in mm,
  conservando il verso dei colori caldo/secco. Nessuna modifica a `src/lib/aggregate.ts`.
- Punti e legenda condividono quattro variabili CSS con i colori già usati dalla mappa;
  gli estremi si adattano ai temi tramite `--cool` e `--warm`. Non si cambia la palette.
- I limiti visibili sono arrotondati con almeno due decimali e tale limite è dichiarato.
  Gli intervalli mantengono gli estremi inclusi/esclusi della classificazione esistente.
  Quando tutti i valori coincidono si mostra un solo valore, con il colore già assegnato.
- Le strisce espongono il valore in σ, non il numero della classe di colore. Il segno
  segue il verso caldo/secco: nelle precipitazioni positivo significa più secco.
  Scarti visualizzati come zero e periodi senza variabilità hanno descrizioni esplicite.
- Con i dati attuali e i periodi iniziali, Venezia e Bologna sono entrambe nella classe 1.
  L'esempio dell'esercitazione con colori diversi non si riproduce dopo A1; la legenda
  rende comunque leggibili i limiti reali senza cambiare classi o arrotondamento dei KPI.
- Gli E2E verificano le soglie per tre indicatori e due confronti di periodi, la coerenza
  dei colori nei temi chiaro/scuro, i nomi accessibili di tutte le 60 strisce per indicatore,
  il telefono e i casi di variazione uniforme e deviazione standard nulla.

## 2026-10-26 — Rimozione dei file inutilizzati e del piano duplicato

- Dopo l'approvazione del proprietario sono rimossi `src/styles.css` e sei moduli
  di `src/ui/`: `cards.ts`, `chart.ts`, `controls.ts`, `rail.ts`, `ranking.ts`, `stripes.ts`.
- L'analisi segue gli import da `src/main.ts` a `src/console-v3.ts` e alle sue dipendenze.
  Nessuno dei sette file riceve import dal codice, dagli script o dai test.
  Gli unici moduli UI importati dalla console sono `table.ts` e `legal.ts`.
- `src/vite-env.d.ts` viene conservato: il compilatore lo include tramite `tsconfig.json`,
  anche se non appartiene alla catena degli import eseguiti nel browser.
- Si conserva `docs/PLAN.md` come unico piano. La copia nella radice differiva soltanto
  per una riga vuota finale; il riferimento operativo nel piano usa ora `docs/PLAN.md`.
  L'inventario iniziale in `docs/STATUS.md` resta una registrazione storica.
- Le build prima e dopo, con Node 22.20.0, producono gli stessi 17 file: 485.701 byte.
  Tutte le impronte SHA-256 coincidono, compresi JavaScript, CSS e dati pubblicati.
  La pulizia riduce i sorgenti del repository senza cambiare il sito generato.
- Le dipendenze, i dati climatici e i file dell'applicazione ancora in uso restano invariati.
  Non è stato necessario scaricare Knip o aggiungere strumenti al progetto.

## 2026-10-27 — Controlli strict e preparazione alla formattazione

- Il proprietario approva Prettier 3.9.10, ESLint 10.13.0, `@eslint/js` 10.0.1 e
  typescript-eslint 8.72.1 come dipendenze di sviluppo, con versioni esatte nel lockfile.
- TypeScript passa da 7.0.2 a 6.0.3: typescript-eslint dichiara supporto a versioni
  `>=4.8.4 <6.1.0`. La scelta è approvata; tutte le opzioni strict restano invariate.
- ESLint usa recommended di JavaScript e strict di typescript-eslint, senza eccezioni
  locali o regole disattivate. Il primo rapporto segnala 28 asserzioni non-null e una
  variabile inutilizzata. Le 28 asserzioni sono sostituite con `requireDefined`, che
  controlla esplicitamente null e undefined. La regola rimane attiva.
- Prettier usa `printWidth: 100`, apici singoli e fine riga LF. `printWidth` è un obiettivo
  del formatter: non riscrive automaticamente i contenuti delle stringhe HTML lunghe.
  Dati generati, lockfile, cache, build e piano HTML personale sono esclusi.
- `lint` e `format:check` entrano nella CI delle PR. Il proprietario ha creato il commit
  `1e3f750` per configurazione e correzioni, poi `c97c4d1` per la sola formattazione.
  Tutti i 37 file del secondo commit coincidono con l'output di Prettier sul primo.
  L'hash completo del secondo è in `.git-blame-ignore-revs`, registrato separatamente:
  `c97c4d1f1f14dcda448707ee508282f0df9be9cc`.
  Commit, push, PR e merge restano al proprietario.
- Il limite per la successiva divisione in moduli è 300 righe per file, confermato dal
  proprietario. La Fase 2 avverrà in una nuova sessione e in una PR distinta.
- Dopo la formattazione passano TypeScript, lint, format:check, 26 test unitari, dati,
  build e 14 E2E. Il DOM e tutte e sei le immagini PNG coincidono con le prove iniziali,
  nei casi desktop/tablet/mobile e temi chiaro/scuro, con font esterni disattivati.

Fonti: [configurazioni typescript-eslint](https://typescript-eslint.io/users/configs/),
[compatibilità](https://typescript-eslint.io/users/dependency-versions/),
[printWidth](https://prettier.io/docs/options#print-width).

## 2026-10-28 — Console divisa in moduli entro 300 righe

- La suddivisione e il diagramma sono approvati dal proprietario prima delle modifiche.
  `console-v3.ts` passa da 641 a 57 righe e conserva avvio e coordinamento.
  `app/` gestisce stato, valori da mostrare, caricamenti e interazioni; `ui/` le sezioni.
  I dettagli e le dipendenze sono descritti in `docs/ARCHITECTURE.md`.
- Il caricatore conserva cache e contatore delle richieste; una risposta vecchia non
  sostituisce l'ultima città selezionata. Il modulo mappa possiede il suo osservatore e timer.
  URL, chiavi locali del tema, testi, CSV e librerie dei calcoli restano invariati.
- I frammenti HTML lunghi sono divisi mantenendo gli stessi valori, inclusi gli spazi.
  Le sezioni ricevono lo stato e riusano selettori e formati condivisi.
- `v3.css` diventa l'ingresso di cinque fogli, in ordine: base, dashboard, visualizations,
  details, overrides. Il confronto della struttura CSS conferma gli stessi selettori,
  dichiarazioni e ordine. Anche il CSS della build coincide byte per byte con l'iniziale.
- Tutti i 34 file TypeScript e CSS in `src/` sono entro 300 righe e 100 caratteri per riga.
  Il più lungo è `styles/dashboard.css`, con 280 righe. `source:check` impone i limiti nella CI,
  contando anche commenti e righe vuote. Nessuna nuova dipendenza è necessaria.
- `.gitattributes` impone LF ai file di testo. Dopo il checkout Windows della Fase 1,
  43 file risultavano nuovamente non conformi a Prettier a causa dei fine riga CRLF.
  La regola specifica per i JSON dei dati rimane esplicita e le loro impronte sono invariate.
- TypeScript, 26 test unitari e 14 E2E passano dopo ogni estrazione o revisione di un modulo.
  Sono registrati 30 punti di verifica, inclusi riferimento iniziale e controllo finale.
  Nel finale passano anche lint, format:check, source:check, validazione dati e build.
- Il DOM coincide in tutti i sei casi desktop/tablet/mobile e chiaro/scuro.
  Il confronto percettivo delle immagini, con soglia 0,05, non rileva pixel differenti.
  Alcuni PNG presentano minime variazioni di colore del browser e non sono byte-identici;
  i font esterni sono disattivati in entrambi i riferimenti per rendere il confronto stabile.
- Tutti i moduli sono raggiungibili da `main.ts`, senza import circolari.
  Dati pubblici, schema e librerie esistenti restano invariati; niente rigenerazione.
  Commit, push, PR e merge saranno eseguiti dal proprietario, un passaggio alla volta.
