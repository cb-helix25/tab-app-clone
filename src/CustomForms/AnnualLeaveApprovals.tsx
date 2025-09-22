import React, { useState } from 'react';
import { getProxyBaseUrl } from '../utils/getProxyBaseUrl';
// invisible change
import {
  Stack,
  Text,
  DefaultButton,
  Persona,
  PersonaSize,
  Label,
  TextField
} from '@fluentui/react';
import { mergeStyles } from '@fluentui/react';
import { eachDayOfInterval, isWeekend, format, addDays } from 'date-fns';
import { colours } from '../app/styles/colours';
import { formContainerStyle, inputFieldStyle } from './BespokeForms';
import { sharedDefaultButtonStyles } from '../app/styles/ButtonStyles';
import HelixAvatar from '../assets/helix avatar.png';
import { PiTreePalm } from 'react-icons/pi';

/* ---------------------------------------------------------------------------
   Types
--------------------------------------------------------------------------- */
export interface ApprovalEntry {
  id: string;
  request_id?: number;
  person: string;
  start_date: string;
  end_date: string;
  reason?: string;
  status: string;
  days_taken?: number;
  leave_type?: string;
  hearing_confirmation?: string | boolean | null;  // Updated to match data
  hearing_details?: string;                        // Kept as string | undefined
}

export interface TeamMember {
  Initials: string;
  Nickname?: string;
  First: string;
  imageUrl?: string;
  holiday_entitlement?: number;
}

interface AnnualLeaveApprovalsProps {
  approvals: ApprovalEntry[];
  futureLeave: ApprovalEntry[];
  onClose: () => void;
  team: TeamMember[];
  totals: { standard: number; unpaid: number; purchase: number };
  allLeaveEntries: ApprovalEntry[];
  onApprovalUpdate?: (updatedRequestId: string, newStatus: string) => void; // <-- Add this line
}

/* ---------------------------------------------------------------------------
   Fiscal Year Helpers (Apr 1 -> Mar 31)
--------------------------------------------------------------------------- */
function getFiscalYearStart(date: Date): number {
  const year = date.getFullYear();
  const aprilFirst = new Date(year, 3, 1); // month index 3 => April
  return date >= aprilFirst ? year : year - 1;
}

function isDateInFiscalYear(date: Date, fyStartYear: number): boolean {
  // FY runs from 1 Apr (fyStartYear) to 31 Mar (fyStartYear + 1)
  const start = new Date(fyStartYear, 3, 1);
  const end = new Date(fyStartYear + 1, 2, 31, 23, 59);
  return date >= start && date <= end;
}

/**
 * This function sums up days for *booked or requested* statuses in the same FY.
 * If the current request is in that dataset with status="requested",
 * it's already included.
 */
function sumBookedAndRequestedDaysInFY(
  allLeave: ApprovalEntry[],
  person: string,
  fyStartYear: number
): number {
  return allLeave
    .filter((leave) => {
      // Must match person
      if (leave.person.toLowerCase() !== person.toLowerCase()) return false;

      // Must be booked or requested (or approved, if that’s used)
      const s = leave.status.toLowerCase();
      if (s !== 'booked' && s !== 'requested') return false; 

      // Must be standard leave type
      if (!leave.leave_type || leave.leave_type.toLowerCase() !== 'standard') {
        return false;
      }

      // Must lie within the fiscal year
      const start = new Date(leave.start_date);
      const end = new Date(leave.end_date);
      return isDateInFiscalYear(start, fyStartYear) && isDateInFiscalYear(end, fyStartYear);
    })
    .reduce((acc, leave) => acc + (leave.days_taken || 0), 0);
}

/**
 * If days_taken is absent/0, fallback to ignoring weekends. 
 * (Only if you want to handle partial days or half-days carefully.)
 */
function getRequestDays(entry: ApprovalEntry): number {
  const dt = entry.days_taken ?? 0;
  if (dt > 0) return dt;

  // fallback if truly 0 or undefined: count weekdays in the interval
  const start = new Date(entry.start_date);
  const end = new Date(entry.end_date);
  const days = eachDayOfInterval({ start, end }).filter(d => !isWeekend(d)).length;
  return days;
}

function formatDateRange(startStr: string, endStr: string): string {
  const start = new Date(startStr);
  const end = new Date(endStr);
  if (start.getFullYear() === end.getFullYear()) {
    return `${format(start, 'd MMM')} - ${format(end, 'd MMM yyyy')}`;
  }
  return `${format(start, 'd MMM yyyy')} - ${format(end, 'd MMM yyyy')}`;
}

/**
 * Optional: for conflict display
 */
function consolidateRanges(ranges: { start_date: string; end_date: string }[]) {
  if (!ranges.length) return [];
  const sorted = [...ranges].sort(
    (a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime()
  );
  const result = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    const last = result[result.length - 1];
    const curr = sorted[i];
    if (new Date(curr.start_date) <= addDays(new Date(last.end_date), 1)) {
      if (new Date(curr.end_date) > new Date(last.end_date)) {
        last.end_date = curr.end_date;
      }
    } else {
      result.push(curr);
    }
  }
  return result;
}

/* ---------------------------------------------------------------------------
   Styles
--------------------------------------------------------------------------- */
const containerEntryStyle = mergeStyles({
  border: `1px solid ${colours.light.border}`,
  padding: '20px',
  borderRadius: '8px',
  backgroundColor: '#fff',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
});

const labelStyleText = mergeStyles({
  fontSize: '14px',
  fontWeight: 600,
  color: colours.highlight,
  marginBottom: '5px',
});

const valueStyleText = mergeStyles({
  fontSize: '18px',
  color: colours.light.text,
  marginBottom: '10px',
});

const Badge: React.FC<{ children: React.ReactNode; badgeStyle?: React.CSSProperties }> = ({
  children,
  badgeStyle,
}) => (
  <span style={{ padding: '4px 8px', borderRadius: '12px', fontWeight: 600, ...badgeStyle }}>
    {children}
  </span>
);

/* ---------------------------------------------------------------------------
   Main
--------------------------------------------------------------------------- */
const AnnualLeaveApprovals: React.FC<AnnualLeaveApprovalsProps> = ({
  approvals,
  futureLeave,
  onClose,
  team,
  totals,
  allLeaveEntries,
  onApprovalUpdate,
}) => {
  const [rejectionReason, setRejectionReason] = useState<{ [id: string]: string }>({});

  const updateAnnualLeave = async (
    leaveId: string,
    newStatus: string,
    reason: string | null
  ): Promise<void> => {
  // Use new integrated server route instead of Azure Function
  const url = `${getProxyBaseUrl()}/api/attendance/updateAnnualLeave`;
    const payload = { id: leaveId, newStatus, rejection_notes: reason || '' };
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error(`Update failed with status ${response.status}: ${response.statusText}`);
    }
  };

  function getNickname(initials: string): string {
    const member = team.find(m => m.Initials.toLowerCase() === initials.toLowerCase());
    return member?.Nickname || initials;
  }

  function getEntitlement(initials: string): number {
    console.log('getEntitlement called with initials:', initials);
    console.log('Team data:', team);
    const normalizedInitials = initials.trim().toLowerCase();
    const member = team.find(m => m.Initials && m.Initials.trim().toLowerCase() === normalizedInitials);
    if (!member) {
      console.warn(`No team member found for initials: ${initials}`);
    } else {
      console.log('Found team member:', member);
    }
    return member?.holiday_entitlement ?? 20;
  }

  function getAllConflicts(current: ApprovalEntry): ApprovalEntry[] {
    const start = new Date(current.start_date);
    const end = new Date(current.end_date);

    const conflictApprovals = approvals.filter(
      other =>
        other.id !== current.id &&
        other.person !== current.person &&
        new Date(other.end_date) >= start &&
        new Date(other.start_date) <= end
    );
    const conflictFuture = futureLeave.filter(
      other =>
        other.person !== current.person &&
        new Date(other.end_date) >= start &&
        new Date(other.start_date) <= end
    );
    return [...conflictApprovals, ...conflictFuture];
  }

  const ApprovalCard: React.FC<{ entry: ApprovalEntry }> = ({ entry }) => {
    const recordId = entry.request_id ? String(entry.request_id) : entry.id;
    const [updated, setUpdated] = useState(false);
    const [confirmationMessage, setConfirmationMessage] = useState('');
    const [localRejection, setLocalRejection] = useState('');

    // 1) figure out the FY
    const fyStart = getFiscalYearStart(new Date(entry.start_date));

    // 2) sum "booked + requested" for this person in that FY
    const sumSoFar = sumBookedAndRequestedDaysInFY(
      allLeaveEntries,
      entry.person,
      fyStart
    );

    // 3) That sum already includes this request if it's "requested" or "booked."
    const daysSoFar = sumSoFar;

    // 4) days remaining = entitlement - daysSoFar
    const entitlement = getEntitlement(entry.person);
    const daysRemaining = entitlement - daysSoFar;

    // The request is just for display
    const requestDays = getRequestDays(entry);

    const localHandleApprove = async () => {
      try {
        await updateAnnualLeave(recordId, 'approved', null);
        setUpdated(true);
        setConfirmationMessage('Approved successfully');
        
        if (onApprovalUpdate) {
          onApprovalUpdate(recordId, 'approved');
        }
      } catch (error) {
        console.error(`Error approving leave ${recordId}:`, error);
        setConfirmationMessage('Approval failed');
      }
    };
    
    const localHandleReject = async () => {
      try {
        await updateAnnualLeave(recordId, 'rejected', localRejection);
        setUpdated(true);
        setConfirmationMessage('Rejected successfully');
        
        if (onApprovalUpdate) {
          onApprovalUpdate(recordId, 'rejected');
        }
      } catch (error) {
        console.error(`Error rejecting leave ${recordId}:`, error);
        setConfirmationMessage('Rejection failed');
      }
    };
    

    // Conflicts
    const conflicts = getAllConflicts(entry);
    const conflictsGrouped: {
      [p: string]: {
        nickname: string;
        dateRanges: { start_date: string; end_date: string }[];
        status: string;
      };
    } = {};

    conflicts.forEach(cf => {
      const cKey = cf.person;
      if (!conflictsGrouped[cKey]) {
        conflictsGrouped[cKey] = {
          nickname: getNickname(cf.person),
          dateRanges: [],
          status: cf.status.toLowerCase(),
        };
      }
      conflictsGrouped[cKey].dateRanges.push({
        start_date: cf.start_date,
        end_date: cf.end_date,
      });
      if (conflictsGrouped[cKey].status !== cf.status.toLowerCase()) {
        conflictsGrouped[cKey].status = 'requested';
      }
    });

    const groupedArray = Object.values(conflictsGrouped);
    const availableSell = 5 - totals.purchase;

    return (
      <div
        className={mergeStyles(
          containerEntryStyle,
          updated && { backgroundColor: '#f0f0f0', border: '2px solid #009900' }
        )}
      >
        <Stack horizontal tokens={{ childrenGap: 20 }} verticalAlign="start">
          <Persona
            imageUrl={HelixAvatar}
            text={getNickname(entry.person)}
            size={PersonaSize.size48}
            styles={{ primaryText: { fontWeight: 'bold', fontSize: '18px' } }}
          />
          <Stack tokens={{ childrenGap: 20 }} styles={{ root: { flex: 1 } }}>
            <Stack
              tokens={{ childrenGap: 10 }}
              styles={{
                root: {
                  border: `1px solid ${colours.light.border}`,
                  borderRadius: '4px',
                  padding: '12px',
                  backgroundColor: colours.light.grey,
                },
              }}
            >
              <Stack horizontal tokens={{ childrenGap: 40 }}>
                <Stack>
                  <Label className={labelStyleText}>Requested Dates:</Label>
                  <Text className={valueStyleText}>
                    {formatDateRange(entry.start_date, entry.end_date)}
                  </Text>
                </Stack>
                <Stack>
                  <Label className={labelStyleText}>Days Taken for This Request:</Label>
                  <Text className={valueStyleText}>
                    {requestDays} {requestDays === 1 ? 'day' : 'days'}
                  </Text>
                </Stack>
              </Stack>
              <Stack>
                <Label className={labelStyleText}>Notes:</Label>
                <Text className={valueStyleText}>
                  {entry.reason?.trim()
                    ? entry.reason
                    : `${getNickname(entry.person)} hasn't left a note.`}
                </Text>
              </Stack>
            </Stack>

            {entry.hearing_confirmation !== undefined && (
              <Stack tokens={{ childrenGap: 5 }}>
                <Label className={labelStyleText}>Hearing Confirmation:</Label>
                <Text className={valueStyleText}>
                  {entry.hearing_confirmation === true || (typeof entry.hearing_confirmation === 'string' && entry.hearing_confirmation.toLowerCase() === 'yes')
                    ? 'There are no hearings during my absence'
                    : 'There are hearings during my absence'}
                </Text>
                {(entry.hearing_confirmation === false || entry.hearing_confirmation === null || (typeof entry.hearing_confirmation === 'string' && entry.hearing_confirmation.toLowerCase() === 'no')) && entry.hearing_details && (
                  <>
                    <Label className={labelStyleText}>Hearing Details:</Label>
                    <Text className={valueStyleText}>{entry.hearing_details}</Text>
                  </>
                )}
              </Stack>
            )}

            {/* Summaries */}
            <Stack
              horizontal
              tokens={{ childrenGap: 40 }}
              styles={{
                root: {
                  border: `1px solid ${colours.light.border}`,
                  borderRadius: '4px',
                  padding: '12px',
                  backgroundColor: colours.light.grey,
                },
              }}
            >
              <Stack>
                <Label className={labelStyleText}>Days taken so far this FY:</Label>
                <Text className={valueStyleText}>
                  {daysSoFar} {daysSoFar === 1 ? 'day' : 'days'}
                </Text>
              </Stack>
              <Stack>
                <Label className={labelStyleText}>Days remaining this FY (if approved):</Label>
                <Text className={valueStyleText}>
                  {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'}
                </Text>
              </Stack>
              <Stack>
                <Label className={labelStyleText}>Available days to sell:</Label>
                <Text className={valueStyleText}>
                  {availableSell} {availableSell === 1 ? 'day' : 'days'}
                </Text>
              </Stack>
            </Stack>

            {/* Conflicts */}
            <Stack tokens={{ childrenGap: 10 }} styles={{ root: { marginTop: 10 } }}>
              <Label className={labelStyleText}>Team Conflicts:</Label>
              {groupedArray.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
                  {groupedArray.map((item, idx) => {
                    const consolidated = consolidateRanges(item.dateRanges);
                    let borderColor = colours.cta;
                    if (item.status === 'approved') borderColor = colours.orange;
                    else if (item.status === 'booked') borderColor = colours.green;

                    return (
                      <div
                        key={idx}
                        style={{
                          border: `1px solid ${borderColor}`,
                          backgroundColor: '#fff',
                          padding: '5px',
                          borderRadius: '4px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          minWidth: '150px',
                        }}
                      >
                        <Persona
                          imageUrl={HelixAvatar}
                          text={item.nickname}
                          size={PersonaSize.size48}
                          styles={{ primaryText: { fontWeight: 'bold', fontSize: '16px' } }}
                        />
                        <div style={{ marginTop: '5px', textAlign: 'center', width: '100%' }}>
                          <div style={{ fontWeight: 600, fontSize: '16px', color: colours.light.text }}>
                            {item.nickname}
                          </div>
                          <div style={{ fontSize: '14px', fontWeight: 400, color: colours.light.text }}>
                            {consolidated.map((dr, i2) => (
                              <div key={i2}>
                                {dr.start_date === dr.end_date
                                  ? format(new Date(dr.start_date), 'd MMM')
                                  : `${format(new Date(dr.start_date), 'd MMM')} - ${format(new Date(dr.end_date), 'd MMM')}`}
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <Text className={valueStyleText}>No Conflicts</Text>
              )}
            </Stack>
          </Stack>
        </Stack>
        {/* Status */}
        <Stack horizontal tokens={{ childrenGap: 10 }} styles={{ root: { marginTop: 10 } }}>
          {entry.status.toLowerCase() === 'approved' && (
            <Badge badgeStyle={{ backgroundColor: '#e6ffe6', color: '#009900' }}>Approved</Badge>
          )}
          {entry.status.toLowerCase() === 'rejected' && (
            <Badge badgeStyle={{ backgroundColor: '#fff9e6', color: '#cc0000' }}>Rejected</Badge>
          )}
        </Stack>
        {/* Approve / Reject */}
        <Stack horizontal tokens={{ childrenGap: 10 }} styles={{ root: { marginTop: 10, paddingBottom: 10 } }}>
          <DefaultButton
            text="Approve"
            onClick={localHandleApprove}
            styles={sharedDefaultButtonStyles}
            onRenderIcon={() => (
              <PiTreePalm style={{ color: '#009900', fontSize: 16 }} />
            )}
          />
          <DefaultButton
            text="Reject"
            onClick={localHandleReject}
            styles={sharedDefaultButtonStyles}
            iconProps={{ iconName: 'Cancel', styles: { root: { color: '#cc0000' } } }}
          />
        </Stack>
        <TextField
          placeholder="Enter rejection notes"
          value={localRejection}
          onChange={(e, val) => setLocalRejection(val || '')}
          styles={{ fieldGroup: inputFieldStyle }}
          multiline
          rows={3}
        />
        {confirmationMessage && (
          <Text style={{ marginTop: 10, fontWeight: 'bold', color: '#009900' }}>
            {confirmationMessage}
          </Text>
        )}
      </div>
    );
  };

  return (
    <div className={formContainerStyle}>
      {approvals.length === 0 ? (
        <Text style={{ fontSize: 20, color: colours.light.text }}>No items to approve.</Text>
      ) : (
        <Stack tokens={{ childrenGap: 20 }}>
          {approvals.map(entry => (
            <ApprovalCard key={entry.request_id ? String(entry.request_id) : entry.id} entry={entry} />
          ))}
        </Stack>
      )}
    </div>
  );
};

export default AnnualLeaveApprovals;