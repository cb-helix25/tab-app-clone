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
    backgroundColor: isDarkMode 
      ? colours.dark.cardBackground 
      : colours.light.cardBackground,
    border: `2px solid ${colours.highlight}`,
    borderLeft: `6px solid ${colours.highlight}`,
    borderRadius: '8px',
    marginBottom: isLast ? 0 : '12px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Raleway, sans-serif',
    position: 'relative',
    overflow: 'hidden',
    selectors: {
      ':hover': {
        backgroundColor: isDarkMode 
          ? colours.dark.cardHover 
          : colours.light.cardHover,
        transform: 'translateX(4px)',
        boxShadow: isDarkMode
          ? '0 6px 25px rgba(0, 0, 0, 0.5)'
          : '0 6px 25px rgba(0, 0, 0, 0.2)',
      },
    },
  });

  const headerStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    padding: '20px 24px',
    gap: '24px',
    borderBottom: isExpanded 
      ? `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}` 
      : 'none',
  });

  const mainContentStyle = mergeStyles({
    flex: 1,
    display: 'grid',
    gridTemplateColumns: '2.5fr 1.2fr 1.2fr 1fr 120px',
    alignItems: 'center',
    gap: '24px',
    width: '100%',
  });

  const nameStyle = mergeStyles({
    fontWeight: '600',
    fontSize: '16px',
    color: isDarkMode ? colours.dark.text : colours.light.text,
    marginBottom: '4px',
  });

  const emailStyle = mergeStyles({
    fontSize: '13px',
    color: isDarkMode ? colours.dark.text : colours.light.text,
    opacity: 0.8,
  });

  const countBadgeStyle = mergeStyles({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colours.highlight,
    color: '#ffffff',
    borderRadius: '12px',
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: '600',
    marginLeft: '8px',
    minWidth: '24px',
    height: '24px',
  });

  const metaStyle = mergeStyles({
    fontSize: '14px',
    color: isDarkMode ? colours.dark.text : colours.light.text,
    fontWeight: '500',
  });

  const valueStyle = mergeStyles({
    fontSize: '14px',
    color: colours.highlight,
    fontWeight: '600',
  });

  const dateStyle = mergeStyles({
    fontSize: '13px',
    color: isDarkMode ? colours.dark.subText : colours.light.subText,
  });

  const actionsStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    flexShrink: 0,
  });

  const expandedContentStyle = mergeStyles({
    padding: '0 24px 16px 24px',
    backgroundColor: isDarkMode 
      ? colours.dark.sectionBackground 
      : colours.light.sectionBackground,
  });

  const areaTagsStyle = mergeStyles({
    display: 'flex',
    gap: '4px',
    flexWrap: 'wrap',
    marginTop: '4px',
  });

  const areaTagStyle = (area: string) => mergeStyles({
    display: 'inline-block',
    backgroundColor: getAreaColor(area),
    color: '#ffffff',
    fontSize: '10px',
    fontWeight: '500',
    padding: '2px 6px',
    borderRadius: '4px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
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
