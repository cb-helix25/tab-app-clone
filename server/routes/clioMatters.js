const express = require('express');
const { getSecret } = require('../utils/getSecret');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');  // if you don’t have global fetch

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
        // 1. Refresh Clio token
        const clientId = await getSecret(`${initials.toLowerCase()}-clio-v1-clientid`);
        const clientSecret = await getSecret(`${initials.toLowerCase()}-clio-v1-clientsecret`);
        const refreshToken = await getSecret(`${initials.toLowerCase()}-clio-v1-refreshtoken`);
        const tokenUrl = `https://eu.app.clio.com/oauth/token?client_id=${clientId}&client_secret=${clientSecret}&grant_type=refresh_token&refresh_token=${refreshToken}`;
        const tokenResp = await fetch(tokenUrl, { method: 'POST' });
        if (!tokenResp.ok) {
            console.error('Clio token refresh failed', await tokenResp.text());
            return res.status(500).json({ error: 'Token refresh failed' });
        }
        const { access_token } = await tokenResp.json();
        const headers = {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${access_token}`
        };

        // 2. Compute IDs and values
        const primaryId = companyId || contactIds[0];
        const md = formData.matter_details;
        const instructionRef = md.instruction_ref || '';
        const practiceAreaId = PRACTICE_AREAS[md.practice_area] || null;
        const responsibleId = getClioId(formData.team_assignments.fee_earner);
        const originatingId = getClioId(formData.team_assignments.originating_solicitor);
        const riskResult = getRiskResult(instructionRef);

        const customFieldValues = [
            { value: formData.team_assignments.supervising_partner, custom_field: { id: 232574 } },
            { value: md.folder_structure, custom_field: { id: 299746 } },
            { value: md.dispute_value, custom_field: { id: 378566 } },
            { value: instructionRef, custom_field: { id: 380728 } }
        ].filter(cf => cf.value);

        // 3. Build Matter payload
        const matterPayload = {
            data: {
                billable: true,
                client: { id: primaryId },
                client_reference: instructionRef || null,
                description: md.description,
                practice_area: { id: practiceAreaId },
                responsible_attorney: { id: responsibleId },
                originating_attorney: { id: originatingId },
                status: 'open',
                risk_result: riskResult || null,
                custom_field_values: customFieldValues
            }
        };

        // 4. Debug log
        console.error('Matter payload ➞', JSON.stringify(matterPayload, null, 2));

        // 5. Create Matter
        const resp = await fetch('https://eu.app.clio.com/api/v4/matters.json', {
            method: 'POST',
            headers,
            body: JSON.stringify(matterPayload)
        });
        if (!resp.ok) {
            console.error('Clio matter create failed', await resp.text());
            return res.status(500).json({ error: 'Matter creation failed' });
        }
        const { data } = await resp.json();
        const matterId = data.id;

        // 6. Link related contacts
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
                const relResp = await fetch('https://eu.app.clio.com/api/v4/relationships.json', {
                    method: 'POST',
                    headers,
                    body: JSON.stringify(relPayload)
                });
                if (!relResp.ok) {
                    console.error(`Failed to link contact ${id}`, await relResp.text());
                }
            }
        }

        // 7. Return result
        res.json({ ok: true, matterId });
    } catch (err) {
        console.error('Clio matter error', err);
        res.status(500).json({ error: 'Failed to create matter' });
    }
});

module.exports = router;
