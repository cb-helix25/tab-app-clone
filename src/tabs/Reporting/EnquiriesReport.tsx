import React, { useMemo, useState } from 'react';
import { useTheme } from '../../app/functionality/ThemeContext';
import type { Enquiry } from '../../app/functionality/types';
import MetricCard from './MetricCard';
import { colours } from '../../app/styles/colours';

interface EnquiriesReportProps {
  enquiries: Enquiry[] | null;
}

// Helpers
function parseDate(value: unknown): Date | null {
  if (!value) return null;
  const d = new Date(String(value));
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Derive up-to-two-letter initials from a display name or email.
 * - Email: use local-part split by non-letters (., _, -), take first and last tokens.
 * - Name: split by whitespace, take first and last tokens.
 */
function getInitials(input: string): string {
  const s = (input || '').trim();
  if (!s) return '?';
  let tokens: string[] = [];
  if (s.includes('@')) {
    const local = s.split('@')[0] || '';
    tokens = local.split(/[^a-zA-Z]+/).filter(Boolean);
  } else {
    tokens = s.split(/\s+/).filter(Boolean);
  }
  if (tokens.length === 0) return '?';
  const first = tokens[0][0] || '';
  const last = (tokens.length > 1 ? tokens[tokens.length - 1][0] : (tokens[0][1] || ''));
  const initials = (first + last).toUpperCase();
  return initials || '?';
}

function isWithin(date: Date | null, start: Date, end: Date): boolean {
  if (!date) return false;
  return date >= start && date <= end;
}

const quickRanges: Array<{ key: string; label: string; get: () => { start: Date; end: Date } | null }> = [
  {
    key: 'today',
    label: 'Today',
    get: () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
  },
  {
    key: 'thisWeek',
    label: 'This week',
    get: () => {
      const now = new Date();
      const start = new Date(now);
      const day = start.getDay();
      const diff = day === 0 ? -6 : 1 - day; // Monday start
      start.setDate(start.getDate() + diff);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
  },
  {
    key: 'thisMonth',
    label: 'This month',
    get: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
  },
  {
    key: 'lastMonth',
    label: 'Last month',
    get: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
  },
  {
    key: 'thisQuarter',
    label: 'This quarter',
    get: () => {
      const now = new Date();
      const q = Math.floor(now.getMonth() / 3);
      const start = new Date(now.getFullYear(), q * 3, 1);
      const end = new Date(now.getFullYear(), q * 3 + 3, 0);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
  },
  {
    key: 'thisYear',
    label: 'This year',
    get: () => {
      const now = new Date();
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      end.setHours(23, 59, 59, 999);
      return { start, end };
    },
  },
  {
    key: 'all',
    label: 'All',
    get: () => null, // no filtering
  },
];

function workingDaysBetween(start: Date, end: Date): number {
  let count = 0;
  const d = new Date(start);
  while (d <= end) {
    const day = d.getDay();
    if (day !== 0 && day !== 6) count++;
    d.setDate(d.getDate() + 1);
  }
  return Math.max(1, count);
}

// Triaged POC identifiers and patterns (case-insensitive)
function isTriagedPoc(value: string): boolean {
  const v = (value || '').trim().toLowerCase();
  if (!v) return false;
  if (v === 'property@helix-law.com' || v === 'commercial@helix-law.com' || v === 'construction@helix-law.com') return true;
  const local = v.includes('@') ? v.split('@')[0] : v;
  if (local === 'commercial' || local === 'construction' || local === 'property') return true;
  return false;
}

function containerStyle(isDark: boolean): React.CSSProperties {
  return {
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
    background: isDark ? colours.dark.background : colours.light.background,
    padding: '18px 22px',
    minHeight: '100%',
  };
}

function surface(isDark: boolean, overrides: React.CSSProperties = {}): React.CSSProperties {
  return {
    background: isDark ? 'rgba(15, 23, 42, 0.88)' : '#FFFFFF',
    borderRadius: 12,
    border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.24)' : 'rgba(15, 23, 42, 0.06)'}`,
    boxShadow: isDark ? '0 2px 10px rgba(0, 0, 0, 0.22)' : '0 2px 8px rgba(15, 23, 42, 0.06)',
    padding: 16,
    ...overrides,
  };
}

const grid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(12, 1fr)',
  gap: 12,
};

const pill: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  padding: '5px 10px',
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 600,
};

function sectionTitle(): React.CSSProperties {
  return { fontSize: 16, fontWeight: 600, margin: 0 };
}

function toCsv(rows: Array<Record<string, unknown>>): string {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  };
  const lines = [headers.join(',')];
  rows.forEach((r) => {
    lines.push(headers.map((h) => escape((r as any)[h])).join(','));
  });
  return lines.join('\n');
}

const EnquiriesReport: React.FC<EnquiriesReportProps> = ({ enquiries }) => {
  const { isDarkMode } = useTheme();
  const [rangeKey, setRangeKey] = useState<string>('thisMonth');
  const range = useMemo(() => quickRanges.find(r => r.key === rangeKey)?.get() || null, [rangeKey]);

  const filtered = useMemo(() => {
    const list = enquiries || [];
    if (!range) return list;
    return list.filter((e) => isWithin(parseDate((e as any).Touchpoint_Date), range.start, range.end));
  }, [enquiries, range]);

  const stats = useMemo(() => {
    const total = filtered.length;
    const bySource = new Map<string, number>();
    const byPoc = new Map<string, number>();
    let claimed = 0;
    let unclaimed = 0;

    const getSource = (e: any): string => {
      const candidates = [e.source, e.Ultimate_Source, e.Source];
      let src = candidates.find((s) => typeof s === 'string' && s.trim())?.trim();
      if (!src) {
        const moc = (e.Method_of_Contact || e.moc || '').trim();
        if (moc) src = moc;
      }
      if (!src) {
        const companyRef = (e.Referring_Company || e.company_referrer || '').trim();
        const contactRef = (e.Contact_Referrer || e.contact_referrer || '').trim();
        if (companyRef) src = `Referral: ${companyRef}`;
        else if (contactRef) src = `Referral: ${contactRef}`;
      }
      return src || 'Unknown';
    };

    const getPocRaw = (e: any): string => (e.Point_of_Contact || e.poc || '').trim();
    const isClaimed = (pocRaw: string): boolean => {
      const v = pocRaw.toLowerCase();
      if (!v) return false;
      // Treat team inbox and placeholders as unclaimed
      if (v === 'team@helix-law.com' || v === 'team' || v === 'anyone' || v === 'unassigned' || v === 'unknown' || v === 'n/a') return false;
      // Triaged are not considered claimed
      if (isTriagedPoc(v)) return false;
      return true;
    };

    filtered.forEach((e: any) => {
      const src = getSource(e);
      bySource.set(src, (bySource.get(src) || 0) + 1);

      const pocRaw = getPocRaw(e);
      const claimedFlag = isClaimed(pocRaw);
      let pocKey: string;
      if (claimedFlag) pocKey = pocRaw;
      else if (isTriagedPoc(pocRaw)) pocKey = 'Triaged';
      else pocKey = 'Unassigned';
      byPoc.set(pocKey, (byPoc.get(pocKey) || 0) + 1);
      if (claimedFlag) claimed++; else unclaimed++;
    });
    const wdRaw = range ? workingDaysBetween(range.start, range.end) : workingDaysBetween(new Date(2000,0,1), new Date());
    const wdForRate = Math.max(1, wdRaw); // avoid divide-by-zero; do not alter displayed badge count
    const perDay = total / wdForRate;
    return { total, perDay, bySource, byPoc, workingDays: wdRaw, claimed, unclaimed };
  }, [filtered, range]);

  // Group recent enquiries by day for progressive loading (timeline style)
  const dayGroups = useMemo(() => {
    const groupsMap = new Map<string, any[]>();
    for (const e of filtered) {
      const d0 = parseDate((e as any).Touchpoint_Date);
      if (!d0 || isNaN(d0.getTime())) continue;
      const y = d0.getFullYear();
      const m = String(d0.getMonth() + 1).padStart(2, '0');
      const day = String(d0.getDate()).padStart(2, '0');
      const key = `${y}-${m}-${day}`;
      const arr = groupsMap.get(key) || [];
      arr.push(e);
      groupsMap.set(key, arr);
    }
    return Array.from(groupsMap.entries())
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([date, items]) => ({ date, items }));
  }, [filtered]);
  // Infinite scroll over date groups
  const [visibleGroupCount, setVisibleGroupCount] = useState<number>(3);
  const sentinelRef = React.useRef<HTMLDivElement | null>(null);
  React.useEffect(() => {
    setVisibleGroupCount(3);
  }, [rangeKey, dayGroups.length]);
  React.useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver((entries) => {
      const first = entries[0];
      if (first && first.isIntersecting) {
        setVisibleGroupCount((n) => Math.min(dayGroups.length, n + 3));
      }
    }, { rootMargin: '200px' });
    obs.observe(el);
    return () => obs.disconnect();
  }, [dayGroups.length]);

  const topSources = useMemo(() => Array.from(stats.bySource.entries()).sort((a,b)=>b[1]-a[1]).slice(0,6), [stats.bySource]);
  const topPocs = useMemo(() => Array.from(stats.byPoc.entries()).sort((a,b)=>b[1]-a[1]).slice(0,10), [stats.byPoc]);

  // Hover highlight for fee earner within a day group
  const [hoverHighlight, setHoverHighlight] = useState<{ date: string; poc: string } | null>(null);

  // Button styles for quick ranges
  const isActive = (k: string) => k === rangeKey;
  const buttonStyle = (active: boolean): React.CSSProperties => ({
    borderRadius: 999,
    padding: '6px 10px',
    fontSize: 12,
    fontWeight: active ? 700 : 600,
    background: active ? `linear-gradient(135deg, ${colours.highlight} 0%, #2f7cb3 100%)` : (isDarkMode ? 'rgba(15, 23, 42, 0.8)' : 'transparent'),
    color: active ? '#ffffff' : (isDarkMode ? '#E2E8F0' : colours.missedBlue),
    border: active ? `2px solid ${isDarkMode ? '#87ceeb' : colours.highlight}` : `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.24)' : 'rgba(13, 47, 96, 0.16)'}`,
    cursor: 'pointer',
  });

  return (
    <div style={containerStyle(isDarkMode)}>
      <div style={surface(isDarkMode)}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Enquiries report</h2>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {quickRanges.map(r => {
              const active = isActive(r.key);
              const style: React.CSSProperties = {
                ...buttonStyle(active),
                display: 'inline-flex',
                alignItems: 'center',
              };
              return (
                <button key={r.key} style={style} onClick={() => setRangeKey(r.key)}>
                  <span>{r.label}</span>
                </button>
              );
            })}
          </div>
          <div style={{ marginTop: 6, fontSize: 12, opacity: 0.75 }}>
            {range ? `${stats.workingDays} working days in selected range` : 'All data (working days not applicable)'}
          </div>
        </div>
        {/* Dashboard-style stat cards */}
        <div style={{ marginTop: 12, display: 'grid', gridTemplateColumns: 'repeat(3, minmax(220px, 1fr))', gap: 12 }}>
          {/* Total Enquiries */}
          <div style={{
            borderRadius: 12,
            padding: 16,
            background: isDarkMode ? 'linear-gradient(135deg, #0B1220 0%, #141C2C 100%)' : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
            boxShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.07)',
            border: isDarkMode ? '1px solid rgba(148,163,184,0.18)' : '1px solid rgba(13,47,96,0.08)'
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.7, marginBottom: 6 }}>Enquiries</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: isDarkMode ? '#E2E8F0' : colours.missedBlue }}>
              {filtered.length.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>~ {Math.round(stats.perDay)} per working day</div>
          </div>

          {/* Claimed */}
          <div style={{
            borderRadius: 12,
            padding: 16,
            background: isDarkMode ? 'linear-gradient(135deg, #0B1220 0%, #12263A 100%)' : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
            boxShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.07)',
            border: isDarkMode ? '1px solid rgba(148,163,184,0.18)' : '1px solid rgba(13,47,96,0.08)'
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.7, marginBottom: 6 }}>Claimed</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: isDarkMode ? '#E2E8F0' : colours.missedBlue }}>
              {stats.claimed.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
              {filtered.length ? Math.round((stats.claimed / filtered.length) * 100) : 0}% of total
            </div>
          </div>

          {/* Unclaimed */}
          <div style={{
            borderRadius: 12,
            padding: 16,
            background: isDarkMode ? 'linear-gradient(135deg, #0B1220 0%, #2A1B1B 100%)' : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
            boxShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.07)',
            border: isDarkMode ? '1px solid rgba(148,163,184,0.18)' : '1px solid rgba(13,47,96,0.08)'
          }}>
            <div style={{ fontSize: 12, fontWeight: 700, opacity: 0.7, marginBottom: 6 }}>Unclaimed</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: isDarkMode ? '#E2E8F0' : colours.missedBlue }}>
              {stats.unclaimed.toLocaleString()}
            </div>
            <div style={{ fontSize: 12, opacity: 0.8, marginTop: 6 }}>
              {filtered.length ? Math.round((stats.unclaimed / filtered.length) * 100) : 0}% of total
            </div>
          </div>
        </div>
      </div>

      <div style={grid}>
        <div style={{ gridColumn: 'span 6' }}>
          <div style={surface(isDarkMode)}>
            <h3 style={sectionTitle()}>Top sources</h3>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topSources.map(([name, count]) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px dashed ${isDarkMode ? 'rgba(148,163,184,0.2)' : 'rgba(15,23,42,0.08)'}`, padding: '6px 0' }}>
                  <span>{name}</span>
                  <span style={{ fontWeight: 600 }}>{count}</span>
                </div>
              ))}
              {topSources.length === 0 && <span style={{ opacity: 0.7 }}>No data in range.</span>}
            </div>
          </div>
        </div>
        <div style={{ gridColumn: 'span 6' }}>
          <div style={surface(isDarkMode)}>
            <h3 style={sectionTitle()}>By fee earner</h3>
            <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 8 }}>
              {topPocs.map(([name, count]) => (
                <div key={name} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: `1px dashed ${isDarkMode ? 'rgba(148,163,184,0.2)' : 'rgba(15,23,42,0.08)'}`, padding: '6px 0' }}>
                  <span>{name}</span>
                  <span style={{ fontWeight: 600 }}>{count}</span>
                </div>
              ))}
              {topPocs.length === 0 && <span style={{ opacity: 0.7 }}>No data in range.</span>}
            </div>
          </div>
        </div>
      </div>

      <div style={surface(isDarkMode)}>
        <h3 style={sectionTitle()}>Recent enquiries</h3>
        {dayGroups.length === 0 ? (
          <div style={{ opacity: 0.7 }}>No enquiries in the selected range.</div>
        ) : (
          <div>
            {dayGroups.slice(0, visibleGroupCount).map((grp, gIdx) => {
              const dateStr = new Date(grp.date).toLocaleDateString('en-GB');
              // Connector accent: brand accent in dark mode (higher alpha), standard blue in light mode
              const accent = isDarkMode ? 'rgba(135, 243, 243, 0.55)' : colours.missedBlue;
              const connectorStyle: React.CSSProperties = {
                position: 'absolute',
                left: 10,
                top: gIdx === 0 ? '20px' : 0,
                bottom: gIdx === visibleGroupCount - 1 ? '50%' : 0,
                width: 2,
                background: accent,
                opacity: 1,
                zIndex: 1,
              };
              const nodeStyle: React.CSSProperties = {
                position: 'absolute',
                left: 6,
                top: 16,
                width: 10,
                height: 10,
                borderRadius: 5,
                background: isDarkMode ? 'rgba(255,255,255,0.15)' : '#fff',
                border: `2px solid ${accent}`,
                zIndex: 2,
              };
              const blockStyle: React.CSSProperties = {
                borderRadius: 12,
                padding: 12,
                background: isDarkMode ? 'linear-gradient(135deg, #0B1220 0%, #141C2C 100%)' : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                boxShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.07)',
                border: isDarkMode ? '1px solid rgba(148,163,184,0.18)' : '1px solid rgba(13,47,96,0.08)'
              };
              const headerPillStyle: React.CSSProperties = {
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 10px',
                borderRadius: 8,
                background: isDarkMode ? 'rgba(148,163,184,0.12)' : 'rgba(13,47,96,0.05)',
                border: isDarkMode ? '1px solid rgba(148,163,184,0.18)' : '1px solid rgba(13,47,96,0.08)',
                fontWeight: 700,
                marginBottom: 8,
              };
              const subtleBadge: React.CSSProperties = {
                display: 'inline-block',
                padding: '1px 6px',
                borderRadius: 999,
                background: isDarkMode ? 'rgba(148,163,184,0.12)' : 'rgba(13,47,96,0.05)',
                border: isDarkMode ? '1px solid rgba(148,163,184,0.18)' : '1px solid rgba(13,47,96,0.08)',
                fontSize: 11,
                fontWeight: 600,
              };
              return (
                <div key={grp.date} style={{ position: 'relative', paddingLeft: 24, marginBottom: 18 }}>
                  {/* Accent connector and node */}
                  <div style={connectorStyle} />
                  <div style={nodeStyle} />
                  {/* Block container */}
                  <div style={blockStyle}>
                    {/* Date header pill */}
                    <div style={headerPillStyle}>
                      <span>{dateStr}</span>
                      <span style={{ fontSize: 12, opacity: 0.8 }}>· {grp.items.length} enquiries</span>
                    </div>
                    {/* Group rows: Name | Point of contact | Call taker (Internal/External) */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px 160px', gap: 8 }}>
                      <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.55 }}>Name</div>
                      <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.55 }}>Point of contact</div>
                      <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.55 }}>Call taker</div>
                      {grp.items.map((e: any, idx2: number) => {
                        const name = e.Client_Name || e.Description || e.Client || `${e.First_Name || ''} ${e.Last_Name || ''}`.trim() || '-';
                        const stageStr = typeof e.stage === 'string' ? e.stage.toLowerCase() : (typeof (e as any).Stage === 'string' ? (e as any).Stage.toLowerCase() : '');
                        const statusStr = typeof (e as any).Status === 'string' ? (e as any).Status.toLowerCase() : (typeof (e as any).status === 'string' ? (e as any).status.toLowerCase() : '');
                        // Heuristics to identify Deal vs Instruction
                        const instructionRefField = (e as any).InstructionRef || (e as any).instruction_ref || (e as any).instructionRef;
                        const rRefField = instructionRefField || (e as any).RRef || (e as any).rref || (e as any).Rref;
                        const dealIdRaw = (e as any).DealId ?? (e as any).deal_id ?? (e as any).dealId;
                        const prospectIdRaw = (e as any).ProspectId ?? (e as any).prospect_id ?? (e as any).prospectId;
                        const dealIdNum = typeof dealIdRaw === 'string' ? parseInt(dealIdRaw, 10) : (typeof dealIdRaw === 'number' ? dealIdRaw : NaN);
                        const prospectIdNum = typeof prospectIdRaw === 'string' ? parseInt(prospectIdRaw, 10) : (typeof prospectIdRaw === 'number' ? prospectIdRaw : NaN);
                        const hasInstruction = Boolean(
                          instructionRefField ||
                          (e as any).Matter_Ref || (e as any).matter_ref || (e as any).MatterRef || (e as any).matterRef ||
                          (e as any).MatterId || (e as any).MatterID || (e as any).matterId || (e as any).matterID ||
                          statusStr === 'closed' || statusStr === 'instructed' ||
                          (stageStr && stageStr.includes('instruct'))
                        );
                        const hasDeal = Boolean(
                          (e as any).pitch === true ||
                          (e as any).Pitched === true ||
                          Boolean((e as any).PitchedDate) ||
                          (stageStr && (stageStr.includes('deal') || stageStr.includes('pitch'))) ||
                          statusStr === 'pitched' ||
                          // If we have an RRef-like value but no confirmed instruction, treat as deal
                          (!!rRefField && !hasInstruction) ||
                          (Number.isFinite(dealIdNum) && dealIdNum > 0) ||
                          (Number.isFinite(prospectIdNum) && prospectIdNum > 0)
                        );
                        const pocRaw = (e.Point_of_Contact || '').trim().toLowerCase();
                        const isUnclaimed = !pocRaw || pocRaw === 'team@helix-law.com';
                        const isTriaged = isTriagedPoc(pocRaw);
                        const isClaimed = !isUnclaimed && !isTriaged;
                        const isHighlightActive = !!hoverHighlight && hoverHighlight.date === grp.date;
                        const isRowHighlighted = isHighlightActive && hoverHighlight!.poc === pocRaw;
                        const highlightedCellStyle: React.CSSProperties = isRowHighlighted
                          ? (isDarkMode
                              ? { background: 'rgba(135, 243, 243, 0.12)', outline: '1px solid rgba(135, 243, 243, 0.38)', borderRadius: 6 }
                              : { background: 'rgba(13, 47, 96, 0.06)', outline: '1px solid rgba(13, 47, 96, 0.18)', borderRadius: 6 })
                          : {};
                        const pocLabel = isUnclaimed ? 'Unclaimed' : (isTriaged ? 'Triaged' : (e.Point_of_Contact as string));
                        const pocStyle: React.CSSProperties = (isUnclaimed || isTriaged)
                          ? {
                              ...subtleBadge,
                              background: isTriaged
                                ? (isDarkMode ? 'rgba(71,85,105,0.18)' : 'rgba(100,116,139,0.12)') // dark grey for Triaged
                                : (isDarkMode ? 'rgba(220,38,38,0.12)' : 'rgba(220,38,38,0.08)'),
                              border: isTriaged
                                ? (isDarkMode ? '1px solid rgba(148,163,184,0.35)' : '1px solid rgba(100,116,139,0.28)')
                                : (isDarkMode ? '1px solid rgba(248,113,113,0.28)' : '1px solid rgba(220,38,38,0.18)'),
                              color: isTriaged
                                ? (isDarkMode ? '#CBD5E1' : '#334155')
                                : (isDarkMode ? '#fda4af' : '#b91c1c'),
                            }
                          : {};
                        const taker = (e.Call_Taker || '').trim();
                        const takerLabel = taker.toLowerCase() === 'operations' ? 'Internal' : 'External';
                        const takerStyle: React.CSSProperties = subtleBadge;
                        const claimedBadge: React.CSSProperties = isDarkMode
                          ? { ...subtleBadge, background: 'rgba(32,178,108,0.12)', border: '1px solid rgba(32,178,108,0.28)', color: '#86efac', marginRight: 6 }
                          : { ...subtleBadge, background: 'rgba(32,178,108,0.08)', border: '1px solid rgba(32,178,108,0.18)', color: colours.green, marginRight: 6 };
                        // Claimed indicator: subtle dot instead of row bar/background
                        const rowDim: React.CSSProperties = {};
                        const nameCellExtra: React.CSSProperties = {};
                        const claimedDotStyle: React.CSSProperties = {
                          display: 'inline-block', width: 6, height: 6, borderRadius: 999, marginRight: 6,
                          background: colours.green, verticalAlign: 'middle'
                        };
                        const tagBase: React.CSSProperties = {
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '2px 6px', borderRadius: 999, fontSize: 10, fontWeight: 700,
                          marginLeft: 8
                        };
                        // Align with Instructions module semantics and colours: Pitched (blue), Instructed (green)
                        const dealTag: React.CSSProperties = isDarkMode
                          ? { ...tagBase, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(147,197,253,0.28)', color: '#93c5fd' }
                          : { ...tagBase, background: 'rgba(37,99,235,0.08)', border: '1px solid rgba(37,99,235,0.18)', color: '#1e40af' };
                        const instructionTag: React.CSSProperties = isDarkMode
                          ? { ...tagBase, background: 'rgba(32,178,108,0.12)', border: '1px solid rgba(32,178,108,0.28)', color: '#86efac' }
                          : { ...tagBase, background: 'rgba(32,178,108,0.08)', border: '1px solid rgba(32,178,108,0.18)', color: colours.green };
                        const initialsPillStyle: React.CSSProperties = {
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          width: 22, height: 22, borderRadius: 999, fontSize: 10, fontWeight: 800,
                          color: isDarkMode ? '#E2E8F0' : colours.missedBlue,
                          background: isDarkMode ? 'linear-gradient(135deg, #0B1220 0%, #12263A 100%)' : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                          border: isDarkMode ? '1px solid rgba(148,163,184,0.35)' : '1px solid rgba(13,47,96,0.18)',
                          boxShadow: isDarkMode ? '0 1px 2px rgba(0,0,0,0.35)' : '0 1px 2px rgba(15,23,42,0.08)',
                          marginRight: 8, cursor: 'pointer'
                        };
                        return (
                          <React.Fragment key={idx2}>
                            <div style={{ ...rowDim, ...nameCellExtra, ...highlightedCellStyle, display: 'flex', alignItems: 'center', gap: 6 }}>
                              {isClaimed && <span style={claimedDotStyle} />}
                              <span>{name}</span>
                              {hasDeal && <span title="Pitched" aria-label="Pitched" style={dealTag}>Pitched</span>}
                              {hasInstruction && <span title="Instructed" aria-label="Instructed" style={instructionTag}>Instructed</span>}
                            </div>
                            <div
                              style={{ ...rowDim, ...highlightedCellStyle, display: 'flex', alignItems: 'center' }}
                              onMouseEnter={() => { if (isClaimed) setHoverHighlight({ date: grp.date, poc: pocRaw }); }}
                              onMouseLeave={() => { if (isRowHighlighted) setHoverHighlight(null); }}
                            >
                              {isClaimed && (
                                <>
                                  {hasInstruction ? (
                                    <span title="Instructed" aria-label="Instructed" style={instructionTag}>Instructed</span>
                                  ) : hasDeal ? (
                                    <span title="Pitched" aria-label="Pitched" style={dealTag}>Pitched</span>
                                  ) : (
                                    <span style={claimedBadge}>Claimed</span>
                                  )}
                                  <span
                                    title={pocLabel}
                                    aria-label={pocLabel}
                                    style={initialsPillStyle}
                                    onMouseEnter={() => setHoverHighlight({ date: grp.date, poc: pocRaw })}
                                    onMouseLeave={() => { if (isRowHighlighted) setHoverHighlight(null); }}
                                  >
                                    {getInitials(e.Point_of_Contact as string)}
                                  </span>
                                </>
                              )}
                              {isUnclaimed || isTriaged ? <span style={pocStyle}>{pocLabel}</span> : null}
                            </div>
                            <div style={{ ...rowDim, ...highlightedCellStyle }}><span style={takerStyle}>{takerLabel}</span></div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
            {/* Sentinel for infinite scroll */}
            {visibleGroupCount < dayGroups.length && <div ref={sentinelRef} style={{ height: 1 }} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default EnquiriesReport;
