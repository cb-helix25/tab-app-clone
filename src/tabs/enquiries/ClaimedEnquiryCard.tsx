import React, { useState, useEffect, useRef } from 'react';
import { Text, Icon } from '@fluentui/react';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import { Enquiry } from '../../app/functionality/types';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import EnquiryBadge from './EnquiryBadge';
import PitchBuilder from './PitchBuilder';

interface TeamDataRec {
  Email?: string;
  Initials?: string;
  'Full Name'?: string;
}

interface Props {
  enquiry: Enquiry & { __sourceType?: 'new' | 'legacy' };
  claimer?: TeamDataRec | undefined;
  onSelect: (enquiry: Enquiry, multi?: boolean) => void;
  onRate: (id: string) => void;
  onPitch?: (enquiry: Enquiry) => void;
  isLast?: boolean;
  isPrimarySelected?: boolean;
  selected?: boolean;
  onToggleSelect?: (enquiry: Enquiry) => void;
  userData?: any; // For pitch builder
}

/**
 * ClaimedEnquiryCard
 * Card version of a claimed enquiry adopting the new clean design language.
 */
const ClaimedEnquiryCard: React.FC<Props> = ({
  enquiry,
  claimer,
  onSelect,
  onRate,
  onPitch,
  isLast,
  selected = false,
  isPrimarySelected = false,
  onToggleSelect,
  userData,
}) => {
  const { isDarkMode } = useTheme();
  const [showActions, setShowActions] = useState(false);
  const [hasAnimatedActions, setHasAnimatedActions] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState(false);
  const [showPitchBuilder, setShowPitchBuilder] = useState(false);
  const clampRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const hasNotes = !!(enquiry.Initial_first_call_notes && enquiry.Initial_first_call_notes.trim());

  useEffect(() => {
    if (!expandedNotes && clampRef.current && hasNotes) {
      const el = clampRef.current;
      const overflowing = el.scrollHeight > el.clientHeight + 1;
      setIsOverflowing(overflowing);
    } else if (expandedNotes) {
      setIsOverflowing(false);
    }
  }, [expandedNotes, enquiry.Initial_first_call_notes, hasNotes]);

  const normalizeNotes = (raw: string): string => {
    let s = raw.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
    s = s.replace(/\n{3,}/g, '\n\n');
    return s.trim();
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

  const card = mergeStyles({
    position: 'relative',
    borderRadius: 5,
    padding: '14px 18px 14px 22px',
    background: isDarkMode ? '#1f2732' : '#ffffff',
    border: `1px solid ${selected ? colours.blue : (isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)')}`,
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
    overflow: 'hidden', // ensure left accent clips to rounded corners
    borderLeftWidth: 2,
    borderLeftStyle: 'solid',
    selectors: {
      ':hover': { transform: 'translateY(-2px)', borderColor: selected ? colours.blue : colours.highlight },
      ':active': { transform: 'translateY(-1px)' },
    },
  });

  const actionButtons = [
    { key: 'pitch', icon: 'Send', label: 'Pitch', onClick: () => setShowPitchBuilder(true) },
    { key: 'call', icon: 'Phone', label: 'Call', onClick: () => enquiry.Phone_Number && (window.location.href = `tel:${enquiry.Phone_Number}`) },
    { key: 'email', icon: 'Mail', label: 'Email', onClick: () => enquiry.Email && (window.location.href = `mailto:${enquiry.Email}?subject=Your%20Enquiry&bcc=1day@followupthen.com`) },
    { key: 'rate', icon: enquiry.Rating ? (enquiry.Rating === 'Poor' ? 'DislikeSolid' : enquiry.Rating === 'Neutral' ? 'Like' : 'LikeSolid') : 'Like', label: enquiry.Rating || 'Rate', onClick: () => onRate(enquiry.ID) },
  ];

  return (
    <div
      className={card}
      role="article"
      tabIndex={0}
      aria-label="Claimed enquiry"
      aria-pressed={selected}
      onMouseEnter={() => {
        if (!hasAnimatedActions) {
          setShowActions(true); setHasAnimatedActions(true);
        } else setShowActions(true);
      }}
      onMouseLeave={() => { if (!selected) setShowActions(false); }}
      onClick={(e) => {
        const multi = e.metaKey || e.ctrlKey || e.shiftKey;
        onSelect(enquiry, multi);
      }}
      onKeyDown={(e) => { if (e.key === 'Enter') onSelect(enquiry, e.metaKey || e.ctrlKey); }}
    >
      {/* Selection Toggle (checkbox style) */}
      {onToggleSelect && (
        <button
          aria-label={selected ? 'Deselect enquiry' : 'Select enquiry'}
          onClick={(e) => { e.stopPropagation(); onToggleSelect(enquiry); }}
          style={{ position: 'absolute', top: 10, left: 10, width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${selected ? colours.blue : (isDarkMode ? 'rgba(255,255,255,0.25)' : '#c3c9d4')}`, background: selected ? colours.blue : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
        >
          {selected && <Icon iconName="CheckMark" styles={{ root: { fontSize: 12, color: '#fff' } }} />}
        </button>
      )}

      {/* Left accent bar */}
      <span style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 2, background: areaColor, opacity: .95, pointerEvents: 'none' }} />

      {/* Top-right badge component */}
      <EnquiryBadge 
        enquiry={enquiry} 
        claimer={claimer} 
        isClaimed={true}
        showPulse={false}
      />      {/* Name + ID inline */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 8, paddingLeft: onToggleSelect ? 26 : 0 }}>
        <Text variant="medium" styles={{ root: { fontWeight: 600, color: isDarkMode ? '#fff' : '#0d2538', lineHeight: 1.2 } }}>
          {(enquiry.First_Name || '') + ' ' + (enquiry.Last_Name || '')}
        </Text>
        {enquiry.ID && (
          <span style={{ fontSize: 11, color: isDarkMode ? 'rgba(255,255,255,0.45)' : '#b0b8c9', fontWeight: 500, letterSpacing: 0.5, userSelect: 'all', fontFamily: 'Consolas, Monaco, monospace', padding: '1px 6px' }}>ID {enquiry.ID}</span>
        )}
      </div>

      {/* Value & Company */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontSize: 11, color: isDarkMode ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)', fontWeight: 500, marginTop: 6, marginLeft: onToggleSelect ? 26 : 2 }}>
        {enquiry.Value && <span style={{ fontWeight: 600 }}>{enquiry.Value}</span>}
        {enquiry.Company && <span>{enquiry.Company}</span>}
        {enquiry.Email && <span style={{ cursor: 'copy' }} onClick={e => { e.stopPropagation(); navigator?.clipboard?.writeText(enquiry.Email); }}>{enquiry.Email}</span>}
        {enquiry.Phone_Number && <span style={{ cursor: 'copy' }} onClick={e => { e.stopPropagation(); navigator?.clipboard?.writeText(enquiry.Phone_Number!); }}>{enquiry.Phone_Number}</span>}
      </div>

      {/* Notes clamp */}
      {hasNotes && (
        <div style={{ marginTop: 6, marginBottom: 4, paddingLeft: onToggleSelect ? 26 : 0 }}>
          {expandedNotes ? (
            <div ref={clampRef} style={{ transition: 'max-height 0.32s cubic-bezier(.4,0,.2,1)', maxHeight: 1000, overflow: 'visible', fontSize: 11, lineHeight: 1.4, color: isDarkMode ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)' }}>
              {normalizeNotes(enquiry.Initial_first_call_notes || '')}
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <div ref={clampRef} style={{ display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'pre-line', transition: 'max-height 0.32s cubic-bezier(.4,0,.2,1)', maxHeight: 57, fontSize: 11, lineHeight: 1.4, color: isDarkMode ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)' }}>
                {normalizeNotes(enquiry.Initial_first_call_notes || '')}
              </div>
              {isOverflowing && (
                <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 18, background: isDarkMode ? 'linear-gradient(to bottom, rgba(31,39,50,0), rgba(31,39,50,0.9))' : 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.95))', pointerEvents: 'none' }} />
              )}
            </div>
          )}
          {(isOverflowing || expandedNotes) && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setExpandedNotes(v => !v); }}
              aria-expanded={expandedNotes}
              aria-label={expandedNotes ? 'Collapse notes' : 'Expand notes'}
              style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', color: '#7a869a', fontSize: 15, marginLeft: 2, marginTop: 2, background: 'transparent', border: 'none', padding: 2 }}
            >
              <Icon iconName="ChevronDown" styles={{ root: { transition: 'transform 0.32s cubic-bezier(.4,0,.2,1)', transform: expandedNotes ? 'rotate(-180deg)' : 'rotate(0deg)', fontSize: 15, color: '#7a869a' } }} />
            </button>
          )}
        </div>
      )}

      {/* Action buttons (cascade) */}
      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 6, transition: 'max-height 0.35s cubic-bezier(.4,0,.2,1), padding 0.35s cubic-bezier(.4,0,.2,1)', maxHeight: showActions || selected ? 70 : 0, paddingTop: showActions || selected ? 4 : 0, paddingBottom: showActions || selected ? 8 : 0, overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {actionButtons.map((btn, idx) => {
            const delay = (showActions || selected) ? (!hasAnimatedActions ? 120 + idx * 70 : idx * 70) : (actionButtons.length - 1 - idx) * 65;
            const isRate = btn.key === 'rate';
            const isPitch = btn.key === 'pitch';
            return (
              <button
                key={btn.key}
                onClick={(e) => { e.stopPropagation(); btn.onClick(); }}
                className={mergeStyles({
                  background: isPitch ? colours.highlight : 'transparent',
                  color: isPitch ? '#fff' : (isRate && enquiry.Rating ? (enquiry.Rating === 'Good' ? colours.blue : enquiry.Rating === 'Neutral' ? colours.grey : colours.cta) : colours.greyText),
                  border: `1.5px solid ${isPitch ? colours.highlight : 'transparent'}`,
                  padding: '6px 14px',
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: showActions || selected ? 1 : 0,
                  transform: showActions || selected ? 'translateY(0) scale(1)' : 'translateY(6px) scale(.96)',
                  transition: 'opacity .4s cubic-bezier(.4,0,.2,1), transform .4s cubic-bezier(.4,0,.2,1), background .25s, color .25s, border .25s, border-radius .35s cubic-bezier(.4,0,.2,1)',
                  transitionDelay: `${delay}ms`,
                  selectors: {
                    ':hover': { background: isPitch ? colours.blue : '#f4f6f8', color: isPitch ? '#fff' : colours.blue, borderRadius: 6 },
                    ':active': { background: isPitch ? colours.blue : '#e3f1fb', color: isPitch ? '#fff' : colours.blue, borderRadius: 6, transform: 'scale(0.95)' },
                  },
                })}
              >
                <Icon iconName={btn.icon} styles={{ root: { fontSize: 12, marginRight: 4 } }} />
                {btn.label}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Pitch Builder Modal */}
      {showPitchBuilder && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setShowPitchBuilder(false)}
        >
          <div
            style={{
              backgroundColor: isDarkMode ? '#1f2732' : '#ffffff',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '1200px',
              height: '90%',
              overflow: 'hidden',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'transparent',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: isDarkMode ? '#fff' : '#000',
                zIndex: 1001,
                width: '30px',
                height: '30px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              onClick={() => setShowPitchBuilder(false)}
              aria-label="Close pitch builder"
            >
              ×
            </button>
            
            {/* Pitch Builder */}
            <div style={{ height: '100%', overflow: 'auto' }}>
              <PitchBuilder enquiry={enquiry} userData={userData} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClaimedEnquiryCard;
