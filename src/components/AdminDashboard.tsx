import React, { useEffect, useState } from 'react';
import {
  Modal,
  Stack,
  Text,
  IconButton,
  mergeStyles,
  Icon,
  Separator,
  Nav,
  INavLink
} from '@fluentui/react';
import { useTheme } from '../app/functionality/ThemeContext';
import { colours } from '../app/styles/colours';
import DataFlowWorkbench from './DataFlowWorkbench';
import DataFlowDiagram from './DataFlowDiagram';

interface AdminDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * AdminDashboard provides a centralized interface for system administration tasks.
 * Includes data flow analysis, file mapping, and application diagnostics.
 */
const AdminDashboard: React.FC<AdminDashboardProps> = ({ isOpen, onClose }) => {
  const { isDarkMode } = useTheme();
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [showDataFlow, setShowDataFlow] = useState(false);
  const [fileMap, setFileMap] = useState<{
    totalFiles: number; totalDirs: number; usedFiles: number; usedDirs: number; generatedAt: string; groups: Array<{
      key: string; title: string; root: string; files: number; dirs: number; usedFiles: number; usedDirs: number; sample: Array<{ path: string; used: boolean }>; topBySize: Array<{ path: string; size: number; used: boolean }>; allFiles: Array<{ path: string; used: boolean; size?: number }>; entries: any[]
    }>
  } | null>(null);
  const [fileFilters, setFileFilters] = useState<Record<string, 'all' | 'used' | 'unused'>>({});
  const [treeExpanded, setTreeExpanded] = useState<Record<string, Record<string, boolean>>>({});
  const [globalFilter, setGlobalFilter] = useState<'all' | 'used' | 'unused'>('all');
  const [loadingFiles, setLoadingFiles] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  type OpEvent = {
    id: string; ts: string; type: string; action?: string; status?: string; httpStatus?: number; durationMs?: number; url?: string; error?: string; method?: string; enquiryId?: string;
  };
  const [ops, setOps] = useState<OpEvent[] | null>(null);
  const [opsLoading, setOpsLoading] = useState(false);
  const [opsError, setOpsError] = useState<string | null>(null);
  const [opsFilter, setOpsFilter] = useState<'all' | 'errors' | 'email' | 'function'>('all');
  const [opsAutoRefresh, setOpsAutoRefresh] = useState<boolean>(true);

  const loadFileMap = async () => {
    try {
      setLoadingFiles(true);
      setFileError(null);
  const res = await fetch('/api/file-map?roots=src,api/src,decoupled-functions,server,database,infra,docs&depth=5');
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const json = await res.json();
      // Transform server response { ok, roots: [{ root, entries: Tree[] }]} to summary groups
      const groups = (json.roots || []).map((r: any) => {
        const flatten = (nodes: any[]): any[] => {
          const out: any[] = [];
          for (const n of nodes) {
            out.push(n);
            if (n.kind === 'dir' && Array.isArray(n.children)) out.push(...flatten(n.children));
          }
          return out;
        };
        const all = flatten(r.entries || []);
        const files = all.filter((n: any) => n.kind === 'file');
        const dirs = all.filter((n: any) => n.kind === 'dir');
        const usedFiles = files.filter((f:any) => f.used).length;
        const usedDirs = dirs.filter((d:any) => d.used).length;
        const sample = files.slice(0, 5).map((f: any) => ({ path: f.path.replace(/^.*?\//, ''), used: !!f.used }));
        const topBySize = files
          .slice()
          .sort((a: any, b: any) => (b.size || 0) - (a.size || 0))
          .slice(0, 5)
          .map((f: any) => ({ path: f.path.replace(/^.*?\//, ''), size: f.size || 0, used: !!f.used }));
        const allFiles = files.map((f:any) => ({ path: f.path.replace(/^.*?\//, ''), used: !!f.used, size: f.size }));
        return {
          key: r.root,
          title: r.root,
          root: r.root,
          files: files.length,
          dirs: dirs.length,
          usedFiles,
          usedDirs,
          sample,
          topBySize,
          allFiles,
          entries: r.entries || [],
        };
      });
      const totals = groups.reduce((acc: any, g: any) => ({ files: acc.files + g.files, dirs: acc.dirs + g.dirs, ufiles: acc.ufiles + g.usedFiles, udirs: acc.udirs + g.usedDirs }), { files: 0, dirs: 0, ufiles: 0, udirs: 0 });
      setFileMap({ totalFiles: totals.files, totalDirs: totals.dirs, usedFiles: totals.ufiles, usedDirs: totals.udirs, generatedAt: new Date().toISOString(), groups });
    } catch (e) {
      setFileError('Failed to load file map');
    } finally {
      setLoadingFiles(false);
    }
  };

  useEffect(() => {
    if (selectedSection === 'files' && !fileMap && !loadingFiles) {
      void loadFileMap();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSection]);

  const loadOps = async () => {
    try {
      setOpsLoading(true);
      setOpsError(null);
      const res = await fetch('/api/ops?limit=200');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setOps(Array.isArray(json.events) ? json.events : []);
    } catch {
      setOpsError('Failed to load operations');
    } finally {
      setOpsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedSection === 'ops' && !ops && !opsLoading) {
      void loadOps();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSection]);
  useEffect(() => {
    if (selectedSection !== 'ops') return;
    if (!opsAutoRefresh) return;
    const t = setInterval(() => { void loadOps(); }, 3000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSection, opsAutoRefresh]);

  const modalStyles = {
    main: {
      width: '95vw',
      maxWidth: 1400,
      minHeight: '85vh',
      background: `linear-gradient(135deg, ${isDarkMode ? colours.dark.background : '#FFFFFF'} 0%, ${isDarkMode ? colours.dark.background : '#F8FAFC'} 100%)`,
      borderRadius: 12,
      padding: 0,
      border: isDarkMode ? '1px solid #444' : '1px solid #ddd',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
    }
  };

  const headerStyle = mergeStyles({
    background: 'transparent',
    padding: '20px 24px',
    borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  });

  const contentStyle = mergeStyles({
    display: 'flex',
    height: 'calc(85vh - 80px)',
  });

  const sidebarStyle = mergeStyles({
    width: '220px',
    borderRight: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
    background: isDarkMode ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.5)',
    padding: '16px 0',
  });

  const mainContentStyle = mergeStyles({
    flex: 1,
    padding: '24px',
    overflowY: 'auto'
  });

  const sectionCardStyle = mergeStyles({
    background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
    borderRadius: 8,
    padding: '20px',
    marginBottom: 20,
    backdropFilter: 'blur(8px)',
  });

  const navItems: INavLink[] = [
    {
      name: 'Overview',
      key: 'overview',
      url: '',
      icon: 'ViewDashboard',
      onClick: () => setSelectedSection('overview')
    },
    {
      name: 'Data Flow Analysis',
      key: 'dataflow',
      url: '',
      icon: 'Flow',
      onClick: () => setSelectedSection('dataflow')
    },
    {
      name: 'File Mapping',
      key: 'files',
      url: '',
      icon: 'FabricFolder',
      onClick: () => setSelectedSection('files')
    },
    {
      name: 'Application Health',
      key: 'health',
      url: '',
      icon: 'Health',
      onClick: () => setSelectedSection('health')
    },
    {
      name: 'System Diagnostics',
      key: 'diagnostics',
      url: '',
      icon: 'Settings',
      onClick: () => setSelectedSection('diagnostics')
    }
    ,
    {
      name: 'Operations Log',
      key: 'ops',
      url: '',
      icon: 'History',
      onClick: () => setSelectedSection('ops')
    }
  ];

  const renderContent = () => {
    // Helpers for tree rendering
    const isExpanded = (groupKey: string, path: string) => !!(treeExpanded[groupKey]?.[path]);
    const toggleExpand = (groupKey: string, path: string) => {
      setTreeExpanded(prev => ({
        ...prev,
        [groupKey]: { ...(prev[groupKey] || {}), [path]: !prev[groupKey]?.[path] }
      }));
    };
    const hasVisible = (node: any, filter: 'all' | 'used' | 'unused'): boolean => {
      if (filter === 'all') return true;
      const used = !!node.used;
      if (node.kind === 'file') return filter === 'used' ? used : !used;
      const children = Array.isArray(node.children) ? node.children : [];
      const selfMatch = filter === 'used' ? used : !used;
      return selfMatch || children.some((c: any) => hasVisible(c, filter));
    };
    const renderTree = (nodes: any[], groupKey: string, depth = 0, filter: 'all' | 'used' | 'unused' = 'all') => {
      if (!Array.isArray(nodes)) return null;
      return (
        <ul style={{ margin: 0, paddingLeft: depth === 0 ? 0 : 14, listStyle: 'none' }}>
          {nodes.map((n: any) => {
            if (!hasVisible(n, filter)) return null;
            const isDir = n.kind === 'dir';
            const expanded = isDir ? isExpanded(groupKey, n.path) : false;
            const displayChildren = isDir ? (Array.isArray(n.children) ? n.children : []) : [];
            const visibleChildren = isDir ? displayChildren.filter((c: any) => hasVisible(c, filter)) : [];
            const showChildren = isDir && expanded && visibleChildren.length > 0;
            const name = n.path.replace(/^.*?\//, '');
            return (
              <li key={n.path} style={{ padding: '2px 0' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {isDir ? (
                    <button
                      onClick={() => toggleExpand(groupKey, n.path)}
                      aria-label={expanded ? 'Collapse' : 'Expand'}
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 4,
                        border: '1px solid ' + (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'),
                        background: expanded ? 'rgba(54,144,206,0.12)' : 'transparent',
                        cursor: 'pointer',
                        lineHeight: '16px',
                        fontSize: 10,
                        color: '#3690CE'
                      }}
                    >
                      {expanded ? '−' : '+'}
                    </button>
                  ) : (
                    <span style={{ width: 18 }} />
                  )}
                  <span style={{
                    color: n.used ? (isDarkMode ? '#22c55e' : '#15803d') : (isDarkMode ? colours.dark.subText : colours.light.subText),
                    fontWeight: isDir ? 600 : 400,
                    fontSize: 12
                  }}>
                    {name}{n.used ? ' • used' : ''}
                  </span>
                </div>
                {showChildren && renderTree(visibleChildren, groupKey, depth + 1, filter)}
              </li>
            );
          })}
        </ul>
      );
    };
    switch (selectedSection) {
      case 'overview':
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <Icon iconName="ViewDashboard" style={{ fontSize: 20, color: '#3690CE' }} />
              <Text variant="xLarge" style={{ fontWeight: 600, color: '#3690CE' }}>
                System Overview
              </Text>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20 }}>
              <div className={sectionCardStyle}>
                <h3 style={{ margin: '0 0 12px 0', color: isDarkMode ? colours.dark.text : colours.light.text }}>
                  Application Status
                </h3>
                <div style={{ color: isDarkMode ? colours.dark.subText : colours.light.subText }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                    <Text>Frontend: Active</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                    <Text>API Functions: Active</Text>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
                    <Text>Database: Connected</Text>
                  </div>
                </div>
              </div>

              <div className={sectionCardStyle}>
                <h3 style={{ margin: '0 0 12px 0', color: isDarkMode ? colours.dark.text : colours.light.text }}>
                  Quick Actions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <button
                    onClick={() => setSelectedSection('dataflow')}
                    style={{
                      padding: '8px 12px',
                      background: '#3690CE',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: '13px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#2563eb';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#3690CE';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    Analyze Data Flow
                  </button>
                  <button
                    onClick={() => setSelectedSection('files')}
                    style={{
                      padding: '8px 12px',
                      background: '#15803d',
                      color: 'white',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontSize: '13px',
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#166534';
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#15803d';
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                  >
                    Map Application Files
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'dataflow':
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <Icon iconName="Flow" style={{ fontSize: 20, color: '#3690CE' }} />
              <Text variant="xLarge" style={{ fontWeight: 600, color: '#3690CE' }}>
                Data Flow Analysis
              </Text>
            </div>
            
            <div className={sectionCardStyle}>
              <DataFlowDiagram />
            </div>
            <div className={sectionCardStyle}>
              <DataFlowWorkbench isOpen={true} onClose={() => {}} embedded={true} />
            </div>
          </div>
        );

      case 'files':
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <Icon iconName="FabricFolder" style={{ fontSize: 20, color: '#3690CE' }} />
              <Text variant="xLarge" style={{ fontWeight: 600, color: '#3690CE' }}>
                Application File Mapping
              </Text>
            </div>

            <div className={sectionCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: isDarkMode ? colours.dark.text : colours.light.text }}>Live File Structure</h3>
                <button
                  onClick={() => loadFileMap()}
                  style={{ padding: '6px 10px', background: '#3690CE', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                >Refresh</button>
              </div>

              {loadingFiles && <Text>Loading file map…</Text>}
              {fileError && <Text style={{ color: '#ef4444' }}>{fileError}</Text>}

              {fileMap && (
                <>
                  <div style={{ fontSize: 12, color: isDarkMode ? colours.dark.subText : colours.light.subText, marginBottom: 12 }}>
                    Total: {fileMap.totalFiles} files ({fileMap.usedFiles} used), {fileMap.totalDirs} folders ({fileMap.usedDirs} used) • Generated {new Date(fileMap.generatedAt).toLocaleTimeString()}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: isDarkMode ? colours.dark.subText : colours.light.subText }}>Filter:</span>
                      {(['all','used','unused'] as const).map(f => (
                        <button key={f}
                          onClick={() => setGlobalFilter(f)}
                          style={{
                            padding: '4px 8px', borderRadius: 6, border: '1px solid ' + (globalFilter === f ? '#3690CE' : (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)')),
                            background: globalFilter === f ? 'rgba(54,144,206,0.12)' : 'transparent',
                            color: isDarkMode ? colours.dark.text : colours.light.text,
                            fontSize: 12, cursor: 'pointer'
                          }}
                        >{f}</button>
                      ))}
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button
                        onClick={() => {
                          const expandAll = (nodes: any[], acc: Record<string, boolean> = {}) => {
                            for (const n of nodes) {
                              if (n.kind === 'dir') {
                                acc[n.path] = true;
                                if (Array.isArray(n.children)) expandAll(n.children, acc);
                              }
                            }
                            return acc;
                          };
                          const allRoots = (fileMap.groups || []).map(g => ({ kind: 'dir', path: g.root, children: g.entries }));
                          setTreeExpanded(prev => ({ ...prev, ALL: expandAll(allRoots) }));
                        }}
                        style={{ padding: '2px 6px', fontSize: 11, borderRadius: 6, border: '1px solid ' + (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'), background: 'transparent', cursor: 'pointer' }}
                      >Expand all</button>
                      <button
                        onClick={() => setTreeExpanded(prev => ({ ...prev, ALL: {} }))}
                        style={{ padding: '2px 6px', fontSize: 11, borderRadius: 6, border: '1px solid ' + (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'), background: 'transparent', cursor: 'pointer' }}
                      >Collapse all</button>
                    </div>
                  </div>
                  <div style={{ maxHeight: 480, overflowY: 'auto', border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)', borderRadius: 6, padding: '6px 10px' }}>
                    {(() => {
                      // Build synthetic root nodes so all roots appear in one tree
                      const roots = (fileMap.groups || []).map(g => ({
                        kind: 'dir',
                        path: g.root,
                        used: g.usedDirs > 0 || g.usedFiles > 0,
                        children: g.entries
                      }));
                      return renderTree(roots as any[], 'ALL', 0, globalFilter);
                    })()}
                  </div>
                </>
              )}
            </div>
          </div>
        );

      case 'health':
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <Icon iconName="Health" style={{ fontSize: 20, color: '#3690CE' }} />
              <Text variant="xLarge" style={{ fontWeight: 600, color: '#3690CE' }}>
                Application Health
              </Text>
            </div>
            
            <div className={sectionCardStyle}>
              <Text>Health monitoring features will be implemented here.</Text>
            </div>
          </div>
        );

      case 'diagnostics':
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <Icon iconName="Settings" style={{ fontSize: 20, color: '#3690CE' }} />
              <Text variant="xLarge" style={{ fontWeight: 600, color: '#3690CE' }}>
                System Diagnostics
              </Text>
            </div>
            
            <div className={sectionCardStyle}>
              <Text>System diagnostics and debugging tools will be implemented here.</Text>
            </div>
          </div>
        );

      case 'ops':
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <Icon iconName="History" style={{ fontSize: 20, color: '#3690CE' }} />
              <Text variant="xLarge" style={{ fontWeight: 600, color: '#3690CE' }}>
                Operations Log
              </Text>
            </div>

            <div className={sectionCardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h3 style={{ margin: 0, color: isDarkMode ? colours.dark.text : colours.light.text }}>Recent Events</h3>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {(['all','errors','email','function'] as const).map(f => (
                    <button key={f}
                      onClick={() => setOpsFilter(f)}
                      style={{
                        padding: '4px 8px', borderRadius: 6, border: '1px solid ' + (opsFilter === f ? '#3690CE' : (isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)')),
                        background: opsFilter === f ? 'rgba(54,144,206,0.12)' : 'transparent',
                        color: isDarkMode ? colours.dark.text : colours.light.text,
                        fontSize: 12, cursor: 'pointer'
                      }}
                    >{f}</button>
                  ))}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: isDarkMode ? colours.dark.subText : colours.light.subText }}>
                    <input type="checkbox" checked={opsAutoRefresh} onChange={(e) => setOpsAutoRefresh(e.target.checked)} /> Auto-refresh
                  </label>
                  <button
                    onClick={() => loadOps()}
                    style={{ padding: '6px 10px', background: '#3690CE', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12 }}
                  >Refresh</button>
                </div>
              </div>

              {opsLoading && <Text>Loading…</Text>}
              {opsError && <Text style={{ color: '#ef4444' }}>{opsError}</Text>}

              {ops && (
                <div style={{ maxHeight: 500, overflowY: 'auto', border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)', borderRadius: 6 }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ position: 'sticky', top: 0, background: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.03)' }}>
                        <th style={{ textAlign: 'left', padding: '8px 10px' }}>Time</th>
                        <th style={{ textAlign: 'left', padding: '8px 10px' }}>Type</th>
                        <th style={{ textAlign: 'left', padding: '8px 10px' }}>Action</th>
                        <th style={{ textAlign: 'left', padding: '8px 10px' }}>Status</th>
                        <th style={{ textAlign: 'left', padding: '8px 10px' }}>HTTP</th>
                        <th style={{ textAlign: 'left', padding: '8px 10px' }}>Duration</th>
                        <th style={{ textAlign: 'left', padding: '8px 10px' }}>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ops.filter(e => {
                        if (opsFilter === 'all') return true;
                        if (opsFilter === 'errors') return e.status === 'error' || (e.httpStatus && e.httpStatus >= 400);
                        if (opsFilter === 'email') return e.type === 'email';
                        if (opsFilter === 'function') return e.type === 'function';
                        return true;
                      }).map(e => (
                        <tr key={e.id} style={{ borderTop: '1px solid ' + (isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)') }}>
                          <td style={{ padding: '6px 10px', whiteSpace: 'nowrap' }}>{new Date(e.ts).toLocaleTimeString()}</td>
                          <td style={{ padding: '6px 10px' }}>{e.type}</td>
                          <td style={{ padding: '6px 10px' }}>{e.action || '-'}</td>
                          <td style={{ padding: '6px 10px', color: e.status === 'error' || (e.httpStatus && e.httpStatus >= 400) ? '#ef4444' : (e.status === 'success' ? (isDarkMode ? '#22c55e' : '#15803d') : (isDarkMode ? colours.dark.subText : colours.light.subText)) }}>{e.status || '-'}</td>
                          <td style={{ padding: '6px 10px' }}>{e.httpStatus ?? '-'}</td>
                          <td style={{ padding: '6px 10px' }}>{e.durationMs ? `${e.durationMs} ms` : '-'}</td>
                          <td style={{ padding: '6px 10px', maxWidth: 420, overflow: 'hidden', textOverflow: 'ellipsis' }} title={(e.url || e.error || '')}>
                            {e.enquiryId ? `enquiry ${e.enquiryId} • ` : ''}{e.url || e.error || ''}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onDismiss={onClose}
        styles={modalStyles}
        dragOptions={undefined}
      >
        <div className={headerStyle}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Icon iconName="Admin" style={{ fontSize: 20, color: '#3690CE' }} />
            <Text variant="xLarge" style={{ fontWeight: 600, color: '#3690CE' }}>
              Admin Dashboard
            </Text>
          </div>
          <IconButton
            iconProps={{ iconName: 'ChromeClose' }}
            ariaLabel="Close admin dashboard"
            onClick={onClose}
            styles={{
              root: {
                borderRadius: 6,
                width: 32,
                height: 32,
                color: isDarkMode ? '#a0aec0' : '#4a5568'
              },
              rootHovered: {
                background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
              }
            }}
          />
        </div>

        <div className={contentStyle}>
          <div className={sidebarStyle}>
            <Nav
              groups={[
                {
                  links: navItems
                }
              ]}
              selectedKey={selectedSection}
              styles={{
                root: {
                  background: 'transparent',
                },
                link: {
                  background: 'transparent',
                  color: isDarkMode ? colours.dark.text : colours.light.text,
                  fontSize: '13px',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  margin: '2px 8px',
                  selectors: {
                    ':hover': {
                      background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                      color: isDarkMode ? colours.dark.text : colours.light.text
                    },
                    '.is-selected': {
                      background: 'rgba(54, 144, 206, 0.1)',
                      color: '#3690CE'
                    },
                    '.is-selected:hover': {
                      background: 'rgba(54, 144, 206, 0.15)',
                      color: '#3690CE'
                    }
                  }
                }
              }}
            />
          </div>

          <div className={mainContentStyle}>
            {renderContent()}
          </div>
        </div>
      </Modal>

      {showDataFlow && (
        <DataFlowWorkbench 
          isOpen={showDataFlow} 
          onClose={() => setShowDataFlow(false)} 
        />
      )}
    </>
  );
};

export default AdminDashboard;