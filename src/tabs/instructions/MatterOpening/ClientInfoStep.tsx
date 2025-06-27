import React from 'react';
import { Stack, Text, PrimaryButton, Callout, DatePicker, mergeStyles } from '@fluentui/react';
import TagButton from './TagButton';
import { sharedPrimaryButtonStyles } from '../../../app/styles/ButtonStyles';
import { colours } from '../../../app/styles/colours';
import '../../../app/styles/PartnerBar.css';

interface ClientInfoStepProps {
    selectedDate: Date | null;
    setSelectedDate: (d: Date) => void;
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
    onContinue: () => void;
}

const ClientInfoStep: React.FC<ClientInfoStepProps> = ({
    selectedDate,
    setSelectedDate,
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
            <div ref={dateButtonRef}>
                <PrimaryButton
                    text={selectedDate ? `Date: ${selectedDate.toLocaleDateString()}` : 'Select Date'}
                    onClick={() => setIsDateCalloutOpen(!isDateCalloutOpen)}
                    styles={{ root: { borderRadius: '20px', padding: '10px 20px' } }}
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
            <div className={separatorStyle} />
            <Stack>
                <Text variant="mediumPlus" style={{ marginBottom: 6 }}>
                    Select Supervising Partner
                </Text>
                <div className="partner-bar">
                    {partnerOptions.map((name) => (
                        <div
                            key={name}
                            className={`partner-segment${supervisingPartner === name ? ' active' : ''}`}
                            onClick={() => setSupervisingPartner(name)}
                        >
                            {name}
                        </div>
                    ))}
                </div>
            </Stack>
            <div className={separatorStyle} />
            <Stack>
                <Text variant="mediumPlus" style={{ marginBottom: 6 }}>
                    Select Originating Solicitor
                </Text>
                <div className="partner-bar">
                    {partnerOptions.map((name) => (
                        <div
                            key={name}
                            className={`partner-segment${originatingSolicitor === name ? ' active' : ''}`}
                            onClick={() => setOriginatingSolicitor(name)}
                        >
                            {name}
                        </div>
                    ))}
                </div>
            </Stack>
            <div className={separatorStyle} />
            <Stack>
                <Text variant="mediumPlus" style={{ marginBottom: 6 }}>
                    Have funds on account been received?
                </Text>
                <Stack horizontal wrap tokens={{ childrenGap: 10 }}>
                    {['Yes', 'No', 'Not Required'].map((option) => (
                        <TagButton key={option} label={option} active={fundsReceived === option} onClick={() => setFundsReceived(option)} color={colours.highlight} />
                    ))}
                </Stack>
            </Stack>
            <div className={separatorStyle} />
            <PrimaryButton text="Continue" onClick={onContinue} styles={sharedPrimaryButtonStyles} />
        </Stack>
    );
};

export default ClientInfoStep;