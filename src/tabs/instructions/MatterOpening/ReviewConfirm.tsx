import React from 'react';
import '../../../app/styles/ReviewConfirm.css';
import { useCompletion } from './CompletionContext';

interface ReviewConfirmProps {
    detailsConfirmed: boolean;
    formData: Record<string, any>;
    onConfirmed?: () => void;
}

const AccordionSection: React.FC<{
    title: string;
    children: React.ReactNode;
    defaultOpen?: boolean;
}> = ({ title, children, defaultOpen = false }) => {
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

    const handleSubmit = async () => {
        try {
            await fetch('/api/matter', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });
            setSummaryComplete(true);
            if (onConfirmed) onConfirmed();
        } catch (err) {
            console.error('❌ Matter submit failed', err);
        }
    };

    return (
        <div className="next-steps-content">
            <div className="declaration-section no-border">
                {summaryComplete ? null : (
                    <div className="review-actions">
                        <button className="cta-declare-btn" disabled={!detailsConfirmed} onClick={handleSubmit}>
                            Confirm Identity and Open a Matter
                        </button>
                    </div>
                )}
            </div>

            <AccordionSection title="Why do we do these checks?">
                <p>
                    For professional compliance and regulatory purposes we are required to verify client identity details including but not limited to ensuring we comply with the Money Laundering and Terrorist Financing (Amendment) Regulations 2019.
                </p>
                <p>
                    We find completing this electronically is incredibly quick and efficient, making your life simpler (where we can verify you electronically) and avoiding the need for documents to be provided to us before we can complete work.
                </p>
            </AccordionSection>

            <AccordionSection title="How is data stored?">
                <p>
                    All data is held in accordance with our data protection obligations including in accordance with the GDPR (General Data Regulations).
                </p>
            </AccordionSection>
        </div>
    );
};

export default ReviewConfirm;
