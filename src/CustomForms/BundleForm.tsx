import React, { useState } from 'react';
import { Stack, Dropdown, IDropdownOption, ComboBox, IComboBoxOption, TextField, DatePicker, PrimaryButton, DefaultButton, IButtonStyles } from '@fluentui/react';
import { colours } from '../app/styles/colours';
import { dashboardTokens } from '../tabs/instructions/componentTokens';
import '../app/styles/MatterOpeningCard.css';
import '../app/styles/MultiSelect.css';
import { sharedPrimaryButtonStyles, sharedDefaultButtonStyles } from '../app/styles/ButtonStyles';
import { Matter, TeamData } from '../app/functionality/types';

const toggleStyles: IButtonStyles = {
    root: {
        padding: '12px 20px',
        borderRadius: 0,
        backgroundColor: colours.grey,
        border: `1px solid ${colours.darkBlue}`,
        height: '40px',
        fontWeight: 600,
        color: colours.darkBlue,
        flex: 1,
    },
    rootHovered: {
        backgroundColor: colours.highlightBlue,
        color: colours.darkBlue,
    },
    rootPressed: {
        backgroundColor: colours.highlight,
        color: '#ffffff',
    },
    rootChecked: {
        backgroundColor: colours.darkBlue,
        color: '#ffffff',
    },
};

// Only allow a single covering letter
interface CoverLetter {
    link: string;
    copies: number;
}

interface BundleFormProps {
    team: TeamData[];
    matters: Matter[];
    onBack: () => void;
}

const BundleForm: React.FC<BundleFormProps> = ({ team, matters, onBack }) => {
    const [name, setName] = useState<string>('');
    const [matterRef, setMatterRef] = useState<string>('');
    const [bundleLink, setBundleLink] = useState<string>('');
    const [posted, setPosted] = useState<boolean>(false);
    const [leftInOffice, setLeftInOffice] = useState<boolean>(false);
    const [arrivalDate, setArrivalDate] = useState<Date | null>(null);
    const [officeDate, setOfficeDate] = useState<Date | null>(null);
    const [coverLetter, setCoverLetter] = useState<CoverLetter>({ link: '', copies: 1 });
    const [copiesInOffice, setCopiesInOffice] = useState<number>(1);
    const [notes, setNotes] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);
    const userOptions: IDropdownOption[] = team.map(t => ({
        key: t.Initials ? t.Initials : (t["Full Name"] ? t["Full Name"] : ''),
        text: t["Full Name"] ? t["Full Name"] : (t.Initials ? t.Initials : '')
    }));
    const [matterFilter, setMatterFilter] = useState<string>('');
    const matterOptions: IComboBoxOption[] = React.useMemo(() =>
        matters
            .slice()
            .sort((a, b) => new Date(b.OpenDate).getTime() - new Date(a.OpenDate).getTime())
            .map(m => ({ key: m.DisplayNumber, text: m.DisplayNumber })),
        [matters]);

    // Validation function
    const isValid = () => {
        if (!name || !matterRef || !bundleLink) return false;
        if (!posted && !leftInOffice) return false;
        if (posted) {
            if (!arrivalDate) return false;
            if (!coverLetter.link || coverLetter.copies < 1) return false;
        }
        if (leftInOffice) {
            if (!officeDate || copiesInOffice < 1) return false;
        }
        return true;
    };

    const handleSubmit = async () => {
        if (!isValid()) return;
        setSubmitting(true);
        const payload = {
            name,
            matterReference: matterRef,
            bundleLink,
            deliveryOptions: {
                posted,
                leftInOffice,
            },
            arrivalDate: posted ? arrivalDate?.toISOString() : null,
            officeReadyDate: leftInOffice ? officeDate?.toISOString() : null,
            coveringLetter: posted ? coverLetter : undefined,
            copiesInOffice: leftInOffice ? copiesInOffice : undefined,
            notes: notes || undefined,
        };
        try {
            await fetch('/api/bundle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            onBack();
        } catch (err) {
            console.error(err);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Stack tokens={dashboardTokens} className="workflow-container">
            <div className="workflow-main matter-opening-card">
                <h3 className="step-title">Bundle Submission</h3>
                <Stack tokens={{ childrenGap: 16 }} styles={{ root: { width: '100%' } }}>
                    <div className="question-banner">Request Details</div>
                    <Stack horizontal tokens={{ childrenGap: 12 }} wrap styles={{ root: { width: '100%' } }}>
                        <Stack styles={{ root: { flex: 1 } }}>
                            <Dropdown
                                label="Name"
                                options={userOptions}
                                selectedKey={name}
                                onChange={(_, o) => setName(String(o?.key))}
                                required
                            />
                        </Stack>
                        <Stack styles={{ root: { flex: 1 } }}>
                            <ComboBox
                                label="Matter reference"
                                options={matterOptions}
                                allowFreeform
                                autoComplete="on"
                                selectedKey={matterRef}
                                onInputValueChange={(val) => setMatterFilter(val)}
                                onChange={(_, option, __, val) => setMatterRef(option ? String(option.key) : (val || ''))}
                                onResolveOptions={() => {
                                    if (!matterFilter) return matterOptions;
                                    return matterOptions.filter((opt) => opt.text.toLowerCase().includes(matterFilter.toLowerCase()));
                                }}
                                required
                            />
                        </Stack>
                    </Stack>
                    <TextField label="NetDocs link (bundle)" value={bundleLink} onChange={(_, v) => setBundleLink(v || '')} required />
                    <div className="form-separator" />

                    <div className="question-banner">Delivery Method</div>
                    <Stack horizontal tokens={{ childrenGap: 12 }} styles={{ root: { width: '100%' } }}>
                        <DefaultButton
                            text="Posted"
                            onClick={() => setPosted((p) => !p)}
                            styles={toggleStyles}
                            checked={posted}
                            iconProps={{ iconName: 'Send' }}
                        />
                        <DefaultButton
                            text="Left in office"
                            onClick={() => setLeftInOffice((p) => !p)}
                            styles={toggleStyles}
                            checked={leftInOffice}
                            iconProps={{ iconName: 'Home' }}
                        />
                    </Stack>

                    {posted && (
                        <>
                            <div className="form-separator" />
                            <div className="question-banner">Postal Details</div>
                            <Stack tokens={{ childrenGap: 12 }} styles={{ root: { width: '100%' } }}>
                                <DatePicker label="Arrival date" value={arrivalDate || undefined} onSelectDate={(date) => setArrivalDate(date ?? null)} isRequired />
                                <Stack horizontal tokens={{ childrenGap: 8 }}>
                                    <TextField
                                        label="Covering letter link"
                                        value={coverLetter.link}
                                        onChange={(_, v) => setCoverLetter((c) => ({ ...c, link: v || '' }))}
                                        required
                                    />
                                    <TextField
                                        label="No. of copies to address"
                                        type="number"
                                        value={coverLetter.copies.toString()}
                                        onChange={(_, v) => setCoverLetter((c) => ({ ...c, copies: Number(v) || 1 }))}
                                        required
                                    />
                                </Stack>
                                <span style={{ color: colours.greyText, fontSize: '12px' }}>
                                    This should be to the address on the covering letter uploaded
                                </span>
                            </Stack>
                        </>
                    )}

                    {leftInOffice && (
                        <>
                            <div className="form-separator" />
                            <div className="question-banner">Office Drop-off</div>
                            <Stack tokens={{ childrenGap: 12 }} styles={{ root: { width: '100%' } }}>
                                <DatePicker label="Office-ready date" value={officeDate || undefined} onSelectDate={(date) => setOfficeDate(date ?? null)} isRequired />
                                <TextField
                                    label="No. of copies in office"
                                    type="number"
                                    value={copiesInOffice.toString()}
                                    onChange={(_, v) => setCopiesInOffice(Number(v) || 1)}
                                    required
                                />
                            </Stack>
                        </>
                    )}

                    <div className="form-separator" />
                    <div className="question-banner">Additional Notes</div>
                    <TextField label="Other notes" multiline rows={3} value={notes} onChange={(_, v) => setNotes(v || '')} />
                    <Stack horizontal tokens={{ childrenGap: 8 }}>
                        <PrimaryButton text="Submit" onClick={handleSubmit} disabled={!isValid() || submitting} styles={sharedPrimaryButtonStyles} />
                        <DefaultButton text="Cancel" onClick={onBack} styles={sharedDefaultButtonStyles} />
                    </Stack>
                </Stack>
            </div>
        </Stack>
    );
};

export default BundleForm;
