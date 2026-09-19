import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_DATA_DIR = path.join(os.homedir(), '.retailflow');
const DEFAULT_DATA_FILE = path.join(DEFAULT_DATA_DIR, 'storage.json');

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function getFY(dateStr) {
  const d = new Date(dateStr || today());
  const year = d.getFullYear();
  const month = d.getMonth() + 1; // 1-12
  if (month >= 4) {
    return `${year}-${String(year + 1).slice(2)}`;
  }
  return `${year - 1}-${String(year).slice(2)}`;
}

function blankFirm() {
  return {
    firm_name: 'Apex Retail Enterprises',
    gstin: '27AABCA1234A1Z5',
    address: 'Plot 42, Commerce Park, Andheri East, Mumbai, Maharashtra 400069',
    state: 'Maharashtra',
    phone: '+91 98200 12345',
    email: 'contact@apexretail.in',
    website: 'https://apexretail.in',
    bank_name: 'HDFC Bank',
    account_no: '50200012345678',
    ifsc: 'HDFC0000123',
    upi_id: 'apexretail@hdfcbank',
    gst_registered: true,
    business_nature: 'retail',
    billing_type: 'retail',
    inv_prefix: 'INV',
    default_gst_rate: 18,
    default_notes: 'Thank you for shopping with us! Visit again.',
    default_tnc: 'Goods once sold are subject to store exchange policy within 7 days.',
  };
}

function createDefaultState() {
  const defFirm = blankFirm();
  const firmSummary = {
    id: 'default',
    name: defFirm.firm_name,
    gstin: defFirm.gstin,
    phone: defFirm.phone,
    email: defFirm.email,
    state: defFirm.state,
    business_nature: defFirm.business_nature,
    is_default: true,
    created_at: new Date().toISOString(),
    details: defFirm,
  };

  const sampleInventory = [
    {
      id: 'item_1',
      name: 'Wireless Bluetooth Earbuds Pro',
      sku: 'SKU-WBE-01',
      qty: 45,
      rate: 1999,
      mrp: 2999,
      price_mode: 'excl',
      item_type: 'product',
      category: 'Electronics',
      gst_rate: 18,
      hsn: '8518',
      stock: 45,
      unit: 'pcs',
      low_stock_alert: 10,
      godown: 'Main',
    },
    {
      id: 'item_2',
      name: 'Ultra-Fast GaN 65W USB-C Charger',
      sku: 'SKU-GAN-65',
      qty: 8,
      rate: 1450,
      mrp: 2199,
      price_mode: 'excl',
      item_type: 'product',
      category: 'Accessories',
      gst_rate: 18,
      hsn: '8504',
      stock: 8,
      low_stock_alert: 15,
      godown: 'Main',
    },
    {
      id: 'item_3',
      name: 'Braided 100W Type-C Cable 2M',
      sku: 'SKU-TC-2M',
      qty: 120,
      rate: 399,
      mrp: 699,
      price_mode: 'excl',
      item_type: 'product',
      category: 'Accessories',
      gst_rate: 18,
      hsn: '8544',
      stock: 120,
      low_stock_alert: 20,
      godown: 'Main',
    },
    {
      id: 'item_4',
      name: 'Mechanical Gaming Keyboard RGB',
      sku: 'SKU-MGK-01',
      qty: 14,
      rate: 3499,
      mrp: 4999,
      price_mode: 'excl',
      item_type: 'product',
      category: 'Gaming',
      gst_rate: 18,
      hsn: '8471',
      stock: 14,
      low_stock_alert: 5,
      godown: 'Main',
    },
  ];

  const sampleCustomers = [
    {
      id: 'cust_1',
      name: 'Rahul Verma',
      phone: '+91 98111 22334',
      email: 'rahul.verma@example.com',
      gstin: '',
      address: 'B-12, Sector 14, Noida, UP',
      place_of_supply: 'Uttar Pradesh',
      outstanding: 0,
      credit_limit: 25000,
    },
    {
      id: 'cust_2',
      name: 'Horizon Tech Solutions Pvt Ltd',
      phone: '+91 98440 55667',
      email: 'procurement@horizontech.in',
      gstin: '27AABCH9876C1Z2',
      address: 'Unit 402, Cyber Heights, Hinjewadi Phase 1, Pune',
      place_of_supply: 'Maharashtra',
      outstanding: 15400,
      credit_limit: 100000,
    },
  ];

  const sampleInvoices = [
    {
      id: 'inv_101',
      invoice_no: 'INV/26-09/001',
      date: today(),
      due_date: today(),
      customer_name: 'Horizon Tech Solutions Pvt Ltd',
      customer_id: 'cust_2',
      customer_phone: '+91 98440 55667',
      customer_gstin: '27AABCH9876C1Z2',
      customer_address: 'Unit 402, Cyber Heights, Pune',
      place_of_supply: 'Maharashtra',
      doc_type: 'invoice',
      payment_method: 'credit',
      status: 'unpaid',
      is_igst: false,
      inv_with_gst: true,
      items: [
        {
          id: 'it_1',
          name: 'Wireless Bluetooth Earbuds Pro',
          qty: 5,
          rate: 1999,
          gst_rate: 18,
          hsn: '8518',
          taxable: 9995,
          cgst: 899.55,
          sgst: 899.55,
          igst: 0,
          total: 11794.1,
        },
      ],
      total_taxable: 9995,
      gst_amount: 1799.1,
      extra_charges: 0,
      total: 11794,
      fy: getFY(today()),
      notes: 'Payment net 30 days.',
      created_at: new Date().toISOString(),
    },
  ];

  return {
    version: 3,
    activeFirmId: 'default',
    firms: [firmSummary],
    firm: defFirm,
    inventory: sampleInventory,
    customers: sampleCustomers,
    invoices: sampleInvoices,
    inv_counters: { [getFY(today())]: 1 },
    purchases: [],
    expenses: [],
    payments: [],
    credit_notes: [],
    audit_log: [
      {
        ts: new Date().toISOString(),
        user: 'system',
        action: 'init',
        entity: 'store',
        id: 'default',
        note: 'RetailFlow Datastore initialized',
      },
    ],
  };
}

export class RetailFlowDatastore {
  constructor(options = {}) {
    this.filePath = options.filePath || process.env.RETAILFLOW_DATA_PATH || DEFAULT_DATA_FILE;
    this.supabaseUrl = options.supabaseUrl || process.env.SUPABASE_URL || '';
    this.supabaseKey = options.supabaseKey || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
    this.userId = options.userId || process.env.RETAILFLOW_USER_ID || 'local_user';
    this.supabase = null;
    this.state = null;

    if (this.supabaseUrl && this.supabaseKey) {
      try {
        this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
      } catch (err) {
        console.error('[RetailFlow Datastore] Supabase init failed:', err.message);
      }
    }
  }

  async init() {
    // 1. Try pulling from Supabase if configured
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('retailflow_data')
          .select('blob')
          .eq('user_id', this.userId)
          .maybeSingle();

        if (!error && data?.blob) {
          const parsed = typeof data.blob === 'string' ? JSON.parse(data.blob) : data.blob;
          this.state = parsed;
          this._saveLocal();
          return this.state;
        }
      } catch (err) {
        console.warn('[RetailFlow Datastore] Cloud fetch failed, falling back to local:', err.message);
      }
    }

    // 2. Try loading from local file
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf8');
        this.state = JSON.parse(raw);
        return this.state;
      }
    } catch (err) {
      console.warn('[RetailFlow Datastore] Local read failed:', err.message);
    }

    // 3. Fallback to default initialized state
    this.state = createDefaultState();
    this._saveLocal();
    return this.state;
  }

  _saveLocal() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.filePath, JSON.stringify(this.state, null, 2), 'utf8');
    } catch (err) {
      console.error('[RetailFlow Datastore] Failed writing local file:', err.message);
    }
  }

  async save() {
    this._saveLocal();

    if (this.supabase) {
      try {
        await this.supabase.from('retailflow_data').upsert({
          user_id: this.userId,
          blob: JSON.stringify(this.state),
          ts: new Date().toISOString(),
          version: 3,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'user_id' });
      } catch (err) {
        console.error('[RetailFlow Datastore] Cloud sync error:', err.message);
      }
    }
  }

  /* ── Firm / Multi-Tenant Operations ─────────────────────── */
  getFirms() {
    return this.state.firms || [];
  }

  getActiveFirm() {
    const activeId = this.state.activeFirmId || 'default';
    const firm = (this.state.firms || []).find((f) => f.id === activeId);
    return firm?.details || this.state.firm || blankFirm();
  }

  async switchFirm(firmId) {
    const found = (this.state.firms || []).find((f) => f.id === firmId);
    if (!found) {
      throw new Error(`Firm ID "${firmId}" not found.`);
    }
    this.state.activeFirmId = firmId;
    this.state.firm = found.details || found;
    await this.save();
    return { ok: true, activeFirm: found };
  }

  async createFirm(firmData) {
    const newId = 'firm_' + uid();
    const newFirmObj = {
      ...blankFirm(),
      firm_name: firmData.firm_name || 'New Enterprise',
      ...firmData,
    };
    const summary = {
      id: newId,
      name: newFirmObj.firm_name,
      gstin: newFirmObj.gstin || '',
      phone: newFirmObj.phone || '',
      email: newFirmObj.email || '',
      state: newFirmObj.state || '',
      business_nature: newFirmObj.business_nature || 'retail',
      is_default: (this.state.firms || []).length === 0,
      created_at: new Date().toISOString(),
      details: newFirmObj,
    };
    this.state.firms = [...(this.state.firms || []), summary];
    this.state.activeFirmId = newId;
    this.state.firm = newFirmObj;
    await this.save();
    return { ok: true, id: newId, firm: summary };
  }

  /* ── Inventory Operations ─────────────────────────────────── */
  getInventory(filters = {}) {
    let items = this.state.inventory || [];
    if (filters.search) {
      const q = filters.search.toLowerCase();
      items = items.filter((i) => i.name.toLowerCase().includes(q) || (i.sku && i.sku.toLowerCase().includes(q)));
    }
    if (filters.category) {
      items = items.filter((i) => i.category?.toLowerCase() === filters.category.toLowerCase());
    }
    if (filters.lowStockOnly) {
      items = items.filter((i) => (Number(i.stock) || 0) <= (Number(i.low_stock_alert) || 5));
    }
    return items;
  }

  getInventoryItem(idOrName) {
    const items = this.state.inventory || [];
    return items.find((i) => i.id === idOrName || i.name.toLowerCase() === idOrName.toLowerCase() || i.sku?.toLowerCase() === idOrName.toLowerCase());
  }

  async addInventoryItem(item) {
    const newItem = {
      id: 'item_' + uid(),
      name: item.name,
      sku: item.sku || `SKU-${uid().slice(0, 6).toUpperCase()}`,
      qty: Number(item.stock || item.qty || 0),
      stock: Number(item.stock || item.qty || 0),
      rate: Number(item.rate || 0),
      mrp: Number(item.mrp || item.rate || 0),
      price_mode: item.price_mode || 'excl',
      item_type: item.item_type || 'product',
      category: item.category || 'General',
      gst_rate: Number(item.gst_rate ?? 18),
      hsn: item.hsn || '',
      unit: item.unit || 'pcs',
      low_stock_alert: Number(item.low_stock_alert || 5),
      godown: item.godown || 'Main',
    };
    this.state.inventory = [newItem, ...(this.state.inventory || [])];
    await this.save();
    return newItem;
  }

  async updateStock(itemId, deltaQty, reason = 'Adjustment') {
    const item = this.getInventoryItem(itemId);
    if (!item) throw new Error(`Item "${itemId}" not found.`);
    const prev = Number(item.stock || 0);
    const updated = Math.max(0, prev + Number(deltaQty));
    item.stock = updated;
    item.qty = updated;

    this.state.audit_log = [
      {
        ts: new Date().toISOString(),
        user: 'mcp-agent',
        action: 'stock_update',
        entity: 'inventory',
        id: item.id,
        name: item.name,
        prevStock: prev,
        newStock: updated,
        reason,
      },
      ...(this.state.audit_log || []),
    ];

    await this.save();
    return { ok: true, item, prevStock: prev, newStock: updated };
  }

  /* ── Invoicing Operations ─────────────────────────────────── */
  getInvoices(filters = {}) {
    let list = this.state.invoices || [];
    if (filters.status && filters.status !== 'all') {
      list = list.filter((inv) => inv.status === filters.status);
    }
    if (filters.payment_method) {
      list = list.filter((inv) => inv.payment_method === filters.payment_method);
    }
    if (filters.customer_name) {
      const q = filters.customer_name.toLowerCase();
      list = list.filter((inv) => inv.customer_name?.toLowerCase().includes(q));
    }
    if (filters.limit) {
      list = list.slice(0, Number(filters.limit));
    }
    return list;
  }

  getInvoice(idOrNo) {
    return (this.state.invoices || []).find((inv) => inv.id === idOrNo || inv.invoice_no?.toLowerCase() === idOrNo.toLowerCase());
  }

  async createInvoice(params) {
    const activeFirm = this.getActiveFirm();
    const date = params.date || today();
    const fy = getFY(date);
    const prefix = activeFirm.inv_prefix || 'INV';

    // Invoice numbering
    const currentCount = Number(this.state.inv_counters?.[fy] || 0) + 1;
    this.state.inv_counters = { ...(this.state.inv_counters || {}), [fy]: currentCount };

    const d = new Date(date + 'T00:00:00');
    const yy = String(d.getFullYear()).slice(2);
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const invoice_no = `${prefix}/${yy}-${mm}/${String(currentCount).padStart(3, '0')}`;

    // Item line computation
    const firmState = (activeFirm.state || '').toLowerCase().trim();
    const supplyState = (params.place_of_supply || params.customer_state || activeFirm.state || '').toLowerCase().trim();
    const is_igst = params.is_igst !== undefined ? Boolean(params.is_igst) : (supplyState && firmState && supplyState !== firmState);

    let totalTaxable = 0;
    let totalGST = 0;

    const processedItems = (params.items || []).map((it) => {
      const qty = Number(it.qty || 1);
      const rate = Number(it.rate || 0);
      const gstRate = Number(it.gst_rate ?? activeFirm.default_gst_rate ?? 18);
      const taxable = qty * rate;
      const gstAmount = (taxable * gstRate) / 100;

      totalTaxable += taxable;
      totalGST += gstAmount;

      // Auto-deduct inventory if exists
      const match = this.getInventoryItem(it.id || it.name);
      if (match) {
        match.stock = Math.max(0, (Number(match.stock) || 0) - qty);
        match.qty = match.stock;
      }

      return {
        id: it.id || 'it_' + uid(),
        name: it.name,
        qty,
        rate,
        gst_rate: gstRate,
        hsn: it.hsn || '',
        taxable: Math.round(taxable * 100) / 100,
        cgst: is_igst ? 0 : Math.round((gstAmount / 2) * 100) / 100,
        sgst: is_igst ? 0 : Math.round((gstAmount / 2) * 100) / 100,
        igst: is_igst ? Math.round(gstAmount * 100) / 100 : 0,
        total: Math.round((taxable + gstAmount) * 100) / 100,
      };
    });

    const extraCharges = Number(params.extra_charges || 0);
    const grandTotal = Math.round(totalTaxable + totalGST + extraCharges);
    const paymentMethod = params.payment_method || 'cash';
    const status = params.status || (paymentMethod === 'credit' ? 'unpaid' : 'paid');

    const newInvoice = {
      id: 'inv_' + uid(),
      invoice_no,
      date,
      due_date: params.due_date || date,
      customer_name: params.customer_name || 'Walk-in Customer',
      customer_id: params.customer_id || '',
      customer_phone: params.customer_phone || '',
      customer_gstin: (params.customer_gstin || '').toUpperCase(),
      customer_address: params.customer_address || '',
      place_of_supply: params.place_of_supply || activeFirm.state || '',
      doc_type: 'invoice',
      payment_method: paymentMethod,
      status,
      is_igst,
      inv_with_gst: Boolean(activeFirm.gst_registered),
      items: processedItems,
      total_taxable: Math.round(totalTaxable * 100) / 100,
      gst_amount: Math.round(totalGST * 100) / 100,
      extra_charges: extraCharges,
      total: grandTotal,
      fy,
      notes: params.notes || activeFirm.default_notes || '',
      created_at: new Date().toISOString(),
    };

    // Update customer outstanding if credit sale
    if (paymentMethod === 'credit' && params.customer_id) {
      const cust = this.getCustomer(params.customer_id);
      if (cust) {
        cust.outstanding = (Number(cust.outstanding) || 0) + grandTotal;
      }
    }

    this.state.invoices = [newInvoice, ...(this.state.invoices || [])];
    await this.save();
    return newInvoice;
  }

  /* ── Customer / Party Operations ──────────────────────────── */
  getCustomers(search = '') {
    let custs = this.state.customers || [];
    if (search) {
      const q = search.toLowerCase();
      custs = custs.filter((c) => c.name.toLowerCase().includes(q) || c.phone?.includes(q) || c.gstin?.toLowerCase().includes(q));
    }
    return custs;
  }

  getCustomer(idOrName) {
    return (this.state.customers || []).find((c) => c.id === idOrName || c.name.toLowerCase() === idOrName.toLowerCase());
  }

  async addCustomer(params) {
    const newCust = {
      id: 'cust_' + uid(),
      name: params.name,
      phone: params.phone || '',
      email: params.email || '',
      gstin: (params.gstin || '').toUpperCase(),
      address: params.address || '',
      place_of_supply: params.place_of_supply || '',
      credit_limit: Number(params.credit_limit || 50000),
      outstanding: Number(params.opening_balance || 0),
      created_at: new Date().toISOString(),
    };
    this.state.customers = [newCust, ...(this.state.customers || [])];
    await this.save();
    return newCust;
  }

  async recordCustomerPayment(customerId, amount, paymentMethod = 'upi', ref = '') {
    const cust = this.getCustomer(customerId);
    if (!cust) throw new Error(`Customer "${customerId}" not found.`);
    const numAmount = Number(amount);
    const prevOutstanding = Number(cust.outstanding || 0);
    cust.outstanding = Math.max(0, prevOutstanding - numAmount);

    const paymentRecord = {
      id: 'pay_' + uid(),
      customer_id: cust.id,
      customer_name: cust.name,
      amount: numAmount,
      method: paymentMethod,
      reference: ref,
      date: today(),
      created_at: new Date().toISOString(),
    };
    this.state.payments = [paymentRecord, ...(this.state.payments || [])];
    await this.save();
    return { ok: true, payment: paymentRecord, prevOutstanding, currentOutstanding: cust.outstanding };
  }

  /* ── Metrics & Reporting ──────────────────────────────────── */
  getBillingSummary() {
    const invoices = this.state.invoices || [];
    const totalSales = invoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0);
    const totalTaxable = invoices.reduce((sum, i) => sum + (Number(i.total_taxable) || 0), 0);
    const totalGST = invoices.reduce((sum, i) => sum + (Number(i.gst_amount) || 0), 0);
    const unpaidInvoices = invoices.filter((i) => i.status === 'unpaid');
    const totalReceivables = unpaidInvoices.reduce((sum, i) => sum + (Number(i.total) || 0), 0);

    return {
      totalSalesCount: invoices.length,
      totalSalesVolume: totalSales,
      totalTaxableVolume: totalTaxable,
      totalGstCollected: totalGST,
      unpaidInvoicesCount: unpaidInvoices.length,
      totalReceivables,
      activeFirm: this.getActiveFirm().firm_name,
    };
  }

  getGstReport() {
    const invoices = this.state.invoices || [];
    let b2bCount = 0;
    let b2bTaxable = 0;
    let b2bTax = 0;
    let b2cCount = 0;
    let b2cTaxable = 0;
    let b2cTax = 0;

    for (const inv of invoices) {
      const taxable = Number(inv.total_taxable) || 0;
      const tax = Number(inv.gst_amount) || 0;
      if (inv.customer_gstin && inv.customer_gstin.trim().length === 15) {
        b2bCount++;
        b2bTaxable += taxable;
        b2bTax += tax;
      } else {
        b2cCount++;
        b2cTaxable += taxable;
        b2cTax += tax;
      }
    }

    return {
      gstr1: {
        b2b: { count: b2bCount, taxable: b2bTaxable, tax: b2bTax },
        b2c: { count: b2cCount, taxable: b2cTaxable, tax: b2cTax },
        totalOutwardSupplies: b2bTaxable + b2cTaxable,
        totalOutputTax: b2bTax + b2cTax,
      },
    };
  }
}
