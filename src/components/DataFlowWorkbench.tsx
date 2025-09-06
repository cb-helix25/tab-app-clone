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
}

const DataFlowWorkbench: React.FC<DataFlowWorkbenchProps> = ({ isOpen, onClose }) => {
  const { isDarkMode } = useTheme();
  const [isMobile, setIsMobile] = React.useState(false);

  React.useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 900);
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const modalStyles = {
    main: {
      width: '90vw',
      maxWidth: 1200,
      minHeight: '80vh',
      background: isDarkMode ? colours.dark.background : colours.light.background,
      borderRadius: 16,
      padding: 0,
      border: isDarkMode ? '1px solid #444' : '1px solid #ddd',
    }
  };

  const headerStyle = mergeStyles({
    background: `linear-gradient(135deg, ${isDarkMode ? '#2a2d3a' : '#f8fafc'} 0%, ${isDarkMode ? '#1e212b' : '#ffffff'} 100%)`,
    padding: '20px 24px 16px 24px',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderBottom: isDarkMode ? '1px solid #444' : '1px solid #e1e5e9',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between'
  });

  const contentStyle = mergeStyles({
    padding: '24px',
    maxHeight: 'calc(80vh - 100px)',
    overflowY: 'auto'
  });

  const nodeStyle = mergeStyles({
    background: isDarkMode ? '#2a3441' : '#ffffff',
    border: isDarkMode ? '1px solid #4a5568' : '1px solid #cbd5e0',
    borderRadius: 12,
    padding: '16px 20px',
    marginBottom: 16,
    boxShadow: isDarkMode ? '0 4px 12px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.1)',
    transition: 'all 0.2s ease',
    selectors: {
      ':hover': {
        transform: 'translateY(-2px)',
        boxShadow: isDarkMode ? '0 8px 20px rgba(0,0,0,0.4)' : '0 8px 20px rgba(0,0,0,0.15)'
      }
    }
  });

  const flowArrowStyle = mergeStyles({
    textAlign: 'center',
    margin: '8px 0',
    color: isDarkMode ? '#718096' : '#4a5568'
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
          <Icon iconName="Flow" style={{ fontSize: 20, color: isDarkMode ? '#60a5fa' : '#3b82f6' }} />
          <Text variant="xLarge" style={{ fontWeight: 600, color: isDarkMode ? '#fff' : '#1a202c' }}>
            Data Flow Workbench
          </Text>
        </div>
        <IconButton
          iconProps={{ iconName: 'ChromeClose' }}
          ariaLabel="Close workbench"
          onClick={onClose}
          styles={{
            root: {
              borderRadius: 8,
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
        <Stack tokens={{ childrenGap: 24 }}>
          
          {/* Two Column Layout for Comparison */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', 
            gap: 32
          }}>
            
            {/* LEFT COLUMN - Instructions Tab Flow */}
            <div>
              <div style={{
                background: `linear-gradient(135deg, ${isDarkMode ? '#1e3a8a' : '#dbeafe'} 0%, ${isDarkMode ? '#1e40af' : '#bfdbfe'} 100%)`,
                padding: '16px 20px',
                borderRadius: 12,
                marginBottom: 20,
                textAlign: 'center'
              }}>
                <Icon iconName="DocumentSearch" style={{ fontSize: 24, color: isDarkMode ? '#60a5fa' : '#1d4ed8', marginBottom: 8 }} />
                <Text variant="large" style={{ 
                  fontWeight: 700, 
                  color: isDarkMode ? '#fff' : '#1e40af',
                  display: 'block'
                }}>
                  Instructions Tab
                </Text>
                <Text style={{ color: isDarkMode ? '#cbd5e0' : '#3730a3', fontSize: '13px' }}>
                  Complex flow for client name lookup
                </Text>
              </div>

              {/* Step 1 */}
              <div className={nodeStyle} style={{ borderLeft: '4px solid #1d4ed8' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ 
                    background: '#1d4ed8', 
                    color: 'white', 
                    borderRadius: '50%', 
                    width: 24, 
                    height: 24, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700
                  }}>1</div>
                  <Icon iconName="Database" style={{ color: '#1d4ed8', fontSize: 18 }} />
                  <Text variant="medium" style={{ fontWeight: 700, color: isDarkMode ? '#fff' : '#1a202c' }}>
                    Instructions Database
                  </Text>
                </div>
                <div style={{ paddingLeft: 36 }}>
                  <Text style={{ color: isDarkMode ? '#cbd5e0' : '#4a5568', fontSize: 13, lineHeight: 1.4 }}>
                    <strong>📍 instructions.database.windows.net</strong><br/>
                    📋 Tables: Instructions, Deals<br/>
                    🔑 Has: ProspectId (e.g., 27367), InstructionRef, Status<br/>
                    ❌ Missing: Client first/last names
                  </Text>
                </div>
              </div>

              <div style={{ textAlign: 'center', margin: '12px 0', color: isDarkMode ? '#60a5fa' : '#1d4ed8' }}>
                <Icon iconName="ChevronDown" style={{ fontSize: 20 }} />
                <Text style={{ fontSize: 11, fontWeight: 600 }}>LOOKUP REQUIRED</Text>
              </div>

              {/* Step 2 */}
              <div className={nodeStyle} style={{ borderLeft: '4px solid #7c3aed' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ 
                    background: '#7c3aed', 
                    color: 'white', 
                    borderRadius: '50%', 
                    width: 24, 
                    height: 24, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700
                  }}>2</div>
                  <Icon iconName="Database" style={{ color: '#7c3aed', fontSize: 18 }} />
                  <Text variant="medium" style={{ fontWeight: 700, color: isDarkMode ? '#fff' : '#1a202c' }}>
                    Enquiries Database
                  </Text>
                </div>
                <div style={{ paddingLeft: 36 }}>
                  <Text style={{ color: isDarkMode ? '#cbd5e0' : '#4a5568', fontSize: 13, lineHeight: 1.4 }}>
                    <strong>📍 helix-database-server.database.windows.net</strong><br/>
                    💾 Database: helix-core-data<br/>
                    🔍 Match: acid (ProspectId) = 27367<br/>
                    ✅ Get: first = "John", last = "Smith"
                  </Text>
                </div>
              </div>

              <div style={{ textAlign: 'center', margin: '12px 0', color: isDarkMode ? '#f59e0b' : '#d97706' }}>
                <Icon iconName="ChevronDown" style={{ fontSize: 20 }} />
                <Text style={{ fontSize: 11, fontWeight: 600 }}>SERVER PROCESSING</Text>
              </div>

              {/* Step 3 */}
              <div className={nodeStyle} style={{ borderLeft: '4px solid #f59e0b' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ 
                    background: '#f59e0b', 
                    color: 'white', 
                    borderRadius: '50%', 
                    width: 24, 
                    height: 24, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700
                  }}>3</div>
                  <Icon iconName="Globe" style={{ color: '#f59e0b', fontSize: 18 }} />
                  <Text variant="medium" style={{ fontWeight: 700, color: isDarkMode ? '#fff' : '#1a202c' }}>
                    Server Route
                  </Text>
                </div>
                <div style={{ paddingLeft: 36 }}>
                  <Text style={{ color: isDarkMode ? '#cbd5e0' : '#4a5568', fontSize: 13, lineHeight: 1.4 }}>
                    <strong>🔗 /server/enquiries-unified</strong><br/>
                    ⚡ Maps ProspectId → first + last<br/>
                    💨 Client-side caching for speed<br/>
                    🎯 Returns: "John Smith"
                  </Text>
                </div>
              </div>

              <div style={{ textAlign: 'center', margin: '12px 0', color: isDarkMode ? '#10b981' : '#059669' }}>
                <Icon iconName="ChevronDown" style={{ fontSize: 20 }} />
                <Text style={{ fontSize: 11, fontWeight: 600 }}>FINAL RESULT</Text>
              </div>

              {/* Result */}
              <div style={{
                background: `linear-gradient(135deg, ${isDarkMode ? '#064e3b' : '#d1fae5'} 0%, ${isDarkMode ? '#065f46' : '#a7f3d0'} 100%)`,
                border: isDarkMode ? '2px solid #10b981' : '2px solid #059669',
                borderRadius: 12,
                padding: '16px 20px',
                textAlign: 'center'
              }}>
                <Icon iconName="CheckMark" style={{ color: '#10b981', fontSize: 20, marginBottom: 8 }} />
                <Text style={{ fontWeight: 700, color: isDarkMode ? '#10b981' : '#059669', marginBottom: 4 }}>
                  InstructionCard displays:
                </Text>
                <Text style={{ fontSize: 16, fontWeight: 700, color: isDarkMode ? '#fff' : '#1a202c' }}>
                  "John Smith" ✅
                </Text>
                <Text style={{ fontSize: 12, color: isDarkMode ? '#94a3b8' : '#64748b' }}>
                  instead of "Prospect 27367"
                </Text>
              </div>
            </div>

            {/* RIGHT COLUMN - Enquiries Tab Flow */}
            <div>
              <div style={{
                background: `linear-gradient(135deg, ${isDarkMode ? '#7c2d12' : '#fed7aa'} 0%, ${isDarkMode ? '#9a3412' : '#fdba74'} 100%)`,
                padding: '16px 20px',
                borderRadius: 12,
                marginBottom: 20,
                textAlign: 'center'
              }}>
                <Icon iconName="Table" style={{ fontSize: 24, color: isDarkMode ? '#fb923c' : '#c2410c', marginBottom: 8 }} />
                <Text variant="large" style={{ 
                  fontWeight: 700, 
                  color: isDarkMode ? '#fff' : '#c2410c',
                  display: 'block'
                }}>
                  Enquiries Tab
                </Text>
                <Text style={{ color: isDarkMode ? '#fed7aa' : '#7c2d12', fontSize: '13px' }}>
                  Simple direct flow (legacy)
                </Text>
              </div>

              {/* Direct Azure Function */}
              <div className={nodeStyle} style={{ borderLeft: '4px solid #0078d4' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <div style={{ 
                    background: '#0078d4', 
                    color: 'white', 
                    borderRadius: '50%', 
                    width: 24, 
                    height: 24, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 700
                  }}>1</div>
                  <Icon iconName="AzureLogo" style={{ color: '#0078d4', fontSize: 18 }} />
                  <Text variant="medium" style={{ fontWeight: 700, color: isDarkMode ? '#fff' : '#1a202c' }}>
                    Azure Function
                  </Text>
                </div>
                <div style={{ paddingLeft: 36 }}>
                  <Text style={{ color: isDarkMode ? '#cbd5e0' : '#4a5568', fontSize: 13, lineHeight: 1.4 }}>
                    <strong>☁️ instructions-vnet-functions.azurewebsites.net</strong><br/>
                    🎯 Direct API call to /api/fetchEnquiriesData<br/>
                    📦 Returns complete enquiries dataset<br/>
                    ⚡ Raw data, no processing needed
                  </Text>
                </div>
              </div>

              <div style={{ textAlign: 'center', margin: '12px 0', color: isDarkMode ? '#ec4899' : '#be185d' }}>
                <Icon iconName="ChevronDown" style={{ fontSize: 20 }} />
                <Text style={{ fontSize: 11, fontWeight: 600 }}>DIRECT RENDERING</Text>
              </div>

              {/* Direct Display */}
              <div style={{
                background: `linear-gradient(135deg, ${isDarkMode ? '#831843' : '#fce7f3'} 0%, ${isDarkMode ? '#9d174d' : '#fbcfe8'} 100%)`,
                border: isDarkMode ? '2px solid #ec4899' : '2px solid #be185d',
                borderRadius: 12,
                padding: '16px 20px',
                textAlign: 'center'
              }}>
                <Icon iconName="Table" style={{ color: '#ec4899', fontSize: 20, marginBottom: 8 }} />
                <Text style={{ fontWeight: 700, color: isDarkMode ? '#ec4899' : '#be185d', marginBottom: 8 }}>
                  Enquiries.tsx
                </Text>
                <Text style={{ fontSize: 14, color: isDarkMode ? '#fce7f3' : '#831843', marginBottom: 4 }}>
                  ✅ Direct data display<br/>
                  ✅ Full enquiry management<br/>
                  ✅ Advanced filtering & creation
                </Text>
              </div>

              {/* Spacer to align with left column */}
              <div style={{ height: '140px' }} />

              {/* Why Different section for right column */}
              <div style={{
                background: isDarkMode ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)',
                border: isDarkMode ? '1px solid rgba(59, 130, 246, 0.3)' : '1px solid rgba(59, 130, 246, 0.2)',
                borderRadius: 12,
                padding: '16px 20px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                  <Icon iconName="Info" style={{ color: '#3b82f6', fontSize: 18 }} />
                  <Text variant="medium" style={{ fontWeight: 700, color: isDarkMode ? '#60a5fa' : '#1d4ed8' }}>
                    Why Keep This Simple?
                  </Text>
                </div>
                <Text style={{ color: isDarkMode ? '#cbd5e0' : '#4a5568', fontSize: 13, lineHeight: 1.5 }}>
                  🏛️ <strong>Legacy System:</strong> Already works perfectly<br/>
                  🚀 <strong>Performance:</strong> Direct connection is fastest<br/>
                  🔒 <strong>Security:</strong> Uses managed identity<br/>
                  📊 <strong>Complete Data:</strong> Full enquiry dataset available
                </Text>
              </div>
            </div>
          </div>

          <Separator styles={{ root: { margin: '24px 0' } }} />

          {/* Key Differences Summary */}
          <div style={{
            background: `linear-gradient(135deg, ${isDarkMode ? '#1e293b' : '#f8fafc'} 0%, ${isDarkMode ? '#0f172a' : '#ffffff'} 100%)`,
            border: isDarkMode ? '1px solid #334155' : '1px solid #e2e8f0',
            borderRadius: 16,
            padding: '24px'
          }}>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <Icon iconName="Compare" style={{ fontSize: 28, color: isDarkMode ? '#60a5fa' : '#3b82f6', marginBottom: 8 }} />
              <Text variant="xLarge" style={{ fontWeight: 700, color: isDarkMode ? '#fff' : '#1e293b' }}>
                Key Architecture Differences
              </Text>
            </div>

            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: 20 
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  background: isDarkMode ? '#1e40af' : '#dbeafe',
                  borderRadius: 12,
                  padding: '12px',
                  marginBottom: 12
                }}>
                  <Text style={{ fontWeight: 700, color: isDarkMode ? '#60a5fa' : '#1e40af' }}>
                    Instructions Tab
                  </Text>
                </div>
                <Text style={{ fontSize: 13, color: isDarkMode ? '#cbd5e0' : '#4a5568', lineHeight: 1.4 }}>
                  🔄 Multi-step data flow<br/>
                  🔍 Cross-database lookups<br/>
                  ⚡ Server-side processing<br/>
                  💾 Client-side caching
                </Text>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ 
                  background: isDarkMode ? '#9a3412' : '#fed7aa',
                  borderRadius: 12,
                  padding: '12px',
                  marginBottom: 12
                }}>
                  <Text style={{ fontWeight: 700, color: isDarkMode ? '#fb923c' : '#c2410c' }}>
                    Enquiries Tab
                  </Text>
                </div>
                <Text style={{ fontSize: 13, color: isDarkMode ? '#cbd5e0' : '#4a5568', lineHeight: 1.4 }}>
                  ⚡ Direct Azure Function<br/>
                  📦 Single data source<br/>
                  🎯 No processing required<br/>
                  🏛️ Proven legacy system
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
