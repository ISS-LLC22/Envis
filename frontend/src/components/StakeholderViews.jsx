import React, { useState, useEffect } from 'react';
import { Users, ChevronRight } from 'lucide-react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const STAKEHOLDER_ICONS = {
  meteorologist: '🌩',
  emergency_manager: '🚨',
  hospital: '🏥',
  school: '🏫',
  utility: '⚡',
  agriculture: '🌾',
  family: '🏠',
  researcher: '🔬',
};

export default function StakeholderViews() {
  const [stakeholderTypes, setStakeholderTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('family');
  const [entryId, setEntryId] = useState('');
  const [view, setView] = useState(null);
  const [allViews, setAllViews] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentEntries, setRecentEntries] = useState([]);

  useEffect(() => {
    fetch(`${API}/stakeholders/types`)
      .then(r => r.json())
      .then(setStakeholderTypes)
      .catch(console.error);

    fetch(`${API}/islog/?limit=20`)
      .then(r => r.json())
      .then(data => setRecentEntries(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const fetchView = async (type) => {
    if (!entryId) return;
    setLoading(true);
    setError('');
    setView(null);
    try {
      const resp = await fetch(`${API}/stakeholders/islog/${entryId}/${type}`);
      if (!resp.ok) throw new Error((await resp.json()).detail || 'Failed to load view');
      setView(await resp.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllViews = async () => {
    if (!entryId) return;
    setLoading(true);
    setError('');
    setAllViews(null);
    try {
      const resp = await fetch(`${API}/stakeholders/islog/${entryId}/all`);
      if (!resp.ok) throw new Error((await resp.json()).detail || 'Failed to load all views');
      setAllViews(await resp.json());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Users size={22} color="var(--accent-cyan)" /> Stakeholder Views
        </h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
          8 audience-specific views of IS-Log entries with tailored language and priority fields
        </p>
      </div>

      <div className="grid-4">
        {(stakeholderTypes.length > 0 ? stakeholderTypes : DEFAULT_TYPES).map(st => (
          <StakeholderCard
            key={st.id}
            type={st}
            selected={selectedType === st.id}
            onSelect={() => {
              setSelectedType(st.id);
              if (entryId) fetchView(st.id);
            }}
          />
        ))}
      </div>

      <div className="envis-card">
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.9rem', marginBottom: '0.75rem' }}>Load IS-Log Entry</h3>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '120px' }}>
            <input
              type="number"
              value={entryId}
              onChange={e => setEntryId(e.target.value)}
              placeholder="IS-Log Entry ID..."
              min="1"
            />
          </div>
          <button className="btn-primary" onClick={() => fetchView(selectedType)} disabled={!entryId || loading} style={{ fontSize: '0.8rem' }}>
            Load {selectedType.replace('_', ' ')} View
          </button>
          <button className="btn-secondary" onClick={fetchAllViews} disabled={!entryId || loading} style={{ fontSize: '0.8rem' }}>
            Load All 8 Views
          </button>
        </div>

        {recentEntries.length > 0 && (
          <div style={{ marginTop: '0.75rem' }}>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Recent IS-Log Entries</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
              {recentEntries.slice(0, 10).map(e => (
                <button
                  key={e.id}
                  className="btn-secondary"
                  style={{ fontSize: '0.7rem', padding: '0.25rem 0.6rem' }}
                  onClick={() => setEntryId(String(e.id))}
                >
                  #{e.id} · {e.domain?.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div style={{ background: '#ff4d6d11', border: '1px solid #ff4d6d44', borderRadius: '8px', padding: '0.75rem 1rem', fontSize: '0.8rem', color: 'var(--accent-red)' }}>
          {error}
        </div>
      )}

      {loading && (
        <div className="envis-card loading-pulse" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          Loading stakeholder view...
        </div>
      )}

      {view && !allViews && <SingleViewPanel view={view} />}

      {allViews && <AllViewsPanel allViews={allViews} selectedType={selectedType} onSelectType={setSelectedType} />}
    </div>
  );
}

const DEFAULT_TYPES = [
  { id: 'meteorologist', label: 'Meteorologist', jargon_level: 'technical' },
  { id: 'emergency_manager', label: 'Emergency Manager', jargon_level: 'operational' },
  { id: 'hospital', label: 'Hospital / Healthcare', jargon_level: 'medical_operational' },
  { id: 'school', label: 'School Administrator', jargon_level: 'administrative' },
  { id: 'utility', label: 'Utility / Infrastructure', jargon_level: 'engineering_operational' },
  { id: 'agriculture', label: 'Agriculture', jargon_level: 'agronomic' },
  { id: 'family', label: 'Family / Public', jargon_level: 'plain_english' },
  { id: 'researcher', label: 'Researcher', jargon_level: 'scientific' },
];

function StakeholderCard({ type, selected, onSelect }) {
  const JARGON_COLORS = {
    technical: 'var(--accent-cyan)',
    operational: 'var(--accent-amber)',
    medical_operational: 'var(--accent-red)',
    administrative: 'var(--accent-purple)',
    engineering_operational: 'var(--accent-teal)',
    agronomic: 'var(--accent-green)',
    plain_english: 'var(--text-secondary)',
    scientific: 'var(--accent-purple)',
  };
  const color = JARGON_COLORS[type.jargon_level] || 'var(--text-secondary)';

  return (
    <div
      className="envis-card"
      onClick={onSelect}
      style={{
        cursor: 'pointer',
        borderColor: selected ? color : 'var(--border)',
        background: selected ? `${color}11` : 'var(--navy-700)',
        transition: 'all 0.2s',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: '1.5rem', marginBottom: '0.4rem' }}>
        {STAKEHOLDER_ICONS[type.id] || '👤'}
      </div>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.82rem', fontWeight: 600, color: selected ? color : 'var(--text-primary)' }}>
        {type.label}
      </div>
      <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)', marginTop: '0.25rem', textTransform: 'capitalize' }}>
        {type.jargon_level?.replace('_', ' ')}
      </div>
    </div>
  );
}

function SingleViewPanel({ view }) {
  const URGENCY_COLORS = { green: 'var(--accent-green)', yellow: 'var(--accent-amber)', orange: '#ff8c42', red: 'var(--accent-red)' };
  const color = URGENCY_COLORS[view.urgency_color] || 'var(--accent-cyan)';

  return (
    <div className="envis-card" style={{ borderColor: `${color}44` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <span style={{ fontSize: '1.4rem' }}>{STAKEHOLDER_ICONS[view.stakeholder] || '👤'}</span>
            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.1rem', fontWeight: 700 }}>{view.label}</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Domain: {view.domain?.replace('_', ' ')} · {view.timestamp_issued ? new Date(view.timestamp_issued).toLocaleString() : ''}
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.2rem', fontWeight: 700, color }}>
            {view.confidence_label}
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            {(view.confidence_score * 100).toFixed(0)}% confidence
          </div>
        </div>
      </div>

      <div style={{ background: 'var(--navy-900)', borderRadius: '6px', padding: '0.75rem', marginBottom: '1rem', borderLeft: `3px solid ${color}` }}>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
          Primary Message
        </div>
        <div style={{ fontSize: '0.82rem', lineHeight: 1.7, color: 'var(--text-secondary)' }}>
          {view.primary_message || 'No message available'}
        </div>
      </div>

      <div className="grid-2">
        {view.data_sources?.length > 0 && (
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Sources</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem' }}>
              {view.data_sources.map((s, i) => <span key={i} style={{ fontSize: '0.68rem', background: 'var(--navy-600)', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: '3px', padding: '1px 6px' }}>{s}</span>)}
            </div>
          </div>
        )}
        {view.caveats?.length > 0 && (
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Caveats</div>
            {view.caveats.map((c, i) => (
              <div key={i} style={{ fontSize: '0.72rem', color: 'var(--accent-amber)', display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginBottom: '0.25rem' }}>
                <span style={{ marginTop: 2 }}>⚠</span> {c}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function AllViewsPanel({ allViews, selectedType, onSelectType }) {
  const types = Object.keys(allViews);
  const current = allViews[selectedType] || allViews[types[0]];

  return (
    <div style={{ display: 'flex', gap: '1rem' }}>
      <div style={{ width: '200px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
        {types.map(type => {
          const v = allViews[type];
          const URGENCY_COLORS = { green: 'var(--accent-green)', yellow: 'var(--accent-amber)', orange: '#ff8c42', red: 'var(--accent-red)' };
          const color = URGENCY_COLORS[v.urgency_color] || 'var(--text-muted)';
          return (
            <button
              key={type}
              onClick={() => onSelectType(type)}
              style={{
                background: selectedType === type ? 'var(--navy-600)' : 'transparent',
                border: `1px solid ${selectedType === type ? 'var(--accent-cyan)' : 'var(--border)'}`,
                borderRadius: '6px',
                color: 'var(--text-primary)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.75rem',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              <span>{STAKEHOLDER_ICONS[type] || '👤'}</span>
              <span style={{ fontSize: '0.75rem', flex: 1 }}>{v.label}</span>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }} />
            </button>
          );
        })}
      </div>
      <div style={{ flex: 1 }}>
        {current && <SingleViewPanel view={current} />}
      </div>
    </div>
  );
}
