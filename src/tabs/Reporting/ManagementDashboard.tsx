import React, { useState, useEffect } from 'react';
// invisible change
import {
  DatePicker,
  DefaultButton,
  PrimaryButton,
  Stack,
  IDatePickerStyles,
  Modal,
  DetailsList,
  IColumn,
  DetailsListLayoutMode,
  IconButton,
  Spinner,
} from '@fluentui/react';
import { Enquiry, Matter, TeamData, UserData, POID } from '../../app/functionality/types';
import MetricCard from './MetricCard';
import { colours } from '../../app/styles/colours';
import './ManagementDashboard.css';

interface RecoveredFee {
  payment_date: string;
  payment_allocated: number;
  user_id: number;
}

export interface WIP {
  created_at: string;
  total?: number;
  quantity_in_hours?: number;
}

interface ManagementDashboardProps {
  enquiries?: Enquiry[] | null;
  allMatters?: Matter[] | null;
  wip?: WIP[] | null | undefined;
  recoveredFees?: RecoveredFee[] | null;
  teamData?: TeamData[] | null;
  userData?: UserData[] | null;
  poidData?: POID[] | null;
  triggerRefresh?: () => void;
  lastRefreshTimestamp?: number;
  isFetching?: boolean;
}

interface TableRow {
  initial: string;
  wipHours: string;
  wipPounds: string;
  collected: string;
  enquiries: number;
  matters: number;
  idSubmissions: number;
}

const formatHours = (hours: number): string => {
  const whole = Math.floor(hours);
  const fraction = hours - whole;
  const minutes = Math.round(fraction * 60);
  return `${whole}h ${minutes}m`;
};

const formatCurrency = (amount: number): string => {
  if (amount < 10000) {
    return `£${amount.toLocaleString('en-GB', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  } else if (amount < 100000) {
    return `£${(amount / 1000).toFixed(1)}k`;
  } else {
    return `£${(amount / 1000).toFixed(2)}k`;
  }
};

const normalizeName = (name: string): string => {
  return name.replace(/[^a-zA-Z]/g, '').toLowerCase();
};

const debounce = (func: (...args: any[]) => void, wait: number) => {
  let timeout: NodeJS.Timeout;
  return (...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

// Format timestamp: show only time if same day, otherwise full date-time
const formatTimestamp = (timestamp: number): string => {
  const now = new Date();
  const refreshDate = new Date(timestamp);
  const isSameDay =
    now.getFullYear() === refreshDate.getFullYear() &&
    now.getMonth() === refreshDate.getMonth() &&
    now.getDate() === refreshDate.getDate();
  return isSameDay
    ? refreshDate.toLocaleTimeString('en-GB')
    : refreshDate.toLocaleString('en-GB');
};

// Format countdown to next refresh (e.g., "4:32")
const formatCountdown = (remainingMs: number): string => {
  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
};

const ManagementDashboard: React.FC<ManagementDashboardProps> = ({
  enquiries: propEnquiries,
  allMatters: propAllMatters,
  wip: propWip,
  recoveredFees: propRecoveredFees,
  teamData: propTeamData,
  userData: propUserData,
  poidData: propPoidData,
  triggerRefresh,
  lastRefreshTimestamp = Date.now(),
  isFetching = false,
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
  const [sortKey, setSortKey] = useState<keyof TableRow>('initial');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [modalTitle, setModalTitle] = useState<string>('');
  const [modalData, setModalData] = useState<any[]>([]);
  const [refreshBaseTime, setRefreshBaseTime] = useState<number>(Date.now()); // Base time for countdown
  const [currentTime, setCurrentTime] = useState<number>(Date.now()); // Real-time clock

  const allColumns = ['wipHours', 'wipPounds', 'collected', 'enquiries', 'matters', 'idSubmissions'] as const;
  const columnLabels: { [key in typeof allColumns[number]]: string } = {
    wipHours: 'WIP (h)',
    wipPounds: 'WIP (£)',
    collected: 'Collected',
    enquiries: 'Enquiries',
    matters: 'Matters',
    idSubmissions: 'ID Submissions',
  };
  const [visibleColumns, setVisibleColumns] = useState<typeof allColumns[number][]>([...allColumns]);

  // Auto-refresh every 5 minutes (300,000 ms) and update countdown
  useEffect(() => {
    if (!triggerRefresh) return;

    const FIVE_MINUTES = 300000; // 5 minutes in ms
    let intervalId: NodeJS.Timeout;

    const startAutoRefresh = () => {
      intervalId = setInterval(() => {
        const elapsed = Date.now() - refreshBaseTime;
        if (elapsed >= FIVE_MINUTES && !isFetching) {
          triggerRefresh();
          setRefreshBaseTime(Date.now()); // Reset base time after refresh
        }
        setCurrentTime(Date.now()); // Update current time for countdown
      }, 1000); // Check every second
    };

    startAutoRefresh();

    return () => clearInterval(intervalId);
  }, [triggerRefresh, refreshBaseTime, isFetching]);

  // Manual refresh handler
  const handleManualRefresh = () => {
    if (triggerRefresh) {
      triggerRefresh();
      setRefreshBaseTime(Date.now()); // Reset base time for next 5-minute cycle
    }
  };

  // Calculate remaining time until next refresh
  const nextRefreshCountdown = Math.max(300000 - (currentTime - refreshBaseTime), 0);

  const solicitorTeamMembers = React.useMemo(() => {
    return (
      teamData?.filter(
        (team) => team.Initials && team["Role"] !== 'Non-solicitor'
      ) || []
    );
  }, [teamData]);

  const filteredTeamMembers = React.useMemo(() => {
    if (selectedTeams.length === 0 || selectedTeams.length === solicitorTeamMembers.length) {
      return solicitorTeamMembers;
    }
    return solicitorTeamMembers.filter((team) => selectedTeams.includes(team.Initials!));
  }, [solicitorTeamMembers, selectedTeams]);

  const solicitorClioIDs = React.useMemo(
    () => new Set(filteredTeamMembers.map((tm) => String(tm["Clio ID"] || ""))),
    [filteredTeamMembers]
  );

  const solicitorEmails = React.useMemo(
    () => new Set(filteredTeamMembers.map((tm) => tm.Email?.toLowerCase()).filter(Boolean)),
    [filteredTeamMembers]
  );

  const solicitorNormalizedNames = React.useMemo(
    () => filteredTeamMembers.map((tm) => normalizeName(tm["Full Name"] || "")),
    [filteredTeamMembers]
  );

  const filteredWip = React.useMemo(() => {
    return (
      wip?.filter((w) => {
        const createdAtDate = new Date(w.created_at);
        const createdAtDateOnly = new Date(
          createdAtDate.getFullYear(),
          createdAtDate.getMonth(),
          createdAtDate.getDate()
        );
        const startDateOnly = startDate
          ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
          : new Date();
        const endDateOnly = endDate
          ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
          : new Date();
        return (
          createdAtDateOnly >= startDateOnly &&
          createdAtDateOnly <= endDateOnly &&
          solicitorClioIDs.has(String((w as any).user?.id))
        );
      }) || []
    );
  }, [wip, startDate, endDate, solicitorClioIDs]);

  const filteredRecoveredFees = React.useMemo(() => {
    return (
      recoveredFees?.filter((rf) => {
        const paymentDate = new Date(rf.payment_date);
        const paymentDateOnly = new Date(
          paymentDate.getFullYear(),
          paymentDate.getMonth(),
          paymentDate.getDate()
        );
        const startDateOnly = startDate
          ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
          : new Date();
        const endDateOnly = endDate
          ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
          : new Date();
        return (
          paymentDateOnly >= startDateOnly &&
          paymentDateOnly <= endDateOnly &&
          solicitorClioIDs.has(String(rf.user_id))
        );
      }) || []
    );
  }, [recoveredFees, startDate, endDate, solicitorClioIDs]);

  const filteredEnquiries = React.useMemo(() => {
    return (
      enquiries?.filter((e) => {
        const touchpointDate = new Date(e.Touchpoint_Date as string);
        const touchpointDateOnly = new Date(
          touchpointDate.getFullYear(),
          touchpointDate.getMonth(),
          touchpointDate.getDate()
        );
        const startDateOnly = startDate
          ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
          : new Date();
        const endDateOnly = endDate
          ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
          : new Date();
        return (
          touchpointDateOnly >= startDateOnly &&
          touchpointDateOnly <= endDateOnly &&
          e.Point_of_Contact &&
          solicitorEmails.has(e.Point_of_Contact.toLowerCase())
        );
      }) || []
    );
  }, [enquiries, startDate, endDate, solicitorEmails]);

  const filteredMatters = React.useMemo(() => {
    const mappings: { [key: string]: string } = {
      "Samuel Packwood": "Sam Packwood",
      "Bianca ODonnell": "Bianca O'Donnell",
    };
    return (
      allMatters?.filter((m) => {
        const openDate = new Date((m as any)["Open Date"]);
        const openDateOnly = new Date(
          openDate.getFullYear(),
          openDate.getMonth(),
          openDate.getDate()
        );
        const startDateOnly = startDate
          ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
          : new Date();
        const endDateOnly = endDate
          ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
          : new Date();
        let solicitor = (m as any)["Originating Solicitor"] || "";
        if (solicitor in mappings) solicitor = mappings[solicitor];
        const normalizedSolicitor = normalizeName(solicitor);
        return (
          openDateOnly >= startDateOnly &&
          openDateOnly <= endDateOnly &&
          solicitorNormalizedNames.includes(normalizedSolicitor)
        );
      }) || []
    );
  }, [allMatters, startDate, endDate, solicitorNormalizedNames]);

  const filteredPoidData = React.useMemo(() => {
    return (
      poidData?.filter((p) => {
        const submissionDate = new Date(p.submission_date as string);
        const submissionDateOnly = new Date(
          submissionDate.getFullYear(),
          submissionDate.getMonth(),
          submissionDate.getDate()
        );
        const startDateOnly = startDate
          ? new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate())
          : new Date();
        const endDateOnly = endDate
          ? new Date(endDate.getFullYear(), endDate.getMonth(), endDate.getDate())
          : new Date();
        return submissionDateOnly >= startDateOnly && submissionDateOnly <= endDateOnly;
      }) || []
    );
  }, [poidData, startDate, endDate]);

  const getTeamWipHours = (clioId: string): number =>
    filteredWip
      .filter((w) => String((w as any).user?.id) === clioId)
      .reduce((sum, w) => sum + (w.quantity_in_hours || 0), 0) || 0;

  const getTeamWipPounds = (clioId: string): number =>
    filteredWip
      .filter((w) => String((w as any).user?.id) === clioId)
      .reduce((sum, w) => sum + (w.total || 0), 0) || 0;

  const getTeamCollected = (clioId: string): number =>
    filteredRecoveredFees
      .filter((rf) => String(rf.user_id) === clioId)
      .reduce((sum, rf) => sum + rf.payment_allocated, 0) || 0;

  const getTeamEnquiries = (email: string): number =>
    filteredEnquiries.filter(
      (e) => e.Point_of_Contact?.toLowerCase() === email.toLowerCase()
    ).length || 0;

  const getTeamMatters = (fullName: string): number => {
    const mappings: { [key: string]: string } = {
      "Samuel Packwood": "Sam Packwood",
      "Bianca ODonnell": "Bianca O'Donnell",
    };
    return (
      filteredMatters.filter((m) => {
        let solicitor = (m as any)["Originating Solicitor"] || "";
        if (solicitor in mappings) solicitor = mappings[solicitor];
        return normalizeName(solicitor) === normalizeName(fullName);
      }).length || 0
    );
  };

  const totalWipHoursOverall = React.useMemo(() => {
    return filteredWip.reduce((sum, w) => sum + (w.quantity_in_hours || 0), 0) || 0;
  }, [filteredWip]);

  const totalWipPoundsOverall = React.useMemo(() => {
    return filteredWip.reduce((sum, w) => sum + (w.total || 0), 0) || 0;
  }, [filteredWip]);

  const totalCollectedOverall = React.useMemo(() => {
    return filteredRecoveredFees.reduce((sum, rf) => sum + rf.payment_allocated, 0) || 0;
  }, [filteredRecoveredFees]);

  const totalEnquiriesOverall = React.useMemo(() => {
    return filteredEnquiries.length || 0;
  }, [filteredEnquiries]);

  const totalMattersOverall = React.useMemo(() => {
    return filteredMatters.length || 0;
  }, [filteredMatters]);

  const totalIdSubmissionsOverall = React.useMemo(() => {
    return filteredPoidData.length || 0;
  }, [filteredPoidData]);

  const tableData = React.useMemo(() => {
    return filteredTeamMembers
      .map((team) => {
        const clioId = String(team["Clio ID"] || "");
        const email = team.Email || "";
        const fullName = team["Full Name"] || "";

        const wipHoursNum = getTeamWipHours(clioId);
        const wipPoundsNum = getTeamWipPounds(clioId);
        const collectedNum = getTeamCollected(clioId);
        const enquiriesNum = getTeamEnquiries(email);
        const mattersNum = getTeamMatters(fullName);

        const hasData =
          wipHoursNum !== 0 ||
          wipPoundsNum !== 0 ||
          collectedNum !== 0 ||
          enquiriesNum !== 0 ||
          mattersNum !== 0;

        if (!hasData) return null;

        return {
          initial: team.Initials!,
          wipHours: formatHours(wipHoursNum),
          wipPounds: formatCurrency(wipPoundsNum),
          collected: formatCurrency(collectedNum),
          enquiries: enquiriesNum,
          matters: mattersNum,
          idSubmissions: totalIdSubmissionsOverall,
        } as TableRow;
      })
      .filter((row): row is TableRow => row !== null);
  }, [
    filteredTeamMembers,
    filteredWip,
    filteredRecoveredFees,
    filteredEnquiries,
    filteredMatters,
    totalIdSubmissionsOverall,
  ]);

  const totalRow: TableRow = {
    initial: 'TOTAL',
    wipHours: formatHours(totalWipHoursOverall),
    wipPounds: formatCurrency(totalWipPoundsOverall),
    collected: formatCurrency(totalCollectedOverall),
    enquiries: totalEnquiriesOverall,
    matters: totalMattersOverall,
    idSubmissions: totalIdSubmissionsOverall,
  };

  const finalTableData = React.useMemo(() => [...tableData, totalRow], [tableData, totalRow]);

  const sortedTableData = React.useMemo(() => {
    const parseHours = (formatted: string): number => {
      const match = formatted.match(/(\d+)h\s*(\d+)m/);
      return match ? parseInt(match[1], 10) + parseInt(match[2], 10) / 60 : 0;
    };
    const parseCurrency = (formatted: string): number => {
      let val = formatted.replace(/[^0-9.]/g, '');
      return formatted.includes('k') ? parseFloat(val) * 1000 : parseFloat(val);
    };

    const dataWithoutTotal = finalTableData.filter((row) => row.initial !== 'TOTAL');
    const total = finalTableData.find((row) => row.initial === 'TOTAL')!;
    return [
      ...dataWithoutTotal.sort((a, b) => {
        let aVal: string | number, bVal: string | number;
        switch (sortKey) {
          case 'initial':
            aVal = a.initial.toLowerCase();
            bVal = b.initial.toLowerCase();
            break;
          case 'wipHours':
            aVal = parseHours(a.wipHours);
            bVal = parseHours(b.wipHours);
            break;
          case 'wipPounds':
          case 'collected':
            aVal = parseCurrency(a[sortKey]);
            bVal = parseCurrency(b[sortKey]);
            break;
          case 'enquiries':
          case 'matters':
          case 'idSubmissions':
            aVal = a[sortKey];
            bVal = b[sortKey];
            break;
          default:
            aVal = a.initial.toLowerCase();
            bVal = b.initial.toLowerCase();
            break;
        }
        return aVal < bVal ? (sortDirection === 'asc' ? -1 : 1) : aVal > bVal ? (sortDirection === 'asc' ? 1 : -1) : 0;
      }),
      total,
    ];
  }, [finalTableData, sortKey, sortDirection]);

  const toggleColumn = (colKey: typeof allColumns[number]) => {
    setVisibleColumns((prev) =>
      prev.includes(colKey) ? prev.filter((item) => item !== colKey) : [...prev, colKey]
    );
  };

  const onHeaderClick = (key: keyof TableRow) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const toggleTeamSelection = (initial: string) => {
    setSelectedTeams((prev) => {
      const activeInitials = solicitorTeamMembers.map((tm) => tm.Initials!);
      if (initial === 'All') {
        return prev.length === activeInitials.length ? [] : [...activeInitials];
      }
      return prev.includes(initial) ? prev.filter((i) => i !== initial) : [...prev, initial];
    });
  };

  const setPredefinedRange = (
    days: number | 'yesterday' | 'thisWeek' | 'lastWeek' | 'thisMonth' | 'lastMonth' | 'yearToDate'
  ) => {
    const today = new Date();
    let newStartDate: Date;
    let newEndDate: Date = today;
    switch (days) {
      case 'yesterday':
        newStartDate = new Date(today);
        newStartDate.setDate(today.getDate() - 1);
        newEndDate = newStartDate;
        break;
      case 0:
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
      case 'yearToDate':
        newStartDate = new Date(today.getFullYear(), 3, 1);
        if (today.getMonth() < 3) newStartDate.setFullYear(today.getFullYear() - 1);
        newEndDate = new Date(today);
        break;
      default:
        newStartDate = new Date(today);
        newStartDate.setDate(today.getDate() - (days as number));
        newEndDate = new Date(today);
        break;
    }
    setIsDatePickerUsed(false);
    setStartDate(newStartDate);
    setEndDate(newEndDate);
    setSelectedDateRange(days.toString());
  };

  const handleDatePickerChange = (setter: (date: Date | undefined) => void) => {
    const debouncedSetter = debounce((date: Date | null | undefined) => {
      setIsDatePickerUsed(true);
      setter(date || undefined);
    }, 300);
    return debouncedSetter;
  };

  useEffect(() => {
    if (isDatePickerUsed) setSelectedDateRange(null);
  }, [startDate, endDate, isDatePickerUsed]);

  const openModalForMetric = (team: TeamData, colKey: typeof allColumns[number]) => {
    if (team.Initials === 'TOTAL') return;
    const clioId = String(team["Clio ID"] || "");
    const email = team.Email || "";
    const fullName = team["Full Name"] || "";
    let records: any[] = [];
    if (colKey === 'wipHours' || colKey === 'wipPounds') {
      records = filteredWip.filter((w) => String((w as any).user?.id) === clioId);
    } else if (colKey === 'collected') {
      records = filteredRecoveredFees.filter((rf) => String(rf.user_id) === clioId);
    } else if (colKey === 'enquiries') {
      records = filteredEnquiries.filter(
        (e) => e.Point_of_Contact?.toLowerCase() === email.toLowerCase()
      );
    } else if (colKey === 'matters') {
      records = filteredMatters.filter((m) => {
        let solicitor: string = (m as any)["Originating Solicitor"] || "";
        const mappings: { [key: string]: string } = {
          "Samuel Packwood": "Sam Packwood",
          "Bianca ODonnell": "Bianca O'Donnell",
        };
        if (solicitor in mappings) solicitor = mappings[solicitor];
        return normalizeName(solicitor) === normalizeName(fullName);
      });
    }
    setModalTitle(`${columnLabels[colKey]} Details for ${team.Initials}`);
    setModalData(records);
    setModalVisible(true);
  };

  const getDetailsListColumns = (data: any[]): IColumn[] => {
    if (data.length === 0) return [];
    return Object.keys(data[0]).map((key) => ({
      key,
      name: key,
      fieldName: key,
      minWidth: 50,
      maxWidth: 200,
      isResizable: true,
      onRender: (item: any) => {
        const val = item[key];
        return typeof val === 'object' ? JSON.stringify(val) : val;
      },
    }));
  };

  const datePickerStyles: Partial<IDatePickerStyles> = {
    root: { marginRight: 16, width: 140 },
    textField: {
      width: '100%',
      borderRadius: '0',
      background: colours.light.inputBackground,
      border: `1px solid ${colours.light.border}`,
      selectors: {
        '& .ms-TextField-fieldGroup': {
          border: 'none',
          background: 'transparent',
          borderRadius: '0',
          display: 'flex',
          alignItems: 'center',
          height: '32px',
        },
        '& .ms-TextField-field': {
          fontSize: '14px',
          color: colours.light.text,
          padding: '0 12px',
          height: '100%',
          lineHeight: '32px',
        },
        '&:hover': { borderColor: colours.light.highlight },
        '&:focus-within': {
          borderColor: colours.light.highlight,
          boxShadow: '0 0 4px rgba(54, 144, 206, 0.3)',
        },
      },
    },
    icon: {
      color: colours.light.iconColor,
      fontSize: '16px',
      right: '8px',
      top: '50%',
      transform: 'translateY(-50%)',
      height: 'auto',
    },
  };

  const activeTeamInitials = React.useMemo(
    () => solicitorTeamMembers.map((team) => team.Initials!),
    [solicitorTeamMembers]
  );

  const hiddenColumns = allColumns.filter((col) => !visibleColumns.includes(col));

  return (
    <div className="management-dashboard-container animate-dashboard">
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
          <PrimaryButton
            text="Refresh Now"
            onClick={handleManualRefresh}
            style={{ marginLeft: '10px' }}
          />
        </div>
        <div
          style={{
            marginTop: '10px',
            textAlign: 'center',
            fontSize: '14px',
            color: colours.light.text,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span>Last refreshed: {formatTimestamp(lastRefreshTimestamp)}</span>
          <span>Next refresh in: {formatCountdown(nextRefreshCountdown)}</span>
          {isFetching && (
            <Spinner
              size={1} // Small spinner
              styles={{ root: { marginLeft: '10px' } }}
            />
          )}
        </div>
      </div>

      <div
        className="metrics-cards"
        style={{
          display: 'flex',
          gap: '20px',
          marginBottom: '20px',
          marginTop: '20px',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          width: '100%',
        }}
      >
        <MetricCard title="WIP (h)" value={formatHours(totalWipHoursOverall)} style={{ flex: '1', minWidth: '200px' }} />
        <MetricCard title="WIP (£)" value={formatCurrency(totalWipPoundsOverall)} style={{ flex: '1', minWidth: '200px' }} />
        <MetricCard
          title="Collected"
          value={formatCurrency(totalCollectedOverall)}
          subtitle={`${startDate?.toLocaleDateString('en-GB')} - ${endDate?.toLocaleDateString('en-GB')}`}
          style={{ flex: '1', minWidth: '200px' }}
        />
        <MetricCard title="Enquiries" value={totalEnquiriesOverall} style={{ flex: '1', minWidth: '200px' }} />
        <MetricCard title="Matters" value={totalMattersOverall} style={{ flex: '1', minWidth: '200px' }} />
        <MetricCard title="ID Submissions" value={totalIdSubmissionsOverall} style={{ flex: '1', minWidth: '200px' }} />
      </div>

      <div
        className="metrics-table-section"
        style={{
          background: colours.light.sectionBackground,
          padding: '16px',
          borderRadius: '0',
          boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
          marginTop: '-8px',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {hiddenColumns.length > 0 && (
          <div
            style={{
              display: 'flex',
              gap: '8px',
              padding: '8px',
              background: colours.highlightBlue,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              borderRadius: '0',
              marginBottom: '16px',
            }}
          >
            {hiddenColumns.map((col) => (
              <div
                key={col}
                onClick={() => toggleColumn(col)}
                style={{
                  padding: '4px 8px',
                  background: colours.highlightBlue,
                  borderRadius: '0',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '1em',
                  color: colours.light.text,
                }}
              >
                {columnLabels[col]}
              </div>
            ))}
          </div>
        )}

        <div
          className="metrics-card-header-row"
          style={{
            display: 'flex',
            alignItems: 'center',
            background: colours.light.sectionBackground,
            padding: '12px',
            borderRadius: '0',
            boxShadow: '0px 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <div
            style={{ flex: '1', fontWeight: 'bold', fontSize: '1.2em', cursor: 'pointer' }}
            onClick={() => onHeaderClick('initial')}
          >
            Person {sortKey === 'initial' ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
          </div>
          {visibleColumns.map((colKey) => (
            <div
              key={colKey}
              style={{ flex: '1', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer' }}
              onClick={() => onHeaderClick(colKey)}
            >
              <span style={{ fontSize: '1.2em', fontWeight: 'bold' }}>
                {columnLabels[colKey]} {sortKey === colKey ? (sortDirection === 'asc' ? '▲' : '▼') : ''}
              </span>
            </div>
          ))}
        </div>

        <div className="metrics-card-table" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {sortedTableData.map((row) => (
            <div
              key={row.initial}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '12px',
                border: `1px solid ${colours.light.border}`,
                borderRadius: '0',
                cursor: row.initial === 'TOTAL' ? 'default' : 'pointer',
              }}
            >
              <div style={{ flex: '1', fontWeight: 'bold', fontSize: '1.2em' }}>{row.initial}</div>
              {allColumns.map(
                (colKey) =>
                  visibleColumns.includes(colKey) && (
                    <div
                      key={colKey}
                      style={{ flex: '1', textAlign: 'center' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (row.initial === 'TOTAL') return;
                        const team = filteredTeamMembers.find((tm) => tm.Initials === row.initial);
                        if (team) openModalForMetric(team, colKey);
                      }}
                    >
                      <div style={{ fontSize: '1.2em' }}>{row[colKey]}</div>
                    </div>
                  )
              )}
            </div>
          ))}
        </div>
      </div>

      <Modal
        isOpen={modalVisible}
        onDismiss={() => setModalVisible(false)}
        isBlocking={false}
        containerClassName="modal-container"
      >
        <div style={{ padding: '20px', background: colours.light.sectionBackground }}>
          <h2>{modalTitle}</h2>
          <IconButton
            iconProps={{ iconName: 'Cancel' }}
            onClick={() => setModalVisible(false)}
            styles={{ root: { float: 'right' } }}
          />
          {modalData.length > 0 ? (
            <DetailsList
              items={modalData}
              columns={getDetailsListColumns(modalData)}
              setKey="set"
              layoutMode={DetailsListLayoutMode.fixedColumns}
              isHeaderVisible={true}
            />
          ) : (
            <p>No records found.</p>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default ManagementDashboard;