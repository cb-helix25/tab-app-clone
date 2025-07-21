import React from 'react';
import { format } from 'date-fns';
import { mergeStyles } from '@fluentui/react';
import { FaUser, FaUsers } from 'react-icons/fa';
import { colours } from '../../app/styles/colours';
import { ClientInfo } from './JointClientCard';

interface InstructionInfo {
    InstructionRef: string;
    Stage?: string;
    FirstName?: string;
    LastName?: string;
    CompanyName?: string;
    Email?: string;
    Phone?: string;
    SubmissionDate?: string;
    ClientType?: string;
    PassportNumber?: string;
    DriversLicenseNumber?: string;
    PaymentResult?: string;
    [key: string]: any;
}

interface DealInfo {
    InstructionRef?: string;
    ServiceDescription?: string;
    Amount?: number;
    IsMultiClient?: boolean;
    jointClients?: ClientInfo[];
    [key: string]: any;
}

interface InstructionCardProps {
    instruction: InstructionInfo;
    deal?: DealInfo;
    deals?: DealInfo[];
    clients?: ClientInfo[];
    prospectId?: number;
    risk?: {
        MatterId: string;
        RiskAssessmentResult?: string;
        RiskScore?: number;
    } | null;
    eid?: { EIDStatus?: string; EIDOverallResult?: string } | null;
    eids?: any[];
    compliance?: any | null;
    documentCount?: number;
    documents?: any[];
    animationDelay?: number;
    innerRef?: React.Ref<HTMLDivElement>;
    expanded?: boolean;
    onToggle?: () => void;
    selected?: boolean;
    onSelect?: () => void;
    onProofOfIdClick?: (ref: string) => void;
}

const InstructionCard: React.FC<InstructionCardProps> = ({
    instruction,
    deal,
    deals,
    clients,
    prospectId,
    risk,
    eid,
    eids,
    compliance,
    documentCount,
    documents,
    animationDelay = 0,
    innerRef,
    expanded = false,
    onToggle,
    selected = false,
    onSelect,
    onProofOfIdClick,
}) => {
    const stage = instruction.Stage?.toLowerCase();
    const isCompleted = stage === 'completed';

    // Get client name
    const firstName = instruction.FirstName || '';
    const lastName = instruction.LastName || '';
    const fullName = firstName && lastName 
        ? `${firstName} ${lastName}`
        : firstName || lastName || instruction.CompanyName || '';

    // Determine if multi-client
    const isMultiClient = (deal && (deal.IsMultiClient || (deal.jointClients && deal.jointClients.length > 1)))
        || (instruction.ClientType && instruction.ClientType.toLowerCase().includes('joint'));

    // Get status information
    const proofOfIdComplete = Boolean(instruction.PassportNumber || instruction.DriversLicenseNumber);
    const paymentComplete = instruction.PaymentResult?.toLowerCase() === 'successful';
    const paymentFailed = instruction.PaymentResult?.toLowerCase() === 'failed';
    const documentsComplete = (documents?.length ?? documentCount ?? 0) > 0;

    const eidStatus = (eid?.EIDStatus || '').toLowerCase();
    const eidResult = (eid as any)?.EIDOverallResult?.toLowerCase();
    const eidPassed = eidResult === 'passed' || eidResult === 'pass';
    
    let verifyIdStatus: 'pending' | 'received' | 'review' | 'complete';
    if (!eid || eidStatus === 'pending') {
        verifyIdStatus = proofOfIdComplete ? 'received' : 'pending';
    } else if (eidPassed) {
        verifyIdStatus = 'complete';
    } else {
        verifyIdStatus = 'review';
    }

    const riskResultRaw = risk?.MatterId === instruction.InstructionRef ? (risk as any)?.RiskAssessmentResult?.toString().toLowerCase() : undefined;
    const riskStatus = riskResultRaw
        ? ['low', 'low risk', 'pass', 'approved'].includes(riskResultRaw)
            ? 'complete'
            : 'flagged'
        : 'pending';

    // Format submission date
    const formattedDate = instruction.SubmissionDate
        ? format(new Date(instruction.SubmissionDate), 'd MMM yyyy')
        : undefined;

    const cardClass = mergeStyles('instructionCard', {
        backgroundColor: colours.light.sectionBackground,
        borderRadius: '0px',
        padding: '16px',
        color: colours.light.text,
        cursor: 'pointer',
        border: isCompleted ? '0.25px solid #20b26c' : '1px solid #e1e4e8',
        boxShadow: isCompleted 
            ? 'inset 0 0 2px #20b26c15, 0 2px 8px rgba(0,0,0,0.08)'
            : '0 2px 8px rgba(0,0,0,0.08)',
        opacity: isCompleted ? 0.6 : 1,
        transition: 'box-shadow 0.3s ease, transform 0.3s ease, border 0.3s ease, opacity 0.3s ease',
        selectors: {
            ':hover': {
                boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                transform: 'translateY(-1px)',
            },
        },
    });

    const style: React.CSSProperties = {
        '--animation-delay': `${animationDelay}s`,
    } as React.CSSProperties;

    return (
        <div className={cardClass} style={style} onClick={onToggle} ref={innerRef}>
            {/* Client Name Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '1rem',
                fontWeight: 600,
                color: '#24292f',
                marginBottom: '8px',
                borderBottom: '1px solid rgba(0,0,0,0.1)',
                paddingBottom: '6px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isMultiClient ? (
                        <FaUsers style={{ fontSize: '14px', color: '#666' }} />
                    ) : (
                        <FaUser style={{ fontSize: '14px', color: '#666' }} />
                    )}
                    <span>{fullName || 'Client Name'}</span>
                </div>
                {instruction.InstructionRef && (
                    <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 400,
                        color: '#666',
                        fontFamily: 'monospace'
                    }}>
                        {instruction.InstructionRef}
                    </span>
                )}
            </div>

            {/* Stage/Status Banner */}
            {instruction.Stage && (
                <div style={{
                    backgroundColor: isCompleted ? '#e6f4ea' : stage === 'initialised' ? '#e8f4fd' : '#fffbe6',
                    borderLeft: `3px solid ${isCompleted ? '#20b26c' : stage === 'initialised' ? '#3690CE' : '#FFB900'}`,
                    color: isCompleted ? '#20b26c' : stage === 'initialised' ? '#1a73e8' : '#b88600',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    padding: '6px 12px',
                    marginBottom: '12px',
                    borderRadius: '0px',
                }}>
                    Stage: {instruction.Stage}
                </div>
            )}

            {/* Service Description from Deal */}
            {deal && (deal.ServiceDescription || typeof deal.Amount === 'number') && (
                <div style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e1e4e8',
                    borderRadius: '0px',
                    padding: '8px 12px',
                    marginBottom: '12px',
                    position: 'relative'
                }}>
                    <div style={{
                        position: 'absolute',
                        top: '-8px',
                        left: '8px',
                        backgroundColor: colours.light.sectionBackground,
                        padding: '0 4px',
                        fontSize: '0.75rem',
                        color: '#8b949e',
                        fontWeight: 500
                    }}>
                        Service & Fee
                    </div>
                    <div style={{ marginBottom: '4px', fontSize: '0.9rem' }}>
                        {deal.ServiceDescription || 'Legal Service'}
                    </div>
                    {typeof deal.Amount === 'number' && (
                        <div style={{ 
                            fontSize: '0.85rem', 
                            fontWeight: 600, 
                            color: '#3690CE',
                            fontFamily: 'Raleway'
                        }}>
                            £{deal.Amount.toLocaleString()}
                        </div>
                    )}
                </div>
            )}

            {/* Contact Information */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '12px',
                marginBottom: '12px'
            }}>
                {instruction.Email && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e1e4e8',
                        borderRadius: '0px',
                        height: '36px',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            backgroundColor: '#fff',
                            borderRight: '1px solid #e1e4e8',
                            height: '100%',
                            width: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <rect x="2" y="4" width="20" height="16" rx="2" fill="none" stroke="#666" strokeWidth="1.5"/>
                                <polyline points="4,6 12,13 20,6" fill="none" stroke="#666" strokeWidth="1.5"/>
                            </svg>
                        </div>
                        <div style={{
                            fontSize: '0.8rem',
                            color: '#333',
                            padding: '0 8px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {instruction.Email}
                        </div>
                    </div>
                )}

                {instruction.Phone && (
                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        backgroundColor: '#f8f9fa',
                        border: '1px solid #e1e4e8',
                        borderRadius: '0px',
                        height: '36px',
                        overflow: 'hidden',
                    }}>
                        <div style={{
                            backgroundColor: '#fff',
                            borderRight: '1px solid #e1e4e8',
                            height: '100%',
                            width: '36px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M6.62 10.79a15.053 15.053 0 006.59 6.59l2.2-2.2a1 1 0 011.01-.24c1.12.37 2.33.57 3.58.57a1 1 0 011 1V20a1 1 0 01-1 1C10.07 21 3 13.93 3 5a1 1 0 011-1h3.5a1 1 0 011 1c0 1.25.2 2.46.57 3.58a1 1 0 01-.24 1.01l-2.2 2.2z" fill="#666"/>
                            </svg>
                        </div>
                        <div style={{
                            fontSize: '0.8rem',
                            color: '#333',
                            padding: '0 8px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                        }}>
                            {instruction.Phone}
                        </div>
                    </div>
                )}
            </div>

            {/* Quick Summary Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
                gap: '8px',
                backgroundColor: 'rgba(0,0,0,0.02)',
                padding: '8px',
                borderRadius: '0px'
            }}>
                {/* ID Status */}
                <div>
                    <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px' }}>ID Verification</div>
                    <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: verifyIdStatus === 'complete' ? '#20b26c' : 
                               verifyIdStatus === 'review' ? '#FFB900' :
                               verifyIdStatus === 'received' ? '#3690CE' : '#666',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: verifyIdStatus === 'complete' ? '#20b26c' : 
                                           verifyIdStatus === 'review' ? '#FFB900' :
                                           verifyIdStatus === 'received' ? '#3690CE' : '#ccc'
                        }} />
                        {verifyIdStatus === 'complete' ? 'Verified' : 
                         verifyIdStatus === 'review' ? 'Review' :
                         verifyIdStatus === 'received' ? 'Received' : 'Pending'}
                    </div>
                </div>

                {/* Payment Status */}
                <div>
                    <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px' }}>Payment</div>
                    <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: paymentComplete ? '#20b26c' : paymentFailed ? '#d13438' : '#666',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: paymentComplete ? '#20b26c' : paymentFailed ? '#d13438' : '#ccc'
                        }} />
                        {paymentComplete ? 'Complete' : paymentFailed ? 'Failed' : 'Pending'}
                    </div>
                </div>

                {/* Documents Status */}
                <div>
                    <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px' }}>Documents</div>
                    <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: documentsComplete ? '#20b26c' : '#666',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: documentsComplete ? '#20b26c' : '#ccc'
                        }} />
                        {documentsComplete ? `${documents?.length ?? documentCount} Files` : 'Pending'}
                    </div>
                </div>

                {/* Risk Assessment */}
                <div>
                    <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px' }}>Risk</div>
                    <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: riskStatus === 'complete' ? '#20b26c' : 
                               riskStatus === 'flagged' ? '#FFB900' : '#666',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: riskStatus === 'complete' ? '#20b26c' : 
                                           riskStatus === 'flagged' ? '#FFB900' : '#ccc'
                        }} />
                        {riskStatus === 'complete' ? 'Approved' : 
                         riskStatus === 'flagged' ? 'Flagged' : 'Pending'}
                    </div>
                </div>

                {formattedDate && (
                    <div>
                        <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px' }}>Submitted</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>{formattedDate}</div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default InstructionCard;
