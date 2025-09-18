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
    /** Options for Responsible/Originating Solicitor (active solicitors/partners) */
    solicitorOptions: string[];
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
    solicitorOptions,
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
            <Stack tokens={{ childrenGap: 8 }}>
                {/* Date/User chips now shown in global header; removed local chips row */}

                {/* Responsible Solicitor / Originating Solicitor */}
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ flex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <i className="ms-Icon ms-Icon--Contact" style={{ fontSize: 16, color: '#3690CE' }} />
                            <span style={{ fontSize: 16, fontWeight: 600, color: colours.greyText }}>Responsible Solicitor</span>
                        </div>
                        <div
                            style={{
                                position: 'relative',
                                width: '100%',
                                height: '40px',
                                border: `1px solid ${colours.highlight}`,
                                borderRadius: 6,
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
                                    padding: '0 32px 0 12px',
                                    fontSize: '13px',
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
                                {solicitorOptions.map((name) => (
                                    <option key={name} value={name}>
                                        {name}
                                    </option>
                                ))}
                            </select>
                            <div
                                style={{
                                    position: 'absolute',
                                    right: '8px',
                                    top: '50%',
                                    transform: 'translateY(-50%)',
                                    pointerEvents: 'none',
                                    color: teamMember ? colours.highlight : '#4a5568',
                                }}
                            >
                                <svg
                                    width="12"
                                    height="12"
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
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <i className="ms-Icon ms-Icon--Contact" style={{ fontSize: 16, color: '#3690CE' }} />
                            <span style={{ fontSize: 16, fontWeight: 600, color: colours.greyText }}>Originating Solicitor</span>
                        </div>
                        <div
                            style={{
                                position: 'relative',
                                width: '100%',
                                height: '40px',
                                border: `1px solid ${colours.highlight}`,
                                borderRadius: 6,
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
                                    fontSize: '13px',
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
                                {solicitorOptions.map((name) => (
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
                <div style={{ marginTop: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <i className="ms-Icon ms-Icon--Contact" style={{ fontSize: 16, color: '#3690CE' }} />
                        <span style={{ fontSize: 16, fontWeight: 600, color: colours.greyText }}>Supervising Partner</span>
                    </div>
                    <ModernMultiSelect
                        label=""
                        options={partnerOptions.map((name) => ({
                            key: name,
                            text: name,
                        }))}
                        selectedValue={supervisingPartner}
                        onSelectionChange={setSupervisingPartner}
                        variant="grid"
                    />
                </div>

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
