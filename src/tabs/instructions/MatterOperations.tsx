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
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [showMatterForm, setShowMatterForm] = useState(false);
  const [matterFormData, setMatterFormData] = useState({
    description: '',
    practiceArea: '',
    responsibleSolicitor: '',
    clientId: '',
    clientName: ''
  });

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
    if (matterData.isLoading) return { label: 'Loading...', color: colours.greyText };
    if (matterData.matterId) return { label: 'Active Matter', color: colours.green };
    if (selectedInstruction?.ClientId) return { label: 'Ready to Create', color: colours.orange };
    return { label: 'Client Required', color: colours.red };
  }, [matterData, selectedInstruction]);

  const handleCreateMatter = async () => {
    if (!selectedInstruction?.InstructionRef || !selectedInstruction?.ClientId) {
      alert('Instruction reference and client ID are required');
      return;
    }
    
    setActionInProgress('create-matter');
    
    try {
      const timestamp = new Date().toISOString().slice(2, 10).replace(/-/g, '');
      const displayNumber = `ITEM${timestamp}-${String(Math.floor(Math.random() * 10000)).padStart(5, '0')}`;
      
      const payload = {
        instructionRef: selectedInstruction.InstructionRef,
        clientId: selectedInstruction.ClientId,
        displayNumber,
        description: matterFormData.description || `Legal matter for ${selectedInstruction.ClientName || 'client'}`,
        practiceArea: matterFormData.practiceArea || selectedInstruction.AreaOfWork || 'General Legal Services',
        responsibleSolicitor: matterFormData.responsibleSolicitor || selectedInstruction.ResponsibleSolicitor || 'Unassigned'
      };
      
      const response = await fetch('/api/matter-operations/create-clio-matter', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        const result = await response.json();
        console.log('Matter created:', result);
        await loadMatterData(); // Reload data
        setShowMatterForm(false);
        if (onStatusUpdate) onStatusUpdate();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create matter');
      }
    } catch (error) {
      console.error('Error creating matter:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Failed to create matter: ${errorMessage}`);
    } finally {
      setActionInProgress(null);
    }
  };

  const handleLinkClient = async () => {
    setActionInProgress('link-client');
    // Implementation for client linking
    setTimeout(() => setActionInProgress(null), 2000);
  };

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
    background: isDarkMode ? colours.dark.cardHover : '#ffffff',
    borderRadius: '6px',
    padding: '10px',
    border: `1px solid ${isDarkMode ? colours.dark.border : '#e2e8f0'}`,
    marginBottom: '8px'
  });

  const headerStyle = mergeStyles({
    fontSize: '11px',
    fontWeight: 600,
    color: isDarkMode ? colours.dark.text : '#374151',
    marginBottom: '8px',
    textTransform: 'uppercase',
    letterSpacing: '0.025em',
    borderBottom: `1px solid ${isDarkMode ? colours.dark.border : '#e2e8f0'}`,
    paddingBottom: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  });

  const statusIndicator = (status: boolean, size: number = 6) => (
    <div style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: status ? colours.green : colours.red,
      display: 'inline-block'
    }} />
  );

  if (!selectedInstruction) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: colours.greyText,
        fontSize: '12px',
        background: isDarkMode ? colours.dark.cardHover : '#f8fafc',
        borderRadius: '8px',
        border: `1px dashed ${isDarkMode ? colours.dark.border : '#d1d5db'}`
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
              color: clientData.id ? colours.green : colours.orange, 
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
                <div style={{ fontSize: 9, color: colours.greyText, marginBottom: 2 }}>CLIENT NAME</div>
                <div style={{ fontSize: 10, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                  {clientData.name || 'Unknown'}
                </div>
              </div>
              <div style={{ marginBottom: '6px' }}>
                <div style={{ fontSize: 9, color: colours.greyText, marginBottom: 2 }}>EMAIL</div>
                <div style={{ fontSize: 10, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                  {clientData.email || 'Not provided'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: colours.greyText, marginBottom: 2 }}>CLIENT TYPE</div>
                <div style={{ fontSize: 10, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                  {clientData.type || 'Individual'}
                </div>
              </div>
            </div>
            
            <div>
              <div style={{ marginBottom: '6px' }}>
                <div style={{ fontSize: 9, color: colours.greyText, marginBottom: 2 }}>CLIO CLIENT ID</div>
                <div style={{ fontSize: 10, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                  {clientData.id}
                </div>
              </div>
              <div style={{ marginBottom: '6px' }}>
                <div style={{ fontSize: 9, color: colours.greyText, marginBottom: 2 }}>PHONE</div>
                <div style={{ fontSize: 10, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                  {clientData.phone || 'Not provided'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: colours.greyText, marginBottom: 2 }}>MATTERS COUNT</div>
                <div style={{ fontSize: 10, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                  {clientData.matters?.length || 0} matters
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div style={{
            padding: '12px',
            textAlign: 'center',
            color: colours.greyText,
            fontSize: '10px',
            background: isDarkMode ? colours.dark.background : '#f8fafc',
            borderRadius: '4px',
            border: `1px dashed ${isDarkMode ? colours.dark.border : '#d1d5db'}`
          }}>
            No client linked to this instruction
          </div>
        )}

        {/* Client Matters List */}
        {clientData.matters && clientData.matters.length > 0 && (
          <div style={{ marginTop: '8px' }}>
            <div style={{ fontSize: 9, color: colours.greyText, marginBottom: 6, textTransform: 'uppercase', fontWeight: 600 }}>
              Existing Matters ({clientData.matters.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '80px', overflowY: 'auto' }}>
              {clientData.matters.map((matter: any, index: number) => (
                <div key={index} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '4px 6px',
                  background: isDarkMode ? colours.dark.background : '#ffffff',
                  borderRadius: 3,
                  border: `1px solid ${isDarkMode ? colours.dark.border : '#e2e8f0'}`,
                  fontSize: 9
                }}>
                  <div>
                    <div style={{ fontWeight: 600, color: isDarkMode ? colours.dark.text : '#111827' }}>
                      {matter.display_number || `Matter ${matter.id}`}
                    </div>
                    <div style={{ color: colours.greyText, fontSize: 8 }}>
                      {matter.description || 'No description'}
                    </div>
                  </div>
                  <div style={{ fontSize: 8, color: colours.greyText }}>
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
              <div style={{ fontSize: 10, color: colours.greyText, marginBottom: 2 }}>MATTER ID</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                {matterData.matterId || 'Not assigned'}
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: 10, color: colours.greyText, marginBottom: 2 }}>DISPLAY NUMBER</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                {matterData.displayNumber || 'Will be auto-generated'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: colours.greyText, marginBottom: 2 }}>PRACTICE AREA</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                {matterData.practiceArea || selectedInstruction.AreaOfWork || 'General Legal Services'}
              </div>
            </div>
          </div>
          
          <div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: 10, color: colours.greyText, marginBottom: 2 }}>OPEN DATE</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                {matterData.openDate ? new Date(matterData.openDate).toLocaleDateString() : 'Not opened'}
              </div>
            </div>
            <div style={{ marginBottom: '8px' }}>
              <div style={{ fontSize: 10, color: colours.greyText, marginBottom: 2 }}>RESPONSIBLE SOLICITOR</div>
              <div style={{ fontSize: 11, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                {matterData.responsibleSolicitor || selectedInstruction.ResponsibleSolicitor || 'Unassigned'}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: colours.greyText, marginBottom: 2 }}>STATUS</div>
              <div style={{ 
                fontSize: 11, 
                fontWeight: 500, 
                color: matterData.status === 'Open' ? colours.green : colours.orange 
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
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                className={buttonStyle('primary')}
                onClick={() => setShowMatterForm(!showMatterForm)}
                disabled={!selectedInstruction?.ClientId || actionInProgress !== null}
              >
                🚀 {showMatterForm ? 'Cancel' : 'Create Matter'}
              </button>
              
              {!selectedInstruction.ClientId && (
                <button
                  className={buttonStyle('secondary')}
                  onClick={handleLinkClient}
                  disabled={actionInProgress !== null}
                >
                  🔗 Link Client
                </button>
              )}
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
          
          {actionInProgress && (
            <div style={{ 
              fontSize: 10, 
              color: colours.blue, 
              fontStyle: 'italic',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}>
              <div style={{ 
                width: 12, 
                height: 12, 
                border: `2px solid ${colours.blue}30`,
                borderTop: `2px solid ${colours.blue}`,
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              {actionInProgress === 'create-matter' ? 'Creating matter in Clio...' : 'Processing...'}
            </div>
          )}
        </div>
      </div>

      {/* Matter Creation Form */}
      {showMatterForm && (
        <div className={cardStyle}>
          <div className={headerStyle}>
            <span>Create Matter</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label style={{ fontSize: 10, color: colours.greyText, display: 'block', marginBottom: 4 }}>
                DESCRIPTION
              </label>
              <textarea
                value={matterFormData.description}
                onChange={(e) => setMatterFormData({ ...matterFormData, description: e.target.value })}
                placeholder={`Legal matter for ${selectedInstruction.ClientName || 'client'}`}
                style={{
                  width: '100%',
                  padding: '8px',
                  border: `1px solid ${isDarkMode ? colours.dark.border : '#d1d5db'}`,
                  borderRadius: 4,
                  fontSize: 11,
                  background: isDarkMode ? colours.dark.inputBackground : '#ffffff',
                  color: isDarkMode ? colours.dark.text : '#111827',
                  resize: 'vertical',
                  minHeight: '60px'
                }}
              />
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: 10, color: colours.greyText, display: 'block', marginBottom: 4 }}>
                  PRACTICE AREA
                </label>
                <input
                  type="text"
                  value={matterFormData.practiceArea}
                  onChange={(e) => setMatterFormData({ ...matterFormData, practiceArea: e.target.value })}
                  placeholder={selectedInstruction.AreaOfWork || 'General Legal Services'}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: `1px solid ${isDarkMode ? colours.dark.border : '#d1d5db'}`,
                    borderRadius: 4,
                    fontSize: 11,
                    background: isDarkMode ? colours.dark.inputBackground : '#ffffff',
                    color: isDarkMode ? colours.dark.text : '#111827'
                  }}
                />
              </div>
              
              <div>
                <label style={{ fontSize: 10, color: colours.greyText, display: 'block', marginBottom: 4 }}>
                  RESPONSIBLE SOLICITOR
                </label>
                <input
                  type="text"
                  value={matterFormData.responsibleSolicitor}
                  onChange={(e) => setMatterFormData({ ...matterFormData, responsibleSolicitor: e.target.value })}
                  placeholder={selectedInstruction.ResponsibleSolicitor || 'Unassigned'}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: `1px solid ${isDarkMode ? colours.dark.border : '#d1d5db'}`,
                    borderRadius: 4,
                    fontSize: 11,
                    background: isDarkMode ? colours.dark.inputBackground : '#ffffff',
                    color: isDarkMode ? colours.dark.text : '#111827'
                  }}
                />
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button
                className={buttonStyle('secondary')}
                onClick={() => setShowMatterForm(false)}
                disabled={actionInProgress !== null}
              >
                Cancel
              </button>
              <button
                className={buttonStyle('primary')}
                onClick={handleCreateMatter}
                disabled={actionInProgress !== null}
              >
                {actionInProgress === 'create-matter' ? 'Creating...' : 'Create Matter'}
              </button>
            </div>
          </div>
        </div>
      )}
      
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