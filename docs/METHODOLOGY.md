# Metodologia

## Ambito

La prima edizione considera soltanto l’estate meteorologica: 92 giorni dal 1 giugno al 31 agosto, estremi inclusi. Confronta due periodi consecutivi di uguale durata:

- A: 1961–1990;
- B: 1991–2020.

Il secondo periodo termina nel 2020 e non rappresenta “oggi”.

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

La media di periodo è la media aritmetica dei 30 valori annuali. La differenza mostrata è `B − A`. Non vengono calcolate percentuali, regressioni o significatività statistica.

## Precisione

I calcoli conservano la precisione completa. Interfaccia, tabella e CSV arrotondano a un decimale temperatura e precipitazioni; le medie dei conteggi sono mostrate con un decimale e i conteggi annuali come interi. La formattazione dell’interfaccia usa la lingua italiana; il CSV usa il punto decimale.

## Validazione

Ogni estate deve avere 92 date uniche e consecutive e 92 valori finiti per campo. La pipeline rifiuta date mancanti o duplicate, `null`, `NaN`, massime inferiori alla media giornaliera, precipitazioni negative, unità inattese e metadati geografici incoerenti.

La generazione avviene in un’area temporanea e sostituisce gli output pubblici soltanto dopo il successo di tutte le città. Il manifest contiene hash SHA-256 per ogni dataset; `dataVersion` deriva esclusivamente dagli aggregati e non dal timestamp.

## Limiti interpretativi

La rianalisi ricostruisce condizioni atmosferiche usando osservazioni e modelli. I dati possono essere revisionati dal fornitore. Gli aggregati committati identificano la versione mostrata, ma la cache giornaliera originale non è pubblicata e una rigenerazione futura potrebbe produrre risultati diversi.

Le differenze descrivono i due periodi scelti. Non dimostrano causalità, non stimano eventi estremi e non sostituiscono analisi climatiche locali o studi di attribuzione.

