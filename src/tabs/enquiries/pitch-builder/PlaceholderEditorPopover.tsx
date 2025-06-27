import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Callout, TextField, PrimaryButton, Stack, DirectionalHint } from '@fluentui/react';
import '../../../app/styles/PlaceholderEditorPopover.css';

type PlaceholderEditorPopoverProps = {
    target: HTMLElement;
    initialText: string;
    before: string;
    after: string;
    onSave: (text: string) => void;
    onDismiss: () => void;
};

const PlaceholderEditorPopover: React.FC<PlaceholderEditorPopoverProps> = ({
    target,
    initialText,
    before,
    after,
    onSave,
    onDismiss,
}) => {
    const [value, setValue] = useState(initialText);

    useEffect(() => {
        const handleKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onDismiss();
        };
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [onDismiss]);

    const callout = (
        <Callout
            className="placeholder-editor-callout"
            target={target}
            onDismiss={onDismiss}
            setInitialFocus
            directionalHint={DirectionalHint.bottomLeftEdge}
            isBeakVisible={false}
            gapSpace={12}
        >
            <Stack tokens={{ childrenGap: 12 }} styles={{ root: { padding: '20px 24px' } }}>
                <span className="placeholder-context">{before}</span>
                <TextField
                    value={value}
                    onChange={(_, v) => setValue(v || '')}
                    autoFocus
                    styles={{
                        fieldGroup: { border: 'none', backgroundColor: '#f4f4f7' },
                        field: { fontSize: 16, padding: '16px', fontWeight: 400, borderRadius: 8, boxShadow: 'none' },
                    }}
                />
                <span className="placeholder-context">{after}</span>
                <Stack horizontal horizontalAlign="end">
                    <PrimaryButton
                        text="Save"
                        styles={{
                            root: { padding: '12px 28px', fontSize: 14, fontWeight: 600, borderRadius: 8 },
                            label: { textTransform: 'none' },
                        }}
                        onClick={() => onSave(value)}
                    />
                </Stack>
            </Stack>
        </Callout>
    );

    return ReactDOM.createPortal(
        <>
            <div className="placeholder-editor-overlay" onClick={onDismiss} />
            {callout}
        </>,
        document.body
    );
};

export default PlaceholderEditorPopover;
