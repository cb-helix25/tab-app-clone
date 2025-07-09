//
// Enhanced Instructions component with integrated placeholder editor
// This shows how to integrate the new placeholder system with the existing Instructions component

import React, { useState, useEffect } from 'react';
// invisible change 2
import {
    Stack,
    PrimaryButton,
    DefaultButton,
    IconButton,
    Modal,
    mergeStyles,
} from '@fluentui/react';
import { colours } from '../../../app/styles/colours';
import { useTheme } from '../../../app/functionality/ThemeContext';
import InstructionEditor from './InstructionEditor';
import PlaceholderManager from './PlaceholderManager';

interface EnhancedInstructionCardProps {
    instruction: any;
    clientName?: string;
    matterType?: string;
    onUpdate?: (content: string, placeholderValues: Record<string, string>) => void;
    className?: string;
}

// Enhanced instruction card that integrates seamlessly with the placeholder system
const EnhancedInstructionCard: React.FC<EnhancedInstructionCardProps> = ({
    instruction,
    clientName,
    matterType,
    onUpdate,
    className = ''
}) => {
    const { isDarkMode } = useTheme();
    const [isEditing, setIsEditing] = useState(false);
    const [content, setContent] = useState(instruction?.content || '');
    const [placeholderValues, setPlaceholderValues] = useState<Record<string, string>>({});

    // Sample instruction content with placeholders
    const sampleContent = `Dear [Client Name],

Thank you for instructing us in relation to [Matter Type]. We are pleased to confirm our appointment as your solicitors.

We understand that you require our assistance with [Property Address] and our initial estimate for our professional fees is [Fee Estimate].

We will aim to complete this matter within [Target Completion] subject to the usual conveyancing procedures.

[Next Steps]

Please do not hesitate to contact us if you have any questions.

Kind regards,
[Solicitor Name]`;

    // Initialize content if not provided
    useEffect(() => {
        if (!content && instruction) {
            setContent(sampleContent);
        }
    }, [instruction]);

    const handleSave = (newContent: string, newPlaceholderValues: Record<string, string>) => {
        setContent(newContent);
        setPlaceholderValues(newPlaceholderValues);
        setIsEditing(false);

        if (onUpdate) {
            onUpdate(newContent, newPlaceholderValues);
        }
    };

    const handleCancel = () => {
        setIsEditing(false);
    };

    const cardStyle = mergeStyles({
        background: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
        border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
        borderRadius: 8,
        padding: 20,
        transition: 'all 0.2s ease',
        position: 'relative',
        ':hover': {
            borderColor: colours.blue,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
        }
    });

    const contentStyle = mergeStyles({
        color: isDarkMode ? colours.dark.text : colours.light.text,
        lineHeight: 1.6,
        fontSize: 14,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    });

    const headerStyle = mergeStyles({
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
        paddingBottom: 12,
        borderBottom: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
    });

    const titleStyle = mergeStyles({
        fontSize: 18,
        fontWeight: 600,
        color: isDarkMode ? colours.dark.text : colours.darkBlue,
        margin: 0,
    });

    const actionsStyle = mergeStyles({
        display: 'flex',
        gap: 8,
        marginTop: 16,
        paddingTop: 12,
        borderTop: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
    });

    // Render content with placeholders
    const renderContent = () => {
        if (!content) return <p>No content available</p>;

        return (
            <div
                className={contentStyle}
                dangerouslySetInnerHTML={{ __html: content }}
            />
        );
    };

    return (
        <>
            <div className={`${cardStyle} ${className}`}>
                <div className={headerStyle}>
                    <h3 className={titleStyle}>
                        {instruction?.title || 'Instruction'}
                        {instruction?.InstructionRef && ` - ${instruction.InstructionRef}`}
                    </h3>
                    <IconButton
                        iconProps={{ iconName: 'Edit' }}
                        title="Edit instruction"
                        onClick={() => setIsEditing(true)}
                        styles={{
                            root: {
                                background: colours.blue,
                                color: '#ffffff',
                                borderRadius: 4,
                                width: 32,
                                height: 32,
                            },
                            rootHovered: {
                                background: colours.darkBlue,
                            }
                        }}
                    />
                </div>

                {renderContent()}

                <div className={actionsStyle}>
                    <PrimaryButton
                        text="Send Instruction"
                        iconProps={{ iconName: 'Send' }}
                        styles={{
                            root: {
                                background: colours.blue,
                                borderRadius: 6,
                            },
                            rootHovered: {
                                background: colours.darkBlue,
                            }
                        }}
                    />
                    <DefaultButton
                        text="Save Draft"
                        iconProps={{ iconName: 'Save' }}
                        styles={{
                            root: {
                                borderRadius: 6,
                            }
                        }}
                    />
                    <DefaultButton
                        text="Preview"
                        iconProps={{ iconName: 'View' }}
                        styles={{
                            root: {
                                borderRadius: 6,
                            }
                        }}
                    />
                </div>
            </div>

            {/* Enhanced Editor Modal */}
            <Modal
                isOpen={isEditing}
                onDismiss={handleCancel}
                isBlocking={false}
                styles={{
                    main: {
                        width: '90vw',
                        height: '90vh',
                        maxWidth: 1200,
                        maxHeight: 800,
                        borderRadius: 8,
                        padding: 0,
                        overflow: 'hidden',
                    }
                }}
            >
                <Stack
                    styles={{
                        root: {
                            height: '100%',
                            background: isDarkMode ? colours.dark.background : colours.light.background,
                        }
                    }}
                >
                    {/* Modal Header */}
                    <Stack
                        horizontal
                        horizontalAlign="space-between"
                        verticalAlign="center"
                        styles={{
                            root: {
                                padding: '16px 24px',
                                borderBottom: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
                                background: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
                            }
                        }}
                    >
                        <h2 style={{
                            margin: 0,
                            fontSize: 20,
                            fontWeight: 600,
                            color: isDarkMode ? colours.dark.text : colours.darkBlue
                        }}>
                            Edit Instruction
                        </h2>
                        <IconButton
                            iconProps={{ iconName: 'Cancel' }}
                            onClick={handleCancel}
                            title="Close"
                            styles={{
                                root: {
                                    color: colours.greyText,
                                },
                                rootHovered: {
                                    background: colours.grey,
                                    color: colours.darkBlue,
                                }
                            }}
                        />
                    </Stack>

                    {/* Editor Content */}
                    <div style={{
                        flex: 1,
                        padding: 24,
                        overflow: 'auto',
                        background: isDarkMode ? colours.dark.background : colours.light.background,
                    }}>
                        <InstructionEditor
                            value={content}
                            onChange={setContent}
                            templates={[]}
                        />
                    </div>
                </Stack>
            </Modal>
        </>
    );
};

// Integration example for the main Instructions component
interface InstructionWithPlaceholderIntegrationProps {
    instruction: any;
    onUpdate?: (content: string, placeholderValues: Record<string, string>) => void;
}

const InstructionWithPlaceholderIntegration: React.FC<InstructionWithPlaceholderIntegrationProps> = ({
    instruction,
    onUpdate
}) => {
    // Extract client info and matter details from instruction
    const clientName = instruction?.FirstName && instruction?.LastName
        ? `${instruction.FirstName} ${instruction.LastName}`
        : instruction?.ClientName || 'Client';

    const matterType = instruction?.ServiceType || instruction?.MatterType || 'Legal Matter';

    return (
        <EnhancedInstructionCard
            instruction={instruction}
            clientName={clientName}
            matterType={matterType}
            onUpdate={onUpdate}
        />
    );
};

// Define instruction type with proper content field
interface DemoInstruction {
    id: number;
    InstructionRef: string;
    title: string;
    FirstName: string;
    LastName: string;
    ServiceType: string;
    content: string | null;
    placeholderValues?: Record<string, string>;
}

// Usage demonstration component
const PlaceholderIntegrationDemo: React.FC = () => {
    const [instructions, setInstructions] = useState<DemoInstruction[]>([
        {
            id: 1,
            InstructionRef: 'INST001',
            title: 'Property Purchase',
            FirstName: 'John',
            LastName: 'Smith',
            ServiceType: 'Residential Property Purchase',
            content: null,
            placeholderValues: {}
        },
        {
            id: 2,
            InstructionRef: 'INST002',
            title: 'Employment Dispute',
            FirstName: 'Sarah',
            LastName: 'Johnson',
            ServiceType: 'Employment Law',
            content: null,
            placeholderValues: {}
        }
    ]);

    const handleInstructionUpdate = (
        instructionId: number,
        content: string,
        placeholderValues: Record<string, string>
    ) => {
        setInstructions(prev => prev.map(inst =>
            inst.id === instructionId
                ? { ...inst, content, placeholderValues }
                : inst
        ));

        console.log('Instruction updated:', { instructionId, content, placeholderValues });
    };

    return (
        <Stack tokens={{ childrenGap: 24 }} styles={{ root: { padding: 24 } }}>
            <h2 style={{ color: colours.darkBlue, margin: 0 }}>
                Instructions with Enhanced Placeholder System
            </h2>
            <p style={{ color: colours.greyText, margin: 0 }}>
                Click the edit button on any instruction to see the seamless placeholder integration
            </p>

            {instructions.map(instruction => (
                <InstructionWithPlaceholderIntegration
                    key={instruction.id}
                    instruction={instruction}
                    onUpdate={(content, placeholderValues) =>
                        handleInstructionUpdate(instruction.id, content, placeholderValues)
                    }
                />
            ))}
        </Stack>
    );
};

export default PlaceholderIntegrationDemo;
export { EnhancedInstructionCard, InstructionWithPlaceholderIntegration };
