import React from 'react';
import { TextField } from '@fluentui/react';
import { tokens as cclTokens } from '../../../app/functionality/cclSchema';

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

interface DraftCCLEditorProps {
    value: Record<string, string>;
    onChange: (v: Record<string, string>) => void;
    readOnly?: boolean;
}

export default function DraftCCLEditor({ value, onChange, readOnly }: DraftCCLEditorProps) {
    const handleChange = (key: string) => (_: any, newVal?: string) => {
        onChange({ ...value, [key]: newVal || '' });
    };

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
}