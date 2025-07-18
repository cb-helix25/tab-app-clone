import React, { useMemo, useState } from 'react';
import { Stack, TextField, Label, DefaultButton, FontIcon, Panel } from '@fluentui/react';
import EnhancedPitchBuilderFeatures from '../../enquiries/pitch-builder/EnhancedPitchBuilderFeatures';
import PlaceholderManager from './PlaceholderManager';
import EmailHeaderFields from '../../enquiries/pitch-builder/EmailHeaderFields';
import OperationStatusToast from '../../enquiries/pitch-builder/OperationStatusToast';
import InstructionBlockEditor from './InstructionBlockEditor';
import ExperimentalAssistant from '../../enquiries/pitch-builder/ExperimentalAssistant';
import { formContainerStyle } from '../../../CustomForms/BespokeForms';

interface HelixInstructionCCLDocumentEditorProps {
    initialContent?: string;
    initialBlocks?: string;
    contextPlaceholders?: Record<string, string>;
    initialEmail?: {
        to: string;
        cc: string;
        bcc: string;
        subject: string;
    };
    onSave?: (content: string, placeholders: Record<string, string>, blocks: string) => Promise<void>;
    isDarkMode?: boolean;
}

const PLACEHOLDER_REGEX = /\{\{(.*?)\}\}/g;

const HelixInstructionCCLDocumentEditor: React.FC<HelixInstructionCCLDocumentEditorProps> = ({
    initialContent = '',
    initialBlocks = '',
    contextPlaceholders = {},
    initialEmail = { to: '', cc: '', bcc: '', subject: '' },
    onSave,
    isDarkMode = false,
}) => {
    const [content, setContent] = useState(initialContent);
    const [blocks, setBlocks] = useState(initialBlocks);
    const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>(contextPlaceholders);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    const [assistantOpen, setAssistantOpen] = useState(false);
    const [blocksOpen, setBlocksOpen] = useState(false);

    const [to, setTo] = useState(initialEmail.to);
    const [cc, setCc] = useState(initialEmail.cc);
    const [bcc, setBcc] = useState(initialEmail.bcc);
    const [subject, setSubject] = useState(initialEmail.subject);

    const placeholders = useMemo(
        () => Array.from(new Set(Array.from(content.matchAll(PLACEHOLDER_REGEX)).map(m => m[1]))),
        [content]
    );

    const preview = useMemo(() => {
        let p = content;
        placeholders.forEach(ph => {
            const val = placeholderValues[ph] || '';
            p = p.replace(new RegExp(`\\{\\{${ph}\\}\}`, 'g'), val);
        });
        return p;
    }, [content, placeholders, placeholderValues]);

    const allComplete = useMemo(
        () => placeholders.every(ph => (placeholderValues[ph] ?? '') !== ''),
        [placeholders, placeholderValues]
    );

    const handleSave = async () => {
        if (onSave) {
            await onSave(content, placeholderValues, blocks);
        }
        setToast({ message: 'Document saved', type: 'success' });
    };

    return (
        <Stack tokens={{ childrenGap: 16 }}>
            <EnhancedPitchBuilderFeatures
                isDarkMode={isDarkMode}
                content={content}
                onContentChange={setContent}
                onSave={onSave ? async () => handleSave() : undefined}
                showToast={(message, type) => setToast({ message, type })}
            />

            <textarea
                style={{ width: '100%', minHeight: 160, padding: 8 }}
                value={content}
                onChange={e => setContent(e.target.value)}
            />

            {placeholders.length > 0 && (
                <Stack tokens={{ childrenGap: 8 }}>
                    <Label>
                        Placeholders
                        {allComplete && <FontIcon iconName="CheckMark" style={{ marginLeft: 6, color: '#107c10' }} />}
                    </Label>
                    {placeholders.map(ph => (
                        <TextField
                            key={ph}
                            label={ph}
                            value={placeholderValues[ph] || ''}
                            onChange={(_, v) =>
                                setPlaceholderValues(pv => ({
                                    ...pv,
                                    [ph]: v || '',
                                }))
                            }
                        />
                    ))}
                </Stack>
            )}

            <Label>Live Preview</Label>
            <div style={{ border: '1px solid #ccc', padding: 8 }}>
                <PlaceholderManager value={preview} onChange={setContent} />
            </div>

            <DefaultButton text="Edit Instruction Blocks" onClick={() => setBlocksOpen(true)} />

            <Panel headerText="Instruction Blocks" isOpen={blocksOpen} onDismiss={() => setBlocksOpen(false)} isLightDismiss>
                <InstructionBlockEditor value={blocks} onChange={setBlocks} />
            </Panel>

            <EmailHeaderFields
                to={to}
                cc={cc}
                bcc={bcc}
                subject={subject}
                setTo={setTo}
                setCc={setCc}
                setBcc={setBcc}
                setSubject={setSubject}
                initialNotes={undefined}
                isDarkMode={isDarkMode}
                formContainerStyle={formContainerStyle}
                labelStyle=""
            />

            <Stack horizontal tokens={{ childrenGap: 8 }}>
                <DefaultButton text="Save Document" onClick={handleSave} />
                <DefaultButton text="Open Assistant" onClick={() => setAssistantOpen(true)} />
            </Stack>

            <OperationStatusToast visible={toast !== null} message={toast?.message || ''} type={toast?.type || 'info'} />
            <ExperimentalAssistant isOpen={assistantOpen} onDismiss={() => setAssistantOpen(false)} emailText={preview} />
        </Stack>
    );
};

export default HelixInstructionCCLDocumentEditor;
