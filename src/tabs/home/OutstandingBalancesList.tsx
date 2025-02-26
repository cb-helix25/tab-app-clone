import React from 'react';
import { Stack, Text } from '@fluentui/react';
import { mergeStyles } from '@fluentui/react';
import { colours } from '../../app/styles/colours';

interface MatterBalance {
  id: number;
  ClientName: string;
  total_outstanding_balance: number;
  // add any other fields you need
}

interface OutstandingBalancesListProps {
  balances: MatterBalance[];
}

const listContainerStyle = mergeStyles({
  padding: '10px',
  backgroundColor: colours.light.sectionBackground,
  borderRadius: '8px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
});

const itemStyle = mergeStyles({
  padding: '8px',
  borderBottom: `1px solid ${colours.light.border}`,
});

const OutstandingBalancesList: React.FC<OutstandingBalancesListProps> = ({ balances }) => {
  // Filter only matters with a non-zero balance
  const filtered = balances.filter(item => item.total_outstanding_balance > 0);

  if (filtered.length === 0) {
    return <Text>No outstanding balances found.</Text>;
  }

  return (
    <div className={listContainerStyle}>
      {filtered.map(item => (
        <Stack key={item.id} horizontal verticalAlign="center" className={itemStyle}>
          <Text style={{ flex: 1, fontWeight: 600 }}>{item.ClientName}</Text>
          <Text style={{ color: 'red', fontWeight: 700 }}>
            £{item.total_outstanding_balance.toFixed(2)}
          </Text>
        </Stack>
      ))}
    </div>
  );
};

export default OutstandingBalancesList;
