import React from 'react';
import { Stack, DefaultButton, Text } from '@fluentui/react';

export interface SnippetEdit {
    id: number;
    blockTitle: string;
    proposedText: string;
    submittedBy: string;
}

interface SnippetEditsApprovalProps {
    edits: SnippetEdit[];
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
    onClose: () => void;
}

const SnippetEditsApproval: React.FC<SnippetEditsApprovalProps> = ({ edits, onApprove, onReject, onClose }) => {
    return (
        <Stack tokens={{ childrenGap: 16 }} style={{ width: '100%' }}>
            {edits.map(edit => (
                <Stack key={edit.id} tokens={{ childrenGap: 8 }} style={{ border: '1px solid #ccc', padding: '8px' }}>
                    <Text variant="mediumPlus">{edit.blockTitle}</Text>
                    <Text>{edit.proposedText}</Text>
                    <Text variant="small">Submitted by {edit.submittedBy}</Text>
                    <Stack horizontal tokens={{ childrenGap: 8 }}>
                        <DefaultButton text="Approve" onClick={() => onApprove(edit.id)} />
                        <DefaultButton text="Reject" onClick={() => onReject(edit.id)} />
                    </Stack>
                </Stack>
            ))}
            {edits.length === 0 && <Text>No pending edits.</Text>}
            <DefaultButton text="Close" onClick={onClose} />
        </Stack>
    );
};

export default SnippetEditsApproval;