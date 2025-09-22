import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Stack,
  Text,
  DefaultButton,
  Persona,
  PersonaSize,
  TextField
} from '@fluentui/react';
import { mergeStyles } from '@fluentui/react';
import { eachDayOfInterval, isWeekend, format } from 'date-fns';
import { colours } from '../app/styles/colours';
import HelixAvatar from '../assets/helix avatar.png';
import { PiTreePalm } from 'react-icons/pi';

/* ---------------------------------------------------------------------------
   Types & Interfaces
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
  hearing_confirmation?: string | boolean | null;
  hearing_details?: string;
}

export interface TeamMember {
  Initials: string;
  Nickname?: string;
  First: string;
  imageUrl?: string;
  holiday_entitlement?: number;
}

export interface LeaveEntry {
  person: string;
  start_date: string;
  end_date: string;
  status: string;
  leave_type?: string;
}

export interface TotalsItem {
  standard: number;
  unpaid: number;
  purchase: number;
}

/* ---------------------------------------------------------------------------
   Fiscal Year Helper Functions
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

function sumBookedAndRequestedDaysInFY(
  allLeaveEntries: LeaveEntry[],
  person: string,
  fyStartYear: number
): number {
  let totalDays = 0;

  allLeaveEntries
    .filter(entry => entry.person === person)
    .filter(entry => 
      entry.status && 
      (entry.status.toLowerCase() === 'booked' || 
       entry.status.toLowerCase() === 'requested' ||
       entry.status.toLowerCase() === 'approved')
    )
    .forEach(entry => {
      const startDate = new Date(entry.start_date);
      const endDate = new Date(entry.end_date);

      if (isDateInFiscalYear(startDate, fyStartYear) || isDateInFiscalYear(endDate, fyStartYear)) {
        const businessDays = eachDayOfInterval({ start: startDate, end: endDate })
          .filter(day => !isWeekend(day))
          .length;
        totalDays += businessDays;
      }
    });

  return totalDays;
}

/* ---------------------------------------------------------------------------
   Types & Props
--------------------------------------------------------------------------- */
interface AnnualLeaveApprovalsProps {
  approvals: ApprovalEntry[];
  futureLeave: ApprovalEntry[];
  onClose: () => void;
  team: TeamMember[];
  totals: TotalsItem[];
  allLeaveEntries: LeaveEntry[];
  onApprovalUpdate?: (id: string, newStatus: string) => void;
}

/* ---------------------------------------------------------------------------
   Litigation-Grade Professional Styling
--------------------------------------------------------------------------- */
const formContainerStyle = mergeStyles({
  position: 'fixed',
  inset: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.6)',
  zIndex: 2147483000, // ensure above any app/panel overlays
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '20px',
  overflow: 'auto',
});

const modalContentStyle = mergeStyles({
  background: `linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)`,
  borderRadius: '16px',
  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.5)',
  width: 'min(1200px, 96%)',
  maxHeight: '90vh',
  overflow: 'auto',
  padding: '32px',
  position: 'relative',
  '@media (max-width: 768px)': {
    padding: '20px',
    borderRadius: '12px',
    width: '98%',
    maxHeight: '95vh',
  },
});

const closeButtonStyle = mergeStyles({
  position: 'absolute',
  top: '16px',
  right: '16px',
  backgroundColor: 'transparent',
  border: 'none',
  fontSize: '24px',
  cursor: 'pointer',
  color: colours.greyText,
  padding: '8px',
  borderRadius: '50%',
  width: '40px',
  height: '40px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.2s ease',
  ':hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    color: colours.light.text,
  },
});

const professionalContainerStyle = mergeStyles({
  background: `linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)`,
  border: `1px solid ${colours.light.border}`,
  borderRadius: '16px',
  padding: '32px',
  marginBottom: '24px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
  maxWidth: '100%',
  overflow: 'hidden',
  '@media (max-width: 768px)': {
    padding: '20px',
    borderRadius: '12px',
  },
});

const headerSectionStyle = mergeStyles({
  borderBottom: `2px solid ${colours.light.border}`,
  paddingBottom: '20px',
  marginBottom: '24px',
});

const requestHeaderStyle = mergeStyles({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
});

const sectionTitleStyle = mergeStyles({
  fontSize: '16px',
  fontWeight: 700,
  color: colours.light.text,
  marginBottom: '12px',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  borderLeft: `4px solid ${colours.cta}`,
  paddingLeft: '12px',
});

const notesStyle = mergeStyles({
  backgroundColor: '#f8fafc',
  border: `1px solid ${colours.light.border}`,
  borderRadius: '8px',
  padding: '16px',
  fontSize: '14px',
  fontStyle: 'italic',
  color: colours.light.text,
  marginBottom: '20px',
  lineHeight: '1.5',
});

const conflictsGridStyle = mergeStyles({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '16px',
  marginBottom: '20px',
  '@media (max-width: 768px)': {
    gridTemplateColumns: '1fr',
  },
});

const conflictCardStyle = mergeStyles({
  backgroundColor: '#fff',
  border: `1px solid ${colours.light.border}`,
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center',
  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  transition: 'transform 0.2s ease',
  ':hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
  },
});

const actionButtonsStyle = mergeStyles({
  display: 'flex',
  gap: '16px',
  marginBottom: '16px',
  justifyContent: 'center',
  alignItems: 'center',
  '@media (max-width: 768px)': {
    flexDirection: 'column',
    gap: '12px',
  },
});

const statusBadgeStyle = (status: string) => mergeStyles({
  padding: '6px 12px',
  borderRadius: '20px',
  fontSize: '12px',
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  backgroundColor: 
    status === 'approved' ? '#e8f5e8' : 
    status === 'rejected' ? '#fdf2f2' : '#fff3cd',
  color: 
    status === 'approved' ? '#2d5a2d' : 
    status === 'rejected' ? '#721c24' : '#856404',
  border: `1px solid ${
    status === 'approved' ? '#a3d977' : 
    status === 'rejected' ? '#f5c6cb' : '#ffeaa7'
  }`,
});

const criticalInfoStyle = mergeStyles({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '16px',
  marginBottom: '20px',
  '@media (max-width: 768px)': {
    gridTemplateColumns: '1fr',
    gap: '12px',
  },
});

const infoCardStyle = mergeStyles({
  backgroundColor: '#f8fafc',
  border: `1px solid ${colours.light.border}`,
  borderRadius: '8px',
  padding: '16px',
  textAlign: 'center',
});

const infoLabelStyle = mergeStyles({
  fontSize: '12px',
  fontWeight: 600,
  color: colours.greyText,
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  marginBottom: '6px',
});

const infoValueStyle = mergeStyles({
  fontSize: '16px',
  fontWeight: 700,
  color: colours.light.text,
});

const approveButtonStyle = mergeStyles({
  backgroundColor: '#22c55e',
  borderColor: '#22c55e',
  color: '#fff',
  fontWeight: 600,
  padding: '12px 24px',
  borderRadius: '8px',
  transition: 'all 0.2s ease',
  ':hover': {
    backgroundColor: '#16a34a',
    borderColor: '#16a34a',
    transform: 'translateY(-1px)',
  },
});

const rejectButtonStyle = mergeStyles({
  backgroundColor: '#ef4444',
  borderColor: '#ef4444',
  color: '#fff',
  fontWeight: 600,
  padding: '12px 24px',
  borderRadius: '8px',
  transition: 'all 0.2s ease',
  ':hover': {
    backgroundColor: '#dc2626',
    borderColor: '#dc2626',
    transform: 'translateY(-1px)',
  },
});

const rejectionNotesStyle = mergeStyles({
  marginTop: '12px',
  '& .ms-TextField-fieldGroup': {
    borderRadius: '8px',
    border: `2px solid ${colours.light.border}`,
    ':focus-within': {
      borderColor: colours.cta,
    },
  },
});

/* ---------------------------------------------------------------------------
   Main Component
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
  // Portal container element
  const [portalEl, setPortalEl] = useState<HTMLDivElement | null>(null);

  // Create and attach a dedicated container for the portal
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const el = document.createElement('div');
    el.setAttribute('data-annual-leave-modal', '');
    document.body.appendChild(el);
    setPortalEl(el);
    return () => {
      if (el.parentNode) {
        el.parentNode.removeChild(el);
      }
    };
  }, []);

  // Body scroll lock and ESC to close (apply regardless of portal readiness)
  useEffect(() => {
    if (typeof document === 'undefined') return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  const [rejectionReason, setRejectionReason] = useState<{ [id: string]: string }>({});
  const [processingStates, setProcessingStates] = useState<{ [id: string]: boolean }>({});

  const updateAnnualLeave = async (
    leaveId: string,
    newStatus: string,
    reason: string | null
  ): Promise<void> => {
    const url = `/api/attendance/updateAnnualLeave`;
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
    const normalizedInitials = initials.trim().toLowerCase();
    const member = team.find(m => m.Initials && m.Initials.trim().toLowerCase() === normalizedInitials);
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

  function formatDateRange(start: string, end: string): string {
    const startDate = new Date(start);
    const endDate = new Date(end);
    
    if (startDate.getTime() === endDate.getTime()) {
      return format(startDate, 'EEEE, d MMMM yyyy');
    }
    
    return `${format(startDate, 'EEEE, d MMMM yyyy')} - ${format(endDate, 'EEEE, d MMMM yyyy')}`;
  }

  function calculateBusinessDays(start: string, end: string): number {
    const startDate = new Date(start);
    const endDate = new Date(end);
    return eachDayOfInterval({ start: startDate, end: endDate }).filter(day => !isWeekend(day)).length;
  }

  const ApprovalCard: React.FC<{ entry: ApprovalEntry }> = ({ entry }) => {
    const [confirmationMessage, setConfirmationMessage] = useState<string>('');
    const [localRejection, setLocalRejection] = useState<string>(rejectionReason[entry.id] || '');

    const requestDays = calculateBusinessDays(entry.start_date, entry.end_date);
    const entitlement = getEntitlement(entry.person);
    const fyStartYear = getFiscalYearStart(new Date());
    const daysSoFar = sumBookedAndRequestedDaysInFY(allLeaveEntries, entry.person, fyStartYear);
    const daysRemaining = entitlement - daysSoFar;
    const availableSell = Math.max(0, daysRemaining - 5);
    
    const conflicts = getAllConflicts(entry);
    const isProcessing = processingStates[entry.id] || false;

    const handleAction = async (action: 'approve' | 'reject') => {
      if (isProcessing) return;
      
      setProcessingStates(prev => ({ ...prev, [entry.id]: true }));
      
      try {
        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        const reason = action === 'reject' ? localRejection : null;
        
        await updateAnnualLeave(entry.id, newStatus, reason);
        
        if (onApprovalUpdate) {
          onApprovalUpdate(entry.id, newStatus);
        }
        
        setConfirmationMessage(
          action === 'approve' 
            ? `✓ Approved leave for ${getNickname(entry.person)}` 
            : `✗ Rejected leave for ${getNickname(entry.person)}`
        );
        
        setTimeout(() => setConfirmationMessage(''), 3000);
        
      } catch (error) {
        console.error(`Failed to ${action} leave:`, error);
        setConfirmationMessage(`❌ Failed to ${action} leave request`);
        setTimeout(() => setConfirmationMessage(''), 5000);
      } finally {
        setProcessingStates(prev => ({ ...prev, [entry.id]: false }));
      }
    };

    return (
      <div className={professionalContainerStyle}>
        {/* Header Section */}
        <div className={headerSectionStyle}>
          <div className={requestHeaderStyle}>
            <Persona
              imageUrl={HelixAvatar}
              text={getNickname(entry.person)}
              size={PersonaSize.size48}
              styles={{ 
                primaryText: { 
                  fontWeight: 700, 
                  fontSize: '18px',
                  color: colours.light.text
                } 
              }}
            />
            <div style={{ marginLeft: 'auto' }}>
              {entry.status.toLowerCase() === 'approved' && (
                <div className={statusBadgeStyle('approved')}>Approved</div>
              )}
              {entry.status.toLowerCase() === 'rejected' && (
                <div className={statusBadgeStyle('rejected')}>Rejected</div>
              )}
              {entry.status.toLowerCase() === 'requested' && (
                <div className={statusBadgeStyle('requested')}>Pending Review</div>
              )}
            </div>
          </div>
        </div>

        {/* Critical Information Grid */}
        <div className={criticalInfoStyle}>
          <div className={infoCardStyle}>
            <div className={infoLabelStyle}>Request Period</div>
            <div className={infoValueStyle}>{formatDateRange(entry.start_date, entry.end_date)}</div>
          </div>
          
          <div className={infoCardStyle}>
            <div className={infoLabelStyle}>Business Days</div>
            <div className={infoValueStyle}>{requestDays} days</div>
          </div>
          
          <div className={infoCardStyle}>
            <div className={infoLabelStyle}>FY Days Taken</div>
            <div className={infoValueStyle}>{daysSoFar} / {entitlement}</div>
          </div>
          
          <div className={infoCardStyle}>
            <div className={infoLabelStyle}>Remaining After</div>
            <div className={infoValueStyle} style={{ 
              color: daysRemaining < 0 ? '#dc2626' : colours.light.text 
            }}>
              {daysRemaining} days
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {entry.reason?.trim() && (
          <>
            <div className={sectionTitleStyle}>Request Notes</div>
            <div className={notesStyle}>
              "{entry.reason}"
            </div>
          </>
        )}

        {/* Hearing Information */}
        {entry.hearing_confirmation !== undefined && (
          <>
            <div className={sectionTitleStyle}>Hearing Confirmation</div>
            <div className={notesStyle}>
              <strong>
                {(() => {
                  const hc = entry.hearing_confirmation;
                  if (typeof hc === 'boolean') {
                    return hc ? '✓ No hearings during absence' : '⚠ Hearings may be affected';
                  }
                  if (typeof hc === 'string') {
                    const s = hc.trim();
                    const lower = s.toLowerCase();
                    if (lower === 'yes') return '✓ No hearings during absence';
                    if (lower === 'no') return '⚠ Hearings may be affected';
                    // Show the provided confirmation text as-is when not a yes/no token
                    return s;
                  }
                  return '';
                })()}
              </strong>
              {(() => {
                const hc = entry.hearing_confirmation;
                const hasDetails = !!entry.hearing_details;
                const lower = typeof hc === 'string' ? hc.trim().toLowerCase() : '';
                const needsDetails = hc === false || hc === null || lower === 'no' || (typeof hc === 'string' && lower !== 'yes' && lower !== 'no');
                return hasDetails && needsDetails ? (
                  <div style={{ marginTop: '8px', fontStyle: 'normal' }}>
                    <strong>Details:</strong> {entry.hearing_details}
                  </div>
                ) : null;
              })()}
            </div>
          </>
        )}

        {/* Team Conflicts */}
        <div className={sectionTitleStyle}>Team Coverage Analysis</div>
        {conflicts.length > 0 ? (
          <div className={conflictsGridStyle}>
            {conflicts.map((conflict, idx) => (
              <div key={idx} className={conflictCardStyle}>
                <Persona
                  imageUrl={HelixAvatar}
                  text={getNickname(conflict.person)}
                  size={PersonaSize.size32}
                  styles={{ 
                    primaryText: { 
                      fontWeight: 600, 
                      fontSize: '14px',
                      color: colours.light.text
                    } 
                  }}
                />
                <div style={{ marginTop: '8px', fontSize: '12px', color: colours.greyText }}>
                  {formatDateRange(conflict.start_date, conflict.end_date)}
                </div>
                <div style={{ 
                  marginTop: '4px', 
                  fontSize: '11px', 
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: conflict.status === 'booked' ? '#16a34a' : '#ea580c'
                }}>
                  {conflict.status}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={notesStyle} style={{ color: '#16a34a', fontStyle: 'normal' }}>
            ✓ No team conflicts identified
          </div>
        )}

        {/* Action Buttons */}
        {entry.status.toLowerCase() === 'requested' && (
          <>
            <div className={actionButtonsStyle}>
              <DefaultButton
                text={isProcessing ? 'Processing...' : 'Approve Request'}
                onClick={() => handleAction('approve')}
                disabled={isProcessing}
                className={approveButtonStyle}
                iconProps={{ 
                  iconName: 'CheckMark',
                  styles: { root: { color: '#fff', fontSize: '14px' } }
                }}
              />
              <DefaultButton
                text={isProcessing ? 'Processing...' : 'Reject Request'}
                onClick={() => handleAction('reject')}
                disabled={isProcessing}
                className={rejectButtonStyle}
                iconProps={{ 
                  iconName: 'Cancel',
                  styles: { root: { color: '#fff', fontSize: '14px' } }
                }}
              />
            </div>

            <div className={rejectionNotesStyle}>
              <TextField
                label="Rejection Reason (required for rejections)"
                placeholder="Provide clear reasoning for rejection..."
                value={localRejection}
                onChange={(e, val) => setLocalRejection(val || '')}
                multiline
                rows={3}
                styles={{
                  fieldGroup: {
                    borderRadius: '8px',
                    border: `2px solid ${colours.light.border}`,
                  }
                }}
              />
            </div>
          </>
        )}

        {/* Confirmation Message */}
        {confirmationMessage && (
          <div style={{ 
            marginTop: '16px', 
            padding: '12px', 
            borderRadius: '8px',
            backgroundColor: confirmationMessage.includes('✓') ? '#f0f9ff' : 
                            confirmationMessage.includes('❌') ? '#fef2f2' : '#fffbeb',
            border: `1px solid ${
              confirmationMessage.includes('✓') ? '#0ea5e9' : 
              confirmationMessage.includes('❌') ? '#ef4444' : '#f59e0b'
            }`,
            color: confirmationMessage.includes('✓') ? '#0c4a6e' : 
                   confirmationMessage.includes('❌') ? '#7f1d1d' : '#92400e',
            fontWeight: 600,
            textAlign: 'center'
          }}>
            {confirmationMessage}
          </div>
        )}
      </div>
    );
  };

  const modalJsx = (
    <div 
      className={formContainerStyle}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Modal Content */}
      <div className={modalContentStyle} onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button 
          className={closeButtonStyle}
          onClick={onClose}
          aria-label="Close"
        >
          ✕
        </button>

        {approvals.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            fontSize: '18px',
            color: colours.greyText
          }}>
            <PiTreePalm style={{ fontSize: '48px', marginBottom: '16px', color: colours.green }} />
            <div>No leave requests to review</div>
            <div style={{ fontSize: '14px', marginTop: '8px' }}>
              All annual leave requests have been processed.
            </div>
          </div>
        ) : (
          <Stack tokens={{ childrenGap: 24 }}>
            <div style={{
              fontSize: '24px',
              fontWeight: 700,
              color: colours.light.text,
              textAlign: 'center',
              marginBottom: '8px'
            }}>
              Annual Leave Approvals
            </div>
            <div style={{
              fontSize: '14px',
              color: colours.greyText,
              textAlign: 'center',
              marginBottom: '16px'
            }}>
              {approvals.length} request{approvals.length !== 1 ? 's' : ''} require{approvals.length === 1 ? 's' : ''} your review
            </div>
            
            {approvals.map(entry => (
              <ApprovalCard key={entry.request_id ? String(entry.request_id) : entry.id} entry={entry} />
            ))}
          </Stack>
        )}
      </div>
    </div>
  );
  
  // Render inline until portal is ready, then via portal
  if (!portalEl) return modalJsx;
  return createPortal(modalJsx, portalEl);
};

export default AnnualLeaveApprovals;