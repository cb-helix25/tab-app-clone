import React, { useState, useEffect } from 'react';
import {
    TextField,
    ITextFieldStyles,
    PrimaryButton,
    Checkbox,
    Stack,
    Text,
} from '@fluentui/react';
import PopoverContainer from '../../../components/PopoverContainer';
import { sharedPrimaryButtonStyles } from '../../../app/styles/ButtonStyles';
import '../../../app/styles/SnippetEditPopover.css';

type SnippetEditPopoverProps = {
    target: HTMLElement;
    onSave: (data: { label: string; sortOrder: number; isNew: boolean }) => void;
    onDismiss: () => void;
    previewText?: string;
};
// invisible change

const SnippetEditPopover: React.FC<SnippetEditPopoverProps> = ({ target, onSave, onDismiss, previewText }) => {
    const [label, setLabel] = useState('');
    const [sortOrder, setSortOrder] = useState<number>(0);
    const [isNew, setIsNew] = useState(false);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onDismiss();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onDismiss]);

    const textFieldStyles: Partial<ITextFieldStyles> = {
        fieldGroup: {
            border: '1px solid #ccc',
            borderRadius: 0,
            backgroundColor: '#ffffff',
        },
        field: {
            fontSize: 14,
            padding: '8px 12px',
            fontWeight: '400',
            borderRadius: 0,
            boxShadow: 'none',
        },
    };

    const content = (
        <Stack tokens={{ childrenGap: 12 }} styles={{ root: { padding: '16px 20px' } }}>
            <Text variant="mediumPlus" styles={{ root: { fontWeight: 600 } }}>
                Snippet Details
            </Text>
            {previewText && (
                <Text variant="small" styles={{ root: { whiteSpace: 'pre-wrap' } }}>
                    {previewText}
                </Text>
            )}
            <Text variant="small">Provide a label and sort order.</Text>
            <TextField
                label="Label"
                value={label}
                onChange={(_, v) => setLabel(v || '')}
                styles={textFieldStyles}
            />
            <TextField
                label="Sort Order"
                type="number"
                value={String(sortOrder)}
                onChange={(_, v) => setSortOrder(Number(v))}
                styles={textFieldStyles}
            />
            <Checkbox
                label="Create as new snippet"
                checked={isNew}
                onChange={(_, checked) => setIsNew(!!checked)}
            />
            <Stack horizontal horizontalAlign="end">
                <PrimaryButton
                    text="Save"
                    styles={sharedPrimaryButtonStyles}
                    onClick={() => onSave({ label, sortOrder, isNew })}
                />
            </Stack>
        </Stack>
    );

    return (
        <PopoverContainer target={target} onDismiss={onDismiss} width={320} className="snippet-edit-modal">
            {content}
        </PopoverContainer>
    );
};

export default SnippetEditPopover;
