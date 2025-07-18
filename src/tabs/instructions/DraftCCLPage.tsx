import React, { useState, useMemo, useEffect } from 'react';
import { Stack, PrimaryButton, Dropdown, IDropdownOption } from '@fluentui/react';
import { InstructionData, CCLJson, UserData } from '../../app/functionality/types';
import localUserData from '../../localData/localUserData.json';
import HelixInstructionCCLDocumentEditor from './components/HelixInstructionCCLDocumentEditor';
import { dashboardTokens } from './componentTokens';
import '../../app/styles/MatterOpeningCard.css';

interface DraftCCLPageProps {
    onBack?: () => void;
    instruction?: any;
    instructions?: InstructionData[];
    matterId?: string;
}

const DraftCCLPage: React.FC<DraftCCLPageProps> = ({
    onBack,
    instruction,
    instructions,
    matterId
}) => {
    const [selectedRef, setSelectedRef] = useState<string>(
        instruction?.InstructionRef || ''
    );
    const [confirmed, setConfirmed] = useState<boolean>(
        !!instruction || !!matterId
    );
    const [state, setState] = useState<{
        draftJson: CCLJson;
        url: string;
        saving: boolean;
        generating: boolean;
    }>({
        draftJson: { header: '', scopeOfWork: '', fees: '', terms: '', signatures: '' },
        url: '',
        saving: false,
        generating: false
    });

    const currentUser: UserData | undefined = (localUserData as UserData[])[0];
    const canGenerate = currentUser?.Role === 'Partner';

    useEffect(() => {
        if (matterId) {
            fetch(`/api/ccl/${matterId}`)
                .then(r => (r.ok ? r.json() : null))
                .then(d => {
                    if (d) {
                        setState(s => ({
                            ...s,
                            draftJson: d.json || s.draftJson,
                            url: d.url || ''
                        }));
                    }
                })
                .catch(() => { });
        }
    }, [matterId]);

    const allInstructions = useMemo(
        () =>
            (instructions ?? [])
                .flatMap(p => p.instructions ?? [])
                .map(i => ({ key: i.InstructionRef, text: i.InstructionRef })) as IDropdownOption[],
        [instructions]
    );

    const selected = useMemo(
        () =>
            (instructions ?? [])
                .flatMap(p => p.instructions ?? [])
                .find(i => i.InstructionRef === selectedRef),
        [instructions, selectedRef]
    );

    if (!confirmed && instructions) {
        return (
            <Stack tokens={dashboardTokens} className="workflow-container">
                <div className="workflow-main matter-opening-card">
                    <div className="step-header">
                        <h3 className="step-title">
                            Select Instruction for Client Care Letter
                        </h3>
                    </div>
                    <div className="step-content">
                        <Dropdown
                            placeholder="Select Instruction"
                            options={allInstructions}
                            selectedKey={selectedRef}
                            onChange={(_, o) => setSelectedRef(o?.key as string)}
                            styles={{ root: { maxWidth: 300, marginBottom: 16 } }}
                        />
                        <PrimaryButton
                            text="Continue"
                            disabled={!selectedRef}
                            onClick={() => setConfirmed(true)}
                        />
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
                    <HelixInstructionCCLDocumentEditor
                        initialContent={JSON.stringify(state.draftJson)}
                        initialEmail={{
                            to: inst?.Client?.Email || '',
                            cc: '',
                            bcc: '',
                            subject: `CCL – ${inst.InstructionRef}`
                        }}
                        onSave={async (
                            finalText: string,
                            placeholders: Record<string, string>
                        ): Promise<void> => {
                            await fetch(`/api/ccl/${matterId}`, {
                                method: 'PATCH',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ text: finalText, placeholders })
                            });
                        }}
                        isDarkMode={false}
                    />
                </div>
            </div>
        </Stack>
    );
};

export default DraftCCLPage;
