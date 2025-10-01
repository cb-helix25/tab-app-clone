import React, { useState, useEffect, useMemo } from 'react';
import { mergeStyles } from '@fluentui/merge-styles';
import { colours } from '../../app/styles/colours';
import RelatedClientsSection from './components/RelatedClientsSection';

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

interface OriginDeal {
  title?: string;
  reference?: string | number;
  stage?: string;
  service?: string;
  amount?: number | string;
  currency?: string;
  createdDate?: string;
  owner?: string;
}

type MatterLike = Record<string, unknown>;

const parseDateValue = (value: unknown): number | null => {
  if (!value) return null;
  const asString = typeof value === 'string' ? value : String(value);
  const parsed = new Date(asString);
  const timestamp = parsed.getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
};

const getMatterOpenedAt = (matter: MatterLike): number | null => {
  const candidates = [
    matter.open_date,
    matter.OpenDate,
    matter.openDate,
    matter['Open Date'],
    matter.opened_at,
    matter.OpenedAt,
  ];

  for (const candidate of candidates) {
    const timestamp = parseDateValue(candidate);
    if (timestamp !== null) {
      return timestamp;
    }
  }

  return null;
};

const getMatterDisplayNumber = (matter: MatterLike): string => {
  const candidate = matter.display_number ?? matter.DisplayNumber ?? matter.displayNumber ?? '';
  if (candidate === undefined || candidate === null) return '';
  return typeof candidate === 'string' ? candidate : String(candidate);
};

const getMatterNumericId = (matter: MatterLike): number => {
  const candidate = matter.id ?? matter.MatterID ?? matter.matter_id ?? matter.MatterId;
  if (candidate === undefined || candidate === null) return 0;
  const numeric = typeof candidate === 'number' ? candidate : Number(String(candidate));
  return Number.isNaN(numeric) ? 0 : numeric;
};

const compareMatters = (a: MatterLike, b: MatterLike): number => {
  const openedA = getMatterOpenedAt(a);
  const openedB = getMatterOpenedAt(b);

  if (openedA !== null || openedB !== null) {
    if (openedA === null) return 1;
    if (openedB === null) return -1;
    if (openedA !== openedB) return openedB - openedA;
  }

  const displayA = getMatterDisplayNumber(a);
  const displayB = getMatterDisplayNumber(b);
  if (displayA && displayB) {
    const comparison = displayA.localeCompare(displayB, undefined, { numeric: true, sensitivity: 'base' });
    if (comparison !== 0) {
      return comparison;
    }
  }

  const idA = getMatterNumericId(a);
  const idB = getMatterNumericId(b);
  if (idA !== idB) {
    return idB - idA;
  }

  return 0;
};

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
    isLoading: false,
    matters: []
  });
  const [relatedClientIds, setRelatedClientIds] = useState<string>('');
  // Matter opening is handled by a dedicated workflow; creation UI removed here

  const originDeal: OriginDeal | null = useMemo(() => {
    const dealSource = (selectedInstruction?.deal as any)
      || (selectedOverviewItem?.deal as any)
      || (selectedOverviewItem?.instruction?.deal as any)
      || null;

    if (!dealSource) {
      return null;
    }

    const rawAmount = dealSource.Amount ?? dealSource.amount ?? dealSource.Estimate ?? dealSource.QuoteAmount;
    const amount = typeof rawAmount === 'number'
      ? rawAmount
      : rawAmount && !Number.isNaN(Number(rawAmount))
        ? Number(rawAmount)
        : undefined;

    return {
      title: dealSource.ServiceDescription || dealSource.Service || dealSource.Title || dealSource.Name || selectedInstruction?.MatterDescription,
      reference: dealSource.ProspectId || dealSource.prospectId || dealSource.DealId || dealSource.Id || dealSource.dealId,
      stage: dealSource.Stage || dealSource.StageName || dealSource.Status,
      service: dealSource.ServiceDescription || dealSource.Service || selectedInstruction?.AreaOfWork,
      amount: amount ?? rawAmount,
      currency: dealSource.Currency || dealSource.currency || 'GBP',
      createdDate: dealSource.CreatedDate || dealSource.CreatedOn || dealSource.CreatedTime || dealSource.Created?.Date,
      owner: dealSource.Owner || dealSource.OwnerName || dealSource.ResponsibleSolicitor || dealSource.Solicitor || selectedInstruction?.ResponsibleSolicitor
    };
  }, [selectedInstruction, selectedOverviewItem]);

  // Load matter data when instruction changes
  useEffect(() => {
    if (selectedInstruction?.InstructionRef) {
      loadMatterData();
      
      if (selectedInstruction.ClientId) {
        loadClientData();
      } else {
        setClientData({ isLoading: false, matters: [] });
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
        // Load related client IDs from instruction data
        setRelatedClientIds(selectedInstruction.RelatedClientId || '');
      } else if (response.status === 404) {
        // Matter doesn't exist yet
        setMatterData({
          status: 'Not Created',
          clientLinked: !!selectedInstruction.ClientId,
          clientId: selectedInstruction.ClientId,
          isLoading: false
        });
        // Load related client IDs from instruction data
        setRelatedClientIds(selectedInstruction.RelatedClientId || '');
      } else {
        throw new Error('Failed to load matter data');
      }
    } catch (error) {
      console.error('Error loading matter data:', error);
      // Set fallback data when API fails
      setMatterData({
        status: 'API Unavailable',
        clientLinked: !!selectedInstruction.ClientId,
        clientId: selectedInstruction.ClientId,
        isLoading: false
      });
      // Load related client IDs from instruction data
      setRelatedClientIds(selectedInstruction.RelatedClientId || '');
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
        const matters = Array.isArray(data.matters)
          ? [...data.matters].sort((a: MatterLike, b: MatterLike) => compareMatters(a, b))
          : [];
        setClientData({
          id: data.client?.id?.toString(),
          name: data.client?.name,
          email: data.client?.primary_email_address,
          phone: data.client?.primary_phone_number,
          type: data.client?.type,
          matters,
          isLoading: false
        });
      } else {
        throw new Error('Failed to load client data');
      }
    } catch (error) {
      console.error('Error loading client data:', error);
      setClientData({ isLoading: false, matters: [] });
    }
  };

  const handleRelatedClientsUpdate = (newClientIds: string) => {
    setRelatedClientIds(newClientIds);
  };

  // Matter status logic
  const matterStatus = useMemo(() => {
    const neutral = isDarkMode ? colours.dark.text : '#374151';
    if (matterData.isLoading) return { label: 'Loading...', color: colours.greyText };
    if (matterData.matterId && matterData.matterId !== 'NO_MATTER') return { label: 'Active Matter', color: neutral };
    if (selectedInstruction?.ClientId) return { label: 'Ready to Create', color: neutral };
    return { label: 'Client Required', color: neutral };
  }, [matterData, selectedInstruction, isDarkMode]);

  // Creation and client-linking are handled elsewhere

  const handleOpenMatterDashboard = () => {
    if (matterData.matterId && matterData.matterId !== 'NO_MATTER') {
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

  const clientMatters = clientData.matters ?? [];

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
      {/* Client and Matter Details - Side by Side */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)', 
        gap: '16px',
        marginBottom: '16px'
      }}>
        
        {/* Client Information Card - Now handled by Related Clients Section below */}
        {/* <div className={cardStyle}>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: 9, color: mutedText(isDarkMode), marginBottom: 2 }}>CLIENT NAME</div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                    {clientData.name || 'Unknown'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: mutedText(isDarkMode), marginBottom: 2 }}>CLIENT TYPE</div>
                  <div style={{ fontSize: 11, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                    {clientData.type || 'Individual'}
                  </div>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: 9, color: mutedText(isDarkMode), marginBottom: 2 }}>EMAIL</div>
                  <div style={{ fontSize: 10, fontWeight: 400, color: isDarkMode ? colours.dark.text : '#111827' }}>
                    {clientData.email || 'Not provided'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: mutedText(isDarkMode), marginBottom: 2 }}>PHONE</div>
                  <div style={{ fontSize: 10, fontWeight: 400, color: isDarkMode ? colours.dark.text : '#111827' }}>
                    {clientData.phone || 'Not provided'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <div style={{ fontSize: 9, color: mutedText(isDarkMode), marginBottom: 2 }}>CLIO CLIENT ID</div>
                  <div style={{ fontSize: 10, fontWeight: 400, color: isDarkMode ? colours.dark.text : '#111827' }}>
                    {clientData.id}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: mutedText(isDarkMode), marginBottom: 2 }}>EXISTING MATTERS</div>
                  <div style={{ fontSize: 10, fontWeight: 400, color: isDarkMode ? colours.dark.text : '#111827' }}>
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
              borderRadius: '8px',
              border: `1px dashed ${borderColour(isDarkMode)}`
            }}>
              <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 600 }}>
                No Client Linked
              </div>
              <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
                Use the Matter Opening workflow to link a client
              </div>
            </div>
          )}
        </div> */}

        {/* Related Clients Section */}
        <RelatedClientsSection
          key={`related-clients-${selectedInstruction?.InstructionRef}`}
          instructionRef={selectedInstruction?.InstructionRef}
          relatedClientIds={relatedClientIds}
          mainClientId={matterData.clientId}
          originDeal={originDeal}
          onRelatedClientsUpdate={handleRelatedClientsUpdate}
          userInitials={selectedInstruction?.ResponsibleSolicitor?.split(' ')
            .map((name: string) => name[0])
            .join('') || 'LZ'}
        />
        
        {/* Matter Overview Card */}
        <div className={cardStyle}>
          <div className={headerStyle}>
            <span>Matter Overview</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {statusIndicator(!!(matterData.matterId && matterData.matterId !== 'NO_MATTER'))}
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

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: 9, color: mutedText(isDarkMode), marginBottom: 2 }}>MATTER ID</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                  {(matterData.matterId && matterData.matterId !== 'NO_MATTER') ? matterData.matterId : 'Not assigned'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: mutedText(isDarkMode), marginBottom: 2 }}>STATUS</div>
                <div style={{ fontSize: 11, fontWeight: 500, color: isDarkMode ? colours.dark.text : '#111827' }}>
                  {matterData.status}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: 9, color: mutedText(isDarkMode), marginBottom: 2 }}>DISPLAY NUMBER</div>
                <div style={{ fontSize: 10, fontWeight: 400, color: isDarkMode ? colours.dark.text : '#111827' }}>
                  {matterData.displayNumber || 'Auto-generated on creation'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: mutedText(isDarkMode), marginBottom: 2 }}>OPEN DATE</div>
                <div style={{ fontSize: 10, fontWeight: 400, color: isDarkMode ? colours.dark.text : '#111827' }}>
                  {matterData.openDate ? new Date(matterData.openDate).toLocaleDateString() : 'Not opened'}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <div style={{ fontSize: 9, color: mutedText(isDarkMode), marginBottom: 2 }}>PRACTICE AREA</div>
                <div style={{ fontSize: 10, fontWeight: 400, color: isDarkMode ? colours.dark.text : '#111827' }}>
                  {matterData.practiceArea || selectedInstruction.AreaOfWork || 'General Legal Services'}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 9, color: mutedText(isDarkMode), marginBottom: 2 }}>RESPONSIBLE SOLICITOR</div>
                <div style={{ fontSize: 10, fontWeight: 400, color: isDarkMode ? colours.dark.text : '#111827' }}>
                  {matterData.responsibleSolicitor || selectedInstruction.ResponsibleSolicitor || 'Unassigned'}
                </div>
              </div>
            </div>

            <div style={{ borderTop: `1px solid ${borderColour(isDarkMode)}`, paddingTop: '12px' }}>
              <div style={{
                fontSize: 9,
                color: mutedText(isDarkMode),
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
                marginBottom: '8px'
              }}>
                Actions
              </div>
              {!matterData.matterId || matterData.matterId === 'NO_MATTER' ? (
                <div style={{
                  padding: '16px',
                  color: mutedText(isDarkMode),
                  fontSize: 11,
                  fontStyle: 'italic',
                  background: panelBackground(isDarkMode),
                  borderRadius: 8,
                  border: `1px dashed ${borderColour(isDarkMode)}`,
                  textAlign: 'center'
                }}>
                  <div style={{ marginBottom: '8px', fontSize: '12px', fontWeight: 600 }}>
                    No Matter Created
                  </div>
                  <div>
                    Use the Matter Opening workflow to create and configure the matter.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
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

            {clientMatters.length > 0 && (
              <div style={{ borderTop: `1px solid ${borderColour(isDarkMode)}`, paddingTop: '12px' }}>
                <div style={{
                  fontSize: 9,
                  color: mutedText(isDarkMode),
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginBottom: '8px'
                }}>
                  Client's Other Matters ({clientMatters.length})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '200px', overflowY: 'auto' }}>
                  {clientMatters.map((matter: any, index: number) => (
                    <div key={index} style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px',
                      background: cardBackground(isDarkMode),
                      borderRadius: 8,
                      border: `1px solid ${borderColour(isDarkMode)}`,
                      fontSize: 10,
                      boxShadow: elevatedShadow(isDarkMode)
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, color: isDarkMode ? colours.dark.text : '#111827', marginBottom: '4px' }}>
                          {matter.display_number || `Matter ${matter.id}`}
                        </div>
                        <div style={{ color: mutedText(isDarkMode), fontSize: 9 }}>
                          {matter.description || 'No description'}
                        </div>
                      </div>
                      <div style={{ fontSize: 9, color: mutedText(isDarkMode) }}>
                        ID: {matter.id}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
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