import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import type { ZodType } from 'zod';
import { compareInput, listInput, rankInput, seasonInput } from './inputs';
import { ClimateService, type ToolReply } from './service';
import { LIMITATION } from './config';
import { compareOutput, listOutput, rankOutput, seasonOutput } from './outputs';

const annotations = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
};
async function result(action: () => Promise<ToolReply>, schema: ZodType): Promise<CallToolResult> {
  try {
    const data = await action();
    schema.parse(data);
    return { content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Errore durante la lettura dei dati.';
    return { isError: true, content: [{ type: 'text', text: message }] };
  }
}

export function createServer(service = new ClimateService()): McpServer {
  const server = new McpServer({ name: 'comera-il-clima', version: '1.0.0' });
  server.registerTool(
    'list_cities',
    {
      description:
        'Elenca città, stagioni, indicatori e anni dell’archivio pubblicato. ' + LIMITATION,
      inputSchema: listInput,
      outputSchema: listOutput,
      annotations,
    },
    (input) =>
      result(() => {
        listInput.parse(input);
        return service.listCities();
      }, listOutput),
  );
  server.registerTool(
    'get_season',
    {
      description:
        'Legge i cinque indicatori di una città, stagione e anno, con date, giorni e unità. ' +
        'Per DJF l’anno è quello finale dell’inverno. ' +
        LIMITATION,
      inputSchema: seasonInput,
      outputSchema: seasonOutput,
      annotations,
    },
    (input) => result(() => service.getSeason(seasonInput.parse(input)), seasonOutput),
  );
  server.registerTool(
    'compare_periods',
    {
      description:
        'Confronta le medie stagionali di due periodi inclusivi: restituisce A, B e B−A. ' +
        'Dichiara unità, esclusioni e discontinuità orarie delle fonti. ' +
        LIMITATION,
      inputSchema: compareInput,
      outputSchema: compareOutput,
      annotations,
    },
    (input) => result(() => service.comparePeriods(compareInput.parse(input)), compareOutput),
  );
  server.registerTool(
    'rank_years',
    {
      description:
        'Ordina anni per il valore numerico di un indicatore, crescente o decrescente. ' +
        'Default: 5 risultati, massimo gli anni del periodo; parità: anno più vecchio prima. ' +
        'Per le stagioni più secche usa precipitationMm e order=asc. ' +
        LIMITATION,
      inputSchema: rankInput,
      outputSchema: rankOutput,
      annotations,
    },
    (input) => result(() => service.rankYears(rankInput.parse(input)), rankOutput),
  );
  return server;
}
