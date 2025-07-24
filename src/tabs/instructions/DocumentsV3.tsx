import React, { useState, useEffect } from 'react';
import { Stack, TextField, Toggle, Dropdown, MessageBar, MessageBarType } from '@fluentui/react';
import { Panel } from '@fluentui/react/lib/Panel';
import { InstructionData } from '../../app/functionality/types';
import { useTheme } from '../../app/functionality/ThemeContext';
import QuickActionsCard from '../home/QuickActionsCard';
import { colours } from '../../app/styles/colours';
import { Icon } from '@fluentui/react/lib/Icon';
import localUserData from '../../localData/localUserData.json';
import TemplateSelectionStep from './ccl/TemplateSelectionStep';
import TemplateEditorStep from './ccl/TemplateEditorStep';
import PreviewActionsStep from './ccl/PreviewActionsStep';
import PresetPanel from './ccl/PresetPanel';
import HoverTooltip from './ccl/HoverTooltip';
import { injectPlaceholderStyles } from './ccl/placeholderStyles';

// Inject styles into document head
injectPlaceholderStyles();

const DEFAULT_CCL_TEMPLATE = `Dear {{insert_clients_name}}

{{insert_heading_eg_matter_description}}

Thank you for your instructions to act on your behalf in connection with {{matter}}. This Engagement Letter and the attached Terms of Business explain the basis on which we will be acting for you—together they form the contract between us.

Please contact me if you have any difficulty understanding this Engagement Letter or other information we may provide, eg if anything in this letter is unclear or you require information to be provided in larger text, another format or a different language.

1 Contact details and supervision

The person dealing with your matter is {{name_of_person_handling_matter}}, who is a {{status}}. Their contact details are:

Telephone number: {{fee_earner_phone}}
Email address: {{fee_earner_email}}
Postal address: {{fee_earner_postal_address}}

The best way to contact {{name_of_handler}} is {{email}}.

If {{handler}} is not available, the following members of staff may be able to deal with any queries you have:

{{names_and_contact_details_of_other_members_of_staff_who_can_help_with_queries}}

The person with overall responsibility for supervising your matter is {{name}}, who is a Partner.

2 Scope of services

{{insert_current_position_and_scope_of_retainer}} ("Initial Scope")

We will provide legal advice and services to you with reasonable care and skill. However, the nature of many types of legal work means that it is not possible to guarantee a particular outcome.

Our Terms of Business sets out general limitations on the scope of our services. Your matter may involve issues for which you need tax advice. We cannot and do not give advice on taxation and you should seek the advice of a suitably qualified tax expert. Where your case needs expert evidence then you will need to identify, with us, a suitably qualified expert to give an opinion. Any expert fees will be your responsibility.

3 Next steps

The next steps in your matter are {{next_steps}}.

We expect this will take {{realistic_timescale}}. This is an estimate only. We will tell you if it is necessary to revise this timescale.

4 Legal costs

There are three main elements to the legal costs of any matter:

—our charges (see section 4.1 below);

—expenses we must pay on your behalf—sometimes called disbursements (see section 4.2 below);

—costs that you may have to pay another party (see section 4.3 below).

4.1 Our charges

{{charges_section_choice}}

4.2 Disbursements (expenses)

Disbursements are expenses we must pay on your behalf.

{{disbursements_section_choice}}

4.3 Costs you may have to pay another party

{{costs_section_choice}}

5 Funding and billing

You are responsible for the legal costs set out in this Engagement Letter.

Unless agreed otherwise, our interim bills are detailed bills and are final in respect of the period to which they relate, save that disbursements may be billed separately and later than the interim bill for our charges in respect of the same period. We will send you a final bill at the end of your matter which will cover our charges from the date of the last interim bill and any unbilled disbursements. You have the right to challenge any interim bill or the final bill by applying to the court to assess the bill under the Solicitors Act 1974. The usual time limit for applying to the court for an assessment is one month from the date of delivery of the interim or final bill. Please be aware that the time limit runs from the date of each individual bill.

Invoices are due forthwith with interest payable from 14 days after the date of the invoice.

6 Payment on account of costs

Please provide us with £{{figure}} on account of costs. Our account is:

Helix Law General Client Account, Barclays Bank, Eastbourne, 20-27-91 93472434

Please use the reference << Matter.Number >>

We work with money on account at all times, unless otherwise agreed in writing. This means that you should pay any invoice in full immediately, even if we hold money on account. If you fail pay an invoice when due, fail to maintain a reasonable sum on account of costs and/or disbursements we may, at our discretion, suspend work. We may terminate the retainer if the invoice is more than 14 days overdue. We may also terminate the retainer if you refuse, neglect or are unable to pay a reasonable sum on account of costs and/or disbursements within a reasonable time of it being requested. For urgent matters or necessary steps that require immediate action that reasonable time may be measured in hours.

7 Costs updates

We have agreed to provide you with an update on the amount of costs when appropriate as the matter progresses{{and_or_intervals_eg_every_three_months}}.

8 Risk analysis

We have discussed whether the potential outcome of your matter justifies the expense and risk involved. Our preliminary assessment is that it does.

9 Limitation

Each cause of action has a strict time limit after which you cannot bring a claim. Contract claims could be 6 years from the date the sums claimed/damages fell due/accrued.

If there is some fact that I have not been given or you disagree with my view on the limitation period then please let me know at once.

10 Data protection

We take your privacy very seriously. Our Privacy policy contains important information on how and why we collect, process and store your personal data. It also explains your rights in relation to your personal data. The Privacy policy is available on our website at Helix Law Privacy Policy, but please contact us if you would like us to send a copy to you or if you would prefer us to explain our Privacy policy verbally.

We use outside counsel, experts, software providers and an external file auditors so your confidential information will be shared with them. Each will be bound to confidentiality by the particular contract with us and/or their professional obligations to you and to us.

11 Marketing

We may use your personal data to send you updates (by email, text, telephone or post) about legal developments that might be of interest to you and/or information about our services, including exclusive offers, promotions or new services. You have the right to opt out of receiving promotional communications at any time, by:

—contacting us at {{contact_details_for_marketing_opt_out}};

—using the 'unsubscribe' link in emails or 'STOP' number in texts;

—updating your marketing preferences on our {{link_to_preference_centre}}.

12 Prevention of money laundering, terrorist financing and proliferation financing

We are required by law to obtain satisfactory evidence of the identity of our clients and also sometimes people related to them. This includes where monies are received from third parties on your behalf. This is because solicitors deal with money and property on behalf of clients and criminals can at times therefore attempt to use our services and accounts in an attempt to launder money. We therefore need to obtain and retain evidence of your identity. Most Solicitor firms request that their clients provide evidence of their identity themselves. However, we recognise that this can be time consuming and we therefore obtain confirmation of your identity using a search service, at our cost. Please note that if you do not wish us to verify your identity electronically you must bring this to our immediate attention. The electronic search process does leave an electronic 'footprint' each time a search is conducted. Footprints detail the date, time and reason for a search and certain types of search footprints are used in credit scoring systems and may have a detrimental impact on a consumer's ability to obtain credit.

Unfortunately if the report is unsuccessful i.e. if you have only recently moved address, we may need to ask you to send in certain documents for our records, such as a recent utility bill confirming your address, and photographic identity documents such as a passport or driving licence. If this is necessary the identity documents should be provided by you, as our client or, where our client is a limited company, by a Director of the company. If you wish to provide us with authority to discuss your matter with any third party we must have your authority confirmed in writing. Please contact me if you have any queries regarding this.

13 Duties to the court

Your matter {{may_will}} involve court proceedings. All solicitors have a professional duty to uphold the rule of law and the proper administration of justice. We must comply with our duties to the court, even where this conflicts with our obligations to you. This means that we must not:

—attempt to deceive or knowingly or recklessly mislead the court

—be complicit in another person deceiving or misleading the court

—place ourselves in contempt of court

—make or offer payments to witnesses who depend on their evidence or the outcome of the case

We must also comply with court orders that put obligations on us and ensure that evidence relating to sensitive issues is not misused.

The court gives orders and there are strict times for complying with those orders. If the orders aren't followed in time then it may result in your case being struck out and an order for costs being made against you. It is your responsibility to reply quickly to any request for information, documents and instructions we may make of you. If you leave it to the last minute we cannot guarantee that you will be able to complete our work in time as we may have other matters and court proceedings that prevent us meeting your deadline.

In all litigation and disputes all parties have a duty to preserve evidence that is relevant to the dispute, including physical and electronic records and documents which either help your case and also includes those which are against you. This duty is important not least as if documents are deleted or destroyed that are relevant to the dispute our advice to you may be compromised. Further if documents are destroyed the court will be entitled to assume the absolute worst in terms of their content. This is likely to be extremely unhelpful to your case. Please contact me if you have any queries regarding this.

14 Complaints

We want to give you the best possible service. However, if at any point you become unhappy or concerned about the service we have provided you should inform us immediately so we can do our best to resolve the problem.

In the first instance it may be helpful to contact the person who is working on your case to discuss your concerns and we will do our best to resolve any issues. If you would like to make a formal complaint, you can read our full complaints procedure here. Making a complaint will not affect how we handle your matter.

You may have a right to complain to the Legal Ombudsman. The time frame for doing so and full details of how to contact the Legal Ombudsman are in our Terms of Business.

15 Limit on liability

Our maximum liability to you (or any other party we have agreed may rely on our services) in relation to any single matter or any group of connected matters which may be aggregated by our insurers will be £3,000,000, including interest and costs. This limit overrides any limit stated in our Terms of Business.

If you wish to discuss a variation of this limit, please contact the person dealing with your matter. Agreeing a higher limit on our liability may result in us seeking an increase in our charges for handling your matter.

Please see our Terms of Business for an explanation of other limits on our liability to you.

16 Referral and fee sharing arrangement

{{explain_the_nature_of_your_arrangement_with_any_introducer_for_link_to_sample_wording_see_drafting_note_referral_and_fee_sharing_arrangement}}

17 Right to cancel

You have the right to cancel this contract within 14 days without giving any reason. We will not start work during the cancellation period unless you expressly ask us to. The 'Instructions for Cancellation' notice at {{instructions_link}} explains:

—how to cancel and the effect of cancellation;

—what you will be liable for if you ask us to start work during the cancellation period.

18 Action points

The action list below explains what you need to do next.

Action required by you | Additional information
☐ Sign and return one copy of the Terms of Business below | If you don't sign but continue to give us instructions you will be deemed to have accepted the terms in this letter and the Terms of Business
☐ {{insert_next_step_you_would_like_client_to_take}} | {{state_why_this_step_is_important}}
☐ Provide a payment on account of costs and disbursements of £{{state_amount}} | If we do not receive a payment on account of costs and disbursements, there may be a delay in starting work on your behalf
☐ If you would like us to start work during the 14-day cancellation period, sign and return the attached 'Request to start work during the cancellation period' form | This form is attached to this Engagement Letter
☐ Alternatively, if wish to cancel your contract with us, tell us within 14 days | You can simply inform us of your decision to cancel by letter, telephone or e-mail
☐ Provide the following documents [and information] to allow me to take the next steps in your matter: | Without these documents there may be a delay in your matter.

{{describe_first_document_or_information_you_need_from_your_client}}
{{describe_second_document_or_information_you_need_from_your_client}}
{{describe_third_document_or_information_you_need_from_your_client}}

Please contact me if you have any queries or concerns about your matter, this Engagement Letter or the attached Terms of Business.`;

const MESSAGE_TEMPLATES = {
    ccl: DEFAULT_CCL_TEMPLATE,
    custom: ''
};

interface DocumentsV3Props {
    isInstructionBasedMode?: boolean;
    selectedInstructionProp?: InstructionData;
    initialTemplate?: 'ccl' | 'custom';
    matterData?: any;
    instructions?: InstructionData[];
}

const DocumentsV3: React.FC<DocumentsV3Props> = ({ 
    isInstructionBasedMode = false, 
    selectedInstructionProp, 
    initialTemplate,
    matterData, 
    instructions = [] 
}) => {
    const { isDarkMode } = useTheme();
    
    // Step management - 3 distinct pages
    // If both instruction and template are provided, skip to editor
    const skipSelection = !!selectedInstructionProp && !!initialTemplate;
    const [currentStep, setCurrentStep] = useState(skipSelection ? 2 : 1);

    // Step 1: Instruction & Template Selection
    const [selectedInstruction, setSelectedInstruction] = useState<InstructionData | null>(selectedInstructionProp || null);
    const [hasSelectedInstruction, setHasSelectedInstruction] = useState<boolean>(!!selectedInstructionProp);
    const [userHasInteracted, setUserHasInteracted] = useState<boolean>(!!selectedInstructionProp);
    const [selectedTemplate, setSelectedTemplate] = useState<'ccl' | 'custom' | null>(initialTemplate ?? null);
    const [instructionSearchTerm, setInstructionSearchTerm] = useState<string>('');

    // Step 2: Editor & Template Fields
    const [documentContent, setDocumentContent] = useState('');

    // Apply initial template on mount
    useEffect(() => {
        if (initialTemplate) {
            setSelectedTemplate(initialTemplate);
            setDocumentContent(MESSAGE_TEMPLATES[initialTemplate]);
        }
    }, [initialTemplate]);
    const [templateFields, setTemplateFields] = useState<Record<string, string>>({
        insert_clients_name: '',
        insert_heading_eg_matter_description: '',
        matter: '',
        name_of_person_handling_matter: '',
        status: '',
        email: '',
        insert_current_position_and_scope_of_retainer: '',
        next_steps: '',
        realistic_timescale: '',
        identify_the_other_party_eg_your_opponents: ''
    });
    const [activeField, setActiveField] = useState<string | null>(null);
    const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
    
    // Choice for costs section (4.3)
    const [costsChoice, setCostsChoice] = useState<'no_costs' | 'risk_costs' | null>(null);
    
    // Choice for disbursements section (4.2)
    const [disbursementsChoice, setDisbursementsChoice] = useState<'table' | 'estimate' | null>(null);
    // Show/hide estimate examples input (for estimate format)
    const [showEstimateExamples, setShowEstimateExamples] = useState(false);
    // Number of disbursement rows to display
    const [disbursementRowCount, setDisbursementRowCount] = useState(1);
    
    // Choice for charges section (4.1)
    const [chargesChoice, setChargesChoice] = useState<'hourly_rate' | 'no_estimate' | null>(null);
    const [showChargesChoice, setShowChargesChoice] = useState(true);
    const [showCostsChoice, setShowCostsChoice] = useState(true);
    const [showDisbursementsChoice, setShowDisbursementsChoice] = useState(true);
    
    // Responsive design state
    const [windowWidth, setWindowWidth] = useState(window.innerWidth);
    
    // Step 3: Preview & Actions
    const [message, setMessage] = useState<{ type: MessageBarType; text: string } | null>(null);
    const [tokensOpen, setTokensOpen] = useState(false);
    const [showPresets, setShowPresets] = useState(false);
    const [presetField, setPresetField] = useState<string | null>(null);
    const [presetPosition, setPresetPosition] = useState({ x: 0, y: 0 });
    
    // Hover tooltip state
    const [hoveredField, setHoveredField] = useState<string | null>(null);
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
    const [isFieldsOnlyView, setIsFieldsOnlyView] = useState(false);

    // Handle click outside to close dropdowns
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (!target.closest('.examples-dropdown')) {
                // Just close the dropdown without affecting React state
                const dropdown = document.getElementById('examples-dropdown');
                if (dropdown) {
                    dropdown.style.display = 'none';
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []); // Empty dependency array - this effect runs once and stays active

    // Field display names for hover tooltips
    const FIELD_DISPLAY_NAMES = {
        insert_clients_name: "Client Name",
        insert_heading_eg_matter_description: "Matter Heading",
        matter: "Matter Type",
        name_of_person_handling_matter: "Handler Name",
        status: "Handler Status",
        name_of_handler: "Handler Short Name",
        handler: "Handler Reference",
        email: "Contact Method",
        insert_current_position_and_scope_of_retainer: "Scope of Work",
        next_steps: "Next Actions",
        realistic_timescale: "Timeline",
        next_stage: "Next Milestone",
        figure: "Payment Amount",
        figure_or_range: "Cost Estimate",
        we_cannot_give_an_estimate_of_our_overall_charges_in_this_matter_because_reason_why_estimate_is_not_possible: "No Estimate Reason",
        estimate: "Disbursement Estimate",
        in_total_including_vat_or_for_the_next_steps_in_your_matter: "Estimate Scope",
        give_examples_of_what_your_estimate_includes_eg_accountants_report_and_court_fees: "Estimate Includes",
        identify_the_other_party_eg_your_opponents: "Opposing Party",
        may_will: "Litigation Likelihood",
        and_or_intervals_eg_every_three_months: "Cost Update Frequency",
        contact_details_for_marketing_opt_out: "Marketing Contact",
        link_to_preference_centre: "Preference Centre URL",
        explain_the_nature_of_your_arrangement_with_any_introducer_for_link_to_sample_wording_see_drafting_note_referral_and_fee_sharing_arrangement: "Referral Arrangement",
        instructions_link: "Cancellation Instructions URL",
        name: "Supervisor Name",
        names_and_contact_details_of_other_members_of_staff_who_can_help_with_queries: "Support Staff",
        name_of_firm: "Firm Name",
        // New disbursement fields
        simple_disbursements_estimate: "Simple Estimate Amount",
        detailed_disbursements_examples: "Detailed Examples",
        detailed_disbursements_total: "Detailed Total",
        disbursement_1_description: "Disbursement 1 Description",
        disbursement_1_amount: "Disbursement 1 Amount",
        disbursement_1_vat: "Disbursement 1 VAT",
        disbursement_1_notes: "Disbursement 1 Notes",
        disbursement_2_description: "Disbursement 2 Description",
        disbursement_2_amount: "Disbursement 2 Amount",
        disbursement_2_vat: "Disbursement 2 VAT",
        disbursement_2_notes: "Disbursement 2 Notes",
        disbursement_3_description: "Disbursement 3 Description",
        disbursement_3_amount: "Disbursement 3 Amount",
        disbursement_3_vat: "Disbursement 3 VAT",
        disbursement_3_notes: "Disbursement 3 Notes",
        insert_next_step_you_would_like_client_to_take: "Next Step for Client",
        state_why_this_step_is_important: "Step Importance",
        state_amount: "Payment Amount",
        describe_first_document_or_information_you_need_from_your_client: "First Document Required",
        describe_second_document_or_information_you_need_from_your_client: "Second Document Required",
        describe_third_document_or_information_you_need_from_your_client: "Third Document Required",
        matter_number: "Matter Reference Number"
    };

    // Preset data for template fields
    const FIELD_PRESETS = {
        insert_clients_name: [
            "Mr. John Smith",
            "Mrs. Sarah Johnson", 
            "Ms. Emily Davis",
            "Dr. Michael Brown",
            "Mr. and Mrs. Williams"
        ],
        matter: [
            "Commercial Property Purchase",
            "Residential Property Sale",
            "Business Acquisition",
            "Employment Dispute",
            "Contract Negotiation"
        ],
        name_of_person_handling_matter: [
            "John Williams",
            "Sarah Mitchell",
            "Michael Thompson",
            "Emily Roberts",
            "David Anderson"
        ],
        status: [
            "Senior Associate",
            "Partner",
            "Associate",
            "Senior Partner",
            "Consultant"
        ],
        next_steps: [
            "Review and sign the attached documents",
            "Provide requested documentation",
            "Attend the scheduled meeting",
            "Review the draft contract",
            "Complete the client questionnaire"
        ],
        next_stage: [
            "document review",
            "contract negotiation",
            "completion",
            "exchange of contracts",
            "due diligence"
        ],
        figure: [
            "500",
            "1,000",
            "1,500",
            "2,500",
            "3,000"
        ],
        figure_or_range: [
            "2,000-3,000",
            "5,000-7,500", 
            "1,500-2,500",
            "3,000-5,000",
            "10,000-15,000"
        ],
        we_cannot_give_an_estimate_of_our_overall_charges_in_this_matter_because_reason_why_estimate_is_not_possible: [
            "the scope of work is unclear at this stage",
            "it depends on the complexity of negotiations",
            "the matter involves multiple unknown variables",
            "we need more information about your requirements",
            "the timeline and scope may change significantly"
        ],
        identify_the_other_party_eg_your_opponents: [
            "the seller",
            "the buyer",
            "the landlord",
            "the tenant",
            "the opposing party",
            "the defendant",
            "the claimant",
            "the other party's",
            "your opponent's"
        ],
        estimate: [
            "500",
            "1000",
            "1500",
            "2000",
            "3000"
        ],
        in_total_including_vat_or_for_the_next_steps_in_your_matter: [
            "in total including VAT",
            "for the next steps in your matter",
            "including VAT and expenses",
            "total estimate including all costs"
        ],
        give_examples_of_what_your_estimate_includes_eg_accountants_report_and_court_fees: [
            "court fees and search fees",
            "accountants report and valuation",
            "Land Registry fees and searches",
            "expert witness fees and reports",
            "administrative costs and postage"
        ],
        insert_next_step_you_would_like_client_to_take: [
            "telephone me to discuss this letter and the next steps in your matter",
            "review and sign the enclosed documentation",
            "provide the requested information and documents",
            "attend the scheduled meeting or consultation",
            "confirm your instructions and preferred approach"
        ],
        state_why_this_step_is_important: [
            "This will help us understand your priorities and proceed efficiently",
            "This is required to move forward with your matter",
            "Without this, there may be delays in progressing your case",
            "This will ensure we are acting in accordance with your wishes",
            "This step is necessary to comply with legal requirements"
        ],
        state_amount: [
            "500",
            "1,000",
            "1,500",
            "2,000",
            "2,500"
        ],
        describe_first_document_or_information_you_need_from_your_client: [
            "Copy of your passport or driving licence",
            "Recent utility bill confirming your address",
            "Contract or agreement relating to this matter",
            "Correspondence from the other party",
            "Financial statements or accounts"
        ],
        describe_second_document_or_information_you_need_from_your_client: [
            "Bank statements for the last 3 months",
            "Proof of income or employment",
            "Insurance policy documents",
            "Previous legal correspondence",
            "Property deeds or title documents"
        ],
        describe_third_document_or_information_you_need_from_your_client: [
            "Details of any previous legal proceedings",
            "Contact details for relevant third parties",
            "Company registration documents (if applicable)",
            "Power of attorney (if acting for someone else)",
            "Any other relevant documentation"
        ]
    };
    
    // Responsive design effect
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        
        const handleResize = () => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                setWindowWidth(window.innerWidth);
            }, 100); // Debounce resize events
        };
        
        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timeoutId);
        };
    }, []);
    
    // Auto-scroll to active field in side panel
    useEffect(() => {
        if (activeField) {
            const fieldElement = document.querySelector(`[data-field="${activeField}"]`);
            if (fieldElement) {
                fieldElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [activeField]);

    // Filter instructions based on search term and validity
    const filteredInstructions = instructions.filter(inst => {
        // First filter out invalid instructions (those without proper titles or IDs)
        if (!inst.title && !inst.prospectId) return false;
        
        if (!instructionSearchTerm.trim()) return true;
        
        const searchLower = instructionSearchTerm.toLowerCase();
        const title = (inst.title || '').toLowerCase();
        const description = (inst.description || '').toLowerCase();
        const serviceDescription = (inst.deals?.[0]?.ServiceDescription || '').toLowerCase();
        
        return title.includes(searchLower) || 
               description.includes(searchLower) || 
               serviceDescription.includes(searchLower);
    });
    
    // Navigation helpers - require explicit instruction selection
    const canProceedToStep2 = selectedTemplate !== null && 
                              (isInstructionBasedMode || 
                               (selectedInstruction !== null));
    const canProceedToStep3 = documentContent.trim() !== '' || Object.values(templateFields).some(val => val.trim() !== '');
    
    // Helper functions for step completion tracking
    const getDocumentStepCompletion = (step: number): number => {
        switch (step) {
            case 1:
                return selectedTemplate ? 100 : 0;
            case 2:
                return Object.values(templateFields).some(val => val.trim() !== '') ? 100 : 0;
            case 3:
                return documentContent.trim() !== '' ? 100 : 0;
            default:
                return 0;
        }
    };
    
    const getEditorStepCompletion = (step: number): number => {
        switch (step) {
            case 1:
                return documentContent.trim() !== '' ? 100 : 0;
            case 2:
                return Object.values(templateFields).filter(val => val.trim() !== '').length >= 3 ? 100 : 0;
            case 3:
                return Object.values(templateFields).every(val => val.trim() !== '') ? 100 : 0;
            default:
                return 0;
        }
    };
    
    // Initialize template fields when instruction/matter data is available
    useEffect(() => {
        if (selectedInstruction) {
            const updatedFields = { ...templateFields };

            // Client name (individual or company)
            if (!updatedFields.insert_clients_name) {
                const first = (selectedInstruction as any).FirstName || '';
                const last = (selectedInstruction as any).LastName || '';
                const prefix = (selectedInstruction as any).Title ? `${(selectedInstruction as any).Title} ` : '';
                const company = (selectedInstruction as any).CompanyName || '';
                const name = (first || last)
                    ? `${prefix}${first} ${last}`.trim()
                    : company;
                if (name) updatedFields.insert_clients_name = name;
            }

            if (selectedInstruction.title && !updatedFields.matter) {
                updatedFields.matter = selectedInstruction.title;
            }
            if (selectedInstruction.title && !updatedFields.insert_heading_eg_matter_description) {
                updatedFields.insert_heading_eg_matter_description = `RE: ${selectedInstruction.title}`;
            }
            if (selectedInstruction.description && !updatedFields.insert_current_position_and_scope_of_retainer) {
                updatedFields.insert_current_position_and_scope_of_retainer = selectedInstruction.description;
            }

            if ((selectedInstruction as any).Email && !updatedFields.email) {
                updatedFields.email = (selectedInstruction as any).Email;
            }

            const currentUser = (localUserData as any[])[0] || {};
            if (!updatedFields.name_of_person_handling_matter && currentUser['Full Name']) {
                updatedFields.name_of_person_handling_matter = currentUser['Full Name'];
            }
            if (!updatedFields.status && currentUser.Role) {
                updatedFields.status = currentUser.Role;
            }

            setTemplateFields(updatedFields);
        }
    }, [selectedInstruction]);
    
    // Handle template selection
    const handleTemplateSelect = (template: 'ccl' | 'custom') => {
        if (selectedTemplate === template) {
            // Unselect if already selected
            setSelectedTemplate(null);
            setDocumentContent('');
        } else {
            // Select template
            setSelectedTemplate(template);
            setDocumentContent(MESSAGE_TEMPLATES[template]);
        }
    };

    // Preset system functions
    const handleFieldClick = (fieldName: string, event: React.MouseEvent) => {
        const rect = (event.target as HTMLElement).getBoundingClientRect();
        setPresetField(fieldName);
        setPresetPosition({ 
            x: rect.left + rect.width / 2, 
            y: rect.bottom + 8 
        });
        setShowPresets(true);
    };
    
    const handlePresetSelect = (preset: string) => {
        if (presetField) {
            const updatedFields = { ...templateFields, [presetField]: preset };
            setTemplateFields(updatedFields);
            setTouchedFields(prev => ({ ...prev, [presetField]: true }));
        }
        setShowPresets(false);
        setPresetField(null);
    };
    
    const closePresets = () => {
        setShowPresets(false);
        setPresetField(null);
    };
    
    // Handle field hover for tooltips
    const handleFieldHover = (fieldKey: string, event: React.MouseEvent) => {
        const rect = event.currentTarget.getBoundingClientRect();
        setTooltipPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10
        });
        setHoveredField(fieldKey);
    };
    
    // Handle field hover leave
    const handleFieldHoverLeave = () => {
        setHoveredField(null);
    };
    
    // Generate template content with field substitutions
    const generateTemplateContent = () => {
        if (!documentContent) return documentContent;
        
        let content = documentContent;
        
        // Handle costs section choice
        const costsText = costsChoice === 'no_costs' 
            ? "We do not expect that you will have to pay another party's costs. This only tends to arise in litigation and is therefore not relevant to your matter."
            : `There is a risk that you may have to pay ${templateFields.identify_the_other_party_eg_your_opponents || '{{identify_the_other_party_eg_your_opponents}}'} costs in this matter. This is explained in section 5, Funding and billing below.`;
        
        content = content.replace(/\{\{costs_section_choice\}\}/g, costsText);
        
        // Handle charges section choice
        const chargesText = chargesChoice === 'hourly_rate' 
            ? `Our fees are calculated on the basis of an hourly rate. My rate is £395 per hour. Other Partners/senior solicitors are charged at £395, Associate solicitors at £325, Solicitors at £285 and trainees and paralegals are charged at £195. All hourly rates will be subject to the addition of VAT.

Short incoming and outgoing letters, messages, emails and routine phone calls are charged at 1/10 of an hour. All other work is timed in six minute units and charged at the relevant hourly rate. Please note that lots of small emails or telephone calls may unnecessarily increase the costs to you.

I estimate the cost of the Initial Scope with be £${templateFields.figure || '{{figure}}'} plus VAT.`
            : `We cannot give an estimate of our overall charges in this matter because ${templateFields.we_cannot_give_an_estimate_of_our_overall_charges_in_this_matter_because_reason_why_estimate_is_not_possible || '{{we_cannot_give_an_estimate_of_our_overall_charges_in_this_matter_because_reason_why_estimate_is_not_possible}}'}. The next stage in your matter is ${templateFields.next_stage || '{{next_stage}}'} and we estimate that our charges up to the completion of that stage will be in the region of £${templateFields.figure_or_range || '{{figure_or_range}}'}.

We reserve the right to increase the hourly rates if the work done is particularly complex or urgent, or the nature of your instructions require us to work outside normal office hours. If this happens, we will notify you in advance and agree an appropriate rate.

We will review our hourly rates on a periodic basis. This is usually done annually each January. We will give you advance notice of any change to our hourly rates.`;
        
        content = content.replace(/\{\{charges_section_choice\}\}/g, chargesText);
        
        // Handle disbursements section choice
        const disbursementsText = disbursementsChoice === 'table' 
            ? `Based on the information you have provided, we expect to incur the following disbursements:

Disbursement | Amount | VAT chargeable
[Describe disbursement] | £[Insert estimated amount] | [Yes OR No]
[Describe disbursement] | £[Insert estimated amount] | [Yes OR No]`
            : !showEstimateExamples 
                ? `We cannot give an exact figure for your disbursements, but this is likely to be in the region of £${templateFields.simple_disbursements_estimate || '{{estimate}}'} in total including VAT.`
                : (() => {
                    // Format the examples with proper "and" syntax
                    const rawExamples = templateFields.give_examples_of_what_your_estimate_includes_eg_accountants_report_and_court_fees || '{{give_examples_of_what_your_estimate_includes_eg_accountants_report_and_court_fees}}';
                    let formattedExamples = rawExamples;
                    
                    // If it's not a placeholder, format it properly
                    if (rawExamples && !rawExamples.startsWith('{{')) {
                        const selected = [];
                        if (rawExamples.includes('court fees')) selected.push('court fees');
                        if (rawExamples.includes('accountants report')) selected.push('accountants report');
                        
                        if (selected.length === 0) {
                            formattedExamples = rawExamples; // Use raw text if no standard options detected
                        } else if (selected.length === 1) {
                            formattedExamples = selected[0];
                        } else {
                            formattedExamples = selected.slice(0, -1).join(', ') + ' and ' + selected[selected.length - 1];
                        }
                    }
                    
                    return `We cannot give an exact figure for your disbursements, but this is likely to be in the region of £${templateFields.simple_disbursements_estimate || '{{estimate}}'} for the next steps in your matter including ${formattedExamples}.`;
                })();
        
        content = content.replace(/\{\{disbursements_section_choice\}\}/g, disbursementsText);
        
        // Replace other template fields
        Object.keys(templateFields).forEach(key => {
            const value = templateFields[key];
            if (value && value.trim()) {
                const placeholder = `{{${key}}}`;
                content = content.replace(new RegExp(placeholder, 'g'), value);
            }
        });
        
        return content;
    };
    
    // Function to render content with highlighted template variables
    // Helper function to measure text width
    const measureTextWidth = (text: string, fontSize: number = 14, fontFamily: string = 'Raleway, sans-serif'): number => {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (context) {
            context.font = `${fontSize}px ${fontFamily}`;
            return context.measureText(text).width;
        }
        return text.length * 8; // Fallback
    };

    const renderTemplateContentWithHighlights = (content: string) => {
        if (!content) return 'No content to preview...';
        
        // Find all template variables in the content
        const templateVariableRegex = /\{\{([^}]+)\}\}/g;
        const parts = [];
        let lastIndex = 0;
        let match: RegExpExecArray | null;
        let globalTableState = false; // Track table state across segments
        let globalTableRows: JSX.Element[] = []; // Share table rows across segments
        let tableSegments: React.ReactNode[] = []; // Collect all table-related content
        
        while ((match = templateVariableRegex.exec(content)) !== null) {
            // Add editable text before the variable
            if (match.index > lastIndex) {
                const segmentStart = lastIndex;
                const segmentEnd = match.index;
                const textSegment = content.substring(segmentStart, segmentEnd);
                
                const formatTextSegment = (text: string, segmentIndex: number, isTableContext: boolean = false): { nodes: React.ReactNode[]; isTable: boolean; tableRows?: JSX.Element[] } => {
                    const lines = text.split('\n');

                    // Check if this text contains table-like content (Action points section)
                    const hasTableContent = lines.some(line =>
                        line.includes('Action required by you | Additional information') ||
                        (line.includes('☐') && line.includes('|'))
                    );

                    // Continue table mode from previous segments or start new table
                    const shouldProcessAsTable = hasTableContent || isTableContext;

                    if (shouldProcessAsTable) {
                        // Handle table formatting for Action points section
                        const tableElements: JSX.Element[] = [];
                        let tableRows: JSX.Element[] = [];
                        let isInTable = isTableContext;
                        let tableStarted = false;
                        
                        lines.forEach((line, index) => {
                            const lineKey = `${segmentStart}-line-${index}`;
                            
                            if (line.includes('Action required by you | Additional information')) {
                                // Table header - start collecting rows
                                isInTable = true;
                                tableStarted = true;
                                tableRows = [];
                            } else if ((isInTable || isTableContext) && (line.includes('☐') || line.trim().startsWith('☐'))) {
                                // Table row - any line with ☐ when we're in table mode or continuing from previous segment
                                let actionPart = '';
                                let infoPart = '';
                                
                                if (line.includes('|')) {
                                    // Line has pipe separator
                                    [actionPart, infoPart] = line.split('|').map(part => part.trim());
                                } else {
                                    // Line has no pipe separator, treat entire line as action part
                                    actionPart = line.trim();
                                    infoPart = '';
                                }
                                
                                // Skip if this is just a checkbox with no meaningful content
                                // This happens when template variables split the line and we get just "☐ "
                                if (actionPart.trim() === '☐' || actionPart.trim().length <= 2) {
                                    // Don't create a table row for empty checkbox segments
                                    isInTable = true; // Keep table mode active
                                    return;
                                }
                                
                                // Make sure we're in table mode
                                if (!isInTable) {
                                    isInTable = true;
                                    tableStarted = true;
                                }
                                
                                // Check if this is the documents row that needs additional content
                                const isDocumentsRow = actionPart.includes('Provide the following documents');
                                
                                if (isDocumentsRow) {
                                    // Look ahead for template fields that should be part of this row
                                    let additionalContent = '';
                                    let nextIndex = index + 1;
                                    
                                    // Skip empty lines and collect template variables for document descriptions
                                    while (nextIndex < lines.length) {
                                        const nextLine = lines[nextIndex];
                                        if (nextLine.trim() === '') {
                                            nextIndex++;
                                            continue;
                                        }
                                        
                                        // Check if it's a document description template field
                                        if (nextLine.includes('{{describe_') && nextLine.includes('document')) {
                                            if (additionalContent) additionalContent += '\n\n';
                                            additionalContent += nextLine;
                                            // Mark this line as processed by setting it to empty
                                            lines[nextIndex] = '';
                                            nextIndex++;
                                        } else {
                                            break;
                                        }
                                    }
                                    
                                    tableRows.push(
                                        <tr key={lineKey}>
                                            <td style={{ 
                                                border: '1px solid #ccc',
                                                padding: '12px',
                                                verticalAlign: 'top',
                                                lineHeight: '1.4'
                                            }}>
                                                <div>{actionPart}</div>
                                                {additionalContent && (
                                                    <div style={{ marginTop: '8px', fontSize: '13px', color: '#666' }}>
                                                        {additionalContent.split('\n\n').map((item, idx) => (
                                                            <div key={idx} style={{ marginBottom: '4px' }}>
                                                                {item.trim()}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            <td style={{ 
                                                border: '1px solid #ccc',
                                                padding: '12px',
                                                verticalAlign: 'top',
                                                lineHeight: '1.4'
                                            }}>
                                                {infoPart}
                                            </td>
                                        </tr>
                                    );
                                } else {
                                    tableRows.push(
                                        <tr key={lineKey}>
                                            <td style={{ 
                                                border: '1px solid #ccc',
                                                padding: '12px',
                                                verticalAlign: 'top',
                                                lineHeight: '1.4'
                                            }}>
                                                {actionPart}
                                            </td>
                                            <td style={{ 
                                                border: '1px solid #ccc',
                                                padding: '12px',
                                                verticalAlign: 'top',
                                                lineHeight: '1.4'
                                            }}>
                                                {infoPart}
                                            </td>
                                        </tr>
                                    );
                                }
                            } else {
                                // Check if this line indicates the end of the table
                                // End table only when we hit a clear end marker
                                const shouldEndTable = line.trim() !== '' && 
                                                     !line.includes('{{describe_') &&
                                                     !line.includes('Action required by you') &&
                                                     line.trim() !== 'Additional information' &&
                                                     (line.includes('Please contact me') || 
                                                      line.includes('Yours sincerely') ||
                                                      line.match(/^\d+(?:\.\d+)*\s+/)); // Numbered sections
                                
                                // End of table or regular line
                                if (isInTable && shouldEndTable && tableRows.length > 0) {
                                    // Add the completed table
                                    tableElements.push(
                                        <div key={`table-${index}`} style={{ 
                                            display: 'block',
                                            marginTop: '16px',
                                            marginBottom: '16px',
                                            width: '100%'
                                        }}>
                                            <table style={{ 
                                                width: '100%', 
                                                borderCollapse: 'collapse',
                                                border: '1px solid #ccc',
                                                fontSize: '14px'
                                            }}>
                                                <thead>
                                                    <tr style={{ backgroundColor: '#f8f9fa' }}>
                                                        <th style={{ 
                                                            border: '1px solid #ccc',
                                                            padding: '12px',
                                                            textAlign: 'left',
                                                            fontWeight: 'bold',
                                                            width: '50%'
                                                        }}>
                                                            Action required by you
                                                        </th>
                                                        <th style={{ 
                                                            border: '1px solid #ccc',
                                                            padding: '12px',
                                                            textAlign: 'left',
                                                            fontWeight: 'bold',
                                                            width: '50%'
                                                        }}>
                                                            Additional information
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {tableRows}
                                                </tbody>
                                            </table>
                                        </div>
                                    );
                                    isInTable = false;
                                    tableRows = [];
                                }
                                
                                // Skip lines that should not be processed as regular text when in table mode
                                if (isInTable && (line.trim() === '' || 
                                                line.includes('{{describe_') ||
                                                line.includes('Action required by you') ||
                                                line.trim() === 'Additional information')) {
                                    // Skip empty lines, template variables, and table headers that are part of table processing
                                    return;
                                }
                                
                                // Regular text formatting
                                const numberedHeadingMatch = line.match(/^(\d+(?:\.\d+)*)\s+(.+)$/);
                                const standaloneHeadingMatch = line.match(/^(Next steps|Electronic signatures|Yours sincerely)$/);
                                const bulletPointMatch = line.match(/^—(.+)$/);
                                
                                if (numberedHeadingMatch || standaloneHeadingMatch) {
                                    tableElements.push(
                                        <span key={lineKey} style={{ fontWeight: 'bold', display: 'block' }}>
                                            {line}
                                            {index < lines.length - 1 ? '\n' : ''}
                                        </span>
                                    );
                                } else if (bulletPointMatch) {
                                    const bulletContent = bulletPointMatch[1];
                                    const sectionRefMatch = bulletContent.match(/^(.+?)(\(see section [^)]+\))(.*)$/);
                                    
                                    tableElements.push(
                                        <span key={lineKey} style={{ 
                                            display: 'block', 
                                            marginLeft: '16px',
                                            textIndent: '-16px',
                                            paddingLeft: '16px',
                                            lineHeight: '1.5'
                                        }}>
                                            <span style={{ color: '#dc3545', marginRight: '8px', fontWeight: 'bold' }}>•</span>
                                            <span style={{ display: 'inline' }}>
                                                {sectionRefMatch ? (
                                                    <>
                                                        <span>{sectionRefMatch[1]}</span>
                                                        <span style={{ 
                                                            color: '#6c757d', 
                                                            fontSize: '13px', 
                                                            fontStyle: 'italic',
                                                            opacity: 0.8 
                                                        }}>
                                                            {sectionRefMatch[2]}
                                                        </span>
                                                        <span>{sectionRefMatch[3]}</span>
                                                    </>
                                                ) : (
                                                    <span>{bulletContent}</span>
                                                )}
                                            </span>
                                            {index < lines.length - 1 ? '\n' : ''}
                                        </span>
                                    );
                                } else if (line.trim() !== '') {
                                    tableElements.push(
                                        <span key={lineKey}>
                                            {line}
                                            {index < lines.length - 1 ? '\n' : ''}
                                        </span>
                                    );
                                } else {
                                    tableElements.push(<br key={lineKey} />);
                                }
                            }
                        });
                        
                        // Don't create table elements in individual segments
                        // Just return the raw content and let the calling code handle table creation
                        if (tableRows.length > 0) {
                            return { nodes: [], isTable: true, tableRows: tableRows };
                        } else {
                            return { nodes: tableElements, isTable: isInTable || tableStarted, tableRows: tableRows };
                        }
                    }

                    // Regular text formatting (non-table content)
                    const formattedLines = lines.map((line, index) => {
                        // Check if line starts with number followed by space and text (e.g., "1 Contact details")
                        // OR if it's a standalone heading like "Next steps" or "Electronic signatures"
                        const numberedHeadingMatch = line.match(/^(\d+(?:\.\d+)*)\s+(.+)$/);
                        const standaloneHeadingMatch = line.match(/^(Next steps|Electronic signatures|Yours sincerely)$/);
                        // Check if line starts with — (bullet point)
                        const bulletPointMatch = line.match(/^—(.+)$/);
                        const lineKey = `${segmentStart}-line-${index}`;
                        
                        if (numberedHeadingMatch || standaloneHeadingMatch) {
                            return (
                                <span key={lineKey} style={{ fontWeight: 'bold', display: 'block' }}>
                                    {line}
                                    {index < lines.length - 1 ? '\n' : ''}
                                </span>
                            );
                        } else if (bulletPointMatch) {
                            // Handle bullet points with red bullets and styled section references
                            const bulletContent = bulletPointMatch[1];
                            // Check for section references like "(see section 4.1 below)"
                            const sectionRefMatch = bulletContent.match(/^(.+?)(\(see section [^)]+\))(.*)$/);
                            
                            return (
                                <span key={lineKey} style={{ 
                                    display: 'block', 
                                    marginLeft: '16px',
                                    textIndent: '-16px',
                                    paddingLeft: '16px',
                                    lineHeight: '1.5'
                                }}>
                                    <span style={{ color: '#dc3545', marginRight: '8px', fontWeight: 'bold' }}>•</span>
                                    <span style={{ display: 'inline' }}>
                                        {sectionRefMatch ? (
                                            <>
                                                <span>{sectionRefMatch[1]}</span>
                                                <span style={{ 
                                                    color: '#6c757d', 
                                                    fontSize: '13px', 
                                                    fontStyle: 'italic',
                                                    opacity: 0.8 
                                                }}>
                                                    {sectionRefMatch[2]}
                                                </span>
                                                <span>{sectionRefMatch[3]}</span>
                                            </>
                                        ) : (
                                            <span>{bulletContent}</span>
                                        )}
                                    </span>
                                    {index < lines.length - 1 ? '\n' : ''}
                                </span>
                            );
                        }
                        return (
                            <span key={lineKey}>
                                {line}
                                {index < lines.length - 1 ? '\n' : ''}
                            </span>
                        );
                    });
                    return { nodes: formattedLines, isTable: false };
                };
                
                const { nodes, isTable, tableRows: segmentTableRows } = formatTextSegment(textSegment, parts.length, globalTableState);
                
                // Update global table state and collect table rows
                if (isTable && !globalTableState) {
                    // Starting a new table
                    globalTableState = true;
                    globalTableRows = [];
                } 
                
                if (isTable && segmentTableRows && segmentTableRows.length > 0) {
                    // Add rows from this segment to global collection
                    globalTableRows.push(...segmentTableRows);
                    // Add any non-table content from this segment
                    if (nodes.length > 0) {
                        tableSegments.push(...nodes);
                    }
                } else if (globalTableState && !isTable) {
                    // Table ended in this segment, create the complete table
                    if (globalTableRows.length > 0) {
                        parts.push(
                            <div key={`complete-table-${parts.length}`} style={{ 
                                display: 'block',
                                marginTop: '16px',
                                marginBottom: '16px',
                                width: '100%'
                            }}>
                                <table style={{ 
                                    width: '100%', 
                                    borderCollapse: 'collapse',
                                    border: '1px solid #ccc',
                                    fontSize: '14px'
                                }}>
                                    <thead>
                                        <tr style={{ backgroundColor: '#f8f9fa' }}>
                                            <th style={{ 
                                                border: '1px solid #ccc',
                                                padding: '12px',
                                                textAlign: 'left',
                                                fontWeight: 'bold',
                                                width: '50%'
                                            }}>
                                                Action required by you
                                            </th>
                                            <th style={{ 
                                                border: '1px solid #ccc',
                                                padding: '12px',
                                                textAlign: 'left',
                                                fontWeight: 'bold',
                                                width: '50%'
                                            }}>
                                                Additional information
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {globalTableRows}
                                    </tbody>
                                </table>
                            </div>
                        );
                    }
                    globalTableState = false;
                    globalTableRows = [];
                    tableSegments = [];
                    // Add the current segment's nodes
                    parts.push(...nodes);
                } else if (!globalTableState) {
                    // Regular content, not part of table
                    parts.push(...nodes);
                }
                parts.push(
                    <div
                        key={`text-${segmentStart}`}
                        contentEditable={!isTable}
                        suppressContentEditableWarning={true}
                        onBlur={(e) => {
                            if (isTable) return;
                            let newText = e.target.textContent || '';

                            // Preserve bullet formatting - ensure lines that had bullets still have em dashes
                            const originalLines = content.substring(segmentStart, segmentEnd).split('\n');
                            const newLines = newText.split('\n');

                            // Restore em dashes for lines that should be bullets
                            const restoredLines = newLines.map((newLine, index) => {
                                const originalLine = originalLines[index];
                                if (originalLine && originalLine.match(/^—/)) {
                                    // This was originally a bullet line
                                    if (!newLine.match(/^—/)) {
                                        // If the em dash was lost, restore it
                                        return '—' + (newLine.startsWith('•') ? newLine.substring(1) : newLine);
                                    }
                                }
                                return newLine;
                            });

                            newText = restoredLines.join('\n');
                            const beforeText = content.substring(0, segmentStart);
                            const afterText = content.substring(segmentEnd);
                            const newContent = beforeText + newText + afterText;
                            setDocumentContent(newContent);
                        }}
                        style={{
                            outline: 'none',
                            minHeight: '1em',
                            display: isTable ? 'block' : 'inline',
                            whiteSpace: 'pre-wrap',
                            cursor: isTable ? 'default' : 'text',
                            padding: '2px',
                            borderRadius: '2px',
                            transition: 'background-color 0.2s ease'
                        }}
                    >
                        {nodes}
                    </div>
                );
            }
            
            // Add the interactive inline editor for placeholders
            const variableName = match[1].trim();
            
            // Special handling for charges_section_choice
            if (variableName === 'charges_section_choice') {
                parts.push(
                    <div
                        key={match.index}
                        style={{
                            backgroundColor: showChargesChoice ? '#f3f9ff' : '#e8f5e8',
                            border: showChargesChoice ? `1px solid ${colours.blue}` : '1px solid #20b26c',
                            borderRadius: 0,
                            padding: '8px',
                            margin: '2px 0',
                            display: 'block',
                            width: '100%'
                        }}
                    >
                        {showChargesChoice ? (
                            <>
                                <div style={{
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: colours.blue,
                                    marginBottom: '6px',
                                    letterSpacing: 0.1,
                                    textTransform: 'none'
                                }}>
                                    Choose charges format:
                                </div>
                                {/* Option 1: Hourly rate format */}
                                <div
                                    onClick={() => {
                                        setChargesChoice('hourly_rate');
                                        setShowChargesChoice(false);
                                    }}
                                    style={{
                                        padding: '8px',
                                        marginBottom: '4px',
                                        border: `1px solid ${chargesChoice === 'hourly_rate' ? '#0078d4' : '#d0d0d7'}`,
                                        borderRadius: 0,
                                        backgroundColor: chargesChoice === 'hourly_rate' ? '#f0f8ff' : '#fff',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                                        <strong>Hourly rate structure</strong><br />
                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                            Use when you can provide detailed hourly rates and initial estimate
                                        </div>
                                    </div>
                                </div>
                                {/* Option 2: No estimate format */}
                                <div
                                    onClick={() => {
                                        setChargesChoice('no_estimate');
                                        setShowChargesChoice(false);
                                    }}
                                    style={{
                                        padding: '8px',
                                        border: `1px solid ${chargesChoice === 'no_estimate' ? '#0078d4' : '#d0d0d7'}`,
                                        borderRadius: 0,
                                        backgroundColor: chargesChoice === 'no_estimate' ? '#f0f8ff' : '#fff',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                                        <strong>No overall estimate</strong><br />
                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                            Use when overall scope is unclear but you can estimate next stage
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Only show the selected text, no label */}
                                {chargesChoice === 'hourly_rate' ? (
                                    <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                                        Our fees are calculated on the basis of an hourly rate. My rate is £395 per hour. Other Partners/senior solicitors are charged at £395, Associate solicitors at £325, Solicitors at £285 and trainees and paralegals are charged at £195. All hourly rates will be subject to the addition of VAT.<br /><br />
                                        Short incoming and outgoing letters, messages, emails and routine phone calls are charged at 1/10 of an hour. All other work is timed in six minute units and charged at the relevant hourly rate. Please note that lots of small emails or telephone calls may unnecessarily increase the costs to you.<br /><br />
                                        I estimate the cost of the Initial Scope with be £
                                        <input
                                            value={templateFields.figure || ''}
                                            onChange={(e) => {
                                                setTemplateFields(prev => ({
                                                    ...prev,
                                                    figure: e.target.value || ''
                                                }));
                                            }}
                                            placeholder="amount"
                                            style={{
                                                fontSize: '14px',
                                                padding: '1px 4px',
                                                border: '1px solid #0078d4',
                                                borderRadius: '2px',
                                                backgroundColor: '#fff',
                                                outline: 'none',
                                                minWidth: '60px',
                                                width: `${Math.max(60, (templateFields.figure || 'amount').length * 8 + 15)}px`,
                                                transition: 'width 0.2s ease',
                                                margin: '0 2px',
                                                verticalAlign: 'baseline'
                                            }}
                                        /> plus VAT.
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                                        We cannot give an estimate of our overall charges in this matter because{' '}
                                        <input
                                            value={templateFields.we_cannot_give_an_estimate_of_our_overall_charges_in_this_matter_because_reason_why_estimate_is_not_possible || ''}
                                            onChange={(e) => {
                                                setTemplateFields(prev => ({
                                                    ...prev,
                                                    we_cannot_give_an_estimate_of_our_overall_charges_in_this_matter_because_reason_why_estimate_is_not_possible: e.target.value || ''
                                                }));
                                            }}
                                            placeholder="reason why estimate is not possible"
                                            style={{
                                                fontSize: '14px',
                                                padding: '1px 4px',
                                                border: '1px solid #0078d4',
                                                borderRadius: '2px',
                                                backgroundColor: '#fff',
                                                outline: 'none',
                                                minWidth: '200px',
                                                width: `${Math.max(200, (templateFields.we_cannot_give_an_estimate_of_our_overall_charges_in_this_matter_because_reason_why_estimate_is_not_possible || 'reason why estimate is not possible').length * 8 + 15)}px`,
                                                transition: 'width 0.2s ease',
                                                margin: '0 2px',
                                                verticalAlign: 'baseline'
                                            }}
                                        />. The next stage in your matter is{' '}
                                        <input
                                            value={templateFields.next_stage || ''}
                                            onChange={(e) => {
                                                setTemplateFields(prev => ({
                                                    ...prev,
                                                    next_stage: e.target.value || ''
                                                }));
                                            }}
                                            placeholder="next stage"
                                            style={{
                                                fontSize: '14px',
                                                padding: '1px 4px',
                                                border: '1px solid #0078d4',
                                                borderRadius: '2px',
                                                backgroundColor: '#fff',
                                                outline: 'none',
                                                minWidth: '100px',
                                                width: `${Math.max(100, (templateFields.next_stage || 'next stage').length * 8 + 15)}px`,
                                                transition: 'width 0.2s ease',
                                                margin: '0 2px',
                                                verticalAlign: 'baseline'
                                            }}
                                        />{' '}and we estimate that our charges up to the completion of that stage will be in the region of £
                                        <input
                                            value={templateFields.figure_or_range || ''}
                                            onChange={(e) => {
                                                setTemplateFields(prev => ({
                                                    ...prev,
                                                    figure_or_range: e.target.value || ''
                                                }));
                                            }}
                                            placeholder="figure or range"
                                            style={{
                                                fontSize: '14px',
                                                padding: '1px 4px',
                                                border: '1px solid #0078d4',
                                                borderRadius: '2px',
                                                backgroundColor: '#fff',
                                                outline: 'none',
                                                minWidth: '80px',
                                                width: `${Math.max(80, (templateFields.figure_or_range || 'figure or range').length * 8 + 15)}px`,
                                                transition: 'width 0.2s ease',
                                                margin: '0 2px',
                                                verticalAlign: 'baseline'
                                            }}
                                        />.<br /><br />
                                        We reserve the right to increase the hourly rates if the work done is particularly complex or urgent, or the nature of your instructions require us to work outside normal office hours. If this happens, we will notify you in advance and agree an appropriate rate.<br /><br />
                                        We will review our hourly rates on a periodic basis. This is usually done annually each January. We will give you advance notice of any change to our hourly rates.
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                                    <button
                                        onClick={() => setShowChargesChoice(true)}
                                        style={{
                                            background: 'none',
                                            border: '1px solid #0078d4',
                                            color: '#0078d4',
                                            padding: '4px 8px',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            borderRadius: '0'
                                        }}
                                    >
                                        Change
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                );
            } else if (variableName === 'costs_section_choice') {
                // Both 'no_costs' and 'risk_costs' are considered answered (green highlight when answered)
                parts.push(
                    <div
                        key={match.index}
                        style={{
                            backgroundColor: showCostsChoice ? '#f3f9ff' : '#e8f5e8',
                            border: showCostsChoice ? `1px solid ${colours.blue}` : '1px solid #20b26c',
                            borderRadius: 0,
                            padding: '8px',
                            margin: '2px 0',
                            display: 'block',
                            width: '100%'
                        }}
                    >
                        {showCostsChoice ? (
                            <>
                                <div style={{
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: colours.blue,
                                    marginBottom: '6px',
                                    letterSpacing: 0.1,
                                    textTransform: 'none'
                                }}>
                                    Choose one option:
                                </div>
                                {/* Option 1: No costs expected */}
                                <div
                                    onClick={() => {
                                        setCostsChoice('no_costs');
                                        setShowCostsChoice(false);
                                    }}
                                    style={{
                                        padding: '8px',
                                        marginBottom: '4px',
                                        border: `1px solid ${costsChoice === 'no_costs' ? '#0078d4' : '#d0d0d7'}`,
                                        borderRadius: 0,
                                        backgroundColor: costsChoice === 'no_costs' ? '#f0f8ff' : '#fff',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                                        <strong>No costs expected</strong><br />
                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                            Use when matter is non-litigious
                                        </div>
                                    </div>
                                </div>
                                {/* Option 2: Risk of costs with inline field */}
                                <div
                                    onClick={() => {
                                        setCostsChoice('risk_costs');
                                        setShowCostsChoice(false);
                                    }}
                                    style={{
                                        padding: '8px',
                                        border: `1px solid ${costsChoice === 'risk_costs' ? '#0078d4' : '#d0d0d7'}`,
                                        borderRadius: 0,
                                        backgroundColor: costsChoice === 'risk_costs' ? '#f0f8ff' : '#fff',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                                        <strong>Risk of costs</strong><br />
                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                            Use when there's potential litigation or dispute
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Only show the selected text, no label */}
                                {costsChoice === 'no_costs' ? (
                                    <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                                        We do not expect that you will have to pay another party's costs. This only tends to arise in litigation and is therefore not relevant to your matter.
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                                        There is a risk that you may have to pay{' '}
                                        <input
                                            value={templateFields.identify_the_other_party_eg_your_opponents || ''}
                                            onChange={(e) => {
                                                setTemplateFields(prev => ({
                                                    ...prev,
                                                    identify_the_other_party_eg_your_opponents: e.target.value || ''
                                                }));
                                            }}
                                            placeholder="other party"
                                            style={{
                                                fontSize: '14px',
                                                padding: '1px 4px',
                                                border: '1px solid #0078d4',
                                                borderRadius: '2px',
                                                backgroundColor: '#fff',
                                                outline: 'none',
                                                minWidth: '100px',
                                                width: `${Math.max(100, (templateFields.identify_the_other_party_eg_your_opponents || 'other party').length * 8 + 15)}px`,
                                                transition: 'width 0.2s ease',
                                                margin: '0 2px',
                                                verticalAlign: 'baseline'
                                            }}
                                        />{' '}
                                        costs in this matter. This is explained in section 5, Funding and billing below.
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                                    <button
                                        onClick={() => setShowCostsChoice(true)}
                                        style={{
                                            background: 'none',
                                            border: '1px solid #0078d4',
                                            color: '#0078d4',
                                            padding: '4px 8px',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            borderRadius: '0'
                                        }}
                                    >
                                        Change
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                );
            } else if (variableName === 'disbursements_section_choice') {
                // Disbursements section with choice between table and estimate
                parts.push(
                    <div
                        key={match.index}
                        style={{
                            backgroundColor: showDisbursementsChoice ? '#f3f9ff' : '#e8f5e8',
                            border: `1px solid ${showDisbursementsChoice ? colours.blue : '#20b26c'}`,
                            borderRadius: 0,
                            padding: '8px',
                            margin: '2px 0',
                            display: 'block',
                            width: '100%'
                        }}
                    >
                        {showDisbursementsChoice ? (
                            <>
                                <div style={{
                                    fontSize: '13px',
                                    fontWeight: 600,
                                    color: colours.blue,
                                    marginBottom: '6px',
                                    letterSpacing: 0.1,
                                    textTransform: 'none'
                                }}>
                                    Choose disbursements format:
                                </div>
                                {/* Option 1: Table format */}
                                <div
                                    onClick={() => {
                                        setDisbursementsChoice('table');
                                        setShowDisbursementsChoice(false);
                                    }}
                                    style={{
                                        padding: '8px',
                                        marginBottom: '4px',
                                        border: `1px solid ${disbursementsChoice === 'table' ? '#0078d4' : '#d0d0d7'}`,
                                        borderRadius: 0,
                                        backgroundColor: disbursementsChoice === 'table' ? '#f0f8ff' : '#fff',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                                        <strong>Detailed table format</strong><br />
                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                            Use when you can provide specific disbursement details
                                        </div>
                                    </div>
                                </div>
                                {/* Option 2: Estimate format */}
                                <div
                                    onClick={() => {
                                        setDisbursementsChoice('estimate');
                                        setShowDisbursementsChoice(false);
                                    }}
                                    style={{
                                        padding: '8px',
                                        border: `1px solid ${disbursementsChoice === 'estimate' ? '#0078d4' : '#d0d0d7'}`,
                                        borderRadius: 0,
                                        backgroundColor: disbursementsChoice === 'estimate' ? '#f0f8ff' : '#fff',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                                        <strong>Simple estimate</strong><br />
                                        <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                                            Use when you only have an approximate estimate
                                        </div>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <>
                                {/* Show the selected content */}
                                {disbursementsChoice === 'table' ? (
                                    <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                                        Based on the information you have provided, we expect to incur the following disbursements:
                                        <br /><br />
                                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                                            <thead>
                                                <tr style={{ backgroundColor: '#f8f9fa' }}>
                                                    <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'left', width: '50%' }}>Disbursement</th>
                                                    <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'left', width: '25%' }}>Amount (£)</th>
                                                    <th style={{ border: '1px solid #dee2e6', padding: '8px', textAlign: 'left', width: '25%' }}>VAT</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {Array.from({ length: disbursementRowCount }, (_, index) => {
                                                    const rowNumber = index + 1;
                                                    return (
                                                        <tr key={rowNumber}>
                                                            <td style={{ border: '1px solid #dee2e6', padding: '8px', backgroundColor: 'white' }}>
                                                                <select
                                                                    value={templateFields[`disbursement_${rowNumber}_description`] || ''}
                                                                    onChange={(e) => setTemplateFields(prev => ({ ...prev, [`disbursement_${rowNumber}_description`]: e.target.value }))}
                                                                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', backgroundColor: 'white' }}
                                                                >
                                                                    <option value="">--</option>
                                                                    <option value="General Disbursement">General Disbursement</option>
                                                                    <option value="Court Fee">Court Fee</option>
                                                                    <option value="Accountants Report">Accountants Report</option>
                                                                </select>
                                                            </td>
                                                            <td style={{ border: '1px solid #dee2e6', padding: '8px', backgroundColor: 'white' }}>
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                                    <input
                                                                        value={templateFields[`disbursement_${rowNumber}_amount`] || ''}
                                                                        onChange={(e) => {
                                                                            const value = e.target.value.replace(/[£,]/g, '');
                                                                            setTemplateFields(prev => ({ ...prev, [`disbursement_${rowNumber}_amount`]: value }));
                                                                        }}
                                                                        onBlur={(e) => {
                                                                            const value = e.target.value.replace(/[£,]/g, '');
                                                                            const numericValue = parseFloat(value);
                                                                            if (!isNaN(numericValue) && numericValue > 0) {
                                                                                const formatted = `£${numericValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                                                                setTemplateFields(prev => ({ ...prev, [`disbursement_${rowNumber}_amount`]: formatted }));
                                                                            }
                                                                        }}
                                                                        onFocus={(e) => {
                                                                            const value = e.target.value.replace(/[£,]/g, '');
                                                                            setTemplateFields(prev => ({ ...prev, [`disbursement_${rowNumber}_amount`]: value }));
                                                                        }}
                                                                        placeholder="--"
                                                                        style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', backgroundColor: 'white' }}
                                                                    />
                                                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                                                        <button
                                                                            onClick={() => {
                                                                                const currentValue = parseFloat((templateFields[`disbursement_${rowNumber}_amount`] || '0').replace(/[£,]/g, ''));
                                                                                const newValue = (isNaN(currentValue) ? 0 : currentValue) + 50;
                                                                                const formatted = `£${newValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                                                                setTemplateFields(prev => ({ ...prev, [`disbursement_${rowNumber}_amount`]: formatted }));
                                                                            }}
                                                                            style={{
                                                                                width: '18px',
                                                                                height: '12px',
                                                                                border: '1px solid #ccc',
                                                                                backgroundColor: '#f8f9fa',
                                                                                fontSize: '10px',
                                                                                cursor: 'pointer',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                borderRadius: 0
                                                                            }}
                                                                        >
                                                                            +
                                                                        </button>
                                                                        <button
                                                                            onClick={() => {
                                                                                const currentValue = parseFloat((templateFields[`disbursement_${rowNumber}_amount`] || '0').replace(/[£,]/g, ''));
                                                                                const newValue = Math.max(0, (isNaN(currentValue) ? 0 : currentValue) - 50);
                                                                                const formatted = newValue === 0 ? '' : `£${newValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                                                                setTemplateFields(prev => ({ ...prev, [`disbursement_${rowNumber}_amount`]: formatted }));
                                                                            }}
                                                                            style={{
                                                                                width: '18px',
                                                                                height: '12px',
                                                                                border: '1px solid #ccc',
                                                                                backgroundColor: '#f8f9fa',
                                                                                fontSize: '10px',
                                                                                cursor: 'pointer',
                                                                                display: 'flex',
                                                                                alignItems: 'center',
                                                                                justifyContent: 'center',
                                                                                borderRadius: 0
                                                                            }}
                                                                        >
                                                                            -
                                                                        </button>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td style={{ border: '1px solid #dee2e6', padding: '8px', backgroundColor: 'white' }}>
                                                                <input
                                                                    value={(() => {
                                                                        const amount = parseFloat((templateFields[`disbursement_${rowNumber}_amount`] || '').replace(/[£,]/g, ''));
                                                                        return isNaN(amount) || amount === 0 ? '--' : `£${(amount * 0.2).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                                                                    })()}
                                                                    readOnly
                                                                    placeholder="--"
                                                                    style={{ border: 'none', outline: 'none', width: '100%', fontSize: '14px', backgroundColor: 'white', color: '#666' }}
                                                                />
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                        <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                                            <button
                                                onClick={() => setDisbursementRowCount(prev => prev + 1)}
                                                style={{
                                                    padding: '4px 8px',
                                                    border: `1px solid ${colours.blue}`,
                                                    borderRadius: 0,
                                                    backgroundColor: 'white',
                                                    color: colours.blue,
                                                    fontSize: '12px',
                                                    cursor: 'pointer',
                                                    transition: 'all 0.2s ease'
                                                }}
                                                onMouseOver={(e) => {
                                                    e.currentTarget.style.backgroundColor = colours.blue;
                                                    e.currentTarget.style.color = 'white';
                                                }}
                                                onMouseOut={(e) => {
                                                    e.currentTarget.style.backgroundColor = 'white';
                                                    e.currentTarget.style.color = colours.blue;
                                                }}
                                            >
                                                + Add Row
                                            </button>
                                            {disbursementRowCount > 1 && (
                                                <button
                                                    onClick={() => {
                                                        // Remove the last row's data from templateFields
                                                        setTemplateFields(prev => {
                                                            const updated = { ...prev };
                                                            delete updated[`disbursement_${disbursementRowCount}_description`];
                                                            delete updated[`disbursement_${disbursementRowCount}_amount`];
                                                            delete updated[`disbursement_${disbursementRowCount}_vat`];
                                                            return updated;
                                                        });
                                                        // Decrease row count
                                                        setDisbursementRowCount(prev => prev - 1);
                                                    }}
                                                    style={{
                                                        padding: '4px 8px',
                                                        border: `1px solid ${colours.blue}`,
                                                        borderRadius: 0,
                                                        backgroundColor: 'white',
                                                        color: colours.blue,
                                                        fontSize: '12px',
                                                        cursor: 'pointer',
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.currentTarget.style.backgroundColor = colours.blue;
                                                        e.currentTarget.style.color = 'white';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.currentTarget.style.backgroundColor = 'white';
                                                        e.currentTarget.style.color = colours.blue;
                                                    }}
                                                >
                                                    - Remove Row
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{ fontSize: '14px', lineHeight: '1.4' }}>
                                        We cannot give an exact figure for your disbursements, but this is likely to be in the region of £
                                        <input
                                            value={templateFields.simple_disbursements_estimate || ''}
                                            onChange={(e) => setTemplateFields(prev => ({ ...prev, simple_disbursements_estimate: e.target.value }))}
                                            placeholder="estimate amount"
                                            style={{
                                                fontSize: '14px',
                                                padding: '1px 4px',
                                                border: '1px solid #0078d4',
                                                borderRadius: '2px',
                                                backgroundColor: '#fff',
                                                outline: 'none',
                                                minWidth: '80px',
                                                width: `${Math.max(80, (templateFields.simple_disbursements_estimate || 'estimate amount').length * 8 + 15)}px`,
                                                transition: 'width 0.2s ease',
                                                margin: '0 2px',
                                                verticalAlign: 'baseline'
                                            }}
                                        />{' '}
                                        {!showEstimateExamples ? (
                                            <>
                                                in total including VAT.
                                                <button
                                                    onClick={() => setShowEstimateExamples(!showEstimateExamples)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#0078d4',
                                                        padding: '2px 4px',
                                                        fontSize: '11px',
                                                        cursor: 'pointer',
                                                        textDecoration: 'none',
                                                        transition: 'color 0.2s ease',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '2px',
                                                        marginLeft: '4px',
                                                        verticalAlign: 'baseline'
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.currentTarget.style.color = '#106ebe';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.currentTarget.style.color = '#0078d4';
                                                    }}
                                                >
                                                    <span style={{ fontSize: '10px', lineHeight: 1 }}>+</span>
                                                    Examples
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                for the next steps in your matter including{' '}
                                                <div style={{ display: 'inline-block', position: 'relative' }} className="examples-dropdown">
                                                    <input
                                                        value={templateFields.give_examples_of_what_your_estimate_includes_eg_accountants_report_and_court_fees || ''}
                                                        onChange={(e) => {
                                                            setTemplateFields(prev => ({ 
                                                                ...prev, 
                                                                give_examples_of_what_your_estimate_includes_eg_accountants_report_and_court_fees: e.target.value 
                                                            }));
                                                        }}
                                                        placeholder="examples of what your estimate includes"
                                                        style={{
                                                            fontSize: '14px',
                                                            padding: '1px 24px 1px 4px',
                                                            border: '1px solid #0078d4',
                                                            borderRadius: '2px',
                                                            backgroundColor: '#fff',
                                                            outline: 'none',
                                                            minWidth: '150px',
                                                            width: `${Math.max(150, (templateFields.give_examples_of_what_your_estimate_includes_eg_accountants_report_and_court_fees || 'examples of what your estimate includes').length * 8 + 35)}px`,
                                                            margin: '0 2px',
                                                            verticalAlign: 'baseline',
                                                            cursor: 'text',
                                                            display: 'inline-block',
                                                            transition: 'width 0.2s ease'
                                                        }}
                                                    />
                                                    <span 
                                                        onClick={() => {
                                                            const dropdown = document.getElementById('examples-dropdown');
                                                            if (dropdown) {
                                                                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
                                                            }
                                                        }}
                                                        style={{ 
                                                            position: 'absolute',
                                                            right: '6px',
                                                            top: '50%',
                                                            transform: 'translateY(-50%)',
                                                            color: '#999',
                                                            fontSize: '12px',
                                                            cursor: 'pointer',
                                                            userSelect: 'none',
                                                            fontWeight: 'normal'
                                                        }}
                                                    >
                                                        ▾
                                                    </span>
                                                    <div
                                                        id="examples-dropdown"
                                                        style={{
                                                            display: 'none',
                                                            position: 'absolute',
                                                            top: '100%',
                                                            left: '0',
                                                            backgroundColor: 'white',
                                                            border: '1px solid #0078d4',
                                                            borderRadius: '2px',
                                                            zIndex: 1000,
                                                            minWidth: '200px',
                                                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <div style={{ padding: '8px' }}>
                                                            <label style={{ display: 'block', marginBottom: '4px', fontSize: '14px', cursor: 'pointer' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={(templateFields.give_examples_of_what_your_estimate_includes_eg_accountants_report_and_court_fees || '').includes('court fees')}
                                                                    onChange={(e) => {
                                                                        const currentValue = templateFields.give_examples_of_what_your_estimate_includes_eg_accountants_report_and_court_fees || '';
                                                                        let newValue = currentValue;
                                                                        
                                                                        if (e.target.checked) {
                                                                            // Add court fees
                                                                            const parts = [];
                                                                            if (currentValue.includes('accountants report')) parts.push('accountants report');
                                                                            parts.push('court fees');
                                                                            newValue = parts.join(' and ');
                                                                        } else {
                                                                            // Remove court fees
                                                                            newValue = currentValue.replace(/court fees/g, '').replace(/ and /g, ' ').replace(/^ and | and $/g, '').trim();
                                                                            if (newValue.includes('accountants report')) {
                                                                                newValue = 'accountants report';
                                                                            }
                                                                        }
                                                                        
                                                                        setTemplateFields(prev => ({ ...prev, give_examples_of_what_your_estimate_includes_eg_accountants_report_and_court_fees: newValue }));
                                                                    }}
                                                                    style={{ marginRight: '8px' }}
                                                                />
                                                                Court fees
                                                            </label>
                                                            <label style={{ display: 'block', fontSize: '14px', cursor: 'pointer' }}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={(templateFields.give_examples_of_what_your_estimate_includes_eg_accountants_report_and_court_fees || '').includes('accountants report')}
                                                                    onChange={(e) => {
                                                                        const currentValue = templateFields.give_examples_of_what_your_estimate_includes_eg_accountants_report_and_court_fees || '';
                                                                        let newValue = currentValue;
                                                                        
                                                                        if (e.target.checked) {
                                                                            // Add accountants report
                                                                            const parts = [];
                                                                            parts.push('accountants report');
                                                                            if (currentValue.includes('court fees')) parts.push('court fees');
                                                                            newValue = parts.join(' and ');
                                                                        } else {
                                                                            // Remove accountants report
                                                                            newValue = currentValue.replace(/accountants report/g, '').replace(/ and /g, ' ').replace(/^ and | and $/g, '').trim();
                                                                            if (newValue.includes('court fees')) {
                                                                                newValue = 'court fees';
                                                                            }
                                                                        }
                                                                        
                                                                        setTemplateFields(prev => ({ ...prev, give_examples_of_what_your_estimate_includes_eg_accountants_report_and_court_fees: newValue }));
                                                                    }}
                                                                    style={{ marginRight: '8px' }}
                                                                />
                                                                Accountants report
                                                            </label>
                                                        </div>
                                                    </div>
                                                </div>.
                                                <button
                                                    onClick={() => setShowEstimateExamples(!showEstimateExamples)}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#dc3545',
                                                        padding: '2px 4px',
                                                        fontSize: '11px',
                                                        cursor: 'pointer',
                                                        textDecoration: 'none',
                                                        transition: 'color 0.2s ease',
                                                        display: 'inline-flex',
                                                        alignItems: 'center',
                                                        gap: '2px',
                                                        marginLeft: '4px',
                                                        verticalAlign: 'baseline'
                                                    }}
                                                    onMouseOver={(e) => {
                                                        e.currentTarget.style.color = '#b02a37';
                                                    }}
                                                    onMouseOut={(e) => {
                                                        e.currentTarget.style.color = '#dc3545';
                                                    }}
                                                >
                                                    <span style={{ fontSize: '10px', lineHeight: 1 }}>✕</span>
                                                    Remove
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: 8 }}>
                                    <button
                                        onClick={() => setShowDisbursementsChoice(true)}
                                        style={{
                                            backgroundColor: '#f8f9fa',
                                            border: '1px solid #dee2e6',
                                            color: '#6c757d',
                                            padding: '4px 8px',
                                            fontSize: '12px',
                                            cursor: 'pointer',
                                            borderRadius: 0,
                                            transition: 'all 0.2s ease'
                                        }}
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.backgroundColor = '#e9ecef';
                                            e.currentTarget.style.borderColor = '#adb5bd';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                                            e.currentTarget.style.borderColor = '#dee2e6';
                                        }}
                                    >
                                        Change
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                );
            } else {
                const fieldValue = templateFields[variableName];
                
                // Detect if this template variable is part of a bullet point
                const beforeMatch = content.substring(0, match.index);
                const afterMatch = content.substring(match.index + match[0].length);
                const isInBullet = beforeMatch.includes('—') && 
                                 !beforeMatch.split('—').pop()!.includes('\n');
            
            if (fieldValue && fieldValue.trim()) {
                // Variable has a value - show as inline editable text
                if (isInBullet) {
                    // Special handling for filled placeholders within bullets - render with bullet alignment
                    parts.push(
                        <div
                            key={match.index}
                            style={{
                                display: 'block',
                                marginLeft: '16px',
                                textIndent: '-16px',
                                paddingLeft: '16px',
                                lineHeight: '1.5'
                            }}
                        >
                            <span
                                contentEditable
                                suppressContentEditableWarning={true}
                                onClick={(e) => handleFieldClick(variableName, e)}
                                onMouseEnter={(e) => handleFieldHover(variableName, e)}
                                onMouseLeave={handleFieldHoverLeave}
                                style={{
                                    backgroundColor: '#e8f5e8',
                                    color: '#20b26c',
                                    padding: '2px 4px',
                                    fontWeight: 500,
                                    outline: 'none',
                                    fontFamily: 'Raleway, sans-serif',
                                    fontSize: '14px',
                                    display: 'inline',
                                    cursor: 'text',
                                    transition: 'all 0.2s ease',
                                    wordBreak: 'break-word',
                                    whiteSpace: 'pre-wrap',
                                    boxSizing: 'border-box',
                                    marginTop: '-1px',
                                    marginBottom: '-1px',
                                    borderLeft: '1px solid #20b26c',
                                    borderRight: '1px solid #20b26c',
                                    position: 'relative',
                                    boxDecorationBreak: 'slice',
                                    WebkitBoxDecorationBreak: 'slice',
                                    marginLeft: '16px' // Align with bullet content
                                }}
                                className="placeholder-segment"
                                onFocus={(e) => {
                                    e.target.style.backgroundColor = '#d4edda';
                                }}
                                onBlur={(e) => {
                                    const newValue = e.target.textContent || '';
                                    setTemplateFields(prev => ({
                                        ...prev,
                                        [variableName]: newValue
                                    }));
                                    e.target.style.backgroundColor = '#e8f5e8';
                                }}
                            >
                                {fieldValue}
                            </span>
                        </div>
                    );
                } else {
                    parts.push(
                        <span
                            key={match.index}
                            contentEditable
                            suppressContentEditableWarning={true}
                            onClick={(e) => handleFieldClick(variableName, e)}
                            onMouseEnter={(e) => handleFieldHover(variableName, e)}
                            onMouseLeave={handleFieldHoverLeave}
                            style={{
                                backgroundColor: '#e8f5e8',
                                color: '#20b26c',
                                padding: '2px 4px',
                                fontWeight: 500,
                                outline: 'none',
                                fontFamily: 'Raleway, sans-serif',
                                fontSize: '14px',
                                display: 'inline',
                                cursor: 'text',
                                transition: 'all 0.2s ease',
                                wordBreak: 'break-word',
                                whiteSpace: 'pre-wrap',
                                boxSizing: 'border-box',
                                // Use negative margins to overlap and create unified shape
                                marginTop: '-1px',
                                marginBottom: '-1px',
                                // Border only on left and right, let top/bottom merge
                                borderLeft: '1px solid #20b26c',
                                borderRight: '1px solid #20b26c',
                                // Add top/bottom borders via pseudo-elements for first/last lines
                                position: 'relative',
                                // Use slice mode for continuous background
                                boxDecorationBreak: 'slice',
                                WebkitBoxDecorationBreak: 'slice'
                            }}
                            // Add CSS class for border management
                            className="placeholder-segment"
                            onFocus={(e) => {
                                e.target.style.backgroundColor = '#d4edda';
                            }}
                            onBlur={(e) => {
                                const newValue = e.target.textContent || '';
                                setTemplateFields(prev => ({
                                    ...prev,
                                    [variableName]: newValue
                                }));
                                e.target.style.backgroundColor = '#e8f5e8';
                            }}
                        >
                            {fieldValue}
                        </span>
                    );
                }
            } else {
                // Variable is empty - show as inline input placeholder
                const placeholderText = variableName.replace(/_/g, ' ');
                
                if (isInBullet) {
                    // Special handling for placeholders within bullets - render with bullet alignment
                    parts.push(
                        <div
                            key={match.index}
                            style={{
                                display: 'block',
                                marginLeft: '16px',
                                textIndent: '-16px',
                                paddingLeft: '16px',
                                lineHeight: '1.5'
                            }}
                        >
                            <span
                                contentEditable
                                suppressContentEditableWarning={true}
                                data-placeholder={placeholderText}
                                onClick={(e) => handleFieldClick(variableName, e)}
                                onMouseEnter={(e) => handleFieldHover(variableName, e)}
                                onMouseLeave={handleFieldHoverLeave}
                                style={{
                                    backgroundColor: '#f0f8ff',
                                    color: '#0078d4',
                                    padding: '2px 4px',
                                    fontWeight: 500,
                                    outline: 'none',
                                    fontFamily: 'Raleway, sans-serif',
                                    fontSize: '14px',
                                    display: 'inline',
                                    minWidth: '20px',
                                    cursor: 'text',
                                    transition: 'all 0.2s ease',
                                    wordBreak: 'break-word',
                                    whiteSpace: 'pre-wrap',
                                    boxSizing: 'border-box',
                                    marginTop: '-1px',
                                    marginBottom: '-1px',
                                    borderLeft: '1px dashed #0078d4',
                                    borderRight: '1px dashed #0078d4',
                                    position: 'relative',
                                    boxDecorationBreak: 'slice',
                                    WebkitBoxDecorationBreak: 'slice',
                                    marginLeft: '16px' // Align with bullet content
                                }}
                                className="placeholder-segment-empty"
                                onFocus={(e) => {
                                    e.target.style.backgroundColor = '#e6f3ff';
                                    e.target.style.borderStyle = 'solid';
                                }}
                                onBlur={(e) => {
                                    const newValue = e.target.textContent || '';
                                    setTemplateFields(prev => ({
                                        ...prev,
                                        [variableName]: newValue
                                    }));
                                    e.target.style.backgroundColor = '#f0f8ff';
                                    e.target.style.borderStyle = 'dashed';
                                }}
                            >
                                {placeholderText}
                            </span>
                        </div>
                    );
                } else {
                    parts.push(
                        <span
                            key={match.index}
                            contentEditable
                            suppressContentEditableWarning={true}
                            data-placeholder={placeholderText}
                            onClick={(e) => handleFieldClick(variableName, e)}
                            onMouseEnter={(e) => handleFieldHover(variableName, e)}
                            onMouseLeave={handleFieldHoverLeave}
                            style={{
                                backgroundColor: '#f0f8ff',
                                color: '#0078d4',
                                padding: '2px 4px',
                                fontWeight: 500,
                                outline: 'none',
                                fontFamily: 'Raleway, sans-serif',
                                fontSize: '14px',
                                display: 'inline',
                                minWidth: '20px',
                                cursor: 'text',
                                transition: 'all 0.2s ease',
                                wordBreak: 'break-word',
                                whiteSpace: 'pre-wrap',
                                boxSizing: 'border-box',
                                // Use negative margins to overlap and create unified shape
                                marginTop: '-1px',
                                marginBottom: '-1px',
                                // Border only on left and right, let top/bottom merge
                                borderLeft: '1px dashed #0078d4',
                                borderRight: '1px dashed #0078d4',
                                // Add top/bottom borders via pseudo-elements for first/last lines
                                position: 'relative',
                                // Use slice mode for continuous background
                                boxDecorationBreak: 'slice',
                                WebkitBoxDecorationBreak: 'slice'
                            }}
                            // Add CSS class for border management
                            className="placeholder-segment-empty"
                            onFocus={(e) => {
                                e.target.style.backgroundColor = '#e6f3ff';
                                e.target.style.borderStyle = 'solid';
                            }}
                            onBlur={(e) => {
                                const newValue = e.target.textContent || '';
                                setTemplateFields(prev => ({
                                    ...prev,
                                    [variableName]: newValue
                                }));
                                e.target.style.backgroundColor = '#f0f8ff';
                                e.target.style.borderStyle = 'dashed';
                            }}
                        >
                            {placeholderText}
                        </span>
                    );
                }
            }
            }
            
            lastIndex = match.index + match[0].length;
        }
        
        // Handle any remaining table at the end
        if (globalTableState && globalTableRows.length > 0) {
            parts.push(
                <div key={`final-table`} style={{ 
                    display: 'block',
                    marginTop: '16px',
                    marginBottom: '16px',
                    width: '100%'
                }}>
                    <table style={{ 
                        width: '100%', 
                        borderCollapse: 'collapse',
                        border: '1px solid #ccc',
                        fontSize: '14px'
                    }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f8f9fa' }}>
                                <th style={{ 
                                    border: '1px solid #ccc',
                                    padding: '12px',
                                    textAlign: 'left',
                                    fontWeight: 'bold',
                                    width: '50%'
                                }}>
                                    Action required by you
                                </th>
                                <th style={{ 
                                    border: '1px solid #ccc',
                                    padding: '12px',
                                    textAlign: 'left',
                                    fontWeight: 'bold',
                                    width: '50%'
                                }}>
                                    Additional information
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {globalTableRows}
                        </tbody>
                    </table>
                </div>
            );
        }
        
        return parts.length > 0 ? parts : content;
    };

    // Function to render fields-only view with context sentences
    const renderFieldsOnlyView = () => {
        // All 44 placeholders from the actual CCL template
        const actualFields = [
            'insert_clients_name',
            'insert_heading_eg_matter_description', 
            'matter',
            'name_of_person_handling_matter',
            'status',
            'insert_telephone_number',
            'insert_email_address',
            'insert_postal_address',
            'name_of_handler',
            'email',
            'handler',
            'names_and_contact_details_of_other_members_of_staff_who_can_help_with_queries',
            'name',
            'insert_current_position_and_scope_of_retainer',
            'next_steps',
            'realistic_timescale',
            'we_cannot_give_an_estimate_of_our_overall_charges_in_this_matter_because_reason_why_estimate_is_not_possible',
            'next_stage',
            'figure_or_range',
            'describe_disbursement_1',
            'insert_estimated_amount_of_disbursement_1',
            'vat_chargeable_1',
            'describe_disbursement_2',
            'insert_estimated_amount_of_disbursement_2',
            'vat_chargeable_2',
            'describe_disbursement_3',
            'insert_estimated_amount_of_disbursement_3',
            'vat_chargeable_3',
            'estimate',
            'in_total_including_vat_or_for_the_next_steps_in_your_matter',
            'give_examples_of_what_your_estimate_includes_eg_accountants_report_and_court_fees',
            'identify_the_other_party_eg_your_opponents',
            'figure',
            'matter_number',
            'and_or_intervals_eg_every_three_months',
            'contact_details_for_marketing_opt_out',
            'link_to_preference_centre',
            'may_will',
            'instructions_link',
            'insert_next_step_you_would_like_client_to_take',
            'state_why_this_step_is_important',
            'state_amount',
            'describe_first_document_or_information_you_need_from_your_client',
            'describe_second_document_or_information_you_need_from_your_client',
            'describe_third_document_or_information_you_need_from_your_client',
            'explain_the_nature_of_your_arrangement_with_any_introducer_for_link_to_sample_wording_see_drafting_note_referral_and_fee_sharing_arrangement'
        ];
        
        // Field contexts for better user understanding based on actual template
        const fieldContexts: Record<string, { before: string; after: string }> = {
            'insert_clients_name': {
                before: 'Dear',
                after: '[heading] Thank you for your instructions'
            },
            'insert_heading_eg_matter_description': {
                before: 'Dear [Client Name]',
                after: 'Thank you for your instructions to act'
            },
            'matter': {
                before: 'Thank you for your instructions to act on your behalf in connection with',
                after: '. This Engagement Letter and the attached Terms'
            },
            'name_of_person_handling_matter': {
                before: 'The person dealing with your matter is',
                after: ', who is a [status]'
            },
            'status': {
                before: 'The person dealing with your matter is [name], who is a',
                after: '. Their contact details are:'
            },
            'insert_telephone_number': {
                before: 'Telephone number',
                after: 'Email address'
            },
            'insert_email_address': {
                before: '[Insert telephone number] Email address',
                after: 'Postal address'
            },
            'insert_postal_address': {
                before: '[Insert email address] Postal address',
                after: 'The best way to contact'
            },
            'name_of_handler': {
                before: 'The best way to contact',
                after: 'is [email]'
            },
            'email': {
                before: 'The best way to contact [handler] is',
                after: '. If [handler] is not available'
            },
            'handler': {
                before: 'If',
                after: 'is not available, the following members'
            },
            'names_and_contact_details_of_other_members_of_staff_who_can_help_with_queries': {
                before: 'If [handler] is not available, the following members of staff may be able to deal with any queries you have:',
                after: 'The person with overall responsibility'
            },
            'name': {
                before: 'The person with overall responsibility for supervising your matter is',
                after: ', who is a Partner.'
            },
            'insert_current_position_and_scope_of_retainer': {
                before: 'Scope of services',
                after: '("Initial Scope") We will provide legal advice'
            },
            'next_steps': {
                before: 'The next steps in your matter are',
                after: '. We expect this will take'
            },
            'realistic_timescale': {
                before: 'We expect this will take',
                after: '. This is an estimate only'
            },
            'we_cannot_give_an_estimate_of_our_overall_charges_in_this_matter_because_reason_why_estimate_is_not_possible': {
                before: 'or',
                after: '. The next stage in your matter is'
            },
            'next_stage': {
                before: 'The next stage in your matter is',
                after: 'and we estimate that our charges'
            },
            'figure_or_range': {
                before: 'we estimate that our charges up to the completion of that stage will be in the region of £',
                after: '. We reserve the right to increase'
            },
            'estimate': {
                before: 'We cannot give an exact figure for your disbursements, but this is likely to be in the region of £',
                after: '[total description] including'
            },
            'in_total_including_vat_or_for_the_next_steps_in_your_matter': {
                before: 'but this is likely to be in the region of £[estimate]',
                after: 'including [examples]'
            },
            'give_examples_of_what_your_estimate_includes_eg_accountants_report_and_court_fees': {
                before: '[total description] including',
                after: '. Costs you may have to pay'
            },
            'identify_the_other_party_eg_your_opponents': {
                before: 'There is a risk that you may have to pay',
                after: 'costs in this matter'
            },
            'figure': {
                before: 'Please provide us with £',
                after: 'on account of costs'
            },
            'matter_number': {
                before: 'Please use the reference <<',
                after: '>> We work with money'
            },
            'and_or_intervals_eg_every_three_months': {
                before: 'We have agreed to provide you with an update on the amount of costs when appropriate as the matter progresses',
                after: '. Risk analysis'
            },
            'contact_details_for_marketing_opt_out': {
                before: '—contacting us at',
                after: '; —using the \'unsubscribe\' link'
            },
            'link_to_preference_centre': {
                before: '—updating your marketing preferences on our',
                after: '. Prevention of money laundering'
            },
            'may_will': {
                before: 'Your matter',
                after: 'involve court proceedings'
            },
            'instructions_link': {
                before: 'The \'Instructions for Cancellation\' notice at',
                after: 'explains: —how to cancel'
            },
            'insert_next_step_you_would_like_client_to_take': {
                before: '☐',
                after: '[State why this step is important]'
            },
            'state_why_this_step_is_important': {
                before: '[Insert next step you would like client to take]',
                after: '☐ Provide a payment on account'
            },
            'state_amount': {
                before: '☐ Provide a payment on account of costs and disbursements of £',
                after: 'If we do not receive a payment'
            },
            'describe_first_document_or_information_you_need_from_your_client': {
                before: '☐ Provide the following documents [and information] to allow me to take the next steps in your matter:',
                after: '[describe second document]'
            },
            'describe_second_document_or_information_you_need_from_your_client': {
                before: '[describe first document or information you need from your client]',
                after: '[describe third document]'
            },
            'describe_third_document_or_information_you_need_from_your_client': {
                before: '[describe second document or information you need from your client]',
                after: 'Without these documents there may be a delay'
            },
            'explain_the_nature_of_your_arrangement_with_any_introducer_for_link_to_sample_wording_see_drafting_note_referral_and_fee_sharing_arrangement': {
                before: 'Referral and fee sharing arrangement',
                after: 'Right to cancel'
            }
        };

        return (
            <div>
                {/* Special section for costs choice */}
                <div style={{ 
                    marginBottom: '24px',
                    padding: '16px',
                    backgroundColor: '#FFF9E6',
                    border: '1px solid #FFD700',
                    borderLeft: '4px solid #FF8C00',
                    borderRadius: '4px'
                }}>
                    <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#CC6600',
                        marginBottom: '12px'
                    }}>
                        Section 4.3: Costs Choice
                    </div>
                    <div style={{
                        fontSize: '13px',
                        color: '#666',
                        marginBottom: '12px',
                        fontStyle: 'italic',
                        lineHeight: '1.4'
                    }}>
                        Choose which statement applies to your matter regarding costs that may need to be paid to another party:
                    </div>
                    
                    <Dropdown
                        label="Costs to Another Party"
                        selectedKey={costsChoice}
                        onChange={(_, option) => {
                            if (option) {
                                setCostsChoice(option.key as 'no_costs' | 'risk_costs');
                            }
                        }}
                        options={[
                            { 
                                key: 'no_costs', 
                                text: 'No costs expected - Not relevant to this matter' 
                            },
                            { 
                                key: 'risk_costs', 
                                text: 'Risk of paying opposing party costs exists' 
                            }
                        ]}
                        styles={{
                            root: { marginTop: '8px' }
                        }}
                    />
                    
                    {costsChoice === 'risk_costs' && (
                        <div style={{ marginTop: '16px' }}>
                            <TextField
                                label="Identify the Other Party"
                                value={templateFields.identify_the_other_party_eg_your_opponents}
                                onChange={(_, newValue) => {
                                    setTemplateFields(prev => ({
                                        ...prev,
                                        identify_the_other_party_eg_your_opponents: newValue || ''
                                    }));
                                }}
                                placeholder="e.g., your opponents, the other party, etc."
                                styles={{ 
                                    root: { marginTop: 8 }
                                }}
                            />
                        </div>
                    )}
                </div>

                {/* Special section for disbursements choice */}
                <div style={{ 
                    marginBottom: '24px',
                    padding: '16px',
                    backgroundColor: '#F0F8FF',
                    border: '1px solid #87CEEB',
                    borderLeft: '4px solid #0078d4',
                    borderRadius: '4px'
                }}>
                    <div style={{
                        fontSize: '16px',
                        fontWeight: '600',
                        color: '#0078d4',
                        marginBottom: '12px'
                    }}>
                        Section 4.2: Disbursements Format
                    </div>
                    <div style={{
                        fontSize: '13px',
                        color: '#666',
                        marginBottom: '12px',
                        fontStyle: 'italic',
                        lineHeight: '1.4'
                    }}>
                        Choose how to present the disbursements information:
                    </div>
                    
                    <Dropdown
                        label="Disbursements Format"
                        selectedKey={disbursementsChoice}
                        onChange={(_, option) => {
                            if (option) {
                                setDisbursementsChoice(option.key as 'table' | 'estimate');
                            }
                        }}
                        options={[
                            { 
                                key: 'table', 
                                text: 'Table format (client provided info)' 
                            },
                            { 
                                key: 'estimate', 
                                text: 'Estimate format (cannot provide exact figures)' 
                            }
                        ]}
                        styles={{
                            root: { marginTop: '8px' }
                        }}
                    />
                    
                    {disbursementsChoice === 'estimate' && (
                        <div style={{ marginTop: '16px' }}>
                            <TextField
                                label="Estimated Amount (£)"
                                value={templateFields.estimate}
                                onChange={(_, newValue) => {
                                    setTemplateFields(prev => ({
                                        ...prev,
                                        estimate: newValue || ''
                                    }));
                                }}
                                placeholder="e.g., 500"
                                styles={{ 
                                    root: { marginBottom: 12 }
                                }}
                            />
                            <TextField
                                label="Description (total including VAT / for next steps)"
                                value={templateFields.in_total_including_vat_or_for_the_next_steps_in_your_matter}
                                onChange={(_, newValue) => {
                                    setTemplateFields(prev => ({
                                        ...prev,
                                        in_total_including_vat_or_for_the_next_steps_in_your_matter: newValue || ''
                                    }));
                                }}
                                placeholder="e.g., in total including VAT"
                                styles={{ 
                                    root: { marginBottom: 12 }
                                }}
                            />
                            <TextField
                                label="Examples of what's included"
                                value={templateFields.give_examples_of_what_your_estimate_includes_eg_accountants_report_and_court_fees}
                                onChange={(_, newValue) => {
                                    setTemplateFields(prev => ({
                                        ...prev,
                                        give_examples_of_what_your_estimate_includes_eg_accountants_report_and_court_fees: newValue || ''
                                    }));
                                }}
                                placeholder="e.g., court fees and search fees"
                                styles={{ 
                                    root: { marginBottom: 12 }
                                }}
                            />
                        </div>
                    )}
                </div>

                {actualFields.map(field => {
                    const context = fieldContexts[field];
                    // Try to get value from templateFields, fallback to empty string
                    const fieldValue = templateFields[field] || templateFields[`{{${field}}}`] || templateFields[`[${field}]`] || '';
                    
                    // Format field label
                    const formatFieldLabel = (key: string): string => {
                        return key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
                    };
                    
                    return (
                        <div key={field} style={{ 
                            marginBottom: '24px',
                            padding: '16px',
                            backgroundColor: '#F4F4F6',
                            border: '1px solid #CCCCCC',
                            borderLeft: '4px solid #3690CE'
                        }}>
                            {context && (
                                <div style={{
                                    fontSize: '13px',
                                    color: '#666',
                                    marginBottom: '8px',
                                    fontStyle: 'italic',
                                    lineHeight: '1.4'
                                }}>
                                    <span style={{ opacity: 0.7 }}>
                                        "{context.before} "
                                    </span>
                                    <span style={{ 
                                        backgroundColor: '#d6e8ff', 
                                        padding: '2px 6px', 
                                        fontWeight: 600,
                                        color: '#061733'
                                    }}>
                                        [{formatFieldLabel(field)}]
                                    </span>
                                    <span style={{ opacity: 0.7 }}>
                                        " {context.after}"
                                    </span>
                                </div>
                            )}
                            
                            <TextField
                                label={formatFieldLabel(field)}
                                value={fieldValue}
                                onChange={(_, newValue) => {
                                    setTemplateFields(prev => ({
                                        ...prev,
                                        [field]: newValue || ''
                                    }));
                                }}
                                multiline={field.length > 30}
                                placeholder={`Enter ${formatFieldLabel(field).toLowerCase()}...`}
                                styles={{ 
                                    root: { marginTop: context ? 8 : 0 }
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        );
    };

    // Function to render template content with editable text and placeholders
    const renderEditableTemplateContent = (content: string) => {
        if (!content) return 'No content to preview...';
        
        // Always render in template mode with inline editing
        return (
            <div style={{ 
                width: '100%', 
                height: '100%',
                overflow: 'auto',
                fontFamily: 'Raleway, sans-serif',
                fontSize: '14px',
                lineHeight: '1.3',
                whiteSpace: 'pre-wrap',
                padding: '8px',
                minHeight: '100%',
                cursor: 'text',
                userSelect: 'text'
            }}>
                {renderTemplateContentWithHighlights(documentContent)}
            </div>
        );
    };

    // Function to render template content for read-only preview
    const renderTemplateContentForPreview = (content: string) => {
        if (!content) return 'No content to preview...';
        
        let processedContent = content;
        
        // Handle costs section choice
        const costsText = costsChoice === 'no_costs' 
            ? "We do not expect that you will have to pay another party's costs. This only tends to arise in litigation and is therefore not relevant to your matter."
            : `There is a risk that you may have to pay ${templateFields.identify_the_other_party_eg_your_opponents || '{{identify_the_other_party_eg_your_opponents}}'} costs in this matter. This is explained in section 5, Funding and billing below.`;
        
        processedContent = processedContent.replace(/\{\{costs_section_choice\}\}/g, costsText);
        
        // Handle disbursements section choice
        const disbursementsText = disbursementsChoice === 'table' 
            ? `Based on the information you have provided, we expect to incur the following disbursements:

Disbursement | Amount | VAT chargeable
[Describe disbursement] | £[Insert estimated amount] | [Yes OR No]
[Describe disbursement] | £[Insert estimated amount] | [Yes OR No]`
            : !showEstimateExamples 
                ? `We cannot give an exact figure for your disbursements, but this is likely to be in the region of £${templateFields.simple_disbursements_estimate || '[Estimate]'} in total including VAT.`
                : `We cannot give an exact figure for your disbursements, but this is likely to be in the region of £${templateFields.simple_disbursements_estimate || '[Estimate]'} for the next steps in your matter including ${templateFields.give_examples_of_what_your_estimate_includes_eg_accountants_report_and_court_fees || '[Examples]'}.`;
        
        processedContent = processedContent.replace(/\{\{disbursements_section_choice\}\}/g, disbursementsText);
        
        // Replace placeholders with actual values for final rendering
        Object.entries(templateFields).forEach(([key, value]) => {
            if (value) {
                const placeholder = `{{${key}}}`;
                processedContent = processedContent.replace(new RegExp(placeholder, 'g'), value);
            }
        });
        
        // Split content into lines and format numbered headings
        const lines = processedContent.split('\n');
        const formattedLines = lines.map(line => {
            // Check if line starts with number followed by space and text (e.g., "1 Contact details")
            // OR if it's a standalone heading like "Next steps" or "Electronic signatures"
            const numberedHeadingMatch = line.match(/^(\d+(?:\.\d+)*)\s+(.+)$/);
            const standaloneHeadingMatch = line.match(/^(Next steps|Electronic signatures|Yours sincerely)$/);
            // Check if line starts with — (bullet point)
            const bulletPointMatch = line.match(/^—(.+)$/);
            
            if (numberedHeadingMatch || standaloneHeadingMatch) {
                return (
                    <div key={line} style={{ fontWeight: 'bold', marginTop: '16px', marginBottom: '8px' }}>
                        {line}
                    </div>
                );
            } else if (bulletPointMatch) {
                // Handle bullet points with red bullets and styled section references
                const bulletContent = bulletPointMatch[1];
                // Check for section references like "(see section 4.1 below)"
                const sectionRefMatch = bulletContent.match(/^(.+?)(\(see section [^)]+\))(.*)$/);
                
                return (
                    <div key={line} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '4px', marginLeft: '16px' }}>
                        <span style={{ color: '#dc3545', marginRight: '8px', fontWeight: 'bold', flexShrink: 0 }}>•</span>
                        <span style={{ flex: 1 }}>
                            {sectionRefMatch ? (
                                <>
                                    <span>{sectionRefMatch[1]}</span>
                                    <span style={{ 
                                        color: '#6c757d', 
                                        fontSize: '13px', 
                                        fontStyle: 'italic',
                                        opacity: 0.8 
                                    }}>
                                        {sectionRefMatch[2]}
                                    </span>
                                    <span>{sectionRefMatch[3]}</span>
                                </>
                            ) : (
                                <span>{bulletContent}</span>
                            )}
                        </span>
                    </div>
                );
            }
            return <div key={line}>{line}</div>;
        });
        
        return <div style={{ whiteSpace: 'pre-wrap' }}>{formattedLines}</div>;
    };
    
    // Navigation functions
    const goToNextStep = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    };
    
    const goToPreviousStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };
    
    const goToStep = (step: number) => {
        setCurrentStep(step);
    };
    
    // Field styling functions - match DocumentsV2 exactly
    const answeredFieldStyle = {
        background: "#3690CE22",
        color: "#061733",
        border: "none",
        borderRadius: 0,
        boxShadow: "none",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    };

    const unansweredFieldStyle = {
        background: "#fff",
        color: "#061733",
        border: "none",
        borderRadius: 0,
        boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    };

    const pressedFieldStyle = {
        background: "rgba(0, 0, 0, 0.05)",
        color: "var(--helix-highlight, #3690CE)",
        border: "0.25px solid rgba(54, 144, 206, 0.4)",
        borderRadius: 0,
        boxShadow: "none",
        outline: "none",
        transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
    };

    // Helper to get field style - match DocumentsV2 exactly
    const getFieldStyle = (fieldKey: string, value: string) => {
        const isActive = activeField === fieldKey;
        const isTouched = touchedFields[fieldKey];
        if (isActive) return pressedFieldStyle;
        if (isTouched && value) return answeredFieldStyle;
        return unansweredFieldStyle;
    };

    // Remove blue border on focus
    const noFocusOutline = {
        outline: "none",
        '&:focus': {
            outline: "none"
        }
    };
    
    // Instruction dropdown options
    const instructionOptions = [
        { key: 'none', text: 'No instruction selected', data: null },
        ...instructions.map(inst => ({
            key: inst.id || `instruction-${inst.prospectId}`,
            text: inst.title || (inst.prospectId ? `Instruction ${inst.prospectId}` : 'Untitled Instruction'),
            data: inst
        }))
    ];
    
    // Common styles - match DocumentsV2 exactly
    const questionBannerStyle: React.CSSProperties = {
        background: `linear-gradient(to right, #ffffff, ${colours.light.grey})`,
        borderLeft: `3px solid ${colours.cta}`,
        padding: '4px 8px',
        fontWeight: '600',
        color: '#061733',
        marginBottom: '8px',
        fontSize: '14px',
        borderRadius: '0',
        fontFamily: 'Raleway, sans-serif'
    };
    
    const cardStyle = {
        backgroundColor: '#fff',
        padding: '20px',
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '20px'
    };
    
    const templateCardStyle = {
        padding: '24px',
        borderRadius: '8px',
        textAlign: 'center' as const,
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        minHeight: '200px',
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center'
    };
    
    
    const navigationStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24
    };



    return (
        <>
            <TemplateSelectionStep
                currentStep={currentStep}
                isInstructionBasedMode={isInstructionBasedMode}
                questionBannerStyle={questionBannerStyle}
                instructionSearchTerm={instructionSearchTerm}
                setInstructionSearchTerm={setInstructionSearchTerm}
                filteredInstructions={filteredInstructions}
                selectedInstruction={selectedInstruction}
                userHasInteracted={userHasInteracted}
                setSelectedInstruction={setSelectedInstruction}
                setHasSelectedInstruction={setHasSelectedInstruction}
                setUserHasInteracted={setUserHasInteracted}
                selectedTemplate={selectedTemplate}
                handleTemplateSelect={handleTemplateSelect}
                templateCardStyle={templateCardStyle}
                colours={colours}
                navigationStyle={navigationStyle}
                canProceedToStep2={canProceedToStep2}
                goToNextStep={goToNextStep}
            />
            <TemplateEditorStep
                currentStep={currentStep}
                questionBannerStyle={questionBannerStyle}
                renderFieldsOnlyView={renderFieldsOnlyView}
                renderEditableTemplateContent={renderEditableTemplateContent}
                documentContent={documentContent}
                isFieldsOnlyView={isFieldsOnlyView}
                setIsFieldsOnlyView={setIsFieldsOnlyView}
                navigationStyle={navigationStyle}
                goToPreviousStep={goToPreviousStep}
                canProceedToStep3={canProceedToStep3}
                goToNextStep={goToNextStep}
            />
            <PreviewActionsStep
                currentStep={currentStep}
                questionBannerStyle={questionBannerStyle}
                renderTemplateContentForPreview={renderTemplateContentForPreview}
                documentContent={documentContent}
                windowWidth={windowWidth}
                message={message}
                setMessage={setMessage}
                generateTemplateContent={generateTemplateContent}
                templateFields={templateFields}
                selectedTemplate={selectedTemplate}
                navigationStyle={navigationStyle}
                goToPreviousStep={goToPreviousStep}
                goToNextStep={goToNextStep}
            />

            {/* Render preset panel */}
            <PresetPanel
                show={showPresets && !!presetField}
                field={presetField}
                position={presetPosition}
                presets={FIELD_PRESETS}
                onSelect={handlePresetSelect}
                onClose={closePresets}
            />

            {/* Hover tooltip */}
            <HoverTooltip
                hoveredField={hoveredField}
                position={tooltipPosition}
                displayNames={FIELD_DISPLAY_NAMES}
            />
        </>
    );
};

export default DocumentsV3;
