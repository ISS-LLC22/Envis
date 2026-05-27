import React, { useState } from 'react';
import SystemOverview from './components/SystemOverview';
import ClaudeCodeTab from './components/ClaudeCodeTab';
import AIWizard from './components/AIWizard';
import ISLog from './components/ISLog';
import StakeholderViews from './components/StakeholderViews';
import DataFunding from './components/DataFunding';

const TABS = [
  { id: 'overview', label: 'System Overview', shortLabel: 'Overview' },
  { id: 'claude', label: 'Claude Code', shortLabel: 'Claude' },
  { id: 'wizard', label: 'AI Wizard', shortLabel: 'Wizard' },
  { id: 'islog', label: 'IS-Log', shortLabel: 'IS-Log' },
  { id: 'stakeholders', label: 'Stakeholder Views', shortLabel: 'Stakeholders' },
  { id: 'data', label: 'Data & Funding', shortLabel: 'Data' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main style={{ flex: 1, padding: '1.5rem', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
        {activeTab === 'overview' && <SystemOverview />}
        {activeTab === 'claude' && <ClaudeCodeTab />}
        {activeTab === 'wizard' && <AIWizard />}
        {activeTab === 'islog' && <ISLog />}
        {activeTab === 'stakeholders' && <StakeholderViews />}
        {activeTab === 'data' && <DataFunding />}
      </main>
      <footer style={{
        borderTop: '1px solid var(--border)',
        padding: '0.75rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.7rem',
        color: 'var(--text-muted)',
      }}>
        <span>ENVIS v1.0 — Environmental Intelligence Platform</span>
        <span>NWS · NOAA · NCEI · Anthropic Claude</span>
      </footer>
    </div>
  );
}

function Header({ activeTab, setActiveTab }) {
  return (
    <header style={{
      borderBottom: '1px solid var(--border)',
      background: 'var(--navy-800)',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '0 1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '2rem',
      }}>
        <div style={{ padding: '0.75rem 0', flexShrink: 0 }}>
          <div style={{
            fontFamily: 'Syne, sans-serif',
            fontWeight: 800,
            fontSize: '1.4rem',
            letterSpacing: '0.12em',
            color: 'var(--accent-cyan)',
          }}>
            ENVIS
          </div>
          <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', letterSpacing: '0.15em' }}>
            ENVIRONMENTAL INTELLIGENCE
          </div>
        </div>

        <nav style={{ display: 'flex', gap: '0', flex: 1, overflowX: 'auto' }}>
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                background: 'none',
                border: 'none',
                borderBottom: activeTab === tab.id
                  ? '2px solid var(--accent-cyan)'
                  : '2px solid transparent',
                color: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontFamily: 'IBM Plex Mono, monospace',
                fontSize: '0.75rem',
                fontWeight: activeTab === tab.id ? 600 : 400,
                letterSpacing: '0.04em',
                padding: '1rem 1rem',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <StatusIndicator />
      </div>
    </header>
  );
}

function StatusIndicator() {
  const [status] = useState('live');
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      fontSize: '0.65rem',
      color: 'var(--text-muted)',
      flexShrink: 0,
    }}>
      <div style={{
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: status === 'live' ? 'var(--accent-green)' : 'var(--accent-amber)',
        boxShadow: status === 'live' ? '0 0 6px var(--accent-green)' : 'none',
        animation: 'pulse 2s infinite',
      }} />
      {status.toUpperCase()}
    </div>
  );
}
