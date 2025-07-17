const fs = require('node:fs');
const { schema: cclSchema } = require('../../src/app/functionality/cclSchema');
const { generateWordFromJson } = require('../utils/wordGenerator.js');
jest.mock('../utils/wordGenerator.js', () => ({
    generateWordFromJson: jest.fn(() => Buffer.alloc(2001))
}));

jest.mock('node:fs', () => {
    const actual = jest.requireActual('node:fs');
    return { ...actual, writeFileSync: jest.fn(), mkdirSync: jest.fn(), existsSync: jest.fn(() => true) };
});

describe('word generation', () => {
    it('creates a large buffer', async () => {
        const draftJson = Object.fromEntries(Object.keys(cclSchema).map(k => [k, 'x']));
        const buf = await generateWordFromJson(draftJson, '/tmp/out.docx');
        expect(Buffer.isBuffer(buf)).toBe(true);
        expect(buf.length).toBeGreaterThan(1000);
    });
});