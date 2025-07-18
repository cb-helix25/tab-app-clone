/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react';
import HelixInstructionCCLDocumentEditor from '../HelixInstructionCCLDocumentEditor';

describe('HelixInstructionCCLDocumentEditor', () => {
    it('prefills context placeholders', () => {
        render(
            <HelixInstructionCCLDocumentEditor
                initialContent="Hi {{name}}"
                contextPlaceholders={{ name: 'John Doe' }}
                initialEmail={{ to: '', cc: '', bcc: '', subject: '' }}
            />
        );
        const input = screen.getByLabelText('name') as HTMLInputElement;
        expect(input.value).toBe('John Doe');
    });

    it('shows email subject field', () => {
        render(
            <HelixInstructionCCLDocumentEditor initialContent="" initialEmail={{ to: '', cc: '', bcc: '', subject: '' }} />
        );
        expect(screen.getByLabelText(/subject/i)).toBeTruthy();
    });
});