import { getCclPath } from '../paths';

describe('ccl path helper', () => {
    it('returns fixed ccl path', () => {
        expect(getCclPath()).toBe('/instructions/ccl');
    });
});