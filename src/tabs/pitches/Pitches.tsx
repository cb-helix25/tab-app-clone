import React, { useState, useMemo } from 'react';
import { mergeStyles } from '@fluentui/react';
import { useTheme } from '../../app/functionality/ThemeContext';
import DealCard from '../instructions/DealCard';
// import { FollowUpEditor } from '../instructions/FollowUpEditor';

interface PitchesProps {
  instructionData: any[];
  userInitials: string;
  teamData: any[];
}

const Pitches: React.FC<PitchesProps> = ({ 
  instructionData, 
  userInitials,
  teamData
}) => {
  const { isDarkMode } = useTheme();
  const [selectedDealRef, setSelectedDealRef] = useState<string | null>(null);
  const [showOnlyMyDeals, setShowOnlyMyDeals] = useState(false);
  const [showClosedDeals, setShowClosedDeals] = useState(false);
  const [openFollowUpIdx, setOpenFollowUpIdx] = useState<number | null>(null);
  const [followUpContent, setFollowUpContent] = useState<string>("");

  // Extract deals from instruction data
  const deals = useMemo(() => {
    return instructionData.flatMap((prospect: any) => {
      return (prospect.deals ?? []).map((deal: any) => ({
        ...deal,
        // Add prospect info for context
        prospectId: prospect.prospectId,
        firstName: deal.firstName || prospect.firstName,
        lastName: deal.lastName || prospect.lastName,
        // Ensure we have team member info for filtering
        pitchedBy: deal.PitchedBy || deal.pitchedBy,
      }));
    });
  }, [instructionData]);

  // Filter deals based on current user and status
  const filteredDeals = useMemo(() => {
    let filtered = deals;

    // Filter by user if "Show Only Mine" is enabled
    if (showOnlyMyDeals && userInitials) {
      filtered = filtered.filter((deal) => {
        const pitchedBy = deal.pitchedBy || deal.PitchedBy;
        return pitchedBy && pitchedBy.toLowerCase().includes(userInitials.toLowerCase());
      });
    }

    // Filter by status (closed vs open)
    if (!showClosedDeals) {
      filtered = filtered.filter(deal => 
        String(deal.Status).toLowerCase() !== "closed"
      );
    }

    return filtered;
  }, [deals, showOnlyMyDeals, showClosedDeals, userInitials]);

  // Count deals by status
  const closedDealsCount = deals.filter(deal => 
    String(deal.Status).toLowerCase() === "closed"
  ).length;
  const openDealsCount = deals.length - closedDealsCount;

  const handleOpenInstruction = (ref: string) => {
    // Navigate to instructions if needed
    console.log('Navigate to instruction:', ref);
  };

  const handleSelectDeal = (ref: string) => {
    setSelectedDealRef(prev => prev === ref ? null : ref);
  };

  const handleClearSelection = () => {
    setSelectedDealRef(null);
  };

  const handleToggleMyDeals = () => {
    setShowOnlyMyDeals(!showOnlyMyDeals);
  };

  const gridContainerStyle = mergeStyles({
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    maxWidth: "100%",
    width: "100%",
    margin: "0 auto",
    boxSizing: "border-box",
  });

  return (
    <div>
      {/* Toggle Controls */}
      {!selectedDealRef && (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          marginBottom: '16px',
          padding: '8px 12px',
          backgroundColor: '#f8f9fa',
          borderRadius: '6px',
          border: '1px solid #e1dfdd'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#666' }}>
              {showClosedDeals ? `All Pitches (${deals.length})` : `Open Pitches (${openDealsCount})`}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Show Everyone's/Mine Toggle */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px', 
              fontSize: '0.85rem'
            }}>
              <span style={{ color: '#666' }}>
                {showOnlyMyDeals ? 'Show Mine' : 'Show Everyone\'s'}
              </span>
              <div
                onClick={handleToggleMyDeals}
                style={{
                  width: '36px',
                  height: '20px',
                  borderRadius: '10px',
                  backgroundColor: showOnlyMyDeals ? '#0078d4' : '#d1d1d1',
                  position: 'relative',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s ease',
                }}
              >
                <div
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: 'white',
                    position: 'absolute',
                    top: '2px',
                    left: showOnlyMyDeals ? '18px' : '2px',
                    transition: 'left 0.2s ease',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                />
              </div>
            </div>
            
            {/* Show Closed Deals Toggle */}
            {closedDealsCount > 0 && (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px', 
                fontSize: '0.85rem'
              }}>
                <span style={{ color: '#666' }}>Show closed pitches ({closedDealsCount})</span>
                <div
                  onClick={() => setShowClosedDeals(!showClosedDeals)}
                  style={{
                    width: '36px',
                    height: '20px',
                    borderRadius: '10px',
                    backgroundColor: showClosedDeals ? '#0078d4' : '#d1d1d1',
                    position: 'relative',
                    cursor: 'pointer',
                    transition: 'background-color 0.2s ease',
                  }}
                >
                  <div
                    style={{
                      width: '16px',
                      height: '16px',
                      borderRadius: '50%',
                      backgroundColor: 'white',
                      position: 'absolute',
                      top: '2px',
                      left: showClosedDeals ? '18px' : '2px',
                      transition: 'left 0.2s ease',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                    }}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <div className={gridContainerStyle}>
        {filteredDeals.map((deal, idx) => {
          const row = Math.floor(idx / 4);
          const col = idx % 4;
          const animationDelay = row * 0.2 + col * 0.1;
          const isClosed = String(deal.Status).toLowerCase() === "closed";
          const showFollowUpEditor = openFollowUpIdx === idx;
          
          return (
            <div key={idx} style={{ position: 'relative' }}>
              <DealCard
                deal={deal}
                animationDelay={animationDelay}
                onFollowUp={() => setOpenFollowUpIdx(idx)}
                teamData={null}
                userInitials={userInitials}
                isSingleView={selectedDealRef === deal.DealId}
                expanded={selectedDealRef === deal.InstructionRef}
                selected={selectedDealRef === deal.InstructionRef}
                onSelect={() => {
                  // Toggle selection: if already selected, unselect; otherwise select
                  if (selectedDealRef === deal.InstructionRef) {
                    handleClearSelection();
                  } else {
                    handleSelectDeal(deal.InstructionRef);
                  }
                }}
                isDarkMode={isDarkMode}
              />
              
              {/* Follow Up Editor - TODO: Create FollowUpEditor component */}
              {showFollowUpEditor && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'white',
                  border: '1px solid #ccc',
                  padding: '12px',
                  borderRadius: '4px',
                  zIndex: 10,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}>
                  <textarea
                    value={followUpContent}
                    onChange={(e) => setFollowUpContent(e.target.value)}
                    placeholder="Add follow up notes..."
                    style={{
                      width: '100%',
                      height: '60px',
                      border: '1px solid #ccc',
                      borderRadius: '3px',
                      padding: '8px',
                      resize: 'vertical'
                    }}
                  />
                  <div style={{ marginTop: '8px', display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => {
                        console.log('Saving follow up for deal:', deal.DealId, followUpContent);
                        setOpenFollowUpIdx(null);
                        setFollowUpContent("");
                      }}
                      style={{
                        background: '#0078d4',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setOpenFollowUpIdx(null);
                        setFollowUpContent("");
                      }}
                      style={{
                        background: '#f3f3f3',
                        color: '#333',
                        border: '1px solid #ccc',
                        padding: '6px 12px',
                        borderRadius: '3px',
                        cursor: 'pointer'
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        
        {filteredDeals.length === 0 && (
          <div style={{
            padding: '40px',
            textAlign: 'center',
            color: '#666',
            fontSize: '14px'
          }}>
            {showOnlyMyDeals 
              ? 'No pitches found for your deals.' 
              : showClosedDeals 
                ? 'No pitches found.' 
                : 'No open pitches found.'
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default Pitches;
