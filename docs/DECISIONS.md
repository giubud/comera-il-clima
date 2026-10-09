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

[selezione-era5]:
  https://github.com/open-meteo/open-meteo/blob/main/Sources/App/Domains/Gridable.swift

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
