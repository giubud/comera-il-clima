# Quattro stagioni: schema 2

Il 31 ottobre 2026 il branch `feat/seasons` contiene l'archivio reale completo e verificato:
600 risposte annuali, dieci città e 2.400 stagioni. Schema 2, versione logica `1fdffa12eabc7b22`.
Il lavoro locale è pronto per la revisione finale del proprietario; pubblicazione tramite PR.
I dati sintetici sono confinati ai test e non compaiono nei JSON del prodotto.

## Calendario e indicatori

| Codice | Stagione  | Mesi                                   | Giorni  |
| ------ | --------- | -------------------------------------- | ------- |
| DJF    | Inverno   | dicembre precedente, gennaio, febbraio | 90 o 91 |
| MAM    | Primavera | marzo, aprile, maggio                  | 92      |
| JJA    | Estate    | giugno, luglio, agosto                 | 92      |
| SON    | Autunno   | settembre, ottobre, novembre           | 91      |

L'anno identifica la fine dell'inverno: 1961 significa dicembre 1960–febbraio 1961.
Nell'interfaccia appare “Inverno 1960/61”. Tutte le stagioni coprono gli anni 1961–2020.

I cinque indicatori sono temperatura media, giorni con massima >30 °C, precipitazioni totali,
giorni di gelo con minima <0 °C e giorni con precipitazioni giornaliere ≥20 mm.
Le due disuguaglianze termiche sono strette; la soglia delle precipitazioni è inclusiva.
Le precipitazioni comprendono anche la neve espressa come equivalente liquido.

Per scelta della vista, i giorni >30 °C in inverno e quelli di gelo in estate sono esclusi.
Il valore è `null` con una motivazione nel manifest e appare come “Non applicabile”, anche
nel CSV. È una scelta di presentazione, non l'affermazione che l'evento sia impossibile.
Uno zero realmente contato negli altri casi resta zero. Dati mancanti causano un errore.
La media di periodo assegna lo stesso peso a ogni stagione annuale, bisestili compresi.

## Dati e provenienza

- Ogni città contiene `schemaVersion: 2` e `seasons.DJF/MAM/JJA/SON`, ciascuna con 60 anni.
- Il manifest dichiara calendario, soglie, unità, esclusioni, versione logica e hash cittadini.
- I riepiloghi `public/data/seasons/<codice>.json` contengono cinque valori per anno:
  temperatura, giorni >30 °C, precipitazioni, gelo, giorni ≥20 mm.
- I conteggi restano interi; il riepilogo compatto conserva due decimali per la temperatura
  e uno per le precipitazioni, come il precedente riepilogo estivo.
- Il browser carica il riepilogo della stagione e il dettaglio della città selezionata.
  Non interroga Open-Meteo. I vecchi URL senza stagione indicano JJA; gli altri usano
  ad esempio `season=DJF`. La fonte dello schema decide quale interfaccia avviare.

Il nuovo download aggiunge `temperature_2m_min` alle tre variabili esistenti e richiede
un anno meteorologico per città, dal 1 dicembre precedente al 30 novembre.
La cache annuale è `.cache/open-meteo-seasons-v2/`; le due cache precedenti sono conservate.
Modello ERA5, selezione `land`, correzione della quota attiva e fuso Europe/Rome restano espliciti.

### Estati conservate e scarto orario

Nel pilota Roma 1961, la nuova risposta dà 24,215217391304353 °C contro
24,205434782608705 °C della fonte estiva originale. Anche ripetendo l'URL estivo originale
il risultato non coincide. Le risposte riportano rispettivamente UTC+1 e UTC+2.
La documentazione descrive uno scarto UTC fisso, risolto al momento della richiesta:
la differenza osservata è compatibile con questo comportamento; non si escludono revisioni
ulteriori del fornitore e non è dimostrata una causa unica.

Per rispettare la regressione richiesta, JJA viene ricalcolata dalla cache giornaliera
originale `.cache/open-meteo-land/`: i tre indicatori e i nuovi giorni ≥20 mm hanno la stessa
fonte estiva. Il gelo è escluso nella vista JJA. Le altre tre stagioni usano il nuovo download.
`source` documenta le richieste annuali; `summerSource` quelle estive originali.
Entrambe registrano URL, data, hash, coordinate, quota e scarto UTC. La build rifiuta metadati
incoerenti. Non si confrontano direttamente stagioni diverse come se avessero identica
finestra oraria o identica data di estrazione.

Il riferimento immutabile `tests/fixtures/summer-baseline.json` proviene da `129d25d`.
Il test confronta tutte le 600 estati, i tre indicatori, i riepiloghi di periodo e il formato
compatto. La pipeline ricalcola dai dati giornalieri: non copia gli aggregati del riferimento.
Per ricostruire JJA occorre conservare la cache estiva originale, ignorata da Git.
Non aggiornarne automaticamente il riferimento per far passare un test.

## Download e pubblicazione locale

Non avviare due downloader contemporaneamente. Lo script conserva un blocco con il processo
attivo e un registro locale delle quote. Riutilizza le risposte già valide e non cancella cache.

`npm run data:status` mostra l'avanzamento senza chiamare l'API.

`npm run data:fetch -- --all --limit 300` scarica al massimo 300 risposte nuove per esecuzione.
Lo stesso comando riprende dai file mancanti; aspettare la pausa indicata se si raggiunge una quota.
Non cancellare `quota.json` per aggirare la pausa. Altri programmi sulla stessa connessione
possono consumare parte della quota: HTTP 429 arresta il download conservando l'avanzamento.

Servono 600 richieste HTTP, circa 15.654 unità di quota: ogni anno pesa circa 26 unità.
Il limite gratuito è 10.000 unità al giorno, quindi occorrono almeno due finestre giornaliere.
Lo script usa margini prudenziali: 540/minuto, 4.500/ora, 9.000/24 ore e 30 secondi fra tentativi.
Le attese oltre un minuto interrompono il processo con l'orario di ripresa.
La durata dipende dalle pause e dalla rete; 600 richieste distanziate richiedono almeno cinque
ore di attività, oltre alla pausa giornaliera. Sono stime, non un tempo garantito.

Per una ricostruzione, attendere che `data:status` riporti 600/600 validi.
Su Windows chiudere prima i server locali di sviluppo o anteprima: possono trattenere le
cartelle e impedire lo scambio finale con errore EPERM. In quel caso la build ripristina
l’archivio precedente; dopo la chiusura del server si può ripetere il comando.

`npm run data:build` prepara in `.cache/data-next` tutte le città, il manifest e i quattro
riepiloghi. Solo dopo la validazione completa sostituisce `public/data` con recupero in caso
di errore nello scambio. Un archivio incompleto non modifica i dati pubblici.

Poi eseguire `npm run data:validate`, `npm test`, `npm run build` e `npm run test:e2e`,
oltre a lint, formattazione e limiti dei sorgenti. Controllare manualmente le quattro stagioni,
i due temi, i collegamenti condivisi, l'inverno bisestile e il CSV.

## Risultato verificato il 31 ottobre 2026

| Archivio               | File JSON |      Byte | Somma gzip dei singoli file |
| ---------------------- | --------: | --------: | --------------------------: |
| Prima, sole estati     |        12 |   400.728 |                      54.217 |
| Dopo, quattro stagioni |        15 | 1.303.664 |                     143.226 |

L'aumento è 902.936 byte, circa 3,25 volte l'archivio precedente, in linea con la stima
iniziale di circa 1–1,3 MB. La doppia provenienza contribuisce alla dimensione.
Le 600 estati, i 1.800 valori annuali precedenti, le medie e la precisione compatta restano
esattamente invariati. Tutti i dati del prodotto derivano dalle fonti reali dichiarate.

Passano 42 test unitari, 32 E2E, lint, formattazione, limiti dei 51 sorgenti, TypeScript,
validazione dell'intero archivio e build. Dei 32 E2E, 14 usano l'archivio reale completo e
18 quello di prova; otto ulteriori anteprime della build reale coprono quattro stagioni,
due temi e larghezze da 320 a 1440 pixel, CSV compreso. Nessun errore JavaScript,
nessun overflow della pagina e nessuna chiamata del browser all'API climatica.

Una risposta non JSON del servizio ha interrotto il download senza produrre un file
corrotto; la ripresa ha scaricato soltanto i blocchi mancanti. Le normali pause hanno
rispettato il registro delle quote. Le cache giornaliere precedenti sono conservate.

L'anteprima completa è disponibile localmente sulla porta 4182. Il proprietario ha già
verificato Milano sull'anteprima parziale; resta la sua revisione finale prima del percorso PR.

`data:summers` conserva la compatibilità con lo schema 1; nello schema 2 rigenera tutti e
quattro i riepiloghi dai JSON cittadini, senza download. `data:compare` rimane il confronto
storico delle sole estati prima/dopo la selezione land e la correzione della quota.

Fonti: [API storica](https://open-meteo.com/en/docs/historical-weather-api),
[quote di accesso](https://open-meteo.com/en/pricing), consultate il 30 ottobre 2026.
