import React, { useCallback, useEffect, useMemo, useRef, useState, Suspense } from 'react';
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
import ThemedSpinner from './ThemedSpinner';
import { FixedSizeList, VariableSizeList } from 'react-window';
const DataFlowWorkbench = React.lazy(() => import('./DataFlowWorkbench'));
const DataFlowDiagram = React.lazy(() => import('./DataFlowDiagram'));

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
  const palette = isDarkMode ? colours.dark : colours.light;
  const [selectedSection, setSelectedSection] = useState<string>('overview');
  const [fileMap, setFileMap] = useState<{
    totalFiles: number; totalDirs: number; usedFiles: number; usedDirs: number; generatedAt: string; groups: Array<{
      key: string; title: string; root: string; files: number; dirs: number; usedFiles: number; usedDirs: number; sample: Array<{ path: string; used: boolean }>; topBySize: Array<{ path: string; size: number; used: boolean }>; allFiles: Array<{ path: string; used: boolean; size?: number }>; entries: any[]
    }>
  } | null>(null);
  const [treeExpanded, setTreeExpanded] = useState<Record<string, boolean>>({});
  const [fileSearchTerm, setFileSearchTerm] = useState('');
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
  const [opsSearchTerm, setOpsSearchTerm] = useState('');
  const [opsIntervalMs, setOpsIntervalMs] = useState(5000);
  const [expandedOpsRows, setExpandedOpsRows] = useState<Record<string, boolean>>({});
  const opsListRef = useRef<VariableSizeList | null>(null);

  const toggleTreeNode = useCallback((path: string) => {
    setTreeExpanded((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  }, []);

  const allDirectoryPaths = useMemo(() => {
    if (!fileMap) return [] as string[];
    const dirs: string[] = [];
    const visit = (nodes: any[]) => {
      nodes.forEach((node) => {
        if (node.kind === 'dir') {
          dirs.push(node.path);
          if (Array.isArray(node.children)) visit(node.children);
        }
      });
    };
    (fileMap.groups || []).forEach((group) => visit(group.entries || []));
    return dirs;
  }, [fileMap]);

  const setAllTreeNodes = useCallback(
    (expanded: boolean) => {
      setTreeExpanded((prev) => {
        if (expanded) {
          const next: Record<string, boolean> = { ...prev };
          allDirectoryPaths.forEach((path) => {
            next[path] = true;
          });
          return next;
        }
        const next: Record<string, boolean> = { ...prev };
        allDirectoryPaths.forEach((path) => {
          if (next[path]) delete next[path];
        });
        return next;
      });
    },
    [allDirectoryPaths]
  );

  type FileRow = {
    key: string;
    name: string;
    depth: number;
    isDir: boolean;
    used: boolean;
    path: string;
    hasChildren: boolean;
  };

  const fileRows = useMemo<FileRow[]>(() => {
    if (!fileMap) return [];
    const rows: FileRow[] = [];
    const search = fileSearchTerm.trim().toLowerCase();
    const filter = globalFilter;

    const matchesFilter = (node: any) => {
      if (filter === 'all') return true;
      const used = !!node.used;
      return filter === 'used' ? used : !used;
    };

    const matchesSearch = (node: any) => {
      if (!search) return true;
      const name = String(node.path || '').toLowerCase();
      return name.includes(search);
    };

    const shouldIncludeNode = (node: any): boolean => {
      if (!node) return false;
      if (matchesFilter(node) && matchesSearch(node)) return true;
      if (node.kind === 'dir' && Array.isArray(node.children)) {
        return node.children.some((child: any) => shouldIncludeNode(child));
      }
      return false;
    };

    const visit = (nodes: any[], depth = 0) => {
      nodes.forEach((node) => {
        if (!shouldIncludeNode(node)) return;
        const isDir = node.kind === 'dir';
        const path = node.path;
        const hasChildren = isDir && Array.isArray(node.children) && node.children.length > 0;
        const expanded = isDir ? !!treeExpanded[path] : false;

        rows.push({
          key: path,
          name: String(path).replace(/^.*?\//, ''),
          depth,
          isDir,
          used: !!node.used,
          path,
          hasChildren,
        });

        if (isDir && expanded && hasChildren) {
          visit(node.children, depth + 1);
        }
      });
    };

    const roots = (fileMap.groups || []).map((g) => ({
      kind: 'dir',
      path: g.root,
      used: g.usedDirs > 0 || g.usedFiles > 0,
      children: g.entries,
    }));

    visit(roots, 0);
    return rows;
  }, [fileMap, fileSearchTerm, globalFilter, treeExpanded]);

  const filteredOps = useMemo(() => {
    if (!ops) return [] as OpEvent[];
    const search = opsSearchTerm.trim().toLowerCase();
    return ops.filter((e) => {
      if (opsFilter === 'errors' && !(e.status === 'error' || (e.httpStatus && e.httpStatus >= 400))) return false;
      if (opsFilter === 'email' && e.type !== 'email') return false;
      if (opsFilter === 'function' && e.type !== 'function') return false;
      if (!search) return true;
      return (
        (e.url || '').toLowerCase().includes(search) ||
        (e.action || '').toLowerCase().includes(search) ||
        (e.type || '').toLowerCase().includes(search)
      );
    });
  }, [ops, opsFilter, opsSearchTerm]);

  const getOpsRowHeight = useCallback(
    (index: number) => {
      const item = filteredOps[index];
      if (!item) return 68;
      return expandedOpsRows[item.id] ? 140 : 68;
    },
    [expandedOpsRows, filteredOps]
  );

  useEffect(() => {
    opsListRef.current?.resetAfterIndex(0, true);
  }, [filteredOps, expandedOpsRows]);

  const exportOps = useCallback(
    (format: 'json' | 'csv') => {
      if (!filteredOps.length) return;
      if (format === 'json') {
        const blob = new Blob([JSON.stringify(filteredOps, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ops-log-${new Date().toISOString()}.json`;
        link.click();
        URL.revokeObjectURL(url);
        return;
      }

      const headers = ['timestamp', 'type', 'action', 'status', 'httpStatus', 'durationMs', 'url', 'error'];
      const csv = [headers.join(',')]
        .concat(
          filteredOps.map((e) =>
            [
              new Date(e.ts).toISOString(),
              e.type || '',
              e.action || '',
              e.status || '',
              e.httpStatus ?? '',
              e.durationMs ?? '',
              (e.url || '').replace(/"/g, '""'),
              (e.error || '').replace(/"/g, '""'),
            ]
              .map((value) => `"${String(value)}"`)
              .join(',')
          )
        )
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ops-log-${new Date().toISOString()}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    },
    [filteredOps]
  );

  const loadFileMap = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (selectedSection === 'files' && !fileMap && !loadingFiles) {
      void loadFileMap();
    }
  }, [selectedSection, fileMap, loadingFiles, loadFileMap]);

  const loadOps = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    if (selectedSection === 'ops' && !ops && !opsLoading) {
      void loadOps();
    }
  }, [selectedSection, ops, opsLoading, loadOps]);
  useEffect(() => {
    if (selectedSection !== 'ops') return;
    if (!opsAutoRefresh) return;
    const timer = setInterval(() => {
      void loadOps();
    }, opsIntervalMs);
    return () => clearInterval(timer);
  }, [selectedSection, opsAutoRefresh, opsIntervalMs, loadOps]);

  const modalStyles = {
    main: {
      width: '95vw',
      maxWidth: 1400,
      minHeight: '85vh',
      background: palette.sectionBackground,
      borderRadius: 12,
      padding: 0,
      border: `1px solid ${isDarkMode ? 'rgba(148,163,184,0.2)' : 'rgba(15,23,42,0.08)'}`,
      boxShadow: isDarkMode ? '0 18px 42px rgba(2, 6, 23, 0.6)' : '0 18px 42px rgba(15, 23, 42, 0.08)',
    }
  };

  const headerStyle = mergeStyles({
    background: palette.cardBackground,
    padding: '20px 24px',
    borderBottom: `1px solid ${isDarkMode ? 'rgba(148,163,184,0.15)' : 'rgba(15,23,42,0.06)'}`,
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
    borderRight: `1px solid ${isDarkMode ? 'rgba(148,163,184,0.12)' : 'rgba(15,23,42,0.05)'}`,
    background: isDarkMode ? 'rgba(15,23,42,0.65)' : 'rgba(241,245,249,0.75)',
    padding: '16px 0',
  });

  const mainContentStyle = mergeStyles({
    flex: 1,
    padding: '24px',
    overflowY: 'auto'
  });

  const focusRingClass = mergeStyles({
    selectors: {
      ':focus-visible': {
        outline: `2px solid ${colours.blue}`,
        outlineOffset: '2px',
      },
    },
  });

  const sectionCardStyle = mergeStyles({
    background: palette.cardBackground,
    border: `1px solid ${isDarkMode ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.08)'}`,
    borderRadius: 8,
    padding: '20px',
    marginBottom: 20,
    boxShadow: isDarkMode ? '0 8px 20px rgba(2,6,23,0.45)' : '0 8px 20px rgba(15,23,42,0.06)',
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
    switch (selectedSection) {
      case 'overview':
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <Icon iconName="ViewDashboard" style={{ fontSize: 20, color: colours.blue }} />
              <Text variant="xLarge" style={{ fontWeight: 600, color: colours.blue }}>
                System Overview
              </Text>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              <div className={sectionCardStyle}>
                <h3 style={{ margin: '0 0 12px 0', color: palette.text, fontSize: 16, fontWeight: 600 }}>
                  Application Status
                </h3>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, color: palette.subText, display: 'grid', gap: 10 }}>
                  {[
                    { label: 'Frontend', status: 'Active' },
                    { label: 'API Functions', status: 'Active' },
                    { label: 'Database', status: 'Connected' },
                  ].map(({ label, status }) => (
                    <li key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: '#22c55e',
                          boxShadow: '0 0 0 4px rgba(34,197,94,0.12)',
                        }}
                        aria-hidden="true"
                      />
                      <span style={{ fontSize: 13, color: palette.text }}>
                        <strong>{label}:</strong> {status}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className={sectionCardStyle}>
                <h3 style={{ margin: '0 0 12px 0', color: palette.text, fontSize: 16, fontWeight: 600 }}>
                  Quick Actions
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    onClick={() => setSelectedSection('dataflow')}
                    style={{
                      padding: '10px 14px',
                      background: colours.blue,
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                      boxShadow: '0 8px 20px rgba(54,144,206,0.25)',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(54,144,206,0.3)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(54,144,206,0.25)';
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(54,144,206,0.3)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 20px rgba(54,144,206,0.25)';
                    }}
                  >
                    Analyse Data Flow
                  </button>
                  <button
                    onClick={() => setSelectedSection('files')}
                    style={{
                      padding: '10px 14px',
                      background: isDarkMode ? 'rgba(34,197,94,0.18)' : 'rgba(34,197,94,0.12)',
                      color: isDarkMode ? '#bbf7d0' : '#166534',
                      border: `1px solid ${isDarkMode ? 'rgba(34,197,94,0.45)' : 'rgba(34,197,94,0.35)'}`,
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontSize: 13,
                      fontWeight: 600,
                      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(34,197,94,0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                    onFocus={(e) => {
                      e.currentTarget.style.transform = 'translateY(-1px)';
                      e.currentTarget.style.boxShadow = '0 12px 24px rgba(34,197,94,0.25)';
                    }}
                    onBlur={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = 'none';
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
              <Icon iconName="Flow" style={{ fontSize: 20, color: colours.blue }} />
              <Text variant="xLarge" style={{ fontWeight: 600, color: colours.blue }}>
                Data Flow Analysis
              </Text>
            </div>

            <div className={sectionCardStyle}>
              <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}><ThemedSpinner /></div>}>
                <DataFlowDiagram />
              </Suspense>
            </div>
            <div className={sectionCardStyle}>
              <Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}><ThemedSpinner /></div>}>
                <DataFlowWorkbench isOpen={true} onClose={() => {}} embedded={true} />
              </Suspense>
            </div>
          </div>
        );

      case 'files':
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <Icon iconName="FabricFolder" style={{ fontSize: 20, color: colours.blue }} />
              <Text variant="xLarge" style={{ fontWeight: 600, color: colours.blue }}>
                Application File Mapping
              </Text>
            </div>

            <div className={sectionCardStyle}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, color: palette.text, fontSize: 16, fontWeight: 600 }}>Live File Structure</h3>
                  {fileMap && (
                    <p style={{ margin: '6px 0 0 0', fontSize: 12, color: palette.subText }}>
                      {fileMap.totalFiles} files ({fileMap.usedFiles} used) • {fileMap.totalDirs} folders ({fileMap.usedDirs} used)
                      <span style={{ marginLeft: 6, opacity: 0.7 }}>Generated {new Date(fileMap.generatedAt).toLocaleTimeString()}</span>
                    </p>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => loadFileMap()}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: colours.blue,
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['all', 'used', 'unused'] as const).map((filter) => {
                    const isActive = globalFilter === filter;
                    return (
                      <button
                        key={filter}
                        onClick={() => setGlobalFilter(filter)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: `1px solid ${isActive ? colours.blue : (isDarkMode ? 'rgba(148,163,184,0.35)' : 'rgba(15,23,42,0.12)')}`,
                          background: isActive ? 'rgba(54,144,206,0.16)' : 'transparent',
                          color: isActive ? colours.blue : palette.text,
                          fontSize: 12,
                          fontWeight: isActive ? 600 : 500,
                          cursor: 'pointer',
                        }}
                      >
                        {filter}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="search"
                  value={fileSearchTerm}
                  onChange={(event) => setFileSearchTerm(event.target.value)}
                  placeholder="Search path..."
                  aria-label="Search files"
                  style={{
                    flex: '1 1 200px',
                    minWidth: 200,
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: `1px solid ${isDarkMode ? 'rgba(148,163,184,0.3)' : 'rgba(15,23,42,0.12)'}`,
                    background: isDarkMode ? 'rgba(15,23,42,0.7)' : '#fff',
                    color: palette.text,
                    fontSize: 12,
                  }}
                />
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    onClick={() => setAllTreeNodes(true)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: `1px solid ${isDarkMode ? 'rgba(148,163,184,0.35)' : 'rgba(15,23,42,0.12)'}`,
                      background: 'transparent',
                      color: palette.text,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Expand all
                  </button>
                  <button
                    onClick={() => setAllTreeNodes(false)}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: `1px solid ${isDarkMode ? 'rgba(148,163,184,0.35)' : 'rgba(15,23,42,0.12)'}`,
                      background: 'transparent',
                      color: palette.text,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Collapse all
                  </button>
                </div>
              </div>

              {loadingFiles && (
                <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
                  <ThemedSpinner />
                </div>
              )}
              {fileError && <Text style={{ color: '#ef4444' }}>{fileError}</Text>}

              {fileMap && !fileRows.length && !loadingFiles && (
                <div style={{ textAlign: 'center', padding: '24px 0', color: palette.subText }}>
                  <Text>No files match the selected filters.</Text>
                </div>
              )}

              {fileRows.length > 0 && (
                <div
                  role="tree"
                  aria-label="Application file tree"
                  style={{
                    border: `1px solid ${isDarkMode ? 'rgba(148,163,184,0.2)' : 'rgba(15,23,42,0.12)'}`,
                    borderRadius: 6,
                    background: isDarkMode ? 'rgba(15,23,42,0.7)' : '#fff',
                  }}
                >
                  <FixedSizeList
                    height={Math.min(420, Math.max(220, fileRows.length * 32))}
                    itemCount={fileRows.length}
                    itemSize={32}
                    width="100%"
                  >
                    {({ index, style }) => {
                      const row = fileRows[index];
                      const isDir = row.isDir;
                      const expanded = isDir ? !!treeExpanded[row.path] : false;
                      return (
                        <div
                          key={row.key}
                          role="treeitem"
                          aria-level={row.depth + 1}
                          aria-expanded={isDir ? expanded : undefined}
                          className={focusRingClass}
                          tabIndex={0}
                          onKeyDown={(event) => {
                            if (isDir && (event.key === 'Enter' || event.key === ' ')) {
                              event.preventDefault();
                              toggleTreeNode(row.path);
                            }
                            if (isDir && event.key === 'ArrowRight' && !expanded) {
                              event.preventDefault();
                              toggleTreeNode(row.path);
                            }
                            if (isDir && event.key === 'ArrowLeft' && expanded) {
                              event.preventDefault();
                              toggleTreeNode(row.path);
                            }
                          }}
                          style={{
                            ...style,
                            display: 'flex',
                            alignItems: 'center',
                            paddingLeft: 12 + row.depth * 18,
                            paddingRight: 12,
                            gap: 8,
                            fontSize: 12,
                            color: row.used ? (isDarkMode ? '#4ade80' : '#166534') : palette.text,
                            borderBottom: `1px solid ${isDarkMode ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.05)'}`,
                          }}
                        >
                          {isDir ? (
                            <button
                              onClick={() => toggleTreeNode(row.path)}
                              aria-label={`${expanded ? 'Collapse' : 'Expand'} ${row.name}`}
                              style={{
                                width: 22,
                                height: 22,
                                borderRadius: 6,
                                border: `1px solid ${isDarkMode ? 'rgba(148,163,184,0.4)' : 'rgba(15,23,42,0.2)'}`,
                                background: expanded ? 'rgba(54,144,206,0.15)' : 'transparent',
                                color: colours.blue,
                                fontSize: 12,
                                fontWeight: 700,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                              }}
                            >
                              {expanded ? '−' : '+'}
                            </button>
                          ) : (
                            <span style={{ width: 22 }} />
                          )}
                          <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {row.name || row.path}
                          </span>
                          {row.used ? (
                            <span style={{ fontSize: 10, fontWeight: 600, color: row.used ? (isDarkMode ? '#4ade80' : '#166534') : palette.subText }}>
                              used
                            </span>
                          ) : null}
                        </div>
                      );
                    }}
                  </FixedSizeList>
                </div>
              )}
            </div>
          </div>
        );

      case 'health':
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <Icon iconName="Health" style={{ fontSize: 20, color: colours.blue }} />
              <Text variant="xLarge" style={{ fontWeight: 600, color: colours.blue }}>
                Application Health
              </Text>
            </div>

            <div className={sectionCardStyle}>
              <Text style={{ color: palette.subText }}>
                Health monitoring dashboards will appear here. Hook into Application Insights or custom telemetry to surface live metrics.
              </Text>
            </div>
          </div>
        );

      case 'diagnostics':
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <Icon iconName="Settings" style={{ fontSize: 20, color: colours.blue }} />
              <Text variant="xLarge" style={{ fontWeight: 600, color: colours.blue }}>
                System Diagnostics
              </Text>
            </div>

            <div className={sectionCardStyle}>
              <Text style={{ color: palette.subText }}>
                System diagnostics and automation tooling will be added soon. Expect quick links to runbooks, alert definitions, and environment toggles.
              </Text>
            </div>
          </div>
        );

      case 'ops':
        return (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <Icon iconName="History" style={{ fontSize: 20, color: colours.blue }} />
              <Text variant="xLarge" style={{ fontWeight: 600, color: colours.blue }}>
                Operations Log
              </Text>
            </div>

            <div className={sectionCardStyle}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['all', 'errors', 'email', 'function'] as const).map((filter) => {
                    const isActive = opsFilter === filter;
                    return (
                      <button
                        key={filter}
                        onClick={() => setOpsFilter(filter)}
                        style={{
                          padding: '6px 10px',
                          borderRadius: 6,
                          border: `1px solid ${isActive ? colours.blue : (isDarkMode ? 'rgba(148,163,184,0.3)' : 'rgba(15,23,42,0.12)')}`,
                          background: isActive ? 'rgba(54,144,206,0.15)' : 'transparent',
                          color: isActive ? colours.blue : palette.text,
                          fontSize: 12,
                          fontWeight: isActive ? 600 : 500,
                          cursor: 'pointer',
                        }}
                      >
                        {filter}
                      </button>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: palette.subText }}>
                    <input
                      type="checkbox"
                      checked={opsAutoRefresh}
                      onChange={(event) => setOpsAutoRefresh(event.target.checked)}
                    />
                    Auto-refresh
                  </label>
                  <select
                    value={opsIntervalMs}
                    onChange={(event) => setOpsIntervalMs(Number(event.target.value))}
                    aria-label="Auto refresh interval"
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: `1px solid ${isDarkMode ? 'rgba(148,163,184,0.3)' : 'rgba(15,23,42,0.12)'}`,
                      background: isDarkMode ? 'rgba(15,23,42,0.7)' : '#fff',
                      color: palette.text,
                      fontSize: 12,
                    }}
                  >
                    <option value={3000}>3s</option>
                    <option value={5000}>5s</option>
                    <option value={10000}>10s</option>
                    <option value={30000}>30s</option>
                  </select>
                  <button
                    onClick={() => loadOps()}
                    style={{
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: colours.blue,
                      color: '#fff',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Refresh
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                <input
                  type="search"
                  value={opsSearchTerm}
                  onChange={(event) => setOpsSearchTerm(event.target.value)}
                  placeholder="Filter operations..."
                  aria-label="Filter operations"
                  style={{
                    flex: '1 1 240px',
                    minWidth: 220,
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: `1px solid ${isDarkMode ? 'rgba(148,163,184,0.3)' : 'rgba(15,23,42,0.12)'}`,
                    background: isDarkMode ? 'rgba(15,23,42,0.7)' : '#fff',
                    color: palette.text,
                    fontSize: 12,
                  }}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => exportOps('json')}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: `1px solid ${isDarkMode ? 'rgba(148,163,184,0.3)' : 'rgba(15,23,42,0.12)'}`,
                      background: 'transparent',
                      color: palette.text,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Export JSON
                  </button>
                  <button
                    onClick={() => exportOps('csv')}
                    style={{
                      padding: '6px 10px',
                      borderRadius: 6,
                      border: `1px solid ${isDarkMode ? 'rgba(148,163,184,0.3)' : 'rgba(15,23,42,0.12)'}`,
                      background: 'transparent',
                      color: palette.text,
                      fontSize: 12,
                      cursor: 'pointer',
                    }}
                  >
                    Export CSV
                  </button>
                </div>
              </div>

              {opsLoading && (
                <div style={{ padding: '24px 0', display: 'flex', justifyContent: 'center' }}>
                  <ThemedSpinner />
                </div>
              )}
              {opsError && <Text style={{ color: '#ef4444' }}>{opsError}</Text>}

              {!filteredOps.length && !opsLoading && (
                <div style={{ textAlign: 'center', padding: '36px 0', color: palette.subText }}>
                  <Text>No operations recorded yet.</Text>
                </div>
              )}

              {filteredOps.length > 0 && (
                <div
                  role="grid"
                  aria-label="Operations log entries"
                  aria-rowcount={filteredOps.length}
                  style={{
                    border: `1px solid ${isDarkMode ? 'rgba(148,163,184,0.2)' : 'rgba(15,23,42,0.12)'}`,
                    borderRadius: 6,
                    background: isDarkMode ? 'rgba(15,23,42,0.7)' : '#fff',
                  }}
                >
                  <div
                    role="row"
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '140px 100px 140px 80px 80px 80px 1fr 60px',
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      letterSpacing: 0.4,
                      padding: '10px 14px',
                      color: palette.subText,
                      borderBottom: `1px solid ${isDarkMode ? 'rgba(148,163,184,0.15)' : 'rgba(15,23,42,0.08)'}`,
                    }}
                  >
                    <span role="columnheader">Time</span>
                    <span role="columnheader">Type</span>
                    <span role="columnheader">Action</span>
                    <span role="columnheader">Status</span>
                    <span role="columnheader">HTTP</span>
                    <span role="columnheader">Duration</span>
                    <span role="columnheader">Details</span>
                    <span role="columnheader" style={{ textAlign: 'right' }}>Info</span>
                  </div>
                  <VariableSizeList
                    ref={opsListRef}
                    height={Math.min(480, Math.max(240, filteredOps.length * 68))}
                    itemCount={filteredOps.length}
                    width="100%"
                    itemSize={getOpsRowHeight}
                  >
                    {({ index, style }) => {
                      const event = filteredOps[index];
                      const expanded = !!expandedOpsRows[event.id];
                      const statusError = event.status === 'error' || (event.httpStatus && event.httpStatus >= 400);
                      const statusSuccess = event.status === 'success' || (event.httpStatus && event.httpStatus < 300);
                      return (
                        <div
                          key={event.id}
                          role="row"
                          tabIndex={0}
                          aria-expanded={expanded}
                          className={focusRingClass}
                          onKeyDown={(evt) => {
                            if (evt.key === 'Enter' || evt.key === ' ') {
                              evt.preventDefault();
                              setExpandedOpsRows((prev) => ({
                                ...prev,
                                [event.id]: !expanded,
                              }));
                              if (opsListRef.current) {
                                opsListRef.current.resetAfterIndex(index);
                              }
                            }
                          }}
                          style={{
                            ...style,
                            borderBottom: `1px solid ${isDarkMode ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.05)'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            padding: '10px 14px',
                            fontSize: 12,
                            color: palette.text,
                            background: expanded
                              ? (isDarkMode ? 'rgba(54,144,206,0.12)' : 'rgba(54,144,206,0.06)')
                              : 'transparent',
                          }}
                        >
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '140px 100px 140px 80px 80px 80px 1fr 60px',
                              alignItems: 'center',
                              gap: 8,
                            }}
                            role="presentation"
                          >
                            <span role="gridcell">{new Date(event.ts).toLocaleTimeString()}</span>
                            <span role="gridcell">{event.type}</span>
                            <span role="gridcell">{event.action || '—'}</span>
                            <span
                              role="gridcell"
                              style={{
                                color: statusError ? '#ef4444' : statusSuccess ? (isDarkMode ? '#4ade80' : '#15803d') : palette.subText,
                                fontWeight: 600,
                              }}
                            >
                              {event.status || '—'}
                            </span>
                            <span role="gridcell">{event.httpStatus ?? '—'}</span>
                            <span role="gridcell">{event.durationMs ? `${event.durationMs}ms` : '—'}</span>
                            <span role="gridcell" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {event.enquiryId ? `enquiry ${event.enquiryId} • ` : ''}
                              {event.url || event.error || '—'}
                            </span>
                            <div role="gridcell" style={{ textAlign: 'right' }}>
                              <button
                                onClick={() => {
                                  setExpandedOpsRows((prev) => ({
                                    ...prev,
                                    [event.id]: !expanded,
                                  }));
                                  if (opsListRef.current) {
                                    opsListRef.current.resetAfterIndex(index);
                                  }
                                }}
                                aria-expanded={expanded}
                                style={{
                                  padding: '4px 6px',
                                  borderRadius: 6,
                                  border: `1px solid ${isDarkMode ? 'rgba(148,163,184,0.35)' : 'rgba(15,23,42,0.12)'}`,
                                  background: 'transparent',
                                  color: palette.text,
                                  fontSize: 11,
                                  cursor: 'pointer',
                                }}
                              >
                                {expanded ? 'Hide' : 'View'}
                              </button>
                            </div>
                          </div>
                          {expanded && (
                            <div
                              style={{
                                marginTop: 10,
                                paddingTop: 10,
                                borderTop: `1px solid ${isDarkMode ? 'rgba(148,163,184,0.25)' : 'rgba(15,23,42,0.08)'}`,
                                display: 'grid',
                                gap: 8,
                              }}
                            >
                              {event.url && (
                                <div>
                                  <strong style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3 }}>Request</strong>
                                  <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 11, wordBreak: 'break-all' }}>{event.method || 'GET'} {event.url}</div>
                                </div>
                              )}
                              {event.error && (
                                <div>
                                  <strong style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.3, color: '#ef4444' }}>Error</strong>
                                  <div style={{ fontFamily: 'ui-monospace, SFMono-Regular, monospace', fontSize: 11, wordBreak: 'break-word' }}>{event.error}</div>
                                </div>
                              )}
                              <div style={{ display: 'flex', gap: 8 }}>
                                <button
                                  onClick={() => navigator.clipboard.writeText(JSON.stringify(event, null, 2))}
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: 6,
                                    border: `1px solid ${isDarkMode ? 'rgba(148,163,184,0.25)' : 'rgba(15,23,42,0.1)'}`,
                                    background: 'transparent',
                                    color: palette.text,
                                    fontSize: 11,
                                    cursor: 'pointer',
                                  }}
                                >
                                  Copy JSON
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    }}
                  </VariableSizeList>
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
          <div className={sidebarStyle} role="navigation" aria-label="Admin dashboard sections">
            <Nav
              groups={[
                {
                  links: navItems
                }
              ]}
              selectedKey={selectedSection}
              ariaLabel="Admin dashboard sections"
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
                    '&:focus-visible': {
                      outline: `2px solid ${colours.blue}`,
                      outlineOffset: '2px',
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

    </>
  );
};

export default AdminDashboard;