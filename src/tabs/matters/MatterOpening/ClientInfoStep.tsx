import React from 'react';
import { Stack, Text, PrimaryButton, Callout, DatePicker } from '@fluentui/react';
import TagButton from './TagButton';
import { sharedPrimaryButtonStyles } from '../../../app/styles/ButtonStyles';
import { colours } from '../../../app/styles/colours';

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
}) => (
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
        <Stack>
            <Text variant="mediumPlus" style={{ marginBottom: 6 }}>
                Select Supervising Partner
            </Text>
            <Stack horizontal wrap tokens={{ childrenGap: 10 }}>
                {partnerOptions.map((name) => (
                    <TagButton key={name} label={name} active={supervisingPartner === name} onClick={() => setSupervisingPartner(name)} color={colours.highlight} />
                ))}
            </Stack>
        </Stack>
        <Stack>
            <Text variant="mediumPlus" style={{ marginBottom: 6 }}>
                Select Originating Solicitor
            </Text>
            <Stack horizontal wrap tokens={{ childrenGap: 10 }}>
                {partnerOptions.map((name) => (
                    <TagButton key={name} label={name} active={originatingSolicitor === name} onClick={() => setOriginatingSolicitor(name)} color={colours.highlight} />
                ))}
            </Stack>
        </Stack>
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
        <PrimaryButton text="Continue" onClick={onContinue} styles={sharedPrimaryButtonStyles} />
    </Stack>
);

export default ClientInfoStep;
