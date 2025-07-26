import React, { useState } from 'react';
import { Stack, Dropdown, IDropdownOption, Checkbox, TextField, DatePicker, PrimaryButton, DefaultButton } from '@fluentui/react';
import { dashboardTokens } from '../tabs/instructions/componentTokens';
import '../app/styles/MatterOpeningCard.css';
import { sharedPrimaryButtonStyles, sharedDefaultButtonStyles } from '../app/styles/ButtonStyles';
import { Matter, UserData } from '../app/functionality/types';

interface CoverLetter {
    link: string;
    copies: number;
}

interface BundleFormProps {
    users: UserData[];
    matters: Matter[];
    onBack: () => void;
}

const BundleForm: React.FC<BundleFormProps> = ({ users, matters, onBack }) => {
    const [name, setName] = useState<string>('');
    const [matterRef, setMatterRef] = useState<string>('');
    const [bundleLink, setBundleLink] = useState<string>('');
    const [posted, setPosted] = useState<boolean>(false);
    const [leftInOffice, setLeftInOffice] = useState<boolean>(false);
    const [arrivalDate, setArrivalDate] = useState<Date | null>(null);
    const [officeDate, setOfficeDate] = useState<Date | null>(null);
    const [coverLetters, setCoverLetters] = useState<CoverLetter[]>([{ link: '', copies: 1 }]);
    const [copiesInOffice, setCopiesInOffice] = useState<number>(1);
    const [notes, setNotes] = useState<string>('');
    const [submitting, setSubmitting] = useState<boolean>(false);
    const userOptions: IDropdownOption[] = users.map(u => ({
        key: u.Initials ? u.Initials : (u.FullName ? u.FullName : ''),
        text: u.FullName ? u.FullName : (u.Initials ? u.Initials : '')
    }));
    const matterOptions: IDropdownOption[] = matters.map(m => ({
        key: m.InstructionRef ?? '',
        text: m.InstructionRef ?? ''
    }));

    const handleAddLetter = () => setCoverLetters([...coverLetters, { link: '', copies: 1 }]);
    const handleRemoveLetter = (idx: number) => setCoverLetters(cl => cl.filter((_, i) => i !== idx));
    const canShowNotes = name && matterRef && bundleLink && (posted || leftInOffice) && ((posted && arrivalDate) || (leftInOffice && officeDate));
    const isValid = () => {
        if (!name || !matterRef || !bundleLink) return false;
        if (!posted && !leftInOffice) return false;
        if (posted) {
            if (!arrivalDate) return false;
            if (coverLetters.some(cl => !cl.link || cl.copies < 1)) return false;
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
            coveringLetters: posted ? coverLetters : [],
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
                <div className="step-header">
                    <h3 className="step-title">Bundle Submission</h3>
                </div>
                <div className="step-content">
                    <Stack tokens={{ childrenGap: 12 }}>
                        <Dropdown label="Name" options={userOptions} selectedKey={name} onChange={(_, o) => setName(String(o?.key))} required styles={{ root: { maxWidth: 300 } }} />
                        <Dropdown label="Matter reference" options={matterOptions} selectedKey={matterRef} onChange={(_, o) => setMatterRef(String(o?.key))} required styles={{ root: { maxWidth: 300 } }} />
                        <TextField label="NetDocs link (bundle)" value={bundleLink} onChange={(_, v) => setBundleLink(v || '')} required />
                        <div>
                            <Checkbox label="Posted" checked={posted} onChange={(_, c) => setPosted(!!c)} />
                            <Checkbox label="Left in office" checked={leftInOffice} onChange={(_, c) => setLeftInOffice(!!c)} />
                        </div>
                        {posted && (
                            <>
                                <DatePicker label="Arrival date" value={arrivalDate || undefined} onSelectDate={date => setArrivalDate(date ?? null)} isRequired />
                                {coverLetters.map((cl, idx) => (
                                    <Stack key={idx} horizontal tokens={{ childrenGap: 8 }}>
                                        <TextField label="Covering letter link" value={cl.link} onChange={(_, v) => setCoverLetters(arr => arr.map((c, i) => i === idx ? { ...c, link: v || '' } : c))} required />
                                        <TextField label="No. of copies to address" type="number" value={cl.copies.toString()} onChange={(_, v) => setCoverLetters(arr => arr.map((c, i) => i === idx ? { ...c, copies: Number(v) || 1 } : c))} required />
                                        {coverLetters.length > 1 && <DefaultButton text="Delete" onClick={() => handleRemoveLetter(idx)} />}
                                    </Stack>
                                ))}
                                <PrimaryButton text="Add Covering Letter" onClick={handleAddLetter} styles={sharedPrimaryButtonStyles} />
                            </>
                        )}
                        {leftInOffice && (
                            <>
                                <DatePicker label="Office-ready date" value={officeDate || undefined} onSelectDate={date => setOfficeDate(date ?? null)} isRequired />
                                <TextField label="No. of copies in office" type="number" value={copiesInOffice.toString()} onChange={(_, v) => setCopiesInOffice(Number(v) || 1)} required />
                            </>
                        )}
                        {canShowNotes && (
                            <TextField label="Other notes" multiline rows={3} value={notes} onChange={(_, v) => setNotes(v || '')} />
                        )}
                        <Stack horizontal tokens={{ childrenGap: 8 }}>
                            <PrimaryButton text="Submit" onClick={handleSubmit} disabled={!isValid() || submitting} styles={sharedPrimaryButtonStyles} />
                            <DefaultButton text="Cancel" onClick={onBack} styles={sharedDefaultButtonStyles} />
                        </Stack>
                    </Stack>
                </div>
            </div>
        </Stack>
    );
};

export default BundleForm;
