import React, { useState, useEffect } from 'react';
import { getCallLogs, clearCallLogs, CallLogEntry } from '../utils/callLogger';

interface DataInspectorProps {
  data: any;
  onClose: () => void;
}

const DataInspector: React.FC<DataInspectorProps> = ({ data, onClose }) => {
  const [activeTab, setActiveTab] = useState<'user' | 'calls' | 'cache' | 'environment'>('user');
  const [callLogs, setCallLogs] = useState<CallLogEntry[]>([]);
  const [cacheData, setCacheData] = useState<any>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Prevent body scroll when modal is open
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    
    // Load call logs
    setCallLogs(getCallLogs());

    // Extract cache data from localStorage
    const cache: any = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key) {
        try {
          const value = localStorage.getItem(key);
          if (value) {
            cache[key] = JSON.parse(value);
          }
        } catch {
          cache[key] = localStorage.getItem(key);
        }
      }
    }
    setCacheData(cache);

    // Cleanup function to restore body scroll
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const getEnvironmentData = () => ({
    runtime: {
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString(),
    },
    storage: {
      localStorage: Object.keys(localStorage).length,
      sessionStorage: Object.keys(sessionStorage).length,
    },
    configuration: {
      useLocalData: process.env.REACT_APP_USE_LOCAL_DATA,
      proxyBaseUrl: process.env.REACT_APP_PROXY_BASE_URL,
      nodeEnv: process.env.NODE_ENV,
    }
  });

  const getApiSummary = () => {
    const total = callLogs.length;
    const successful = callLogs.filter(log => log.status && log.status >= 200 && log.status < 300).length;
    const failed = callLogs.filter(log => !log.status || log.status >= 400).length;
    const avgDuration = total > 0 ? callLogs.reduce((sum, log) => sum + log.durationMs, 0) / total : 0;
    
    return { total, successful, failed, avgDuration };
  };

  const getCacheSummary = () => {
    const entries = Object.entries(cacheData);
    const dataEntries = entries.filter(([key]) => !key.startsWith('__'));
    const systemEntries = entries.filter(([key]) => key.startsWith('__'));
    
    return {
      total: entries.length,
      dataEntries: dataEntries.length,
      systemEntries: systemEntries.length,
    };
  };

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(section)) {
      newExpanded.delete(section);
    } else {
      newExpanded.add(section);
    }
    setExpandedSections(newExpanded);
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  const getStatusColor = (status?: number) => {
    if (!status) return '#fef3c7';
    if (status >= 200 && status < 300) return '#d1fae5';
    if (status >= 400) return '#fee2e2';
    return '#fef3c7';
  };

  const getStatusIcon = (status?: number) => {
    if (!status) return '●';
    if (status >= 200 && status < 300) return '●';
    if (status >= 400) return '●';
    return '●';
  };

  const getStatusIconColor = (status?: number) => {
    if (!status) return '#f59e0b';
    if (status >= 200 && status < 300) return '#10b981';
    if (status >= 400) return '#ef4444';
    return '#f59e0b';
  };

  const filteredCallLogs = callLogs.filter(log => 
    log.url.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.method.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredCacheData = Object.entries(cacheData).filter(([key, value]) =>
    key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.stringify(value).toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderJsonValue = (value: any, depth = 0): React.ReactNode => {
    if (value === null) return <span style={{ color: '#999' }}>null</span>;
    if (typeof value === 'boolean') return <span style={{ color: '#0969da' }}>{value.toString()}</span>;
    if (typeof value === 'number') return <span style={{ color: '#0969da' }}>{value}</span>;
    if (typeof value === 'string') return <span style={{ color: '#0a3069' }}>"{value}"</span>;
    if (Array.isArray(value)) {
      if (value.length === 0) return <span>[]</span>;
      const key = `array-${depth}-${JSON.stringify(value).slice(0, 50)}`;
      return (
        <div>
          <button 
            onClick={() => toggleSection(key)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0969da', padding: 0 }}
          >
            {expandedSections.has(key) ? '▼' : '▶'} Array({value.length})
          </button>
          {expandedSections.has(key) && (
            <div style={{ marginLeft: 20, borderLeft: '2px solid #e1e4e8', paddingLeft: 10 }}>
              {value.map((item, i) => (
                <div key={i} style={{ marginBottom: 4 }}>
                  <span style={{ color: '#999' }}>[{i}]:</span> {renderJsonValue(item, depth + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (typeof value === 'object') {
      const keys = Object.keys(value);
      if (keys.length === 0) return <span>{'{}'}</span>;
      const key = `object-${depth}-${JSON.stringify(value).slice(0, 50)}`;
      return (
        <div>
          <button 
            onClick={() => toggleSection(key)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0969da', padding: 0 }}
          >
            {expandedSections.has(key) ? '▼' : '▶'} Object({keys.length})
          </button>
          {expandedSections.has(key) && (
            <div style={{ marginLeft: 20, borderLeft: '2px solid #e1e4e8', paddingLeft: 10 }}>
              {keys.map(k => (
                <div key={k} style={{ marginBottom: 4 }}>
                  <span style={{ color: '#0969da', fontWeight: 'bold' }}>"{k}":</span> {renderJsonValue(value[k], depth + 1)}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return <span>{String(value)}</span>;
  };

  const tabStyle = (isActive: boolean) => ({
    padding: '8px 16px',
    border: 'none',
    background: isActive ? '#1f2937' : 'transparent',
    color: isActive ? 'white' : '#6b7280',
    cursor: 'pointer',
    borderRadius: '4px 4px 0 0',
    fontSize: '13px',
    fontWeight: isActive ? '600' : '400',
    transition: 'all 0.15s ease',
    borderBottom: isActive ? 'none' : '1px solid transparent',
  });

  const searchInputStyle = {
    width: '100%',
    padding: '6px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '13px',
    marginBottom: '12px',
  };

  const cardStyle = {
    background: '#ffffff',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '12px',
    marginBottom: '8px',
  };

  const summaryCardStyle = {
    background: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    padding: '16px',
    marginBottom: '16px',
  };

  return (
    <div 
      className="data-inspector-modal" 
      style={{ 
        position: 'fixed', 
        top: 0, 
        left: 0, 
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)', 
        zIndex: 2000, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        overflow: 'hidden',
        padding: '20px'
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div style={{ 
        background: '#fff', 
        borderRadius: 12, 
        width: '100%',
        height: '100%',
        maxWidth: '1400px',
        maxHeight: '900px',
        overflow: 'hidden', 
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)', 
        display: 'flex', 
        flexDirection: 'column',
        position: 'relative'
      }}>
        
        {/* Header */}
        <div style={{ 
          padding: '12px 20px', 
          borderBottom: '1px solid #e5e7eb', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          background: '#ffffff',
          flexShrink: 0
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: '#111827' }}>Application Inspector</h2>
            <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#6b7280' }}>System diagnostics and performance metrics</p>
          </div>
          <button 
            onClick={onClose} 
            style={{ 
              fontSize: '16px', 
              background: '#f3f4f6', 
              border: 'none', 
              cursor: 'pointer', 
              borderRadius: '4px', 
              width: '28px', 
              height: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#e5e7eb'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#f3f4f6'}
          >
            ×
          </button>
        </div>
        
        {/* Tabs */}
        <div style={{ 
          display: 'flex', 
          borderBottom: '1px solid #e5e7eb', 
          background: '#fafafa', 
          paddingLeft: '12px',
          flexShrink: 0
        }}>
          <button style={tabStyle(activeTab === 'user')} onClick={() => setActiveTab('user')}>
            User Profile
          </button>
          <button style={tabStyle(activeTab === 'calls')} onClick={() => setActiveTab('calls')}>
            Network Activity <span style={{ background: activeTab === 'calls' ? 'rgba(255,255,255,0.2)' : '#e5e7eb', padding: '1px 4px', borderRadius: '8px', fontSize: '11px', marginLeft: '6px' }}>{callLogs.length}</span>
          </button>
          <button style={tabStyle(activeTab === 'cache')} onClick={() => setActiveTab('cache')}>
            Data Cache <span style={{ background: activeTab === 'cache' ? 'rgba(255,255,255,0.2)' : '#e5e7eb', padding: '1px 4px', borderRadius: '8px', fontSize: '11px', marginLeft: '6px' }}>{Object.keys(cacheData).length}</span>
          </button>
          <button style={tabStyle(activeTab === 'environment')} onClick={() => setActiveTab('environment')}>
            System Info
          </button>
        </div>
        
        {/* Content */}
        <div style={{ 
          flex: 1, 
          overflow: 'hidden', 
          display: 'flex', 
          flexDirection: 'column',
          minHeight: 0
        }}>
          
          {/* Search Bar (for calls and cache tabs) */}
          {(activeTab === 'calls' || activeTab === 'cache') && (
            <div style={{ padding: '12px 20px 0 20px', flexShrink: 0 }}>
              <input
                type="text"
                placeholder={`Filter ${activeTab}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={searchInputStyle}
              />
            </div>
          )}
          
          <div style={{ 
            flex: 1, 
            overflow: 'auto', 
            padding: '12px 20px',
            minHeight: 0
          }}>
            {activeTab === 'user' && (
              <div style={summaryCardStyle}>
                <h3 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '14px', fontWeight: '600' }}>User Profile</h3>
                <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: '12px', lineHeight: '1.5' }}>
                  {renderJsonValue(data)}
                </div>
              </div>
            )}
            
            {activeTab === 'calls' && (
              <div>
                {/* API Summary */}
                <div style={summaryCardStyle}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Network Performance</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', fontSize: '12px' }}>
                    <div>
                      <div style={{ color: '#6b7280', marginBottom: '2px' }}>Total Requests</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{getApiSummary().total}</div>
                    </div>
                    <div>
                      <div style={{ color: '#6b7280', marginBottom: '2px' }}>Successful</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#10b981' }}>{getApiSummary().successful}</div>
                    </div>
                    <div>
                      <div style={{ color: '#6b7280', marginBottom: '2px' }}>Failed</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#ef4444' }}>{getApiSummary().failed}</div>
                    </div>
                    <div>
                      <div style={{ color: '#6b7280', marginBottom: '2px' }}>Avg Duration</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{getApiSummary().avgDuration.toFixed(0)}ms</div>
                    </div>
                  </div>
                </div>

                <div style={{ marginBottom: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
                  <button 
                    onClick={() => { clearCallLogs(); setCallLogs([]); setSearchTerm(''); }} 
                    style={{ 
                      padding: '6px 12px', 
                      fontSize: '12px', 
                      background: '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#b91c1c'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#dc2626'}
                  >
                    Clear
                  </button>
                  <button 
                    onClick={() => setCallLogs(getCallLogs())} 
                    style={{ 
                      padding: '6px 12px', 
                      fontSize: '12px',
                      background: '#2563eb',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      transition: 'background 0.15s ease'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#1d4ed8'}
                    onMouseLeave={(e) => e.currentTarget.style.background = '#2563eb'}
                  >
                    Refresh
                  </button>
                  {filteredCallLogs.length !== callLogs.length && (
                    <span style={{ fontSize: '12px', color: '#6b7280' }}>
                      {filteredCallLogs.length}/{callLogs.length} shown
                    </span>
                  )}
                </div>
                
                {filteredCallLogs.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                    <p style={{ fontSize: '14px', margin: 0 }}>No network requests recorded</p>
                    <p style={{ fontSize: '12px', margin: '4px 0 0 0' }}>Requests will appear here as they occur</p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '6px' }}>
                    {filteredCallLogs.map((log, i) => (
                      <div key={i} style={{ 
                        ...cardStyle,
                        borderLeft: `3px solid ${getStatusIconColor(log.status)}`,
                        padding: '10px 12px'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span style={{ color: getStatusIconColor(log.status), fontSize: '12px' }}>{getStatusIcon(log.status)}</span>
                          <span style={{ 
                            background: '#374151', 
                            color: 'white', 
                            padding: '2px 6px', 
                            borderRadius: '3px', 
                            fontSize: '10px', 
                            fontWeight: '600' 
                          }}>
                            {log.method}
                          </span>
                          <span style={{ fontSize: '12px', fontFamily: 'ui-monospace, SFMono-Regular, monospace', wordBreak: 'break-all', flex: 1, color: '#374151' }}>
                            {log.url}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '12px', fontSize: '11px', color: '#6b7280' }}>
                          <span>Status: <strong>{log.status || 'Failed'}</strong></span>
                          <span>Duration: <strong>{log.durationMs.toFixed(0)}ms</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'cache' && (
              <div>
                {/* Cache Summary */}
                <div style={summaryCardStyle}>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: '#374151' }}>Cache Overview</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', fontSize: '12px' }}>
                    <div>
                      <div style={{ color: '#6b7280', marginBottom: '2px' }}>Total Entries</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#111827' }}>{getCacheSummary().total}</div>
                    </div>
                    <div>
                      <div style={{ color: '#6b7280', marginBottom: '2px' }}>Data Entries</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#2563eb' }}>{getCacheSummary().dataEntries}</div>
                    </div>
                    <div>
                      <div style={{ color: '#6b7280', marginBottom: '2px' }}>System Entries</div>
                      <div style={{ fontSize: '16px', fontWeight: '600', color: '#6b7280' }}>{getCacheSummary().systemEntries}</div>
                    </div>
                  </div>
                </div>

                {filteredCacheData.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', color: '#6b7280' }}>
                    <p style={{ fontSize: '14px', margin: 0 }}>
                      {searchTerm ? 'No cache entries match filter' : 'No cache data available'}
                    </p>
                  </div>
                ) : (
                  <div style={{ display: 'grid', gap: '8px' }}>
                    {filteredCacheData.map(([key, value]) => (
                      <div key={key} style={cardStyle}>
                        <div style={{ 
                          color: '#374151', 
                          fontSize: '12px', 
                          fontWeight: '600',
                          marginBottom: '6px',
                          wordBreak: 'break-all'
                        }}>
                          {key}
                        </div>
                        <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: '11px', lineHeight: '1.4', color: '#6b7280' }}>
                          {renderJsonValue(value)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {activeTab === 'environment' && (
              <div style={summaryCardStyle}>
                <h3 style={{ margin: '0 0 12px 0', color: '#374151', fontSize: '14px', fontWeight: '600' }}>System Configuration</h3>
                <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: '11px', lineHeight: '1.5' }}>
                  {renderJsonValue(getEnvironmentData())}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DataInspector;
