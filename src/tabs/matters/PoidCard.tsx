// src/tabs/matters/PoidCard.tsx
import React from 'react';
import { Stack, Text, mergeStyles, Icon } from '@fluentui/react';
import { POID } from '../../app/functionality/types';
import { useTheme } from '../../app/functionality/ThemeContext';

interface PoidCardProps {
  poid: POID;
  selected: boolean;
  onClick: () => void;
}

const baseCardStyle = mergeStyles({
  position: 'relative',
  padding: '15px',
  borderRadius: '10px',
  width: '220px',
  height: '140px',
  cursor: 'pointer',
  background: 'linear-gradient(135deg, #ffffff, #f9f9f9)',
  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  fontFamily: 'Raleway, sans-serif',
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
  border: '2px solid #0078d4',
  background: 'linear-gradient(135deg, #e0f3ff, #cce7ff)',
  fontFamily: 'Raleway, sans-serif',
});

const iconStyle = mergeStyles({
  position: 'absolute',
  top: 10,
  right: 10,
  fontSize: 24,
  color: '#0078d4',
});

const PoidCard: React.FC<PoidCardProps> = ({ poid, selected, onClick }) => {
  const { isDarkMode } = useTheme();
  const cardStyles = mergeStyles(
    baseCardStyle,
    isDarkMode && darkCardStyle,
    selected && selectedCardStyle
  );

  return (
    <div onClick={onClick} className={cardStyles}>
      <Stack tokens={{ childrenGap: 6 }}>
        <Text 
          variant="mediumPlus" 
          styles={{ root: { fontWeight: 600, fontFamily: 'Raleway, sans-serif' } }}
        >
          {poid.poid_id}
        </Text>
        <Text 
          variant="small" 
          styles={{ root: { fontFamily: 'Raleway, sans-serif' } }}
        >
          {poid.first} {poid.last}
        </Text>
        {poid.date_of_birth && (
          <Text 
            variant="small" 
            styles={{ root: { fontFamily: 'Raleway, sans-serif' } }}
          >
            DOB: {new Date(poid.date_of_birth).toLocaleDateString()}
          </Text>
        )}
      </Stack>
      {selected && <Icon iconName="Accept" className={iconStyle} />}
    </div>
  );
};

export default PoidCard;
