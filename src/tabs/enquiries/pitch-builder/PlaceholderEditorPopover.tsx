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
            styles={{ root: { width: 700 } }}
        >
            <Stack tokens={{ childrenGap: 12 }} styles={{ root: { padding: '16px 20px' } }}>
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
                            borderRadius: 0,
                            backgroundColor: '#ffffff',
                        },
                        field: {
                            fontSize: 16,
                            padding: '12px 16px',
                            fontWeight: 400,
                            borderRadius: 0,
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
                                padding: '12px 28px',
                                fontSize: 14,
                                fontWeight: 600,
                                borderRadius: 0,
                            },
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
