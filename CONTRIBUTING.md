# Contribuire

## Preparazione

Usare Node.js 22 e installare le dipendenze dal lockfile:

```bash
npm ci
```

Prima di una modifica leggere `docs/PLAN.md`, `docs/STATUS.md`, `docs/DECISIONS.md`, `docs/METHODOLOGY.md` e `docs/DATA_SOURCES.md`.

## Aggiungere una città

1. Aggiungere ID, nome e coordinate a `src/data/cities.ts`.
2. Documentare la scelta in `docs/DECISIONS.md` e aggiornare la tabella delle coordinate.
3. Eseguire una richiesta pilota limitata e controllare 92 date, unità, null e coordinate restituite.
4. Scaricare l’intervallo completo con `npm run data:fetch -- --city <id>`.
5. Eseguire `npm run data:build` e `npm run data:validate`.
6. Aggiornare i test che fissano il numero e l’ordine delle città.

Non modificare modello o coordinate fra periodi e non sostituire silenziosamente la fonte.

## Rigenerare i dati

```bash
npm run data:fetch -- --all
npm run data:build
npm run data:validate
```

Controllare il diff dei JSON e del manifest. Una revisione del fornitore può cambiare gli aggregati; registrare la nuova `dataVersion` e il motivo della rigenerazione. La cache `.cache/open-meteo/` non deve essere committata.

## Verifiche richieste

```bash
npm run typecheck
npm test
npm run data:validate
npm run build
npm run test:e2e
```

I test ordinari e la build non devono usare la rete. Le pull request non devono contenere credenziali, dati sintetici nel prodotto o risposte giornaliere grezze.

