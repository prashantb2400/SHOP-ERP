export const r2  = n => Math.round((Number(n)||0)*100)/100;
export const fmt = n => '₹'+Number(n||0).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2});
export const esc = s => String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
export const today = () => new Date().toISOString().split('T')[0];
export const uid  = () => Math.random().toString(36).slice(2,9);

export const fmtDate = d => {
  if(!d) return '—';
  try { return new Date(d+'T00:00:00').toLocaleDateString('en-IN',{day:'2-digit',month:'short',year:'numeric'}); }
  catch { return d; }
};

export const getFY = d => {
  if(!d) return '';
  const dt = new Date(d+'T00:00:00');
  const y=dt.getFullYear(), m=dt.getMonth();
  return m>=3 ? `${y}-${y+1}` : `${y-1}-${y}`;
};

export const fyLabel = fy => {
  if(!fy) return '';
  const [a,b] = fy.split('-');
  return `FY ${a}-${String(b).slice(-2)}`;
};

export const validateGSTIN = g =>
  /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[Z][A-Z\d]$/.test((g||'').toUpperCase());

export function calcItem(item, withGST=true, isIGST=false) {
  const qty=Number(item.qty||0), rate=Number(item.rate||0);
  const disc=Math.min(100,Math.max(0,Number(item.discount||0)));
  const gst=Number(item.gst_rate||0), pmode=item.price_mode||'excl';
  const base=r2(qty*rate*(1-disc/100));
  if(!withGST||gst===0) return {taxable:base,gstAmt:0,cgst:0,sgst:0,igst:0,total:base};
  let taxable,gstAmt,total;
  if(pmode==='incl'){taxable=r2(base/(1+gst/100));gstAmt=r2(base-taxable);total=base;}
  else{taxable=base;gstAmt=r2(base*gst/100);total=r2(taxable+gstAmt);}
  const half=r2(gstAmt/2);
  return {taxable,gstAmt,cgst:isIGST?0:half,sgst:isIGST?0:half,igst:isIGST?gstAmt:0,total};
}

export function buildTotals(items=[], withGST=true, isIGST=false, opts={}) {
  const {inv_discount=0,inv_discount_type='pct',extra_charges=0,tcs_rate=0}=opts;
  let totalTaxable=0, totalGST=0;
  const gstSummary={};
  items.forEach(it=>{
    const c=calcItem(it,withGST,isIGST);
    totalTaxable=r2(totalTaxable+c.taxable);
    totalGST=r2(totalGST+c.gstAmt);
    const pct=Number(it.gst_rate||0);
    if(pct>0&&withGST){
      if(!gstSummary[pct]) gstSummary[pct]={taxable:0,cgst:0,sgst:0,igst:0};
      gstSummary[pct].taxable=r2(gstSummary[pct].taxable+c.taxable);
      gstSummary[pct].cgst=r2(gstSummary[pct].cgst+c.cgst);
      gstSummary[pct].sgst=r2(gstSummary[pct].sgst+c.sgst);
      gstSummary[pct].igst=r2(gstSummary[pct].igst+c.igst);
    }
  });
  if(Number(inv_discount)>0){
    const sub=totalTaxable+totalGST||1;
    const d=inv_discount_type==='amt'?Math.min(Number(inv_discount),sub):r2(sub*Number(inv_discount)/100);
    totalTaxable=r2(totalTaxable-r2(d*totalTaxable/sub));
    totalGST=r2(totalGST-r2(d*totalGST/sub));
  }
  const extraCharges=r2(Number(extra_charges||0));
  const tcsAmt=r2((totalTaxable+totalGST+extraCharges)*Number(tcs_rate||0)/100);
  const grandTotal=r2(totalTaxable+totalGST+extraCharges+tcsAmt);
  return {totalTaxable,totalGST,gstSummary,extraCharges,tcsAmt,grandTotal};
}
