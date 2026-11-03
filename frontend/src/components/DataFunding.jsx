import React, { useState, useEffect } from 'react';
import { Database, DollarSign, BarChart3, ExternalLink } from 'lucide-react';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const DATA_SOURCES = [
  {
    name: 'NWS Alerts API',
    agency: 'National Weather Service',
    url: 'https://api.weather.gov',
    status: 'implemented',
    cost: 'Free',
    type: 'API',
    endpoint: '/alerts/active',
    latency: 'Real-time (5 min poll)',
    domains: ['meteorology', 'hydrology'],
    notes: 'No API key required. Uses User-Agent header for identification.',
  },
  {
    name: 'NCEI Storm Events',
    agency: 'National Centers for Environmental Information',
    url: 'https://www.ncdc.noaa.gov/stormevents/',
    status: 'implemented',
    cost: 'Free',
    type: 'API / CSV',
    endpoint: '/cdo-web/api/v2/data',
    latency: 'Historical (updated monthly)',
    domains: ['meteorology', 'hydrology', 'wildfire'],
    notes: 'Free API key from ncdc.noaa.gov. Rate limited to 1,000 req/day (free tier).',
  },
  {
    name: 'Anthropic Claude API',
    agency: 'Anthropic',
    url: 'https://www.anthropic.com',
    status: 'implemented',
    cost: 'Pay-per-token',
    type: 'LLM API',
    endpoint: '/v1/messages',
    latency: '2–10 sec',
    domains: ['multi_domain'],
    notes: 'claude-sonnet-4-6 model. Typical query: $0.003–$0.02.',
  },
  {
    name: 'EPA AirNow API',
    agency: 'Environmental Protection Agency',
    url: 'https://www.airnowapi.org',
    status: 'planned',
    cost: 'Free',
    type: 'API',
    endpoint: '/aq/observation/zipCode/current/',
    latency: 'Hourly',
    domains: ['air_quality', 'public_health'],
    notes: 'Free API key required. AQI data for 400+ monitoring stations.',
  },
  {
    name: 'USGS StreamStats',
    agency: 'US Geological Survey',
    url: 'https://streamstats.usgs.gov',
    status: 'planned',
    cost: 'Free',
    type: 'API',
    endpoint: '/streamstats/v3/streamflow',
    latency: 'Real-time (15 min)',
    domains: ['hydrology'],
    notes: 'Stream gauge data for flood prediction and water resource management.',
  },
  {
    name: 'NOAA Climate Data Online',
    agency: 'NOAA',
    url: 'https://www.ncdc.noaa.gov/cdo-web/',
    status: 'planned',
    cost: 'Free',
    type: 'API',
    endpoint: '/cdo-web/api/v2/',
    latency: 'Daily (climate records)',
    domains: ['meteorology', 'agriculture'],
    notes: 'Historical climate normals, station data, temperature/precipitation.',
  },
  {
    name: 'NASA FIRMS (Wildfire)',
    agency: 'NASA',
    url: 'https://firms.modaps.eosdis.nasa.gov',
    status: 'planned',
    cost: 'Free',
    type: 'API / GeoJSON',
    endpoint: '/api/area/csv/',
    latency: '3–12 hour satellite pass',
    domains: ['wildfire'],
    notes: 'Near real-time active fire data from MODIS and VIIRS satellites.',
  },
  {
    name: 'USDA NASS CropScape',
    agency: 'USDA National Agricultural Statistics Service',
    url: 'https://nassgeodata.gmu.edu/CropScape/',
    status: 'planned',
    cost: 'Free',
    type: 'API / WMS',
    endpoint: '/wms/services/',
    latency: 'Annual (updated seasonally)',
    domains: ['agriculture'],
    notes: 'Cropland data layer, planting dates, yield forecasts by county.',
  },
];

const FUNDING_SOURCES = [
  {
    category: 'Federal Grants',
    items: [
      { name: 'NOAA Climate & Societal Interactions', amount: '$50K–$500K', deadline: 'Rolling', url: 'https://cpo.noaa.gov/Divisions-Programs/Earth-System-Science-and-Modeling/Climate-and-Societal-Interactions' },
      { name: 'FEMA BRIC Program', amount: '$1M–$50M', deadline: 'Annual (Oct)', url: 'https://www.fema.gov/grants/mitigation/building-resilient-infrastructure-communities' },
      { name: 'NSF Convergence Accelerator', amount: '$750K–$5M', deadline: 'Rolling solicitations', url: 'https://www.nsf.gov/od/oia/convergenceaccelerator/' },
      { name: 'EPA STAR Grants', amount: '$100K–$1.5M', deadline: 'Annual', url: 'https://www.epa.gov/research-grants' },
    ],
  },
  {
    category: 'State & Regional Programs',
    items: [
      { name: 'State Emergency Mgmt. Hazard Mitigation', amount: 'Varies', deadline: 'State-specific', url: null },
      { name: 'Regional Climate Resilience Funds', amount: '$25K–$250K', deadline: 'Rolling', url: null },
      { name: 'Utility Partnership R&D Programs', amount: '$10K–$100K', deadline: 'Ongoing', url: null },
    ],
  },
  {
    category: 'Private & Foundation',
    items: [
      { name: 'Bezos Earth Fund', amount: '$1M+', deadline: 'By invitation', url: 'https://www.bezosearthfund.org' },
      { name: 'Bloomberg Philanthropies (Climate)', amount: '$500K+', deadline: 'Annual', url: 'https://www.bloomberg.org/environment/' },
      { name: 'Schmidt Futures (AI + Climate)', amount: '$100K–$2M', deadline: 'Rolling', url: 'https://www.schmidtfutures.com' },
    ],
  },
];

export default function DataFunding() {
  const [leaderboard, setLeaderboard] = useState([]);
  const [stormType, setStormType] = useState('Tornado');
  const [stormData, setStormData] = useState(null);
  const [loadingStorm, setLoadingStorm] = useState(false);
  const [activeTab, setActiveTab] = useState('sources');

  useEffect(() => {
    fetch(`${API}/verification/leaderboard`)
      .then(r => r.json())
      .then(data => setLeaderboard(Array.isArray(data) ? data : []))
      .catch(console.error);
  }, []);

  const loadStormData = async () => {
    setLoadingStorm(true);
    try {
      const resp = await fetch(`${API}/verification/storm-events?event_type=${encodeURIComponent(stormType)}`);
      setStormData(await resp.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStorm(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      <div>
        <h2 style={{ fontFamily: 'Syne, sans-serif', fontSize: '1.4rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Database size={22} color="var(--accent-cyan)" /> Data & Funding
        </h2>
        <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>
          Data source registry, NCEI verification, accuracy leaderboard, and funding directory
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        {[
          { id: 'sources', label: 'Data Sources' },
          { id: 'ncei', label: 'NCEI Verification' },
          { id: 'leaderboard', label: 'Accuracy Leaderboard' },
          { id: 'funding', label: 'Funding Directory' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={activeTab === t.id ? 'btn-primary' : 'btn-secondary'}
            style={{ fontSize: '0.78rem' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'sources' && <DataSourcesPanel sources={DATA_SOURCES} />}
      {activeTab === 'ncei' && <NCEIPanel stormType={stormType} setStormType={setStormType} stormData={stormData} loading={loadingStorm} onLoad={loadStormData} />}
      {activeTab === 'leaderboard' && <LeaderboardPanel data={leaderboard} />}
      {activeTab === 'funding' && <FundingPanel sources={FUNDING_SOURCES} />}
    </div>
  );
}

function DataSourcesPanel({ sources }) {
  const [filter, setFilter] = useState('all');
  const filtered = filter === 'all' ? sources : sources.filter(s => s.status === filter);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {['all', 'implemented', 'planned'].map(f => (
          <button key={f} className={filter === f ? 'btn-primary' : 'btn-secondary'} onClick={() => setFilter(f)} style={{ fontSize: '0.72rem', padding: '0.3rem 0.8rem', textTransform: 'capitalize' }}>
            {f}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {filtered.map(src => (
          <div key={src.name} className="envis-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                  <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '0.9rem' }}>{src.name}</span>
                  <span className={`badge ${src.status === 'implemented' ? 'badge-green' : 'badge-amber'}`}>{src.status}</span>
                  <span className="badge badge-cyan">{src.type}</span>
                </div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>{src.agency}</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>{src.notes}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                  {src.domains.map(d => (
                    <span key={d} style={{ fontSize: '0.65rem', background: 'var(--navy-600)', color: 'var(--accent-purple)', border: '1px solid #9b59b644', borderRadius: '3px', padding: '1px 6px', textTransform: 'capitalize' }}>
                      {d.replace('_', ' ')}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.75rem', color: src.cost === 'Free' ? 'var(--accent-green)' : 'var(--accent-amber)', fontWeight: 600 }}>{src.cost}</div>
                <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>{src.latency}</div>
                <code style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>{src.endpoint}</code>
                <a href={src.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)', fontSize: '0.68rem', display: 'flex', alignItems: 'center', gap: '3px', justifyContent: 'flex-end', marginTop: '0.4rem', textDecoration: 'none' }} onClick={e => e.stopPropagation()}>
                  Docs <ExternalLink size={10} />
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NCEIPanel({ stormType, setStormType, stormData, loading, onLoad }) {
  const STORM_TYPES = ['Tornado', 'Hurricane', 'Flood', 'Blizzard', 'Drought', 'Wildfire', 'Thunderstorm Wind', 'Hail', 'Winter Storm', 'Lightning'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="envis-card">
        <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.9rem', marginBottom: '0.75rem' }}>NCEI Storm Events Historical Lookup</h3>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: '160px' }}>
            <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: '0.3rem' }}>
              Event Type
            </label>
            <select value={stormType} onChange={e => setStormType(e.target.value)}>
              {STORM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <button className="btn-primary" onClick={onLoad} disabled={loading}>
            {loading ? 'Loading...' : 'Query NCEI'}
          </button>
        </div>
      </div>

      {stormData && (
        <div className="envis-card">
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.9rem', marginBottom: '0.75rem' }}>
            Historical Data: {stormData.event_type}
          </h3>
          {stormData.note && (
            <div style={{ background: 'var(--navy-900)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem' }}>
              {stormData.note}
            </div>
          )}
          {stormData.mock_data && (
            <div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Historical Summary (Mock Data)</div>
              <div className="grid-3">
                {Object.entries(stormData.mock_data).map(([k, v]) => (
                  <div key={k} style={{ background: 'var(--navy-900)', border: '1px solid var(--border)', borderRadius: '6px', padding: '0.75rem', textAlign: 'center' }}>
                    <div style={{ fontFamily: 'Syne, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--accent-cyan)' }}>{String(v)}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', textTransform: 'capitalize', marginTop: '2px' }}>{k.replace(/_/g, ' ')}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{ marginTop: '0.75rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
            Source: <a href="https://www.ncdc.noaa.gov/stormevents/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)' }}>NCEI Storm Events Database</a>
          </div>
        </div>
      )}
    </div>
  );
}

function LeaderboardPanel({ data }) {
  return (
    <div className="envis-card">
      <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.9rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <BarChart3 size={16} /> Domain Accuracy Leaderboard
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontFamily: 'IBM Plex Mono' }}>(lower Brier = better)</span>
      </h3>
      {data.length === 0 ? (
        <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', padding: '1rem 0' }}>
          No verified predictions yet. Add observed outcomes to IS-Log entries to calculate Brier scores.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {data.map((row, i) => (
            <div key={row.domain} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontFamily: 'Syne, sans-serif', fontWeight: 700, fontSize: '1rem', color: i === 0 ? 'var(--accent-green)' : 'var(--text-muted)', minWidth: '20px' }}>
                #{i + 1}
              </span>
              <span style={{ fontSize: '0.82rem', flex: 1, textTransform: 'capitalize', color: 'var(--text-primary)' }}>
                {row.domain.replace('_', ' ')}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{row.count} entries</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--accent-teal)' }}>
                {(row.avg_confidence * 100).toFixed(0)}% avg conf
              </span>
              <span className="badge badge-cyan">
                Brier {row.avg_brier_score?.toFixed(3) ?? 'N/A'}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function FundingPanel({ sources }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {sources.map(cat => (
        <div key={cat.category} className="envis-card">
          <h3 style={{ fontFamily: 'Syne, sans-serif', fontSize: '0.95rem', color: 'var(--accent-cyan)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={15} /> {cat.category}
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {cat.items.map(item => (
              <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', padding: '0.5rem 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-primary)' }}>{item.name}</span>
                    {item.url && (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-cyan)' }}>
                        <ExternalLink size={11} />
                      </a>
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '2px' }}>Deadline: {item.deadline}</div>
                </div>
                <span className="badge badge-green" style={{ flexShrink: 0 }}>{item.amount}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
