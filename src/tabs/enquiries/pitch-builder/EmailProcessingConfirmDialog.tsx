/**
 * Development Email Processing Confirmation Dialog (minimal)
 *
 * Dev-only selector between V1 (production) and V2 (experimental).
 * In production, auto-confirms V1 and renders nothing.
 */

import React, { useEffect, useRef, useState } from 'react';
import { colours } from '../../../app/styles/colours';

interface EmailProcessingConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (useV2: boolean) => void;
  action: 'send' | 'draft';
  isDarkMode?: boolean;
}

const EmailProcessingConfirmDialog: React.FC<EmailProcessingConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  action,
  isDarkMode = false
}) => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const [selected, setSelected] = useState<'v1' | 'v2'>('v1');
  const autoConfirmedRef = useRef(false);

  // Auto-confirm in production (once per open)
  useEffect(() => {
    if (isOpen && !isDevelopment && !autoConfirmedRef.current) {
      autoConfirmedRef.current = true;
      onConfirm(false);
    }
    if (!isOpen) {
      autoConfirmedRef.current = false;
    }
  }, [isOpen, isDevelopment, onConfirm]);

  // Keyboard handling when open in development
  useEffect(() => {
    if (!isOpen || !isDevelopment) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'Enter') onConfirm(selected === 'v2');
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [isOpen, isDevelopment, onClose, onConfirm, selected]);

  if (!isOpen) return null;
  // In production, UI is suppressed; effect above handles confirmation
  if (!isDevelopment) return null;

  const actionText = action === 'send' ? 'Send Email' : 'Draft Email';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        backgroundColor: isDarkMode ? '#1F2937' : '#FFFFFF',
        borderRadius: 12,
        padding: 20,
        maxWidth: 520,
        width: '92%',
        boxShadow: '0 12px 24px rgba(0,0,0,0.25)',
        border: `1px solid ${isDarkMode ? '#374151' : '#E5E7EB'}`
      }}>
        {/* Header */}
        <div style={{ marginBottom: 12 }}>
          <h3 style={{
            margin: 0,
            fontSize: 18,
            fontWeight: 700,
            color: isDarkMode ? '#F9FAFB' : '#111827'
          }}>
            {actionText}: Processing Method
          </h3>
          <p style={{
            margin: '6px 0 0 0',
            color: isDarkMode ? '#94A3B8' : '#6B7280',
            fontSize: 13
          }}>
            Dev-only selection. Production uses V1 automatically.
          </p>
        </div>

        {/* Options (radio) */}
        <div role="radiogroup" aria-label="Email processing method" style={{
          display: 'grid',
          gap: 10,
          marginTop: 12,
          marginBottom: 16
        }}>
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: 10,
            border: `1px solid ${selected === 'v1' 
              ? (isDarkMode ? colours.dark.highlight : colours.highlight)
              : (isDarkMode ? colours.dark.border : colours.light.border)}`,
            borderRadius: 8,
            background: isDarkMode ? '#111827' : '#FFFFFF',
            cursor: 'pointer'
          }}>
            <input
              type="radio"
              name="email-processing"
              checked={selected === 'v1'}
              onChange={() => setSelected('v1')}
              style={{ marginTop: 2 }}
            />
            <div>
              <div style={{ fontWeight: 600, color: isDarkMode ? '#E5E7EB' : '#111827' }}>Use V1 (Production)</div>
              <div style={{ fontSize: 12, color: isDarkMode ? '#94A3B8' : '#6B7280' }}>Stable, current production method</div>
            </div>
          </label>
          <label style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: 10,
            border: `1px solid ${selected === 'v2' 
              ? (isDarkMode ? colours.dark.highlight : colours.highlight)
              : (isDarkMode ? colours.dark.border : colours.light.border)}`,
            borderRadius: 8,
            background: isDarkMode ? '#111827' : '#FFFFFF',
            cursor: 'pointer'
          }}>
            <input
              type="radio"
              name="email-processing"
              checked={selected === 'v2'}
              onChange={() => setSelected('v2')}
              style={{ marginTop: 2 }}
            />
            <div>
              <div style={{ fontWeight: 600, color: isDarkMode ? '#E5E7EB' : '#111827' }}>Use V2 (Experimental)</div>
              <div style={{ fontSize: 12, color: isDarkMode ? '#94A3B8' : '#6B7280' }}>Improved formatting under active test</div>
            </div>
          </label>
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
              background: 'transparent',
              color: isDarkMode ? colours.dark.text : colours.light.text,
              cursor: 'pointer',
              fontSize: 14
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(selected === 'v2')}
            style={{
              padding: '8px 14px',
              borderRadius: 6,
              border: 'none',
              background: isDarkMode ? colours.dark.buttonBackground : colours.light.buttonBackground,
              color: '#FFFFFF',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600
            }}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmailProcessingConfirmDialog;