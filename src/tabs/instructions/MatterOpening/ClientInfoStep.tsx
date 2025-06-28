import React from 'react';
import { Stack, Text, PrimaryButton, Callout, DatePicker, mergeStyles } from '@fluentui/react';
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
    fundsReceived: string;
    setFundsReceived: (v: string) => void;
    isDateCalloutOpen: boolean;
    setIsDateCalloutOpen: (v: boolean) => void;
    dateButtonRef: React.RefObject<HTMLDivElement>;
    partnerOptions: string[];
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
    fundsReceived,
    setFundsReceived,
    isDateCalloutOpen,
    setIsDateCalloutOpen,
    dateButtonRef,
    partnerOptions,
    onContinue,
}) => {
    const separatorStyle = mergeStyles({
        height: '1px',
        backgroundColor: colours.light.border,
        margin: '1rem 0',
    });

    return (
        <Stack tokens={{ childrenGap: 20 }}>
            <div className="input-bar">
                <div className="MultiSelect-segment" ref={dateButtonRef}>
                    <PrimaryButton
                        text={selectedDate ? `Date: ${selectedDate.toLocaleDateString()}` : 'Select Date'}
                        onClick={() => setIsDateCalloutOpen(!isDateCalloutOpen)}
                        styles={{ root: { borderRadius: 0, width: '100%', height: '100%' } }}
                    />
                    {isDateCalloutOpen && (
                        <Callout target={dateButtonRef.current} onDismiss={() => setIsDateCalloutOpen(false)} setInitialFocus>
                            <DatePicker
                                value={selectedDate || undefined}
                                onSelectDate={(date) => {
                                    if (date) setSelectedDate(date);
                                    setIsDateCalloutOpen(false);
                                }}
                                styles={{ root: { margin: 8, width: 200 } }}
                            />
                        </Callout>
                    )}
                </div>
                <div className="MultiSelect-segment">
                    <select className="team-select" value={teamMember} onChange={(e) => setTeamMember(e.target.value)}>
                        {teamMemberOptions.map((name) => (
                            <option key={name} value={name}>
                                {name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className={separatorStyle} />
            <Stack>
                <Text variant="mediumPlus" style={{ marginBottom: 6 }}>
                    Select Supervising Partner
                </Text>
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
            </Stack>
            <div className={separatorStyle} />
            <Stack aria-label="Solicitor">
                <Text variant="mediumPlus" style={{ marginBottom: 6 }}>
                    Select Originating Solicitor
                </Text>
                <div className="input-bar">
                    <div className="MultiSelect-segment">
                        <select
                            className="team-select"
                            value={originatingSolicitor}
                            onChange={(e) => setOriginatingSolicitor(e.target.value)}
                        >
                            {teamMemberOptions.map((name) => (
                                <option key={name} value={name}>
                                    {name}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </Stack>
            <div className={separatorStyle} />
            <Stack>
                <Text variant="mediumPlus" style={{ marginBottom: 6 }}>
                    Have funds on account been received?
                </Text>
                <div className="have-funds-bar">
                    {['Yes', 'No', 'Not Required'].map((option) => (
                        <div
                            key={option}
                            className={`MultiSelect-segment${fundsReceived === option ? ' active' : ''}`}
                            onClick={() => setFundsReceived(option)}
                        >
                            {option}
                        </div>
                    ))}
                </div>
            </Stack>
            <div className={separatorStyle} />
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