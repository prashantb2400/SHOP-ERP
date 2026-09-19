import React, { useState } from 'react';
import { useStore } from '../../store/index.js';
import { Modal, Btn, Field, Badge, toast } from '../ui/index.jsx';
import { STATES, BUSINESS_NATURES } from '../../lib/constants.js';
import {
  Building2,
  Plus,
  Check,
  Edit3,
  Trash2,
  X,
  Sparkles,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

export default function BusinessSwitcherModal({ isOpen, onClose, onOpenDetails }) {
  const { firms, activeFirmId, switchFirm, createFirm, deleteFirm } = useStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [busy, setBusy] = useState(false);

  const [newBiz, setNewBiz] = useState({
    firm_name: '',
    business_nature: 'retail',
    state: '',
    gst_registered: false,
    gstin: '',
    phone: '',
    address: '',
    upi_id: '',
    inv_prefix: 'INV',
  });

  if (!isOpen) return null;

  const handleSwitch = async (firmId, firmName) => {
    if (firmId === activeFirmId) {
      onClose();
      return;
    }
    setBusy(true);
    try {
      await switchFirm(firmId);
      toast(`Switched workspace to ${firmName}`, 'success');
      onClose();
    } catch (err) {
      toast(err.message || 'Failed to switch business', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (e, firmId, firmName) => {
    e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${firmName}"?\nAll invoices, inventory, and ledgers for this business will be permanently removed.`)) {
      return;
    }
    setBusy(true);
    try {
      const res = await deleteFirm(firmId);
      if (res?.error) {
        toast(res.error, 'error');
      } else {
        toast(`Deleted "${firmName}"`, 'info');
      }
    } catch (err) {
      toast(err.message || 'Failed to delete business', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleCreate = async (e) => {
    e?.preventDefault();
    if (!newBiz.firm_name?.trim()) {
      toast('Business name is required', 'error');
      return;
    }
    setBusy(true);
    try {
      await createFirm({
        ...newBiz,
        firm_name: newBiz.firm_name.trim(),
        gstin: newBiz.gstin.trim().toUpperCase(),
        inv_prefix: newBiz.inv_prefix.trim().toUpperCase() || 'INV',
      });
      toast(`Registered & switched to "${newBiz.firm_name}"`, 'success');
      setShowAddForm(false);
      setNewBiz({
        firm_name: '',
        business_nature: 'retail',
        state: '',
        gst_registered: false,
        gstin: '',
        phone: '',
        address: '',
        upi_id: '',
        inv_prefix: 'INV',
      });
      onClose();
    } catch (err) {
      toast(err.message || 'Failed to create business', 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal onClose={onClose} maxWidth="600px">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--bor)', paddingBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: 'var(--acb)', color: 'var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Building2 size={20} strokeWidth={2.2} />
            </div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--tx)', letterSpacing: '-0.02em' }}>
                Multi-Business Portfolio
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--tx2)' }}>
                Switch between firms or register a new commercial entity
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="btn btn-ghost"
            style={{ width: 30, height: 30, padding: 0 }}
            title="Close dialog"
          >
            <X size={16} />
          </button>
        </div>

        {/* Business List */}
        {!showAddForm ? (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: '380px', overflowY: 'auto', paddingRight: 2 }}>
              {(firms || []).map((f) => {
                const isActive = f.id === activeFirmId;
                const initial = f.name?.[0]?.toUpperCase() || 'B';

                return (
                  <div
                    key={f.id}
                    onClick={() => handleSwitch(f.id, f.name)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 14px',
                      borderRadius: 'var(--r)',
                      background: isActive ? 'var(--surf2)' : 'var(--surf)',
                      border: `1.5px solid ${isActive ? 'var(--acc)' : 'var(--bor)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      position: 'relative'
                    }}
                    className="tr-click"
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <div
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 'var(--r-sm)',
                          background: isActive ? 'var(--acc)' : 'var(--surf3)',
                          color: isActive ? '#ffffff' : 'var(--tx)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 15,
                          fontWeight: 800,
                          flexShrink: 0
                        }}
                      >
                        {initial}
                      </div>

                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--tx)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {f.name}
                          </span>
                          {isActive && (
                            <Badge v="pri" dot>
                              Active Workspace
                            </Badge>
                          )}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--tx2)', marginTop: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span>{f.business_nature ? f.business_nature.toUpperCase() : 'RETAIL'}</span>
                          <span>•</span>
                          <span>{f.state || 'Local'}</span>
                          {f.gstin && (
                            <>
                              <span>•</span>
                              <span className="num-mono" style={{ color: 'var(--tx3)' }}>{f.gstin}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      {isActive ? (
                        <Btn
                          v="ghost"
                          sz="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClose();
                            onOpenDetails?.();
                          }}
                          icon={<Edit3 size={13} />}
                          title="Edit business details"
                        >
                          Settings
                        </Btn>
                      ) : (
                        <>
                          <Btn
                            v="pri"
                            sz="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSwitch(f.id, f.name);
                            }}
                            icon={<ArrowRight size={13} />}
                          >
                            Switch
                          </Btn>
                          {(firms || []).length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => handleDelete(e, f.id, f.name)}
                              className="btn btn-ghost"
                              style={{ width: 28, height: 28, padding: 0, color: 'var(--red)' }}
                              title="Delete business"
                            >
                              <Trash2 size={13} />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Bottom Add Trigger */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--bor)', paddingTop: 14 }}>
              <div style={{ fontSize: 11.5, color: 'var(--tx3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <ShieldCheck size={14} style={{ color: 'var(--grn)' }} />
                <span>Each business maintains completely isolated ledgers, inventory & invoices.</span>
              </div>
              <Btn
                v="pri"
                sz="md"
                onClick={() => setShowAddForm(true)}
                icon={<Plus size={14} strokeWidth={2.5} />}
              >
                Add Business
              </Btn>
            </div>
          </>
        ) : (
          /* Add New Business Form */
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '10px 12px', background: 'var(--surf2)', borderRadius: 'var(--r-sm)', border: '1px solid var(--bor)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Sparkles size={18} style={{ color: 'var(--acc)', flexShrink: 0 }} />
              <div style={{ fontSize: 12, color: 'var(--tx2)' }}>
                Create a distinct company workspace. Invoices, customers, stock, and bank accounts will be strictly isolated.
              </div>
            </div>

            <Field label="Business / Company Name" required>
              <input
                className="input"
                value={newBiz.firm_name}
                onChange={(e) => setNewBiz((prev) => ({ ...prev, firm_name: e.target.value }))}
                placeholder="e.g. Metro Electronics Pvt Ltd"
                autoFocus
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <Field label="Business Nature">
                <select
                  className="select"
                  value={newBiz.business_nature}
                  onChange={(e) => setNewBiz((prev) => ({ ...prev, business_nature: e.target.value }))}
                >
                  {BUSINESS_NATURES.map((bn) => (
                    <option key={bn.value} value={bn.value}>{bn.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="State / Jurisdiction">
                <select
                  className="select"
                  value={newBiz.state}
                  onChange={(e) => setNewBiz((prev) => ({ ...prev, state: e.target.value }))}
                >
                  <option value="">— Select State —</option>
                  {STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <Field label="Contact Phone">
                <input
                  className="input"
                  type="tel"
                  value={newBiz.phone}
                  onChange={(e) => setNewBiz((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="+91 98765 43210"
                />
              </Field>

              <Field label="Invoice Prefix" hint="Series identifier (e.g. METRO, RF)">
                <input
                  className="input num-mono"
                  value={newBiz.inv_prefix}
                  onChange={(e) => setNewBiz((prev) => ({ ...prev, inv_prefix: e.target.value.toUpperCase() }))}
                  placeholder="INV"
                  maxLength={6}
                />
              </Field>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--surf2)', borderRadius: 'var(--r-sm)', border: '1px solid var(--bor)' }}>
              <div>
                <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--tx)' }}>GST Registered</div>
                <div style={{ fontSize: 11, color: 'var(--tx3)' }}>Tax invoices with CGST/SGST/IGST</div>
              </div>
              <input
                type="checkbox"
                checked={newBiz.gst_registered}
                onChange={(e) => setNewBiz((prev) => ({ ...prev, gst_registered: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: 'var(--acc)', cursor: 'pointer' }}
              />
            </div>

            {newBiz.gst_registered && (
              <Field label="GSTIN (15 Digits)" required>
                <input
                  className="input num-mono"
                  value={newBiz.gstin}
                  onChange={(e) => setNewBiz((prev) => ({ ...prev, gstin: e.target.value.toUpperCase() }))}
                  placeholder="07AAAAA0000A1Z5"
                  maxLength={15}
                />
              </Field>
            )}

            <Field label="Registered Address">
              <input
                className="input"
                value={newBiz.address}
                onChange={(e) => setNewBiz((prev) => ({ ...prev, address: e.target.value }))}
                placeholder="Building, street, city and pin"
              />
            </Field>

            <Field label="UPI ID (VPA)" hint="For QR code generation on bills">
              <input
                className="input num-mono"
                value={newBiz.upi_id}
                onChange={(e) => setNewBiz((prev) => ({ ...prev, upi_id: e.target.value }))}
                placeholder="business@upi"
              />
            </Field>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid var(--bor)', paddingTop: 14 }}>
              <Btn v="ghost" sz="md" onClick={() => setShowAddForm(false)} disabled={busy}>
                Cancel
              </Btn>
              <Btn v="pri" sz="md" type="submit" loading={busy} icon={<Check size={14} />}>
                Create & Switch Workspace
              </Btn>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
}
