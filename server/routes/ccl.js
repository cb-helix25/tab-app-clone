const express = require('express');
const path = require('path');
const fs = require('fs');
const { generateWordFromJson } = require('../utils/wordGenerator.js');

const router = express.Router();

const CCL_DIR = path.join(process.cwd(), 'public', 'ccls');
fs.mkdirSync(CCL_DIR, { recursive: true });

const filePath = (id) => path.join(CCL_DIR, `${id}.docx`);
const jsonPath = (id) => path.join(CCL_DIR, `${id}.json`);

router.post('/', async (req, res) => {
    const { matterId, draftJson } = req.body || {};
    if (!matterId || !draftJson) return res.status(400).json({ error: 'Missing data' });
    try {
        await generateWordFromJson(draftJson, filePath(matterId));
        fs.writeFileSync(jsonPath(matterId), JSON.stringify(draftJson, null, 2));
        res.json({ ok: true, url: `/ccls/${matterId}.docx` });
    } catch (err) {
        console.error('CCL generation failed', err);
        res.status(500).json({ error: 'Failed to generate CCL' });
    }
});

router.patch('/:matterId', async (req, res) => {
    const { draftJson } = req.body || {};
    const { matterId } = req.params;
    if (!draftJson) return res.status(400).json({ error: 'Missing draftJson' });
    try {
        await generateWordFromJson(draftJson, filePath(matterId));
        fs.writeFileSync(jsonPath(matterId), JSON.stringify(draftJson, null, 2));
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
