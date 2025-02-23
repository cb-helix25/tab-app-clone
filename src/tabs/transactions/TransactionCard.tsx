// src/tabs/transactions/TransactionCard.tsx

import React from 'react';
import { mergeStyles, Text, Stack, Icon, TooltipHost } from '@fluentui/react';
import { Transaction } from '../../app/functionality/types';
import { colours } from '../../app/styles/colours';
import { useTheme } from '../../app/functionality/ThemeContext';

interface TransactionCardProps {
  transaction: Transaction;
}

// Left border color-coded by status: green if "processed", yellow if anything else
const cardContainer = (isDarkMode: boolean, status?: string | null) =>
  mergeStyles({
    backgroundColor: isDarkMode
      ? colours.dark.cardBackground
      : colours.light.cardBackground,
    borderRadius: '8px',
    padding: '20px',
    boxShadow: isDarkMode
      ? '0 2px 8px rgba(0,0,0,0.6)'
      : '0 2px 8px rgba(0,0,0,0.1)',
    borderLeft: `6px solid ${
      status?.toLowerCase() === 'processed'
        ? colours.green
        : status
        ? colours.yellow
        : 'transparent'
    }`,
    transition: 'transform 0.2s, box-shadow 0.2s',
    selectors: {
      ':hover': {
        transform: 'scale(1.02)',
        boxShadow: isDarkMode
          ? '0 4px 12px rgba(0,0,0,0.8)'
          : '0 4px 12px rgba(0,0,0,0.2)',
      },
    },
  });

// Header style for the top row of the card
const headerStyle = mergeStyles({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
});

// Update format functions to use thousand separators and UK locale
const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('en-GB');

const formatCurrency = (amount: number): string =>
  amount.toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });

const TransactionCard: React.FC<TransactionCardProps> = ({ transaction }) => {
  const { isDarkMode } = useTheme();

  return (
    <div className={cardContainer(isDarkMode, transaction.status)}>
      {/* Top row: Amount with icon on left, date on right */}
      <div className={headerStyle}>
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 10 }}>
          <Icon iconName="Money" styles={{ root: { fontSize: 28, color: colours.highlight } }} />
          <Text variant="xLarge" styles={{ root: { fontWeight: 700, color: colours.highlight } }}>
            {formatCurrency(transaction.amount)}
          </Text>
        </Stack>
        <Text variant="small" styles={{ root: { color: isDarkMode ? '#ccc' : '#666' } }}>
          {formatDate(transaction.transaction_date)}
        </Text>
      </div>

      {/* Body details */}
      <Stack tokens={{ childrenGap: 6 }}>
        <TooltipHost content="Transaction ID">
          <Text variant="small">
            <strong>ID:</strong> {transaction.transaction_id}
          </Text>
        </TooltipHost>

        <TooltipHost content="Matter Reference">
          <Text variant="small">
            <strong>Matter Ref:</strong> {transaction.matter_ref}
          </Text>
        </TooltipHost>

        {/* Show status in a color-coded text */}
        {transaction.status && (
          <TooltipHost content="Status">
            <Text
              variant="small"
              styles={{
                root: {
                  color:
                    transaction.status.toLowerCase() === 'processed'
                      ? colours.green
                      : colours.yellow,
                  fontWeight: 600,
                },
              }}
            >
              {transaction.status}
            </Text>
          </TooltipHost>
        )}

        {/* Transaction type */}
        <TooltipHost content="Transaction Type">
          <Text variant="small">
            <strong>Type:</strong> {transaction.type}
          </Text>
        </TooltipHost>

        {/* Intake date */}
        <TooltipHost content="Intake Date">
          <Text variant="small">
            <strong>Intake:</strong> {formatDate(transaction.intake_date)}
          </Text>
        </TooltipHost>

        {/* From client indicator */}
        {transaction.from_client && (
          <TooltipHost content="Money Sent By Client">
            <Text variant="small" styles={{ root: { color: colours.green, fontWeight: 600 } }}>
              From Client
            </Text>
          </TooltipHost>
        )}
      </Stack>
    </div>
  );
};

export default TransactionCard;
