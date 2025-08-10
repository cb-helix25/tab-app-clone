import React, { useState } from 'react';
import {
  Text,
  IconButton,
  TooltipHost,
  IButtonStyles,
  Stack,
} from '@fluentui/react';
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

const GroupedEnquiryCard: React.FC<GroupedEnquiryCardProps> = ({
  groupedEnquiry,
  onSelect,
  onRate,
  teamData,
  isLast,
  userAOW,
}) => {
  const { isDarkMode } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  
  const { clientName, clientEmail, enquiries, latestDate, totalValue, areas } = groupedEnquiry;
  const enquiryCount = enquiries.length;
  const latestEnquiry = enquiries[0]; // Assuming enquiries are sorted by date

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

  const groupCardStyle = mergeStyles({
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: isDarkMode ? '#1f242b' : '#ffffff',
    border: `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)'}`,
    borderLeft: `4px solid ${colours.highlight}`,
    borderRadius: 6,
    marginBottom: isLast ? 0 : 10,
    cursor: 'pointer',
    transition: 'background-color 0.15s ease, transform 0.15s ease',
    fontFamily: 'Raleway, sans-serif',
    position: 'relative',
    overflow: 'hidden',
    selectors: {
      ':hover': {
        backgroundColor: isDarkMode ? '#242b33' : '#f9fbfc',
        transform: 'translateX(2px)',
      },
    },
  });

  const headerStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    padding: '14px 18px',
    gap: 20,
    borderBottom: isExpanded ? `1px solid ${isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}` : 'none',
  });

  const mainContentStyle = mergeStyles({
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '2fr 1.3fr 1fr 0.9fr 110px',
    alignItems: 'center',
    gap: 20,
    width: '100%',
  });

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

  const actionsStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  });

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
    <div className={groupCardStyle}>
      {/* Header with summary */}
      <div className={headerStyle} onClick={handleMainClick}>
        <div className={mainContentStyle}>
          {/* Client Info */}
          <div>
            <div className={nameStyle}>
              {clientName}
              <span className={countBadgeStyle}>{enquiryCount}</span>
            </div>
            <div className={emailStyle}>{clientEmail}</div>
            <div className={areaTagsStyle}>
              {areas.map((area, idx) => (
                <span key={idx} className={areaTagStyle(area)}>
                  {area}
                </span>
              ))}
            </div>
          </div>

          {/* Latest Type */}
          <div>
            <div className={metaStyle}>{latestEnquiry.Area_of_Work}</div>
            {latestEnquiry.Type_of_Work && (
              <Text variant="small" styles={{
                root: {
                  color: isDarkMode ? colours.dark.text : colours.light.text,
                  fontSize: '13px',
                  opacity: 0.7,
                }
              }}>
                {latestEnquiry.Type_of_Work}
              </Text>
            )}
          </div>

          {/* Total Value */}
          <div>
            <div className={valueStyle}>
              {calculateTotalValue()}
            </div>
            <Text variant="small" styles={{
              root: {
                color: isDarkMode ? colours.dark.subText : colours.light.subText,
                fontSize: '12px',
              }
            }}>
              Combined value
            </Text>
          </div>

          {/* Latest Date */}
          <div>
            <div className={dateStyle}>
              {formatDate(latestDate)}
            </div>
            <Text variant="small" styles={{
              root: {
                color: isDarkMode ? colours.dark.subText : colours.light.subText,
                fontSize: '12px',
              }
            }}>
              Latest enquiry
            </Text>
          </div>

          {/* Actions */}
          <div className={actionsStyle}>
            <TooltipHost content="Call">
              <IconButton
                iconProps={{ iconName: 'Phone' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (latestEnquiry.Phone_Number) {
                    window.location.href = `tel:${latestEnquiry.Phone_Number}`;
                  }
                }}
                styles={iconButtonStyles(isDarkMode ? colours.dark.text : colours.light.text)}
              />
            </TooltipHost>

            <TooltipHost content="Email">
              <IconButton
                iconProps={{ iconName: 'Mail' }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (clientEmail) {
                    window.location.href = `mailto:${clientEmail}?subject=Your%20Enquiry&bcc=1day@followupthen.com`;
                  }
                }}
                styles={iconButtonStyles(isDarkMode ? colours.dark.text : colours.light.text)}
              />
            </TooltipHost>

            <TooltipHost content={enquiryCount > 1 ? (isExpanded ? "Collapse" : "Expand") : "View Details"}>
              <IconButton
                iconProps={{ 
                  iconName: enquiryCount > 1 
                    ? (isExpanded ? 'ChevronUp' : 'ChevronDown')
                    : 'View'
                }}
                onClick={toggleExpanded}
                styles={iconButtonStyles(isDarkMode ? colours.dark.text : colours.light.text)}
              />
            </TooltipHost>
          </div>
        </div>
      </div>

      {/* Expanded content with individual enquiries */}
      {isExpanded && enquiryCount > 1 && (
        <div className={expandedContentStyle}>
          <Stack tokens={{ childrenGap: 8 }}>
            <Text variant="medium" styles={{
              root: {
                fontWeight: '600',
                color: isDarkMode ? colours.dark.text : colours.light.text,
                marginBottom: '8px',
              }
            }}>
              All Enquiries ({enquiryCount})
            </Text>
            {enquiries.map((enquiry, idx) => (
              <div
                key={enquiry.ID}
                style={{
                  backgroundColor: isDarkMode 
                    ? colours.dark.cardBackground 
                    : colours.light.cardBackground,
                  borderRadius: '4px',
                  overflow: 'hidden',
                }}
              >
                <EnquiryLineItem
                  enquiry={enquiry}
                  onSelect={onSelect}
                  onRate={onRate}
                  teamData={teamData}
                  isLast={idx === enquiries.length - 1}
                  userAOW={userAOW}
                />
              </div>
            ))}
          </Stack>
        </div>
      )}
    </div>
  );
};

export default GroupedEnquiryCard;
