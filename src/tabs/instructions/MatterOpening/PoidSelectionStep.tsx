import React from 'react';
import { Stack, PrimaryButton, Text } from '@fluentui/react';
import PoidCard from '../PoidCard';
import POIDPreview from '../PoidPreview';
import { sharedPrimaryButtonStyles } from '../../../app/styles/ButtonStyles';
import { POID, TeamData } from '../../../app/functionality/types';

interface PoidSelectionStepProps {
    poidData: POID[];
    teamData?: TeamData[] | null;
    filteredPoidData: POID[];
    visiblePoidCount: number;
    selectedPoidIds: string[];
    poidSearchTerm: string;
    setPoidSearchTerm: (v: string) => void;
    poidGridRef: React.RefObject<HTMLDivElement | null>;
    handlePoidClick: (p: POID) => void;
    onConfirm?: () => void;
}

const PoidSelectionStep: React.FC<PoidSelectionStepProps> = ({
    poidData,
    teamData,
    filteredPoidData,
    visiblePoidCount,
    selectedPoidIds,
    poidSearchTerm,
    setPoidSearchTerm,
    poidGridRef,
    handlePoidClick,
    onConfirm,
}) => (
    <Stack tokens={{ childrenGap: 12 }}>
        {/* Preview Section - Only shown when POIDs are selected */}
        {selectedPoidIds.length > 0 && (
            <Stack 
                className="poid-preview-section"
                styles={{ 
                    root: { 
                        marginBottom: 20,
                        padding: 16,
                        backgroundColor: '#f8f8f8',
                        border: '1px solid #e3e8ef'
                    } 
                }}
            >
                <Stack horizontal horizontalAlign="space-between">
                    <Text variant="mediumPlus" styles={{ root: { marginBottom: 10 } }}>Selected POID Preview</Text>
                    {onConfirm && (
                        <PrimaryButton
                            text="Confirm Client Selection"
                            onClick={onConfirm}
                            styles={{
                                root: {
                                    ...(sharedPrimaryButtonStyles.root as any),
                                    height: 36,
                                    padding: '0 12px',
                                    fontSize: 14,
                                },
                            }}
                        />
                    )}
                </Stack>
                
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {filteredPoidData
                        .filter((poid) => selectedPoidIds.includes(poid.poid_id))
                        .map((poid) => (
                            <div key={poid.poid_id} style={{ 
                                borderBottom: '1px solid #e1dfdd', 
                                paddingBottom: 8, 
                                marginBottom: 8 
                            }}>
                                <POIDPreview poid={poid} />
                            </div>
                        ))}
                </div>
            </Stack>
        )}
        
        {/* POID Grid - Changed from 3 to 2 columns with auto-fit to fill available space */}
        <div 
            style={{ 
                width: '100%',
                display: 'grid',
                gridTemplateColumns: 'repeat(2, minmax(250px, 1fr))',
                gap: '16px',
                justifyContent: 'space-between'
            }} 
            className="poid-grid" 
            ref={poidGridRef as any}
        >
            {filteredPoidData.slice(0, visiblePoidCount).map((poid) => (
                <div key={poid.poid_id} onClick={() => handlePoidClick(poid)} role="button" tabIndex={0}>
                    <PoidCard poid={poid} selected={selectedPoidIds.includes(poid.poid_id)} onClick={() => handlePoidClick(poid)} teamData={teamData} />
                </div>
            ))}
        </div>
    </Stack>
);

export default PoidSelectionStep;