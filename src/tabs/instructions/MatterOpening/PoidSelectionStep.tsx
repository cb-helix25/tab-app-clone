import React from 'react';
import { Stack } from '@fluentui/react';
import PoidCard from '../PoidCard';
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