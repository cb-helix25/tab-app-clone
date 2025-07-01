import React, { useEffect, useState } from 'react';
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
    snippetId: number;
    blockTitle: string;
    currentText: string;
    currentLabel?: string;
    currentSortOrder?: number;
    currentBlockId?: number;
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
    const [blockMap, setBlockMap] = useState<Record<number, string>>({});

    useEffect(() => {
        const stored = sessionStorage.getItem('prefetchedBlocksData');
        if (stored) {
            try {
                const blocks = JSON.parse(stored);
                const map: Record<number, string> = {};
                (blocks as any[]).forEach((b) => {
                    const id = b.BlockId ?? b.blockId;
                    const title = b.Title || b.title;
                    if (id != null) map[id] = title;
                });
                setBlockMap(map);
            } catch {
                // ignore parse errors
            }
        }
    }, []);
    return (
        <Stack className={containerStyle} tokens={{ childrenGap: 16 }}>
            {edits.map((edit) => {
                const proposedBlockTitle = edit.proposedBlockId ? blockMap[edit.proposedBlockId] : undefined;
                const currentBlockTitle = edit.currentBlockId ? blockMap[edit.currentBlockId] : edit.blockTitle;
                return (
                    <Stack key={edit.id} tokens={{ childrenGap: 8 }} className={cardStyle}>
                        <Text variant="mediumPlus">{currentBlockTitle}</Text>
                        <Text variant="small">Snippet ID: {edit.snippetId}</Text>
                        <Text variant="small">Current label: {edit.currentLabel || 'N/A'}</Text>
                        {typeof edit.currentSortOrder === 'number' && (
                            <Text variant="small">Current sort order: {edit.currentSortOrder}</Text>
                        )}
                        {edit.currentBlockId && (
                            <Text variant="small">Current block: {currentBlockTitle}</Text>
                        )}
                        <Text>Current text:</Text>
                        <Text variant="small">{edit.currentText}</Text>
                        <Text variant="medium">Proposed changes</Text>
                        <Text>{edit.proposedText}</Text>
                        {edit.proposedLabel && <Text>Label: {edit.proposedLabel}</Text>}
                        {typeof edit.proposedSortOrder === 'number' && (
                            <Text>Sort order: {edit.proposedSortOrder}</Text>
                        )}
                        {edit.proposedBlockId && (
                            <Text>Block: {proposedBlockTitle || edit.proposedBlockId}</Text>
                        )}
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
                );
            })}
            {edits.length === 0 && <Text>No pending edits.</Text>}
            <DefaultButton text="Close" onClick={onClose} styles={sharedDefaultButtonStyles} />
        </Stack>
    );
};

export default SnippetEditsApproval;