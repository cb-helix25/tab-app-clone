import React from 'react';
import { ApiCallLog } from './useLocalFetchLogger';

interface Props {
  calls: ApiCallLog[];
  onClear(): void;
  collapsed: boolean;
  onToggle(): void;
}

export const PitchDebugPanel: React.FC<Props> = ({ calls, onClear, collapsed, onToggle }) => {
  return (
    <div style={{ position: 'fixed', bottom: 8, right: 8, zIndex: 9999, fontFamily: 'monospace', fontSize: 11 }}>
      <div style={{ background: '#222', color: '#fff', padding: '4px 8px', borderRadius: 4, boxShadow: '0 2px 6px rgba(0,0,0,0.4)', minWidth: 260 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <strong>Fetch Log ({calls.length})</strong>
          <button onClick={onToggle} style={btnStyle}>{collapsed ? 'Expand' : 'Collapse'}</button>
          <button onClick={onClear} style={btnStyle}>Clear</button>
        </div>
        {!collapsed && (
          <div style={{ maxHeight: 220, overflow: 'auto', marginTop: 6, background: '#111', padding: 4 }}>
            {calls.slice().reverse().map(c => (
              <div key={c.id} style={{ borderBottom: '1px solid #333', padding: '4px 0' }}>
                <div>
                  <span style={{ color: '#0af' }}>{c.method}</span> {c.status !== undefined && c.status !== -1 ? c.status : 'ERR'} {c.url}
                </div>
                <div style={{ opacity: 0.7 }}>{c.durationMs.toFixed(0)}ms {c.error && <span style={{ color: 'tomato' }}>{c.error}</span>}</div>
                {c.data && (
                  <pre style={preStyle}>{c.data}</pre>
                )}
              </div>
            ))}
            {calls.length === 0 && <div style={{ opacity: 0.6 }}>No calls yet.</div>}
          </div>
        )}
      </div>
    </div>
  );
};

const btnStyle: React.CSSProperties = {
  background: '#444',
  color: '#fff',
  border: 'none',
  cursor: 'pointer',
  padding: '2px 6px',
  borderRadius: 3,
  fontSize: 11
};

const preStyle: React.CSSProperties = {
  margin: '4px 0 0',
  maxHeight: 120,
  overflow: 'auto',
  whiteSpace: 'pre-wrap',
  background: '#000',
  padding: 4,
  borderRadius: 3
};

export default PitchDebugPanel;
