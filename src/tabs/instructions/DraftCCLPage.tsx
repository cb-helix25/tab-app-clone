import React, { useState, useMemo, useEffect } from 'react';
import { Stack, PrimaryButton, Dropdown, IDropdownOption } from '@fluentui/react';
import { InstructionData } from '../../app/functionality/types';
import DraftCCLEditor, { DraftCCLData } from './DraftCCLEditor';
import { dashboardTokens } from './componentTokens';
import '../../app/styles/MatterOpeningCard.css';

interface DraftCCLPageProps {
    onBack?: () => void;
    instruction?: any;
    instructions?: InstructionData[];
    matterId?: string;
}

const DraftCCLPage: React.FC<DraftCCLPageProps> = ({ onBack, instruction, instructions, matterId }) => {
    const [selectedRef, setSelectedRef] = useState<string>(instruction?.InstructionRef || '');
    const [confirmed, setConfirmed] = useState<boolean>(!!instruction || !!matterId);
    const [draft, setDraft] = useState<DraftCCLData>({
        header: '',
        scopeOfWork: '',
        fees: '',
        terms: '',
        signatures: '',
    });
    useEffect(() => {
        if (matterId) {
            fetch(`/api/ccl/${matterId}`)
                .then(r => (r.ok ? r.json() : null))
                .then(d => {
                    if (d && d.draftJson) setDraft(d.draftJson);
                })
                .catch(() => {});
        }
    }, [matterId]);

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

    const handleSave = async () => {
        if (!inst) return;
        await fetch(`/api/ccl/${matterId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ draftJson: draft })
        });
    };

    const handleGenerate = async () => {
        if (!inst && !matterId) return;
        await fetch('/api/ccl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matterId: matterId || selectedRef, draftJson: draft })
        });
    };

    return (
        <Stack tokens={dashboardTokens} className="workflow-container">
            <div className="workflow-main matter-opening-card">
                <div className="step-header">
                    <h3 className="step-title">Client Care Letter</h3>
                </div>
                <div className="step-content">
                    <DraftCCLEditor value={draft} onChange={setDraft} />
                    <div style={{ marginTop: 16 }}>
                        <PrimaryButton text="Save Draft" onClick={handleSave} style={{ marginRight: 8 }} />
                        <PrimaryButton text="Generate Word" onClick={handleGenerate} />
                    </div>
                </div>
            </div>
        </Stack>
    );
};

export default DraftCCLPage;
