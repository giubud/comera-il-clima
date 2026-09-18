# Decisioni

## 2026-09-16 — Avvio del progetto

- Il workspace iniziale non conteneva un repository Git né file applicativi.
- Si mantiene integralmente la specifica in `docs/PLAN.md`.
- Stack: Vite, TypeScript strict, DOM nativo, CSS, Vitest e Playwright.
- Fonte: Open-Meteo Historical Weather API con modello ERA5 esplicito.
- Distribuzione: GitHub Pages con base `/comera-il-clima/`.
- Non sono state introdotte decisioni aggiuntive né variazioni di ambito.

## 2026-09-16 — Ritmo delle richieste dati

- Le richieste annuali coprono più di due settimane e sono conteggiate in modo ponderato dal fornitore.
- Dopo un HTTP 429 osservato durante il primo scaricamento completo, il downloader è stato impostato a una richiesta ogni 1,1 secondi e a un'attesa di 60 secondi per i 429 privi di `Retry-After`.
- La cache valida ha permesso la ripresa senza ripetere le 365 richieste già completate.

## 2026-09-16 — Direzione visiva

- L'interfaccia adotta un'impostazione editoriale da archivio climatico: carta avorio, griglia verticale discreta, tipografia Georgia e superfici dati ad alto contrasto.
- Non si usano fotografie: i dati e il grafico costituiscono il centro visivo, in coerenza con l'ambito.

## 2026-09-16 — Workflow GitHub Pages

- Le versioni principali delle Actions sono state ricontrollate sulle release ufficiali: `checkout@v7`, `setup-node@v7`, `configure-pages@v6`, `upload-pages-artifact@v5`, `deploy-pages@v5`.
- La CI esegue controlli senza rete climatica. Il workflow di deploy aggiunge i test E2E su Chromium prima di caricare l'artefatto Pages.

## 2026-09-18 — Console dati da handoff Claude Design

- Lo ZIP ricevuto è stato usato come riferimento visivo, non come fonte di dati o logica applicativa.
- L'impostazione editoriale è sostituita da una console dati full-width fedele all'handoff: rail delle città, quattro KPI, strisce di anomalia, serie annuale, classifica, tabella, tema chiaro/scuro e densità.
- Restano invariati stack, sorgente ERA5, formule, schema dei dataset cittadini, CSV e stato URL. Il manifest include ora i riepiloghi di periodo già verificati, così rail e classifica non richiedono il caricamento dei dieci dataset.
- Tema e densità sono preferenze locali (comera-console) e non entrano nel collegamento condivisibile.
