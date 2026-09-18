import { r2, getFY, today, buildTotals } from './calc.js';
import { DEFAULT_LEDGERS, EXP_LEDGER_MAP } from '../lib/constants.js';

export function buildJournals(state) {
  const {invoices=[],purchases=[],expenses=[],payments=[],credit_notes=[],
    customers=[],opening_balances,manual_journals=[],firm} = state;
  const ob = opening_balances || {};
  const isReg = firm?.gst_registered;
  const fyStart = (getFY(today())||'').split('-')[0]+'-04-01';
  const J = [];

  // Opening balances
  const obE=[];
  if(ob.cash_in_hand>0)    obE.push({ledger:'Cash in Hand',  dr:ob.cash_in_hand,   cr:0});
  if(ob.bank_balance>0)    obE.push({ledger:'Bank Account',  dr:ob.bank_balance,   cr:0});
  if(ob.inventory_value>0) obE.push({ledger:'Closing Stock', dr:ob.inventory_value,cr:0});
  if(ob.fixed_assets>0)    obE.push({ledger:'Fixed Assets',  dr:ob.fixed_assets,   cr:0});
  if(obE.length){
    const a=r2((ob.cash_in_hand||0)+(ob.bank_balance||0)+(ob.inventory_value||0)+(ob.fixed_assets||0));
    const cap=r2(a-(ob.loans_payable||0));
    if(ob.loans_payable>0) obE.push({ledger:'Loans Payable',dr:0,cr:ob.loans_payable});
    obE.push({ledger:'Capital Account',dr:cap<0?-cap:0,cr:cap>0?cap:0});
    J.push({id:'OB',date:fyStart,ref:'OB',narration:'Opening Balances',entries:obE});
  }
  customers.forEach(c=>{
    const x=Number(c.opening_outstanding||0);
    if(x>0) J.push({id:'OB-'+c.id,date:fyStart,ref:'OB',narration:`Opening — ${c.name}`,
      entries:[{ledger:'Sundry Debtors',dr:x,cr:0},{ledger:'Opening Equity',dr:0,cr:x}]});
  });

  // Invoices
  invoices.forEach(inv=>{
    if(inv.status==='void') return;
    const t=buildTotals(inv.items||[],isReg,inv.is_igst,
      {inv_discount:inv.inv_discount,inv_discount_type:inv.inv_discount_type,
       extra_charges:inv.extra_charges,tcs_rate:inv.tcs_rate});
    const credit=inv.payment_method==='credit'||inv.status==='unpaid'||inv.status==='partial';
    const dL=credit?'Sundry Debtors':inv.payment_method==='online'?'Bank Account':'Cash in Hand';
    const es=[{ledger:dL,dr:r2(inv.total||t.grandTotal),cr:0}];
    if(isReg&&t.totalTaxable>0){
      es.push({ledger:'Sales Account',dr:0,cr:r2(t.totalTaxable)});
      if(inv.is_igst){if(t.totalGST>0)es.push({ledger:'IGST Payable',dr:0,cr:r2(t.totalGST)});}
      else{
        if(t.totalGST>0)es.push({ledger:'CGST Payable',dr:0,cr:r2(t.totalGST/2)});
        if(t.totalGST>0)es.push({ledger:'SGST Payable',dr:0,cr:r2(t.totalGST/2)});
      }
    } else es.push({ledger:'Sales Account',dr:0,cr:r2(inv.total||t.grandTotal)});
    J.push({id:'INV-'+inv.id,date:inv.date,ref:inv.invoice_no,narration:`Sales — ${inv.customer_name||'Walk-in'}`,entries:es});
  });

  // Payments
  payments.forEach(p=>{
    const cash=p.method==='online'||p.method==='upi'?'Bank Account':'Cash in Hand';
    J.push({id:'PMT-'+p.id,date:p.date,ref:'PMT',narration:`Payment — ${p.customer_name||''}`,
      entries:[{ledger:cash,dr:Number(p.amount),cr:0},{ledger:'Sundry Debtors',dr:0,cr:Number(p.amount)}]});
  });

  // Credit/Debit notes
  credit_notes.forEach(cn=>{
    const isD=cn.type==='debit';
    const es=isD
      ?[{ledger:'Sundry Debtors',dr:r2(cn.total),cr:0},{ledger:'Sales Account',dr:0,cr:r2(cn.total)}]
      :[{ledger:'Sales Returns',dr:r2(cn.total),cr:0},{ledger:'Sundry Debtors',dr:0,cr:r2(cn.total)}];
    if(isReg&&!isD&&cn.gst_amount>0){
      es.push({ledger:'CGST Payable',dr:r2(cn.gst_amount/2),cr:0});
      es.push({ledger:'SGST Payable',dr:r2(cn.gst_amount/2),cr:0});
    }
    J.push({id:(isD?'DN-':'CN-')+cn.id,date:cn.date,ref:cn.cn_no||(isD?'DN':'CN'),
      narration:`${isD?'Debit':'Credit'} Note — ${cn.customer_name||''}`,entries:es});
  });

  // Purchases
  purchases.forEach(p=>{
    const amt=Number(p.amount||0),gp=Number(p.gst_rate||0);
    const taxable=r2(amt/(1+gp/100)),gstAmt=r2(amt-taxable);
    const crL=(p.status==='pending'||p.status==='credit')?'Sundry Creditors':'Cash in Hand';
    const es=[{ledger:crL,dr:0,cr:amt}];
    if(isReg&&gp>0&&gstAmt>0){
      es.push({ledger:'Purchases',dr:taxable,cr:0});
      es.push({ledger:'CGST Input',dr:r2(gstAmt/2),cr:0});
      es.push({ledger:'SGST Input',dr:r2(gstAmt/2),cr:0});
    } else es.push({ledger:'Purchases',dr:amt,cr:0});
    J.push({id:'PUR-'+p.id,date:p.date,ref:'PUR',narration:`Purchase — ${p.supplier||''}`,entries:es});
  });

  // Expenses
  expenses.forEach(e=>{
    const ledger=EXP_LEDGER_MAP[e.category]||e.category||'Miscellaneous';
    J.push({id:'EXP-'+e.id,date:e.date,ref:'EXP',
      narration:`${e.category}${e.description?' — '+e.description:''}`,
      entries:[{ledger,dr:Number(e.amount),cr:0},{ledger:'Cash in Hand',dr:0,cr:Number(e.amount)}]});
  });

  // Manual journals
  (manual_journals||[]).forEach(mj=>{
    J.push({id:'MJ-'+mj.id,date:mj.date,ref:mj.ref||'JV',narration:mj.narration,entries:mj.entries||[]});
  });

  return J.sort((a,b)=>(a.date||'').localeCompare(b.date||''));
}

export function buildTrialBalance(journals, inventory=[], userChart={}) {
  const chart={...DEFAULT_LEDGERS,...userChart};
  const tb={};
  journals.forEach(j=>(j.entries||[]).forEach(e=>{
    if(!tb[e.ledger])tb[e.ledger]={dr:0,cr:0};
    tb[e.ledger].dr=r2(tb[e.ledger].dr+(e.dr||0));
    tb[e.ledger].cr=r2(tb[e.ledger].cr+(e.cr||0));
  }));
  const stockVal=r2(inventory.reduce((a,i)=>a+Number(i.rate||0)*Number(i.stock||0),0));
  if(!tb['Closing Stock'])tb['Closing Stock']={dr:0,cr:0};
  tb['Closing Stock'].closing=stockVal;
  Object.keys(tb).forEach(k=>{
    const l=chart[k]||{group:'Miscellaneous',type:'expense',bs:null,dr:true};
    if(k!=='Closing Stock')tb[k].closing=r2(tb[k].dr-tb[k].cr);
    tb[k].group=l.group;tb[k].type=l.type;tb[k].bs=l.bs;tb[k].drNormal=l.dr;
  });
  return tb;
}
