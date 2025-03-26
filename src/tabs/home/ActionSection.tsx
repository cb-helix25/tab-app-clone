// src/tabs/home/ActionSection.tsx

import React, { useState, useMemo } from 'react';
import { Stack, Text, Toggle, mergeStyles, Icon } from '@fluentui/react';
import { Transaction } from '../../app/functionality/types';
import { colours } from '../../app/styles/colours';

interface ActionSectionProps {
  transactions: Transaction[];
  userInitials: string;
  isDarkMode: boolean;
}

const containerStyle = (isDarkMode: boolean) =>
  mergeStyles({
    backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
    padding: '20px',
    borderRadius: '12px',
    boxShadow: isDarkMode
      ? `0 4px 12px ${colours.dark.border}`
      : `0 4px 12px ${colours.light.border}`,
    marginTop: '20px',
  });

const cardStyle = mergeStyles({
  backgroundColor: '#fff',
  padding: '16px',
  borderRadius: '8px',
  boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
  marginBottom: '12px',
});

const ActionSection: React.FC<ActionSectionProps> = ({ transactions, userInitials, isDarkMode }) => {
  const [showOnlyMine, setShowOnlyMine] = useState(true);

  // Filter transactions to only include those with status 'requested'
  const filteredTransactions = useMemo(() => {
    const requested = transactions.filter((tx) => tx.status === 'requested');
    if (showOnlyMine) {
      return requested.filter((tx) => tx.fe.toLowerCase() === userInitials.toLowerCase());
    }
    return requested;
  }, [transactions, userInitials, showOnlyMine]);

  return (
    <div className={containerStyle(isDarkMode)}>
      <Stack tokens={{ childrenGap: 16 }}>
        <Text
          variant="xLarge"
          styles={{ root: { fontWeight: '600', color: isDarkMode ? colours.dark.text : colours.light.text } }}
        >
          Action Section (Draft)
        </Text>
        <Toggle
          label="Show Only My Transactions"
          checked={showOnlyMine}
          onChange={(e, checked) => setShowOnlyMine(!!checked)}
        />
        <Stack tokens={{ childrenGap: 12 }}>
          {filteredTransactions.length === 0 ? (
            <Text>No transactions require action.</Text>
          ) : (
            filteredTransactions.map((tx) => (
              <div
                key={tx.transaction_id}
                className={cardStyle}
                style={{ backgroundColor: isDarkMode ? colours.dark.background : '#fff' }}
              >
                <Stack horizontal tokens={{ childrenGap: 8 }} verticalAlign="center">
                  <Icon iconName="Money" styles={{ root: { fontSize: 20, color: colours.cta } }} />
                  <Text
                    variant="mediumPlus"
                    styles={{ root: { fontWeight: '600', color: isDarkMode ? colours.dark.text : colours.light.text } }}
                  >
                    {tx.matter_ref} - {tx.matter_description}
                  </Text>
                </Stack>
                <Text variant="small">
                  Amount: £{tx.amount} | Date: {new Date(tx.transaction_date).toLocaleDateString()}
                </Text>
                <Text variant="small" styles={{ root: { fontStyle: 'italic', color: '#888' } }}>
                  Fee Earner: {tx.fe}
                </Text>
              </div>
            ))
          )}
        </Stack>
      </Stack>
    </div>
  );
};

export default ActionSection;
