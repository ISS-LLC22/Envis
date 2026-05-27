import React, { useState } from 'react';
import { Terminal, Code2, BookOpen, Layers, Cpu, GitBranch } from 'lucide-react';

export default function ClaudeCodeTab() {
  const [activeSection, setActiveSection] = useState('architecture');

  const sections = [
    { id: 'architecture', label: 'Architecture', icon: <Layers size={14} /> },
    { id: 'backend', label: 'Backend API', icon: <Terminal size={14} /> },
    { id: 'models', label: 'Data Models', icon: <Database size={14} /> },
    { id: 'services', label: 'Services', icon: <Cpu size={14} /> },
    { id: 'deploy', label: 'Deployment', icon: <GitBranch size={14} /> },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 700 }}>Claude Code</h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
          Platform architecture, API reference, and implementation details
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={activeSection === s.id ? 'btn-primary' : 'btn-secondary'}
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', padding: '0.4rem 0.9rem' }}
          >
            {s.icon} {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'architecture' && <ArchitectureSection />}
      {activeSection === 'backend' && <BackendAPISection />}
      {activeSection === 'models' && <DataModelsSection />}
      {activeSection === 'services' && <ServicesSection />}
      {activeSection === 'deploy' && <DeploymentSection />}
    </div>
  );
}

function Database({ size }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>;
}

function CodeBlock({ code, lang = 'bash' }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div style={{ position: 'relative', marginTop: '0.5rem' }}>
      <pre style={{
        background: 'var(--navy-900)',
        border: '1px solid var(--border)',
        borderRadius: '6px',
        padding: '1rem',
        fontSize: '0.78rem',
        lineHeight: 1.6,
        overflowX: 'auto',
        color: 'var(--text-secondary)',
      }}>
        <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', display: 'block', marginBottom: '0.5rem', textTransform: 'uppercase' }}>{lang}</span>
        {code}
      </pre>
      <button
        onClick={copy}
        className="btn-secondary"
        style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', fontSize: '0.65rem', padding: '0.25rem 0.6rem' }}
      >
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  );
}

function InfoCard({ title, children }) {
  return (
    <div className="envis-card" style={{ marginBottom: '1rem' }}>
      <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--accent-cyan)' }}>{title}</h3>
      {children}
    </div>
  );
}

function ArchitectureSection() {
  return (
    <div>
      <InfoCard title="Stack Overview">
        <div className="grid-2">
          {[
            { layer: 'Frontend', tech: 'React 18 + IBM Plex Mono + Syne', color: 'var(--accent-cyan)' },
            { layer: 'Backend', tech: 'FastAPI (Python 3.11+)', color: 'var(--accent-teal)' },
            { layer: 'Database', tech: 'PostgreSQL + SQLAlchemy async', color: 'var(--accent-purple)' },
            { layer: 'AI Layer', tech: 'Anthropic Claude (claude-sonnet-4-6)', color: 'var(--accent-green)' },
            { layer: 'NWS Ingest', tech: 'api.weather.gov + APScheduler', color: 'var(--accent-amber)' },
            { layer: 'Verification', tech: 'NCEI Storm Events Database', color: 'var(--accent-red)' },
          ].map(({ layer, tech, color }) => (
            <div key={layer} style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
              <span style={{ color, fontWeight: 600, fontSize: '0.75rem', minWidth: '90px' }}>{layer}</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>{tech}</span>
            </div>
          ))}
        </div>
      </InfoCard>

      <InfoCard title="Directory Structure">
        <CodeBlock lang="tree" code={`envis/
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       │   ├── SystemOverview.jsx
│       │   ├── ClaudeCodeTab.jsx
│       │   ├── AIWizard.jsx
│       │   ├── ISLog.jsx
│       │   ├── StakeholderViews.jsx
│       │   └── DataFunding.jsx
│       ├── App.jsx
│       └── index.css
├── backend/
│   ├── main.py          # FastAPI app + lifespan
│   ├── models.py        # SQLAlchemy ORM models
│   ├── schemas.py       # Pydantic schemas
│   ├── database.py      # Async DB setup
│   ├── config.py        # Settings (env vars)
│   ├── routers/
│   │   ├── alerts.py    # NWS alert endpoints
│   │   ├── islog.py     # IS-Log CRUD
│   │   ├── wizard.py    # AI Wizard endpoint
│   │   ├── stakeholders.py
│   │   └── verification.py
│   └── services/
│       ├── nws_ingest.py
│       ├── ncei_verification.py
│       ├── ai_wizard.py
│       └── stakeholder_router.py
├── .env.template
└── README.md`} />
      </InfoCard>
    </div>
  );
}

function BackendAPISection() {
  const endpoints = [
    { method: 'GET', path: '/alerts/active', desc: 'List active NWS alerts' },
    { method: 'POST', path: '/alerts/ingest', desc: 'Trigger NWS alert ingest' },
    { method: 'GET', path: '/alerts/summary', desc: 'Alert summary by severity/event' },
    { method: 'GET', path: '/islog/', desc: 'List IS-Log entries (filterable)' },
    { method: 'POST', path: '/islog/', desc: 'Create IS-Log entry' },
    { method: 'GET', path: '/islog/stats', desc: 'Hit rate, Brier scores, counts' },
    { method: 'PATCH', path: '/islog/{id}', desc: 'Update outcome/hit-miss/Brier' },
    { method: 'POST', path: '/wizard/query', desc: 'AI Wizard query (auto-logs)' },
    { method: 'GET', path: '/stakeholders/types', desc: 'List 8 stakeholder types' },
    { method: 'GET', path: '/stakeholders/islog/{id}/{type}', desc: 'Stakeholder-specific view' },
    { method: 'GET', path: '/stakeholders/islog/{id}/all', desc: 'All 8 stakeholder views' },
    { method: 'GET', path: '/verification/storm-events', desc: 'NCEI historical lookup' },
    { method: 'POST', path: '/verification/verify/{id}', desc: 'Verify prediction, calc Brier' },
    { method: 'GET', path: '/verification/leaderboard', desc: 'Domain accuracy leaderboard' },
  ];

  const METHOD_COLORS = { GET: 'var(--accent-teal)', POST: 'var(--accent-green)', PATCH: 'var(--accent-amber)', DELETE: 'var(--accent-red)' };

  return (
    <div>
      <InfoCard title="API Endpoints">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {endpoints.map(ep => (
            <div key={ep.path} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', fontSize: '0.78rem', padding: '0.3rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ color: METHOD_COLORS[ep.method], fontWeight: 600, minWidth: '50px', fontSize: '0.7rem' }}>{ep.method}</span>
              <code style={{ color: 'var(--accent-cyan)', minWidth: '260px', fontSize: '0.75rem' }}>{ep.path}</code>
              <span style={{ color: 'var(--text-muted)' }}>{ep.desc}</span>
            </div>
          ))}
        </div>
      </InfoCard>
      <InfoCard title="Quick Start">
        <CodeBlock lang="bash" code={`# Install backend
cd backend && pip install -r requirements.txt

# Set up environment
cp ../.env.template .env
# Edit .env with your credentials

# Run backend (from project root)
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000

# In separate terminal — install & run frontend
cd frontend && npm install && npm start`} />
      </InfoCard>
    </div>
  );
}

function DataModelsSection() {
  return (
    <div>
      <InfoCard title="IS-Log Schema">
        <CodeBlock lang="sql" code={`CREATE TABLE is_log (
  id                 SERIAL PRIMARY KEY,
  domain             domain_enum NOT NULL,          -- meteorology, hydrology, etc.
  timestamp_issued   TIMESTAMP NOT NULL,
  prediction         TEXT NOT NULL,
  data_sources       JSONB DEFAULT '[]',            -- ["NWS", "NCEI", ...]
  confidence_score   FLOAT NOT NULL,                -- 0.0 – 1.0
  uncertainty_band   JSONB DEFAULT '{}',            -- {"low": 0.3, "high": 0.7}
  missing_data_flags JSONB DEFAULT '[]',            -- data gap strings
  era_stratum        VARCHAR(64),                   -- "1950-1979", "2000-present"
  stakeholder_outputs JSONB DEFAULT '{}',           -- keyed by stakeholder
  observed_outcome   TEXT,                          -- filled after event
  hit_miss           hit_miss_enum DEFAULT 'pending',
  brier_score        FLOAT,                         -- 0.0 = perfect, 1.0 = worst
  gap_flags_post     JSONB DEFAULT '[]',            -- post-event gap analysis
  learning_delta     FLOAT,                         -- improvement signal
  cross_domain_chain JSONB DEFAULT '[]',            -- linked IS-Log IDs
  created_at         TIMESTAMP DEFAULT NOW(),
  updated_at         TIMESTAMP DEFAULT NOW()
);`} />
      </InfoCard>
      <InfoCard title="NWS Alert Schema">
        <CodeBlock lang="sql" code={`CREATE TABLE nws_alerts (
  id          SERIAL PRIMARY KEY,
  alert_id    VARCHAR(256) UNIQUE NOT NULL,   -- NWS alert UUID
  event       VARCHAR(128) NOT NULL,           -- "Tornado Warning", etc.
  headline    TEXT,
  description TEXT,
  instruction TEXT,
  severity    VARCHAR(32),                     -- Extreme/Severe/Moderate/Minor
  urgency     VARCHAR(32),                     -- Immediate/Expected/Future
  certainty   VARCHAR(32),                     -- Observed/Likely/Possible
  area_desc   TEXT,
  effective   TIMESTAMP,
  expires     TIMESTAMP,
  status      VARCHAR(32) DEFAULT 'active',
  raw_json    JSONB,
  ingested_at TIMESTAMP DEFAULT NOW()
);`} />
      </InfoCard>
    </div>
  );
}

function ServicesSection() {
  const services = [
    {
      name: 'NWS Ingest (nws_ingest.py)',
      desc: 'Polls api.weather.gov/alerts/active every 5 minutes via APScheduler. Deduplicates by alert_id. Parses GeoJSON feature properties.',
      rules: ['Upsert-safe (no duplicates)', 'ISO 8601 datetime parsing', 'Area filtering by state code'],
    },
    {
      name: 'AI Wizard (ai_wizard.py)',
      desc: 'Sends queries to claude-sonnet-4-6 with system prompt enforcing 8 discipline rules. Returns structured JSON with confidence, sources, gaps.',
      rules: ['Cite sources (Rule 1)', 'Show confidence 0–1 (Rule 2)', 'Fact/Inference/Estimate labels (Rule 3)', 'Name data gaps (Rule 4)', 'No false certainty (Rule 5)', 'Historical comparison (Rule 6)', 'Auto-log to IS-Log (Rule 7)', 'Flag outside confidence range (Rule 8)'],
    },
    {
      name: 'NCEI Verification (ncei_verification.py)',
      desc: 'Queries NCEI CDO API for historical storm event data. Calculates Brier score: (p - o)² where p=predicted probability, o=observed boolean.',
      rules: ['Brier Score 0.0 = perfect', 'Supports event type + state + year range filters', 'Falls back to mock data without API key'],
    },
    {
      name: 'Stakeholder Router (stakeholder_router.py)',
      desc: 'Routes IS-Log entries to 8 audience-specific views with appropriate jargon level, priority fields, and urgency coloring.',
      rules: ['8 stakeholder types', 'Confidence label mapping (HIGH/MODERATE/LOW)', 'Urgency color system (green/yellow/orange/red)', 'Auto-extracts caveats from data gaps'],
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {services.map(svc => (
        <div key={svc.name} className="envis-card">
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.9rem', color: 'var(--accent-cyan)', marginBottom: '0.5rem' }}>{svc.name}</h3>
          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.75rem' }}>{svc.desc}</p>
          <ul style={{ paddingLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            {svc.rules.map(r => (
              <li key={r} style={{ fontSize: '0.75rem', color: 'var(--text-muted)', listStyle: 'none', paddingLeft: '0.5rem', borderLeft: '2px solid var(--accent-teal)' }}>
                {r}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

function DeploymentSection() {
  return (
    <div>
      <InfoCard title="Vercel (Frontend)">
        <CodeBlock lang="bash" code={`# vercel.json (place in frontend/)
{
  "buildCommand": "npm run build",
  "outputDirectory": "build",
  "env": {
    "REACT_APP_API_URL": "https://your-backend.railway.app"
  }
}`} />
      </InfoCard>
      <InfoCard title="Railway / Render (Backend)">
        <CodeBlock lang="bash" code={`# Procfile (place in backend/)
web: uvicorn backend.main:app --host 0.0.0.0 --port $PORT

# Required environment variables:
DATABASE_URL=postgresql+asyncpg://...
ANTHROPIC_API_KEY=sk-ant-...
CORS_ORIGINS=https://your-vercel-app.vercel.app`} />
      </InfoCard>
      <InfoCard title="Docker Compose (Local)">
        <CodeBlock lang="yaml" code={`version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: envis
      POSTGRES_PASSWORD: postgres
    ports: ["5432:5432"]

  backend:
    build: ./backend
    ports: ["8000:8000"]
    depends_on: [db]
    env_file: .env

  frontend:
    build: ./frontend
    ports: ["3000:3000"]
    depends_on: [backend]`} />
      </InfoCard>
    </div>
  );
}
