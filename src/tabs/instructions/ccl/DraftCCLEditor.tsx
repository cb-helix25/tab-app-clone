import React from 'react';
import { TextField } from '@fluentui/react';
import { tokens as cclTokens, schema as cclSchema } from '../../../app/functionality/cclSchema';

const manualTokens = [
    'names_and_contact_details_of_other_members_of_staff_who_can_help_with_queries',
    'insert_current_position_and_scope_of_retainer',
    'next_steps',
    'realistic_timescale',
    'estimate',
    'figure',
    'next_stage',
    'we_cannot_give_an_estimate_of_our_overall_charges_in_this_matter_because_reason_why_estimate_is_not_possible'
];

// Context sentences to show before and after each field
const fieldContexts: Record<string, { before: string; after: string }> = {
    'insert_clients_name': {
        before: 'Dear',
        after: 'Thank you for instructing us to act for you.'
    },
    'insert_heading_eg_matter_description': {
        before: 'RE:',
        after: 'We are writing to confirm the terms of our retainer.'
    },
    'matter': {
        before: 'We understand that you require advice in relation to',
        after: 'and we are pleased to confirm our appointment.'
    },
    'name_of_person_handling_matter': {
        before: 'The person with day-to-day conduct of your matter will be',
        after: 'who will be your main point of contact.'
    },
    'status': {
        before: 'Their status is',
        after: 'and they have the necessary experience to handle your case.'
    },
    'names_and_contact_details_of_other_members_of_staff_who_can_help_with_queries': {
        before: 'Other members of staff who can help with queries about your matter are:',
        after: 'Please feel free to contact any of the above if needed.'
    },
    'email': {
        before: 'You can reach us by email at',
        after: 'or by telephone during normal business hours.'
    },
    'insert_current_position_and_scope_of_retainer': {
        before: 'The current position is that',
        after: 'This defines the scope of our retainer.'
    },
    'next_steps': {
        before: 'The next steps we propose to take are:',
        after: 'We will keep you informed of progress at each stage.'
    },
    'realistic_timescale': {
        before: 'We estimate that this matter will take approximately',
        after: 'to complete, subject to unforeseen circumstances.'
    },
    'estimate': {
        before: 'Our current estimate of costs is',
        after: 'This estimate is based on the information currently available.'
    },
    'figure': {
        before: 'The total amount is expected to be',
        after: 'plus VAT and disbursements.'
    },
    'next_stage': {
        before: 'At the next stage we will',
        after: 'and provide you with a further update.'
    },
    'we_cannot_give_an_estimate_of_our_overall_charges_in_this_matter_because_reason_why_estimate_is_not_possible': {
        before: 'We cannot give an estimate of our overall charges in this matter because',
        after: 'We will provide cost updates as the matter progresses.'
    }
};

// Helper function to format field labels
const formatFieldLabel = (key: string): string => {
    return key
        .replace(/_/g, ' ')
        .replace(/\b\w/g, l => l.toUpperCase())
        .replace(/Eg\b/g, 'e.g.')
        .replace(/\bOr\b/g, 'or')
        .replace(/\bAnd\b/g, 'and')
        .replace(/\bThe\b/g, 'the')
        .replace(/\bTo\b/g, 'to')
        .replace(/\bOf\b/g, 'of')
        .replace(/\bIn\b/g, 'in')
        .replace(/\bFor\b/g, 'for')
        .replace(/\bWith\b/g, 'with')
        .replace(/\bYour\b/g, 'your')
        .replace(/\bAny\b/g, 'any')
        .replace(/\bWhat\b/g, 'what');
};

interface DraftCCLEditorProps {
    value: Record<string, string>;
    onChange: (v: Record<string, string>) => void;
    readOnly?: boolean;
    fieldsOnlyView?: boolean;
}

export default function DraftCCLEditor({ value, onChange, readOnly, fieldsOnlyView }: DraftCCLEditorProps) {
    const handleChange = (key: string) => (_: any, newVal?: string) => {
        onChange({ ...value, [key]: newVal || '' });
    };

    // Render fields-only view with context sentences
    const renderFieldsOnlyView = () => {
        // Get all fields from schema for comprehensive coverage
        const allFields = Object.keys(cclSchema);
        
        return (
            <div>
                <div style={{ 
                    marginBottom: '20px', 
                    padding: '16px', 
                    backgroundColor: '#f3f2f1', 
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: '#605e5c',
                    borderLeft: '4px solid #0078d4'
                }}>
                    <strong>⚡ Fields Mode:</strong> Complete the placeholders below. Each field shows the surrounding text context to help you understand how it fits into the letter.
                </div>
                
                {allFields.map(field => {
                    const context = fieldContexts[field];
                    const isImportant = manualTokens.includes(field);
                    
                    return (
                        <div key={field} style={{ 
                            marginBottom: '24px',
                            padding: '16px',
                            backgroundColor: isImportant ? '#fff4e6' : '#f8f9fa',
                            border: `1px solid ${isImportant ? '#ffd166' : '#e1e4e8'}`,
                            borderRadius: '8px',
                            borderLeft: `4px solid ${isImportant ? '#ff8c00' : '#0078d4'}`
                        }}>
                            {context && (
                                <div style={{
                                    fontSize: '13px',
                                    color: '#666',
                                    marginBottom: '8px',
                                    fontStyle: 'italic',
                                    lineHeight: '1.4'
                                }}>
                                    <span style={{ opacity: 0.7 }}>
                                        "{context.before} "
                                    </span>
                                    <span style={{ 
                                        backgroundColor: '#e6f3ff', 
                                        padding: '2px 6px', 
                                        borderRadius: '3px',
                                        fontWeight: 600,
                                        color: '#0078d4'
                                    }}>
                                        [{formatFieldLabel(field)}]
                                    </span>
                                    <span style={{ opacity: 0.7 }}>
                                        " {context.after}"
                                    </span>
                                </div>
                            )}
                            
                            <TextField
                                label={formatFieldLabel(field)}
                                value={value[field] || ''}
                                onChange={handleChange(field)}
                                multiline={field.length > 30}
                                disabled={readOnly}
                                placeholder={`Enter ${formatFieldLabel(field).toLowerCase()}...`}
                                required={isImportant}
                                styles={{ 
                                    root: { marginTop: context ? 8 : 0 },
                                    fieldGroup: { 
                                        borderWidth: isImportant ? 2 : 1,
                                        borderColor: isImportant ? '#ff8c00' : undefined
                                    }
                                }}
                            />
                            
                            {isImportant && (
                                <div style={{
                                    fontSize: '12px',
                                    color: '#d73502',
                                    marginTop: '4px',
                                    fontWeight: 500
                                }}>
                                    ⭐ Commonly required field
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // Render standard editor view
    const renderEditorView = () => {
        return (
            <div>
                {manualTokens.map(k => (
                    <TextField
                        key={k}
                        label={k}
                        value={value[k] || ''}
                        onChange={handleChange(k)}
                        multiline
                        disabled={readOnly}
                        styles={{ root: { marginBottom: 12 } }}
                    />
                ))}
            </div>
        );
    };

    return fieldsOnlyView ? renderFieldsOnlyView() : renderEditorView();
}