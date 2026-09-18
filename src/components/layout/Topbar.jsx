import React, { useState } from 'react';
import { useStore } from '../../store/index.js';
import { Btn } from '../ui/index.jsx';

const MODES = [
  ['invoice',   '🧾 Invoice'],
  ['business',  '💼 Business'],
  ['gst',       '📊 GST'],
  ['inventory', '📦 Stock'],
  ['accounts',  '📒 Accounts'],
];

export default function Topbar() {
  const { mode, setMode, dark, setDark, invQuickMode, toggleQuick, auth, signOut, firm } = useStore();
  const [open, setOpen] = useState(false);
  const user = auth.user;
  const avatar = user?.name?.[0]?.toUpperCase() || '?';

  const SyncDot = () => {
    const c = { syncing:'var(--ylw)', ok:'var(--grn)', err:'var(--red)' }[auth.syncStatus];
    if (!c) return null;
    return <span style={{width:8,height:8,borderRadius:'50%',background:c,display:'inline-block',flexShrink:0}} title={auth.syncStatus} />;
  };

  return (
    <>
      {/* Drawer backdrop */}
      <div className={`drawer-bg${open?' open':''}`} onClick={()=>setOpen(false)} />

      {/* Drawer */}
      <nav className={`drawer${open?' open':''}`}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px',borderBottom:'1.5px solid var(--bor)'}}>
          <div className="logo">Retail<span>Flow</span></div>
          <button onClick={()=>setOpen(false)} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:'var(--tx2)'}}>✕</button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'8px 0'}}>
          {MODES.map(([m,label])=>(
            <button key={m} onClick={()=>{setMode(m);setOpen(false);}}
              style={{width:'100%',textAlign:'left',padding:'12px 20px',border:'none',cursor:'pointer',
                fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:8,
                background:mode===m?'var(--acb)':'transparent',color:mode===m?'var(--acc)':'var(--tx)',
                transition:'all .12s'}}>
              {label}
            </button>
          ))}
        </div>
        <div style={{padding:'16px',borderTop:'1.5px solid var(--bor)'}}>
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
            <div style={{width:36,height:36,borderRadius:'50%',background:'var(--acc)',color:'#fff',
              display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,flexShrink:0}}>
              {avatar}
            </div>
            <div style={{minWidth:0}}>
              <div style={{fontWeight:700,fontSize:13,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{user?.name||'Offline'}</div>
              <div style={{fontSize:11,color:'var(--tx2)',overflow:'hidden',textOverflow:'ellipsis'}}>{user?.email||'Local only'}</div>
            </div>
          </div>
          <button onClick={()=>{user?signOut():setMode('auth');setOpen(false);}}
            style={{width:'100%',padding:'8px',border:'1.5px solid var(--red)',borderRadius:8,
              background:'transparent',color:'var(--red)',cursor:'pointer',fontSize:13,fontWeight:600}}>
            {user?'🚪 Sign out':'🔑 Sign in'}
          </button>
        </div>
      </nav>

      {/* Topbar */}
      <header className="topbar no-print">
        <div style={{display:'flex',alignItems:'center',gap:10,minWidth:0}}>
          {/* Hamburger */}
          <button onClick={()=>setOpen(true)}
            style={{background:'none',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',gap:4,padding:4,flexShrink:0}}>
            {[0,1,2].map(i=><span key={i} style={{width:20,height:2,background:'var(--tx)',borderRadius:1,display:'block'}} />)}
          </button>

          <div className="logo" style={{flexShrink:0}}>Retail<span>Flow</span></div>

          <div className="mode-tabs" style={{marginLeft:4}}>
            {MODES.map(([m,label])=>(
              <button key={m} className={`mode-tab${mode===m?' on':''}`} onClick={()=>setMode(m)}>{label}</button>
            ))}
          </div>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:8,flexShrink:0}}>
          <SyncDot />

          {/* Quick mode toggle (invoice only) */}
          {mode==='invoice' && (
            <div className={`qm-toggle${invQuickMode?' on':''}`} onClick={toggleQuick} title="Toggle quick billing">
              <span className="qm-dot" />
              <span style={{fontSize:11}}>{invQuickMode?'⚡ Quick':'🔧 Full'}</span>
            </div>
          )}

          {/* Firm name */}
          {firm?.firm_name && (
            <span style={{fontSize:11,color:'var(--tx2)',maxWidth:110,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'none'}} className="desktop-only">
              {firm.firm_name}
            </span>
          )}

          {/* Dark toggle */}
          <button onClick={()=>setDark(!dark)}
            style={{width:34,height:34,borderRadius:8,border:'none',background:'var(--surf2)',
              cursor:'pointer',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center'}}>
            {dark?'☀️':'🌙'}
          </button>

          {/* Avatar */}
          <div style={{width:34,height:34,borderRadius:'50%',background:'var(--acc)',color:'#fff',
            display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,cursor:'pointer'}}
            onClick={()=>setOpen(true)}>
            {avatar}
          </div>
        </div>
      </header>
    </>
  );
}
