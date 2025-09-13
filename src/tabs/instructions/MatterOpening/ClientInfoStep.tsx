import React from 'react'; // invisible change // invisible change
// invisible change 2.2
import {
    Stack,
    Text,
    PrimaryButton,
    mergeStyles,
    TextField,
} from '@fluentui/react';
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
    requestingUserClioId: string;
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
    requestingUserClioId,
    onContinue,
}) => {
    const separatorStyle = mergeStyles({
        height: '1px',
        backgroundColor: colours.light.border,
        margin: '0.5rem 0',
    });

    // Live time state
    const [liveTime, setLiveTime] = React.useState<string>(
        new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' } as any)
    );
    React.useEffect(() => {
        const interval = setInterval(
            () => setLiveTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' } as any)),
            15000
        );
        return () => clearInterval(interval);
    }, []);

    return (
        <>
            <Stack tokens={{ childrenGap: 12 }}>
                {/* Live System Data Panel */}
                <div
                    style={{
                        background: 'transparent',
                        border: 'none',
                        borderRadius: 0,
                        padding: '8px 12px',
                        marginBottom: '4px',
                        position: 'relative',
                    }}
                >
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            position: 'relative',
                            zIndex: 1,
                        }}
                    >
                        {/* Date & Time */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div>
                                <div
                                    style={{
                                        fontSize: '10px',
                                        fontWeight: 500,
                                        color: '#9CA3AF',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.3px',
                                        marginBottom: '1px',
                                    }}
                                >
                                    Opening Date & Time
                                </div>
                                <div
                                    style={{
                                        fontSize: '13px',
                                        fontWeight: '400',
                                        color: '#4B5563',
                                        fontFamily: 'Raleway, sans-serif',
                                    }}
                                >
                                    {(selectedDate
                                        ? selectedDate.toLocaleDateString()
                                        : new Date().toLocaleDateString()
                                    )}
                                    , {liveTime}
                                </div>
                            </div>
                        </div>
                        {/* User info */}
                        <div style={{ textAlign: 'right' }}>
                            <div
                                style={{
                                    fontSize: '10px',
                                    fontWeight: 500,
                                    color: '#9CA3AF',
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.3px',
                                    marginBottom: '1px',
                                }}
                            >
                                User Requesting File
                            </div>
                            <div
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'flex-end',
                                    gap: '8px',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '13px',
                                        fontWeight: '400',
                                        color: '#4B5563',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                    }}
                                >
                                    <i
                                        className="ms-Icon ms-Icon--Contact"
                                        style={{ fontSize: '14px', color: '#9CA3AF' }}
                                    />
                                    {requestingUser}
                                    {requestingUserClioId ? (
                                        <span
                                            style={{
                                                marginLeft: 6,
                                                padding: '2px 6px',
                                                background: '#F4F6F9',
                                                border: '1px solid #e1e5ea',
                                                borderRadius: 6,
                                                color: '#6B7280',
                                                fontSize: '12px',
                                                lineHeight: 1.2,
                                            }}
                                        >
                                            {requestingUserClioId}
                                        </span>
                                    ) : ''}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Responsible Solicitor / Originating Solicitor */}
                <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ flex: 1 }}>
                        <div className="question-banner">Responsible Solicitor</div>
                        <div
                            style={{
                                position: 'relative',
                                width: '100%',
                                height: '50px',
                                border: `1px solid ${colours.highlight}`,
                                borderRadius: 0,
                                background: teamMember
                                    ? `${colours.highlight}15`
                                    : '#fff',
                                overflow: 'hidden',
                            }}
                        >
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
                                <option value="" disabled>
                                    Select Responsible Solicitor
                                </option>
                                {teamMemberOptions.map((name) => (
                                    <option key={name} value={name}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                            <div
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    pointerEvents: 'none',
                                    color: teamMember ? colours.highlight : '#4a5568',
                                }}
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <path
                                        d="M6 9l6 6 6-6"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>

                    <div style={{ flex: 1 }}>
                        <div className="question-banner">
                            Originating Solicitor
                        </div>
                        <div
                            style={{
                                position: 'relative',
                                width: '100%',
                                height: '50px',
                                border: `1px solid ${colours.highlight}`,
                                borderRadius: 0,
                                background: originatingSolicitor
                                    ? `${colours.highlight}15`
                                    : '#fff',
                                overflow: 'hidden',
                            }}
                        >
                            <select
                                value={originatingSolicitor}
                                onChange={(e) =>
                                    setOriginatingSolicitor(e.target.value)
                                }
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    border: 'none',
                                    background: 'transparent',
                                    padding: '0 40px 0 16px',
                                    fontSize: '16px',
                                    color: originatingSolicitor
                                        ? colours.highlight
                                        : '#4a5568',
                                    fontWeight: '400',
                                    appearance: 'none',
                                    cursor: 'pointer',
                                    outline: 'none',
                                }}
                            >
                                <option value="" disabled>
                                    Select Originating Solicitor
                                </option>
                                {teamMemberOptions.map((name) => (
                                    <option key={name} value={name}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                            <div
                                style={{
                                    position: 'absolute',
                                    right: '12px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    pointerEvents: 'none',
                                    color: originatingSolicitor
                                        ? colours.highlight
                                        : '#4a5568',
                                }}
                            >
                                <svg
                                    width="16"
                                    height="16"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                >
                                    <path
                                        d="M6 9l6 6 6-6"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                    />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Supervising Partner */}
                <ModernMultiSelect
                    label="Select Supervising Partner"
                    options={partnerOptions.map((name) => ({
                        key: name,
                        text: name,
                    }))}
                    selectedValue={supervisingPartner}
                    onSelectionChange={setSupervisingPartner}
                    variant="grid"
                />

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
