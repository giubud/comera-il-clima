# Metodologia

## Ambito

La prima edizione considera soltanto l’estate meteorologica: 92 giorni dal 1 giugno al 31 agosto, estremi inclusi. Il confronto iniziale usa due periodi consecutivi di uguale durata:

- A: 1961–1990;
- B: 1991–2020.

Il secondo periodo termina nel 2020 e non rappresenta “oggi”.

Nella console A e B possono essere selezionati liberamente nell'intervallo 1961–2020. Periodi sovrapposti, di diversa durata o sotto le dieci estati producono un avviso: il confronto rimane descrittivo, ma è meno immediato da interpretare.

## Rappresentazione geografica

Ogni città è identificata da coordinate fisse. Open-Meteo preferisce una cella ERA5 sulla
terraferma (`cell_selection=land`), considerando anche la somiglianza dell'altitudine.
Il modello resta ERA5: l'opzione `land` non indica il diverso modello ERA5-Land.

Il parametro `elevation` viene omesso. Open-Meteo usa quindi la quota del luogo richiesto
ricavata dal proprio modello digitale del terreno e adatta le temperature a tale quota.
Questa correzione può modificare i valori anche quando la cella selezionata resta la stessa.
La quota restituita dall'API, conservata in `source.elevationM`, è quella usata per la correzione.

La precedente impostazione `elevation=nan` disabilitava la correzione altimetrica, ma faceva
anche ricadere la selezione `land` su `nearest`. Per questo è stata rimossa con l'approvazione
del proprietario. Le regole sono descritte nella [documentazione API][api-storica] e nel
[codice ufficiale della selezione][selezione].

ERA5 è una rianalisi globale su griglia di circa 0,25°. Il valore non è una misura di stazione, la media del comune o un dato puntuale del centro urbano. Il sito conserva sia le coordinate richieste sia quelle restituite.

## Indicatori

Per ogni anno `y`, con `S(y)` insieme dei 92 giorni estivi:

```text
meanTemperatureC(y) = somma temperature_2m_mean / 92
hotDays(y) = numero di temperature_2m_max > 30 °C
precipitationMm(y) = somma precipitation_sum
```

La soglia è stretta: 30,0 °C non conta, 30,1 °C conta. `precipitation_sum` include pioggia, rovesci e precipitazione nevosa espressa come equivalente liquido.

La media di periodo è la media aritmetica dei valori annuali inclusi (30 nel confronto iniziale). La differenza mostrata è `B − A`. Non vengono calcolate percentuali, regressioni o significatività statistica.

La deviazione standard mostrata è campionaria (`n − 1`). La media mobile della serie annuale usa cinque estati centrate; i primi e ultimi due anni non hanno valore mobile. Le strisce colorate classificano la distanza dalla media A a soglie di 0,5 e 1,5 deviazioni standard. Per la precipitazione, il verso dei colori è invertito: meno pioggia viene reso come segnale più caldo/secco. La mappa divide l'intervallo delle dieci variazioni in quattro classi di uguale ampiezza; non rappresenta una misura continua del territorio.

## Precisione

I JSON cittadini conservano la precisione completa degli aggregati. `summers.json`, usato per rendere subito tutte le città, arrotonda la temperatura annuale a due decimali e la precipitazione a un decimale prima del ricalcolo interattivo dei periodi. La tabella e il CSV mantengono la visualizzazione a un decimale; il CSV rimane generato dal JSON cittadino originale e usa il punto decimale. Le medie dei conteggi sono mostrate con un decimale e i conteggi annuali come interi. La formattazione dell’interfaccia usa la lingua italiana.

Nelle schede annuali, nei valori delle dieci città per anno e nei testi del grafico e
delle strisce, i giorni >30 °C sono conteggi interi. Le medie e le differenze rispetto
alle medie mantengono un decimale, anche quando il risultato è un numero intero.
Temperature e precipitazioni mantengono un decimale in entrambi i contesti.

## Validazione

Ogni estate deve avere 92 date uniche e consecutive e 92 valori finiti per campo. La pipeline rifiuta date mancanti o duplicate, `null`, `NaN`, massime inferiori alla media giornaliera, precipitazioni negative, unità inattese e metadati geografici incoerenti.

La generazione avviene in un’area temporanea e sostituisce gli output pubblici soltanto dopo il successo di tutte le città. Il manifest contiene hash SHA-256 per ogni dataset; `dataVersion` deriva esclusivamente dagli aggregati e non dal timestamp.

La validazione di `summers.json` confronta tutte le 600 estati con i JSON cittadini dopo il solo arrotondamento dichiarato. I confini GeoJSON derivano da Natural Earth/world-atlas 2.0.2, vengono salvati nel repository e caricati dal sito stesso; non incidono sui dati climatici.

## Limiti interpretativi

Il passaggio a `land` non garantisce che ogni cella rappresenti bene la città costiera.
Nella rigenerazione del 6 ottobre 2026 soltanto Napoli cambia cella; le altre nove città la
mantengono. Il confronto prima/dopo comprende sia la selezione spaziale sia la correzione
altimetrica: le variazioni non possono essere attribuite tutte al solo passaggio a `land`.

Per Venezia la cella resta a 45,50° N, 12,25° E. Nel periodo 1991–2020 la media dei giorni
con massima >30 °C passa da 6,73 a 6,57. L'influenza di laguna o mare sulla rappresentatività
della cella resta un'ipotesi da verificare con celle vicine e osservazioni locali negli stessi
periodi. I valori bassi da soli non dimostrano un errore; i controlli informatici non verificano
la rappresentatività climatica della cella. Non è stato effettuato un confronto con stazioni.

La rianalisi ricostruisce condizioni atmosferiche usando osservazioni e modelli. I dati possono essere revisionati dal fornitore. Gli aggregati committati identificano la versione mostrata, ma la cache giornaliera originale non è pubblicata e una rigenerazione futura potrebbe produrre risultati diversi.

Le differenze descrivono i due periodi scelti. Non dimostrano causalità, non stimano eventi estremi e non sostituiscono analisi climatiche locali o studi di attribuzione.

[api-storica]: https://open-meteo.com/en/docs/historical-weather-api
[selezione]: https://github.com/open-meteo/open-meteo/blob/main/Sources/App/Domains/Gridable.swift

