# ENVIS — Environmental Intelligence Platform

A full-stack environmental intelligence platform for live NWS alert ingestion, AI-powered analysis, prediction logging, and stakeholder-specific communication.

## Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, IBM Plex Mono + Syne (Google Fonts) |
| Backend | FastAPI (Python 3.11+), async |
| Database | PostgreSQL 15 + SQLAlchemy async + Alembic |
| AI | Anthropic Claude (claude-sonnet-4-6) |
| NWS Ingest | api.weather.gov + APScheduler (5 min) |
| Verification | NCEI Storm Events Database |
| Deploy | Vercel (frontend) + Railway/Render (backend) |

---

## Quick Start

### 1. Prerequisites

- Python 3.11+
- Node.js 18+
- PostgreSQL 15+
- Anthropic API key (for AI Wizard)

### 2. Database Setup

```sql
CREATE DATABASE envis;
```

### 3. Backend

```bash
pip install -r backend/requirements.txt
cp .env.template .env
# Edit .env with your DATABASE_URL and ANTHROPIC_API_KEY

# Run from the project root
uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
```

The database tables are auto-created on startup via `init_db()`.

### 4. Frontend

```bash
cd frontend
npm install
# Copy REACT_APP_API_URL=http://localhost:8000 into frontend/.env.local
npm start
```

App runs at **http://localhost:3000**

API docs at **http://localhost:8000/docs**

---

## Features

### 6 Navigation Tabs

| Tab | Description |
|---|---|
| System Overview | Live NWS alerts, IS-Log performance stats, data source health |
| Claude Code | Architecture reference, API endpoints, data models, deployment guide |
| AI Wizard | Query Claude with 8 discipline rules; auto-logs to IS-Log |
| IS-Log | Create/view/update prediction log entries with Brier scoring |
| Stakeholder Views | Route IS-Log entries to 8 audience-specific views |
| Data & Funding | Data source registry, NCEI lookup, accuracy leaderboard, funding directory |

### IS-Log Fields

| Field | Type | Description |
|---|---|---|
| `id` | int | Auto-increment primary key |
| `domain` | enum | meteorology, hydrology, air_quality, wildfire, public_health, infrastructure, agriculture, multi_domain |
| `timestamp_issued` | datetime | When the prediction was made |
| `prediction` | text | The prediction statement |
| `data_sources` | JSON array | Named sources used |
| `confidence_score` | float 0–1 | Predicted probability |
| `uncertainty_band` | JSON `{low, high}` | Uncertainty range |
| `missing_data_flags` | JSON array | Identified data gaps |
| `era_stratum` | string | Historical time period of primary data |
| `stakeholder_outputs` | JSON dict | Per-stakeholder summaries |
| `observed_outcome` | text | What actually happened |
| `hit_miss` | enum | hit / miss / partial / pending |
| `brier_score` | float 0–1 | (predicted - observed)² |
| `gap_flags_post` | JSON array | Post-event gap analysis |
| `learning_delta` | float | 0.5 - brier_score |
| `cross_domain_chain` | JSON array | Linked IS-Log entry IDs |

### AI Wizard — 8 Discipline Rules

1. **Cite Sources** — Named data sources for every claim
2. **Show Confidence** — Explicit probability 0.0–1.0
3. **Separate Fact from Inference** — `[FACT]` / `[INFERENCE]` / `[ESTIMATE]` labels
4. **Name Data Gaps** — Missing data that would change the assessment
5. **No False Certainty** — Calibrated language ("may" not "will")
6. **Historical Comparison** — Baseline comparison required
7. **Auto-Log to IS-Log** — Every response logged automatically
8. **Flag Outside Confidence Range** — Explicit flag when beyond data bounds

### Stakeholder Types

| ID | Label | Jargon Level |
|---|---|---|
| `meteorologist` | Meteorologist | Technical |
| `emergency_manager` | Emergency Manager | Operational |
| `hospital` | Hospital / Healthcare | Medical-Operational |
| `school` | School Administrator | Administrative |
| `utility` | Utility / Infrastructure | Engineering-Operational |
| `agriculture` | Agriculture | Agronomic |
| `family` | Family / Public | Plain English |
| `researcher` | Researcher / Academic | Scientific |

---

## API Reference

See full interactive docs at `/docs` when the backend is running.

Key endpoints:

```
POST /alerts/ingest              Trigger NWS alert fetch
GET  /alerts/active              List active alerts
GET  /alerts/summary             Alert summary by severity
POST /islog/                     Create IS-Log entry
GET  /islog/                     List entries (filterable)
GET  /islog/stats                Hit rate, Brier scores
PATCH /islog/{id}                Update outcome/hit-miss
POST /wizard/query               AI Wizard query
GET  /stakeholders/islog/{id}/{type}  Stakeholder view
GET  /verification/storm-events  NCEI historical data
POST /verification/verify/{id}   Calculate Brier score
GET  /verification/leaderboard   Domain accuracy ranking
```

---

## Deployment

### Vercel (Frontend)

1. Connect GitHub repo to Vercel
2. Set root directory to `frontend`
3. Add env var: `REACT_APP_API_URL=https://your-backend.railway.app`

### Railway (Backend)

1. Connect GitHub repo
2. Set start command: `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
3. Add env vars from `.env.template`
4. Provision a PostgreSQL plugin

### Environment Variables

See `.env.template` in the project root for all required variables.

---

## Data Sources

| Source | Agency | Cost | Status |
|---|---|---|---|
| NWS Alerts API | National Weather Service | Free | Active |
| NCEI Storm Events | NOAA | Free (key required) | Active |
| EPA AirNow | EPA | Free (key required) | Planned |
| USGS StreamStats | USGS | Free | Planned |
| NASA FIRMS Wildfire | NASA | Free | Planned |

---

## License

MIT
