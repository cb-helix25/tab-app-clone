import React, { useState, useEffect, useMemo } from 'react';
import { mergeStyles } from '@fluentui/merge-styles';
import { colours } from '../../app/styles/colours';

interface MatterOperationsProps {
  selectedInstruction: any;
  selectedOverviewItem: any;
  isDarkMode: boolean;
  onStatusUpdate?: () => void;
}

interface MatterData {
  matterId?: string;
  status: string;
  openDate?: string;
  displayNumber?: string;
  clientLinked: boolean;
  clientId?: string;
  description?: string;
  practiceArea?: string;
  responsibleSolicitor?: string;
  isLoading: boolean;
}

interface ClientData {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  type?: string;
  matters?: any[];
  isLoading: boolean;
}

const panelBackground = (dark: boolean): string => (
  dark
    ? 'linear-gradient(135deg, rgba(17, 24, 39, 0.94) 0%, rgba(15, 23, 42, 0.98) 100%)'
    : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)'
);

const cardBackground = (dark: boolean): string => (
  dark
    ? 'linear-gradient(135deg, rgba(30, 41, 59, 0.92) 0%, rgba(15, 23, 42, 0.96) 100%)'
    : '#FFFFFF'
);

const borderColour = (dark: boolean): string => (
  dark ? 'rgba(148, 163, 184, 0.32)' : '#e2e8f0'
);

const mutedText = (dark: boolean): string => (
  dark ? 'rgba(226, 232, 240, 0.72)' : colours.greyText
);

const elevatedShadow = (dark: boolean): string => (
  dark ? '0 8px 20px rgba(2, 6, 23, 0.45)' : '0 10px 24px rgba(15, 23, 42, 0.12)'
);

const MatterOperations: React.FC<MatterOperationsProps> = ({
  selectedInstruction,
  selectedOverviewItem,
  isDarkMode,
  onStatusUpdate
}) => {
  const [matterData, setMatterData] = useState<MatterData>({
    status: 'Not Created',
    clientLinked: false,
    isLoading: false
  });
  const [clientData, setClientData] = useState<ClientData>({
    isLoading: false
  });
  // Matter opening is handled by a dedicated workflow; creation UI removed here

  // Load matter data when instruction changes
  useEffect(() => {
    if (selectedInstruction?.InstructionRef) {
      loadMatterData();
      if (selectedInstruction.ClientId) {
        loadClientData();
      }
    }
  }, [selectedInstruction?.InstructionRef]);

  const loadMatterData = async () => {
    if (!selectedInstruction?.InstructionRef) return;
    
    setMatterData(prev => ({ ...prev, isLoading: true }));
    
    try {
      const response = await fetch(`/api/matter-operations/matter/${selectedInstruction.InstructionRef}`);
      if (response.ok) {
        const { matter } = await response.json();
        setMatterData({
          matterId: matter.MatterID,
          status: matter.Status || 'Open',
          openDate: matter.OpenDate,
          displayNumber: matter.DisplayNumber,
          clientLinked: !!matter.ClientID,
          clientId: matter.ClientID,
          description: matter.Description,
          practiceArea: matter.PracticeArea,
          responsibleSolicitor: matter.ResponsibleSolicitor,
          isLoading: false
        });
      } else if (response.status === 404) {
        // Matter doesn't exist yet
        setMatterData({
          status: 'Not Created',
          clientLinked: !!selectedInstruction.ClientId,
          clientId: selectedInstruction.ClientId,
          isLoading: false
        });
      } else {
        throw new Error('Failed to load matter data');
      }
    } catch (error) {
      console.error('Error loading matter data:', error);
      setMatterData(prev => ({ ...prev, isLoading: false }));
    }
  };

  const loadClientData = async () => {
    if (!selectedInstruction?.ClientId) return;
    
    setClientData(prev => ({ ...prev, isLoading: true }));
    
    try {
      // Get initials from responsible solicitor or default to 'LZ'
      const initials = selectedInstruction.ResponsibleSolicitor?.split(' ')
        .map((name: string) => name[0])
        .join('') || 'LZ';
      
      const response = await fetch(`/api/clio-client-query/${selectedInstruction.ClientId}/${initials}`);
      if (response.ok) {
        const data = await response.json();
        setClientData({
          id: data.client?.id?.toString(),
          name: data.client?.name,
          email: data.client?.primary_email_address,
          phone: data.client?.primary_phone_number,
          type: data.client?.type,
          matters: data.matters || [],
          isLoading: false
        });
      } else {
        throw new Error('Failed to load client data');
      }
    } catch (error) {
      console.error('Error loading client data:', error);
      setClientData({ isLoading: false });
    }
  };

  // Matter status logic
  const matterStatus = useMemo(() => {
    const neutral = isDarkMode ? colours.dark.text : '#374151';
    if (matterData.isLoading) return { label: 'Loading...', color: colours.greyText };
    if (matterData.matterId) return { label: 'Active Matter', color: neutral };
    if (selectedInstruction?.ClientId) return { label: 'Ready to Create', color: neutral };
    return { label: 'Client Required', color: neutral };
  }, [matterData, selectedInstruction, isDarkMode]);

  // Creation and client-linking are handled elsewhere

  const handleOpenMatterDashboard = () => {
    if (matterData.matterId) {
      const clioUrl = `https://eu.app.clio.com/nc/#/matters/${matterData.matterId}`;
      window.open(clioUrl, '_blank');
    }
  };

  const buttonStyle = (variant: 'primary' | 'secondary' | 'danger' = 'primary') => {
    const baseColors = {
      primary: { bg: colours.blue, hover: '#2563eb' },
      secondary: { bg: colours.orange, hover: '#ea580c' },
      danger: { bg: colours.red, hover: '#dc2626' }
    };
    
    const colors = baseColors[variant];
    
    return mergeStyles({
      padding: '8px 12px',
      borderRadius: 4,
      border: 'none',
      background: colors.bg,
      color: '#ffffff',
      cursor: 'pointer',
      fontSize: 11,
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      textTransform: 'uppercase',
      letterSpacing: '0.025em',
      transition: 'all 0.2s ease',
      ':hover': {
        background: colors.hover,
        transform: 'translateY(-1px)',
      },
      ':disabled': {
        opacity: 0.5,
        cursor: 'not-allowed',
        transform: 'none',
      }
    });
  };

  const cardStyle = mergeStyles({
    background: cardBackground(isDarkMode),
    borderRadius: '12px',
    padding: '16px',
    border: `1px solid ${borderColour(isDarkMode)}`,
    marginBottom: '12px',
    boxShadow: elevatedShadow(isDarkMode)
  });

  const headerStyle = mergeStyles({
    fontSize: '11px',
    fontWeight: 600,
    color: isDarkMode ? colours.dark.text : '#1f2937',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.025em',
    borderBottom: `1px solid ${borderColour(isDarkMode)}`,
    paddingBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  });

  const statusIndicator = (status: boolean, size: number = 6) => (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: status ? (isDarkMode ? colours.dark.text : '#6b7280') : colours.greyText,
      display: 'inline-block'
    }} />
  );

  if (!selectedInstruction) {
    return (
      <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          color: mutedText(isDarkMode),
          fontSize: '12px',
          background: panelBackground(isDarkMode),
          borderRadius: '12px',
          border: `1px dashed ${borderColour(isDarkMode)}`
      }}>
        Select an instruction to manage matter operations
      </div>
    );
  }

  return (
    <div>
      {/* Client Information Card */}
      <div className={cardStyle}>
        <div className={headerStyle}>
          <span>Client Information</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {statusIndicator(!!clientData.id)}
            <span style={{ 
              color: isDarkMode ? colours.dark.text : '#374151', 
              fontSize: 10, 
              fontWeight: 600,
              textTransform: 'uppercase'
            }}>
              {clientData.id ? 'Linked' : 'Not Linked'}
            </span>
          </div>
        </div>
        
        {clientData.isLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: colours.greyText }}>
            <div style={{ 
              width: 16, 
              height: 16, 
              border: `2px solid ${colours.greyText}30`,
              borderTop: `2px solid ${colours.greyText}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              display: 'inline-block'
            }} />
            <div style={{ marginTop: 8, fontSize: 11 }}>Loading client data...</div>
          </div>
        ) : clientData.id ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <div style={{ marginBottom: '6px' }}>
                <div style={{ fontSize: 9, color: mutedText(isDarkMode), marginBottom: 2 }}>CLIENT NAME</div>
                <div style={{ fontSize: 10, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                  {clientData.name || 'Unknown'}
                </div>
              </div>
              <div style={{ marginBottom: '6px' }}>
                <div style={{ fontSize: 9, color: mutedText(isDarkMode), marginBottom: 2 }}>EMAIL</div>
                <div style={{ fontSize: 10, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                  {clientData.email || 'Not provided'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: mutedText(isDarkMode), marginBottom: 2 }}>CLIENT TYPE</div>
                <div style={{ fontSize: 10, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                  {clientData.type || 'Individual'}
                </div>
              </div>
            </div>
            
            <div>
              <div style={{ marginBottom: '6px' }}>
                <div style={{ fontSize: 9, color: mutedText(isDarkMode), marginBottom: 2 }}>CLIO CLIENT ID</div>
                <div style={{ fontSize: 10, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                  {clientData.id}
                </div>
              </div>
              <div style={{ marginBottom: '6px' }}>
                <div style={{ fontSize: 9, color: mutedText(isDarkMode), marginBottom: 2 }}>PHONE</div>
                <div style={{ fontSize: 10, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                  {clientData.phone || 'Not provided'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: mutedText(isDarkMode), marginBottom: 2 }}>MATTERS COUNT</div>
                <div style={{ fontSize: 10, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                  {clientData.matters?.length || 0} matters
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            padding: '16px',
            textAlign: 'center',
            color: mutedText(isDarkMode),
            fontSize: '11px',
            background: panelBackground(isDarkMode),
            borderRadius: '12px',
            border: `1px dashed ${borderColour(isDarkMode)}`
          }}>
            No client linked to this instruction
          </div>
        )}

        {/* Client Matters List */}
        {clientData.matters && clientData.matters.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: 9, color: mutedText(isDarkMode), marginBottom: 6, textTransform: 'uppercase', fontWeight: 600 }}>
              Existing Matters ({clientData.matters.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '80px', overflowY: 'auto' }}>
              {clientData.matters.map((matter: any, index: number) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '6px 8px',
                  background: cardBackground(isDarkMode),
                  borderRadius: 8,
                  border: `1px solid ${borderColour(isDarkMode)}`,
                  fontSize: 9,
                  boxShadow: elevatedShadow(isDarkMode)
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: isDarkMode ? colours.dark.text : '#111827' }}>
                      {matter.display_number || `Matter ${matter.id}`}
                    </div>
                    <div style={{ color: mutedText(isDarkMode), fontSize: 8 }}>
                      {matter.description || 'No description'}
                    </div>
                  </div>
                  <div style={{ fontSize: 8, color: mutedText(isDarkMode) }}>
                    ID: {matter.id}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Matter Status Card */}
      <div className={cardStyle}>
        <div className={headerStyle}>
          <span>Matter Status</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {statusIndicator(!!matterData.matterId)}
            <span style={{ 
              color: matterStatus.color, 
              fontSize: 10, 
              fontWeight: 600,
              textTransform: 'uppercase'
            }}>
              {matterStatus.label}
            </span>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: 10, color: mutedText(isDarkMode), marginBottom: 2 }}>MATTER ID</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                {matterData.matterId || 'Not assigned'}
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: 10, color: mutedText(isDarkMode), marginBottom: 2 }}>DISPLAY NUMBER</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                {matterData.displayNumber || 'Will be auto-generated'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: mutedText(isDarkMode), marginBottom: 2 }}>PRACTICE AREA</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                {matterData.practiceArea || selectedInstruction.AreaOfWork || 'General Legal Services'}
              </div>
            </div>
          </div>
          
          <div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: 10, color: mutedText(isDarkMode), marginBottom: 2 }}>OPEN DATE</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                {matterData.openDate ? new Date(matterData.openDate).toLocaleDateString() : 'Not opened'}
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: 10, color: mutedText(isDarkMode), marginBottom: 2 }}>RESPONSIBLE SOLICITOR</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                {matterData.responsibleSolicitor || selectedInstruction.ResponsibleSolicitor || 'Unassigned'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: mutedText(isDarkMode), marginBottom: 2 }}>STATUS</div>
              <div style={{ 
                fontSize: 11, 
                fontWeight: 500, 
                color: isDarkMode ? colours.dark.text : '#111827' 
              }}>
                {matterData.status}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Card */}
      <div className={cardStyle}>
        <div className={headerStyle}>
          <span>Matter Actions</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {/* Primary Actions */}
          {!matterData.matterId ? (
            <div style={{
              padding: '16px',
              color: mutedText(isDarkMode),
              fontSize: 11,
              fontStyle: 'italic',
              background: panelBackground(isDarkMode),
              borderRadius: 12,
              border: `1px dashed ${borderColour(isDarkMode)}`,
              boxShadow: elevatedShadow(isDarkMode)
            }}>
              Use the Matter Opening workflow to create and configure the matter.
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className={buttonStyle('primary')}
                onClick={handleOpenMatterDashboard}
              >
                📊 View in Clio
              </button>
              
              <button
                className={buttonStyle('secondary')}
                onClick={() => {
                  console.log('Opening matter timeline');
                }}
              >
                ⏱️ Timeline
              </button>
              
              <button
                className={buttonStyle('secondary')}
                onClick={() => {
                  console.log('Opening matter documents');
                }}
              >
                📄 Documents
              </button>
            </div>
          )}
        </div>
      </div>
      
      
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default MatterOperations;