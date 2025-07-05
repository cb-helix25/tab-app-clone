import React from 'react';
import { Stack, Text, PrimaryButton, Callout, DatePicker, mergeStyles, TextField } from '@fluentui/react';
import { sharedPrimaryButtonStyles } from '../../../app/styles/ButtonStyles';
import { colours } from '../../../app/styles/colours';
import '../../../app/styles/MultiSelect.css';

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
    source: string;
    setSource: (v: string) => void;
    referrerName: string;
    setReferrerName: (v: string) => void;
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
    source,
    setSource,
    referrerName,
    setReferrerName,
    isDateCalloutOpen,
    setIsDateCalloutOpen,
    dateButtonRef,
    partnerOptions,
    requestingUser,
    onContinue,
}) => {
    const separatorStyle = mergeStyles({
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
        <Stack tokens={{ childrenGap: 12 }}>
            {/* Date Section */}
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="question-banner">Opening Date & Time</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 'normal', fontSize: 16 }}>
                            {(selectedDate ? selectedDate.toLocaleDateString() : new Date().toLocaleDateString())}, {liveTime}
                        </span>
                    </div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div className="question-banner">User Requesting File</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 'normal', fontSize: 16, color: '#888' }}>{requestingUser}</span>
                    </div>
                </div>
            </div>
            <div className={separatorStyle} />
            {/* Supervising Partner */}
            <div>
                <div className="question-banner">Select Supervising Partner</div>
                <div className="MultiSelect-bar">
                    {partnerOptions.map((name) => (
                        <div
                            key={name}
                            className={`MultiSelect-segment${supervisingPartner === name ? ' active' : ''}`}
                            onClick={() => setSupervisingPartner(name)}
                        >
                            {name}
                        </div>
                    ))}
                </div>
            </div>
            <div className={separatorStyle} />
            {/* Responsible/Originating Solicitor Row */}
            <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ flex: 1 }}>
                    <div className="question-banner">Responsible Solicitor</div>
                    <div className={`MultiSelect-segment${teamMember ? ' active' : ''}`} style={{ width: '100%' }}>
                        <select
                            className={`team-select${teamMember ? ' selected' : ''}`}
                            value={teamMember}
                            onChange={(e) => setTeamMember(e.target.value)}
                            style={{ width: '100%', color: '#fff', background: '#061733' }}
                        >
                            {teamMemberOptions.map((name) => (
                                <option key={name} value={name} style={{ color: '#fff', background: '#061733' }}>{name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div style={{ flex: 1 }}>
                    <div className="question-banner">Originating Solicitor</div>
                    <div className={`MultiSelect-segment${originatingSolicitor ? ' active' : ''}`} style={{ width: '100%' }}>
                        <select
                            className={`team-select${originatingSolicitor ? ' selected' : ''}`}
                            value={originatingSolicitor}
                            onChange={(e) => setOriginatingSolicitor(e.target.value)}
                            style={{ width: '100%', color: '#fff', background: '#061733' }}
                        >
                            {teamMemberOptions.map((name) => (
                                <option key={name} value={name} style={{ color: '#fff', background: '#061733' }}>{name}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>
            <div className={separatorStyle} />
            {/* Source Selection */}
            <div>
                <div className="question-banner">Select Source</div>
                <div className="MultiSelect-bar">
                    {['Search', 'Referral', 'Your Following', 'Uncertain'].map((option) => (
                        <div
                            key={option}
                            className={`MultiSelect-segment${source === option.toLowerCase() ? ' active' : ''}`}
                            onClick={() => {
                                setSource(option.toLowerCase());
                                if (option !== 'Referral') setReferrerName('');
                            }}
                            style={{ textTransform: 'capitalize' }}
                        >
                            {option}
                        </div>
                    ))}
                </div>
                {source === 'referral' && (
                    <TextField
                        placeholder="Enter referrer's name"
                        value={referrerName}
                        onChange={(_: any, newVal: string | undefined) => setReferrerName(newVal || '')}
                        styles={{ root: { width: '100%', maxWidth: 400, margin: '0 auto' } }}
                    />
                )}
            </div>
            {onContinue && (
                <PrimaryButton
                    text="Continue"
                    onClick={onContinue}
                    styles={sharedPrimaryButtonStyles}
                />
            )}
        </Stack>
    );
};

export default ClientInfoStep;