//
import React, { useState } from 'react'; // invisible change
// invisible change 2.2
import '../../../app/styles/ReviewConfirm.css';
import { useCompletion } from './CompletionContext';
import ProcessingSection, { ProcessingStep, ProcessingStatus } from './ProcessingSection';
import { processingActions, initialSteps } from './processingActions';
import { UserData } from '../../../app/functionality/types';

interface ReviewConfirmProps {
    detailsConfirmed: boolean;
    formData: Record<string, any>;
    userInitials: string;
    userData?: UserData[] | null;
    onConfirmed?: () => void;
}

const AccordionSection: React.FC<{ title: string; children: React.ReactNode; defaultOpen?: boolean }> = ({ title, children, defaultOpen = false }) => {
    const [open, setOpen] = React.useState(defaultOpen);
    const id = title.replace(/\s+/g, '-').toLowerCase();
    return (
        <div className="accordion-wrap">
            <div
                className="accordion-header question-banner"
                onClick={() => setOpen((o) => !o)}
                tabIndex={0}
                aria-expanded={open}
                aria-controls={id}
            >
                {title}
                <span className="accordion-toggle">{open ? '−' : '+'}</span>
            </div>
            <div id={id} className={`accordion-body ${open ? 'open' : 'collapsed'}`} aria-hidden={!open}>
                {children}
            </div>
        </div>
    );
};

const ReviewConfirm: React.FC<ReviewConfirmProps> = ({ detailsConfirmed, formData, userInitials, userData, onConfirmed }) => {
    const { summaryComplete, setSummaryComplete } = useCompletion();

    const [processing, setProcessing] = useState(false);
    const [processingOpen, setProcessingOpen] = useState(false);
    const [steps, setSteps] = useState<ProcessingStep[]>(initialSteps);
    const [logs, setLogs] = useState<string[]>([]);

    const updateStep = (index: number, status: ProcessingStatus, message: string) => {
        setSteps(prev => prev.map((s, i) => (i === index ? { ...s, status, message } : s)));
        setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    };

    const handleSubmit = async () => {
        setProcessing(true);
        setProcessingOpen(true);
        setLogs([]);
        setSteps(initialSteps);

        let currentIndex = 0;
        try {
            for (currentIndex = 0; currentIndex < processingActions.length; currentIndex++) {
                const action = processingActions[currentIndex];
                updateStep(currentIndex, 'pending', `${action.label}...`);
                const msg = await action.run(formData, userInitials, userData);
                updateStep(currentIndex, 'success', msg);
            }

            setSummaryComplete(true);
            if (onConfirmed) onConfirmed();
        } catch (err) {
            // Only mark as error if we are still within the steps
            if (currentIndex < processingActions.length) {
                updateStep(currentIndex, 'error', `Error: ${err}`);
            } else {
                // All steps completed, error happened after
                setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] Unexpected error after all steps: ${err}`]);
            }
            console.error('❌ Matter submit failed', err);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="next-steps-content">
            <div className="declaration-section no-border">
                {summaryComplete ? null : (
                    <div className="review-actions">
                        <button className="cta-declare-btn" disabled={!detailsConfirmed} onClick={handleSubmit}>
                            Open Matter
                        </button>
                    </div>
                )}
            </div>

            {(processingOpen || processing || summaryComplete) && (
                <ProcessingSection open={processingOpen} steps={steps} logs={logs} />
            )}
        </div>
    );
};

export default ReviewConfirm;
