import React, { useState } from 'react';
import { Stack, TextField, PrimaryButton, MessageBar, MessageBarType } from '@fluentui/react';
import '../../app/styles/MatterOpeningCard.css';
import { sendCallEvent, lookupClient } from './callHubApi';
import { EnquiryType, ContactPreference, ClientInfo } from './types';

const CallHub: React.FC = () => {
    const [enquiryType, setEnquiryType] = useState<EnquiryType | null>(null);
    const [contactPreference, setContactPreference] = useState<ContactPreference | null>(null);
    const [email, setEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [callerName, setCallerName] = useState('');
    const [notes, setNotes] = useState('');
    const [countryCode, setCountryCode] = useState('+44');
    const [lookupPhone, setLookupPhone] = useState('');
    const [clientInfo, setClientInfo] = useState<ClientInfo | null>(null);
    const [lookupStatus, setLookupStatus] = useState<string | null>(null);
    const [claimTime, setClaimTime] = useState<number | null>(null);
    const [contactTime, setContactTime] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleClaim = async () => {
        const now = Date.now();
        setClaimTime(now);
        try {
            await sendCallEvent({ action: 'claim', enquiryType, contactPreference, claimTime: now });
        } catch (err) {
            console.error(err);
        }
    };

    const handleContacted = async () => {
        if (!claimTime) return;
        const now = Date.now();
        setContactTime(now);
        try {
            await sendCallEvent({
                action: 'contact',
                enquiryType,
                contactPreference,
                email,
                contactPhone,
                claimTime,
                contactTime: now,
            });
        } catch (err) {
            console.error(err);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setSaveError(null);
        setSaveSuccess(false);
        try {
            await sendCallEvent({
                action: 'save',
                enquiryType,
                contactPreference,
                email,
                contactPhone,
                callerName,
                notes,
                claimTime,
                contactTime,
            });
            setSaveSuccess(true);
        } catch (err: any) {
            setSaveError(err.message || 'Unable to save call');
        } finally {
            setSaving(false);
        }
    };

    const handleLookup = async () => {
        setLookupStatus(null);
        try {
            const info = await lookupClient(countryCode, lookupPhone);
            if (info) {
                setClientInfo(info);
            } else {
                setClientInfo(null);
                setLookupStatus('No client found');
            }
        } catch (err) {
            setLookupStatus('Lookup failed');
        }
    };

    const formatDuration = (start: number, end: number) => {
        const ms = end - start;
        return `${(ms / 1000 / 60).toFixed(1)} mins`;
    };

    const missingEmail = contactPreference === 'phone' && !email;
    const canSave = !!enquiryType && !!contactPreference && !missingEmail && !saving;

    return (
        <div style={{ padding: 20 }}>
            <div className="matter-opening-card">
                <div className="step-header active">
                    <span className="step-title">Call Hub</span>
                </div>
                <div className="step-content active">
                    <Stack tokens={{ childrenGap: 20 }}>
                        <TextField
                            label="Caller Name"
                            value={callerName}
                            onChange={(_, v) => setCallerName(v || '')}
                        />
                        <div className="client-type-selection">
                            <div
                                className={`client-type-icon-btn${enquiryType === 'new' ? ' active' : ''}`}
                                onClick={() => setEnquiryType('new')}
                            >
                                <span className="client-type-label">New Enquiry</span>
                            </div>
                            <div
                                className={`client-type-icon-btn${enquiryType === 'existing' ? ' active' : ''}`}
                                onClick={() => setEnquiryType('existing')}
                            >
                                <span className="client-type-label">Existing Client</span>
                            </div>
                            <div
                                className={`client-type-icon-btn${enquiryType === 'expert' ? ' active' : ''}`}
                                onClick={() => setEnquiryType('expert')}
                            >
                                <span className="client-type-label">Expert or Other</span>
                            </div>
                        </div>

                        <div className="client-type-selection">
                            <div
                                className={`client-type-icon-btn${contactPreference === 'email' ? ' active' : ''}`}
                                onClick={() => setContactPreference('email')}
                            >
                                <span className="client-type-label">Email</span>
                            </div>
                            <div
                                className={`client-type-icon-btn${contactPreference === 'phone' ? ' active' : ''}`}
                                onClick={() => setContactPreference('phone')}
                            >
                                <span className="client-type-label">Phone</span>
                            </div>
                        </div>

                        {contactPreference === 'email' && (
                            <TextField label="Email" value={email} onChange={(_, v) => setEmail(v || '')} required />
                        )}

                        {contactPreference === 'phone' && (
                            <>
                                <TextField label="Phone" value={contactPhone} onChange={(_, v) => setContactPhone(v || '')} />
                                <TextField label="Email" value={email} onChange={(_, v) => setEmail(v || '')} required />
                            </>
                        )}

                        {missingEmail && (
                            <div style={{ color: 'red' }}>Cannot proceed without an email address.</div>
                        )}

                        {enquiryType === 'existing' && (
                            <Stack tokens={{ childrenGap: 8 }}>
                                <Stack horizontal tokens={{ childrenGap: 8 }}>
                                    <TextField
                                        label="Code"
                                        value={countryCode}
                                        onChange={(_, v) => setCountryCode(v || '')}
                                        styles={{ root: { maxWidth: 90 } }}
                                    />
                                    <TextField
                                        label="Phone Number"
                                        value={lookupPhone}
                                        onChange={(_, v) => setLookupPhone(v || '')}
                                    />
                                    <PrimaryButton text="Lookup Client" onClick={handleLookup} />
                                </Stack>
                                {lookupStatus && (
                                    <MessageBar messageBarType={MessageBarType.warning}>{lookupStatus}</MessageBar>
                                )}
                                {clientInfo && (
                                    <div>
                                        <div>
                                            <strong>Point of Contact:</strong> {clientInfo.name} ({clientInfo.email})
                                        </div>
                                        <div>
                                            <strong>Matters</strong>
                                            <ul>
                                                {clientInfo.matters.map(m => (
                                                    <li key={m}>{m}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </div>
                                )}
                            </Stack>
                        )}

                        <TextField
                            label="Notes"
                            multiline
                            value={notes}
                            onChange={(_, v) => setNotes(v || '')}
                        />

                        {enquiryType && enquiryType !== 'expert' && (
                            <div>
                                <strong>Contact Options</strong>
                                <ul>
                                    <li>Email – ~1hr response</li>
                                    <li>WhatsApp – ~1hr response</li>
                                    <li>Calendly – schedule a call</li>
                                    <li>Voicemail – we will return your call</li>
                                </ul>
                            </div>
                        )}

                        <Stack horizontal tokens={{ childrenGap: 10 }}>
                            <PrimaryButton text="Claim Enquiry" onClick={handleClaim} disabled={!!claimTime} />
                            <PrimaryButton text="Mark Contacted" onClick={handleContacted} disabled={!claimTime || !!contactTime} />
                            <PrimaryButton text="Save Call" onClick={handleSave} disabled={!canSave} />
                        </Stack>

                        {claimTime && <div>Claimed at {new Date(claimTime).toLocaleTimeString()}</div>}
                        {claimTime && contactTime && (
                            <div>Time to contact: {formatDuration(claimTime, contactTime)}</div>
                        )}
                        {saveSuccess && (
                            <MessageBar messageBarType={MessageBarType.success} onDismiss={() => setSaveSuccess(false)}>
                                Call saved
                            </MessageBar>
                        )}
                        {saveError && (
                            <MessageBar messageBarType={MessageBarType.error} onDismiss={() => setSaveError(null)}>
                                {saveError}
                            </MessageBar>
                        )}
                    </Stack>
                </div>
            </div>
            <style>{`
          .client-type-selection {
            display: flex;
            gap: 8px;
          }
          .client-type-icon-btn {
            flex: 1;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 14.4px 8px;
            border: 1px solid #e0e0e0;
            background: #f8f8f8;
            cursor: pointer;
            transition: all 0.2s ease;
          }
          .client-type-icon-btn .client-type-label {
            pointer-events: none;
          }
          .client-type-icon-btn:not(.active):hover {
            background: #e3f0fc;
            border-color: #3690CE;
          }
          .client-type-icon-btn.active {
            background: #e3f0fc;
            border-color: #3690CE;
            color: #3690CE;
            font-weight: 600;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
        `}</style>
        </div>
    );
};

export default CallHub;
