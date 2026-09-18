import React, { useState, useEffect, useCallback } from 'react';
import { useStore, blankItem, blankInv } from '../../store/index.js';
import { fmt, fmtDate, today, uid, r2, calcItem, buildTotals, getFY } from '../../engine/calc.js';
import { Btn, Card, Badge, Empty, Table, TR, TD, Alert, Tabs, Input, Select, Field, toast } from '../../components/ui/index.jsx';

/* ════════════════════════════════════════════════
   INVOICE LIST
════════════════════════════════════════════════ */
export function InvoiceList() {
  const { invoices, invFilter, fyFilter, firm, patch } = useStore();
  const [q, setQ] = useState('');

  const fy = fyFilter === 'all' ? null : fyFilter;
  const list = invoices
    .filter(i => !fy || i.fy === fy)
    .filter(i => invFilter === 'all' || i.status === invFilter || i.payment_method === invFilter ||
      (invFilter==='unpaid' && (i.status==='unpaid'||i.status==='partial')))
    .filter(i => !q || [i.invoice_no,i.customer_name,String(i.total)].some(v=>v?.toLowerCase().includes(q.toLowerCase())))
    .sort((a,b)=>(b.date||'').localeCompare(a.date||''));

  const totalAmt = r2(list.reduce((a,i)=>a+Number(i.total||0),0));
  const badgeV = s => s==='paid'?'green':s==='unpaid'?'red':s==='partial'?'yellow':'default';

  const FILTERS = ['all','cash','online','credit','paid','unpaid','partial','void'];

  return (
    <div>
      <div style={{display:'flex',flexWrap:'wrap',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:16}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:800}}>Invoices</h2>
          <div style={{fontSize:12,color:'var(--tx2)'}}>{list.length} invoices · {fmt(totalAmt)}</div>
        </div>
        <Btn v="pri" sz="sm" onClick={()=>patch({tab:'create',invForm:blankInv()})}>+ New Invoice</Btn>
      </div>

      {/* Search */}
      <div style={{position:'relative',marginBottom:10}}>
        <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',color:'var(--tx2)'}}>🔍</span>
        <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search customer, invoice#, amount…"
          className="input" style={{paddingLeft:34}} />
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:6,flexWrap:'wrap',marginBottom:16}}>
        {FILTERS.map(f=>(
          <button key={f} onClick={()=>patch({invFilter:f})}
            style={{padding:'4px 12px',fontSize:11,fontWeight:600,borderRadius:99,cursor:'pointer',
              background:invFilter===f?'var(--acc)':'transparent',
              border:`1.5px solid ${invFilter===f?'var(--acc)':'var(--bor)'}`,
              color:invFilter===f?'#fff':'var(--tx2)'}}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>

      {list.length===0
        ? <Empty icon="🧾" title="No invoices" sub="Create your first invoice"
            action={<Btn v="pri" sz="sm" onClick={()=>patch({tab:'create',invForm:blankInv()})}>+ New Invoice</Btn>} />
        : <Table headers={['Invoice No.','Customer','Date','Total','Status','']}>
            {list.map(inv=>(
              <TR key={inv.id} onClick={()=>patch({viewInv:inv,tab:'view'})}>
                <TD mono className="tdacc" style={{color:'var(--acc)',fontWeight:700}}>{inv.invoice_no}</TD>
                <TD>
                  <div style={{fontWeight:600}}>{inv.customer_name||'Walk-in'}</div>
                  {inv.customer_phone&&<div style={{fontSize:10,color:'var(--tx2)'}}>{inv.customer_phone}</div>}
                </TD>
                <TD style={{color:'var(--tx2)'}}>{fmtDate(inv.date)}</TD>
                <TD right style={{fontWeight:700}}>{fmt(inv.total)}</TD>
                <TD><Badge v={badgeV(inv.status)}>{inv.status}</Badge></TD>
                <TD>
                  <div style={{display:'flex',gap:4}}>
                    {inv.irn&&<Badge v="green">IRN</Badge>}
                    {inv.ewb_no&&<Badge v="blue">eWB</Badge>}
                  </div>
                </TD>
              </TR>
            ))}
          </Table>}
    </div>
  );
}

/* ════════════════════════════════════════════════
   INVOICE CREATE / EDIT
════════════════════════════════════════════════ */
export function InvoiceCreate() {
  const store = useStore();
  const { invForm, invQuickMode, firm, inventory, customers, patch } = store;
  const f = invForm || blankInv();
  const isReg = firm?.gst_registered;
  const withGST = isReg && f.inv_with_gst !== false;

  const upd = useCallback(p => patch({invForm:{...f,...p}}), [f]);
  const updItem = useCallback((id,k,v) => {
    const items = (f.items||[]).map(it=>it.id===id?{...it,[k]:v}:it);
    upd({items});
  },[f,upd]);

  const preview = buildTotals(f.items||[], withGST, f.is_igst, {
    inv_discount:f.inv_discount, inv_discount_type:f.inv_discount_type,
    extra_charges:f.extra_charges, tcs_rate:f.tcs_rate,
  });

  const { nextInvNo } = store;
  const previewNo = nextInvNo(f.date).no;

  const addItem = () => upd({items:[...(f.items||[]),blankItem()]});
  const remItem = id  => upd({items:(f.items||[]).filter(it=>it.id!==id)});

  const save = async (andNew=false) => {
    const res = await store.saveInvoice(andNew);
    if (res.error && res.error !== 'cancelled') toast(res.error,'error');
    else if (res.ok) toast(`Invoice ${res.inv.invoice_no} saved ✓`,'success');
  };

  // Keyboard shortcuts
  useEffect(()=>{
    const h = e => {
      if ((e.ctrlKey||e.metaKey) && e.key==='Enter') { e.preventDefault(); save(true); }
    };
    window.addEventListener('keydown',h);
    return ()=>window.removeEventListener('keydown',h);
  },[f]);

  // Recent items
  const recent = [...new Map(
    [...(store.invoices||[])].reverse()
      .flatMap(inv=>(inv.items||[]).map(it=>({name:it.name,rate:Number(it.rate||0),gst_rate:it.gst_rate||18})))
      .filter(it=>it.name?.trim())
      .map(it=>[it.name.toLowerCase(),it])
  ).values()].slice(0,8);

  return (
    <div style={{display:'grid',gridTemplateColumns:'1fr',gap:16}}>
      <div style={{display:'grid',gridTemplateColumns:'1fr',gap:16}}>

        {/* Quick mode bar */}
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8}}>
          <div className={`qm-toggle${invQuickMode?' on':''}`} onClick={store.toggleQuick}>
            <span className="qm-dot" />
            <span style={{fontSize:12}}>{invQuickMode?'⚡ Quick Bill — essentials only':'🔧 Full Form — all fields'}</span>
          </div>
          <div style={{display:'flex',gap:6,fontSize:10,color:'var(--tx2)'}}>
            <span>⌨ <kbd style={{background:'var(--surf2)',border:'1px solid var(--bor)',borderRadius:3,padding:'1px 4px',fontFamily:'monospace',fontSize:9}}>Ctrl+↵</kbd> Save &amp; New</span>
          </div>
        </div>

        {/* Customer + Date */}
        <Card>
          <div style={{fontSize:11,fontWeight:700,color:'var(--tx2)',textTransform:'uppercase',letterSpacing:.5,marginBottom:12}}>👤 Customer</div>
          <div className="g2" style={{marginBottom:10}}>
            <Field label="Customer Name" required>
              <input className="input" value={f.customer_name} list="cust-ac"
                onChange={e=>{
                  upd({customer_name:e.target.value});
                  const c=customers.find(x=>x.name.toLowerCase()===e.target.value.toLowerCase());
                  if(c) upd({customer_name:c.name,customer_phone:c.phone||'',customer_gstin:c.gstin||'',customer_id:c.id});
                }}
                placeholder="Type or select customer" />
              <datalist id="cust-ac">{customers.map(c=><option key={c.id} value={c.name}/>)}</datalist>
            </Field>
            <Field label="Phone">
              <input className="input" type="tel" value={f.customer_phone} onChange={e=>upd({customer_phone:e.target.value})} placeholder="Mobile number" />
            </Field>
          </div>

          {!invQuickMode && isReg && (
            <div className="g2" style={{marginBottom:10}}>
              <Field label="Buyer GSTIN">
                <input className="input" value={f.customer_gstin} onChange={e=>upd({customer_gstin:e.target.value.toUpperCase()})} placeholder="15-char GSTIN" maxLength={15} />
              </Field>
              <Field label="Ship To">
                <input className="input" value={f.ship_to||''} onChange={e=>upd({ship_to:e.target.value})} placeholder="Delivery address" />
              </Field>
            </div>
          )}

          <div className="g2">
            <Field label="Date">
              <input className="input" type="date" value={f.date} onChange={e=>upd({date:e.target.value})} />
            </Field>
            <Field label="Invoice No.">
              <input className="input" value={previewNo} readOnly style={{color:'var(--grn)',fontWeight:700}} />
            </Field>
          </div>
        </Card>

        {/* Payment type */}
        <Card>
          <div style={{fontSize:11,fontWeight:700,color:'var(--tx2)',textTransform:'uppercase',letterSpacing:.5,marginBottom:10}}>💳 Payment</div>
          <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
            {[['cash','💵 Cash'],['online','🌐 Online / UPI'],['credit','📒 Credit']].map(([v,l])=>(
              <button key={v} onClick={()=>upd({payment_method:v})}
                style={{padding:'8px 16px',fontSize:12,fontWeight:600,borderRadius:8,cursor:'pointer',
                  background:f.payment_method===v?'var(--acb)':'transparent',
                  border:`1.5px solid ${f.payment_method===v?'var(--acc)':'var(--bor)'}`,
                  color:f.payment_method===v?'var(--acc)':'var(--tx2)'}}>
                {l}
              </button>
            ))}
          </div>
        </Card>

        {/* Items */}
        <Card>
          <div style={{fontSize:11,fontWeight:700,color:'var(--tx2)',textTransform:'uppercase',letterSpacing:.5,marginBottom:10}}>📦 Items</div>

          {/* Recent chips */}
          {recent.length>0 && (
            <div className="chip-bar">
              <span style={{fontSize:10,color:'var(--tx2)',alignSelf:'center',flexShrink:0}}>Recent:</span>
              {recent.map((it,i)=>(
                <div key={i} className="chip" onClick={()=>{
                  const item={...blankItem(),name:it.name,rate:it.rate,gst_rate:it.gst_rate};
                  const items=f.items||[];
                  upd({items:items.length===1&&!items[0].name?[item]:[...items,item]});
                }}>
                  {it.name.slice(0,16)} <span className="chip-price">₹{it.rate}</span>
                </div>
              ))}
            </div>
          )}

          {/* Quick-add bar */}
          <div className="qa-wrap" style={{marginBottom:12}}>
            <div className="qa-row">
              <span style={{fontSize:18}}>⚡</span>
              <input className="qa-input" placeholder='Item name qty rate — e.g. "Rice 2 45" or just "Biscuit"'
                onKeyDown={e=>{
                  if(e.key!=='Enter') return;
                  e.preventDefault();
                  const raw=e.target.value.trim(); if(!raw) return;
                  const parts=raw.split(/\s+/);
                  let name,qty=1,rate=0;
                  if(parts.length>=3){
                    const mr=parseFloat(parts[parts.length-1]),mq=parseFloat(parts[parts.length-2]);
                    if(!isNaN(mr)&&!isNaN(mq)){rate=mr;qty=mq;name=parts.slice(0,-2).join(' ');}
                    else if(!isNaN(mr)){rate=mr;name=parts.slice(0,-1).join(' ');}
                    else name=raw;
                  } else if(parts.length===2){const mn=parseFloat(parts[1]);if(!isNaN(mn)){rate=mn;name=parts[0];}else name=raw;}
                  else name=raw;
                  const inv=inventory.find(i=>i.name.toLowerCase()===name.toLowerCase());
                  const item={...blankItem(),name:inv?.name||name,rate:inv?.rate||rate||0,qty,gst_rate:inv?.gst_rate||18};
                  const items=f.items||[];
                  upd({items:items.length===1&&!items[0].name?[item]:[...items,item]});
                  e.target.value='';
                  toast(`${item.name} added`,'success',1000);
                }} />
              <span style={{fontSize:10,color:'var(--tx2)',whiteSpace:'nowrap'}}>↵ add</span>
            </div>
          </div>

          {/* Items table */}
          <div style={{overflowX:'auto',border:'1.5px solid var(--bor)',borderRadius:10,marginBottom:10}}>
            <table className="it">
              <thead><tr>
                <th style={{minWidth:150}}>Item</th>
                <th style={{width:60,textAlign:'center'}}>Qty</th>
                <th style={{width:90,textAlign:'right'}}>Rate ₹</th>
                {!invQuickMode && <th style={{width:60,textAlign:'center'}}>Disc%</th>}
                {isReg && <th style={{width:60,textAlign:'center'}}>GST%</th>}
                {isReg && !invQuickMode && <th style={{width:80,textAlign:'right'}}>Taxable</th>}
                <th style={{width:90,textAlign:'right'}}>Total</th>
                <th style={{width:28}}></th>
              </tr></thead>
              <tbody>
                {(f.items||[]).map(it=>{
                  const c=calcItem(it,withGST,f.is_igst);
                  return (
                    <tr key={it.id}>
                      <td>
                        <input value={it.name} list={`ac-${it.id}`} placeholder="Item name"
                          onChange={e=>{
                            const v=e.target.value;
                            const inv=inventory.find(i=>i.name.toLowerCase()===v.toLowerCase());
                            if(inv) {const items=(f.items||[]).map(x=>x.id===it.id?{...x,name:inv.name,rate:inv.rate,gst_rate:inv.gst_rate,hsn:inv.hsn||''}:x);upd({items});}
                            else updItem(it.id,'name',v);
                          }}
                          style={{border:'none',outline:'none',background:'transparent',width:'100%',fontFamily:'inherit'}} />
                        <datalist id={`ac-${it.id}`}>{inventory.map(i=><option key={i.id} value={i.name}/>)}</datalist>
                      </td>
                      <td><input type="number" value={it.qty} min="0" step="0.001"
                        onChange={e=>updItem(it.id,'qty',e.target.value)}
                        style={{width:52,textAlign:'center',border:'none',outline:'none',background:'transparent',fontFamily:'inherit'}} /></td>
                      <td><input type="number" value={it.rate} min="0" step="0.01"
                        onChange={e=>updItem(it.id,'rate',e.target.value)}
                        style={{width:82,textAlign:'right',border:'none',outline:'none',background:'transparent',fontFamily:'inherit'}} /></td>
                      {!invQuickMode && <td><input type="number" value={it.discount||0} min="0" max="100"
                        onChange={e=>updItem(it.id,'discount',e.target.value)}
                        style={{width:52,textAlign:'center',border:'none',outline:'none',background:'transparent',fontFamily:'inherit'}} /></td>}
                      {isReg && <td><select value={it.gst_rate} onChange={e=>updItem(it.id,'gst_rate',Number(e.target.value))}
                        style={{border:'none',outline:'none',background:'transparent',fontFamily:'inherit',fontSize:11}}>
                        {[0,5,12,18,28].map(r=><option key={r} value={r}>{r}%</option>)}
                      </select></td>}
                      {isReg && !invQuickMode && <td style={{textAlign:'right',fontSize:11,color:'var(--tx2)'}}>{fmt(c.taxable)}</td>}
                      <td style={{textAlign:'right',fontWeight:700}}>{fmt(c.total)}</td>
                      <td><button onClick={()=>remItem(it.id)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--red)',fontSize:13}}>✕</button></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <Btn v="ghost" sz="sm" onClick={addItem}>+ Add Item</Btn>
        </Card>

        {/* Notes (full mode only) */}
        {!invQuickMode && (
          <Card>
            <Field label="Notes / Remarks">
              <textarea className="input" rows={2} value={f.notes||''} onChange={e=>upd({notes:e.target.value})} placeholder="Terms, bank details, thank-you note…" style={{resize:'vertical'}} />
            </Field>
          </Card>
        )}
      </div>

      {/* Totals panel */}
      <Card style={{position:'sticky',top:72,alignSelf:'start'}}>
        <div style={{fontSize:11,fontWeight:700,color:'var(--tx2)',textTransform:'uppercase',letterSpacing:.5,marginBottom:12}}>Summary</div>
        <div style={{display:'flex',flexDirection:'column',gap:6,fontSize:13,marginBottom:16}}>
          {isReg ? (
            <>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span style={{color:'var(--tx2)'}}>Taxable</span><span>{fmt(preview.totalTaxable)}</span>
              </div>
              {Object.entries(preview.gstSummary||{}).map(([pct,g])=>(
                <div key={pct} style={{display:'flex',justifyContent:'space-between',fontSize:11}}>
                  <span style={{color:'var(--tx2)'}}>GST {pct}%</span>
                  <span style={{color:'var(--red)'}}>{fmt(g.cgst+g.sgst+g.igst)}</span>
                </div>
              ))}
              {preview.extraCharges>0 && <div style={{display:'flex',justifyContent:'space-between'}}>
                <span style={{color:'var(--tx2)'}}>Extra</span><span>{fmt(preview.extraCharges)}</span>
              </div>}
            </>
          ) : (
            <div style={{display:'flex',justifyContent:'space-between'}}>
              <span style={{color:'var(--tx2)'}}>Subtotal</span>
              <span>{fmt((f.items||[]).reduce((a,it)=>a+r2(Number(it.qty||0)*Number(it.rate||0)),0))}</span>
            </div>
          )}
          <div style={{display:'flex',justifyContent:'space-between',fontWeight:800,fontSize:18,borderTop:'2px solid var(--bor)',paddingTop:10,marginTop:4}}>
            <span>Total</span>
            <span style={{color:'var(--acc)'}}>{fmt(preview.grandTotal)}</span>
          </div>
        </div>
        <div style={{display:'flex',flexDirection:'column',gap:8}}>
          <Btn v="pri" sz="lg" onClick={()=>save(false)} className="w-full" style={{justifyContent:'center',width:'100%'}}>
            💾 Save Invoice
          </Btn>
          <div style={{display:'flex',gap:8}}>
            <Btn v="ghost" sz="sm" onClick={()=>save(true)} style={{flex:1,justifyContent:'center'}}>+ Save &amp; New</Btn>
            <Btn v="ghost" sz="sm" onClick={()=>patch({invForm:blankInv()})} style={{flex:1,justifyContent:'center'}}>🗑 Clear</Btn>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ════════════════════════════════════════════════
   INVOICE MODE SHELL
════════════════════════════════════════════════ */
export default function InvoiceMode() {
  const { tab } = useStore();
  return tab==='create' ? <InvoiceCreate /> : <InvoiceList />;
}
