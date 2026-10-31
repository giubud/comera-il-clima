export function legalMarkup(seasonal = false): string {
  const markup = [
    '<section class="methods panel" aria-labelledby="methods-heading">',
    '<div class="panel-bar"><h2 id="methods-heading">Metodo e ',
    'limiti</h2></div>\n    <div class="methods-grid">\n      <article>',
    '<h3>Cosa confrontiamo</h3><p>Due trentenni consecutivi, ',
    '1961—1990 e 1991—2020. Ogni estate copre i 92 giorni dal 1 ',
    'giugno al 31 agosto. I periodi possono essere modificati nella ',
    'console.</p></article>\n      <article><h3>Da dove arrivano</h3>',
    '<p>ERA5 è una rianalisi su griglia di circa 0,25°. Ogni città ',
    'usa la cella più vicina, senza correzione altimetrica: non è una ',
    'stazione meteo.</p></article>\n      <article><h3>Come sono ',
    'calcolati</h3><p>Media dei 92 valori giornalieri, conteggio ',
    'delle massime oltre 30 °C, somma delle precipitazioni. Le medie ',
    'di periodo sono su 30 estati nel confronto predefinito. La ',
    'deviazione standard è campionaria; la media mobile è centrata su ',
    '5 estati.</p></article>\n      <article class="sources"><h3>',
    'Fonti, licenze e avvertenze</h3>\n        <p>Dati dalla <a ',
    'href="https://open-meteo.com/en/docs/historical-weather-api" ',
    'rel="noreferrer">Open-Meteo Historical Weather API</a>, modello ',
    '<a href="https://cds.climate.copernicus.eu/datasets/reanalysis-er',
    'a5-single-levels" rel="noreferrer">ERA5 del Copernicus Climate ',
    "Change Service / ECMWF</a>. Dati ottenuti tramite l'API: <a ",
    'href="https://creativecommons.org/licenses/by/4.0/" ',
    'rel="noreferrer">CC BY 4.0</a>; codice del progetto: <a ',
    'href="https://github.com/giubud/comera-il-clima/blob/main/LICENSE',
    '" rel="noreferrer">MIT</a>.</p>\n        <p>Elaborazione 2026: ',
    'selezione delle estati 1961–2020, calcolo di tre indicatori ',
    'annuali e delle medie dei due periodi. Contiene informazioni ',
    'modificate del Copernicus Climate Change Service. Né la ',
    "Commissione europea né ECMWF sono responsabili dell'uso che può ",
    'essere fatto delle informazioni o dei dati Copernicus qui ',
    'contenuti.</p>\n        <p>Questi valori di griglia sono ',
    'informativi, non misure di stazione o medie comunali; non ',
    'dimostrano le cause delle differenze e non sostituiscono dati ',
    "locali ufficiali. I fornitori non garantiscono l'assenza di ",
    'errori nei dati. <a href="https://github.com/giubud/comera-il-cli',
    'ma/blob/main/DATA_LICENSE.md" rel="noreferrer">Licenze e ',
    'attribuzioni complete</a> · <a href="https://github.com/giubud/co',
    'mera-il-clima/blob/main/docs/METHODOLOGY.md" rel="noreferrer">',
    'Metodologia</a>.</p>\n        <p>Interfaccia adattata dal design ',
    'consegnato dal proprietario con Claude Design; font <a ',
    'href="https://github.com/IBM/plex" rel="noreferrer">IBM Plex ',
    'Sans e Mono</a> (<a href="https://github.com/IBM/plex/blob/master',
    '/LICENSE.txt" rel="noreferrer">SIL OFL 1.1</a>).</p>\n        <p>',
    'Confini cartografici: <a href="https://www.naturalearthdata.com/a',
    'bout/terms-of-use/" rel="noreferrer">Natural Earth</a> (pubblico ',
    'dominio), distribuiti tramite world-atlas 2.0.2 (ISC). La mappa ',
    'è una rappresentazione di contesto; i valori provengono da celle ',
    'ERA5.</p>\n      </article>\n    </div>\n  </section>',
  ].join('');
  const corrected = markup.replace(
    'usa la cella più vicina, senza correzione altimetrica',
    'preferisce celle sulla terraferma, con correzione altimetrica',
  );
  if (!seasonal) return corrected;
  return corrected
    .replace(
      'Ogni estate copre i 92 giorni dal 1 giugno al 31 agosto.',
      'Le stagioni meteorologiche durano 90, 91 o 92 giorni. ' +
        'Inverno 1961 indica dicembre 1960–febbraio 1961.',
    )
    .replace(
      'Media dei 92 valori giornalieri, conteggio delle massime oltre 30 °C, ' +
        'somma delle precipitazioni.',
      'Media dei valori giornalieri e precipitazioni totali; ' +
        'conteggi delle massime >30 °C, delle minime <0 °C e delle precipitazioni ≥20 mm. ' +
        'Le esclusioni stagionali sono dichiarate come non applicabili.',
    )
    .replaceAll('30 estati', '30 stagioni')
    .replaceAll('5 estati', '5 stagioni')
    .replace(
      'selezione delle estati 1961–2020, calcolo di tre indicatori',
      'selezione delle quattro stagioni 1961–2020, calcolo di cinque indicatori',
    );
}
