import 'dotenv/config';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { RetailFlowDatastore } from './datastore.js';
import { registerInvoiceTools } from './tools/invoices.js';
import { registerInventoryTools } from './tools/inventory.js';
import { registerCustomerTools } from './tools/customers.js';
import { registerGstTools } from './tools/gst.js';
import { registerFirmTools } from './tools/firms.js';
import { registerResources } from './resources/index.js';
import { registerPrompts } from './prompts/index.js';

export async function createServer(options = {}) {
  // 1. Initialize Datastore
  const db = new RetailFlowDatastore(options);
  await db.init();

  // 2. Instantiate MCP Server
  const server = new McpServer(
    {
      name: 'retailflow-mcp',
      version: '1.0.0',
    },
    {
      capabilities: {
        tools: {},
        resources: {},
        prompts: {},
      },
    }
  );

  // 3. Register Tools
  registerInvoiceTools(server, db);
  registerInventoryTools(server, db);
  registerCustomerTools(server, db);
  registerGstTools(server, db);
  registerFirmTools(server, db);

  // 4. Register Resources & Prompts
  registerResources(server, db);
  registerPrompts(server, db);

  return { server, db };
}

export async function startStdioServer(options = {}) {
  const { server, db } = await createServer(options);
  const transport = new StdioServerTransport();

  await server.connect(transport);
  console.error(`[RetailFlow MCP] Server listening on stdio (Active Firm: ${db.getActiveFirm().firm_name})`);

  const shutdown = async () => {
    console.error('[RetailFlow MCP] Shutting down server...');
    await server.close();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  return { server, transport, db };
}
