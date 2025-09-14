import React from 'react';
import {
  Modal,
  Stack,
  Text,
  IconButton,
  mergeStyles,
  Icon,
  Separator
} from '@fluentui/react';
import { useTheme } from '../app/functionality/ThemeContext';
import { colours } from '../app/styles/colours';

interface DataFlowWorkbenchProps {
  isOpen: boolean;
  onClose: () => void;
  embedded?: boolean;
}

const DataFlowWorkbench: React.FC<DataFlowWorkbenchProps> = ({ isOpen, onClose, embedded = false }) => {
  const { isDarkMode } = useTheme();

  const sectionStyle = mergeStyles({
    background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.8)',
    border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.08)',
    borderRadius: 8,
    padding: '16px 20px',
    marginBottom: 16,
    backdropFilter: 'blur(8px)',
  });

  // If embedded, render content directly without modal
  if (embedded) {
    return (
      <div style={{ padding: 0 }}>
        <Stack tokens={{ childrenGap: 20 }}>
          
          {/* Overview */}
          <div className={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Icon iconName="Info" style={{ fontSize: 16, color: '#3690CE' }} />
              <Text variant="medium" style={{ fontWeight: 600, color: isDarkMode ? colours.dark.text : colours.light.text }}>
                System Architecture Overview
              </Text>
            </div>
            <Text style={{ color: isDarkMode ? colours.dark.subText : colours.light.subText, lineHeight: 1.5 }}>
              The application uses two distinct data access patterns optimized for different use cases.
            </Text>
          </div>

          {/* Comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            
            {/* Instructions Tab */}
            <div className={sectionStyle} style={{ borderLeft: '4px solid #3690CE' }}>
              <div style={{ marginBottom: 12 }}>
                <Text style={{ fontWeight: 600, color: '#3690CE', fontSize: 14 }}>INSTRUCTIONS TAB</Text>
                <Text style={{ fontSize: 12, color: isDarkMode ? colours.dark.subText : colours.light.subText }}>
                  Complex Processing Pipeline
                </Text>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3690CE' }} />
                  <Text style={{ fontSize: 13, color: isDarkMode ? colours.dark.text : colours.light.text }}>
                    Instructions Database Query
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3690CE' }} />
                  <Text style={{ fontSize: 13, color: isDarkMode ? colours.dark.text : colours.light.text }}>
                    Client Name Lookup (Enquiries DB)
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3690CE' }} />
                  <Text style={{ fontSize: 13, color: isDarkMode ? colours.dark.text : colours.light.text }}>
                    Server-side Processing
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3690CE' }} />
                  <Text style={{ fontSize: 13, color: isDarkMode ? colours.dark.text : colours.light.text }}>
                    Client-side Caching
                  </Text>
                </div>
              </div>
            </div>

            {/* Enquiries Tab */}
            <div className={sectionStyle} style={{ borderLeft: '4px solid #15803d' }}>
              <div style={{ marginBottom: 12 }}>
                <Text style={{ fontWeight: 600, color: '#15803d', fontSize: 14 }}>ENQUIRIES TAB</Text>
                <Text style={{ fontSize: 12, color: isDarkMode ? colours.dark.subText : colours.light.subText }}>
                  Direct Connection
                </Text>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#15803d' }} />
                  <Text style={{ fontSize: 13, color: isDarkMode ? colours.dark.text : colours.light.text }}>
                    Direct Azure Function Call
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#15803d' }} />
                  <Text style={{ fontSize: 13, color: isDarkMode ? colours.dark.text : colours.light.text }}>
                    Complete Dataset Retrieved
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#15803d' }} />
                  <Text style={{ fontSize: 13, color: isDarkMode ? colours.dark.text : colours.light.text }}>
                    Immediate Rendering
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#15803d' }} />
                  <Text style={{ fontSize: 13, color: isDarkMode ? colours.dark.text : colours.light.text }}>
                    Proven Legacy Architecture
                  </Text>
                </div>
              </div>
            </div>
          </div>

          <Separator styles={{ root: { margin: '16px 0' } }} />

          {/* Technical Details */}
          <div className={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Icon iconName="Settings" style={{ fontSize: 16, color: '#3690CE' }} />
              <Text variant="medium" style={{ fontWeight: 600, color: isDarkMode ? colours.dark.text : colours.light.text }}>
                Technical Implementation
              </Text>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <Text style={{ fontWeight: 600, marginBottom: 8, color: isDarkMode ? colours.dark.text : colours.light.text }}>
                  Instructions Processing
                </Text>
                <Text style={{ fontSize: 13, lineHeight: 1.4, color: isDarkMode ? colours.dark.subText : colours.light.subText }}>
                  Multi-database lookups required because instruction records contain ProspectId references 
                  that need resolution to client names via cross-database queries.
                </Text>
              </div>
              <div>
                <Text style={{ fontWeight: 600, marginBottom: 8, color: isDarkMode ? colours.dark.text : colours.light.text }}>
                  Enquiries Direct Access
                </Text>
                <Text style={{ fontSize: 13, lineHeight: 1.4, color: isDarkMode ? colours.dark.subText : colours.light.subText }}>
                  Complete enquiry dataset available in single source. No cross-referencing needed, 
                  enabling direct Azure Function access with managed identity authentication.
                </Text>
              </div>
            </div>
          </div>

        </Stack>
      </div>
    );
  }

  const modalStyles = {
    main: {
      width: '90vw',
      maxWidth: 900,
      minHeight: '70vh',
      background: `linear-gradient(135deg, ${isDarkMode ? colours.dark.background : '#FFFFFF'} 0%, ${isDarkMode ? colours.dark.background : '#F8FAFC'} 100%)`,
      borderRadius: 12,
      padding: 0,
      border: isDarkMode ? '1px solid #444' : '1px solid #ddd',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
    }
  };

  const headerStyle = mergeStyles({
    background: 'transparent',
    padding: '20px 24px',
    borderBottom: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(0,0,0,0.06)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  });

  const contentStyle = mergeStyles({
    padding: '24px',
    maxHeight: 'calc(70vh - 80px)',
    overflowY: 'auto'
  });

  return (
    <Modal
      isOpen={isOpen}
      onDismiss={onClose}
      styles={modalStyles}
      dragOptions={undefined}
    >
      <div className={headerStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Icon iconName="Flow" style={{ fontSize: 20, color: '#3690CE' }} />
          <Text variant="xLarge" style={{ fontWeight: 600, color: '#3690CE' }}>
            Data Flow Analysis
          </Text>
        </div>
        <IconButton
          iconProps={{ iconName: 'ChromeClose' }}
          ariaLabel="Close analysis"
          onClick={onClose}
          styles={{
            root: {
              borderRadius: 6,
              width: 32,
              height: 32,
              color: isDarkMode ? '#a0aec0' : '#4a5568'
            },
            rootHovered: {
              background: isDarkMode ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'
            }
          }}
        />
      </div>

      <div className={contentStyle}>
        <Stack tokens={{ childrenGap: 20 }}>
          
          {/* Overview */}
          <div className={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Icon iconName="Info" style={{ fontSize: 16, color: '#3690CE' }} />
              <Text variant="medium" style={{ fontWeight: 600, color: isDarkMode ? colours.dark.text : colours.light.text }}>
                System Architecture Overview
              </Text>
            </div>
            <Text style={{ color: isDarkMode ? colours.dark.subText : colours.light.subText, lineHeight: 1.5 }}>
              The application uses two distinct data access patterns optimized for different use cases.
            </Text>
          </div>

          {/* Comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            
            {/* Instructions Tab */}
            <div className={sectionStyle} style={{ borderLeft: '4px solid #3690CE' }}>
              <div style={{ marginBottom: 12 }}>
                <Text style={{ fontWeight: 600, color: '#3690CE', fontSize: 14 }}>INSTRUCTIONS TAB</Text>
                <Text style={{ fontSize: 12, color: isDarkMode ? colours.dark.subText : colours.light.subText }}>
                  Complex Processing Pipeline
                </Text>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3690CE' }} />
                  <Text style={{ fontSize: 13, color: isDarkMode ? colours.dark.text : colours.light.text }}>
                    Instructions Database Query
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3690CE' }} />
                  <Text style={{ fontSize: 13, color: isDarkMode ? colours.dark.text : colours.light.text }}>
                    Client Name Lookup (Enquiries DB)
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3690CE' }} />
                  <Text style={{ fontSize: 13, color: isDarkMode ? colours.dark.text : colours.light.text }}>
                    Server-side Processing
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#3690CE' }} />
                  <Text style={{ fontSize: 13, color: isDarkMode ? colours.dark.text : colours.light.text }}>
                    Client-side Caching
                  </Text>
                </div>
              </div>
            </div>

            {/* Enquiries Tab */}
            <div className={sectionStyle} style={{ borderLeft: '4px solid #15803d' }}>
              <div style={{ marginBottom: 12 }}>
                <Text style={{ fontWeight: 600, color: '#15803d', fontSize: 14 }}>ENQUIRIES TAB</Text>
                <Text style={{ fontSize: 12, color: isDarkMode ? colours.dark.subText : colours.light.subText }}>
                  Direct Connection
                </Text>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#15803d' }} />
                  <Text style={{ fontSize: 13, color: isDarkMode ? colours.dark.text : colours.light.text }}>
                    Direct Azure Function Call
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#15803d' }} />
                  <Text style={{ fontSize: 13, color: isDarkMode ? colours.dark.text : colours.light.text }}>
                    Complete Dataset Retrieved
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#15803d' }} />
                  <Text style={{ fontSize: 13, color: isDarkMode ? colours.dark.text : colours.light.text }}>
                    Immediate Rendering
                  </Text>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#15803d' }} />
                  <Text style={{ fontSize: 13, color: isDarkMode ? colours.dark.text : colours.light.text }}>
                    Proven Legacy Architecture
                  </Text>
                </div>
              </div>
            </div>
          </div>

          <Separator styles={{ root: { margin: '16px 0' } }} />

          {/* Technical Details */}
          <div className={sectionStyle}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <Icon iconName="Settings" style={{ fontSize: 16, color: '#3690CE' }} />
              <Text variant="medium" style={{ fontWeight: 600, color: isDarkMode ? colours.dark.text : colours.light.text }}>
                Technical Implementation
              </Text>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
              <div>
                <Text style={{ fontWeight: 600, marginBottom: 8, color: isDarkMode ? colours.dark.text : colours.light.text }}>
                  Instructions Processing
                </Text>
                <Text style={{ fontSize: 13, lineHeight: 1.4, color: isDarkMode ? colours.dark.subText : colours.light.subText }}>
                  Multi-database lookups required because instruction records contain ProspectId references 
                  that need resolution to client names via cross-database queries.
                </Text>
              </div>
              <div>
                <Text style={{ fontWeight: 600, marginBottom: 8, color: isDarkMode ? colours.dark.text : colours.light.text }}>
                  Enquiries Direct Access
                </Text>
                <Text style={{ fontSize: 13, lineHeight: 1.4, color: isDarkMode ? colours.dark.subText : colours.light.subText }}>
                  Complete enquiry dataset available in single source. No cross-referencing needed, 
                  enabling direct Azure Function access with managed identity authentication.
                </Text>
              </div>
            </div>
          </div>

        </Stack>
      </div>
    </Modal>
  );
};

export default DataFlowWorkbench;
