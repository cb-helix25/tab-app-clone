// src/tabs/matters/MatterOverview.tsx

import React from 'react';
import {
  Stack,
  Text,
  Icon,
  mergeStyles,
  Separator,
  TooltipHost,
  Link,
  MessageBar,
  MessageBarType,
} from '@fluentui/react';
import { Matter } from '../../app/functionality/types';
import { colours } from '../../app/styles/colours';
import { useTheme } from '../../app/functionality/ThemeContext';

// Helper: Compute initials from a full name
const getInitials = (name: string): string => {
  if (!name.trim()) return '-';
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
};

// Helper: Format date string or return '-'
const formatDate = (dateStr: string | null): string => {
  if (!dateStr || !dateStr.trim()) return '-';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  } catch (err) {
    return '-';
  }
};

// Helper: Return raw value or '-'
const getValue = (value?: string): string => {
  return value && value.trim() ? value : '-';
};

// Map rating to style
const mapRatingToStyle = (rating: string | undefined) => {
  switch (rating) {
    case 'Good':
      return { color: colours.green, icon: 'LikeSolid', isBorder: false };
    case 'Neutral':
      return { color: colours.greyText, icon: 'Like', isBorder: false };
    case 'Poor':
      return { color: colours.red, icon: 'DislikeSolid', isBorder: false };
    default:
      return { color: colours.red, icon: 'StatusCircleQuestionMark', isBorder: true };
  }
};

interface MatterOverviewProps {
  matter: Matter;            // The base SQL matter
  overviewData?: any;        // Extra data from the getMatterOverview call
  outstandingData?: any;     // Optional outstanding data from Clio
  onEdit?: () => void;       // Optional edit action for rating
}

// Define a fixed style for labels to ensure alignment
const labelStyle = mergeStyles({
  fontWeight: 700,
  color: colours.highlight,
  minWidth: '120px',
});

const MatterOverview: React.FC<MatterOverviewProps> = ({
  matter,
  overviewData,
  outstandingData,
  onEdit,
}) => {
  const { isDarkMode } = useTheme();
  const ratingStyle = mapRatingToStyle(matter.Rating);

  // Extract the extra "client" data from overviewData (not from Matter)
  const client = overviewData?.client;

  // Handler for rating click
  const handleRatingClick = () => {
    if (onEdit) onEdit();
  };

  // Hyperlink URLs
  const matterLink = `https://eu.app.clio.com/nc/#/matters/${matter.UniqueID || '-'}`;
  const clientLink = client
    ? `https://eu.app.clio.com/nc/#/contacts/${client.id}`
    : '#';

  // Build a map of solicitor names to roles
  const solicitorMap: { [name: string]: string[] } = {};
  if (matter.OriginatingSolicitor?.trim()) {
    const name = matter.OriginatingSolicitor.trim();
    solicitorMap[name] = (solicitorMap[name] || []).concat('Originating');
  }
  if (matter.ResponsibleSolicitor?.trim()) {
    const name = matter.ResponsibleSolicitor.trim();
    solicitorMap[name] = (solicitorMap[name] || []).concat('Responsible');
  }
  if (matter.SupervisingPartner?.trim()) {
    const name = matter.SupervisingPartner.trim();
    solicitorMap[name] = (solicitorMap[name] || []).concat('Supervising');
  }

  /* ------------------------------------------
   * S T Y L E S
   * ------------------------------------------
   */
  const containerStyle = mergeStyles({
    padding: '20px',
    borderRadius: '8px',
    marginBottom: '20px',
    backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    fontFamily: 'Raleway, sans-serif',
  });

  const topSectionStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  });

  const matterReferenceStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  });

  const referenceTextStyle = mergeStyles({
    fontSize: '1.5rem',
    fontWeight: 700,
    color: colours.highlight,
    textDecoration: 'none',
  });

  const ratingBubbleStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    width: '40px',
    height: '40px',
    cursor: 'pointer',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    backgroundColor: ratingStyle.isBorder ? 'transparent' : ratingStyle.color,
    border: ratingStyle.isBorder ? `2px solid ${ratingStyle.color}` : 'none',
    color: ratingStyle.isBorder
      ? isDarkMode
        ? colours.dark.text
        : colours.light.text
      : 'white',
    selectors: {
      ':hover': {
        transform: 'scale(1.1)',
        boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
      },
    },
  });

  const infoSectionWrapper = mergeStyles({
    marginTop: '20px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
  });

  const infoCardStyle = mergeStyles({
    flex: '1 1 320px',
    minWidth: '280px',
    backgroundColor: isDarkMode ? '#262626' : '#fff',
    borderRadius: '8px',
    boxShadow: isDarkMode ? '0 2px 8px rgba(0,0,0,0.5)' : '0 2px 8px rgba(0,0,0,0.1)',
    padding: '16px',
    transition: 'transform 0.2s, box-shadow 0.2s',
    selectors: {
      ':hover': {
        transform: 'scale(1.02)',
        boxShadow: isDarkMode
          ? '0 4px 16px rgba(0,0,0,0.7)'
          : '0 4px 16px rgba(0,0,0,0.2)',
      },
    },
  });

  const baseTextStyle = {
    root: {
      color: isDarkMode ? colours.dark.text : colours.light.text,
      fontSize: 'small',
      lineHeight: '1.5',
    },
  };

  const personaStyle = mergeStyles({
    width: 32,
    height: 32,
    borderRadius: '50%',
    backgroundColor: colours.highlight,
    color: 'white',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 600,
    fontSize: '14px',
    marginRight: 8,
    cursor: 'default',
  });

  const iconButtonStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: isDarkMode ? '#555' : colours.grey,
    borderRadius: '50%',
    width: '32px',
    height: '32px',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,0,0,0.1)',
    transition: 'background-color 0.2s, transform 0.2s',
    color: isDarkMode ? colours.dark.iconColor : colours.light.iconColor,
    selectors: {
      ':hover': {
        backgroundColor: colours.blue,
        transform: 'scale(1.05)',
        color: 'white',
      },
    },
  });

  const tagStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    backgroundColor: colours.tagBackground,
    color: isDarkMode ? colours.dark.text : colours.light.text,
    borderRadius: '4px',
    padding: '4px 8px',
    fontSize: 'small',
    marginRight: '8px',
    marginBottom: '8px',
  });

  // ---------------------------------
  // Render the Overview/Client Balances data MessageBar
  // ---------------------------------
  const renderOverviewMessageBar = () => {
    if (!overviewData) {
      return (
        <MessageBar
          messageBarType={MessageBarType.info}
          styles={{ root: { whiteSpace: 'pre-wrap', fontFamily: 'monospace' } }}
        >
          No overview data available.
        </MessageBar>
      );
    }
    return (
      <MessageBar
        messageBarType={MessageBarType.info}
        styles={{ root: { whiteSpace: 'pre-wrap', fontFamily: 'monospace' } }}
      >
        {JSON.stringify(overviewData, null, 2)}
      </MessageBar>
    );
  };

  // ---------------------------------
  // Render the Outstanding data MessageBar
  // ---------------------------------
  const renderOutstandingSection = () => {
    if (!outstandingData) {
      return (
        <MessageBar
          messageBarType={MessageBarType.info}
          styles={{ root: { whiteSpace: 'pre-wrap', fontFamily: 'monospace' } }}
        >
          No outstanding data found in Clio for this matter.
        </MessageBar>
      );
    }
    return (
      <MessageBar
        messageBarType={MessageBarType.info}
        styles={{ root: { whiteSpace: 'pre-wrap', fontFamily: 'monospace' } }}
      >
        {JSON.stringify(outstandingData, null, 2)}
      </MessageBar>
    );
  };

  // ---------------------------------
  // R E T U R N  M A I N  J S X
  // ---------------------------------
  return (
    <div className={containerStyle}>
      {/* TOP SECTION: Matter reference & rating */}
      <div className={topSectionStyle}>
        <div className={matterReferenceStyle}>
          <Icon
            iconName="OpenFolderHorizontal"
            styles={{ root: { fontSize: 28, color: colours.highlight } }}
          />
          <Link href={matterLink} target="_blank" className={referenceTextStyle}>
            {matter.DisplayNumber || '-'}
          </Link>
        </div>
        {matter.Rating !== undefined && (
          <TooltipHost content={matter.Rating ? `Edit Rating: ${matter.Rating}` : 'Not Rated'}>
            <div
              className={ratingBubbleStyle}
              onClick={handleRatingClick}
              title="Edit Rating"
              aria-label="Edit Rating"
            >
              <Icon iconName={ratingStyle.icon} />
            </div>
          </TooltipHost>
        )}
      </div>

      {/* INFO SECTION WRAPPER (Matter Details & Client) */}
      <div className={infoSectionWrapper}>
        {/* MATTER DETAILS CARD */}
        <div className={infoCardStyle}>
          <Text variant="mediumPlus" styles={{ root: { fontWeight: 700, marginBottom: '8px' } }}>
            Matter Details
          </Text>
          <Separator />
          {/* First Section: Practice Area, Description, Opponent */}
          <Stack tokens={{ childrenGap: 8 }} styles={{ root: { marginTop: '12px' } }}>
            <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
              <Text variant="mediumPlus" styles={{ root: labelStyle }}>
                Practice Area:
              </Text>
              <Text
                variant="medium"
                styles={{ root: { color: isDarkMode ? colours.dark.text : colours.light.text } }}
              >
                {matter.PracticeArea?.trim() || '-'}
              </Text>
            </Stack>
            <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
              <Text variant="mediumPlus" styles={{ root: labelStyle }}>
                Description:
              </Text>
              <Text
                variant="medium"
                styles={{ root: { color: isDarkMode ? colours.dark.text : colours.light.text } }}
              >
                {matter.Description?.trim() || '-'}
              </Text>
            </Stack>
            {matter.Opponent?.trim() && (
              <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                <Text variant="mediumPlus" styles={{ root: labelStyle }}>
                  Opponent:
                </Text>
                <Text
                  variant="medium"
                  styles={{ root: { color: isDarkMode ? colours.dark.text : colours.light.text } }}
                >
                  {matter.Opponent.trim()}
                </Text>
              </Stack>
            )}
          </Stack>

          <Separator styles={{ root: { marginTop: '12px', marginBottom: '12px' } }} />

          {/* Second Section: Open Date, CCL Date */}
          <Stack tokens={{ childrenGap: 8 }} styles={{ root: { marginTop: '12px' } }}>
            <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
              <Text variant="mediumPlus" styles={{ root: labelStyle }}>
                Open Date:
              </Text>
              <Text
                variant="medium"
                styles={{ root: { color: isDarkMode ? colours.dark.text : colours.light.text } }}
              >
                {formatDate(matter.OpenDate)}
              </Text>
            </Stack>
            <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
              <Text variant="mediumPlus" styles={{ root: labelStyle }}>
                CCL Date:
              </Text>
              <Text
                variant="medium"
                styles={{ root: { color: isDarkMode ? colours.dark.text : colours.light.text } }}
              >
                {formatDate(matter.CCL_date)}
              </Text>
            </Stack>
          </Stack>

          <Separator styles={{ root: { marginTop: '12px', marginBottom: '12px' } }} />

          {/* Third Section: Solicitor Persona Bubbles */}
          <Stack horizontal tokens={{ childrenGap: 8 }} styles={{ root: { marginTop: '12px' } }}>
            {Object.entries(solicitorMap).map(([name, roles], idx) => (
              <TooltipHost key={idx} content={`${name} (${roles.join(', ')})`}>
                <div className={personaStyle}>{getInitials(name)}</div>
              </TooltipHost>
            ))}
          </Stack>
        </div>

        {/* CLIENT CARD */}
        <div className={infoCardStyle}>
          <Text variant="mediumPlus" styles={{ root: { fontWeight: 700, marginBottom: '8px' } }}>
            Client
          </Text>
          <Separator />
          <Stack tokens={{ childrenGap: 12 }} styles={{ root: { marginTop: '12px' } }}>
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
              <Icon
                iconName={client?.type === 'Company' ? 'CityNext' : 'Contact'}
                styles={{ root: { fontSize: 24, color: colours.highlight } }}
              />
              <Link
                href={clientLink}
                target="_blank"
                styles={{
                  root: {
                    fontSize: 'medium',
                    fontWeight: 600,
                    color: colours.highlight,
                    textDecoration: 'none',
                  },
                }}
              >
                {client?.name || '-'}
              </Link>
              <Text variant="small" styles={{ root: { marginLeft: '8px', color: colours.greyText } }}>
                {client?.type || '-'}
              </Text>
            </Stack>
            <Separator />
            <Stack horizontal tokens={{ childrenGap: 10 }} verticalAlign="center">
              <TooltipHost content="Call Client">
                <div
                  className={iconButtonStyle}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = client?.primary_phone_number
                      ? `tel:${client.primary_phone_number}`
                      : '#';
                  }}
                  title="Call Client"
                  aria-label="Call Client"
                >
                  <Icon iconName="Phone" />
                </div>
              </TooltipHost>
              <TooltipHost content="Email Client">
                <div
                  className={iconButtonStyle}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = client?.primary_email_address
                      ? `mailto:${client.primary_email_address}`
                      : '#';
                  }}
                  title="Email Client"
                  aria-label="Email Client"
                >
                  <Icon iconName="Mail" />
                </div>
              </TooltipHost>
              <Stack tokens={{ childrenGap: 4 }}>
                <Text variant="small" styles={baseTextStyle}>
                  {client?.primary_phone_number || '-'}
                </Text>
                <Text variant="small" styles={baseTextStyle}>
                  {client?.primary_email_address || '-'}
                </Text>
              </Stack>
            </Stack>
          </Stack>
        </div>
      </div>

      {/* INLINE TAGS */}
      <Stack horizontal wrap tokens={{ childrenGap: 8, padding: '12px 0' }}>
        <span className={tagStyle}>Matter ID: {matter.UniqueID || '-'}</span>
        <span className={tagStyle}>Client ID: {matter.ClientID || '-'}</span>
        <span className={tagStyle}>Value: {getValue(matter.ApproxValue)}</span>
        {matter.Source && matter.Source.trim() && (
          <span className={tagStyle}>Source: {matter.Source.trim()}</span>
        )}
        {matter.Referrer && matter.Referrer.trim() && (
          <span className={tagStyle}>Referrer: {matter.Referrer.trim()}</span>
        )}
      </Stack>

      {/* Side-by-side MessageBars: Overview/Client Balances on the left and Outstanding data on the right */}
      <Stack horizontal tokens={{ childrenGap: 20 }} styles={{ root: { marginTop: '16px' } }}>
        <Stack.Item styles={{ root: { flex: 1 } }}>
          {renderOverviewMessageBar()}
        </Stack.Item>
        <Stack.Item styles={{ root: { flex: 1 } }}>
          {renderOutstandingSection()}
        </Stack.Item>
      </Stack>
    </div>
  );
};

export default MatterOverview;
