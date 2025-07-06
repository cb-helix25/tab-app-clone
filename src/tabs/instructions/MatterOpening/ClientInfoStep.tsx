import React from 'react';
import { Stack, Text, PrimaryButton, Callout, DatePicker, mergeStyles, TextField } from '@fluentui/react';
import { sharedPrimaryButtonStyles } from '../../../app/styles/ButtonStyles';
import { colours } from '../../../app/styles/colours';
import '../../../app/styles/MultiSelect.css';
import ModernMultiSelect from './ModernMultiSelect';

interface ClientInfoStepProps {
    selectedDate: Date | null;
    setSelectedDate: (d: Date) => void;
    teamMember: string;
    setTeamMember: (s: string) => void;
    teamMemberOptions: string[];
    supervisingPartner: string;
    setSupervisingPartner: (s: string) => void;
    originatingSolicitor: string;
    setOriginatingSolicitor: (s: string) => void;
    isDateCalloutOpen: boolean;
    setIsDateCalloutOpen: (v: boolean) => void;
    dateButtonRef: React.RefObject<HTMLDivElement>;
    partnerOptions: string[];
    requestingUser: string;
    onContinue?: () => void;
}

const ClientInfoStep: React.FC<ClientInfoStepProps> = ({
    selectedDate,
    setSelectedDate,
    teamMember,
    setTeamMember,
    teamMemberOptions,
    supervisingPartner,
    setSupervisingPartner,
    originatingSolicitor,
    setOriginatingSolicitor,
    isDateCalloutOpen,
    setIsDateCalloutOpen,
    dateButtonRef,
    partnerOptions,
    requestingUser,
    onContinue,
}) => {
    const separatorStyle = mergeStyles({ /* invisible change */
        height: '1px',
        backgroundColor: colours.light.border,
        margin: '0.5rem 0',
    });
    // Live time state
    const [liveTime, setLiveTime] = React.useState<string>(new Date().toLocaleTimeString());
    React.useEffect(() => {
        const interval = setInterval(() => {
            setLiveTime(new Date().toLocaleTimeString());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <>
        <Stack tokens={{ childrenGap: 12 }}>
            {/* Live System Data Panel */}
            <div style={{ 
                background: 'linear-gradient(135deg, #f8fafb 0%, #f1f4f6 100%)',
                border: '1px solid #e1e5e9',
                borderRadius: '4px',
                padding: '12px 16px',
                marginBottom: '8px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Subtle animated background pattern */}
                <div style={{
                    position: 'absolute',
                    top: 0,
                    right: 0,
                    width: '120px',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent 0%, rgba(54, 144, 206, 0.03) 100%)',
                    pointerEvents: 'none'
                }} />
                
                <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'space-between',
                    position: 'relative',
                    zIndex: 1
                }}>
                    {/* Left side - Date & Time with live indicator */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#10B981',
                            animation: 'pulse 2s infinite',
                            boxShadow: '0 0 0 0 rgba(16, 185, 129, 0.7)'
                        }} />
                        <div>
                            <div style={{ 
                                fontSize: '11px', 
                                fontWeight: '600', 
                                color: '#6B7280', 
                                textTransform: 'uppercase', 
                                letterSpacing: '0.5px',
                                marginBottom: '2px'
                            }}>
                                Opening Date & Time
                            </div>
                            <div style={{ 
                                fontSize: '15px', 
                                fontWeight: '600', 
                                color: '#1F2937',
                                fontFamily: 'Raleway, sans-serif'
                            }}>
                                {(selectedDate ? selectedDate.toLocaleDateString() : new Date().toLocaleDateString())}, {liveTime}
                            </div>
                        </div>
                    </div>

                    {/* Right side - User info */}
                    <div style={{ textAlign: 'right' }}>
                        <div style={{ 
                            fontSize: '11px', 
                            fontWeight: '600', 
                            color: '#6B7280', 
                            textTransform: 'uppercase', 
                            letterSpacing: '0.5px',
                            marginBottom: '2px'
                        }}>
                            User Requesting File
                        </div>
                        <div style={{ 
                            fontSize: '15px', 
                            fontWeight: '600', 
                            color: '#3690CE',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'flex-end',
                            gap: '6px'
                        }}>
                            <i className="ms-Icon ms-Icon--Contact" style={{ fontSize: '14px' }} />
                            {requestingUser}
                        </div>
                    </div>
                </div>
            </div>
            {/* Removed separator between live panel and solicitors */}
            
            {/* Responsible and Originating Solicitor Side by Side */}
            <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                    <div className="question-banner">Responsible Solicitor</div>
                    <div style={{ 
                        position: 'relative',
                        width: '100%',
                        height: '50px',
                        border: `1px solid ${colours.highlight}`,
                        borderRadius: '0px',
                        background: teamMember ? `${colours.highlight}15` : '#fff',
                        overflow: 'hidden',
                    }}>
                        <select
                            value={teamMember}
                            onChange={(e) => setTeamMember(e.target.value)}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                background: 'transparent',
                                padding: '0 40px 0 16px',
                                fontSize: '16px',
                                color: teamMember ? colours.highlight : '#4a5568',
                                fontWeight: '400',
                                appearance: 'none',
                                cursor: 'pointer',
                                outline: 'none',
                            }}
                        >
                            <option value="" disabled>Select Responsible Solicitor</option>
                            {teamMemberOptions.map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                        <div style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                            color: teamMember ? colours.highlight : '#4a5568',
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <div className="question-banner">Originating Solicitor</div>
                    <div style={{ 
                        position: 'relative',
                        width: '100%',
                        height: '50px',
                        border: `1px solid ${colours.highlight}`,
                        borderRadius: '0px',
                        background: originatingSolicitor ? `${colours.highlight}15` : '#fff',
                        overflow: 'hidden',
                    }}>
                        <select
                            value={originatingSolicitor}
                            onChange={(e) => setOriginatingSolicitor(e.target.value)}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                background: 'transparent',
                                padding: '0 40px 0 16px',
                                fontSize: '16px',
                                color: originatingSolicitor ? colours.highlight : '#4a5568',
                                fontWeight: '400',
                                appearance: 'none',
                                cursor: 'pointer',
                                outline: 'none',
                            }}
                        >
                            <option value="" disabled>Select Originating Solicitor</option>
                            {teamMemberOptions.map((name) => (
                                <option key={name} value={name}>{name}</option>
                            ))}
                        </select>
                        <div style={{
                            position: 'absolute',
                            right: '12px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            pointerEvents: 'none',
                            color: originatingSolicitor ? colours.highlight : '#4a5568',
                        }}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Supervising Partner */}
            <div>
                <ModernMultiSelect
                    label="Select Supervising Partner"
                    options={partnerOptions.map(name => ({ key: name, text: name }))}
                    selectedValue={supervisingPartner}
                    onSelectionChange={setSupervisingPartner}
                    variant="grid"
                />
            </div>
            {/* Removed separator after supervising partner */}
            
            {onContinue && (
                <PrimaryButton
                    text="Continue"
                    onClick={onContinue}
                    styles={sharedPrimaryButtonStyles}
                />
            )}
        </Stack>
        <style>{`
            @keyframes pulse {
                0% {
                    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
                }
                70% {
                    box-shadow: 0 0 0 6px rgba(16, 185, 129, 0);
                }
                100% {
                    box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
                }
            }
        `}</style>
        </>
    );
};

export default ClientInfoStep;