//
import React, { useEffect, useState } from 'react'; // invisible change
// invisible change 2.2
import '../../../app/styles/SummaryComplete.css';

const SummaryCompleteOverlay: React.FC = () => {
    const [show, setShow] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => setShow(false), 1500);
        return () => clearTimeout(timer);
    }, []);

    if (!show) return null;

    return (
        <div className="summary-complete-overlay">
            <div className="summary-complete-tick">
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
            </div>
        </div>
    );
};

export default SummaryCompleteOverlay;
