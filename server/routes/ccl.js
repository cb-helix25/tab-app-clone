const express = require('express');
const path = require('path');
const fs = require('fs');
const { generateCCLDocument } = require('../utils/wordGenerator');

const router = express.Router();

// In-memory store for demo purposes
const cclStore = {};

router.post('/', async (req, res) => {
    const { matterId, draftJson } = req.body || {};
    if (!matterId || !draftJson) {
        return res.status(400).json({ error: 'Missing data' });
    }
    try {
        const url = await generateCCLDocument(matterId, draftJson);
        cclStore[matterId] = { draftJson, url };
        res.json({ ok: true, url });
    } catch (err) {
        console.error('CCL generation failed', err);
        res.status(500).json({ error: 'Failed to generate CCL' });
    }
});

router.get('/:matterId', (req, res) => {
    const entry = cclStore[req.params.matterId];
    if (!entry) return res.status(404).json({ error: 'Not found' });
    res.json(entry);
});

router.patch('/:matterId', async (req, res) => {
    const { draftJson } = req.body || {};
    const matterId = req.params.matterId;
    if (!draftJson) return res.status(400).json({ error: 'Missing draftJson' });
    try {
        const url = await generateCCLDocument(matterId, draftJson);
        cclStore[matterId] = { draftJson, url };
        res.json({ ok: true, url });
    } catch (err) {
        console.error('CCL regeneration failed', err);
        res.status(500).json({ error: 'Failed to regenerate CCL' });
    }
});

module.exports = router;
