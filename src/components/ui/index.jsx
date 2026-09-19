import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  TrendingDown,
  Search,
  X,
  Layers,
  Sparkles,
  Loader2
} from 'lucide-react';

/* ── Buttons (Emil Kowalski Tactile Dynamics) ─────────────── */
export function Btn({
  children,
  v = 'ghost',
  sz = 'md',
  onClick,
  disabled = false,
  loading = false,
  className = '',
  title,
  type = 'button',
  icon,
  iconRight,
  style
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      title={title}
      style={style}
      className={`btn btn-${v} btn-${sz} ${className}`}
    >
      {loading ? (
        <Loader2 className="animate-spin" size={sz === 'sm' ? 12 : sz === 'lg' ? 18 : 14} style={{ animation: 'spin 1s linear infinite' }} />
      ) : (
        icon && <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{icon}</span>
      )}
      {children}
      {iconRight && !loading && (
        <span style={{ display: 'inline-flex', alignItems: 'center', flexShrink: 0 }}>{iconRight}</span>
      )}
    </button>
  );
}

/* ── Bezel Card (Hardware Doppelrand Enclosure) ──────────── */
export function BezelCard({ children, className = '', innerClassName = '', style, onClick }) {
  return (
    <div
      style={style}
      className={`bezel-outer ${onClick ? 'tr-click' : ''} ${className}`}
      onClick={onClick}
    >
      <div className={`bezel-inner ${innerClassName}`}>
        {children}
      </div>
    </div>
  );
}

/* ── Standard Card ───────────────────────────────────────── */
export function Card({ children, className = '', onClick, refract = false, flat = false, style }) {
  const cls = refract ? 'card-refract' : flat ? 'card-flat' : 'card';
  return (
    <div
      style={style}
      className={`${cls}${onClick ? ' tr-click' : ''} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}

/* ── Badges ──────────────────────────────────────────────── */
export function Badge({ children, v = 'default', dot = false, pulse = false, className = '' }) {
  const dotColor = {
    default: 'var(--tx3)',
    pri: 'var(--acc)',
    grn: 'var(--grn)',
    red: 'var(--red)',
    ylw: 'var(--ylw)',
    blu: 'var(--blu)',
    pur: '#8b5cf6',
    acc: 'var(--acc)'
  }[v] || 'var(--tx3)';

  return (
    <span className={`bdg bdg-${v} ${className}`}>
      {dot && (
        <span
          className={`badge-dot ${pulse ? 'pulse' : ''}`}
          style={{ background: dotColor }}
        />
      )}
      {children}
    </span>
  );
}

/* ── Form Fields & Inputs ────────────────────────────────── */
export function Field({ label, required, children, hint, error }) {
  return (
    <div className="field">
      {label && (
        <label>
          {label}
          {required && <span style={{ color: 'var(--red)', marginLeft: 3 }}>*</span>}
        </label>
      )}
      {children}
      {error ? (
        <span style={{ fontSize: 11, color: 'var(--red)', fontWeight: 600 }}>{error}</span>
      ) : hint ? (
        <span style={{ fontSize: 11, color: 'var(--tx2)' }}>{hint}</span>
      ) : null}
    </div>
  );
}

export function Input({ label, required, hint, error, icon, rightElement, className = '', ...props }) {
  const inputEl = (
    <div className="input-wrap">
      {icon && <span className="input-icon-left">{icon}</span>}
      <input
        className={`input ${icon ? 'has-left-icon' : ''} ${rightElement ? 'has-right-icon' : ''} ${className}`}
        {...props}
      />
      {rightElement && <span className="input-icon-right">{rightElement}</span>}
    </div>
  );

  if (label) {
    return (
      <Field label={label} required={required} hint={hint} error={error}>
        {inputEl}
      </Field>
    );
  }
  return inputEl;
}

export function Select({ label, required, children, className = '', ...props }) {
  if (label) {
    return (
      <Field label={label} required={required}>
        <select className={`select ${className}`} {...props}>
          {children}
        </select>
      </Field>
    );
  }
  return (
    <select className={`select ${className}`} {...props}>
      {children}
    </select>
  );
}

/* ── Modal Dialog ────────────────────────────────────────── */
export function Modal({ onClose, children, maxWidth = '540px' }) {
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth }} onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  );
}

/* ── Alert Callout ───────────────────────────────────────── */
export function Alert({ children, v = 'info', className = '', icon }) {
  const IconComp = icon || {
    info: <Info size={16} strokeWidth={2.2} />,
    warn: <AlertTriangle size={16} strokeWidth={2.2} />,
    err: <AlertCircle size={16} strokeWidth={2.2} />,
    ok: <CheckCircle2 size={16} strokeWidth={2.2} />
  }[v] || <Info size={16} strokeWidth={2.2} />;

  return (
    <div className={`alert alert-${v} ${className}`} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span style={{ flexShrink: 0, display: 'inline-flex' }}>{IconComp}</span>
      <div style={{ flex: 1, minWidth: 0 }}>{children}</div>
    </div>
  );
}

/* ── Stat Metric Display ─────────────────────────────────── */
export function Stat({
  label,
  value,
  sub,
  color = 'var(--acc)',
  hero = false,
  trend,
  trendUp = true,
  action,
  icon,
  className = ''
}) {
  return (
    <div className={`${hero ? 'stat-hero' : 'stat'} ${className}`}>
      <div className="stat-label">
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          {icon && <span style={{ color: 'var(--tx3)' }}>{icon}</span>}
          {label}
        </span>
        {trend && (
          <span className={`stat-trend ${trendUp ? 'stat-trend-up' : 'stat-trend-down'}`}>
            {trendUp ? <TrendingUp size={11} strokeWidth={2.5} /> : <TrendingDown size={11} strokeWidth={2.5} />}
            {trend}
          </span>
        )}
        {action}
      </div>
      <div className="stat-value num-mono" style={{ color }}>{value}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}

/* ── Segmented Control Tabs ──────────────────────────────── */
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tabs">
      {tabs.map(([k, v, icon]) => (
        <button
          key={k}
          type="button"
          className={`tab${active === k ? ' on' : ''}`}
          onClick={() => onChange(k)}
        >
          {icon && <span style={{ marginRight: 6, display: 'inline-flex' }}>{icon}</span>}
          {v}
        </button>
      ))}
    </div>
  );
}

/* ── Divided Data Table (Fintech Standard) ─────────────────── */
export function Table({ headers, children, fintech = false, className = '' }) {
  if (fintech) {
    return (
      <div style={{ overflowX: 'auto', width: '100%', WebkitOverflowScrolling: 'touch' }}>
        <table className={`tbl-fintech ${className}`}>
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    );
  }
  return (
    <div className="tbl-wrap">
      <table className={`tbl ${className}`}>
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}

export function TR({ children, onClick, className = '' }) {
  return (
    <tr className={`${onClick ? 'tr-click' : ''} ${className}`} onClick={onClick}>
      {children}
    </tr>
  );
}

export function TD({ children, right = false, mono = false, className = '', style }) {
  return (
    <td
      style={style}
      className={`${right ? 'td-r ' : ''}${mono ? 'td-mono num-mono ' : ''}${className}`}
    >
      {children}
    </td>
  );
}

export function TFoot({ children }) {
  return <tfoot><tr>{children}</tr></tfoot>;
}

/* ── Empty State ─────────────────────────────────────────── */
export function Empty({ icon, title, sub, action }) {
  return (
    <div className="empty">
      <div className="empty-icon" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {icon || <Layers size={40} strokeWidth={1.5} />}
      </div>
      <div className="empty-title">{title}</div>
      {sub && <div className="empty-sub">{sub}</div>}
      {action && <div style={{ marginTop: 6 }}>{action}</div>}
    </div>
  );
}

/* ── Skeletal Loading State ──────────────────────────────── */
export function Loading({ msg = 'Loading…' }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '50vh',
        gap: 20,
        width: '100%',
        maxWidth: 440,
        margin: '0 auto',
        padding: 24
      }}
    >
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="skeleton" style={{ height: 32, width: '45%' }} />
        <div className="skeleton" style={{ height: 90, width: '100%' }} />
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="skeleton" style={{ height: 64, flex: 1 }} />
          <div className="skeleton" style={{ height: 64, flex: 1 }} />
        </div>
      </div>
      <div style={{ color: 'var(--tx2)', fontSize: 13, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
        <Loader2 className="animate-spin" size={14} style={{ animation: 'spin 1s linear infinite' }} />
        {msg}
      </div>
    </div>
  );
}

/* ── Toast Notification System (Sonner Spec) ─────────────── */
let _addToast = null;
export function toast(msg, type = 'info', dur = 3200) {
  _addToast?.({ msg, type, dur, id: Math.random().toString(36).slice(2, 7) });
}

function ToastIcon({ type }) {
  if (type === 'success') {
    return <CheckCircle2 size={16} strokeWidth={2.5} style={{ color: 'var(--grn)', flexShrink: 0 }} />;
  }
  if (type === 'error') {
    return <AlertCircle size={16} strokeWidth={2.5} style={{ color: 'var(--red)', flexShrink: 0 }} />;
  }
  if (type === 'warn') {
    return <AlertTriangle size={16} strokeWidth={2.5} style={{ color: 'var(--ylw)', flexShrink: 0 }} />;
  }
  return <Info size={16} strokeWidth={2.5} style={{ color: 'var(--acc)', flexShrink: 0 }} />;
}

export function ToastProvider() {
  const [list, setList] = useState([]);
  useEffect(() => {
    _addToast = (t) => {
      setList((p) => [...p, t]);
      setTimeout(() => setList((p) => p.filter((x) => x.id !== t.id)), t.dur || 3200);
    };
    return () => {
      _addToast = null;
    };
  }, []);

  return createPortal(
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        pointerEvents: 'none'
      }}
    >
      {list.map((t) => (
        <div
          key={t.id}
          onClick={() => setList((p) => p.filter((x) => x.id !== t.id))}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            padding: '12px 18px',
            borderRadius: 'var(--r)',
            border: '1px solid var(--bor)',
            background: 'var(--surf)',
            boxShadow: 'var(--shlg)',
            fontSize: 13,
            fontWeight: 600,
            pointerEvents: 'auto',
            cursor: 'pointer',
            maxWidth: 380,
            animation: 'modalSpring 220ms var(--ease-out)'
          }}
        >
          <ToastIcon type={t.type} />
          <span style={{ color: 'var(--tx)', flex: 1, lineHeight: 1.4 }}>{t.msg}</span>
          <X size={14} style={{ color: 'var(--tx3)' }} />
        </div>
      ))}
    </div>,
    document.body
  );
}

/* ── Command Palette (Spotlight Search Modal) ─────────────── */
function CommandPaletteInner({ onClose, actions = [] }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filteredActions = actions.filter((act) => {
    const q = query.toLowerCase().trim();
    if (!q) return true;
    return (
      act.title.toLowerCase().includes(q) ||
      (act.desc && act.desc.toLowerCase().includes(q)) ||
      (act.category && act.category.toLowerCase().includes(q))
    );
  });

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % (filteredActions.length || 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % (filteredActions.length || 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredActions[selectedIndex]) {
        filteredActions[selectedIndex].onSelect();
        onClose();
      }
    }
  };

  return createPortal(
    <div className="cmd-backdrop" onClick={onClose}>
      <div className="cmd-modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
        <div className="cmd-search-wrap">
          <Search size={18} style={{ color: 'var(--tx3)' }} />
          <input
            ref={inputRef}
            className="cmd-search-input"
            placeholder="Type a command or jump to feature…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
          />
          <span className="kbd-shortcut">ESC</span>
        </div>

        <div className="cmd-list">
          {filteredActions.length === 0 ? (
            <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--tx3)', fontSize: 13 }}>
              No commands found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            filteredActions.map((act, index) => {
              const isSelected = index === selectedIndex;
              return (
                <button
                  key={act.id || act.title}
                  type="button"
                  className={`cmd-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => {
                    act.onSelect();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  {act.icon || <Sparkles size={16} />}
                  <span style={{ fontWeight: 600 }}>{act.title}</span>
                  {act.desc && <span className="cmd-item-desc">{act.desc}</span>}
                  {act.shortcut && <span className="kbd-shortcut">{act.shortcut}</span>}
                </button>
              );
            })
          )}
        </div>

        <div className="cmd-footer">
          <span>Navigate with <kbd>↑</kbd> <kbd>↓</kbd></span>
          <span>Select with <kbd>↵</kbd></span>
        </div>
      </div>
    </div>,
    document.body
  );
}

export function CommandPalette({ isOpen, onClose, actions = [] }) {
  if (!isOpen) return null;
  return <CommandPaletteInner onClose={onClose} actions={actions} />;
}


