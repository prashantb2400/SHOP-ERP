import React, { useMemo } from 'react';
import { useStore } from '../../store/index.js';
import { fmt, fmtDate, r2 } from '../../engine/calc.js';
import { buildJournals, buildTrialBalance } from '../../engine/journals.js';
import { Card, Tabs, Table, TR, TD, Badge, Empty, Btn, Alert, Stat, Field, toast } from '../../components/ui/index.jsx';

const AC_TABS = [
  ['daybook','📓 Day Book'],['cashbook','💵 Cash Book'],
  ['trialbal','⚖️ Trial Balance'],['balsheet','📊 Balance Sheet'],
  ['bankrecon','🏦 Bank Recon'],['cashflow','💧 Cash Flow'],
  ['jvlist','✏️ Journal Vouchers'],
];

export default function AccountsMode() {
  const state = useStore();
  const { acTab, drillLedger, fyFilter, patch } = state;

  const journals = useMemo(()=>buildJournals(state),
    [state.invoices,state.purchases,state.expenses,state.payments,
     state.credit_notes,state.opening_balances,state.manual_journals,state.customers]);

  const fy = fyFilter==='all'?null:fyFilter;
  const fyJ = fy ? journals.filter(j=>!j.date||j.id==='OB'||j.date.startsWith(fy.split('-')[0])) : journals;
  const tb  = useMemo(()=>buildTrialBalance(fyJ,state.inventory,{}), [fyJ,state.inventory]);

  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:800}}>Accounts & Books</h2>
          <div style={{fontSize:12,color:'var(--tx2)'}}>{fyJ.length} journal entries</div>
        </div>
        <Btn v="pri" sz="sm" onClick={()=>patch({acTab:'jvlist'})}>+ Journal Voucher</Btn>
      </div>
      <Tabs tabs={AC_TABS} active={drillLedger?'trialbal':acTab} onChange={t=>patch({acTab:t,drillLedger:null})} />
      {drillLedger
        ? <LedgerDrill name={drillLedger} journals={fyJ} />
        : <>
            {acTab==='daybook'   && <DayBook journals={fyJ} />}
            {acTab==='cashbook'  && <DayBook journals={fyJ} cashOnly />}
            {acTab==='trialbal'  && <TrialBal tb={tb} onDrill={l=>patch({drillLedger:l})} />}
            {acTab==='balsheet'  && <BalSheet tb={tb} />}
            {acTab==='bankrecon' && <BankRecon journals={fyJ} />}
            {acTab==='cashflow'  && <CashFlow tb={tb} />}
            {acTab==='jvlist'    && <JVList />}
          </>}
    </div>
  );
}

function DayBook({ journals, cashOnly }) {
  const F = cashOnly ? journals.filter(j=>(j.entries||[]).some(e=>e.ledger==='Cash in Hand'||e.ledger==='Bank Account')) : journals;
  if(!F.length) return <Empty icon="📓" title="No entries" sub="Add invoices, purchases and expenses to see journal entries" />;
  return (
    <div>
      <Alert v="info" style={{marginBottom:12,fontSize:12}}>{cashOnly?'💵 Cash Book — transactions affecting Cash or Bank':'📓 Day Book — all journal entries chronologically'}</Alert>
      <Table headers={['Date','Ref','Narration','Ledger','Dr ₹','Cr ₹']}>
        {F.slice(0,200).flatMap(j=>(j.entries||[]).map((e,ei)=>(
          <TR key={`${j.id}-${ei}`}>
            <TD style={{color:'var(--tx2)',fontSize:11,whiteSpace:'nowrap'}}>{ei===0?fmtDate(j.date):''}</TD>
            <TD style={{color:'var(--acc)',fontWeight:700,fontSize:11,whiteSpace:'nowrap'}}>{ei===0?j.ref:''}</TD>
            <TD style={{color:'var(--tx2)',fontSize:11}}>{ei===0?j.narration:''}</TD>
            <TD style={{paddingLeft:ei>0?28:12}}>{e.ledger}</TD>
            <TD right style={{color:e.dr>0?'var(--red)':'var(--tx2)',fontWeight:e.dr>0?600:400}}>{e.dr>0?fmt(e.dr):'—'}</TD>
            <TD right style={{color:e.cr>0?'var(--grn)':'var(--tx2)',fontWeight:e.cr>0?600:400}}>{e.cr>0?fmt(e.cr):'—'}</TD>
          </TR>
        )))}
      </Table>
    </div>
  );
}

function TrialBal({ tb, onDrill }) {
  const totDr = r2(Object.values(tb).reduce((a,v)=>a+v.dr,0));
  const totCr = r2(Object.values(tb).reduce((a,v)=>a+v.cr,0));
  const balanced = Math.abs(totDr-totCr)<1;
  const groups={};
  Object.entries(tb).forEach(([k,v])=>{const g=v.group||'Misc';if(!groups[g])groups[g]=[];groups[g].push([k,v]);});

  return (
    <div>
      {balanced
        ? <Alert v="green" style={{marginBottom:12}}>✓ Trial Balance balances — Dr = Cr = {fmt(totDr)}</Alert>
        : <Alert v="warn" style={{marginBottom:12}}>⚠️ Does not balance — Dr {fmt(totDr)} ≠ Cr {fmt(totCr)}</Alert>}
      <Table headers={['Ledger','Group','Dr ₹','Cr ₹','Balance']}>
        {Object.entries(groups).sort().flatMap(([g,items])=>[
          <tr key={`g-${g}`} style={{background:'var(--surf2)'}}>
            <td colSpan={5} style={{padding:'6px 12px',fontSize:10,fontWeight:800,textTransform:'uppercase',letterSpacing:.4,color:'var(--tx2)'}}>{g}</td>
          </tr>,
          ...items.map(([k,v])=>(
            <TR key={k}>
              <TD><button onClick={()=>onDrill(k)} style={{background:'none',border:'none',cursor:'pointer',color:'var(--acc)',fontWeight:600,fontSize:12}}>{k}</button></TD>
              <TD style={{fontSize:11,color:'var(--tx2)'}}>{v.group}</TD>
              <TD right>{v.dr>0?fmt(v.dr):'—'}</TD>
              <TD right>{v.cr>0?fmt(v.cr):'—'}</TD>
              <TD right style={{fontWeight:700,color:v.closing>=0?'var(--grn)':'var(--red)'}}>{fmt(Math.abs(v.closing))} {v.closing>=0?'Dr':'Cr'}</TD>
            </TR>
          )),
        ])}
        <tr style={{background:'var(--surf2)',borderTop:'2px solid var(--bor)'}}>
          <td colSpan={2} style={{padding:'8px 12px',fontWeight:700}}>TOTAL</td>
          <td style={{textAlign:'right',padding:'8px 12px',fontWeight:700,color:'var(--red)'}}>{fmt(totDr)}</td>
          <td style={{textAlign:'right',padding:'8px 12px',fontWeight:700,color:'var(--grn)'}}>{fmt(totCr)}</td>
          <td style={{textAlign:'right',padding:'8px 12px',fontWeight:700,color:balanced?'var(--grn)':'var(--red)'}}>{balanced?'✓ Balanced':'✗ Diff: '+fmt(Math.abs(totDr-totCr))}</td>
        </tr>
      </Table>
      <div style={{fontSize:11,color:'var(--tx2)',marginTop:8}}>Click any ledger name to drill down into its transactions.</div>
    </div>
  );
}

function BalSheet({ tb }) {
  const income  = r2(Object.entries(tb).filter(([,v])=>v.type==='income').reduce((a,[,v])=>a+v.cr-v.dr,0));
  const expense = r2(Object.entries(tb).filter(([,v])=>v.type==='expense').reduce((a,[,v])=>a+v.dr-v.cr,0));
  const netP    = r2(income-expense);
  const sources={}, application={};
  Object.entries(tb).forEach(([k,v])=>{
    if(v.type==='income'||v.type==='expense') return;
    const bal=Math.abs(v.closing); if(!bal) return;
    const side=v.bs||(v.drNormal?'application':'sources');
    const grp=v.group||'Misc';
    const bucket=side==='sources'?sources:application;
    if(!bucket[grp]) bucket[grp]=[];
    bucket[grp].push({name:k,amount:bal});
  });
  if(!sources['Capital']) sources['Capital']=[];
  sources['Capital'].push({name:'Net Profit / (Loss)',amount:netP});
  const totS=r2(Object.values(sources).flat().reduce((a,i)=>a+i.amount,0));
  const totA=r2(Object.values(application).flat().reduce((a,i)=>a+i.amount,0));
  const diff=r2(Math.abs(totS-totA));

  const SideTable=({obj,color})=>(
    <Table headers={['Particulars','₹']}>
      {Object.entries(obj).sort().flatMap(([grp,items])=>[
        <tr key={grp} style={{background:'var(--surf2)'}}><td colSpan={2} style={{padding:'6px 12px',fontSize:10,fontWeight:800,textTransform:'uppercase',color}}>{grp}</td></tr>,
        ...items.map(i=><TR key={i.name}><TD style={{paddingLeft:24}}>{i.name}</TD><TD right style={{fontWeight:600}}>{fmt(i.amount)}</TD></TR>),
      ])}
      <tr style={{background:'var(--surf2)'}}><td style={{padding:'8px 12px',fontWeight:700}}>TOTAL</td><td style={{textAlign:'right',padding:'8px 12px',fontWeight:700}}>{fmt(Object.values(obj).flat().reduce((a,i)=>a+i.amount,0))}</td></tr>
    </Table>
  );

  return (
    <div>
      <div className="stats stats-2" style={{marginBottom:16}}>
        <Stat label="Sources of Funds" value={fmt(totS)} sub="Capital + Liabilities" color="var(--grn)" />
        <Stat label="Application of Funds" value={fmt(totA)} sub="Assets" color="var(--acc)" />
      </div>
      {diff>1
        ? <Alert v="warn" style={{marginBottom:12}}>⚠️ Out of balance by {fmt(diff)} — check opening balances</Alert>
        : <Alert v="green" style={{marginBottom:12}}>✓ Balance Sheet balances — {fmt(totS)}</Alert>}
      <div className="g2">
        <div><div style={{fontWeight:700,color:'var(--grn)',marginBottom:8}}>SOURCES OF FUNDS</div><SideTable obj={sources} color="var(--grn)" /></div>
        <div><div style={{fontWeight:700,color:'var(--acc)',marginBottom:8}}>APPLICATION OF FUNDS</div><SideTable obj={application} color="var(--acc)" /></div>
      </div>
    </div>
  );
}

function BankRecon({ journals }) {
  const { bank_recon, opening_balances, patch, save } = useStore();
  const bankJ = journals.filter(j=>(j.entries||[]).some(e=>e.ledger==='Bank Account'||e.ledger==='Cash in Hand'));
  const recon  = bank_recon||[];
  const unrecon= bankJ.filter(j=>!recon.find(r=>r.journal_id===j.id));
  const reconciled=bankJ.filter(j=> recon.find(r=>r.journal_id===j.id));
  const bookBal=r2(bankJ.reduce((a,j)=>a+(j.entries||[]).filter(e=>e.ledger==='Bank Account'||e.ledger==='Cash in Hand').reduce((b,e)=>b+e.dr-e.cr,0),(opening_balances?.cash_in_hand||0)+(opening_balances?.bank_balance||0)));

  const toggle=async(jid,matched)=>{
    const updated=matched?[...recon,{journal_id:jid,matched_at:new Date().toISOString()}]:recon.filter(r=>r.journal_id!==jid);
    patch({bank_recon:updated}); await save();
  };

  return (
    <div>
      <div className="stats stats-3" style={{marginBottom:16}}>
        <Stat label="Book Balance" value={fmt(bookBal)} />
        <Stat label="Unreconciled" value={unrecon.length} color="var(--red)" />
        <Stat label="Reconciled" value={reconciled.length} color="var(--grn)" />
      </div>
      <Alert v="info" style={{marginBottom:12}}>Mark transactions ✓ Match after verifying against your bank statement.</Alert>
      <div style={{fontWeight:700,fontSize:13,marginBottom:8}}>Unreconciled ({unrecon.length})</div>
      {unrecon.length===0 ? <div style={{fontSize:13,color:'var(--tx2)'}}>All transactions reconciled ✓</div> :
        <Table headers={['Date','Ref','Narration','Amount','']}>
          {unrecon.slice(0,40).map(j=>{
            const e=(j.entries||[]).find(e=>e.ledger==='Bank Account'||e.ledger==='Cash in Hand');
            if(!e) return null;
            const amt=e.dr>e.cr?e.dr:-e.cr;
            return (<TR key={j.id}>
              <TD style={{color:'var(--tx2)',fontSize:11}}>{fmtDate(j.date)}</TD>
              <TD style={{color:'var(--acc)',fontWeight:700,fontSize:11}}>{j.ref}</TD>
              <TD style={{fontSize:11}}>{j.narration}</TD>
              <TD right style={{fontWeight:600,color:amt>0?'var(--grn)':'var(--red)'}}>{fmt(Math.abs(amt))}</TD>
              <TD><Btn v="grn" sz="sm" onClick={()=>toggle(j.id,true)}>✓ Match</Btn></TD>
            </TR>);
          })}
        </Table>}
      {reconciled.length>0&&<>
        <div style={{fontWeight:700,fontSize:13,margin:'16px 0 8px'}}>Reconciled ({reconciled.length})</div>
        <Table headers={['Date','Ref','Narration','Amount','']}>
          {reconciled.slice(0,20).map(j=>{
            const e=(j.entries||[]).find(e=>e.ledger==='Bank Account'||e.ledger==='Cash in Hand');
            if(!e) return null;
            return (<TR key={j.id} style={{opacity:.65}}>
              <TD style={{fontSize:11}}>{fmtDate(j.date)}</TD>
              <TD style={{fontSize:11,color:'var(--acc)'}}>{j.ref}</TD>
              <TD style={{fontSize:11}}>{j.narration}</TD>
              <TD right style={{fontSize:11}}>{fmt(Math.abs(e.dr>e.cr?e.dr:-e.cr))}</TD>
              <TD><Btn v="ghost" sz="sm" onClick={()=>toggle(j.id,false)}>Unmatch</Btn></TD>
            </TR>);
          })}
        </Table>
      </>}
    </div>
  );
}

function CashFlow({ tb }) {
  const { opening_balances:ob } = useStore();
  const income  = r2(Object.entries(tb).filter(([,v])=>v.type==='income').reduce((a,[,v])=>a+v.cr-v.dr,0));
  const expense = r2(Object.entries(tb).filter(([,v])=>v.type==='expense').reduce((a,[,v])=>a+v.dr-v.cr,0));
  const netP    = r2(income-expense);
  const dCh     = -(tb['Sundry Debtors']?.closing||0);
  const crCh    =  (tb['Sundry Creditors']?.closing||0);
  const stCh    = -((tb['Closing Stock']?.closing||0)-(ob?.inventory_value||0));
  const gstP    = r2((tb['CGST Payable']?.closing||0)+(tb['SGST Payable']?.closing||0)+(tb['IGST Payable']?.closing||0));
  const opCF    = r2(netP+dCh+crCh+stCh+gstP);
  const invCF   = r2(-((tb['Fixed Assets']?.closing||0)-(ob?.fixed_assets||0)));
  const finCF   = r2((ob?.loans_payable||0)+(ob?.capital||0));
  const netCF   = r2(opCF+invCF+finCF);
  const openC   = r2((ob?.cash_in_hand||0)+(ob?.bank_balance||0));

  const Row=({label,val,sub})=>(
    <div style={{display:'flex',justifyContent:'space-between',padding:'8px 0',borderBottom:'1px solid var(--bor)'}}>
      <span style={{fontSize:13,color:sub?'var(--tx2)':'var(--tx)',paddingLeft:sub?16:0,fontWeight:sub?400:600}}>{label}</span>
      <span style={{fontWeight:sub?400:700,color:val>0?'var(--grn)':val<0?'var(--red)':'var(--tx)'}}>{val>0?'+':''}{fmt(val)}</span>
    </div>
  );

  return (
    <div>
      <div className="stats stats-3" style={{marginBottom:16}}>
        <Stat label="Operating CF" value={fmt(opCF)} color={opCF>=0?'var(--grn)':'var(--red)'} />
        <Stat label="Investing CF" value={fmt(invCF)} color={invCF>=0?'var(--grn)':'var(--red)'} />
        <Stat label="Net Cash Flow" value={fmt(netCF)} color={netCF>=0?'var(--grn)':'var(--red)'} />
      </div>
      <Card>
        <div style={{fontWeight:700,fontSize:14,marginBottom:16}}>Cash Flow Statement (Indirect Method)</div>
        <div style={{fontSize:10,fontWeight:800,color:'var(--grn)',textTransform:'uppercase',letterSpacing:.5,marginBottom:4}}>A. Operating Activities</div>
        <Row label="Net Profit / (Loss)" val={netP} sub />
        <Row label="Change in Debtors" val={dCh} sub />
        <Row label="Change in Creditors" val={crCh} sub />
        <Row label="Change in Stock" val={stCh} sub />
        <Row label="GST Payable" val={gstP} sub />
        <Row label="Net from Operating" val={opCF} />
        <div style={{fontSize:10,fontWeight:800,color:'var(--acc)',textTransform:'uppercase',letterSpacing:.5,margin:'12px 0 4px'}}>B. Investing Activities</div>
        <Row label="Fixed Asset Changes" val={invCF} sub />
        <Row label="Net from Investing" val={invCF} />
        <div style={{fontSize:10,fontWeight:800,color:'var(--blu)',textTransform:'uppercase',letterSpacing:.5,margin:'12px 0 4px'}}>C. Financing Activities</div>
        <Row label="Loans & Capital" val={finCF} sub />
        <Row label="Net from Financing" val={finCF} />
        <div style={{borderTop:'2px solid var(--bor)',marginTop:12,paddingTop:12}}>
          <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
            <span style={{fontWeight:700}}>Net Change in Cash</span>
            <span style={{fontWeight:800,fontSize:18,color:netCF>=0?'var(--grn)':'var(--red)'}}>{fmt(netCF)}</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontSize:12,color:'var(--tx2)'}}>
            <span>Opening Cash</span><span>{fmt(openC)}</span>
          </div>
          <div style={{display:'flex',justifyContent:'space-between',fontWeight:700,marginTop:4}}>
            <span>Closing Cash</span>
            <span style={{color:'var(--acc)',fontSize:15}}>{fmt(r2(openC+netCF))}</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function LedgerDrill({ name, journals }) {
  const { patch } = useStore();
  const txns=journals.flatMap(j=>(j.entries||[]).filter(e=>e.ledger===name).map(e=>({...j,dr:e.dr,cr:e.cr}))).sort((a,b)=>a.date?.localeCompare(b.date||''));
  let running=0;
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div><div style={{fontWeight:800,fontSize:16}}>{name}</div><div style={{fontSize:12,color:'var(--tx2)'}}>{txns.length} transactions</div></div>
        <Btn v="ghost" sz="sm" onClick={()=>patch({acTab:'trialbal',drillLedger:null})}>← Trial Balance</Btn>
      </div>
      {txns.length===0 ? <Empty icon="📋" title="No transactions" /> :
        <Table headers={['Date','Ref','Narration','Dr ₹','Cr ₹','Balance']}>
          {txns.map((t,i)=>{running=r2(running+t.dr-t.cr);return(
            <TR key={i}>
              <TD style={{color:'var(--tx2)',fontSize:11}}>{fmtDate(t.date)}</TD>
              <TD style={{color:'var(--acc)',fontWeight:700,fontSize:11}}>{t.ref}</TD>
              <TD style={{fontSize:11}}>{t.narration}</TD>
              <TD right style={{color:t.dr>0?'var(--red)':'var(--tx2)'}}>{t.dr>0?fmt(t.dr):'—'}</TD>
              <TD right style={{color:t.cr>0?'var(--grn)':'var(--tx2)'}}>{t.cr>0?fmt(t.cr):'—'}</TD>
              <TD right style={{fontWeight:700,color:running>=0?'var(--grn)':'var(--red)'}}>{fmt(Math.abs(running))} {running>=0?'Dr':'Cr'}</TD>
            </TR>
          );})}
        </Table>}
    </div>
  );
}

function JVList() {
  const { manual_journals, patch, save } = useStore();
  return (
    <div>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:16}}>
        <div style={{fontWeight:700}}>Manual Journal Vouchers ({manual_journals?.length||0})</div>
        <Alert v="info" style={{fontSize:11,padding:'4px 10px'}}>JV entry form — coming soon</Alert>
      </div>
      {!manual_journals?.length
        ? <Empty icon="✏️" title="No manual journals" sub="Add depreciation, provisions, bank charges or CA-requested adjustments" />
        : <Table headers={['Date','Ref','Narration','Lines','Dr Total','']}>
            {manual_journals.map(j=>(
              <TR key={j.id}>
                <TD style={{color:'var(--tx2)',fontSize:11}}>{fmtDate(j.date)}</TD>
                <TD style={{color:'var(--acc)',fontWeight:700,fontSize:11}}>{j.ref}</TD>
                <TD>{j.narration}</TD>
                <TD right>{j.entries?.length||0}</TD>
                <TD right style={{fontWeight:600}}>{fmt(r2(j.entries?.reduce((a,e)=>a+Number(e.dr||0),0)||0))}</TD>
                <TD><Btn v="red" sz="sm" onClick={async()=>{if(!confirm('Delete?'))return;patch(s=>({manual_journals:(s.manual_journals||[]).filter(x=>x.id!==j.id)}));await save();}}>🗑</Btn></TD>
              </TR>
            ))}
          </Table>}
    </div>
  );
}
