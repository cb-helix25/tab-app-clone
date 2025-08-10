import {
    Text,
    Icon,
} from '@fluentui/react';
import { mergeStyles, keyframes } from '@fluentui/react/lib/Styling';
import { Enquiry } from '../../app/functionality/types';
import { colours } from '../../app/styles/colours';
import RatingIndicator from './RatingIndicator';
import { useTheme } from '../../app/functionality/ThemeContext';

import React, { useState } from 'react';

// Animation keyframes for action drop-in
const dropInAnimation = keyframes({
  '0%': {
    opacity: 0,
    transform: 'translateY(-8px) scale(0.95)',
  },
  '100%': {
    opacity: 1,
    transform: 'translateY(0) scale(1)',
  },
});

const dropInCascadeAnimation = keyframes({
  '0%': {
    opacity: 0,
    transform: 'translateY(-6px) scale(0.9)',
  },
  '100%': {
    opacity: 1,
    transform: 'translateY(0) scale(1)',
  },
});

// Add CSS animation styles to the document head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    @keyframes dropIn {
      0% {
        opacity: 0;
        transform: translateY(-8px) scale(0.95);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    
    @keyframes dropInCascade {
      0% {
        opacity: 0;
        transform: translateY(-6px) scale(0.9);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
  `;
  document.head.appendChild(style);
}

// Utility for copying text and showing feedback
function useCopyToClipboard(timeout = 1200): [boolean, (text: string) => void] {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    if (navigator && navigator.clipboard) {
      navigator.clipboard.writeText(text).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), timeout);
      });
    }
  };
  return [copied, copy];
}

interface CopyableTextProps {
  value: string;
  className?: string;
  label?: string;
}

const CopyableText: React.FC<CopyableTextProps> = ({ value, className, label }) => {
  const [copied, copy] = useCopyToClipboard();
  return (
    <span
      className={className}
      title={copied ? `${label || 'Value'} copied!` : `Click to copy ${label || 'value'}`}
      onClick={e => {
        e.stopPropagation();
        copy(value);
      }}
      style={{ display: 'inline-block', position: 'relative' }}
    >
      {value}
      {copied && (
        <span style={{
          position: 'absolute',
          left: '100%',
          top: 0,
          marginLeft: 8,
          fontSize: 12,
          color: '#43a047',
          background: '#fff',
          borderRadius: 3,
          padding: '2px 6px',
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
          zIndex: 10,
        }}>
          Copied!
        </span>
      )}
    </span>
  );
};


interface TeamData {
  'Created Date'?: string;
  'Created Time'?: string;
  'Full Name'?: string;
  'Last'?: string;
  'First'?: string;
  'Nickname'?: string;
  'Initials'?: string;
  'Email'?: string;
  'Entra ID'?: string;
  'Clio ID'?: string;
  'Rate'?: number;
  'Role'?: string;
  'AOW'?: string;
}

interface EnquiryLineItemProps {
  enquiry: Enquiry;
  onSelect: (enquiry: Enquiry) => void;
  onRate: (enquiryId: string) => void;
  onPitch?: (enquiry: Enquiry) => void;
  teamData?: TeamData[] | null;
  isLast?: boolean;
  userAOW?: string[]; // List of user's areas of work (lowercase)
  /**
   * Flag indicating this enquiry originated from the new direct getEnquiries route (not legacy/space data).
   * Used for transitional UI (e.g., pulsing claim indicator) before full component split.
   */
  isNewSource?: boolean;
}

const formatCurrency = (value: string): string => {
  const regex = /(?:£)?(\d{1,3}(?:,\d{3})*)(?: to £?(\d{1,3}(?:,\d{3})*))?/;
  const matches = value.match(regex);
  if (!matches) return value;

  return matches
    .slice(1)
    .filter(Boolean)
    .map((num) =>
      num.includes('£')
        ? num.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,')
        : `£${parseInt(num.replace(/,/g, ''), 10).toLocaleString()}`
    )
    .join(' to ');
};

const getAreaColor = (area: string): string => {
  switch (area?.toLowerCase()) {
    case 'commercial':
      return colours.blue;
    case 'construction':
      return colours.orange;
    case 'property':
      return colours.green;
    case 'employment':
      return colours.yellow;
    default:
      return colours.cta;
  }
};

const EnquiryLineItem: React.FC<EnquiryLineItemProps> = ({
  enquiry,
  onSelect,
  onRate,
  onPitch,
  teamData,
  isLast,
  userAOW,
  isNewSource = false,
}) => {
  const { isDarkMode } = useTheme();

  // State for global notes reveal (hidden until chevron on far right is clicked)
  const [notesExpanded, setNotesExpanded] = useState(false);

  // Notes formatting helpers
  const normalizeNotes = (raw: string): string => {
    let s = raw.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
    s = s.replace(/\n{3,}/g, '\n\n');
    return s.trim();
  };

  const hasNotes = enquiry.Initial_first_call_notes && enquiry.Initial_first_call_notes.trim().length > 0;

  // Simple notes renderer (full notes only shown when parent notesExpanded is true)
  const NotesBlock = ({ notes }: { notes: string }) => {
    if (!notes.trim()) return null;
    return (
      <div style={{
        fontSize: '13px',
        lineHeight: '1.45',
        color: isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.75)',
        whiteSpace: 'pre-line',
      }}>
        {normalizeNotes(notes)}
      </div>
    );
  };

  // Check if claimed
  const lowerPOC = enquiry.Point_of_Contact?.toLowerCase() || '';
  // Unclaimed criteria: ONLY team@helix-law.com (legacy distribution lists removed)
  const isClaimed = lowerPOC !== 'team@helix-law.com' && !!lowerPOC;

  // Get claimer info
  const claimer = isClaimed
    ? teamData?.find((t) => t.Email?.toLowerCase() === lowerPOC)
    : undefined;

  const handleClick = () => {
    onSelect(enquiry);
  };

  const formatDate = (dateStr: string): string => {
    try {
      const d = new Date(dateStr);
      const nowYear = new Date().getFullYear();
      const year = d.getFullYear();
      const opts: Intl.DateTimeFormatOptions = year === nowYear
        ? { day: '2-digit', month: 'short' }
        : { day: '2-digit', month: 'short', year: 'numeric' };
      return d.toLocaleDateString('en-GB', opts);
    } catch {
      return dateStr;
    }
  };

  // Determine if this enquiry should be greyed out (not in user's AOW)
  let isGreyedOut = false;
  if (userAOW && userAOW.length > 0 && enquiry.Area_of_Work) {
    const area = enquiry.Area_of_Work.toLowerCase();
    const hasFullAccess = userAOW.some(a => a.includes('operations') || a.includes('tech'));
    if (!hasFullAccess) {
      isGreyedOut = !userAOW.some(a => a === area || a.includes(area) || area.includes(a));
    }
  }

  const lineItemStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    padding: '8px 20px',
    borderBottom: 'none', // Border now handled by the container or notes section
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'Raleway, sans-serif',
    minHeight: '44px',
    position: 'relative',
    backgroundColor: isGreyedOut ? (isDarkMode ? '#23272e' : '#f3f3f3') : 'transparent',
    opacity: isGreyedOut ? 0.5 : 1,
    filter: isGreyedOut ? 'grayscale(0.7)' : 'none',
    pointerEvents: isGreyedOut ? 'auto' : 'auto',
    selectors: {
      ':hover': {
        backgroundColor: isGreyedOut ? (isDarkMode ? '#23272e' : '#f3f3f3') : 'transparent',
        transform: 'translateX(2px)',
      },
      ':active': {
        transform: 'translateX(1px)',
      },
      '::before': {
        content: '""',
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 2,
        background: getAreaColor(enquiry.Area_of_Work),
        zIndex: 2,
        height: '100%',
        opacity: 0.6,
        transition: 'all 0.15s ease',
      },
      ':hover::before': {
        width: 3,
        opacity: 1,
      },
    },
  });

  // Animation + style for pulsing "claim me" indicator (new source, unclaimed only)
  const pulse = keyframes({
    '0%': { transform: 'scale(0.85)', opacity: 0.55 },
    '50%': { transform: 'scale(1.35)', opacity: 1 },
    '100%': { transform: 'scale(0.85)', opacity: 0.55 },
  });

  const pulseDotInlineStyle = (areaColor: string) => mergeStyles({
    width: 8,
    height: 8,
    borderRadius: '50%',
    backgroundColor: areaColor,
    boxShadow: `0 0 0 4px ${areaColor}30`,
    animationName: pulse,
    animationDuration: '1.8s',
    animationIterationCount: 'infinite',
    animationTimingFunction: 'ease-in-out',
    flexShrink: 0,
  });

  // Grid columns (left to right):
  // 1. Name & Company
  // 2. Contact (Email / Phone)
  // 3. Area & Value
  // 4. Date & ID
  // 5. Claimed Status
  // 6. Actions
  // mainContentStyle now computed later once isClaimed known
  // ...existing code...

  const nameStyle = mergeStyles({
    fontWeight: '500',
    fontSize: '14px',
    color: isDarkMode ? colours.dark.text : colours.light.text,
    marginBottom: '2px',
    userSelect: 'text',
    cursor: 'copy',
    transition: 'color 0.2s',
    ':hover': {
      color: colours.highlight,
    },
  });

  const companyStyle = mergeStyles({
    fontSize: '12px',
    color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
    marginBottom: '1px',
    fontWeight: '500',
  });

  const emailStyle = mergeStyles({
    fontSize: '11px',
    color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
    userSelect: 'text',
    cursor: 'copy',
    transition: 'color 0.2s',
    fontWeight: '500',
    ':hover': {
      color: colours.highlight,
    },
  });

  const metaStyle = mergeStyles({
    fontSize: '13px',
    color: isDarkMode ? colours.dark.text : colours.light.text,
    fontWeight: '500',
  });

  const valueStyle = mergeStyles({
    fontSize: '12px',
    color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
    fontWeight: '500',
  });

  const dateStyle = mergeStyles({
    fontSize: '12px',
    color: isDarkMode ? colours.dark.text : colours.light.text,
    fontWeight: '500',
  });

  const actionsStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  });

  const claimerBadgeStyle = mergeStyles({
    fontSize: '10px',
    color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
    fontWeight: '500',
    marginTop: '1px',
  });

  // Unified pill styles for claimed / unclaimed to match grouped card aesthetic
  const claimStatusPillStyle = (claimed: boolean) => mergeStyles({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
    padding: '4px 10px',
    borderRadius: 16,
    fontSize: 10,
    fontWeight: 600,
    letterSpacing: '0.3px',
    background: claimed
      ? (isDarkMode ? 'rgba(102,170,232,0.12)' : 'rgba(102,170,232,0.12)')
      : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
    color: claimed
      ? colours.highlight
      : (isDarkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)'),
    border: claimed
      ? `1px solid ${colours.highlight}50`
      : `1px solid ${isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
    minWidth: 68,
    justifyContent: 'center'
  });

  const actionBadgeStyle = mergeStyles({
    backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
    color: isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)',
    border: 'none',
    borderRadius: 4,
    padding: '4px 10px',
    fontSize: '10px',
    fontWeight: '600',
    fontFamily: 'Raleway, sans-serif',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: 'none',
    height: '24px',
    minWidth: '35px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    whiteSpace: 'nowrap',
    selectors: {
      ':hover': {
        backgroundColor: 'rgba(102, 170, 232, 0.15)',
        color: colours.highlight,
        transform: 'translateY(-0.5px)',
      },
      ':active': {
        transform: 'translateY(0)',
      },
    },
  });

  const pitchButtonStyle = mergeStyles({
    backgroundColor: colours.highlight,
    color: 'white',
    border: 'none',
    borderRadius: 4,
    padding: '4px 14px',
    fontSize: '10px',
    fontWeight: '600',
    fontFamily: 'Raleway, sans-serif',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: 'none',
    height: '24px',
    minWidth: '52px',
    whiteSpace: 'nowrap',
    selectors: {
      ':hover:not(:disabled)': {
        backgroundColor: colours.blue,
        transform: 'translateY(-0.5px)',
      },
      ':active:not(:disabled)': {
        transform: 'translateY(0)',
      },
      ':disabled': {
        backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
        color: isDarkMode ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
        cursor: 'not-allowed',
      },
    },
  });

  const ratingBadgeStyle = (rating?: string) => mergeStyles({
    backgroundColor: rating 
      ? (rating === 'Good' ? 'rgba(102, 170, 232, 0.15)' : 
         rating === 'Neutral' ? 'rgba(128, 128, 128, 0.15)' : 'rgba(244, 67, 54, 0.15)')
      : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'),
    color: rating 
      ? (rating === 'Good' ? colours.blue : 
         rating === 'Neutral' ? colours.grey : colours.cta)
      : (isDarkMode ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'),
    border: 'none',
    borderRadius: 4,
    padding: '4px 10px',
    fontSize: '10px',
    fontWeight: '600',
    fontFamily: 'Raleway, sans-serif',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: 'none',
    height: '24px',
    minWidth: '35px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    whiteSpace: 'nowrap',
    selectors: {
      ':hover': {
        backgroundColor: rating 
          ? (rating === 'Good' ? 'rgba(102, 170, 232, 0.25)' : 
             rating === 'Neutral' ? 'rgba(128, 128, 128, 0.25)' : 'rgba(244, 67, 54, 0.25)')
          : 'rgba(102, 170, 232, 0.15)',
        color: rating 
          ? (rating === 'Good' ? colours.blue : 
             rating === 'Neutral' ? colours.grey : colours.cta)
          : colours.highlight,
        transform: 'translateY(-0.5px)',
      },
      ':active': {
        transform: 'translateY(0)',
      },
    },
  });

  // Standalone pulse indicator removed; pulse now lives inline inside area-of-work pill when unclaimed
  const showPulseClaimIndicator = false;

  // --- Unclaimed legacy card state (hooks must be top-level) ---
  const [unclaimedSelected, setUnclaimedSelected] = useState(false);
  const [unclaimedShowActions, setUnclaimedShowActions] = useState(false);
  const [unclaimedHasAnimatedActions, setUnclaimedHasAnimatedActions] = useState(false);
  const [unclaimedExpanded, setUnclaimedExpanded] = useState(false);
  const unclaimedClampRef = React.useRef<HTMLDivElement>(null);
  const [unclaimedIsOverflowing, setUnclaimedIsOverflowing] = useState(false);
  React.useEffect(() => {
    if (!isClaimed) {
      if (!unclaimedExpanded && unclaimedClampRef.current) {
        const el = unclaimedClampRef.current;
        const overflowing = el.scrollHeight > el.clientHeight + 1;
        setUnclaimedIsOverflowing(overflowing);
      } else if (unclaimedExpanded) {
        setUnclaimedIsOverflowing(false);
      }
    }
  }, [isClaimed, unclaimedExpanded, enquiry.Initial_first_call_notes]);

  // --- Unclaimed legacy card rendering ---
  if (!isClaimed) {
    // ...existing cardStyle, pulseDot, formatNotesRich, etc. definitions, but use the top-level state variables...
    const cardStyle = mergeStyles({
      position: 'relative',
      borderRadius: 5,
      padding: '14px 18px 14px 22px',
      background: isDarkMode ? '#1f2732' : '#ffffff',
      border: `1px solid ${unclaimedSelected ? colours.blue : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
      boxShadow: isDarkMode
        ? '0 4px 16px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.04)'
        : '0 4px 14px rgba(33,56,82,0.10)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
      fontFamily: 'Raleway, sans-serif',
      cursor: 'pointer',
      transition: 'border-color .2s, transform .15s',
      marginBottom: !isLast ? 4 : 0,
      overflow: 'hidden',
      selectors: {
        ':hover': { transform: 'translateY(-2px)', borderColor: unclaimedSelected ? colours.blue : colours.highlight },
        ':active': { transform: 'translateY(-1px)' },
        '::before': {
          content: '""',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 2,
          background: getAreaColor(enquiry.Area_of_Work),
          zIndex: 2,
          height: '100%',
          opacity: 0.6,
          transition: 'all 0.15s ease',
        },
        ':hover::before': {
          width: 3,
          opacity: 1,
        },
      },
    });
    if (typeof document !== 'undefined' && !document.getElementById('pulseLegacyUnclaimedStyles')) {
      const styleEl = document.createElement('style');
      styleEl.id = 'pulseLegacyUnclaimedStyles';
      styleEl.textContent = '@keyframes pulseLegacyUnclaimed {0%{transform:scale(.85);opacity:.55}50%{transform:scale(1.3);opacity:1}100%{transform:scale(.85);opacity:.55}}';
      document.head.appendChild(styleEl);
    }
    const areaColor = getAreaColor(enquiry.Area_of_Work || '');
    const pulseDot = mergeStyles({
      width: 9,
      height: 9,
      minWidth: 9,
      minHeight: 9,
      borderRadius: '50%',
      background: areaColor,
      boxShadow: `0 0 0 6px ${areaColor}44`,
      animation: 'pulseLegacyUnclaimed 1.8s ease-in-out infinite',
      display: 'inline-block',
      verticalAlign: 'middle',
      marginLeft: 4,
      flexShrink: 0,
    });
    const formatNotesRich = (notes: string): React.ReactNode => {
      const cleaned = normalizeNotes(notes);
      const blocks = cleaned.split(/\n{2,}/).slice(0, 12);
      return blocks.map((b, idx) => {
        const lines = b.split(/\n/).map(l => l.trim()).filter(Boolean);
        const bulletPattern = /^(?:[•\-*]|\u2022)\s?/;
        const numberedPattern = /^\d+[.)]/;
        const bulletLines = lines.filter(l => bulletPattern.test(l));
        const numberedLines = lines.filter(l => numberedPattern.test(l));
        const asList = (bulletLines.length && bulletLines.length >= lines.length / 2) || (numberedLines.length && numberedLines.length >= lines.length / 2);
        if (asList) {
          return (
            <ul key={idx} style={{ margin: '0 0 8px 18px', padding: 0, listStyle: bulletLines.length ? 'disc' : 'decimal' }}>
              {lines.map((l, li) => <li key={li}>{l.replace(bulletPattern, '').replace(numberedPattern, '').trim()}</li>)}
            </ul>
          );
        }
        return <p key={idx} style={{ margin: '0 0 8px 0', whiteSpace: 'pre-line' }}>{lines.join('\n')}</p>;
      });
    };
    return (
      <div
        className={cardStyle}
        onMouseEnter={() => {
          if (!unclaimedHasAnimatedActions) {
            setUnclaimedShowActions(true);
            setUnclaimedHasAnimatedActions(true);
          } else {
            setUnclaimedShowActions(true);
          }
        }}
        onMouseLeave={() => {
          if (!unclaimedSelected) setUnclaimedShowActions(false);
        }}
        onClick={() => {
          setUnclaimedSelected(true);
          if (!unclaimedHasAnimatedActions) {
            setUnclaimedShowActions(true); setUnclaimedHasAnimatedActions(true);
          }
          onSelect(enquiry);
        }}
        role="article"
        tabIndex={0}
        aria-label="Unclaimed enquiry (legacy data)"
        aria-pressed={unclaimedSelected}
      >
        {/* Top-right badge: area + pulse + static date */}
        {enquiry.Area_of_Work && (
          <span style={{ position: 'absolute', top: 18, right: 14, display: 'flex', alignItems: 'flex-end', zIndex: 2 }}>
            <span style={{
              display: 'flex', alignItems: 'center', gap: 7, fontSize: 10, padding: '2px 10px 2px 8px', borderRadius: 12,
              background: 'rgba(102,170,232,0.15)', color: areaColor, fontWeight: 600, letterSpacing: .3, textTransform: 'uppercase',
              boxShadow: '0 1px 4px 0 rgba(33,56,82,0.07)', position: 'relative'
            }}>
              {enquiry.Area_of_Work}
              <span className={pulseDot} aria-hidden="true" />
              <span style={{ fontSize: 10, color: '#b0b8c9', fontWeight: 600 }}>{formatDate(enquiry.Touchpoint_Date)}</span>
            </span>
          </span>
        )}
        {/* Name + inline ID */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
          <Text variant="medium" styles={{ root: { fontWeight: 600, color: isDarkMode ? '#fff' : '#0d2538', lineHeight: 1.2 } }}>
            {(enquiry.First_Name || '') + ' ' + (enquiry.Last_Name || '')}
          </Text>
          {enquiry.ID && (
            <span style={{
              fontSize: 11,
              color: isDarkMode ? 'rgba(255,255,255,0.45)' : '#b0b8c9',
              fontWeight: 500,
              letterSpacing: 0.5,
              userSelect: 'all',
              fontFamily: 'Consolas, Monaco, monospace',
              background: 'none',
              borderRadius: 4,
              padding: '1px 6px',
              display: 'inline-block',
              verticalAlign: 'middle',
              marginLeft: 2
            }}>
              ID {enquiry.ID}
            </span>
          )}
        </div>
        {/* Meta (value & contact) */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 11, color: isDarkMode ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)', fontWeight: 500, marginTop: 6, marginLeft: 2 }}>
          {enquiry.Value && <span style={{ fontWeight: 600 }}>{enquiry.Value}</span>}
          {enquiry.Email && <span style={{ cursor: 'copy' }} onClick={e => { e.stopPropagation(); navigator?.clipboard?.writeText(enquiry.Email); }}>{enquiry.Email}</span>}
          {enquiry.Phone_Number && <span style={{ cursor: 'copy' }} onClick={e => { e.stopPropagation(); navigator?.clipboard?.writeText(enquiry.Phone_Number || ''); }}>{enquiry.Phone_Number}</span>}
        </div>
        {/* Notes clamp */}
        {hasNotes && (
          <div style={{ marginTop: 6, marginBottom: 4 }}>
            {unclaimedExpanded ? (
              <div ref={unclaimedClampRef} style={{ transition: 'max-height 0.32s cubic-bezier(.4,0,.2,1)', maxHeight: 1000, overflow: 'visible', fontSize: 11, lineHeight: 1.4, color: isDarkMode ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)' }}>
                {formatNotesRich(enquiry.Initial_first_call_notes || '')}
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <div ref={unclaimedClampRef} style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'pre-line', transition: 'max-height 0.32s cubic-bezier(.4,0,.2,1)', maxHeight: 57, fontSize: 11, lineHeight: 1.4, color: isDarkMode ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)' }}>
                  {normalizeNotes(enquiry.Initial_first_call_notes || '')}
                </div>
                {unclaimedIsOverflowing && (
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, background: isDarkMode ? 'linear-gradient(to bottom, rgba(31,39,50,0), rgba(31,39,50,0.9))' : 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.95))', pointerEvents: 'none' }} />
                )}
              </div>
            )}
            {/* Clamp toggle */}
            {unclaimedIsOverflowing || unclaimedExpanded ? (
              <button
                type="button"
                onClick={e => { e.stopPropagation(); setUnclaimedExpanded(v => !v); }}
                aria-expanded={unclaimedExpanded}
                aria-label={unclaimedExpanded ? 'Collapse notes' : 'Expand notes'}
                style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', color: '#7a869a', fontSize: 15, marginLeft: 2, marginTop: 2, background: 'transparent', border: 'none', padding: 2 }}
              >
                <Icon iconName="ChevronDown" styles={{ root: { transition: 'transform 0.32s cubic-bezier(.4,0,.2,1)', transform: unclaimedExpanded ? 'rotate(-180deg)' : 'rotate(0deg)', fontSize: 15, color: '#7a869a' } }} />
              </button>
            ) : null}
          </div>
        )}
  {/* (ID badge bottom-right removed; now inline after name) */}
        {/* Action buttons (cascade) */}
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 6, transition: 'max-height 0.35s cubic-bezier(.4,0,.2,1), padding 0.35s cubic-bezier(.4,0,.2,1)', maxHeight: unclaimedShowActions || unclaimedSelected ? 60 : 0, paddingTop: unclaimedShowActions || unclaimedSelected ? 4 : 0, paddingBottom: unclaimedShowActions || unclaimedSelected ? 8 : 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {(() => {
              const buttons = [
                { key: 'claim', label: 'Claim', colourType: 'primary', onClick: (e: React.MouseEvent) => { e.stopPropagation(); setUnclaimedSelected(true); onSelect(enquiry); } },
                { key: 'delegate', label: 'Delegate', colourType: 'blue', onClick: (e: React.MouseEvent) => { e.stopPropagation(); alert('Delegate action coming soon!'); } },
                { key: 'triage', label: 'Triage', colourType: 'blue', onClick: (e: React.MouseEvent) => { e.stopPropagation(); alert('Triage action coming soon!'); } },
                { key: 'redirect', label: 'Redirect', colourType: 'yellow', onClick: (e: React.MouseEvent) => { e.stopPropagation(); alert('Redirect action coming soon!'); } },
                { key: 'cant', label: "Can't Assist", colourType: 'red', onClick: (e: React.MouseEvent) => { e.stopPropagation(); alert("Can't Assist action coming soon!"); } },
              ];
              const visible = unclaimedShowActions || unclaimedSelected;
              const CONTAINER_DELAY = 120;
              const BUTTON_DELAY = 70;
              return buttons.map((btn, idx) => {
                const baseColour = btn.key === 'claim' ? colours.blue : btn.colourType === 'yellow' ? '#FFD600' : btn.colourType === 'red' ? colours.cta : colours.blue;
                const isClaimBtn = btn.key === 'claim';
                const delay = visible ? (!unclaimedHasAnimatedActions ? `${CONTAINER_DELAY + idx * BUTTON_DELAY}ms` : `${idx * BUTTON_DELAY}ms`) : `${(buttons.length - 1 - idx) * 65}ms`;
                return (
                  <button
                    key={btn.key}
                    onClick={btn.onClick}
                    className={mergeStyles({
                      background: isClaimBtn && unclaimedSelected ? baseColour : 'transparent',
                      color: isClaimBtn ? (unclaimedSelected ? '#fff' : baseColour) : colours.greyText,
                      border: `1.5px solid ${isClaimBtn ? baseColour : 'transparent'}`,
                      padding: '6px 14px',
                      borderRadius: 20,
                      fontSize: 11,
                      fontWeight: 600,
                      cursor: 'pointer',
                      boxShadow: 'none',
                      opacity: visible ? 1 : 0,
                      transform: visible ? 'translateY(0) scale(1)' : 'translateY(6px) scale(.96)',
                      transition: 'opacity .4s cubic-bezier(.4,0,.2,1), transform .4s cubic-bezier(.4,0,.2,1), background .25s, color .25s, border .25s, border-radius .35s cubic-bezier(.4,0,.2,1)',
                      transitionDelay: delay,
                      selectors: {
                        ':hover': isClaimBtn ? { background: unclaimedSelected ? baseColour : '#e3f1fb', color: unclaimedSelected ? '#fff' : baseColour, borderRadius: 6 } : { background: '#f4f6f8', color: baseColour, borderRadius: 6 },
                        ':active': isClaimBtn ? { background: baseColour, color: '#fff', borderRadius: 6, transform: 'scale(0.95)' } : { background: '#e3f1fb', color: baseColour, borderRadius: 6, transform: 'scale(0.95)' },
                      },
                    })}
                  >
                    {btn.label}
                  </button>
                );
              });
            })()}
          </div>
        </div>
      </div>
    );
  }
  // --- End unclaimed legacy card ---

  // Dynamic grid layout (claimed only)
  const mainContentStyle = mergeStyles({
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '2.9fr 1.9fr 1.2fr 90px auto',
    alignItems: 'center',
    gap: '20px',
    width: '100%',
  });

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      borderBottom: !isLast ? `1px solid ${isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}` : 'none',
    }}>
      {/* Main line item */}
      <div className={lineItemStyle} onClick={handleClick}>
        {/* Standalone pulse removed: integrated into AoW pill for unclaimed */}
        {/* Main content grid */}
        <div className={mainContentStyle}>
        {/* Name, Company (+ Contact for unclaimed) */}
        <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
            <CopyableText 
              value={`${enquiry.First_Name} ${enquiry.Last_Name}`} 
              className={nameStyle} 
              label="Name" 
            />
            <span style={{
              fontSize: '10px',
              color: isDarkMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)',
              fontWeight: '500',
              lineHeight: 1
            }}>
              ID {enquiry.ID}
            </span>
          </div>
          {enquiry.Company && (
            <div className={companyStyle} style={{ 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis' 
            }}>
              {enquiry.Company}
            </div>
          )}
          {/* Inline contact details for unclaimed */}
          {!isClaimed && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 }}>
              {enquiry.Email ? (
                <CopyableText 
                  value={enquiry.Email} 
                  className={emailStyle} 
                  label="Email" 
                />
              ) : (
                <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', fontStyle: 'italic' }}>
                  {isDarkMode ? '—' : '—'}
                </span>
              )}
              {enquiry.Phone_Number ? (
                <CopyableText 
                  value={enquiry.Phone_Number} 
                  className={emailStyle} 
                  label="Phone" 
                />
              ) : (
                <span style={{ fontSize: 11, color: 'rgba(0,0,0,0.35)', fontStyle: 'italic' }}>
                  {isDarkMode ? '—' : '—'}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Area & Value - Combined (dot + area text for unclaimed, dot only for claimed) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            {/* Area pill - show full pill for unclaimed, just dot for claimed */}
            {!isClaimed ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                background: isDarkMode ? 'rgba(255,255,255,0.07)' : '#e9ecef',
                color: getAreaColor(enquiry.Area_of_Work),
                padding: '4px 12px',
                borderRadius: 16,
                fontSize: 10,
                fontWeight: 600,
                border: isDarkMode ? '1px solid rgba(255,255,255,0.12)' : '1px solid #d5d9dd',
                lineHeight: 1.1,
                whiteSpace: 'nowrap'
              }}>
                <span className={pulseDotInlineStyle(getAreaColor(enquiry.Area_of_Work))} aria-label="Unclaimed enquiry" />
                <span>{enquiry.Area_of_Work}</span>
              </div>
            ) : (
              <span 
                style={{ 
                  width: 8, 
                  height: 8, 
                  borderRadius: '50%', 
                  background: getAreaColor(enquiry.Area_of_Work), 
                  flexShrink: 0 
                }}
                title={enquiry.Area_of_Work}
              />
            )}
            <div style={{
              fontSize: 12,
              fontWeight: 600,
              color: isDarkMode ? colours.dark.text : colours.light.text
            }}>
              {enquiry.Value ? formatCurrency(enquiry.Value) : 'Not specified'}
            </div>
          </div>
          {enquiry.Type_of_Work && (
            <div style={{
              fontSize: 11,
              color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {enquiry.Type_of_Work}
            </div>
          )}
        </div>

        {/* Date only - ID moved to name section */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '500',
            color: isDarkMode ? colours.dark.text : colours.light.text
          }}>
            {formatDate(enquiry.Touchpoint_Date)}
          </div>
        </div>
        {isClaimed && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 24 }}>
            {claimer && (
              <div style={{
                width: 24,
                height: 24,
                borderRadius: '50%',
                background: isDarkMode ? 'rgba(102,170,232,0.12)' : 'rgba(102,170,232,0.12)',
                color: colours.highlight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 12,
                border: `1px solid ${colours.highlight}50`,
                letterSpacing: '0.2px',
                userSelect: 'none',
              }}>
                {claimer.Initials || (claimer.Email?.split('@')[0]?.slice(0, 2).toUpperCase())}
              </div>
            )}
          </div>
        )}

        {/* Actions & global notes chevron (far right) */}
  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end', minWidth: 0 }}>
          {isClaimed && (
            <>
              <button
                className={pitchButtonStyle}
                onClick={(e) => { e.stopPropagation(); onPitch && onPitch(enquiry); }}
                title='Pitch this enquiry'
                style={{ gap: '4px' }}
              >
                <Icon iconName="Send" style={{ fontSize: '11px' }} />
                Pitch
              </button>

              <button
                className={actionBadgeStyle}
                onClick={(e) => { e.stopPropagation(); enquiry.Phone_Number && (window.location.href = `tel:${enquiry.Phone_Number}`); }}
                title="Call"
                style={{ padding: '4px 10px' }}
              >
                <Icon iconName="Phone" style={{ fontSize: '12px' }} />
                <span style={{ fontSize: 11, fontWeight: 600 }}>Call</span>
              </button>

              <button
                className={actionBadgeStyle}
                onClick={(e) => { e.stopPropagation(); enquiry.Email && (window.location.href = `mailto:${enquiry.Email}?subject=Your%20Enquiry&bcc=1day@followupthen.com`); }}
                title="Email"
                style={{ padding: '4px 10px' }}
              >
                <Icon iconName="Mail" style={{ fontSize: '12px' }} />
                <span style={{ fontSize: 11, fontWeight: 600 }}>Email</span>
              </button>

              <button
                className={ratingBadgeStyle(enquiry.Rating)}
                onClick={(e) => { e.stopPropagation(); onRate(enquiry.ID); }}
                title={enquiry.Rating ? `Rating: ${enquiry.Rating}` : 'Rate Enquiry'}
                style={{ padding: '4px 10px' }}
              >
                <Icon 
                  iconName={enquiry.Rating 
                    ? (enquiry.Rating === 'Poor' ? 'DislikeSolid' : enquiry.Rating === 'Neutral' ? 'Like' : 'LikeSolid')
                    : 'Like'
                  }
                  style={{ fontSize: '12px' }}
                />
                <span style={{ fontSize: 11, fontWeight: 600, minWidth: 24, textAlign: 'center' }}>{enquiry.Rating || 'Rate'}</span>
              </button>
            </>
          )}
          {hasNotes && (
            <button
              onClick={(e) => { e.stopPropagation(); setNotesExpanded(!notesExpanded); }}
              title={notesExpanded ? 'Hide notes' : 'Show notes'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isDarkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)',
                transition: 'color 0.2s, transform 0.25s cubic-bezier(0.4,0,0.2,1)',
                borderRadius: 6,
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = isDarkMode ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.85)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = isDarkMode ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)'; }}
            >
              <Icon iconName={notesExpanded ? 'ChevronUp' : 'ChevronDown'} style={{ fontSize: 14 }} />
            </button>
          )}
        </div>
      </div>
      
      {/* Close main content grid */}
      </div>
      
      {/* Notes Section - only rendered after chevron click */}
      {hasNotes && notesExpanded && (
        <div style={{ 
          padding: '10px 20px 16px', 
          borderTop: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
          background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)',
          animation: 'dropIn 0.32s cubic-bezier(0.16,1,0.3,1)'
        }}>
          <NotesBlock notes={enquiry.Initial_first_call_notes || ''} />
          {isClaimed && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '10px',
              marginTop: '14px'
            }}>
              {/* Inline duplicate of actions for contextual flow if desired - keep just pitch for now? Could remove duplicates if not needed. */}
              {/* Keeping minimal (no duplicates) to avoid clutter. */}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default EnquiryLineItem;
