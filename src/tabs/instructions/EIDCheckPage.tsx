import React, { useState, useMemo } from 'react';
import { Stack, PrimaryButton, Dropdown, IDropdownOption, TextField, Text } from '@fluentui/react';
import { POID } from '../../app/functionality/types';
import { dashboardTokens } from './componentTokens';

interface EIDCheckPageProps {
    poidData: POID[];
    instruction?: any;
    onBack: () => void;
}

const EIDCheckPage: React.FC<EIDCheckPageProps> = ({ poidData, instruction, onBack }) => {
    const pending = useMemo(
        () => poidData.filter((p) => !(p as any).EIDCheckId),
        [poidData],
    );

    const filtered = useMemo(
        () =>
            instruction
                ? pending.filter((p) => p.matter_id === instruction.InstructionRef)
                : pending,
        [pending, instruction],
    );

    const [selectedId, setSelectedId] = useState<string | undefined>(
        () => filtered[0]?.poid_id,
    );
    const [manualEmail, setManualEmail] = useState(instruction?.Email ?? '');

    const options: IDropdownOption[] = filtered.map((p) => ({
        key: p.poid_id,
        text: `${p.first ?? ''} ${p.last ?? ''}`.trim() || String(p.poid_id),
    }));

    const canSubmit = !!selectedId || manualEmail.trim() !== '';

    return (
        <Stack tokens={dashboardTokens}>
            <PrimaryButton text="Back" onClick={onBack} style={{ marginBottom: 16 }} />
            {filtered.length > 0 && (
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
