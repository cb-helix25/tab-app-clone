import React, { useState, useMemo } from 'react';
import { Stack, PrimaryButton, Dropdown, IDropdownOption, TextField, Text } from '@fluentui/react';
import { POID } from '../../app/functionality/types';
import { dashboardTokens } from './componentTokens';

interface EIDCheckPageProps {
    poidData: POID[];
    onBack: () => void;
}

const EIDCheckPage: React.FC<EIDCheckPageProps> = ({ poidData, onBack }) => {
    const pending = useMemo(() => poidData.filter((p) => !(p as any).EIDCheckId), [poidData]);
    const [selectedId, setSelectedId] = useState<string | undefined>();
    const [manualEmail, setManualEmail] = useState('');

    const options: IDropdownOption[] = pending.map((p) => ({
        key: p.poid_id,
        text: `${p.first ?? ''} ${p.last ?? ''}`.trim() || String(p.poid_id),
    }));

    const canSubmit = !!selectedId || manualEmail.trim() !== '';

    return (
        <Stack tokens={dashboardTokens}>
            <PrimaryButton text="Back" onClick={onBack} style={{ marginBottom: 16 }} />
            {pending.length > 0 && (
                <>
                    <Text variant="mediumPlus" styles={{ root: { fontWeight: 600, marginBottom: 8 } }}>
                        Choose Proof of ID Submission
                    </Text>
                    <Dropdown
                        options={options}
                        placeholder="Select submission..."
                        selectedKey={selectedId}
                        onChange={(_, o) => setSelectedId(o?.key as string)}
                        styles={{ root: { maxWidth: 300, marginBottom: 20 } }}
                    />
                </>
            )}
            <Text variant="mediumPlus" styles={{ root: { fontWeight: 600, marginTop: 8 } }}>
                Manual Check
            </Text>
            <TextField
                label="Email Address"
                value={manualEmail}
                onChange={(_, v) => setManualEmail(v || '')}
                styles={{ root: { maxWidth: 300 } }}
            />
            <PrimaryButton text="Start Check" disabled={!canSubmit} style={{ marginTop: 16 }} />
        </Stack>
    );
};

export default EIDCheckPage;
