// src/tabs/matters/PoidCard.tsx
import React from 'react';
import { Stack, Text, mergeStyles, Icon } from '@fluentui/react';
import { POID, TeamData } from '../../app/functionality/types';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';

// Helper to calculate age from a date string
const calculateAge = (dob: string): number => {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

interface PoidCardProps {
  poid: POID;
  selected: boolean;
  onClick: () => void;
  teamData?: TeamData[] | null;
}

const baseCardStyle = mergeStyles({
  position: 'relative',
  padding: '15px',
  borderRadius: '10px',
  width: '220px',
  height: '160px',
  cursor: 'pointer',
  background: 'linear-gradient(135deg, #ffffff, #f9f9f9)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  fontFamily: 'Raleway, sans-serif',
  boxSizing: 'border-box',
  selectors: {
    ':hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    },
  },
});

const darkCardStyle = mergeStyles({
  background: 'linear-gradient(135deg, #333, #444)',
  border: '1px solid #555',
  fontFamily: 'Raleway, sans-serif',
});

const selectedCardStyle = mergeStyles({
  border: `2px solid ${colours.highlight}`,
  background: 'linear-gradient(135deg, #e0f3ff, #cce7ff)',
  fontFamily: 'Raleway, sans-serif',
});

// Adjusted iconStyle for the Accept icon when selected.
const iconStyle = mergeStyles({
  position: 'absolute',
  top: 10,
  right: 10,
  fontSize: 24,
  color: colours.highlight,
});

// Bottom container for POID id and team badge (using same horizontal padding as top)
const bottomContainerStyle = mergeStyles({
  position: 'absolute',
  bottom: 4,
  left: 4,
  right: 4,
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
});

const idTextStyle = mergeStyles({
  fontSize: '0.8rem',
  fontWeight: 600,
  fontFamily: 'Raleway, sans-serif',
});

const badgeStyle = mergeStyles({
  padding: '2px 8px',
  borderRadius: '12px',
  backgroundColor: colours.grey,
  color: '#333',
  fontSize: '0.7rem',
  fontWeight: 600,
  fontFamily: 'Raleway, sans-serif',
});

// Updated background icon style with added padding and 20% smaller font size.
const backgroundIconStyle = mergeStyles({
  position: 'absolute',
  top: 10, // added padding from the top
  right: 10, // added padding from the right
  fontSize: '52px', // 20% smaller than the original 64px
  transformOrigin: 'top right',
  opacity: 1,
  pointerEvents: 'none',
  zIndex: 0,
  color: colours.grey,
});

const contentStyle = mergeStyles({
  position: 'relative',
  zIndex: 1,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'space-between',
});

const PoidCard: React.FC<PoidCardProps> = ({ poid, selected, onClick, teamData }) => {
  const { isDarkMode } = useTheme();

  const cardStyles = mergeStyles(
    baseCardStyle,
    isDarkMode && darkCardStyle,
    selected && selectedCardStyle
  );

  // Determine which icon to show based on the poid.type value.
  // If type is "Yes" show "CityNext", otherwise (or if "No") show "Contact".
  const backgroundIconName = poid.type === "Yes" ? "CityNext" : "Contact";

  // Find team member matching the POID's poc field.
  const teamMember = teamData?.find(
    (member) => member.Email?.toLowerCase() === poid.poc?.toLowerCase()
  );
  const badgeInitials = teamMember?.Initials;

  const dobDisplay = poid.date_of_birth
    ? `${new Date(poid.date_of_birth).toLocaleDateString()} (${calculateAge(poid.date_of_birth)})`
    : null;

  return (
    <div onClick={onClick} className={cardStyles}>
      {/* Background icon */}
      <Icon iconName={backgroundIconName} className={backgroundIconStyle} />

      <div className={contentStyle}>
        <Stack tokens={{ childrenGap: 6 }}>
          {/* Name in mediumPlus with prefix */}
          <Text
            variant="mediumPlus"
            styles={{
              root: {
                fontWeight: 700,
                color: colours.highlight,
                fontFamily: 'Raleway, sans-serif',
              },
            }}
          >
            {poid.prefix ? `${poid.prefix} ` : ''}
            {poid.first} {poid.last}
          </Text>

          {/* DOB with age */}
          {dobDisplay && (
            <Text variant="small" styles={{ root: { fontFamily: 'Raleway, sans-serif' } }}>
              {dobDisplay}
            </Text>
          )}

          {/* Nationality: only the ISO value */}
          {poid.nationality_iso && (
            <Text variant="small" styles={{ root: { fontFamily: 'Raleway, sans-serif' } }}>
              {poid.nationality_iso}
            </Text>
          )}
        </Stack>

        {selected && <Icon iconName="Accept" className={iconStyle} />}

        {/* Bottom container with POID id and team badge */}
        <div className={bottomContainerStyle}>
          <Text variant="small" styles={{ root: idTextStyle }}>
            {poid.poid_id}
          </Text>
          {badgeInitials && (
            <div className={badgeStyle} aria-label={`POC: ${badgeInitials}`}>
              {badgeInitials}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PoidCard;
