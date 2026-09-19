import React, { useState, useEffect, useCallback } from 'react';
import { useStore, blankItem, blankInv } from '../../store/index.js';
import { fmt, fmtDate, r2, calcItem, buildTotals } from '../../engine/calc.js';
import {
  Btn,
  Card,
  BezelCard,
  Badge,
  Empty,
  Table,
  TR,
  TD,
  Field,
  Modal,
  toast
} from '../../components/ui/index.jsx';
import {
  Search,
  Plus,
  ArrowLeft,
  Zap,
  Trash2,
  Printer,
  Share2,
  Receipt,
  CheckCircle2,
  CreditCard,
  Building2,
  X
} from 'lucide-react';

/* ════════════════════════════════════════════════
   INVOICE VIEW & PRINT MODAL
   ════════════════════════════════════════════════ */
export function InvoiceDetailModal({ inv, onClose }) {
  const { firm, patch, invoices } = useStore();
  if (!inv) return null;

  const markPaid = () => {
    const updated = invoices.map(i => i.id === inv.id ? { ...i, status: 'paid' } : i);
    patch({ invoices: updated, viewInv: { ...inv, status: 'paid' } });
    toast(`Invoice ${inv.invoice_no} marked as paid`, 'success');
  };

  const shareText = `Invoice from ${firm?.firm_name || 'RetailFlow'}\nInvoice No: ${inv.invoice_no}\nDate: ${fmtDate(inv.date)}\nTotal: ${fmt(inv.total)}\nStatus: ${inv.status.toUpperCase()}`;
  const whatsappUrl = `https://wa.me/${(inv.customer_phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(shareText)}`;

  return (
    <Modal onClose={onClose} maxWidth="680px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--bor)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: 'var(--acb)', color: 'var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={20} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--tx)', letterSpacing: '-0.02em' }}>
                {inv.invoice_no}
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--tx2)' }}>
                Issued {fmtDate(inv.date)} · Tender: {inv.payment_method?.toUpperCase()}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Badge v={inv.status === 'paid' ? 'grn' : inv.status === 'unpaid' ? 'red' : 'ylw'} dot>
              {inv.status?.toUpperCase()}
            </Badge>
            <button type="button" onClick={onClose} className="btn btn-ghost" style={{ width: 30, height: 30, padding: 0 }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Firm & Customer Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          <div style={{ padding: '12px 14px', background: 'var(--surf2)', borderRadius: 'var(--r-sm)', border: '1px solid var(--bor)' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', marginBottom: 4 }}>Billed By</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--tx)' }}>{firm?.firm_name || 'RetailFlow Store'}</div>
            <div style={{ fontSize: 11, color: 'var(--tx2)' }}>GSTIN: {firm?.gstin || 'Unregistered'}</div>
            {firm?.address && <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 2 }}>{firm.address}</div>}
          </div>
          <div style={{ padding: '12px 14px', background: 'var(--surf2)', borderRadius: 'var(--r-sm)', border: '1px solid var(--bor)' }}>
            <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', marginBottom: 4 }}>Billed To</div>
            <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--tx)' }}>{inv.customer_name || 'Walk-in Customer'}</div>
            <div style={{ fontSize: 11, color: 'var(--tx2)' }}>Phone: {inv.customer_phone || 'None provided'}</div>
            {inv.customer_gstin && <div style={{ fontSize: 11, color: 'var(--tx3)', marginTop: 2 }}>GSTIN: {inv.customer_gstin}</div>}
          </div>
        </div>

        {/* Itemized Table */}
        <div style={{ border: '1px solid var(--bor)', borderRadius: 'var(--r-sm)', overflow: 'hidden' }}>
          <table className="tbl-fintech" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Item</th>
                <th style={{ textAlign: 'center' }}>Qty</th>
                <th style={{ textAlign: 'right' }}>Rate</th>
                <th style={{ textAlign: 'right' }}>GST</th>
                <th style={{ textAlign: 'right' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {(inv.items || []).map((it, idx) => (
                <tr key={idx}>
                  <td style={{ fontWeight: 600 }}>{it.name}</td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--ffm)' }}>{it.qty}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--ffm)' }}>{fmt(it.rate)}</td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--ffm)', color: 'var(--tx2)' }}>{it.gst_rate || 0}%</td>
                  <td style={{ textAlign: 'right', fontWeight: 700, fontFamily: 'var(--ffm)' }}>
                    {fmt(r2(Number(it.qty || 0) * Number(it.rate || 0)))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Financial Summary Breakdown */}
        <div style={{ padding: '12px 16px', background: 'var(--surf2)', borderRadius: 'var(--r-sm)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--tx2)' }}>
            <span>Net Taxable Total</span>
            <span className="num-mono" style={{ fontWeight: 600 }}>{fmt(inv.taxable || inv.total)}</span>
          </div>
          {Number(inv.total_gst || 0) > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12.5, color: 'var(--tx2)' }}>
              <span>Total GST (CGST + SGST)</span>
              <span className="num-mono" style={{ fontWeight: 600 }}>{fmt(inv.total_gst)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 16, fontWeight: 800, color: 'var(--acc)', borderTop: '1px solid var(--bor)', paddingTop: 8, marginTop: 4 }}>
            <span>Grand Total</span>
            <span className="num-mono">{fmt(inv.total)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 6 }}>
          {inv.status !== 'paid' && (
            <Btn v="grn" sz="sm" icon={<CheckCircle2 size={14} />} onClick={markPaid}>
              Mark as Paid
            </Btn>
          )}
          {inv.customer_phone && (
            <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn btn-ghost btn-sm" style={{ textDecoration: 'none' }}>
              <Share2 size={14} style={{ marginRight: 6 }} /> WhatsApp Bill
            </a>
          )}
          <Btn v="pri" sz="sm" icon={<Printer size={14} />} onClick={() => window.print()}>
            Print Thermal / PDF
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

/* ════════════════════════════════════════════════
   INVOICE LIST (Fintech Grid)
   ════════════════════════════════════════════════ */
export function InvoiceList() {
  const { invoices, invFilter, fyFilter, patch, viewInv } = useStore();
  const [q, setQ] = useState('');

  const fy = fyFilter === 'all' ? null : fyFilter;
  const list = invoices
    .filter(i => !fy || i.fy === fy)
    .filter(i => invFilter === 'all' || i.status === invFilter || i.payment_method === invFilter ||
      (invFilter === 'unpaid' && (i.status === 'unpaid' || i.status === 'partial')))
    .filter(i => !q || [i.invoice_no, i.customer_name, String(i.total), i.customer_phone].some(v => v?.toLowerCase().includes(q.toLowerCase())))
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const totalAmt = r2(list.reduce((a, i) => a + Number(i.total || 0), 0));
  const badgeV = s => s === 'paid' ? 'grn' : s === 'unpaid' ? 'red' : s === 'partial' ? 'ylw' : 'default';

  const FILTERS = ['all', 'cash', 'online', 'credit', 'paid', 'unpaid', 'partial', 'void'];

  return (
    <div>
      {viewInv && <InvoiceDetailModal inv={viewInv} onClose={() => patch({ viewInv: null })} />}

      {/* Editorial Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Sales Invoices</h1>
          <div className="page-header-sub">
            {list.length} invoices registered · {fmt(totalAmt)} aggregate counter volume
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Btn v="pri" sz="md" icon={<Plus size={15} />} onClick={() => patch({ tab: 'create', invForm: blankInv() })}>
            Create Invoice
          </Btn>
        </div>
      </div>

      {/* Modern Search & Filter Bar */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--tx3)' }} />
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search invoice number, customer name, phone, or amount…"
            className="input"
            style={{ paddingLeft: 36 }}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 18 }}>
        {FILTERS.map(f => (
          <button
            key={f}
            type="button"
            onClick={() => patch({ invFilter: f })}
            style={{
              padding: '5px 14px',
              fontSize: 11.5,
              fontWeight: 600,
              borderRadius: 'var(--r-pill)',
              cursor: 'pointer',
              background: invFilter === f ? 'var(--acc)' : 'var(--surf2)',
              border: `1px solid ${invFilter === f ? 'var(--acc)' : 'var(--bor)'}`,
              color: invFilter === f ? '#ffffff' : 'var(--tx2)',
              transition: 'transform 120ms var(--ease-out), background-color 160ms ease'
            }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <Card>
          <Empty
            icon={<Receipt size={40} strokeWidth={1.5} />}
            title="No invoices found"
            sub="No sales records match the selected filters or query."
            action={<Btn v="pri" sz="sm" icon={<Plus size={14} />} onClick={() => patch({ tab: 'create', invForm: blankInv() })}>Create First Invoice</Btn>}
          />
        </Card>
      ) : (
        <Card flat style={{ padding: 0, overflow: 'hidden' }}>
          <Table headers={['Invoice No.', 'Customer', 'Date', 'Tender', 'Total', 'Status', 'Actions']} fintech>
            {list.map(inv => (
              <TR key={inv.id} onClick={() => patch({ viewInv: inv, tab: 'list' })}>
                <TD mono style={{ color: 'var(--acc)', fontWeight: 700 }}>{inv.invoice_no}</TD>
                <TD>
                  <div style={{ fontWeight: 600 }}>{inv.customer_name || 'Walk-in'}</div>
                  {inv.customer_phone && <div style={{ fontSize: 11, color: 'var(--tx3)' }}>{inv.customer_phone}</div>}
                </TD>
                <TD style={{ color: 'var(--tx2)', fontSize: 12 }}>{fmtDate(inv.date)}</TD>
                <TD>
                  <span style={{ fontSize: 11.5, textTransform: 'capitalize', color: 'var(--tx2)', fontWeight: 600 }}>
                    {inv.payment_method}
                  </span>
                </TD>
                <TD right mono style={{ fontWeight: 800, fontSize: 13.5 }}>{fmt(inv.total)}</TD>
                <TD><Badge v={badgeV(inv.status)} dot pulse={inv.status === 'unpaid'}>{inv.status}</Badge></TD>
                <TD right>
                  <Btn v="ghost" sz="sm" style={{ padding: '3px 8px' }} onClick={(e) => { e.stopPropagation(); patch({ viewInv: inv, tab: 'list' }); }}>
                    View &amp; Print
                  </Btn>
                </TD>
              </TR>
            ))}
          </Table>
        </Card>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════
   INVOICE CREATE / EDIT COCKPIT
   ════════════════════════════════════════════════ */
export function InvoiceCreate() {
  const store = useStore();
  const { invForm, invQuickMode, firm, inventory, customers, patch } = store;
  const f = invForm || blankInv();
  const isReg = firm?.gst_registered;
  const withGST = isReg && f.inv_with_gst !== false;

  const upd = useCallback(p => patch({ invForm: { ...f, ...p } }), [f, patch]);
  const updItem = useCallback((id, k, v) => {
    const items = (f.items || []).map(it => it.id === id ? { ...it, [k]: v } : it);
    upd({ items });
  }, [f, upd]);

  const preview = buildTotals(f.items || [], withGST, f.is_igst, {
    inv_discount: f.inv_discount,
    inv_discount_type: f.inv_discount_type,
    extra_charges: f.extra_charges,
    tcs_rate: f.tcs_rate
  });

  const { nextInvNo } = store;
  const previewNo = nextInvNo(f.date).no;

  const addItem = () => upd({ items: [...(f.items || []), blankItem()] });
  const remItem = id => upd({ items: (f.items || []).filter(it => it.id !== id) });

  const save = useCallback(async (andNew = false) => {
    const res = await store.saveInvoice(andNew);
    if (res.error && res.error !== 'cancelled') toast(res.error, 'error');
    else if (res.ok) toast(`Invoice ${res.inv.invoice_no} saved ✓`, 'success');
  }, [store]);

  // Keyboard shortcut Ctrl+Enter to save
  useEffect(() => {
    const handleKeyDown = e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        save(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [save]);

  // Recent items
  const recent = [...new Map(
    [...(store.invoices || [])].reverse()
      .flatMap(inv => (inv.items || []).map(it => ({ name: it.name, rate: Number(it.rate || 0), gst_rate: it.gst_rate || 18 })))
      .filter(it => it.name?.trim())
      .map(it => [it.name.toLowerCase(), it])
  ).values()].slice(0, 8);

  return (
    <div>
      {/* Cockpit Header */}
      <div className="page-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Btn v="ghost" sz="sm" icon={<ArrowLeft size={14} />} onClick={() => patch({ tab: 'list' })}>
              Back to List
            </Btn>
            <h1 className="page-header-title">POS Counter Billing</h1>
          </div>
          <div className="page-header-sub">
            Drafting invoice <span style={{ fontFamily: 'var(--ffm)', fontWeight: 800, color: 'var(--acc)' }}>{previewNo}</span> with live multi-slab GST calculation
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <div className={`qm-toggle ${invQuickMode ? 'on' : ''}`} onClick={store.toggleQuick} title="Toggle quick billing mode">
            <span className="qm-dot" />
            <span style={{ fontSize: 11.5, fontWeight: 600 }}>{invQuickMode ? 'Quick 3-Field' : 'Full Commercial'}</span>
          </div>
          <span className="hero-pill">
            Quick Save: <kbd className="kbd-shortcut" style={{ marginLeft: 4 }}>Ctrl ↵</kbd>
          </span>
        </div>
      </div>

      <div className="cockpit-grid">
        {/* Left Workspace Column (62%) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Customer & Billing Metadata Card */}
          <BezelCard>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              Customer &amp; Settlement Protocol
            </div>
            <div className="g2" style={{ marginBottom: 12 }}>
              <Field label="Customer Account" required>
                <input
                  className="input"
                  value={f.customer_name}
                  list="cust-ac"
                  onChange={e => {
                    upd({ customer_name: e.target.value });
                    const c = customers.find(x => x.name.toLowerCase() === e.target.value.toLowerCase());
                    if (c) upd({ customer_name: c.name, customer_phone: c.phone || '', customer_gstin: c.gstin || '', customer_id: c.id });
                  }}
                  placeholder="Enter or search customer name…"
                />
                <datalist id="cust-ac">
                  {customers.map(c => <option key={c.id} value={c.name} />)}
                </datalist>
              </Field>
              <Field label="Phone Contact">
                <input
                  className="input"
                  type="tel"
                  value={f.customer_phone}
                  onChange={e => upd({ customer_phone: e.target.value })}
                  placeholder="Mobile / WhatsApp number"
                />
              </Field>
            </div>

            {!invQuickMode && isReg && (
              <div className="g2" style={{ marginBottom: 12 }}>
                <Field label="Buyer GSTIN">
                  <input
                    className="input"
                    value={f.customer_gstin}
                    onChange={e => upd({ customer_gstin: e.target.value.toUpperCase() })}
                    placeholder="15-character GSTIN"
                    maxLength={15}
                  />
                </Field>
                <Field label="Shipping Destination">
                  <input
                    className="input"
                    value={f.ship_to || ''}
                    onChange={e => upd({ ship_to: e.target.value })}
                    placeholder="Consignee delivery address"
                  />
                </Field>
              </div>
            )}

            <div className="g2">
              <Field label="Billing Date">
                <input className="input" type="date" value={f.date} onChange={e => upd({ date: e.target.value })} />
              </Field>
              <Field label="Pre-allocated Invoice No.">
                <input className="input" value={previewNo} readOnly style={{ color: 'var(--acc)', fontWeight: 800, fontFamily: 'var(--ffm)' }} />
              </Field>
            </div>
          </BezelCard>

          {/* Settlement Method Selector */}
          <Card>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
              Settlement Tender
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[
                ['cash', 'Cash Tender', <CreditCard key="c" size={14} />],
                ['online', 'UPI / Digital Transfer', <Zap key="u" size={14} />],
                ['credit', 'Book Credit Ledger', <Building2 key="b" size={14} />]
              ].map(([v, l, icon]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => upd({ payment_method: v })}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '8px 16px',
                    fontSize: 12.5,
                    fontWeight: 600,
                    borderRadius: 'var(--r-sm)',
                    cursor: 'pointer',
                    background: f.payment_method === v ? 'var(--acb)' : 'var(--surf2)',
                    border: `1.5px solid ${f.payment_method === v ? 'var(--acc)' : 'var(--bor)'}`,
                    color: f.payment_method === v ? 'var(--acc)' : 'var(--tx2)',
                    transition: 'transform 120ms var(--ease-out), background-color 160ms ease'
                  }}
                >
                  {icon}
                  {l}
                </button>
              ))}
            </div>
          </Card>

          {/* Line Items Cockpit */}
          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                Invoice Line Items
              </div>
              <span style={{ fontSize: 11.5, color: 'var(--tx2)', fontWeight: 600 }}>{(f.items || []).length} items added</span>
            </div>

            {/* Quick Frequent Items Bar */}
            {recent.length > 0 && (
              <div className="chip-bar" style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--tx3)', alignSelf: 'center', flexShrink: 0, textTransform: 'uppercase' }}>Recent:</span>
                {recent.map((it, i) => (
                  <div
                    key={i}
                    className="chip"
                    onClick={() => {
                      const item = { ...blankItem(), name: it.name, rate: it.rate, gst_rate: it.gst_rate };
                      const items = f.items || [];
                      upd({ items: items.length === 1 && !items[0].name ? [item] : [...items, item] });
                    }}
                  >
                    {it.name.slice(0, 18)} <span className="chip-price">₹{it.rate}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Instant Rapid Entry Bar */}
            <div className="qa-wrap" style={{ marginBottom: 14 }}>
              <div className="qa-row">
                <Zap size={15} style={{ color: 'var(--acc)', flexShrink: 0 }} />
                <input
                  className="qa-input"
                  placeholder='Instant Entry — e.g. "Rice 2 45" or "Shirt 350"'
                  onKeyDown={e => {
                    if (e.key !== 'Enter') return;
                    e.preventDefault();
                    const raw = e.target.value.trim();
                    if (!raw) return;
                    const parts = raw.split(/\s+/);
                    let name, qty = 1, rate = 0;
                    if (parts.length >= 3) {
                      const mr = parseFloat(parts[parts.length - 1]), mq = parseFloat(parts[parts.length - 2]);
                      if (!isNaN(mr) && !isNaN(mq)) { rate = mr; qty = mq; name = parts.slice(0, -2).join(' '); }
                      else if (!isNaN(mr)) { rate = mr; name = parts.slice(0, -1).join(' '); }
                      else name = raw;
                    } else if (parts.length === 2) {
                      const mn = parseFloat(parts[1]);
                      if (!isNaN(mn)) { rate = mn; name = parts[0]; }
                      else name = raw;
                    } else name = raw;

                    const inv = inventory.find(i => i.name.toLowerCase() === name.toLowerCase());
                    const item = { ...blankItem(), name: inv?.name || name, rate: inv?.rate || rate || 0, qty, gst_rate: inv?.gst_rate || 18 };
                    const items = f.items || [];
                    upd({ items: items.length === 1 && !items[0].name ? [item] : [...items, item] });
                    e.target.value = '';
                    toast(`${item.name} added`, 'success', 1000);
                  }}
                />
                <span className="kbd-shortcut">↵ enter</span>
              </div>
            </div>

            {/* Items Table */}
            <div style={{ overflowX: 'auto', border: '1px solid var(--bor)', borderRadius: 'var(--r-sm)', marginBottom: 12 }}>
              <table className="it">
                <thead>
                  <tr>
                    <th style={{ minWidth: 180 }}>Item Name</th>
                    <th style={{ width: 68, textAlign: 'center' }}>Qty</th>
                    <th style={{ width: 96, textAlign: 'right' }}>Rate ₹</th>
                    {!invQuickMode && <th style={{ width: 68, textAlign: 'center' }}>Disc%</th>}
                    {isReg && <th style={{ width: 68, textAlign: 'center' }}>GST</th>}
                    {isReg && !invQuickMode && <th style={{ width: 88, textAlign: 'right' }}>Taxable</th>}
                    <th style={{ width: 100, textAlign: 'right' }}>Total</th>
                    <th style={{ width: 32 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {(f.items || []).map(it => {
                    const c = calcItem(it, withGST, f.is_igst);
                    return (
                      <tr key={it.id}>
                        <td>
                          <input
                            value={it.name}
                            list={`ac-${it.id}`}
                            placeholder="Item name"
                            onChange={e => {
                              const v = e.target.value;
                              const inv = inventory.find(i => i.name.toLowerCase() === v.toLowerCase());
                              if (inv) {
                                const items = (f.items || []).map(x => x.id === it.id ? { ...x, name: inv.name, rate: inv.rate, gst_rate: inv.gst_rate, hsn: inv.hsn || '' } : x);
                                upd({ items });
                              } else updItem(it.id, 'name', v);
                            }}
                            style={{ border: 'none', outline: 'none', background: 'transparent', width: '100%', fontFamily: 'inherit', fontWeight: 600 }}
                          />
                          <datalist id={`ac-${it.id}`}>
                            {inventory.map(i => <option key={i.id} value={i.name} />)}
                          </datalist>
                        </td>
                        <td>
                          <input
                            type="number"
                            value={it.qty}
                            min="0"
                            step="0.001"
                            onChange={e => updItem(it.id, 'qty', e.target.value)}
                            style={{ width: 58, textAlign: 'center', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--ffm)' }}
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            value={it.rate}
                            min="0"
                            step="0.01"
                            onChange={e => updItem(it.id, 'rate', e.target.value)}
                            style={{ width: 88, textAlign: 'right', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--ffm)' }}
                          />
                        </td>
                        {!invQuickMode && (
                          <td>
                            <input
                              type="number"
                              value={it.discount || 0}
                              min="0"
                              max="100"
                              onChange={e => updItem(it.id, 'discount', e.target.value)}
                              style={{ width: 58, textAlign: 'center', border: 'none', outline: 'none', background: 'transparent', fontFamily: 'var(--ffm)' }}
                            />
                          </td>
                        )}
                        {isReg && (
                          <td>
                            <select
                              value={it.gst_rate}
                              onChange={e => updItem(it.id, 'gst_rate', Number(e.target.value))}
                              style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: 'inherit', fontSize: 11.5, fontWeight: 600 }}
                            >
                              {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                            </select>
                          </td>
                        )}
                        {isReg && !invQuickMode && (
                          <td style={{ textAlign: 'right', fontSize: 11.5, fontFamily: 'var(--ffm)', color: 'var(--tx2)' }}>
                            {fmt(c.taxable)}
                          </td>
                        )}
                        <td style={{ textAlign: 'right', fontWeight: 800, fontFamily: 'var(--ffm)' }}>
                          {fmt(c.total)}
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => remItem(it.id)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                            title="Remove row"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <Btn v="ghost" sz="sm" icon={<Plus size={13} />} onClick={addItem}>Add Line Item</Btn>
          </Card>
        </div>

        {/* Right Sticky Invoice Summary Sheet (38%) */}
        <div className="cockpit-sticky">
          <BezelCard>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 14 }}>
              Commercial Settlement
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, marginBottom: 18 }}>
              {isReg ? (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: 'var(--tx2)' }}>Taxable Value</span>
                    <span className="num-mono" style={{ fontWeight: 600 }}>{fmt(preview.totalTaxable)}</span>
                  </div>
                  {Object.entries(preview.gstSummary || {}).map(([pct, g]) => (
                    <div key={pct} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, alignItems: 'center' }}>
                      <span style={{ color: 'var(--tx2)' }}>GST {pct}% (CGST+SGST)</span>
                      <span className="num-mono" style={{ color: 'var(--red)', fontWeight: 600 }}>{fmt(g.cgst + g.sgst + g.igst)}</span>
                    </div>
                  ))}
                  {preview.extraCharges > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ color: 'var(--tx2)' }}>Freight &amp; Handling</span>
                      <span className="num-mono">{fmt(preview.extraCharges)}</span>
                    </div>
                  )}
                </>
              ) : (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: 'var(--tx2)' }}>Subtotal</span>
                  <span className="num-mono" style={{ fontWeight: 600 }}>
                    {fmt((f.items || []).reduce((a, it) => a + r2(Number(it.qty || 0) * Number(it.rate || 0)), 0))}
                  </span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderTop: '2px solid var(--bor)', paddingTop: 14, marginTop: 6 }}>
                <span style={{ fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Grand Total</span>
                <span className="num-mono" style={{ color: 'var(--acc)', fontSize: 28, fontWeight: 800, letterSpacing: '-0.03em' }}>
                  {fmt(preview.grandTotal)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Btn v="pri" sz="lg" onClick={() => save(false)} style={{ justifyContent: 'center', width: '100%', fontWeight: 800 }}>
                Authorize &amp; Save Invoice
              </Btn>
              <div style={{ display: 'flex', gap: 8 }}>
                <Btn v="ghost" sz="sm" onClick={() => save(true)} style={{ flex: 1, justifyContent: 'center' }}>
                  Save &amp; New
                </Btn>
                <Btn v="ghost" sz="sm" onClick={() => patch({ invForm: blankInv() })} style={{ flex: 1, justifyContent: 'center' }}>
                  Clear Form
                </Btn>
              </div>
            </div>
          </BezelCard>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════
   INVOICE MODE SHELL
   ════════════════════════════════════════════════ */
export default function InvoiceMode() {
  const { tab } = useStore();
  return tab === 'create' ? <InvoiceCreate /> : <InvoiceList />;
}
