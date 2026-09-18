export const FIREBASE_CFG = {
  apiKey:            'AIzaSyDmNBxdMkatPJ2edfT_vZLrH-kEV_7goAE',
  authDomain:        'retailflow-b5602.firebaseapp.com',
  projectId:         'retailflow-b5602',
  storageBucket:     'retailflow-b5602.firebasestorage.app',
  messagingSenderId: '973475727689',
  appId:             '1:973475727689:web:9f671e8073b944d2e73298',
};

export const STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan',
  'Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
  'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu',
  'Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry',
];

export const UNITS = [
  'pcs','kg','g','litre','ml','box','bag','dozen','pair','set',
  'roll','sheet','metre','ton','quintal','number','bottle','can',
  'carton','pack','strip','tablet','capsule',
];

export const GST_RATES = [0, 0.1, 0.25, 1, 1.5, 3, 5, 6, 7.5, 12, 18, 28];

export const BUSINESS_NATURES = [
  { value:'retail',     label:'🛒 Retail / Kirana' },
  { value:'wholesale',  label:'📦 Wholesale / Distributor' },
  { value:'service',    label:'🛠 Service Provider' },
  { value:'contractor', label:'🏗 Contractor / Builder' },
  { value:'firm',       label:'🏢 Firm / Professional' },
];

export const ROLE_DEFS = {
  admin:   { label:'Admin',   emoji:'👑' },
  billing: { label:'Billing', emoji:'🧾' },
  viewer:  { label:'Viewer',  emoji:'👁'  },
};

export const DEFAULT_LEDGERS = {
  'Cash in Hand':       { group:'Current Assets',       type:'asset',    bs:'application', dr:true },
  'Bank Account':       { group:'Current Assets',       type:'asset',    bs:'application', dr:true },
  'Sundry Debtors':     { group:'Current Assets',       type:'asset',    bs:'application', dr:true },
  'Closing Stock':      { group:'Current Assets',       type:'asset',    bs:'application', dr:true },
  'Fixed Assets':       { group:'Fixed Assets',         type:'asset',    bs:'application', dr:true },
  'CGST Input':         { group:'Current Assets',       type:'asset',    bs:'application', dr:true },
  'SGST Input':         { group:'Current Assets',       type:'asset',    bs:'application', dr:true },
  'Sundry Creditors':   { group:'Current Liabilities',  type:'liability',bs:'sources',     dr:false },
  'CGST Payable':       { group:'Current Liabilities',  type:'liability',bs:'sources',     dr:false },
  'SGST Payable':       { group:'Current Liabilities',  type:'liability',bs:'sources',     dr:false },
  'IGST Payable':       { group:'Current Liabilities',  type:'liability',bs:'sources',     dr:false },
  'Loans Payable':      { group:'Long-term Liabilities', type:'liability',bs:'sources',    dr:false },
  'Capital Account':    { group:'Capital',              type:'equity',   bs:'sources',     dr:false },
  'Opening Equity':     { group:'Capital',              type:'equity',   bs:'sources',     dr:false },
  'Sales Account':      { group:'Direct Income',        type:'income',   bs:null,          dr:false },
  'Sales Returns':      { group:'Direct Expenses',      type:'expense',  bs:null,          dr:true  },
  'Purchases':          { group:'Direct Expenses',      type:'expense',  bs:null,          dr:true  },
  'Rent':               { group:'Indirect Expenses',    type:'expense',  bs:null,          dr:true  },
  'Electricity':        { group:'Indirect Expenses',    type:'expense',  bs:null,          dr:true  },
  'Staff Salary':       { group:'Indirect Expenses',    type:'expense',  bs:null,          dr:true  },
  'Transport':          { group:'Indirect Expenses',    type:'expense',  bs:null,          dr:true  },
  'Miscellaneous':      { group:'Indirect Expenses',    type:'expense',  bs:null,          dr:true  },
};

export const EXP_LEDGER_MAP = {
  Rent:'Rent', Electricity:'Electricity', 'Staff Salary':'Staff Salary',
  Transport:'Transport', Packaging:'Miscellaneous', Maintenance:'Miscellaneous',
  Marketing:'Miscellaneous', Miscellaneous:'Miscellaneous',
};

export const DRAFT_KEY   = 'rf_inv_draft';
export const DARK_KEY    = 'rf_dark';
export const THEME_KEY   = 'rf_theme';
export const QUICK_KEY   = 'rf_quickmode';
export const SYNC_TS_KEY = 'rf_sync_ts';
