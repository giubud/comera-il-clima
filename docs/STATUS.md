# Stato del progetto

Ultimo aggiornamento: 16 settembre 2026
Fase attiva: Nessuna — progetto pubblicato
Fasi completate: Fasi 0–7 complete
File modificati: applicazione completa in `src/`; pipeline in `scripts/`; dati in `public/data/`; test unitari ed E2E; screenshot; documentazione e workflow GitHub.
Comandi eseguiti ed esito: suite locale finale superata; CI GitHub superata; workflow Pages 35128276013 superato con typecheck, test, validazione dati, build, Chromium ed E2E; deploy completato.
Verifiche manuali realmente effettuate: Roma 1961 ricontrollata; cambio rapido città verificato; screenshot a 1440, 768 e 360 px esaminati; sito pubblico, manifest, JSON di Roma e query Milano/giorni caldi restituiscono 200; selezione e dati corretti nel browser pubblico; nessun errore console.
Decisioni aggiuntive: ritmo downloader ridotto dopo HTTP 429; direzione grafica editoriale senza immagini.
Blocchi e prove del problema: 429 risolto con cache, rallentamento e ripresa; precisione binaria nel primo CSV corretta; primo deploy avviato prima dell'attivazione Pages fallito come previsto, quindi Pages è stato attivato e il secondo deploy è riuscito; workaround locale per l'helper sandbox risolto.
Prossima azione concreta: nessuna. Per una futura sessione, riprendere soltanto da una nuova richiesta o da un controllo di manutenzione esplicito.
Commit, se disponibile: `11c3679` prima dell'aggiornamento finale dello stato.

## Pubblicazione

- Repository: https://github.com/giubud/comera-il-clima
- Sito verificato: https://giubud.github.io/comera-il-clima/
- Query verificata: https://giubud.github.io/comera-il-clima/?city=milano&metric=hotDays
- Workflow riuscito: https://github.com/giubud/comera-il-clima/actions/runs/35128276013

## Inventario iniziale

- Workspace: `C:\sviluppo\codex\com_era_il_clima`
- Contenuto iniziale: `PIANO_COMERA_IL_CLIMA.md`
- Istruzioni repository: nessun `AGENTS.md` rilevato
- Stato Git iniziale: directory non inizializzata come repository
- Fasi previste: 0 Preparazione; 1 Fonte; 2 Scaffold e calcoli; 3 Pipeline; 4 UI; 5 Grafico e accessibilità; 6 Qualità e documentazione; 7 GitHub Pages
