import React from 'react';
import { format } from 'date-fns';
import { mergeStyles } from '@fluentui/react';
import { FaShieldAlt, FaExclamationTriangle } from 'react-icons/fa';
import { colours } from '../../app/styles/colours';

interface RiskAssessmentCardProps {
    assessment: any;
    compact?: boolean;
    animationDelay?: number;
    onClick?: () => void;
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

const RiskAssessmentCard: React.FC<RiskAssessmentCardProps> = ({
    assessment,
    compact = false,
    animationDelay = 0,
    onClick,
}) => {
    const riskResult = assessment?.RiskAssessmentResult;
    const isHighRisk = riskResult?.toLowerCase().includes('high') || riskResult?.toLowerCase() === 'fail';
    const riskColor = getRiskColor(riskResult);

    const cardClass = mergeStyles('riskAssessmentCard', {
        backgroundColor: colours.light.sectionBackground,
        borderRadius: '0px',
        padding: compact ? '12px' : '16px',
        color: colours.light.text,
        cursor: onClick ? 'pointer' : 'default',
        position: 'relative',
        border: isHighRisk 
            ? '0.5px solid #d13438' 
            : '1px solid #e1e4e8',
        boxShadow: isHighRisk 
            ? 'inset 0 0 3px #d1343820, 0 2px 8px rgba(209, 52, 56, 0.1)'
            : '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'box-shadow 0.3s ease, transform 0.3s ease',
        selectors: onClick ? {
            ':hover': {
                boxShadow: isHighRisk
                    ? 'inset 0 0 3px #d1343840, 0 4px 16px rgba(209, 52, 56, 0.15)'
                    : '0 4px 16px rgba(0,0,0,0.12)',
                transform: 'translateY(-1px)',
            },
        } : {},
    });

    const style: React.CSSProperties = {
        '--animation-delay': `${animationDelay}s`,
    } as React.CSSProperties;

    const handleClick = () => {
        if (onClick) {
            onClick();
        }
    };

    return (
        <div className={cardClass} style={style} onClick={handleClick}>
            {/* Risk Warning Indicator */}
            {isHighRisk && (
                <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    width: '20px',
                    height: '20px',
                    backgroundColor: '#d13438',
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                    fontSize: '11px',
                    zIndex: 10,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                }}>
                    <FaExclamationTriangle />
                </div>
            )}

            {/* Client Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: compact ? '0.9rem' : '1rem',
                fontWeight: 600,
                color: '#24292f',
                marginBottom: compact ? '6px' : '8px',
                borderBottom: '1px solid rgba(0,0,0,0.1)',
                paddingBottom: compact ? '4px' : '6px'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FaShieldAlt style={{ fontSize: compact ? '12px' : '14px', color: '#666' }} />
                    <span>{assessment?.ClientName || 'Risk Assessment'}</span>
                </div>
                {assessment?.InstructionRef && (
                    <span style={{
                        fontSize: '0.75rem',
                        fontWeight: 400,
                        color: '#666',
                        fontFamily: 'monospace'
                    }}>
                        {assessment.InstructionRef}
                    </span>
                )}
            </div>

            {/* Risk Status Banner */}
            <div style={{
                backgroundColor: riskColor === '#20b26c' ? '#e6f4ea' : 
                                riskColor === '#FFB900' ? '#fffbe6' : '#fce8e6',
                borderLeft: `3px solid ${riskColor}`,
                color: riskColor,
                fontWeight: 500,
                fontSize: '0.85rem',
                padding: '6px 12px',
                marginBottom: compact ? '8px' : '12px',
                borderRadius: '0px',
            }}>
                Risk Assessment: {riskResult || 'Pending'}
            </div>

            {/* Assessment Details Grid */}
            <div style={{
                display: 'grid',
                gridTemplateColumns: compact ? '1fr 1fr' : 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: compact ? '6px' : '8px',
                backgroundColor: 'rgba(0,0,0,0.02)',
                padding: compact ? '6px' : '8px',
                borderRadius: '0px'
            }}>
                {/* Risk Score */}
                {assessment?.RiskScore && (
                    <div>
                        <div style={{ 
                            fontSize: '0.7rem', 
                            color: '#666', 
                            marginBottom: '2px' 
                        }}>
                            Risk Score
                        </div>
                        <div style={{
                            fontSize: compact ? '0.75rem' : '0.8rem',
                            fontWeight: 600,
                            color: riskColor,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px'
                        }}>
                            <span style={{
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                backgroundColor: riskColor
                            }} />
                            {assessment.RiskScore}
                        </div>
                    </div>
                )}

                {/* Assessor */}
                {assessment?.RiskAssessor && (
                    <div>
                        <div style={{ 
                            fontSize: '0.7rem', 
                            color: '#666', 
                            marginBottom: '2px' 
                        }}>
                            Assessor
                        </div>
                        <div style={{ 
                            fontSize: compact ? '0.75rem' : '0.8rem', 
                            fontWeight: 600 
                        }}>
                            {assessment.RiskAssessor}
                        </div>
                    </div>
                )}

                {/* Assessment Date */}
                {assessment?.ComplianceDate && (
                    <div>
                        <div style={{ 
                            fontSize: '0.7rem', 
                            color: '#666', 
                            marginBottom: '2px' 
                        }}>
                            Assessed
                        </div>
                        <div style={{ 
                            fontSize: compact ? '0.75rem' : '0.8rem', 
                            fontWeight: 600 
                        }}>
                            {format(new Date(assessment.ComplianceDate), 'd MMM yyyy')}
                        </div>
                    </div>
                )}

                {/* AML Rating */}
                {assessment?.AMLRating && (
                    <div>
                        <div style={{ 
                            fontSize: '0.7rem', 
                            color: '#666', 
                            marginBottom: '2px' 
                        }}>
                            AML Rating
                        </div>
                        <div style={{ 
                            fontSize: compact ? '0.75rem' : '0.8rem', 
                            fontWeight: 600 
                        }}>
                            {assessment.AMLRating}
                        </div>
                    </div>
                )}

                {/* Sanctions Check */}
                {assessment?.SanctionsCheck !== undefined && (
                    <div>
                        <div style={{ 
                            fontSize: '0.7rem', 
                            color: '#666', 
                            marginBottom: '2px' 
                        }}>
                            Sanctions
                        </div>
                        <div style={{ 
                            fontSize: compact ? '0.75rem' : '0.8rem', 
                            fontWeight: 600,
                            color: assessment.SanctionsCheck ? '#d13438' : '#20b26c'
                        }}>
                            {assessment.SanctionsCheck ? 'Flagged' : 'Clear'}
                        </div>
                    </div>
                )}

                {/* PEP Check */}
                {assessment?.PEPCheck !== undefined && (
                    <div>
                        <div style={{ 
                            fontSize: '0.7rem', 
                            color: '#666', 
                            marginBottom: '2px' 
                        }}>
                            PEP Check
                        </div>
                        <div style={{ 
                            fontSize: compact ? '0.75rem' : '0.8rem', 
                            fontWeight: 600,
                            color: assessment.PEPCheck ? '#d13438' : '#20b26c'
                        }}>
                            {assessment.PEPCheck ? 'Flagged' : 'Clear'}
                        </div>
                    </div>
                )}

                {/* Source of Wealth */}
                {assessment?.SourceOfWealth && !compact && (
                    <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ 
                            fontSize: '0.7rem', 
                            color: '#666', 
                            marginBottom: '2px' 
                        }}>
                            Source of Wealth
                        </div>
                        <div style={{ 
                            fontSize: '0.8rem', 
                            fontWeight: 400,
                            wordBreak: 'break-word'
                        }}>
                            {assessment.SourceOfWealth}
                        </div>
                    </div>
                )}

                {/* Notes */}
                {assessment?.Notes && !compact && (
                    <div style={{ gridColumn: '1 / -1' }}>
                        <div style={{ 
                            fontSize: '0.7rem', 
                            color: '#666', 
                            marginBottom: '2px' 
                        }}>
                            Notes
                        </div>
                        <div style={{ 
                            fontSize: '0.8rem', 
                            fontWeight: 400,
                            wordBreak: 'break-word',
                            maxHeight: '60px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                        }}>
                            {assessment.Notes}
                        </div>
                    </div>
                )}
            </div>

            {/* Risk Factors Summary */}
            {!compact && (assessment?.RiskFactors || assessment?.RiskJustification) && (
                <div style={{
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #e1e4e8',
                    borderRadius: '0px',
                    padding: '8px 12px',
                    marginTop: '8px',
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
                        Risk Factors
                    </div>
                    <div style={{ 
                        fontSize: '0.85rem',
                        maxHeight: '80px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                    }}>
                        {assessment.RiskFactors || assessment.RiskJustification}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RiskAssessmentCard;
