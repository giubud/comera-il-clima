# Stato del progetto

Ultimo aggiornamento: 28 settembre 2026
Fase attiva: Revisione v3 completata localmente; pubblicazione GitHub Pages da verificare.
Fasi completate: Fasi 0–7 originali complete; revisione Claude Design v3 implementata e verificata localmente.
File modificati: console, stile, favicon, aggregati compatti, confini locali, generatori e validatori, test, screenshot e documentazione. Lo ZIP ricevuto resta non tracciato.
Comandi eseguiti ed esito: `typecheck`, 19 test unitari, `data:validate`, `build`, 10 test E2E e screenshot desktop/dark/tablet/mobile senza overflow: tutti superati.
Verifiche manuali realmente effettuate: schermate desktop e mobile esaminate; il riepilogo compatto coincide con 600 aggregati reali; geografia scaricata in build da world-atlas 2.0.2 e servita localmente.
Decisioni aggiuntive: periodi interattivi e URL condivisibile; tema/ordine locali; testo legale e CSV conservati; attribuzione Natural Earth e world-atlas aggiunta.
Blocchi e prove del problema: la cache npm esterna era non scrivibile, risolto con `.cache/npm`; Playwright su Windows ha bloccato una trace EBUSY, risolto disabilitando trace solo in locale. Nessun blocco funzionale residuo.
Prossima azione concreta: verificare diff e push, attendere workflow Pages, controllare il sito pubblico e aggiornare questo stato con l'esito.
Commit applicativo: in preparazione.

## Pubblicazione

- Repository: https://github.com/giubud/comera-il-clima
- Sito verificato: https://giubud.github.io/comera-il-clima/
- Query verificata: https://giubud.github.io/comera-il-clima/?city=milano&metric=hotDays
- Workflow riuscito: https://github.com/giubud/comera-il-clima/actions/runs/35128276013
- Workflow aggiornamento console: https://github.com/giubud/comera-il-clima/actions/runs/35385458720
- Workflow crediti e licenze: https://github.com/giubud/comera-il-clima/actions/runs/36440019644

## Inventario iniziale

- Workspace: `C:\sviluppo\codex\com_era_il_clima`
- Contenuto iniziale: `PIANO_COMERA_IL_CLIMA.md`
- Istruzioni repository: nessun `AGENTS.md` rilevato
- Stato Git iniziale: directory non inizializzata come repository
- Fasi previste: 0 Preparazione; 1 Fonte; 2 Scaffold e calcoli; 3 Pipeline; 4 UI; 5 Grafico e accessibilità; 6 Qualità e documentazione; 7 GitHub Pages
