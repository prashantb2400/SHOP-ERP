import React from 'react';
import { useStore } from '../../store/index.js';
import {
  Menu,
  Search,
  Sun,
  Moon,
  Zap,
  Building2,
  ChevronRight,
  PlusCircle,
  ChevronsUpDown
} from 'lucide-react';

const MODE_LABELS = {
  invoice: 'POS Billing & Invoicing',
  business: 'Business Telemetry & Receivables',
  gst: 'GST Compliance & ITC Hub',
  inventory: 'Stock & Godown Master',
  accounts: 'Financial Ledgers & Cashbook',
  auth: 'Authentication',
  setup: 'Firm Onboarding'
};

export default function Topbar({ onToggleSidebar, onOpenCommandPalette, onOpenFirmSwitcher }) {
  const { mode, dark, setDark, invQuickMode, toggleQuick, firm, newInv } = useStore();

  return (
    <header className="app-header no-print">
      <div className="app-header-left">
        {/* Mobile Hamburger */}
        <button
          type="button"
          onClick={onToggleSidebar}
          aria-label="Toggle navigation menu"
          className="btn btn-ghost"
          style={{ width: 34, height: 34, padding: 0 }}
        >
          <Menu size={18} />
        </button>

        {/* Breadcrumb Navigation with interactive Business Switcher */}
        <div className="app-breadcrumbs">
          <button
            type="button"
            onClick={onOpenFirmSwitcher}
            className="btn btn-ghost"
            style={{
              padding: '3px 8px',
              height: 'auto',
              borderRadius: 'var(--r-sm)',
              fontSize: 12.5,
              fontWeight: 600,
              color: 'var(--tx)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'var(--surf2)',
              border: '1px solid var(--bor)'
            }}
            title="Click to switch or manage businesses"
          >
            <Building2 size={13} style={{ color: 'var(--acc)' }} />
            <span style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {firm?.firm_name || 'RetailFlow'}
            </span>
            <ChevronsUpDown size={11} style={{ color: 'var(--tx3)' }} />
          </button>
          <ChevronRight size={12} className="separator" />
          <span className="current">{MODE_LABELS[mode] || 'Workspace'}</span>
        </div>
      </div>

      <div className="app-header-right">
        {/* Command Search Trigger */}
        <button
          type="button"
          className="app-header-search"
          onClick={onOpenCommandPalette}
          title="Open Command Palette (Ctrl+K)"
        >
          <Search size={14} />
          <span>Quick actions…</span>
          <span className="kbd-shortcut">Ctrl K</span>
        </button>

        {/* Quick Billing Mode Toggle (POS Only) */}
        {mode === 'invoice' && (
          <div
            className={`qm-toggle ${invQuickMode ? 'on' : ''}`}
            onClick={toggleQuick}
            title="Toggle between Quick 3-field and Full 8-field billing"
          >
            <span className="qm-dot" />
            <span style={{ fontSize: 11.5, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Zap size={11} strokeWidth={2.5} />
              {invQuickMode ? 'Quick POS' : 'Full POS'}
            </span>
          </div>
        )}

        {/* Quick New Invoice Action (when in invoice mode) */}
        {mode === 'invoice' && (
          <button
            type="button"
            onClick={newInv}
            className="btn btn-pri btn-sm"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            title="Create fresh bill (Ctrl+Enter to save)"
          >
            <PlusCircle size={14} />
            <span>New Bill</span>
          </button>
        )}

        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={() => setDark(!dark)}
          aria-label="Toggle dark mode theme"
          className="btn btn-ghost"
          style={{ width: 34, height: 34, padding: 0 }}
        >
          {dark ? <Sun size={15} /> : <Moon size={15} />}
        </button>
      </div>
    </header>
  );
}

