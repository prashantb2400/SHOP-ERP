import { openDB } from 'idb';

const DB = 'RetailFlowDB';
let _db = null;

async function db() {
  if (_db) return _db;
  _db = await openDB(DB, 1, { upgrade(d) { d.createObjectStore('kv'); } });
  return _db;
}

export const IDB = {
  async get(k)    { try { return await (await db()).get('kv',k); } catch { return null; } },
  async set(k,v)  { try { await (await db()).put('kv',v,k); } catch {} },
  async del(k)    { try { await (await db()).delete('kv',k); } catch {} },
};

export const LS = {
  get:(k,fb=null)=>{ try{const v=localStorage.getItem(k);return v!=null?JSON.parse(v):fb;}catch{return fb;} },
  set:(k,v)=>{ try{localStorage.setItem(k,JSON.stringify(v));}catch{} },
  del:(k)=>{ try{localStorage.removeItem(k);}catch{} },
};

const DATA_FIELDS = [
  'firm','customers','invoices','purchases','sales','expenses','payments',
  'inventory','inv_counters','inv_categories','credit_notes','audit_log',
  'opening_balances','purchase_orders','staff_roles','manual_journals',
  'bank_recon','accounts_chart','godowns','payroll','attendance','bank_accounts',
];

export async function saveLocal(state, profileId='default') {
  const blob = {};
  DATA_FIELDS.forEach(f => { blob[f] = state[f]; });
  await IDB.set('rf_data_'+profileId, JSON.stringify(blob));
  return JSON.stringify(blob);
}

export async function loadLocal(profileId='default') {
  const raw = await IDB.get('rf_data_'+profileId);
  if (!raw) return null;
  try { return JSON.parse(raw); } catch { return null; }
}

export const FIRMS_KEY = 'rf_firms';
export const ACTIVE_FIRM_KEY = 'rf_active_firm_id';

export async function saveFirmsList(firms) {
  await IDB.set(FIRMS_KEY, JSON.stringify(firms));
  LS.set(FIRMS_KEY, firms);
}

export async function loadFirmsList() {
  const fromIdb = await IDB.get(FIRMS_KEY);
  if (fromIdb) {
    try { return JSON.parse(fromIdb); } catch {}
  }
  return LS.get(FIRMS_KEY, []);
}

export async function deleteFirmStorage(firmId) {
  await IDB.del('rf_data_' + firmId);
}

