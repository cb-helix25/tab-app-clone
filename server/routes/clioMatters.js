const express = require('express');
const { getSecret } = require('../utils/getSecret');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

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

// Hard-coded picklist option mappings
const ND_OPTIONS = {
    "Adjudication": 187069,
    "Residential Possession": 187072,
    "Employment": 187075,
    "Default": 187078
};
const VALUE_OPTIONS = {
    "Less than £10k": 244802,
    "£10k - £500k": 244805,
    "£501k - £1m": 244808,
    "£1m - £5m": 244811,
    "£5m - £20m": 244814,
    "Over £20m": 244817
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
        const name = (t['Full Name'] || `${t.First || ''} ${t.Last || ''}`).trim().toLowerCase();
        return name === fullName.toLowerCase();
    });
    return found ? String(found['Clio ID']) : null;
}
function getRiskResult(ref) {
    if (!ref) return null;
    const entry = riskData.find(r => (r.InstructionRef || '').toLowerCase() === ref.toLowerCase());
    return entry ? entry.RiskAssessmentResult : null;
}

const router = express.Router();
router.post('/', async (req, res) => {
    const { formData, initials } = req.body || {};
    if (!formData || !initials) return res.status(400).json({ error: 'Missing data' });
    try {
        // 1. Refresh token
        const cid = await getSecret(`${initials}-clio-v1-clientid`);
        const cs = await getSecret(`${initials}-clio-v1-clientsecret`);
        const rt = await getSecret(`${initials}-clio-v1-refreshtoken`);
        const tv = `https://eu.app.clio.com/oauth/token?client_id=${cid}&client_secret=${cs}&grant_type=refresh_token&refresh_token=${rt}`;
        const tr = await fetch(tv, { method: 'POST' });
        if (!tr.ok) throw new Error(await tr.text());
        const { access_token } = await tr.json();
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` };

        // 2. Extract matter data
        const md = formData.matter_details;
        const { instruction_ref, description, date_created, client_type, practice_area, folder_structure, dispute_value } = md;

        // 3. Build custom fields
        const cf = [
            { value: formData.team_assignments.supervising_partner, custom_field: { id: 232574 } },
            ND_OPTIONS[folder_structure] && { value: ND_OPTIONS[folder_structure], custom_field: { id: 299746 } },
            VALUE_OPTIONS[dispute_value] && { value: VALUE_OPTIONS[dispute_value], custom_field: { id: 378566 } },
            { value: instruction_ref, custom_field: { id: 380728 } }
        ].filter(Boolean);

        // 4. Lookup client contact
        const first = formData.client_information[0];
        const pr = await fetch(`https://eu.app.clio.com/api/v4/contacts?query=${encodeURIComponent(first.email)}`, { headers });
        const pid = (await pr.json()).data[0].id;

        // 5. Build matter payload
        const payload = {
            data: {
                billable: true,
                client: { id: pid },
                client_reference: instruction_ref,
                description,
                practice_area: { id: PRACTICE_AREAS[practice_area] },
                responsible_attorney: { id: getClioId(formData.team_assignments.fee_earner) },
                originating_attorney: { id: getClioId(formData.team_assignments.originating_solicitor) },
                status: 'Open',
                risk_result: getRiskResult(instruction_ref),
                custom_field_values: cf
            }
        };
        console.error('Matter payload →', JSON.stringify(payload, null, 2));

        // 6. Create matter
        const mr = await fetch('https://eu.app.clio.com/api/v4/matters.json', { method: 'POST', headers, body: JSON.stringify(payload) });
        if (!mr.ok) throw new Error(await mr.text());
        const matter = (await mr.json()).data;
        res.json({ ok: true, matter });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message });
    }
});
module.exports = router;
