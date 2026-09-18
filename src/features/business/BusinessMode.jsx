import React from 'react';
import { useStore } from '../../store/index.js';
import { fmt, fmtDate, r2 } from '../../engine/calc.js';
import { Card, Stat, Tabs, Table, TR, TD, Badge, Empty, Btn, Alert } from '../../components/ui/index.jsx';

const BIZ_TABS = [
  ['dash','📊 Today'],['txn','📦 Transactions'],
  ['money','💰 Money'],['reports','📈 Reports'],
  ['po','📋 PO'],['payroll','💰 Payroll'],
];

export default function BusinessMode() {
  const { bizTab, patch, invoices, purchases, expenses, customers, firm, fyFilter } = useStore();
  const fy = fyFilter==='all'?null:fyFilter;
  const fyI = invoices.filter(i=>!fy||i.fy===fy);
  const fyP = purchases.filter(p=>!fy||p.fy===fy);
  const fyE = expenses.filter(e=>!fy||e.fy===fy);
  const tS  = r2(fyI.reduce((a,i)=>a+Number(i.total||0),0));
  const tP  = r2(fyP.reduce((a,p)=>a+Number(p.amount||0),0));
  const tE  = r2(fyE.reduce((a,e)=>a+Number(e.amount||0),0));
  const outstanding = r2(customers.reduce((a,c)=>a+Number(c.outstanding||0),0));

  return (
    <div>
      <Tabs tabs={BIZ_TABS} active={bizTab} onChange={t=>patch({bizTab:t})} />
      {bizTab==='dash' && (
        <div style={{display:'flex',flexDirection:'column',gap:16}}>
          <div className="stats stats-4">
            <Stat label="Total Sales" value={fmt(tS)} sub={`${fyI.length} invoices`} />
            <Stat label="Net Profit" value={fmt(r2(tS-tP-tE))} color={tS-tP-tE>=0?'var(--grn)':'var(--red)'} />
            <Stat label="Outstanding" value={fmt(outstanding)} color="var(--red)" />
            <Stat label="Total Purchases" value={fmt(tP)} color="var(--ylw)" />
          </div>
          <Card>
            <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>Recent Invoices</div>
            {invoices.length===0
              ? <Empty icon="🧾" title="No invoices yet" />
              : <Table headers={['Invoice','Customer','Date','Amount','Status']}>
                  {invoices.slice(0,10).map(inv=>(
                    <TR key={inv.id}>
                      <TD style={{color:'var(--acc)',fontWeight:700,fontSize:12}}>{inv.invoice_no}</TD>
                      <TD>{inv.customer_name||'Walk-in'}</TD>
                      <TD style={{color:'var(--tx2)'}}>{fmtDate(inv.date)}</TD>
                      <TD right style={{fontWeight:700}}>{fmt(inv.total)}</TD>
                      <TD><Badge v={inv.status==='paid'?'green':inv.status==='unpaid'?'red':'yellow'}>{inv.status}</Badge></TD>
                    </TR>
                  ))}
                </Table>}
          </Card>
        </div>
      )}
      {bizTab==='reports' && (
        <Card>
          <div style={{fontWeight:700,fontSize:14,marginBottom:12}}>Profit & Loss</div>
          {[['Gross Sales',tS,'var(--grn)'],['Purchases',tP,'var(--red)'],['Expenses',tE,'var(--red)'],
            ['Gross Profit',r2(tS-tP),r2(tS-tP)>=0?'var(--grn)':'var(--red)'],
            ['Net Profit',r2(tS-tP-tE),r2(tS-tP-tE)>=0?'var(--grn)':'var(--red)']
          ].map(([l,v,c])=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid var(--bor)'}}>
              <span style={{color:'var(--tx2)',fontSize:13}}>{l}</span>
              <span style={{fontWeight:700,color:c}}>{fmt(v)}</span>
            </div>
          ))}
        </Card>
      )}
      {bizTab==='money' && (
        <div>
          <div className="stats stats-2" style={{marginBottom:16}}>
            <Stat label="Total Outstanding" value={fmt(outstanding)} color="var(--red)" />
            <Stat label="Customers with dues" value={customers.filter(c=>c.outstanding>0).length} />
          </div>
          <Table headers={['Customer','Phone','Outstanding']}>
            {customers.filter(c=>Number(c.outstanding||0)>0).sort((a,b)=>b.outstanding-a.outstanding).map(c=>(
              <TR key={c.id}>
                <TD style={{fontWeight:600}}>{c.name}</TD>
                <TD style={{color:'var(--tx2)'}}>{c.phone||'—'}</TD>
                <TD right style={{fontWeight:700,color:'var(--red)'}}>{fmt(c.outstanding)}</TD>
              </TR>
            ))}
          </Table>
        </div>
      )}
      {(bizTab==='txn'||bizTab==='po'||bizTab==='payroll') && (
        <Alert v="info">This section is fully available in the RetailFlow HTML app. React migration in progress.</Alert>
      )}
    </div>
  );
}
