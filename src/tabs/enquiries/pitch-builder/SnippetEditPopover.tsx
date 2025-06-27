import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Callout, TextField, PrimaryButton, Checkbox, Stack, DirectionalHint } from '@fluentui/react';
import '../../../app/styles/SnippetEditPopover.css';

type SnippetEditPopoverProps = {
    target: HTMLElement;
    onSave: (data: { label: string; sortOrder: number; isNew: boolean }) => void;
    onDismiss: () => void;
};

const SnippetEditPopover: React.FC<SnippetEditPopoverProps> = ({ target, onSave, onDismiss }) => {
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

    const callout = (
        <Callout
            className="snippet-edit-callout"
            target={target}
            onDismiss={onDismiss}
            setInitialFocus
            directionalHint={DirectionalHint.bottomLeftEdge}
            isBeakVisible={false}
            gapSpace={12}
            styles={{ root: { width: 300 } }}
        >
            <Stack tokens={{ childrenGap: 12 }} styles={{ root: { padding: '16px 20px' } }}>
                <TextField
                    label="Label"
                    value={label}
                    onChange={(_, v) => setLabel(v || '')}
                />
                <TextField
                    label="Sort Order"
                    type="number"
                    value={String(sortOrder)}
                    onChange={(_, v) => setSortOrder(Number(v))}
                />
                <Checkbox
                    label="Create as new snippet"
                    checked={isNew}
                    onChange={(_, checked) => setIsNew(!!checked)}
                />
                <Stack horizontal horizontalAlign="end">
                    <PrimaryButton
                        text="Submit"
                        onClick={() => onSave({ label, sortOrder, isNew })}
                    />
                </Stack>
            </Stack>
        </Callout>
    );

    return ReactDOM.createPortal(
        <>
            <div className="snippet-edit-overlay" onClick={onDismiss} />
            {callout}
        </>,
        document.body
    );
};

export default SnippetEditPopover;
