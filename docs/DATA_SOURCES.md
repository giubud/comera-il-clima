# Fonti e provenienza dei dati

## Fonte primaria

- Servizio: Open-Meteo Historical Weather API
- Dataset richiesto: ERA5
- Endpoint: `https://archive-api.open-meteo.com/v1/archive`
- Documentazione: https://open-meteo.com/en/docs/historical-weather-api
- Fuso: `Europe/Rome`
- Unità: Celsius e millimetri
- Selezione spaziale: `cell_selection=nearest`
- Correzione altimetrica: disabilitata con `elevation=nan`

Variabili giornaliere:

- `temperature_2m_mean`;
- `temperature_2m_max`;
- `precipitation_sum`.

Open-Meteo documenta ERA5 come rianalisi ECMWF a circa 0,25°, disponibile dal 1940 e indicata per confronti coerenti su più decenni. Le richieste esatte, la data di recupero e l’hash SHA-256 di ogni risposta sono conservati nei file pubblici delle città.

## Trasformazioni

Il progetto:

1. scarica un’estate per città e anno;
2. valida date, unità, valori e metadati;
3. calcola i tre indicatori annuali;
4. calcola le medie 1961–1990 e 1991–2020;
5. pubblica soltanto gli aggregati JSON e il manifest con hash.

La cache delle risposte giornaliere è locale e ignorata da Git. Non vengono interpolati valori e i dati mancanti non sono sostituiti con zero.

## Coordinate richieste

| Città | Latitudine | Longitudine |
| --- | ---: | ---: |
| Torino | 45.0703 | 7.6869 |
| Milano | 45.4642 | 9.1900 |
| Venezia | 45.4408 | 12.3155 |
| Bologna | 44.4949 | 11.3426 |
| Firenze | 43.7696 | 11.2558 |
| Roma | 41.9028 | 12.4964 |
| Napoli | 40.8518 | 14.2681 |
| Bari | 41.1171 | 16.8719 |
| Palermo | 38.1157 | 13.3615 |
| Cagliari | 39.2238 | 9.1217 |

Le coordinate restituite per la cella effettiva sono contenute nei rispettivi JSON.

## Verifica iniziale

Le richieste pilota reali per Roma 1961 e 2020 sono documentate in [DATA_CHECK.md](DATA_CHECK.md). Le condizioni d’uso sono state ricontrollate il 16 settembre 2026 su https://open-meteo.com/en/terms e https://open-meteo.com/en/pricing.

