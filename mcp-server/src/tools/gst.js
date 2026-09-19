import { z } from 'zod';

export function registerGstTools(server, db) {
  server.tool(
    'get_gst_report',
    'Generate GSTR-1 and GSTR-3B tax compliance breakdown, summarizing B2B outward supplies, B2C consumer sales, and total output tax liability.',
    {
      period: z.string().optional().describe('Filing period or financial year (e.g. 2026-27 or current)'),
    },
    async () => {
      try {
        const report = db.getGstReport();
        const b2b = report.gstr1.b2b;
        const b2c = report.gstr1.b2c;

        return {
          content: [
            {
              type: 'text',
              text: `📑 GST Compliance & Tax Position Report:\n\n` +
                    `1. GSTR-1 Outward Supplies:\n` +
                    `   • B2B Taxable Invoices: ${b2b.count} invoices | Taxable: ₹${b2b.taxable.toLocaleString('en-IN')} | Tax: ₹${b2b.tax.toLocaleString('en-IN')}\n` +
                    `   • B2C Retail Invoices:  ${b2c.count} invoices | Taxable: ₹${b2c.taxable.toLocaleString('en-IN')} | Tax: ₹${b2c.tax.toLocaleString('en-IN')}\n` +
                    `   • Total Outward Turnover: ₹${report.gstr1.totalOutwardSupplies.toLocaleString('en-IN')}\n` +
                    `   • Total Output GST Liability: ₹${report.gstr1.totalOutputTax.toLocaleString('en-IN')}\n\n` +
                    `Full Report JSON:\n${JSON.stringify(report, null, 2)}`,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to generate GST report: ${err.message}` }],
        };
      }
    }
  );
}
