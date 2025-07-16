import React from 'react';

export interface DraftCCLData {
    header: string;
    scopeOfWork: string;
    fees: string;
    terms: string;
    signatures: string;
}

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

    return (
        <div>
            <h4>Header</h4>
            <textarea style={fieldStyle} value={value.header} onChange={update('header')} readOnly={readOnly} />
            <h4>Scope of Work</h4>
            <textarea style={fieldStyle} value={value.scopeOfWork} onChange={update('scopeOfWork')} readOnly={readOnly} />
            <h4>Fees</h4>
            <textarea style={fieldStyle} value={value.fees} onChange={update('fees')} readOnly={readOnly} />
            <h4>Terms and Conditions</h4>
            <textarea style={fieldStyle} value={value.terms} onChange={update('terms')} readOnly={readOnly} />
            <h4>Signatures</h4>
            <textarea style={fieldStyle} value={value.signatures} onChange={update('signatures')} readOnly={readOnly} />
        </div>
    );
};

export default DraftCCLEditor;