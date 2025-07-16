import React, { useState, useEffect } from 'react';
import { Stack, PrimaryButton } from '@fluentui/react';
import DraftCCLEditor from './DraftCCLEditor';
import cclSchema from '../../app/functionality/cclSchema';
import localUserData from '../../localData/localUserData.json';
import '../instructions/componentTokens';
import '../../app/styles/MatterOpeningCard.css';

const dashboardTokens = { childrenGap: 12 };

const DraftCCLPage = ({ matterId }) => {
    const [draftJson, setDraftJson] = useState({ ...cclSchema });
    const [url, setUrl] = useState('');
    const [saving, setSaving] = useState(false);
    const [generating, setGenerating] = useState(false);

    const currentUser = (localUserData || [])[0];
    const canGenerate = currentUser?.Role === 'Partner';

    useEffect(() => {
        if (matterId) {
            fetch(`/api/ccl/${matterId}`)
                .then(r => (r.ok ? r.json() : null))
                .then(d => {
                    if (d?.json) setDraftJson(d.json);
                    if (d?.url) setUrl(d.url);
                })
                .catch(() => { });
        }
    }, [matterId]);

    const tokens = Object.keys(cclSchema);

    const handleSave = async () => {
        if (!matterId) return;
        setSaving(true);
        const resp = await fetch(`/api/ccl/${matterId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ draftJson })
        });
        if (resp.ok) {
            const d = await resp.json();
            if (d.url) setUrl(d.url);
        }
        setSaving(false);
    };

    const handleGenerate = async () => {
        if (!matterId) return;
        setGenerating(true);
        const resp = await fetch('/api/ccl', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ matterId, draftJson })
        });
        if (resp.ok) {
            const d = await resp.json();
            if (d.url) setUrl(d.url);
        }
        setGenerating(false);
    };

    return (
        <Stack tokens={dashboardTokens} className="workflow-container">
            <div className="workflow-main matter-opening-card">
                <div className="step-header">
                    <h3 className="step-title">Client Care Letter</h3>
                </div>
                <div className="step-content">
                    <DraftCCLEditor value={draftJson} onChange={setDraftJson} tokens={tokens} />
                    <div style={{ marginTop: 16 }}>
                        <PrimaryButton text="Save Draft" onClick={handleSave} disabled={saving || generating} />
                        {canGenerate && (
                            <PrimaryButton text="Generate Word" onClick={handleGenerate} disabled={saving || generating} style={{ marginLeft: 8 }} />
                        )}
                        {url && (
                            <a href={url} style={{ marginLeft: 12 }} target="_blank" rel="noopener noreferrer">Download Draft CCL</a>
                        )}
                    </div>
                </div>
            </div>
        </Stack>
    );
};

export default DraftCCLPage;
