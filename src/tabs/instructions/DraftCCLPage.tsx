import React, { useState, useMemo } from 'react';
// invisible change
//
import { Stack, PrimaryButton, Dropdown, IDropdownOption } from '@fluentui/react';
import { InstructionData } from '../../app/functionality/types';
import { dashboardTokens } from './componentTokens';
import '../../app/styles/MatterOpeningCard.css';

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
            <div className="workflow-main matter-opening-card">
                <div className="step-header">
                    <h3 className="step-title">Select Instruction for Client Care Letter</h3>
                </div>
                <div className="step-content">
                    <Dropdown
                        placeholder="Select Instruction"
                        options={allInstructions}
                        selectedKey={selectedRef}
                        onChange={(_, o) => setSelectedRef(o?.key as string)}
                        styles={{ root: { maxWidth: 300, marginBottom: 16 } }}
                    />
                    <PrimaryButton text="Continue" disabled={!selectedRef} onClick={() => setConfirmed(true)} />
                </div>
            </div>
        </Stack>
        );
    }

    const inst = instruction || selected;

    return (
        <Stack tokens={dashboardTokens} className="workflow-container">
            <div className="workflow-main matter-opening-card">
                <div className="step-header">
                    <h3 className="step-title">Client Care Letter</h3>
                </div>
                <div className="step-content">
                    {inst && (
                    <iframe
                        title="Client Care Letter"
                        src={require('../../assets/ccl.pdf')}
                        style={{ width: '100%', height: '80vh', border: 'none' }}
                    />
                    )}
                </div>
            </div>
        </Stack>
    );
};

export default DraftCCLPage;
