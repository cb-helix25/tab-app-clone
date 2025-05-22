import React, { useMemo, useState } from "react";
import { DatePicker, PrimaryButton, Stack } from "@fluentui/react";
import ALCard from "./ALCard";
import { colours } from "../../app/styles/colours";
import { TeamData } from "../../app/functionality/types";

export interface AnnualLeaveRecord {
  request_id: number;
  fe: string; // user initials
  start_date: string; // ISO string
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

// Utility: Get start/end of financial year
function getFinancialYear(date = new Date()) {
  const year = date.getFullYear();
  const start = new Date(date);
  if (date.getMonth() < 3) {
    // Before April: FY started in previous year
    start.setFullYear(year - 1, 3, 1);
  } else {
    // April or after
    start.setFullYear(year, 3, 1);
  }
  const end = new Date(start);
  end.setFullYear(start.getFullYear() + 1);
  end.setMonth(2, 31); // March 31 next year
  return { start, end };
}

const UNPAID_LEAVE_CAP = 5;

const AnnualLeaveReport: React.FC<Props> = ({ data, teamData }) => {
  // Date filter state
  const { start: fyStart, end: fyEnd } = getFinancialYear();
  const [startDate, setStartDate] = useState<Date | undefined>(fyStart);
  const [endDate, setEndDate] = useState<Date | undefined>(fyEnd);

  // Get all active people from team data (Initials)
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

  // Slicer state: All or a particular person
  const [selectedInitials, setSelectedInitials] = useState<string | null>(null);

  // Filtered people list (all or just one)
  const filteredPeople = useMemo(() => {
    return selectedInitials
      ? activePeople.filter((p) => p.initials === selectedInitials)
      : activePeople;
  }, [activePeople, selectedInitials]);

  // Filter annual leave by date range and initials
  const filteredLeave = useMemo(() => {
    return data.filter((row: AnnualLeaveRecord) => {
      const leaveDate = new Date(row.start_date);
      const afterStart = !startDate || leaveDate >= startDate;
      const beforeEnd = !endDate || leaveDate <= endDate;
      const personMatch =
        !selectedInitials || row.fe === selectedInitials;
      return afterStart && beforeEnd && personMatch;
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

  // For each filtered person, prepare metrics
  const personCards = filteredPeople
    .filter(person => !!person.initials)
    .map((person) => {
      const leave = leaveByPerson[person.initials] || [];
      const standardTaken = leave
        .filter((x: AnnualLeaveRecord) => 
          x.leave_type && x.leave_type.toLowerCase() === "standard"
        )
        .reduce((sum: number, x: AnnualLeaveRecord) => sum + (x.days_taken || 0), 0);

      const unpaidTaken = leave
        .filter((x: AnnualLeaveRecord) => 
          x.leave_type && x.leave_type.toLowerCase() === "unpaid"
        )
        .reduce((sum: number, x: AnnualLeaveRecord) => sum + (x.days_taken || 0), 0);

      const unpaidRemaining = Math.max(0, UNPAID_LEAVE_CAP - unpaidTaken);

      return (
        <div key={person.initials} style={{ marginBottom: 32, width: "100%" }}>
          <div style={{ fontWeight: 700, fontSize: 22, color: colours.highlight, marginBottom: 12 }}>
            {person.fullName} ({person.initials})
          </div>
          <div style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            marginBottom: 12,
            width: "100%",
          }}>
            <ALCard title="Days Taken (Standard)" value={standardTaken} />
            <ALCard title="Days Left" value={Math.max(0, (person.holiday_entitlement ?? 0) - standardTaken)} />
            <ALCard title="Unpaid Leave Taken" value={unpaidTaken} />
            <ALCard title="Unpaid Leave Remaining" value={unpaidRemaining} />
          </div>
        </div>
      );
    });

  return (
    <div className="annual-leave-report-container animate-dashboard">
      <div className="annual-leave-report-title">Annual Leave Report</div>
      {/* Slicers */}
      <div className="filter-section">
        <div className="date-filter-wrapper">
          <div className="date-pickers">
            <Stack horizontal tokens={{ childrenGap: 16 }}>
              <DatePicker
                placeholder="Start Date"
                value={startDate}
                onSelectDate={(date) => setStartDate(date || undefined)}
                styles={{ root: { marginRight: 8, width: 140 } }}
                formatDate={formatDate}
              />
              <DatePicker
                placeholder="End Date"
                value={endDate}
                onSelectDate={(date) => setEndDate(date || undefined)}
                styles={{ root: { width: 140 } }}
                formatDate={formatDate}
              />
            </Stack>
          </div>
          <div className="vertical-separator" />
          <div className="person-slicer" style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <PrimaryButton
              text="All"
              onClick={() => setSelectedInitials(null)}
              className={selectedInitials === null ? "selected" : "unselected"}
            />
            {activePeople.map((p) => (
              <PrimaryButton
                key={p.initials}
                text={p.initials}
                onClick={() => setSelectedInitials(p.initials ?? null)}
                className={selectedInitials === p.initials ? "selected" : "unselected"}
              />
            ))}
          </div>
        </div>
      </div>
      {/* Per-person metric cards */}
      <div style={{ marginTop: 40 }}>
        {personCards.length > 0 ? personCards : <div>No data found for selection.</div>}
      </div>
    </div>
  );
};

export default AnnualLeaveReport;