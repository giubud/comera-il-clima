# Fonti e provenienza dei dati

## Quattro stagioni — schema 2

Il dataset locale schema 2 è completo: 600 risposte annuali recuperate il 30–31 ottobre 2026,
quattro stagioni per città e anno. La precedente fonte estiva è conservata separatamente.
Le nuove richieste aggiungono `temperature_2m_min` a media, massima e precipitazioni.
Ogni richiesta va dal dicembre precedente a novembre dell'anno indicato, per 600 risposte
in `.cache/open-meteo-seasons-v2/`. Le cache `open-meteo-land` e `open-meteo` sono conservate.

Le estati sono ricalcolate dalla cache `open-meteo-land`, per mantenere i risultati pubblicati;
le altre stagioni usano la nuova cache. Il dataset distingue `summerSource` e `source`,
con URL, data, hash, coordinate, quota e scarto UTC. Il pilota ha mostrato UTC+2 nella fonte
estiva originale e UTC+1 in quella nuova. Non vengono mescolate silenziosamente le fonti.
La convenzione dell'inverno, le quote e i limiti di confronto sono in [SEASONS.md](SEASONS.md).

## Fonte primaria

- Servizio: Open-Meteo Historical Weather API
- Dataset richiesto: ERA5
- Endpoint: `https://archive-api.open-meteo.com/v1/archive`
- Documentazione: https://open-meteo.com/en/docs/historical-weather-api
- Fuso: `Europe/Rome`
- Unità: Celsius e millimetri
- Selezione spaziale: preferenza per la terraferma con `cell_selection=land`
- Correzione altimetrica: attiva; `elevation` omesso, quota ricavata da Open-Meteo

Variabili giornaliere:

- `temperature_2m_mean`;
- `temperature_2m_max`;
- `temperature_2m_min`;
- `precipitation_sum`.

Open-Meteo documenta ERA5 come rianalisi ECMWF a circa 0,25°, disponibile dal 1940 e indicata per confronti coerenti su più decenni. Le richieste esatte, la data di recupero e l’hash SHA-256 di ogni risposta sono conservati nei file pubblici delle città.

## Trasformazioni

Il progetto:

1. scarica un anno meteorologico per città, dal dicembre precedente a novembre;
2. valida date, unità, valori e metadati;
3. calcola cinque indicatori per stagione, usando la cache originale per JJA;
4. calcola le medie 1961–1990 e 1991–2020;
5. genera i JSON cittadini, il manifest con hash e i quattro riepiloghi compatti
   `seasons/<codice>.json` derivati dagli stessi aggregati.

La cache delle risposte giornaliere è locale e ignorata da Git. Le richieste annuali usano
`.cache/open-meteo-seasons-v2/`; le cache estive `.cache/open-meteo-land/` e
`.cache/open-meteo/` sono conservate.
Non vengono interpolati valori e i dati mancanti non sono sostituiti con zero.

La rigenerazione del 6 ottobre 2026 usa lo stesso metodo per tutte le 600 estati.
La correzione altimetrica può cambiare le temperature anche a cella invariata.
L'esito del confronto e il dubbio ancora aperto su Venezia sono descritti nella
[metodologia](METHODOLOGY.md) e nelle [decisioni](DECISIONS.md).

## Coordinate richieste

| Città    | Latitudine | Longitudine |
| -------- | ---------: | ----------: |
| Torino   |    45.0703 |      7.6869 |
| Milano   |    45.4642 |      9.1900 |
| Venezia  |    45.4408 |     12.3155 |
| Bologna  |    44.4949 |     11.3426 |
| Firenze  |    43.7696 |     11.2558 |
| Roma     |    41.9028 |     12.4964 |
| Napoli   |    40.8518 |     14.2681 |
| Bari     |    41.1171 |     16.8719 |
| Palermo  |    38.1157 |     13.3615 |
| Cagliari |    39.2238 |      9.1217 |

Le coordinate restituite per la cella effettiva sono contenute nei rispettivi JSON.

## Verifica iniziale

Le richieste pilota reali per Roma 1961 e 2020 sono documentate in [DATA_CHECK.md](DATA_CHECK.md). Licenze, attribuzione e condizioni d'uso sono state ricontrollate il 28 settembre 2026 sui [termini Open-Meteo](https://open-meteo.com/en/terms), sulla [pagina di attribuzione](https://open-meteo.com/en/pricing) e sulla [licenza Copernicus](https://cds.climate.copernicus.eu/licences/licence-to-use-copernicus-products). La dicitura pubblica e il disclaimer sono in [DATA_LICENSE.md](../DATA_LICENSE.md).
