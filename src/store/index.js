import { create } from 'zustand';
import { uid, today, getFY, r2, buildTotals } from '../engine/calc.js';
import { saveLocal, loadLocal, LS, saveFirmsList, loadFirmsList, deleteFirmStorage, ACTIVE_FIRM_KEY } from '../lib/storage.js';
import { supabaseInit, supabaseOnAuth, supabasePush, supabasePull,
  supabaseSignIn, supabaseSignUp, supabaseGoogleIn, supabaseSignOut } from '../lib/supabase.js';
import { DARK_KEY, QUICK_KEY, SYNC_TS_KEY, DRAFT_KEY } from '../lib/constants.js';

/* ── Factories ──────────────────────────────────────────────── */
export const blankFirm = () => ({
  firm_name:'', gstin:'', address:'', state:'', phone:'', email:'', website:'',
  bank_name:'', account_no:'', ifsc:'', upi_id:'', gst_registered:false,
  business_nature:'retail', billing_type:'retail', inv_prefix:'INV',
  default_gst_rate:18, default_notes:'', default_tnc:'', logo:'', digital_sign:'',
});

export const blankItem = () => ({
  id:uid(), name:'', qty:1, rate:0, mrp:0, price_mode:'excl', item_type:'product',
  category:'', gst_rate:18, hsn:'', discount:0, description:'',
  stock:0, unit:'pcs', party_prices:[], custom_fields:[], online_store:false,
  barcode:'', low_stock_alert:5, godown:'Main', batches:[],
});

export const blankInv = () => ({
  id:uid(), invoice_no:'', date:today(), due_date:'',
  customer_name:'', customer_phone:'', customer_id:'',
  customer_gstin:'', customer_address:'', ship_to:'', place_of_supply:'',
  doc_type:'invoice', payment_method:'cash', status:'paid',
  is_igst:false, inv_with_gst:true,
  items:[blankItem()],
  notes:'', po_number:'', order_id:'',
  inv_discount:0, inv_discount_type:'pct',
  extra_charges:0, extra_charges_label:'Freight',
  tcs_rate:0, round_off:false,
  total:0, total_taxable:0, gst_amount:0,
  irn:'', ack_no:'', ewb_no:'',
});

/* ── Store ──────────────────────────────────────────────────── */
export const useStore = create((set, get) => ({
  /* Navigation */
  mode:'invoice', tab:'list', bizTab:'dash',
  gstTab:'gstr1', acTab:'daybook', fyFilter:'all',

  /* Auth */
  auth:{ user:null, loading:true, offline:false, syncStatus:'idle' },

  /* Preferences */
  dark:        LS.get(DARK_KEY, false),
  invQuickMode:LS.get(QUICK_KEY, false),

  /* Data */
  firms:[],
  activeFirmId: LS.get(ACTIVE_FIRM_KEY, 'default'),
  firm:null, customers:[], invoices:[], purchases:[], sales:[],
  expenses:[], payments:[], inventory:[], inv_counters:{},
  inv_categories:[], credit_notes:[], audit_log:[],
  opening_balances:{}, purchase_orders:[], staff_roles:[],
  manual_journals:[], bank_recon:[], accounts_chart:[],
  godowns:['Main'], payroll:[], attendance:[], bank_accounts:[],

  /* UI ephemeral */
  invForm:null, viewInv:null, invSearch:'', invFilter:'all',
  cnForm:null, batchItemId:null, batchForm:null,
  bankForm:null, mjForm:null, importPreview:null,
  gdwFilter:'', drillLedger:null, cdnrSubTab:'cn',
  payMonth:new Date().toISOString().slice(0,7), payTab:'summary',
  gstr2bData:null, gstr2bResults:null, gstr2bFilter:'all',
  _profileId:'default',

  /* ── Actions ─────────────────────────────────────────────── */
  patch: p => set(typeof p==='function'?p:()=>p),

  setDark: v => { set({dark:v}); LS.set(DARK_KEY,v); document.documentElement.classList.toggle('dark',v); },
  toggleQuick: () => set(s => { const v=!s.invQuickMode; LS.set(QUICK_KEY,v); return {invQuickMode:v}; }),
  setMode: m => set({mode:m, tab:'list'}),
  newInv: () => set({ invForm: blankInv(), tab: 'create', viewInv: null }),

  auditLog(action, entity, id, meta={}) {
    set(s=>({
      audit_log:[{ts:new Date().toISOString(),user:s.auth.user?.email||'local',action,entity,id,...meta},...(s.audit_log||[])].slice(0,500)
    }));
  },

  /* ── Persistence ─────────────────────────────────────────── */
  async save() {
    const s = get();
    const activeId = s.activeFirmId || 'default';

    // Synchronize firms list if firm details have changed
    let updatedFirms = s.firms || [];
    if (s.firm) {
      let found = false;
      updatedFirms = updatedFirms.map(f => {
        if (f.id === activeId) {
          found = true;
          return {
            ...f,
            name: s.firm.firm_name || f.name,
            gstin: s.firm.gstin || f.gstin || '',
            phone: s.firm.phone || f.phone || '',
            email: s.firm.email || f.email || '',
            state: s.firm.state || f.state || '',
            business_nature: s.firm.business_nature || f.business_nature || 'retail',
            details: { ...s.firm }
          };
        }
        return f;
      });
      if (!found && s.firm.firm_name) {
        updatedFirms.push({
          id: activeId,
          name: s.firm.firm_name,
          gstin: s.firm.gstin || '',
          phone: s.firm.phone || '',
          email: s.firm.email || '',
          state: s.firm.state || '',
          business_nature: s.firm.business_nature || 'retail',
          is_default: updatedFirms.length === 0,
          created_at: new Date().toISOString(),
          details: { ...s.firm }
        });
      }
      set({ firms: updatedFirms });
      await saveFirmsList(updatedFirms);
    }

    const blob = await saveLocal(s, activeId);
    if (s.auth.user && navigator.onLine && !s.auth.offline) {
      set(s=>({auth:{...s.auth,syncStatus:'syncing'}}));
      const ok = await supabasePush(s.auth.user.id, blob, new Date().toISOString());
      set(s=>({auth:{...s.auth,syncStatus:ok?'ok':'err'}}));
      if(ok) LS.set(SYNC_TS_KEY, new Date().toISOString());
    }
  },

  async load(profileId) {
    let firmsList = await loadFirmsList();
    const targetId = profileId || LS.get(ACTIVE_FIRM_KEY, 'default');
    const data = await loadLocal(targetId);

    // Backward compatibility & initialization
    if (!firmsList || firmsList.length === 0) {
      if (data?.firm) {
        const defaultFirm = {
          id: targetId,
          name: data.firm.firm_name || 'My Business',
          gstin: data.firm.gstin || '',
          phone: data.firm.phone || '',
          email: data.firm.email || '',
          state: data.firm.state || '',
          business_nature: data.firm.business_nature || 'retail',
          is_default: true,
          created_at: new Date().toISOString(),
          details: { ...data.firm }
        };
        firmsList = [defaultFirm];
        await saveFirmsList(firmsList);
      } else {
        const blank = blankFirm();
        const defaultFirm = {
          id: targetId,
          name: 'My Business',
          gstin: '',
          phone: '',
          email: '',
          state: '',
          business_nature: 'retail',
          is_default: true,
          created_at: new Date().toISOString(),
          details: { ...blank, firm_name: 'My Business' }
        };
        firmsList = [defaultFirm];
        await saveFirmsList(firmsList);
      }
    }

    const matchedFirm = firmsList.find(f => f.id === targetId) || firmsList[0];
    const resolvedId = matchedFirm ? matchedFirm.id : targetId;
    LS.set(ACTIVE_FIRM_KEY, resolvedId);

    if (data) {
      set({
        firms: firmsList,
        activeFirmId: resolvedId,
        firm: data.firm || matchedFirm?.details || null,
        customers: data.customers || [],
        invoices: data.invoices || [],
        purchases: data.purchases || [],
        expenses: data.expenses || [],
        payments: data.payments || [],
        inventory: data.inventory || [],
        inv_counters: data.inv_counters || {},
        inv_categories: data.inv_categories || [],
        credit_notes: data.credit_notes || [],
        audit_log: data.audit_log || [],
        opening_balances: data.opening_balances || {},
        purchase_orders: data.purchase_orders || [],
        staff_roles: data.staff_roles || [],
        manual_journals: data.manual_journals || [],
        bank_recon: data.bank_recon || [],
        accounts_chart: data.accounts_chart || [],
        godowns: data.godowns || ['Main'],
        payroll: data.payroll || [],
        attendance: data.attendance || [],
        bank_accounts: data.bank_accounts || [],
        _profileId: resolvedId,
      });
    } else {
      set({
        firms: firmsList,
        activeFirmId: resolvedId,
        firm: matchedFirm?.details || null,
        customers: [], invoices: [], purchases: [], expenses: [], payments: [],
        inventory: [], inv_counters: {}, inv_categories: [], credit_notes: [],
        audit_log: [], opening_balances: {}, purchase_orders: [], staff_roles: [],
        manual_journals: [], bank_recon: [], accounts_chart: [],
        godowns: ['Main'], payroll: [], attendance: [], bank_accounts: [],
        _profileId: resolvedId,
      });
    }
    return !!data;
  },

  /* ── Multi-Firm / Business Profile Actions ────────────────── */
  async updateFirm(newDetails) {
    const s = get();
    const updatedFirm = { ...(s.firm || blankFirm()), ...newDetails };
    const updatedFirms = (s.firms || []).map(f => {
      if (f.id === s.activeFirmId) {
        return {
          ...f,
          name: updatedFirm.firm_name || f.name,
          gstin: updatedFirm.gstin || '',
          phone: updatedFirm.phone || '',
          email: updatedFirm.email || '',
          state: updatedFirm.state || '',
          business_nature: updatedFirm.business_nature || 'retail',
          details: updatedFirm,
        };
      }
      return f;
    });
    set({ firm: updatedFirm, firms: updatedFirms });
    await saveFirmsList(updatedFirms);
    await get().save();
    get().auditLog('update', 'firm', s.activeFirmId, { name: updatedFirm.firm_name });
    return { ok: true };
  },

  async switchFirm(firmId) {
    const s = get();
    if (firmId === s.activeFirmId) return;
    await get().save();
    LS.set(ACTIVE_FIRM_KEY, firmId);
    await get().load(firmId);
    set({ invForm: null, viewInv: null });
    get().auditLog('switch', 'firm', firmId);
  },

  async createFirm(firmData) {
    const s = get();
    const newId = 'firm_' + uid();
    const newFirmObj = {
      ...blankFirm(),
      firm_name: firmData.firm_name || 'New Business',
      ...firmData,
    };
    const newFirmSummary = {
      id: newId,
      name: newFirmObj.firm_name,
      gstin: newFirmObj.gstin || '',
      phone: newFirmObj.phone || '',
      email: newFirmObj.email || '',
      state: newFirmObj.state || '',
      business_nature: newFirmObj.business_nature || 'retail',
      is_default: (s.firms || []).length === 0,
      created_at: new Date().toISOString(),
      details: newFirmObj,
    };
    const updatedFirms = [...(s.firms || []), newFirmSummary];
    await saveFirmsList(updatedFirms);

    const blankState = {
      firm: newFirmObj,
      customers: [], invoices: [], purchases: [], sales: [],
      expenses: [], payments: [], inventory: [], inv_counters: {},
      inv_categories: [], credit_notes: [],
      audit_log: [{
        ts: new Date().toISOString(),
        user: s.auth.user?.email || 'local',
        action: 'create',
        entity: 'firm',
        id: newId,
        name: newFirmObj.firm_name
      }],
      opening_balances: {}, purchase_orders: [], staff_roles: [],
      manual_journals: [], bank_recon: [], accounts_chart: [],
      godowns: ['Main'], payroll: [], attendance: [], bank_accounts: []
    };
    await saveLocal(blankState, newId);

    LS.set(ACTIVE_FIRM_KEY, newId);
    set({
      firms: updatedFirms,
      activeFirmId: newId,
      _profileId: newId,
      ...blankState,
      invForm: null,
      viewInv: null,
    });
    return { ok: true, id: newId };
  },

  async deleteFirm(firmId) {
    const s = get();
    if ((s.firms || []).length <= 1) {
      return { error: 'Cannot delete the only registered business.' };
    }
    if (firmId === s.activeFirmId) {
      return { error: 'Please switch to another business before deleting this one.' };
    }
    const updatedFirms = (s.firms || []).filter(f => f.id !== firmId);
    await saveFirmsList(updatedFirms);
    await deleteFirmStorage(firmId);
    set({ firms: updatedFirms });
    get().auditLog('delete', 'firm', firmId);
    return { ok: true };
  },

  async initCloud() {
    const ok = supabaseInit();
    if (!ok) { set(s=>({auth:{...s.auth,loading:false,offline:true}})); return; }

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) set(s=>({auth:{...s.auth,loading:false,offline:true}}));
    }, 5000);

    supabaseOnAuth(async user => {
      resolved = true;
      clearTimeout(timeout);
      set(s=>({auth:{...s.auth,user,loading:false}}));
      if (user) {
        const remote = await supabasePull(user.id);
        if (remote?.blob) {
          const localTs  = LS.get(SYNC_TS_KEY);
          if (!localTs || (remote.ts && remote.ts > localTs)) {
            try {
              const data = JSON.parse(remote.blob);
              get().load._mergeRemote?.(data);
              set({ firm:data.firm, customers:data.customers||[], invoices:data.invoices||[],
                purchases:data.purchases||[], expenses:data.expenses||[], payments:data.payments||[],
                inventory:data.inventory||[], credit_notes:data.credit_notes||[],
                opening_balances:data.opening_balances||{}, purchase_orders:data.purchase_orders||[],
                staff_roles:data.staff_roles||[], manual_journals:data.manual_journals||[],
                bank_recon:data.bank_recon||[], godowns:data.godowns||['Main'],
                payroll:data.payroll||[], attendance:data.attendance||[],
                bank_accounts:data.bank_accounts||[],
              });
              LS.set(SYNC_TS_KEY, remote.ts || new Date().toISOString());
            } catch {}
          }
        }
      }
    });
  },

  goOffline: () => set(s=>({auth:{...s.auth,loading:false,offline:true}})),

  signIn:     (e,p) => supabaseSignIn(e,p),
  signUp:     (e,p) => supabaseSignUp(e,p),
  googleIn:   ()    => supabaseGoogleIn(),
  signOut:    ()    => { supabaseSignOut(); set(s=>({auth:{...s.auth,user:null}})); },

  /* Draft */
  saveDraft() { const f=get().invForm; if(f) try{localStorage.setItem(DRAFT_KEY,JSON.stringify(f));}catch{} },
  loadDraft() {
    try { const r=localStorage.getItem(DRAFT_KEY); if(r){set({invForm:JSON.parse(r)});return true;} } catch {}
    return false;
  },
  clearDraft() { try{localStorage.removeItem(DRAFT_KEY);}catch{} },

  /* Invoice numbering */
  nextInvNo(date) {
    const s=get();
    const prefix=s.firm?.inv_prefix||'INV';
    const d=new Date((date||today())+'T00:00:00');
    const yy=String(d.getFullYear()).slice(2), mm=String(d.getMonth()+1).padStart(2,'0');
    const fy=getFY(date||today());
    const count=(s.inv_counters[fy]||0)+1;
    return {no:`${prefix}/${yy}-${mm}/${String(count).padStart(3,'0')}`, count, fy};
  },

  /* Save invoice */
  async saveInvoice(andNew=false) {
    const s = get();
    const f = s.invForm;
    if (!f?.customer_name?.trim()) return {error:'Customer name required'};
    const items = (f.items||[]).filter(it=>it.name?.trim()&&Number(it.rate)>0);
    if (!items.length) return {error:'Add at least one item with rate'};

    // Credit limit check
    if (f.payment_method==='credit' && f.customer_id) {
      const cust=s.customers.find(c=>c.id===f.customer_id);
      if (cust?.credit_limit>0) {
        const newOB=Number(cust.outstanding||0)+Number(f.total||0);
        if (newOB>cust.credit_limit) {
          const go=window.confirm(`⚠️ Credit limit exceeded for ${cust.name}.\nLimit: ₹${cust.credit_limit.toLocaleString('en-IN')}\nNew outstanding: ₹${newOB.toLocaleString('en-IN')}\n\nSave anyway?`);
          if (!go) return {error:'cancelled'};
        }
      }
    }

    const {no,count,fy}=get().nextInvNo(f.date);
    const isReg=s.firm?.gst_registered;
    const t=buildTotals(items,isReg,f.is_igst,
      {inv_discount:f.inv_discount,inv_discount_type:f.inv_discount_type,
       extra_charges:f.extra_charges,tcs_rate:f.tcs_rate});
    const inv={...f,invoice_no:no,items,fy,
      total:t.grandTotal,total_taxable:t.totalTaxable,gst_amount:t.totalGST,
      status:f.payment_method==='credit'?'unpaid':'paid',
      saved_at:new Date().toISOString()};

    set(s=>({
      invoices:[inv,...s.invoices],
      inv_counters:{...s.inv_counters,[fy]:count},
      invForm:andNew?blankInv():inv,
      tab:andNew?'create':'list',
      viewInv:andNew?null:inv,
    }));
    get().auditLog('create','invoice',inv.id,{invoice_no:no,customer_name:f.customer_name,amount:t.grandTotal});
    get().clearDraft();
    await get().save();
    return {ok:true, inv};
  },
}));
