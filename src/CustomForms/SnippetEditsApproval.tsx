import React from 'react';
import { Stack, DefaultButton, Text } from '@fluentui/react';
import { mergeStyles } from '@fluentui/react';
import { colours } from '../app/styles/colours';
import { componentTokens } from '../app/styles/componentTokens';
import {
    sharedPrimaryButtonStyles,
    sharedDefaultButtonStyles,
} from '../app/styles/ButtonStyles';

export interface SnippetEdit {
    id: number;
    blockTitle: string;
    proposedText: string;
    proposedLabel?: string;
    proposedSortOrder?: number;
    proposedBlockId?: number;
    isNew?: boolean;
    submittedBy: string;
    reviewNotes?: string;
}

interface SnippetEditsApprovalProps {
    edits: SnippetEdit[];
    onApprove: (id: number) => void;
    onReject: (id: number) => void;
    onClose: () => void;
}

const containerStyle = mergeStyles({
    padding: 20,
    backgroundColor: colours.light.sectionBackground,
    borderRadius: componentTokens.card.base.borderRadius,
    boxShadow: componentTokens.card.base.boxShadow,
});

const cardStyle = mergeStyles({
    border: `1px solid ${colours.light.border}`,
    padding: componentTokens.card.base.padding,
    borderRadius: componentTokens.card.base.borderRadius,
    backgroundColor: colours.light.cardBackground,
    boxShadow: componentTokens.card.base.boxShadow,
});

const SnippetEditsApproval: React.FC<SnippetEditsApprovalProps> = ({
    edits,
    onApprove,
    onReject,
    onClose,
}) => {
    return (
        <Stack className={containerStyle} tokens={{ childrenGap: 16 }}>
            {edits.map((edit) => (
                <Stack key={edit.id} tokens={{ childrenGap: 8 }} className={cardStyle}>
                    <Text variant="mediumPlus">{edit.blockTitle}</Text>
                    <Text>{edit.proposedText}</Text>
                    {edit.proposedLabel && <Text>Label: {edit.proposedLabel}</Text>}
                    {typeof edit.proposedSortOrder === 'number' && (
                        <Text>Sort order: {edit.proposedSortOrder}</Text>
                    )}
                    {edit.proposedBlockId && <Text>Block ID: {edit.proposedBlockId}</Text>}
                    {edit.isNew && <Text variant="small">New snippet</Text>}
                    <Text variant="small">Submitted by {edit.submittedBy}</Text>
                    {edit.reviewNotes && (
                        <Text variant="small">Notes: {edit.reviewNotes}</Text>
                    )}
                    <Stack horizontal tokens={{ childrenGap: 8 }}>
                        <DefaultButton
                            text="Approve"
                            onClick={() => onApprove(edit.id)}
                            styles={sharedPrimaryButtonStyles}
                        />
                        <DefaultButton
                            text="Reject"
                            onClick={() => onReject(edit.id)}
                            styles={sharedDefaultButtonStyles}
                        />
                    </Stack>
                </Stack>
            ))}
            {edits.length === 0 && <Text>No pending edits.</Text>}
            <DefaultButton text="Close" onClick={onClose} styles={sharedDefaultButtonStyles} />
        </Stack>
    );
};

export default SnippetEditsApproval;