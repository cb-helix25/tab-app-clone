import { getDraftCclPath } from '../../../../utils/paths';

describe('draft ccl path helper', () => {
    it('builds instruction path', () => {
        expect(getDraftCclPath('ABC123')).toBe('/instructions/ABC123/draft-ccl');
    });
});