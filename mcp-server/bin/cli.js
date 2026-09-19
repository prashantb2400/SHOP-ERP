#!/usr/bin/env node

import { startStdioServer } from '../src/index.js';

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
RetailFlow / SHOP-ERP - Model Context Protocol (MCP) Server

Usage:
  retailflow-mcp [options]

Options:
  --data-path <path>    Specify custom JSON data storage file path
  --help, -h            Show this help dialog

Environment Variables:
  RETAILFLOW_DATA_PATH  Path to local datastore file (default: ~/.retailflow/storage.json)
  SUPABASE_URL          Supabase project URL for cloud sync
  SUPABASE_KEY          Supabase anon/service-role API key
  RETAILFLOW_USER_ID    User ID identifier for cloud partition

Integration in Claude Desktop (claude_desktop_config.json):
  {
    "mcpServers": {
      "retailflow": {
        "command": "npx",
        "args": ["-y", "@retailflow/mcp-server"]
      }
    }
  }
`);
  process.exit(0);
}

let customDataPath = null;
const dataIdx = args.indexOf('--data-path');
if (dataIdx !== -1 && args[dataIdx + 1]) {
  customDataPath = args[dataIdx + 1];
}

startStdioServer({ filePath: customDataPath }).catch((err) => {
  console.error('[RetailFlow MCP] Fatal Error:', err);
  process.exit(1);
});
