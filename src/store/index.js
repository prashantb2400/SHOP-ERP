import { create } from 'zustand';
import { uid, today, getFY, r2, buildTotals } from '../engine/calc.js';
import { saveLocal, loadLocal, LS } from '../lib/storage.js';
import { fbaseInit, fbaseOnAuth, fbasePush, fbasePull,
  fbaseSignIn, fbaseSignUp, fbaseGoogleIn, fbaseSignOut } from '../lib/firebase.js';
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

  auditLog(action, entity, id, meta={}) {
    set(s=>({
      audit_log:[{ts:new Date().toISOString(),user:s.auth.user?.email||'local',action,entity,id,...meta},...(s.audit_log||[])].slice(0,500)
    }));
  },

  /* ── Persistence ─────────────────────────────────────────── */
  async save() {
    const s = get();
    const blob = await saveLocal(s, s._profileId);
    if (s.auth.user && navigator.onLine && !s.auth.offline) {
      set(s=>({auth:{...s.auth,syncStatus:'syncing'}}));
      const ok = await fbasePush(s.auth.user.id, blob, new Date().toISOString());
      set(s=>({auth:{...s.auth,syncStatus:ok?'ok':'err'}}));
      if(ok) LS.set(SYNC_TS_KEY, new Date().toISOString());
    }
  },

  async load(profileId='default') {
    const data = await loadLocal(profileId);
    if (data) {
      set({
        firm:data.firm||null, customers:data.customers||[],
        invoices:data.invoices||[], purchases:data.purchases||[],
        expenses:data.expenses||[], payments:data.payments||[],
        inventory:data.inventory||[], inv_counters:data.inv_counters||{},
        inv_categories:data.inv_categories||[], credit_notes:data.credit_notes||[],
        audit_log:data.audit_log||[], opening_balances:data.opening_balances||{},
        purchase_orders:data.purchase_orders||[], staff_roles:data.staff_roles||[],
        manual_journals:data.manual_journals||[], bank_recon:data.bank_recon||[],
        accounts_chart:data.accounts_chart||[], godowns:data.godowns||['Main'],
        payroll:data.payroll||[], attendance:data.attendance||[],
        bank_accounts:data.bank_accounts||[], _profileId:profileId,
      });
    }
    return !!data;
  },

  async initCloud() {
    const ok = fbaseInit();
    if (!ok) { set(s=>({auth:{...s.auth,loading:false,offline:true}})); return; }

    let resolved = false;
    const timeout = setTimeout(() => {
      if (!resolved) set(s=>({auth:{...s.auth,loading:false,offline:true}}));
    }, 5000);

    fbaseOnAuth(async user => {
      resolved = true;
      clearTimeout(timeout);
      set(s=>({auth:{...s.auth,user,loading:false}}));
      if (user) {
        const remote = await fbasePull(user.id);
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

  signIn:     (e,p) => fbaseSignIn(e,p),
  signUp:     (e,p) => fbaseSignUp(e,p),
  googleIn:   ()    => fbaseGoogleIn(),
  signOut:    ()    => { fbaseSignOut(); set(s=>({auth:{...s.auth,user:null}})); },

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
