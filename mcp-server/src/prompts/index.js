import { z } from 'zod';

export function registerPrompts(server, db) {
  // 1. Daily Executive Business Brief
  server.prompt(
    'daily_business_brief',
    'Generate an executive briefing on today’s billing numbers, top debtors, low stock alerts, and GST positions.',
    {},
    async () => {
      const summary = db.getBillingSummary();
      const lowStock = db.getInventory({ lowStockOnly: true });
      const firm = db.getActiveFirm();

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `You are the executive commercial AI advisor for "${firm.firm_name}".\n\n` +
                    `Here is the latest financial snapshot:\n` +
                    `- Total Sales Count: ${summary.totalSalesCount} invoices\n` +
                    `- Gross Turnover: ₹${summary.totalSalesVolume.toLocaleString('en-IN')}\n` +
                    `- GST Collected: ₹${summary.totalGstCollected.toLocaleString('en-IN')}\n` +
                    `- Unpaid Invoices: ${summary.unpaidInvoicesCount} (Outstanding Receivables: ₹${summary.totalReceivables.toLocaleString('en-IN')})\n` +
                    `- Low Stock SKUs: ${lowStock.length} items needing reorder\n\n` +
                    `Please provide a crisp 3-paragraph executive briefing with:\n` +
                    `1. Sales Performance & Cash Position\n` +
                    `2. Receivables & Collection Action items\n` +
                    `3. Inventory Reorder & Replenishment priority`,
            },
          },
        ],
      };
    }
  );

  // 2. Draft Invoice from Natural Language
  server.prompt(
    'draft_invoice',
    'Assist in drafting a valid, GST-compliant tax invoice from conversational customer orders.',
    {
      order_text: z.string().describe('Unstructured customer order text (e.g. "Sell 2 GaN chargers and 3 cables to Horizon Tech")'),
    },
    async ({ order_text }) => {
      const catalog = db.getInventory().map((i) => ({ name: i.name, rate: i.rate, stock: i.stock, gst_rate: i.gst_rate }));
      const firm = db.getActiveFirm();

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `You are the billing assistant for ${firm.firm_name} (State: ${firm.state}, GSTIN: ${firm.gstin}).\n\n` +
                    `Store Catalog Available:\n${JSON.stringify(catalog, null, 2)}\n\n` +
                    `Order to process: "${order_text}"\n\n` +
                    `Please match the ordered products with the store catalog, determine the appropriate line items and GST calculation, and invoke the \`create_invoice\` tool to generate the invoice.`,
            },
          },
        ],
      };
    }
  );

  // 3. Audit GST Compliance
  server.prompt(
    'audit_gst_compliance',
    'Review all recent transactions for tax compliance, state supply consistency, and valid GSTIN structures.',
    {},
    async () => {
      const gstReport = db.getGstReport();
      const firm = db.getActiveFirm();

      return {
        messages: [
          {
            role: 'user',
            content: {
              type: 'text',
              text: `Review the GST tax position for ${firm.firm_name} (GSTIN: ${firm.gstin}, State: ${firm.state}):\n\n` +
                    JSON.stringify(gstReport, null, 2) +
                    `\n\nHighlight:\n1. B2B vs B2C distribution\n2. Any potential compliance risks or reconciliation flags\n3. Recommendations for monthly GSTR-1 and GSTR-3B filings`,
            },
          },
        ],
      };
    }
  );
}
