import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { invoiceApi } from '../../api/invoiceApi';
import LoadingSpinner from '../../components/Shared/LoadingSpinner';

const fmt = (n) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

export default function AgingDashboardPage() {
  const navigate = useNavigate();
  const [aging, setAging] = useState(null);
  const [dso, setDso] = useState(null);
  const [outstanding, setOutstanding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [agingData, dsoData, outstandingData] = await Promise.all([
          invoiceApi.getAging(),
          invoiceApi.getDso(),
          invoiceApi.getOutstanding(),
        ]);
        setAging(agingData);
        setDso(dsoData);
        setOutstanding(outstandingData);
      } catch {
        setError('Failed to load analytics. The API may not be connected yet.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <LoadingSpinner message="Loading aging report..." />;

  const buckets = [
    { label: 'Current', sublabel: 'Not yet due', cls: 'current', key: 'current', color: 'var(--status-paid)' },
    { label: '1–30 Days', sublabel: 'Slightly overdue', cls: 'overdue-30', key: 'oneToThirtyDays', color: 'var(--accent)' },
    { label: '31–60 Days', sublabel: 'Moderately overdue', cls: 'overdue-60', key: 'thirtyOneToSixtyDays', color: 'var(--status-partial)' },
    { label: '60+ Days', sublabel: 'Critically overdue', cls: 'overdue-plus', key: 'overSixtyDays', color: 'var(--status-overdue)' },
  ];

  const totalAging = aging
    ? buckets.reduce((sum, b) => sum + (aging[b.key] || 0), 0)
    : 0;

  return (
    <>
      <div className="topbar">
        <div className="topbar-title">
          <h1>Aging Report</h1>
          <p>Receivables analysis by aging bucket</p>
        </div>
        <div className="topbar-actions">
          <button className="btn btn-secondary" onClick={() => navigate('/analytics/revenue')}>
            Revenue →
          </button>
        </div>
      </div>

      <div className="page-container">
        {error && (
          <div className="alert alert-info">
            <span>ℹ</span> {error}
          </div>
        )}

        {/* DSO Card */}
        {dso && (
          <div className="stat-grid" style={{ marginBottom: '2rem' }}>
            <div className="stat-card">
              <div className="stat-label">Days Sales Outstanding (DSO)</div>
              <div className="stat-value accent">{dso.dso?.toFixed(1) || '—'}</div>
              <div className="stat-sub">days avg collection time</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Total Outstanding</div>
              <div className="stat-value danger">{fmt(outstanding?.totalOutstanding)}</div>
              <div className="stat-sub">across all invoices</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Overdue Invoices</div>
              <div className="stat-value" style={{ color: 'var(--status-overdue)' }}>
                {outstanding?.overdueCount || 0}
              </div>
              <div className="stat-sub">require immediate action</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Avg Invoice Value</div>
              <div className="stat-value">{fmt(outstanding?.averageInvoiceValue)}</div>
              <div className="stat-sub">per invoice</div>
            </div>
          </div>
        )}

        {/* Aging Buckets */}
        <div className="card" style={{ marginBottom: '1.5rem' }}>
          <div className="card-header">
            <div className="card-title">Receivables by Age</div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Total: {fmt(totalAging)}
            </span>
          </div>

          {!aging ? (
            <div className="empty-state">
              <div className="empty-state-icon">📊</div>
              <h3>No data available</h3>
              <p style={{ fontSize: '0.83rem' }}>Connect the API to see aging analytics</p>
            </div>
          ) : (
            <>
              <div className="aging-grid">
                {buckets.map(b => (
                  <div key={b.key} className={`aging-bucket ${b.cls}`}>
                    <div className="bucket-label">{b.label}</div>
                    <div className="bucket-amount">{fmt(aging[b.key] || 0)}</div>
                    <div className="bucket-count">{b.sublabel}</div>
                    <div className="progress-bar" style={{ marginTop: '0.75rem' }}>
                      <div
                        className="progress-fill"
                        style={{
                          width: totalAging > 0 ? `${((aging[b.key] || 0) / totalAging) * 100}%` : '0%',
                          background: b.color
                        }}
                      />
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                      {totalAging > 0 ? (((aging[b.key] || 0) / totalAging) * 100).toFixed(1) : 0}% of total
                    </div>
                  </div>
                ))}
              </div>

              {/* Detailed Bar Chart */}
              <div style={{ marginTop: '1.5rem' }}>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', fontWeight: 600 }}>
                  Visual Breakdown
                </div>
                {buckets.map(b => {
                  const pct = totalAging > 0 ? ((aging[b.key] || 0) / totalAging) * 100 : 0;
                  return (
                    <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.75rem' }}>
                      <div style={{ width: 100, fontSize: '0.78rem', color: 'var(--text-secondary)', flexShrink: 0 }}>{b.label}</div>
                      <div style={{ flex: 1, height: 24, background: 'var(--bg-elevated)', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${pct}%`,
                          background: b.color,
                          borderRadius: 4,
                          transition: 'width 0.5s ease',
                          display: 'flex',
                          alignItems: 'center',
                          paddingLeft: pct > 15 ? '0.5rem' : 0,
                        }}>
                          {pct > 10 && (
                            <span style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(0,0,0,0.7)' }}>
                              {pct.toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div style={{ width: 120, textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: b.color, flexShrink: 0 }}>
                        {fmt(aging[b.key] || 0)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Count breakdown if available */}
        {aging?.bucketCounts && (
          <div className="card">
            <div className="card-header">
              <div className="card-title">Invoice Count by Bucket</div>
            </div>
            <div className="info-grid">
              {buckets.map(b => (
                <div key={b.key} className="info-item">
                  <div className="info-item-label">{b.label}</div>
                  <div className="info-item-value" style={{ color: b.color, fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 800 }}>
                    {aging.bucketCounts?.[b.key] || 0}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>invoices</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
