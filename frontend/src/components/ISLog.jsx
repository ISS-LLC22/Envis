import React, { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, XCircle, Clock, BarChart3 } from 'lucide-react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DOMAINS = ['meteorology', 'hydrology', 'air_quality', 'wildfire', 'public_health', 'infrastructure', 'agriculture', 'multi_domain'];
const HIT_MISS = ['hit', 'miss', 'partial', 'pending'];

export default function ISLog() {
  const [entries, setEntries] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ domain: '', hit_miss: '' });
  const [selected, setSelected] = useState(null);
  const [updateForm, setUpdateForm] = useState({ observed_outcome: '', hit_miss: '', brier_score: '' });
  const [updating, setUpdating] = useState(false);
  const [showCreate, setShowCreate] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filter.domain) params.append('domain', filter.domain);
      if (filter.hit_miss) params.append('hit_miss', filter.hit_miss);

      const [entriesRes, statsRes] = await Promise.allSettled([
        fetch(`${API}/islog/?${params}&limit=100`).then(r => r.json()),
        fetch(`${API}/islog/stats`).then(r => r.json()),
      ]);
      if (entriesRes.status === 'fulfilled') setEntries(Array.isArray(entriesRes.value) ? entriesRes.value : []);
      if (statsRes.status === 'fulfilled') setStats(statsRes.value);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [filter]);

  const handleUpdate = async () => {
    if (!selected) return;
    setUpdating(true);
    try {
      const body = {};
      if (updateForm.observed_outcome) body.observed_outcome = updateForm.observed_outcome;
      if (updateForm.hit_miss) body.hit_miss = updateForm.hit_miss;
      if (updateForm.brier_score) body.brier_score = parseFloat(updateForm.brier_score);

      const resp = await fetch(`${API}/islog/${selected.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (resp.ok) {
        await fetchData();
        setSelected(null);
        setUpdateForm({ observed_outcome: '', hit_miss: '', brier_score: '' });
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUpdating(false);
    }
  };

  const handleVerify = async (id) => {
    try {
      const resp = await fetch(`${API}/verification/verify/${id}`, { method: 'POST' });
      if (resp.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BookOpen size={22} color="var(--accent-cyan)" /> IS-Log
          </h2>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
            Intelligence Statement Log — prediction tracking with Brier scores
          </p>
        </div>
        <button className="btn-primary" onClick={() => setShowCreate(!showCreate)} style={{ fontSize: '0.78rem' }}>
          + New Entry
        </button>
      </div>

      {stats && <StatsRow stats={stats} />}

      {showCreate && <CreateEntryForm onCreated={() => { fetchData(); setShowCreate(false); }} />}

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '140px' }}>
          <select value={filter.domain} onChange={e => setFilter(f => ({ ...f, domain: e.target.value }))}>
            <option value="">All Domains</option>
            {DOMAINS.map(d => <option key={d} value={d}>{d.replace('_', ' ')}</option>)}
          </select>
        </div>
        <div style={{ flex: 1, minWidth: '140px' }}>
          <select value={filter.hit_miss} onChange={e => setFilter(f => ({ ...f, hit_miss: e.target.value }))}>
            <option value="">All Outcomes</option>
            {HIT_MISS.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
        </div>
        <button className="btn-secondary" onClick={fetchData} style={{ fontSize: '0.75rem' }}>Refresh</button>
      </div>

      {loading ? (
        <div className="loading-pulse envis-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>Loading IS-Log entries...</div>
      ) : entries.length === 0 ? (
        <div className="envis-card" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          No entries found. Use the AI Wizard (with Auto-Log enabled) to create entries.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {entries.map(entry => (
            <EntryCard
              key={entry.id}
              entry={entry}
              selected={selected?.id === entry.id}
              onSelect={() => setSelected(selected?.id === entry.id ? null : entry)}
              onVerify={() => handleVerify(entry.id)}
            />
          ))}
        </div>
      )}

      {selected && (
        <div className="envis-card" style={{ borderColor: 'var(--border-bright)' }}>
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Update Entry #{selected.id}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.3rem' }}>
                Observed Outcome
              </label>
              <textarea
                value={updateForm.observed_outcome}
                onChange={e => setUpdateForm(f => ({ ...f, observed_outcome: e.target.value }))}
                placeholder="What actually happened?"
                rows={2}
              />
            </div>
            <div className="grid-2">
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.3rem' }}>
                  Hit / Miss
                </label>
                <select value={updateForm.hit_miss} onChange={e => setUpdateForm(f => ({ ...f, hit_miss: e.target.value }))}>
                  <option value="">Select...</option>
                  {HIT_MISS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.3rem' }}>
                  Brier Score (0–1)
                </label>
                <input
                  type="number"
                  min="0"
                  max="1"
                  step="0.001"
                  value={updateForm.brier_score}
                  onChange={e => setUpdateForm(f => ({ ...f, brier_score: e.target.value }))}
                  placeholder="0.000"
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setSelected(null)}>Cancel</button>
              <button className="btn-primary" onClick={handleUpdate} disabled={updating}>
                {updating ? 'Saving...' : 'Save Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatsRow({ stats }) {
  return (
    <div className="grid-4">
      {[
        { label: 'Total Entries', value: stats.total_entries, color: 'var(--accent-cyan)' },
        { label: 'Hit Rate', value: stats.total_entries ? `${(stats.hit_rate * 100).toFixed(1)}%` : 'N/A', color: 'var(--accent-green)' },
        { label: 'Avg Confidence', value: `${(stats.avg_confidence * 100).toFixed(0)}%`, color: 'var(--accent-teal)' },
        { label: 'Avg Brier', value: stats.avg_brier_score?.toFixed(3) ?? 'N/A', color: 'var(--accent-amber)', subtitle: 'Lower = better' },
      ].map(({ label, value, color, subtitle }) => (
        <div key={label} className="envis-card" style={{ textAlign: 'center' }}>
          <div className="stat-value" style={{ color }}>{value}</div>
          <div className="stat-label">{label}</div>
          {subtitle && <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: 2 }}>{subtitle}</div>}
        </div>
      ))}
    </div>
  );
}

function EntryCard({ entry, selected, onSelect, onVerify }) {
  const HIT_MISS_CONFIG = {
    hit: { icon: <CheckCircle size={14} />, color: 'var(--accent-green)', class: 'badge-green' },
    miss: { icon: <XCircle size={14} />, color: 'var(--accent-red)', class: 'badge-red' },
    partial: { icon: <BarChart3 size={14} />, color: 'var(--accent-amber)', class: 'badge-amber' },
    pending: { icon: <Clock size={14} />, color: 'var(--text-muted)', class: 'badge-cyan' },
  };
  const hm = HIT_MISS_CONFIG[entry.hit_miss] || HIT_MISS_CONFIG.pending;

  return (
    <div
      className="envis-card"
      style={{ borderColor: selected ? 'var(--accent-cyan)' : 'var(--border)', cursor: 'pointer' }}
      onClick={onSelect}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.85rem', color: 'var(--accent-cyan)' }}>
              #{entry.id}
            </span>
            <span className="badge badge-purple" style={{ textTransform: 'capitalize' }}>
              {entry.domain?.replace('_', ' ')}
            </span>
            <span className={`badge ${hm.class}`} style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
              {hm.icon} {entry.hit_miss}
            </span>
            {entry.brier_score != null && (
              <span className="badge badge-amber">Brier {entry.brier_score.toFixed(3)}</span>
            )}
          </div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '0.4rem' }}>
            {entry.prediction.substring(0, 180)}{entry.prediction.length > 180 ? '...' : ''}
          </p>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            {new Date(entry.timestamp_issued).toLocaleString()} · Confidence: {(entry.confidence_score * 100).toFixed(0)}%
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', flexShrink: 0 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', fontWeight: 700, color: entry.confidence_score >= 0.7 ? 'var(--accent-green)' : entry.confidence_score >= 0.4 ? 'var(--accent-amber)' : 'var(--accent-red)' }}>
              {(entry.confidence_score * 100).toFixed(0)}%
            </div>
            <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>CONF</div>
          </div>
          {entry.hit_miss === 'pending' && entry.observed_outcome && (
            <button
              className="btn-secondary"
              onClick={e => { e.stopPropagation(); onVerify(); }}
              style={{ fontSize: '0.65rem', padding: '0.25rem 0.6rem' }}
            >
              Verify
            </button>
          )}
        </div>
      </div>

      {entry.data_sources?.length > 0 && (
        <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {entry.data_sources.map((s, i) => (
            <span key={i} style={{ fontSize: '0.65rem', background: 'var(--navy-600)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '3px', padding: '1px 6px' }}>
              {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function CreateEntryForm({ onCreated }) {
  const [form, setForm] = useState({
    domain: 'meteorology',
    prediction: '',
    confidence_score: 0.7,
    data_sources: '',
    missing_data_flags: '',
    era_stratum: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const body = {
        domain: form.domain,
        prediction: form.prediction,
        confidence_score: parseFloat(form.confidence_score),
        data_sources: form.data_sources ? form.data_sources.split(',').map(s => s.trim()).filter(Boolean) : [],
        missing_data_flags: form.missing_data_flags ? form.missing_data_flags.split(',').map(s => s.trim()).filter(Boolean) : [],
        era_stratum: form.era_stratum || null,
      };
      const resp = await fetch(`${API}/islog/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (resp.ok) onCreated();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="envis-card" style={{ borderColor: 'var(--border-bright)' }}>
      <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.9rem', marginBottom: '1rem' }}>Create IS-Log Entry</h3>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="grid-2">
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.3rem' }}>Domain</label>
            <select value={form.domain} onChange={e => setForm(f => ({ ...f, domain: e.target.value }))}>
              {DOMAINS.map(d => <option key={d} value={d}>{d.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.3rem' }}>
              Confidence ({(form.confidence_score * 100).toFixed(0)}%)
            </label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={form.confidence_score}
              onChange={e => setForm(f => ({ ...f, confidence_score: e.target.value }))}
              style={{ padding: 0, height: '36px' }}
            />
          </div>
        </div>
        <div>
          <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.3rem' }}>Prediction</label>
          <textarea value={form.prediction} onChange={e => setForm(f => ({ ...f, prediction: e.target.value }))} rows={3} placeholder="State your prediction..." required />
        </div>
        <div className="grid-2">
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.3rem' }}>Data Sources (comma-separated)</label>
            <input value={form.data_sources} onChange={e => setForm(f => ({ ...f, data_sources: e.target.value }))} placeholder="NWS, NCEI, NOAA..." />
          </div>
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.3rem' }}>Data Gaps (comma-separated)</label>
            <input value={form.missing_data_flags} onChange={e => setForm(f => ({ ...f, missing_data_flags: e.target.value }))} placeholder="Real-time radar, Soil moisture..." />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          <button type="submit" className="btn-primary" disabled={submitting || !form.prediction}>
            {submitting ? 'Creating...' : 'Create Entry'}
          </button>
        </div>
      </form>
    </div>
  );
}
