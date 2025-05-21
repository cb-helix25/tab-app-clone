import React, { useState } from 'react';
import { DetailsList, IColumn, Stack, Text, PrimaryButton } from '@fluentui/react';
import MetricCard from './MetricCard';
import { colours } from '../../app/styles/colours';
import './AnnualLeaveReport.css';

export interface AnnualLeaveRecord {
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

interface AnnualLeaveReportProps {
  data: AnnualLeaveRecord[];
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

const AnnualLeaveReport: React.FC<AnnualLeaveReportProps> = ({ data }) => {
  // For person/team filtering
  const [selectedPersons, setSelectedPersons] = useState<string[]>([]);

  // All unique people in the data
  const allPeople = React.useMemo(
    () => Array.from(new Set(data.map(d => d.person))).sort(),
    [data]
  );

  // Filtered data for selected persons
  const filteredData = React.useMemo(() => {
    if (!selectedPersons.length) return data;
    return data.filter(d => selectedPersons.includes(d.person));
  }, [data, selectedPersons]);

  // Aggregate metrics per person
  const personMetrics = React.useMemo(() => {
    return allPeople.map(person => {
      const personRecords = data.filter(d => d.person === person);
      const annualLeaveTaken = personRecords.filter(x => x.leave_type?.toLowerCase() === 'annual').reduce((sum, x) => sum + x.days_taken, 0);
      const sickLeaveTaken = personRecords.filter(x => x.leave_type?.toLowerCase() === 'sick').reduce((sum, x) => sum + x.days_taken, 0);
      const unpaidLeaveTaken = personRecords.filter(x => x.leave_type?.toLowerCase() === 'unpaid').reduce((sum, x) => sum + x.days_taken, 0);
      // You can add more leave types if needed
      return {
        person,
        annualLeaveTaken,
        sickLeaveTaken,
        unpaidLeaveTaken,
      };
    });
  }, [data, allPeople]);

  // Totals for metric cards (can be tailored as needed)
  const totalRequests = filteredData.length;
  const approved = filteredData.filter(d => ['approved', 'booked'].includes(d.status?.toLowerCase())).length;
  const rejected = filteredData.filter(d => d.status?.toLowerCase() === 'rejected').length;
  const totalDays = filteredData.reduce((sum, d) => sum + (typeof d.days_taken === 'number' ? d.days_taken : 0), 0);

  return (
    <div className="annual-leave-report-container">
      <Text variant="xxLarge" className="annual-leave-report-title">
        Annual Leave Report
      </Text>

      {/* Person/Team Slicer */}
      <div className="person-slicer">
        <PrimaryButton
          text="All"
          onClick={() => setSelectedPersons([])}
          className={selectedPersons.length === 0 ? 'selected' : ''}
          style={{ marginRight: 6, marginBottom: 6 }}
        />
        {allPeople.map(person => (
          <PrimaryButton
            key={person}
            text={person}
            onClick={() =>
              setSelectedPersons(selectedPersons.includes(person)
                ? selectedPersons.filter(p => p !== person)
                : [...selectedPersons, person]
              )
            }
            className={selectedPersons.includes(person) ? 'selected' : ''}
            style={{ marginRight: 6, marginBottom: 6 }}
          />
        ))}
      </div>

      <Stack horizontal tokens={{ childrenGap: 24 }} className="annual-leave-metric-cards">
        <MetricCard title="Total Requests" value={totalRequests} />
        <MetricCard title="Approved/Booked" value={approved} />
        <MetricCard title="Rejected" value={rejected} />
        <MetricCard title="Total Days" value={totalDays} />
      </Stack>

      {/* Per-person leave metrics */}
      <div className="metrics-cards metrics-cards-per-person">
        {personMetrics
          .filter(m => selectedPersons.length === 0 || selectedPersons.includes(m.person))
          .map(m => (
            <MetricCard
              key={m.person}
              title={m.person}
              value={
                <>
                  <span className="metric-line">
                    <span className="metric-label">Annual:</span> {m.annualLeaveTaken}
                  </span>
                  <span className="metric-line">
                    <span className="metric-label">Sick:</span> {m.sickLeaveTaken}
                  </span>
                  <span className="metric-line">
                    <span className="metric-label">Unpaid:</span> {m.unpaidLeaveTaken}
                  </span>
                </>
              }
              style={{ minWidth: 180, maxWidth: 240, marginBottom: 12 }}
            />
          ))}
      </div>

      <div className="annual-leave-table-section">
        <DetailsList
          items={filteredData.map((row) => ({
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
      </div>
    </div>
  );
};

export default AnnualLeaveReport;