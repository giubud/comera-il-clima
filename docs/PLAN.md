# Com’era il clima — La memoria delle stagioni

Piano di realizzazione e passaggio di consegne a SOL 5.6

Versione 1.0 · 15 settembre 2026 · Stato: progetto proposto, non implementato.

## 1. Obiettivo e scelte già prese

Realizzare una piccola applicazione open source in italiano, elegante e accessibile, che risponda alla domanda: «Come sono cambiate le estati nella mia città?».

Questo documento è una specifica eseguibile: il modello implementatore deve seguire le decisioni indicate, completare le fasi in ordine e registrare prove e problemi. Non occorre riprogettare il prodotto.

| Aspetto | Decisione per la versione 1 |
| --- | --- |
| Nome pubblico | Com’era il clima |
| Sottotitolo | La memoria delle stagioni |
| Nome proposto del repository | comera-il-clima |
| Hosting | GitHub Pages, repository pubblico |
| Lingua | Italiano |
| Ambito | Soltanto estate meteorologica: giugno, luglio, agosto |
| Città | Torino, Milano, Venezia, Bologna, Firenze, Roma, Napoli, Bari, Palermo, Cagliari |
| Periodi | 1961–1990 e 1991–2020, estremi inclusi |
| Indicatori | Temperatura media, giorni con massima >30 °C, precipitazioni totali |
| Fonte prevista | Open-Meteo Historical Weather API, modello ERA5 esplicito |
| Esecuzione | Tutta l’interazione nel browser; nessuna API climatica chiamata dal visitatore |
| Dati pubblicati | Aggregati statici JSON e provenienza verificabile |
| Stack | Vite, TypeScript strict, DOM nativo, CSS; Vitest per la logica |
| Grafico | SVG semplice, con tabella HTML equivalente |
| Esclusioni | Account, backend, database, mappe, AI generativa, previsioni, pagamento, pubblicità |

La limitazione all’estate è intenzionale: riduce i casi di calendario e rende il primo rilascio finibile. Il sottotitolo permette di aggiungere altre stagioni in seguito. Nell’interfaccia specificare «Prima edizione: le estati».

I due periodi sono consecutivi, non sovrapposti e della stessa lunghezza. Non chiamare il secondo «oggi»: termina nel 2020. Non presentare i risultati come una stima della situazione attuale.

## 2. Esperienza e identità visiva

Flusso principale: aprire il sito → scegliere una città → leggere le differenze tra i due periodi → cambiare indicatore nel grafico → consultare metodologia e dati.

Una sola pagina, in questo ordine:

1. Titolo, sottotitolo e domanda introduttiva.
2. Selettore città; Roma come scelta iniziale.
3. Periodi a confronto e dicitura «Estate = 1 giugno–31 agosto».
4. Tre schede: valore del primo periodo, valore del secondo, differenza B−A con unità.
5. Frase descrittiva costruita dai valori, senza testo generato da un modello.
6. Grafico dei 60 valori estivi annuali; selettore tra i tre indicatori.
7. Tabella accessibile, esportazione CSV, pulsante «Copia collegamento».
8. Sezione espandibile «Come leggere questi dati», fonti e link al repository.

Esempio di frase, con segnaposto e non con dati inventati: «A Roma, la temperatura media estiva del 1991–2020 è stata di {differenza} °C più alta rispetto al 1961–1990». Prevedere anche «più bassa» e «uguale alla precisione visualizzata». Per le precipitazioni descrivere la differenza in mm senza dedurre siccità o eventi estremi.

Direzione grafica: pagina editoriale, fondo avorio (#F7F4EE), testo scuro (#202B30), blu petrolio (#245566) per A e terracotta (#A6472C) per B. Verificare i contrasti effettivi. Titoli con Georgia; interfaccia con font di sistema. Contenuto largo al massimo 1100 px, spazi generosi, bordi sottili, nessuna fotografia necessaria. Tre schede affiancate su desktop, impilate su mobile. I colori non devono essere l’unico modo di distinguere i periodi.

Il grafico deve avere assi, unità, anni, legenda e descrizione testuale. Visualizzare la serie annuale e due segmenti orizzontali delle medie di periodo, senza curve smussate, regressioni o doppi assi. Asse Y da zero per giorni e precipitazioni; temperatura con scala adattiva chiaramente etichettata. Nessuna interpretazione di significatività statistica.

## 3. Fonte e decisioni metodologiche

La documentazione Open-Meteo raccomanda ERA5 o ERA5-Land per confronti su decenni. ERA5 copre l’intervallo scelto e include temperatura e precipitazioni. È una rianalisi, non una stazione cittadina; la griglia ERA5 è circa 0,25°. Impostare il modello esplicitamente, evitando il predefinito Best Match. [Documentazione ufficiale](https://open-meteo.com/en/docs/historical-weather-api)

Scelte del progetto: ERA5, coordinate fisse per città, fuso Europe/Rome, Celsius, millimetri. Per rendere esplicita la rappresentazione spaziale usare cell_selection=nearest ed elevation=nan: la città identifica un punto di selezione, il valore rappresenta la cella scelta, senza correzione altimetrica locale. Conservare coordinate richieste e restituite. Non descrivere il risultato come media dell’intero comune o misura del centro urbano.

Parametri della richiesta pilota, da validare nella fase 1:

```text
https://archive-api.open-meteo.com/v1/archive
latitude=41.9028
longitude=12.4964
start_date=1961-06-01
end_date=1961-08-31
daily=temperature_2m_mean,temperature_2m_max,precipitation_sum
models=era5
timezone=Europe/Rome
temperature_unit=celsius
precipitation_unit=mm
cell_selection=nearest
elevation=nan
```

Il formato dei parametri, le variabili e le coordinate restituite sono descritti nella [documentazione API](https://open-meteo.com/en/docs/historical-weather-api). La richiesta sopra è una specifica da provare: non è stata eseguita durante la preparazione del piano.

Coordinate iniziali di progetto, rappresentative e non confini amministrativi:

| ID | Nome | Latitudine | Longitudine |
| --- | --- | ---: | ---: |
| torino | Torino | 45.0703 | 7.6869 |
| milano | Milano | 45.4642 | 9.1900 |
| venezia | Venezia | 45.4408 | 12.3155 |
| bologna | Bologna | 44.4949 | 11.3426 |
| firenze | Firenze | 43.7696 | 11.2558 |
| roma | Roma | 41.9028 | 12.4964 |
| napoli | Napoli | 40.8518 | 14.2681 |
| bari | Bari | 41.1171 | 16.8719 |
| palermo | Palermo | 38.1157 | 13.3615 |
| cagliari | Cagliari | 39.2238 | 9.1217 |

Non cambiare modello o coordinate tra periodi. Registrare ogni eventuale revisione in docs/DECISIONS.md e rigenerare tutti i valori interessati. Non fare sostituzioni silenziose della fonte in caso di indisponibilità.

## 4. Formule, precisione e qualità

Per ogni città e anno y, S(y) contiene le 92 date dal 1 giugno al 31 agosto.

```text
meanTemperatureC(y) = somma temperature_2m_mean / 92
hotDays(y) = numero di date con temperature_2m_max > 30
precipitationMm(y) = somma precipitation_sum

periodMean(metric, A) = somma dei 30 valori annuali 1961…1990 / 30
periodMean(metric, B) = somma dei 30 valori annuali 1991…2020 / 30
delta(metric) = periodMean(metric, B) − periodMean(metric, A)
```

La soglia è strettamente maggiore di 30: 30,0 non conta; 30,1 conta. L’indicatore va chiamato «Giorni con massima >30 °C», non «ondate di calore». Le precipitazioni comprendono l’equivalente liquido della neve; chiamarle «precipitazioni», non soltanto «pioggia».

Ogni estate deve contenere 92 date uniche consecutive e 92 valori finiti per ciascuna variabile. Lo zero di precipitazione è valido; null, campi mancanti, duplicati e date saltate sono errori. Non riempire i buchi con zero, non interpolare. Un’estate non valida blocca la generazione della nuova versione pubblica dei dati, mantenendo la precedente.

Controllare unità, ordinamento, tmax >= tmean e precipitazione >= 0. Se una verifica fallisce, segnalare città, anno, campo e data. Non correggere automaticamente valori sospetti.

Calcolare a precisione piena e arrotondare solo nella presentazione: temperatura 1 decimale, giorni medi per estate 1 decimale, precipitazioni 1 decimale. Usare Intl.NumberFormat('it-IT'). Normalizzare −0,0 a 0,0. Niente variazioni percentuali nella v1. Le medie di giorni possono essere frazionarie; i conteggi annuali sono interi.

Test numerici obbligatori, con dati sintetici dichiarati e confinati ai test:

- 92 giorni con tmean=20, tmax=30 e precipitazione=1 → 20 °C, 0 giorni caldi, 92 mm.
- Stessa serie, 10 massime a 30,1 → 10 giorni caldi.
- Due insiemi di 30 estati costanti a 20 e 22 °C → delta +2 °C.
- Media di conteggi alternati 10 e 11 per 30 anni → 10,5 giorni.
- Una data mancante o duplicata, null oppure NaN → errore esplicito.
- Date del 31 maggio e 1 settembre escluse; 29 febbraio non influisce.
- Delta negativo e delta molto vicino a zero: segno e frase coerenti con il valore visualizzato.

## 5. Architettura e contratto dati

Pipeline: API → cache locale delle risposte → validazione → aggregazione → JSON versionati → build statica → GitHub Pages. Il sito legge solo i JSON pubblicati.

Usare una versione Node LTS supportata da Vite al momento dell’implementazione, fissarla in .nvmrc e CI; registrare le versioni in package-lock.json. Dipendenze: Vite, TypeScript, Vitest, tsx per gli script TypeScript e Playwright per pochi test di navigazione. Nessun framework UI, router o libreria grafica necessario.

Struttura prevista, con normali percorsi relativi al repository:

```text
.github/workflows/ci.yml
.github/workflows/deploy.yml
docs/PLAN.md
docs/STATUS.md
docs/DECISIONS.md
docs/METHODOLOGY.md
docs/DATA_SOURCES.md
docs/DATA_CHECK.md
scripts/fetch-data.ts
scripts/build-data.ts
scripts/validate-data.ts
src/data/cities.ts
src/data/schema.ts
src/lib/aggregate.ts
src/lib/format.ts
src/lib/url-state.ts
src/ui/controls.ts
src/ui/cards.ts
src/ui/chart.ts
src/ui/table.ts
src/main.ts
src/styles.css
public/data/manifest.json
public/data/roma.json
public/data/...altri nove file città...
tests/aggregate.test.ts
tests/data.test.ts
tests/url-state.test.ts
tests/e2e.spec.ts
.cache/open-meteo/              # esclusa da git
README.md
LICENSE
DATA_LICENSE.md
CONTRIBUTING.md
index.html
package.json
package-lock.json
vite.config.ts
tsconfig.json
```

Contratto minimo da tradurre in tipi e validazione runtime, senza valori climatici fittizi:

```typescript
type Metric = 'meanTemperatureC' | 'hotDays' | 'precipitationMm';
type Metrics = Record<Metric, number>;
type Summer = Metrics & { year: number; validDays: 92 };
type PeriodSummary = Metrics & { startYear: number; endYear: number; validYears: 30 };
type CityDataset = {
  schemaVersion: 1;
  cityId: string;
  season: 'JJA';
  source: {
    provider: 'Open-Meteo'; model: 'era5'; timezone: 'Europe/Rome';
    requestedCoordinates: { latitude: number; longitude: number };
    returnedCoordinates: { latitude: number; longitude: number };
    elevationM: number | null;
    cellSelection: 'nearest'; elevationCorrection: 'disabled';
    requests: { url: string; retrievedAt: string; sha256: string }[];
  };
  years: Summer[];
  periods: { a: PeriodSummary; b: PeriodSummary };
};
```

I metadati delle risposte dei diversi blocchi devono essere coerenti. Se le coordinate restituite cambiano, bloccare la nuova generazione e documentare il caso.

manifest.json contiene schemaVersion, generatedAt, dataVersion, stagione, estremi dei periodi, soglia, unità, attribuzione e lista città con nome, file e hash SHA-256. dataVersion deriva dal contenuto degli aggregati, senza timestamp, così una rigenerazione degli stessi dati conserva la versione logica. SchemaVersion cambia solo se cambia il contratto. Controllare hash e versione nello script di validazione; nel browser validare i campi necessari prima di renderizzare.

Gli output JSON devono avere ordine stabile. La cache e gli hash permettono la riproduzione locale; una futura risposta del fornitore può differire per revisioni. Gli aggregati committati identificano esattamente la versione mostrata. Non promettere la riproduzione storica dei dati giornalieri se la cache originale non è conservata.

Script npm richiesti:

| Comando | Responsabilità |
| --- | --- |
| npm run dev | Server locale |
| npm run typecheck | TypeScript senza emissione |
| npm test | Test unitari, senza rete |
| npm run test:e2e | Test browser su build locale |
| npm run data:fetch -- --city roma --from 1961 --to 1961 | Scaricamento limitato, riprendibile |
| npm run data:fetch -- --all | Cache delle dieci città, 1961–2020 |
| npm run data:build | Generazione degli aggregati dalla cache |
| npm run data:validate | Validazione completa degli output pubblici |
| npm run build | Compilazione sito, senza scaricare dati |
| npm run preview | Verifica della build |

Downloader sequenziale, un blocco di un anno per città: circa 600 richieste estive, riutilizzando la cache valida. Timeout per richiesta, massimo tre tentativi per errori transitori, ritardo crescente e rispetto di Retry-After. Nessun ciclo infinito; un 4xx non transitorio termina il blocco. Le quote possono contare richieste lunghe in modo ponderato: controllare le condizioni prima dello scaricamento completo, non affidarsi al solo numero di richieste HTTP.

Prima scrivere in un’area temporanea, validare l’intero set e soltanto dopo promuovere gli output. data:build non deve lasciare una combinazione di dati vecchi e nuovi se una città fallisce. I test e le build ordinarie non devono dipendere dalla disponibilità dell’API.

## 6. Sequenza di lavoro per SOL 5.6

Eseguire le fasi in ordine. Ogni fase deve produrre file, verifiche e un aggiornamento di STATUS.md. Non aprire in parallelo più fasi incomplete. Fare commit coerenti quando si lavora nel repository, senza includere file dell’utente estranei al progetto.

### Fase 0 — Preparazione

Leggere questo piano, eventuale AGENTS.md, contenuto del workspace e stato git. Se esiste un repository, conservarne la storia e le modifiche. Se non esiste, predisporre la cartella del progetto; il proprietario GitHub sarà necessario solo alla pubblicazione. Copiare questo documento in docs/PLAN.md e creare STATUS.md e DECISIONS.md.

Consegna: inventario del contesto, stato iniziale e lista delle fasi. Completata quando la destinazione locale è chiara e nessun lavoro preesistente viene sovrascritto.

### Fase 1 — Prova della fonte, prima della UI

Eseguire la richiesta pilota per Roma nel 1961 e una per l’estate 2020. Verificare modello richiesto, nomi dei campi, unità, 92 date, metadati geografici e assenza di valori null. Annotare in DATA_CHECK.md richieste, data, risultato e limiti. Verificare condizioni d’uso e attribuzione nelle fonti ufficiali.

Consegna: prova documentata con dati reali. Se la rete è bloccata, registrare il blocco e la richiesta esatta da eseguire; si può preparare lo scaffold, ma la fase resta incompleta. Non inventare numeri né dichiarare validata la fonte.

### Fase 2 — Scaffold e calcoli

Creare progetto Vite + TypeScript, script npm, tipi, configurazione città e funzioni pure di aggregazione. Implementare i test numerici della sezione 4. Creare index.html con lingua italiana e titolo.

Consegna: typecheck, test e build funzionanti. Non costruire ancora l’interfaccia completa.

### Fase 3 — Pipeline reale

Implementare downloader con cache, validazione e generazione. Prima completare Roma per 60 anni; verificare manualmente il calcolo di un’estate confrontando gli aggregati con la risposta giornaliera. Poi estendere alle dieci città. Generare manifest e provenienza.

Consegna: dieci città × 60 estati = 600 record annuali; 30 anni per ciascun periodo; nessun dato mancante. data:validate passa. La build funziona usando esclusivamente i dati già presenti nel repository.

### Fase 4 — Interfaccia essenziale

Implementare selettore, tre schede, frase descrittiva e gestione caricamento/errore. Caricare soltanto il JSON della città selezionata, con cache in memoria. Gestire risposte fuori ordine: cambiando rapidamente città, non mostrare i dati della richiesta precedente sotto il nuovo nome. Durante il caricamento non presentare i vecchi valori come nuovi.

Consegna: dieci città selezionabili e indicatori identici ai JSON; errori leggibili con pulsante di riprova. Nessun numero segnaposto nel prodotto.

### Fase 5 — Grafico, condivisione e accessibilità

Implementare SVG, tabella e CSV. URL condivisibile mediante query string: ?city=roma&metric=meanTemperatureC. Validare i parametri con allowlist; valori non validi tornano ai default. Nessuna rotta che richieda riscritture del server. Copia link con alternativa selezionabile se la Clipboard API fallisce.

Il CSV esporta i 60 valori annuali di tutti e tre gli indicatori, con intestazioni e unità, decimale punto e campi correttamente escapati. La tabella usa formattazione italiana. Mostrare attribuzione e fonte accanto al download e citarle nella documentazione.

Consegna: layout a 360, 768 e 1440 px senza overflow della pagina; tabella eventualmente scorrevole nel proprio contenitore. Navigazione da tastiera, focus visibile, label dei controlli, grafico descritto e tabella disponibile. Acquisire screenshot locale desktop e mobile e correggere difetti visibili.

### Fase 6 — Qualità e documentazione

Test E2E limitati a rischi concreti: scelta città e indicatore, URL ricaricato, risposta fallita, cambio rapido città, CSV e navigazione da tastiera. Testare sul percorso /comera-il-clima/, non solo su /. I dati per test di errore possono essere simulati; le verifiche del sito normale usano gli aggregati reali.

README: scopo, screenshot, avvio, comandi, demo, metodologia e contributi. METHODOLOGY: formule, limiti geografici e temporali, soglia e periodi. DATA_SOURCES e DATA_LICENSE: fonte, attribuzione, trasformazioni e licenza dei dati distinta dal codice. CONTRIBUTING: come aggiungere una città, rigenerare e verificare.

Consegna: test necessari superati, screenshot verificati, nessun errore console e checklist finale compilata. Se un browser di test non è disponibile, esplicitare la verifica mancante; non dichiararla superata.

### Fase 7 — GitHub e GitHub Pages

Preparare ci.yml e deploy.yml. CI sulle pull request: npm ci, typecheck, test, data:validate e build. E2E almeno prima del rilascio. Deploy sul branch principale e attivazione manuale, dopo verifiche riuscite; niente deploy dalle pull request.

Configurare Vite base con percorso di progetto /comera-il-clima/; se il nome effettivo cambia, aggiornare configurazione e test insieme. Per i dati usare import.meta.env.BASE_URL, mai /data/... hardcoded. Per asset usare import Vite o URL basati sulla stessa base.

Usare il workflow ufficiale Pages: build di dist, upload dell’artefatto e job di deploy dipendente dalla build, environment github-pages, permessi pages:write e id-token:write sul deploy; contents:read dove sufficiente. Verificare le versioni supportate delle Actions al momento dell’implementazione. [Guida GitHub](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

Quando l’esecuzione e pubblicazione sono state richieste dall’utente, usare l’accesso GitHub disponibile per creare o riutilizzare il repository concordato, inviare il codice e attivare Pages. Non creare un repository sotto un proprietario indovinato. Se manca autenticazione o proprietario, completare prima il lavoro locale e chiedere soltanto l’informazione o il passaggio mancante. Non chiedere token in chat.

Consegna: URL effettivo restituito dal deploy, apertura verificata, dati e asset senza 404, query condivisa ricaricabile. Se non c’è accesso GitHub, consegnare codice e passaggi esatti rimasti, segnando pubblicazione come incompleta.

## 7. Condizioni d’uso, manutenzione e ambito futuro

L’API gratuita Open-Meteo è destinata all’uso non commerciale; essere open source non basta a rendere qualsiasi utilizzo non commerciale. I dati sono forniti sotto CC BY 4.0. Mantenere attribuzione, collegamento alla licenza e indicazione delle aggregazioni effettuate. Per questa v1 si prevede un sito senza pubblicità o abbonamenti. Verificare di nuovo le condizioni se cambia l’uso. [Termini ufficiali](https://open-meteo.com/en/terms)

Proposta: codice MIT con titolare effettivo indicato al rilascio; dati e attribuzioni descritti separatamente in DATA_LICENSE.md. Ricavare dalla documentazione la dicitura aggiornata per Open-Meteo e la fonte ERA5/Copernicus; non applicare MIT indiscriminatamente all’intero contenuto.

I periodi sono fissi: non occorre un aggiornamento giornaliero. Nella v1 lo scaricamento è manuale e separato dal deploy. Una revisione della fonte produce nuovi aggregati, un confronto git e una normale revisione prima della pubblicazione. Non introdurre subito un job schedulato che riscriva i dati.

Evoluzioni, soltanto dopo il rilascio: altre stagioni (con regola esplicita per dicembre dell’anno precedente), confronto con anni recenti etichettati correttamente, nuove città, download delle risposte originali in un archivio di rilascio, inglese. Fuori ambito finché il nucleo non è terminato: mappe, classifiche climatiche tra città, previsione futura e attribuzione causale di singoli eventi.

## 8. Definizione di completamento

- [ ] Fonte provata con richieste reali, nessuna modifica nascosta del modello.
- [ ] Dieci città, 60 estati per città, tre indicatori validati.
- [ ] Periodi 1961–1990 e 1991–2020 espliciti in UI e metodologia.
- [ ] Formula e precisione concordano tra schede, grafico, tabella e CSV.
- [ ] Il browser non contatta l’API climatica.
- [ ] Nessuna credenziale, dato sintetico o cache grezza inclusi per errore.
- [ ] Lettura e navigazione accessibili su mobile e desktop.
- [ ] Typecheck, test della logica, validazione dati e build superati.
- [ ] Test del percorso GitHub Pages e dei collegamenti condivisi superati.
- [ ] README, metodologia, licenze e istruzioni per contribuire presenti.
- [ ] Repository disponibile e URL pubblico verificato, oppure blocco dichiarato.

## 9. Protocollo di continuità per un modello implementatore

Aggiornare docs/STATUS.md dopo ciascuna fase usando questo formato:

```text
Ultimo aggiornamento:
Fase attiva:
Fasi completate:
File modificati:
Comandi eseguiti ed esito:
Verifiche manuali realmente effettuate:
Decisioni aggiuntive:
Blocchi e prove del problema:
Prossima azione concreta:
Commit, se disponibile:
```

Regole: non riscrivere componenti funzionanti per preferenze stilistiche; non aggiungere dipendenze senza un bisogno concreto; non ampliare l’ambito. Prima di chiedere chiarimenti usare i default di questo piano. Chiedere soltanto quando manca un’informazione indispensabile o una scelta cambia sostanzialmente obiettivo, costi o accessi. Un blocco della rete non autorizza ad aggirare restrizioni né a fabbricare risultati.

Prima di interrompere una sessione, lasciare la prossima azione precisa: per esempio «Eseguire data:validate sui dieci JSON e correggere il record segnalato», non «continuare i dati». Non segnare completa una fase se un controllo obbligatorio è ancora da eseguire.

## 10. Prompt da consegnare a SOL 5.6

```text
Realizza il progetto “Com’era il clima” seguendo il file allegato
PIANO_COMERA_IL_CLIMA.md come specifica operativa.

Parti dalla fase 0. Prima di modificare file leggi le istruzioni del repository
e verifica lo stato git. Copia il piano in docs/PLAN.md e mantieni aggiornati
docs/STATUS.md e docs/DECISIONS.md.

Segui le fasi in ordine e usa le scelte già fissate: applicazione statica
Vite + TypeScript, dieci città italiane, estati 1961–1990 contro 1991–2020,
ERA5 esplicito, tre indicatori e dati JSON precomputati. Hosting GitHub Pages.

Prima verifica realmente la fonte. Non usare dati inventati nel prodotto.
Realizza test significativi per formule, completezza e navigazione.
Continua autonomamente attraverso le fasi quando i controlli passano.
Se devi fermarti, registra l’esatta prossima azione e il blocco osservato.

Ti chiedo di implementare il progetto e prepararlo per GitHub Pages.
Se il proprietario GitHub e l’accesso sono disponibili nel contesto,
completa anche creazione del repository e pubblicazione; altrimenti termina
tutto il lavoro locale e indicami il solo passaggio necessario per pubblicare.

Non ampliare l’ambito, non cambiare fonte o stack senza motivo documentato,
non dichiarare superati controlli non eseguiti. Alla fine riporta cosa funziona,
prove effettuate, limiti rimasti e URL pubblico solo se verificato.
```

Per riprendere in una nuova sessione: «Leggi docs/PLAN.md, docs/STATUS.md e docs/DECISIONS.md, verifica lo stato reale del repository e riprendi dalla prima fase incompleta senza rifare quelle già verificate».

## 11. Fonti e limiti di questo piano

Fonti consultate il 15 settembre 2026:

- [Open-Meteo Historical Weather API](https://open-meteo.com/en/docs/historical-weather-api): copertura, modello e parametri.
- [Open-Meteo Terms](https://open-meteo.com/en/terms): uso del servizio e licenza dei dati.
- [Open-Meteo Pricing](https://open-meteo.com/en/pricing): quote e modalità di conteggio da ricontrollare al download.
- [GitHub Pages: workflow personalizzati](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages): build e deploy.

Questo documento definisce scelte progettuali, non risultati climatici. Durante la sua preparazione sono state consultate le documentazioni, ma non sono stati scaricati i dataset, eseguiti test dell’applicazione, creati repository o pubblicati siti. La fase 1 serve a confermare la fattibilità effettiva della pipeline nel contesto di esecuzione.

