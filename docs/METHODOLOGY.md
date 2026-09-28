# Metodologia

## Ambito

La prima edizione considera soltanto l’estate meteorologica: 92 giorni dal 1 giugno al 31 agosto, estremi inclusi. Il confronto iniziale usa due periodi consecutivi di uguale durata:

- A: 1961–1990;
- B: 1991–2020.

Il secondo periodo termina nel 2020 e non rappresenta “oggi”.

Nella console A e B possono essere selezionati liberamente nell'intervallo 1961–2020. Periodi sovrapposti, di diversa durata o sotto le dieci estati producono un avviso: il confronto rimane descrittivo, ma è meno immediato da interpretare.

## Rappresentazione geografica

Ogni città è identificata da coordinate fisse. Open-Meteo seleziona la cella ERA5 più vicina (`cell_selection=nearest`) e usa la quota media della cella senza downscaling altimetrico (`elevation=nan`).

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

## Validazione

Ogni estate deve avere 92 date uniche e consecutive e 92 valori finiti per campo. La pipeline rifiuta date mancanti o duplicate, `null`, `NaN`, massime inferiori alla media giornaliera, precipitazioni negative, unità inattese e metadati geografici incoerenti.

La generazione avviene in un’area temporanea e sostituisce gli output pubblici soltanto dopo il successo di tutte le città. Il manifest contiene hash SHA-256 per ogni dataset; `dataVersion` deriva esclusivamente dagli aggregati e non dal timestamp.

La validazione di `summers.json` confronta tutte le 600 estati con i JSON cittadini dopo il solo arrotondamento dichiarato. I confini GeoJSON derivano da Natural Earth/world-atlas 2.0.2, vengono salvati nel repository e caricati dal sito stesso; non incidono sui dati climatici.

## Limiti interpretativi

La rianalisi ricostruisce condizioni atmosferiche usando osservazioni e modelli. I dati possono essere revisionati dal fornitore. Gli aggregati committati identificano la versione mostrata, ma la cache giornaliera originale non è pubblicata e una rigenerazione futura potrebbe produrre risultati diversi.

Le differenze descrivono i due periodi scelti. Non dimostrano causalità, non stimano eventi estremi e non sostituiscono analisi climatiche locali o studi di attribuzione.

