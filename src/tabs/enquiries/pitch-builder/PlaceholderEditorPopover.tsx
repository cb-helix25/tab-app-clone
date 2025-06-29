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
            directionalHint={DirectionalHint.bottomCenter}
            isBeakVisible={false}
            gapSpace={4}
        >
            <Stack tokens={{ childrenGap: 8 }} styles={{ root: { padding: '8px 12px' } }}>
                <span className="placeholder-context">{before}</span>
                <TextField
                    value={value}
                    onChange={(_, v) => setValue(v || '')}
                    autoFocus
                    multiline
                    autoAdjustHeight
                    styles={{
                        fieldGroup: {
                            border: '1px solid #ccc',
                            borderRadius: 4,
                            backgroundColor: '#ffffff',
                        },
                        field: {
                            fontSize: 14,
                            padding: '8px 10px',
                            fontWeight: 400,
                            borderRadius: 4,
                            boxShadow: 'none',
                        },
                    }}
                />
                <span className="placeholder-context">{after}</span>
                <Stack horizontal horizontalAlign="end">
                    <PrimaryButton
                        text="Save"
                        styles={{
                            root: {
                                padding: '6px 16px',
                                fontSize: 13,
                                fontWeight: 600,
                                borderRadius: 4,
                            },
                            label: { textTransform: 'none' },
                        }}
                        onClick={() => onSave(value)}
                    />
                </Stack>
            </Stack>
        </Callout>
    );

    return ReactDOM.createPortal(callout, document.body);
};

export default PlaceholderEditorPopover;
