import {
    Text,
    IconButton,
    TooltipHost,
    IButtonStyles,
} from '@fluentui/react';
import { mergeStyles } from '@fluentui/react/lib/Styling';
import { Enquiry } from '../../app/functionality/types';
import { colours } from '../../app/styles/colours';
import RatingIndicator from './RatingIndicator';
import { useTheme } from '../../app/functionality/ThemeContext';

import React, { useState } from 'react';

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

const EnquiryLineItem: React.FC<EnquiryLineItemProps> = ({
  enquiry,
  onSelect,
  onRate,
  teamData,
  isLast,
}) => {
  const { isDarkMode } = useTheme();

  // Check if claimed
  const lowerPOC = enquiry.Point_of_Contact?.toLowerCase() || '';
  const isClaimed =
    lowerPOC &&
    ![
      'team@helix-law.com',
      'property@helix-law.com',
      'commercial@helix-law.com',
      'construction@helix-law.com',
      'employment@helix-law.com',
      'automations@helix-law.com',
    ].includes(lowerPOC);

  // Get claimer info
  const claimer = isClaimed
    ? teamData?.find((t) => t.Email?.toLowerCase() === lowerPOC)
    : undefined;

  const handleClick = () => {
    onSelect(enquiry);
  };

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

  const lineItemStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    padding: '20px 24px',
    backgroundColor: isDarkMode 
      ? colours.dark.cardBackground 
      : colours.light.cardBackground,
    borderBottom: !isLast ? `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}` : 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontFamily: 'Raleway, sans-serif',
    minHeight: '88px',
    borderLeft: `4px solid ${getAreaColor(enquiry.Area_of_Work)}`,
    position: 'relative',
    selectors: {
      ':hover': {
        backgroundColor: isDarkMode 
          ? colours.dark.cardHover 
          : colours.light.cardHover,
        transform: 'translateX(4px)',
        boxShadow: isDarkMode
          ? '0 4px 20px rgba(0, 0, 0, 0.4)'
          : '0 4px 20px rgba(0, 0, 0, 0.15)',
      },
      ':active': {
        transform: 'translateX(2px)',
      },
    },
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
    userSelect: 'text',
    cursor: 'copy',
    transition: 'color 0.2s',
    ':hover': {
      color: colours.highlight,
    },
  });

  const companyStyle = mergeStyles({
    fontSize: '14px',
    color: isDarkMode ? colours.dark.subText : colours.light.subText,
    marginBottom: '2px',
  });

  const emailStyle = mergeStyles({
    fontSize: '13px',
    color: isDarkMode ? colours.dark.text : colours.light.text,
    opacity: 0.8,
    userSelect: 'text',
    cursor: 'copy',
    transition: 'color 0.2s',
    ':hover': {
      color: colours.highlight,
    },
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

  const claimerBadgeStyle = mergeStyles({
    fontSize: '11px',
    fontWeight: '500',
    color: isDarkMode ? colours.dark.text : colours.light.text,
    opacity: 0.6,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginTop: '2px',
  });

  return (
    <div className={lineItemStyle} onClick={handleClick}>
      {/* Main content grid */}
      <div className={mainContentStyle}>
        {/* Contact Info */}
        <div>
          {/* Name click-to-copy */}
          <div>
            <CopyableText value={`${enquiry.First_Name} ${enquiry.Last_Name}`} className={nameStyle} label="Name" />
          </div>
          {enquiry.Company && (
            <div className={companyStyle}>{enquiry.Company}</div>
          )}
          {/* Email click-to-copy */}
          <div>
            <CopyableText value={enquiry.Email} className={emailStyle} label="Email" />
          </div>
        </div>

        {/* Area & Type */}
        <div>
          <div className={metaStyle}>{enquiry.Area_of_Work}</div>
          {enquiry.Type_of_Work && (
            <Text variant="small" styles={{
              root: {
                color: isDarkMode ? colours.dark.text : colours.light.text,
                fontSize: '13px',
                opacity: 0.7,
              }
            }}>
              {enquiry.Type_of_Work}
            </Text>
          )}
        </div>

        {/* Value */}
        <div>
          <div className={valueStyle}>
            {enquiry.Value ? formatCurrency(enquiry.Value) : 'Not specified'}
          </div>
          {claimer && (
            <div className={claimerBadgeStyle}>
              {claimer.Initials || claimer.Email?.split('@')[0]}
            </div>
          )}
        </div>

        {/* Date */}
        <div>
          <div className={dateStyle}>
            {formatDate(enquiry.Touchpoint_Date)}
          </div>
          <Text variant="small" styles={{
            root: {
              color: isDarkMode ? colours.dark.subText : colours.light.subText,
              fontSize: '12px',
            }
          }}>
            ID: {enquiry.ID}
          </Text>
        </div>

        {/* Actions */}
        <div className={actionsStyle}>
          <TooltipHost content="Call">
            <IconButton
              iconProps={{ iconName: 'Phone' }}
              onClick={(e) => {
                e.stopPropagation();
                if (enquiry.Phone_Number) {
                  window.location.href = `tel:${enquiry.Phone_Number}`;
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
                if (enquiry.Email) {
                  window.location.href = `mailto:${enquiry.Email}?subject=Your%20Enquiry&bcc=1day@followupthen.com`;
                }
              }}
              styles={iconButtonStyles(isDarkMode ? colours.dark.text : colours.light.text)}
            />
          </TooltipHost>

          <TooltipHost content={enquiry.Rating ? `Rating: ${enquiry.Rating}` : 'Rate Enquiry'}>
            <IconButton
              iconProps={{ 
                iconName: enquiry.Rating 
                  ? (enquiry.Rating === 'Poor' ? 'DislikeSolid' : 'LikeSolid')
                  : 'Like'
              }}
              onClick={(e) => {
                e.stopPropagation();
                onRate(enquiry.ID);
              }}
              styles={{
                root: {
                  color: enquiry.Rating 
                    ? (enquiry.Rating === 'Good' ? colours.blue : 
                       enquiry.Rating === 'Neutral' ? colours.grey : colours.cta)
                    : (isDarkMode ? colours.dark.text : colours.light.text),
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
                  color: enquiry.Rating 
                    ? (enquiry.Rating === 'Good' ? colours.blue : 
                       enquiry.Rating === 'Neutral' ? colours.grey : colours.cta)
                    : (isDarkMode ? colours.dark.text : colours.light.text),
                },
              }}
            />
          </TooltipHost>
        </div>
      </div>
    </div>
  );
};

export default EnquiryLineItem;
