import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar.jsx';
import Topbar from './Topbar.jsx';
import { CommandPalette } from '../ui/index.jsx';
import { useStore } from '../../store/index.js';
import {
  Receipt,
  BarChart3,
  Boxes,
  BookOpen,
  FileSpreadsheet,
  Moon,
  Sun,
  Zap,
  PlusCircle,
  LogOut,
  LogIn
} from 'lucide-react';

export default function AppShell({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [cmdOpen, setCmdOpen] = useState(false);
  const { setMode, dark, setDark, invQuickMode, toggleQuick, newInv, auth, signOut } = useStore();

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commandActions = [
    {
      id: 'nav-pos',
      title: 'POS Billing & Counter Sale',
      desc: 'Jump to split cockpit billing and invoices',
      icon: <Receipt size={16} />,
      category: 'Navigation',
      shortcut: '1',
      onSelect: () => setMode('invoice')
    },
    {
      id: 'action-new-bill',
      title: 'Create New Invoice',
      desc: 'Reset bill form and focus customer search',
      icon: <PlusCircle size={16} />,
      category: 'Actions',
      shortcut: 'Ctrl+N',
      onSelect: () => {
        setMode('invoice');
        newInv();
      }
    },
    {
      id: 'nav-analytics',
      title: 'Intelligence & Bento Telemetry',
      desc: 'View sales velocity and aging receivables',
      icon: <BarChart3 size={16} />,
      category: 'Navigation',
      shortcut: '2',
      onSelect: () => setMode('business')
    },
    {
      id: 'nav-inventory',
      title: 'Inventory Master',
      desc: 'View stock levels, low-stock alerts, godowns',
      icon: <Boxes size={16} />,
      category: 'Navigation',
      shortcut: '3',
      onSelect: () => setMode('inventory')
    },
    {
      id: 'nav-accounts',
      title: 'Accounts & Party Ledgers',
      desc: 'Fintech transaction register and ledger balances',
      icon: <BookOpen size={16} />,
      category: 'Navigation',
      shortcut: '4',
      onSelect: () => setMode('accounts')
    },
    {
      id: 'nav-gst',
      title: 'GST Compliance Hub',
      desc: 'GSTR-1, GSTR-3B tax computation and ITC',
      icon: <FileSpreadsheet size={16} />,
      category: 'Navigation',
      shortcut: '5',
      onSelect: () => setMode('gst')
    },
    {
      id: 'toggle-quick-pos',
      title: invQuickMode ? 'Switch to Full POS (8-field)' : 'Switch to Quick POS (3-field)',
      desc: 'Toggle fast item entry fields',
      icon: <Zap size={16} />,
      category: 'Settings',
      onSelect: toggleQuick
    },
    {
      id: 'toggle-dark',
      title: dark ? 'Switch to Light Theme' : 'Switch to Dark Theme',
      desc: 'Toggle visual appearance',
      icon: dark ? <Sun size={16} /> : <Moon size={16} />,
      category: 'Settings',
      onSelect: () => setDark(!dark)
    },
    {
      id: 'auth-session',
      title: auth.user ? 'Sign Out of Cloud Session' : 'Sign In to Supabase',
      desc: auth.user ? `Signed in as ${auth.user.email}` : 'Access multi-terminal sync',
      icon: auth.user ? <LogOut size={16} /> : <LogIn size={16} />,
      category: 'Account',
      onSelect: () => {
        if (auth.user) signOut();
        else setMode('auth');
      }
    }
  ];

  return (
    <div className="app-shell">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="app-main">
        <Topbar
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          onOpenCommandPalette={() => setCmdOpen(true)}
        />

        <main className="app-content">
          {children}
        </main>
      </div>

      <CommandPalette
        isOpen={cmdOpen}
        onClose={() => setCmdOpen(false)}
        actions={commandActions}
      />
    </div>
  );
}
