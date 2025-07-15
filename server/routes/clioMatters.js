const express = require('express');
const { getSecret } = require('../utils/getSecret');
const fs = require('fs');
const path = require('path');

const PRACTICE_AREAS = {
    "Adjudication Advice & Dispute": 949034,
    "Boundary and Nuisance Advice": 948938,
    "Breach of Lease Advice": 948827,
    "Business Contract Dispute": 948896,
    "Civil/Commercial Fraud Advice": 948878,
    "Commercial Contract - Drafting": 948914,
    "Construction Contract Advice": 948917,
    "Contentious Probate": 948932,
    "Contract Dispute": 948824,
    "Director Rights & Dispute Advice": 948866,
    "Disciplinary - Advising": 949040,
    "Employment Contract - Drafting": 948959,
    "Employment Retainer Instruction": 948908,
    "Final Account Recovery": 949022,
    "Handbook - Drafting": 948962,
    "Injunction Advice": 949874,
    "Intellectual Property": 1160218,
    "Interim Payment Recovery": 949025,
    "Landlord & Tenant - Commercial Dispute": 948863,
    "Landlord & Tenant - Residential Dispute": 948854,
    "Miscellaneous (None of the above)": 948830,
    "Miscellaneous (None of the above)_1": 948830,
    "Partnership Advice": 1872650,
    "Post Termination Dispute": 948947,
    "Professional Negligence": 948815,
    "Restrictive Covenant Advice": 948953,
    "Right of Way": 949037,
    "Service charge Recovery & Dispute Advice": 948956,
    "Settlement Agreement - Advising": 948944,
    "Shareholder Rights & Dispute Advice": 948851,
    "Small Claim Advice": 948950,
    "Statutory Demand - Advising": 948911,
    "Statutory Demand - Drafting": 949046,
    "Terms and Conditions - Drafting": 948941,
    "Trespass": 948965,
    "Trust Advice": 949031,
    "Trust of Land (TOLATA) Advice": 948860,
    "Unpaid Invoice/Debt Dispute": 948920,
    "Unpaid Loan Recovery": 948887,
    "Winding Up Petition Advice": 949049
};

const teamPath = path.join(__dirname, '..', '..', 'data', 'team-sql-data.json');
let teamData = [];
try {
    teamData = JSON.parse(fs.readFileSync(teamPath, 'utf-8'));
} catch (err) {
    console.warn('Failed to load team data', err);
}

const riskPath = path.join(__dirname, '..', '..', 'src', 'localData', 'localRiskAssessments.json');
let riskData = [];
try {
    riskData = JSON.parse(fs.readFileSync(riskPath, 'utf-8'));
} catch (err) {
    console.warn('Failed to load risk data', err);
}

function getClioId(fullName) {
    if (!fullName) return null;
    const found = teamData.find(t => {
        const name = (t['Full Name'] || `${t.First || ''} ${t.Last || ''}`.trim()).toLowerCase();
        return name === fullName.toLowerCase();
    });
    return found ? String(found['Clio ID'] || '') : null;
}

function getRiskResult(ref) {
    if (!ref) return null;
    const entry = riskData.find(r => (r.InstructionRef || '').toLowerCase() === ref.toLowerCase());
    return entry ? entry.RiskAssessmentResult || null : null;
}

const router = express.Router();

router.post('/', async (req, res) => {
    const { formData, initials, contactIds = [], companyId } = req.body || {};
    if (!formData || !initials || contactIds.length === 0) {
        return res.status(400).json({ error: 'Missing data' });
    }

    try {
        const clientId = await getSecret(`${initials.toLowerCase()}-clio-v1-clientid`);
        const clientSecret = await getSecret(`${initials.toLowerCase()}-clio-v1-clientsecret`);
        const refreshToken = await getSecret(`${initials.toLowerCase()}-clio-v1-refreshtoken`);

        const tokenUrl = `https://eu.app.clio.com/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token&refresh_token=${refreshToken}`;
        const tokenResp = await fetch(tokenUrl, { method: 'POST' });
        if (!tokenResp.ok) {
            const text = await tokenResp.text();
            console.error('Clio token refresh failed', text);
            return res.status(500).json({ error: 'Token refresh failed' });
        }
        const { access_token } = await tokenResp.json();
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${access_token}`
        };

        const primaryId = companyId || contactIds[0];

        const instructionRef = formData.matter_details?.instruction_ref || '';
        const practiceAreaName = formData.matter_details?.practice_area || '';
        const practiceAreaId = PRACTICE_AREAS[practiceAreaName] || null;

        const responsibleName = formData.team_assignments?.fee_earner || '';
        const originatingName = formData.team_assignments?.originating_solicitor || '';
        const supervisingName = formData.team_assignments?.supervising_partner || '';

        const responsibleId = getClioId(responsibleName);
        const originatingId = getClioId(originatingName);
        const riskResult = getRiskResult(instructionRef);

        const customFieldValues = [
            { value: supervisingName || null, custom_field: { id: 232574 } },
            { value: formData.matter_details?.folder_structure || null, custom_field: { id: 299746 } },
            { value: formData.matter_details?.dispute_value || null, custom_field: { id: 378566 } },
            { value: instructionRef || null, custom_field: { id: 380728 } }
        ].filter(cf => cf.value);

        const matterPayload = {
            data: {
                type: 'matters',
                attributes: {
                    billable: true,
                    client_id: primaryId,
                    client_reference: instructionRef || null,
                    description: formData.matter_details?.description || '',
                    practice_area: practiceAreaId,
                    responsible_attorney_id: responsibleId,
                    originating_attorney_id: originatingId,
                    status: 'Open',
                    risk_result: riskResult || null,
                    custom_field_values: customFieldValues
                },
                relationships: {
                    client: { data: { type: 'contacts', id: primaryId } }
                }
            }
        };

        const resp = await fetch('https://eu.app.clio.com/api/v4/matters', {
            method: 'POST',
            headers,
            body: JSON.stringify(matterPayload)
        });

        if (!resp.ok) {
            const text = await resp.text();
            console.error('Clio matter create failed', text);
            return res.status(500).json({ error: 'Matter creation failed' });
        }

        const data = await resp.json();
        const matterId = data.data?.id;

        if (matterId && contactIds.length > 1) {
            for (const id of contactIds.slice(1)) {
                const relPayload = {
                    data: {
                        type: 'relationships',
                        attributes: { relationship_type: 'Related Client' },
                        relationships: {
                            primary: { data: { type: 'matters', id: matterId } },
                            related: { data: { type: 'contacts', id } }
                        }
                    }
                };
                const relResp = await fetch('https://eu.app.clio.com/api/v4/relationships', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(relPayload)
                });
                if (!relResp.ok) {
                    console.error(`Failed to link contact ${id}`, await relResp.text());
                }
            }
        }

        res.json({ ok: true, matterId });
    } catch (err) {
        console.error('Clio matter error', err);
        res.status(500).json({ error: 'Failed to create matter' });
    }
});

module.exports = router;
