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
  matter: Matter;
  onEdit?: () => void; // Optional edit action for rating
}

const MatterOverview: React.FC<MatterOverviewProps> = ({ matter, onEdit }) => {
  const { isDarkMode } = useTheme();
  const ratingStyle = mapRatingToStyle(matter.Rating);

  // Handle rating click
  const handleRatingClick = () => {
    if (onEdit) onEdit();
  };

  // Hyperlink URLs
  const matterLink = `https://eu.app.clio.com/nc/#/matters/${matter.UniqueID || '-'}`;
  const clientLink = `https://eu.app.clio.com/nc/#/contacts/${matter.ClientID || '-'}`;

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
   *  S T Y L E  B L O C K
   * ------------------------------------------
   */

  // Main container (no hover effect here)
  const containerStyle = mergeStyles({
    padding: '24px',
    borderRadius: '8px',
    marginBottom: '20px',
    position: 'relative',
    background: isDarkMode
      ? 'linear-gradient(135deg, #333 0%, #444 100%)'
      : 'linear-gradient(135deg, #f3f3f3 0%, #ffffff 100%)',
    boxShadow: isDarkMode
      ? '0 4px 16px rgba(0,0,0,0.6)'
      : '0 4px 16px rgba(0,0,0,0.1)',
    fontFamily: 'Raleway, sans-serif',
  });

  // Top section: Matter reference & rating
  const topSectionStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  });

  // Matter reference styling
  const matterReferenceStyle = mergeStyles({
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  });

  // Matter reference text
  const referenceTextStyle = mergeStyles({
    fontSize: '1.5rem',
    fontWeight: 700,
    color: colours.highlight,
    textDecoration: 'none',
  });

  // Rating bubble (with border logic)
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

  // Wrapper for the two-column info section (Matter Details & Client)
  const infoSectionWrapper = mergeStyles({
    marginTop: '20px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
  });

  // Info card style for Matter Details and Client with hover effect
  const infoCardStyle = mergeStyles({
    flex: '1 1 320px',
    minWidth: '280px',
    backgroundColor: isDarkMode ? '#262626' : '#fff',
    borderRadius: '8px',
    boxShadow: isDarkMode
      ? '0 2px 8px rgba(0,0,0,0.5)'
      : '0 2px 8px rgba(0,0,0,0.1)',
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

  // Base text style for content
  const baseTextStyle = {
    root: {
      color: isDarkMode ? colours.dark.text : colours.light.text,
      fontSize: 'small',
    },
  };

  // Persona bubble for solicitors
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

  // Icon button style for phone/email bubbles
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

  // Tag (pill) style (rendered inline without a dedicated section)
  const tagStyle = mergeStyles({
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '16px',
    backgroundColor: isDarkMode ? '#3d3d3d' : '#e0e0e0',
    color: isDarkMode ? '#fff' : '#333',
    fontSize: '12px',
    fontWeight: 500,
    marginRight: '8px',
    marginBottom: '8px',
  });

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

      {/* INFO SECTION WRAPPER (Two cards: Matter Details & Client) */}
      <div className={infoSectionWrapper}>
        {/* MATTER DETAILS CARD */}
        <div className={infoCardStyle}>
          <Text variant="mediumPlus" styles={{ root: { fontWeight: 700, marginBottom: '8px' } }}>
            Matter Details
          </Text>
          <Separator />
          {/* First Section: Practice Area, Description (and Opponent if exists) */}
          <Stack tokens={{ childrenGap: 8 }} styles={{ root: { marginTop: '12px' } }}>
            <Text variant="small" styles={baseTextStyle}>
              <strong>Practice Area:</strong> {matter.PracticeArea?.trim() || '-'}
            </Text>
            <Text variant="small" styles={baseTextStyle}>
              <strong>Description:</strong> {matter.Description?.trim() || '-'}
            </Text>
            {matter.Opponent?.trim() && (
              <Text variant="small" styles={baseTextStyle}>
                <strong>Opponent:</strong> {matter.Opponent.trim()}
              </Text>
            )}
          </Stack>

          <Separator styles={{ root: { marginTop: '12px', marginBottom: '12px' } }} />

          {/* Second Section: Open Date and CCL Date */}
          <Stack tokens={{ childrenGap: 8 }} styles={{ root: { marginTop: '12px' } }}>
            <Text variant="small" styles={baseTextStyle}>
              <strong>Open Date:</strong> {formatDate(matter.OpenDate)}
            </Text>
            <Text variant="small" styles={baseTextStyle}>
              <strong>CCL Date:</strong> {formatDate(matter.CCL_date)}
            </Text>
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
                iconName="Contact"
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
                {matter.ClientName?.trim() || '-'}
              </Link>
            </Stack>
            <Separator />
            <Stack horizontal tokens={{ childrenGap: 10 }} verticalAlign="center">
              <TooltipHost content="Call Client">
                <div
                  className={iconButtonStyle}
                  onClick={(e) => {
                    e.stopPropagation();
                    window.location.href = matter.ClientPhone?.trim()
                      ? `tel:${matter.ClientPhone}`
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
                    window.location.href = matter.ClientEmail?.trim()
                      ? `mailto:${matter.ClientEmail}`
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
                  {matter.ClientPhone?.trim() || '-'}
                </Text>
                <Text variant="small" styles={baseTextStyle}>
                  {matter.ClientEmail?.trim() || '-'}
                </Text>
              </Stack>
            </Stack>
          </Stack>
        </div>
      </div>

      {/* INLINE TAGS (rendered after the info cards) */}
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
    </div>
  );
};

export default MatterOverview;
