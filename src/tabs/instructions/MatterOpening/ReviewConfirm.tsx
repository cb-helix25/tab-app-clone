//
import React, { useState } from 'react'; // invisible change
// invisible change 2.1
import '../../../app/styles/ReviewConfirm.css';
import { useCompletion } from './CompletionContext';
import ProcessingSection, { ProcessingStep, ProcessingStatus } from './ProcessingSection';
import { processingActions, initialSteps } from './processingActions';

interface ReviewConfirmProps {
    detailsConfirmed: boolean;
    formData: Record<string, any>;
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

const ReviewConfirm: React.FC<ReviewConfirmProps> = ({ detailsConfirmed, formData, onConfirmed }) => {
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

        try {
            for (let i = 0; i < processingActions.length; i++) {
                const action = processingActions[i];
                updateStep(i, 'pending', `${action.label}...`);
                const msg = await action.run(formData);
                updateStep(i, 'success', msg);
            }

            setSummaryComplete(true);
            if (onConfirmed) onConfirmed();
        } catch (err) {
            updateStep(0, 'error', `Error: ${err}`);
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
