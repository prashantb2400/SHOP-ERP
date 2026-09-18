import React, { useEffect, Suspense, lazy } from 'react';
import { useStore } from './store/index.js';
import Topbar from './components/layout/Topbar.jsx';
import { ToastProvider, Loading } from './components/ui/index.jsx';
import InvoiceMode from './features/invoice/InvoiceMode.jsx';

const BusinessMode  = lazy(()=>import('./features/business/BusinessMode.jsx'));
const GSTMode       = lazy(()=>import('./features/gst/GSTMode.jsx'));
const InventoryMode = lazy(()=>import('./features/inventory/InventoryMode.jsx'));
const AccountsMode  = lazy(()=>import('./features/accounts/AccountsMode.jsx'));
const SetupWizardL  = lazy(()=>import('./features/settings/index.jsx').then(m=>({default:m.SetupWizard})));
const AuthScreenL   = lazy(()=>import('./features/settings/index.jsx').then(m=>({default:m.AuthScreen})));

function AppInner() {
  const { mode, firm, auth, load, initCloud, goOffline, dark, patch } = useStore();

  useEffect(()=>{
    (async()=>{
      await load();
      try {
        await initCloud();
      } catch {
        goOffline();
      }
    })();
  },[]);

  useEffect(()=>{
    document.documentElement.classList.toggle('dark',dark);
  },[dark]);

  useEffect(()=>{
    const on  = ()=>useStore.setState(s=>({auth:{...s.auth,offline:false}}));
    const off = ()=>useStore.setState(s=>({auth:{...s.auth,offline:true}}));
    window.addEventListener('online',on);
    window.addEventListener('offline',off);
    return ()=>{ window.removeEventListener('online',on); window.removeEventListener('offline',off); };
  },[]);

  if(auth.loading) return (
    <div style={{minHeight:'100vh',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',background:'var(--bg)',gap:20}}>
      <div style={{fontSize:32,fontWeight:800,color:'var(--tx)'}}>Retail<span style={{color:'var(--acc)'}}>Flow</span></div>
      <div className="spinner" />
      <div style={{color:'var(--tx2)',fontSize:13}}>Connecting…</div>
      <button onClick={goOffline}
        style={{marginTop:8,padding:'8px 20px',border:'1.5px solid var(--acc)',borderRadius:8,background:'var(--acb)',color:'var(--acc)',cursor:'pointer',fontSize:13,fontWeight:700}}>
        ✈️ Use Offline
      </button>
    </div>
  );

  if(!auth.offline && !auth.user) return (
    <Suspense fallback={<Loading msg="Loading auth…" />}>
      <AuthScreenL />
    </Suspense>
  );

  if(!firm) return (
    <Suspense fallback={<Loading msg="Loading…" />}>
      <SetupWizardL />
    </Suspense>
  );

  return (
    <div style={{minHeight:'100vh',background:'var(--bg)'}}>
      <Topbar />
      <main className="page">
        <Suspense fallback={<Loading />}>
          {mode==='invoice'   && <InvoiceMode />}
          {mode==='business'  && <BusinessMode />}
          {mode==='gst'       && <GSTMode />}
          {mode==='inventory' && <InventoryMode />}
          {mode==='accounts'  && <AccountsMode />}
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <>
      <ToastProvider />
      <AppInner />
    </>
  );
}
