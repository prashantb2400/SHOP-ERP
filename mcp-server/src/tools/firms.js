import { z } from 'zod';

export function registerFirmTools(server, db) {
  // 1. List Firms
  server.tool(
    'list_firms',
    'List all registered companies and businesses in the user portfolio, including active workspace badge, GSTIN, and location.',
    {},
    async () => {
      try {
        const firms = db.getFirms();
        const activeId = db.state.activeFirmId || 'default';
        return {
          content: [
            {
              type: 'text',
              text: `Registered Businesses (${firms.length}):\n\n` +
                firms
                  .map((f) => {
                    const isActive = f.id === activeId ? ' [ACTIVE WORKSPACE]' : '';
                    return `• [${f.id}] ${f.name} — ${f.business_nature?.toUpperCase()} (${f.state || 'Local'})` +
                           `${f.gstin ? ` [GST: ${f.gstin}]` : ''}${isActive}`;
                  })
                  .join('\n') +
                `\n\nPortfolio JSON:\n${JSON.stringify(firms, null, 2)}`,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to list firms: ${err.message}` }],
        };
      }
    }
  );

  // 2. Get Firm Details
  server.tool(
    'get_firm_details',
    'Retrieve the active business profile, registered GSTIN, banking coordinates, UPI VPA, and invoice sequence settings.',
    {},
    async () => {
      try {
        const firm = db.getActiveFirm();
        return {
          content: [
            {
              type: 'text',
              text: `🏢 Active Business: ${firm.firm_name}\n` +
                    `• Nature: ${firm.business_nature?.toUpperCase() || 'RETAIL'}\n` +
                    `• GSTIN: ${firm.gstin || 'Unregistered'}\n` +
                    `• State: ${firm.state || 'N/A'}\n` +
                    `• Address: ${firm.address || 'N/A'}\n` +
                    `• Phone / Email: ${firm.phone || 'N/A'} | ${firm.email || 'N/A'}\n` +
                    `• UPI ID: ${firm.upi_id || 'N/A'}\n` +
                    `• Bank: ${firm.bank_name || 'N/A'} (A/C: ${firm.account_no || 'N/A'}, IFSC: ${firm.ifsc || 'N/A'})\n` +
                    `• Invoice Prefix: ${firm.inv_prefix || 'INV'} | Default Tax Rate: ${firm.default_gst_rate}%\n\n` +
                    `Raw Details:\n${JSON.stringify(firm, null, 2)}`,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to fetch firm details: ${err.message}` }],
        };
      }
    }
  );

  // 3. Switch Active Firm
  server.tool(
    'switch_active_firm',
    'Switch the active business workspace for multi-firm commercial operations.',
    {
      firm_id: z.string().describe('ID of the firm to switch to (e.g. default, or firm_xxx)'),
    },
    async ({ firm_id }) => {
      try {
        const res = await db.switchFirm(firm_id);
        return {
          content: [
            {
              type: 'text',
              text: `✅ Switched active workspace to "${res.activeFirm.name}" (ID: ${firm_id}). Subsequent invoice and inventory operations will target this business.`,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to switch firm: ${err.message}` }],
        };
      }
    }
  );

  // 4. Create New Firm
  server.tool(
    'create_firm',
    'Register a new commercial business entity into the portfolio.',
    {
      firm_name: z.string().describe('Legal company or store name'),
      business_nature: z.enum(['retail', 'wholesale', 'service', 'contractor', 'firm']).default('retail').describe('Business classification'),
      state: z.string().describe('Jurisdiction state in India (e.g. Maharashtra, Karnataka)'),
      gstin: z.string().optional().describe('15-digit GSTIN'),
      phone: z.string().optional().describe('Contact phone'),
      email: z.string().optional().describe('Official email'),
      address: z.string().optional().describe('Office / shop address'),
      inv_prefix: z.string().optional().default('INV').describe('Series prefix for bills'),
      upi_id: z.string().optional().describe('UPI VPA for payments'),
    },
    async (params) => {
      try {
        const res = await db.createFirm(params);
        return {
          content: [
            {
              type: 'text',
              text: `✅ Registered and switched to new business "${params.firm_name}" (ID: ${res.id}).`,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to create firm: ${err.message}` }],
        };
      }
    }
  );
}
