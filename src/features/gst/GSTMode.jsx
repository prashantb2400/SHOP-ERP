import React, { useRef } from 'react';
import { useStore } from '../../store/index.js';
import { fmt, fmtDate, r2 } from '../../engine/calc.js';
import { Card, Stat, Tabs, Table, TR, TD, Badge, Empty, Btn, Alert, toast } from '../../components/ui/index.jsx';
import {
  FileSpreadsheet,
  Scale,
  Receipt,
  Activity,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';

const GST_TABS = [
  ['gstr1', 'GSTR-1', <FileSpreadsheet key="1" size={14} />],
  ['3b', 'GSTR-3B', <Scale key="3" size={14} />],
  ['itc', 'ITC Register', <CheckCircle2 key="i" size={14} />],
  ['cdnr', 'CN / DN', <Receipt key="c" size={14} />],
  ['gstr2b', 'GSTR-2B Recon', <Activity key="2" size={14} />],
  ['trail', 'Audit Trail', <ShieldCheck key="t" size={14} />],
];

export default function GSTMode() {
  const { gstTab, patch, firm } = useStore();
  if (!firm?.gst_registered) return <Alert v="info">GST reports require active GST registration. Configure in Settings.</Alert>;
  return (
    <div>
      {/* Editorial Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">GST Compliance Center</h1>
          <div className="page-header-sub">
            GSTR-1 outward supplies, GSTR-3B monthly reconciliation, and Input Tax Credit register
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="hero-pill">
            GSTIN: <span style={{ fontFamily: 'var(--ffm)', fontWeight: 700 }}>{firm.gstin || 'Unregistered'}</span>
          </span>
          <span className="hero-pill">
            State: {firm.state || '—'}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <Tabs tabs={GST_TABS} active={gstTab} onChange={t => patch({ gstTab: t })} />
      </div>

      {gstTab === 'gstr1'  && <GSTR1View />}
      {gstTab === '3b'     && <GSTR3BView />}
      {gstTab === 'itc'    && <ITCView />}
      {gstTab === 'cdnr'   && <CDNRView />}
      {gstTab === 'gstr2b' && <GSTR2BView />}
      {gstTab === 'trail'  && <AuditView />}
    </div>
  );
}

function GSTR1View() {
  const { invoices, fyFilter } = useStore();
  const fy = fyFilter === 'all' ? null : fyFilter;
  const invs = invoices.filter(i => (!fy || i.fy === fy) && i.status !== 'void');
  const b2b  = invs.filter(i => i.customer_gstin);
  const b2c  = invs.filter(i => !i.customer_gstin);
  const outGST = r2(invs.reduce((a, i) => a + Number(i.gst_amount || 0), 0));
  return (
    <div>
      <div className="stats stats-3" style={{ marginBottom: 18 }}>
        <Stat label="B2B Supply Invoices" value={b2b.length} sub={fmt(r2(b2b.reduce((a, i) => a + Number(i.total || 0), 0)))} />
        <Stat label="B2C Consumer Bills" value={b2c.length} sub={fmt(r2(b2c.reduce((a, i) => a + Number(i.total || 0), 0)))} />
        <Stat label="Total Output Tax" value={fmt(outGST)} color="var(--red)" />
      </div>
      <Card flat style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--bor)', fontWeight: 700, fontSize: 13 }}>
          B2B Schedule — Invoices with Registered Buyer GSTIN
        </div>
        {b2b.length === 0 ? <div style={{ padding: 20 }}><Empty title="No B2B invoices recorded" sub="Invoices with customer GSTIN will automatically list here." /></div> :
          <Table headers={['Invoice No.', 'Customer Name', 'Buyer GSTIN', 'Date', 'Taxable ₹', 'GST Amount', 'Invoice Value']} fintech>
            {b2b.slice(0, 100).map(inv => (
              <TR key={inv.id}>
                <TD mono style={{ color: 'var(--acc)', fontWeight: 700, fontSize: 11.5 }}>{inv.invoice_no}</TD>
                <TD style={{ fontWeight: 600 }}>{inv.customer_name}</TD>
                <TD mono style={{ fontSize: 11.5, color: 'var(--tx2)' }}>{inv.customer_gstin}</TD>
                <TD style={{ color: 'var(--tx2)', fontSize: 11.5 }}>{fmtDate(inv.date)}</TD>
                <TD right mono>{fmt(inv.total_taxable || 0)}</TD>
                <TD right mono style={{ color: 'var(--red)' }}>{fmt(inv.gst_amount || 0)}</TD>
                <TD right mono style={{ fontWeight: 700 }}>{fmt(inv.total)}</TD>
              </TR>
            ))}
          </Table>}
      </Card>
    </div>
  );
}

function GSTR3BView() {
  const { invoices, purchases, credit_notes, fyFilter } = useStore();
  const fy = fyFilter === 'all' ? null : fyFilter;
  const invs = invoices.filter(i => (!fy || i.fy === fy) && i.status !== 'void');
  const purcs = purchases.filter(p => !fy || p.fy === fy);
  const cns = (credit_notes || []).filter(n => (!fy || n.fy === fy) && n.type !== 'debit');
  const outGST = r2(invs.reduce((a, i) => a + Number(i.gst_amount || 0), 0));
  const itc = r2(purcs.reduce((a, p) => { const amt = Number(p.amount || 0), g = Number(p.gst_rate || 0); return a + r2(amt - (amt / (1 + g / 100))); }, 0));
  const cnGST = r2(cns.reduce((a, n) => a + Number(n.gst_amount || 0), 0));
  const net = r2(outGST - itc - cnGST);
  return (
    <div>
      <div className="stats stats-4" style={{ marginBottom: 18 }}>
        <Stat label="Gross Output GST" value={fmt(outGST)} color="var(--red)" />
        <Stat label="Input Tax Credit" value={fmt(itc)} color="var(--grn)" />
        <Stat label="Credit Note Reversal" value={fmt(cnGST)} color="var(--ylw)" />
        <Stat label="Net Tax Position" value={fmt(net)} color={net > 0 ? 'var(--red)' : 'var(--grn)'} />
      </div>
      <Alert v={net > 0 ? 'warn' : 'ok'}>

        {net>0 ? `Net GST Payable: ${fmt(net)} — file GSTR-3B and remit tax before 20th of the following month.`
                : `Accumulated Input Tax Credit: ${fmt(Math.abs(net))} — eligible to carry forward to subsequent periods.`}
      </Alert>
    </div>
  );
}

function ITCView() {
  const { purchases, invoices } = useStore();
  const months=[...new Set(purchases.map(p=>p.date?.slice(0,7)).filter(Boolean))].sort().reverse();
  return (
    <div>
      <Alert v="info" className="mb-3" style={{marginBottom:12}}>Verify against GSTR-2B before filing. Always reconcile purchase records with supplier invoices.</Alert>
      <Table headers={['Month','Purchases','Input GST','Output GST','Net']}>
        {months.slice(0,12).map(m=>{
          const mP=purchases.filter(p=>p.date?.startsWith(m));
          const mI=invoices.filter(i=>i.date?.startsWith(m)&&i.status!=='void');
          const itc=r2(mP.reduce((a,p)=>{const amt=Number(p.amount||0),g=Number(p.gst_rate||0);return a+r2(amt-(amt/(1+g/100)));},0));
          const out=r2(mI.reduce((a,i)=>a+Number(i.gst_amount||0),0));
          return (<TR key={m}>
            <TD style={{fontWeight:600}}>{m}</TD>
            <TD right>{mP.length}</TD>
            <TD right style={{color:'var(--grn)',fontWeight:600}}>{fmt(itc)}</TD>
            <TD right style={{color:'var(--red)',fontWeight:600}}>{fmt(out)}</TD>
            <TD right style={{fontWeight:700,color:r2(out-itc)>0?'var(--red)':'var(--grn)'}}>{fmt(r2(out-itc))}</TD>
          </TR>);
        })}
      </Table>
    </div>
  );
}

function CDNRView() {
  const { credit_notes, cdnrSubTab, fyFilter, patch } = useStore();
  const fy = fyFilter==='all'?null:fyFilter;
  const all = (credit_notes||[]).filter(n=>!fy||n.fy===fy);
  const shown = cdnrSubTab==='cn'?all.filter(n=>n.type!=='debit'):cdnrSubTab==='dn'?all.filter(n=>n.type==='debit'):all;
  const cnAmt=r2(all.filter(n=>n.type!=='debit').reduce((a,n)=>a+Number(n.total||0),0));
  const dnAmt=r2(all.filter(n=>n.type==='debit').reduce((a,n)=>a+Number(n.total||0),0));
  return (
    <div>
      <div className="stats stats-2" style={{marginBottom:16}}>
        <Stat label="Credit Notes" value={all.filter(n=>n.type!=='debit').length} sub={fmt(cnAmt)+' · reduces GST liability'} color="var(--grn)" />
        <Stat label="Debit Notes"  value={all.filter(n=>n.type==='debit').length}  sub={fmt(dnAmt)+' · increases GST liability'} color="var(--ylw)" />
      </div>
      <Tabs tabs={[['cn','Credit Notes'],['dn','Debit Notes'],['all','All']]} active={cdnrSubTab} onChange={t=>patch({cdnrSubTab:t})} />
      {shown.length===0 ? <Empty title="No notes yet" /> :
        <Table headers={['No.','Type','Customer','Against','Date','Amount']}>
          {shown.map(n=>(
            <TR key={n.id}>
              <TD style={{color:'var(--acc)',fontWeight:700,fontSize:11}}>{n.cn_no||'—'}</TD>
              <TD><Badge v={n.type==='debit'?'yellow':'blue'}>{n.type==='debit'?'DN':'CN'}</Badge></TD>
              <TD>{n.customer_name||'—'}</TD>
              <TD style={{fontSize:11,color:'var(--tx2)'}}>{n.original_invoice_no||'—'}</TD>
              <TD style={{color:'var(--tx2)'}}>{fmtDate(n.date)}</TD>
              <TD right style={{fontWeight:700,color:n.type==='debit'?'var(--ylw)':'var(--grn)'}}>
                {n.type==='debit'?'+':'−'}{fmt(n.total)}
              </TD>
            </TR>
          ))}
        </Table>}
    </div>
  );
}

function GSTR2BView() {
  const { gstr2bData, gstr2bResults, gstr2bFilter, purchases, patch } = useStore();
  const fileRef = useRef();

  const handleFile = e => {
    const f=e.target.files[0]; if(!f) return;
    const rd=new FileReader();
    rd.onload=ev=>{
      try {
        const raw=JSON.parse(ev.target.result);
        const b2b=raw?.data?.docdata?.b2b||raw?.b2b||[];
        const entries=[];
        b2b.forEach(sup=>{
          const gstin=sup.ctin||sup.gstin||'';
          (sup.inv||sup.invoices||[]).forEach(inv=>{
            entries.push({gstin,name:sup.trdnm||'',invoice_no:inv.inum||'',invoice_date:inv.idt||'',
              taxable:Number(inv.val||0),igst:Number(inv.igst||0),cgst:Number(inv.cgst||0),sgst:Number(inv.sgst||0),
              total:r2(Number(inv.val||0)+Number(inv.igst||0)+Number(inv.cgst||0)+Number(inv.sgst||0)),
              type:'b2b',itcEligible:inv.elg!=='no'});
          });
        });
        patch({gstr2bData:entries,gstr2bResults:null});
        toast(`GSTR-2B loaded — ${entries.length} entries`,'success');
      } catch(err){ toast('Parse error: '+err.message,'error'); }
    };
    rd.readAsText(f);
  };

  const runRecon=()=>{
    if(!gstr2bData?.length) return;
    const results=gstr2bData.map(e=>{
      const match=purchases.find(p=>{
        const gm=e.gstin&&p.supplier_gstin&&p.supplier_gstin.toUpperCase()===e.gstin.toUpperCase();
        const am=e.total>0&&Math.abs(Number(p.amount||0)-e.total)/e.total<0.05;
        return gm&&am;
      });
      const gstAmt=r2(e.igst+e.cgst+e.sgst);
      return {...e,gst_amount:gstAmt,purchase_match:match||null,
        match_status:match?'matched':'unmatched',
        itc_at_risk:!match&&e.itcEligible&&gstAmt>0};
    });
    patch({gstr2bResults:results});
    const risk=r2(results.filter(r=>r.itc_at_risk).reduce((a,r)=>a+r.gst_amount,0));
    toast(`Done · ITC at risk: ${fmt(risk)}`,'info',5000);
  };

  if(!gstr2bData) return (
    <div style={{maxWidth:480,margin:'0 auto',textAlign:'center',padding:'48px 16px'}}>
      <h3 style={{fontWeight:800,fontSize:18,marginBottom:8}}>GSTR-2B Reconciliation</h3>
      <p style={{color:'var(--tx2)',fontSize:13,marginBottom:20}}>Upload your GSTR-2B JSON from the GST portal to identify ITC at risk.</p>
      <Alert v="info" style={{textAlign:'left',marginBottom:20,fontSize:12}}>
        <b>Download from portal:</b><br/>
        1. Login gstin.gov.in → Services → Returns → GSTR-2B<br/>
        2. Select period → Download JSON → Upload here
      </Alert>
      <label style={{cursor:'pointer',display:'inline-flex',alignItems:'center',gap:8,padding:'12px 24px',
        background:'var(--acc)',color:'#fff',borderRadius:10,fontWeight:700,fontSize:14}}>
        Upload GSTR-2B JSON
        <input ref={fileRef} type="file" accept=".json" onChange={handleFile} style={{display:'none'}} />
      </label>
    </div>
  );

  const display=gstr2bResults||gstr2bData.map(e=>({...e,gst_amount:r2(e.igst+e.cgst+e.sgst),match_status:'pending',itc_at_risk:false}));
  const filtered=gstr2bFilter==='all'?display:gstr2bFilter==='matched'?display.filter(r=>r.match_status==='matched'):gstr2bFilter==='unmatched'?display.filter(r=>r.match_status!=='matched'):display.filter(r=>r.itc_at_risk);
  const itcRisk=r2(display.filter(r=>r.itc_at_risk).reduce((a,r)=>a+r.gst_amount,0));

  return (
    <div>
      <div style={{display:'flex',flexWrap:'wrap',justifyContent:'space-between',alignItems:'center',gap:10,marginBottom:16}}>
        <div style={{fontWeight:700}}>{display.length} entries</div>
        <div style={{display:'flex',gap:8}}>
          {!gstr2bResults&&<Btn v="pri" sz="sm" onClick={runRecon}>Run Reconciliation</Btn>}
          <label style={{cursor:'pointer'}}><Btn v="ghost" sz="sm" as="span">New File</Btn><input type="file" accept=".json" onChange={handleFile} style={{display:'none'}}/></label>
          <Btn v="ghost" sz="sm" onClick={()=>patch({gstr2bData:null,gstr2bResults:null})}>Clear</Btn>
        </div>
      </div>
      <div className="stats stats-4" style={{marginBottom:16}}>
        <Stat label="Total ITC in 2B" value={fmt(display.reduce((a,r)=>a+r.gst_amount,0))} />
        <Stat label="Matched"  value={display.filter(r=>r.match_status==='matched').length} color="var(--grn)" />
        <Stat label="Unmatched" value={display.filter(r=>r.match_status!=='matched').length} color="var(--red)" />
        <Stat label="ITC at Risk" value={fmt(itcRisk)} color="var(--red)" />
      </div>
      {itcRisk>0&&<Alert v="warn" style={{marginBottom:12}}><b>{fmt(itcRisk)}</b> ITC at risk — add missing purchases to claim ITC.</Alert>}
      <div style={{display:'flex',gap:6,marginBottom:12}}>
        {['all','matched','unmatched','risk'].map(f=>(
          <button key={f} onClick={()=>patch({gstr2bFilter:f})}
            style={{padding:'4px 12px',fontSize:11,fontWeight:600,borderRadius:99,cursor:'pointer',
              background:gstr2bFilter===f?'var(--acc)':'transparent',
              border:`1.5px solid ${gstr2bFilter===f?'var(--acc)':'var(--bor)'}`,
              color:gstr2bFilter===f?'#fff':'var(--tx2)'}}>
            {f.charAt(0).toUpperCase()+f.slice(1)}
          </button>
        ))}
      </div>
      <Table headers={['Supplier GSTIN','Name','Inv No.','Taxable','ITC','Status']}>
        {filtered.slice(0,80).map((r,i)=>(
          <TR key={i} style={{background:r.itc_at_risk?'var(--rdb)':r.match_status==='matched'?'var(--gnb)':''}}>
            <TD style={{fontFamily:'var(--ffm)',fontSize:11,color:'var(--acc)'}}>{r.gstin||'—'}</TD>
            <TD style={{fontSize:11}}>{(r.name||'—').slice(0,22)}</TD>
            <TD style={{fontWeight:600,fontSize:11}}>{r.invoice_no||'—'}</TD>
            <TD right>{fmt(r.taxable)}</TD>
            <TD right style={{fontWeight:700,color:r.itc_at_risk?'var(--red)':'var(--grn)'}}>{fmt(r.gst_amount)}</TD>
            <TD><Badge v={r.match_status==='matched'?'green':r.itc_at_risk?'red':'default'}>
              {r.match_status==='matched'?'Matched':r.itc_at_risk?'At Risk':'Pending'}
            </Badge></TD>
          </TR>
        ))}
      </Table>
    </div>
  );
}

function AuditView() {
  const { audit_log } = useStore();
  if(!audit_log?.length) return <Empty title="No audit entries" sub="All changes are logged here" />;
  return (
    <Table headers={['Time','User','Action','Type','Reference','Amount']}>
      {audit_log.slice(0,200).map((e,i)=>(
        <TR key={i}>
          <TD style={{color:'var(--tx2)',fontSize:11}}>{e.ts?new Date(e.ts).toLocaleString('en-IN',{day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit'}):'—'}</TD>
          <TD style={{fontSize:11}}>{e.user||'local'}</TD>
          <TD><Badge v={e.action==='create'?'green':e.action==='delete'?'red':'default'}>{e.action}</Badge></TD>
          <TD style={{fontSize:11,color:'var(--tx2)'}}>{e.entity||'—'}</TD>
          <TD style={{fontWeight:600,color:'var(--acc)',fontSize:11}}>{e.invoice_no||e.id?.slice(-6)||'—'}</TD>
          <TD right style={{fontSize:11}}>{e.amount?fmt(e.amount):'—'}</TD>
        </TR>
      ))}
    </Table>
  );
}
