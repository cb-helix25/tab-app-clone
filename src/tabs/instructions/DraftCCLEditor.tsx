import React from 'react';
import { CCLJson } from '../../app/functionality/types';

export type DraftCCLData = CCLJson;

interface DraftCCLEditorProps {
    value: DraftCCLData;
    onChange: (val: DraftCCLData) => void;
    readOnly?: boolean;
}

const fieldStyle: React.CSSProperties = { width: '100%', minHeight: 100, marginBottom: 12 };

const DraftCCLEditor: React.FC<DraftCCLEditorProps> = ({ value, onChange, readOnly }) => {
    const update = (key: keyof DraftCCLData) => (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        onChange({ ...value, [key]: e.target.value });
    };

    const insert = (field: keyof DraftCCLData, token: keyof DraftCCLData) => {
        onChange({ ...value, [field]: (value[field] || '') + `{{${token}}}` });
    };

    const tokens = Object.keys(value) as (keyof DraftCCLData)[];

    const renderField = (label: string, key: keyof DraftCCLData) => (
        <div>
            <h4>{label}</h4>
            <textarea style={fieldStyle} value={value[key]} onChange={update(key)} readOnly={readOnly} />
            <select disabled={readOnly} onChange={e => insert(key, e.target.value as keyof DraftCCLData)} defaultValue="">
                <option value="" disabled>Insert field...</option>
                {tokens.map(t => (
                    <option key={t} value={t}>{t}</option>
                ))}
            </select>
        </div>
    );

    return (
        <div>
            {renderField('Header', 'header')}
            {renderField('Scope of Work', 'scopeOfWork')}
            {renderField('Fees', 'fees')}
            {renderField('Terms and Conditions', 'terms')}
            {renderField('Signatures', 'signatures')}
        </div>
    );
};

export default DraftCCLEditor;
