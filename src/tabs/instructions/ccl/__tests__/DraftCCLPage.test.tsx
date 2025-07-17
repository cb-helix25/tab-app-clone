/** @jest-environment jsdom */
import { getDraftCclPath } from '../../../../utils/paths';
import { render, screen } from '@testing-library/react';
import DraftCCLPage from '../DraftCCLPage';

beforeEach(() => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })) as any;
});

describe('draft ccl path helper', () => {
    it('builds instruction path', () => {
        expect(getDraftCclPath('ABC123')).toBe('/instructions/ABC123/draft-ccl');
    });

    it('renders manual entry fields', async () => {
        render(<DraftCCLPage matterId="ABC123" />);
        const labels = [
            'names_and_contact_details_of_other_members_of_staff_who_can_help_with_queries',
            'insert_current_position_and_scope_of_retainer',
            'next_steps',
            'realistic_timescale',
            'estimate',
            'figure',
            'next_stage',
            'we_cannot_give_an_estimate_of_our_overall_charges_in_this_matter_because_reason_why_estimate_is_not_possible'
        ];
        for (const l of labels) {
            const el = await screen.findByLabelText(l);
            expect(el).toBeTruthy();
        }
    });
});