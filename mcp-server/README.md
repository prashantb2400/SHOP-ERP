# RetailFlow / SHOP-ERP — Model Context Protocol (MCP) Server

[![Model Context Protocol](https://img.shields.io/badge/MCP-Standard-blue.svg)](https://modelcontextprotocol.io/)
[![Node Version](https://img.shields.io/badge/Node->=18.0.0-green.svg)](https://nodejs.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A production-grade **Model Context Protocol (MCP)** server for **RetailFlow / SHOP-ERP**. Enables any AI agent (**Claude Desktop, Cursor, Antigravity, ChatGPT, CrewAI, LangChain, AutoGen, or custom bots**) to directly manage billing, create compliant GST invoices, monitor inventory stock levels, audit customer ledgers, generate tax reports, and manage multi-firm portfolios.

---

## 🚀 Quickstart

### Option 1: Run with `npx` (No installation needed)
```bash
npx @retailflow/mcp-server
```

### Option 2: Run locally from repo
```bash
cd mcp-server
npm install
npm start
```

Or from the root directory:
```bash
npm run mcp
```

---

## 🔌 Agent Configurations

### 1. Claude Desktop
Add this to your `claude_desktop_config.json` (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS or `%APPDATA%\Claude\claude_desktop_config.json` on Windows):

```json
{
  "mcpServers": {
    "retailflow": {
      "command": "node",
      "args": ["/absolute/path/to/SHOP-ERP/mcp-server/bin/cli.js"],
      "env": {
        "RETAILFLOW_DATA_PATH": "~/.retailflow/storage.json"
      }
    }
  }
}
```

### 2. Cursor IDE
Create or update `.cursor/mcp.json` in your workspace:

```json
{
  "mcpServers": {
    "retailflow": {
      "command": "node",
      "args": ["${workspaceFolder}/mcp-server/bin/cli.js"]
    }
  }
}
```

### 3. Google Antigravity
Add to your `mcp_config.json` or `.agents/mcp/` directory:

```json
{
  "retailflow": {
    "command": "node",
    "args": ["/home/prashant/.gemini/antigravity/scratch/SHOP-ERP/mcp-server/bin/cli.js"]
  }
}
```

### 4. Python Agents (LangChain, CrewAI, AutoGen)
```python
import asyncio
from langchain_mcp_adapters.client import MultiServerMCPClient
from langchain_openai import ChatOpenAI

async def run_agent():
    async with MultiServerMCPClient({
        "retailflow": {
            "command": "node",
            "args": ["/path/to/mcp-server/bin/cli.js"],
            "transport": "stdio",
        }
    }) as client:
        tools = client.get_tools()
        model = ChatOpenAI(model="gpt-4o").bind_tools(tools)
        
        response = await model.ainvoke("Check low-stock alerts and create an invoice for Horizon Tech.")
        print(response)

asyncio.run(run_agent())
```

---

## 🛠️ Complete Tools Reference

The server exposes **18 tools** across 5 commercial domains:

### 🧾 Invoicing & POS Billing
| Tool | Description | Key Arguments |
| :--- | :--- | :--- |
| `create_invoice` | Generate a new GST tax invoice with automatic CGST/SGST/IGST and stock deduction | `customer_name`, `items`, `payment_method`, `place_of_supply` |
| `list_invoices` | Filter and query invoices by status, date, tender, or customer | `status`, `customer_name`, `payment_method`, `limit` |
| `get_invoice` | Retrieve complete itemized breakdown for an invoice | `id_or_number` |
| `get_billing_summary` | Aggregate commercial KPIs (sales volume, tax collected, receivables) | *(none)* |

### 📦 Inventory Master
| Tool | Description | Key Arguments |
| :--- | :--- | :--- |
| `list_inventory` | Search catalog items, current stock, selling rates, and categories | `search`, `category`, `low_stock_only` |
| `get_inventory_item` | Look up SKU details, MRP, wholesale price, and godown | `id_or_name` |
| `add_inventory_item` | Register a new product or service SKU in the catalog | `name`, `rate`, `stock`, `gst_rate`, `category`, `unit` |
| `update_stock` | Adjust stock count for receiving stock or shrinkage/damage | `item_id_or_name`, `quantity_delta`, `reason` |
| `get_low_stock_alerts` | Instant feed of items at or below reorder threshold | *(none)* |

### 👥 Customer Accounts & Ledgers
| Tool | Description | Key Arguments |
| :--- | :--- | :--- |
| `list_customers` | Directory of party accounts with credit limits & outstanding dues | `search` |
| `get_customer_ledger` | Detailed transaction statement (invoices + payment receipts) | `customer_id_or_name` |
| `add_customer` | Register a new customer party or B2B enterprise | `name`, `phone`, `gstin`, `credit_limit` |
| `record_customer_payment`| Record incoming payment clearing a party's balance | `customer_id_or_name`, `amount`, `payment_method`, `reference` |

### 📑 GST Compliance
| Tool | Description | Key Arguments |
| :--- | :--- | :--- |
| `get_gst_report` | Compute GSTR-1 outward taxable schedule (B2B vs B2C) and tax liability | `period` |

### 🏢 Multi-Firm & Portfolio
| Tool | Description | Key Arguments |
| :--- | :--- | :--- |
| `list_firms` | List all registered companies under the portfolio | *(none)* |
| `get_firm_details` | Retrieve active firm's legal profile, GSTIN, and bank handles | *(none)* |
| `switch_active_firm` | Switch active workspace context for subsequent operations | `firm_id` |
| `create_firm` | Register a new legal commercial company | `firm_name`, `state`, `business_nature`, `gstin` |

---

## 📚 MCP Resources

Agents can read live ERP state using MCP resource URIs:

- `retailflow://firms/current`: Current legal company profile and tax coordinates.
- `retailflow://metrics/summary`: Real-time sales turnover, tax liability, and receivables snapshot.
- `retailflow://inventory/low-stock`: Live feed of low stock items.

---

## 💬 MCP Prompts

Built-in prompt templates designed for high-context agent execution:

- `daily_business_brief`: Executive briefing on sales performance, receivables, and replenishment alerts.
- `draft_invoice`: Guided workflow to convert conversational customer orders into compliant tax bills.
- `audit_gst_compliance`: Review transactions for GSTIN validity and tax calculation integrity.

---

## ⚙️ Configuration & Environment

| Variable | Description | Default |
| :--- | :--- | :--- |
| `RETAILFLOW_DATA_PATH` | Path to local datastore file | `~/.retailflow/storage.json` |
| `SUPABASE_URL` | *(Optional)* Supabase cloud project URL | `""` |
| `SUPABASE_KEY` | *(Optional)* Supabase anon/service-role API key | `""` |
| `RETAILFLOW_USER_ID` | *(Optional)* User partition ID in Supabase | `"local_user"` |

When `SUPABASE_URL` and `SUPABASE_KEY` are provided, all operations sync to the cloud in real time. Without them, the server runs completely offline with 0 external network dependencies.
