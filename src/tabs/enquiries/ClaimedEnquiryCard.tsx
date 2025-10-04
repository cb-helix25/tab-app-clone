import React, { useState, useEffect, useRef } from 'react';
import { Text, Icon, TextField, DefaultButton, PrimaryButton } from '@fluentui/react';
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
  onEdit?: (enquiry: Enquiry) => void;
  // Allow async handlers
  onAreaChange?: (enquiryId: string, newArea: string) => void | Promise<void>;
  isLast?: boolean;
  isPrimarySelected?: boolean;
  selected?: boolean;
  onToggleSelect?: (enquiry: Enquiry) => void;
  userData?: any; // For pitch builder
  promotionStatus?: 'pitch' | 'instruction' | null;
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
  onEdit,
  onAreaChange,
  isLast,
  selected = false,
  isPrimarySelected = false,
  onToggleSelect,
  userData,
  promotionStatus,
}) => {
  const { isDarkMode } = useTheme();
  const [showActions, setShowActions] = useState(false);
  const [clickedForActions, setClickedForActions] = useState(false);
  const [hasAnimatedActions, setHasAnimatedActions] = useState(false);
  const [expandedNotes, setExpandedNotes] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEnteringEdit, setIsEnteringEdit] = useState(false);
  const [isExitingEdit, setIsExitingEdit] = useState(false);
  const [editData, setEditData] = useState({
    First_Name: enquiry.First_Name || '',
    Last_Name: enquiry.Last_Name || '',
    Email: enquiry.Email || '',
    Value: enquiry.Value || '',
    Initial_first_call_notes: enquiry.Initial_first_call_notes || ''
  });
  const [isSaving, setIsSaving] = useState(false);
  // Removed inline pitch builder modal usage; pitch now handled by parent detail view
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

  // Check if current user can edit this enquiry (only owner can edit)
  const userEmail = userData?.[0]?.Email?.toLowerCase() || '';
  const enquiryOwner = (enquiry.Point_of_Contact || '').toLowerCase();
  const canEdit = onEdit && userEmail && enquiryOwner === userEmail;

  const handleEditClick = () => {
    setIsEnteringEdit(true);
    setIsExitingEdit(false);
    setExpandedNotes(true); // Always expand notes when editing
    
    // Smooth transition into edit mode
    setTimeout(() => {
      setIsEditing(true);
      setIsEnteringEdit(false);
    }, 150);
    
    // Reset edit data to current enquiry values
    setEditData({
      First_Name: enquiry.First_Name || '',
      Last_Name: enquiry.Last_Name || '',
      Email: enquiry.Email || '',
      Value: enquiry.Value || '',
      Initial_first_call_notes: enquiry.Initial_first_call_notes || ''
    });
  };

  const handleCancelEdit = () => {
    setIsExitingEdit(true);
    
    // Smooth transition out of edit mode
    setTimeout(() => {
      setIsEditing(false);
      setIsEnteringEdit(false);
      setIsExitingEdit(false);
    }, 150);
    
    setEditData({
      First_Name: enquiry.First_Name || '',
      Last_Name: enquiry.Last_Name || '',
      Email: enquiry.Email || '',
      Value: enquiry.Value || '',
      Initial_first_call_notes: enquiry.Initial_first_call_notes || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!onEdit) return;
    
    try {
      setIsSaving(true);
      
      // Prepare updates - only include changed fields
      const updates: any = {};
      if (editData.First_Name !== enquiry.First_Name) updates.First_Name = editData.First_Name.trim();
      if (editData.Last_Name !== enquiry.Last_Name) updates.Last_Name = editData.Last_Name.trim();
      if (editData.Email !== enquiry.Email) updates.Email = editData.Email.trim();
      if (editData.Value !== enquiry.Value) updates.Value = editData.Value.trim();
      if (editData.Initial_first_call_notes !== enquiry.Initial_first_call_notes) {
        updates.Initial_first_call_notes = editData.Initial_first_call_notes.trim();
      }

      if (Object.keys(updates).length === 0) {
        setIsEditing(false);
        return;
      }

      // Call the parent's onEdit handler which will handle the API call
      await onEdit({ ...enquiry, ...updates });
      
      // Smooth transition out of edit mode
      setIsExitingEdit(true);
      setTimeout(() => {
        setIsEditing(false);
        setIsEnteringEdit(false);
        setIsExitingEdit(false);
      }, 150);
      
    } catch (error) {
      console.error('Failed to save changes:', error);
      // Keep editing mode on error
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldChange = (field: keyof typeof editData, value: string) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  const areaColor = (() => {
    const area = enquiry.Area_of_Work?.toLowerCase() || '';
    if (area.includes('commercial')) return colours.blue;
    if (area.includes('construction')) return colours.orange;
    if (area.includes('property')) return colours.green;
    if (area.includes('employment')) return colours.yellow;
    if (area.includes('claim')) return colours.accent;
    if (area.includes('other') || area.includes('unsure')) return colours.greyText;
    return colours.greyText; // Default to grey for unmatched areas
  })();

  const isCardClickable = hasNotes && (isOverflowing || !expandedNotes) && !isEditing && !isEnteringEdit && !isExitingEdit;
  
  // Enhanced styling to match instruction cards - code-like dark mode with clean design
  const bgGradientLight = 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)';
  
  const selectedBg = isDarkMode 
    ? `#1e293b` // Solid dark blue-grey for code-like feel
    : `linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)`;
  
  const selectedBorder = isDarkMode
    ? `1px solid ${areaColor}`
    : `1px solid ${areaColor}`;
    
  const selectedShadow = isDarkMode
    ? `0 1px 3px rgba(0,0,0,0.8)` // Minimal shadow in dark mode
    : `0 8px 32px ${areaColor}25, 0 4px 16px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.8)`;
  
  const card = mergeStyles({
    position: 'relative',
    margin: '6px 0', // Reduced margin to match instruction cards
    borderRadius: 8,
    padding: '12px 18px',
    background: selected 
      ? selectedBg
      : (isDarkMode ? '#0f172a' : bgGradientLight), // Solid dark background to match instruction cards
    opacity: promotionStatus ? 0.6 : 1,
    // Responsive padding
    '@media (max-width: 768px)': {
      padding: '10px 14px',
    },
    '@media (max-width: 480px)': {
      padding: '8px 12px',
      borderRadius: 6,
    },
    border: selected || clickedForActions 
      ? selectedBorder
      : `1px solid ${isDarkMode ? 'rgba(148,163,184,0.2)' : 'rgba(0,0,0,0.08)'}`,
    borderLeft: `2px solid ${selected ? areaColor : (isDarkMode ? areaColor : `${areaColor}60`)}`, // Override just the left side
    boxShadow: selected
      ? selectedShadow
      : (isDarkMode ? 'none' : '0 4px 6px rgba(0, 0, 0, 0.07)'),
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    fontFamily: 'Raleway, sans-serif',
    cursor: isCardClickable ? 'pointer' : 'default',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    marginBottom: 4,
    overflow: 'hidden',
    transform: selected ? 'translateY(-2px)' : 'translateY(0)',
    selectors: {
      ':hover': isCardClickable ? {
        transform: selected ? 'translateY(-3px)' : 'translateY(-1px)', 
        boxShadow: selected 
          ? (isDarkMode ? `0 2px 8px rgba(0,0,0,0.9)` : `0 12px 40px ${areaColor}50, 0 4px 12px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.2)`)
          : (isDarkMode ? '0 1px 3px rgba(0,0,0,0.6)' : '0 8px 24px rgba(0,0,0,0.12)'),
        border: `1px solid ${areaColor}`, // Change the main border to area color on hover
        borderLeft: `2px solid ${areaColor}`, // Keep left border consistent
      } : { 
        borderColor: selected || clickedForActions ? areaColor : areaColor
      },
      ':active': isCardClickable ? { transform: selected ? 'translateY(-1px)' : 'translateY(0)' } : {},
      ':focus-within': { 
        outline: `2px solid ${areaColor}40`, // Thinner outline
        outlineOffset: '2px',
        borderColor: areaColor 
      },
    },
  });

  const actionButtons = [
    { key: 'pitch', icon: 'Send', label: 'Pitch', onClick: () => { onPitch ? onPitch(enquiry) : onSelect(enquiry); } },
    { key: 'call', icon: 'Phone', label: 'Call', onClick: () => enquiry.Phone_Number && (window.location.href = `tel:${enquiry.Phone_Number}`) },
    { key: 'email', icon: 'Mail', label: 'Email', onClick: () => enquiry.Email && (window.location.href = `mailto:${enquiry.Email}?subject=Your%20Enquiry&bcc=1day@followupthen.com`) },
    { key: 'rate', icon: 'Like', label: 'Rate', onClick: () => onRate(enquiry.ID) },
    ...(canEdit && !isEditing ? [{ key: 'edit', icon: 'Edit', label: 'Edit', onClick: handleEditClick }] : []),
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
      onMouseLeave={() => { if (!selected && !clickedForActions) setShowActions(false); }}
      onClick={(e) => {
        // Toggle clicked state for actions visibility
        setClickedForActions(!clickedForActions);
        setShowActions(!clickedForActions);
        
        if (isCardClickable) {
          // Expand notes if truncated; if already expanded do nothing further
          if (!expandedNotes) {
            setExpandedNotes(true);
          }
        }
      }}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && isCardClickable) {
          e.preventDefault();
          if (!expandedNotes) setExpandedNotes(true);
        }
      }}
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

      {/* Area badge - redesigned for cleaner integration */}
      <div style={{
        position: 'absolute',
        top: 12,
        right: 12,
        zIndex: 2
      }}>
        <EnquiryBadge 
          enquiry={enquiry}
          onAreaChange={onAreaChange ? (enquiryId, newArea) => onAreaChange(enquiryId, newArea) : undefined}
        />
      </div>

      {/* Name + ID inline */}
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 10, 
        marginTop: 8, 
        paddingLeft: onToggleSelect ? 26 : 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isExitingEdit ? 0.7 : 1,
        transform: isEnteringEdit ? 'translateY(-2px)' : 'translateY(0)'
      }}>
        {(isEditing && !isExitingEdit) ? (
          <div style={{ 
            display: 'flex', 
            gap: 8, 
            flex: 1,
            opacity: isEnteringEdit ? 0 : 1,
            transform: isEnteringEdit ? 'translateY(4px)' : 'translateY(0)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.15s'
          }}>
            <TextField
              value={editData.First_Name}
              onChange={(_, value) => handleFieldChange('First_Name', value || '')}
              placeholder="First name"
              disabled={isSaving}
              styles={{
                root: { 
                  flex: 1,
                  transition: 'all 0.2s ease-in-out'
                },
                fieldGroup: {
                  border: 'none',
                  background: 'transparent',
                  fontSize: 14,
                  fontWeight: 600,
                  padding: 0,
                  height: 'auto',
                  minHeight: 'auto',
                  borderRadius: 6,
                  transition: 'all 0.2s ease-in-out'
                },
                field: {
                  padding: '8px 12px',
                  color: isDarkMode ? '#fff' : '#0d2538',
                  fontSize: 14,
                  fontWeight: 600,
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
                  borderRadius: 6,
                  background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease-in-out',
                  selectors: {
                    ':focus': {
                      borderColor: colours.blue,
                      boxShadow: `0 0 0 2px ${colours.blue}20`,
                      background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                    },
                    ':hover': {
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
                      background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                    }
                  }
                }
              }}
            />
            <TextField
              value={editData.Last_Name}
              onChange={(_, value) => handleFieldChange('Last_Name', value || '')}
              placeholder="Last name"
              disabled={isSaving}
              styles={{
                root: { 
                  flex: 1,
                  transition: 'all 0.2s ease-in-out'
                },
                fieldGroup: {
                  border: 'none',
                  background: 'transparent',
                  fontSize: 14,
                  fontWeight: 600,
                  padding: 0,
                  height: 'auto',
                  minHeight: 'auto',
                  borderRadius: 6,
                  transition: 'all 0.2s ease-in-out'
                },
                field: {
                  padding: '8px 12px',
                  color: isDarkMode ? '#fff' : '#0d2538',
                  fontSize: 14,
                  fontWeight: 600,
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
                  borderRadius: 6,
                  background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
                  transition: 'all 0.2s ease-in-out',
                  selectors: {
                    ':focus': {
                      borderColor: colours.blue,
                      boxShadow: `0 0 0 2px ${colours.blue}20`,
                      background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                    },
                    ':hover': {
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
                      background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                    }
                  }
                }
              }}
            />
          </div>
        ) : (
          <Text variant="medium" styles={{ 
            root: { 
              fontWeight: 600, 
              color: isDarkMode ? '#fff' : '#0d2538', 
              lineHeight: 1.2,
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              opacity: isEnteringEdit ? 0.7 : 1
            } 
          }}>
            {(enquiry.First_Name || '') + ' ' + (enquiry.Last_Name || '')}
          </Text>
        )}
        {enquiry.ID && (
          <span style={{ 
            fontSize: 11, 
            color: isDarkMode ? 'rgba(255,255,255,0.45)' : '#b0b8c9', 
            fontWeight: 500, 
            letterSpacing: 0.5, 
            userSelect: 'all', 
            fontFamily: 'Consolas, Monaco, monospace', 
            padding: '1px 6px',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            opacity: isEnteringEdit ? 0.7 : 1
          }}>ID {enquiry.ID}</span>
        )}
        {promotionStatus && (
          <span style={{
            fontSize: 10,
            fontWeight: 500,
            padding: '2px 6px',
            borderRadius: 4,
            backgroundColor: promotionStatus === 'instruction' ? (isDarkMode ? 'rgba(76, 175, 80, 0.15)' : 'rgba(232, 245, 232, 0.6)') : (isDarkMode ? 'rgba(33, 150, 243, 0.15)' : 'rgba(227, 242, 253, 0.6)'),
            color: promotionStatus === 'instruction' ? (isDarkMode ? 'rgba(76, 175, 80, 0.8)' : 'rgba(46, 125, 50, 0.7)') : (isDarkMode ? 'rgba(33, 150, 243, 0.8)' : 'rgba(21, 101, 192, 0.7)'),
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            opacity: 0.85
          }}>
            {promotionStatus === 'instruction' ? 'Instructed' : 'Pitched'}
          </span>
        )}
      </div>

      {/* Value & Company */}
      <div style={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 12, 
        fontSize: 11, 
        color: isDarkMode ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.65)', 
        fontWeight: 500, 
        marginTop: 6, 
        marginLeft: onToggleSelect ? 26 : 2,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: isExitingEdit ? 0.7 : 1,
        transform: isEnteringEdit ? 'translateY(-2px)' : 'translateY(0)'
      }}>
        {(isEditing && !isExitingEdit) ? (
          <div style={{ 
            display: 'flex', 
            gap: 8, 
            flex: 1, 
            flexWrap: 'wrap',
            opacity: isEnteringEdit ? 0 : 1,
            transform: isEnteringEdit ? 'translateY(4px)' : 'translateY(0)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1) 0.2s'
          }}>
            <TextField
              value={editData.Value}
              onChange={(_, value) => handleFieldChange('Value', value || '')}
              placeholder="Value (e.g. £10,000)"
              disabled={isSaving}
              styles={{
                root: { 
                  minWidth: 120,
                  transition: 'all 0.2s ease-in-out'
                },
                fieldGroup: {
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  height: 'auto',
                  minHeight: 'auto',
                  borderRadius: 6
                },
                field: {
                  padding: '6px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
                  borderRadius: 6,
                  background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
                  color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
                  transition: 'all 0.2s ease-in-out',
                  selectors: {
                    ':focus': {
                      borderColor: colours.blue,
                      boxShadow: `0 0 0 2px ${colours.blue}20`,
                      background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                    },
                    ':hover': {
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
                      background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                    }
                  }
                }
              }}
            />
            <TextField
              value={editData.Email}
              onChange={(_, value) => handleFieldChange('Email', value || '')}
              placeholder="Email address"
              disabled={isSaving}
              type="email"
              styles={{
                root: { 
                  minWidth: 180,
                  flex: 1,
                  transition: 'all 0.2s ease-in-out'
                },
                fieldGroup: {
                  border: 'none',
                  background: 'transparent',
                  padding: 0,
                  height: 'auto',
                  minHeight: 'auto',
                  borderRadius: 6
                },
                field: {
                  padding: '6px 10px',
                  fontSize: 11,
                  fontWeight: 500,
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
                  borderRadius: 6,
                  background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
                  color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
                  transition: 'all 0.2s ease-in-out',
                  selectors: {
                    ':focus': {
                      borderColor: colours.blue,
                      boxShadow: `0 0 0 2px ${colours.blue}20`,
                      background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                    },
                    ':hover': {
                      borderColor: isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
                      background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                    }
                  }
                }
              }}
            />
          </div>
        ) : (
          <>
            {enquiry.Value && <span style={{ fontWeight: 600, transition: 'all 0.3s ease' }}>{enquiry.Value}</span>}
            {enquiry.Company && <span style={{ transition: 'all 0.3s ease' }}>{enquiry.Company}</span>}
            {enquiry.Email && <span style={{ cursor: 'copy', transition: 'all 0.3s ease' }} onClick={e => { e.stopPropagation(); navigator?.clipboard?.writeText(enquiry.Email); }}>{enquiry.Email}</span>}
          </>
        )}
        {enquiry.Phone_Number && <span style={{ cursor: 'copy', transition: 'all 0.3s ease' }} onClick={e => { e.stopPropagation(); navigator?.clipboard?.writeText(enquiry.Phone_Number!); }}>{enquiry.Phone_Number}</span>}
      </div>

      {/* Notes clamp */}
      {(hasNotes || isEditing) && (
        <div style={{ 
          marginTop: 6, 
          marginBottom: 4, 
          paddingLeft: onToggleSelect ? 26 : 0,
          transition: 'all 0.3s ease',
          opacity: isExitingEdit ? 0.7 : 1
        }}>
          {(isEditing && !isExitingEdit) ? (
            <div style={{
              opacity: isEnteringEdit ? 0 : 1,
              transition: 'opacity 0.4s ease 0.2s'
            }}>
              <TextField
                value={editData.Initial_first_call_notes}
                onChange={(_, value) => handleFieldChange('Initial_first_call_notes', value || '')}
                placeholder="Initial call notes..."
                disabled={isSaving}
                multiline
                rows={4}
                autoAdjustHeight
                styles={{
                  root: { 
                    width: '100%',
                    transition: 'all 0.2s ease-in-out'
                  },
                  fieldGroup: {
                    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)'}`,
                    borderRadius: 8,
                    background: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.03)',
                    padding: 8,
                    transition: 'all 0.2s ease-in-out',
                    selectors: {
                      ':focus-within': {
                        borderColor: colours.blue,
                        boxShadow: `0 0 0 2px ${colours.blue}20`,
                        background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                      },
                      ':hover': {
                        borderColor: isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)',
                        background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                      }
                    }
                  },
                  field: {
                    fontSize: 11,
                    lineHeight: '1.5',
                    color: isDarkMode ? 'rgba(255,255,255,0.9)' : 'rgba(0,0,0,0.9)',
                    background: 'transparent',
                    border: 'none',
                    padding: 0,
                    minHeight: 60,
                    resize: 'vertical' as const,
                    fontFamily: 'inherit',
                    transition: 'all 0.2s ease-in-out'
                  }
                }}
              />
            </div>
          ) : expandedNotes ? (
            <div 
              ref={clampRef} 
              style={{ 
                transition: 'all 0.3s ease', 
                maxHeight: 1000, 
                overflow: 'visible', 
                fontSize: 11, 
                lineHeight: '1.5', 
                color: isDarkMode ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)',
                whiteSpace: 'pre-wrap', // Preserves line breaks and wrapping
                wordWrap: 'break-word', // Prevents long words from overflowing
                fontFamily: 'inherit'
              }}
            >
              {normalizeNotes(enquiry.Initial_first_call_notes || '')}
            </div>
          ) : (
            <div style={{ position: 'relative' }}>
              <div 
                ref={clampRef} 
                style={{ 
                  display: '-webkit-box', 
                  WebkitLineClamp: 3, 
                  WebkitBoxOrient: 'vertical', 
                  overflow: 'hidden', 
                  textOverflow: 'ellipsis', 
                  whiteSpace: 'pre-wrap', // Preserves line breaks
                  wordWrap: 'break-word', // Prevents overflow
                  transition: 'all 0.3s ease', 
                  maxHeight: 57, 
                  fontSize: 11, 
                  lineHeight: '1.5', 
                  color: isDarkMode ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.75)',
                  fontFamily: 'inherit'
                }}
              >
                {normalizeNotes(enquiry.Initial_first_call_notes || '')}
              </div>
              {isOverflowing && (
                <div style={{ 
                  position: 'absolute', 
                  bottom: 0, 
                  left: 0, 
                  right: 0, 
                  height: 18, 
                  background: isDarkMode 
                    ? 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.06))' 
                    : 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,0.95))', 
                  pointerEvents: 'none',
                  transition: 'opacity 0.3s ease'
                }} />
              )}
            </div>
          )}
          {(isOverflowing || (expandedNotes && isOverflowing)) && !isEditing && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setExpandedNotes(v => !v); }}
              aria-expanded={expandedNotes}
              aria-label={expandedNotes ? 'Collapse notes' : 'Expand notes'}
              style={{ 
                display: 'inline-flex', 
                alignItems: 'center', 
                cursor: 'pointer', 
                color: '#7a869a', 
                fontSize: 15, 
                marginLeft: 2, 
                marginTop: 4, 
                background: 'transparent', 
                border: 'none', 
                padding: 4,
                borderRadius: 4,
                transition: 'all 0.2s ease-in-out'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = colours.blue;
                e.currentTarget.style.background = isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#7a869a';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              <Icon iconName="ChevronDown" styles={{ 
                root: { 
                  transition: 'all 0.3s ease', 
                  transform: expandedNotes ? 'rotate(-180deg)' : 'rotate(0deg)', 
                  fontSize: 15, 
                  color: 'inherit'
                } 
              }} />
            </button>
          )}
        </div>
      )}

      {/* Action buttons (cascade) */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        marginTop: 6, 
        transition: 'all 0.4s cubic-bezier(.4,0,.2,1)', 
        maxHeight: (showActions || selected || clickedForActions || isEditing) ? (isEditing ? 140 : 80) : 0, 
        paddingTop: (showActions || selected || clickedForActions || isEditing) ? 8 : 0, 
        paddingBottom: (showActions || selected || clickedForActions || isEditing) ? 8 : 0, 
        overflow: 'hidden',
        opacity: isExitingEdit ? 0.7 : 1,
        transform: isEnteringEdit ? 'translateY(-2px)' : 'translateY(0)'
      }}>
        
        {(isEditing && !isExitingEdit) ? (
          /* Edit mode buttons */
          <div style={{ 
            display: 'flex', 
            gap: 8, 
            justifyContent: 'flex-end', 
            paddingTop: 8,
            opacity: isEnteringEdit ? 0 : 1,
            transform: isEnteringEdit ? 'translateY(6px) scale(0.95)' : 'translateY(0) scale(1)',
            transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.3s'
          }}>
            <DefaultButton
              text="Cancel"
              onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }}
              disabled={isSaving}
              styles={{
                root: {
                  minWidth: 60,
                  height: 28,
                  fontSize: 11,
                  borderRadius: 4,
                  border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'}`,
                  background: 'transparent',
                  color: isDarkMode ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.8)'
                }
              }}
            />
            <PrimaryButton
              text={isSaving ? 'Saving...' : 'Save'}
              onClick={(e) => { e.stopPropagation(); handleSaveEdit(); }}
              disabled={isSaving}
              styles={{
                root: {
                  minWidth: 60,
                  height: 28,
                  fontSize: 11,
                  borderRadius: 4,
                  background: colours.blue,
                  border: 'none'
                }
              }}
            />
          </div>
        ) : (
          /* Regular action buttons - unified badge-style design */
          <div style={{ 
            display: 'flex', 
            gap: 6, 
            flexWrap: 'wrap',
            opacity: isEnteringEdit ? 0.7 : 1,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {actionButtons.map((btn, idx) => {
              const delay = (showActions || selected || clickedForActions) ? (!hasAnimatedActions ? 120 + idx * 70 : idx * 70) : (actionButtons.length - 1 - idx) * 65;
              const isRate = btn.key === 'rate';
              const isPitch = btn.key === 'pitch';
              const isEdit = btn.key === 'edit';
              return (
                <button
                  key={btn.key}
                  onClick={(e) => { e.stopPropagation(); btn.onClick(); }}
                  className={mergeStyles({
                    background: isPitch ? colours.highlight : 'transparent',
                    color: isPitch ? '#fff' : colours.greyText,
                    border: `1px solid ${isPitch ? colours.highlight : 'transparent'}`,
                    backdropFilter: 'blur(8px)',
                    padding: '8px 14px',
                    borderRadius: 18,
                    fontSize: 10.5,
                    fontWeight: 600,
                    cursor: 'pointer',
                    minHeight: 34,
                    opacity: showActions || selected ? 1 : 0,
                    transform: showActions || selected ? 'translateY(0) scale(1)' : 'translateY(6px) scale(.96)',
                    transition: 'opacity .4s cubic-bezier(.4,0,.2,1), transform .4s cubic-bezier(.4,0,.2,1), background .25s, color .25s, border .25s, border-radius .35s cubic-bezier(.4,0,.2,1)',
                    transitionDelay: `${delay}ms`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    lineHeight: 1,
                    selectors: {
                      ':hover': { 
                        background: isPitch ? colours.blue : '#f4f6f8', 
                        color: isPitch ? '#fff' : colours.blue, 
                        borderRadius: 14,
                        borderColor: isPitch ? colours.blue : 'transparent',
                        transform: 'translateY(-1px)'
                      },
                      ':active': { 
                        background: isPitch ? colours.blue : '#e3f1fb', 
                        color: isPitch ? '#fff' : colours.blue, 
                        borderRadius: 14, 
                        transform: 'scale(0.95)' 
                      },
                    },
                  })}
                >
                  <Icon iconName={btn.icon} styles={{ root: { fontSize: 12, lineHeight: 1 } }} />
                  {btn.label}
                </button>
              );
            })}
          </div>
        )}
      </div>
      
  {/* Removed inline pitch builder modal */}
    </div>
  );
};

export default ClaimedEnquiryCard;
