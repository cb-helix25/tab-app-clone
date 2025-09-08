import React, { useState } from 'react';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import { 
  MdClose, 
  MdCheckBox, 
  MdInfo, 
  MdError,
  MdMoreHoriz 
} from 'react-icons/md';

interface IDVerificationDetails {
  instructionRef: string;
  clientName: string;
  clientEmail: string;
  overallResult: string;
  pepResult: string;
  addressResult: string;
  rawResponse: string | any; // Raw Tiller API response
  checkedDate: string;
  documentsRequested?: boolean;
  documentsReceived?: boolean;
}

interface IDVerificationReviewModalProps {
  isVisible: boolean;
  details: IDVerificationDetails | null;
  onClose: () => void;
  onApprove: (instructionRef: string) => Promise<void>;
  onRequestDocuments?: (instructionRef: string) => Promise<void>; // New action
  onOverride?: (instructionRef: string) => Promise<void>; // New action
}

const IDVerificationReviewModal: React.FC<IDVerificationReviewModalProps> = ({
  isVisible,
  details,
  onClose,
  onApprove,
  onRequestDocuments,
  onOverride
}) => {
  const { isDarkMode } = useTheme();
  const [isProcessing, setIsProcessing] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  // Send email to request additional documents via server route
  const sendDocumentRequestEmail = async () => {
    if (!details?.instructionRef) {
      alert('No instruction reference available');
      return;
    }

    setEmailSending(true);
    
    try {
      console.log(`Sending document request for ${details.instructionRef}`);
      
      const response = await fetch(`/api/verify-id/${details.instructionRef}/request-documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send email');
      }

      const result = await response.json();
      console.log('Document request response:', result);

      // Update documents requested status
      if (onRequestDocuments) {
        await onRequestDocuments(details.instructionRef);
      }

      alert(`Document request email sent successfully to ${result.recipient}!`);
    } catch (error: any) {
      console.error('Email send error:', error);
      alert(`Failed to send email: ${error.message}`);
    } finally {
      setEmailSending(false);
    }
  };

  if (!isVisible || !details) return null;

  // Determine the current workflow state
  const getWorkflowState = () => {
    if (details.documentsReceived) return 'documents-received';
    if (details.documentsRequested) return 'documents-pending';
    return 'fresh-failure';
  };

  const workflowState = getWorkflowState();

  const handleAction = async (action: 'approve' | 'request' | 'override') => {
    setIsProcessing(true);
    try {
      switch (action) {
        case 'approve':
          await onApprove(details.instructionRef);
          break;
        case 'request':
          await sendDocumentRequestEmail();
          break;
        case 'override':
          if (onOverride) await onOverride(details.instructionRef);
          break;
      }
      onClose();
    } catch (error) {
      console.error(`Failed to ${action} ID verification:`, error);
    } finally {
      setIsProcessing(false);
    }
  };

  const getResultIcon = (result: string) => {
    const iconStyle = { 
      color: isDarkMode ? colours.dark.subText : colours.light.subText,
      fontSize: '16px'
    };
    
    if (result?.toLowerCase() === 'passed') {
      return <MdCheckBox style={iconStyle} />;
    } else if (result?.toLowerCase() === 'review') {
      return <MdInfo style={iconStyle} />;
    }
    return <MdError style={iconStyle} />;
  };

  const getResultColor = (result: string) => {
    if (result?.toLowerCase() === 'passed') return colours.green;
    if (result?.toLowerCase() === 'review') return colours.orange;
    return colours.red;
  };

  const getRecommendedAction = (details: IDVerificationDetails): string => {
    const rawResponse = parseRawResponse(details.rawResponse);
    
    // Check specific failure types from Tiller checkStatuses
    const hasPEPIssues = details.pepResult?.toLowerCase() === 'review' || details.pepResult?.toLowerCase() === 'fail';
    const hasAddressIssues = details.addressResult?.toLowerCase() === 'review' || details.addressResult?.toLowerCase() === 'fail';
    const hasOverallIssues = details.overallResult?.toLowerCase() === 'review' || details.overallResult?.toLowerCase() === 'fail';
    
    if (hasPEPIssues) {
      return 'PEP/Sanctions match detected - requires immediate manual review. Do not proceed without thorough investigation of the match.';
    }
    
    if (hasAddressIssues && hasOverallIssues) {
      return 'Multiple verification issues detected. Consider requesting utility bill, bank statement, or council tax document to verify both identity and address.';
    }
    
    if (hasAddressIssues) {
      return 'Address verification failed. Request recent utility bill, council tax statement, or bank statement showing current address.';
    }
    
    if (hasOverallIssues) {
      return 'Identity verification inconclusive. Request additional photo ID (passport, driving licence) or recent official correspondence.';
    }
    
    return 'Standard verification checks could not be completed. Consider requesting additional documentation or manual override if client is known to the firm.';
  };

  const parseRawResponse = (rawResponse: string | any) => {
    if (typeof rawResponse === 'string') {
      try {
        return JSON.parse(rawResponse);
      } catch {
        return null;
      }
    }
    return rawResponse;
  };

  const getCheckStatuses = (details: IDVerificationDetails) => {
    const rawResponse = parseRawResponse(details.rawResponse);
    return rawResponse?.checkStatuses || [];
  };

  const getCheckName = (checkTypeId: number): string => {
    switch (checkTypeId) {
      case 1: return 'Address Verification';
      case 2: return 'PEP & Sanctions Check';
      case 3: return 'Identity Verification';
      case 4: return 'Document Verification';
      default: return `Check Type ${checkTypeId}`;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px',
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: isDarkMode 
          ? 'linear-gradient(135deg, #2e2e2e 0%, #3a3a3a 100%)'
          : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '650px',
        width: '100%',
        maxHeight: '85vh',
        overflowY: 'auto',
        boxShadow: isDarkMode 
          ? '0 20px 40px rgba(0, 0, 0, 0.4), 0 4px 6px rgba(0, 0, 0, 0.3)' 
          : '0 20px 40px rgba(0, 0, 0, 0.15), 0 4px 6px rgba(0, 0, 0, 0.07)',
        position: 'relative',
        border: isDarkMode ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid rgba(0, 0, 0, 0.05)'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '28px',
          paddingBottom: '20px',
          borderBottom: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.06)'}`
        }}>
          <div>
            <h2 style={{
              margin: 0,
              color: isDarkMode ? colours.dark.text : colours.darkBlue,
              fontSize: '22px',
              fontWeight: '700',
              letterSpacing: '-0.5px'
            }}>
              ID Verification Review
            </h2>
            <p style={{
              margin: '6px 0 0',
              color: isDarkMode ? colours.dark.subText : colours.light.subText,
              fontSize: '15px',
              fontWeight: '500'
            }}>
              {details.instructionRef} • {details.clientName}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: isDarkMode
                ? 'linear-gradient(135deg, #3a3a3a 0%, #2e2e2e 100%)'
                : 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)'}`,
              color: isDarkMode ? colours.dark.subText : colours.light.subText,
              fontSize: '16px',
              cursor: 'pointer',
              padding: '10px',
              borderRadius: '8px',
              transition: 'all 0.2s ease',
              boxShadow: isDarkMode 
                ? '0 2px 4px rgba(0, 0, 0, 0.3)' 
                : '0 2px 4px rgba(0, 0, 0, 0.07)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-1px)';
              e.currentTarget.style.boxShadow = isDarkMode 
                ? '0 4px 8px rgba(0, 0, 0, 0.4)' 
                : '0 4px 8px rgba(0, 0, 0, 0.12)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = isDarkMode 
                ? '0 2px 4px rgba(0, 0, 0, 0.3)' 
                : '0 2px 4px rgba(0, 0, 0, 0.07)';
            }}
          >
            <MdClose />
          </button>
        </div>

        {/* Date Info */}
        <div style={{
          fontSize: '13px',
          color: isDarkMode ? colours.dark.subText : colours.light.subText,
          textAlign: 'center',
          fontWeight: '500',
          marginBottom: '20px',
          paddingBottom: '18px',
          borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px'
        }}>
          Verified on {new Date(details.checkedDate).toLocaleDateString('en-GB', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
          })} at {new Date(details.checkedDate).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
          })}
        </div>

        {/* Verification Results */}
        <div style={{ marginBottom: '28px' }}>
          <h3 style={{
            color: isDarkMode ? colours.dark.text : colours.light.text,
            fontSize: '18px',
            marginBottom: '18px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}>
            Verification Results
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Overall Result */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 18px',
              background: isDarkMode 
                ? 'linear-gradient(135deg, #3a3a3a 0%, #2e2e2e 100%)'
                : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
              borderRadius: '10px',
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
              boxShadow: isDarkMode 
                ? '0 2px 4px rgba(0, 0, 0, 0.3)' 
                : '0 2px 4px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ 
                marginRight: '14px', 
                fontSize: '18px',
                padding: '4px',
                borderRadius: '6px',
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
              }}>
                {getResultIcon(details.overallResult)}
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{
                  color: isDarkMode ? colours.dark.text : colours.light.text,
                  fontSize: '15px',
                  fontWeight: '600'
                }}>
                  Overall Result
                </strong>
              </div>
              <div style={{
                color: getResultColor(details.overallResult),
                fontWeight: '700',
                fontSize: '15px',
                padding: '4px 12px',
                borderRadius: '6px',
                backgroundColor: `${getResultColor(details.overallResult)}15`
              }}>
                {details.overallResult?.toUpperCase()}
              </div>
            </div>

            {/* PEP & Sanctions Check */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 18px',
              background: isDarkMode 
                ? 'linear-gradient(135deg, #3a3a3a 0%, #2e2e2e 100%)'
                : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
              borderRadius: '10px',
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
              boxShadow: isDarkMode 
                ? '0 2px 4px rgba(0, 0, 0, 0.3)' 
                : '0 2px 4px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ 
                marginRight: '14px', 
                fontSize: '18px',
                padding: '4px',
                borderRadius: '6px',
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
              }}>
                {getResultIcon(details.pepResult)}
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{
                  color: isDarkMode ? colours.dark.text : colours.light.text,
                  fontSize: '15px',
                  fontWeight: '600'
                }}>
                  PEP & Sanctions Check
                </strong>
              </div>
              <div style={{
                color: getResultColor(details.pepResult),
                fontWeight: '700',
                fontSize: '15px',
                padding: '4px 12px',
                borderRadius: '6px',
                backgroundColor: `${getResultColor(details.pepResult)}15`
              }}>
                {details.pepResult?.toUpperCase()}
              </div>
            </div>

            {/* Address Verification */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              padding: '16px 18px',
              background: isDarkMode 
                ? 'linear-gradient(135deg, #3a3a3a 0%, #2e2e2e 100%)'
                : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
              borderRadius: '10px',
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)'}`,
              boxShadow: isDarkMode 
                ? '0 2px 4px rgba(0, 0, 0, 0.3)' 
                : '0 2px 4px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.2s ease'
            }}>
              <div style={{ 
                marginRight: '14px', 
                fontSize: '18px',
                padding: '4px',
                borderRadius: '6px',
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)'
              }}>
                {getResultIcon(details.addressResult)}
              </div>
              <div style={{ flex: 1 }}>
                <strong style={{
                  color: isDarkMode ? colours.dark.text : colours.light.text,
                  fontSize: '15px',
                  fontWeight: '600'
                }}>
                  Address Verification
                </strong>
              </div>
              <div style={{
                color: getResultColor(details.addressResult),
                fontWeight: '700',
                fontSize: '15px',
                padding: '4px 12px',
                borderRadius: '6px',
                backgroundColor: `${getResultColor(details.addressResult)}15`
              }}>
                {details.addressResult?.toUpperCase()}
              </div>
            </div>
          </div>
        </div>

        {/* Document Request Info Box */}
        <div style={{
          marginBottom: '28px'
        }}>
          {workflowState === 'fresh-failure' && (
            <div style={{
              padding: '20px',
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(54, 144, 206, 0.15) 0%, rgba(54, 144, 206, 0.08) 100%)'
                : 'linear-gradient(135deg, rgba(54, 144, 206, 0.08) 0%, rgba(54, 144, 206, 0.04) 100%)',
              border: `2px solid ${colours.blue}20`,
              borderRadius: '10px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                background: colours.blue
              }} />
              
              {/* Timeline */}
              <div style={{
                paddingLeft: '12px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px'
              }}>
                {/* Step 1: Current Status */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: `${colours.orange}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M8 1.5a6.5 6.5 0 100 13 6.5 6.5 0 000-13zM8 5a.75.75 0 01.75.75V8.5a.75.75 0 01-1.5 0V5.75A.75.75 0 018 5zm0 5.5a.75.75 0 100 1.5.75.75 0 000-1.5z" fill={colours.orange}/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      color: isDarkMode ? colours.dark.text : colours.light.text,
                      fontWeight: '600',
                      fontSize: '14px',
                      marginBottom: '2px'
                    }}>
                      ID Verification Failed
                    </div>
                    <div style={{
                      color: isDarkMode ? colours.dark.subText : colours.light.subText,
                      fontSize: '12px'
                    }}>
                      Checks resulted in 'Review' status
                    </div>
                  </div>
                  <div style={{
                    width: '2px',
                    height: '30px',
                    backgroundColor: isDarkMode ? colours.dark.border : colours.light.border,
                    position: 'absolute',
                    left: '47px',
                    marginTop: '32px',
                    opacity: 0.5
                  }} />
                </div>

                {/* Step 2: Email Request */}
                <div 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '14px',
                    cursor: 'pointer',
                    padding: '8px',
                    margin: '-8px',
                    borderRadius: '8px',
                    transition: 'all 0.2s ease',
                    background: 'transparent'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = isDarkMode 
                      ? 'rgba(54, 144, 206, 0.1)' 
                      : 'rgba(54, 144, 206, 0.05)';
                    e.currentTarget.style.transform = 'translateX(2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                  onClick={() => onRequestDocuments?.(details.instructionRef)}
                >
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: `${colours.blue}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.2s ease'
                  }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 4a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V4zm2-.5a.5.5 0 00-.5.5v.217l4.5 2.7 4.5-2.7V4a.5.5 0 00-.5-.5H4zm8.5 2.283L10 7.317 8 6.283 6 7.317 1.5 5.783V12a.5.5 0 00.5.5h8a.5.5 0 00.5-.5V5.783z" fill={colours.blue}/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      color: isDarkMode ? colours.dark.text : colours.light.text,
                      fontWeight: '600',
                      fontSize: '14px',
                      marginBottom: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      Send Additional ID Request
                      <span style={{
                        fontSize: '11px',
                        color: colours.blue,
                        backgroundColor: isDarkMode ? 'rgba(54, 144, 206, 0.15)' : 'rgba(54, 144, 206, 0.1)',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        fontWeight: '500'
                      }}>
                        Click to Send
                      </span>
                    </div>
                    <div style={{
                      color: isDarkMode ? colours.dark.subText : colours.light.subText,
                      fontSize: '12px',
                      marginBottom: '6px'
                    }}>
                      Email client with secure upload link
                    </div>
                    <div style={{
                      fontSize: '10px',
                      fontFamily: 'monospace',
                      color: colours.blue,
                      backgroundColor: isDarkMode ? 'rgba(54, 144, 206, 0.1)' : 'rgba(54, 144, 206, 0.05)',
                      padding: '3px 6px',
                      borderRadius: '3px',
                      display: 'inline-block'
                    }}>
                      http://instruct.helix-law.com/pitch/20200/additional-id
                    </div>
                  </div>
                  <div style={{
                    width: '2px',
                    height: '30px',
                    backgroundColor: isDarkMode ? colours.dark.border : colours.light.border,
                    position: 'absolute',
                    left: '47px',
                    marginTop: '32px',
                    opacity: 0.5
                  }} />
                </div>

                {/* Step 3: Re-verification */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '6px',
                    backgroundColor: `${colours.green}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z" fill={colours.green}/>
                    </svg>
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      color: isDarkMode ? colours.dark.text : colours.light.text,
                      fontWeight: '600',
                      fontSize: '14px',
                      marginBottom: '2px'
                    }}>
                      Re-verify with Tiller
                    </div>
                    <div style={{
                      color: isDarkMode ? colours.dark.subText : colours.light.subText,
                      fontSize: '12px'
                    }}>
                      Update status to 'Passed' or 'Review'
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {workflowState === 'documents-pending' && (
            <div style={{
              padding: '18px 20px',
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(255, 140, 0, 0.15) 0%, rgba(255, 140, 0, 0.08) 100%)'
                : 'linear-gradient(135deg, rgba(255, 140, 0, 0.08) 0%, rgba(255, 140, 0, 0.04) 100%)',
              border: `2px solid ${colours.orange}20`,
              borderRadius: '10px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                background: colours.orange
              }} />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                paddingLeft: '12px'
              }}>
                <div style={{
                  fontSize: '20px',
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: `${colours.orange}20`,
                  color: colours.orange
                }}>
                  ⏳
                </div>
                <div>
                  <div style={{
                    color: isDarkMode ? colours.dark.text : colours.light.text,
                    fontWeight: '700',
                    fontSize: '15px',
                    marginBottom: '4px'
                  }}>
                    Awaiting Client Response
                  </div>
                  <div style={{
                    color: isDarkMode ? colours.dark.subText : colours.light.subText,
                    fontSize: '13px'
                  }}>
                    Additional documents have been requested
                  </div>
                </div>
              </div>
            </div>
          )}

          {workflowState === 'documents-received' && (
            <div style={{
              padding: '18px 20px',
              background: isDarkMode 
                ? 'linear-gradient(135deg, rgba(32, 178, 108, 0.15) 0%, rgba(32, 178, 108, 0.08) 100%)'
                : 'linear-gradient(135deg, rgba(32, 178, 108, 0.08) 0%, rgba(32, 178, 108, 0.04) 100%)',
              border: `2px solid ${colours.green}20`,
              borderRadius: '10px',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '4px',
                height: '100%',
                background: colours.green
              }} />
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                paddingLeft: '12px'
              }}>
                <div style={{
                  fontSize: '20px',
                  padding: '8px',
                  borderRadius: '8px',
                  backgroundColor: `${colours.green}20`,
                  color: colours.green
                }}>
                  📋
                </div>
                <div>
                  <div style={{
                    color: isDarkMode ? colours.dark.text : colours.light.text,
                    fontWeight: '700',
                    fontSize: '15px',
                    marginBottom: '4px'
                  }}>
                    Documents Received
                  </div>
                  <div style={{
                    color: isDarkMode ? colours.dark.subText : colours.light.subText,
                    fontSize: '13px'
                  }}>
                    Review and approve if verification concerns are resolved
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Issues Found - Show actual Tiller check failures */}
        {(details.overallResult?.toLowerCase() === 'review' || 
          details.pepResult?.toLowerCase() === 'review' || 
          details.addressResult?.toLowerCase() === 'review') && (
          <div style={{ marginBottom: '28px' }}>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {getCheckStatuses(details).map((checkStatus: any, index: number) => {
                if (checkStatus.result?.result?.toLowerCase() !== 'review' && checkStatus.result?.result?.toLowerCase() !== 'fail') {
                  return null;
                }
                
                const checkName = getCheckName(checkStatus.checkTypeId);
                const resultCode = checkStatus.result?.resultCode || 'UNKNOWN';
                const resultReason = checkStatus.result?.reason || checkStatus.sourceResults?.reason || 'Check requires manual review';
                
                return (
                  <div key={index} style={{
                    padding: '16px 18px',
                    background: isDarkMode 
                      ? 'linear-gradient(135deg, #3a2a1a 0%, #2e1e0e 100%)'
                      : 'linear-gradient(135deg, #FFF8E1 0%, #FFF3C4 100%)',
                    borderRadius: '10px',
                    border: `1px solid ${colours.orange}30`,
                    boxShadow: isDarkMode 
                      ? '0 2px 4px rgba(255, 140, 0, 0.2)' 
                      : '0 2px 4px rgba(255, 140, 0, 0.1)'
                  }}>
                    <div style={{
                      color: colours.orange,
                      fontWeight: '700',
                      fontSize: '14px',
                      marginBottom: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}>
                      <MdInfo style={{ 
                        fontSize: '14px', 
                        color: colours.orange 
                      }} />
                      {checkName}
                      <span style={{ 
                        fontSize: '12px',
                        fontFamily: 'monospace',
                        color: isDarkMode ? colours.dark.subText : colours.light.subText,
                        opacity: 0.7,
                        marginLeft: 'auto'
                      }}>[{resultCode}]</span>
                    </div>
                    <div style={{
                      color: isDarkMode ? colours.dark.subText : colours.light.subText,
                      fontSize: '13px',
                      lineHeight: '1.5',
                      marginBottom: '10px'
                    }}>
                      <strong>Issue:</strong> {resultReason}
                    </div>
                    
                    {/* Show detailed check information if available */}
                    {checkStatus.sourceResults && (
                      <div style={{
                        color: isDarkMode ? colours.dark.subText : colours.light.subText,
                        fontSize: '12px',
                        lineHeight: '1.4',
                        opacity: 0.8,
                        fontStyle: 'italic',
                        background: isDarkMode 
                          ? 'rgba(255, 255, 255, 0.05)'
                          : 'rgba(0, 0, 0, 0.03)',
                        padding: '8px 12px',
                        borderRadius: '6px',
                        marginTop: '6px'
                      }}>
                        <div><strong>Check Title:</strong> {checkStatus.sourceResults.title}</div>
                        {checkStatus.sourceResults.rule && <div><strong>Rule:</strong> {checkStatus.sourceResults.rule}</div>}
                        {checkStatus.sourceResults.source && <div><strong>Source:</strong> {checkStatus.sourceResults.source}</div>}
                      </div>
                    )}
                  </div>
                );
              })}
              
              {/* Show raw response for debugging if no structured issues found */}
              {getCheckStatuses(details).length === 0 && details.rawResponse && (
                <div style={{
                  padding: '16px 18px',
                  background: isDarkMode 
                    ? 'linear-gradient(135deg, #2a2a2a 0%, #1e1e1e 100%)'
                    : 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
                  borderRadius: '10px',
                  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                  <div style={{
                    color: isDarkMode ? colours.dark.text : colours.darkBlue,
                    fontWeight: '600',
                    fontSize: '14px',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}>
                    Electronic ID Check Response
                    <span style={{
                      fontSize: '11px',
                      color: isDarkMode ? colours.dark.subText : colours.light.subText,
                      fontWeight: '400',
                      opacity: 0.7
                    }}>
                      • Kept for transparency and debugging
                    </span>
                  </div>
                  
                  <details style={{
                    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)',
                    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                    borderRadius: '6px',
                    padding: '0'
                  }}>
                    <summary style={{
                      cursor: 'pointer',
                      padding: '12px 16px',
                      color: colours.blue,
                      fontSize: '13px',
                      fontWeight: '600',
                      borderRadius: '6px',
                      transition: 'all 0.2s ease',
                      userSelect: 'none'
                    }}>
                      View Technical Details & Database Records
                      <span style={{
                        fontSize: '11px',
                        fontWeight: '400',
                        marginLeft: '8px',
                        opacity: 0.7
                      }}>
                        (Correlation ID, Check Results, Source Data)
                      </span>
                    </summary>
                    
                    <div style={{
                      padding: '16px',
                      paddingTop: '8px',
                      borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
                    }}>
                      <div style={{
                        display: 'flex',
                        gap: '12px',
                        marginBottom: '16px',
                        flexWrap: 'wrap'
                      }}>
                        <button
                          onClick={() => document.getElementById('checkStatuses')?.scrollIntoView({ behavior: 'smooth' })}
                          style={{
                            padding: '6px 12px',
                            border: `1px solid ${colours.blue}`,
                            background: 'transparent',
                            color: colours.blue,
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = `${colours.blue}10`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          Jump to Check Statuses
                        </button>
                        <button
                          onClick={() => document.getElementById('sourceResults')?.scrollIntoView({ behavior: 'smooth' })}
                          style={{
                            padding: '6px 12px',
                            border: `1px solid ${colours.blue}`,
                            background: 'transparent',
                            color: colours.blue,
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = `${colours.blue}10`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          Jump to Source Results
                        </button>
                        <button
                          onClick={() => document.getElementById('rawJson')?.scrollIntoView({ behavior: 'smooth' })}
                          style={{
                            padding: '6px 12px',
                            border: `1px solid ${colours.blue}`,
                            background: 'transparent',
                            color: colours.blue,
                            borderRadius: '4px',
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontWeight: '500',
                            transition: 'all 0.2s ease'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = `${colours.blue}10`;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                        >
                          Jump to Raw Data
                        </button>
                      </div>
                      
                      <div style={{
                        color: isDarkMode ? colours.dark.subText : colours.light.subText,
                        fontSize: '12px',
                        lineHeight: '1.6'
                      }}>
                        {(() => {
                          const parsed = parseRawResponse(details.rawResponse);
                          const responseData = Array.isArray(parsed) ? parsed[0] : parsed;
                          
                          if (!responseData) return <div>No response data available</div>;
                          
                          const getResultColor = (result: string) => {
                            const r = result?.toLowerCase();
                            if (r === 'passed' || r === 'pass') return colours.green;
                            if (r === 'review') return colours.orange;
                            if (r === 'failed' || r === 'fail') return colours.red;
                            return 'inherit';
                          };
                          
                          return (
                            <div>
                              <div id="checkStatuses" style={{ marginBottom: '20px' }}>
                                <div style={{ 
                                  fontWeight: '600', 
                                  marginBottom: '12px', 
                                  color: colours.blue,
                                  fontSize: '14px',
                                  borderBottom: `1px solid ${colours.blue}20`,
                                  paddingBottom: '6px'
                                }}>
                                  Check Statuses & Database Records:
                                </div>
                                <div style={{ 
                                  backgroundColor: isDarkMode ? 'rgba(54, 144, 206, 0.08)' : 'rgba(54, 144, 206, 0.04)',
                                  padding: '12px',
                                  borderRadius: '6px',
                                  border: `1px solid ${colours.blue}20`
                                }}>
                                  <div>Overall Result: <strong style={{ color: getResultColor(responseData.overallResult?.result) }}>{responseData.overallResult?.result || 'N/A'}</strong></div>
                                  <div>Overall Status: <strong>{responseData.overallStatus?.status || 'N/A'}</strong></div>
                                  {responseData.correlationId && (
                                    <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: `1px solid ${colours.blue}20` }}>
                                      <div style={{ fontSize: '11px', fontWeight: '600', marginBottom: '4px' }}>Database Reference:</div>
                                      <div>Correlation ID: <code style={{ 
                                        fontSize: '10px', 
                                        background: isDarkMode ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.8)',
                                        padding: '2px 4px',
                                        borderRadius: '3px'
                                      }}>{responseData.correlationId}</code></div>
                                      {responseData.externalReferenceId && <div>External Reference: <strong>{responseData.externalReferenceId}</strong></div>}
                                      <div style={{ fontSize: '10px', opacity: 0.7, marginTop: '4px' }}>
                                        Use these IDs to reference this check in our database or with Tiller support
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div id="sourceResults" style={{ marginBottom: '20px' }}>
                                <div style={{ 
                                  fontWeight: '600', 
                                  marginBottom: '12px', 
                                  color: colours.blue,
                                  fontSize: '14px',
                                  borderBottom: `1px solid ${colours.blue}20`,
                                  paddingBottom: '6px'
                                }}>
                                  Individual Check Results:
                                </div>
                                {responseData.checkStatuses && responseData.checkStatuses.length > 0 ? (
                                  responseData.checkStatuses.map((check: any, index: number) => (
                                    <div key={index} style={{ marginBottom: '16px', paddingLeft: '12px', borderLeft: `3px solid ${getResultColor(check.result?.result)}`, backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.02)', padding: '12px', borderRadius: '6px' }}>
                                      <div style={{ marginBottom: '8px' }}>
                                        <strong>{check.sourceResults?.title || `Check ${index + 1}`}</strong>
                                        <div style={{ fontSize: '11px', color: isDarkMode ? colours.dark.subText : colours.light.subText }}>
                                          Type: {check.checkTypeId === 1 ? 'Address Verification' : check.checkTypeId === 2 ? 'PEP & Sanctions' : check.checkTypeId === 3 ? 'ID Verification' : `Type ${check.checkTypeId}`}
                                          {check.id && ` • ID: ${check.id}`}
                                        </div>
                                      </div>
                                      <div>Result: <strong style={{ color: getResultColor(check.result?.result) }}>{check.result?.result || 'N/A'}</strong></div>
                                      <div>Status: <strong>{check.status?.status || 'N/A'}</strong></div>
                                      {check.sourceResults?.date && <div>Date: {new Date(check.sourceResults.date).toLocaleString()}</div>}
                                      
                                      {check.resultCount && (
                                        <div style={{ marginTop: '8px', fontSize: '11px', opacity: 0.8, backgroundColor: isDarkMode ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.6)', padding: '6px', borderRadius: '4px' }}>
                                          <strong>Source Summary:</strong> {check.resultCount.totalSourcesChecked || 0} checked, {check.resultCount.totalSourcesPassed || 0} passed, {check.resultCount.totalSourcesForReview || 0} for review
                                        </div>
                                      )}
                                      
                                      {check.sourceResults?.results && check.sourceResults.results.length > 0 && (
                                        <details style={{ marginTop: '12px' }}>
                                          <summary style={{ cursor: 'pointer', color: colours.blue, fontSize: '11px', fontWeight: '600' }}>View detailed breakdown ({check.sourceResults.results.length} results)</summary>
                                          <div style={{ marginTop: '8px', paddingLeft: '12px' }}>
                                            {check.sourceResults.results.map((result: any, resultIndex: number) => (
                                              <div key={resultIndex} style={{ marginBottom: '8px', padding: '8px', backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.03)', borderRadius: '4px', border: `1px solid ${getResultColor(result.result)}30` }}>
                                                <div><strong>{result.title}</strong> - <span style={{ color: getResultColor(result.result) }}>{result.result}</span></div>
                                                <div style={{ fontSize: '11px', opacity: 0.8 }}>{result.description}</div>
                                                {result.detail?.reasons && result.detail.reasons.length > 0 && (
                                                  <div style={{ marginTop: '6px' }}>
                                                    {result.detail.reasons.map((reason: any, reasonIndex: number) => (
                                                      <div key={reasonIndex} style={{ fontSize: '10px', marginLeft: '8px', marginTop: '2px' }}>
                                                        • <strong>{reason.key || 'Detail'}:</strong> <span style={{ color: getResultColor(reason.result) }}>{reason.result}</span>
                                                        {reason.reason && <div style={{ marginLeft: '12px', opacity: 0.7, fontStyle: 'italic' }}>{reason.reason} {reason.code && `(Code: ${reason.code})`}</div>}
                                                      </div>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            ))}
                                          </div>
                                        </details>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <div>No check details available</div>
                                )}
                              </div>
                              
                              <div id="rawJson">
                                <div style={{ 
                                  fontWeight: '600', 
                                  marginBottom: '12px', 
                                  color: colours.blue,
                                  fontSize: '14px',
                                  borderBottom: `1px solid ${colours.blue}20`,
                                  paddingBottom: '6px'
                                }}>
                                  Raw Response Data:
                                </div>
                                <div style={{
                                  fontSize: '11px',
                                  marginBottom: '8px',
                                  padding: '8px',
                                  backgroundColor: isDarkMode ? 'rgba(255, 140, 0, 0.1)' : 'rgba(255, 140, 0, 0.05)',
                                  border: `1px solid ${colours.orange}30`,
                                  borderRadius: '4px',
                                  color: isDarkMode ? colours.dark.subText : colours.light.subText
                                }}>
                                  <strong>Note:</strong> This raw JSON data matches what's stored in our database. Since this ID verification system is new, this data helps with understanding how the checks work and troubleshooting any issues.
                                </div>
                                <pre style={{
                                  fontSize: '10px',
                                  lineHeight: '1.3',
                                  fontFamily: 'monospace',
                                  backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)',
                                  padding: '12px',
                                  borderRadius: '4px',
                                  overflow: 'auto',
                                  maxHeight: '300px',
                                  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`
                                }}>
                                  {JSON.stringify(parsed, null, 2)}
                                </pre>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </details>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{
          display: 'flex',
          gap: '14px',
          justifyContent: 'flex-end',
          flexWrap: 'wrap'
        }}>
          {/* Conditional buttons based on workflow state */}
          {workflowState === 'fresh-failure' && (
            <>
              {onOverride && (
                <button
                  onClick={() => handleAction('override')}
                  disabled={isProcessing}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    background: `linear-gradient(135deg, ${colours.orange} 0%, #cc7000 100%)`,
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    opacity: isProcessing ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 6px rgba(255, 140, 0, 0.3)'
                  }}
                >
                  {isProcessing && <MdMoreHoriz style={{ animation: 'pulse 1.5s infinite' }} />}
                  Override
                </button>
              )}
              {onRequestDocuments && (
                <button
                  onClick={sendDocumentRequestEmail}
                  disabled={isProcessing || emailSending}
                  style={{
                    padding: '12px 24px',
                    border: 'none',
                    background: `linear-gradient(135deg, ${colours.blue} 0%, #2570a8 100%)`,
                    color: 'white',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: '700',
                    cursor: (isProcessing || emailSending) ? 'not-allowed' : 'pointer',
                    opacity: (isProcessing || emailSending) ? 0.7 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    transition: 'all 0.2s ease',
                    boxShadow: '0 4px 6px rgba(54, 144, 206, 0.3)'
                  }}
                >
                  {emailSending && <MdMoreHoriz style={{ animation: 'pulse 1.5s infinite' }} />}
                  {emailSending ? 'Sending Email...' : 'Request Documents'}
                </button>
              )}
            </>
          )}

          {workflowState === 'documents-pending' && (
            <>
              <button
                onClick={onClose}
                style={{
                  padding: '12px 24px',
                  border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                  background: isDarkMode
                    ? 'linear-gradient(135deg, #3a3a3a 0%, #2e2e2e 100%)'
                    : 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
                  color: isDarkMode ? colours.dark.text : colours.light.text,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isDarkMode 
                    ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
                    : '0 4px 6px rgba(0, 0, 0, 0.07)'
                }}
              >
                Cancel
              </button>
              <div style={{
                padding: '12px 24px',
                background: isDarkMode
                  ? 'linear-gradient(135deg, #3a3a3a 0%, #2e2e2e 100%)'
                  : 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: '600',
                color: colours.orange,
                border: `2px solid ${colours.orange}40`
              }}>
                Documents Requested - Awaiting Client Response
              </div>
            </>
          )}

          {workflowState === 'documents-received' && (
            <>
              <button
                onClick={onClose}
                style={{
                  padding: '12px 24px',
                  border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
                  background: isDarkMode
                    ? 'linear-gradient(135deg, #3a3a3a 0%, #2e2e2e 100%)'
                    : 'linear-gradient(135deg, #F8FAFC 0%, #E2E8F0 100%)',
                  color: isDarkMode ? colours.dark.text : colours.light.text,
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: isDarkMode 
                    ? '0 4px 6px rgba(0, 0, 0, 0.3)' 
                    : '0 4px 6px rgba(0, 0, 0, 0.07)'
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction('approve')}
                disabled={isProcessing}
                style={{
                  padding: '12px 24px',
                  border: 'none',
                  background: `linear-gradient(135deg, ${colours.green} 0%, #1a8c5a 100%)`,
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '700',
                  cursor: isProcessing ? 'not-allowed' : 'pointer',
                  opacity: isProcessing ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 6px rgba(32, 178, 108, 0.3)'
                }}
                onMouseEnter={(e) => {
                  if (!isProcessing) {
                    e.currentTarget.style.transform = 'translateY(-1px)';
                    e.currentTarget.style.boxShadow = '0 6px 12px rgba(32, 178, 108, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 6px rgba(32, 178, 108, 0.3)';
                }}
              >
                {isProcessing && <MdMoreHoriz style={{ animation: 'pulse 1.5s infinite' }} />}
                {isProcessing ? 'Processing...' : 'Approve Documents'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default IDVerificationReviewModal;
export {};
