import { z } from 'zod';

export function registerCustomerTools(server, db) {
  // 1. List Customers
  server.tool(
    'list_customers',
    'List all customer parties, outstanding dues, credit limits, contact info, and registered GSTINs.',
    {
      search: z.string().optional().describe('Filter by customer name, phone number, or GSTIN'),
    },
    async ({ search }) => {
      try {
        const customers = db.getCustomers(search);
        return {
          content: [
            {
              type: 'text',
              text: `Found ${customers.length} customer account(s):\n\n` +
                customers
                  .map(
                    (c) =>
                      `• ${c.name} (${c.phone || 'No phone'}): Outstanding ₹${(c.outstanding || 0).toLocaleString('en-IN')}` +
                      ` / Limit: ₹${(c.credit_limit || 0).toLocaleString('en-IN')}` +
                      `${c.gstin ? ` [GST: ${c.gstin}]` : ''}`
                  )
                  .join('\n') +
                `\n\nData:\n${JSON.stringify(customers, null, 2)}`,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to list customers: ${err.message}` }],
        };
      }
    }
  );

  // 2. Get Customer Ledger
  server.tool(
    'get_customer_ledger',
    'Get detailed transaction ledger for a party including outstanding balance, previous invoices, and payment receipts.',
    {
      customer_id_or_name: z.string().describe('Customer ID or name'),
    },
    async ({ customer_id_or_name }) => {
      try {
        const cust = db.getCustomer(customer_id_or_name);
        if (!cust) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Customer "${customer_id_or_name}" not found.` }],
          };
        }

        const invoices = (db.state.invoices || []).filter(
          (i) => i.customer_id === cust.id || i.customer_name?.toLowerCase() === cust.name.toLowerCase()
        );
        const payments = (db.state.payments || []).filter(
          (p) => p.customer_id === cust.id || p.customer_name?.toLowerCase() === cust.name.toLowerCase()
        );

        return {
          content: [
            {
              type: 'text',
              text: `📋 Customer Ledger: ${cust.name}\n` +
                    `• Contact: ${cust.phone || 'N/A'} | ${cust.email || 'N/A'}\n` +
                    `• GSTIN: ${cust.gstin || 'Unregistered'}\n` +
                    `• Current Outstanding Balance: ₹${(cust.outstanding || 0).toLocaleString('en-IN')}\n` +
                    `• Credit Limit: ₹${(cust.credit_limit || 0).toLocaleString('en-IN')}\n\n` +
                    `Invoices (${invoices.length}):\n` +
                    (invoices.length > 0
                      ? invoices.map((i) => `  - [${i.invoice_no}] ${i.date}: ₹${i.total} (${i.status})`).join('\n')
                      : '  None') +
                    `\n\nPayments Recorded (${payments.length}):\n` +
                    (payments.length > 0
                      ? payments.map((p) => `  - [${p.date}] ₹${p.amount} via ${p.method.toUpperCase()} (${p.reference || 'No ref'})`).join('\n')
                      : '  None'),
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to fetch customer ledger: ${err.message}` }],
        };
      }
    }
  );

  // 3. Add Customer
  server.tool(
    'add_customer',
    'Register a new customer account or business party in the ERP.',
    {
      name: z.string().describe('Legal name of the customer or firm'),
      phone: z.string().optional().describe('Mobile or phone contact number'),
      email: z.string().optional().describe('Email address'),
      gstin: z.string().optional().describe('15-digit GSTIN identifier for B2B billing'),
      address: z.string().optional().describe('Billing / shipping street address'),
      place_of_supply: z.string().optional().describe('State of supply (e.g. Maharashtra)'),
      credit_limit: z.number().optional().default(50000).describe('Approved maximum credit balance allowed'),
      opening_balance: z.number().optional().default(0).describe('Starting outstanding balance owed by party'),
    },
    async (params) => {
      try {
        const cust = await db.addCustomer(params);
        return {
          content: [
            {
              type: 'text',
              text: `✅ Customer party "${cust.name}" registered successfully!\n` +
                    `ID: ${cust.id}\n` +
                    `Credit Limit: ₹${cust.credit_limit.toLocaleString('en-IN')}\n` +
                    `Outstanding: ₹${cust.outstanding.toLocaleString('en-IN')}`,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to add customer: ${err.message}` }],
        };
      }
    }
  );

  // 4. Record Customer Payment
  server.tool(
    'record_customer_payment',
    'Record a payment receipt received from a customer, reducing their pending outstanding dues.',
    {
      customer_id_or_name: z.string().describe('Customer ID or name'),
      amount: z.number().positive().describe('Payment amount received'),
      payment_method: z.enum(['cash', 'upi', 'bank_transfer', 'cheque']).default('upi').describe('Payment instrument'),
      reference: z.string().optional().describe('Bank transaction reference, UTR, or cheque number'),
    },
    async ({ customer_id_or_name, amount, payment_method, reference }) => {
      try {
        const cust = db.getCustomer(customer_id_or_name);
        if (!cust) {
          return {
            isError: true,
            content: [{ type: 'text', text: `Customer "${customer_id_or_name}" not found.` }],
          };
        }
        const res = await db.recordCustomerPayment(cust.id, amount, payment_method, reference);
        return {
          content: [
            {
              type: 'text',
              text: `✅ Payment of ₹${amount.toLocaleString('en-IN')} recorded for "${cust.name}":\n` +
                    `• Method: ${payment_method.toUpperCase()}\n` +
                    `• Reference: ${reference || 'N/A'}\n` +
                    `• Previous Outstanding: ₹${res.prevOutstanding.toLocaleString('en-IN')}\n` +
                    `• New Outstanding Balance: ₹${res.currentOutstanding.toLocaleString('en-IN')}`,
            },
          ],
        };
      } catch (err) {
        return {
          isError: true,
          content: [{ type: 'text', text: `Failed to record payment: ${err.message}` }],
        };
      }
    }
  );
}
