import React from 'react';
import { createPortal } from 'react-dom';

export function Btn({ children, v='ghost', sz='md', onClick, disabled, className='', title, type='button' }) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} title={title}
      className={`btn btn-${v} btn-${sz} ${className}`}>
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
      {hint && <span style={{fontSize:10,color:'var(--tx2)'}}>{hint}</span>}
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

export function TD({ children, right=false, mono=false, className='' }) {
  return <td className={`${right?'td-r':''} ${mono?'td-mono':''} ${className}`}>{children}</td>;
}

export function TFoot({ children }) {
  return <tfoot><tr>{children}</tr></tfoot>;
}

export function Empty({ icon='📦', title, sub, action }) {
  return (
    <div className="empty">
      <div className="empty-icon">{icon}</div>
      <div className="empty-title">{title}</div>
      {sub && <div className="empty-sub">{sub}</div>}
      {action}
    </div>
  );
}

export function Loading({ msg='Loading…' }) {
  return (
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',minHeight:'60vh',gap:16}}>
      <div className="spinner" />
      <div style={{color:'var(--tx2)',fontSize:13}}>{msg}</div>
    </div>
  );
}

/* ── Toast ────────────────────────────────────────────────── */
let _add = null;
export function toast(msg, type='info', dur=3000) {
  _add?.({msg, type, dur, id:uid_toast()});
}
const uid_toast = () => Math.random().toString(36).slice(2,7);

export function ToastProvider() {
  const [list, setList] = React.useState([]);
  React.useEffect(() => {
    _add = t => {
      setList(p=>[...p,t]);
      setTimeout(()=>setList(p=>p.filter(x=>x.id!==t.id)), t.dur||3000);
    };
    return ()=>{ _add=null; };
  }, []);
  const cols = {success:'var(--gnb)',error:'var(--rdb)',warn:'var(--ylb)',info:'var(--surf)'};
  const bors = {success:'var(--grn)',error:'var(--red)',warn:'var(--ylw)',info:'var(--bor)'};
  const icos = {success:'✓',error:'✕',warn:'⚠',info:'ℹ'};
  return createPortal(
    <div style={{position:'fixed',bottom:16,right:16,zIndex:9999,display:'flex',flexDirection:'column',gap:8,pointerEvents:'none'}}>
      {list.map(t=>(
        <div key={t.id} onClick={()=>setList(p=>p.filter(x=>x.id!==t.id))}
          style={{display:'flex',alignItems:'center',gap:8,padding:'10px 16px',borderRadius:10,
            border:`1.5px solid ${bors[t.type]||bors.info}`,background:cols[t.type]||cols.info,
            boxShadow:'var(--shlg)',fontSize:13,fontWeight:600,pointerEvents:'auto',cursor:'pointer',
            animation:'modalIn .2s ease',maxWidth:320}}>
          <span>{icos[t.type]||icos.info}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>,
    document.body
  );
}
