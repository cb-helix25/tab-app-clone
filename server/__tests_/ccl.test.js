const request = require('supertest');
const express = require('express');
const { router: cclRouter, CCL_DIR } = require('../routes/ccl');
const fs = require('fs');
const path = require('path');
const { schema: cclSchema } = require('../../src/app/functionality/cclSchema');

describe('CCL API', () => {
    const app = express();
    app.use(express.json());
    app.use('/api/ccl', cclRouter);

    it('POST /api/ccl generates file', async () => {
        const matterId = 'test123';
        const draftJson = Object.fromEntries(
            Object.keys(cclSchema).map(k => [k, 'x'])
        );
        const res = await request(app).post('/api/ccl').send({ matterId, draftJson });
        expect(res.status).toBe(200);
        const file = path.join(CCL_DIR, `${matterId}.docx`);
        expect(fs.existsSync(file)).toBe(true);
    });
});