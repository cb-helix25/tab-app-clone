import React, { useEffect, useMemo, useState } from 'react';
import { Spinner, SpinnerSize } from '@fluentui/react';
import { colours } from '../../app/styles/colours';

interface Ga4Row {
  date: string; // YYYYMMDD
  sessions?: number;
  activeUsers?: number;
  screenPageViews?: number;
  bounceRate?: number;
  averageSessionDuration?: number;
  conversions?: number;
}

interface SeriesPoint {
  x: string; // YYYY-MM-DD
  y: number;
}

const cardStyle = (isDark: boolean): React.CSSProperties => ({
  background: isDark ? 'rgba(15, 23, 42, 0.88)' : '#fff',
  border: `1px solid ${isDark ? 'rgba(148, 163, 184, 0.24)' : 'rgba(15, 23, 42, 0.06)'}`,
  borderRadius: 12,
  padding: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
});

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, fontFamily: 'Raleway, sans-serif' }}>{children}</h2>
);

function fmtDate(d: string): string {
  if (!d || d.length !== 8) return d;
  return `${d.slice(0,4)}-${d.slice(4,6)}-${d.slice(6)}`;
}

function toSeries(rows: Ga4Row[] | undefined, key: keyof Ga4Row): SeriesPoint[] {
  if (!rows) return [];
  return rows.map(r => ({ x: fmtDate(r.date), y: Number(r[key] ?? 0) }));
}

const SeoReport: React.FC = () => {
  const [isDark, setIsDark] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<Ga4Row[]>([]);

  useEffect(() => {
    setIsDark(window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // Request GA4 data (organicOnly where possible) for last 30 days
        const resp = await fetch('/api/marketing-metrics/ga4?daysBack=30&organicOnly=true');
        if (!resp.ok) throw new Error(`${resp.status} ${resp.statusText}`);
        const payload = await resp.json();
        const rowsArray = Array.isArray(payload?.data) ? payload.data : Array.isArray(payload) ? payload : [];
        const mapped: Ga4Row[] = rowsArray.map((d: any) => ({
          date: d.date || d.googleAnalytics?.date,
          sessions: d.googleAnalytics?.sessions,
          activeUsers: d.googleAnalytics?.activeUsers,
          screenPageViews: d.googleAnalytics?.screenPageViews,
          bounceRate: d.googleAnalytics?.bounceRate,
          averageSessionDuration: d.googleAnalytics?.averageSessionDuration,
          conversions: d.googleAnalytics?.conversions,
        }));
        setRows(mapped);
      } catch (e: any) {
        setError(e?.message || 'Failed to load GA4 data');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sessions = useMemo(() => toSeries(rows, 'sessions'), [rows]);
  const users = useMemo(() => toSeries(rows, 'activeUsers'), [rows]);
  const conversions = useMemo(() => toSeries(rows, 'conversions'), [rows]);

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <Spinner size={SpinnerSize.medium} label="Loading SEO metrics…" />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 16, color: isDark ? '#fecaca' : '#991b1b', background: isDark ? 'rgba(248,113,113,0.18)' : 'rgba(248,113,113,0.12)', borderRadius: 10 }}>
        {error}
      </div>
    );
  }

  const statCard = (label: string, value: string) => (
    <div style={cardStyle(isDark)}>
      <span style={{ fontSize: 12, color: isDark ? '#E2E8F0' : colours.missedBlue, fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 22, fontWeight: 700 }}>{value}</span>
    </div>
  );

  const last = rows[rows.length - 1];
  const totalSessions = rows.reduce((acc, r) => acc + (r.sessions || 0), 0);
  const totalUsers = rows.reduce((acc, r) => acc + (r.activeUsers || 0), 0);
  const totalConversions = rows.reduce((acc, r) => acc + (r.conversions || 0), 0);

  return (
    <div style={{ minHeight: '100vh', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <SectionTitle>SEO report (GA4)</SectionTitle>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {statCard('30‑day sessions', totalSessions.toLocaleString())}
        {statCard('30‑day users', totalUsers.toLocaleString())}
        {statCard('30‑day conversions', totalConversions.toLocaleString())}
        {statCard('Latest day', last ? fmtDate(last.date) : '—')}
      </div>

      <div style={cardStyle(isDark)}>
        <span style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Daily sessions (last 30 days)</span>
        <pre style={{ margin: 0, overflowX: 'auto', fontSize: 12 }}>
          {JSON.stringify(sessions.slice(-30), null, 2)}
        </pre>
      </div>

      <div style={cardStyle(isDark)}>
        <span style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Daily users (last 30 days)</span>
        <pre style={{ margin: 0, overflowX: 'auto', fontSize: 12 }}>
          {JSON.stringify(users.slice(-30), null, 2)}
        </pre>
      </div>

      <div style={cardStyle(isDark)}>
        <span style={{ fontSize: 13, fontWeight: 600, marginBottom: 6 }}>Daily conversions (last 30 days)</span>
        <pre style={{ margin: 0, overflowX: 'auto', fontSize: 12 }}>
          {JSON.stringify(conversions.slice(-30), null, 2)}
        </pre>
      </div>

      <div style={{ opacity: 0.7, fontSize: 12 }}>
        Notes: Using GA4 daily metrics. We can narrow to organic search via dimension filters in the backend later (e.g., defaultChannelGroup = Organic Search).
      </div>
    </div>
  );
};

export default SeoReport;
