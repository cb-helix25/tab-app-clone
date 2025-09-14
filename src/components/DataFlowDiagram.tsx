import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Icon } from '@fluentui/react';
import { useTheme } from '../app/functionality/ThemeContext';
import { colours } from '../app/styles/colours';

type Node = {
  id: string;
  label: string;
  lane: 'Client' | 'Server' | 'Functions' | 'Data' | 'External';
  x: number; // column index
  y: number; // row index within lane
};

type Edge = {
  from: string;
  to: string;
  label?: string;
};

/**
 * Renders a lane-based SVG diagram of the application's data flow.
 * Lanes: Client → Server → Functions → Data/External
 */
const DataFlowDiagram: React.FC = () => {
  const { isDarkMode } = useTheme();
  const laneOrder: Array<Node['lane']> = ['Client', 'Server', 'Functions', 'Data', 'External'];
  // dynamic sizing values
  const containerPadding = 12;
  const laneGap = 28; // horizontal gap between lanes
  const laneVGap = 40; // vertical gap between lane rows
  let laneHeight = 200;
  let nodeW = 170;
  const nodeH = 40;
  const vGap = 20;

  // Measure container width to wrap lanes into rows responsively
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState<number>(900);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w && Math.abs(w - containerWidth) > 1) setContainerWidth(w);
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerWidth]);

  const nodes: Node[] = [
    // Client
    { id: 'client-tabs', label: 'Teams Tab (React)', lane: 'Client', x: 0, y: 0 },
    { id: 'client-admin', label: 'Admin Dashboard', lane: 'Client', x: 0, y: 1 },

    // Server
    { id: 'server-express', label: 'Express API (/api/*)', lane: 'Server', x: 1, y: 0 },
    { id: 'server-proxy', label: 'Proxy → Azure Functions', lane: 'Server', x: 1, y: 1 },
    { id: 'server-sql', label: 'SQL-backed routes (instructions, deals)', lane: 'Server', x: 1, y: 2 },

    // Functions
    { id: 'func-ts', label: 'Functions (TS, 7072)', lane: 'Functions', x: 2, y: 0 },
    { id: 'func-js', label: 'Decoupled (JS, 7071)', lane: 'Functions', x: 2, y: 1 },
    { id: 'func-email', label: 'sendEmail (Graph)', lane: 'Functions', x: 2, y: 2 },

    // Data
    { id: 'data-sql', label: 'Azure SQL Database', lane: 'Data', x: 3, y: 0 },
    { id: 'data-kv', label: 'Key Vault (secrets)', lane: 'Data', x: 3, y: 1 },
    { id: 'data-storage', label: 'Blob/Queue (Azurite dev)', lane: 'Data', x: 3, y: 2 },

    // External
    { id: 'ext-graph', label: 'Microsoft Graph (Email)', lane: 'External', x: 4, y: 0 },
    { id: 'ext-clio', label: 'Clio API', lane: 'External', x: 4, y: 1 },
  ];

  const edges: Edge[] = [
    // Client → Server
    { from: 'client-tabs', to: 'server-express', label: 'HTTPS /api/*' },
    { from: 'client-admin', to: 'server-express' },

    // Server internals
    { from: 'server-express', to: 'server-proxy', label: 'when needed' },
    { from: 'server-express', to: 'server-sql', label: 'parameterised SQL' },

    // Server ↔ Functions
    { from: 'server-proxy', to: 'func-ts' },
    { from: 'server-proxy', to: 'func-js' },
    { from: 'server-proxy', to: 'func-email' },

    // Functions/Data
    { from: 'func-ts', to: 'data-kv', label: 'secrets' },
    { from: 'func-js', to: 'data-kv', label: 'secrets' },
    { from: 'func-email', to: 'data-kv', label: 'secrets' },
    { from: 'server-sql', to: 'data-sql' },
    { from: 'func-ts', to: 'data-storage' },
    { from: 'func-js', to: 'data-storage' },

    // External services
    { from: 'func-email', to: 'ext-graph', label: 'sendMail' },
    { from: 'server-express', to: 'ext-clio', label: 'matters, contacts' },
  ];

  const laneColor = isDarkMode ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
  const border = isDarkMode ? '1px solid rgba(255,255,255,0.10)' : '1px solid rgba(0,0,0,0.08)';
  const textColor = isDarkMode ? colours.dark.text : colours.light.text;

  // Compute columns per row based on container width
  const columns = useMemo(() => {
    const minCols = 1;
    const maxCols = laneOrder.length;
    // estimate using a target lane width when container is small
    const targetLaneWidth = 260;
    const totalLaneSpace = targetLaneWidth + laneGap; // per column
    if (!containerWidth || containerWidth < targetLaneWidth) return 1;
    // Leave slight padding margin
    const usable = Math.max(0, containerWidth - containerPadding * 2);
    const cols = Math.floor((usable + laneGap) / totalLaneSpace);
    return Math.max(minCols, Math.min(maxCols, cols || 1));
  }, [containerWidth]);

  const laneColsRows = useMemo(() => {
    const rows = Math.ceil(laneOrder.length / columns);
    return { rows, columns };
  }, [columns]);

  // Compute lane width to fill the container evenly
  const laneWidth = useMemo(() => {
    const totalGaps = laneGap * (columns - 1);
    const usable = Math.max(0, containerWidth - containerPadding * 2 - totalGaps);
    const w = Math.floor(usable / columns);
    return Math.max(220, w); // clamp min width
  }, [containerWidth, columns]);

  // Compute node width relative to lane width
  nodeW = Math.min(260, Math.max(140, laneWidth - 40));

  // Compute lane height based on busiest lane
  const maxRowsPerLane = useMemo(() => {
    const map: Record<string, number> = {};
    for (const n of nodes) {
      map[n.lane] = Math.max(map[n.lane] ?? 0, (n.y + 1));
    }
    return Math.max(1, ...Object.values(map));
  }, []);
  laneHeight = Math.max(160, 18 + maxRowsPerLane * (nodeH + vGap));

  const lanePos = (laneIndex: number) => {
    const col = laneIndex % laneColsRows.columns;
    const row = Math.floor(laneIndex / laneColsRows.columns);
    const x = col * (laneWidth + laneGap);
    const y = row * (laneHeight + laneVGap);
    return { x, y };
  };

  const nodePos = (n: Node) => {
    const idx = laneOrder.indexOf(n.lane);
    const lane = lanePos(idx);
    const padding = 18;
    const x = lane.x + (laneWidth - nodeW) / 2;
    const y = lane.y + padding + n.y * (nodeH + vGap);
    return { x, y };
  };

  const svgWidth = Math.max(1, laneColsRows.columns * (laneWidth + laneGap) - laneGap);
  const svgHeight = Math.max(1, laneColsRows.rows * (laneHeight + laneVGap) - laneVGap + 20);

  const nodeMap = new Map(nodes.map(n => [n.id, n] as const));

  const arrow = (fromId: string, toId: string, label?: string) => {
    const from = nodeMap.get(fromId)!;
    const to = nodeMap.get(toId)!;
    const p1 = nodePos(from);
    const p2 = nodePos(to);
    const startX = p1.x + nodeW;
    const startY = p1.y + nodeH / 2;
    const endX = p2.x;
    const endY = p2.y + nodeH / 2;
    // Control points for a smooth curve regardless of row/col positions
    const dx = Math.max(40, Math.abs(endX - startX) * 0.4);
    const cp1X = startX + dx;
    const cp1Y = startY;
    const cp2X = endX - dx;
    const cp2Y = endY;
    const path = `M ${startX} ${startY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${endX - 10} ${endY}`;
    const isProxy = fromId === 'server-proxy';
    const strokeDasharray = isProxy ? '6,4' : undefined;
    return (
      <g key={`${fromId}->${toId}`}>
        <path d={path} stroke={isDarkMode ? '#6ea8d6' : '#3690CE'} strokeWidth={2} fill="none" markerEnd="url(#arrow)" strokeDasharray={strokeDasharray} />
        {label && (
          <text x={(startX + endX) / 2} y={(startY + endY) / 2 - 6} textAnchor="middle" fontSize={11} fill={isDarkMode ? '#cbd5e1' : '#334155'}>
            {label}
          </text>
        )}
      </g>
    );
  };

  return (
    <div ref={containerRef} style={{
      border,
      borderRadius: 8,
      padding: 12,
      background: `linear-gradient(135deg, ${isDarkMode ? colours.dark.background : '#FFFFFF'} 0%, ${isDarkMode ? colours.dark.background : '#F8FAFC'} 100%)`,
      boxShadow: isDarkMode ? '0 4px 6px rgba(0,0,0,0.3)' : '0 4px 6px rgba(0,0,0,0.07)'
    }}>
  <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="xMidYMin meet" role="img" aria-label="Application data flow diagram">
        <defs>
          <marker id="arrow" markerWidth="10" markerHeight="10" refX="10" refY="3" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L0,6 L9,3 z" fill={isDarkMode ? '#6ea8d6' : '#3690CE'} />
          </marker>
        </defs>

        {laneOrder.map((lane, i) => {
          const lp = lanePos(i);
          return (
            <g key={lane}>
              <rect x={lp.x} y={lp.y} width={laneWidth} height={laneHeight} rx={8} ry={8} fill={laneColor} />
              <text x={lp.x + laneWidth / 2} y={lp.y + 16} textAnchor="middle" fontSize={12} fill={isDarkMode ? '#cbd5e1' : '#334155'}>
                {lane}
              </text>
            </g>
          );
        })}

        {/* Edges underneath nodes */}
        {edges.map(e => arrow(e.from, e.to, e.label))}

  {/* Nodes */}
        {nodes.map(n => {
          const p = nodePos(n);
          const gradId = `grad-${n.id}`;
          const light = ['#FFFFFF', '#F8FAFC'];
          const dark = [colours.dark.background, colours.dark.background];
          const [c1, c2] = isDarkMode ? dark : light;
          return (
            <g key={n.id}>
              <defs>
                <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={c1} />
                  <stop offset="100%" stopColor={c2} />
                </linearGradient>
              </defs>
              <rect x={p.x} y={p.y} width={nodeW} height={nodeH} rx={8} ry={8} fill={`url(#${gradId})`} stroke={isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'} />
              <text x={p.x + nodeW / 2} y={p.y + nodeH / 2 + 4} textAnchor="middle" fontSize={12} fill={textColor}>
                {n.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* Visual legend (subtle Fluent UI icons) */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'center', marginTop: 10, fontSize: 12, color: isDarkMode ? colours.dark.subText : colours.light.subText }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon iconName="Forward" style={{ fontSize: 14, color: isDarkMode ? '#cbd5e1' : '#64748b' }} />
          <span>Direct call</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon iconName="Flow" style={{ fontSize: 14, color: isDarkMode ? '#cbd5e1' : '#64748b' }} />
          <span>Proxy → Functions</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon iconName="Shield" style={{ fontSize: 14, color: isDarkMode ? '#cbd5e1' : '#64748b' }} />
          <span>Secrets (Key Vault)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon iconName="Cloud" style={{ fontSize: 14, color: isDarkMode ? '#cbd5e1' : '#64748b' }} />
          <span>Storage</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon iconName="Mail" style={{ fontSize: 14, color: isDarkMode ? '#cbd5e1' : '#64748b' }} />
          <span>Email (Graph)</span>
        </div>
      </div>
    </div>
  );
};

export default DataFlowDiagram;
