import React, { useState } from 'react';
import { useStore } from '../../store/index.js';
import { Modal, Btn, Field, Tabs, toast } from '../ui/index.jsx';
import { STATES, BUSINESS_NATURES, GST_RATES } from '../../lib/constants.js';
import {
  Building2,
  X,
  FileSpreadsheet,
  Landmark,
  Save,
  Info
} from 'lucide-react';

function BusinessDetailsForm({ onClose }) {
  const { firm, updateFirm } = useStore();
  const [activeTab, setActiveTab] = useState('general');
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    firm_name: firm?.firm_name || '',
    business_nature: firm?.business_nature || 'retail',
    state: firm?.state || '',
    address: firm?.address || '',
    phone: firm?.phone || '',
    email: firm?.email || '',
    website: firm?.website || '',
    gst_registered: firm?.gst_registered ?? false,
    gstin: firm?.gstin || '',
    default_gst_rate: firm?.default_gst_rate ?? 18,
    inv_prefix: firm?.inv_prefix || 'INV',
    default_notes: firm?.default_notes || '',
    default_tnc: firm?.default_tnc || '',
    bank_name: firm?.bank_name || '',
    account_no: firm?.account_no || '',
    ifsc: firm?.ifsc || '',
    upi_id: firm?.upi_id || '',
  });

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!form.firm_name?.trim()) {
      toast('Business name is required', 'error');
      return;
    }
    if (form.gst_registered && form.gstin && form.gstin.trim().length !== 15) {
      toast('GSTIN must be a 15-character alphanumeric identifier', 'warn');
    }

    setSaving(true);
    try {
      await updateFirm({
        ...form,
        firm_name: form.firm_name.trim(),
        gstin: form.gstin.trim().toUpperCase(),
        upi_id: form.upi_id.trim().toLowerCase(),
        inv_prefix: form.inv_prefix.trim().toUpperCase() || 'INV',
      });
      toast('Business profile updated successfully', 'success');
      onClose();
    } catch (err) {
      toast(err.message || 'Failed to update business details', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--bor)', paddingBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 'var(--r-sm)', background: 'var(--acb)', color: 'var(--acc)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Building2 size={20} strokeWidth={2.2} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--tx)', letterSpacing: '-0.02em' }}>
              Business Profile Settings
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--tx2)' }}>
              Configure details, tax compliance, and payment handles
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

      {/* Tabs */}
      <Tabs
        active={activeTab}
        onChange={setActiveTab}
        tabs={[
          ['general', 'General Info', <Building2 size={13} key="gen" />],
          ['tax', 'GST & Invoice', <FileSpreadsheet size={13} key="tax" />],
          ['banking', 'Bank & UPI', <Landmark size={13} key="bnk" />],
        ]}
      />

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Tab 1: General Info */}
        {activeTab === 'general' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="Business / Legal Entity Name" required hint="Printed as primary header on invoices">
              <input
                className="input"
                value={form.firm_name}
                onChange={(e) => updateField('firm_name', e.target.value)}
                placeholder="e.g. Apex Electronics & Retail"
                autoFocus
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <Field label="Business Nature">
                <select
                  className="select"
                  value={form.business_nature}
                  onChange={(e) => updateField('business_nature', e.target.value)}
                >
                  {BUSINESS_NATURES.map((bn) => (
                    <option key={bn.value} value={bn.value}>{bn.label}</option>
                  ))}
                </select>
              </Field>

              <Field label="State / Jurisdiction">
                <select
                  className="select"
                  value={form.state}
                  onChange={(e) => updateField('state', e.target.value)}
                >
                  <option value="">— Select State —</option>
                  {STATES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Registered Address">
              <input
                className="input"
                value={form.address}
                onChange={(e) => updateField('address', e.target.value)}
                placeholder="Shop No., Street, City, Pincode"
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <Field label="Contact Phone">
                <input
                  className="input"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </Field>

              <Field label="Official Email">
                <input
                  className="input"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                  placeholder="contact@business.com"
                />
              </Field>
            </div>

            <Field label="Website (Optional)">
              <input
                className="input"
                type="url"
                value={form.website}
                onChange={(e) => updateField('website', e.target.value)}
                placeholder="https://www.business.com"
              />
            </Field>
          </div>
        )}

        {/* Tab 2: GST & Invoicing */}
        {activeTab === 'tax' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: 'var(--surf2)', borderRadius: 'var(--r-sm)', border: '1px solid var(--bor)' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--tx)' }}>GST Registered Entity</div>
                <div style={{ fontSize: 11, color: 'var(--tx2)' }}>Enable GST calculation, HSN summaries, and tax breakdown</div>
              </div>
              <label style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.gst_registered}
                  onChange={(e) => updateField('gst_registered', e.target.checked)}
                  style={{ width: 18, height: 18, accentColor: 'var(--acc)', cursor: 'pointer' }}
                />
              </label>
            </div>

            {form.gst_registered && (
              <Field label="GSTIN (15 Digits)" required hint="Format: 07AAAAA0000A1Z5">
                <input
                  className="input num-mono"
                  value={form.gstin}
                  onChange={(e) => updateField('gstin', e.target.value.toUpperCase())}
                  placeholder="e.g. 07AAAAA0000A1Z5"
                  maxLength={15}
                />
              </Field>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <Field label="Default GST Rate (%)">
                <select
                  className="select"
                  value={form.default_gst_rate}
                  onChange={(e) => updateField('default_gst_rate', Number(e.target.value))}
                >
                  {GST_RATES.map((rate) => (
                    <option key={rate} value={rate}>{rate}%</option>
                  ))}
                </select>
              </Field>

              <Field label="Invoice Prefix" hint="Series code (e.g. INV, POS, RF)">
                <input
                  className="input num-mono"
                  value={form.inv_prefix}
                  onChange={(e) => updateField('inv_prefix', e.target.value.toUpperCase())}
                  placeholder="INV"
                  maxLength={6}
                />
              </Field>
            </div>

            <Field label="Default Invoice Notes">
              <textarea
                className="input"
                rows={2}
                value={form.default_notes}
                onChange={(e) => updateField('default_notes', e.target.value)}
                placeholder="Thank you for shopping with us! Visit again."
                style={{ resize: 'vertical' }}
              />
            </Field>

            <Field label="Standard Terms & Conditions">
              <textarea
                className="input"
                rows={2}
                value={form.default_tnc}
                onChange={(e) => updateField('default_tnc', e.target.value)}
                placeholder="Goods once sold cannot be returned without original receipt. Interest @ 18% on delayed payments."
                style={{ resize: 'vertical' }}
              />
            </Field>
          </div>
        )}

        {/* Tab 3: Bank & UPI */}
        {activeTab === 'banking' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field label="UPI ID (VPA)" hint="Used to generate dynamic QR codes on digital & printed bills">
              <input
                className="input num-mono"
                value={form.upi_id}
                onChange={(e) => updateField('upi_id', e.target.value)}
                placeholder="e.g. shopname@okhdfcbank"
              />
            </Field>

            <Field label="Bank Name">
              <input
                className="input"
                value={form.bank_name}
                onChange={(e) => updateField('bank_name', e.target.value)}
                placeholder="e.g. HDFC Bank, SBI, ICICI"
              />
            </Field>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              <Field label="Bank Account Number">
                <input
                  className="input num-mono"
                  value={form.account_no}
                  onChange={(e) => updateField('account_no', e.target.value)}
                  placeholder="Account Number"
                />
              </Field>

              <Field label="IFSC Code">
                <input
                  className="input num-mono"
                  value={form.ifsc}
                  onChange={(e) => updateField('ifsc', e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0001234"
                  maxLength={11}
                />
              </Field>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'var(--acb)', borderRadius: 'var(--r-sm)', color: 'var(--acc)', fontSize: 11.5 }}>
              <Info size={14} style={{ flexShrink: 0 }} />
              <span>Banking information will be printed on Tax Invoices for direct NEFT/RTGS payments.</span>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, borderTop: '1px solid var(--bor)', paddingTop: 14, marginTop: 6 }}>
          <Btn v="ghost" sz="md" onClick={onClose} disabled={saving}>
            Cancel
          </Btn>
          <Btn v="pri" sz="md" type="submit" loading={saving} icon={<Save size={14} />}>
            Save Changes
          </Btn>
        </div>
      </form>
    </div>
  );
}

export default function BusinessDetailsModal({ isOpen, onClose }) {
  const { activeFirmId } = useStore();
  if (!isOpen) return null;

  return (
    <Modal onClose={onClose} maxWidth="560px">
      <BusinessDetailsForm key={activeFirmId} onClose={onClose} />
    </Modal>
  );
}
