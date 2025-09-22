import React, { useState, useEffect } from 'react';
import { Icon, Dropdown, IDropdownOption } from '@fluentui/react';
import { Enquiry } from '../../app/functionality/types';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import { parseISO, isToday, format } from 'date-fns';

// Live breakdown: Y, M, W, D, H, with minutes for same day and seconds if under 1 hour
function formatLiveBreakdown(from: Date, now: Date = new Date()): string {
  let diff = Math.max(0, Math.floor((now.getTime() - from.getTime()) / 1000));
  const totalSeconds = diff;
  const S = diff % 60; diff = Math.floor(diff / 60);
  const M = diff % 60; diff = Math.floor(diff / 60);
  const H = diff % 24; diff = Math.floor(diff / 24);
  const D = diff % 7; diff = Math.floor(diff / 7);
  const W = diff % 4; diff = Math.floor(diff / 4);
  const Mo = diff % 12; diff = Math.floor(diff / 12);
  const Y = diff;
  
  const parts = [];
  const isUnderOneHour = totalSeconds < 3600; // Less than 1 hour
  const isSameDay = from.toDateString() === now.toDateString(); // Same calendar day
  
  if (Y) parts.push(Y + 'Y');
  if (Mo) parts.push(Mo + 'M');
  if (W) parts.push(W + 'W');
  if (D) parts.push(D + 'D');
  if (H) parts.push(H + 'H');
  
  // Show minutes if same day
  if (isSameDay && M) parts.push(M + 'M');
  
  // Show seconds if under 1 hour
  if (isUnderOneHour && S) parts.push(S + 'S');
  
  // If no time parts, show "0H" instead of nothing
  if (parts.length === 0) parts.push('0H');
  
  return parts.join(' ');
}

/**
 * Live ticking badge showing multi-unit age (Y M W D H M S).
 */
function LiveEnquiryAgeBadge({ enquiry }: { enquiry: Enquiry | any }) {
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const rawTs: string | undefined = (enquiry as any).datetime || enquiry.Date_Created || (enquiry as any).Touchpoint_Date;
  if (!rawTs) return null;
  
  let dateObj: Date | null = null;
  try {
    dateObj = parseISO(rawTs);
    if (isNaN(dateObj.getTime())) dateObj = new Date(rawTs);
  } catch {
    try { dateObj = new Date(rawTs); } catch { dateObj = null; }
  }
  if (!dateObj || isNaN(dateObj.getTime())) return null;

  const liveStr = formatLiveBreakdown(dateObj, now);
  return (
    <span
      style={{
        fontSize: 9,
        color: '#b0b8c9',
        fontWeight: 600,
        letterSpacing: 0.8,
        userSelect: 'all',
        fontFamily: 'Consolas, Monaco, monospace',
        background: 'rgba(180,200,255,0.15)',
        borderRadius: 4,
        padding: '1px 4px',
        display: 'inline-block',
        whiteSpace: 'nowrap',
        verticalAlign: 'middle',
        opacity: 0.9
      }}
      title={format(dateObj, 'yyyy-MM-dd HH:mm')}
    >{liveStr}</span>
  );
}

interface TeamDataRec {
  Email?: string;
  Initials?: string;
  'Full Name'?: string;
}

interface Props {
  enquiry: Enquiry & { __sourceType?: 'new' | 'legacy' };
  claimer?: TeamDataRec | undefined;
  isClaimed?: boolean;
  showPulse?: boolean;
  onAreaChange?: (enquiryId: string, newArea: string) => void | Promise<void>;
}

/**
 * EnquiryBadge
 * Clean, unified pill component for the top-right badge area with cascade animation.
 * Apple-style single container housing area + dates + claimer.
 */
const EnquiryBadge: React.FC<Props> = ({ 
  enquiry, 
  claimer, 
  isClaimed = false,
  showPulse = false,
  onAreaChange
}) => {
  const { isDarkMode } = useTheme();
  const [isVisible, setIsVisible] = useState(false);
  const [showAreaDropdown, setShowAreaDropdown] = useState(false);

  // Cascade animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearInterval(timer);
  }, []);

  const areaOptions: IDropdownOption[] = [
    { key: 'Commercial', text: 'Commercial', data: { icon: 'CityNext', color: colours.blue } },
    { key: 'Construction', text: 'Construction', data: { icon: 'Build', color: colours.orange } },
    { key: 'Property', text: 'Property', data: { icon: 'Home', color: colours.green } },
    { key: 'Employment', text: 'Employment', data: { icon: 'People', color: colours.yellow } },
  ];

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const d = new Date(dateStr);
      const nowYear = new Date().getFullYear();
      return d.toLocaleDateString('en-GB', d.getFullYear() === nowYear ? { day: '2-digit', month: 'short' } : { day: '2-digit', month: 'short', year: 'numeric' });
    } catch { return dateStr; }
  };

  const areaColor = (() => {
    switch (enquiry.Area_of_Work?.toLowerCase()) {
      case 'commercial': return colours.blue;
      case 'construction': return colours.orange;
      case 'property': return colours.green;
      case 'employment': return colours.yellow;
      default: return colours.cta;
    }
  })();

  const areaIconName = (() => {
    const a = enquiry.Area_of_Work?.toLowerCase();
    switch (a) {
      case 'commercial': return 'CityNext'; // Commercial law - business/work
      case 'construction': return 'Build';
      case 'property': return 'Home';
      case 'employment': return 'People';
      default: return 'Tag';
    }
  })();

  const isNewData = enquiry.__sourceType === 'new' || ((enquiry as any).datetime && (enquiry as any).claim);

  return (
    <>
      {/* Single unified pill container - compact design */}
      <div style={{ 
        position: 'absolute', 
        top: 12, 
        right: 12, 
        display: 'flex', 
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 20,
        background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.05)',
        backdropFilter: 'blur(8px)',
        border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
        fontSize: 10,
        fontWeight: 600,
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateX(0) scale(1)' : 'translateX(20px) scale(0.95)',
        transition: 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1), transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        zIndex: 2 // ensure above decorative watermark ::after
      }}>
        {/* Area icon + label - clickable for reassignment */}
        {enquiry.Area_of_Work && (
          <div style={{ position: 'relative' }}>
            {showAreaDropdown ? (
              <Dropdown
                options={areaOptions}
                selectedKey={enquiry.Area_of_Work}
                onChange={(_, option) => {
                  if (option && onAreaChange) {
                    onAreaChange(enquiry.ID, option.key as string);
                    setShowAreaDropdown(false);
                  }
                }}
                onDismiss={() => setShowAreaDropdown(false)}
                styles={{
                  dropdown: { 
                    width: 120, 
                    fontSize: 10,
                    background: isDarkMode ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(8px)'
                  },
                  title: { 
                    fontSize: 10, 
                    fontWeight: 600,
                    background: 'transparent',
                    border: 'none',
                    color: areaColor
                  }
                }}
              />
            ) : (
              <div 
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 3,
                  color: areaColor,
                  cursor: onAreaChange ? 'pointer' : 'default',
                  position: 'relative',
                  padding: '2px 3px',
                  borderRadius: 4,
                  transition: 'all 0.2s ease'
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (onAreaChange) setShowAreaDropdown(true);
                }}
                onMouseEnter={(e) => {
                  if (onAreaChange) {
                    e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <Icon iconName={areaIconName} styles={{ root: { fontSize: 11, opacity: .9 } }} />
                <span style={{ textTransform: 'uppercase', letterSpacing: 0.3, fontSize: 9 }}>
                  {enquiry.Area_of_Work}
                </span>
                {onAreaChange && (
                  <Icon iconName="ChevronDown" styles={{ 
                    root: { 
                      fontSize: 7, 
                      opacity: 0.6,
                      marginLeft: 1
                    } 
                  }} />
                )}
                {/* Pulse dot for unclaimed only */}
                {showPulse && !isClaimed && (
                  <span style={{ position:'relative', width:12, height:12, marginLeft:4, display:'inline-flex', alignItems:'center', justifyContent:'center' }}>
                    <span
                      style={{
                        position:'absolute',
                        width:12,
                        height:12,
                        borderRadius:'50%',
                        background: areaColor + '22',
                        animation:'pulseEnquiry 1.8s ease-in-out infinite',
                        boxShadow:`0 0 0 0 ${areaColor}55`,
                        transformOrigin:'center',
                      }}
                    />
                    <span
                      style={{
                        position:'relative',
                        width:6,
                        height:6,
                        borderRadius:'50%',
                        background: areaColor,
                        boxShadow:`0 0 0 2px ${isDarkMode? 'rgba(0,0,0,0.4)':'#ffffff'}`,
                      }}
                    />
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Separator dot - more subtle */}
        {enquiry.Area_of_Work && (
          <span style={{ 
            width: 2, 
            height: 2, 
            borderRadius: '50%', 
            background: isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)' 
          }} />
        )}

        {/* Date section - timeline effect for claimed new data */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 4,
          flexShrink: 0,
          whiteSpace: 'nowrap',
          color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)'
        }}>
          {isClaimed ? (
            // Claimed: timeline effect for new, single date + tick for legacy
            isNewData ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <span title="Enquiry received" style={{ opacity: 0.8, whiteSpace: 'nowrap' }}>
                  {formatDate((enquiry as any).datetime)}
                </span>
                <Icon iconName="ChevronRight" styles={{ root: { fontSize: 8, opacity: 0.5 } }} />
                <span title="Claimed" style={{ opacity: 1, whiteSpace: 'nowrap' }}>
                  {formatDate((enquiry as any).claim)}
                </span>
                {/* Show time taken to claim */}
                {(() => {
                  try {
                    const enquiryDate = new Date((enquiry as any).datetime);
                    const claimDate = new Date((enquiry as any).claim);
                    if (!isNaN(enquiryDate.getTime()) && !isNaN(claimDate.getTime())) {
                      const timeTaken = formatLiveBreakdown(enquiryDate, claimDate);
                      return (
                        <span
                          style={{
                            fontSize: 9,
                            color: '#b0b8c9',
                            fontWeight: 600,
                            letterSpacing: 0.8,
                            fontFamily: 'Consolas, Monaco, monospace',
                            background: 'rgba(180,200,255,0.15)',
                            borderRadius: 4,
                            padding: '1px 4px',
                            opacity: 0.9,
                            marginLeft: 4
                          }}
                          title={`Time taken to claim: ${timeTaken}`}
                        >
                          {timeTaken}
                        </span>
                      );
                    }
                  } catch {}
                  return null;
                })()}
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                <span style={{ whiteSpace: 'nowrap' }}>{formatDate(enquiry.Touchpoint_Date)}</span>
                <Icon iconName="CheckMark" styles={{ root: { fontSize: 10, color: colours.blue } }} />
              </div>
            )
          ) : (
            // Unclaimed: just the enquiry date + live age
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              <span style={{ whiteSpace: 'nowrap' }}>{formatDate(isNewData ? (enquiry as any).datetime : enquiry.Touchpoint_Date)}</span>
              {!isClaimed && <LiveEnquiryAgeBadge enquiry={enquiry} />}
            </div>
          )}
        </div>

        {/* Claimer initials */}
        {claimer && (
          <>
            <span style={{ 
              width: 2, 
              height: 2, 
              borderRadius: '50%', 
              background: isDarkMode ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' 
            }} />
            <div style={{ 
              width: 20, 
              height: 20, 
              borderRadius: '50%', 
              background: colours.blue + '20',
              color: colours.blue, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontWeight: 700, 
              fontSize: 9,
              border: `1px solid ${colours.blue}40`
            }}>
              {claimer.Initials || claimer.Email?.split('@')[0]?.slice(0,2).toUpperCase()}
            </div>
          </>
        )}
      </div>

      {/* Inject pulse keyframes once */}
      {showPulse && (() => {
        if (typeof document !== 'undefined' && !document.getElementById('pulseEnquiryKeyframes')) {
          const styleEl = document.createElement('style');
          styleEl.id = 'pulseEnquiryKeyframes';
          styleEl.textContent = '@keyframes pulseEnquiry {0%{transform:scale(.85);opacity:.6}50%{transform:scale(1.25);opacity:1}100%{transform:scale(.85);opacity:.6}}';
          document.head.appendChild(styleEl);
        }
        return null;
      })()}
    </>
  );
};

export default EnquiryBadge;
