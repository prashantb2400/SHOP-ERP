/**
 * Example: Connecting a Node.js AI Agent to RetailFlow MCP Server.
 */

import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const serverPath = path.resolve(__dirname, '../bin/cli.js');

async function run() {
  const transport = new StdioClientTransport({
    command: 'node',
    args: [serverPath],
  });

  const client = new Client(
    { name: 'retailflow-node-agent', version: '1.0.0' },
    { capabilities: {} }
  );

  console.log('Connecting to RetailFlow MCP Server over stdio...');
  await client.connect(transport);

  // Discover tools
  const { tools } = await client.listTools();
  console.log(`\nConnected! Discovered ${tools.length} ERP Tools:`);
  tools.forEach((t) => console.log(` • ${t.name}`));

  // Execute high-level billing summary tool
  console.log('\nQuerying billing summary via MCP...');
  const summary = await client.callTool({
    name: 'get_billing_summary',
    arguments: {},
  });
  console.log(summary.content[0].text);

  await client.close();
}

run().catch(console.error);
