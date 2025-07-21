import React from 'react';
import { format } from 'date-fns';
import { mergeStyles } from '@fluentui/react';
import { FaShieldAlt, FaUser, FaUsers } from 'react-icons/fa';
import { colours } from '../../app/styles/colours';
import { ClientInfo } from './JointClientCard';

interface GroupedRiskData {
    instructionRef: string;
    riskAssessments: any[];
    idVerifications: any[];
    clients: ClientInfo[];
    serviceDescription?: string;
    stage?: string;
    allData: any[];
}

interface RiskComplianceCardProps {
    data: GroupedRiskData;
    animationDelay?: number;
    onOpenInstruction?: () => void;
    selected?: boolean;
    onSelect?: () => void;
}

const getRiskColor = (riskLevel: string) => {
    const level = riskLevel?.toLowerCase();
    if (level?.includes('low') || level === 'pass' || level === 'approved') {
        return '#20b26c';
    }
    if (level?.includes('medium')) {
        return '#FFB900';
    }
    if (level?.includes('high') || level === 'fail' || level === 'rejected') {
        return '#d13438';
    }
    return '#666';
};

const getVerificationStatus = (verifications: any[]) => {
    if (!verifications || verifications.length === 0) return 'pending';
    
    const hasCompleted = verifications.some(v => 
        v.EIDOverallResult?.toLowerCase() === 'passed' || 
        v.EIDOverallResult?.toLowerCase() === 'pass'
    );
    
    if (hasCompleted) return 'complete';
    
    const hasStarted = verifications.some(v => 
        v.EIDStatus && v.EIDStatus.toLowerCase() !== 'pending'
    );
    
    return hasStarted ? 'in-progress' : 'pending';
};

const RiskComplianceCard: React.FC<RiskComplianceCardProps> = ({
    data,
    animationDelay = 0,
    onOpenInstruction,
    selected = false,
    onSelect,
}) => {
    const isCompleted = data.stage?.toLowerCase() === 'completed';
    const primaryRisk = data.riskAssessments[0];
    const leadClient = data.clients?.find(c => c.Lead) || data.clients?.[0];
    const jointClients = data.clients?.filter(c => !c.Lead) || [];
    const isMultiClient = data.clients && data.clients.length > 1;
    
    // Get risk status (instruction level - one assessment for all clients)
    const riskResult = primaryRisk?.RiskAssessmentResult;
    const riskStatus = riskResult ? 
        ['low', 'low risk', 'pass', 'approved'].includes(riskResult.toLowerCase()) ? 'approved' :
        ['medium'].includes(riskResult.toLowerCase()) ? 'review' : 'flagged'
        : 'pending';
    
    // Get individual client verification statuses
    const getClientVerificationStatus = (clientEmail: string) => {
        const clientVerifications = data.idVerifications.filter(v => 
            v.ClientEmail?.toLowerCase() === clientEmail?.toLowerCase()
        );
        return getVerificationStatus(clientVerifications);
    };
    
    // Get instruction title
    const instructionTitle = isMultiClient ? 'Joint Clients' : 
        leadClient ? 
            `${leadClient.FirstName || ''} ${leadClient.LastName || ''}`.trim() ||
            leadClient.CompanyName || leadClient.ClientEmail?.split('@')[0] || 'Client'
            : 'Client';

    const cardClass = mergeStyles('riskComplianceCard', {
        backgroundColor: colours.light.sectionBackground,
        borderRadius: '0px',
        padding: '16px',
        color: colours.light.text,
        cursor: 'pointer',
        position: 'relative',
        border: selected 
            ? '2px solid #3690CE' 
            : isCompleted 
                ? '0.25px solid #20b26c' 
                : '1px solid #e1e4e8',
        boxShadow: selected
            ? '0 0 0 1px #3690CE20, 0 4px 16px rgba(54, 144, 206, 0.15)'
            : isCompleted 
                ? 'inset 0 0 2px #20b26c15, 0 2px 8px rgba(0,0,0,0.08)'
                : '0 2px 8px rgba(0,0,0,0.08)',
        opacity: isCompleted ? 0.6 : 1,
        transition: 'box-shadow 0.3s ease, transform 0.3s ease, border 0.3s ease, opacity 0.3s ease',
        selectors: {
            ':hover': {
                boxShadow: selected
                    ? '0 0 0 1px #3690CE30, 0 6px 20px rgba(54, 144, 206, 0.2)'
                    : '0 4px 16px rgba(0,0,0,0.12)',
                transform: 'translateY(-1px)',
            },
        },
    });

    const style: React.CSSProperties = {
        '--animation-delay': `${animationDelay}s`,
    } as React.CSSProperties;

    const handleCardClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (onSelect) {
            onSelect();
        } else if (onOpenInstruction) {
            onOpenInstruction();
        }
    };

    return (
        <div className={cardClass} style={style} onClick={handleCardClick}>
            {/* Selection Indicator */}
            {selected && (
                <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#3690CE',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '12px',
                    fontWeight: 600,
                    zIndex: 10,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                    ✓
                </div>
            )}

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
                    <FaShieldAlt style={{ fontSize: '14px', color: '#666' }} />
                    <span>{instructionTitle}</span>
                    {isMultiClient && (
                        <FaUsers style={{ fontSize: '12px', color: '#666', marginLeft: '4px' }} />
                    )}
                </div>
                {data.instructionRef && (
                    <span style={{
                        fontSize: '0.8rem',
                        fontWeight: 400,
                        color: '#666',
                        fontFamily: 'monospace'
                    }}>
                        {data.instructionRef}
                    </span>
                )}
            </div>

            {/* Stage/Status Banner */}
            {data.stage && (
                <div style={{
                    backgroundColor: isCompleted ? '#e6f4ea' : data.stage === 'initialised' ? '#e8f4fd' : '#fffbe6',
                    borderLeft: `3px solid ${isCompleted ? '#20b26c' : data.stage === 'initialised' ? '#3690CE' : '#FFB900'}`,
                    color: isCompleted ? '#20b26c' : data.stage === 'initialised' ? '#1a73e8' : '#b88600',
                    fontWeight: 500,
                    fontSize: '0.85rem',
                    padding: '6px 12px',
                    marginBottom: '12px',
                    borderRadius: '0px',
                }}>
                    Stage: {data.stage}
                </div>
            )}

            {/* Service Description */}
            {data.serviceDescription && (
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
                        Service
                    </div>
                    <div style={{ fontSize: '0.9rem' }}>
                        {data.serviceDescription}
                    </div>
                </div>
            )}

            {/* Risk Assessment Summary (Instruction Level) */}
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
                    Risk Assessment
                </div>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                    gap: '8px'
                }}>
                    {/* Risk Status */}
                    <div>
                        <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px' }}>Status</div>
                        <div style={{
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            color: getRiskColor(riskResult || ''),
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: getRiskColor(riskResult || '')
                            }} />
                            {riskStatus === 'approved' ? 'Approved' :
                             riskStatus === 'review' ? 'Review' :
                             riskStatus === 'flagged' ? 'Flagged' : 'Pending'}
                        </div>
                    </div>

                    {/* Risk Score */}
                    {primaryRisk?.RiskScore && (
                        <div>
                            <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px' }}>Score</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                {primaryRisk.RiskScore}
                            </div>
                        </div>
                    )}

                    {/* Assessor */}
                    {primaryRisk?.RiskAssessor && (
                        <div>
                            <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px' }}>Assessor</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                {primaryRisk.RiskAssessor}
                            </div>
                        </div>
                    )}

                    {/* Assessment Date */}
                    {primaryRisk?.ComplianceDate && (
                        <div>
                            <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px' }}>Assessed</div>
                            <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                                {format(new Date(primaryRisk.ComplianceDate), 'd MMM yyyy')}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Client Compliance Details */}
            {data.clients && data.clients.length > 0 && (
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
                        Client Compliance
                    </div>
                    
                    {/* Lead Client */}
                    {leadClient && (
                        <div style={{
                            marginBottom: jointClients.length > 0 ? '8px' : '0',
                            paddingBottom: jointClients.length > 0 ? '8px' : '0',
                            borderBottom: jointClients.length > 0 ? '1px solid #e1e4e8' : 'none'
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '4px'
                            }}>
                                <FaUser style={{ fontSize: '12px', color: '#3690CE' }} />
                                <span style={{ 
                                    fontSize: '0.85rem', 
                                    fontWeight: 600,
                                    color: '#3690CE'
                                }}>
                                    Lead: {`${leadClient.FirstName || ''} ${leadClient.LastName || ''}`.trim() || 
                                           leadClient.CompanyName || 
                                           leadClient.ClientEmail?.split('@')[0] || 'Client'}
                                </span>
                            </div>
                            <div style={{
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                color: getClientVerificationStatus(leadClient.ClientEmail || '') === 'complete' ? '#20b26c' :
                                       getClientVerificationStatus(leadClient.ClientEmail || '') === 'in-progress' ? '#3690CE' : '#666',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                marginLeft: '20px'
                            }}>
                                <span style={{
                                    width: '8px',
                                    height: '8px',
                                    borderRadius: '50%',
                                    backgroundColor: getClientVerificationStatus(leadClient.ClientEmail || '') === 'complete' ? '#20b26c' :
                                                   getClientVerificationStatus(leadClient.ClientEmail || '') === 'in-progress' ? '#3690CE' : '#ccc'
                                }} />
                                ID Verification: {getClientVerificationStatus(leadClient.ClientEmail || '') === 'complete' ? 'Verified' :
                                                 getClientVerificationStatus(leadClient.ClientEmail || '') === 'in-progress' ? 'In Progress' : 'Pending'}
                            </div>
                        </div>
                    )}

                    {/* Joint Clients */}
                    {jointClients.map((client, index) => {
                        const clientVerificationStatus = getClientVerificationStatus(client.ClientEmail || '');
                        return (
                            <div key={index} style={{
                                marginBottom: index < jointClients.length - 1 ? '6px' : '0'
                            }}>
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '8px',
                                    marginBottom: '4px'
                                }}>
                                    <FaUser style={{ fontSize: '12px', color: '#666' }} />
                                    <span style={{ 
                                        fontSize: '0.85rem', 
                                        fontWeight: 500
                                    }}>
                                        Joint: {`${client.FirstName || ''} ${client.LastName || ''}`.trim() || 
                                               client.CompanyName || 
                                               client.ClientEmail?.split('@')[0] || 'Client'}
                                    </span>
                                </div>
                                <div style={{
                                    fontSize: '0.8rem',
                                    fontWeight: 600,
                                    color: clientVerificationStatus === 'complete' ? '#20b26c' :
                                           clientVerificationStatus === 'in-progress' ? '#3690CE' : '#666',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    marginLeft: '20px'
                                }}>
                                    <span style={{
                                        width: '8px',
                                        height: '8px',
                                        borderRadius: '50%',
                                        backgroundColor: clientVerificationStatus === 'complete' ? '#20b26c' :
                                                       clientVerificationStatus === 'in-progress' ? '#3690CE' : '#ccc'
                                    }} />
                                    ID Verification: {clientVerificationStatus === 'complete' ? 'Verified' :
                                                     clientVerificationStatus === 'in-progress' ? 'In Progress' : 'Pending'}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Quick Summary Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '8px',
                backgroundColor: 'rgba(0,0,0,0.02)',
                padding: '8px',
                borderRadius: '0px'
            }}>
                {/* Overall Compliance Status */}
                <div>
                    <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px' }}>Overall Status</div>
                    <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: isCompleted ? '#20b26c' : '#3690CE',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: isCompleted ? '#20b26c' : '#3690CE'
                        }} />
                        {isCompleted ? 'Complete' : data.stage || 'In Progress'}
                    </div>
                </div>

                {/* Total Clients */}
                {isMultiClient && (
                    <div>
                        <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px' }}>Total Clients</div>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                            {data.clients.length} ({leadClient ? '1 Lead + ' : ''}{jointClients.length} Joint)
                        </div>
                    </div>
                )}

                {/* Verifications Complete */}
                <div>
                    <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px' }}>ID Verified</div>
                    <div style={{ fontSize: '0.8rem', fontWeight: 600 }}>
                        {data.clients ? 
                            data.clients.filter(c => getClientVerificationStatus(c.ClientEmail || '') === 'complete').length 
                            : 0} / {data.clients?.length || 0}
                    </div>
                </div>

                {/* Risk Level */}
                <div>
                    <div style={{ fontSize: '0.7rem', color: '#666', marginBottom: '2px' }}>Risk Level</div>
                    <div style={{
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        color: getRiskColor(riskResult || ''),
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                    }}>
                        <span style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: getRiskColor(riskResult || '')
                        }} />
                        {riskResult || 'Pending'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RiskComplianceCard;
