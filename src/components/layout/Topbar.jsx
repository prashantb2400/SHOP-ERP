import React, { useState } from 'react';
import { useStore } from '../../store/index.js';

const Icons = {
  invoice: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  business: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  ),
  gst: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  inventory: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>
    </svg>
  ),
  accounts: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-2.5-2.5Z"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/>
    </svg>
  ),
};

const MODES = [
  ['invoice',   'Invoice'],
  ['business',  'Business'],
  ['gst',       'GST'],
  ['inventory', 'Stock'],
  ['accounts',  'Accounts'],
];

const SyncDot = ({ status }) => {
  const c = { syncing:'var(--ylw)', ok:'var(--grn)', err:'var(--red)' }[status];
  if (!c) return null;
  const isSyncing = status === 'syncing';
  return (
    <span
      className={isSyncing ? 'sync-dot-pulse' : ''}
      style={{width:8,height:8,borderRadius:'50%',background:c,display:'inline-block',flexShrink:0}}
      title={`Cloud sync: ${status}`}
    />
  );
};

export default function Topbar() {
  const { mode, setMode, dark, setDark, invQuickMode, toggleQuick, auth, signOut, firm } = useStore();
  const [open, setOpen] = useState(false);
  const user = auth.user;
  const avatar = user?.name?.[0]?.toUpperCase() || '?';

  return (
    <>
      {/* Drawer backdrop */}
      <div className={`drawer-bg${open?' open':''}`} onClick={()=>setOpen(false)} />

      {/* Drawer */}
      <nav className={`drawer${open?' open':''}`}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'16px 20px',borderBottom:'1px solid var(--bor)'}}>
          <div className="logo">Retail<span>Flow</span></div>
          <button onClick={()=>setOpen(false)} style={{background:'none',border:'none',cursor:'pointer',fontSize:18,color:'var(--tx2)'}}>✕</button>
        </div>
        <div style={{flex:1,overflowY:'auto',padding:'10px 0'}}>
          {MODES.map(([m,label])=>(
            <button key={m} onClick={()=>{setMode(m);setOpen(false);}}
              style={{width:'100%',textAlign:'left',padding:'12px 20px',border:'none',cursor:'pointer',
                fontSize:13,fontWeight:600,display:'flex',alignItems:'center',gap:10,
                background:mode===m?'var(--acb)':'transparent',color:mode===m?'var(--acc)':'var(--tx)',
                transition:'all 140ms ease'}}>
              <span style={{color:mode===m?'var(--acc)':'var(--tx2)'}}>{Icons[m]}</span>
              {label}
            </button>
          ))}
        </div>
        <div style={{padding:'16px 20px',borderTop:'1px solid var(--bor)'}}>
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
            className="btn btn-ghost"
            style={{width:'100%',fontSize:12.5,color:user?'var(--red)':'var(--tx)'}}>
            {user ? 'Sign out' : 'Sign in'}
          </button>
        </div>
      </nav>

      {/* Topbar */}
      <header className="topbar no-print">
        <div style={{display:'flex',alignItems:'center',gap:12,minWidth:0}}>
          {/* Hamburger */}
          <button onClick={()=>setOpen(true)}
            aria-label="Open Navigation Menu"
            style={{background:'none',border:'none',cursor:'pointer',display:'flex',flexDirection:'column',gap:4,padding:4,flexShrink:0}}>
            {[0,1,2].map(i=><span key={i} style={{width:18,height:2,background:'var(--tx)',borderRadius:1,display:'block'}} />)}
          </button>

          <div className="logo" style={{flexShrink:0}}>Retail<span>Flow</span></div>

          <div className="mode-tabs" style={{marginLeft:8}}>
            {MODES.map(([m,label])=>(
              <button key={m} className={`mode-tab${mode===m?' on':''}`} onClick={()=>setMode(m)}>
                {Icons[m]}
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div style={{display:'flex',alignItems:'center',gap:10,flexShrink:0}}>
          <SyncDot status={auth.syncStatus} />

          {/* Quick mode toggle (invoice only) */}
          {mode==='invoice' && (
            <div className={`qm-toggle${invQuickMode?' on':''}`} onClick={toggleQuick} title="Toggle quick billing">
              <span className="qm-dot" />
              <span style={{fontSize:11.5,display:'inline-flex',alignItems:'center',gap:4}}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                </svg>
                {invQuickMode ? 'Quick' : 'Full'}
              </span>
            </div>
          )}

          {/* Firm name */}
          {firm?.firm_name && (
            <span style={{fontSize:11,color:'var(--tx2)',maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'none'}} className="desktop-only">
              {firm.firm_name}
            </span>
          )}

          {/* Dark toggle */}
          <button onClick={()=>setDark(!dark)}
            aria-label="Toggle dark mode"
            className="btn btn-ghost"
            style={{width:34,height:34,padding:0,borderRadius:8}}>
            {dark ? (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
              </svg>
            ) : (
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            )}
          </button>

          {/* Avatar */}
          <div style={{width:34,height:34,borderRadius:'50%',background:'var(--acc)',color:'#fff',
            display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,fontSize:13,cursor:'pointer',boxShadow:'var(--sh)'}}
            onClick={()=>setOpen(true)}>
            {avatar}
          </div>
        </div>
      </header>
    </>
  );
}
