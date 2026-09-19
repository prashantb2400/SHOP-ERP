import React, { useRef } from 'react';
import { useStore } from '../../store/index.js';
import { fmt, fmtDate, uid, today, r2 } from '../../engine/calc.js';
import {
  Card,
  BezelCard,
  Btn,
  Badge,
  Table,
  TR,
  TD,
  Empty,
  Alert,
  Field,
  Modal,
  toast
} from '../../components/ui/index.jsx';
import {
  Boxes,
  Warehouse,
  UploadCloud,
  Plus,
  Edit3,
  Trash2,
  AlertTriangle,
  QrCode,
  Layers
} from 'lucide-react';
import { UNITS } from '../../lib/constants.js';

export default function InventoryMode() {
  const { inventory, gdwFilter, invTab, patch } = useStore();
  const lowStock = inventory.filter(i => Number(i.stock) <= Number(i.low_stock_alert ?? 5));
  const filtered = gdwFilter ? inventory.filter(i => (i.godown || 'Main') === gdwFilter) : inventory;

  return (
    <div>
      {/* Editorial Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Inventory &amp; Stock Master</h1>
          <div className="page-header-sub">
            Multi-godown inventory tracking, batch expiry management, and reorder intelligence
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="hero-pill">
            <Boxes size={13} style={{ color: 'var(--acc)' }} />
            {inventory.length} Stock SKUs
          </span>
          {lowStock.length > 0 && (
            <span className="hero-pill" style={{ color: 'var(--red)', borderColor: 'rgba(220, 38, 38, 0.3)', background: 'var(--rdb)' }}>
              <AlertTriangle size={13} />
              {lowStock.length} Low Stock Alert
            </span>
          )}
          <Btn v="ghost" sz="sm" icon={<Warehouse size={13} />} onClick={() => patch({ invTab: 'godowns' })}>Godowns</Btn>
          <Btn v="ghost" sz="sm" icon={<UploadCloud size={13} />} onClick={() => patch({ invTab: 'import', importPreview: null })}>Import CSV</Btn>
          {gdwFilter && <Btn v="acc" sz="sm" onClick={() => patch({ gdwFilter: '' })}>Clear Godown Filter</Btn>}
        </div>
      </div>

      {lowStock.length > 0 && (
        <Alert v="warn" style={{ marginBottom: 16 }}>
          Low Stock Warning: {lowStock.map(i => <b key={i.id} style={{ marginRight: 8 }}>{i.name} ({i.stock} {i.unit})</b>)}
        </Alert>
      )}

      {invTab === 'godowns' ? <GodownView /> :
       invTab === 'import'  ? <ImportView /> : (
        <>
          <ItemForm />
          <BatchModal />
          {filtered.length === 0
            ? <Card><Empty title={gdwFilter ? `No items in ${gdwFilter}` : 'No inventory registered'} sub="Add items above to enable fast invoice dispatch" /></Card>
            : <ItemTable items={filtered} />}
        </>
      )}
    </div>
  );
}

function ItemForm() {
  const { invItemForm, inv_categories, firm, save, patch, auditLog } = useStore();
  const isReg = firm?.gst_registered;
  const f = invItemForm || { id: '', name: '', unit: 'pcs', rate: 0, mrp: 0, price_mode: 'excl', item_type: 'product', category: '', gst_rate: 18, hsn: '', stock: 0, discount: 0, barcode: '', low_stock_alert: 5, godown: 'Main', batches: [] };
  const upd = p => patch({ invItemForm: { ...f, ...p } });

  const saveItem = async () => {
    if (!f.name?.trim()) { toast('Item name required', 'error'); return; }
    const item = { ...f, name: f.name.trim(), id: f.id || uid() };
    patch(s => {
      const idx = s.inventory.findIndex(i => i.id === item.id || (i.name.toLowerCase() === item.name.toLowerCase()));
      const inventory = idx >= 0 ? s.inventory.map((x, i) => i === idx ? { ...x, ...item } : x) : [item, ...s.inventory];
      return { inventory, invItemForm: null };
    });
    auditLog('create', 'inventory', item.id, { name: item.name });
    await save();
    toast('Item saved: ' + item.name, 'success');
  };

  return (
    <BezelCard style={{ marginBottom: 18 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
        Item SKU Registry &amp; Pricing
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {['product', 'service'].map(t => (
          <button
            key={t}
            type="button"
            onClick={() => upd({ item_type: t })}
            style={{
              flex: 1,
              padding: '8px',
              fontSize: 12,
              fontWeight: 600,
              borderRadius: 'var(--r-sm)',
              cursor: 'pointer',
              background: f.item_type === t ? 'var(--acb)' : 'var(--surf2)',
              border: `1.5px solid ${f.item_type === t ? 'var(--acc)' : 'var(--bor)'}`,
              color: f.item_type === t ? 'var(--acc)' : 'var(--tx2)',
              transition: 'transform 120ms var(--ease-out), background-color 160ms ease'
            }}
          >
            {t === 'product' ? 'Tangible Product' : 'Service / Consulting'}
          </button>
        ))}
      </div>
      <div className="g3" style={{ marginBottom: 10 }}>
        <Field label="Item Name" required>
          <input className="input" value={f.name} onChange={e => upd({ name: e.target.value })} placeholder="e.g. Tata Salt 1kg" />
        </Field>
        <Field label="Unit">
          <select className="select" value={f.unit} onChange={e => upd({ unit: e.target.value })}>
            {UNITS.map(u => <option key={u}>{u}</option>)}
          </select>
        </Field>
        <Field label="Category">
          <select className="select" value={f.category} onChange={e => upd({ category: e.target.value })}>
            <option value="">— None —</option>
            {inv_categories.map(c => <option key={c}>{c}</option>)}
          </select>
        </Field>
      </div>
      <div className="g3" style={{ marginBottom: 10 }}>
        <Field label="Selling Rate ₹"><input className="input" type="number" value={f.rate} onChange={e => upd({ rate: e.target.value })} min="0" step="0.01" /></Field>
        <Field label="MRP ₹"><input className="input" type="number" value={f.mrp || 0} onChange={e => upd({ mrp: e.target.value })} min="0" /></Field>
        {f.item_type !== 'service' && <Field label="Stock Qty"><input className="input" type="number" value={f.stock} onChange={e => upd({ stock: e.target.value })} min="0" /></Field>}
      </div>
      {isReg && (
        <div className="g3" style={{ marginBottom: 10 }}>
          <Field label="GST Rate">
            <select className="select" value={f.gst_rate} onChange={e => upd({ gst_rate: Number(e.target.value) })}>
              {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
            </select>
          </Field>
          <Field label="HSN / SAC"><input className="input" value={f.hsn || ''} onChange={e => upd({ hsn: e.target.value })} placeholder="e.g. 1701" /></Field>
          <Field label="Low Stock Alert"><input className="input" type="number" value={f.low_stock_alert ?? 5} onChange={e => upd({ low_stock_alert: Number(e.target.value) })} min="0" /></Field>
        </div>
      )}
      <div className="g2" style={{ marginBottom: 14 }}>
        <Field label="Barcode / SKU">
          <div style={{ display: 'flex', gap: 6 }}>
            <input className="input" value={f.barcode || ''} onChange={e => upd({ barcode: e.target.value })} placeholder="Auto-gen or scan barcode" style={{ flex: 1 }} />
            <Btn v="acc" sz="sm" icon={<QrCode size={13} />} onClick={() => upd({ barcode: String(Math.floor(Math.random() * 90000000 + 10000000)) })}>Gen</Btn>
          </div>
        </Field>
        <Field label="Godown Location">
          <select className="select" value={f.godown || 'Main'} onChange={e => upd({ godown: e.target.value })}>
            {(useStore.getState().godowns || ['Main']).map(g => <option key={g}>{g}</option>)}
          </select>
        </Field>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <Btn v="pri" icon={<Plus size={14} />} onClick={saveItem}>Save Item SKU</Btn>
        {f.name && <Btn v="ghost" sz="sm" onClick={() => patch({ invItemForm: null })}>Cancel</Btn>}
      </div>
    </BezelCard>
  );
}


function ItemTable({ items }) {
  const { patch, save, firm } = useStore();
  const isReg = firm?.gst_registered;
  return (
    <Card flat style={{ padding: 0, overflow: 'hidden' }}>
      <Table headers={['Item SKU & Category', 'Selling Rate', 'Available Stock', 'Barcode', 'Actions']} fintech>
        {items.map(item => {
          const isLow = Number(item.stock) <= Number(item.low_stock_alert ?? 5);
          return (
            <TR key={item.id} className={isLow ? 'stock-low' : ''}>
              <TD>
                <div style={{ fontWeight: 700, fontSize: 13.5 }}>{item.name}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                  {item.category && <Badge v="default">{item.category}</Badge>}
                  {item.godown && item.godown !== 'Main' && <Badge v="acc">{item.godown}</Badge>}
                  {item.batches?.length > 0 && <Badge v="blu">{item.batches.length} batches</Badge>}
                  {isReg && item.hsn && <span style={{ fontSize: 11, color: 'var(--tx3)', fontFamily: 'var(--ffm)' }}>HSN: {item.hsn}</span>}
                </div>
              </TD>
              <TD right mono>
                <div style={{ fontWeight: 700 }}>{fmt(item.rate)}</div>
                {isReg && <div style={{ fontSize: 10.5, color: 'var(--tx3)' }}>GST {item.gst_rate}%</div>}
              </TD>
              <TD>
                <div className="num-mono" style={{ fontWeight: 700, color: isLow ? 'var(--red)' : 'var(--tx)' }}>
                  {item.stock} {item.unit}
                </div>
                {isLow && <Badge v="red" dot pulse style={{ marginTop: 2, fontSize: 10 }}>Low Stock</Badge>}
              </TD>
              <TD mono style={{ fontSize: 11.5, color: 'var(--tx2)' }}>{item.barcode || '—'}</TD>
              <TD right>
                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                  <Btn v="ghost" sz="sm" icon={<Edit3 size={13} />} onClick={() => patch({ invItemForm: { ...item } })}>
                    Edit
                  </Btn>
                  {item.item_type !== 'service' && (
                    <Btn
                      v="ghost"
                      sz="sm"
                      icon={<Layers size={13} />}
                      onClick={() => patch({ batchItemId: item.id, batchForm: { batch_no: '', mfg_date: '', exp_date: '', qty: 0, purchase_rate: 0 } })}
                      title="Batches"
                    >
                      Batches{item.batches?.length > 0 ? ` (${item.batches.length})` : ''}
                    </Btn>
                  )}
                  <Btn
                    v="red"
                    sz="sm"
                    icon={<Trash2 size={13} />}
                    onClick={async () => {
                      if (!confirm('Delete ' + item.name + '?')) return;
                      const iid = item.id;
                      patch(s => ({ inventory: s.inventory.filter(i => i.id !== iid) }));
                      await save();
                      toast('Deleted ' + item.name, 'info');
                    }}
                  />
                </div>
              </TD>
            </TR>
          );
        })}
      </Table>
    </Card>
  );
}


function BatchModal() {
  const { batchItemId, batchForm, inventory, patch, save } = useStore();
  const item = batchItemId ? inventory.find(i=>i.id===batchItemId) : null;
  if(!item||!batchForm) return null;
  const bf = batchForm;
  const todayStr = today();

  const saveBatch = async () => {
    if(!bf.batch_no?.trim()){toast('Batch number required','error');return;}
    if(!bf.exp_date){toast('Expiry date required','error');return;}
    if(Number(bf.qty)<=0){toast('Qty must be > 0','error');return;}
    const batch={id:uid(),...bf,qty:Number(bf.qty),purchase_rate:Number(bf.purchase_rate||0),added_at:todayStr};
    patch(s=>({inventory:s.inventory.map(i=>{
      if(i.id!==batchItemId) return i;
      const batches=[...(i.batches||[]),batch];
      return {...i,batches,stock:r2(batches.reduce((a,b)=>a+Number(b.qty||0),0))};
    }),batchForm:{batch_no:'',mfg_date:'',exp_date:'',qty:0,purchase_rate:0}}));
    await save();
    toast('Batch saved ✓','success');
  };

  return (
    <Modal onClose={()=>patch({batchItemId:null,batchForm:null})} maxWidth="560px">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:16}}>
        <div>
          <div style={{fontWeight:800,fontSize:16}}>Batch Stock Manager</div>
          <div style={{fontSize:12,color:'var(--tx2)'}}>{item.name} · {item.stock} {item.unit}</div>
        </div>
        <Btn v="ghost" sz="sm" onClick={()=>patch({batchItemId:null,batchForm:null})}>✕</Btn>
      </div>
      {item.batches?.length>0&&(
        <Table headers={['Batch No.','Exp Date','Qty','Rate','']}>
          {item.batches.sort((a,b)=>(a.exp_date||'').localeCompare(b.exp_date||'')).map(b=>(
            <TR key={b.id} style={{background:b.exp_date<=todayStr?'var(--rdb)':''}}>
              <TD style={{fontWeight:600}}>{b.batch_no}</TD>
              <TD style={{color:b.exp_date<=todayStr?'var(--red)':'',fontWeight:b.exp_date<=todayStr?700:400}}>
                {fmtDate(b.exp_date)}{b.exp_date<=todayStr?' (EXPIRED)':''}
              </TD>
              <TD right mono>{b.qty}</TD>
              <TD right mono>{b.purchase_rate?fmt(b.purchase_rate):'—'}</TD>
              <TD><Btn v="red" sz="sm" onClick={async()=>{
                const bid=b.id;
                patch(s=>{
                  const inv=s.inventory.map(i=>{
                    if(i.id!==batchItemId) return i;
                    const batches=(i.batches||[]).filter(x=>x.id!==bid);
                    return {...i,batches,stock:r2(batches.reduce((a,x)=>a+Number(x.qty||0),0))};
                  });
                  return {inventory:inv};
                });
                await save();
              }}>Delete</Btn></TD>
            </TR>
          ))}
        </Table>
      )}
      <div style={{fontWeight:700,fontSize:13,margin:'16px 0 8px'}}>+ Add New Batch</div>
      <div className="g2" style={{marginBottom:10}}>
        <Field label="Batch No. *"><input className="input" value={bf.batch_no} onChange={e=>patch({batchForm:{...bf,batch_no:e.target.value}})} placeholder="e.g. BT2024001" /></Field>
        <Field label="Purchase Rate ₹"><input className="input" type="number" value={bf.purchase_rate||''} onChange={e=>patch({batchForm:{...bf,purchase_rate:e.target.value}})} /></Field>
      </div>
      <div className="g3" style={{marginBottom:16}}>
        <Field label="Mfg Date"><input className="input" type="date" value={bf.mfg_date||''} onChange={e=>patch({batchForm:{...bf,mfg_date:e.target.value}})} /></Field>
        <Field label="Expiry Date *"><input className="input" type="date" value={bf.exp_date||''} onChange={e=>patch({batchForm:{...bf,exp_date:e.target.value}})} /></Field>
        <Field label="Qty *"><input className="input" type="number" value={bf.qty||''} onChange={e=>patch({batchForm:{...bf,qty:e.target.value}})} min="0" /></Field>
      </div>
      <div style={{display:'flex',justifyContent:'space-between'}}>
        <Btn v="ghost" onClick={()=>patch({batchItemId:null,batchForm:null})}>Cancel</Btn>
        <Btn v="pri" onClick={saveBatch}>+ Add Batch</Btn>
      </div>
    </Modal>
  );
}

function GodownView() {
  const { godowns, inventory, patch, save } = useStore();
  const gdwMap = {};
  godowns.forEach(g=>{ gdwMap[g]={items:[],value:0}; });
  inventory.forEach(item=>{
    const g=item.godown||'Main';
    if(!gdwMap[g]) gdwMap[g]={items:[],value:0};
    gdwMap[g].items.push(item);
    gdwMap[g].value=r2(gdwMap[g].value+item.rate*item.stock);
  });
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontWeight:700}}>{godowns.length} Storage Godowns</div>
        <div style={{display:'flex',gap:8}}>
          <Btn v="pri" sz="sm" onClick={async()=>{const n=prompt('New godown name:');if(!n?.trim())return;if(godowns.includes(n.trim())){toast('Already exists','error');return;}patch(s=>({godowns:[...s.godowns,n.trim()]}));await save();toast('Added ✓','success');}}>+ Add Godown</Btn>
          <Btn v="ghost" sz="sm" onClick={()=>patch({invTab:'items'})}>← Back</Btn>
        </div>
      </div>
      <div className="g3">
        {Object.entries(gdwMap).map(([g,data])=>(
          <Card refract key={g} onClick={()=>patch({gdwFilter:g,invTab:'items'})} style={{cursor:'pointer'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'start',marginBottom:8}}>
              <div style={{fontWeight:700}}>{g}</div>
              {g!=='Main'&&<Btn v="red" sz="sm" onClick={async e=>{e.stopPropagation();if(data.items.length>0){toast('Move items out first','error');return;}patch(s=>({godowns:s.godowns.filter(x=>x!==g)}));await save();}}>Delete</Btn>}
            </div>
            <div style={{fontSize:28,fontWeight:800,fontFamily:'var(--ffm)',color:'var(--acc)'}}>{data.items.length}</div>
            <div style={{fontSize:11.5,color:'var(--tx2)',marginTop:4}}>items · {fmt(data.value)} valuation</div>
          </Card>
        ))}
      </div>
    </div>
  );
}

function ImportView() {
  const { importPreview, patch, save } = useStore();
  const fileRef = useRef();

  const handleFile = e => {
    const file=e.target.files[0]; if(!file) return;
    const rd=new FileReader();
    rd.onload=ev=>{
      const lines=ev.target.result.trim().split(/\r?\n/);
      if(lines.length<2){toast('CSV needs header + data rows','error');return;}
      const headers=lines[0].split(',').map(h=>h.trim().toLowerCase().replace(/[^a-z0-9]/g,'_'));
      const col=k=>{const alts={name:['name','item','item_name','product'],rate:['rate','price','selling_price','sp'],stock:['stock','qty','quantity','opening_stock'],unit:['unit','uom'],gst_rate:['gst','gst_rate','tax_rate'],hsn:['hsn','hsn_code','sac'],category:['category','cat'],barcode:['barcode','sku','ean']};for(const a of(alts[k]||[k])){const i=headers.indexOf(a);if(i>=0)return i;}return -1;};
      const rows=lines.slice(1).map(line=>{
        const cells=line.split(',').map(s=>s.trim().replace(/^"|"$/g,''));
        const name=cells[col('name')]?.trim(); if(!name) return null;
        return {id:uid(),name,rate:Number(cells[col('rate')]||0),stock:Number(cells[col('stock')]||0),unit:cells[col('unit')]||'pcs',gst_rate:Number(cells[col('gst_rate')]||18),hsn:cells[col('hsn')]||'',category:cells[col('category')]||'',barcode:cells[col('barcode')]||'',godown:'Main',item_type:'product',price_mode:'excl',mrp:0,party_prices:[],custom_fields:[],online_store:false,batches:[],low_stock_alert:5,discount:0};
      }).filter(Boolean);
      patch({importPreview:rows});
      toast(`${rows.length} rows parsed`,'info');
    };
    rd.readAsText(file);
  };

  const confirmImport = async () => {
    patch(s=>{let inv=[...s.inventory];(importPreview||[]).forEach(row=>{const idx=inv.findIndex(i=>i.name.toLowerCase()===row.name.toLowerCase());if(idx>=0)inv[idx]={...inv[idx],...row,id:inv[idx].id};else inv=[...inv,row];});return{inventory:inv,importPreview:null,invTab:'items'};});
    await save(); toast(`Import done: ${importPreview.length} items`,'success');
  };

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontWeight:800,fontSize:18}}>Bulk Import Inventory Items</div>
        <Btn v="ghost" sz="sm" onClick={()=>patch({invTab:'items',importPreview:null})}>← Back</Btn>
      </div>
      {!importPreview ? (
        <div style={{maxWidth:520}}>
          <Alert v="info" style={{marginBottom:16,fontSize:12.5}}>
            <b>CSV format</b> — Required: <code>name</code>. Optional: <code>rate, stock, unit, gst_rate, hsn, category, barcode</code><br/><br/>
            <b>Example:</b><br/>
            <code style={{fontSize:11}}>name,rate,stock,unit,gst_rate<br/>Tata Salt 1kg,22,50,pcs,5</code>
          </Alert>
          <label style={{cursor:'pointer',display:'inline-flex',alignItems:'center',gap:8,padding:'12px 24px',background:'var(--acc)',color:'#fff',borderRadius:10,fontWeight:700}}>
            Choose CSV File
            <input ref={fileRef} type="file" accept=".csv,.txt" onChange={handleFile} style={{display:'none'}} />
          </label>
        </div>
      ) : (
        <div>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <div style={{fontWeight:600}}>{importPreview.length} rows ready for database sync</div>
            <div style={{display:'flex',gap:8}}>
              <label style={{cursor:'pointer'}}><Btn v="ghost" sz="sm" as="span">New File</Btn><input type="file" accept=".csv,.txt" onChange={handleFile} style={{display:'none'}}/></label>
              <Btn v="pri" sz="sm" onClick={confirmImport}>Commit Import ({importPreview.length})</Btn>
            </div>
          </div>
          <Table headers={['Name','Rate','Stock','Unit','GST%','HSN']} fintech>
            {importPreview.slice(0,50).map((r,i)=>(
              <TR key={i}>
                <TD style={{fontWeight:600}}>{r.name}</TD>
                <TD right mono>{r.rate?fmt(r.rate):'—'}</TD>
                <TD right mono>{r.stock||0}</TD>
                <TD style={{color:'var(--tx2)'}}>{r.unit}</TD>
                <TD mono>{r.gst_rate}%</TD>
                <TD style={{color:'var(--tx2)',fontFamily:'var(--ffm)',fontSize:11}}>{r.hsn||'—'}</TD>
              </TR>
            ))}
          </Table>
          {importPreview.length>50&&<div style={{fontSize:11,color:'var(--tx2)',textAlign:'center',marginTop:8}}>…and {importPreview.length-50} more</div>}
        </div>
      )}
    </div>
  );
}
