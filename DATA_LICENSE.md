# Licenza e attribuzione dei dati

I file in `public/data/` sono elaborazioni di dati ottenuti tramite la Open-Meteo Historical Weather API, con modello ERA5 esplicito. La fonte sottostante è il Copernicus Climate Change Service (C3S), gestito da ECMWF.

Open-Meteo dichiara i dati ottenuti tramite l'API disponibili secondo **Creative Commons Attribution 4.0 International (CC BY 4.0)**. La licenza richiede attribuzione, link alla licenza e indicazione delle modifiche:

- Open-Meteo: https://open-meteo.com/
- Historical Weather API: https://open-meteo.com/en/docs/historical-weather-api
- CC BY 4.0: https://creativecommons.org/licenses/by/4.0/
- Fonte sottostante: [ERA5, Copernicus Climate Change Service / ECMWF](https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels). Citazione del dataset: [Hersbach et al., ERA5 hourly data on single levels from 1940 to present](https://doi.org/10.24381/cds.adbb2d47).
- Citazione del servizio: [Zippenfenig (2023), Open-Meteo.com Weather API](https://doi.org/10.5281/ZENODO.7970649).

Modifiche effettuate nel 2026: selezione delle estati giugno–agosto del 1961–2020, validazione, aggregazione dei dati giornalieri in tre indicatori annuali, calcolo delle medie dei periodi 1961–1990 e 1991–2020, arrotondamento solo nella presentazione.

**Contiene informazioni modificate del Copernicus Climate Change Service (elaborazione 2026).** Né la Commissione europea né ECMWF sono responsabili dell'uso che può essere fatto delle informazioni o dei dati Copernicus contenuti nel progetto. Si veda la [licenza d'uso dei prodotti Copernicus](https://cds.climate.copernicus.eu/licences/licence-to-use-copernicus-products), sezione 5.

La licenza MIT in `LICENSE` si applica al codice del progetto; non sostituisce la licenza dei dati né le attribuzioni richieste.

L'uso dell'[API gratuita Open-Meteo](https://open-meteo.com/en/terms) è soggetto a condizioni non commerciali e limiti di chiamata. Questa restrizione riguarda l'accesso all'API gratuita: Open-Meteo dichiara che i dati ottenuti tramite l'API seguono CC BY 4.0, che consente anche il riuso commerciale con attribuzione. Chi intende effettuare nuove chiamate per uso commerciale deve verificare il piano API appropriato con Open-Meteo.

