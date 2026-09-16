# Verifica della fonte

Ultima verifica: 16 settembre 2026.

## Richieste pilota

Sono state eseguite realmente due richieste HTTPS all'endpoint ufficiale `https://archive-api.open-meteo.com/v1/archive`, con questi parametri comuni:

- coordinate richieste: 41.9028, 12.4964 (Roma);
- `daily=temperature_2m_mean,temperature_2m_max,precipitation_sum`;
- `models=era5` (esplicito, non Best Match);
- `timezone=Europe/Rome`;
- `temperature_unit=celsius`, `precipitation_unit=mm`;
- `cell_selection=nearest`, `elevation=nan`;
- intervalli: `1961-06-01`–`1961-08-31` e `2020-06-01`–`2020-08-31`.

## Esito osservato

Entrambe le risposte hanno restituito:

- 92 date uniche, dalla data iniziale alla data finale senza valori null;
- campi `temperature_2m_mean`, `temperature_2m_max`, `precipitation_sum`;
- unità `°C`, `°C`, `mm`;
- fuso `Europe/Rome`;
- coordinate della cella 42,0 e 12,5, quota media della cella 137 m.

Le coordinate e la quota restituite sono risultate coerenti fra i due anni. Il modello richiesto è fissato dal parametro `models=era5`; la risposta non include un campo separato con il nome del modello.

## Documentazione e condizioni verificate

La documentazione ufficiale indica ERA5 (griglia 0,25°, dal 1940) come adatto a confronti coerenti su più decenni. Specifica inoltre che `elevation=nan` disabilita il downscaling altimetrico, `cell_selection=nearest` seleziona la cella più vicina e che `precipitation_sum` comprende pioggia, rovesci e neve.

Il servizio gratuito è riservato a usi non commerciali, con limiti dichiarati di 600 chiamate/minuto, 5.000/ora, 10.000/giorno e 300.000/mese. La documentazione di prezzo precisa che richieste oltre due settimane possono valere come più chiamate. I dati sono CC BY 4.0 e richiedono attribuzione e indicazione delle trasformazioni.

Fonti ufficiali:

- https://open-meteo.com/en/docs/historical-weather-api
- https://open-meteo.com/en/terms
- https://open-meteo.com/en/pricing

## Limiti

ERA5 è una rianalisi su griglia, non una stazione cittadina e non la media del territorio comunale. Le risposte future possono cambiare per revisioni del fornitore; gli aggregati pubblicati e i relativi hash identificano la versione mostrata.
