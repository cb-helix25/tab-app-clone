import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Stack, PrimaryButton } from '@fluentui/react';
import MinimalSearchBox from './MinimalSearchBox';
import { POID, TeamData } from '../../../app/functionality/types';
import ClientDetails from '../ClientDetails';
import ClientHub from '../ClientHub';
import StepWrapper from './StepWrapper';
import '../../../app/styles/NewMatters.css';
import '../../../app/styles/MatterOpeningCard.css';
import {
    practiceAreasByArea,
    getGroupColor,
    partnerOptions as defaultPartners,
} from './config';
import localTeamDataJson from '../../../localData/team-sql-data.json';
import localUserData from '../../../localData/localUserData.json';

import ClientInfoStep from './ClientInfoStep';
import PoidSelectionStep from './PoidSelectionStep';
import AreaOfWorkStep from './AreaOfWorkStep';
import PracticeAreaStep from './PracticeAreaStep';
import DescriptionStep from './DescriptionStep';
import FolderStructureStep from './FolderStructureStep';
import ValueAndSourceStep from './ValueAndSourceStep';
import SourceStep from './SourceStep';
import OpponentDetailsStep from './OpponentDetailsStep';

import { CompletionProvider } from './CompletionContext';
import idVerifications from '../../../localData/localIdVerifications.json';
import { sharedPrimaryButtonStyles, sharedDefaultButtonStyles } from '../../../app/styles/ButtonStyles';
import { clearMatterOpeningDraft, completeMatterOpening } from '../../../app/functionality/matterOpeningUtils';

// Local implementation of useDraftedState for draft persistence
function useDraftedState<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] {
    const storageKey = `matterOpeningDraft_${key}`;
    const [state, setState] = useState<T>(() => {
        try {
            const item = localStorage.getItem(storageKey);
            if (!item) return initialValue;
            const parsed = JSON.parse(item);
            // Special handling for selectedDate: convert string to Date
            if (key === 'selectedDate') {
                if (parsed === null) return null as any;
                if (typeof parsed === 'string' || typeof parsed === 'number') {
                    const d = new Date(parsed);
                    return isNaN(d.getTime()) ? initialValue : (d as any);
                }
            }
            return parsed;
        } catch {
            return initialValue;
        }
    });
    useEffect(() => {
        try {
            // For selectedDate, store as ISO string
            if (key === 'selectedDate' && state instanceof Date) {
                localStorage.setItem(storageKey, JSON.stringify(state.toISOString()));
            } else {
                localStorage.setItem(storageKey, JSON.stringify(state));
            }
        } catch {}
    }, [state, storageKey]);
    return [state, setState];
}

interface FlatMatterOpeningProps {
    poidData?: POID[];
    setPoidData: React.Dispatch<React.SetStateAction<POID[]>>;
    teamData?: TeamData[] | null;
    userInitials: string;
    instructionRef?: string;
    clientId?: string;
    feeEarner?: string;
    stage?: string;
    matterRef?: string;
    hideClientSections?: boolean;
    initialClientType?: string;
}

const FlatMatterOpening: React.FC<FlatMatterOpeningProps> = ({
    poidData,
    setPoidData,
    teamData,
    userInitials,
    instructionRef = '',
    clientId = '',
    feeEarner,
    stage = 'New Matter',
    matterRef,
    hideClientSections = false,
    initialClientType = '',
}) => {
    const idExpiry = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toLocaleDateString('en-GB');
    }, []);

    const showPoidSelection = !instructionRef;
    const defaultPoidData: POID[] = useMemo(
        () =>
            (idVerifications as any[]).map((v) => ({
                poid_id: String(v.InternalId),
                first: v.FirstName,
                last: v.LastName,
                email: v.Email,
                nationality: v.Nationality,
                nationality_iso: v.NationalityAlpha2,
                date_of_birth: v.DOB,
                passport_number: v.PassportNumber,
                drivers_license_number: v.DriversLicenseNumber,
                house_building_number: v.HouseNumber,
                street: v.Street,
                city: v.City,
                county: v.County,
                post_code: v.Postcode,
                country: v.Country,
                country_code: v.CountryCode,
                company_name: v.company_name || v.CompanyName,
                company_number: v.company_number || v.CompanyNumber,
                company_house_building_number: v.company_house_building_number || v.CompanyHouseNumber,
                company_street: v.company_street || v.CompanyStreet,
                company_city: v.company_city || v.CompanyCity,
                company_county: v.company_county || v.CompanyCounty,
                company_post_code: v.company_post_code || v.CompanyPostcode,
                company_country: v.company_country || v.CompanyCountry,
                company_country_code: v.company_country_code || v.CompanyCountryCode,
                // Electronic ID verification fields
                stage: v.stage,
                check_result: v.EIDOverallResult,
                pep_sanctions_result: v.PEPAndSanctionsCheckResult,
                address_verification_result: v.AddressVerificationResult,
                check_expiry: v.CheckExpiry,
                check_id: v.EIDCheckId, // <-- Add this line to map EIDCheckId to check_id
                poc: v.poc,
                prefix: v.prefix,
                type: v.type,
                client_id: v.ClientId,
                matter_id: v.MatterId,
            })) as POID[],
        []
    );
    
    // Filter out any invalid POID entries that might be causing issues
    const validPoidData = useMemo(() => {
        return defaultPoidData.filter(poid => 
            // Ensure each POID has at least first and last name populated
            poid && poid.first && poid.last && 
            // Make sure it's not just a number
            isNaN(Number(poid.first)) && isNaN(Number(poid.last))
        );
    }, [defaultPoidData]);
    
    // Force use of only validated local POID data
    const effectivePoidData: POID[] = validPoidData;
        
    // Debug logging removed

    const [selectedDate, setSelectedDate] = useDraftedState<Date | null>('selectedDate', null);
    const localTeamData = useMemo(() => localTeamDataJson, []);
    const defaultPartnerOptions = defaultPartners;
    const partnerOptionsList = useMemo(() => {
        const activeTeam = teamData || localTeamData;
        if (activeTeam) {
            const names = activeTeam
                .filter((t) => (t.Role || '').toLowerCase().includes('partner'))
                .map((t) => t['Full Name'] || `${t.First || ''} ${t.Last || ''}`.trim())
                .filter(Boolean);
            return names.length ? names : defaultPartnerOptions;
        }
        return defaultPartnerOptions;
    }, [teamData, localTeamData]);
    
    const teamMemberOptions = useMemo(() => {
        const activeTeam = teamData || localTeamData;
        if (activeTeam) {
            return activeTeam
                .map((t) => t['Full Name'] || `${t.First || ''} ${t.Last || ''}`.trim())
                .filter(Boolean);
        }
        return [] as string[];
    }, [teamData, localTeamData]);
    
    const defaultTeamMember = useMemo(() => {
        const activeTeam = teamData || localTeamData;
        if (activeTeam && activeTeam.length > 0) {
            const found = activeTeam.find(
                (t) => (t.Initials || '').toLowerCase() === userInitials.toLowerCase(),
            );
            if (found) {
                return found['Full Name'] || `${found.First || ''} ${found.Last || ''}`.trim();
            }
            const first = activeTeam[0];
            return first['Full Name'] || `${first.First || ''} ${first.Last || ''}`.trim();
        }
        return '';
    }, [teamData, localTeamData, userInitials]);

    const [teamMember, setTeamMember] = useDraftedState<string>('teamMember', defaultTeamMember);
    useEffect(() => setTeamMember(defaultTeamMember), [defaultTeamMember]);
    const [supervisingPartner, setSupervisingPartner] = useDraftedState<string>('supervisingPartner', '');
    const [originatingSolicitor, setOriginatingSolicitor] = useDraftedState<string>('originatingSolicitor', defaultTeamMember);
    useEffect(() => setOriginatingSolicitor(defaultTeamMember), [defaultTeamMember]);
    // Removed fundsReceived state
    const [isDateCalloutOpen, setIsDateCalloutOpen] = useState(false); // UI only, not persisted
    const dateButtonRef = useRef<HTMLDivElement | null>(null);

    // Client type selection is now a page-level qualifying question
    const clientTypes = [
        'Individual',
        'Company',
        'Multiple Individuals',
        'Existing Client',
    ];
    const [clientType, setClientType] = useDraftedState<string>('clientType', initialClientType || '');
    useEffect(() => setClientType(initialClientType || ''), [initialClientType]);

    const [selectedPoidIds, setSelectedPoidIds] = useDraftedState<string[]>('selectedPoidIds', []);
    const [areaOfWork, setAreaOfWork] = useDraftedState<string>('areaOfWork', '');
    const [practiceArea, setPracticeArea] = useDraftedState<string>('practiceArea', '');
    const [description, setDescription] = useDraftedState<string>('description', '');
    const [folderStructure, setFolderStructure] = useDraftedState<string>('folderStructure', '');
    const [disputeValue, setDisputeValue] = useDraftedState<string>('disputeValue', '');
    // Preselect "Search" as the default value for the source field
    const [source, setSource] = useDraftedState<string>('source', 'search');
    const [referrerName, setReferrerName] = useDraftedState<string>('referrerName', '');
    const [opponentName, setOpponentName] = useDraftedState<string>('opponentName', '');
    const [opponentEmail, setOpponentEmail] = useDraftedState<string>('opponentEmail', '');
    const [opponentSolicitorName, setOpponentSolicitorName] = useDraftedState<string>('opponentSolicitorName', '');
    const [opponentSolicitorCompany, setOpponentSolicitorCompany] = useDraftedState<string>('opponentSolicitorCompany', '');
    const [opponentSolicitorEmail, setOpponentSolicitorEmail] = useDraftedState<string>('opponentSolicitorEmail', '');
    const [noConflict, setNoConflict] = useDraftedState<boolean>('noConflict', false);
    const [opponentChoiceMade, setOpponentChoiceMade] = useDraftedState<boolean>('opponentChoiceMade', false);
    const [jsonPreviewOpen, setJsonPreviewOpen] = useState(false); // UI only, not persisted

    // Opponent fields
    const [opponentTitle, setOpponentTitle] = useDraftedState<string>('opponentTitle', '');
    const [opponentFirst, setOpponentFirst] = useDraftedState<string>('opponentFirst', '');
    const [opponentLast, setOpponentLast] = useDraftedState<string>('opponentLast', '');
    const [opponentPhone, setOpponentPhone] = useDraftedState<string>('opponentPhone', '');
    const [opponentAddress, setOpponentAddress] = useDraftedState<string>('opponentAddress', '');
    const [opponentHasCompany, setOpponentHasCompany] = useDraftedState<boolean>('opponentHasCompany', false);
    const [opponentCompanyName, setOpponentCompanyName] = useDraftedState<string>('opponentCompanyName', '');
    const [opponentCompanyNumber, setOpponentCompanyNumber] = useDraftedState<string>('opponentCompanyNumber', '');
    // Solicitor fields
    const [solicitorTitle, setSolicitorTitle] = useDraftedState<string>('solicitorTitle', '');
    const [solicitorFirst, setSolicitorFirst] = useDraftedState<string>('solicitorFirst', '');
    const [solicitorLast, setSolicitorLast] = useDraftedState<string>('solicitorLast', '');
    const [solicitorPhone, setSolicitorPhone] = useDraftedState<string>('solicitorPhone', '');
    const [solicitorAddress, setSolicitorAddress] = useDraftedState<string>('solicitorAddress', '');
    const [solicitorCompanyNumber, setSolicitorCompanyNumber] = useDraftedState<string>('solicitorCompanyNumber', '');

    // Summary review confirmation state
    const [summaryConfirmed, setSummaryConfirmed] = useDraftedState<boolean>('summaryConfirmed', false);

    const [visiblePoidCount, setVisiblePoidCount] = useState(12); // UI only, not persisted
    const [poidSearchTerm, setPoidSearchTerm] = useState(''); // UI only, not persisted
    const [searchBoxFocused, setSearchBoxFocused] = useState(false);
    const poidGridRef = useRef<HTMLDivElement | null>(null);
    const [activePoid, setActivePoid] = useDraftedState<POID | null>('activePoid', null);

    const filteredPoidData = effectivePoidData.filter((poid) => {
        const term = poidSearchTerm.toLowerCase();
        return (
            poid.poid_id.toLowerCase().includes(term) ||
            (poid.first && poid.first.toLowerCase().includes(term)) ||
            (poid.last && poid.last.toLowerCase().includes(term))
        );
    });

    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0].isIntersecting) {
                    setVisiblePoidCount((prev) => Math.min(prev + 12, filteredPoidData.length));
                }
            },
            { rootMargin: '200px' }
        );
        if (poidGridRef.current) observer.observe(poidGridRef.current);
        return () => observer.disconnect();
    }, [filteredPoidData]);

    const handlePoidClick = (poid: POID) => {
        const isSingleSelectionType = pendingClientType !== 'Multiple Individuals';
        if (selectedPoidIds.includes(poid.poid_id)) {
            setSelectedPoidIds((prev: string[]) => prev.filter((id: string) => id !== poid.poid_id));
            if (activePoid && activePoid.poid_id === poid.poid_id) {
                const remaining = effectivePoidData.find((p) => selectedPoidIds.includes(p.poid_id) && p.poid_id !== poid.poid_id);
                setActivePoid(remaining || null);
            }
        } else {
            if (isSingleSelectionType) {
                setSelectedPoidIds([poid.poid_id]);
                setActivePoid(poid);
            } else {
                setSelectedPoidIds((prev: string[]) => [...prev, poid.poid_id]);
                setActivePoid(poid);
            }
        }
        setSearchBoxFocused(false); // Collapse search box after selection
        setPoidSearchTerm(''); // Optionally clear search term
    };

    // Helper to get nickname from localUserData
    function getLocalUserNickname(userInitials: string): string {
        if (!userInitials) return '';
        const found = (localUserData as any[]).find(
            (u) => (u.Initials || '').toLowerCase() === userInitials.toLowerCase()
        );
        return found ? found.Nickname || found.First || found['Full Name'] || '' : '';
    }

    // Helper to get nickname from team data
    function getTeamNickname(userInitials: string, teamData: any[]): string {
        if (!userInitials || !teamData) return '';
        const found = teamData.find(
            (u) => (u.Initials || '').toLowerCase() === userInitials.toLowerCase()
        );
        return found ? found.Nickname || found.First || found['Full Name'] || '' : '';
    }

    // Helper to get partner initials (both initials for partners)
    function getPartnerInitials(teamData: any[]): string[] {
        if (!teamData) return [];
        return teamData
            .filter((member: any) => member.Role === 'Partner')
            .map((member: any) => member.Initials || member['Initials'] || '')
            .filter(Boolean);
    }

    // Determine requesting user nickname based on environment
    const requestingUserNickname =
        process.env.NODE_ENV === 'production'
            ? getTeamNickname(userInitials, teamData || localTeamDataJson)
            : getLocalUserNickname(userInitials);

    // Horizontal sliding carousel approach
    const [currentStep, setCurrentStep] = useDraftedState<number>('currentStep', 0); // 0: select, 1: form, 2: review
    const [pendingClientType, setPendingClientType] = useDraftedState<string>('pendingClientType', '');

    // Calculate completion percentages for progressive dots
    const calculateClientStepCompletion = (): number => {
        let filledFields = 0;
        let totalFields = 3; // clientType, selectedPoidIds, and opponent details
        
        if (pendingClientType && pendingClientType.trim() !== '') filledFields++;
        if (selectedPoidIds.length > 0) filledFields++;
        
        // Check opponent details completion
        const hasOpponentInfo = (opponentName && opponentName.trim() !== '') || 
                               (opponentFirst && opponentFirst.trim() !== '' && opponentLast && opponentLast.trim() !== '');
        const hasDisputeValue = disputeValue && disputeValue.trim() !== '';
        
        if (hasOpponentInfo && hasDisputeValue) filledFields++;
        
        return totalFields > 0 ? (filledFields / totalFields) * 100 : 0;
    };

    const calculateMatterStepCompletion = (): number => {
        let filledFields = 0;
        let totalFields = 10; // Reduced from 13 since opponent details moved to client step
        
        // Required fields - check for meaningful values, not just existence
        if (selectedDate !== null) filledFields++; // Date has been set
        if (supervisingPartner && supervisingPartner.trim() !== '') filledFields++;
        if (originatingSolicitor && originatingSolicitor.trim() !== '' && originatingSolicitor !== defaultTeamMember) filledFields++;
        if (areaOfWork && areaOfWork.trim() !== '') filledFields++;
        if (practiceArea && practiceArea.trim() !== '') filledFields++;
        if (description && description.trim() !== '') filledFields++;
        if (folderStructure && folderStructure.trim() !== '') filledFields++;
        if (source && source.trim() !== '' && source !== 'search') filledFields++; // 'search' is default
        if (noConflict === true) filledFields++; // Only count if explicitly checked
        if (referrerName && referrerName.trim() !== '') filledFields++; // Optional field
        
        const completion = totalFields > 0 ? (filledFields / totalFields) * 100 : 0;
        
        // Debug logging - remove this after fixing
        if (filledFields > 0) {
            console.log('Matter step filled fields:', filledFields, 'out of', totalFields, 'completion:', completion + '%');
            console.log('Debug values:', {
                selectedDate: selectedDate !== null,
                supervisingPartner: supervisingPartner && supervisingPartner.trim() !== '',
                originatingSolicitor: originatingSolicitor && originatingSolicitor.trim() !== '' && originatingSolicitor !== defaultTeamMember,
                source: source && source.trim() !== '' && source !== 'search',
                noConflict: noConflict === true,
                defaultTeamMember,
                originatingSolicitorValue: originatingSolicitor,
                sourceValue: source
            });
        }
        
        return completion;
    };

    const calculateReviewStepCompletion = (): number => {
        // Review step is considered complete when user has reviewed the data
        return currentStep === 2 ? 100 : 0;
    };

    const getClientDotState = (): number => {
        const completion = calculateClientStepCompletion();
        if (completion === 100) return 3;
        if (completion >= 50) return 2;
        if (completion > 0) return 1;
        return 0;
    };

    const getMatterDotState = (): number => {
        const completion = calculateMatterStepCompletion();
        if (completion === 100) return 3;
        if (completion >= 50) return 2;
        if (completion > 0) return 1;
        return 0;
    };

    const getReviewDotState = (): number => {
        const completion = calculateReviewStepCompletion();
        if (completion === 100) return 3;
        if (completion >= 50) return 2;
        if (completion > 0) return 1;
        return 0;
    };

    // Helper function to get dot color based on state
    const getDotColor = (state: number): string => {
        switch (state) {
            case 3: return '#20b26c'; // Complete - full green
            case 2: return '#20b26c'; // 50%+ filled - full green
            case 1: return '#20b26c'; // First field filled - full green
            case 0: 
            default: return '#e0e0e0'; // Empty - gray
        }
    };

    // Progressive dots across workflow steps
    const getProgressiveDotStates = (): [number, number, number] => {
        const hasClientType = pendingClientType && pendingClientType.trim() !== '';
        const hasPoidSelection = selectedPoidIds.length > 0;
        const hasOpponentInfo = (opponentName && opponentName.trim() !== '') || 
                               (opponentFirst && opponentFirst.trim() !== '' && opponentLast && opponentLast.trim() !== '');
        const hasDisputeValue = disputeValue && disputeValue.trim() !== '';
        const hasNoConflictCheck = noConflict === true; // Must be explicitly checked
        const matterCompletion = calculateMatterStepCompletion();
        const reviewCompletion = calculateReviewStepCompletion();
        
        // Check if opponent choice has been made (either "I have details" or "I'll enter later")
        const opponentQuestionsComplete = opponentChoiceMade === true;
        
        let clientDots = 0;
        let matterDots = 0;
        let reviewDots = 0;
        
        // First dot: lights up when client type is selected
        if (hasClientType) {
            clientDots = 3;
        }
        
        // Second dot: lights up when POID is selected  
        if (hasClientType && hasPoidSelection) {
            matterDots = 3;
        }
        
        // Third dot: lights up when opponent choice has been made (no specific fields required)
        if (hasClientType && hasPoidSelection && opponentQuestionsComplete) {
            reviewDots = 3;
        }
        
        return [clientDots, matterDots, reviewDots];
    };

    // Determine completion status for each step
    const clientsStepComplete = selectedPoidIds.length > 0 && pendingClientType;
    const matterStepComplete = selectedDate && supervisingPartner && originatingSolicitor && areaOfWork && practiceArea && description;
    const reviewStepComplete = false; // Review step doesn't have a "next" - it's the final step

    const handleContinueToForm = () => {
        if (selectedPoidIds.length > 0 && pendingClientType) {
            setClientType(pendingClientType);
            setCurrentStep(1);
            // Scroll to top when changing steps
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const handleGoToReview = () => {
        setCurrentStep(2);
        // Scroll to top when changing steps
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBackToClients = () => {
        setCurrentStep(0);
        // Scroll to top when changing steps
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleBackToForm = () => {
        setCurrentStep(1);
        setSummaryConfirmed(false); // Reset confirmation when going back to edit
        // Scroll to top when changing steps
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleClientTypeChange = (newType: string, shouldLimitToSingle: boolean) => {
        // Always clear POID selection when switching between Individual and Company (or vice versa)
        if (
            (newType === 'Individual' && selectedPoidIds.length > 0) ||
            (newType === 'Company' && selectedPoidIds.length > 0) ||
            (newType === 'Multiple Individuals' && selectedPoidIds.length > 1)
        ) {
            setSelectedPoidIds([]);
        }
        setSearchBoxFocused(false); // Collapse search box after client type selection
        setPoidSearchTerm(''); // Optionally clear search term
    };

    // Helper to generate sample JSON object
    const generateSampleJson = () => {
        const selectedClients = selectedPoidIds.map((id: string) => {
            const client = effectivePoidData.find(p => p.poid_id === id);
            return client ? {
                poid_id: client.poid_id,
                first_name: client.first,
                last_name: client.last,
                email: client.email,
                type: client.type || 'individual',
                nationality: client.nationality,
                date_of_birth: client.date_of_birth,
                address: {
                    house_number: client.house_building_number,
                    street: client.street,
                    city: client.city,
                    county: client.county,
                    post_code: client.post_code,
                    country: client.country
                },
                company_details: client.company_name ? {
                    name: client.company_name,
                    number: client.company_number,
                    address: {
                        house_number: client.company_house_building_number,
                        street: client.company_street,
                        city: client.company_city,
                        county: client.company_county,
                        post_code: client.company_post_code,
                        country: client.company_country
                    }
                } : null,
                verification: {
                    stage: client.stage,
                    check_result: client.check_result,
                    pep_sanctions_result: client.pep_sanctions_result,
                    address_verification_result: client.address_verification_result,
                    check_expiry: client.check_expiry,
                    check_id: client.check_id
                }
            } : null;
        }).filter(Boolean);

        return {
            matter_details: {
                instruction_ref: instructionRef || null,
                client_id: clientId || null,
                matter_ref: matterRef || null,
                stage: stage,
                date_created: selectedDate ? selectedDate.toISOString().split('T')[0] : null,
                client_type: clientType,
                area_of_work: areaOfWork,
                practice_area: practiceArea,
                description: description,
                dispute_value: disputeValue || null,
                folder_structure: folderStructure || null
            },
            team_assignments: {
                fee_earner: teamMember,
                supervising_partner: supervisingPartner,
                originating_solicitor: originatingSolicitor,
                requesting_user: requestingUserNickname
            },
            client_information: selectedClients,
            source_details: {
                source: source,
                referrer_name: source === 'referral' ? referrerName : null
            },
            opponent_details: opponentName ? {
                name: opponentName,
                email: opponentEmail || null,
                solicitor: {
                    name: opponentSolicitorName || null,
                    company: opponentSolicitorCompany || null,
                    email: opponentSolicitorEmail || null
                }
            } : null,
            compliance: {
                conflict_check_completed: noConflict,
                id_verification_required: true,
                pep_sanctions_check_required: true
            },
            metadata: {
                created_by: userInitials,
                created_at: new Date().toISOString(),
                form_version: "1.0",
                processing_status: "pending_review"
            }
        };
    };

    // Helper function to check if there's any data to clear
    const hasDataToClear = () => {
        return selectedPoidIds.length > 0 || pendingClientType || poidSearchTerm || 
               areaOfWork || practiceArea || description || disputeValue || 
               source !== 'search' || referrerName || folderStructure ||
               opponentName || opponentEmail || opponentSolicitorName || 
               opponentSolicitorCompany || opponentSolicitorEmail ||
               opponentTitle || opponentFirst || opponentLast || opponentPhone ||
               opponentAddress || opponentHasCompany || opponentCompanyName ||
               opponentCompanyNumber || solicitorTitle || solicitorFirst ||
               solicitorLast || solicitorPhone || solicitorAddress ||
               solicitorCompanyNumber || summaryConfirmed || noConflict ||
               (selectedDate && selectedDate.getTime() !== new Date().setHours(0,0,0,0)) ||
               teamMember !== defaultTeamMember || supervisingPartner ||
               originatingSolicitor !== defaultTeamMember;
    };

    // Count the number of filled fields for the clear button
    const getFieldCount = () => {
        let count = 0;
        if (selectedPoidIds.length > 0) count++;
        if (pendingClientType) count++;
        if (areaOfWork) count++;
        if (practiceArea) count++;
        if (description) count++;
        if (disputeValue) count++;
        if (source !== 'search') count++;
        if (referrerName) count++;
        if (folderStructure) count++;
        if (opponentName || opponentEmail || opponentSolicitorName) count++;
        if (summaryConfirmed) count++;
        if (selectedDate && selectedDate.getTime() !== new Date().setHours(0,0,0,0)) count++;
        if (teamMember !== defaultTeamMember) count++;
        if (supervisingPartner) count++;
        if (originatingSolicitor !== defaultTeamMember) count++;
        return count;
    };

    // Clear all selections and inputs
    const handleClearAll = () => {
        if (hasDataToClear() && !window.confirm('Are you sure you want to clear all form data? This action cannot be undone.')) {
            return;
        }
        
        // Clear all the React state
        setSelectedDate(null);
        setTeamMember(defaultTeamMember);
        setSupervisingPartner('');
        setOriginatingSolicitor(defaultTeamMember);
        setClientType(initialClientType || '');
        setPendingClientType(''); // This will reset the client dots
        setSelectedPoidIds([]); // This will reset the client dots
        setAreaOfWork('');
        setPracticeArea('');
        setDescription('');
        setFolderStructure('');
        setDisputeValue('');
        setSource('search');
        setReferrerName('');
        setOpponentName('');
        setOpponentEmail('');
        setOpponentSolicitorName('');
        setOpponentSolicitorCompany('');
        setOpponentSolicitorEmail('');
        setNoConflict(false);
        setOpponentChoiceMade(false);
        setOpponentTitle('');
        setOpponentFirst('');
        setOpponentLast('');
        setOpponentPhone('');
        setOpponentAddress('');
        setOpponentHasCompany(false);
        setOpponentCompanyName('');
        setOpponentCompanyNumber('');
        setSolicitorTitle('');
        setSolicitorFirst('');
        setSolicitorLast('');
        setSolicitorPhone('');
        setSolicitorAddress('');
        setSolicitorCompanyNumber('');
        setSummaryConfirmed(false); // Reset summary confirmation
        setActivePoid(null);
        setCurrentStep(0); // This will reset the review dots
        setPoidSearchTerm('');
        
        // Clear all localStorage draft data
        clearMatterOpeningDraft();
    };

    // Render the horizontal sliding carousel
    return (
        <CompletionProvider>
            <Stack className="workflow-container">
                {!hideClientSections && (
                    <>
                        <ClientDetails stage={stage} instructionRef={instructionRef} />
                        <ClientHub
                            instructionRef={instructionRef}
                            clientId={clientId}
                            feeEarner={feeEarner}
                            idExpiry={idExpiry}
                            idVerified={false}
                            matterRef={matterRef}
                        />
                    </>
                )}
                {/* Main Container */}
                <div className="workflow-main matter-opening-card">
                    {/* Persistent Header */}
                    <div className="persistent-header" style={{ 
                        padding: '20px 32px',
                        borderBottom: '1px solid #e1e5e9',
                        background: '#fff',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 16
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
                            {/* Navigation breadcrumbs */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14 }}>
                                <button 
                                    onClick={handleBackToClients}
                                    style={{ 
                                        background: 'none', 
                                        border: 'none', 
                                        color: currentStep === 0 ? '#3690CE' : '#666',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '8px 12px',
                                        borderRadius: 6,
                                        transition: 'all 0.2s ease',
                                        fontWeight: currentStep === 0 ? 600 : 400,
                                        backgroundColor: currentStep === 0 ? '#e3f0fc' : 'transparent'
                                    }}
                                >
                                    {clientsStepComplete && currentStep !== 0 ? (
                                        <div className="completion-tick visible" style={{ 
                                            marginRight: 4,
                                            width: 16,
                                            height: 16,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '50%',
                                            background: '#fff',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                                            color: '#20b26c',
                                            border: '2px solid #f8f8f8'
                                        }}>
                                            <svg width="10" height="8" viewBox="0 0 24 24" fill="none">
                                                <polyline points="5,13 10,18 19,7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                    ) : (
                                        <i className="ms-Icon ms-Icon--People" style={{ fontSize: 16 }} />
                                    )}
                                    Select Parties
                                </button>
                                
                                {/* Progressive dots connector */}
                                <div style={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    margin: '0 4px'
                                }}>
                                    <div style={{ 
                                        width: '4px', 
                                        height: '4px', 
                                        borderRadius: '50%', 
                                        background: getDotColor(getProgressiveDotStates()[0]),
                                        transition: 'background-color 0.3s ease'
                                    }} />
                                    <div style={{ 
                                        width: '4px', 
                                        height: '4px', 
                                        borderRadius: '50%', 
                                        background: getDotColor(getProgressiveDotStates()[1]),
                                        transition: 'background-color 0.3s ease'
                                    }} />
                                    <div style={{ 
                                        width: '4px', 
                                        height: '4px', 
                                        borderRadius: '50%', 
                                        background: getDotColor(getProgressiveDotStates()[2]),
                                        transition: 'background-color 0.3s ease'
                                    }} />
                                </div>
                                
                                <button 
                                    onClick={handleBackToForm}
                                    disabled={currentStep === 0}
                                    style={{ 
                                        background: 'none', 
                                        border: 'none', 
                                        color: currentStep === 1 ? '#3690CE' : currentStep === 0 ? '#ccc' : '#666',
                                        cursor: currentStep === 0 ? 'not-allowed' : 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8,
                                        padding: '8px 12px',
                                        borderRadius: 6,
                                        transition: 'all 0.2s ease',
                                        fontWeight: currentStep === 1 ? 600 : 400,
                                        backgroundColor: currentStep === 1 ? '#e3f0fc' : 'transparent'
                                    }}
                                >
                                    {matterStepComplete && currentStep !== 1 ? (
                                        <div className="completion-tick visible" style={{ 
                                            marginRight: 4,
                                            width: 16,
                                            height: 16,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            borderRadius: '50%',
                                            background: '#fff',
                                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
                                            color: '#20b26c',
                                            border: '2px solid #f8f8f8'
                                        }}>
                                            <svg width="10" height="8" viewBox="0 0 24 24" fill="none">
                                                <polyline points="5,13 10,18 19,7" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                                            </svg>
                                        </div>
                                    ) : (
                                        <i className="ms-Icon ms-Icon--OpenFolderHorizontal" style={{ fontSize: 16 }} />
                                    )}
                                    Build Matter
                                </button>
                                
                                {/* Modern connector */}
                                <div style={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 4,
                                    margin: '0 4px'
                                }}>
                                    <div style={{ 
                                        width: '4px', 
                                        height: '4px', 
                                        borderRadius: '50%', 
                                        background: '#e0e0e0'
                                    }} />
                                    <div style={{ 
                                        width: '4px', 
                                        height: '4px', 
                                        borderRadius: '50%', 
                                        background: '#e8e8e8'
                                    }} />
                                    <div style={{ 
                                        width: '4px', 
                                        height: '4px', 
                                        borderRadius: '50%', 
                                        background: '#e0e0e0'
                                    }} />
                                </div>
                                
                                <div style={{ 
                                    color: currentStep === 2 ? '#3690CE' : '#666',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    padding: '8px 12px',
                                    borderRadius: 6,
                                    fontWeight: currentStep === 2 ? 600 : 400,
                                    backgroundColor: currentStep === 2 ? '#e3f0fc' : 'transparent',
                                    transition: 'all 0.2s ease'
                                }}>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', verticalAlign: 'middle' }}>
                                        <path d="M1 12C2.73 7.61 7.11 4.5 12 4.5c4.89 0 9.27 3.11 11 7.5-1.73 4.39-6.11 7.5-11 7.5-4.89 0-9.27-3.11-11-7.5z" stroke="currentColor" strokeWidth="2" fill="none"/>
                                        <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" fill="none"/>
                                    </svg>
                                    Review and Confirm
                                </div>
                            </div>
                        </div>

                        {/* Right side controls */}
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 8
                        }}>
                            {/* POID search - only in step 0 with POID selection AND client type selected */}
                            {currentStep === 0 && showPoidSelection && pendingClientType && (
                                <>
                                    {/* MinimalSearchBox - hide when Individual/Company has selection */}
                                    {!(
                                        (pendingClientType === 'Individual' || pendingClientType === 'Company') && 
                                        selectedPoidIds.length > 0
                                    ) && (
                                        <div style={{ 
                                            position: 'relative',
                                            animation: 'cascadeSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                                            animationDelay: '0ms',
                                            opacity: 0,
                                            transform: 'translateX(20px)'
                                        }}>
                                            <MinimalSearchBox
                                                value={poidSearchTerm}
                                                onChange={setPoidSearchTerm}
                                                focused={searchBoxFocused}
                                                onRequestOpen={() => setSearchBoxFocused(true)}
                                                onRequestClose={() => setSearchBoxFocused(false)}
                                            />
                                        </div>
                                    )}
                                </>
                            )}
                            
                            {/* Global Clear button - always available when there's something to clear */}
                            {hasDataToClear() && (
                                <button 
                                    type="button" 
                                    onClick={handleClearAll} 
                                    style={{
                                        background: '#fff',
                                        border: '1px solid #e1e5e9',
                                        borderRadius: 0,
                                        padding: '8px 16px',
                                        fontSize: 14,
                                        fontWeight: 500,
                                        color: '#D65541',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 1px 2px rgba(6,23,51,0.04)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        fontFamily: 'Raleway, sans-serif'
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#ffefed';
                                        e.currentTarget.style.borderColor = '#D65541';
                                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(214,85,65,0.08)';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#fff';
                                        e.currentTarget.style.borderColor = '#e1e5e9';
                                        e.currentTarget.style.boxShadow = '0 1px 2px rgba(6,23,51,0.04)';
                                    }}                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                                            <path 
                                                d="M3 6h18m-2 0v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4c0-1 1-2 2-2h4c0-1 1-2 2-2v2m-6 5v6m4-6v6" 
                                                stroke="currentColor" 
                                                strokeWidth="2" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        Clear All
                                        {getFieldCount() > 0 && (
                                            <span style={{
                                                background: '#D65541',
                                                color: '#fff',
                                                borderRadius: '50%',
                                                width: '18px',
                                                height: '18px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontSize: '10px',
                                                fontWeight: 600,
                                                marginLeft: '2px'
                                            }}>
                                                {getFieldCount()}
                                            </span>
                                        )}
                                    </button>
                            )}
                        </div>
                    </div>

                    {/* CSS animations for search controls */}
                    <style>{`
                        @keyframes cascadeSlideIn {
                            from {
                                opacity: 0;
                                transform: translateX(20px);
                            }
                            to {
                                opacity: 1;
                                transform: translateX(0);
                            }
                        }
                        
                        @keyframes cascadeSlideOut {
                            from {
                                opacity: 1;
                                transform: translateX(0);
                            }
                            to {
                                opacity: 0;
                                transform: translateX(20px);
                            }
                        }
                        
                        /* Opponent details slide in animation */
                        @keyframes slideInFromTop {
                            from {
                                opacity: 0;
                                transform: translateY(20px);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }
                        
                        /* Smooth exit animation when controls disappear */
                        .search-controls-exit {
                            animation: cascadeSlideOut 0.3s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                        }
                    `}</style>

                    {/* Add CSS animation for completion ticks */}
                    <style>{`
                        @keyframes tickPop {
                            from {
                                opacity: 0;
                                transform: scale(0);
                            }
                            to {
                                opacity: 1;
                                transform: scale(1);
                            }
                        }
                        
                        .completion-tick {
                            animation: tickPop 0.3s ease;
                        }
                        
                        .completion-tick.visible {
                            opacity: 1;
                            transform: scale(1);
                        }
                    `}</style>

                    {/* Sliding Container */}
                    <div style={{ 
                        overflow: 'hidden',
                        position: 'relative',
                        width: '100%',
                        minHeight: '500px'
                    }}>
                        <div style={{ 
                            display: 'flex',
                            width: '300%', // 3 panels * 100% each
                            transform: `translateX(-${currentStep * 33.333}%)`,
                            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            height: '100%'
                        }}>
                            
                            {/* Step 1: Client Selection */}
                            <div style={{ width: '33.333%', padding: '32px', boxSizing: 'border-box' }}>
                                <div style={{ width: '100%', maxWidth: 1080, margin: '0 auto 32px auto' }}>
                                    <PoidSelectionStep
                                        poidData={effectivePoidData}
                                        teamData={teamData}
                                        filteredPoidData={filteredPoidData}
                                        visiblePoidCount={visiblePoidCount}
                                        selectedPoidIds={selectedPoidIds}
                                        poidSearchTerm={poidSearchTerm}
                                        setPoidSearchTerm={setPoidSearchTerm}
                                        poidGridRef={poidGridRef}
                                        handlePoidClick={handlePoidClick}
                                        pendingClientType={pendingClientType}
                                        setPendingClientType={setPendingClientType}
                                        onClientTypeChange={handleClientTypeChange}
                                    />
                                </div>
                                
                                {/* Opponent Details Step - appears after POID selection */}
                                {(selectedPoidIds.length > 0 && pendingClientType) && (
                                    <div style={{ 
                                        width: '100%', 
                                        maxWidth: 1080, 
                                        margin: '32px auto 0 auto',
                                        animation: 'cascadeSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                                        animationDelay: '0ms',
                                        opacity: 0,
                                        transform: 'translateY(20px)'
                                    }}>
                                        <OpponentDetailsStep
                                            opponentName={opponentName}
                                            setOpponentName={setOpponentName}
                                            opponentEmail={opponentEmail}
                                            setOpponentEmail={setOpponentEmail}
                                            opponentSolicitorName={opponentSolicitorName}
                                            setOpponentSolicitorName={setOpponentSolicitorName}
                                            opponentSolicitorCompany={opponentSolicitorCompany}
                                            setOpponentSolicitorCompany={setOpponentSolicitorCompany}
                                            opponentSolicitorEmail={opponentSolicitorEmail}
                                            setOpponentSolicitorEmail={setOpponentSolicitorEmail}
                                            noConflict={noConflict}
                                            setNoConflict={setNoConflict}
                                            disputeValue={disputeValue}
                                            setDisputeValue={setDisputeValue}
                                            opponentTitle={opponentTitle}
                                            setOpponentTitle={setOpponentTitle}
                                            opponentFirst={opponentFirst}
                                            setOpponentFirst={setOpponentFirst}
                                            opponentLast={opponentLast}
                                            setOpponentLast={setOpponentLast}
                                            opponentPhone={opponentPhone}
                                            setOpponentPhone={setOpponentPhone}
                                            opponentAddress={opponentAddress}
                                            setOpponentAddress={setOpponentAddress}
                                            opponentHasCompany={opponentHasCompany}
                                            setOpponentHasCompany={setOpponentHasCompany}
                                            opponentCompanyName={opponentCompanyName}
                                            setOpponentCompanyName={setOpponentCompanyName}
                                            opponentCompanyNumber={opponentCompanyNumber}
                                            setOpponentCompanyNumber={setOpponentCompanyNumber}
                                            solicitorTitle={solicitorTitle}
                                            setSolicitorTitle={setSolicitorTitle}
                                            solicitorFirst={solicitorFirst}
                                            setSolicitorFirst={setSolicitorFirst}
                                            solicitorLast={solicitorLast}
                                            setSolicitorLast={setSolicitorLast}
                                            solicitorPhone={solicitorPhone}
                                            setSolicitorPhone={setSolicitorPhone}
                                            solicitorAddress={solicitorAddress}
                                            setSolicitorAddress={setSolicitorAddress}
                                            solicitorCompanyNumber={solicitorCompanyNumber}
                                            setSolicitorCompanyNumber={setSolicitorCompanyNumber}
                                            opponentChoiceMade={opponentChoiceMade}
                                            setOpponentChoiceMade={setOpponentChoiceMade}
                                        />
                                    </div>
                                )}
                                
                                {/* Continue Button */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 32 }}>
                                    <div
                                        className="nav-button forward-button"
                                        onClick={opponentChoiceMade ? handleContinueToForm : undefined}
                                        aria-disabled={!opponentChoiceMade}
                                        tabIndex={opponentChoiceMade ? 0 : -1}
                                        style={{
                                            background: '#f4f4f6',
                                            border: '2px solid #e1dfdd',
                                            borderRadius: '0px',
                                            width: '48px',
                                            height: '48px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: opponentChoiceMade ? 'pointer' : 'not-allowed',
                                            opacity: opponentChoiceMade ? 1 : 0.5,
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: '0 1px 2px rgba(6,23,51,0.04)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            pointerEvents: opponentChoiceMade ? 'auto' : 'none',
                                        }}
                                        onMouseEnter={opponentChoiceMade ? (e) => {
                                            e.currentTarget.style.background = '#ffefed';
                                            e.currentTarget.style.border = '2px solid #D65541';
                                            e.currentTarget.style.borderRadius = '0px';
                                            e.currentTarget.style.width = '220px';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(214,85,65,0.08)';
                                        } : undefined}
                                        onMouseLeave={opponentChoiceMade ? (e) => {
                                            e.currentTarget.style.background = '#f4f4f6';
                                            e.currentTarget.style.border = '2px solid #e1dfdd';
                                            e.currentTarget.style.borderRadius = '0px';
                                            e.currentTarget.style.width = '48px';
                                            e.currentTarget.style.boxShadow = '0 1px 2px rgba(6,23,51,0.04)';
                                        } : undefined}
                                    >
                                        {/* Arrow Icon */}
                                        <svg
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            style={{
                                                transition: 'color 0.3s, opacity 0.3s',
                                                color: '#D65541',
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                        >
                                            <path
                                                d="M5 12h14m-7-7l7 7-7 7"
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>

                                        {/* Expandable Text */}
                                        <span
                                            style={{
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                color: '#D65541',
                                                opacity: 0,
                                                transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                whiteSpace: 'nowrap',
                                            }}
                                            className="nav-text"
                                        >
                                            Continue to Matter Details
                                        </span>
                                    </div>
                                    <style>{`
                                        .nav-button:hover .nav-text {
                                            opacity: 1 !important;
                                        }
                                        .nav-button:hover svg {
                                            opacity: 0 !important;
                                        }
                                    `}</style>
                                </div>
                            </div>

                            {/* Step 2: Matter Form */}
                            <div style={{ width: '33.333%', padding: '32px', boxSizing: 'border-box' }}>
                                <ClientInfoStep
                                    selectedDate={selectedDate}
                                    setSelectedDate={setSelectedDate}
                                    teamMember={teamMember}
                                    setTeamMember={setTeamMember}
                                    teamMemberOptions={teamMemberOptions}
                                    supervisingPartner={supervisingPartner}
                                    setSupervisingPartner={setSupervisingPartner}
                                    originatingSolicitor={originatingSolicitor}
                                    setOriginatingSolicitor={setOriginatingSolicitor}
                                    isDateCalloutOpen={isDateCalloutOpen}
                                    setIsDateCalloutOpen={setIsDateCalloutOpen}
                                    dateButtonRef={dateButtonRef}
                                    partnerOptions={getPartnerInitials(teamData || localTeamDataJson)}
                                    requestingUser={requestingUserNickname}
                                />
                                <Stack tokens={{ childrenGap: 24 }} style={{ marginTop: 24 }}>
                                    <AreaOfWorkStep
                                        areaOfWork={areaOfWork}
                                        setAreaOfWork={setAreaOfWork}
                                        getGroupColor={getGroupColor}
                                        onContinue={function (): void {} }
                                    />
                                    <PracticeAreaStep
                                        options={areaOfWork && practiceAreasByArea[areaOfWork] ? practiceAreasByArea[areaOfWork] : ['Please select an Area of Work']}
                                        practiceArea={practiceArea}
                                        setPracticeArea={setPracticeArea}
                                        areaOfWork={areaOfWork}
                                        onContinue={function (): void {} }
                                    />
                                    <DescriptionStep
                                        description={description}
                                        setDescription={setDescription}
                                        matterRefPreview={(() => {
                                            // Only show if a single POID is selected and client type is set
                                            if (!pendingClientType || selectedPoidIds.length === 0) return '';
                                            // For Individual or Company, use the first selected POID
                                            const poid = effectivePoidData.find(p => p.poid_id === selectedPoidIds[0]);
                                            if (!poid) return '';
                                            let base = '';
                                            if (pendingClientType === 'Individual') {
                                                base = (poid.last || '').toUpperCase();
                                            } else if (pendingClientType === 'Company') {
                                                base = (poid.company_name || '').toUpperCase();
                                            } else {
                                                // For Multiple Individuals or Existing Client, fallback to last name or company
                                                base = (poid.last || poid.company_name || '').toUpperCase();
                                            }
                                            // Take first 5 chars, pad with X if less
                                            let ref = base.slice(0, 5).padEnd(5, 'X');
                                            return ref + '-0001';
                                        })()}
                                    />
                                    <ValueAndSourceStep
                                        disputeValue={disputeValue}
                                        setDisputeValue={setDisputeValue}
                                        source={source}
                                        setSource={setSource}
                                        referrerName={referrerName}
                                        setReferrerName={setReferrerName}
                                        onContinue={() => {}}
                                    />
                                    <hr style={{ border: 'none', borderTop: '1px solid #e3e8ef', margin: '1rem 0', width: '100%' }} />
                                    <FolderStructureStep
                                        folderStructure={folderStructure}
                                        setFolderStructure={setFolderStructure}
                                        folderOptions={['Default / Commercial', 'Adjudication', 'Residential Possession', 'Employment']}
                                        onContinue={function (): void {} }
                                    />
                                </Stack>
                                {/* Navigation buttons for form step */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
                                    {/* Back button with smooth expansion */}
                                    <div 
                                        className="nav-button back-button"
                                        onClick={handleBackToClients}
                                        style={{
                                            background: '#f4f4f6',
                                            border: '2px solid #e1dfdd',
                                            borderRadius: '0px',
                                            width: '48px',
                                            height: '48px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: '0 1px 2px rgba(6,23,51,0.04)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#ffefed';
                                            e.currentTarget.style.border = '2px solid #D65541';
                                            e.currentTarget.style.borderRadius = '0px';
                                            e.currentTarget.style.width = '160px';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(214,85,65,0.08)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#f4f4f6';
                                            e.currentTarget.style.border = '2px solid #e1dfdd';
                                            e.currentTarget.style.borderRadius = '0px';
                                            e.currentTarget.style.width = '48px';
                                            e.currentTarget.style.boxShadow = '0 1px 2px rgba(6,23,51,0.04)';
                                        }}
                                    >
                                        {/* Arrow Icon */}
                                        <svg 
                                            width="18" 
                                            height="18" 
                                            viewBox="0 0 24 24" 
                                            fill="none"
                                            style={{
                                                transition: 'color 0.3s, opacity 0.3s',
                                                color: '#D65541',
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                        >
                                            <path 
                                                d="M19 12h-14m7 7l-7-7 7-7" 
                                                stroke="currentColor" 
                                                strokeWidth="2" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        
                                        {/* Expandable Text */}
                                        <span 
                                            style={{
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                color: '#D65541',
                                                opacity: 0,
                                                transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                whiteSpace: 'nowrap',
                                            }}
                                            className="nav-text"
                                        >
                                            Back to Clients
                                        </span>
                                    </div>

                                    {/* Forward button with smooth expansion */}
                                    <div 
                                        className="nav-button forward-button"
                                        onClick={handleGoToReview}
                                        style={{
                                            background: '#f4f4f6',
                                            border: '2px solid #e1dfdd',
                                            borderRadius: '0px',
                                            width: '48px',
                                            height: '48px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: '0 1px 2px rgba(6,23,51,0.04)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#ffefed';
                                            e.currentTarget.style.border = '2px solid #D65541';
                                            e.currentTarget.style.borderRadius = '0px';
                                            e.currentTarget.style.width = '160px';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(214,85,65,0.08)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#f4f4f6';
                                            e.currentTarget.style.border = '2px solid #e1dfdd';
                                            e.currentTarget.style.borderRadius = '0px';
                                            e.currentTarget.style.width = '48px';
                                            e.currentTarget.style.boxShadow = '0 1px 2px rgba(6,23,51,0.04)';
                                        }}
                                    >
                                        {/* Arrow Icon */}
                                        <svg 
                                            width="18" 
                                            height="18" 
                                            viewBox="0 0 24 24" 
                                            fill="none"
                                            style={{
                                                transition: 'color 0.3s, opacity 0.3s',
                                                color: '#D65541',
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                        >
                                            <path 
                                                d="M5 12h14m-7-7l7 7-7 7" 
                                                stroke="currentColor" 
                                                strokeWidth="2" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        
                                        {/* Expandable Text */}
                                        <span 
                                            style={{
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                color: '#D65541',
                                                opacity: 0,
                                                transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                whiteSpace: 'nowrap',
                                            }}
                                            className="nav-text"
                                        >
                                            Review Summary
                                        </span>
                                    </div>
                                    
                                    <style>{`
                                        .nav-button:hover .nav-text {
                                            opacity: 1 !important;
                                        }
                                        .nav-button:hover svg {
                                            opacity: 0 !important;
                                        }
                                    `}</style>
                                </div>
                            </div>

                            {/* Step 3: Review Summary */}
                            <div style={{ width: '33.333%', padding: '32px', boxSizing: 'border-box' }}>
                                <div
                                    className="review-summary-box review-summary-hoverable"
                                    onClick={() => setSummaryConfirmed(true)}
                                    style={{
                                        border: summaryConfirmed ? '2px solid #49B670' : '2px solid #D65541',
                                        borderRadius: 0,
                                        background: summaryConfirmed ? '#f5fdf7' : '#fff',
                                        padding: 24,
                                        margin: '0 0 32px 0',
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        transition: 'border-color 0.2s, background 0.2s',
                                        cursor: summaryConfirmed ? 'default' : 'pointer',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                        <h4 style={{ 
                                            margin: 0, 
                                            fontWeight: 600, 
                                            fontSize: 18, 
                                            color: summaryConfirmed ? '#15803d' : '#061733',
                                            animation: 'cascadeSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                                            animationDelay: '0ms',
                                            opacity: 0,
                                            transform: 'translateX(20px)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8
                                        }}>
                                            {summaryConfirmed && (
                                                <i className="ms-Icon ms-Icon--CheckMark" style={{ 
                                                    fontSize: 16, 
                                                    color: '#22c55e'
                                                }} />
                                            )}
                                            Review Summary {summaryConfirmed ? '- Confirmed' : ''}
                                        </h4>
                                        <button
                                            onClick={() => setJsonPreviewOpen(!jsonPreviewOpen)}
                                            style={{
                                                background: '#f8f9fa',
                                                border: '1px solid #e1dfdd',
                                                borderRadius: 6,
                                                padding: '8px 12px',
                                                fontSize: 12,
                                                fontWeight: 500,
                                                color: '#3690CE',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 6,
                                                transition: 'background 0.2s ease, border-color 0.2s ease',
                                                animation: 'cascadeSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                                                animationDelay: '150ms',
                                                opacity: 0,
                                                transform: 'translateX(20px)'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#e7f1ff';
                                                e.currentTarget.style.borderColor = '#3690CE';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#f8f9fa';
                                                e.currentTarget.style.borderColor = '#e1dfdd';
                                            }}
                                        >
                                            <i className="ms-Icon ms-Icon--Code" style={{ fontSize: 12 }} />
                                            {jsonPreviewOpen ? 'Hide JSON' : 'View JSON'}
                                        </button>
                                    </div>
                                    
                                    {/* JSON Preview Panel */}
                                    {jsonPreviewOpen && (
                                        <div style={{
                                            marginBottom: 24,
                                            border: '1px solid #e1dfdd',
                                            borderRadius: 6,
                                            background: '#f8f9fa',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                padding: '12px 16px',
                                                background: '#2d3748',
                                                color: '#fff',
                                                fontSize: 12,
                                                fontWeight: 600,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <span>Sample JSON Output</span>
                                                <button
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(JSON.stringify(generateSampleJson(), null, 2));
                                                    }}
                                                    style={{
                                                        background: 'rgba(255,255,255,0.1)',
                                                        border: '1px solid rgba(255,255,255,0.2)',
                                                        borderRadius: 4,
                                                        padding: '4px 8px',
                                                        fontSize: 10,
                                                        color: '#fff',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 4
                                                    }}
                                                >
                                                    <i className="ms-Icon ms-Icon--Copy" style={{ fontSize: 10 }} />
                                                    Copy
                                                </button>
                                            </div>
                                            <div style={{
                                                padding: 16,
                                                maxHeight: 400,
                                                overflow: 'auto',
                                                fontSize: 11,
                                                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                                                lineHeight: 1.4,
                                                background: '#fff'
                                            }}>
                                                <pre style={{ 
                                                    margin: 0, 
                                                    whiteSpace: 'pre-wrap',
                                                    wordBreak: 'break-word'
                                                }}>
                                                    {JSON.stringify(generateSampleJson(), null, 2)}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {/* Client Information Section */}
                                    <div style={{ marginBottom: 24 }}>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 8, 
                                            marginBottom: 12,
                                            paddingBottom: 8,
                                            borderBottom: '1px solid #f0f0f0'
                                        }}>
                                            <i className="ms-Icon ms-Icon--People" style={{ fontSize: 14, color: '#3690CE' }} />
                                            <span style={{ fontSize: 14, fontWeight: 600, color: '#3690CE' }}>Client Information</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, paddingLeft: 22 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Type:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13 }}>{clientType || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Client(s):</span>
                                                <div style={{ textAlign: 'right', maxWidth: '60%' }}>
                                                    {selectedPoidIds && selectedPoidIds.length > 0 ? (
                                                        selectedPoidIds.map((id: string, index: number) => {
                                                            const client = effectivePoidData.find(p => p.poid_id === id);
                                                            return (
                                                                <div key={id} style={{ fontSize: 13, fontWeight: 500, marginBottom: index < selectedPoidIds.length - 1 ? 4 : 0 }}>
                                                                    {client ? `${client.first} ${client.last}` : id}
                                                                </div>
                                                            );
                                                        })
                                                    ) : (
                                                        <span style={{ fontSize: 13, fontWeight: 500 }}>-</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Matter Details Section */}
                                    <div style={{ marginBottom: 24 }}>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 8, 
                                            marginBottom: 12,
                                            paddingBottom: 8,
                                            borderBottom: '1px solid #f0f0f0'
                                        }}>
                                            <i className="ms-Icon ms-Icon--OpenFolderHorizontal" style={{ fontSize: 14, color: '#3690CE' }} />
                                            <span style={{ fontSize: 14, fontWeight: 600, color: '#3690CE' }}>Matter Details</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, paddingLeft: 22 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Area of Work:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13, maxWidth: '60%', textAlign: 'right' }}>{areaOfWork || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Practice Area:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13, maxWidth: '60%', textAlign: 'right' }}>{practiceArea || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Description:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13, maxWidth: '60%', textAlign: 'right', lineHeight: '1.4' }}>
                                                    {description ? (description.length > 50 ? `${description.substring(0, 50)}...` : description) : '-'}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Dispute Value:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13 }}>{disputeValue || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Team & Management Section */}
                                    <div style={{ marginBottom: 24 }}>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 8, 
                                            marginBottom: 12,
                                            paddingBottom: 8,
                                            borderBottom: '1px solid #f0f0f0'
                                        }}>
                                            <i className="ms-Icon ms-Icon--ContactCard" style={{ fontSize: 14, color: '#3690CE' }} />
                                            <span style={{ fontSize: 14, fontWeight: 600, color: '#3690CE' }}>Team & Management</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, paddingLeft: 22 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Date:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13 }}>{selectedDate ? selectedDate.toLocaleDateString() : '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Solicitor:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13, maxWidth: '60%', textAlign: 'right' }}>{teamMember || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Supervising Partner:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13, maxWidth: '60%', textAlign: 'right' }}>{supervisingPartner || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Originating Solicitor:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13, maxWidth: '60%', textAlign: 'right' }}>{originatingSolicitor || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Additional Information Section */}
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 8, 
                                            marginBottom: 12,
                                            paddingBottom: 8,
                                            borderBottom: '1px solid #f0f0f0'
                                        }}>
                                            <i className="ms-Icon ms-Icon--Info" style={{ fontSize: 14, color: '#3690CE' }} />
                                            <span style={{ fontSize: 14, fontWeight: 600, color: '#3690CE' }}>Additional Details</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, paddingLeft: 22 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Source:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13, maxWidth: '60%', textAlign: 'right' }}>
                                                    {source}{source === 'referral' && referrerName ? ` - ${referrerName}` : ''}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Folder Structure:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13, maxWidth: '60%', textAlign: 'right' }}>{folderStructure || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Opponent Details Section */}
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 8, 
                                            marginBottom: 12,
                                            paddingBottom: 8,
                                            borderBottom: '1px solid #f0f0f0'
                                        }}>
                                            <i className="ms-Icon ms-Icon--Contact" style={{ fontSize: 14, color: '#3690CE' }} />
                                            <span style={{ fontSize: 14, fontWeight: 600, color: '#3690CE' }}>Opponent Details</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, padding: '0 0 8px 22px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Company Name:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13 }}>{opponentCompanyName || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Company Number:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13 }}>{opponentCompanyNumber || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Has Company:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13 }}>{opponentHasCompany ? 'Yes' : 'No'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Title:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13 }}>{opponentTitle || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>First Name:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13 }}>{opponentFirst || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Last Name:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13 }}>{opponentLast || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Email:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13 }}>{opponentEmail || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Phone:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13 }}>{opponentPhone || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Address:</span>
                                                <span style={{ fontWeight:  500, fontSize: 13 }}>{opponentAddress || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* ...removed duplicate Value/Dispute Value section... */}

                                    {/* Opponent Solicitor Details Section */}
                                    <div style={{ marginBottom: 16 }}>
                                        <div style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 8, 
                                            marginBottom: 12,
                                            paddingBottom: 8,
                                            borderBottom: '1px solid #f0f0f0'
                                        }}>
                                            <i className="ms-Icon ms-Icon--Legal" style={{ fontSize: 14, color: '#3690CE' }} />
                                            <span style={{ fontSize: 14, fontWeight: 600, color: '#3690CE' }}>Opponent Solicitor Details</span>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 8, paddingLeft: 22 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Company Name:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13 }}>{opponentSolicitorCompany || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Company Number:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13 }}>{solicitorCompanyNumber || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Title:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13 }}>{solicitorTitle || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>First Name:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13 }}>{solicitorFirst || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Last Name:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13 }}>{solicitorLast || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Email:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13 }}>{opponentSolicitorEmail || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Phone:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13 }}>{solicitorPhone || '-'}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ color: '#666', fontSize: 13 }}>Address:</span>
                                                <span style={{ fontWeight: 500, fontSize: 13 }}>{solicitorAddress || '-'}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Conflict Check Status */}
                                    <div style={{ 
                                        marginTop: 16,
                                        padding: 12,
                                        background: noConflict ? '#f0f9f4' : '#fef2f2',
                                        border: `1px solid ${noConflict ? '#d1fae5' : '#fecaca'}`,
                                        borderRadius: 6,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8
                                    }}>
                                        <i className={`ms-Icon ms-Icon--${noConflict ? 'CheckMark' : 'Warning'}`} 
                                           style={{ fontSize: 14, color: noConflict ? '#22c55e' : '#ef4444' }} />
                                        <span style={{ fontSize: 13, fontWeight: 500, color: noConflict ? '#15803d' : '#dc2626' }}>
                                            {noConflict ? 'No conflicts confirmed' : 'Conflict check required'}
                                        </span>
                                    </div>

                                    {/* Confirmation required banner */}
                                    {!summaryConfirmed && (
                                        <div style={{ 
                                            marginTop: 16,
                                            padding: 12,
                                            background: '#fef2f2',
                                            border: '1px solid #D65541',
                                            borderRadius: 0,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8
                                        }}>
                                            <i className="ms-Icon ms-Icon--Touch" 
                                               style={{ fontSize: 14, color: '#D65541' }} />
                                            <span style={{ fontSize: 13, fontWeight: 500, color: '#D65541' }}>
                                                Click anywhere in this box to confirm these details are accurate
                                            </span>
                                        </div>
                                    )}
                                </div>
                                {/* Navigation buttons for review step */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 32 }}>
                                    {/* Back button with smooth expansion */}
                                    <div 
                                        className="nav-button back-button"
                                        onClick={handleBackToForm}
                                        style={{
                                            background: '#f4f4f6',
                                            border: '2px solid #e1dfdd',
                                            borderRadius: '0px',
                                            width: '48px',
                                            height: '48px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: 'pointer',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: '0 1px 2px rgba(6,23,51,0.04)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.background = '#ffefed';
                                            e.currentTarget.style.border = '2px solid #D65541';
                                            e.currentTarget.style.borderRadius = '0px';
                                            e.currentTarget.style.width = '140px';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(214,85,65,0.08)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.background = '#f4f4f6';
                                            e.currentTarget.style.border = '2px solid #e1dfdd';
                                            e.currentTarget.style.borderRadius = '0px';
                                            e.currentTarget.style.width = '48px';
                                            e.currentTarget.style.boxShadow = '0 1px 2px rgba(6,23,51,0.04)';
                                        }}
                                    >
                                        {/* Arrow Icon */}
                                        <svg 
                                            width="18" 
                                            height="18" 
                                            viewBox="0 0 24 24" 
                                            fill="none"
                                            style={{
                                                transition: 'color 0.3s, opacity 0.3s',
                                                color: '#D65541',
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                        >
                                            <path 
                                                d="M19 12h-14m7 7l-7-7 7-7" 
                                                stroke="currentColor" 
                                                strokeWidth="2" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        
                                        {/* Expandable Text */}
                                        <span 
                                            style={{
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                color: '#D65541',
                                                opacity: 0,
                                                transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                whiteSpace: 'nowrap',
                                            }}
                                            className="nav-text"
                                        >
                                            Back to Form
                                        </span>
                                    </div>

                                    {/* Submit button with smooth expansion */}
                                    <div 
                                        className="nav-button submit-button"
                                        onClick={() => {
                                            if (summaryConfirmed) {
                                                // Handle form submission here
                                                console.log('Form submitted!');
                                                // Mark the matter opening as completed
                                                completeMatterOpening();
                                                // TODO: Add actual form submission logic here
                                            }
                                        }}
                                        style={{
                                            background: summaryConfirmed ? '#f4f4f6' : '#f8f8f8',
                                            border: summaryConfirmed ? '2px solid #e1dfdd' : '2px solid #ddd',
                                            borderRadius: '0px',
                                            width: '48px',
                                            height: '48px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: summaryConfirmed ? 'pointer' : 'not-allowed',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: summaryConfirmed ? '0 1px 2px rgba(6,23,51,0.04)' : 'none',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            opacity: summaryConfirmed ? 1 : 0.5,
                                        }}
                                        onMouseEnter={(e) => {
                                            if (summaryConfirmed) {
                                                e.currentTarget.style.background = '#ffefed';
                                                e.currentTarget.style.border = '2px solid #D65541';
                                                e.currentTarget.style.borderRadius = '0px';
                                                e.currentTarget.style.width = '160px';
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(214,85,65,0.08)';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (summaryConfirmed) {
                                                e.currentTarget.style.background = '#f4f4f6';
                                                e.currentTarget.style.border = '2px solid #e1dfdd';
                                                e.currentTarget.style.borderRadius = '0px';
                                                e.currentTarget.style.width = '48px';
                                                e.currentTarget.style.boxShadow = '0 1px 2px rgba(6,23,51,0.04)';
                                            }
                                        }}
                                    >
                                        {/* Check Icon */}
                                        <svg 
                                            width="18" 
                                            height="18" 
                                            viewBox="0 0 24 24" 
                                            fill="none"
                                            style={{
                                                transition: 'color 0.3s, opacity 0.3s',
                                                color: summaryConfirmed ? '#D65541' : '#999',
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                transform: 'translate(-50%, -50%)',
                                            }}
                                        >
                                            <polyline 
                                                points="20,6 9,17 4,12" 
                                                stroke="currentColor" 
                                                strokeWidth="2" 
                                                strokeLinecap="round" 
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                        
                                        {/* Expandable Text */}
                                        <span 
                                            style={{
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                                color: summaryConfirmed ? '#D65541' : '#999',
                                                opacity: 0,
                                                transition: 'opacity 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                whiteSpace: 'nowrap',
                                            }}
                                            className="nav-text"
                                        >
                                            {summaryConfirmed ? 'Submit Matter' : 'Confirm Summary First'}
                                        </span>
                                    </div>
                                    
                                    <style>{`
                                        .nav-button:hover .nav-text {
                                            opacity: 1 !important;
                                        }
                                        .nav-button:hover svg {
                                            opacity: 0 !important;
                                        }
                                        .submit-button[style*="cursor: not-allowed"]:hover .nav-text {
                                            opacity: 0 !important;
                                        }
                                        .submit-button[style*="cursor: not-allowed"]:hover svg {
                                            opacity: 1 !important;
                                        }
                                    `}</style>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CSS for smooth hover effects and navigation animations */}
                    <style>{`
                        .review-summary-hoverable {
                            box-shadow: none;
                        }
                        .review-summary-hoverable:hover {
                            border-color: ${summaryConfirmed ? '#49B670' : '#D65541'} !important;
                            box-shadow: ${summaryConfirmed ? '0 0 0 1px #49B670' : '0 0 0 1px #D65541'};
                        }
                        
                        /* Navigation button animations */
                        .nav-button-container:hover .nav-button.back-button {
                            transform: scale(1.1);
                            border-color: #0078d4;
                            box-shadow: 0 4px 12px rgba(0, 120, 212, 0.2);
                        }
                        
                        .nav-button-container:hover .nav-button.forward-button {
                            transform: scale(1.1);
                            box-shadow: 0 4px 12px rgba(0, 120, 212, 0.3);
                        }
                        
                        .nav-button-container:hover .nav-label {
                            opacity: 1 !important;
                            visibility: visible !important;
                            transform: translateY(-50%) translateX(0) !important;
                        }
                        
                        .nav-button-container:hover .back-label {
                            transform: translateY(-50%) translateX(-8px) !important;
                        }
                        
                        .nav-button-container:hover .forward-label {
                            transform: translateY(-50%) translateX(8px) !important;
                        }
                        
                        .nav-button:active {
                            transform: scale(0.95) !important;
                        }
                        
                        .nav-button-container {
                            animation: fadeInUp 0.6s cubic-bezier(0.4, 0, 0.2, 1) forwards;
                        }
                        
                        @keyframes fadeInUp {
                            from {
                                opacity: 0;
                                transform: translateY(20px);
                            }
                            to {
                                opacity: 1;
                                transform: translateY(0);
                            }
                        }
                    `}</style>
                </div>
            </Stack>
        </CompletionProvider>
    );
}

export default FlatMatterOpening;