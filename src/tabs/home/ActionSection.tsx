import React, { useState, useMemo } from 'react';
import { Stack, Text, Toggle, mergeStyles, Icon } from '@fluentui/react';
import { Transaction, Matter } from '../../app/functionality/types';
import { colours } from '../../app/styles/colours';
import TransactionCard from '../transactions/TransactionCard';
import TransactionApprovalPopup from '../transactions/TransactionApprovalPopup';
import BespokePanel from '../../app/functionality/BespokePanel';

interface ActionSectionProps {
  transactions: Transaction[];
  userInitials: string;
  isDarkMode: boolean;
  onTransactionClick: (transaction: Transaction) => void;
  matters: Matter[];
  updateTransaction: (updatedTransaction: Transaction) => void;
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
  onTransactionClick,
  matters,
  updateTransaction,
}) => {
  const [showOnlyMine, setShowOnlyMine] = useState(true);
  const [isTransactionPopupOpen, setIsTransactionPopupOpen] = useState<boolean>(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Treat user "LZ" as "AC" for filtering purposes
  const effectiveInitials = userInitials.toLowerCase() === 'lz' ? 'ac' : userInitials;

  const filteredTransactions = useMemo(() => {
    console.log("All transactions in ActionSection:", transactions);
    const relevantTransactions = transactions.filter(
      (tx) => ['requested', 'transfer'].includes((tx.status || '').toLowerCase())
    );
    console.log("Relevant transactions (after status filter):", relevantTransactions);
    console.log("Fee earner values in transactions:", relevantTransactions.map(tx => tx.fe));
    console.log("Effective initials for filtering:", effectiveInitials);
    if (showOnlyMine) {
      const filtered = relevantTransactions.filter(
        (tx) => (tx.fe || '').toLowerCase() === effectiveInitials.toLowerCase()
      );
      console.log("Filtered transactions (showOnlyMine):", filtered);
      return filtered;
    }
    console.log("Filtered transactions (all):", relevantTransactions);
    return relevantTransactions;
  }, [transactions, effectiveInitials, showOnlyMine]);

  const defaultCollapsed = filteredTransactions.length === 0 && showOnlyMine;

  // Handle transaction click to open the popup
  const handleTransactionClick = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsTransactionPopupOpen(true);
  };

  // Handle transaction submission
  const handleTransactionSubmit = (
    values: { transferRequested: boolean; customAmount?: number; transferCustom?: boolean },
    updatedTransaction: Transaction
  ) => {
    console.log("Updating transaction in ActionSection:", updatedTransaction);
    // Notify the parent component to update its state
    updateTransaction(updatedTransaction);
  };

  return (
    <CollapsibleSection
      title="Transfers and Outstanding Balances"
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
            <Text>No transfers or balances require action at this time.</Text>
          </div>
        ) : (
          <div className={gridContainerStyle}>
            {filteredTransactions.map((tx) => (
              <TransactionCard
                key={tx.transaction_id}
                transaction={tx}
                onClick={() => handleTransactionClick(tx)}
              />
            ))}
          </div>
        )}
      </Stack>

      {/* Transaction Approval Popup */}
      <BespokePanel
        isOpen={isTransactionPopupOpen}
        onClose={() => setIsTransactionPopupOpen(false)}
        title="Approve Transaction"
        width="1000px"
      >
        {selectedTransaction && (
          <TransactionApprovalPopup
            transaction={selectedTransaction}
            matters={matters || []}
            onSubmit={handleTransactionSubmit}
            onCancel={() => setIsTransactionPopupOpen(false)}
            userInitials={userInitials} // Pass userInitials to TransactionApprovalPopup
          />
        )}
      </BespokePanel>
    </CollapsibleSection>
  );
};

export default ActionSection;