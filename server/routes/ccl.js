const express = require('express');
const path = require('path');
const fs = require('fs');
const { generateWordFromJson } = require('../utils/wordGenerator.js');

const localUsers = require('../../src/localData/localUserData.json');

function findUserByName(name) {
    if (!name) return null;
    return (localUsers || []).find(u => {
        const full = u['Full Name'] || `${u.First} ${u.Last}`;
        return full.toLowerCase() === name.toLowerCase();
    }) || null;
}

async function mergeMatterFields(matterId, payload) {
    const base = `http://localhost:${process.env.PORT || 8080}`;
    let matterData = {};
    try {
        const resp = await fetch(`${base}/api/matters/${matterId}`);
        if (resp.ok) {
            matterData = await resp.json();
            console.log('matter lookup →', matterData);
        }
    } catch (err) {
        console.warn('Matter lookup failed', err);
    }

    const data = { ...payload };
    const firstClient = data.client_information?.[0] || {};
    if (firstClient.prefix) {
        data.insert_clients_name = `${firstClient.prefix} ${firstClient.first_name || ''} ${firstClient.last_name || ''}`.trim();
    } else {
        data.insert_clients_name = firstClient.company_details?.name || '';
    }
    data.insert_heading_eg_matter_description = data.matter_details?.description || '';
    data.matter = data.matter_details?.matter_ref || data.matter_details?.instruction_ref || matterData.display_number;
    data.name_of_person_handling_matter = data.team_assignments?.fee_earner || '';

    const feeUser = findUserByName(data.team_assignments?.fee_earner);
    data.status = feeUser?.Role || '';

    const helpers = [
        data.team_assignments?.fee_earner,
        data.team_assignments?.originating_solicitor,
        data.team_assignments?.supervising_partner
    ].filter(Boolean);
    data.names_and_contact_details_of_other_members_of_staff_who_can_help_with_queries = helpers.map(n => {
        const u = findUserByName(n);
        return u ? `${n} <${u.Email}>` : n;
    }).join(', ');

    return { ...data, display_number: matterData.display_number };
}

const router = express.Router();

const CCL_DIR = path.join(process.cwd(), 'public', 'ccls');
fs.mkdirSync(CCL_DIR, { recursive: true });

const filePath = (id) => path.join(CCL_DIR, `${id}.docx`);
const jsonPath = (id) => path.join(CCL_DIR, `${id}.json`);

router.post('/', async (req, res) => {
    const { matterId, draftJson } = req.body || {};
    if (!matterId || typeof draftJson !== 'object') {
        return res.status(400).json({ error: 'Invalid payload' });
    }
    try {
        const merged = await mergeMatterFields(matterId, draftJson);
        await generateWordFromJson(merged, filePath(matterId));
        fs.writeFileSync(jsonPath(matterId), JSON.stringify(merged, null, 2));
        res.json({ ok: true, url: `/ccls/${matterId}.docx` });
    } catch (err) {
        console.error('CCL generation failed', err);
        res.status(500).json({ error: 'Failed to generate CCL' });
    }
});

router.patch('/:matterId', async (req, res) => {
    const { draftJson } = req.body || {};
    const { matterId } = req.params;
    if (typeof draftJson !== 'object') {
        return res.status(400).json({ error: 'Invalid draftJson' });
    }
    try {
        const merged = await mergeMatterFields(matterId, draftJson);
        await generateWordFromJson(merged, filePath(matterId));
        fs.writeFileSync(jsonPath(matterId), JSON.stringify(merged, null, 2));
        res.json({ ok: true, url: `/ccls/${matterId}.docx` });
    } catch (err) {
        console.error('CCL regeneration failed', err);
        res.status(500).json({ error: 'Failed to regenerate CCL' });
    }
});

router.get('/:matterId', (req, res) => {
    const { matterId } = req.params;
    const fp = filePath(matterId);
    const exists = fs.existsSync(fp);
    let json;
    try {
        if (fs.existsSync(jsonPath(matterId))) {
            json = JSON.parse(fs.readFileSync(jsonPath(matterId), 'utf-8'));
        }
    } catch { }
    res.json({ ok: true, exists, url: exists ? `/ccls/${matterId}.docx` : undefined, json });
});

module.exports = { router, CCL_DIR };
