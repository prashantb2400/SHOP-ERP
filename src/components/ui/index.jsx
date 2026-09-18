import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function Btn({ children, v='ghost', sz='md', onClick, disabled, className='', title, type='button', icon }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title}
      className={`btn btn-${v} btn-${sz} ${className}`}>
      {icon && <span style={{display:'inline-flex',alignItems:'center'}}>{icon}</span>}
      {children}
    </button>
  );
}

export function Card({ children, className='', onClick }) {
  return <div className={`card${onClick?' tr-click':''} ${className}`} onClick={onClick}>{children}</div>;
}

export function Badge({ children, v='default' }) {
  return <span className={`bdg bdg-${v}`}>{children}</span>;
}

export function Field({ label, required, children, hint }) {
  return (
    <div className="field">
      {label && <label>{label}{required && <span style={{color:'var(--red)',marginLeft:2}}>*</span>}</label>}
      {children}
      {hint && <span style={{fontSize:10.5,color:'var(--tx2)'}}>{hint}</span>}
    </div>
  );
}

export function Input({ label, required, hint, ...props }) {
  if (label) return (
    <Field label={label} required={required} hint={hint}>
      <input className="input" {...props} />
    </Field>
  );
  return <input className="input" {...props} />;
}

export function Select({ label, required, children, ...props }) {
  if (label) return (
    <Field label={label} required={required}>
      <select className="select" {...props}>{children}</select>
    </Field>
  );
  return <select className="select" {...props}>{children}</select>;
}

export function Modal({ onClose, children, maxWidth='520px' }) {
  useEffect(() => {
    const handleKey = e => { if (e.key === 'Escape') onClose?.(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{maxWidth}} onClick={e=>e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}

export function Alert({ children, v='info', className='' }) {
  return <div className={`alert alert-${v} ${className}`}>{children}</div>;
}

export function Stat({ label, value, sub, color='var(--acc)' }) {
  return (
    <div className="stat">
      <div className="stat-label">{label}</div>
      <div className="stat-value" style={{color}}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map(([k,v]) => (
        <button key={k} className={`tab${active===k?' on':''}`} onClick={()=>onChange(k)}>{v}</button>
      ))}
    </div>
  );
}

export function Table({ headers, children }) {
  return (
    <div className="tbl-wrap">
      <table className="tbl">
        <thead><tr>{headers.map((h,i)=><th key={i}>{h}</th>)}</tr></thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function TR({ children, onClick, className='' }) {
  return <tr className={`${onClick?'tr-click':''} ${className}`} onClick={onClick}>{children}</tr>;
}

export function TD({ children, right=false, mono=false, className='', style }) {
  return <td style={style} className={`${right?'td-r':''} ${mono?'td-mono':''} ${className}`}>{children}</td>;
}

export function TFoot({ children }) {
  return <tfoot><tr>{children}</tr></tfoot>;
}

export function Empty({ icon, title, sub, action }) {
  return (
    <div className="empty">
      <div className="empty-icon" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>
        {icon || (
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
            <path d="m3.3 7 8.7 5 8.7-5"/>
            <path d="M12 22V12"/>
          </svg>
        )}
      </div>
      <div className="empty-title">{title}</div>
      {sub && <div className="empty-sub">{sub}</div>}
      {action && <div style={{marginTop:4}}>{action}</div>}
    </div>
  );
}

export function Loading({ msg='Loading…' }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'55vh',gap:18,width:'100%',maxWidth:440,margin:'0 auto',padding:20}}>
      <div style={{width:'100%',display:'flex',flexDirection:'column',gap:10}}>
        <div className="skeleton" style={{height:28,width:'40%'}} />
        <div className="skeleton" style={{height:80,width:'100%'}} />
        <div style={{display:'flex',gap:10}}>
          <div className="skeleton" style={{height:60,flex:1}} />
          <div className="skeleton" style={{height:60,flex:1}} />
        </div>
      </div>
      <div style={{color:'var(--tx2)',fontSize:12.5,fontWeight:600}}>{msg}</div>
    </div>
  );
}

/* ── Toast (Sonner-Grade Aesthetics) ───────────────────────── */
let _add = null;
export function toast(msg, type='info', dur=3000) {
  _add?.({msg, type, dur, id: Math.random().toString(36).slice(2, 7)});
}

const ToastIcon = ({ type }) => {
  if (type === 'success') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--grn)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    );
  }
  if (type === 'error') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    );
  }
  if (type === 'warn') {
    return (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ylw)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    );
  }
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--acc)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
};

export function ToastProvider() {
  const [list, setList] = useState([]);
  useEffect(() => {
    _add = t => {
      setList(p => [...p, t]);
      setTimeout(() => setList(p => p.filter(x => x.id !== t.id)), t.dur || 3000);
    };
    return () => { _add = null; };
  }, []);

  return createPortal(
    <div style={{position:'fixed',bottom:20,right:20,zIndex:9999,display:'flex',flexDirection:'column',gap:8,pointerEvents:'none'}}>
      {list.map(t => (
        <div key={t.id} onClick={() => setList(p => p.filter(x => x.id !== t.id))}
          style={{
            display:'flex',alignItems:'center',gap:10,padding:'10px 16px',borderRadius:10,
            border:'1px solid var(--bor)',background:'var(--surf)',
            boxShadow:'var(--shlg)',fontSize:13,fontWeight:600,pointerEvents:'auto',cursor:'pointer',
            maxWidth:340,animation:'modalSpring 220ms var(--ease-out)'
          }}>
          <ToastIcon type={t.type} />
          <span style={{color:'var(--tx)'}}>{t.msg}</span>
        </div>
      ))}
    </div>,
    document.body
  );
}
