import React, { useState } from 'react';
import { mergeStyles, PrimaryButton, DefaultButton, Stack, Text } from '@fluentui/react';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import NewEnquiryList from './NewEnquiryList';
import { NewEnquiry } from '../../app/functionality/newEnquiryTypes';

interface NewEnquiryTestProps {
  // Optional props for integration
}

const NewEnquiryTest: React.FC<NewEnquiryTestProps> = () => {
  const { isDarkMode } = useTheme();
  const [showNewSystem, setShowNewSystem] = useState(false);
  const [selectedEnquiry, setSelectedEnquiry] = useState<NewEnquiry | null>(null);

  const containerStyles = mergeStyles({
    padding: '24px',
    backgroundColor: isDarkMode ? colours.dark.background : colours.light.background,
    borderRadius: '12px',
    border: `2px dashed ${colours.blue}`,
    margin: '16px 0',
  });

  const headerStyles = mergeStyles({
    marginBottom: '16px',
  });

  const titleStyles = mergeStyles({
    fontSize: '20px',
    fontWeight: '600',
    color: isDarkMode ? colours.dark.text : colours.light.text,
    marginBottom: '8px',
  });

  const descriptionStyles = mergeStyles({
    fontSize: '14px',
    color: isDarkMode ? colours.dark.subText : colours.light.subText,
    marginBottom: '16px',
  });

  const buttonContainerStyles = mergeStyles({
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  });

  const statusStyles = mergeStyles({
    fontSize: '12px',
    color: showNewSystem ? colours.blue : (isDarkMode ? colours.dark.subText : colours.light.subText),
    fontWeight: '500',
    padding: '4px 8px',
    backgroundColor: showNewSystem ? `${colours.blue}20` : 'transparent',
    borderRadius: '4px',
  });

  const handleToggleSystem = () => {
    setShowNewSystem(!showNewSystem);
    if (!showNewSystem) {
      setSelectedEnquiry(null);
    }
  };

  const handleSelectEnquiry = (enquiry: NewEnquiry) => {
    setSelectedEnquiry(enquiry);
    console.log('Selected enquiry:', enquiry);
  };

  const handleRateEnquiry = (enquiryId: number) => {
    console.log('Rate enquiry:', enquiryId);
    // Could integrate with existing rating system here
  };

  if (showNewSystem) {
    return (
      <div>
        <div className={containerStyles}>
          <div className={headerStyles}>
            <div className={titleStyles}>🚀 New Enquiry System (Development)</div>
            <div className={descriptionStyles}>
              This is the new enquiry card system using the new database schema.
              {selectedEnquiry && ` Currently selected: ${selectedEnquiry.first} ${selectedEnquiry.last}`}
            </div>
            <DefaultButton
              text="Back to Development Controls"
              onClick={handleToggleSystem}
              styles={{
                root: {
                  marginBottom: '16px',
                },
              }}
            />
          </div>
        </div>
        <NewEnquiryList
          onSelectEnquiry={handleSelectEnquiry}
          onRateEnquiry={handleRateEnquiry}
        />
      </div>
    );
  }

  return (
    <div className={containerStyles}>
      <div className={headerStyles}>
        <div className={titleStyles}>🧪 New Enquiry System Development</div>
        <div className={descriptionStyles}>
          Test the new enquiry card system with mock data and simulated backend fetch.
          This will eventually replace the current enquiry system once deployed.
        </div>
        <div className={buttonContainerStyles}>
          <PrimaryButton
            text="View New Enquiry System"
            onClick={handleToggleSystem}
            iconProps={{ iconName: 'TestPlan' }}
          />
          <span className={statusStyles}>
            {showNewSystem ? 'Active' : 'Ready to Test'}
          </span>
        </div>
      </div>
      
      <Stack tokens={{ childrenGap: 8 }} style={{ marginTop: '16px' }}>
        <Text variant="small" style={{ color: isDarkMode ? colours.dark.subText : colours.light.subText }}>
          <strong>Features to test:</strong>
        </Text>
        <Text variant="small" style={{ color: isDarkMode ? colours.dark.subText : colours.light.subText }}>
          • New card design based on InstructionCard/DealCard patterns
        </Text>
        <Text variant="small" style={{ color: isDarkMode ? colours.dark.subText : colours.light.subText }}>
          • Simulated fetch from fetchEnquiriesData Azure Function
        </Text>
        <Text variant="small" style={{ color: isDarkMode ? colours.dark.subText : colours.light.subText }}>
          • Copy-to-clipboard functionality for names, emails, phone numbers
        </Text>
        <Text variant="small" style={{ color: isDarkMode ? colours.dark.subText : colours.light.subText }}>
          • Responsive design with animations and hover effects
        </Text>
        <Text variant="small" style={{ color: isDarkMode ? colours.dark.subText : colours.light.subText }}>
          • Area-based color coding and iconography
        </Text>
      </Stack>
    </div>
  );
};

export default NewEnquiryTest;
