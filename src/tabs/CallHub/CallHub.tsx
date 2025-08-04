import React, { useState } from 'react';
import { Stack, TextField, PrimaryButton } from '@fluentui/react';
import '../../app/styles/MatterOpeningCard.css';

const CallHub: React.FC = () => {
    const [enquiryType, setEnquiryType] = useState<'new' | 'existing' | 'expert' | null>(null);
    const [contactPreference, setContactPreference] = useState<'email' | 'phone' | null>(null);
    const [email, setEmail] = useState('');
    const [contactPhone, setContactPhone] = useState('');
    const [countryCode, setCountryCode] = useState('+44');
    const [lookupPhone, setLookupPhone] = useState('');
    const [clientInfo, setClientInfo] = useState<{ name: string; email: string; matters: string[] } | null>(null);
    const [claimTime, setClaimTime] = useState<number | null>(null);
    const [contactTime, setContactTime] = useState<number | null>(null);

    const handleClaim = () => {
        setClaimTime(Date.now());
    };

    const handleContacted = () => {
        if (!claimTime) return;
        setContactTime(Date.now());
    };

    const formatDuration = (start: number, end: number) => {
        const ms = end - start;
        return `${(ms / 1000 / 60).toFixed(1)} mins`;
    };

    const missingEmail = contactPreference === 'phone' && !email;

    return (
        <div style={{ padding: 20 }}>
            <div className="matter-opening-card">
                <div className="step-header active">
                    <span className="step-title">Call Hub</span>
                </div>
                <div className="step-content active">
                    <Stack tokens={{ childrenGap: 20 }}>
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
                                    <PrimaryButton text="Lookup Client" onClick={() => setClientInfo({ name: 'Jane Doe', email: 'jane@example.com', matters: ['Matter A', 'Matter B'] })} />
                                </Stack>
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
                        </Stack>

                        {claimTime && <div>Claimed at {new Date(claimTime).toLocaleTimeString()}</div>}
                        {claimTime && contactTime && (
                            <div>Time to contact: {formatDuration(claimTime, contactTime)}</div>
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
