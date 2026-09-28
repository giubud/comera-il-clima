export function legalMarkup(): string {
  return `<section class="methods panel" aria-labelledby="methods-heading"><div class="panel-bar"><h2 id="methods-heading">Metodo e limiti</h2></div>
    <div class="methods-grid">
      <article><h3>Cosa confrontiamo</h3><p>Due trentenni consecutivi, 1961—1990 e 1991—2020. Ogni estate copre i 92 giorni dal 1 giugno al 31 agosto. I periodi possono essere modificati nella console.</p></article>
      <article><h3>Da dove arrivano</h3><p>ERA5 è una rianalisi su griglia di circa 0,25°. Ogni città usa la cella più vicina, senza correzione altimetrica: non è una stazione meteo.</p></article>
      <article><h3>Come sono calcolati</h3><p>Media dei 92 valori giornalieri, conteggio delle massime oltre 30 °C, somma delle precipitazioni. Le medie di periodo sono su 30 estati nel confronto predefinito. La deviazione standard è campionaria; la media mobile è centrata su 5 estati.</p></article>
      <article class="sources"><h3>Fonti, licenze e avvertenze</h3>
        <p>Dati dalla <a href="https://open-meteo.com/en/docs/historical-weather-api" rel="noreferrer">Open-Meteo Historical Weather API</a>, modello <a href="https://cds.climate.copernicus.eu/datasets/reanalysis-era5-single-levels" rel="noreferrer">ERA5 del Copernicus Climate Change Service / ECMWF</a>. Dati ottenuti tramite l'API: <a href="https://creativecommons.org/licenses/by/4.0/" rel="noreferrer">CC BY 4.0</a>; codice del progetto: <a href="https://github.com/giubud/comera-il-clima/blob/main/LICENSE" rel="noreferrer">MIT</a>.</p>
        <p>Elaborazione 2026: selezione delle estati 1961–2020, calcolo di tre indicatori annuali e delle medie dei due periodi. Contiene informazioni modificate del Copernicus Climate Change Service. Né la Commissione europea né ECMWF sono responsabili dell'uso che può essere fatto delle informazioni o dei dati Copernicus qui contenuti.</p>
        <p>Questi valori di griglia sono informativi, non misure di stazione o medie comunali; non dimostrano le cause delle differenze e non sostituiscono dati locali ufficiali. I fornitori non garantiscono l'assenza di errori nei dati. <a href="https://github.com/giubud/comera-il-clima/blob/main/DATA_LICENSE.md" rel="noreferrer">Licenze e attribuzioni complete</a> · <a href="https://github.com/giubud/comera-il-clima/blob/main/docs/METHODOLOGY.md" rel="noreferrer">Metodologia</a>.</p>
        <p>Interfaccia adattata dal design consegnato dal proprietario con Claude Design; font <a href="https://github.com/IBM/plex" rel="noreferrer">IBM Plex Sans e Mono</a> (<a href="https://github.com/IBM/plex/blob/master/LICENSE.txt" rel="noreferrer">SIL OFL 1.1</a>).</p>
        <p>Confini cartografici: <a href="https://www.naturalearthdata.com/about/terms-of-use/" rel="noreferrer">Natural Earth</a> (pubblico dominio), distribuiti tramite world-atlas 2.0.2 (ISC). La mappa è una rappresentazione di contesto; i valori provengono da celle ERA5.</p>
      </article>
    </div>
  </section>`;
}
