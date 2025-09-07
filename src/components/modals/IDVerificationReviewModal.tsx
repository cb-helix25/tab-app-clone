import React, { useState } from 'react';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import { FaTimes, FaCheck, FaExclamationTriangle, FaSpinner } from 'react-icons/fa';

interface IDVerificationDetails {
  instructionRef: string;
  clientName: string;
  clientEmail: string;
  overallResult: string;
  pepResult: string;
  addressResult: string;
  failureReasons: Array<{
    check: string;
    reason: string;
    code: string;
  }>;
  checkedDate: string;
}

interface IDVerificationReviewModalProps {
  isVisible: boolean;
  details: IDVerificationDetails | null;
  onClose: () => void;
  onApprove: (instructionRef: string) => Promise<void>;
}

const IDVerificationReviewModal: React.FC<IDVerificationReviewModalProps> = ({
  isVisible,
  details,
  onClose,
  onApprove
}) => {
  const { isDarkMode } = useTheme();
  const [isApproving, setIsApproving] = useState(false);

  if (!isVisible || !details) return null;

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await onApprove(details.instructionRef);
      onClose();
    } catch (error) {
      console.error('Failed to approve ID verification:', error);
    } finally {
      setIsApproving(false);
    }
  };

  const getResultIcon = (result: string) => {
    if (result?.toLowerCase() === 'passed') {
      return <FaCheck style={{ color: colours.green }} />;
    } else if (result?.toLowerCase() === 'review') {
      return <FaExclamationTriangle style={{ color: colours.orange }} />;
    }
    return <FaExclamationTriangle style={{ color: colours.red }} />;
  };

  const getResultColor = (result: string) => {
    if (result?.toLowerCase() === 'passed') return colours.green;
    if (result?.toLowerCase() === 'review') return colours.orange;
    return colours.red;
  };

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
      padding: '20px'
    }}>
      <div style={{
        backgroundColor: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '600px',
        width: '100%',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: isDarkMode 
          ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
          : '0 8px 32px rgba(0, 0, 0, 0.15)',
        position: 'relative'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`
        }}>
          <div>
            <h2 style={{
              margin: 0,
              color: isDarkMode ? colours.dark.text : colours.light.text,
              fontSize: '18px',
              fontWeight: '600'
            }}>
              ID Verification Review
            </h2>
            <p style={{
              margin: '4px 0 0',
              color: isDarkMode ? colours.dark.subText : colours.light.subText,
              fontSize: '14px'
            }}>
              {details.instructionRef} • {details.clientName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: isDarkMode ? colours.dark.subText : colours.light.subText,
              fontSize: '18px',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px'
            }}
          >
            <FaTimes />
          </button>
        </div>

        {/* Verification Results */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{
            color: isDarkMode ? colours.dark.text : colours.light.text,
            fontSize: '16px',
            marginBottom: '16px',
            fontWeight: '600'
          }}>
            Verification Results
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Overall Result */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              backgroundColor: isDarkMode ? colours.dark.cardBackground : colours.light.background,
              borderRadius: '8px',
              border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`
            }}>
              <div style={{ marginRight: '12px', fontSize: '16px' }}>
                {getResultIcon(details.overallResult)}
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{
                  color: isDarkMode ? colours.dark.text : colours.light.text,
                  fontSize: '14px'
                }}>
                  Overall Result
                </strong>
              </div>
              <div style={{
                color: getResultColor(details.overallResult),
                fontWeight: '600',
                fontSize: '14px'
              }}>
                {details.overallResult}
              </div>
            </div>

            {/* PEP & Sanctions Check */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              backgroundColor: isDarkMode ? colours.dark.cardBackground : colours.light.background,
              borderRadius: '8px',
              border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`
            }}>
              <div style={{ marginRight: '12px', fontSize: '16px' }}>
                {getResultIcon(details.pepResult)}
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{
                  color: isDarkMode ? colours.dark.text : colours.light.text,
                  fontSize: '14px'
                }}>
                  PEP & Sanctions Check
                </strong>
              </div>
              <div style={{
                color: getResultColor(details.pepResult),
                fontWeight: '600',
                fontSize: '14px'
              }}>
                {details.pepResult}
              </div>
            </div>

            {/* Address Verification */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px',
              backgroundColor: isDarkMode ? colours.dark.cardBackground : colours.light.background,
              borderRadius: '8px',
              border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`
            }}>
              <div style={{ marginRight: '12px', fontSize: '16px' }}>
                {getResultIcon(details.addressResult)}
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{
                  color: isDarkMode ? colours.dark.text : colours.light.text,
                  fontSize: '14px'
                }}>
                  Address Verification
                </strong>
              </div>
              <div style={{
                color: getResultColor(details.addressResult),
                fontWeight: '600',
                fontSize: '14px'
              }}>
                {details.addressResult}
              </div>
            </div>
          </div>
        </div>

        {/* Failure Reasons */}
        {details.failureReasons.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{
              color: isDarkMode ? colours.dark.text : colours.light.text,
              fontSize: '16px',
              marginBottom: '16px',
              fontWeight: '600'
            }}>
              Issues Found
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {details.failureReasons.map((reason, index) => (
                <div key={index} style={{
                  padding: '12px',
                  backgroundColor: isDarkMode ? colours.dark.background : colours.light.background,
                  borderRadius: '8px',
                  border: `1px solid ${colours.orange}20`
                }}>
                  <div style={{
                    color: colours.orange,
                    fontWeight: '600',
                    fontSize: '13px',
                    marginBottom: '4px'
                  }}>
                    {reason.check}
                  </div>
                  <div style={{
                    color: isDarkMode ? colours.dark.subText : colours.light.subText,
                    fontSize: '12px'
                  }}>
                    {reason.reason} (Code: {reason.code})
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info Box */}
        <div style={{
          padding: '16px',
          backgroundColor: isDarkMode ? `${colours.blue}15` : `${colours.blue}10`,
          border: `1px solid ${colours.blue}30`,
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <p style={{
            margin: 0,
            color: isDarkMode ? colours.dark.text : colours.light.text,
            fontSize: '13px',
            lineHeight: '1.5'
          }}>
            <strong>Note:</strong> These verification issues are common and can result from recent relocation 
            or limited history at the current address. Approving will send an email to the client requesting 
            additional documents to complete the verification process.
          </p>
        </div>

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '12px',
          justifyContent: 'flex-end'
        }}>
          <button
            onClick={onClose}
            disabled={isApproving}
            style={{
              padding: '10px 20px',
              border: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
              backgroundColor: 'transparent',
              color: isDarkMode ? colours.dark.text : colours.light.text,
              borderRadius: '6px',
              fontSize: '14px',
              cursor: isApproving ? 'not-allowed' : 'pointer',
              opacity: isApproving ? 0.5 : 1
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleApprove}
            disabled={isApproving}
            style={{
              padding: '10px 20px',
              border: 'none',
              background: colours.green,
              color: 'white',
              borderRadius: '6px',
              fontSize: '14px',
              cursor: isApproving ? 'not-allowed' : 'pointer',
              opacity: isApproving ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {isApproving && <FaSpinner style={{ animation: 'spin 1s linear infinite' }} />}
            {isApproving ? 'Approving...' : 'Approve & Send Email'}
          </button>
        </div>

        {/* Date Info */}
        <div style={{
          marginTop: '16px',
          padding: '8px 0',
          borderTop: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
          fontSize: '12px',
          color: isDarkMode ? colours.dark.subText : colours.light.subText,
          textAlign: 'center'
        }}>
          Verified on {new Date(details.checkedDate).toLocaleDateString()} at {new Date(details.checkedDate).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default IDVerificationReviewModal;
