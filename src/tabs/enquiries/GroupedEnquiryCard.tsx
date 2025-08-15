import React, { useState } from 'react';
import { Text, Icon, IconButton, TooltipHost, IButtonStyles, Stack } from '@fluentui/react';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import { Enquiry } from '../../app/functionality/types';
import { colours } from '../../app/styles/colours';
import { useTheme } from '../../app/functionality/ThemeContext';
import EnquiryLineItem from './EnquiryLineItem';
import { GroupedEnquiry } from './enquiryGrouping';

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

interface GroupedEnquiryCardProps {
  groupedEnquiry: GroupedEnquiry;
  onSelect: (enquiry: Enquiry) => void;
  onRate: (enquiryId: string) => void;
  onPitch?: (enquiry: Enquiry) => void;
  teamData?: TeamData[] | null;
  isLast?: boolean;
  userAOW?: string[]; // List of user's areas of work (lowercase)
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

const iconButtonStyles = (iconColor: string): IButtonStyles => ({
  root: {
    color: iconColor,
    backgroundColor: 'transparent',
    border: 'none',
    selectors: {
      ':hover': {
        backgroundColor: colours.highlight,
        color: '#ffffff',
      },
      ':focus': {
        backgroundColor: colours.highlight,
        color: '#ffffff',
      },
    },
    height: '32px',
    width: '32px',
    padding: '0px',
    boxShadow: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: '16px',
    lineHeight: '1',
    color: iconColor,
  },
});

const GroupedEnquiryCard: React.FC<GroupedEnquiryCardProps> = ({ groupedEnquiry, onSelect, onRate, onPitch, teamData, isLast, userAOW }) => {
  const { isDarkMode } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const { clientName, clientEmail, enquiries, latestDate, areas } = groupedEnquiry;
  const enquiryCount = enquiries.length;
  const latestEnquiry = enquiries[0];

  const formatDate = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const calculateTotalValue = (): string => {
    const values = enquiries
      .map(e => e.Value)
      .filter(v => v && v !== 'Not specified')
      .map(v => {
        const match = v?.match(/£?(\d{1,3}(?:,\d{3})*)/);
        return match ? parseInt(match[1].replace(/,/g, ''), 10) : 0;
      });
    
    if (values.length === 0) return 'Not specified';
    
    const total = values.reduce((sum, val) => sum + val, 0);
    return `£${total.toLocaleString()}`;
  };

  const svgMark = encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 57.56 100" preserveAspectRatio="xMidYMid meet"><g fill="currentColor" opacity="0.22"><path d="M57.56,13.1c0,7.27-7.6,10.19-11.59,11.64-4,1.46-29.98,11.15-34.78,13.1C6.4,39.77,0,41.23,0,48.5v-13.1C0,28.13,6.4,26.68,11.19,24.74c4.8-1.94,30.78-11.64,34.78-13.1,4-1.45,11.59-4.37,11.59-11.64v13.09h0Z"/><path d="M57.56,38.84c0,7.27-7.6,10.19-11.59,11.64s-29.98,11.16-34.78,13.1c-4.8,1.94-11.19,3.4-11.19,10.67v-13.1c0-7.27,6.4-8.73,11.19-10.67,4.8-1.94,30.78-11.64,34.78-13.1,4-1.46,11.59-4.37,11.59-11.64v13.09h0Z"/><path d="M57.56,64.59c0,7.27-7.6,10.19-11.59,11.64-4,1.46-29.98,11.15-34.78,13.1-4.8,1.94-11.19,3.39-11.19,10.67v-13.1c0-7.27,6.4-8.73,11.19-10.67,4.8-1.94,30.78-11.64,34.78-13.1,4-1.45,11.59-4.37,11.59-11.64v13.1h0Z"/></g></svg>');
  const cardStyle = mergeStyles({
    position: 'relative',
    borderRadius: 6,
    background: isDarkMode ? '#1f2732' : '#ffffff',
    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
    boxShadow: isDarkMode ? '0 4px 16px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.04)' : '0 4px 14px rgba(33,56,82,0.10)',
    padding: '14px 18px 14px 22px',
    marginBottom: isLast ? 0 : 8,
    cursor: 'pointer',
    fontFamily: 'Raleway, sans-serif',
    overflow: 'hidden',
    transition: 'border-color .2s, transform .15s',
    '::after': {
      content: '""',
      position: 'absolute',
      top: 10,
      bottom: 10,
  right: 12,
  width: 168, // bumped width (maintain ratio via contain)
  background: isDarkMode ? 'rgba(255,255,255,0.075)' : 'rgba(6,23,51,0.12)',
      maskImage: `url("data:image/svg+xml,${svgMark}")`,
      WebkitMaskImage: `url("data:image/svg+xml,${svgMark}")`,
      maskRepeat: 'no-repeat',
      WebkitMaskRepeat: 'no-repeat',
      maskPosition: 'center',
      WebkitMaskPosition: 'center',
      maskSize: 'contain',
      WebkitMaskSize: 'contain',
      pointerEvents: 'none',
      mixBlendMode: isDarkMode ? 'screen' : 'multiply',
      filter: 'blur(.2px)',
      zIndex: 0,
    },
    selectors: {
      ':hover': { transform: 'translateY(-2px)', borderColor: colours.highlight },
      ':active': { transform: 'translateY(-1px)' },
    },
  });

  const topRow = mergeStyles({ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap', position: 'relative' });

  const nameStyle = mergeStyles({
    fontWeight: 600,
    fontSize: 15,
    color: isDarkMode ? colours.dark.text : colours.light.text,
    marginBottom: 2,
  });

  const emailStyle = mergeStyles({
    fontSize: 12,
    color: isDarkMode ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.7)',
    fontWeight: 500,
  });

  const countBadgeStyle = mergeStyles({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(102,170,232,0.15)',
    color: colours.highlight,
    borderRadius: 14,
    padding: '2px 8px',
    fontSize: 11,
    fontWeight: 600,
    marginLeft: 6,
    minWidth: 24,
    height: 22,
  });

  const metaStyle = mergeStyles({
    fontSize: 13,
    color: isDarkMode ? colours.dark.text : colours.light.text,
    fontWeight: 600,
  });

  const valueStyle = mergeStyles({
    fontSize: 13,
    color: colours.highlight,
    fontWeight: 700,
  });

  const dateStyle = mergeStyles({
    fontSize: 12,
    color: isDarkMode ? colours.dark.subText : colours.light.subText,
    fontWeight: 500,
  });

  const actionsStyle = mergeStyles({ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto' });

  const expandedContentStyle = mergeStyles({
    padding: '0 16px 10px 16px',
    backgroundColor: isDarkMode ? '#1b2026' : '#f6f8f9',
  });

  const areaTagsStyle = mergeStyles({
    display: 'flex',
    gap: 4,
    flexWrap: 'wrap',
    marginTop: 4,
  });

  const areaTagStyle = (area: string) => mergeStyles({
    display: 'inline-block',
    backgroundColor: `${getAreaColor(area)}15`,
    color: getAreaColor(area),
    fontSize: 9,
    fontWeight: 600,
    padding: '3px 6px',
    borderRadius: 10,
    textTransform: 'none',
    letterSpacing: '0.3px',
    border: `1px solid ${getAreaColor(area)}30`
  });

  const toggleExpanded = (e: React.MouseEvent<any>) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleMainClick = () => {
    if (enquiryCount === 1) {
      onSelect(latestEnquiry);
    } else {
      setIsExpanded(!isExpanded);
    }
  };

  return (
    <div className={cardStyle} onClick={handleMainClick}>
      {/* Left accent bar */}
      <span style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 2, background: colours.highlight, opacity: .95 }} />
      <div className={topRow}>
        <div style={{ minWidth: 160 }}>
          <div className={nameStyle}>
            {clientName}
            <span className={countBadgeStyle}>{enquiryCount}</span>
          </div>
          <div className={emailStyle}>{clientEmail}</div>
          <div className={areaTagsStyle}>
            {areas.map((area, idx) => (
              <span key={idx} className={areaTagStyle(area)}>{area}</span>
            ))}
          </div>
        </div>
        <div>
          <div className={metaStyle}>{latestEnquiry.Area_of_Work}</div>
          {latestEnquiry.Type_of_Work && (
            <Text variant="small" styles={{ root: { color: isDarkMode ? colours.dark.text : colours.light.text, fontSize: 13, opacity: .7 } }}>{latestEnquiry.Type_of_Work}</Text>
          )}
        </div>
        <div>
          <div className={valueStyle}>{calculateTotalValue()}</div>
          <Text variant="small" styles={{ root: { color: isDarkMode ? colours.dark.subText : colours.light.subText, fontSize: 12 } }}>Combined value</Text>
        </div>
        <div>
          <div className={dateStyle}>{formatDate(latestDate)}</div>
          <Text variant="small" styles={{ root: { color: isDarkMode ? colours.dark.subText : colours.light.subText, fontSize: 12 } }}>Latest enquiry</Text>
        </div>
        <div className={actionsStyle} onClick={e => e.stopPropagation()}>
          <TooltipHost content="Call">
            <IconButton iconProps={{ iconName: 'Phone' }} onClick={() => latestEnquiry.Phone_Number && (window.location.href = `tel:${latestEnquiry.Phone_Number}`)} styles={iconButtonStyles(isDarkMode ? colours.dark.text : colours.light.text)} />
          </TooltipHost>
          <TooltipHost content="Email">
            <IconButton iconProps={{ iconName: 'Mail' }} onClick={() => clientEmail && (window.location.href = `mailto:${clientEmail}?subject=Your%20Enquiry&bcc=1day@followupthen.com`)} styles={iconButtonStyles(isDarkMode ? colours.dark.text : colours.light.text)} />
          </TooltipHost>
          <TooltipHost content={enquiryCount > 1 ? (isExpanded ? 'Collapse' : 'Expand') : 'View Details'}>
            <IconButton iconProps={{ iconName: enquiryCount > 1 ? (isExpanded ? 'ChevronUp' : 'ChevronDown') : 'View' }} onClick={toggleExpanded} styles={iconButtonStyles(isDarkMode ? colours.dark.text : colours.light.text)} />
          </TooltipHost>
        </div>
      </div>
      {isExpanded && enquiryCount > 1 && (
        <div className={expandedContentStyle} style={{ marginTop: 12 }}>
          <Stack tokens={{ childrenGap: 8 }}>
            <Text variant="medium" styles={{ root: { fontWeight: 600, color: isDarkMode ? colours.dark.text : colours.light.text, marginBottom: 8 } }}>All Enquiries ({enquiryCount})</Text>
            {enquiries.map((enquiry, idx) => (
              <div key={enquiry.ID} style={{ borderRadius: 4, overflow: 'hidden' }}>
                <EnquiryLineItem enquiry={enquiry} onSelect={onSelect} onRate={onRate} onPitch={onPitch} teamData={teamData} isLast={idx === enquiries.length - 1} userAOW={undefined} />
              </div>
            ))}
          </Stack>
        </div>
      )}
    </div>
  );
};

export default GroupedEnquiryCard;
