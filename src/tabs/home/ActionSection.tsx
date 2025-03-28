// src/tabs/home/ActionSection.tsx

import React, { useState, useMemo } from 'react';
import { Stack, Text, Toggle, mergeStyles, Icon } from '@fluentui/react';
import { Transaction } from '../../app/functionality/types';
import { colours } from '../../app/styles/colours';
import TransactionCard from '../transactions/TransactionCard';

interface ActionSectionProps {
  transactions: Transaction[];
  userInitials: string;
  isDarkMode: boolean;
}

const CollapsibleSection: React.FC<{
  title: string;
  children: React.ReactNode;
  isDarkMode: boolean;
  defaultCollapsed?: boolean;
}> = ({ title, children, isDarkMode, defaultCollapsed = false }) => {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);
  const toggleCollapse = () => setCollapsed(!collapsed);

  return (
    <div
      style={{
        marginBottom: '20px',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
        borderRadius: '4px',
        overflow: 'hidden',
      }}
    >
      <div
        onClick={toggleCollapse}
        style={{
          background: `linear-gradient(to right, ${colours.grey}, ${
            isDarkMode ? colours.dark.sectionBackground : 'white'
          })`,
          color: '#333333',
          padding: '16px 12px',
          minHeight: '48px',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontSize: '16px',
        }}
      >
        <span style={{ fontWeight: 600 }}>{title}</span>
        <Icon
          iconName="ChevronDown"
          styles={{
            root: {
              fontSize: '16px',
              transform: collapsed ? 'rotate(0deg)' : 'rotate(180deg)',
              transition: 'transform 0.3s ease',
            },
          }}
        />
      </div>
      {!collapsed && (
        <div
          style={{
            padding: '20px',
            backgroundColor: isDarkMode
              ? colours.dark.sectionBackground
              : colours.light.sectionBackground,
            boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
          }}
        >
          {children}
        </div>
      )}
    </div>
  );
};

const gridContainerStyle = mergeStyles({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
  gap: '20px',
  width: '100%',
});

const noActionsClass = mergeStyles({
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
});

const ActionSection: React.FC<ActionSectionProps> = ({
  transactions,
  userInitials,
  isDarkMode,
}) => {
  const [showOnlyMine, setShowOnlyMine] = useState(true);

  // Treat user "LZ" as "AC" for filtering purposes
  const effectiveInitials = userInitials.toLowerCase() === 'lz' ? 'ac' : userInitials;

  const filteredTransactions = useMemo(() => {
    const requested = transactions.filter((tx) => tx.status === 'requested');
    if (showOnlyMine) {
      return requested.filter(
        (tx) => tx.fe.toLowerCase() === effectiveInitials.toLowerCase()
      );
    }
    return requested;
  }, [transactions, effectiveInitials, showOnlyMine]);

  const defaultCollapsed = filteredTransactions.length === 0 && showOnlyMine;

  return (
    <CollapsibleSection
      title="Pending Transactions"
      isDarkMode={isDarkMode}
      defaultCollapsed={defaultCollapsed}
    >
      <Stack tokens={{ childrenGap: 16 }}>
        <Toggle
          checked={showOnlyMine}
          onText="Mine"
          offText="All"
          onChange={(e, checked) => setShowOnlyMine(!!checked)}
          styles={{ root: { marginBottom: '10px' } }}
        />
        {filteredTransactions.length === 0 ? (
          <div className={noActionsClass}>
            <Icon
              iconName="CompletedSolid"
              styles={{ root: { fontSize: '16px', color: colours.green } }}
            />
            <Text>No transactions require action at this time.</Text>
          </div>
        ) : (
          <div className={gridContainerStyle}>
            {filteredTransactions.map((tx) => (
              <TransactionCard key={tx.transaction_id} transaction={tx} />
            ))}
          </div>
        )}
      </Stack>
    </CollapsibleSection>
  );
};

export default ActionSection;