import React, { useState } from 'react';
import { useStore } from '../../store/index.js';
import { Card, Btn, Field, Alert, toast } from '../../components/ui/index.jsx';
import { STATES, BUSINESS_NATURES } from '../../lib/constants.js';

/* ── Setup Wizard ────────────────────────────────────────── */
export function SetupWizard() {
  const { save, patch } = useStore();
  const [f, setF] = useState({
    firm_name:'', gstin:'', address:'', state:'', phone:'', email:'',
    upi_id:'', bank_name:'', account_no:'', ifsc:'',
    gst_registered:true, business_nature:'retail',
    billing_type:'retail', inv_prefix:'INV', default_gst_rate:18,
  });
  const upd = p => setF(x=>({...x,...p}));

  const finish = async () => {
    if (!f.firm_name?.trim()) { toast('Business name is required','error'); return; }
    patch({firm:f});
    await save();
    toast('Welcome to RetailFlow! 🎉','success');
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',padding:16}}>
      <div style={{width:'100%',maxWidth:480}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{fontSize:32,fontWeight:800,color:'var(--tx)'}}>Retail<span style={{color:'var(--acc)'}}>Flow</span></div>
          <div style={{fontSize:14,color:'var(--tx2)',marginTop:4}}>Set up your business to get started</div>
        </div>
        <Card>
          <div style={{display:'flex',flexDirection:'column',gap:14}}>
            <Field label="Business / Firm Name" required>
              <input className="input" value={f.firm_name} onChange={e=>upd({firm_name:e.target.value})} placeholder="e.g. Sharma General Store" />
            </Field>

            <Field label="Business Type">
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {BUSINESS_NATURES.map(n=>(
                  <button key={n.value} onClick={()=>upd({business_nature:n.value})}
                    style={{padding:'8px 10px',fontSize:12,fontWeight:600,borderRadius:8,cursor:'pointer',textAlign:'left',
                      background:f.business_nature===n.value?'var(--acb)':'transparent',
                      border:`1.5px solid ${f.business_nature===n.value?'var(--acc)':'var(--bor)'}`,
                      color:f.business_nature===n.value?'var(--acc)':'var(--tx2)'}}>
                    {n.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field label="State">
              <select className="select" value={f.state} onChange={e=>upd({state:e.target.value})}>
                <option value="">— Select your state —</option>
                {STATES.map(s=><option key={s}>{s}</option>)}
              </select>
            </Field>

            <label style={{display:'flex',alignItems:'center',gap:10,cursor:'pointer'}}>
              <input type="checkbox" checked={f.gst_registered} onChange={e=>upd({gst_registered:e.target.checked})} style={{width:16,height:16}} />
              <span style={{fontSize:13,fontWeight:600}}>GST Registered</span>
            </label>

            {f.gst_registered && (
              <Field label="GSTIN">
                <input className="input" value={f.gstin} onChange={e=>upd({gstin:e.target.value.toUpperCase()})} placeholder="e.g. 09AABCU9603R1ZX" maxLength={15} />
              </Field>
            )}

            <Field label="Phone">
              <input className="input" type="tel" value={f.phone} onChange={e=>upd({phone:e.target.value})} placeholder="10-digit mobile" />
            </Field>

            <Field label="Address">
              <input className="input" value={f.address} onChange={e=>upd({address:e.target.value})} placeholder="Shop / office address" />
            </Field>

            <Field label="UPI ID" hint="Shown on invoices for payment QR">
              <input className="input" value={f.upi_id} onChange={e=>upd({upi_id:e.target.value})} placeholder="shopname@upi" />
            </Field>

            <Btn v="pri" sz="lg" onClick={finish} style={{justifyContent:'center',marginTop:4}}>
              Get Started →
            </Btn>
          </div>
        </Card>
      </div>
    </div>
  );
}

/* ── Auth Screen ─────────────────────────────────────────── */
export function AuthScreen() {
  const { signIn, signUp, googleIn, goOffline, auth } = useStore();
  const [screen, setScreen] = useState('login');
  const [email,  setEmail]  = useState('');
  const [pw,     setPw]     = useState('');
  const [busy,   setBusy]   = useState(false);
  const [err,    setErr]    = useState('');

  const handle = async fn => {
    setBusy(true); setErr('');
    try {
      const res = await fn();
      if (res?.error) setErr(res.error);
    } catch(e) { setErr(e.message||'Unknown error'); }
    setBusy(false);
  };

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)',padding:16}}>
      <div style={{width:'100%',maxWidth:360}}>
        <div style={{textAlign:'center',marginBottom:32}}>
          <div style={{fontSize:32,fontWeight:800}}>Retail<span style={{color:'var(--acc)'}}>Flow</span></div>
          <div style={{fontSize:13,color:'var(--tx2)',marginTop:4}}>GST invoicing for Indian businesses</div>
        </div>
        <Card>
          <div style={{fontWeight:700,fontSize:16,textAlign:'center',marginBottom:16}}>
            {screen==='login'?'Sign In':'Create Account'}
          </div>
          {err && <Alert v="error" style={{marginBottom:12}}>{err}</Alert>}
          <div style={{display:'flex',flexDirection:'column',gap:10,marginBottom:14}}>
            <Field label="Email">
              <input className="input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com" />
            </Field>
            <Field label="Password">
              <input className="input" type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="••••••••" />
            </Field>
          </div>
          <Btn v="pri" sz="lg" disabled={busy} onClick={()=>handle(()=>screen==='login'?signIn(email,pw):signUp(email,pw))}
            style={{width:'100%',justifyContent:'center',marginBottom:10}}>
            {busy?'…':screen==='login'?'Sign In':'Create Account'}
          </Btn>
          <div style={{textAlign:'center',fontSize:12,color:'var(--tx2)',margin:'10px 0',position:'relative'}}>
            <span style={{background:'var(--surf)',padding:'0 8px',position:'relative',zIndex:1}}>or</span>
            <div style={{position:'absolute',top:'50%',left:0,right:0,height:1,background:'var(--bor)'}} />
          </div>
          <Btn v="ghost" sz="md" disabled={busy} onClick={()=>handle(googleIn)} style={{width:'100%',justifyContent:'center',marginBottom:14}}>
            🌐 Continue with Google
          </Btn>
          <div style={{textAlign:'center',fontSize:13}}>
            {screen==='login'
              ? <>No account? <button onClick={()=>setScreen('signup')} style={{background:'none',border:'none',color:'var(--acc)',cursor:'pointer',fontWeight:600}}>Create one</button></>
              : <>Have an account? <button onClick={()=>setScreen('login')} style={{background:'none',border:'none',color:'var(--acc)',cursor:'pointer',fontWeight:600}}>Sign in</button></>}
          </div>
        </Card>
        <div style={{textAlign:'center',marginTop:16}}>
          <button onClick={goOffline} style={{background:'none',border:'none',color:'var(--tx2)',cursor:'pointer',fontSize:13,textDecoration:'underline'}}>
            ✈️ Continue without account (offline)
          </button>
        </div>
      </div>
    </div>
  );
}
