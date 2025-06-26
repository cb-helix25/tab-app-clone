import React, { useState, useEffect } from 'react';
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useCompletion } from './CompletionContext';
import '../../../../app/instructions/instructions/apps/pitch/client/src/styles/SummaryReview.css';

interface SummaryReviewProps {
    proofContent: React.ReactNode;
    detailsConfirmed: boolean;
    setDetailsConfirmed: React.Dispatch<React.SetStateAction<boolean>>;
    showConfirmation?: boolean;
    edited?: boolean;
}

const SummaryReview: React.FC<SummaryReviewProps> = ({
    proofContent,
    detailsConfirmed,
    setDetailsConfirmed,
    showConfirmation = true,
    edited = false,
}) => {
    const { summaryComplete } = useCompletion();
    const [open, setOpen] = useState(true);

    useEffect(() => {
        setOpen(!summaryComplete);
    }, [summaryComplete]);

    useEffect(() => {
        if (showConfirmation) setOpen(true);
    }, [showConfirmation]);

    const toggle = () => setOpen((p) => !p);

    const collapsed = summaryComplete && !open;
    const paneClasses =
        'summary-pane' +
        (collapsed ? ' summary-pane-collapsed' : '') +
        (!collapsed && summaryComplete ? ' summary-pane-complete' : '') +
        (edited ? ' summary-pane-edited' : '');

    return (
        <section className={paneClasses}>
            {summaryComplete ? (
                <button
                    type="button"
                    className={`summary-complete-header${open ? ' summary-complete-header-open' : ''}`}
                    onClick={toggle}
                    aria-expanded={open}
                >
                    <span className="summary-complete-small" aria-hidden="true">
                        <svg viewBox="0 0 24 24">
                            <polyline
                                points="5,13 10,18 19,7"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="3"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                    </span>
                    <span>Details confirmed</span>
                    <span className="chevron">{open ? <FiChevronUp /> : <FiChevronDown />}</span>
                </button>
            ) : (
                <button
                    type="button"
                    className="summary-title-main summary-toggle"
                    onClick={toggle}
                    aria-expanded={open}
                >
                    <span>Summary</span>
                    <span className="chevron">{open ? <FiChevronUp /> : <FiChevronDown />}</span>
                </button>
            )}

            <div className={`summary-collapse${open ? ' open' : ''}`} aria-hidden={open ? undefined : true}>
                <div className="summary-subsection">
                    <div className="summary-content">
                        {proofContent ?? <span className="summary-empty">No information provided yet.</span>}
                    </div>
                </div>

                {showConfirmation && (
                    <div className="summary-confirmation">
                        <label className="modern-checkbox-label">
                            <input
                                type="checkbox"
                                className="modern-checkbox-input"
                                checked={detailsConfirmed}
                                onChange={(e) => setDetailsConfirmed(e.target.checked)}
                            />
                            <span className="modern-checkbox-custom" aria-hidden="true">
                                <svg className="checkbox-tick" viewBox="0 0 24 24" width="26" height="26">
                                    <polyline
                                        className="tick"
                                        points="5,13 10,18 19,7"
                                        fill="none"
                                        stroke="#fff"
                                        strokeWidth="3"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </span>
                            <span className="modern-checkbox-text">I confirm the above information is accurate.</span>
                        </label>
                    </div>
                )}
            </div>
        </section>
    );
};

export default SummaryReview;
