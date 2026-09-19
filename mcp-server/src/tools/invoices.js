import { z } from 'zod';

export function registerInvoiceTools(server, db) {
  // 1. Create Invoice
  server.tool(
    'create_invoice',
    'Create a new GST sales bill or retail invoice. Calculates taxable amounts, CGST/SGST/IGST, updates inventory stock, and increments serial invoice numbers.',
    {
      customer_name: z.string().optional().describe('Name of the customer or business entity'),
      customer_phone: z.string().optional().describe('Contact phone number of the customer'),
      customer_gstin: z.string().optional().describe('15-digit GSTIN if customer is a registered business (e.g. 27AABCH9876C1Z2)'),
      place_of_supply: z.string().optional().describe('Destination state for GST calculation (e.g. Maharashtra, Karnataka)'),
      payment_method: z.enum(['cash', 'upi', 'credit', 'card', 'bank_transfer']).default('cash').describe('Payment tender used for the sale'),
      status: z.enum(['paid', 'unpaid', 'partial']).optional().describe('Payment status. Default is paid for cash/upi and unpaid for credit'),
      items: z.array(
        z.object({
          name: z.string().describe('Item or service name'),
          qty: z.number().positive().default(1).describe('Quantity sold'),
          rate: z.number().nonnegative().describe('Unit price excluding tax'),
          gst_rate: z.number().optional().describe('GST rate percentage (e.g. 0, 5, 12, 18, 28)'),
          hsn: z.string().optional().describe('HSN or SAC code for tax compliance'),
        })
      ).min(1).describe('List of line items included in the invoice'),
      extra_charges: z.number().optional().describe('Freight or additional delivery charges'),
      notes: z.string().optional().describe('Custom notes or terms printed on the bill'),
    },
    async (params) => {
      try {
        const invoice = await db.createInvoice(params);
        return {
          content: [
            {
              type: 'text',
              text: `✅ Invoice #${invoice.invoice_no} created successfully!\n\n` +
                    `Total: ₹${invoice.total.toLocaleString('en-IN')}\n` +
                    `Taxable Amount: ₹${invoice.total_taxable.toLocaleString('en-IN')}\n` +
                    `GST (${invoice.is_igst ? 'IGST' : 'CGST+SGST'}): ₹${invoice.gst_amount.toLocaleString('en-IN')}\n` +
                    `Customer: ${invoice.customer_name}\n` +
                    `Tender: ${invoice.payment_method.toUpperCase()} (${invoice.status.toUpperCase()})\n` +
                    `Items Count: ${invoice.items.length}\n\n` +
                    `Full Invoice Details:\n${JSON.stringify(invoice, null, 2)}`,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to create invoice: ${err.message}` }],
        };
      }
    }
  );

  // 2. List Invoices
  server.tool(
    'list_invoices',
    'Query invoices with optional filters (payment status, customer name, tender method, and result limit).',
    {
      status: z.enum(['all', 'paid', 'unpaid', 'partial', 'void']).optional().describe('Filter by payment status'),
      customer_name: z.string().optional().describe('Filter by partial customer name'),
      payment_method: z.string().optional().describe('Filter by tender (cash, upi, credit, card)'),
      limit: z.number().positive().default(20).describe('Max number of invoices to return'),
    },
    async (params) => {
      try {
        const invoices = db.getInvoices(params);
        return {
          content: [
            {
              type: 'text',
              text: `Found ${invoices.length} invoice(s):\n\n` +
                invoices
                  .map(
                    (i) =>
                      `• [${i.invoice_no}] ${i.date} — ${i.customer_name}: ₹${i.total} (${i.payment_method}, ${i.status})`
                  )
                  .join('\n') +
                `\n\nRaw Data:\n${JSON.stringify(invoices, null, 2)}`,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to list invoices: ${err.message}` }],
        };
      }
    }
  );

  // 3. Get Single Invoice
  server.tool(
    'get_invoice',
    'Retrieve complete line-item breakdown, tax slabs, and customer information for a specific invoice by ID or Invoice Number.',
    {
      id_or_number: z.string().describe('The invoice ID or formatted number (e.g. INV/26-09/001)'),
    },
    async ({ id_or_number }) => {
      try {
        const invoice = db.getInvoice(id_or_number);
        if (!invoice) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Invoice "${id_or_number}" not found.` }],
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(invoice, null, 2),
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to retrieve invoice: ${err.message}` }],
        };
      }
    }
  );

  // 4. Get Billing Summary
  server.tool(
    'get_billing_summary',
    'Get high-level commercial financial metrics including aggregate sales volume, total tax collected, and outstanding receivables.',
    {},
    async () => {
      try {
        const summary = db.getBillingSummary();
        return {
          content: [
            {
              type: 'text',
              text: `📊 Financial Summary for ${summary.activeFirm}:\n\n` +
                    `• Total Invoices: ${summary.totalSalesCount}\n` +
                    `• Total Sales Volume: ₹${summary.totalSalesVolume.toLocaleString('en-IN')}\n` +
                    `• Total Taxable Turnover: ₹${summary.totalTaxableVolume.toLocaleString('en-IN')}\n` +
                    `• GST Collected: ₹${summary.totalGstCollected.toLocaleString('en-IN')}\n` +
                    `• Unpaid Bills: ${summary.unpaidInvoicesCount}\n` +
                    `• Outstanding Receivables: ₹${summary.totalReceivables.toLocaleString('en-IN')}\n\n` +
                    JSON.stringify(summary, null, 2),
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to fetch billing summary: ${err.message}` }],
        };
      }
    }
  );
}
