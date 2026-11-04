# Com’era il clima — server MCP

Quattro strumenti per interrogare le stagioni delle dieci città dal 1961 all’ultimo anno
pubblicato. TypeScript strict, SDK ufficiale `@modelcontextprotocol/sdk` 1.32.2 e Zod 4.6.7.
La linea 1.x corrisponde al pacchetto richiesto; le versioni sono fissate nel lockfile.

Il trasporto è **stdio**: l’app avvia un processo Node locale e comunica attraverso
ingresso e uscita standard. Il server legge i JSON statici del
[sito pubblico](https://giubud.github.io/comera-il-clima/data/manifest.json).
Non servono credenziali. I dati rappresentano celle ERA5, non stazioni meteorologiche.

## Installazione e verifica

Dalla radice del repository, con **Node.js 22** disponibile nel PATH:

```powershell
node --version
npm ci
npm ci --prefix mcp
npm run mcp:typecheck
npm run mcp:build
npm run mcp:test
```

L’avvio compilato è `node mcp/dist/index.js`. Non dipende dalla cartella corrente.
Se PowerShell blocca gli script `npm.ps1` o `npx.ps1`, usa rispettivamente `npm.cmd` e
`npx.cmd`, senza cambiare le impostazioni di esecuzione degli script.
`npm run mcp:start` è una scorciatoia da terminale; nelle app configura direttamente Node,
così stdout contiene esclusivamente il protocollo MCP. I messaggi diagnostici vanno su stderr.
Un terminale silenzioso dopo l’avvio attende una connessione: non è un blocco.

I comandi sotto usano i percorsi di questo PC. Adattali se sposti il progetto o installi Node
altrove. In PowerShell puoi preparare questi due valori:

```powershell
$b3Node22 = 'C:\sviluppo\codex\com_era_il_clima\.cache\tools\node-v22.20.0-win-x64\node.exe'
$b3Server = 'C:\sviluppo\codex\com_era_il_clima\mcp\dist\index.js'
& $b3Node22 --version
```

La risposta deve iniziare con `v22.`. Sono percorsi assoluti a file locali, non URL del sito.

## Claude Code

Nel terminale in cui hai definito le due variabili:

```powershell
claude mcp add --transport stdio --scope local comera-il-clima -- $b3Node22 $b3Server
claude mcp get comera-il-clima
```

Avvia Claude Code nella cartella del progetto. Con `/mcp` controlla la connessione e la presenza
dei quattro strumenti. L’ambito `local` mantiene la configurazione personale al progetto.

## Claude Desktop

Apri Settings → Developer → Edit Config. Su Windows il file è
`%APPDATA%\Claude\claude_desktop_config.json`; su macOS è
`~/Library/Application Support/Claude/claude_desktop_config.json`.

Aggiungi la voce a `mcpServers`, conservando gli altri server già configurati:

```json
{
  "mcpServers": {
    "comera-il-clima": {
      "command": "C:/sviluppo/codex/com_era_il_clima/.cache/tools/node-v22.20.0-win-x64/node.exe",
      "args": ["C:/sviluppo/codex/com_era_il_clima/mcp/dist/index.js"]
    }
  }
}
```

Chiudi completamente e riapri Claude Desktop. Verifica che gli strumenti risultino disponibili.
Se non si collega, consulta `%APPDATA%\Claude\logs` e verifica i percorsi e la versione di Node.

## Codex

Con Codex CLI, nel terminale con le due variabili definite:

```powershell
codex mcp add comera-il-clima -- $b3Node22 $b3Server
codex mcp list
```

In alternativa, aggiungi questa sezione a `~/.codex/config.toml`, conservando le altre impostazioni:

```toml
[mcp_servers.comera-il-clima]
command = 'C:\sviluppo\codex\com_era_il_clima\.cache\tools\node-v22.20.0-win-x64\node.exe'
args = ['C:\sviluppo\codex\com_era_il_clima\mcp\dist\index.js']
startup_timeout_sec = 20
tool_timeout_sec = 60
```

Nell’app desktop, il percorso verificato il 4 novembre 2026 è:
**Impostazioni → Plugin → MCP → Aggiungi → Aggiungi server MCP**.
Inserisci `comera-il-clima` come Nome e seleziona STDIO. In Comando da lanciare incolla
il percorso completo di Node 22, corrispondente al valore di `$b3Node22`; in Argomenti
inserisci una sola riga con il percorso completo del server, corrispondente a `$b3Server`.
I campi delle variabili di ambiente e della directory di lavoro possono restare vuoti.
Salva e usa Riavvia nella sezione Server; verifica la voce scrivendo `/mcp` nella chat.
Il collegamento STDIO locale non richiede autenticazione.

L’avvio richiede Node locale; le chiamate richiedono accesso HTTPS al sito pubblico.
La configurazione è personale e non va aggiunta al repository.
Questa guida non modifica automaticamente le configurazioni delle app.

## Inspector

Con Node 22 nel PATH e le variabili PowerShell definite:

```powershell
npx.cmd @modelcontextprotocol/inspector $b3Node22 $b3Server
```

Il primo avvio può chiedere di scaricare Inspector, senza aggiungerlo alle dipendenze del progetto.
Su macOS e Linux il comando equivalente usa `npx` al posto di `npx.cmd`.
Apri l’indirizzo locale stampato dal comando e collega il trasporto stdio. In Tools verifica
`list_cities`, `get_season`, `compare_periods` e `rank_years`, poi invoca uno strumento.
Chiudi Inspector con Ctrl+C. Non condividere l’indirizzo locale contenente il token della sessione.
Se ricompili il server, in Servers disattiva e riattiva il collegamento per caricare la nuova build.
Per inserire direttamente i parametri di `get_season`, attiva Edit as JSON e usa:

```json
{ "city_id": "milano", "season": "DJF", "year": 2025 }
```

Poi premi Execute Tool. Il selettore cambia soltanto il modo di compilare la richiesta.

## Contratto degli strumenti

| Strumento         | Parametri                                                   |
| ----------------- | ----------------------------------------------------------- |
| `list_cities`     | `{}`                                                        |
| `get_season`      | `city_id`, `season`, `year`                                 |
| `compare_periods` | `city_id`, `season`, `period_a`, `period_b`                 |
| `rank_years`      | `city_id`, `season`, `metric`, `period`, `order?`, `limit?` |

Gli input sono oggetti Zod strict: campi aggiuntivi, nomi errati, numeri passati come testo,
anni fuori archivio e intervalli incompleti sono rifiutati. Ogni periodo ha `start_year` ed
`end_year`, inclusivi. Si possono confrontare periodi di lunghezza diversa, come nel sito:
ogni anno stagionale ha lo stesso peso. `DJF`, `MAM`, `JJA`, `SON` indicano le quattro stagioni.
Per DJF l’anno è quello finale: 2025 significa dicembre 2024–febbraio 2025.

Gli indicatori sono `meanTemperatureC`, `hotDays`, `precipitationMm`, `frostDays`,
`heavyPrecipitationDays`. Soglie: massima >30 °C, minima <0 °C, precipitazioni ≥20 mm/giorno.
Le precipitazioni includono neve espressa come equivalente liquido.

`get_season` restituisce tutti i cinque indicatori. `compare_periods` restituisce per ciascuno
media A, media B e differenza **B − A**. `rank_years` ordina il valore numerico: `desc` dal
maggiore, `asc` dal minore; per cercare le stagioni più secche usa precipitazioni e `asc`.
A parità viene prima l’anno più vecchio. `limit` è un intero positivo entro gli anni scelti;
se omesso restituisce cinque risultati, oppure tutti se gli anni sono meno di cinque.

Ogni risposta contiene `data`, `data_version`, copertura, unità, fonte ERA5/Open-Meteo,
attribuzione, limiti e avvisi. Le misure hanno valori numerici e rappresentazioni italiane
`display`; i conteggi annuali sono interi e le medie conservano i decimali.
`units` conserva `days` del manifest; le singole misure esplicitano l’unità italiana `giorni`.
`provenance` distingue anni, coordinate richieste e della cella, quota e scarti UTC.

I giorni >30 °C in inverno e il gelo in estate sono `null` con `not_applicable` e motivazione.
Una classifica per un indicatore escluso restituisce un elenco vuoto con lo stesso stato.
Gli zeri reali restano numeri. Gli errori sono risultati MCP con `isError: true`.
Le descrizioni di tutti gli strumenti dichiarano celle di griglia, non stazioni cittadine.

## Cache, precisione e limiti

Il manifest e le città richieste restano in memoria per 10 minuti. Richieste simultanee
condividono lo stesso caricamento. Alla scadenza si legge nuovamente il manifest e si crea
uno snapshot nuovo; una chiamata già iniziata conserva il proprio snapshot coerente.
Il server controlla schema, calendario e hash SHA-256 della città rispetto al manifest.
Rifiuta un aggiornamento parziale. Non usa silenziosamente dati scaduti su un errore di rete.
Gli errori non restano nella cache: una chiamata successiva può riprovare.
Le letture hanno un limite di 15 secondi e rifiutano redirect e JSON oltre 5 MB.

Tipi, validatori, calendario e generazione dei riepiloghi provengono da `src/data`.
I valori sono portati alla precisione del sito con `compactSeason`/`expandSeason`;
le medie usano `rangeStats` di `src/lib/aggregate.ts`. I formati riusano quelli della vista.
Le estati originali terminano nel 2020 con UTC+2, le nuove iniziano nel 2021 con UTC+1:
confronti e classifiche che attraversano questa differenza riportano un avviso esplicito.
Le celle non sono misure puntuali né medie comunali e non dimostrano cause climatiche.

## Tre domande per un agente

1. Elenca le città disponibili e dimmi quanti giorni di gelo ci sono stati a Milano nell’inverno
   2024/25. Indica fonte e unità.
2. A Roma, come cambiano temperatura media estiva, giorni oltre 30 °C e precipitazioni tra
   il 1961–1990 e il 1996–2025? Mostra le due medie, la differenza B − A e gli eventuali limiti
   del confronto.
3. Quali sono stati i cinque autunni più piovosi a Palermo dal 1961 al 2025? Per ciascuno
   indica anno e precipitazioni totali in millimetri.

Con l’archivio `153f99695e250a1e`, atteso per la prima domanda: **21 giorni di gelo**.
Per Roma: temperatura **23,2 → 25,3 °C (+2,1)**; caldo **31,7 → 57,9 giorni (+26,2)**;
precipitazioni **115,6 → 78,9 mm (−36,7)**, con avviso orario. Palermo: **2003 (389,2 mm),
1976 (337,1), 2019 (332,9), 1997 (332,6), 2021 (321,6)**.
Questi sono riferimenti di prova per questa versione, non valori fissati nel server.

## Test e CI

Il job `mcp` usa Node 22, installazioni da entrambi i lockfile, controllo TypeScript, build
e test. Ha soltanto `contents: read`; non richiede segreti e non scrive dati o repository.
I test usano copie in memoria dei JSON reali nel repository, non API climatiche né dipendenze
da GitHub Pages disponibile durante la CI. Provano anche i quattro strumenti con il client
ufficiale e avviano la build con vero stdio da una cartella diversa.

I controlli ordinari di lint, formato e dimensione coprono anche `mcp/src`.
Le prove di rete reali sono separate dai test automatici e dai dati del prodotto.
Il server non viene pubblicato come servizio HTTP da GitHub Pages: ogni app avvia il suo processo.

## Fonti delle configurazioni

- [SDK TypeScript ufficiale, linea 1.x](https://github.com/modelcontextprotocol/typescript-sdk/tree/v1.x)
- [Claude Code: MCP](https://code.claude.com/docs/en/mcp)
- [Claude Desktop: server locali](https://modelcontextprotocol.io/docs/develop/connect-local-servers)
- [OpenAI Docs: MCP per Codex](https://developers.openai.com/codex/mcp)
- [Inspector ufficiale](https://modelcontextprotocol.io/docs/tools/inspector)

Consultate il 3 novembre 2026. Licenze e attribuzioni: [DATA_LICENSE.md](../DATA_LICENSE.md).
