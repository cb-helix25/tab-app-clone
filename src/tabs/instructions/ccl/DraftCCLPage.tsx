import React, { useState, useEffect } from 'react';
import { Stack, PrimaryButton } from '@fluentui/react';
import { useParams } from 'react-router-dom';
import DraftCCLEditor from './DraftCCLEditor';
import { schema as cclSchema } from '../../../app/functionality/cclSchema';
import localUserData from '../../../localData/localUserData.json';
import '../componentTokens';
import '../../../app/styles/MatterOpeningCard.css';

const dashboardTokens = { childrenGap: 12 };

const flattenObject = (obj: any): Record<string, any> => {
    const res: Record<string, any> = {};
    for (const [k, v] of Object.entries(obj || {})) {
        if (v && typeof v === 'object' && !Array.isArray(v)) {
            const inner = flattenObject(v);
            for (const [ik, iv] of Object.entries(inner)) {
                res[`${k}.${ik}`] = iv;
            }
        } else {
            res[k] = v;
        }
    }
    return res;
};

const DraftCCLPage = ({ matterId: propMatterId }: { matterId?: string }) => {
    const params = useParams();
    const matterId = propMatterId || params.matterId;
    const [draftJson, setDraftJson] = useState<Record<string, string>>({ ...cclSchema });
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

    const handleSave = async () => {
        if (!matterId) return;
        setSaving(true);
        const resp = await fetch(`/api/ccl/${matterId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ draftJson: flattenObject(draftJson) })
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
            body: JSON.stringify({ matterId, draftJson: flattenObject(draftJson) })
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
                    <DraftCCLEditor value={draftJson} onChange={(v) => setDraftJson(v)} />
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
