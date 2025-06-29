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
        margin: '0.5rem 0',
    });

    return (
        <Stack tokens={{ childrenGap: 12 }}>
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
            </Stack>
            <div className={separatorStyle} />
            <Stack aria-label="Solicitor">
                <div className="question-banner">Select Originating Solicitor</div>
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
                <div className="question-banner">Have funds on account been received?</div>
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