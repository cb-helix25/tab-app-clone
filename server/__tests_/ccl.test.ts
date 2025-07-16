import request from 'supertest';
import express from 'express';
import { router as cclRouter, CCL_DIR } from '../routes/ccl';
import fs from 'fs';
import path from 'path';

describe('CCL API', () => {
    const app = express();
    app.use(express.json());
    app.use('/api/ccl', cclRouter);

    it('POST /api/ccl generates file', async () => {
        const matterId = 'test123';
        const draftJson = { header: 'h', scopeOfWork: 's', fees: 'f', terms: 't', signatures: 'sig' };
        const res = await request(app).post('/api/ccl').send({ matterId, draftJson });
        expect(res.status).toBe(200);
        const file = path.join(CCL_DIR, `${matterId}.docx`);
        expect(fs.existsSync(file)).toBe(true);
    });
});