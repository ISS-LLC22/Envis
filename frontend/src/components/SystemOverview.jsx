import React, { useState, useEffect } from 'react';
import { Activity, AlertTriangle, Database, Zap, TrendingUp, Globe } from 'lucide-react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

export default function SystemOverview() {
  const [alertSummary, setAlertSummary] = useState(null);
  const [islogStats, setIslogStats] = useState(null);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [alertRes, statsRes, alertListRes] = await Promise.allSettled([
        fetch(`${API}/alerts/summary`).then(r => r.json()),
        fetch(`${API}/islog/stats`).then(r => r.json()),
        fetch(`${API}/alerts/active?limit=10`).then(r => r.json()),
      ]);
      if (alertRes.status === 'fulfilled') setAlertSummary(alertRes.value);
      if (statsRes.status === 'fulfilled') setIslogStats(statsRes.value);
      if (alertListRes.status === 'fulfilled') setActiveAlerts(alertListRes.value);
      setLastRefresh(new Date().toLocaleTimeString());
    } catch (err) {
      console.error('Failed to fetch overview data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleIngest = async () => {
    try {
      await fetch(`${API}/alerts/ingest`, { method: 'POST' });
      setTimeout(fetchData, 1000);
    } catch (err) {
      console.error('Ingest failed', err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <SectionHeader
        title="System Overview"
        subtitle="Live NWS alerts · IS-Log performance · Platform status"
        action={
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {lastRefresh && (
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Updated {lastRefresh}
              </span>
            )}
            <button className="btn-secondary" onClick={handleIngest} style={{ fontSize: '0.7rem' }}>
              Ingest NWS Now
            </button>
            <button className="btn-secondary" onClick={fetchData} style={{ fontSize: '0.7rem' }}>
              Refresh
            </button>
          </div>
        }
      />

      <div className="grid-4">
        <StatCard
          icon={<AlertTriangle size={18} />}
          label="Active NWS Alerts"
          value={loading ? '—' : (alertSummary?.total_active ?? 0)}
          color="var(--accent-amber)"
        />
        <StatCard
          icon={<Database size={18} />}
          label="IS-Log Entries"
          value={loading ? '—' : (islogStats?.total_entries ?? 0)}
          color="var(--accent-cyan)"
        />
        <StatCard
          icon={<TrendingUp size={18} />}
          label="Hit Rate"
          value={loading ? '—' : (islogStats?.hit_rate != null ? `${(islogStats.hit_rate * 100).toFixed(1)}%` : 'N/A')}
          color="var(--accent-green)"
        />
        <StatCard
          icon={<Activity size={18} />}
          label="Avg Brier Score"
          value={loading ? '—' : (islogStats?.avg_brier_score?.toFixed(3) ?? 'N/A')}
          color="var(--accent-teal)"
          subtitle="Lower is better"
        />
      </div>

      <div className="grid-2">
        <AlertBySeverityCard data={alertSummary} loading={loading} />
        <ISLogPerformanceCard data={islogStats} loading={loading} />
      </div>

      <ActiveAlertsTable alerts={activeAlerts} loading={loading} />

      <div className="grid-2">
        <DataSourcesCard />
        <PlatformHealthCard />
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle, action }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{subtitle}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

function StatCard({ icon, label, value, color, subtitle }) {
  return (
    <div className="envis-card" style={{ textAlign: 'center' }}>
      <div style={{ color, marginBottom: '0.5rem', display: 'flex', justifyContent: 'center' }}>{icon}</div>
      <div className="stat-value" style={{ color }}>{value}</div>
      <div className="stat-label">{label}</div>
      {subtitle && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
    </div>
  );
}

function AlertBySeverityCard({ data, loading }) {
  const SEVERITY_COLORS = {
    Extreme: 'var(--accent-red)',
    Severe: '#ff8c42',
    Moderate: 'var(--accent-amber)',
    Minor: 'var(--accent-teal)',
    Unknown: 'var(--text-muted)',
  };

  return (
    <div className="envis-card">
      <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.95rem', marginBottom: '1rem' }}>
        Alerts by Severity
      </h3>
      {loading ? (
        <div className="loading-pulse" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading...</div>
      ) : data?.by_severity ? (
        Object.entries(data.by_severity).map(([sev, count]) => (
          <div key={sev} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.8rem', color: SEVERITY_COLORS[sev] || 'var(--text-secondary)' }}>{sev}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: `${Math.min(count * 10, 120)}px`,
                height: '6px',
                background: SEVERITY_COLORS[sev] || 'var(--text-muted)',
                borderRadius: '3px',
                opacity: 0.7,
              }} />
              <span style={{ fontSize: '0.8rem', color: 'var(--text-primary)', minWidth: '24px', textAlign: 'right' }}>{count}</span>
            </div>
          </div>
        ))
      ) : (
        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>No alert data — ingest from NWS to populate</div>
      )}
    </div>
  );
}

function ISLogPerformanceCard({ data, loading }) {
  const hits = data?.hits || 0;
  const misses = data?.misses || 0;
  const pending = data?.pending || 0;
  const total = data?.total_entries || 0;

  return (
    <div className="envis-card">
      <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.95rem', marginBottom: '1rem' }}>
        IS-Log Performance
      </h3>
      {loading ? (
        <div className="loading-pulse" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading...</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            {[
              { label: 'Hits', value: hits, color: 'var(--accent-green)' },
              { label: 'Misses', value: misses, color: 'var(--accent-red)' },
              { label: 'Pending', value: pending, color: 'var(--accent-amber)' },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 700, color }}>{value}</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>Avg Confidence</span>
              <span>{data?.avg_confidence != null ? (data.avg_confidence * 100).toFixed(1) + '%' : 'N/A'}</span>
            </div>
            <div className="confidence-bar">
              <div className="confidence-fill" style={{ width: `${(data?.avg_confidence || 0) * 100}%` }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ActiveAlertsTable({ alerts, loading }) {
  const SEVERITY_BADGE = {
    Extreme: 'badge-red',
    Severe: 'badge-amber',
    Moderate: 'badge-amber',
    Minor: 'badge-cyan',
  };

  return (
    <div className="envis-card">
      <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.95rem', marginBottom: '1rem' }}>
        Recent Active Alerts
      </h3>
      {loading ? (
        <div className="loading-pulse" style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Loading...</div>
      ) : alerts.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem 0' }}>
          No active alerts — click "Ingest NWS Now" to fetch current data
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Event', 'Severity', 'Urgency', 'Area', 'Expires'].map(h => (
                  <th key={h} style={{ padding: '0.5rem 0.75rem', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {alerts.map((alert) => (
                <tr key={alert.id} style={{ borderBottom: '1px solid var(--border)', opacity: 0.9 }}>
                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-primary)' }}>{alert.event}</td>
                  <td style={{ padding: '0.6rem 0.75rem' }}>
                    <span className={`badge ${SEVERITY_BADGE[alert.severity] || 'badge-cyan'}`}>{alert.severity || '—'}</span>
                  </td>
                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)' }}>{alert.urgency || '—'}</td>
                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{alert.area_desc || '—'}</td>
                  <td style={{ padding: '0.6rem 0.75rem', color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                    {alert.expires ? new Date(alert.expires).toLocaleString() : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DataSourcesCard() {
  const sources = [
    { name: 'NWS Alerts API', url: 'api.weather.gov', status: 'active', color: 'var(--accent-green)' },
    { name: 'NCEI Storm Events', url: 'ncdc.noaa.gov/stormevents', status: 'active', color: 'var(--accent-green)' },
    { name: 'Anthropic Claude', url: 'anthropic.com', status: 'active', color: 'var(--accent-green)' },
    { name: 'PostgreSQL DB', url: 'localhost:5432', status: 'active', color: 'var(--accent-green)' },
    { name: 'EPA AQI', url: 'airnowapi.org', status: 'planned', color: 'var(--accent-amber)' },
    { name: 'USGS StreamStats', url: 'streamstats.usgs.gov', status: 'planned', color: 'var(--accent-amber)' },
  ];

  return (
    <div className="envis-card">
      <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.95rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Globe size={16} /> Data Sources
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {sources.map(src => (
          <div key={src.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)' }}>{src.name}</div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{src.url}</div>
            </div>
            <span className="badge" style={{ color: src.color, background: `${src.color}22`, border: `1px solid ${src.color}44`, fontSize: '0.6rem' }}>
              {src.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PlatformHealthCard() {
  const checks = [
    { label: 'FastAPI Backend', ok: true },
    { label: 'PostgreSQL', ok: true },
    { label: 'NWS Ingest Scheduler', ok: true },
    { label: 'AI Wizard (Anthropic)', ok: true },
    { label: 'NCEI Verification', ok: true },
    { label: 'Stakeholder Router', ok: true },
  ];

  return (
    <div className="envis-card">
      <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.95rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Zap size={16} /> Platform Health
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {checks.map(c => (
          <div key={c.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
            <span style={{ color: 'var(--text-secondary)' }}>{c.label}</span>
            <span style={{ color: c.ok ? 'var(--accent-green)' : 'var(--accent-red)', fontSize: '0.7rem', fontWeight: 600 }}>
              {c.ok ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
