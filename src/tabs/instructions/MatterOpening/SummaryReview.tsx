import React, { useState, useEffect } from 'react'; // invisible change
import { FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { useCompletion } from './CompletionContext';
import '../../../app/styles/SummaryReview.css';

interface SummaryReviewProps {
    proofContent: React.ReactNode;
    detailsConfirmed: boolean;
    setDetailsConfirmed: React.Dispatch<React.SetStateAction<boolean>>;
    showConfirmation?: boolean;
    edited?: boolean;
    jsonData?: any; // Add optional JSON data prop
    clickToConfirm?: boolean; // Enable click-to-confirm mode
    demanding?: boolean; // Show red demanding border
}

const SummaryReview: React.FC<SummaryReviewProps> = ({
    proofContent,
    detailsConfirmed,
    setDetailsConfirmed,
    showConfirmation = true,
    edited = false,
    jsonData = null,
    clickToConfirm = false,
    demanding = false,
}) => {
    const { summaryComplete } = useCompletion();
    const [open, setOpen] = useState(true);
    const [jsonPreviewOpen, setJsonPreviewOpen] = useState(false);

    useEffect(() => {
        setOpen(!summaryComplete);
    }, [summaryComplete]);

    useEffect(() => {
        if (showConfirmation) setOpen(true);
    }, [showConfirmation]);

    const toggle = () => setOpen((p) => !p);

    const handleContainerClick = () => {
        if (clickToConfirm && !detailsConfirmed) {
            setDetailsConfirmed(true);
        }
    };

    const collapsed = summaryComplete && !open;
    const paneClasses =
        'summary-pane' +
        (collapsed ? ' summary-pane-collapsed' : '') +
        (!collapsed && summaryComplete ? ' summary-pane-complete' : '') +
        (edited ? ' summary-pane-edited' : '') +
        (demanding && !detailsConfirmed ? ' summary-pane-demanding' : '');

    return (
        <section 
            className={paneClasses}
            onClick={handleContainerClick}
            style={{
                cursor: clickToConfirm && !detailsConfirmed ? 'pointer' : 'default'
            }}
        >
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

                    {/* JSON Preview Toggle */}
                    {jsonData && (
                        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e1dfdd' }}>
                            <button
                                onClick={() => setJsonPreviewOpen(!jsonPreviewOpen)}
                                style={{
                                    background: '#f8f9fa',
                                    border: '1px solid #e1dfdd',
                                    borderRadius: 6,
                                    padding: '8px 12px',
                                    fontSize: 12,
                                    fontWeight: 500,
                                    color: '#3690CE',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    width: '100%',
                                    justifyContent: 'center',
                                    transition: 'all 0.2s ease',
                                }}
                            >
                                <i className="ms-Icon ms-Icon--Code" style={{ fontSize: 12 }} />
                                {jsonPreviewOpen ? 'Hide Processing Data' : 'View Processing Data'}
                            </button>

                            {jsonPreviewOpen && (
                                <div
                                    style={{
                                        marginTop: 12,
                                        border: '1px solid #e1dfdd',
                                        borderRadius: 6,
                                        background: '#f8f9fa',
                                        overflow: 'hidden',
                                    }}
                                >
                                    <div
                                        style={{
                                            padding: 16,
                                            maxHeight: 300,
                                            overflow: 'auto',
                                            fontSize: 10,
                                            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                                            lineHeight: 1.4,
                                            background: '#fff',
                                        }}
                                    >
                                        <pre
                                            style={{
                                                margin: 0,
                                                whiteSpace: 'pre-wrap',
                                                wordBreak: 'break-word',
                                            }}
                                        >
                                            {JSON.stringify(jsonData, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
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
