import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Callout, TextField, PrimaryButton, Stack, DirectionalHint } from '@fluentui/react';
import { sharedPrimaryButtonStyles } from '../../../app/styles/ButtonStyles';
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
    const calloutRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onDismiss();
        }
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
            isBeakVisible
            gapSpace={12}
            styles={{ calloutMain: { overflowY: 'visible' } }}
        >
            <Stack tokens={{ childrenGap: 12 }} styles={{ root: { padding: 16 } }}>
                <span className="placeholder-context">{before}</span>
                <TextField
                    value={value}
                    onChange={(_, v) => setValue(v || '')}
                    autoFocus
                />
                <span className="placeholder-context">{after}</span>
                <Stack horizontal horizontalAlign="end">
                    <PrimaryButton
                        text="Save"
                        styles={sharedPrimaryButtonStyles}
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
