import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { InMemoryTransport } from '@modelcontextprotocol/sdk/inMemory.js';
import { ArchiveStore } from '../src/archive';
import { ClimateService } from '../src/service';
import { createServer } from '../src/server';
import { fixture } from './helpers';

const closing: (() => Promise<void>)[] = [];
afterEach(async () => {
  await Promise.all(closing.splice(0).map((close) => close()));
});

async function connected() {
  const { fetcher } = fixture();
  const server = createServer(new ClimateService(new ArchiveStore({ fetch: fetcher })));
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await server.connect(serverTransport);
  closing.push(
    () => client.close(),
    () => server.close(),
  );
  await client.connect(clientTransport);
  return { client, fetcher };
}

describe('contratto MCP e trasporto stdio', () => {
  it('espone schemi di risposta espliciti senza campi che accettano qualsiasi valore', async () => {
    const { client } = await connected();
    const { tools } = await client.listTools();
    const inspect = (node: unknown): void => {
      if (Array.isArray(node)) {
        node.forEach(inspect);
        return;
      }
      if (!node || typeof node !== 'object') return;
      const record = node as Record<string, unknown>;
      expect(Array.isArray(record.type)).toBe(false);
      for (const [key, value] of Object.entries(record)) {
        if (['items', 'additionalProperties'].includes(key) && typeof value === 'object') {
          expect(value).not.toEqual({});
        }
        inspect(value);
      }
    };
    for (const tool of tools) {
      inspect(tool.outputSchema);
      const properties = tool.outputSchema?.properties as Record<string, unknown>;
      expect(properties.data).toHaveProperty('properties');
      expect(properties.provenance).toHaveProperty('items.properties.grid_coordinates');
    }
  });

  it('pubblica esattamente quattro strumenti con limiti, schemi e annotazioni di lettura', async () => {
    const { client, fetcher } = await connected();
    const { tools } = await client.listTools();
    expect(tools.map((tool) => tool.name)).toEqual([
      'list_cities',
      'get_season',
      'compare_periods',
      'rank_years',
    ]);
    for (const tool of tools) {
      expect(tool.description).toContain('celle di griglia');
      expect(tool.description).toContain('stazione meteorologica');
      expect(tool.annotations).toMatchObject({ readOnlyHint: true, destructiveHint: false });
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.outputSchema).toBeDefined();
    }
    expect(fetcher).not.toHaveBeenCalled();
  });

  it('esegue i quattro strumenti tramite il client ufficiale', async () => {
    const { client } = await connected();
    const calls = [
      { name: 'list_cities', arguments: {} },
      { name: 'get_season', arguments: { city_id: 'milano', season: 'DJF', year: 2025 } },
      {
        name: 'compare_periods',
        arguments: {
          city_id: 'roma',
          season: 'JJA',
          period_a: { start_year: 1961, end_year: 1990 },
          period_b: { start_year: 1996, end_year: 2025 },
        },
      },
      {
        name: 'rank_years',
        arguments: {
          city_id: 'palermo',
          season: 'SON',
          metric: 'precipitationMm',
          period: { start_year: 1961, end_year: 2025 },
        },
      },
    ];
    for (const call of calls) {
      const result = await client.callTool(call);
      expect(result.isError).not.toBe(true);
      expect(result.structuredContent).toMatchObject({ source: { model: 'ERA5' } });
      expect(result.content).toEqual([
        { type: 'text', text: JSON.stringify(result.structuredContent) },
      ]);
    }
  });

  it('trasforma input invalidi ed errori di rete in errori MCP espliciti', async () => {
    const { client, fetcher } = await connected();
    const invalid = await client.callTool({
      name: 'get_season',
      arguments: { city_id: 'roma', season: 'JJA', year: '2003' },
    });
    expect(invalid.isError).toBe(true);
    expect(fetcher).not.toHaveBeenCalled();
    fetcher.mockRejectedValueOnce(new Error('offline'));
    const unavailable = await client.callTool({ name: 'list_cities', arguments: {} });
    expect(unavailable.isError).toBe(true);
    expect(unavailable.content).toEqual([
      { type: 'text', text: expect.stringContaining('non raggiungibile') },
    ]);
  });

  it('avvia la build con stdio da un’altra cartella, senza stampare log sul protocollo', async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [fileURLToPath(new URL('../dist/index.js', import.meta.url))],
      cwd: tmpdir(),
      stderr: 'pipe',
    });
    let stderr = '';
    transport.stderr?.on('data', (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    const client = new Client({ name: 'stdio-test', version: '1.0.0' });
    closing.push(() => client.close());
    await client.connect(transport);
    expect((await client.listTools()).tools).toHaveLength(4);
    const invalid = await client.callTool({ name: 'get_season', arguments: {} });
    expect(invalid.isError).toBe(true);
    expect(stderr).toBe('');
  });
});
