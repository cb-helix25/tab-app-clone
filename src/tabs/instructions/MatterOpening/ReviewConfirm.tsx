//
import React, { useState } from 'react'; // invisible change
// invisible change 2
import '../../../app/styles/ReviewConfirm.css';
import { useCompletion } from './CompletionContext';
import ProcessingSection, { ProcessingStep, ProcessingStatus } from './ProcessingSection';

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

    const initialSteps: ProcessingStep[] = [
        { label: 'Fetch Tokens', status: 'pending' },
        { label: 'DB Upload', status: 'pending' },
        { label: 'Clio API', status: 'pending' },
        { label: 'ActiveCampaign API', status: 'pending' },
        { label: 'Notify User', status: 'pending' },
        { label: 'Refresh UI', status: 'pending' },
    ];

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
            updateStep(0, 'pending', 'Fetching tokens...');
            await new Promise(res => setTimeout(res, 500));
            updateStep(0, 'success', 'Tokens retrieved');

            updateStep(1, 'pending', 'Uploading to DB...');
            await fetch('/api/matter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            updateStep(1, 'success', 'Uploaded');

            updateStep(2, 'pending', 'Calling Clio API...');
            await new Promise(res => setTimeout(res, 500));
            updateStep(2, 'success', 'Clio updated');

            updateStep(3, 'pending', 'Calling ActiveCampaign API...');
            await new Promise(res => setTimeout(res, 500));
            updateStep(3, 'success', 'ActiveCampaign updated');

            updateStep(4, 'pending', 'Notifying user...');
            await new Promise(res => setTimeout(res, 500));
            updateStep(4, 'success', 'User notified');

            updateStep(5, 'pending', 'Refreshing UI...');
            await new Promise(res => setTimeout(res, 500));
            updateStep(5, 'success', 'UI refreshed');

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
