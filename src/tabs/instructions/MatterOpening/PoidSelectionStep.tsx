import React from 'react';
import { Stack, SearchBox, PrimaryButton, Text } from '@fluentui/react';
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
    <Stack tokens={{ childrenGap: 20 }}>
        <SearchBox
            placeholder="Search by name or ID..."
            value={poidSearchTerm}
            onChange={(_, newValue) => setPoidSearchTerm(newValue || '')}
            styles={{ root: { width: 400, marginBottom: 20 } }}
        />
        <Stack horizontal tokens={{ childrenGap: 20 }}>
            <div style={{ flex: 1 }} className="grid" ref={poidGridRef as any}>
                {filteredPoidData.slice(0, visiblePoidCount).map((poid) => (
                    <div key={poid.poid_id} onClick={() => handlePoidClick(poid)} role="button" tabIndex={0}>
                        <PoidCard poid={poid} selected={selectedPoidIds.includes(poid.poid_id)} onClick={() => handlePoidClick(poid)} teamData={teamData} />
                    </div>
                ))}
            </div>
            <Stack tokens={{ childrenGap: 8 }} styles={{ root: { width: 260 } }}>
                <Text variant="mediumPlus" styles={{ root: { marginBottom: 10 } }}>Preview</Text>
                {selectedPoidIds.length === 0 ? (
                    <Text variant="small">No POIDs selected.</Text>
                ) : (
                    filteredPoidData
                        .filter((poid) => selectedPoidIds.includes(poid.poid_id))
                        .map((poid) => (
                            <div key={poid.poid_id} style={{ borderBottom: '1px solid #e1dfdd', paddingBottom: 8, marginBottom: 8 }}>
                                <POIDPreview poid={poid} />
                            </div>
                        ))
                )}
                {onConfirm && (
                    <PrimaryButton
                        text="Confirm POID Selection"
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
        </Stack>
    </Stack>
);

export default PoidSelectionStep;