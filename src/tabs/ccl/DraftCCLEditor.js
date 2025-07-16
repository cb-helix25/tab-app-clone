import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const fieldStyle = { marginBottom: 12 };

const DraftCCLEditor = ({ value, onChange, tokens, readOnly }) => {
    const handleChange = key => html => {
        onChange({ ...value, [key]: html });
    };

    const insertToken = (key, token) => {
        onChange({ ...value, [key]: (value[key] || '') + `{{${token}}}` });
    };

    return (
        <div>
            {Object.keys(value).map(k => (
                <div key={k} style={fieldStyle}>
                    <h4>{k}</h4>
                    <ReactQuill theme="snow" value={value[k]} onChange={handleChange(k)} readOnly={readOnly} />
                    <select disabled={readOnly} onChange={e => insertToken(k, e.target.value)} defaultValue="">
                        <option value="" disabled>Insert field...</option>
                        {tokens.map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            ))}
        </div>
    );
};

export default DraftCCLEditor;