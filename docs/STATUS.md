# Stato del progetto

## Revisione A2 — 9 ottobre 2026

Stato: correzione completata in locale sul branch `fix/hotdays-format`.
Il test dei giorni annuali è stato eseguito prima della correzione: atteso `78 giorni`,
ottenuto `78,0 giorni`. Dopo la modifica i cinque test del formato passano.
Le viste annuali mostrano giorni interi; medie e scarti conservano un decimale.
Temperature, precipitazioni, CSV e dati climatici mantengono i valori precedenti.
Roma 2003: `81 giorni`, `27,4 °C`, `34,9 mm`; medie giorni A/B: `31,7` e `53,8`.
Verifiche superate: TypeScript, 26 test unitari, validazione dati, build e 11 test E2E.
Il nuovo E2E controlla scheda annuale, dieci città, grafico, strisce, medie e ricaricamento.
Corretto anche il problema locale dei fine riga dei JSON su Windows, senza rigenerazione.
La regola `.gitattributes` mantiene validi i byte usati dalle impronte dei dataset.
Versione dei dati invariata: `4e434940c5eff13b`.
Il file personale `Verso-la-v4.html` contiene le note delle tre verifiche A2.
Le spunte del proprietario e i prompt dell'esercitazione non sono stati modificati.
Controllo dei sei punti dell'interfaccia completato dall'agente su desktop e mobile:
schede annuali, dieci città, grafico, strisce, medie, tabella e differenze.
Schermate esaminate; nessun errore JavaScript o overflow della pagina rilevato.
Commit applicativo: `8114d4a`; branch inviato su GitHub su indicazione del proprietario.
Pull request: https://github.com/giubud/comera-il-clima/pull/4
Prossima azione: verifica della CI della PR e merge solo dopo tutti i controlli verdi.

## Revisione A1 — 6 ottobre 2026

Stato: punti 1–4 completati in locale sul branch `fix/era5-land-cells`.
Le richieste usano `land` con adattamento all'altitudine; la cache originale è conservata.
I dati sono stati rigenerati dal proprietario: 10 città, 600 estati.
Versione logica dei dati: `4e434940c5eff13b`.
Il confronto prima/dopo è disponibile con `npm run data:compare`.
Metodologia, fonti, decisioni e istruzioni della pipeline sono aggiornate.
Controlli locali superati: TypeScript, 22 test unitari, validazione dati, build e 10 test E2E.
Il test CSV verifica tutte le 60 righe rispetto al JSON cittadino corrente.
Solo Napoli cambia cella. La rappresentatività della cella di Venezia resta da approfondire,
come registrato in `docs/METHODOLOGY.md` e `docs/DECISIONS.md`.
Le modifiche non sono ancora committate o pubblicate; la CI della PR non è ancora stata eseguita.
Prossima azione: commit, push del proprietario e pull request.
Merge solo con la CI richiesta verde.

## Stato della revisione v3 — 28 settembre 2026

Ultimo aggiornamento: 28 settembre 2026
Fase attiva: Nessuna — revisione v3 pubblicata e verificata.
Fasi completate: Fasi 0–7 originali complete; revisione Claude Design v3 implementata e verificata localmente.
File modificati: console, stile, favicon, aggregati compatti, confini locali, generatori e validatori, test, screenshot e documentazione. Lo ZIP ricevuto resta non tracciato.
Comandi eseguiti ed esito: `typecheck`, 19 test unitari, `data:validate`, `build`, 10 test E2E e screenshot desktop/dark/tablet/mobile senza overflow: tutti superati. CI 36454375709 e deploy Pages 36454375525 riusciti.
Verifiche manuali realmente effettuate: schermate desktop e mobile esaminate; il riepilogo compatto coincide con 600 aggregati reali; geografia scaricata in build da world-atlas 2.0.2 e servita localmente. URL pubblici di pagina, `summers.json` e geografia restituiscono HTTP 200; browser pubblico mostra Roma, 10 città, 10 punti mappa e 60 righe annuali.
Decisioni aggiuntive: periodi interattivi e URL condivisibile; tema/ordine locali; testo legale e CSV conservati; attribuzione Natural Earth e world-atlas aggiunta.
Blocchi e prove del problema: la cache npm esterna era non scrivibile, risolto con `.cache/npm`; Playwright su Windows ha bloccato una trace EBUSY, risolto disabilitando trace solo in locale. Nessun blocco funzionale residuo.
Prossima azione concreta: nessuna. Per una futura sessione, riprendere soltanto da una nuova richiesta o da un controllo di manutenzione esplicito.
Commit applicativo: `5d0473a`.

## Pubblicazione

- Repository: https://github.com/giubud/comera-il-clima
- Sito verificato: https://giubud.github.io/comera-il-clima/
- Query verificata: https://giubud.github.io/comera-il-clima/?city=milano&metric=hotDays
- Workflow riuscito: https://github.com/giubud/comera-il-clima/actions/runs/35128276013
- Workflow aggiornamento console: https://github.com/giubud/comera-il-clima/actions/runs/35385458720
- Workflow crediti e licenze: https://github.com/giubud/comera-il-clima/actions/runs/36440019644
- Workflow revisione v3: https://github.com/giubud/comera-il-clima/actions/runs/36454375525

## Inventario iniziale

- Workspace: `C:\sviluppo\codex\com_era_il_clima`
- Contenuto iniziale: `PIANO_COMERA_IL_CLIMA.md`
- Istruzioni repository: nessun `AGENTS.md` rilevato
- Stato Git iniziale: directory non inizializzata come repository
- Fasi previste: 0 Preparazione; 1 Fonte; 2 Scaffold e calcoli; 3 Pipeline; 4 UI; 5 Grafico e accessibilità; 6 Qualità e documentazione; 7 GitHub Pages
