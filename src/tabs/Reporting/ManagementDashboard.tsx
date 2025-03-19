import React, { useState, useEffect } from 'react';
import {
  DatePicker,
  DefaultButton,
  PrimaryButton,
  Stack,
  IDatePickerStyles,
} from '@fluentui/react';
import { Enquiry, Matter, TeamData, UserData, POID } from '../../app/functionality/types';
import MetricCard from './MetricCard';
import './ManagementDashboard.css';

interface RecoveredFee {
  payment_date: string;
  payment_allocated: number;
}

interface WIP {
  created_at: string;
  total?: number;
}

interface ManagementDashboardProps {
  enquiries?: Enquiry[] | null;
  allMatters?: Matter[] | null;
  wip?: WIP[] | null;
  recoveredFees?: RecoveredFee[] | null;
  teamData?: TeamData[] | null;
  userData?: UserData[] | null;
  poidData?: POID[] | null;
}

interface TableRow {
  initial: string;
  fee: string;
  wipHours: string;
  wipPounds: string;
  enquiries: number;
  enquiryIds: number;
  matters: number;
  completed: number;
  tasksPending: number;
  estTaskTime: string;
}

// Helper function to format hours as "Xh Ym"
const formatHours = (hours: number): string => {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return `${h}h ${m}m`;
};

// Helper function to format currency as £X, £X.Xk, or £X.XXk
const formatCurrency = (amount: number): string => {
  if (amount < 10000) {
    return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  } else if (amount < 100000) {
    return `£${(amount / 1000).toFixed(1)}k`;
  } else {
    return `£${(amount / 1000).toFixed(2)}k`;
  }
};

const ManagementDashboard: React.FC<ManagementDashboardProps> = ({
  enquiries: propEnquiries,
  allMatters: propAllMatters,
  wip: propWip,
  recoveredFees: propRecoveredFees,
  teamData: propTeamData,
  userData: propUserData,
  poidData: propPoidData,
}) => {
  const enquiries = propEnquiries ?? null;
  const allMatters = propAllMatters ?? null;
  const wip = propWip ?? null;
  const recoveredFees = propRecoveredFees ?? null;
  const teamData = propTeamData ?? null;
  const userData = propUserData ?? null;
  const poidData = propPoidData ?? null;

  const [startDate, setStartDate] = useState<Date | undefined>(new Date('2025-03-01'));
  const [endDate, setEndDate] = useState<Date | undefined>(new Date('2025-03-31'));
  const [selectedTeams, setSelectedTeams] = useState<string[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<string | null>(null);
  const [isDatePickerUsed, setIsDatePickerUsed] = useState<boolean>(false);

  useEffect(() => {
    if (isDatePickerUsed) {
      setSelectedDateRange(null);
    }
  }, [startDate, endDate, isDatePickerUsed]);

  // Calculate card metrics based on date range
  const totalWipHours = wip?.filter((w) => {
    const createdAtDate = new Date(w.created_at);
    return createdAtDate >= (startDate || new Date()) && createdAtDate <= (endDate || new Date());
  }).reduce((sum, w) => sum + ((w as any).quantity_in_hours || 0), 0) || 0;

  const totalWipPounds = wip?.filter((w) => {
    const createdAtDate = new Date(w.created_at);
    return createdAtDate >= (startDate || new Date()) && createdAtDate <= (endDate || new Date());
  }).reduce((sum, w) => sum + (w.total || 0), 0) || 0;

  const totalCollected = recoveredFees
    ?.filter((rf) => {
      const paymentDate = new Date(rf.payment_date);
      return paymentDate >= (startDate || new Date()) && paymentDate <= (endDate || new Date());
    })
    .reduce((sum, rf) => sum + rf.payment_allocated, 0) || 0;

  const totalEnquiries = enquiries?.filter((e) => {
    const touchpointDate = new Date(e.Touchpoint_Date as string);
    return touchpointDate >= (startDate || new Date()) && touchpointDate <= (endDate || new Date());
  }).length || 0;

  const totalMatters = allMatters?.filter((m) => {
    const openDateStr = (m as any)["Open Date"];
    const openDate = new Date(openDateStr);
    const openDateOnly = new Date(openDate.getFullYear(), openDate.getMonth(), openDate.getDate());
    const startDateOnly = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()) : new Date();
    const endDateOnly = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) : new Date();
    return openDateOnly >= startDateOnly && openDateOnly <= endDateOnly;
  }).length || 0;

  console.log('poidData:', poidData, 'startDate:', startDate, 'endDate:', endDate);
  const totalIdSubmissions = poidData?.filter((p) => {
    const submissionDate = new Date(p.submission_date as string);
    const submissionDateOnly = new Date(submissionDate.getFullYear(), submissionDate.getMonth(), submissionDate.getDate());
    const startDateOnly = startDate ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate()) : new Date();
    const endDateOnly = endDate ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate()) : new Date();
    return submissionDateOnly >= startDateOnly && submissionDateOnly <= endDateOnly;
  }).length || 0;

  const tableData: TableRow[] = React.useMemo(() => {
    const initials = teamData
      ?.filter((team) => team.status === 'active' && team.Initials !== undefined)
      .map((team) => team.Initials as string) ?? ['AC', 'AT', 'BOD', 'BR', 'CS', 'EL', 'EV', 'FW', 'IL', 'JW', 'JWH', 'LA', 'RC', 'RCH', 'SP', 'SW', 'TM', 'ZK'];
    const rows = initials.map((initial) => ({
      initial,
      fee: recoveredFees?.filter((rf) => new Date(rf.payment_date) >= (startDate || new Date()) && new Date(rf.payment_date) <= (endDate || new Date())).reduce((sum, rf) => sum + rf.payment_allocated, 0).toFixed(2) || '0.00',
      wipHours: wip?.length.toString() || '0',
      wipPounds: '0.00',
      enquiries: enquiries?.length || 0,
      enquiryIds: enquiries?.length || 0,
      matters: allMatters?.length || 0,
      completed: 0,
      tasksPending: 0,
      estTaskTime: '0h',
    }));
    const total = {
      initial: 'TOTAL',
      fee: rows.reduce((sum, row) => sum + parseFloat(row.fee), 0).toFixed(2),
      wipHours: rows.reduce((sum, row) => sum + parseInt(row.wipHours), 0).toString(),
      wipPounds: rows.reduce((sum, row) => sum + parseFloat(row.wipPounds), 0).toFixed(2),
      enquiries: rows.reduce((sum, row) => sum + row.enquiries, 0),
      enquiryIds: rows.reduce((sum, row) => sum + row.enquiryIds, 0),
      matters: rows.reduce((sum, row) => sum + row.matters, 0),
      completed: rows.reduce((sum, row) => sum + row.completed, 0),
      tasksPending: rows.reduce((sum, row) => sum + row.tasksPending, 0),
      estTaskTime: '0h',
    };
    return [...rows, total];
  }, [enquiries, allMatters, wip, recoveredFees, teamData, startDate, endDate]);

  const datePickerStyles: Partial<IDatePickerStyles> = {
    root: {
      marginRight: 16,
      width: 140,
    },
    textField: {
      width: '100%',
      borderRadius: '4px',
      background: '#f8f9fa',
      border: '1px solid #e9ecef',
      selectors: {
        '& .ms-TextField-fieldGroup': {
          border: 'none',
          background: 'transparent',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          height: '32px',
        },
        '& .ms-TextField-field': {
          fontSize: '14px',
          color: '#333',
          padding: '0 12px',
          height: '100%',
          lineHeight: '32px',
        },
        '&:hover': { borderColor: '#3690ce' },
        '&:focus-within': { borderColor: '#3690ce', boxShadow: '0 0 4px rgba(54, 144, 206, 0.3)' },
      },
    },
    icon: {
      color: '#3690ce',
      fontSize: '16px',
      right: '8px',
      top: '50%',
      transform: 'translateY(-50%)',
      height: 'auto',
    },
  };

  const activeTeamInitials = React.useMemo(() => {
    return teamData
      ?.filter((team) => team.status === 'active' && team.Initials !== undefined)
      .map((team) => team.Initials as string) ?? ['AC', 'AT', 'BOD', 'BR', 'CS', 'EL', 'EV', 'FW', 'IL', 'JW', 'JWH', 'LA', 'RC', 'RCH', 'SP', 'SW', 'TM', 'ZK'];
  }, [teamData]);

  const toggleTeamSelection = (initial: string) => {
    setSelectedTeams((prev) => {
      if (initial === 'All') {
        return prev.length === activeTeamInitials.length ? [] : [...activeTeamInitials];
      }
      return prev.includes(initial)
        ? prev.filter((i) => i !== initial)
        : [...prev, initial];
    });
  };

  const setPredefinedRange = (days: number | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'yearToDate') => {
    const today = new Date();
    let newStartDate: Date;
    let newEndDate: Date = today;

    switch (days) {
      case 'yesterday':
        newStartDate = new Date(today);
        newStartDate.setDate(today.getDate() - 1);
        newEndDate = newStartDate;
        break;
      case 0: // Today
        newStartDate = new Date(today);
        newEndDate = newStartDate;
        break;
      case 'thisWeek':
        newStartDate = new Date(today);
        newStartDate.setDate(today.getDate() - today.getDay());
        newEndDate = new Date(today);
        break;
      case 'lastWeek':
        newStartDate = new Date(today);
        newStartDate.setDate(today.getDate() - today.getDay() - 7);
        newEndDate = new Date(today);
        newEndDate.setDate(today.getDate() - today.getDay() - 1);
        break;
      case 'thisMonth':
        newStartDate = new Date(today.getFullYear(), today.getMonth(), 1);
        newEndDate = new Date(today);
        break;
      case 'lastMonth':
        newStartDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        newEndDate = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      case 90: // Last 90 Days
        newStartDate = new Date(today);
        newStartDate.setDate(today.getDate() - 90);
        newEndDate = new Date(today);
        break;
      case 'yearToDate': // UK Financial Year: April 1st to current day
        newStartDate = new Date(today.getFullYear(), 3, 1); // April 1st (month 3)
        if (today.getMonth() < 3) {
          newStartDate.setFullYear(today.getFullYear() - 1);
        }
        newEndDate = new Date(today);
        break;
      case 365: // Last 365 Days (rolling)
        newStartDate = new Date(today);
        newStartDate.setDate(today.getDate() - 365);
        newEndDate = new Date(today);
        break;
      default:
        newStartDate = new Date(today);
        newStartDate.setDate(today.getDate() - days);
        newEndDate = new Date(today);
        break;
    }

    setIsDatePickerUsed(false);
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setSelectedDateRange(days.toString());
  };

  const handleDatePickerChange = (setter: (date: Date | undefined) => void) => (date: Date | null | undefined) => {
    setIsDatePickerUsed(true);
    setter(date || undefined);
  };

  return (
    <div className="management-dashboard-container animate-dashboard">
      {/* Filter Section */}
      <div className="filter-section">
        <div className="date-filter-wrapper">
          <div className="date-pickers">
            <Stack horizontal tokens={{ childrenGap: 16 }}>
              <DatePicker
                value={startDate}
                onSelectDate={handleDatePickerChange(setStartDate)}
                styles={datePickerStyles}
                formatDate={(date) => date?.toLocaleDateString('en-GB') || ''}
                placeholder="Start Date"
              />
              <DatePicker
                value={endDate}
                onSelectDate={handleDatePickerChange(setEndDate)}
                styles={datePickerStyles}
                formatDate={(date) => date?.toLocaleDateString('en-GB') || ''}
                placeholder="End Date"
              />
            </Stack>
          </div>
          <div className="vertical-separator" />
          <div className="date-range-buttons">
            <Stack horizontal tokens={{ childrenGap: 10 }}>
              <DefaultButton
                text="Yesterday"
                onClick={() => setPredefinedRange('yesterday')}
                className={selectedDateRange === 'yesterday' ? 'selected' : 'unselected'}
              />
              <DefaultButton
                text="Today"
                onClick={() => setPredefinedRange(0)}
                className={selectedDateRange === '0' ? 'selected' : 'unselected'}
              />
              <DefaultButton
                text="This Week"
                onClick={() => setPredefinedRange('thisWeek')}
                className={selectedDateRange === 'thisWeek' ? 'selected' : 'unselected'}
              />
              <DefaultButton
                text="Last Week"
                onClick={() => setPredefinedRange('lastWeek')}
                className={selectedDateRange === 'lastWeek' ? 'selected' : 'unselected'}
              />
              <DefaultButton
                text="This Month"
                onClick={() => setPredefinedRange('thisMonth')}
                className={selectedDateRange === 'thisMonth' ? 'selected' : 'unselected'}
              />
              <DefaultButton
                text="Last Month"
                onClick={() => setPredefinedRange('lastMonth')}
                className={selectedDateRange === 'lastMonth' ? 'selected' : 'unselected'}
              />
              <DefaultButton
                text="Last 90 Days"
                onClick={() => setPredefinedRange(90)}
                className={selectedDateRange === '90' ? 'selected' : 'unselected'}
              />
              <DefaultButton
                text="Year to Date"
                onClick={() => setPredefinedRange('yearToDate')}
                className={selectedDateRange === 'yearToDate' ? 'selected' : 'unselected'}
              />
              <DefaultButton
                text="Last 365 Days"
                onClick={() => setPredefinedRange(365)}
                className={selectedDateRange === '365' ? 'selected' : 'unselected'}
              />
            </Stack>
          </div>
        </div>
        <div className="team-slicer-buttons">
          <PrimaryButton
            text="All"
            onClick={() => toggleTeamSelection('All')}
            className={selectedTeams.length === activeTeamInitials.length ? 'selected' : 'unselected'}
          />
          {activeTeamInitials.map((initial) => (
            <PrimaryButton
              key={initial}
              text={initial}
              onClick={() => toggleTeamSelection(initial)}
              className={selectedTeams.includes(initial) ? 'selected' : 'unselected'}
            />
          ))}
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="metrics-cards" style={{ 
        display: 'flex', 
        gap: '20px', 
        marginBottom: '20px', 
        marginTop: '20px',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        width: '100%' 
      }}>
        <MetricCard 
          title="WIP (h)" 
          value={formatHours(totalWipHours)} 
          style={{ flex: '1', minWidth: '200px' }} 
        />
        <MetricCard 
          title="WIP (£)" 
          value={formatCurrency(totalWipPounds)} 
          style={{ flex: '1', minWidth: '200px' }} 
        />
        <MetricCard
          title="Collected"
          value={formatCurrency(totalCollected)}
          subtitle={`${startDate?.toLocaleDateString('en-GB')} - ${endDate?.toLocaleDateString('en-GB')}`}
          style={{ flex: '1', minWidth: '200px' }}
        />
        <MetricCard 
          title="Enquiries" 
          value={totalEnquiries} 
          style={{ flex: '1', minWidth: '200px' }} 
        />
        <MetricCard 
          title="Matters" 
          value={totalMatters} 
          style={{ flex: '1', minWidth: '200px' }} 
        />
        <MetricCard 
          title="ID Submissions" 
          value={totalIdSubmissions} 
          style={{ flex: '1', minWidth: '200px' }} 
        />
      </div>

      {/* Metrics Table */}
      <div className="metrics-table">
        <div className="metrics-table-header">
          <span></span>
          <span>Fee (£)</span>
          <span>WIP (h)</span>
          <span>WIP (£)</span>
          <span>Enquiries</span>
          <span>Enquiry IDs</span>
          <span>Matters</span>
          <span>Completed</span>
          <span>Tasks Pending</span>
          <span>Est Task Time</span>
        </div>
        {tableData.map((row) => (
          <div key={row.initial} className="metrics-table-row animate-table-row">
            <span>{row.initial}</span>
            <span>{row.fee}</span>
            <span>{row.wipHours}</span>
            <span>{row.wipPounds}</span>
            <span>{row.enquiries}</span>
            <span>{row.enquiryIds}</span>
            <span>{row.matters}</span>
            <span>{row.completed}</span>
            <span>{row.tasksPending}</span>
            <span>{row.estTaskTime}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ManagementDashboard;