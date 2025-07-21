/** @jest-environment jsdom */
import { getDraftCclPath } from '../../../../utils/paths';
import { render, screen } from '@testing-library/react';
import DocumentEditorPage from '../../DocumentEditorPage';

beforeEach(() => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })) as any;
});

describe('draft ccl path helper', () => {
    it('builds instruction path', () => {
        expect(getDraftCclPath('ABC123')).toBe('/instructions/ABC123/draft-ccl');
    });

    it('shows save button', async () => {
        render(
            <DocumentEditorPage matterId="ABC123" instruction={{ InstructionRef: 'ABC123', Client: {} }} />
        );
        const btn = await screen.findByText('Save Document');
        expect(btn).toBeTruthy();
    });
});