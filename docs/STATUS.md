# Stato del progetto

Ultimo aggiornamento: 28 settembre 2026
Fase attiva: Nessuna — licenze, crediti e avvertenze pubblicati
Fasi completate: Fasi 0–7 complete
File modificati: README, licenza/attribuzione dati, fonti, decisioni, sezione legale del sito, test E2E e screenshot aggiornati.
Comandi eseguiti ed esito: `typecheck` e `build` superati; test E2E mirato su licenze e disclaimer superato; screenshot desktop/dark/tablet/mobile acquisiti senza overflow; CI 36440019512 e deploy 36440019644 riusciti.
Verifiche manuali realmente effettuate: consultati termini Open-Meteo, licenza Copernicus, CC BY 4.0 e licenza IBM Plex; screenshot mobile e desktop dark esaminati; README e sito pubblici restituiscono HTTP 200 e contengono i nuovi crediti e il disclaimer.
Decisioni aggiuntive: distinta la licenza dei dati dall'uso dell'API gratuita; aggiunte attribuzione e nota di responsabilità C3S/ECMWF; la sezione del sito chiarisce i limiti della griglia ERA5 e accredita design e font.
Blocchi e prove del problema: 429 risolto con cache, rallentamento e ripresa; precisione binaria nel primo CSV corretta; primo deploy avviato prima dell'attivazione Pages fallito come previsto, quindi Pages è stato attivato e il secondo deploy è riuscito; workaround locale per l'helper sandbox risolto.
Prossima azione concreta: nessuna. Per una futura sessione, riprendere soltanto da una nuova richiesta o da un controllo di manutenzione esplicito.
Commit applicativo: `d8f9b00`.

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
