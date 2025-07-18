/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react';
import UnifiedInstructionCCLEditor from '../UnifiedInstructionCCLEditor';

describe('UnifiedInstructionCCLEditor', () => {
    it('renders placeholder inputs', () => {
        render(<UnifiedInstructionCCLEditor initialContent="Hello {{client_name}}" />);
        expect(screen.getByLabelText('client_name')).toBeTruthy();
    });
});