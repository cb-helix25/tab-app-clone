import React, { useState } from 'react';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import { Text, Icon } from '@fluentui/react';
import { Enquiry } from '../../app/functionality/types';
import { colours } from '../../app/styles/colours';
import { useTheme } from '../../app/functionality/ThemeContext';
import EnquiryBadge from './EnquiryBadge';
import { useClaimEnquiry } from '../../utils/claimEnquiry';

interface Props {
  enquiry: Enquiry & { __sourceType?: 'new' | 'legacy' };
  onSelect: (enquiry: Enquiry) => void;
  onRate: (id: string) => void;
  isLast: boolean;
  userEmail?: string;
  onClaimSuccess?: () => void;
}

/**
 * Dedicated card for NEW source unclaimed enquiries (team@helix-law.com)
 * - Only Claim is enabled; Delegate/Triage/Redirect/Can't Assist are disabled with no handlers.
 */

// --- Notes formatting & clamp ---
function normalizeNotes(raw: string): string {
  let s = raw.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

interface EnquiryNotesClampProps { notes: string; isDark: boolean; forceExpand?: boolean }
const EnquiryNotesClamp: React.FC<EnquiryNotesClampProps> = ({ notes, isDark, forceExpand }) => {
  const [expanded, setExpanded] = React.useState(false);
  const [showChevron, setShowChevron] = React.useState(false);
  const clampRef = React.useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = React.useState(false);

  React.useEffect(() => { if (forceExpand) setExpanded(true); }, [forceExpand]);
  React.useEffect(() => {
    if (!expanded && clampRef.current) {
      const el = clampRef.current;
      const overflowing = el.scrollHeight > el.clientHeight + 1;
      setShowChevron(overflowing);
      setIsOverflowing(overflowing);
    } else if (expanded) {
      setShowChevron(true);
      setIsOverflowing(false);
    }
  }, [notes, expanded]);

  return (
    <div style={{ fontSize: 11, lineHeight: 1.4, color: isDark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)' }}>
      {expanded ? (
        <div aria-live="polite">{normalizeNotes(notes)}</div>
      ) : (
        <div style={{ position: 'relative' }}>
          <div
            ref={clampRef}
            style={{
              display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
              textOverflow: 'ellipsis', whiteSpace: 'pre-line', maxHeight: 57
            }}
            aria-hidden={expanded}
          >
            {normalizeNotes(notes)}
          </div>
          {isOverflowing && (
            <div
              style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, pointerEvents: 'none',
                background: isDark
                  ? 'linear-gradient(to bottom, rgba(31,39,50,0), rgba(31,39,50,0.9))'
                  : 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.95))' }}
            />
          )}
        </div>
      )}
      {showChevron && (
        <button
          type="button"
          style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', color: '#7a869a', background: 'transparent', border: 'none', padding: 2 }}
          onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
          aria-expanded={expanded}
          aria-label={expanded ? 'Collapse notes' : 'Expand notes'}
        >
          <Icon iconName="ChevronDown" styles={{ root: { transition: 'transform 0.2s', transform: expanded ? 'rotate(-180deg)' : 'rotate(0deg)', fontSize: 14 } }} />
        </button>
      )}
    </div>
  );
};

// --- Card ---
const getAreaColour = (area?: string) => {
  switch (area?.toLowerCase()) {
    case 'commercial': return colours.blue;
    case 'construction': return colours.orange;
    case 'property': return colours.green;
    case 'employment': return colours.yellow;
    default: return colours.cta;
  }
};

const NewUnclaimedEnquiryCard: React.FC<Props> = ({ enquiry, onSelect, userEmail, onClaimSuccess }) => {
  const { isDarkMode } = useTheme();
  const [selected, setSelected] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const { claimEnquiry, isLoading, error } = useClaimEnquiry();

  const areaColor = getAreaColour(enquiry.Area_of_Work);

  const container = mergeStyles({
    position: 'relative',
    background: isDarkMode ? 'rgba(255,255,255,0.06)' : '#fff',
    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'}`,
    borderRadius: 12,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    borderLeftWidth: 2,
    borderLeftStyle: 'solid',
    padding: 14,
    margin: '8px 0',
    cursor: 'pointer',
    transition: 'box-shadow .2s, transform .2s',
    boxShadow: isDarkMode ? '0 2px 10px rgba(0,0,0,0.25)' : '0 2px 10px rgba(0,0,0,0.08)',
    overflow: 'hidden',
    selectors: {
      ':hover': { boxShadow: isDarkMode ? '0 6px 20px rgba(0,0,0,0.35)' : '0 6px 20px rgba(0,0,0,0.12)', transform: 'translateY(-1px)' }
    }
  });

  const meta = mergeStyles({
    display: 'flex',
    gap: 12,
    fontSize: 11,
    color: isDarkMode ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)',
    fontWeight: 500,
    marginTop: 6,
  });

  const handleSelect = () => {
    setSelected(true);
    setShowActions(true);
    onSelect(enquiry);
  };

  const handleClaim = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!userEmail || !enquiry.ID) {
      console.error('Missing userEmail or enquiry ID for claim');
      return;
    }
    
    try {
      const result = await claimEnquiry(enquiry.ID, userEmail);
      if (result.success) {
        console.log('✅ Enquiry claimed successfully');
        // Trigger refresh to move enquiry from unclaimed to claimed list
        if (onClaimSuccess) {
          onClaimSuccess();
        }
      } else {
        console.error('❌ Failed to claim enquiry:', result.error);
      }
    } catch (err) {
      console.error('❌ Error claiming enquiry:', err);
    }
  };

  return (
    <div
      className={container}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { if (!selected) setShowActions(false); }}
      onClick={handleSelect}
      role="article"
      tabIndex={0}
      aria-label="Unclaimed enquiry (new data)"
      aria-pressed={selected}
    >
      {/* Left accent */}
      <span style={{
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: 2,
        background: areaColor,
        opacity: .95,
        pointerEvents: 'none',
        borderTopLeftRadius: 12,
        borderBottomLeftRadius: 12,
      }} />

      {/* Badge */}
      <EnquiryBadge enquiry={enquiry} isClaimed={false} showPulse={true} />

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8 }}>
        <Text variant="medium" styles={{ root: { fontWeight: 600, color: isDarkMode ? '#fff' : '#0d2538', lineHeight: 1.2 } }}>
          {(enquiry.First_Name || '') + ' ' + (enquiry.Last_Name || '')}
        </Text>
        {enquiry.ID && (
          <span style={{ fontSize: 11, color: isDarkMode ? 'rgba(255,255,255,0.55)' : '#8aa0b3', fontWeight: 500, letterSpacing: 0.4 }}>
            ID {enquiry.ID}
          </span>
        )}
      </div>

      {/* Meta */}
      <div className={meta}>
        {enquiry.Value && <span style={{ fontWeight: 600 }}>{enquiry.Value}</span>}
      </div>

      {/* Notes */}
      {enquiry.Initial_first_call_notes && (
        <div style={{ marginTop: 6, marginBottom: 4 }}>
          <EnquiryNotesClamp notes={enquiry.Initial_first_call_notes} isDark={isDarkMode} forceExpand={selected} />
        </div>
      )}

      {/* Actions */}
      <div style={{
        display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8,
        maxHeight: showActions || selected ? 60 : 0,
        paddingTop: showActions || selected ? 4 : 0,
        paddingBottom: showActions || selected ? 8 : 0,
        overflow: 'hidden',
      }}>
        {(() => {
          const buttons = [
            { key: 'claim', label: 'Claim', colourType: 'primary', disabled: false },
            { key: 'delegate', label: 'Delegate', colourType: 'blue', disabled: true },
            { key: 'triage', label: 'Triage', colourType: 'blue', disabled: true },
            { key: 'redirect', label: 'Redirect', colourType: 'yellow', disabled: true },
            { key: 'cant', label: "Can't Assist", colourType: 'red', disabled: true },
          ] as const;
          return buttons.map(btn => {
            const baseColour = btn.key === 'claim' ? colours.blue : btn.colourType === 'yellow' ? '#FFD600' : btn.colourType === 'red' ? colours.cta : colours.blue;
            const isClaim = btn.key === 'claim';
            return (
              <button
                key={btn.key}
                onClick={btn.disabled ? undefined : (btn.key === 'claim' ? handleClaim : (e => { e.stopPropagation(); handleSelect(); }))}
                disabled={btn.disabled || (btn.key === 'claim' && isLoading)}
                className={mergeStyles({
                  background: isClaim && selected ? baseColour : 'transparent',
                  color: btn.disabled || (btn.key === 'claim' && isLoading) ? '#9aa4b1' : (isClaim ? (selected ? '#fff' : baseColour) : colours.greyText),
                  border: `1.5px solid ${isClaim ? baseColour : 'transparent'}`,
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: btn.disabled || (btn.key === 'claim' && isLoading) ? 'not-allowed' : 'pointer',
                  boxShadow: 'none',
                  transition: 'background .25s, color .25s, border .25s',
                })}
              >{btn.key === 'claim' && isLoading ? 'Claiming...' : btn.label}</button>
            );
          });
        })()}
      </div>
    </div>
  );
};

export default NewUnclaimedEnquiryCard;
