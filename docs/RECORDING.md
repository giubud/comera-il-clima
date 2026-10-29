# Registrare l'anteprima della demo

La GIF del README mostra l'interfaccia reale: cambio di città, indicatore e tema.
L'immagine statica accanto al collegamento permette di vedere l'anteprima senza animazione.
I file pubblicati sono `docs/media/demo.gif` e `docs/media/demo.png`.

## Metodo semplice su Windows: ScreenToGif

[ScreenToGif](https://github.com/NickeManarin/ScreenToGif) è uno strumento gratuito
che registra un'area dello schermo e permette di salvare una GIF.
Non è una dipendenza del progetto. Scaricalo dalle release del repository ufficiale;
scegli la versione adatta al tuo Windows e segui gli eventuali requisiti indicati.

1. Avvia il sito con Node.js 22: `npm ci`, poi `npm run dev`.
2. Apri `http://localhost:5173/comera-il-clima/?city=roma&metric=meanTemperatureC`.
3. In ScreenToGif scegli il registratore e delimita solo l'area della pagina.
   Una larghezza di circa 960 pixel mantiene leggibili i testi senza creare un file enorme.
4. Registra una sequenza breve: Roma, Milano, giorni >30 °C, tema scuro.
   Lascia un momento tra le azioni; evita movimenti rapidi e scorrimenti continui.
5. Ferma la registrazione, elimina le attese iniziali e finali e controlla i fotogrammi.
6. Salva come GIF in `docs/media/demo.gif`. Esporta anche un fotogramma PNG
   in `docs/media/demo.png`. Preferisci una riproduzione singola a un ciclo continuo.
7. Apri entrambi i file e controlla leggibilità, dimensione e dati personali eventualmente
   presenti nell'area registrata. Punta a una GIF inferiore a 2 MB.

Per aggiornare l'anteprima pubblicata, includi entrambi i file nella PR del progetto.
La registrazione è manuale e non viene eseguita dalla CI o dalla build del sito.

## Alternativa con Playwright

Playwright è già presente nel progetto e può registrare un video del browser.
In un contesto creato con `browser.newContext`, usa l'opzione `recordVideo`:

```typescript
const context = await browser.newContext({
  viewport: { width: 960, height: 640 },
  recordVideo: { dir: '.cache/demo-video', size: { width: 960, height: 640 } },
});
const page = await context.newPage();
await page.goto('http://localhost:5173/comera-il-clima/');
// Esegui qui i cambi di città, indicatore e tema con i locator di Playwright.
await context.close();
```

Il frammento va inserito in uno script che avvia e chiude il browser, come
[`scripts/capture-screenshots.ts`](../scripts/capture-screenshots.ts).
In locale il progetto usa Microsoft Edge; per registrare video Playwright può richiedere
il proprio componente FFmpeg, installabile separatamente con `npx playwright install ffmpeg`.
La chiusura del contesto completa il salvataggio del video.
Playwright non salva direttamente una GIF: serve una conversione successiva,
oppure una sequenza di screenshot PNG da unire con un editor di animazioni.
Per ottenere direttamente una GIF senza scrivere uno script, usa il metodo ScreenToGif.

La GIF inclusa è stata preparata da fotogrammi reali catturati con Playwright e uniti
con Pillow, già disponibile nell'ambiente di lavoro. Il progetto non richiede Python o Pillow
per funzionare e non introduce nuove dipendenze per la registrazione.

Fonte: [documentazione ufficiale dei video Playwright](https://playwright.dev/docs/videos).
