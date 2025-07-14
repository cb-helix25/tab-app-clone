//
import React, { useState, useMemo, useEffect } from 'react'; // invisible change
// invisible change 2.2
import SummaryReview from './SummaryReview';
import ReviewConfirm from './ReviewConfirm';
import SummaryCompleteOverlay from './SummaryCompleteOverlay';
import { useCompletion } from './CompletionContext';
import { UserData } from '../../../app/functionality/types';

interface ReviewStepProps {
    selectedDate: Date | null;
    supervisingPartner: string;
    originatingSolicitor: string;
    clientType: string;
    selectedPoidIds: string[];
    areaOfWork: string;
    practiceArea: string;
    description: string;
    folderStructure: string;
    disputeValue: string;
    source: string;
    referrerName: string;
    opponentName: string;
    opponentEmail: string;
    opponentSolicitorName: string;
    opponentSolicitorCompany: string;
    opponentSolicitorEmail: string;
    opponentStreet: string;
    opponentCity: string;
    opponentCounty: string;
    opponentPostcode: string;
    opponentCountry: string;
    solicitorStreet: string;
    solicitorCity: string;
    solicitorCounty: string;
    solicitorPostcode: string;
    solicitorCountry: string;
    noConflict: boolean;
    userInitials: string;
    userData?: UserData[] | null;
    onBuild?: () => void;
}

const ReviewStep: React.FC<ReviewStepProps> = (props) => {
    const {
    selectedDate,
    supervisingPartner,
    originatingSolicitor,
    // fundsReceived removed
    clientType,
    selectedPoidIds,
    areaOfWork,
    practiceArea,
    description,
    folderStructure,
    disputeValue,
    source,
    referrerName,
    opponentName,
    opponentEmail,
    opponentSolicitorName,
    opponentSolicitorCompany,
    opponentSolicitorEmail,
    opponentStreet,
    opponentCity,
    opponentCounty,
    opponentPostcode,
    opponentCountry,
    solicitorStreet,
    solicitorCity,
    solicitorCounty,
    solicitorPostcode,
    solicitorCountry,
    noConflict,
        userInitials,
        userData,
    onBuild,
    } = props;

    const [detailsConfirmed, setDetailsConfirmed] = useState(false);
    const [snapshot, setSnapshot] = useState<Record<string, any> | null>(null);
    const [edited, setEdited] = useState(false);
    const { summaryComplete } = useCompletion();

    const formData = useMemo(
        () => ({
            selectedDate: selectedDate ? selectedDate.toISOString() : null,
            supervisingPartner,
            originatingSolicitor,
            // fundsReceived removed
            clientType,
            selectedPoidIds,
            areaOfWork,
            practiceArea,
            description,
            folderStructure,
            disputeValue,
            source,
            referrerName,
            opponentName,
            opponentEmail,
            opponentSolicitorName,
            opponentSolicitorCompany,
            opponentSolicitorEmail,
            opponentStreet,
            opponentCity,
            opponentCounty,
            opponentPostcode,
            opponentCountry,
            solicitorStreet,
            solicitorCity,
            solicitorCounty,
            solicitorPostcode,
            solicitorCountry,
            noConflict,
            userInitials,
            userData,
        }),
        [
            selectedDate,
            supervisingPartner,
            originatingSolicitor,
            clientType,
            selectedPoidIds,
            areaOfWork,
            practiceArea,
            description,
            folderStructure,
            disputeValue,
            source,
            referrerName,
            opponentName,
            opponentEmail,
            opponentSolicitorName,
            opponentSolicitorCompany,
            opponentSolicitorEmail,
            opponentStreet,
            opponentCity,
            opponentCounty,
            opponentPostcode,
            opponentCountry,
            solicitorStreet,
            solicitorCity,
            solicitorCounty,
            solicitorPostcode,
            solicitorCountry,
            noConflict,
            userInitials,
            userData,
        ]
    );

    const proofSummary = useMemo(
        () => (
            <div>
                <p>
                    <span className="field-label">Date:</span>{' '}
                    <span className="field-value">{selectedDate ? selectedDate.toLocaleDateString() : 'N/A'}</span>
                </p>
                <p>
                    <span className="field-label">Supervising Partner:</span>{' '}
                    <span className="field-value">{supervisingPartner || 'N/A'}</span>
                </p>
                <p>
                    <span className="field-label">Originating Solicitor:</span>{' '}
                    <span className="field-value">{originatingSolicitor || 'N/A'}</span>
                </p>
                {/* Funds row removed */}
                <p>
                    <span className="field-label">Client Type:</span>{' '}
                    <span className="field-value">{clientType || 'N/A'}</span>
                </p>
                <p>
                    <span className="field-label">POID(s):</span>{' '}
                    <span className="field-value">{selectedPoidIds.join(', ') || 'None'}</span>
                </p>
                <p>
                    <span className="field-label">Area of Work:</span>{' '}
                    <span className="field-value">{areaOfWork || 'N/A'}</span>
                </p>
                <p>
                    <span className="field-label">Practice Area:</span>{' '}
                    <span className="field-value">{practiceArea || 'N/A'}</span>
                </p>
                <p>
                    <span className="field-label">Description:</span>{' '}
                    <span className="field-value">{description || 'N/A'}</span>
                </p>
                <p>
                    <span className="field-label">Folder Structure:</span>{' '}
                    <span className="field-value">{folderStructure || 'N/A'}</span>
                </p>
                <p>
                    <span className="field-label">Dispute Value:</span>{' '}
                    <span className="field-value">{disputeValue || 'N/A'}</span>
                </p>
                <p>
                    <span className="field-label">Source:</span>{' '}
                    <span className="field-value">{source || 'N/A'}</span>
                </p>
                {source === 'referral' && (
                    <p>
                        <span className="field-label">Referrer Name:</span>{' '}
                        <span className="field-value">{referrerName || 'N/A'}</span>
                    </p>
                )}
                <p>
                    <span className="field-label">Opponent:</span>{' '}
                    <span className="field-value">{opponentName || 'N/A'} ({opponentEmail || 'N/A'})</span>
                </p>
                <p>
                    <span className="field-label">Opponent Street:</span>{' '}
                    <span className="field-value">{opponentStreet || 'N/A'}</span>
                </p>
                <p>
                    <span className="field-label">Opponent City:</span>{' '}
                    <span className="field-value">{opponentCity || 'N/A'}</span>
                </p>
                <p>
                    <span className="field-label">Opponent County:</span>{' '}
                    <span className="field-value">{opponentCounty || 'N/A'}</span>
                </p>
                <p>
                    <span className="field-label">Opponent Postcode:</span>{' '}
                    <span className="field-value">{opponentPostcode || 'N/A'}</span>
                </p>
                <p>
                    <span className="field-label">Opponent Country:</span>{' '}
                    <span className="field-value">{opponentCountry || 'N/A'}</span>
                </p>
                <p>
                    <span className="field-label">Opponent Solicitor:</span>{' '}
                    <span className="field-value">
                        {opponentSolicitorName || 'N/A'} - {opponentSolicitorCompany || 'N/A'} ({opponentSolicitorEmail || 'N/A'})
                    </span>
                </p>
                <p>
                    <span className="field-label">Solicitor Street:</span>{' '}
                    <span className="field-value">{solicitorStreet || 'N/A'}</span>
                </p>
                <p>
                    <span className="field-label">Solicitor City:</span>{' '}
                    <span className="field-value">{solicitorCity || 'N/A'}</span>
                </p>
                <p>
                    <span className="field-label">Solicitor County:</span>{' '}
                    <span className="field-value">{solicitorCounty || 'N/A'}</span>
                </p>
                <p>
                    <span className="field-label">Solicitor Postcode:</span>{' '}
                    <span className="field-value">{solicitorPostcode || 'N/A'}</span>
                </p>
                <p>
                    <span className="field-label">Solicitor Country:</span>{' '}
                    <span className="field-value">{solicitorCountry || 'N/A'}</span>
                </p>
                <p>
                    <span className="field-label">Conflict of Interest:</span>{' '}
                    <span className="field-value">{noConflict ? 'No' : 'Yes'}</span>
                </p>
            </div>
        ),
        [
            selectedDate,
            supervisingPartner,
            originatingSolicitor,
            clientType,
            selectedPoidIds,
            areaOfWork,
            practiceArea,
            description,
            folderStructure,
            disputeValue,
            source,
            referrerName,
            opponentName,
            opponentEmail,
            opponentSolicitorName,
            opponentSolicitorCompany,
            opponentSolicitorEmail,
            noConflict,
        ]
    );

    useEffect(() => {
        if (summaryComplete && snapshot) {
            const changed = JSON.stringify(formData) !== JSON.stringify(snapshot);
            setEdited(changed);
        }
    }, [formData, snapshot, summaryComplete]);

    const handleConfirmed = () => {
        setSnapshot(formData);
        setDetailsConfirmed(false);
        if (onBuild) onBuild();
    };

    return (
        <div style={{ position: 'relative' }}>
            {summaryComplete && <SummaryCompleteOverlay />}
            <SummaryReview
                proofContent={proofSummary}
                detailsConfirmed={detailsConfirmed}
                setDetailsConfirmed={setDetailsConfirmed}
                edited={edited}
            />
            <ReviewConfirm
                detailsConfirmed={detailsConfirmed}
                formData={formData}
                userInitials={userInitials}
                userData={userData}
                onConfirmed={handleConfirmed}
            />
        </div>
    );
};

export default ReviewStep;
  