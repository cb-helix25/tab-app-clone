//
import React, { useState, useEffect, useMemo, useRef } from 'react'; // invisible change
// invisible change 2.2
import { Stack, PrimaryButton, Dialog, DialogType, DialogFooter, DefaultButton } from '@fluentui/react';
import MinimalSearchBox from './MinimalSearchBox';
import { POID, TeamData, UserData, InstructionData } from '../../../app/functionality/types';
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
import ModernMultiSelect from './ModernMultiSelect';
import BudgetStep from './BudgetStep';

import { CompletionProvider } from './CompletionContext';
import ProcessingSection, { ProcessingStep } from './ProcessingSection';
import { processingActions, initialSteps, registerClientIdCallback, registerMatterIdCallback, registerOperationObserver, setCurrentActionIndex } from './processingActions';
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
    userData?: UserData[] | null;
    instructionRef?: string;
    clientId?: string;
    feeEarner?: string;
    stage?: string;
    matterRef?: string;
    hideClientSections?: boolean;
    initialClientType?: string;
    preselectedPoidIds?: string[];
    instructionPhone?: string;
    /**
     * Preferred source for Select Client cards: pass records directly from the
     * new Instructions DB (instructions table). When provided, the Select Client
     * grid will be sourced exclusively from these records (mapped to POID shape),
     * while legacy POID/idVerification fallback remains available for other flows.
     */
    instructionRecords?: unknown[];
    /**
     * Optional callback triggered when the user chooses to draft the CCL
     * immediately after opening the matter.
     */
    onDraftCclNow?: (matterId: string) => void;
}

const FlatMatterOpening: React.FC<FlatMatterOpeningProps> = ({

    poidData,
    setPoidData,
    teamData,
    userInitials,
    userData,
    instructionRef = '',
    clientId: initialClientId = '',
    feeEarner,
    stage = 'New Matter',
    matterRef,
    hideClientSections = false,
    initialClientType = '',
    preselectedPoidIds = [],
    instructionPhone,
    instructionRecords,
    onDraftCclNow,
}) => {
    const idExpiry = useMemo(() => {
        const d = new Date();
        d.setDate(d.getDate() + 30);
        return d.toLocaleDateString('en-GB');
    }, []); // invisible change

    const [clientId, setClientId] = useState<string | null>(initialClientId || null);
    const [matterIdState, setMatterIdState] = useState<string | null>(matterRef || null);
    useEffect(() => {
        registerClientIdCallback(setClientId);
        registerMatterIdCallback((id) => {
            setMatterIdState(id);
            setOpenedMatterId(id);
        });
        return () => {
            registerClientIdCallback(null);
            registerMatterIdCallback(null);
        };
    }, []);

    const showPoidSelection = !instructionRef;
    const defaultPoidData: POID[] = useMemo(() => {
        // Step A: Build a robust POID list from provided poidData (preferred) or legacy idVerifications
        const basePoids = ((poidData && poidData.length > 0)
            ? poidData
            : (idVerifications as any[]).map((v) => ({
                poid_id: String(v.InternalId),
                first: v.FirstName,
                last: v.LastName,
                email: v.Email,
                best_number: (v as any).Phone || '',
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
                check_id: v.EIDCheckId,
                poc: v.poc,
                prefix: v.prefix,
                type: v.type,
                client_id: v.ClientId,
                matter_id: v.MatterId,
                InstructionRef: v.InstructionRef,
            }))
        ) as POID[];

        // Index basePoids by common join keys for quick lookup
        const byEmail = new Map<string, POID>();
        const byInstRef = new Map<string, POID[]>();
        basePoids.forEach((p) => {
            const emailKey = (p.email || (p as any).Email || '').toLowerCase();
            if (emailKey) byEmail.set(emailKey, p);
            const inst = (p as any).InstructionRef || (p as any).instruction_ref;
            if (inst) {
                const arr = byInstRef.get(String(inst)) || [];
                arr.push(p);
                byInstRef.set(String(inst), arr);
            }
        });

        // Step B: If instruction records provided, merge additional metadata onto matching basePoids
        if (Array.isArray(instructionRecords) && instructionRecords.length > 0) {
            const merged: POID[] = [];
            (instructionRecords as any[]).forEach((inst) => {
                const instRef = String(inst.InstructionRef || '');
                const emailKey = String(inst.Email || '').toLowerCase();
                // Prefer match by InstructionRef, fall back to email
                let match: POID | undefined = undefined;
                if (instRef && byInstRef.has(instRef)) {
                    // If multiple, pick the one that also matches email when available
                    const candidates = byInstRef.get(instRef)!;
                    match = emailKey ? candidates.find(c => (c.email || '').toLowerCase() === emailKey) || candidates[0] : candidates[0];
                } else if (emailKey) {
                    match = byEmail.get(emailKey);
                }

                if (match) {
                    // Attach extra fields from instruction to the matched POID (without changing poid_id)
                    merged.push({
                        ...match,
                        InstructionRef: instRef || (match as any).InstructionRef,
                        best_number: match.best_number || inst.Phone,
                        company_name: match.company_name || inst.CompanyName,
                        company_number: match.company_number || inst.CompanyNumber,
                        // Include verification fields from instruction if not present in matched POID
                        check_result: match.check_result || inst.EIDOverallResult,
                        pep_sanctions_result: match.pep_sanctions_result || inst.PEPAndSanctionsCheckResult,
                        address_verification_result: match.address_verification_result || inst.AddressVerificationResult,
                    } as POID);
                } else {
                    // No match in basePoids – include a minimal record for UI visibility (won't be preselected)
                    merged.push({
                        poid_id: String(instRef || inst.id || emailKey || `${inst.FirstName || ''}|${inst.LastName || ''}`),
                        first: inst.FirstName,
                        last: inst.LastName,
                        email: inst.Email,
                        best_number: inst.Phone,
                        company_name: inst.CompanyName,
                        company_number: inst.CompanyNumber,
                        InstructionRef: instRef,
                        // Include verification fields from instruction record
                        check_result: inst.EIDOverallResult,
                        pep_sanctions_result: inst.PEPAndSanctionsCheckResult,
                        address_verification_result: inst.AddressVerificationResult,
                    } as POID);
                }
            });

            // Deduplicate: prefer entries that have a real numeric poid_id (from basePoids)
            const byKey = new Map<string, POID>();
            merged.concat(basePoids).forEach((p) => {
                const key = String(p.poid_id || (p.email || '').toLowerCase());
                const existing = byKey.get(key);
                if (!existing) {
                    byKey.set(key, p);
                    return;
                }
                // If one of them has more person/company detail, keep the richer one
                const richness = (x: POID) => `${x.first || ''}${x.last || ''}${x.company_name || ''}`.length;
                if (richness(p) > richness(existing)) byKey.set(key, p);
            });
            return Array.from(byKey.values());
        }

        // No instructionRecords – just return basePoids with email de-duplication
        const uniqueMap = new Map<string, POID>();
        basePoids.forEach((p) => {
            const key = (p.email || '').toLowerCase() || `${p.first?.toLowerCase() || ''}|${p.last?.toLowerCase() || ''}`;
            if (!key) return;
            const inst = (p as any).InstructionRef || (p as any).instruction_ref || '';
            if (!uniqueMap.has(key)) {
                uniqueMap.set(key, p);
                return;
            }
            const existing = uniqueMap.get(key)!;
            const existingInst = (existing as any).InstructionRef || (existing as any).instruction_ref || '';
            if (instructionRef && inst === instructionRef && existingInst !== instructionRef) {
                uniqueMap.set(key, p);
            }
        });
        return Array.from(uniqueMap.values());
    }, [instructionRecords, poidData, instructionRef]);
    
    // Filter out any invalid POID entries that might be causing issues
    const validPoidData = useMemo(() => {
        const preselected = new Set(preselectedPoidIds || []);
        return defaultPoidData.filter((poid) => {
            if (!poid) return false;
            // Always allow explicitly preselected POIDs (e.g., instruction-driven/direct entries)
            if (preselected.has(poid.poid_id)) return true;
            // Accept either a valid person (first+last not numeric) or a company-only record
            const hasPerson = Boolean(
                poid.first &&
                poid.last &&
                isNaN(Number(poid.first)) &&
                isNaN(Number(poid.last))
            );
            const hasCompany = Boolean(poid.company_name);
            return hasPerson || hasCompany;
        });
    }, [defaultPoidData, preselectedPoidIds]);
    
    // Force use of only validated local POID data
    const effectivePoidData: POID[] = validPoidData;
        
    // Debug logging removed

    const [selectedDate, setSelectedDate] = useDraftedState<Date | null>('selectedDate', null);
    // Ensure an opening date is always present (default to today on first use)
    useEffect(() => {
        if (!selectedDate) {
            setSelectedDate(new Date());
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    // Note: additional effect to guarantee date on step change is defined after currentStep declaration
    const localTeamData = useMemo(() => localTeamDataJson, []);
    const defaultPartnerOptions = defaultPartners;

    // Helper to safely get full name
    const getFullName = (t: unknown): string => {
        const rec = t as any; // narrowed locally for index access to bracket keys
        const full = rec?.['Full Name'] || `${rec?.First || ''} ${rec?.Last || ''}`.trim();
        return String(full || '').trim();
    };

    // Active team only
    const activeTeam = useMemo(() => {
        const dataset = (teamData ?? localTeamData) as unknown;
        if (!Array.isArray(dataset)) return [] as any[];
        return dataset.filter((t: any) => String(t?.status ?? t?.Status ?? '').toLowerCase() === 'active');
    }, [teamData, localTeamData]);

    // Helper to safely get first name
    const getFirstName = (t: unknown): string => {
        const rec = t as any;
        const first = rec?.First || rec?.first;
        if (first) return String(first).trim();
        const full = rec?.['Full Name'] || rec?.FullName || '';
        if (full) return String(full).trim().split(/\s+/)[0] || '';
        return '';
    };

    // Active Partners (first names) for supervising partner select
    const partnerOptionsList = useMemo(() => {
        const partnersFirst = activeTeam
            .filter((t: any) => String(t?.Role || '').toLowerCase() === 'partner')
            .map(getFirstName)
            .filter(Boolean);
        if (partnersFirst.length) return partnersFirst;
        // Fallback: convert default partner options (likely full names) to first names
        const defaultFirst = (defaultPartnerOptions || [])
            .map((n: string) => String(n || '').trim().split(/\s+/)[0])
            .filter(Boolean);
        return defaultFirst;
    }, [activeTeam, defaultPartnerOptions]);

    // Active team member options (names)
    const teamMemberOptions = useMemo(() => {
        return activeTeam.map(getFullName).filter(Boolean);
    }, [activeTeam]);

    // Active members for Responsible/Originating selects (show everyone active)
    const solicitorOptions = useMemo(() => {
        return activeTeam.map(getFullName).filter(Boolean);
    }, [activeTeam]);
    
    const defaultTeamMember = useMemo(() => {
        // Prefer the active-only team list to ensure defaults exist in dropdowns
        if (activeTeam && activeTeam.length > 0) {
            const found = activeTeam.find(
                (t: any) => String(t?.Initials || '').toLowerCase() === userInitials.toLowerCase(),
            );
            if (found) {
                return getFullName(found);
            }
            return getFullName(activeTeam[0]);
        }
        return '';
    }, [activeTeam, userInitials]);

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
    // Use initialClientType if provided (from instruction data)
    const [clientType, setClientType] = useDraftedState<string>('clientType', initialClientType || '');
    const [pendingClientType, setPendingClientType] = useDraftedState<string>('pendingClientType', initialClientType || '');
    const [clientAsOnFile, setClientAsOnFile] = useDraftedState<string>('clientAsOnFile', '');
    // Only set on mount or when initialClientType changes, and only if not already set
    React.useEffect(() => {
        if (initialClientType && initialClientType.trim() !== '') {
            setClientType(initialClientType);
            setPendingClientType(initialClientType);
        }
    }, [initialClientType]);

    // If preselectedPoidIds is provided and not empty, use it as the initial value for selectedPoidIds
    const [selectedPoidIds, setSelectedPoidIds] = useDraftedState<string[]>('selectedPoidIds', preselectedPoidIds.length > 0 ? preselectedPoidIds : []);
    const [areaOfWork, setAreaOfWork] = useDraftedState<string>('areaOfWork', '');
    const [practiceArea, setPracticeArea] = useDraftedState<string>('practiceArea', '');
    const [description, setDescription] = useDraftedState<string>('description', '');
    const [folderStructure, setFolderStructure] = useDraftedState<string>('folderStructure', '');
    const [disputeValue, setDisputeValue] = useDraftedState<string>('disputeValue', '');
    // Source field starts empty - user must actively select an option
    const [source, setSource] = useDraftedState<string>('source', '');
    const [referrerName, setReferrerName] = useDraftedState<string>('referrerName', '');
    const [budgetRequired, setBudgetRequired] = useDraftedState<string>('budgetRequired', 'No');
    const [budgetAmount, setBudgetAmount] = useDraftedState<string>('budgetAmount', '');
    const [budgetThreshold, setBudgetThreshold] = useDraftedState<string>('budgetThreshold', '');
    const [budgetNotifyUsers, setBudgetNotifyUsers] = useDraftedState<string>('budgetNotifyUsers', '');
    const [opponentName, setOpponentName] = useDraftedState<string>('opponentName', '');
    const [opponentEmail, setOpponentEmail] = useDraftedState<string>('opponentEmail', '');
    const [opponentSolicitorName, setOpponentSolicitorName] = useDraftedState<string>('opponentSolicitorName', '');
    const [opponentSolicitorCompany, setOpponentSolicitorCompany] = useDraftedState<string>('opponentSolicitorCompany', '');
    const [opponentSolicitorEmail, setOpponentSolicitorEmail] = useDraftedState<string>('opponentSolicitorEmail', '');
    const [noConflict, setNoConflict] = useDraftedState<boolean>('noConflict', false);
    const [opponentChoiceMade, setOpponentChoiceMade] = useDraftedState<boolean>('opponentChoiceMade', false);
    const [jsonPreviewOpen, setJsonPreviewOpen] = useState(false); // UI only, not persisted
    
    // Workbench states
    const [workbenchMode, setWorkbenchMode] = useState(false);
    const [debugPanelOpen, setDebugPanelOpen] = useState(false);
    const [supportPanelOpen, setSupportPanelOpen] = useState(false);
    const [supportMessage, setSupportMessage] = useState('');
    const [supportCategory, setSupportCategory] = useState<'technical' | 'process' | 'data'>('technical');
    const [supportSending, setSupportSending] = useState(false);
    
    // Debug import states (for failed submission debugging)
    const [debugImportOpen, setDebugImportOpen] = useState(false);
    const [debugJsonInput, setDebugJsonInput] = useState('');
    const [debugValidation, setDebugValidation] = useState<{
        isValid: boolean;
        suggestions: string[];
        warnings: string[];
        predictions: { step: string; willPass: boolean; reason: string }[];
    } | null>(null);
    
    // If preselectedPoidIds is provided, set the initial activePoid to the first matching POID
    useEffect(() => {
        if (preselectedPoidIds && preselectedPoidIds.length > 0 && effectivePoidData.length > 0) {
            // Only set if not already set
            setSelectedPoidIds((prev) => (prev.length === 0 ? preselectedPoidIds : prev));
            const found = effectivePoidData.find((p) => p.poid_id === preselectedPoidIds[0]);
            setActivePoid((prev) => (prev == null ? found || null : prev));
        }
        // Only run on mount or when preselectedPoidIds changes
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [preselectedPoidIds, effectivePoidData]);

    

    // Opponent fields
    const [opponentTitle, setOpponentTitle] = useDraftedState<string>('opponentTitle', '');
    const [opponentFirst, setOpponentFirst] = useDraftedState<string>('opponentFirst', '');
    const [opponentLast, setOpponentLast] = useDraftedState<string>('opponentLast', '');
    const [opponentPhone, setOpponentPhone] = useDraftedState<string>('opponentPhone', '');
    const [opponentHouseNumber, setOpponentHouseNumber] = useDraftedState<string>('opponentHouseNumber', '');
    const [opponentStreet, setOpponentStreet] = useDraftedState<string>('opponentStreet', '');
    const [opponentCity, setOpponentCity] = useDraftedState<string>('opponentCity', '');
    const [opponentCounty, setOpponentCounty] = useDraftedState<string>('opponentCounty', '');
    const [opponentPostcode, setOpponentPostcode] = useDraftedState<string>('opponentPostcode', '');
    const [opponentCountry, setOpponentCountry] = useDraftedState<string>('opponentCountry', '');
    const [opponentHasCompany, setOpponentHasCompany] = useDraftedState<boolean>('opponentHasCompany', false);
    const [opponentCompanyName, setOpponentCompanyName] = useDraftedState<string>('opponentCompanyName', '');
    const [opponentCompanyNumber, setOpponentCompanyNumber] = useDraftedState<string>('opponentCompanyNumber', '');
    // Solicitor fields
    const [solicitorTitle, setSolicitorTitle] = useDraftedState<string>('solicitorTitle', '');
    const [solicitorFirst, setSolicitorFirst] = useDraftedState<string>('solicitorFirst', '');
    const [solicitorLast, setSolicitorLast] = useDraftedState<string>('solicitorLast', '');
    const [solicitorPhone, setSolicitorPhone] = useDraftedState<string>('solicitorPhone', '');
    const [solicitorHouseNumber, setSolicitorHouseNumber] = useDraftedState<string>('solicitorHouseNumber', '');
    const [solicitorStreet, setSolicitorStreet] = useDraftedState<string>('solicitorStreet', '');
    const [solicitorCity, setSolicitorCity] = useDraftedState<string>('solicitorCity', '');
    const [solicitorCounty, setSolicitorCounty] = useDraftedState<string>('solicitorCounty', '');
    const [solicitorPostcode, setSolicitorPostcode] = useDraftedState<string>('solicitorPostcode', '');
    const [solicitorCountry, setSolicitorCountry] = useDraftedState<string>('solicitorCountry', '');
    const [solicitorCompanyNumber, setSolicitorCompanyNumber] = useDraftedState<string>('solicitorCompanyNumber', '');

    // Summary review confirmation state
    const [summaryConfirmed, setSummaryConfirmed] = useDraftedState<boolean>('summaryConfirmed', false);
    // Acknowledgement checkbox for formal confirmation (not persisted)
    const [confirmAcknowledge, setConfirmAcknowledge] = useState<boolean>(false);

    // Processing state for matter submission
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingOpen, setProcessingOpen] = useState(false);
    const [processingSteps, setProcessingSteps] = useState<ProcessingStep[]>(initialSteps);
    const [processingLogs, setProcessingLogs] = useState<string[]>([]);
    const [generatedCclUrl, setGeneratedCclUrl] = useState<string>('');
    const [operationEvents, setOperationEvents] = useState<Array<{ index: number; label: string; phase: string; url?: string; method?: string; status?: number; payloadSummary?: string; responseSummary?: string }>>([]);
    const [openedMatterId, setOpenedMatterId] = useState<string | null>(null);

    const [visiblePoidCount, setVisiblePoidCount] = useState(12); // UI only, not persisted
    const [poidSearchTerm, setPoidSearchTerm] = useState(''); // UI only, not persisted
    const [searchBoxFocused, setSearchBoxFocused] = useState(false);
    const poidGridRef = useRef<HTMLDivElement | null>(null);
    const [activePoid, setActivePoid] = useDraftedState<POID | null>('activePoid', null);

    // When entering via an instruction, try to set an active POID from InstructionRef if none is selected
    useEffect(() => {
        if (!instructionRef || activePoid) return;
        const match = effectivePoidData.find(p => (p as any).InstructionRef === instructionRef || (p as any).instruction_ref === instructionRef);
        if (match) setActivePoid(match);
    }, [instructionRef, effectivePoidData, activePoid, setActivePoid]);

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
        const isCompany = !!(poid.company_name || poid.company_number);
        
        if (selectedPoidIds.includes(poid.poid_id)) {
            // Remove selection
            setSelectedPoidIds((prev: string[]) => prev.filter((id: string) => id !== poid.poid_id));
            if (activePoid && activePoid.poid_id === poid.poid_id) {
                const remaining = effectivePoidData.find((p) => selectedPoidIds.includes(p.poid_id) && p.poid_id !== poid.poid_id);
                setActivePoid(remaining || null);
            }
        } else {
            // Add selection based on client type rules
            if (pendingClientType === 'Individual' || pendingClientType === 'Existing Client') {
                // Single selection only
                setSelectedPoidIds([poid.poid_id]);
                setActivePoid(poid);
            } else if (pendingClientType === 'Company') {
                // Company type: Two-stage selection
                const currentSelectedPoids = selectedPoidIds.map(id => 
                    effectivePoidData.find(p => p.poid_id === id)
                ).filter(Boolean);
                
                const hasCompanySelected = currentSelectedPoids.some(p => 
                    p && !!(p.company_name || p.company_number)
                );
                
                if (isCompany) {
                    // Selecting a company - replace any existing company
                    const newSelections = selectedPoidIds.filter(id => {
                        const p = effectivePoidData.find(poid => poid.poid_id === id);
                        return p && !(p.company_name || p.company_number); // Keep individuals (directors)
                    });
                    // Ensure uniqueness
                    const next = Array.from(new Set([...newSelections, poid.poid_id]));
                    setSelectedPoidIds(next);
                } else {
                    // Selecting an individual (director) - only allowed if company is already selected
                    if (hasCompanySelected) {
                        // Allow multiple directors - just add to existing selections
                        setSelectedPoidIds((prev: string[]) => (prev.includes(poid.poid_id) ? prev : [...prev, poid.poid_id]));
                    }
                }
                setActivePoid(poid);
            } else if (pendingClientType === 'Multiple Individuals') {
                // Multiple individuals allowed - unlimited selections
                setSelectedPoidIds((prev: string[]) => (prev.includes(poid.poid_id) ? prev : [...prev, poid.poid_id]));
                setActivePoid(poid);
            }
        }
        setSearchBoxFocused(false); // Collapse search box after selection
        setPoidSearchTerm(''); // Optionally clear search term
    };

    // Handler for Clear All button
const handleClearAll = () => {
  if (hasDataToClear()) {
    setIsClearDialogOpen(true);
  } else {
    doClearAll();
  }
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

    // Helper to get Clio ID from team data
    function getClioId(userInitials: string, teamData: any[]): string {
        if (!userInitials || !teamData) return '';
        const found = teamData.find(
            (u) => (u.Initials || '').toLowerCase() === userInitials.toLowerCase()
        );
        return found ? found['Clio ID'] || '' : '';
    }

    // Helper to get initials from full name via team data
    function getInitialsFromName(name: string, teamData: any[]): string {
        if (!name) return '';
        const found = teamData.find(t => {
            const full = (t['Full Name'] || `${t.First || ''} ${t.Last || ''}`).trim();
            return full.toLowerCase() === name.toLowerCase();
        });
        if (found && found.Initials) return found.Initials;
        return name
            .split(' ')
            .filter(Boolean)
            .map(part => part[0].toUpperCase())
            .join('');
    }

    // Determine requesting user nickname based on environment
    const requestingUserNickname =
        process.env.NODE_ENV === 'production'
            ? getTeamNickname(userInitials, teamData || localTeamDataJson)
            : getLocalUserNickname(userInitials);

    // Determine requesting user Clio ID based on environment
    const requestingUserClioId = getClioId(userInitials, teamData || localTeamDataJson);

    // Environment/admin flags for gated backend details
    const isLocalDev = process.env.NODE_ENV !== 'production';
    const isAdminUser = useMemo(() => {
        try {
            const dataset = (teamData || localTeamDataJson) as any[];
            const me = dataset.find(t => (t.Initials || '').toLowerCase() === userInitials.toLowerCase());
            const roleText = (me?.Role || '').toLowerCase();
            return roleText.includes('admin') || roleText.includes('owner') || roleText.includes('manager');
        } catch {
            return false;
        }
    }, [teamData, userInitials]);
    const adminEligible = isLocalDev || isAdminUser;

    // Horizontal sliding carousel approach
    const [currentStep, setCurrentStep] = useDraftedState<number>('currentStep', 0); // 0: select, 1: form, 2: review
    // Guarantee a date when entering the Matter or Review steps
    useEffect(() => {
        if ((currentStep === 1 || currentStep === 2) && !selectedDate) {
            setSelectedDate(new Date());
        }
    }, [currentStep, selectedDate, setSelectedDate]);
    // Removed pendingClientType state - now handled directly in clientType state

    // Calculate completion percentages for progressive dots
    const calculateClientStepCompletion = (): number => {
        let filledFields = 0;
        let totalFields = 3; // clientType, selectedPoidIds, and opponent details
        
        if (clientType && clientType.trim() !== '') filledFields++;
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
        if (source && source.trim() !== '') filledFields++; // Source must be actively selected
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
                source: source && source.trim() !== '',
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
        const hasClientType = clientType && clientType.trim() !== '';
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

    // Build Matter progressive dots - strict completion logic
    const getBuildMatterDotStates = (): [number, number, number] => {
        let dot1 = 0; // First dot: ALL THREE team roles must be filled
        let dot2 = 0; // Second dot: ALL matter details must be filled (description, folder, area, practice)
        let dot3 = 0; // Third dot: Both dispute value AND source must be filled
        
        // First dot: Only lights up when ALL THREE team roles are filled (including prefills)
        const hasTeamMember = teamMember && teamMember.trim() !== '';
        const hasOriginatingSolicitor = originatingSolicitor && originatingSolicitor.trim() !== '';
        const hasSupervisingPartner = supervisingPartner && supervisingPartner.trim() !== '';
        
        if (hasTeamMember && hasOriginatingSolicitor && hasSupervisingPartner) {
            dot1 = 3; // All three roles filled - light up completely
        }
        
        // Second dot: Only lights up when ALL matter details are filled
        const hasDescription = description && description.trim() !== '';
        const hasFolderStructure = folderStructure && folderStructure.trim() !== '';
        const hasAreaOfWork = areaOfWork && areaOfWork.trim() !== '';
        const hasPracticeArea = practiceArea && practiceArea.trim() !== '';
        
        if (hasDescription && hasFolderStructure && hasAreaOfWork && hasPracticeArea) {
            dot2 = 3; // All matter details filled - light up completely
        }
        
        // Third dot: Only lights up when BOTH dispute value AND source are filled
        // Note: Source starts empty, so user must actively select an option
        const hasDisputeValue = disputeValue && disputeValue.trim() !== '';
        const hasActiveSource = source && source.trim() !== ''; // Must actively select a source option
        
        if (hasDisputeValue && hasActiveSource) {
            dot3 = 3; // Both value and actively selected source - light up completely
        }
        
        return [dot1, dot2, dot3];
    };

    // Determine completion status for each step
    const clientsStepComplete = (() => {
        // If the selection UI is hidden (instruction-driven/direct entry), allow progression immediately
        if (instructionRef || hideClientSections) return true;

        // Otherwise use the user's current choice (pendingClientType) or provided initial type
        const type = (pendingClientType || initialClientType || '').trim();
        if (!type) return false;
        if (type === 'Multiple Individuals') {
            const hasDirectEntry = Boolean(clientAsOnFile && clientAsOnFile.trim());
            return selectedPoidIds.length > 0 || hasDirectEntry;
        }
        // Individual, Company, Existing Client require at least one POID selected
        return selectedPoidIds.length > 0;
    })();
    const matterStepComplete = selectedDate && supervisingPartner && originatingSolicitor && areaOfWork && practiceArea && description;
    const reviewStepComplete = false; // Review step doesn't have a "next" - it's the final step

    const handleContinueToForm = () => {
        if (clientsStepComplete) {
            // Persist the actively chosen client type if available
            setClientType(pendingClientType || clientType);
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
        setConfirmAcknowledge(false); // Reset acknowledgement checkbox
        // Scroll to top when changing steps
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleClientTypeChange = (newType: string, shouldLimitToSingle: boolean) => {
        // Only clear POID selection when actually switching to a different client type
        // Don't clear if we're staying on the same type (this prevents clearing during multiple selections)
        if (pendingClientType !== newType) {
            // Clear selections when switching between different client types
            setSelectedPoidIds([]);
        }
        setSearchBoxFocused(false); // Collapse search box after client type selection
        setPoidSearchTerm(''); // Optionally clear search term
    };

    // Helper to generate sample JSON object
    const generateSampleJson = () => {
        const selectedClients = selectedPoidIds.map((id: string) => {
            const client = effectivePoidData.find(p => p.poid_id === id);
            if (!client) {
                // Preserve the selected ID even if we have no further details
                return { poid_id: id };
            }
            const phone =
                client.best_number ||
                (client as any).phone ||
                (client as any).phone_number ||
                (client as any).phoneNumber ||
                (client as any).Phone ||
                instructionPhone ||
                null;
            const email = client.email || (client as any).Email || '';

            return {
                poid_id: client.poid_id,
                first_name: client.first,
                last_name: client.last,
                email,
                best_number: phone,
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
            };
        });

        return {
            matter_details: {
                instruction_ref: instructionRef || null,
                client_id: clientId || null,
                matter_ref: matterIdState || matterRef || null,
                stage: stage,
                date_created: selectedDate ? selectedDate.toISOString().split('T')[0] : null,
                client_type: clientType,
                area_of_work: areaOfWork,
                practice_area: practiceArea,
                description: description,
                client_as_on_file: clientAsOnFile || null,
                dispute_value: disputeValue || null,
                folder_structure: folderStructure || null,
                budget_required: budgetRequired,
                budget_amount: budgetRequired === 'Yes' ? budgetAmount : null,
                budget_notify_threshold: budgetRequired === 'Yes' ? budgetThreshold : null,
                budget_notify_users: budgetRequired === 'Yes'
                    ? budgetNotifyUsers.split(',').map(u => u.trim()).filter(Boolean)
                    : []
            },
            team_assignments: {
                fee_earner: teamMember,
                supervising_partner: supervisingPartner,
                originating_solicitor: originatingSolicitor,
                requesting_user: requestingUserNickname,
                fee_earner_initials: getInitialsFromName(teamMember, teamData || localTeamDataJson),
                originating_solicitor_initials: getInitialsFromName(originatingSolicitor, teamData || localTeamDataJson)
            },
            client_information: selectedClients,
            source_details: {
                source: source,
                referrer_name: source === 'referral' ? referrerName : null
            },
            opponent_details: (
                opponentName ||
                opponentSolicitorName ||
                opponentFirst ||
                opponentLast ||
                opponentCompanyName ||
                opponentCompanyNumber ||
                opponentEmail ||
                opponentPhone ||
                opponentHouseNumber ||
                opponentStreet ||
                opponentCity ||
                opponentCounty ||
                opponentPostcode ||
                opponentCountry ||
                opponentSolicitorCompany ||
                solicitorFirst ||
                solicitorLast ||
                solicitorCompanyNumber ||
                opponentSolicitorEmail ||
                solicitorPhone ||
                solicitorHouseNumber ||
                solicitorStreet ||
                solicitorCity ||
                solicitorCounty ||
                solicitorPostcode ||
                solicitorCountry
            ) ? {
                opponent: {
                    title: opponentTitle || null,
                    first_name: opponentFirst || null,
                    last_name: opponentLast || null,
                    is_company: opponentHasCompany || false,
                    company_name: opponentCompanyName || null,
                    company_number: opponentCompanyNumber || null,
                    email: opponentEmail || null,
                    phone: opponentPhone || null,
                    address: {
                        house_number: opponentHouseNumber || null,
                        street: opponentStreet || null,
                        city: opponentCity || null,
                        county: opponentCounty || null,
                        post_code: opponentPostcode || null,
                        country: opponentCountry || null
                    }
                },
                solicitor: {
                    title: solicitorTitle || null,
                    first_name: solicitorFirst || null,
                    last_name: solicitorLast || null,
                    company_name: opponentSolicitorCompany || null,
                    company_number: solicitorCompanyNumber || null,
                    email: opponentSolicitorEmail || null,
                    phone: solicitorPhone || null,
                    address: {
                        house_number: solicitorHouseNumber || null,
                        street: solicitorStreet || null,
                        city: solicitorCity || null,
                        county: solicitorCounty || null,
                        post_code: solicitorPostcode || null,
                        country: solicitorCountry || null
                    }
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

    // JSON Debug Validation Function for failed submission diagnostics
    const validateDebugJson = (jsonString: string) => {
        const suggestions: string[] = [];
        const warnings: string[] = [];
        const predictions: { step: string; willPass: boolean; reason: string }[] = [];

        try {
            const data = JSON.parse(jsonString);
            
            // Check top-level structure
            const expectedSections = ['matter_details', 'team_assignments', 'client_information', 'source_details'];
            const missingSections = expectedSections.filter(section => !data[section]);
            if (missingSections.length > 0) {
                suggestions.push(`Missing required sections: ${missingSections.join(', ')}`);
            }

            // Validate matter_details
            if (data.matter_details) {
                const md = data.matter_details;
                if (!md.client_type) suggestions.push('client_type is required in matter_details');
                if (!md.area_of_work) suggestions.push('area_of_work is required in matter_details');
                if (!md.practice_area) suggestions.push('practice_area is required in matter_details');
                if (!md.description || md.description.trim().length < 10) {
                    suggestions.push('description should be at least 10 characters long');
                }
                
                // Predict client type selection step
                predictions.push({
                    step: 'Client Type Selection',
                    willPass: !!md.client_type && ['Individual', 'Company', 'Multiple Individuals', 'Existing Client'].includes(md.client_type),
                    reason: md.client_type ? 'Valid client type provided' : 'Client type missing or invalid'
                });

                // Predict area of work step
                predictions.push({
                    step: 'Area of Work',
                    willPass: !!md.area_of_work && md.area_of_work.trim().length > 0,
                    reason: md.area_of_work ? 'Area of work specified' : 'Area of work missing'
                });

                // Predict practice area step
                predictions.push({
                    step: 'Practice Area',
                    willPass: !!md.practice_area && md.practice_area.trim().length > 0,
                    reason: md.practice_area ? 'Practice area specified' : 'Practice area missing'
                });
            }

            // Validate team_assignments
            if (data.team_assignments) {
                const ta = data.team_assignments;
                if (!ta.fee_earner) suggestions.push('fee_earner is required in team_assignments');
                if (!ta.supervising_partner) warnings.push('supervising_partner recommended but not required');
                
                predictions.push({
                    step: 'Team Assignment',
                    willPass: !!ta.fee_earner,
                    reason: ta.fee_earner ? 'Fee earner assigned' : 'Fee earner required but missing'
                });
            }

            // Validate client_information
            if (data.client_information) {
                const clients = Array.isArray(data.client_information) ? data.client_information : [];
                if (clients.length === 0) {
                    suggestions.push('At least one client must be selected');
                } else {
                    clients.forEach((client: any, index: number) => {
                        if (!client.poid_id) suggestions.push(`Client ${index + 1}: poid_id is required`);
                        if (!client.first_name) suggestions.push(`Client ${index + 1}: first_name is required`);
                        if (!client.last_name) suggestions.push(`Client ${index + 1}: last_name is required`);
                        if (!client.email) warnings.push(`Client ${index + 1}: email is recommended`);
                        
                        // Check verification status
                        if (client.verification) {
                            const verif = client.verification;
                            if (verif.check_result !== 'passed') {
                                warnings.push(`Client ${index + 1}: ID verification not passed (${verif.check_result || 'unknown'})`);
                            }
                            if (verif.pep_sanctions_result !== 'passed') {
                                warnings.push(`Client ${index + 1}: PEP/Sanctions check not passed (${verif.pep_sanctions_result || 'unknown'})`);
                            }
                        } else {
                            warnings.push(`Client ${index + 1}: No verification data found`);
                        }
                    });
                }

                predictions.push({
                    step: 'Client Selection',
                    willPass: clients.length > 0 && clients.every((c: any) => c.poid_id && c.first_name && c.last_name),
                    reason: clients.length === 0 ? 'No clients selected' : 
                           clients.some((c: any) => !c.poid_id || !c.first_name || !c.last_name) ? 'Some clients missing required fields' :
                           'All clients have required information'
                });
            }

            // Validate source_details
            if (data.source_details) {
                const sd = data.source_details;
                if (!sd.source) suggestions.push('source is required in source_details');
                if (sd.source === 'referral' && !sd.referrer_name) {
                    suggestions.push('referrer_name is required when source is "referral"');
                }

                predictions.push({
                    step: 'Source Information',
                    willPass: !!sd.source && (sd.source !== 'referral' || !!sd.referrer_name),
                    reason: !sd.source ? 'Source missing' : 
                           sd.source === 'referral' && !sd.referrer_name ? 'Referrer name required for referral source' :
                           'Source information valid'
                });
            }

            // Check opponent_details if present
            if (data.opponent_details) {
                const od = data.opponent_details;
                let hasOpponentInfo = false;
                let hasSolicitorInfo = false;
                
                if (od.individual && (od.individual.first_name || od.individual.last_name || od.individual.email)) {
                    hasOpponentInfo = true;
                    if (!od.individual.first_name || !od.individual.last_name) {
                        warnings.push('Opponent individual missing name information');
                    }
                }
                
                if (od.solicitor && (od.solicitor.first_name || od.solicitor.last_name || od.solicitor.company_name)) {
                    hasSolicitorInfo = true;
                    if (!od.solicitor.company_name) {
                        warnings.push('Opponent solicitor missing company name');
                    }
                }

                predictions.push({
                    step: 'Opponent Details',
                    willPass: true, // Optional step
                    reason: hasOpponentInfo || hasSolicitorInfo ? 'Opponent information provided' : 'No opponent information (optional)'
                });
            }

            // Overall validation
            const hasRequiredSections = ['matter_details', 'team_assignments', 'client_information', 'source_details'].every(section => data[section]);
            const criticalIssues = suggestions.length > 0;

            return {
                isValid: hasRequiredSections && !criticalIssues,
                suggestions,
                warnings,
                predictions
            };

        } catch (error) {
            return {
                isValid: false,
                suggestions: ['Invalid JSON format - please check syntax'],
                warnings: [`Parse error: ${error instanceof Error ? error.message : 'Unknown error'}`],
                predictions: []
            };
        }
    };

    // Helper function to check if there's any data to clear
    const hasDataToClear = () => {
        return selectedPoidIds.length > 0 || pendingClientType || poidSearchTerm ||
            areaOfWork || practiceArea || description || disputeValue ||
            budgetRequired === 'Yes' || budgetAmount || budgetThreshold || budgetNotifyUsers ||
            source !== 'search' || referrerName || folderStructure ||
            opponentName || opponentEmail || opponentSolicitorName ||
               opponentSolicitorCompany || opponentSolicitorEmail ||
               opponentTitle || opponentFirst || opponentLast || opponentPhone ||
               opponentHouseNumber || opponentStreet || opponentCity || opponentCounty || opponentPostcode || opponentCountry || opponentHasCompany || opponentCompanyName ||
               opponentCompanyNumber || solicitorTitle || solicitorFirst ||
               solicitorLast || solicitorPhone || solicitorHouseNumber || solicitorStreet || solicitorCity || solicitorCounty || solicitorPostcode || solicitorCountry ||
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
        if (budgetRequired === 'Yes') count++;
        if (budgetAmount) count++;
        if (budgetThreshold) count++;
        if (budgetNotifyUsers) count++;
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

    // Process matter opening steps defined in processingActions
    const simulateProcessing = async () => {
        setIsProcessing(true);
        setProcessingOpen(true);
        setProcessingLogs([]);
        setProcessingSteps(initialSteps);
        
        // Activate workbench mode immediately on submission
        setTimeout(() => setWorkbenchMode(true), 300);
        
        let url = '';

        try {
            // Wire observer to capture sent/response/success/error phases
            registerOperationObserver((e) => {
                setOperationEvents(prev => [...prev, e]);
            });
            for (let i = 0; i < processingActions.length; i++) {
                const action = processingActions[i];
                setCurrentActionIndex(i);
                const result = await action.run(generateSampleJson(), userInitials, userData);
                const message = typeof result === 'string' ? result : result.message;
                setProcessingSteps(prev => prev.map((s, idx) => idx === i ? { ...s, status: 'success', message } : s));
                setProcessingLogs(prev => [...prev, `✓ ${message}`]);
                if (typeof result === 'object' && result.url) {
                    url = result.url;
                }
            }

            setProcessingLogs(prev => [...prev, '🎉 Matter opening completed successfully!']);
            completeMatterOpening();
        } catch (error) {
            console.error('Error during processing:', error);
            const msg = error instanceof Error ? error.message : 'Unknown error';
            setProcessingLogs(prev => [...prev, `❌ Error: ${msg}`]);
            // Mark the currently executing action as error if available; fallback to first
            setProcessingSteps(prev => prev.map((s, idx) => idx === (processingActions ? Math.min(prev.findIndex(ps => ps.status === 'pending'), processingActions.length - 1) : 0)
                ? { ...s, status: 'error', message: msg }
                : s
            ));
        } finally {
            registerOperationObserver(null);
            setTimeout(() => setIsProcessing(false), 2000);
            setProcessingOpen(false);
        }
        setGeneratedCclUrl(url);
        return { url };
    };

    // Support email functionality (adapted from PitchBuilder)
    const sendSupportRequest = async () => {
        if (!supportMessage.trim()) return;
        
        setSupportSending(true);
        
        try {
            // Get user email from userData
            const userEmailCandidate = (userData && userData[0]) || {} as any;
            const userEmailAddress = 
                (userEmailCandidate.Email && String(userEmailCandidate.Email).trim()) ||
                (userEmailCandidate.WorkEmail && String(userEmailCandidate.WorkEmail).trim()) ||
                (userEmailCandidate.Mail && String(userEmailCandidate.Mail).trim()) ||
                `${userInitials?.toLowerCase()}@helix-law.com`;

            const debugInfo = {
                timestamp: new Date().toISOString(),
                user: userInitials,
                instructionRef,
                stage,
                clientType,
                selectedPoidIds: selectedPoidIds?.length,
                processingSteps: processingSteps.map(s => ({ label: s.label, status: s.status })),
                systemData: generateSampleJson()
            };

            const emailBody = `
                <h3>Matter Opening Support Request - ${supportCategory.toUpperCase()}</h3>
                <p><strong>Category:</strong> ${supportCategory}</p>
                <p><strong>User:</strong> ${userInitials} (${userEmailAddress})</p>
                <p><strong>Instruction:</strong> ${instructionRef || 'N/A'}</p>
                <p><strong>Issue Description:</strong></p>
                <div style="background: #f5f5f5; padding: 12px; border-left: 3px solid #3690CE; margin: 12px 0;">
                    ${supportMessage.replace(/\n/g, '<br/>')}
                </div>
                <h4>Debug Information</h4>
                <pre style="background: #f8f8f8; padding: 12px; font-size: 11px; overflow: auto;">
${JSON.stringify(debugInfo, null, 2)}
                </pre>
            `;

            const response = await fetch('/api/sendEmail', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email_contents: emailBody,
                    user_email: 'support@helix-law.com',
                    subject: `Matter Opening Support: ${supportCategory} - ${instructionRef || 'Generic'}`,
                    from_email: userEmailAddress,
                    bcc_emails: 'automations@helix-law.com'
                })
            });

            if (response.ok) {
                setSupportMessage('');
                setSupportPanelOpen(false);
                // Show success notification
                alert('Support request sent successfully!');
            } else {
                throw new Error('Failed to send support request');
            }
        } catch (error) {
            console.error('Support request failed:', error);
            alert('Failed to send support request. Please try again.');
        } finally {
            setSupportSending(false);
        }
    };

    const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);

    // Entry choice: New vs Existing/Carry On
    const [entryMode, setEntryMode] = useDraftedState<'unset' | 'new' | 'existing'>('entryMode', 'unset');
    // Generic entry no longer shows Start New vs Existing here; the client type question covers it
    const shouldShowEntryModal = false;

    const handleChooseNew = () => {
        // No-op: generic choice handled by client type control now
        setEntryMode('new');
        setPendingClientType('');
    };
    const handleChooseExisting = () => {
        // No-op: generic choice handled by client type control now
        setEntryMode('existing');
        setPendingClientType('Existing Client');
        setSearchBoxFocused(true);
    };

    // Clear all selections and inputs
    const doClearAll = () => {
        // Close the confirmation dialog if open
        setIsClearDialogOpen(false);

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
        setOpponentHouseNumber('');
        setOpponentStreet('');
        setOpponentCity('');
        setOpponentCounty('');
        setOpponentPostcode('');
        setOpponentCountry('');
        setOpponentHasCompany(false);
        setOpponentCompanyName('');
        setOpponentCompanyNumber('');
        setSolicitorTitle('');
        setSolicitorFirst('');
        setSolicitorLast('');
        setSolicitorPhone('');
        setSolicitorHouseNumber('');
        setSolicitorStreet('');
        setSolicitorCity('');
        setSolicitorCounty('');
        setSolicitorPostcode('');
        setSolicitorCountry('');
        setSolicitorCompanyNumber('');
        setSummaryConfirmed(false); // Reset summary confirmation
        setActivePoid(null);
        setCurrentStep(0); // This will reset the review dots
        setPoidSearchTerm('');
        
        // Clear all localStorage draft data
        clearMatterOpeningDraft();
    };

    // Determine if all processing steps completed successfully
    const allProcessingSucceeded = processingSteps.length > 0 && processingSteps.every(s => s.status === 'success');

    // Show CCL prompt only once processing has finished with success
    const showCclPrompt = currentStep === 2 && summaryConfirmed && allProcessingSucceeded;

    // State for CCL draft choice and generating status
    const [draftChoice, setDraftChoice] = useState<'yes' | 'no' | undefined>(undefined);
    const [cclGenerating, setCclGenerating] = useState(false);

    const handleDraftChoice = (choice: 'yes' | 'no') => {
        setDraftChoice(choice);
        if (choice === 'yes' && openedMatterId && onDraftCclNow) {
            onDraftCclNow(openedMatterId);
        }
    };

    const showProcessingSection = processingSteps.some(s => s.status !== 'pending');

    // Render the horizontal sliding carousel
    return (
        <CompletionProvider>
            <Stack className="workflow-container">
                {/* Main Container */}
                <div className="workflow-main matter-opening-card">
                    {/* Persistent Header */}
                    <div className="persistent-header" style={{
                        padding: '12px 24px',
                        borderBottom: '1px solid #e1e5e9',
                        background: '#fff',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 8,
                        margin: '-20px -20px 0 -20px',
                        flexWrap: 'wrap',
                        minHeight: 'auto',
                        alignContent: 'center'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 6, 
                            flex: '1 1 auto',
                            minWidth: 0, // Allow shrinking
                            overflow: 'hidden' 
                        }}>
                            {/* Navigation breadcrumbs */}
                            <div style={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 6, 
                                fontSize: 14,
                                flexWrap: 'wrap',
                                rowGap: 4
                            }}>
                                <button 
                                    onClick={handleBackToClients}
                                    style={{ 
                                        background: 'none', 
                                        border: 'none', 
                                        color: currentStep === 0 ? '#3690CE' : '#666',
                                        cursor: 'pointer',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        padding: '6px 10px',
                                        borderRadius: 6,
                                        transition: 'all 0.2s ease',
                                        fontWeight: currentStep === 0 ? 600 : 400,
                                        backgroundColor: currentStep === 0 ? '#e3f0fc' : 'transparent',
                                        fontSize: '13px',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0
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
                                    gap: 1,
                                    margin: '0 2px',
                                    flexShrink: 0
                                }}>
                                    <div style={{ 
                                        width: '4px', 
                                        height: '4px', 
                                        borderRadius: '50%', 
                                        background: getDotColor(getProgressiveDotStates()[0]),
                                        transition: 'background-color 0.3s ease'
                                    }} />
                                    <div style={{ 
                                        width: '6px', 
                                        height: '1px', 
                                        background: '#ddd'
                                    }} />
                                    <div style={{ 
                                        width: '4px', 
                                        height: '4px', 
                                        borderRadius: '50%', 
                                        background: getDotColor(getProgressiveDotStates()[1]),
                                        transition: 'background-color 0.3s ease'
                                    }} />
                                    <div style={{ 
                                        width: '6px', 
                                        height: '1px', 
                                        background: '#ddd'
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
                                        gap: 6,
                                        padding: '6px 10px',
                                        borderRadius: 6,
                                        transition: 'all 0.2s ease',
                                        fontWeight: currentStep === 1 ? 600 : 400,
                                        backgroundColor: currentStep === 1 ? '#e3f0fc' : 'transparent',
                                        fontSize: '13px',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0
                                    }}
                                >
                                    {currentStep === 2 ? (
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
                                
                                {/* Progressive dots with visible separators */}
                                <div style={{ 
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    margin: '0 2px',
                                    flexShrink: 0
                                }}>
                                    <div style={{ 
                                        width: '4px', 
                                        height: '4px', 
                                        borderRadius: '50%', 
                                        background: getDotColor(getBuildMatterDotStates()[0]),
                                        transition: 'background-color 0.3s ease'
                                    }} />
                                    <div style={{ 
                                        width: '6px', 
                                        height: '1px', 
                                        background: '#ddd'
                                    }} />
                                    <div style={{ 
                                        width: '4px', 
                                        height: '4px', 
                                        borderRadius: '50%', 
                                        background: getDotColor(getBuildMatterDotStates()[1]),
                                        transition: 'background-color 0.3s ease'
                                    }} />
                                    <div style={{ 
                                        width: '6px', 
                                        height: '1px', 
                                        background: '#ddd'
                                    }} />
                                    <div style={{ 
                                        width: '4px', 
                                        height: '4px', 
                                        borderRadius: '50%', 
                                        background: getDotColor(getBuildMatterDotStates()[2]),
                                        transition: 'background-color 0.3s ease'
                                    }} />
                                </div>
                                
                                <div style={{ 
                                    color: currentStep === 2 ? '#3690CE' : '#666',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                    padding: '6px 10px',
                                    borderRadius: 6,
                                    fontWeight: currentStep === 2 ? 600 : 400,
                                    backgroundColor: currentStep === 2 ? '#e3f0fc' : 'transparent',
                                    transition: 'all 0.2s ease',
                                    fontSize: '13px',
                                    whiteSpace: 'nowrap',
                                    flexShrink: 0
                                }}>
                                    {summaryConfirmed ? (
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
                                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" style={{ display: 'inline', verticalAlign: 'middle' }}>
                                            <path d="M1 12C2.73 7.61 7.11 4.5 12 4.5c4.89 0 9.27 3.11 11 7.5-1.73 4.39-6.11 7.5-11 7.5-4.89 0-9.27-3.11-11-7.5z" stroke="currentColor" strokeWidth="2" fill="none"/>
                                            <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="2" fill="none"/>
                                        </svg>
                                    )}
                                    Review and Confirm
                                </div>
                            </div>
                        </div>

                        {/* Right side controls */}
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: 6,
                            rowGap: 4,
                            flexShrink: 0,
                            flexWrap: 'wrap'
                        }}>
                            {/* POID search - available in step 0 when selection UI is shown */}
                            {currentStep === 0 && showPoidSelection && (
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
                              <>
                                <button 
                                    type="button" 
                                    onClick={handleClearAll} 
                                    style={{
                                        background: '#fff',
                                        border: '1px solid #e1e5e9',
                                        borderRadius: 6,
                                        padding: '6px 10px',
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        color: '#D65541',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 1px 2px rgba(6,23,51,0.04)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 6,
                                        fontFamily: 'Raleway, sans-serif',
                                        whiteSpace: 'nowrap',
                                        flexShrink: 0
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
                                    }}
                                >
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
                                <Dialog
                                  hidden={!isClearDialogOpen}
                                  onDismiss={() => setIsClearDialogOpen(false)}
                                  dialogContentProps={{
                                    type: DialogType.normal,
                                    title: 'Clear All Data',
                                    subText: 'Are you sure you want to clear all form data? This action cannot be undone.'
                                  }}
                                  modalProps={{
                                    isBlocking: true
                                  }}
                                >
                                  <DialogFooter>
                                    <PrimaryButton onClick={doClearAll} text="Yes, clear all" />
                                    <DefaultButton onClick={() => setIsClearDialogOpen(false)} text="Cancel" />
                                  </DialogFooter>
                                </Dialog>
                              </>
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
                        
                        /* Responsive header breakpoints */
                        @media (max-width: 900px) {
                            .persistent-header {
                                flex-wrap: wrap !important;
                                padding: 12px 16px !important;
                            }
                            .persistent-header > div:first-child {
                                order: 1;
                                width: 100%;
                                margin-bottom: 8px;
                            }
                            .persistent-header > div:last-child {
                                order: 2;
                                width: 100%;
                                justify-content: flex-end;
                            }
                        }
                        
                        @media (max-width: 600px) {
                            .persistent-header button {
                                font-size: 12px !important;
                                padding: 4px 8px !important;
                                gap: 4px !important;
                            }
                            .persistent-header button svg,
                            .persistent-header button i {
                                font-size: 12px !important;
                            }
                        }
                    `}</style>

                    {/* Generic entry choice modal removed: client type question handles this selection */}

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
                        // Reduced from 500px to shrink excessive white space after moving processing section
                        minHeight: '320px'
                    }}>
                        <div style={{ 
                            display: 'flex',
                            width: '300%', // 3 panels * 100% each
                            transform: `translateX(-${currentStep * 33.333}%)`,
                            transition: 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            height: '100%'
                        }}>
                            
                            {/* Step 1: Client Selection */}
                            <div style={{ width: '33.333%', padding: '16px', boxSizing: 'border-box' }}>
                                <div style={{ width: '100%', maxWidth: 1080, margin: '0 auto 16px auto' }}>
                                    {/** Hide the selection UI entirely for instruction-driven entry */}
                                    <PoidSelectionStep
                                        poidData={effectivePoidData}
                                        teamData={teamData}
                                        filteredPoidData={filteredPoidData}
                                        visiblePoidCount={visiblePoidCount}
                                        selectedPoidIds={selectedPoidIds}
                                        preselectedPoidIds={preselectedPoidIds}
                                        poidSearchTerm={poidSearchTerm}
                                        setPoidSearchTerm={setPoidSearchTerm}
                                        poidGridRef={poidGridRef}
                                        handlePoidClick={handlePoidClick}
                                        pendingClientType={pendingClientType}
                                        setPendingClientType={setPendingClientType}
                                        onClientTypeChange={handleClientTypeChange}
                                        clientAsOnFile={clientAsOnFile}
                                        setClientAsOnFile={setClientAsOnFile}
                                        hideClientSections={hideClientSections || !!instructionRef}
                                        instructionRef={instructionRef}
                                        matterRef={matterIdState || matterRef || ''}
                                    />
                                </div>
                                
                                {/* Opponent Details Step - appears after POID selection */}
                                {(selectedPoidIds.length > 0 && pendingClientType) && (
                                    <div style={{ 
                                        width: '100%', 
                                        maxWidth: 1080, 
                                        margin: '16px auto 0 auto',
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
                                            opponentHouseNumber={opponentHouseNumber}
                                            setOpponentHouseNumber={setOpponentHouseNumber}
                                            opponentStreet={opponentStreet}
                                            setOpponentStreet={setOpponentStreet}
                                            opponentCity={opponentCity}
                                            setOpponentCity={setOpponentCity}
                                            opponentCounty={opponentCounty}
                                            setOpponentCounty={setOpponentCounty}
                                            opponentPostcode={opponentPostcode}
                                            setOpponentPostcode={setOpponentPostcode}
                                            opponentCountry={opponentCountry}
                                            setOpponentCountry={setOpponentCountry}
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
                                            solicitorHouseNumber={solicitorHouseNumber}
                                            setSolicitorHouseNumber={setSolicitorHouseNumber}
                                            solicitorStreet={solicitorStreet}
                                            setSolicitorStreet={setSolicitorStreet}
                                            solicitorCity={solicitorCity}
                                            setSolicitorCity={setSolicitorCity}
                                            solicitorCounty={solicitorCounty}
                                            setSolicitorCounty={setSolicitorCounty}
                                            solicitorPostcode={solicitorPostcode}
                                            setSolicitorPostcode={setSolicitorPostcode}
                                            solicitorCountry={solicitorCountry}
                                            setSolicitorCountry={setSolicitorCountry}
                                            solicitorCompanyNumber={solicitorCompanyNumber}
                                            setSolicitorCompanyNumber={setSolicitorCompanyNumber}
                                            opponentChoiceMade={opponentChoiceMade}
                                            setOpponentChoiceMade={setOpponentChoiceMade}
                                        />
                                    </div>
                                )}
                                
                                {/* Continue Button */}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 24 }}>
                                    <div
                                        className="nav-button forward-button"
                                        onClick={clientsStepComplete ? handleContinueToForm : undefined}
                                        aria-disabled={!clientsStepComplete}
                                        tabIndex={clientsStepComplete ? 0 : -1}
                                        style={{
                                            background: '#f4f4f6',
                                            border: '2px solid #e1dfdd',
                                            borderRadius: '0px',
                                            width: '48px',
                                            height: '48px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: clientsStepComplete ? 'pointer' : 'not-allowed',
                                            opacity: clientsStepComplete ? 1 : 0.5,
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: '0 1px 2px rgba(6,23,51,0.04)',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            pointerEvents: clientsStepComplete ? 'auto' : 'none',
                                        }}
                                        onMouseEnter={clientsStepComplete ? (e) => {
                                            e.currentTarget.style.background = '#ffefed';
                                            e.currentTarget.style.border = '2px solid #D65541';
                                            e.currentTarget.style.borderRadius = '0px';
                                            e.currentTarget.style.width = '220px';
                                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(214,85,65,0.08)';
                                        } : undefined}
                                        onMouseLeave={clientsStepComplete ? (e) => {
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
                            <div style={{ width: '33.333%', padding: '16px', boxSizing: 'border-box' }}>
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
                                    partnerOptions={partnerOptionsList}
                                    solicitorOptions={solicitorOptions}
                                    requestingUser={requestingUserNickname}
                                    requestingUserClioId={requestingUserClioId}
                                />
                                <Stack tokens={{ childrenGap: 24 }} style={{ marginTop: 24 }}>
                                    {/* Move NetDocuments Folder Structure above Area of Work */}
                                    <DescriptionStep
                                        description={description}
                                        setDescription={setDescription}
                                        matterRefPreview={(() => {
                                            // Prefer selected POID; then activePoid; then POID matched by InstructionRef; then first available
                                            const selected = selectedPoidIds[0];
                                            let poid = (selected ? effectivePoidData.find(p => p.poid_id === selected) : undefined) as POID | undefined;
                                            if (!poid) poid = activePoid as POID | undefined;
                                            if (!poid && instructionRef) {
                                                poid = effectivePoidData.find(p => (p as any).InstructionRef === instructionRef || (p as any).instruction_ref === instructionRef) as POID | undefined;
                                            }

        							// If we still don't have a POID, try to derive from the instruction record itself
                                            const instFromRecords = (() => {
                                                if (!instructionRef || !Array.isArray(instructionRecords)) return undefined as any;
                                                return (instructionRecords as any[]).find(r => r && (r.InstructionRef === instructionRef));
                                            })();

                                            if (!poid && !instFromRecords) {
                                                const typeGuess = pendingClientType || 'Individual';
                                                let base = (clientAsOnFile || '').toUpperCase();
                                                if (typeGuess === 'Multiple Individuals') {
                                                    const digits = Math.floor(10000 + Math.random() * 90000);
                                                    return (base.slice(0, 5).padEnd(5, 'X') || 'HLXXX') + digits + '-0001';
                                                }
                                                if (!base) base = 'HLX';
                                                return base.slice(0, 5).padEnd(5, 'X') + '-0001';
                                            }

                                            // Build from either POID or instruction record details
                                            const type = (() => {
                                                if (pendingClientType) return pendingClientType;
                                                if (poid) return poid.company_name ? 'Company' : 'Individual';
                                                const t = (instFromRecords as any)?.ClientType as string | undefined;
                                                return t || 'Individual';
                                            })();

                                            const buildFromBase = (raw: string): string => {
                                                const base = (raw || '').toUpperCase() || 'HLX';
                                                return base.slice(0, 5).padEnd(5, 'X') + '-0001';
                                            };

                                            if (type === 'Multiple Individuals') {
                                                const raw = (clientAsOnFile || (poid?.last || poid?.first) || (instFromRecords?.LastName || instFromRecords?.FirstName) || '').toUpperCase();
                                                const digits = Math.floor(10000 + Math.random() * 90000);
                                                return (raw.slice(0, 5).padEnd(5, 'X') || 'HLXXX') + digits + '-0001';
                                            }

                                            if (poid) {
                                                if (type === 'Company') {
                                                    return buildFromBase(poid.company_name || clientAsOnFile || poid.last || '');
                                                }
                                                // Individual
                                                return buildFromBase(poid.last || poid.first || clientAsOnFile || '');
                                            }

                                            // No POID, derive from instruction record
                                            if (instFromRecords) {
                                                const rec: any = instFromRecords;
                                                if (type === 'Company') {
                                                    return buildFromBase(rec.CompanyName || clientAsOnFile || rec.LastName || rec.FirstName || '');
                                                }
                                                return buildFromBase(rec.LastName || rec.FirstName || clientAsOnFile || '');
                                            }

                                            // Final fallback
                                            return buildFromBase(clientAsOnFile || 'HLX');
                                        })()}
                                    />
                                    <FolderStructureStep
                                        folderStructure={folderStructure}
                                        setFolderStructure={(value) => {
                                            setFolderStructure(value);
                                            // Auto-select Area of Work based on folder structure
                                            if (value === 'Default / Commercial') setAreaOfWork('Commercial');
                                            else if (value === 'Residential Possession') setAreaOfWork('Property');
                                            else if (value === 'Adjudication') setAreaOfWork('Construction');
                                            else if (value === 'Employment') setAreaOfWork('Employment');
                                        }}
                                        folderOptions={['Default / Commercial', 'Residential Possession', 'Adjudication', 'Employment']}
                                        onContinue={function (): void {} }
                                    />
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
                                    <ValueAndSourceStep
                                        disputeValue={disputeValue}
                                        setDisputeValue={setDisputeValue}
                                        source={source}
                                        setSource={setSource}
                                        referrerName={referrerName}
                                        setReferrerName={setReferrerName}
                                        onContinue={() => {}}
                                    />
                                    <BudgetStep
                                        budgetRequired={budgetRequired}
                                        setBudgetRequired={setBudgetRequired}
                                        budgetAmount={budgetAmount}
                                        setBudgetAmount={setBudgetAmount}
                                        threshold={budgetThreshold}
                                        setThreshold={setBudgetThreshold}
                                        notifyUsers={budgetNotifyUsers}
                                        setNotifyUsers={setBudgetNotifyUsers}
                                    />

                                </Stack>
                                {/* Navigation buttons for form step */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 24 }}>
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
                            <div style={{ width: '33.333%', padding: '16px', boxSizing: 'border-box' }}>
                                <div
                                    className="review-summary-box"
                                    style={{
                                        border: summaryConfirmed ? '2px solid #49B670' : '1px solid #e1e5ea',
                                        borderRadius: 10,
                                        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                                        padding: 24,
                                        margin: '0 0 16px 0',
                                        width: '100%',
                                        boxSizing: 'border-box',
                                        transition: 'all 0.4s ease',
                                        cursor: 'default',
                                        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)',
                                        minHeight: 'auto'
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
                                            {summaryConfirmed ? (
                                                <i className="ms-Icon ms-Icon--CheckMark" style={{ fontSize: 16, color: '#22c55e' }} />
                                            ) : null}
                                            {`Review Summary ${summaryConfirmed ? '- Confirmed' : ''}`}
                                        </h4>
                                        
                                        {/* JSON Tools for review mode */}
                                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                {/* Debug Import Button (subtle, for failed submission debugging) */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDebugImportOpen(!debugImportOpen);
                                                        if (!debugImportOpen) {
                                                            setDebugJsonInput('');
                                                            setDebugValidation(null);
                                                        }
                                                    }}
                                                    title="Debug failed submissions by importing JSON"
                                                    style={{
                                                        background: 'linear-gradient(135deg, #FFF8DC 0%, #FFFACD 100%)',
                                                        border: '1px solid #DDD4AA',
                                                        borderRadius: 8,
                                                        padding: '6px 8px',
                                                        fontSize: 11,
                                                        fontWeight: 500,
                                                        color: '#8B7500',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 4,
                                                        transition: 'transform 0.15s ease, background 0.2s ease, border-color 0.2s ease',
                                                        animation: 'cascadeSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                                                        animationDelay: '120ms',
                                                        opacity: 0,
                                                        transform: 'translateX(20px)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                                        e.currentTarget.style.borderColor = '#8B7500';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.borderColor = '#DDD4AA';
                                                    }}
                                                >
                                                    <i className="ms-Icon ms-Icon--BugSolid" style={{ fontSize: 10 }} />
                                                    Debug
                                                </button>
                                                
                                                {/* Original JSON Toggle */}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setJsonPreviewOpen(!jsonPreviewOpen);
                                                    }}
                                                    style={{
                                                        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                                                        border: '1px solid #e1e5ea',
                                                        borderRadius: 8,
                                                        padding: '8px 12px',
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        color: '#3690CE',
                                                        cursor: 'pointer',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                        transition: 'transform 0.15s ease, background 0.2s ease, border-color 0.2s ease',
                                                        animation: 'cascadeSlideIn 0.4s cubic-bezier(0.4, 0, 0.2, 1) forwards',
                                                        animationDelay: '150ms',
                                                        opacity: 0,
                                                        transform: 'translateX(20px)'
                                                    }}
                                                    onMouseEnter={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                                        e.currentTarget.style.borderColor = '#3690CE';
                                                    }}
                                                    onMouseLeave={(e) => {
                                                        e.currentTarget.style.transform = 'translateY(0)';
                                                        e.currentTarget.style.borderColor = '#e1e5ea';
                                                    }}
                                                >
                                                    <i className="ms-Icon ms-Icon--Code" style={{ fontSize: 12 }} />
                                                    {jsonPreviewOpen ? 'Hide JSON' : 'View JSON'}
                                                </button>
                                            </div>
                                    </div>
                                    
                                    {/* Always show review content */}
                                            {/* Processing / Debug / Support panels moved to bottom */}
                                        </div>

                                    {/* Debug JSON Import Panel */}
                                    {debugImportOpen && (
                                        <div style={{
                                            marginBottom: 24,
                                            border: '2px solid #DDD4AA',
                                            borderRadius: 8,
                                            background: 'linear-gradient(135deg, #FFFEF7 0%, #FFF9E6 100%)',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                padding: '12px 16px',
                                                background: 'linear-gradient(135deg, #8B7500 0%, #A68600 100%)',
                                                color: '#fff',
                                                fontSize: 12,
                                                fontWeight: 600,
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center'
                                            }}>
                                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                    <i className="ms-Icon ms-Icon--BugSolid" style={{ fontSize: 12 }} />
                                                    Debug: Import Failed Submission JSON
                                                </span>
                                                <button
                                                    onClick={() => setDebugImportOpen(false)}
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
                                                    <i className="ms-Icon ms-Icon--Cancel" style={{ fontSize: 10 }} />
                                                    Close
                                                </button>
                                            </div>
                                            
                                            <div style={{ padding: 16 }}>
                                                {/* Instructions */}
                                                <div style={{
                                                    marginBottom: 12,
                                                    padding: 8,
                                                    background: 'rgba(139, 117, 0, 0.1)',
                                                    border: '1px solid rgba(139, 117, 0, 0.2)',
                                                    borderRadius: 4,
                                                    fontSize: 11,
                                                    color: '#8B7500'
                                                }}>
                                                    <strong>⚠️ Development Tool:</strong> Paste JSON from a failed submission to diagnose issues and get suggestions.
                                                </div>
                                                
                                                {/* JSON Input */}
                                                <textarea
                                                    value={debugJsonInput}
                                                    onChange={(e) => setDebugJsonInput(e.target.value)}
                                                    placeholder="Paste your JSON data here..."
                                                    style={{
                                                        width: '100%',
                                                        height: 200,
                                                        fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                                                        fontSize: 11,
                                                        padding: 12,
                                                        border: '1px solid #DDD4AA',
                                                        borderRadius: 4,
                                                        background: '#fff',
                                                        resize: 'vertical',
                                                        marginBottom: 12,
                                                        boxSizing: 'border-box'
                                                    }}
                                                />
                                                
                                                {/* Validate Button */}
                                                <button
                                                    onClick={() => {
                                                        if (debugJsonInput.trim()) {
                                                            setDebugValidation(validateDebugJson(debugJsonInput));
                                                        }
                                                    }}
                                                    disabled={!debugJsonInput.trim()}
                                                    style={{
                                                        background: debugJsonInput.trim() ? 'linear-gradient(135deg, #8B7500 0%, #A68600 100%)' : '#ccc',
                                                        border: 'none',
                                                        borderRadius: 6,
                                                        padding: '8px 16px',
                                                        fontSize: 12,
                                                        fontWeight: 600,
                                                        color: '#fff',
                                                        cursor: debugJsonInput.trim() ? 'pointer' : 'not-allowed',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 6,
                                                        marginBottom: debugValidation ? 16 : 0
                                                    }}
                                                >
                                                    <i className="ms-Icon ms-Icon--TestBeaker" style={{ fontSize: 12 }} />
                                                    Analyze JSON
                                                </button>
                                                
                                                {/* Validation Results */}
                                                {debugValidation && (
                                                    <div style={{ 
                                                        border: `2px solid ${debugValidation.isValid ? '#22c55e' : '#dc2626'}`,
                                                        borderRadius: 6,
                                                        background: debugValidation.isValid ? '#f0fdf4' : '#fef2f2',
                                                        overflow: 'hidden'
                                                    }}>
                                                        {/* Header */}
                                                        <div style={{
                                                            padding: '8px 12px',
                                                            background: debugValidation.isValid ? '#22c55e' : '#dc2626',
                                                            color: '#fff',
                                                            fontSize: 12,
                                                            fontWeight: 600,
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: 6
                                                        }}>
                                                            <i className={`ms-Icon ms-Icon--${debugValidation.isValid ? 'CheckMark' : 'ErrorBadge'}`} style={{ fontSize: 12 }} />
                                                            {debugValidation.isValid ? 'Validation Passed' : 'Issues Found'}
                                                        </div>
                                                        
                                                        {/* Content */}
                                                        <div style={{ padding: 12, fontSize: 11 }}>
                                                            {/* Suggestions */}
                                                            {debugValidation.suggestions.length > 0 && (
                                                                <div style={{ marginBottom: 12 }}>
                                                                    <strong style={{ color: '#dc2626', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                                                                        <i className="ms-Icon ms-Icon--Error" style={{ fontSize: 11 }} />
                                                                        Critical Issues:
                                                                    </strong>
                                                                    <ul style={{ margin: 0, paddingLeft: 16, color: '#dc2626' }}>
                                                                        {debugValidation.suggestions.map((suggestion, index) => (
                                                                            <li key={index} style={{ marginBottom: 4 }}>{suggestion}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            
                                                            {/* Warnings */}
                                                            {debugValidation.warnings.length > 0 && (
                                                                <div style={{ marginBottom: 12 }}>
                                                                    <strong style={{ color: '#ea580c', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
                                                                        <i className="ms-Icon ms-Icon--Warning" style={{ fontSize: 11 }} />
                                                                        Warnings:
                                                                    </strong>
                                                                    <ul style={{ margin: 0, paddingLeft: 16, color: '#ea580c' }}>
                                                                        {debugValidation.warnings.map((warning, index) => (
                                                                            <li key={index} style={{ marginBottom: 4 }}>{warning}</li>
                                                                        ))}
                                                                    </ul>
                                                                </div>
                                                            )}
                                                            
                                                            {/* Step Predictions */}
                                                            {debugValidation.predictions.length > 0 && (
                                                                <div>
                                                                    <strong style={{ color: '#3690CE', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 8 }}>
                                                                        <i className="ms-Icon ms-Icon--TestStep" style={{ fontSize: 11 }} />
                                                                        Validation Step Predictions:
                                                                    </strong>
                                                                    <div style={{ display: 'grid', gap: 8 }}>
                                                                        {debugValidation.predictions.map((prediction, index) => (
                                                                            <div key={index} style={{
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                gap: 8,
                                                                                padding: 8,
                                                                                background: prediction.willPass ? 'rgba(34, 197, 94, 0.1)' : 'rgba(220, 38, 38, 0.1)',
                                                                                border: `1px solid ${prediction.willPass ? 'rgba(34, 197, 94, 0.3)' : 'rgba(220, 38, 38, 0.3)'}`,
                                                                                borderRadius: 4
                                                                            }}>
                                                                                <i className={`ms-Icon ms-Icon--${prediction.willPass ? 'CheckMark' : 'Cancel'}`} 
                                                                                   style={{ fontSize: 10, color: prediction.willPass ? '#22c55e' : '#dc2626' }} />
                                                                                <div style={{ flex: 1 }}>
                                                                                    <strong style={{ color: '#061733' }}>{prediction.step}</strong>
                                                                                    <div style={{ fontSize: 10, color: '#666', marginTop: 2 }}>
                                                                                        {prediction.reason}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

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

                                    {/* Formal confirmation control moved near submission buttons */}
                                    
                                    {/* Meta chips under header */}
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                                        {instructionRef && (
                                            <span style={{
                                                padding: '4px 8px',
                                                border: '1px solid #e1e5ea',
                                                borderRadius: 999,
                                                background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                                                fontSize: 12,
                                                fontWeight: 600,
                                                color: '#061733'
                                            }}>
                                                Instruction: {instructionRef}
                                            </span>
                                        )}
                                        {(matterIdState || matterRef) && (
                                            <span style={{
                                                padding: '4px 8px',
                                                border: '1px solid #e1e5ea',
                                                borderRadius: 999,
                                                background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                                                fontSize: 12,
                                                fontWeight: 600,
                                                color: '#061733'
                                            }}>
                                                Matter: {matterIdState || matterRef}
                                            </span>
                                        )}
                                        {stage && (
                                            <span style={{
                                                padding: '4px 8px',
                                                border: '1px solid #e1e5ea',
                                                borderRadius: 999,
                                                background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                                                fontSize: 12,
                                                fontWeight: 600,
                                                color: '#061733'
                                            }}>
                                                Stage: {stage}
                                            </span>
                                        )}
                                        <span style={{
                                            padding: '4px 8px',
                                            border: '1px solid #e1e5ea',
                                            borderRadius: 999,
                                            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                                            fontSize: 12,
                                            fontWeight: 600,
                                            color: '#061733'
                                        }}>
                                            Opening Date: {selectedDate ? selectedDate.toLocaleDateString('en-GB') : '-'}
                                        </span>
                                    </div>

                                    {/* Two-column layout */}
                                    <div style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 1fr',
                                        gap: 20,
                                        marginBottom: 8
                                    }}>
                                        {/* Client Information Card */}
                                        <div style={{
                                            border: '1px solid #e1e5ea',
                                            borderRadius: 8,
                                            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                                            padding: 14,
                                            position: 'relative'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                                <i className="ms-Icon ms-Icon--People" style={{ fontSize: 12, color: '#6b7280' }} />
                                                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Client Information</span>
                                            </div>
                                            {(() => {
                                                // Unique selection list
                                                const uniqueSelectedIds = Array.from(new Set(selectedPoidIds || []));
                                                const clients = uniqueSelectedIds
                                                    .map((id: string) => effectivePoidData.find(p => p.poid_id === id))
                                                    .filter(Boolean) as POID[];

                                                const isCompanyType = clientType === 'Company';
                                                const isMultiple = clientType === 'Multiple Individuals';

                                                const company = clients.find(c => c.company_name || (c as any).company_number);
                                                const directors = clients.filter(c => !(c.company_name || (c as any).company_number));

                                                // Utility formatters
                                                const formatPersonName = (p: POID) => `${p.first || ''} ${p.last || ''}`.trim();
                                                const formatPersonAddress = (p: POID) => {
                                                    const line1 = [p.house_building_number, p.street].filter(Boolean).join(' ').trim();
                                                    return [line1 || undefined, p.city, p.county, p.post_code, p.country].filter(Boolean).join(', ');
                                                };
                                                const formatCompanyAddress = (p: POID) => {
                                                    const line1 = [p.company_house_building_number, p.company_street].filter(Boolean).join(' ').trim();
                                                    return [line1 || undefined, p.company_city, p.company_county, p.company_post_code, p.company_country].filter(Boolean).join(', ');
                                                };
                                                const getPersonAddressLines = (p: POID): string[] => {
                                                    const l1 = [p.house_building_number, p.street].filter(Boolean).join(' ').trim();
                                                    const l2 = [p.city, p.county].filter(Boolean).join(', ').trim();
                                                    const l3 = [p.post_code, p.country].filter(Boolean).join(' ').trim();
                                                    return [l1, l2, l3].filter(Boolean);
                                                };
                                                const getCompanyAddressLines = (p: POID): string[] => {
                                                    const l1 = [p.company_house_building_number, p.company_street].filter(Boolean).join(' ').trim();
                                                    const l2 = [p.company_city, p.company_county].filter(Boolean).join(', ').trim();
                                                    const l3 = [p.company_post_code, p.company_country].filter(Boolean).join(' ').trim();
                                                    return [l1, l2, l3].filter(Boolean);
                                                };
                                                const formatDob = (dob?: string | null) => {
                                                    if (!dob) return undefined;
                                                    const d = new Date(dob);
                                                    return isNaN(d.getTime()) ? String(dob) : d.toLocaleDateString('en-GB');
                                                };
                                                const getBestPhone = (p: POID): string | undefined => {
                                                    const v = (p as unknown as Record<string, unknown>);
                                                    const raw = p.best_number ||
                                                        (v.phone as string | undefined) ||
                                                        (v.phone_number as string | undefined) ||
                                                        (v.phoneNumber as string | undefined) ||
                                                        (v.Phone as string | undefined) ||
                                                        instructionPhone ||
                                                        undefined;
                                                    return raw && String(raw).trim() ? String(raw).trim() : undefined;
                                                };

                                                // Build individuals list (for Individual / Multiple Individuals / Existing)
                                                let individualItems: Array<{ name: string; address?: string; email?: string }> = directors.map(p => ({
                                                    name: formatPersonName(p) || (p.email || ''),
                                                    address: formatPersonAddress(p) || undefined,
                                                    email: p.email || undefined
                                                }));

                                                // Include POIDs that are individuals when not a company flow
                                                if (!isCompanyType) {
                                                    const otherIndividuals = clients.filter(c => !(c.company_name || (c as any).company_number));
                                                    individualItems = otherIndividuals.map(p => ({
                                                        name: formatPersonName(p) || (p.email || ''),
                                                        address: formatPersonAddress(p) || undefined,
                                                        email: p.email || undefined
                                                    }));
                                                }

                                                // Add direct entry for Multiple Individuals if not duplicate
                                                const directEntryName = (isMultiple && clientAsOnFile && clientAsOnFile.trim()) ? clientAsOnFile.trim() : '';
                                                if (directEntryName) {
                                                    const exists = individualItems.some(i => i.name.toLowerCase() === directEntryName.toLowerCase());
                                                    if (!exists) individualItems.push({ name: directEntryName });
                                                }

                                                // Dedupe individuals by name (case-insensitive)
                                                const seen = new Set<string>();
                                                individualItems = individualItems.filter(i => {
                                                    const k = i.name.toLowerCase();
                                                    if (seen.has(k)) return false;
                                                    seen.add(k);
                                                    return true;
                                                });

                                                return (
                                                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: '#6B6B6B', fontSize: 12 }}>Type</span>
                                                            <span style={{ fontWeight: 600, fontSize: 12 }}>{clientType || '-'}</span>
                                                        </div>

                                                        {/* Company flow: render company + directors */}
                                                        {isCompanyType && company && (
                                                            <>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>Company</span>
                                                                    <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right' }}>{company.company_name || '-'}</span>
                                                                </div>
                                                                {(company as any).company_number && (
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                        <span style={{ color: '#6B6B6B', fontSize: 12 }}>Company No.</span>
                                                                        <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right' }}>{(company as any).company_number}</span>
                                                                    </div>
                                                                )}
                                                                {(() => {
                                                                    const lines = getCompanyAddressLines(company);
                                                                    return lines.length > 0 ? (
                                                                        <>
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                                <span style={{ color: '#6B6B6B', fontSize: 12 }}>Address</span>
                                                                                <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right', lineHeight: '1.3' }}>{lines[0]}</span>
                                                                            </div>
                                                                            {lines[1] && (
                                                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}></span>
                                                                                    <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right', lineHeight: '1.3' }}>{lines[1]}</span>
                                                                                </div>
                                                                            )}
                                                                            {lines[2] && (
                                                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}></span>
                                                                                    <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right', lineHeight: '1.3' }}>{lines[2]}</span>
                                                                                </div>
                                                                            )}
                                                                        </>
                                                                    ) : (
                                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                            <span style={{ color: '#6B6B6B', fontSize: 12 }}>Address</span>
                                                                            <span style={{ fontWeight: 600, fontSize: 12 }}>-</span>
                                                                        </div>
                                                                    );
                                                                })()}
                                                                {company.address_verification_result && (
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                        <span style={{ color: '#6B6B6B', fontSize: 12 }}>Check Result</span>
                                                                        <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right' }}>{company.address_verification_result}</span>
                                                                    </div>
                                                                )}
                                                                {directors.length > 0 && (
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
                                                                        <span style={{ color: '#6B6B6B', fontSize: 12 }}>Directors</span>
                                                                        <div style={{ textAlign: 'right', display: 'grid', gap: 8, maxWidth: '55%' }}>
                                                                            {directors.map((d, idx) => {
                                                                                const lines = getPersonAddressLines(d);
                                                                                return (
                                                                                    <div key={`dir-${d.poid_id}-${idx}`} style={{ display: 'grid', gap: 4 }}>
                                                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                                            <span style={{ color: '#6B6B6B', fontSize: 12 }}>Name</span>
                                                                                            <span style={{ fontWeight: 600, fontSize: 12 }}>{formatPersonName(d) || '-'}</span>
                                                                                        </div>
                                                                                        {lines.length > 0 && (
                                                                                            <>
                                                                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>Address</span>
                                                                                                    <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right', lineHeight: '1.3' }}>{lines[0]}</span>
                                                                                                </div>
                                                                                                {lines[1] && (
                                                                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                                                        <span style={{ color: '#6B6B6B', fontSize: 12 }}></span>
                                                                                                        <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right', lineHeight: '1.3' }}>{lines[1]}</span>
                                                                                                    </div>
                                                                                                )}
                                                                                                {lines[2] && (
                                                                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                                                        <span style={{ color: '#6B6B6B', fontSize: 12 }}></span>
                                                                                                        <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right', lineHeight: '1.3' }}>{lines[2]}</span>
                                                                                                    </div>
                                                                                                )}
                                                                                            </>
                                                                                        )}
                                                                                        {d.email && (
                                                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                                                <span style={{ color: '#6B6B6B', fontSize: 12 }}>Email</span>
                                                                                                <span style={{ fontWeight: 600, fontSize: 12 }}>{d.email}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {getBestPhone(d) && (
                                                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                                                <span style={{ color: '#6B6B6B', fontSize: 12 }}>Phone</span>
                                                                                                <span style={{ fontWeight: 600, fontSize: 12 }}>{getBestPhone(d)}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {d.date_of_birth && (
                                                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                                                <span style={{ color: '#6B6B6B', fontSize: 12 }}>DOB</span>
                                                                                                <span style={{ fontWeight: 600, fontSize: 12 }}>{formatDob(d.date_of_birth)}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {d.address_verification_result && (
                                                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                                                <span style={{ color: '#6B6B6B', fontSize: 12 }}>Check</span>
                                                                                                <span style={{ fontWeight: 600, fontSize: 12 }}>{d.address_verification_result}</span>
                                                                                            </div>
                                                                                        )}
                                                                                        {idx < directors.length - 1 && (
                                                                                            <div style={{ height: 1, background: '#eee', marginTop: 6 }} />
                                                                                        )}
                                                                                    </div>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}

                                                        {/* Individuals flow: render list */}
                                                        {!isCompanyType && individualItems.length > 0 && (
                                                            <div style={{ display: 'grid', gap: 8 }}>
                                                                {individualItems.map((i, idx) => {
                                                                    // Find backing POID to surface additional details
                                                                    const backing = clients.find(p => (formatPersonName(p) || (p.email || '')).toLowerCase() === i.name.toLowerCase());
                                                                    const lines = backing ? getPersonAddressLines(backing) : [];
                                                                    const check = backing && backing.address_verification_result ? backing.address_verification_result : undefined;
                                                                    const phone = backing ? getBestPhone(backing) : undefined;
                                                                    const dob = backing && backing.date_of_birth ? formatDob(backing.date_of_birth) : undefined;
                                                                    return (
                                                                        <div key={`ind-${idx}`} style={{ display: 'grid', gap: 4 }}>
                                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                                <span style={{ color: '#6B6B6B', fontSize: 12 }}>Name</span>
                                                                                <span style={{ fontWeight: 600, fontSize: 12 }}>{i.name}</span>
                                                                            </div>
                                                                            {lines.length > 0 && (
                                                                                <>
                                                                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                                        <span style={{ color: '#6B6B6B', fontSize: 12 }}>Address</span>
                                                                                        <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right', lineHeight: '1.3' }}>{lines[0]}</span>
                                                                                    </div>
                                                                                    {lines[1] && (
                                                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                                            <span style={{ color: '#6B6B6B', fontSize: 12 }}></span>
                                                                                            <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right', lineHeight: '1.3' }}>{lines[1]}</span>
                                                                                        </div>
                                                                                    )}
                                                                                    {lines[2] && (
                                                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                                            <span style={{ color: '#6B6B6B', fontSize: 12 }}></span>
                                                                                            <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right', lineHeight: '1.3' }}>{lines[2]}</span>
                                                                                        </div>
                                                                                    )}
                                                                                </>
                                                                            )}
                                                                            {i.email && (
                                                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>Email</span>
                                                                                    <span style={{ fontWeight: 600, fontSize: 12 }}>{i.email}</span>
                                                                                </div>
                                                                            )}
                                                                            {phone && (
                                                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>Phone</span>
                                                                                    <span style={{ fontWeight: 600, fontSize: 12 }}>{phone}</span>
                                                                                </div>
                                                                            )}
                                                                            {dob && (
                                                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>DOB</span>
                                                                                    <span style={{ fontWeight: 600, fontSize: 12 }}>{dob}</span>
                                                                                </div>
                                                                            )}
                                                                            {check && (
                                                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>Check</span>
                                                                                    <span style={{ fontWeight: 600, fontSize: 12 }}>{check}</span>
                                                                                </div>
                                                                            )}
                                                                            {idx < individualItems.length - 1 && (
                                                                                <div style={{ height: 1, background: '#eee', marginTop: 6 }} />
                                                                            )}
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {/* Fallback when nothing selected */}
                                                        {(!company && individualItems.length === 0) && (
                                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                                <span style={{ color: '#6B6B6B', fontSize: 12 }}>Selected</span>
                                                                <span style={{ fontWeight: 600, fontSize: 12 }}>-</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>

                                        {/* Matter Details Card */}
                                        <div style={{
                                            border: '1px solid #e1e5ea',
                                            borderRadius: 8,
                                            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                                            padding: 14
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                                <i className="ms-Icon ms-Icon--OpenFolderHorizontal" style={{ fontSize: 12, color: '#6b7280' }} />
                                                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Matter Details</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>Area of Work</span>
                                                    <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right' }}>{areaOfWork || '-'}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>Practice Area</span>
                                                    <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right' }}>{practiceArea || '-'}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>Description</span>
                                                    <span style={{ fontWeight: 600, fontSize: 12, maxWidth: '55%', textAlign: 'right', lineHeight: '1.3' }}>
                                                        {description ? (description.length > 50 ? `${description.substring(0, 50)}...` : description) : '-'}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>Dispute Value</span>
                                                    <span style={{ fontWeight: 600, fontSize: 12 }}>{disputeValue || '-'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Team & Management Card */}
                                        <div style={{
                                            border: '1px solid #e1e5ea',
                                            borderRadius: 8,
                                            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                                            padding: 14
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                                <i className="ms-Icon ms-Icon--ContactCard" style={{ fontSize: 12, color: '#6b7280' }} />
                                                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Team & Management</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>Opening Date</span>
                                                    <span style={{ fontWeight: 600, fontSize: 12 }}>{selectedDate ? selectedDate.toLocaleDateString('en-GB') : '-'}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>Solicitor</span>
                                                    <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right' }}>{teamMember || '-'}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>Supervising Partner</span>
                                                    <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right' }}>{supervisingPartner || '-'}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>Originating Solicitor</span>
                                                    <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right' }}>{originatingSolicitor || '-'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Additional Details Card */}
                                        <div style={{
                                            border: '1px solid #e1e5ea',
                                            borderRadius: 8,
                                            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                                            padding: 14
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                                <i className="ms-Icon ms-Icon--Info" style={{ fontSize: 12, color: '#6b7280' }} />
                                                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Additional Details</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>Source</span>
                                                    <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right' }}>
                                                        {source}{source === 'referral' && referrerName ? ` - ${referrerName}` : ''}
                                                    </span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>Folder Structure</span>
                                                    <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right' }}>{folderStructure || '-'}</span>
                                                </div>
                                                {budgetRequired === 'Yes' && (
                                                    <>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: '#6B6B6B', fontSize: 12 }}>Budget Amount</span>
                                                            <span style={{ fontWeight: 600, fontSize: 12 }}>{budgetAmount ? `£${budgetAmount}` : '-'}</span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: '#6B6B6B', fontSize: 12 }}>Notify Threshold</span>
                                                            <span style={{ fontWeight: 600, fontSize: 12 }}>{budgetThreshold ? `${budgetThreshold}%` : '-'}</span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Opponent Details Card */}
                                        <div style={{
                                            border: '1px solid #e1e5ea',
                                            borderRadius: 8,
                                            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                                            padding: 14
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                                <i className="ms-Icon ms-Icon--Contact" style={{ fontSize: 12, color: '#6b7280' }} />
                                                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Opponent Details</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>Company Name</span>
                                                    <span style={{ fontWeight: 600, fontSize: 12 }}>{opponentCompanyName || '-'}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>Title</span>
                                                    <span style={{ fontWeight: 600, fontSize: 12 }}>{opponentTitle || '-'}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>Name</span>
                                                    <span style={{ fontWeight: 600, fontSize: 12 }}>{`${opponentFirst || ''} ${opponentLast || ''}`.trim() || '-'}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>Email</span>
                                                    <span style={{ fontWeight: 600, fontSize: 12 }}>{opponentEmail || '-'}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>Phone</span>
                                                    <span style={{ fontWeight: 600, fontSize: 12 }}>{opponentPhone || '-'}</span>
                                                </div>
                                                {/* Compressed address display */}
                                                {(opponentHouseNumber || opponentStreet || opponentCity || opponentCounty || opponentPostcode || opponentCountry) && (
                                                    <>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: '#6B6B6B', fontSize: 12 }}>Address</span>
                                                            <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right', lineHeight: '1.3' }}>
                                                                {[opponentHouseNumber, opponentStreet].filter(Boolean).join(' ')}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: '#6B6B6B', fontSize: 12 }}></span>
                                                            <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right', lineHeight: '1.3' }}>
                                                                {[opponentCity, opponentCounty].filter(Boolean).join(', ')}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: '#6B6B6B', fontSize: 12 }}></span>
                                                            <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right', lineHeight: '1.3' }}>
                                                                {[opponentPostcode, opponentCountry].filter(Boolean).join(' ')}
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Opponent Solicitor Details Card */}
                                        <div style={{
                                            border: '1px solid #e1e5ea',
                                            borderRadius: 8,
                                            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                                            padding: 14
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                                                <i className="ms-Icon ms-Icon--ContactInfo" style={{ fontSize: 12, color: '#6b7280' }} />
                                                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>Opponent Solicitor</span>
                                            </div>
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 6 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>Company Name</span>
                                                    <span style={{ fontWeight: 600, fontSize: 12 }}>{opponentSolicitorCompany || '-'}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>Name</span>
                                                    <span style={{ fontWeight: 600, fontSize: 12 }}>{`${solicitorFirst || ''} ${solicitorLast || ''}`.trim() || '-'}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>Email</span>
                                                    <span style={{ fontWeight: 600, fontSize: 12 }}>{opponentSolicitorEmail || '-'}</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                    <span style={{ color: '#6B6B6B', fontSize: 12 }}>Phone</span>
                                                    <span style={{ fontWeight: 600, fontSize: 12 }}>{solicitorPhone || '-'}</span>
                                                </div>
                                                {/* Compressed address display */}
                                                {(solicitorHouseNumber || solicitorStreet || solicitorCity || solicitorCounty || solicitorPostcode || solicitorCountry) && (
                                                    <>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: '#6B6B6B', fontSize: 12 }}>Address</span>
                                                            <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right', lineHeight: '1.3' }}>
                                                                {[solicitorHouseNumber, solicitorStreet].filter(Boolean).join(' ')}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: '#6B6B6B', fontSize: 12 }}></span>
                                                            <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right', lineHeight: '1.3' }}>
                                                                {[solicitorCity, solicitorCounty].filter(Boolean).join(', ')}
                                                            </span>
                                                        </div>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                            <span style={{ color: '#6B6B6B', fontSize: 12 }}></span>
                                                            <span style={{ fontWeight: 600, fontSize: 12, textAlign: 'right', lineHeight: '1.3' }}>
                                                                {[solicitorPostcode, solicitorCountry].filter(Boolean).join(' ')}
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
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
                                            background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                                            border: '1px solid #e1e5ea',
                                            borderRadius: 8,
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 8,
                                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)'
                                        }}>
                                            <i className="ms-Icon ms-Icon--Info" 
                                               style={{ fontSize: 14, color: '#3690CE' }} />
                                            <span style={{ fontSize: 13, fontWeight: 600, color: '#061733' }}>
                                                Confirmation required before submission
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Workbench Section - appears below review when active */}
                            {workbenchMode && (
                                <div style={{ width: '100%', padding: '16px 0', boxSizing: 'border-box' }}>
                                    <div
                                        style={{
                                            border: '2px solid #3690CE',
                                            borderRadius: 10,
                                            background: 'linear-gradient(135deg, #F0F7FF 0%, #E6F3FF 100%)',
                                            padding: 24,
                                            margin: '16px 0',
                                            width: '100%',
                                            boxSizing: 'border-box',
                                            boxShadow: '0 8px 16px rgba(54, 144, 206, 0.15)',
                                            minHeight: '600px'
                                        }}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                                            <h4 style={{ 
                                                margin: 0, 
                                                fontWeight: 600, 
                                                fontSize: 18, 
                                                color: '#3690CE',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8
                                            }}>
                                                <i className="ms-Icon ms-Icon--WorkItem" style={{ fontSize: 16, color: '#3690CE' }} />
                                                Matter Opening Workbench
                                            </h4>
                                        </div>
                                        
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                            {/* Processing Summary (professional, on-brand) */}
                                            {(() => {
                                                const total = processingSteps.length || 0;
                                                const done = processingSteps.filter(s => s.status === 'success').length;
                                                const failed = processingSteps.filter(s => s.status === 'error').length;
                                                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                                                const statusText = failed > 0 ? 'Attention required' : (done === total && total > 0 ? 'Completed' : 'In progress');
                                                return (
                                                    <div style={{
                                                        border: '1px solid #e1e5ea',
                                                        borderRadius: 10,
                                                        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                                                        overflow: 'hidden',
                                                        padding: 16,
                                                        boxShadow: '0 4px 6px rgba(0,0,0,0.07)'
                                                    }}>
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <i className="ms-Icon ms-Icon--ProgressLoopOuter" style={{ fontSize: 14, color: '#D65541' }} />
                                                                <span style={{ fontSize: 13, fontWeight: 700, color: '#061733' }}>Processing</span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                                <span style={{ fontSize: 12, fontWeight: 700, color: failed ? '#D65541' : '#374151' }}>{statusText}</span>
                                                                <button
                                                                    onClick={() => setSupportPanelOpen(!supportPanelOpen)}
                                                                    style={{
                                                                        background: supportPanelOpen ? '#D65541' : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                                                                        color: supportPanelOpen ? '#fff' : '#D65541',
                                                                        border: '1px solid #D65541',
                                                                        borderRadius: 6,
                                                                        padding: '6px 10px',
                                                                        fontSize: 11,
                                                                        fontWeight: 600,
                                                                        cursor: 'pointer',
                                                                        transition: 'all 0.2s ease'
                                                                    }}
                                                                    title="Support Request"
                                                                >
                                                                    <i className="ms-Icon ms-Icon--Help" style={{ fontSize: 12 }} />
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {/* Processing stats in cleaner design */}
                                                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 12 }}>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <div style={{
                                                                    width: 8,
                                                                    height: 8,
                                                                    borderRadius: '50%',
                                                                    background: '#e5e7eb'
                                                                }}></div>
                                                                <span style={{ fontSize: 11, color: '#6b7280' }}>Total: {total}</span>
                                                            </div>
                                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                <div style={{
                                                                    width: 8,
                                                                    height: 8,
                                                                    borderRadius: '50%',
                                                                    background: '#22c55e'
                                                                }}></div>
                                                                <span style={{ fontSize: 11, color: '#6b7280' }}>Done: {done}</span>
                                                            </div>
                                                            {failed > 0 && (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                                    <div style={{
                                                                        width: 8,
                                                                        height: 8,
                                                                        borderRadius: '50%',
                                                                        background: '#ef4444'
                                                                    }}></div>
                                                                    <span style={{ fontSize: 11, color: '#ef4444' }}>Failed: {failed}</span>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Progress bar */}
                                                        <div style={{ 
                                                            height: 6, 
                                                            background: '#f3f4f6', 
                                                            borderRadius: 6, 
                                                            overflow: 'hidden',
                                                            marginBottom: 14
                                                        }}>
                                                            <div 
                                                                style={{ 
                                                                    height: '100%', 
                                                                    background: failed > 0 ? '#ef4444' : 'linear-gradient(90deg, #22c55e 0%, #16a34a 100%)', 
                                                                    width: `${pct}%`,
                                                                    transition: 'width 0.3s ease'
                                                                }}
                                                            />
                                                        </div>

                                                        {/* Processing Steps - professional grid */}
                                                        <div style={{ 
                                                            display: 'grid', 
                                                            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', 
                                                            gap: 8,
                                                            marginBottom: supportPanelOpen ? 12 : 0
                                                        }}>
                                                            {processingSteps.map((step, index) => (
                                                                <div 
                                                                    key={index} 
                                                                    style={{
                                                                        display: 'flex',
                                                                        alignItems: 'center',
                                                                        gap: 8,
                                                                        padding: '6px 8px',
                                                                        background: step.status === 'success' ? '#f0fdf4' : 
                                                                                   step.status === 'error' ? '#fef2f2' : 
                                                                                   step.status === 'pending' ? '#eff6ff' : '#f9fafb',
                                                                        border: step.status === 'success' ? '1px solid #bbf7d0' : 
                                                                               step.status === 'error' ? '1px solid #fecaca' : 
                                                                               step.status === 'pending' ? '1px solid #bfdbfe' : '1px solid #e5e7eb',
                                                                        borderRadius: 6,
                                                                        fontSize: 10,
                                                                        transition: 'all 0.2s ease'
                                                                    }}
                                                                >
                                                                    {step.status === 'pending' ? (
                                                                        <div style={{
                                                                            width: 10,
                                                                            height: 10,
                                                                            border: '1.5px solid #3b82f6',
                                                                            borderTop: '1.5px solid transparent',
                                                                            borderRadius: '50%',
                                                                            animation: 'spin 1s linear infinite'
                                                                        }} />
                                                                    ) : (
                                                                        <i 
                                                                            className={`ms-Icon ms-Icon--${
                                                                                step.status === 'success' ? 'CheckMark' : 
                                                                                step.status === 'error' ? 'Error' : 'Clock'
                                                                            }`} 
                                                                            style={{ 
                                                                                fontSize: 10,
                                                                                color: step.status === 'success' ? '#16a34a' : 
                                                                                       step.status === 'error' ? '#dc2626' : '#9ca3af'
                                                                            }} 
                                                                        />
                                                                    )}
                                                                    <span style={{
                                                                        color: step.status === 'success' ? '#15803d' : 
                                                                               step.status === 'error' ? '#dc2626' : 
                                                                               step.status === 'pending' ? '#1d4ed8' : '#6b7280',
                                                                        fontWeight: step.status === 'pending' ? 600 : 500,
                                                                        fontSize: 10
                                                                    }}>
                                                                        {step.label}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        {/* Support Panel (integrated, collapsible) */}
                                                        {supportPanelOpen && (
                                                            <div style={{
                                                                marginTop: 12,
                                                                padding: 12,
                                                                background: 'linear-gradient(135deg, #FEF7F0 0%, #FDF2E9 100%)',
                                                                border: '1px solid #F97316',
                                                                borderRadius: 8
                                                            }}>
                                                                <div style={{
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 8,
                                                                    marginBottom: 8
                                                                }}>
                                                                    <i className="ms-Icon ms-Icon--Help" style={{ fontSize: 12, color: '#ea580c' }} />
                                                                    <span style={{ fontSize: 12, fontWeight: 600, color: '#ea580c' }}>Request Support</span>
                                                                </div>
                                                                <div style={{ marginBottom: 8 }}>
                                                                    <select
                                                                        value={supportCategory}
                                                                        onChange={(e) => setSupportCategory(e.target.value as 'technical' | 'process' | 'data')}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '6px 8px',
                                                                            border: '1px solid #d1d5db',
                                                                            borderRadius: 4,
                                                                            fontSize: 11,
                                                                            marginBottom: 8
                                                                        }}
                                                                    >
                                                                        <option value="technical">Technical Issue</option>
                                                                        <option value="process">Process Question</option>
                                                                        <option value="data">Data Problem</option>
                                                                    </select>
                                                                    <textarea
                                                                        value={supportMessage}
                                                                        onChange={(e) => setSupportMessage(e.target.value)}
                                                                        placeholder="Describe the issue you're experiencing..."
                                                                        rows={3}
                                                                        style={{
                                                                            width: '100%',
                                                                            padding: '6px 8px',
                                                                            border: '1px solid #d1d5db',
                                                                            borderRadius: 4,
                                                                            fontSize: 12,
                                                                            resize: 'vertical',
                                                                            fontFamily: 'inherit'
                                                                        }}
                                                                    />
                                                                </div>
                                                                <button
                                                                    onClick={sendSupportRequest}
                                                                    disabled={!supportMessage.trim() || supportSending}
                                                                    style={{
                                                                        width: '100%',
                                                                        padding: '8px 16px',
                                                                        background: supportSending ? '#9ca3af' : 'linear-gradient(135deg, #D65541 0%, #B83C2B 100%)',
                                                                        color: '#fff',
                                                                        border: 'none',
                                                                        borderRadius: 6,
                                                                        fontSize: 12,
                                                                        fontWeight: 600,
                                                                        cursor: supportSending || !supportMessage.trim() ? 'not-allowed' : 'pointer',
                                                                        opacity: supportSending || !supportMessage.trim() ? 0.6 : 1,
                                                                        transition: 'all 0.2s ease'
                                                                    }}
                                                                >
                                                                    {supportSending ? 'Sending...' : 'Send Support Request'}
                                                                </button>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* CSS for smooth hover effects and navigation animations */}
                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        gap: 16,
                                        padding: '16px 20px',
                                        border: '1px solid #e1e5ea',
                                        borderRadius: 8,
                                        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                                        marginTop: 20,
                                        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.04)'
                                    }}>
                                        <label style={{ 
                                            display: 'flex', 
                                            alignItems: 'center', 
                                            gap: 12,
                                            cursor: 'pointer',
                                            flex: 1
                                        }}>
                                            <input
                                                type="checkbox"
                                                checked={confirmAcknowledge}
                                                onChange={(e) => setConfirmAcknowledge(e.currentTarget.checked)}
                                                style={{ 
                                                    width: 18, 
                                                    height: 18,
                                                    cursor: 'pointer',
                                                    accentColor: '#D65541'
                                                }}
                                            />
                                            <span style={{
                                                fontSize: 14,
                                                color: '#374151',
                                                lineHeight: 1.4
                                            }}>
                                                I confirm that all client and matter details shown above are accurate and complete
                                                {instructionRef && (
                                                    <span style={{ 
                                                        marginLeft: 6,
                                                        padding: '1px 6px',
                                                        background: '#f1f5f9',
                                                        color: '#475569',
                                                        borderRadius: 4,
                                                        fontSize: 12,
                                                        fontWeight: 500
                                                    }}>
                                                        {instructionRef}
                                                    </span>
                                                )}.
                                            </span>
                                        </label>

                                        <button
                                            type="button"
                                            onClick={() => confirmAcknowledge && setSummaryConfirmed(true)}
                                            disabled={!confirmAcknowledge}
                                            style={{
                                                background: confirmAcknowledge 
                                                    ? 'linear-gradient(135deg, #D65541 0%, #B83C2B 100%)' 
                                                    : '#f3f4f6',
                                                color: confirmAcknowledge ? '#fff' : '#9ca3af',
                                                border: confirmAcknowledge ? '1px solid #B83C2B' : '1px solid #d1d5db',
                                                borderRadius: 6,
                                                padding: '10px 16px',
                                                fontSize: 13,
                                                fontWeight: 600,
                                                cursor: confirmAcknowledge ? 'pointer' : 'not-allowed',
                                                transition: 'all 0.15s ease',
                                                minWidth: 110
                                            }}
                                            onMouseEnter={(e) => {
                                                if (confirmAcknowledge) {
                                                    e.currentTarget.style.transform = 'translateY(-1px)';
                                                    e.currentTarget.style.boxShadow = '0 3px 8px rgba(214, 85, 65, 0.2)';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (confirmAcknowledge) {
                                                    e.currentTarget.style.transform = 'translateY(0)';
                                                    e.currentTarget.style.boxShadow = 'none';
                                                }
                                            }}
                                        >
                                            Confirm
                                        </button>
                                    </div>

                    {/* CSS for smooth hover effects and navigation animations */}
                    <style>{`
                        .review-summary-hoverable {
                            box-shadow: none;
                        }
                        .review-summary-hoverable:hover {
                            border-color: #D65541 !important;
                            box-shadow: 0 0 0 1px #D65541;
                        }
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
                                            if (summaryConfirmed && !isProcessing) {
                                                // Start the processing simulation
                                                simulateProcessing().then(r => r && setGeneratedCclUrl(r.url));
                                            }
                                        }}
                                        style={{
                                            background: isProcessing ? '#e6f7ff' : summaryConfirmed ? '#f4f4f6' : '#f8f8f8',
                                            border: isProcessing ? '2px solid #1890ff' : summaryConfirmed ? '2px solid #e1dfdd' : '2px solid #ddd',
                                            borderRadius: '0px',
                                            width: '48px',
                                            height: '48px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            cursor: (summaryConfirmed && !isProcessing) ? 'pointer' : 'not-allowed',
                                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                            boxShadow: summaryConfirmed ? '0 1px 2px rgba(6,23,51,0.04)' : 'none',
                                            position: 'relative',
                                            overflow: 'hidden',
                                            opacity: (summaryConfirmed || isProcessing) ? 1 : 0.5,
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
                                        {/* Check Icon or Spinner */}
                                        {isProcessing ? (
                                            <div style={{
                                                position: 'absolute',
                                                left: '50%',
                                                top: '50%',
                                                transform: 'translate(-50%, -50%)',
                                                width: '18px',
                                                height: '18px',
                                                border: '2px solid #1890ff',
                                                borderTop: '2px solid transparent',
                                                borderRadius: '50%',
                                                animation: 'spin 1s linear infinite'
                                            }} />
                                        ) : (
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
                                        )}
                                        
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
                                            {isProcessing ? 'Processing...' : summaryConfirmed ? 'Submit Matter' : 'Confirm Summary First'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Bottom Processing Section moved below style */}

                        /* Spinner animation */
                        @keyframes spin {
                            0% { transform: translate(-50%, -50%) rotate(0deg); }
                            100% { transform: translate(-50%, -50%) rotate(360deg); }
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

                    {/* Explicit Open Matter action (restored for clarity) */}
                    {currentStep === 2 && (
                        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                onClick={() => {
                                    if (summaryConfirmed && !isProcessing) {
                                        simulateProcessing().then(r => r && setGeneratedCclUrl(r.url));
                                    }
                                }}
                                disabled={!summaryConfirmed || isProcessing}
                                style={{
                                    background: isProcessing
                                        ? 'linear-gradient(135deg, #FFFFFF 0%, #F1F5F9 100%)'
                                        : summaryConfirmed
                                            ? 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)'
                                            : 'linear-gradient(135deg, #FAFAFA 0%, #F1F5F9 100%)',
                                    border: summaryConfirmed ? '1px solid #D65541' : '1px solid #e1e5ea',
                                    color: summaryConfirmed ? '#D65541' : '#9ca3af',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    padding: '10px 20px',
                                    borderRadius: 8,
                                    cursor: (!summaryConfirmed || isProcessing) ? 'not-allowed' : 'pointer',
                                    boxShadow: summaryConfirmed ? '0 4px 6px rgba(0,0,0,0.07)' : 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 8,
                                    transition: 'all 0.25s ease',
                                    position: 'relative'
                                }}
                                onMouseEnter={(e) => {
                                    if (summaryConfirmed && !isProcessing) {
                                        e.currentTarget.style.transform = 'translateY(-1px)';
                                        e.currentTarget.style.boxShadow = '0 6px 10px rgba(0,0,0,0.08)';
                                    }
                                }}
                                onMouseLeave={(e) => {
                                    if (summaryConfirmed && !isProcessing) {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.07)';
                                    }
                                }}
                            >
                                {isProcessing ? (
                                    <>
                                        <span
                                            style={{
                                                width: 14,
                                                height: 14,
                                                border: '2px solid #D65541',
                                                borderTop: '2px solid transparent',
                                                borderRadius: '50%',
                                                animation: 'spin 1s linear infinite'
                                            }}
                                        />
                                        Processing...
                                    </>
                                ) : (
                                    <>
                                        <i className="ms-Icon ms-Icon--Play" style={{ fontSize: 14 }} />
                                        {summaryConfirmed ? 'Open Matter' : 'Confirm Summary First'}
                                    </>
                                )}
                            </button>
                        </div>
                    )}

                    {/* Bottom Processing Section (relocated) */}
                    {currentStep === 2 && (
                        <div style={{ marginTop: 32 }}>
                            {(() => {
                                const total = processingSteps.length || 0;
                                const done = processingSteps.filter(s => s.status === 'success').length;
                                const failed = processingSteps.filter(s => s.status === 'error').length;
                                const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                                const statusText = failed > 0 ? 'Attention required' : (done === total && total > 0 ? 'Completed' : 'In progress');
                                return (
                                    <div style={{
                                        border: '1px solid #e1e5ea',
                                        borderRadius: 10,
                                        background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                                        overflow: 'hidden',
                                        padding: 16,
                                        boxShadow: '0 4px 6px rgba(0,0,0,0.07)',
                                        marginBottom: 16
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <i className="ms-Icon ms-Icon--ProgressLoopOuter" style={{ fontSize: 14, color: '#D65541' }} />
                                                <span style={{ fontSize: 13, fontWeight: 700, color: '#061733' }}>Processing</span>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 12, fontWeight: 700, color: failed ? '#D65541' : '#374151' }}>{statusText}</span>
                                                <button
                                                    onClick={() => setSupportPanelOpen(!supportPanelOpen)}
                                                    style={{
                                                        background: supportPanelOpen ? '#D65541' : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                                                        color: supportPanelOpen ? '#fff' : '#D65541',
                                                        border: '1px solid #D65541',
                                                        borderRadius: 6,
                                                        padding: '6px 10px',
                                                        fontSize: 11,
                                                        fontWeight: 600,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    title="Support Request"
                                                >
                                                    <i className="ms-Icon ms-Icon--Help" style={{ fontSize: 12 }} />
                                                </button>
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 10 }}>
                                            <div style={{ fontSize: 28, fontWeight: 800, color: '#061733', minWidth: 64, textAlign: 'right' }}>{pct}%</div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ height: 10, background: '#eef2f7', borderRadius: 999, overflow: 'hidden' }}>
                                                    <div style={{
                                                        width: `${pct}%`,
                                                        height: '100%',
                                                        background: 'linear-gradient(135deg, #49B670 0%, #15803d 100%)',
                                                        transition: 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)'
                                                    }} />
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
                                                    <span style={{ fontSize: 12, color: '#6b7280' }}>Completed</span>
                                                    <span style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>{done} of {total}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {total > 0 && (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(36px, 1fr))', gap: 8, marginBottom: 8 }}>
                                                {processingSteps.map((s, idx) => (
                                                    <div key={`mini-bottom-${idx}`} title={s.label} style={{
                                                        height: 36,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        borderRadius: 6,
                                                        border: '1px solid #e5e7eb',
                                                        background: s.status === 'success' ? '#f0fdf4' : s.status === 'error' ? '#fef2f2' : '#fff'
                                                    }}>
                                                        {s.icon ? (
                                                            <img src={s.icon} alt="" style={{ width: 18, height: 18, opacity: s.status === 'pending' ? 0.6 : 1 }} />
                                                        ) : (
                                                            <i className={`ms-Icon ${s.status === 'success' ? 'ms-Icon--CheckMark' : s.status === 'error' ? 'ms-Icon--ErrorBadge' : 'ms-Icon--Clock'}`} style={{ fontSize: 16, color: s.status === 'success' ? '#16a34a' : s.status === 'error' ? '#dc2626' : '#6b7280' }} />
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {adminEligible ? (
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <span style={{ fontSize: 11, color: '#64748b' }}>Admins & local dev can view backend operation details</span>
                                                <button
                                                    onClick={() => setDebugPanelOpen(!debugPanelOpen)}
                                                    style={{
                                                        background: debugPanelOpen ? '#D65541' : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                                                        color: debugPanelOpen ? '#fff' : '#D65541',
                                                        border: '1px solid #D65541',
                                                        borderRadius: 6,
                                                        padding: '6px 10px',
                                                        fontSize: 11,
                                                        fontWeight: 700,
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    {debugPanelOpen ? 'Hide admin details' : 'Show admin details'}
                                                </button>
                                            </div>
                                        ) : (
                                            <div style={{ fontSize: 11, color: '#94a3b8' }}>Backend details are restricted to admins</div>
                                        )}
                                    </div>
                                );
                            })()}

                            {/* Debug Panel */}
                            {adminEligible && debugPanelOpen && (
                                <div style={{
                                    border: '1px solid #e1e5ea',
                                    borderRadius: 8,
                                    background: '#fff',
                                    overflow: 'hidden',
                                    marginBottom: 16
                                }}>
                                    <div style={{
                                        padding: '12px 16px',
                                        background: 'linear-gradient(135deg, #111827 0%, #1f2937 100%)',
                                        color: '#fff',
                                        fontSize: 13,
                                        fontWeight: 700,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}>
                                        <span>Backend Operations (Admin)</span>
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
                                            Copy JSON
                                        </button>
                                    </div>
                                    <div style={{ padding: 12, display: 'grid', gap: 12 }}>
                                        <div style={{
                                            border: '1px solid #e5e7eb',
                                            borderRadius: 6,
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                padding: '8px 12px',
                                                background: '#f8fafc',
                                                fontSize: 12,
                                                fontWeight: 700,
                                                color: '#374151'
                                            }}>
                                                Operations
                                            </div>
                                            <div style={{ maxHeight: 240, overflow: 'auto', padding: 8 }}>
                                                {processingSteps.map((step, idx) => {
                                                    const events = operationEvents.filter(e => e.index === idx);
                                                    const sent = events.find(e => e.phase === 'sent');
                                                    const responded = events.find(e => e.phase === 'response');
                                                    const succeeded = events.find(e => e.phase === 'success');
                                                    const errored = events.find(e => e.phase === 'error');
                                                    return (
                                                        <div key={`op-bottom-${idx}`} style={{ display: 'grid', gap: 6, padding: '8px 4px', borderBottom: '1px solid #f1f5f9' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontSize: 12, color: '#111827', fontWeight: 700 }}>{step.label}</span>
                                                                <span style={{ fontSize: 11, fontWeight: 800, color: step.status === 'success' ? '#16a34a' : step.status === 'error' ? '#dc2626' : '#64748b' }}>
                                                                    {step.status.toUpperCase()}
                                                                </span>
                                                            </div>
                                                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                                                <span style={{ fontSize: 11, color: sent ? '#334155' : '#94a3b8' }}>Sent{sent?.method ? ` (${sent.method})` : ''}</span>
                                                                <span style={{ fontSize: 11, color: responded ? '#334155' : '#94a3b8' }}>Responded{responded?.status ? ` (${responded.status})` : ''}</span>
                                                                <span style={{ fontSize: 11, color: succeeded ? '#16a34a' : '#94a3b8' }}>Succeeded</span>
                                                            </div>
                                                            {errored && (
                                                                <div style={{ display: 'grid', gap: 6 }}>
                                                                    <div style={{ fontSize: 11, color: '#dc2626', fontWeight: 700 }}>Failure details</div>
                                                                    {errored.payloadSummary && (
                                                                        <div style={{
                                                                            padding: 8,
                                                                            background: '#fef2f2',
                                                                            border: '1px solid #fecaca',
                                                                            borderRadius: 6,
                                                                            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                                                                            fontSize: 11,
                                                                            whiteSpace: 'pre-wrap'
                                                                        }}>
                                                                            {errored.payloadSummary}
                                                                        </div>
                                                                    )}
                                                                    {errored.responseSummary && (
                                                                        <div style={{
                                                                            padding: 8,
                                                                            background: '#fef2f2',
                                                                            border: '1px solid #fecaca',
                                                                            borderRadius: 6,
                                                                            fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                                                                            fontSize: 11,
                                                                            whiteSpace: 'pre-wrap'
                                                                        }}>
                                                                            {errored.responseSummary}
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div style={{ display: 'grid', gap: 8 }}>
                                            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Request payload</div>
                                            <div style={{
                                                padding: 10,
                                                background: '#f8fafc',
                                                border: '1px solid #e5e7eb',
                                                borderRadius: 6,
                                                fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                                                fontSize: 11,
                                                maxHeight: 220,
                                                overflow: 'auto'
                                            }}>
                                                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                                                    {JSON.stringify(generateSampleJson(), null, 2)}
                                                </pre>
                                            </div>
                                            {processingLogs.length > 0 && (
                                                <>
                                                    <div style={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>Responses & logs</div>
                                                    <div style={{
                                                        padding: 10,
                                                        background: '#f8fafc',
                                                        border: '1px solid #e5e7eb',
                                                        borderRadius: 6,
                                                        fontFamily: 'Monaco, Consolas, "Courier New", monospace',
                                                        fontSize: 11,
                                                        maxHeight: 220,
                                                        overflow: 'auto'
                                                    }}>
                                                        {processingLogs.map((log, idx) => (
                                                            <div key={`log-bottom-${idx}`}>{log}</div>
                                                        ))}
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Support Panel */}
                            {supportPanelOpen && (
                                <div style={{
                                    border: '1px solid #e1e5ea',
                                    borderRadius: 8,
                                    background: '#fff',
                                    overflow: 'hidden',
                                    marginBottom: 32
                                }}>
                                    <div style={{
                                        padding: '12px 16px',
                                        background: 'linear-gradient(135deg, #D65541 0%, #B83C2B 100%)',
                                        color: '#fff',
                                        fontSize: 13,
                                        fontWeight: 600,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 8
                                    }}>
                                        <i className="ms-Icon ms-Icon--Help" style={{ fontSize: 14 }} />
                                        Support Request
                                    </div>
                                    <div style={{ padding: 16 }}>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                                                Category
                                            </label>
                                            <select
                                                value={supportCategory}
                                                onChange={(e) => setSupportCategory(e.target.value as any)}
                                                style={{
                                                    width: '100%',
                                                    padding: '8px 12px',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: 6,
                                                    fontSize: 12,
                                                    background: '#fff'
                                                }}
                                            >
                                                <option value="technical">Technical Issue</option>
                                                <option value="process">Process Question</option>
                                                <option value="data">Data Problem</option>
                                            </select>
                                        </div>
                                        <div style={{ marginBottom: 12 }}>
                                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: '#374151' }}>
                                                Describe the issue
                                            </label>
                                            <textarea
                                                value={supportMessage}
                                                onChange={(e) => setSupportMessage(e.target.value)}
                                                placeholder="Please describe what's happening and any steps to reproduce the issue..."
                                                style={{
                                                    width: '100%',
                                                    height: 80,
                                                    padding: '8px 12px',
                                                    border: '1px solid #d1d5db',
                                                    borderRadius: 6,
                                                    fontSize: 12,
                                                    resize: 'vertical',
                                                    fontFamily: 'inherit'
                                                }}
                                            />
                                        </div>
                                        <button
                                            onClick={sendSupportRequest}
                                            disabled={!supportMessage.trim() || supportSending}
                                            style={{
                                                width: '100%',
                                                padding: '8px 16px',
                                                background: supportSending ? '#9ca3af' : 'linear-gradient(135deg, #D65541 0%, #B83C2B 100%)',
                                                color: '#fff',
                                                border: 'none',
                                                borderRadius: 6,
                                                fontSize: 12,
                                                fontWeight: 600,
                                                cursor: supportSending || !supportMessage.trim() ? 'not-allowed' : 'pointer',
                                                opacity: supportSending || !supportMessage.trim() ? 0.6 : 1,
                                                transition: 'all 0.2s ease'
                                            }}
                                        >
                                            {supportSending ? 'Sending...' : 'Send Support Request'}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
            </Stack>
        </CompletionProvider>
    );
}

export default FlatMatterOpening;