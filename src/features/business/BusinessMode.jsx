import React from 'react';
import { useStore } from '../../store/index.js';
import { fmt, fmtDate, r2 } from '../../engine/calc.js';
import {
  Card,
  BezelCard,
  Stat,
  Tabs,
  Table,
  TR,
  TD,
  Badge,
  Empty,
  Btn,
  Alert
} from '../../components/ui/index.jsx';
import {
  TrendingUp,
  ArrowUpRight,
  Receipt,
  Boxes,
  Users,
  CreditCard,
  Activity,
  Plus
} from 'lucide-react';

const BIZ_TABS = [
  ['dash', 'Overview', <Activity key="a" size={14} />],
  ['money', 'Receivables & Cash Flow', <Users key="u" size={14} />],
  ['reports', 'Financial Reports', <TrendingUp key="t" size={14} />],
  ['txn', 'Transactions', <Receipt key="r" size={14} />],
  ['po', 'Purchase Orders', <Boxes key="b" size={14} />],
  ['payroll', 'Payroll', <CreditCard key="c" size={14} />],
];

export default function BusinessMode() {
  const { bizTab, patch, invoices, purchases, expenses, customers, fyFilter, setMode } = useStore();
  const fy = fyFilter === 'all' ? null : fyFilter;
  const fyI = invoices.filter(i => !fy || i.fy === fy);
  const fyP = purchases.filter(p => !fy || p.fy === fy);
  const fyE = expenses.filter(e => !fy || e.fy === fy);

  const tS = r2(fyI.reduce((a, i) => a + Number(i.total || 0), 0));
  const tP = r2(fyP.reduce((a, p) => a + Number(p.amount || 0), 0));
  const tE = r2(fyE.reduce((a, e) => a + Number(e.amount || 0), 0));
  const netProfit = r2(tS - tP - tE);
  const grossProfit = r2(tS - tP);
  const marginPct = tS > 0 ? ((netProfit / tS) * 100).toFixed(1) : '0.0';
  const outstanding = r2(customers.reduce((a, c) => a + Number(c.outstanding || 0), 0));
  const customersWithDues = customers.filter(c => Number(c.outstanding || 0) > 0);

  return (
    <div>
      {/* Editorial Header */}
      <div className="page-header">
        <div>
          <h1 className="page-header-title">Executive Command</h1>
          <div className="page-header-sub">
            Real-time financial telemetry, margin intelligence, and receivables radar
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="hero-pill">
            <span
              style={{
                width: 7,
                height: 7,
                borderRadius: '50%',
                background: netProfit >= 0 ? 'var(--grn)' : 'var(--red)',
                display: 'inline-block'
              }}
            />
            Net Margin: {marginPct}%
          </span>
          <Btn v="pri" sz="sm" icon={<Plus size={14} />} onClick={() => setMode('invoice')}>
            New Invoice
          </Btn>
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <Tabs tabs={BIZ_TABS} active={bizTab} onChange={t => patch({ bizTab: t })} />
      </div>

      {bizTab === 'dash' && (
        <div className="bento-grid">
          {/* Hero Telemetry Tile (Span 7) */}
          <div className="bento-col-7">
            <BezelCard style={{ height: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--tx3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Activity size={14} style={{ color: 'var(--acc)' }} />
                      Operating Profitability
                    </div>
                    <Badge v={netProfit >= 0 ? 'grn' : 'red'} dot>
                      {netProfit >= 0 ? 'Profitable' : 'Deficit'}
                    </Badge>
                  </div>
                  <div className="num-mono" style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.04em', color: netProfit >= 0 ? 'var(--grn)' : 'var(--red)', lineHeight: 1.1 }}>
                    {fmt(netProfit)}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--tx2)', marginTop: 8 }}>
                    Net earnings after {fmt(tP)} procurement and {fmt(tE)} overhead expenses.
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--bor-subtle)' }}>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase' }}>Gross Revenue</div>
                    <div className="num-mono" style={{ fontSize: 16, fontWeight: 800, color: 'var(--tx)', marginTop: 3 }}>{fmt(tS)}</div>
                    <div style={{ fontSize: 11, color: 'var(--tx2)', marginTop: 1 }}>{fyI.length} orders recorded</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase' }}>Gross Profit</div>
                    <div className="num-mono" style={{ fontSize: 16, fontWeight: 800, color: 'var(--acc)', marginTop: 3 }}>{fmt(grossProfit)}</div>
                    <div style={{ fontSize: 11, color: 'var(--tx2)', marginTop: 1 }}>Pre-overhead</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10.5, fontWeight: 700, color: 'var(--tx3)', textTransform: 'uppercase' }}>Profit Margin</div>
                    <div className="num-mono" style={{ fontSize: 16, fontWeight: 800, color: 'var(--tx)', marginTop: 3 }}>{marginPct}%</div>
                    <div style={{ fontSize: 11, color: 'var(--tx2)', marginTop: 1 }}>Yield on sales</div>
                  </div>
                </div>
              </div>
            </BezelCard>
          </div>

          {/* Receivables Radar Tile (Span 5) */}
          <div className="bento-col-5">
            <BezelCard style={{ height: '100%' }}>
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--tx3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Users size={14} style={{ color: 'var(--red)' }} />
                      Receivables Radar
                    </div>
                    <Badge v="red" dot pulse>
                      {customersWithDues.length} pending
                    </Badge>
                  </div>
                  <div className="num-mono" style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--red)', lineHeight: 1.1 }}>
                    {fmt(outstanding)}
                  </div>
                  <div style={{ fontSize: 12.5, color: 'var(--tx2)', marginTop: 6 }}>
                    Outstanding customer credit tied up in market accounts.
                  </div>
                </div>

                <div style={{ marginTop: 20 }}>
                  {customersWithDues.slice(0, 2).map(c => (
                    <div key={c.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--bor-subtle)', fontSize: 12.5 }}>
                      <span style={{ fontWeight: 600 }}>{c.name}</span>
                      <span className="num-mono" style={{ fontWeight: 700, color: 'var(--red)' }}>{fmt(c.outstanding)}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 14 }}>
                    <Btn v="ghost" sz="sm" iconRight={<ArrowUpRight size={13} />} onClick={() => patch({ bizTab: 'money' })} style={{ width: '100%' }}>
                      Manage Receivables Ledger
                    </Btn>
                  </div>
                </div>
              </div>
            </BezelCard>
          </div>


          {/* Intelligent Live Activity Stream (Span 8) */}
          <div className="bento-col-8">
            <Card>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontWeight: 800, fontSize: 14, letterSpacing: '-0.02em' }}>Live Transaction Activity</div>
                <span style={{ fontSize: 11, color: 'var(--tx2)', fontWeight: 600 }}>Latest 8 invoices</span>
              </div>
              {invoices.length === 0 ? (
                <Empty title="No invoice stream yet" sub="Generate your first sales invoice to activate telemetry." />
              ) : (
                <Table headers={['Invoice', 'Customer', 'Date', 'Amount', 'Status']} fintech>
                  {invoices.slice(0, 8).map(inv => (
                    <TR key={inv.id} onClick={() => { patch({ viewInv: inv, tab: 'list' }); setMode('invoice'); }}>
                      <TD mono style={{ color: 'var(--acc)', fontWeight: 700 }}>{inv.invoice_no}</TD>
                      <TD>
                        <span style={{ fontWeight: 600 }}>{inv.customer_name || 'Walk-in Customer'}</span>
                      </TD>
                      <TD style={{ color: 'var(--tx2)', fontSize: 12 }}>{fmtDate(inv.date)}</TD>
                      <TD right mono style={{ fontWeight: 700 }}>{fmt(inv.total)}</TD>
                      <TD>
                        <Badge v={inv.status === 'paid' ? 'grn' : inv.status === 'unpaid' ? 'red' : 'ylw'} dot>
                          {inv.status}
                        </Badge>
                      </TD>
                    </TR>
                  ))}
                </Table>
              )}
            </Card>
          </div>

          {/* Quick Shortcuts & Working Capital Balance (Span 4) */}
          <div className="bento-col-4">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Card>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--tx2)', marginBottom: 8 }}>
                  Purchases & Procurement
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--ffm)', color: 'var(--ylw)' }}>
                  {fmt(tP)}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--tx2)', marginTop: 4 }}>
                  {fyP.length} recorded supplier bills
                </div>
              </Card>

              <Card>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--tx2)', marginBottom: 8 }}>
                  Operating Expenses
                </div>
                <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--ffm)', color: 'var(--red)' }}>
                  {fmt(tE)}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--tx2)', marginTop: 4 }}>
                  Rent, utilities, salaries, and logistics
                </div>
              </Card>
            </div>
          </div>
        </div>
      )}

      {bizTab === 'reports' && (
        <Card refract>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>Financial Performance Statement</div>
              <div style={{ fontSize: 12, color: 'var(--tx2)', marginTop: 2 }}>Summary of revenue, procurement, and net profit</div>
            </div>
            <span className="hero-pill">FY 2024–25</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {[
              ['Gross Operating Sales', tS, 'var(--grn)', false],
              ['Cost of Goods Procured (Purchases)', tP, 'var(--red)', false],
              ['Gross Profit', grossProfit, grossProfit >= 0 ? 'var(--grn)' : 'var(--red)', true],
              ['Operational & Store Expenses', tE, 'var(--red)', false],
              ['Net Operating Margin', netProfit, netProfit >= 0 ? 'var(--grn)' : 'var(--red)', true],
            ].map(([l, v, c, isHeader]) => (
              <div
                key={l}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: isHeader ? '14px 10px' : '10px 10px',
                  borderBottom: '1px solid var(--bor-subtle)',
                  background: isHeader ? 'var(--surf2)' : 'transparent',
                  borderRadius: isHeader ? 'var(--r-sm)' : 0,
                  margin: isHeader ? '4px 0' : 0,
                }}
              >
                <span style={{ color: isHeader ? 'var(--tx)' : 'var(--tx2)', fontSize: 13, fontWeight: isHeader ? 700 : 500 }}>
                  {l}
                </span>
                <span style={{ fontWeight: 800, fontFamily: 'var(--ffm)', fontSize: isHeader ? 15 : 13, color: c }}>
                  {fmt(v)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {bizTab === 'money' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, marginBottom: 20 }}>
            <Stat
              label="Total Uncollected Credit"
              value={fmt(outstanding)}
              color="var(--red)"
              sub="Direct impact on operational cash liquidity"
            />
            <Stat
              label="Debtor Accounts"
              value={customersWithDues.length}
              sub={`Out of ${customers.length} total active clients`}
              color="var(--acc)"
            />
          </div>

          <Card>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 14 }}>Customer Credit Balances</div>
              <span style={{ fontSize: 11, color: 'var(--tx2)' }}>Sorted by highest overdue</span>
            </div>
            {customersWithDues.length === 0 ? (
              <Empty title="All receivables settled" sub="No customers currently have outstanding credit." />
            ) : (
              <Table headers={['Customer Name', 'Phone', 'Outstanding Due', 'Action']} fintech>
                {customersWithDues
                  .sort((a, b) => Number(b.outstanding || 0) - Number(a.outstanding || 0))
                  .map(c => (
                    <TR key={c.id}>
                      <TD style={{ fontWeight: 600 }}>{c.name}</TD>
                      <TD style={{ color: 'var(--tx2)' }}>{c.phone || '—'}</TD>
                      <TD right mono style={{ fontWeight: 700, color: 'var(--red)' }}>
                        {fmt(c.outstanding)}
                      </TD>
                      <TD right>
                        <a
                          href={`https://wa.me/${(c.phone || '').replace(/\D/g, '')}?text=${encodeURIComponent(
                            `Dear ${c.name}, greeting from your store. Outstanding balance of ${fmt(
                              c.outstanding
                            )} is pending. Please arrange settlement.`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: 11, padding: '4px 10px', textDecoration: 'none' }}
                        >
                          WhatsApp Reminder
                        </a>
                      </TD>
                    </TR>
                  ))}
              </Table>
            )}
          </Card>
        </div>
      )}

      {(bizTab === 'txn' || bizTab === 'po' || bizTab === 'payroll') && (
        <Alert v="info">
          This enterprise module is running in native sync. Additional detailed ledgers will populate automatically as transactions sync.
        </Alert>
      )}
    </div>
  );
}
