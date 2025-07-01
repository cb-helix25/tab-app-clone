import React, { useState, useMemo } from 'react';
import { Stack, PrimaryButton, Dropdown, IDropdownOption } from '@fluentui/react';
import { InstructionData } from '../../app/functionality/types';
import { dashboardTokens } from './componentTokens';

interface DraftCCLPageProps {
    onBack: () => void;
    instruction?: any;
    instructions?: InstructionData[];
}

const DraftCCLPage: React.FC<DraftCCLPageProps> = ({ onBack, instruction, instructions }) => {
    const [selectedRef, setSelectedRef] = useState<string>(instruction?.InstructionRef || '');
    const [confirmed, setConfirmed] = useState<boolean>(!!instruction);

    const allInstructions = useMemo(
        () =>
            (instructions ?? [])
                .flatMap((p) => p.instructions ?? [])
                .map((i) => ({ key: i.InstructionRef, text: i.InstructionRef })) as IDropdownOption[],
        [instructions],
    );

    const selected = useMemo(
        () =>
            (instructions ?? [])
                .flatMap((p) => p.instructions ?? [])
                .find((i) => i.InstructionRef === selectedRef),
        [instructions, selectedRef],
    );

    if (!confirmed && instructions) {
        return (
            <Stack tokens={dashboardTokens} className="workflow-container">
                <PrimaryButton text="Back" onClick={onBack} style={{ marginBottom: 16 }} />
                <Dropdown
                    placeholder="Select Instruction"
                    options={allInstructions}
                    selectedKey={selectedRef}
                    onChange={(_, o) => setSelectedRef(o?.key as string)}
                    styles={{ root: { maxWidth: 300, marginBottom: 16 } }}
                />
                <PrimaryButton text="Continue" disabled={!selectedRef} onClick={() => setConfirmed(true)} />
            </Stack>
        );
    }

    const inst = instruction || selected;

    return (
        <Stack tokens={dashboardTokens} className="workflow-container">
            <PrimaryButton text="Back" onClick={onBack} style={{ marginBottom: 16 }} />
            {inst && (
                <iframe
                    title="Client Care Letter"
                    src="/docs/ccl.pdf"
                    style={{ width: '100%', height: '80vh', border: 'none' }}
                />
            )}
        </Stack>
    );
};

export default DraftCCLPage;
