const express = require('express');
const { getSecret } = require('../utils/getSecret');
const fs = require('fs');
const path = require('path');
const teamLookup = require('../utils/teamLookup');

const { PRACTICE_AREAS } = require('../utils/clioConstants');

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


let riskData = [];
const riskPath = path.join(__dirname, '..', '..', 'src', 'localData', 'localRiskAssessments.json');
if (fs.existsSync(riskPath)) {
    try {
        riskData = JSON.parse(fs.readFileSync(riskPath, 'utf-8'));
    } catch (err) {
        console.warn('Invalid risk data JSON:', err);
    }
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
            { value: instruction_ref, custom_field: { id: 380722 } }
        ].filter(Boolean);

        // 4. Lookup client contact
        const first = formData.client_information[0];
        if (!first || !first.email) {
            throw new Error('Missing client email for contact lookup');
        }
        const pr = await fetch(
            `https://eu.app.clio.com/api/v4/contacts?query=${encodeURIComponent(first.email)}`,
            { headers }
        );
        if (!pr.ok) throw new Error('Contact lookup failed');
        const pdata = await pr.json();
        const pid = pdata?.data?.length ? pdata.data[0].id : null;
        if (!pid) {
            throw new Error(`Contact not found for ${first.email}`);
        }

        // 5. Build matter payload
        const responsibleId = await teamLookup.getClioId(initials);
        const originatingInitials = formData.team_assignments.originating_solicitor_initials;
        const originatingId  = await teamLookup.getClioId(originatingInitials);

        if (!responsibleId) {
            console.error(`No Clio ID for ${initials}`);
            throw new Error('No Clio ID for ' + initials);
        }
        if (!originatingId) {
            console.error(`No Clio ID for ${originatingInitials}`);
            throw new Error('No Clio ID for ' + originatingInitials);
        }
        const payload = {
            data: {
                billable: true,
                client: { id: pid },
                client_reference: instruction_ref,
                description,
                practice_area: { id: PRACTICE_AREAS[practice_area] },
                responsible_attorney: { id: responsibleId },
                originating_attorney: { id: originatingId },
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
