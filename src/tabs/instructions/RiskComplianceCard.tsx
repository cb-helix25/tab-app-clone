import React, { useState } from 'react';
import { mergeStyles, Text, Icon, Stack } from '@fluentui/react';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import { componentTokens } from '../../app/styles/componentTokens';
import '../../app/styles/RiskComplianceCard.css';
import { ClientInfo } from './JointClientCard';
import IdVerificationCard from './IdVerificationCard';
import { FaShieldAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';

interface GroupedRiskData {
    instructionRef: string;
    riskAssessments: any[];
    idVerifications: any[];
    clients: ClientInfo[];
    serviceDescription?: string;
    stage?: string;
    allData: any[];  // All original data items for this instruction
}

interface RiskComplianceCardProps {
    data: GroupedRiskData;  // Grouped data by instruction reference
    animationDelay?: number;
    onOpenInstruction?: () => void;
}

const getField = (obj: any, ...keys: string[]) => {
    for (const key of keys) {
        const val = obj?.[key];
        if (val !== undefined && val !== null) return val;
    }
    return undefined;
};

const getRiskColor = (riskLevel: string) => {
    const level = riskLevel?.toLowerCase();
    if (level?.includes('low') || level === 'pass' || level === 'approved') {
        return { background: '#e6f4ea', text: '#107C10' };
    }
    if (level?.includes('medium')) {
        return { background: '#fffbe6', text: '#b88600' };
    }
    if (level?.includes('high') || level === 'fail' || level === 'rejected') {
        return { background: '#fde7e9', text: '#d13438' };
    }
    return { background: '#f4f4f6', text: '#666' };
};

const RiskComplianceCard: React.FC<RiskComplianceCardProps> = ({
    data,
    animationDelay = 0,
    onOpenInstruction,
}) => {
    const { isDarkMode } = useTheme();

    const cardClass = mergeStyles('riskComplianceCard', {
        position: 'relative',
        backgroundColor: isDarkMode 
            ? 'linear-gradient(135deg, #333, #444)' 
            : 'linear-gradient(135deg, #ffffff, #f9f9f9)',
        color: isDarkMode ? colours.dark.text : colours.light.text,
        padding: '15px',
        borderRadius: 0, // No border radius like POID cards
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        cursor: onOpenInstruction ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
        fontFamily: 'Raleway, sans-serif',
        overflow: 'hidden',
        border: isDarkMode ? '1px solid #555' : 'none',
        minWidth: '280px',
        maxWidth: '100%',
        width: '100%',
        selectors: {
            ':hover': {
                transform: 'translateY(-4px)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            },
        },
    });

    const style: React.CSSProperties = { '--animation-delay': `${animationDelay}s` } as React.CSSProperties;

    // Render risk assessment data (consolidated)
    const renderRiskAssessment = () => {
        if (data.riskAssessments.length === 0) return null;
        
        // Use the first risk assessment as the primary one, but show data from all
        const primaryRisk = data.riskAssessments[0];
        
        return (
            <div style={{ marginBottom: 16 }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                }}>
                    <Text variant="small" styles={{ root: { fontWeight: 600 } }}>
                        Risk Assessment
                    </Text>
                    {primaryRisk.RiskScore && (
                        <div style={{
                            padding: '2px 8px',
                            borderRadius: 0,
                            backgroundColor: getRiskColor(primaryRisk.RiskAssessmentResult || '').background,
                            color: getRiskColor(primaryRisk.RiskAssessmentResult || '').text,
                            fontSize: '0.75rem',
                            fontWeight: 600,
                        }}>
                            Score: {primaryRisk.RiskScore}
                        </div>
                    )}
                </div>
                
                {/* Key risk metrics in a grid */}
                <div className="risk-metrics-grid" style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', 
                    gap: '8px',
                    marginBottom: 8,
                }}>
                    {primaryRisk.RiskAssessor && (
                        <div style={{
                            padding: '6px 8px',
                            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            borderRadius: 0,
                            fontSize: '0.8rem',
                        }}>
                            <div style={{ fontWeight: 600, color: '#666' }}>Assessor</div>
                            <div>{primaryRisk.RiskAssessor}</div>
                        </div>
                    )}
                    {primaryRisk.ComplianceDate && (
                        <div style={{
                            padding: '6px 8px',
                            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            borderRadius: 0,
                            fontSize: '0.8rem',
                        }}>
                            <div style={{ fontWeight: 600, color: '#666' }}>Date</div>
                            <div>{primaryRisk.ComplianceDate}</div>
                        </div>
                    )}
                    {primaryRisk.ValueOfInstruction && (
                        <div style={{
                            padding: '6px 8px',
                            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                            borderRadius: 0,
                            fontSize: '0.8rem',
                        }}>
                            <div style={{ fontWeight: 600, color: '#666' }}>Value</div>
                            <div>{primaryRisk.ValueOfInstruction}</div>
                        </div>
                    )}
                </div>
                
                {/* Detailed data grid for additional fields */}
                <details style={{ marginTop: 8 }}>
                    <summary style={{ 
                        cursor: 'pointer', 
                        fontSize: '0.8rem', 
                        color: '#3690CE',
                        fontWeight: 600,
                        marginBottom: 4,
                    }}>
                        View Details
                    </summary>
                    <dl className="data-grid" style={{ fontSize: '0.8rem' }}>
                        {Object.entries(primaryRisk).filter(([key, value]) => {
                            // Filter out null/undefined values and already displayed fields
                            if (value === null || value === undefined) return false;
                            if (['MatterId', 'InstructionRef', 'RiskAssessor', 'ComplianceDate', 'ValueOfInstruction', 'RiskScore', 'RiskAssessmentResult'].includes(key)) return false;
                            if (Array.isArray(value) && value.length === 0) return false;
                            if (typeof value === 'object' && Object.keys(value).length === 0) return false;
                            return true;
                        }).map(([k, v]) => (
                            <React.Fragment key={k}>
                                <dt style={{ fontSize: '0.75rem', fontWeight: 600 }}>{k}</dt>
                                <dd style={{ fontSize: '0.75rem' }}>
                                    {Array.isArray(v) || (typeof v === 'object' && v !== null)
                                        ? JSON.stringify(v)
                                        : String(v)}
                                </dd>
                            </React.Fragment>
                        ))}
                    </dl>
                </details>
            </div>
        );
    };

    // Render ID verification cards for each joint client
    const renderIdVerifications = () => {
        if (data.idVerifications.length === 0) return null;
        
        return (
            <div style={{ marginBottom: 16 }}>
                <Text variant="small" styles={{ root: { fontWeight: 600, marginBottom: 8 } }}>
                    ID Verifications ({data.idVerifications.length})
                </Text>
                <div
                    style={{
                        display: 'grid',
                        gap: '6px',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                    }}
                >
                    {data.idVerifications.map((verification, idx) => (
                        <IdVerificationCard
                            key={`id-verification-${idx}`}
                            data={verification}
                            animationDelay={idx * 0.1}
                        />
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className={cardClass} style={style} onClick={onOpenInstruction}>
            {/* Header section with instruction reference and stage - inspired by instruction card header */}
            <div style={{
                backgroundColor: 'rgba(244, 244, 246, 0.9)',
                color: '#061733',
                padding: '10px 16px',
                margin: '-15px -15px 15px -15px', // Extend to card edges
                fontSize: '16px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(0,0,0,0.1)',
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Text variant="mediumPlus" styles={{ root: { fontWeight: 600, margin: 0, color: '#061733' } }}>
                        {data.instructionRef || 'Unknown Reference'}
                    </Text>
                    {data.stage && (
                        <div style={{
                            padding: '2px 8px',
                            borderRadius: 0,
                            backgroundColor: data.stage === 'completed' ? '#e6f4ea' : '#fffbe6',
                            color: data.stage === 'completed' ? '#107C10' : '#b88600',
                            fontSize: '0.75rem',
                            fontWeight: 600,
                        }}>
                            {data.stage}
                        </div>
                    )}
                </div>
                
                {/* Add risk level indicator if available */}
                {data.riskAssessments.length > 0 && data.riskAssessments[0].RiskAssessmentResult && (
                    <div style={{
                        padding: '4px 8px',
                        borderRadius: 0,
                        backgroundColor: getRiskColor(data.riskAssessments[0].RiskAssessmentResult).background,
                        color: getRiskColor(data.riskAssessments[0].RiskAssessmentResult).text,
                        fontSize: '0.75rem',
                        fontWeight: 600,
                    }}>
                        {data.riskAssessments[0].RiskAssessmentResult}
                    </div>
                )}
            </div>

            {/* Service description banner similar to instruction cards */}
            {data.serviceDescription && (
                <div style={{
                    background: '#e6f7ef',
                    color: '#20b26c',
                    border: '1px solid #20b26c',
                    borderRadius: 0,
                    padding: '8px 16px',
                    fontSize: '15px',
                    fontWeight: 500,
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                }}>
                    {data.serviceDescription}
                </div>
            )}
            
            {/* ID Verifications for each joint client */}
            {renderIdVerifications()}
            
            {/* Single Risk Assessment for the instruction */}
            {renderRiskAssessment()}
            
            {/* Client list */}
            {data.clients && data.clients.length > 0 && (
                <div style={{ marginTop: 12 }}>
                    <Text variant="small" styles={{ root: { fontWeight: 600, marginBottom: 8 } }}>
                        Clients
                    </Text>
                    <div style={{ display: 'grid', gap: '4px' }}>
                        {data.clients.map((c: ClientInfo, idx: number) => (
                            <div key={idx} className="client-card" style={{
                                padding: '6px 12px',
                                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                borderRadius: 0,
                                fontSize: '0.85rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                            }}>
                                <span>{c.ClientEmail}</span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                    {c.Lead && (
                                        <span style={{
                                            padding: '2px 6px',
                                            backgroundColor: '#3690CE',
                                            color: 'white',
                                            borderRadius: 0,
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                        }}>
                                            Lead
                                        </span>
                                    )}
                                    {c.HasSubmitted !== undefined && (
                                        <span style={{
                                            padding: '2px 6px',
                                            backgroundColor: c.HasSubmitted ? '#107C10' : '#FFB900',
                                            color: 'white',
                                            borderRadius: 0,
                                            fontSize: '0.7rem',
                                            fontWeight: 600,
                                        }}>
                                            {c.HasSubmitted ? 'Submitted' : 'Pending'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {/* Background icon similar to POID cards */}
            <div 
                className="backgroundIcon"
                style={{
                    position: 'absolute',
                    bottom: '15px',
                    right: '15px',
                    fontSize: '48px',
                    opacity: 0.2,
                    color: '#3690CE',
                    pointerEvents: 'none',
                    transition: 'opacity 0.2s ease',
                }}
            >
                🛡️
            </div>
            
            {/* Add hover animation styles */}
            <style>{`
                .riskComplianceCard:hover .backgroundIcon {
                    opacity: 0.4 !important;
                }
            `}</style>
        </div>
    );
};

export default RiskComplianceCard;
