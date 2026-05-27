import React, { useState } from 'react';
import { Wand2, AlertCircle, CheckCircle, BookOpen } from 'lucide-react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DOMAINS = [
  { value: '', label: 'Auto-detect domain' },
  { value: 'meteorology', label: 'Meteorology' },
  { value: 'hydrology', label: 'Hydrology' },
  { value: 'air_quality', label: 'Air Quality' },
  { value: 'wildfire', label: 'Wildfire' },
  { value: 'public_health', label: 'Public Health' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'agriculture', label: 'Agriculture' },
  { value: 'multi_domain', label: 'Multi-Domain' },
];

const SAMPLE_QUERIES = [
  "What is the probability of a major tornado outbreak in the Southern Plains this week?",
  "Compare current drought conditions in the Colorado River Basin to the 2012 drought",
  "What are the flood risk factors for the Mississippi River given recent precipitation?",
  "How does the current wildfire risk in California compare to historical averages?",
];

export default function AIWizard() {
  const [query, setQuery] = useState('');
  const [domain, setDomain] = useState('');
  const [context, setContext] = useState('');
  const [autoLog, setAutoLog] = useState(true);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const resp = await fetch(`${API}/wizard/query`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: query.trim(),
          domain: domain || null,
          context: context || null,
          auto_log: autoLog,
        }),
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || 'Wizard query failed');
      }
      setResult(await resp.json());
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
          <Wand2 size={22} color="var(--accent-cyan)" /> AI Wizard
        </h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
          Environmental intelligence queries governed by 8 scientific discipline rules
        </p>
      </div>

      <DisciplineRulesCard />

      <div className="envis-card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.4rem' }}>
              Query
            </label>
            <textarea
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Ask an environmental intelligence question..."
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          <div className="grid-2">
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.4rem' }}>
                Domain
              </label>
              <select value={domain} onChange={e => setDomain(e.target.value)}>
                {DOMAINS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.4rem' }}>
                Additional Context (optional)
              </label>
              <input
                value={context}
                onChange={e => setContext(e.target.value)}
                placeholder="e.g. Location: Dallas TX, Time: next 72 hours"
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-secondary)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={autoLog}
                onChange={e => setAutoLog(e.target.checked)}
                style={{ width: 'auto', cursor: 'pointer' }}
              />
              Auto-log to IS-Log
            </label>
            <button className="btn-primary" type="submit" disabled={loading || !query.trim()}>
              {loading ? 'Querying Claude...' : 'Ask Wizard'}
            </button>
          </div>
        </form>

        <div style={{ marginTop: '1rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Sample Queries
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {SAMPLE_QUERIES.map((q, i) => (
              <button
                key={i}
                onClick={() => setQuery(q)}
                className="btn-secondary"
                style={{ fontSize: '0.7rem', padding: '0.3rem 0.75rem', textAlign: 'left' }}
              >
                {q.substring(0, 55)}...
              </button>
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div style={{ background: '#ff4d6d11', border: '1px solid #ff4d6d44', borderRadius: '8px', padding: '1rem', display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <AlertCircle size={16} color="var(--accent-red)" style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--accent-red)', fontWeight: 600 }}>Error</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>{error}</div>
            {error.includes('ANTHROPIC_API_KEY') && (
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                Set ANTHROPIC_API_KEY in your .env file to enable the AI Wizard.
              </div>
            )}
          </div>
        </div>
      )}

      {loading && (
        <div className="envis-card loading-pulse" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          <Wand2 size={24} color="var(--accent-cyan)" style={{ margin: '0 auto 0.75rem' }} />
          <div style={{ fontSize: '0.85rem' }}>Claude is analyzing your query with 8 discipline rules...</div>
        </div>
      )}

      {result && <WizardResult result={result} />}
    </div>
  );
}

function DisciplineRulesCard() {
  const [expanded, setExpanded] = useState(false);
  const rules = [
    { num: 1, rule: 'Cite Sources', desc: 'All claims backed by named data sources' },
    { num: 2, rule: 'Show Confidence', desc: 'Explicit probability 0.0–1.0 for all predictions' },
    { num: 3, rule: 'Fact vs Inference', desc: '[FACT] / [INFERENCE] / [ESTIMATE] labels required' },
    { num: 4, rule: 'Name Data Gaps', desc: 'Missing data that would change the assessment' },
    { num: 5, rule: 'No False Certainty', desc: 'Calibrated language — "may" not "will"' },
    { num: 6, rule: 'Historical Comparison', desc: 'Baseline comparison to historical record' },
    { num: 7, rule: 'Auto-Log to IS-Log', desc: 'Every response logged for verification' },
    { num: 8, rule: 'Flag Out-of-Range', desc: 'Explicit flag when beyond data confidence' },
  ];

  return (
    <div className="envis-card" style={{ borderColor: 'var(--border-bright)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <BookOpen size={15} color="var(--accent-cyan)" /> 8 Discipline Rules
        </h3>
        <button className="btn-secondary" onClick={() => setExpanded(!expanded)} style={{ fontSize: '0.7rem' }}>
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>
      {expanded && (
        <div className="grid-2" style={{ marginTop: '0.75rem' }}>
          {rules.map(r => (
            <div key={r.num} style={{ display: 'flex', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--accent-cyan)', fontFamily: 'Syne, sans-serif', fontWeight: 700, minWidth: '20px', fontSize: '0.85rem' }}>{r.num}</span>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: 500 }}>{r.rule}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.desc}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WizardResult({ result }) {
  const [activeStakeholder, setActiveStakeholder] = useState('family');
  const confidence = result.confidence_score;
  const confidenceColor = confidence >= 0.7 ? 'var(--accent-green)' : confidence >= 0.45 ? 'var(--accent-amber)' : 'var(--accent-red)';

  const STAKEHOLDERS = ['meteorologist', 'emergency_manager', 'hospital', 'school', 'utility', 'agriculture', 'family', 'researcher'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="envis-card" style={{ borderColor: 'var(--border-bright)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle size={18} color="var(--accent-green)" />
            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.95rem', fontWeight: 600 }}>Analysis Complete</span>
            {result.is_log_id && (
              <span className="badge badge-cyan">IS-Log #{result.is_log_id}</span>
            )}
            {result.outside_confidence_range && (
              <span className="badge badge-red">OUT OF RANGE</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Confidence</span>
            <span style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.2rem', fontWeight: 700, color: confidenceColor }}>
              {(confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="grid-4" style={{ marginBottom: '1rem' }}>
          <MetricChip label="Confidence" value={`${(confidence * 100).toFixed(0)}%`} color={confidenceColor} />
          <MetricChip label="Uncertainty Low" value={`${((result.uncertainty_band?.low || 0) * 100).toFixed(0)}%`} color="var(--text-secondary)" />
          <MetricChip label="Uncertainty High" value={`${((result.uncertainty_band?.high || 0) * 100).toFixed(0)}%`} color="var(--text-secondary)" />
          <MetricChip label="Era" value={result.era_stratum || 'N/A'} color="var(--accent-purple)" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div>
            <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>Analysis</div>
            <div style={{ fontSize: '0.82rem', lineHeight: 1.7, color: 'var(--text-secondary)', background: 'var(--navy-900)', padding: '0.75rem', borderRadius: '6px', borderLeft: '3px solid var(--accent-cyan)' }}>
              {result.answer}
            </div>
          </div>

          <div className="grid-2">
            <TagList label="Data Sources" items={result.data_sources} color="var(--accent-teal)" />
            <TagList label="Data Gaps" items={result.missing_data_flags} color="var(--accent-amber)" />
          </div>

          {result.discipline_flags?.length > 0 && (
            <TagList label="Discipline Flags" items={result.discipline_flags} color="var(--accent-red)" />
          )}
        </div>
      </div>

      {result.stakeholder_outputs && Object.keys(result.stakeholder_outputs).length > 0 && (
        <div className="envis-card">
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.95rem', marginBottom: '0.75rem' }}>Stakeholder Views</h3>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
            {STAKEHOLDERS.map(s => (
              result.stakeholder_outputs[s] && (
                <button
                  key={s}
                  onClick={() => setActiveStakeholder(s)}
                  className={activeStakeholder === s ? 'btn-primary' : 'btn-secondary'}
                  style={{ fontSize: '0.7rem', padding: '0.3rem 0.75rem', textTransform: 'capitalize' }}
                >
                  {s.replace('_', ' ')}
                </button>
              )
            ))}
          </div>
          {result.stakeholder_outputs[activeStakeholder] && (
            <div style={{ fontSize: '0.82rem', lineHeight: 1.7, color: 'var(--text-secondary)', background: 'var(--navy-900)', padding: '0.75rem', borderRadius: '6px', borderLeft: '3px solid var(--accent-purple)' }}>
              <div style={{ fontSize: '0.65rem', color: 'var(--accent-purple)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>
                For: {activeStakeholder.replace('_', ' ')}
              </div>
              {result.stakeholder_outputs[activeStakeholder]}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MetricChip({ label, value, color }) {
  return (
    <div style={{ background: 'var(--navy-900)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.5rem 0.75rem', textAlign: 'center' }}>
      <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 700, color }}>{value}</div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{label}</div>
    </div>
  );
}

function TagList({ label, items, color }) {
  if (!items?.length) return null;
  return (
    <div>
      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>{label}</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
        {items.map((item, i) => (
          <span key={i} style={{ fontSize: '0.7rem', background: `${color}11`, color, border: `1px solid ${color}33`, borderRadius: '4px', padding: '2px 7px' }}>
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
