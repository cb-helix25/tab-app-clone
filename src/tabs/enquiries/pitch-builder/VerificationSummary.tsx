import React from 'react';
import { Enquiry } from '../../../app/functionality/types';
import { colours } from '../../../app/styles/colours';

/**
 * A compact, theme-aware summary of the effective details used for substitutions in Pitch Builder.
 * Shows fee earner info (name, initials, role, rate), enquiry id, amount, passcode, and instruction link,
 * plus a small indicator of the data source (server route vs default).
 */
export interface VerificationSummaryProps {
  isDarkMode: boolean;
  /** Effective user data array (first element used). */
  userData: ReadonlyArray<Record<string, unknown>> | null | undefined;
  enquiry: Enquiry;
  /** Amount as string or number, formatted to £ on render. */
  amount?: string | number;
  passcode?: string;
  /** True if the /api/pitch-team route supplied data; false if using default userData. */
  usedPitchRoute: boolean;
  /** Trigger a client preview panel/drawer in parent with computed link */
  onPreview?: (link: string) => void;
}

function formatPounds(value: string | number | undefined): string {
  if (value === undefined || value === null || value === '') return '—';
  const num = Number(value);
  if (Number.isNaN(num)) return '—';
  const withDecimals = num.toLocaleString('en-GB', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `£${withDecimals.replace(/\.00$/, '')}`;
}

function buildInstructionLink(passcode?: string): string {
  // Match emailUtils: prefer build-time injected env, fall back to production URL
  const baseUrl = process.env.REACT_APP_INSTRUCTIONS_URL || 'https://instruct.helix-law.com';
  return passcode ? `${baseUrl}/pitch/${passcode}` : `${baseUrl}/pitch`;
}

export const VerificationSummary: React.FC<VerificationSummaryProps> = ({
  isDarkMode,
  userData,
  enquiry,
  amount,
  passcode,
  usedPitchRoute,
  onPreview,
}) => {
  // Inject minimal styles once (flip + subtle pulse)
  if (typeof window !== 'undefined' && !document.getElementById('verification-summary-style')) {
    const style = document.createElement('style');
    style.id = 'verification-summary-style';
    style.innerHTML = `
      @keyframes vs-flip-in { from { transform: rotateY(90deg); opacity: 0; } to { transform: rotateY(0); opacity: 1; } }
      @keyframes vs-pulse { 0% { box-shadow: 0 0 0 0 rgba(22,163,74,0.35); } 70% { box-shadow: 0 0 0 8px rgba(22,163,74,0); } 100% { box-shadow: 0 0 0 0 rgba(22,163,74,0); } }
      .vs-flip { animation: vs-flip-in 420ms ease both; transform-style: preserve-3d; }
      .vs-pulse { animation: vs-pulse 900ms ease-out 1; }
      .vs-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 12px; }
      @media (max-width: 680px) { .vs-grid { grid-template-columns: 1fr; } }
      .vs-columns { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px 16px; align-items: start; }
      @media (max-width: 680px) { .vs-columns { grid-template-columns: 1fr; } }
      .vs-prospect-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px 12px; }
      @media (max-width: 680px) { .vs-prospect-grid { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);
  }

  // Detect transition to live and trigger flip
  const prevUsedRef = React.useRef<boolean>(usedPitchRoute);
  const [flipNow, setFlipNow] = React.useState<boolean>(false);
  React.useEffect(() => {
    if (!prevUsedRef.current && usedPitchRoute) {
      setFlipNow(true);
      const t = setTimeout(() => setFlipNow(false), 700);
      return () => clearTimeout(t);
    }
    prevUsedRef.current = usedPitchRoute;
  }, [usedPitchRoute]);

  const u = (userData && userData[0]) ? userData[0] : {};
  const initials = String((u as any)?.Initials ?? '').toUpperCase();
  const fullName = String((u as any)['Full Name'] ?? `${(u as any)?.First ?? ''} ${(u as any)?.Last ?? ''}`.trim());
  const role = String((u as any)?.Role ?? '');
  const rateRaw = (u as any)?.Rate as unknown;
  let rateVal: string | number | undefined;
  if (typeof rateRaw === 'number') rateVal = rateRaw;
  else if (typeof rateRaw === 'string' && rateRaw.trim() !== '') rateVal = rateRaw;
  else rateVal = undefined;
  const rateFmt = rateVal !== undefined
    ? `${formatPounds(rateVal)} + VAT`
    : '—';
  const amountFmt = formatPounds(amount);
  const enquiryId = String(enquiry?.ID ?? '—');
  const hasPasscode = !!(passcode && String(passcode).trim());
  const link = buildInstructionLink(passcode);

  // Inline styling (no outer container box)
  const text = isDarkMode ? colours.dark.text : '#0f172a';
  const subtle = isDarkMode ? '#9aa4af' : '#64748b';
  // const rowBorder = isDarkMode ? '#1f2937' : '#eef2f7';

  const buttonGradient = isDarkMode
    ? 'linear-gradient(135deg, #2b6cb0 0%, #2a4365 100%)'
    : 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)';
  const buttonShadow = isDarkMode ? 'none' : '0 4px 6px rgba(0,0,0,0.07)';

  const clientName = `${enquiry?.First_Name || ''} ${enquiry?.Last_Name || ''}`.trim() || 'Client';
  const clientEmail = enquiry?.Email || '';
  const clientPhone = enquiry?.Phone_Number || '';

  return (
    <div aria-label="Prefill data" style={{ display: 'flex', flexDirection: 'column', gap: 8, width: '100%' }}>

      {/* Two-column content: left Prefill, right Prospect */}
      <div className="vs-columns">
        {/* Left: Prospect details (under the name) */}
        <div>
          <div
            style={{
              background: isDarkMode
                ? 'linear-gradient(135deg, rgba(30,41,59,1) 0%, rgba(17,24,39,1) 100%)'
                : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
              border: `1px solid ${isDarkMode ? colours.dark.border : '#e2e8f0'}`,
              borderRadius: 8,
              boxShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.07)',
              padding: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                {/* Client icon */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="#3690CE" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="8" r="4" />
                  <rect x="4" y="15" width="16" height="6" rx="3" />
                </svg>
                {/* Name */}
                <div style={{ fontWeight: 600, fontSize: 14, color: text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {clientName}
                </div>
                <span style={{ color: subtle, fontSize: 12 }}>• Prospect</span>
              </div>
            </div>
            <div className="vs-prospect-grid">
              <KV label="Enquiry ID" value={enquiryId} text={text} subtle={subtle} />
              <KV label="Passcode" value={passcode || '—'} text={text} subtle={subtle} copyable mono />
            </div>
            {(clientEmail || clientPhone) && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                {clientEmail && (
                  <ContactChip label={clientEmail} kind="mail" subtle={subtle} isDarkMode={isDarkMode} />
                )}
                {clientPhone && (
                  <ContactChip label={clientPhone} kind="phone" subtle={subtle} isDarkMode={isDarkMode} />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Prefill data used in placeholders (container) */}
        <div>
          <div
            style={{
              background: isDarkMode
                ? 'linear-gradient(135deg, rgba(30,41,59,1) 0%, rgba(17,24,39,1) 100%)'
                : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
              border: `1px solid ${isDarkMode ? colours.dark.border : '#e2e8f0'}`,
              borderRadius: 8,
              boxShadow: isDarkMode ? '0 4px 6px rgba(0, 0, 0, 0.3)' : '0 4px 6px rgba(0, 0, 0, 0.07)',
              padding: 12
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ color: subtle, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="12" cy="12" r="10" stroke={subtle} strokeWidth="2" />
                  <path d="M12 7v10M7 12h10" stroke={subtle} strokeWidth="2" strokeLinecap="round" />
                </svg>
                Prefill data
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span
                  className={flipNow ? 'vs-flip vs-pulse' : undefined}
                  title={usedPitchRoute ? 'Team data via server route' : 'Default user data'}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: isDarkMode ? 'rgba(16,185,129,0.08)' : '#f1f5f9',
                    color: text,
                    fontSize: 12,
                    border: `1px solid ${isDarkMode ? '#0f766e' : '#e2e8f0'}`,
                    transformOrigin: 'right center'
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: 999, background: usedPitchRoute ? '#16a34a' : '#94a3b8' }} />
                  {usedPitchRoute ? 'Live data' : 'Default'}
                </span>
                <button
                  type="button"
                  onClick={() => onPreview?.(link)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 10px',
                    borderRadius: 8,
                    background: hasPasscode ? buttonGradient : (isDarkMode ? '#334155' : '#94a3b8'),
                    color: '#fff',
                    border: 'none',
                    fontSize: 12,
                    fontWeight: 600,
                    boxShadow: hasPasscode ? buttonShadow : 'none',
                    transform: 'translateY(0)',
                    transition: 'transform 0.15s ease',
                    opacity: hasPasscode ? 1 : 0.7,
                    cursor: hasPasscode ? 'pointer' : 'not-allowed'
                  }}
                  title={hasPasscode ? link : 'Generating passcode…'}
                  disabled={!hasPasscode}
                  onMouseEnter={(e) => { if (hasPasscode) (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; }}
                >
                  {hasPasscode ? 'Preview' : 'Preview'}
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5 12h14M13 5l7 7-7 7" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
            </div>
            <div className="vs-grid">
              <KV label="Fee earner" value={fullName || '—'} text={text} subtle={subtle} />
              <KV label="Initials" value={initials || '—'} text={text} subtle={subtle} />
              <KV label="Role" value={role || '—'} text={text} subtle={subtle} />
              <KV label="Rate" value={rateFmt} text={text} subtle={subtle} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContactChip: React.FC<{
  label: string;
  kind: 'mail' | 'phone';
  subtle: string;
  isDarkMode: boolean;
}> = ({ label, kind, subtle, isDarkMode }) => {
  const [copied, setCopied] = React.useState(false);
  const copy = () => {
    navigator.clipboard.writeText(label);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  const bg = isDarkMode ? 'rgba(255,255,255,0.06)' : '#eef2f7';
  const border = isDarkMode ? colours.dark.border : '#e2e8f0';
  const icon = kind === 'mail' ? (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 6h16v12H4z" stroke={subtle} strokeWidth="2"/>
      <path d="M4 6l8 6 8-6" stroke={subtle} strokeWidth="2"/>
    </svg>
  ) : (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.86 19.86 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.86 19.86 0 0 1 2.1 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.66 12.66 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.66 12.66 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke={subtle} strokeWidth="2"/>
    </svg>
  );
  return (
    <span
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '6px 10px', borderRadius: 8, background: bg,
        border: `1px solid ${border}`, fontSize: 12, color: isDarkMode ? colours.dark.text : '#0f172a'
      }}
      title={label}
    >
      {icon}
      <span style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      <button onClick={copy} aria-label={`Copy ${kind}`} title={copied ? 'Copied!' : 'Copy'}
        style={{ border: 'none', background: 'transparent', padding: 0, margin: 0, cursor: 'pointer', color: subtle }}>
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M20 6L9 17l-5-5" stroke={subtle} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="9" y="9" width="13" height="13" rx="2" stroke={subtle} strokeWidth="2"/>
            <rect x="2" y="2" width="13" height="13" rx="2" stroke={subtle} strokeWidth="2"/>
          </svg>
        )}
      </button>
    </span>
  );
};

const KV: React.FC<{
  label: string;
  value: string;
  text: string;
  subtle: string;
  copyable?: boolean;
  mono?: boolean;
}> = ({ label, value, text, subtle, copyable, mono }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = () => {
    if (!copyable || !value || value === '—') return;
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
      padding: '6px 8px',
      borderRadius: 8,
      background: 'transparent'
    }}>
      <div style={{ color: subtle, fontSize: 12 }}>{label}</div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: text, fontSize: 13, fontFamily: mono ? 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' : undefined }}>
          {value}
        </span>
        {copyable && (
          <button
            onClick={handleCopy}
            aria-label={`Copy ${label}`}
            title={copied ? 'Copied!' : `Copy ${label}`}
            style={{ border: 'none', background: 'transparent', padding: 0, margin: 0, cursor: 'pointer', color: subtle }}
          >
            {copied ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 6L9 17l-5-5" stroke={subtle} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="9" y="9" width="13" height="13" rx="2" stroke={subtle} strokeWidth="2"/>
                <rect x="2" y="2" width="13" height="13" rx="2" stroke={subtle} strokeWidth="2"/>
              </svg>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default VerificationSummary;
