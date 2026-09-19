import React from 'react';
import { useStore } from '../../store/index.js';
import {
  Receipt,
  BarChart3,
  Boxes,
  BookOpen,
  FileSpreadsheet,
  LogOut,
  LogIn,
  X,
  Sparkles,
  CircleDot,
  ChevronsUpDown
} from 'lucide-react';

const NAV_ITEMS = [
  {
    group: 'CORE COMMERCE',
    items: [
      { id: 'invoice', label: 'POS Billing', icon: <Receipt size={17} strokeWidth={2} />, desc: 'Invoices, Quots & Returns' },
      { id: 'business', label: 'Intelligence', icon: <BarChart3 size={17} strokeWidth={2} />, desc: 'Bento Telemetry & Receivables' }
    ]
  },
  {
    group: 'OPERATIONS & LEDGERS',
    items: [
      { id: 'inventory', label: 'Inventory Master', icon: <Boxes size={17} strokeWidth={2} />, desc: 'Stock, Batches & Godowns' },
      { id: 'accounts', label: 'Accounts Ledger', icon: <BookOpen size={17} strokeWidth={2} />, desc: 'Party Balances & Cashbook' },
      { id: 'gst', label: 'GST Compliance', icon: <FileSpreadsheet size={17} strokeWidth={2} />, desc: 'GSTR-1, 3B & ITC Reconciliation' }
    ]
  }
];

export default function Sidebar({ isOpen, onClose, onOpenFirmSwitcher, onOpenFirmDetails }) {
  const { mode, setMode, firm, auth, signOut } = useStore();
  const user = auth.user;
  const firmInitial = firm?.firm_name?.[0]?.toUpperCase() || 'R';

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className={`sidebar-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className={`app-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-brand-icon">
              <Sparkles size={18} strokeWidth={2.5} />
            </div>
            <div>
              <div className="sidebar-brand-text">Retail<span>Flow</span></div>
              <div style={{ fontSize: 10.5, color: 'var(--tx3)', fontWeight: 600, letterSpacing: '0.04em' }}>
                ENTERPRISE ERP
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            style={{ width: 28, height: 28, padding: 0, display: 'none' }}
            title="Close navigation"
          >
            <X size={16} />
          </button>
        </div>

        {/* Navigation Groups */}
        <div className="sidebar-content">
          {NAV_ITEMS.map((group) => (
            <div key={group.group} className="sidebar-nav-group">
              <div className="sidebar-group-title">{group.group}</div>
              {group.items.map((item) => {
                const isActive = mode === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      setMode(item.id);
                      onClose?.();
                    }}
                  >
                    {item.icon}
                    <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, textAlign: 'left' }}>
                      <span style={{ lineHeight: 1.2 }}>{item.label}</span>
                      <span style={{ fontSize: 10.5, color: isActive ? 'var(--acc)' : 'var(--tx3)', fontWeight: 500 }}>
                        {item.desc}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}

          {/* Cloud Sync Status Indicator */}
          <div style={{ marginTop: 'auto', padding: '10px 12px', background: 'var(--surf2)', borderRadius: 'var(--r-sm)', border: '1px solid var(--bor-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Engine Status
              </span>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: 11,
                  fontWeight: 700,
                  color: auth.offline ? 'var(--tx2)' : auth.syncStatus === 'err' ? 'var(--red)' : auth.syncStatus === 'syncing' ? 'var(--ylw)' : 'var(--grn)'
                }}
              >
                <CircleDot size={10} className={auth.syncStatus === 'syncing' ? 'sync-dot-pulse' : ''} />
                {auth.offline ? 'Offline Mode' : auth.syncStatus === 'syncing' ? 'Syncing…' : 'Supabase Live'}
              </span>
            </div>
            <div style={{ fontSize: 10.5, color: 'var(--tx3)' }}>
              IndexedDB local storage with real-time cloud failover.
            </div>
          </div>
        </div>

        {/* Firm and Profile Footer */}
        <div className="sidebar-footer">
          {firm && (
            <div
              className="sidebar-firm-card"
              onClick={() => onOpenFirmSwitcher?.()}
              title="Click to switch or manage businesses"
              role="button"
              tabIndex={0}
            >
              <div className="sidebar-firm-avatar">
                {firmInitial}
              </div>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {firm.firm_name || 'My Enterprise'}
                  </span>
                  <ChevronsUpDown size={13} style={{ color: 'var(--tx3)', flexShrink: 0, marginLeft: 4 }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 10.5, color: 'var(--tx3)' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {firm.gstin ? `GST: ${firm.gstin}` : (firm.business_nature ? firm.business_nature.toUpperCase() : 'RETAIL')}
                  </span>
                  <span
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenFirmDetails?.();
                    }}
                    style={{
                      color: 'var(--acc)',
                      fontWeight: 600,
                      cursor: 'pointer',
                      padding: '1px 4px',
                      borderRadius: 4,
                      background: 'var(--acb)',
                      fontSize: 9.5,
                      marginLeft: 4,
                      flexShrink: 0
                    }}
                    title="Edit business profile"
                  >
                    Edit
                  </span>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
              <div
                style={{
                  width: 28,
                  height: 28,
                  borderRadius: '50%',
                  background: 'var(--acc)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 12,
                  fontWeight: 700,
                  flexShrink: 0
                }}
              >
                {user?.name?.[0]?.toUpperCase() || 'O'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.name || 'Local Operator'}
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--tx3)' }}>
                  {user?.email || 'Standalone DB'}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                if (user) signOut();
                else setMode('auth');
              }}
              className="btn btn-ghost"
              style={{ width: 30, height: 30, padding: 0, color: user ? 'var(--red)' : 'var(--tx2)' }}
              title={user ? 'Sign out' : 'Sign in'}
            >
              {user ? <LogOut size={14} /> : <LogIn size={14} />}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
