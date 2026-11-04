import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server';

async function main() {
  if (Number(process.versions.node.split('.')[0]) !== 22) {
    throw new Error('Questo server richiede Node.js 22.');
  }
  await createServer().connect(new StdioServerTransport());
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : 'Avvio MCP non riuscito.');
  process.exitCode = 1;
});
