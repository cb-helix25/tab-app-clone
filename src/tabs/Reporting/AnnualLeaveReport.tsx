import React, { useMemo, useState } from "react";
import { DatePicker, PrimaryButton, Stack, Checkbox } from "@fluentui/react";
import ALCard from "./ALCard";
import { colours } from "../../app/styles/colours";
import { TeamData } from "../../app/functionality/types";

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
  end.setMonth(2, 31); // March 31 next year
  return { start, end };
}

const UNPAID_LEAVE_CAP = 5;

const AnnualLeaveReport: React.FC<Props> = ({ data, teamData }) => {
  const { start: fyStart, end: fyEnd } = getFinancialYear();
  const [startDate, setStartDate] = useState<Date | undefined>(fyStart);
  const [endDate, setEndDate] = useState<Date | undefined>(fyEnd);

  // All active people
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

  // Multi-select FEs
  const [selectedInitials, setSelectedInitials] = useState<string[]>([]);

  const toggleInitials = (initials: string) => {
    setSelectedInitials((prev) =>
      prev.includes(initials)
        ? prev.filter((i) => i !== initials)
        : [...prev, initials]
    );
  };

  const selectAll = () => setSelectedInitials(activePeople.map((p) => p.initials));
  const clearAll = () => setSelectedInitials([]);

  // Only show selected, or all if none
  const filteredPeople = useMemo(() => {
    return selectedInitials.length
      ? activePeople.filter((p) => selectedInitials.includes(p.initials))
      : activePeople;
  }, [activePeople, selectedInitials]);

  // Filter annual leave by date range, initials (multi), and status=booked
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

  // Group leave by initials for per-person metrics
  const leaveByPerson = useMemo(() => {
    const map: { [initials: string]: AnnualLeaveRecord[] } = {};
    filteredLeave.forEach((row: AnnualLeaveRecord) => {
      if (!row.fe) return;
      if (!map[row.fe]) map[row.fe] = [];
      map[row.fe].push(row);
    });
    return map;
  }, [filteredLeave]);

  // Summary stats for high-level section
  const summaryStats = useMemo(() => {
    let totalStandard = 0,
      totalUnpaid = 0,
      totalPeople = filteredPeople.length;
    filteredPeople.forEach((person) => {
      const leave = leaveByPerson[person.initials] || [];
      totalStandard += leave
        .filter((x: AnnualLeaveRecord) => (x.leave_type || "").toLowerCase() === "standard")
        .reduce((sum: number, x: AnnualLeaveRecord) => sum + (x.days_taken || 0), 0);
      totalUnpaid += leave
        .filter((x: AnnualLeaveRecord) => (x.leave_type || "").toLowerCase() === "unpaid")
        .reduce((sum: number, x: AnnualLeaveRecord) => sum + (x.days_taken || 0), 0);
    });
    return {
      totalStandard,
      totalUnpaid: Math.min(totalUnpaid, totalPeople * UNPAID_LEAVE_CAP),
      totalPeople,
    };
  }, [filteredPeople, leaveByPerson]);

  // Per-person cards
  const personCards = filteredPeople
    .filter((person) => !!person.initials)
    .map((person) => {
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
        <div className="al-person-card" key={person.initials}>
          <div className="al-person-header">
            <div className="al-person-avatar">{person.initials}</div>
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
      <div className="annual-leave-report-title">Annual Leave Report</div>

      {/* High-level summary */}
      <div className="al-summary-section">
        <div>
          <div className="al-summary-title">Summary ({summaryStats.totalPeople} selected)</div>
          <div className="al-summary-cards">
            <ALCard title="Total Standard Leave" value={summaryStats.totalStandard} variant="standard" />
            <ALCard title="Total Unpaid Leave" value={summaryStats.totalUnpaid} variant="unpaid" />
          </div>
        </div>
        <div className="al-summary-filters">
          <Stack horizontal tokens={{ childrenGap: 12 }}>
            <DatePicker
              placeholder="Start Date"
              value={startDate}
              onSelectDate={(date) => setStartDate(date || undefined)}
              styles={{ root: { width: 115 } }}
              formatDate={formatDate}
            />
            <DatePicker
              placeholder="End Date"
              value={endDate}
              onSelectDate={(date) => setEndDate(date || undefined)}
              styles={{ root: { width: 115 } }}
              formatDate={formatDate}
            />
          </Stack>
          <div className="al-fe-multiselect">
            <PrimaryButton
              text="Select All"
              onClick={selectAll}
              className="al-fe-action"
              style={{ marginRight: 4 }}
            />
            <PrimaryButton
              text="Clear"
              onClick={clearAll}
              className="al-fe-action"
            />
          </div>
        </div>
      </div>

      {/* Multi-select FEs */}
      <div className="al-person-multiselect">
        {activePeople.map((p) => (
          <Checkbox
            key={p.initials}
            label={p.fullName}
            checked={selectedInitials.includes(p.initials)}
            onChange={() => toggleInitials(p.initials)}
            className={`al-fe-checkbox ${selectedInitials.includes(p.initials) ? "selected" : ""}`}
            styles={{
              root: { marginRight: 12, marginBottom: 6 },
              label: { fontWeight: 500 },
            }}
          />
        ))}
      </div>

      {/* Person cards grid */}
      <div className="al-cards-grid">
        {personCards.length > 0 ? personCards : <div>No data found for selection.</div>}
      </div>
    </div>
  );
};

export default AnnualLeaveReport;