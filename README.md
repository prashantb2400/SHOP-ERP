# ⚡ RetailFlow (SHOP-ERP)

> **Next-Generation Enterprise GST Invoicing, Split-Cockpit POS, Inventory Master & Model Context Protocol (MCP) Server.**

![License](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/React-v19.2-61dafb.svg?logo=react)
![Vite](https://img.shields.io/badge/Vite-v8.0-646cff.svg?logo=vite)
![Model Context Protocol](https://img.shields.io/badge/MCP-Standard-purple.svg)
![Supabase](https://img.shields.io/badge/Supabase-Realtime%20Sync-3ecf8e.svg?logo=supabase)
![Offline First](https://img.shields.io/badge/Storage-IndexedDB%20Offline%20First-success.svg)

---

## 🌟 Overview

**RetailFlow** is an agency-grade, high-velocity Enterprise Resource Planning (ERP) and Point-of-Sale (POS) system engineered for modern commerce, retail stores, wholesale distributors, and multi-entity enterprises. 

Designed with an aesthetic fusing **Linear**, **shadcn/ui**, **Stripe**, and **Mercury**, RetailFlow features a **Double-Bezel hardware enclosure architecture**, a **Spotlight Command Palette (`Ctrl+K`)**, an **offline-first IndexedDB engine** with **Supabase real-time cloud failover**, and a native **Model Context Protocol (MCP) Server** enabling direct integration with AI agents.

---

## ✨ Key Capabilities

### 1. 🧾 High-Speed Split-Cockpit POS Billing
- **Dual-Pane Desktop Cockpit**: 
  - **Left Pane (62%)**: Fast item lookup, barcode input, customer party selection, tender switchers (`Cash`, `UPI`, `Credit`, `Card`), and real-time line-item calculations.
  - **Right Pane (38%)**: Double-Bezel Commercial Settlement enclosure with dynamic GST breakdown (CGST, SGST, IGST), extra freight charges, discounts, and large authorization action (<kbd>Ctrl+Enter</kbd>).
- **Billing Modes**: Toggle seamlessly between **Quick POS** (3-field ultra-fast retail entry) and **Full POS** (8-field enterprise billing).
- **Invoice Export & Sharing**: Itemized thermal printer formatting, downloadable PDF tax invoices, and 1-click WhatsApp customer dispatch.

### 2. 📊 Executive Intelligence & Bento 2.0 Telemetry
- **Operating Profitability Tile**: Gross revenue, gross margin conversion rate, and net operating profit tracking.
- **Receivables Radar**: Debtor balances with aging buckets and instant WhatsApp collection payment reminders.
- **Live Activity Stream**: Real-time chronological transaction feed with status pulse badges.

### 3. 📦 Inventory Master & Godown Control
- **SKU Master Registry**: Barcode auto-generation, multi-tier pricing (retail vs wholesale), HSN codes, and unit definitions.
- **Warehouse & Batches**: Godown allocation, batch tracking, expiry dates, and threshold-based replenishment alerts.
- **Stock Adjustments**: Inventory audit adjustments with complete log traceability.

### 4. 📒 Divided Fintech Ledgers & Financial Accounts
- **Mercury/Stripe Divided Tables**: Clean monospace numerical alignment (`tabular-nums`) with color-coded debit/credit notation.
- **Day Book & Cash Book**: Daily chronological ledger statements and counter reconciliation.
- **Party Statements**: Complete transaction history, invoices, and payment receipts per customer/vendor.

### 5. 📑 GST Compliance & ITC Reconciliation Hub
- **GSTR-1 Outward Supplies**: Automatic bifurcation into B2B (registered GSTIN) and B2C (unregistered retail) schedules.
- **GSTR-3B Tax Calculator**: Output tax liability computed against Input Tax Credit (ITC) and credit notes.
- **ITC Reconciliation**: Verify purchase invoices and match against GSTR-2B data.

### 6. 🏢 Multi-Business Portfolio Management
- **Strict Data Isolation**: Each registered business operates in its own sandboxed IndexedDB store (`rf_data_${firmId}`).
- **1-Click Workspace Switcher**: Switch between companies instantly from the header breadcrumb or sidebar.
- **Legal Profile Editor**: Multi-tab dialog to update legal names, GSTINs, Indian state jurisdictions, default tax slabs, bank coordinates, and UPI handles.

### 7. 🤖 Native Model Context Protocol (MCP) Server
- **AI Agent Integration**: Includes `@retailflow/mcp-server` allowing **Claude Desktop**, **Cursor**, **Google Antigravity**, **ChatGPT**, **CrewAI**, and **LangChain** agents to directly execute queries, create invoices, check inventory, and run tax audits.
- **18 Commercial Tools**: Invoicing, stock adjustments, customer ledgers, GST reports, and firm switching.
- **Live Resources & Prompts**: Real-time metric URIs (`retailflow://metrics/summary`) and structured conversational prompts (`daily_business_brief`, `draft_invoice`).

---

## 🏗️ Architecture & Tech Stack

```
SHOP-ERP/
├── src/                      # RetailFlow Web Frontend
│   ├── components/
│   │   ├── layout/           # AppShell, Sidebar, Topbar
│   │   ├── firm/             # BusinessSwitcherModal, BusinessDetailsModal
│   │   └── ui/               # CommandPalette, BezelCard, Card, Tabs, Modal, Table
│   ├── features/
│   │   ├── invoice/          # Split Cockpit POS Billing & Invoicing
│   │   ├── business/         # Bento 2.0 Telemetry & Receivables Radar
│   │   ├── inventory/        # Stock, Batches, Godowns & Barcodes
│   │   ├── accounts/         # Daybook, Cashbook, Party Ledgers
│   │   ├── gst/              # GSTR-1, GSTR-3B & ITC Reconciliation
│   │   └── settings/         # AuthScreen & SetupWizard
│   ├── engine/calc.js        # Precision Indian GST & Commercial Math Engine
│   ├── lib/                  # Storage (IndexedDB), Supabase Client & Constants
│   └── store/index.js        # Unified Zustand State Store
├── mcp-server/               # Official Model Context Protocol (MCP) Package
│   ├── bin/cli.js            # Executable Stdio Server CLI
│   ├── src/                  # Datastore layer, 18 Tools, Resources & Prompts
│   └── examples/             # Claude Desktop, Cursor, and Python configs
```

| Layer | Technology |
| :--- | :--- |
| **Framework** | [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/) |
| **State Management** | [Zustand 5](https://zustand-demo.pmnd.rs/) with reactive subscribers |
| **Local Storage** | [idb 8](https://github.com/jakearchibald/idb) (IndexedDB wrapper) |
| **Cloud Sync** | [Supabase JS 2](https://supabase.com/) (Real-time cloud failover) |
| **Iconography** | [Lucide React](https://lucide.dev/) |
| **AI Integration** | [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol) (MCP v1.30) |
| **Styling** | Custom CSS Variables, Double-Bezel hardware styling, Dark/Light modes |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.0.0` or higher (tested on Node `v24.x`)
- **npm**: `v9.0.0` or higher

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/prashantb2400/SHOP-ERP.git
   cd SHOP-ERP
   ```

2. **Install frontend dependencies**:
   ```bash
   npm install
   ```

3. **Install MCP server dependencies** *(optional, for AI agent integration)*:
   ```bash
   cd mcp-server && npm install && cd ..
   ```

4. **Environment Configuration** *(optional for cloud sync)*:
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```
   > *Note: RetailFlow operates 100% offline out-of-the-box using IndexedDB if Supabase credentials are not provided.*

---

## 💻 Running the Application

### Development Server
Start the local Vite development server with Hot Module Replacement (HMR):
```bash
npm run dev
```
Open your browser at `http://localhost:5173/`.

### Production Build & Preview
```bash
npm run build
npm run preview
```

### Code Quality & Linting
```bash
npm run lint
```

---

## 🤖 Using the Model Context Protocol (MCP) Server

RetailFlow includes a dedicated MCP server enabling AI assistants to read and write ERP data.

### Run via Command Line
```bash
# From root directory:
npm run mcp

# Or directly:
node mcp-server/bin/cli.js
```

### Connect to Claude Desktop
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

### Connect to Cursor IDE
Add to `.cursor/mcp.json` in your workspace:

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

### MCP Tools Available to Agents
| Domain | Tools |
| :--- | :--- |
| **Billing** | `create_invoice`, `list_invoices`, `get_invoice`, `get_billing_summary` |
| **Inventory** | `list_inventory`, `get_inventory_item`, `add_inventory_item`, `update_stock`, `get_low_stock_alerts` |
| **Parties** | `list_customers`, `get_customer_ledger`, `add_customer`, `record_customer_payment` |
| **Compliance** | `get_gst_report` (GSTR-1 & GSTR-3B tax calculations) |
| **Multi-Firm** | `list_firms`, `get_firm_details`, `switch_active_firm`, `create_firm` |

*For full MCP specifications and code examples (Python LangChain, CrewAI, Node.js), see [`mcp-server/README.md`](mcp-server/README.md).*

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action | Scope |
| :--- | :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>K</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd> | Open Spotlight Command Palette | Global |
| <kbd>Ctrl</kbd> + <kbd>Enter</kbd> | Authorize & Save Current Invoice | POS Billing Cockpit |
| <kbd>Ctrl</kbd> + <kbd>N</kbd> | Create Fresh Bill Form | Global |
| <kbd>1</kbd> | Jump to POS Billing & Invoicing | Command Palette |
| <kbd>2</kbd> | Jump to Business Intelligence | Command Palette |
| <kbd>3</kbd> | Jump to Inventory Master | Command Palette |
| <kbd>4</kbd> | Jump to Financial Ledgers | Command Palette |
| <kbd>5</kbd> | Jump to GST Compliance Hub | Command Palette |
| <kbd>B</kbd> | Switch Multi-Business Portfolio | Command Palette |
| <kbd>Esc</kbd> | Close Active Modal / Command Palette | Global |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
