import React, { useEffect, useState } from 'react';
import { DetailsList, IColumn, Spinner, Stack, Text } from '@fluentui/react';
import MetricCard from './MetricCard';
import { colours } from '../../app/styles/colours';
import './AnnualLeaveReport.css';

interface AnnualLeaveRecord {
  request_id: number;
  person: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  days_taken: number;
  leave_type?: string;
  rejection_notes?: string;
  hearing_confirmation?: string;
  hearing_details?: string;
}

const columns: IColumn[] = [
  { key: 'person', name: 'Person', fieldName: 'person', minWidth: 100, maxWidth: 150, isResizable: true },
  { key: 'start_date', name: 'Start Date', fieldName: 'start_date', minWidth: 100, maxWidth: 120, isResizable: true },
  { key: 'end_date', name: 'End Date', fieldName: 'end_date', minWidth: 100, maxWidth: 120, isResizable: true },
  { key: 'reason', name: 'Reason', fieldName: 'reason', minWidth: 120, isResizable: true },
  { key: 'status', name: 'Status', fieldName: 'status', minWidth: 80, maxWidth: 100, isResizable: true },
  { key: 'days_taken', name: 'Days Taken', fieldName: 'days_taken', minWidth: 80, maxWidth: 100, isResizable: true },
  { key: 'leave_type', name: 'Leave Type', fieldName: 'leave_type', minWidth: 100, maxWidth: 120, isResizable: true },
];

const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const AnnualLeaveReport: React.FC = () => {
  const [data, setData] = useState<AnnualLeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update this URL to your actual API endpoint for fetching annual leave data
  const ANNUAL_LEAVE_API_URL = `${process.env.REACT_APP_PROXY_BASE_URL}/api/getAnnualLeave`;

  useEffect(() => {
    setLoading(true);
    fetch(ANNUAL_LEAVE_API_URL)
      .then(async (res) => {
        if (!res.ok) throw new Error('Failed to fetch annual leave data');
        return res.json();
      })
      .then((json) => {
        setData(Array.isArray(json) ? json : []);
        setError(null);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Example metrics
  const totalRequests = data.length;
  const approved = data.filter(d => ['approved', 'booked'].includes(d.status?.toLowerCase())).length;
  const rejected = data.filter(d => d.status?.toLowerCase() === 'rejected').length;
  const totalDays = data.reduce((sum, d) => sum + (typeof d.days_taken === 'number' ? d.days_taken : 0), 0);

  return (
    <div className="annual-leave-report-container">
      <Text variant="xxLarge" className="annual-leave-report-title">
        Annual Leave Report
      </Text>
      <Stack horizontal tokens={{ childrenGap: 24 }} className="annual-leave-metric-cards">
        <MetricCard title="Total Requests" value={totalRequests} />
        <MetricCard title="Approved/Booked" value={approved} />
        <MetricCard title="Rejected" value={rejected} />
        <MetricCard title="Total Days" value={totalDays} />
      </Stack>
      <div className="annual-leave-table-section">
        {loading ? (
          <Spinner label="Loading annual leave data..." />
        ) : error ? (
          <Text variant="medium" style={{ color: 'red' }}>{error}</Text>
        ) : (
          <DetailsList
            items={data.map((row) => ({
              ...row,
              start_date: formatDate(row.start_date),
              end_date: formatDate(row.end_date),
              leave_type: row.leave_type || 'N/A',
            }))}
            columns={columns}
            setKey="set"
            layoutMode={0}
            styles={{ root: { background: '#fff', borderRadius: 8, boxShadow: '0 2px 8px #eee' } }}
          />
        )}
      </div>
    </div>
  );
};

export default AnnualLeaveReport;