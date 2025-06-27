import React, { useMemo, useState } from "react";
import { DatePicker, PrimaryButton, Stack, IDatePickerStyles } from "@fluentui/react";
import ALCard from "./ALCard";
import { colours } from "../../app/styles/colours";
import { TeamData } from "../../app/functionality/types";
import "./AnnualLeaveReport.css";

export interface AnnualLeaveRecord {
  request_id: number;
  fe: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  days_taken: number;
  leave_type?: string;
  rejection_notes?: string;
  hearing_confirmation?: boolean;
  hearing_details?: string;
}

interface Props {
  data: AnnualLeaveRecord[];
  teamData: TeamData[];
}

const formatDate = (date?: Date) => (date ? date.toLocaleDateString("en-GB") : "");

function getFinancialYear(date = new Date()) {
  const year = date.getFullYear();
  const start = new Date(date);
  if (date.getMonth() < 3) {
    start.setFullYear(year - 1, 3, 1);
  } else {
    start.setFullYear(year, 3, 1);
  }
  const end = new Date(start);
  end.setFullYear(start.getFullYear() + 1);
  end.setMonth(2, 31);
  return { start, end };
}

const UNPAID_LEAVE_CAP = 5;

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

const AnnualLeaveReport: React.FC<Props> = ({ data, teamData }) => {
  const { start: fyStart, end: fyEnd } = getFinancialYear();
  const [startDate, setStartDate] = useState<Date | undefined>(fyStart);
  const [endDate, setEndDate] = useState<Date | undefined>(fyEnd);
  const [selectedInitials, setSelectedInitials] = useState<string[]>([]);

  const activePeople = useMemo(
    () =>
      teamData
        .filter((t) => (t.status || "").toLowerCase() === "active" && t.Initials)
        .map((t) => ({
          initials: t.Initials!,
          fullName: t["Full Name"] || t.Initials!,
          holiday_entitlement: t.holiday_entitlement ?? 0,
        })),
    [teamData]
  );

  const toggleInitials = (initials: string) => {
    setSelectedInitials((prev) =>
      prev.includes(initials)
        ? prev.filter((i) => i !== initials)
        : [...prev, initials]
    );
  };

  const selectAll = () => setSelectedInitials(activePeople.map((p) => p.initials));
  const clearAll = () => setSelectedInitials([]);

  const filteredPeople = useMemo(() => {
    return selectedInitials.length
      ? activePeople.filter((p) => selectedInitials.includes(p.initials))
      : activePeople;
  }, [activePeople, selectedInitials]);

  const filteredLeave = useMemo(() => {
    return data.filter((row: AnnualLeaveRecord) => {
      const leaveDate = new Date(row.start_date);
      const afterStart = !startDate || leaveDate >= startDate;
      const beforeEnd = !endDate || leaveDate <= endDate;
      const personMatch =
        selectedInitials.length === 0 || selectedInitials.includes(row.fe);
      const statusMatch = (row.status || "").toLowerCase() === "booked";
      return afterStart && beforeEnd && personMatch && statusMatch;
    });
  }, [data, startDate, endDate, selectedInitials]);

  const leaveByPerson = useMemo(() => {
    const map: { [initials: string]: AnnualLeaveRecord[] } = {};
    filteredLeave.forEach((row: AnnualLeaveRecord) => {
      if (!row.fe) return;
      if (!map[row.fe]) map[row.fe] = [];
      map[row.fe].push(row);
    });
    return map;
  }, [filteredLeave]);

  const personCards = filteredPeople
    .filter((person) => !!person.initials)
    .map((person, index) => {
      const leave = leaveByPerson[person.initials] || [];
      const standardTaken = leave
        .filter((x: AnnualLeaveRecord) => (x.leave_type || "").toLowerCase() === "standard")
        .reduce((sum: number, x: AnnualLeaveRecord) => sum + (x.days_taken || 0), 0);
      const unpaidTaken = leave
        .filter((x: AnnualLeaveRecord) => (x.leave_type || "").toLowerCase() === "unpaid")
        .reduce((sum: number, x: AnnualLeaveRecord) => sum + (x.days_taken || 0), 0);

      const unpaidCapped = Math.min(unpaidTaken, UNPAID_LEAVE_CAP);
      const unpaidRemaining = Math.max(0, UNPAID_LEAVE_CAP - unpaidCapped);

      return (
        <div className="al-person-card" key={person.initials} style={{ animationDelay: `${index * 0.05}s` }}>
          <div className="al-person-header">
            <div className="al-person-avatar">
              <span className="al-avatar-text">{person.initials}</span>
            </div>
            <div>
              <div className="al-person-name">{person.fullName}</div>
              <div className="al-person-meta">
                Entitlement: {person.holiday_entitlement} days
              </div>
            </div>
          </div>
          <div className="al-person-metrics">
            <ALCard title="Days Taken" value={standardTaken} variant="standard" />
            <ALCard title="Days Left" value={Math.max(0, (person.holiday_entitlement ?? 0) - standardTaken)} variant="left" />
            <ALCard title="Unpaid Taken" value={unpaidCapped} variant="unpaid" />
            <ALCard title="Unpaid Left" value={unpaidRemaining} variant="unpaidLeft" />
          </div>
        </div>
      );
    });

  return (
    <div className="annual-leave-report-container animate-dashboard">
      <div className="filter-section">
        <div className="date-filter-wrapper">
          <div className="date-pickers">
            <Stack horizontal tokens={{ childrenGap: 16 }}>
              <DatePicker
                value={startDate}
                onSelectDate={(date) => setStartDate(date || undefined)}
                styles={datePickerStyles}
                formatDate={formatDate}
                placeholder="Start Date"
              />
              <DatePicker
                value={endDate}
                onSelectDate={(date) => setEndDate(date || undefined)}
                styles={datePickerStyles}
                formatDate={formatDate}
                placeholder="End Date"
              />
            </Stack>
          </div>
        </div>
        <div className="team-slicer-buttons">
          <PrimaryButton
            text="All"
            onClick={selectAll}
            className={selectedInitials.length === activePeople.length ? "selected" : "unselected"}
          />
          <PrimaryButton
            text="Clear"
            onClick={clearAll}
            className={selectedInitials.length === 0 ? "selected" : "unselected"}
          />
          {activePeople.map((p) => (
            <PrimaryButton
              key={p.initials}
              text={p.initials}
              onClick={() => toggleInitials(p.initials)}
              className={selectedInitials.includes(p.initials) ? "selected" : "unselected"}
            />
          ))}
        </div>
      </div>

      <div className="al-cards-grid">
        {personCards.length > 0 ? personCards : <div>No data found for selection.</div>}
      </div>
    </div>
  );
};

export default AnnualLeaveReport;