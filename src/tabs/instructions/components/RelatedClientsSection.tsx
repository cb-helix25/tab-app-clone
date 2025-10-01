import React, { useState, useEffect } from 'react';
import {
  Stack,
  Text,
  DefaultButton,
  Spinner,
  MessageBar,
  MessageBarType,
  FontIcon,
  Persona,
  PersonaSize,
  PersonaPresence,
  IconButton,
  TooltipHost
} from '@fluentui/react';
import { useTheme } from '../../../app/functionality/ThemeContext';
import { colours } from '../../../app/styles/colours';
import ClientLookupModal from './ClientLookupModal';

interface RelatedClientsSectionProps {
  instructionRef: string;
  relatedClientIds?: string; // Comma-separated Clio client IDs from database
  mainClientId?: string; // Main Clio client ID from matter (if exists)
  userInitials: string;
  originDeal?: OriginDeal | null;
  onRelatedClientsUpdate?: (relatedClientIds: string) => void;
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

interface ClioClient {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone?: string;
  type: 'Person' | 'Company';
}

const RelatedClientsSection: React.FC<RelatedClientsSectionProps> = ({
  instructionRef,
  relatedClientIds,
  mainClientId,
  userInitials,
  originDeal,
  onRelatedClientsUpdate
}) => {
  const { isDarkMode } = useTheme();
  const [relatedClients, setRelatedClients] = useState<ClioClient[]>([]);
  const [mainClient, setMainClient] = useState<ClioClient | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  // Debug: Track component lifecycle
  useEffect(() => {
    console.log('RelatedClientsSection mounted for instruction:', instructionRef);
    return () => {
      console.log('RelatedClientsSection unmounting for instruction:', instructionRef);
    };
  }, [instructionRef]);

  // Load related client details when relatedClientIds changes
  useEffect(() => {
    if (relatedClientIds && relatedClientIds.trim() !== '') {
      loadRelatedClients(relatedClientIds);
    } else {
      setRelatedClients([]);
    }
  }, [relatedClientIds, userInitials]);

  useEffect(() => {
    console.log('RelatedClientsSection - mainClientId changed:', mainClientId);
    if (mainClientId && mainClientId.trim() !== '') {
      loadMainClient(mainClientId);
    } else {
      console.log('RelatedClientsSection - no mainClientId, setting null');
      setMainClient(null);
    }
  }, [mainClientId, userInitials]);

  const loadMainClient = async (clientId: string) => {
    try {
      console.log('Loading main client with ID:', clientId);
      const response = await fetch(`/api/clio-client-lookup/client/${clientId}?initials=${userInitials}`);
      if (response.ok) {
        const data = await response.json();
        console.log('Main client loaded successfully:', data.client);
        setMainClient(data.client);
      } else {
        console.error('Failed to load main client - response not ok:', response.status);
        setMainClient(null);
      }
    } catch (error) {
      console.error('Error loading main client:', error);
      setMainClient(null);
    }
  };

  const loadRelatedClients = async (clientIds: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const ids = clientIds.split(',').map(id => id.trim()).filter(id => id !== '');
      const clientPromises = ids.map(async (clientId) => {
        try {
          const response = await fetch(`/api/clio-client-lookup/client/${clientId}?initials=${userInitials}`);
          if (response.ok) {
            const data = await response.json();
            return data.client;
          }
          return null;
        } catch (err) {
          console.error(`Failed to load client ${clientId}:`, err);
          return null;
        }
      });

      const clients = await Promise.all(clientPromises);
      const validClients = clients.filter(client => client !== null) as ClioClient[];
      setRelatedClients(validClients);
    } catch (err) {
      console.error('Error loading related clients:', err);
      setError('Failed to load related client details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClient = async (client: ClioClient) => {
    // Prevent adding the main client as a related client
    if (mainClientId && client.id === mainClientId) {
      setError('This client is already the main client for this matter.');
      return;
    }

    // Check if client is already in related clients
    if (relatedClients.some(existingClient => existingClient.id === client.id)) {
      setError('This client is already added as a related client.');
      return;
    }

    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch('/api/related-clients/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instructionRef,
          clientId: client.id
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add related client');
      }

      const data = await response.json();
      
      // Update the parent component with new related client IDs
      if (onRelatedClientsUpdate) {
        onRelatedClientsUpdate(data.relatedClientId);
      }

      // Add the new client to our local state immediately for better UX
      setRelatedClients(prev => [...prev, client]);
    } catch (err) {
      console.error('Error adding related client:', err);
      setError(err instanceof Error ? err.message : 'Failed to add related client');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleRemoveClient = async (clientId: string) => {
    setIsUpdating(true);
    setError(null);

    try {
      const response = await fetch('/api/related-clients/remove', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          instructionRef,
          clientId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove related client');
      }

      const data = await response.json();
      
      // Update the parent component with updated related client IDs
      if (onRelatedClientsUpdate) {
        onRelatedClientsUpdate(data.relatedClientId || '');
      }

      // Remove the client from our local state immediately for better UX
      setRelatedClients(prev => prev.filter(client => client.id !== clientId));
    } catch (err) {
      console.error('Error removing related client:', err);
      setError(err instanceof Error ? err.message : 'Failed to remove related client');
    } finally {
      setIsUpdating(false);
    }
  };

  const renderClientCard = (client: ClioClient, isMainClient: boolean = false) => {
    return (
      <div
        key={client.id}
        style={{
          padding: '12px',
          border: `1px solid ${isDarkMode ? colours.dark.border : '#e1e5e9'}`,
          borderRadius: '6px',
          backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
          position: 'relative'
        }}
      >
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 12 }}>
          <Persona
            text={client.name}
            secondaryText={client.email}
            size={PersonaSize.size32}
            presence={PersonaPresence.none}
            initialsColor={colours.highlight}
          />
          <Stack grow>
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
              <Text 
                variant="medium" 
                style={{ 
                  fontWeight: 600,
                  color: isDarkMode ? '#e2e8f0' : '#374151'
                }}
              >
                {client.name}
              </Text>
              <Text 
                variant="small" 
                style={{ 
                  color: isDarkMode ? 'rgba(226, 232, 240, 0.72)' : colours.greyText,
                  backgroundColor: isDarkMode ? colours.dark.background : '#f4f4f6',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '10px',
                  fontWeight: 500
                }}
              >
                {isMainClient ? 'Main Client' : client.type}
              </Text>
            </Stack>
            <Text 
              variant="small" 
              style={{ 
                color: isDarkMode ? 'rgba(226, 232, 240, 0.72)' : colours.greyText 
              }}
            >
              {client.email}
            </Text>
            {client.phone && (
              <Text 
                variant="small" 
                style={{ 
                  color: isDarkMode ? 'rgba(226, 232, 240, 0.72)' : colours.greyText 
                }}
              >
                {client.phone}
              </Text>
            )}
          </Stack>
          {!isMainClient && (
            <TooltipHost content="Remove related client">
              <IconButton
                iconProps={{ iconName: 'Cancel' }}
                onClick={() => handleRemoveClient(client.id)}
                disabled={isUpdating}
                styles={{
                  root: {
                    color: isDarkMode ? 'rgba(226, 232, 240, 0.72)' : colours.greyText,
                    ':hover': {
                    color: '#dc2626',
                    backgroundColor: isDarkMode ? '#334155' : '#f8f9fa'
                  }
                }
              }}
            />
          </TooltipHost>
          )}
        </Stack>
      </div>
    );
  };

  const leadClientCard = () => {
    if (!mainClient) {
      return (
        <Stack
          horizontalAlign="center"
          verticalAlign="center"
          styles={{
            root: {
              padding: '20px',
              backgroundColor: isDarkMode ? colours.dark.background : '#f8f9fa',
              borderRadius: '6px',
              border: `1px dashed ${isDarkMode ? colours.dark.border : '#d0d0d7'}`,
              textAlign: 'center'
            }
          }}
        >
          <FontIcon
            iconName="ContactInfo"
            style={{
              fontSize: '22px',
              color: isDarkMode ? 'rgba(226, 232, 240, 0.72)' : colours.greyText,
              marginBottom: '8px'
            }}
          />
          <Text
            variant="small"
            style={{
              color: isDarkMode ? 'rgba(226, 232, 240, 0.72)' : colours.greyText,
              fontWeight: 600
            }}
          >
            Lead client not linked
          </Text>
          <Text
            variant="small"
            style={{
              marginTop: '4px',
              color: isDarkMode ? 'rgba(226, 232, 240, 0.72)' : colours.greyText
            }}
          >
            Run the Matter Opening workflow to associate the primary client.
          </Text>
        </Stack>
      );
    }

    return (
      <div
        style={{
          padding: '16px',
          border: `1px solid ${isDarkMode ? colours.dark.border : '#e1e5e9'}`,
          borderRadius: '8px',
          backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
          boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)'
        }}
      >
        <Stack tokens={{ childrenGap: 12 }}>
          <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
              <FontIcon
                iconName="Contact"
                style={{ fontSize: '14px', color: isDarkMode ? '#e2e8f0' : '#0f172a' }}
              />
              <Text
                variant="medium"
                style={{
                  fontWeight: 600,
                  color: isDarkMode ? '#e2e8f0' : '#0f172a'
                }}
              >
                Lead Client
              </Text>
            </Stack>
            <Text
              variant="small"
              style={{
                color: isDarkMode ? 'rgba(226, 232, 240, 0.72)' : colours.greyText,
                fontSize: '11px'
              }}
            >
              Linked via Matter Opening
            </Text>
          </Stack>

          {renderClientCard(mainClient, true)}
        </Stack>
      </div>
    );
  };

  const connectorLine = (length: number = 32) => (
    <div
      style={{
        height: length,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div
        style={{
          width: '2px',
          height: length - 8,
          backgroundColor: isDarkMode ? '#334155' : '#d2d6dc',
          borderRadius: '999px'
        }}
      />
    </div>
  );

  const originDealCard = () => {
    if (!originDeal) return null;

    const amountValue = originDeal.amount
      ? typeof originDeal.amount === 'number'
        ? new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: originDeal.currency || 'GBP',
            maximumFractionDigits: 0
          }).format(originDeal.amount)
        : originDeal.amount
      : 'TBC';

    const createdOn = originDeal.createdDate
      ? new Date(originDeal.createdDate).toLocaleDateString()
      : 'Pending';

    return (
      <div
        style={{
          padding: '16px',
          border: `1px solid ${isDarkMode ? colours.dark.border : '#e1e5e9'}`,
          borderRadius: '8px',
          backgroundColor: isDarkMode ? '#111827' : '#f8fafc',
          boxShadow: '0 12px 32px rgba(15, 23, 42, 0.08)'
        }}
      >
        <Stack tokens={{ childrenGap: 12 }}>
          <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
            <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
              <FontIcon
                iconName="FlowChart"
                style={{ fontSize: '14px', color: isDarkMode ? '#f8fafc' : '#1e293b' }}
              />
              <Text
                variant="medium"
                style={{
                  fontWeight: 600,
                  color: isDarkMode ? '#f8fafc' : '#1e293b'
                }}
              >
                Originating Deal
              </Text>
            </Stack>
            {originDeal.stage && (
              <Text
                variant="small"
                style={{
                  color: isDarkMode ? 'rgba(226, 232, 240, 0.72)' : colours.greyText,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  fontSize: '10px'
                }}
              >
                {originDeal.stage}
              </Text>
            )}
          </Stack>

          <Stack tokens={{ childrenGap: 8 }}>
            <Text
              variant="mediumPlus"
              style={{
                fontWeight: 600,
                color: isDarkMode ? '#e2e8f0' : '#0f172a'
              }}
            >
              {originDeal.title || 'Deal summary unavailable'}
            </Text>
            {originDeal.service && (
              <Text
                variant="small"
                style={{ color: isDarkMode ? 'rgba(226, 232, 240, 0.72)' : colours.greyText }}
              >
                Service: {originDeal.service}
              </Text>
            )}
          </Stack>

          <Stack horizontal tokens={{ childrenGap: 16 }}>
            <Stack>
              <Text
                variant="xSmall"
                style={{
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  color: isDarkMode ? 'rgba(148, 163, 184, 0.9)' : '#475569'
                }}
              >
                Deal Value
              </Text>
              <Text
                variant="medium"
                style={{
                  fontWeight: 600,
                  color: isDarkMode ? '#f8fafc' : '#0f172a'
                }}
              >
                {amountValue}
              </Text>
            </Stack>

            <Stack>
              <Text
                variant="xSmall"
                style={{
                  textTransform: 'uppercase',
                  fontWeight: 600,
                  letterSpacing: '0.05em',
                  color: isDarkMode ? 'rgba(148, 163, 184, 0.9)' : '#475569'
                }}
              >
                Created
              </Text>
              <Text
                variant="medium"
                style={{
                  fontWeight: 500,
                  color: isDarkMode ? '#e2e8f0' : '#1e293b'
                }}
              >
                {createdOn}
              </Text>
            </Stack>

            {originDeal.owner && (
              <Stack>
                <Text
                  variant="xSmall"
                  style={{
                    textTransform: 'uppercase',
                    fontWeight: 600,
                    letterSpacing: '0.05em',
                    color: isDarkMode ? 'rgba(148, 163, 184, 0.9)' : '#475569'
                  }}
                >
                  Owner
                </Text>
                <Text
                  variant="medium"
                  style={{
                    fontWeight: 500,
                    color: isDarkMode ? '#e2e8f0' : '#1e293b'
                  }}
                >
                  {originDeal.owner}
                </Text>
              </Stack>
            )}
          </Stack>

          <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 6 }}>
            <FontIcon
              iconName="Link"
              style={{ fontSize: '12px', color: isDarkMode ? '#38bdf8' : colours.blue }}
            />
            <Text
              variant="small"
              style={{
                color: isDarkMode ? 'rgba(226, 232, 240, 0.72)' : colours.greyText,
                fontFamily: 'monospace'
              }}
            >
              {originDeal.reference ? `Prospect ${originDeal.reference}` : 'No linked prospect'}
            </Text>
          </Stack>
        </Stack>
      </div>
    );
  };

  const relatedClientsSection = () => (
    <Stack tokens={{ childrenGap: 12 }}>
      <Stack horizontal horizontalAlign="space-between" verticalAlign="center">
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <FontIcon
            iconName="People"
            style={{
              fontSize: '14px',
              color: isDarkMode ? '#e2e8f0' : '#374151'
            }}
          />
          <Text
            variant="medium"
            style={{
              fontWeight: 600,
              color: isDarkMode ? '#e2e8f0' : '#374151'
            }}
          >
            Related Clients
          </Text>
          {relatedClients.length > 0 && (
            <Text
              variant="small"
              style={{
                color: isDarkMode ? 'rgba(226, 232, 240, 0.72)' : colours.greyText,
                backgroundColor: isDarkMode ? colours.dark.background : '#f4f4f6',
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '10px',
                fontWeight: 500
              }}
            >
              {relatedClients.length}
            </Text>
          )}
        </Stack>

        <DefaultButton
          iconProps={{ iconName: 'Add' }}
          text="Link Client"
          onClick={() => setShowLookupModal(true)}
          disabled={isUpdating}
          styles={{
            root: {
              fontSize: '12px',
              padding: '6px 12px',
              minWidth: 'auto'
            }
          }}
        />
      </Stack>

      {error && (
        <MessageBar
          messageBarType={MessageBarType.error}
          onDismiss={() => setError(null)}
          styles={{ root: { fontSize: '12px' } }}
        >
          {error}
        </MessageBar>
      )}

      {isLoading && (
        <Stack horizontal verticalAlign="center" tokens={{ childrenGap: 8 }}>
          <Spinner size={1} />
          <Text
            variant="small"
            style={{ color: isDarkMode ? 'rgba(226, 232, 240, 0.72)' : colours.greyText }}
          >
            Loading related clients...
          </Text>
        </Stack>
      )}

      {!isLoading && relatedClients.length > 0 && (
        <Stack tokens={{ childrenGap: 8 }}>
          {relatedClients.map(client => renderClientCard(client, false))}
        </Stack>
      )}

      {!isLoading && relatedClients.length === 0 && (
        <Stack
          horizontalAlign="center"
          verticalAlign="center"
          styles={{
            root: {
              padding: '24px',
              backgroundColor: isDarkMode ? colours.dark.background : '#f8f9fa',
              borderRadius: '6px',
              border: `1px dashed ${isDarkMode ? colours.dark.border : '#d0d0d7'}`
            }
          }}
        >
          <FontIcon
            iconName="PeopleAdd"
            style={{
              fontSize: '20px',
              color: isDarkMode ? 'rgba(226, 232, 240, 0.72)' : colours.greyText,
              marginBottom: '8px'
            }}
          />
          <Text
            variant="small"
            style={{
              color: isDarkMode ? 'rgba(226, 232, 240, 0.72)' : colours.greyText,
              textAlign: 'center'
            }}
          >
            No related clients linked yet
          </Text>
          <Text
            variant="small"
            style={{
              color: isDarkMode ? 'rgba(226, 232, 240, 0.72)' : colours.greyText,
              textAlign: 'center',
              marginTop: '4px'
            }}
          >
            Use “Link Client” to connect additional contacts involved in this matter.
          </Text>
        </Stack>
      )}

      {isUpdating && (
        <Stack
          horizontal
          horizontalAlign="center"
          verticalAlign="center"
          tokens={{ childrenGap: 8 }}
          styles={{
            root: {
              padding: '8px',
              backgroundColor: isDarkMode ? '#1e293b' : '#ffffff',
              borderRadius: '4px',
              border: `1px solid ${isDarkMode ? colours.dark.border : '#e1e5e9'}`
            }
          }}
        >
          <Spinner size={1} />
          <Text
            variant="small"
            style={{ color: isDarkMode ? 'rgba(226, 232, 240, 0.72)' : colours.greyText }}
          >
            Updating related clients...
          </Text>
        </Stack>
      )}
    </Stack>
  );

  return (
    <Stack tokens={{ childrenGap: 12 }}>
      {leadClientCard()}
      {originDeal && connectorLine()}
      {originDealCard()}
      {originDeal && connectorLine()}
      {relatedClientsSection()}

      <ClientLookupModal
        isOpen={showLookupModal}
        onDismiss={() => setShowLookupModal(false)}
        onClientSelected={handleAddClient}
        userInitials={userInitials}
      />
    </Stack>
  );
};

export default RelatedClientsSection;
