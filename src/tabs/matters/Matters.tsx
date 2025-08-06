import React, { useMemo, useState } from 'react';
import { Stack, Text, Spinner, SpinnerSize, MessageBar, MessageBarType, IconButton } from '@fluentui/react';
import { Matter, UserData } from '../../app/functionality/types';
import MatterCard from './MatterCard';
import MatterOverview from './MatterOverview';

interface MattersProps {
  matters: Matter[];
  isLoading: boolean;
  error: string | null;
  userData: UserData[] | null;
}

const Matters: React.FC<MattersProps> = ({ matters, isLoading, error, userData }) => {
  const [selected, setSelected] = useState<Matter | null>(null);

  const userFullName = userData?.[0]?.FullName?.toLowerCase();
  const userInitials = userData?.[0]?.Initials?.toLowerCase();

  const filtered = useMemo(() => {
    if (!userFullName) return [];
    return matters.filter((m) => {
      const responsible = m.ResponsibleSolicitor?.toLowerCase() || '';
      const originating = m.OriginatingSolicitor?.toLowerCase() || '';
      return (
        responsible.includes(userFullName) ||
        originating.includes(userFullName) ||
        responsible === userInitials ||
        originating === userInitials
      );

    });
  }, [matters, userFullName, userInitials]);

  if (selected) {
    return (
      <div style={{ padding: 20 }}>
        <IconButton iconProps={{ iconName: 'Back' }} onClick={() => setSelected(null)} />
        <MatterOverview matter={selected} />
      </div>
    );
  }

  if (isLoading) {
    return <Spinner label="Loading matters..." size={SpinnerSize.medium} />;
  }

  if (error) {
    return <MessageBar messageBarType={MessageBarType.error}>{error}</MessageBar>;
  }

  if (filtered.length === 0) {
    return <Text>No matters found.</Text>;
  }
  return (
    <Stack>
      {filtered.map((m, idx) => (
        <MatterCard
          key={m.UniqueID}
          matter={m}
          onSelect={setSelected}
          animationDelay={idx * 0.05}
        />
      ))}
    </Stack>
  );
};

export default Matters;