import React, { useState, useEffect } from 'react';
import { Stack, TextField, Toggle, Dropdown, MessageBar, MessageBarType } from '@fluentui/react';
import { Panel } from '@fluentui/react/lib/Panel';
import { InstructionData } from '../../app/functionality/types';
import { useTheme } from '../../app/functionality/ThemeContext';
import QuickActionsCard from '../home/QuickActionsCard';
import { colours } from '../../app/styles/colours';
import { Icon } from '@fluentui/react/lib/Icon';

const DEFAULT_CCL_TEMPLATE = `Dear {{insert_clients_name}}

{{insert_heading_eg_matter_description}}

Thank you for your instructions to act on your behalf in connection with {{matter}}. This Engagement Letter and the attached Terms of Business explain the basis on which we will be acting for you—together they form the contract between us.

Please contact me if you have any difficulty understanding this Engagement Letter or other information we may provide, eg if anything in this letter is unclear or you require information to be provided in larger text, another format or a different language.

Contact details and supervision

The person dealing with your matter is {{name_of_person_handling_matter}}, who is a {{status}}. Their contact details are:

Telephone number: [Insert telephone number]
Email address: [Insert email address]
Postal address: [Insert postal address]

The best way to contact {{name_of_handler}} is {{email}}.

If {{handler}} is not available, the following members of staff may be able to deal with any queries you have:

{{names_and_contact_details_of_other_members_of_staff_who_can_help_with_queries}}

The person with overall responsibility for supervising your matter is {{name}}, who is a Partner.

Scope of services

{{insert_current_position_and_scope_of_retainer}} ("Initial Scope")

We will provide legal advice and services to you with reasonable care and skill. However, the nature of many types of legal work means that it is not possible to guarantee a particular outcome.

Our Terms of Business sets out general limitations on the scope of our services. Your matter may involve issues for which you need tax advice. We cannot and do not give advice on taxation and you should seek the advice of a suitably qualified tax expert. Where your case needs expert evidence then you will need to identify, with us, a suitably qualified expert to give an opinion. Any expert fees will be your responsibility.

Next steps

The next steps in your matter are {{next_steps}}.

We expect this will take {{realistic_timescale}}. This is an estimate only. We will tell you if it is necessary to revise this timescale.

Legal costs

There are three main elements to the legal costs of any matter:

—our charges (see section 4.1 below);

—expenses we must pay on your behalf—sometimes called disbursements (see section 4.2 below);

—costs that you may have to pay another party (see section 4.3 below).

Our charges

Our fees are calculated on the basis of an hourly rate. My rate is £395 per hour. Other Partners/senior solicitors are charged at £395, Associate solicitors at £325, Solicitors at £285 and trainees and paralegals are charged at £195. All hourly rates will be subject to the addition of VAT.

Short incoming and outgoing letters, messages, emails and routine phone calls are charged at 1/10 of an hour. All other work is timed in six minute units and charged at the relevant hourly rate. Please note that lots of small emails or telephone calls may unnecessarily increase the costs to you.

I estimate the cost of the Initial Scope with be £xxx plus VAT.

or

{{we_cannot_give_an_estimate_of_our_overall_charges_in_this_matter_because_reason_why_estimate_is_not_possible}}. The next stage in your matter is {{next_stage}} and we estimate that our charges up to the completion of that stage will be in the region of £{{figure_or_range}}.

We reserve the right to increase the hourly rates if the work done is particularly complex or urgent, or the nature of your instructions require us to work outside normal office hours. If this happens, we will notify you in advance and agree an appropriate rate.

We will review our hourly rates on a periodic basis. This is usually done annually each January. We will give you advance notice of any change to our hourly rates.

Disbursements (expenses)

Disbursements are expenses we must pay on your behalf.

Based on the information you have provided, we expect to incur the following disbursements:

Description | Amount | VAT chargeable
[Describe disbursement] | £[Insert estimated amount] | [Yes OR No]
[Describe disbursement] | £[Insert estimated amount] | [Yes OR No]

OR

We cannot give an exact figure for your disbursements, but this is likely to be in the region of £{{estimate}} {{in_total_including_vat_or_for_the_next_steps_in_your_matter}} including {{give_examples_of_what_your_estimate_includes_eg_accountants_report_and_court_fees}}.

Costs you may have to pay another party

We do not expect that you will have to pay another party's costs. This only tends to arise in litigation and is therefore not relevant to your matter.

OR

There is a risk that you may have to pay {{identify_the_other_party_eg_your_opponents}} costs in this matter. This is explained in section 5, Funding and billing below.

Funding and billing

You are responsible for the legal costs set out in this Engagement Letter.

Unless agreed otherwise, our interim bills are detailed bills and are final in respect of the period to which they relate, save that disbursements may be billed separately and later than the interim bill for our charges in respect of the same period. We will send you a final bill at the end of your matter which will cover our charges from the date of the last interim bill and any unbilled disbursements. You have the right to challenge any interim bill or the final bill by applying to the court to assess the bill under the Solicitors Act 1974. The usual time limit for applying to the court for an assessment is one month from the date of delivery of the interim or final bill. Please be aware that the time limit runs from the date of each individual bill.

Invoices are due forthwith with interest payable from 14 days after the date of the invoice.

Payment on account of costs

Please provide us with £{{figure}} on account of costs. Our account is:

Helix Law General Client Account, Barclays Bank, Eastbourne, 20-27-91 93472434

Please use the reference << Matter.Number >>

We work with money on account at all times, unless otherwise agreed in writing. This means that you should pay any invoice in full immediately, even if we hold money on account. If you fail pay an invoice when due, fail to maintain a reasonable sum on account of costs and/or disbursements we may, at our discretion, suspend work. We may terminate the retainer if the invoice is more than 14 days overdue. We may also terminate the retainer if you refuse, neglect or are unable to pay a reasonable sum on account of costs and/or disbursements within a reasonable time of it being requested. For urgent matters or necessary steps that require immediate action that reasonable time may be measured in hours.

Costs updates

We have agreed to provide you with an update on the amount of costs when appropriate as the matter progresses{{and_or_intervals_eg_every_three_months}}.

Risk analysis

We have discussed whether the potential outcome of your matter justifies the expense and risk involved. Our preliminary assessment is that it does.

Limitation

Each cause of action has a strict time limit after which you cannot bring a claim. Contract claims could be 6 years from the date the sums claimed/damages fell due/accrued.

If there is some fact that I have not been given or you disagree with my view on the limitation period then please let me know at once.

Data protection

We take your privacy very seriously. Our Privacy policy contains important information on how and why we collect, process and store your personal data. It also explains your rights in relation to your personal data. The Privacy policy is available on our website at Helix Law Privacy Policy, but please contact us if you would like us to send a copy to you or if you would prefer us to explain our Privacy policy verbally.

We use outside counsel, experts, software providers and an external file auditors so your confidential information will be shared with them. Each will be bound to confidentiality by the particular contract with us and/or their professional obligations to you and to us.

Marketing

We may use your personal data to send you updates (by email, text, telephone or post) about legal developments that might be of interest to you and/or information about our services, including exclusive offers, promotions or new services. You have the right to opt out of receiving promotional communications at any time, by:

—contacting us at {{contact_details_for_marketing_opt_out}};

—using the 'unsubscribe' link in emails or 'STOP' number in texts;

—updating your marketing preferences on our {{link_to_preference_centre}}.

Prevention of money laundering, terrorist financing and proliferation financing

We are required by law to obtain satisfactory evidence of the identity of our clients and also sometimes people related to them. This includes where monies are received from third parties on your behalf. This is because solicitors deal with money and property on behalf of clients and criminals can at times therefore attempt to use our services and accounts in an attempt to launder money. We therefore need to obtain and retain evidence of your identity. Most Solicitor firms request that their clients provide evidence of their identity themselves. However, we recognise that this can be time consuming and we therefore obtain confirmation of your identity using a search service, at our cost. Please note that if you do not wish us to verify your identity electronically you must bring this to our immediate attention. The electronic search process does leave an electronic 'footprint' each time a search is conducted. Footprints detail the date, time and reason for a search and certain types of search footprints are used in credit scoring systems and may have a detrimental impact on a consumer's ability to obtain credit.

Unfortunately if the report is unsuccessful i.e. if you have only recently moved address, we may need to ask you to send in certain documents for our records, such as a recent utility bill confirming your address, and photographic identity documents such as a passport or driving licence. If this is necessary the identity documents should be provided by you, as our client or, where our client is a limited company, by a Director of the company. If you wish to provide us with authority to discuss your matter with any third party we must have your authority confirmed in writing. Please contact me if you have any queries regarding this.

Duties to the court

Your matter {{may_will}} involve court proceedings. All solicitors have a professional duty to uphold the rule of law and the proper administration of justice. We must comply with our duties to the court, even where this conflicts with our obligations to you. This means that we must not:

• attempt to deceive or knowingly or recklessly mislead the court

• be complicit in another person deceiving or misleading the court

• place ourselves in contempt of court

• make or offer payments to witnesses who depend on their evidence or the outcome of the case

We must also comply with court orders that put obligations on us and ensure that evidence relating to sensitive issues is not misused.

The court gives orders and there are strict times for complying with those orders. If the orders aren't followed in time then it may result in your case being struck out and an order for costs being made against you. It is your responsibility to reply quickly to any request for information, documents and instructions we may make of you. If you leave it to the last minute we cannot guarantee that you will be able to complete our work in time as we may have other matters and court proceedings that prevent us meeting your deadline.

In all litigation and disputes all parties have a duty to preserve evidence that is relevant to the dispute, including physical and electronic records and documents which either help your case and also includes those which are against you. This duty is important not least as if documents are deleted or destroyed that are relevant to the dispute our advice to you may be compromised. Further if documents are destroyed the court will be entitled to assume the absolute worst in terms of their content. This is likely to be extremely unhelpful to your case. Please contact me if you have any queries regarding this.

Complaints

We want to give you the best possible service. However, if at any point you become unhappy or concerned about the service we have provided you should inform us immediately so we can do our best to resolve the problem.

In the first instance it may be helpful to contact the person who is working on your case to discuss your concerns and we will do our best to resolve any issues. If you would like to make a formal complaint, you can read our full complaints procedure here. Making a complaint will not affect how we handle your matter.

You may have a right to complain to the Legal Ombudsman. The time frame for doing so and full details of how to contact the Legal Ombudsman are in our Terms of Business.

Limit on liability

Our maximum liability to you (or any other party we have agreed may rely on our services) in relation to any single matter or any group of connected matters which may be aggregated by our insurers will be £3,000,000, including interest and costs. This limit overrides any limit stated in our Terms of Business.

If you wish to discuss a variation of this limit, please contact the person dealing with your matter. Agreeing a higher limit on our liability may result in us seeking an increase in our charges for handling your matter.

Please see our Terms of Business for an explanation of other limits on our liability to you.

Referral and fee sharing arrangement

{{explain_the_nature_of_your_arrangement_with_any_introducer_for_link_to_sample_wording_see_drafting_note_referral_and_fee_sharing_arrangement}}

Right to cancel

You have the right to cancel this contract within 14 days without giving any reason. We will not start work during the cancellation period unless you expressly ask us to. The 'Instructions for Cancellation' notice at {{instructions_link}} explains:

—how to cancel and the effect of cancellation;

—what you will be liable for if you ask us to start work during the cancellation period.

Action points

The action list below explains what you need to do next.

Action required by you | Additional information
☐ Sign and return one copy of the Terms of Business below | If you don't sign but continue to give us instructions you will be deemed to have accepted the terms in this letter and the Terms of Business
☐ [Insert next step you would like client to take] | [State why this step is important]
☐ Provide a payment on account of costs and disbursements of £[state amount] | If we do not receive a payment on account of costs and disbursements, there may be a delay in starting work on your behalf
☐ If you would like us to start work during the 14-day cancellation period, sign and return the attached 'Request to start work during the cancellation period' form | This form is attached to this Engagement Letter
☐ Alternatively, if wish to cancel your contract with us, tell us within 14 days | You can simply inform us of your decision to cancel by letter, telephone or e-mail
☐ Provide the following documents [and information] to allow me to take the next steps in your matter: | Without these documents there may be a delay in your matter.

[describe first document or information you need from your client]
[describe second document or information you need from your client]
[describe third document or information you need from your client]

Please contact me if you have any queries or concerns about your matter, this Engagement Letter or the attached Terms of Business. 

{{insert_current_position_and_scope_of_retainer}} ("Initial Scope") 

We will provide legal advice and services to you with reasonable care and skill. However, the nature of many types of legal work means that it is not possible to guarantee a particular outcome. 

Our Terms of Business sets out general limitations on the scope of our services. Your matter may involve issues for which you need tax advice. We cannot and do not give advice on taxation and you should seek the advice of a suitably qualified tax expert. Where your case needs expert evidence then you will need to identify, with us, a suitably qualified expert to give an opinion. Any expert fees will be your responsibility. 

Next steps 

The next steps in your matter are {{next_steps}}. 

The likely timescale for completion of your matter is {{realistic_timescale}}. 

We will send you a final bill at the end of your matter which will cover our charges from the date of the last interim bill and any unbilled disbursements. You have the right to challenge any interim bill or the final bill by applying to the court to assess the bill under the Solicitors Act 1974. The usual time limit for applying to the court for an assessment is one month from the date of delivery of the interim or final bill. Please be aware that the time limit runs from the date of each individual bill. 

Electronic signatures 

If you agree to the terms of this Engagement Letter, please sign and return one copy of this letter to us. You can do this by email. Electronic signatures are legally binding and we will accept them, including a signature on a printed copy of this letter which is then scanned and emailed to us. 

Yours sincerely 

{{name_of_person_handling_matter}}
{{status}}
For and on behalf of {{name_of_firm}}

I agree to the terms of this Engagement Letter. 

Signed: _________________________ 

Print name: _________________________ 

Date: _________________________`;

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
    const [templateFields, setTemplateFields] = useState<Record<string, string>>({
        insert_clients_name: '',
        insert_heading_eg_matter_description: '',
        matter: '',
        name_of_person_handling_matter: '',
        status: '',
        email: '',
        insert_current_position_and_scope_of_retainer: '',
        next_steps: '',
        realistic_timescale: ''
    });
    const [activeField, setActiveField] = useState<string | null>(null);
    const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
    
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
        estimate: "Disbursement Estimate",
        we_cannot_give_an_estimate_of_our_overall_charges_in_this_matter_because_reason_why_estimate_is_not_possible: "No Estimate Reason",
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
        name_of_firm: "Firm Name"
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
            if (selectedInstruction.title) {
                updatedFields.matter = selectedInstruction.title;
                updatedFields.insert_heading_eg_matter_description = `RE: ${selectedInstruction.title}`;
            }
            if (selectedInstruction.description) {
                updatedFields.insert_current_position_and_scope_of_retainer = selectedInstruction.description;
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
        
        while ((match = templateVariableRegex.exec(content)) !== null) {
            // Add editable text before the variable
            if (match.index > lastIndex) {
                const textSegment = content.substring(lastIndex, match.index);
                parts.push(
                    <span
                        key={`text-${lastIndex}`}
                        contentEditable
                        suppressContentEditableWarning={true}
                        onBlur={(e) => {
                            const newText = e.target.textContent || '';
                            const beforeText = content.substring(0, lastIndex);
                            // Find the next placeholder after this text segment
                            const remainingContent = content.substring(lastIndex);
                            const nextPlaceholderMatch = /\{\{([^}]+)\}\}/.exec(remainingContent);
                            const nextPlaceholderIndex = nextPlaceholderMatch ? lastIndex + nextPlaceholderMatch.index : content.length;
                            
                            const afterText = content.substring(nextPlaceholderIndex);
                            const newContent = beforeText + newText + afterText;
                            setDocumentContent(newContent);
                        }}
                        style={{
                            outline: 'none',
                            minHeight: '1em',
                            display: 'inline',
                            whiteSpace: 'pre-wrap',
                            cursor: 'text',
                            padding: '2px',
                            borderRadius: '2px',
                            transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                            (e.target as HTMLElement).style.backgroundColor = '#f0f0f0';
                        }}
                        onMouseLeave={(e) => {
                            (e.target as HTMLElement).style.backgroundColor = 'transparent';
                        }}
                        onFocus={(e) => {
                            (e.target as HTMLElement).style.backgroundColor = '#e8f4f8';
                        }}
                    >
                        {textSegment}
                    </span>
                );
            }
            
            // Add the interactive inline editor for placeholders
            const variableName = match[1].trim();
            const fieldValue = templateFields[variableName];
            
            if (fieldValue && fieldValue.trim()) {
                // Variable has a value - show as inline editable text
                parts.push(
                    <input
                        key={match.index}
                        type="text"
                        value={fieldValue}
                        onChange={(e) => {
                            setTemplateFields(prev => ({
                                ...prev,
                                [variableName]: e.target.value
                            }));
                        }}
                        onClick={(e) => handleFieldClick(variableName, e)}
                        onMouseEnter={(e) => handleFieldHover(variableName, e)}
                        onMouseLeave={handleFieldHoverLeave}
                        style={{
                            backgroundColor: '#d4edda',
                            color: '#155724',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontWeight: 500,
                            border: '1px solid #c3e6cb',
                            outline: 'none',
                            fontFamily: 'Raleway, sans-serif',
                            fontSize: '14px',
                            width: Math.max(measureTextWidth(fieldValue, 14) + 20, 80) + 'px',
                            minWidth: '80px',
                            maxWidth: '600px',
                            display: 'inline-block',
                            margin: '2px',
                            transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                            e.target.style.backgroundColor = '#c3e6cb';
                            e.target.style.transform = 'scale(1.02)';
                        }}
                        onBlur={(e) => {
                            e.target.style.backgroundColor = '#d4edda';
                            e.target.style.transform = 'scale(1)';
                        }}
                        onInput={(e) => {
                            // Dynamic width adjustment as user types
                            const target = e.target as HTMLInputElement;
                            const textWidth = measureTextWidth(target.value, 14);
                            target.style.width = Math.max(textWidth + 20, 80) + 'px';
                        }}
                    />
                );
            } else {
                // Variable is empty - show as inline input placeholder
                const placeholderText = `Enter ${variableName.replace(/_/g, ' ')}`;
                parts.push(
                    <input
                        key={match.index}
                        type="text"
                        value=""
                        placeholder={placeholderText}
                        onChange={(e) => {
                            setTemplateFields(prev => ({
                                ...prev,
                                [variableName]: e.target.value
                            }));
                        }}
                        onClick={(e) => handleFieldClick(variableName, e)}
                        onMouseEnter={(e) => handleFieldHover(variableName, e)}
                        onMouseLeave={handleFieldHoverLeave}
                        style={{
                            backgroundColor: '#fff3cd',
                            color: '#856404',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontWeight: 500,
                            border: '2px dashed #ffeaa7',
                            outline: 'none',
                            fontFamily: 'Raleway, sans-serif',
                            fontSize: '14px',
                            width: Math.max(measureTextWidth(placeholderText, 14) + 20, 120) + 'px',
                            minWidth: '120px',
                            maxWidth: '600px',
                            display: 'inline-block',
                            margin: '2px',
                            fontStyle: 'italic',
                            transition: 'all 0.2s ease'
                        }}
                        onFocus={(e) => {
                            e.target.style.backgroundColor = '#ffeaa7';
                            e.target.style.borderStyle = 'solid';
                            e.target.style.transform = 'scale(1.05)';
                            e.target.style.fontStyle = 'normal';
                        }}
                        onBlur={(e) => {
                            e.target.style.backgroundColor = '#fff3cd';
                            e.target.style.borderStyle = 'dashed';
                            e.target.style.transform = 'scale(1)';
                            e.target.style.fontStyle = 'italic';
                        }}
                        onInput={(e) => {
                            // Dynamic width adjustment as user types
                            const target = e.target as HTMLInputElement;
                            const textWidth = target.value.length > 0 
                                ? measureTextWidth(target.value, 14)
                                : measureTextWidth(placeholderText, 14);
                            const newWidth = Math.max(textWidth + 20, target.value.length > 0 ? 80 : 120);
                            target.style.width = newWidth + 'px';
                        }}
                    />
                );
            }
            
            lastIndex = match.index + match[0].length;
        }
        
        // Add any remaining editable text
        if (lastIndex < content.length) {
            const textSegment = content.substring(lastIndex);
            parts.push(
                <span
                    key={`text-${lastIndex}`}
                    contentEditable
                    suppressContentEditableWarning={true}
                    onBlur={(e) => {
                        const newText = e.target.textContent || '';
                        const beforeText = content.substring(0, lastIndex);
                        const newContent = beforeText + newText;
                        setDocumentContent(newContent);
                    }}
                    style={{
                        outline: 'none',
                        minHeight: '1em',
                        display: 'inline',
                        whiteSpace: 'pre-wrap',
                        cursor: 'text',
                        padding: '2px',
                        borderRadius: '2px',
                        transition: 'background-color 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                        (e.target as HTMLElement).style.backgroundColor = '#f0f0f0';
                    }}
                    onMouseLeave={(e) => {
                        (e.target as HTMLElement).style.backgroundColor = 'transparent';
                    }}
                    onFocus={(e) => {
                        (e.target as HTMLElement).style.backgroundColor = '#e8f4f8';
                    }}
                >
                    {textSegment}
                </span>
            );
        }
        
        return parts.length > 0 ? parts : content;
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
                lineHeight: '1.6',
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
        
        // Replace placeholders with actual values for final rendering
        Object.entries(templateFields).forEach(([key, value]) => {
            if (value) {
                const placeholder = `{{${key}}}`;
                processedContent = processedContent.replace(new RegExp(placeholder, 'g'), value);
            }
        });
        
        return processedContent;
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
    
    // Tooltip styles
    const tooltipStyle = {
        position: 'fixed' as const,
        top: tooltipPosition.y,
        left: tooltipPosition.x,
        transform: 'translateX(-50%)',
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        color: 'white',
        padding: '6px 12px',
        borderRadius: '4px',
        fontSize: '12px',
        fontWeight: '500',
        zIndex: 10000,
        pointerEvents: 'none' as const,
        whiteSpace: 'nowrap' as const,
        opacity: hoveredField ? 1 : 0,
        transition: 'opacity 0.2s ease'
    };
    
    const navigationStyle = {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 24
    };
    
    // Step 1: Instruction & Template Selection Page
    if (currentStep === 1) {
        return (
            <div>
                <div className="matter-opening-card">
                    <Stack tokens={{ childrenGap: 20 }}>
                    <div>
                        {/* Instruction Selection */}
                        {!isInstructionBasedMode && (
                            <div style={{ marginBottom: '24px' }}>
                                <div style={questionBannerStyle}>
                                    Select Instruction
                                </div>
                                
                                {/* Search input */}
                                <div style={{ marginTop: '12px', marginBottom: '16px' }}>
                                    <input
                                        type="text"
                                        placeholder="Search instructions..."
                                        value={instructionSearchTerm}
                                        onChange={(e) => setInstructionSearchTerm(e.target.value)}
                                        style={{
                                            width: '100%',
                                            padding: '8px 12px',
                                            border: '1px solid #e1dfdd',
                                            borderRadius: '4px',
                                            fontSize: '14px',
                                            outline: 'none',
                                            transition: 'border-color 0.2s ease'
                                        }}
                                        onFocus={(e) => e.target.style.borderColor = '#3690CE'}
                                        onBlur={(e) => e.target.style.borderColor = '#e1dfdd'}
                                    />
                                </div>
                                
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                    gap: '12px'
                                }}>
                                    {/* Instruction options */}
                                    {filteredInstructions.length === 0 ? (
                                        <div style={{
                                            gridColumn: '1 / -1',
                                            textAlign: 'center',
                                            padding: '32px',
                                            color: '#666',
                                            fontSize: '14px'
                                        }}>
                                            {instructionSearchTerm.trim() ? 
                                                `No instructions found matching "${instructionSearchTerm}"` : 
                                                'No instructions available'
                                            }
                                        </div>
                                    ) : (
                                        filteredInstructions.map((inst) => {
                                        const instId = inst.id || inst.prospectId;
                                        const selectedId = selectedInstruction?.id || selectedInstruction?.prospectId;
                                        const isSelected = userHasInteracted && selectedId === instId;
                                        
                                        return (
                                        <div
                                            key={instId}
                                            style={{
                                                padding: '16px',
                                                border: isSelected ? `1px solid ${colours.highlight}` : '1px solid #e0e0e0',
                                                borderRadius: '0',
                                                backgroundColor: isSelected ? `${colours.highlight}22` : '#fff',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                position: 'relative'
                                            }}
                                            onClick={() => {
                                                if (isSelected) {
                                                    // Unselect if already selected - reset to initial state
                                                    setSelectedInstruction(null);
                                                    setHasSelectedInstruction(false);
                                                    setUserHasInteracted(false);
                                                } else {
                                                    // Select instruction
                                                    setSelectedInstruction(inst);
                                                    setHasSelectedInstruction(true);
                                                    setUserHasInteracted(true);
                                                }
                                            }}
                                            onMouseEnter={(e) => {
                                                if (!isSelected) {
                                                    e.currentTarget.style.borderColor = colours.highlight;
                                                    e.currentTarget.style.backgroundColor = '#f7fafc';
                                                }
                                            }}
                                            onMouseLeave={(e) => {
                                                if (!isSelected) {
                                                    e.currentTarget.style.borderColor = '#e0e0e0';
                                                    e.currentTarget.style.backgroundColor = '#fff';
                                                }
                                            }}
                                        >
                                            <div style={{
                                                fontSize: '16px',
                                                fontWeight: 600,
                                                color: '#061733',
                                                marginBottom: '4px'
                                            }}>
                                                {inst.title || (inst.prospectId ? `Instruction ${inst.prospectId}` : 'Untitled Instruction')}
                                            </div>
                                            {inst.deals?.[0]?.ServiceDescription && (
                                                <div style={{
                                                    fontSize: '14px',
                                                    color: '#3690CE',
                                                    marginBottom: '4px'
                                                }}>
                                                    {inst.deals[0].ServiceDescription}
                                                </div>
                                            )}
                                            {inst.description && (
                                                <div style={{
                                                    fontSize: '13px',
                                                    color: '#666'
                                                }}>
                                                    {inst.description}
                                                </div>
                                            )}
                                            {isSelected && (
                                                <div style={{
                                                    position: 'absolute',
                                                    top: '12px',
                                                    right: '12px',
                                                    width: '20px',
                                                    height: '20px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#3690CE',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center'
                                                }}>
                                                    <Icon iconName="Accept" style={{ color: '#fff', fontSize: '12px' }} />
                                                </div>
                                            )}
                                        </div>
                                        );
                                    })
                                    )}
                                </div>
                            </div>
                        )}
                        
                        {/* Template Selection */}
                        <div>
                            <div style={questionBannerStyle}>
                                Choose Your Template
                            </div>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '8px',
                                width: '100%',
                                marginTop: '0'
                            }}>
                                <div 
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        transition: 'all 0.2s ease',
                                        border: `1px solid ${selectedTemplate === 'ccl' ? colours.highlight : '#e0e0e0'}`,
                                        background: selectedTemplate === 'ccl' ? `${colours.highlight}22` : '#fff',
                                        color: selectedTemplate === 'ccl' ? colours.highlight : '#4a5568',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minHeight: '80px',
                                        position: 'relative',
                                        borderRadius: '0',
                                        boxShadow: selectedTemplate === 'ccl' ? `0 2px 8px ${colours.highlight}20` : 'none'
                                    }}
                                    onClick={() => handleTemplateSelect('ccl')}
                                    onMouseEnter={(e) => {
                                        if (selectedTemplate !== 'ccl') {
                                            e.currentTarget.style.background = '#f7fafc';
                                            e.currentTarget.style.borderColor = colours.highlight;
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedTemplate !== 'ccl') {
                                            e.currentTarget.style.background = '#fff';
                                            e.currentTarget.style.borderColor = '#e0e0e0';
                                        }
                                    }}
                                >
                                    <Icon iconName="FileText" style={{ marginBottom: '8px', fontSize: '20px', color: selectedTemplate === 'ccl' ? colours.highlight : '#4a5568' }} />
                                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>Client Care Letter</div>
                                    <div style={{ fontSize: '12px', color: '#666', textAlign: 'center', lineHeight: '1.3' }}>
                                        Standard engagement letter with placeholders
                                    </div>
                                </div>
                                
                                <div 
                                    style={{
                                        padding: '12px 16px',
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        userSelect: 'none',
                                        fontSize: '14px',
                                        fontWeight: '500',
                                        transition: 'all 0.2s ease',
                                        border: `1px solid ${selectedTemplate === 'custom' ? colours.highlight : '#e0e0e0'}`,
                                        background: selectedTemplate === 'custom' ? `${colours.highlight}22` : '#fff',
                                        color: selectedTemplate === 'custom' ? colours.highlight : '#4a5568',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        minHeight: '80px',
                                        position: 'relative',
                                        borderRadius: '0',
                                        boxShadow: selectedTemplate === 'custom' ? `0 2px 8px ${colours.highlight}20` : 'none'
                                    }}
                                    onClick={() => handleTemplateSelect('custom')}
                                    onMouseEnter={(e) => {
                                        if (selectedTemplate !== 'custom') {
                                            e.currentTarget.style.background = '#f7fafc';
                                            e.currentTarget.style.borderColor = colours.highlight;
                                        }
                                    }}
                                    onMouseLeave={(e) => {
                                        if (selectedTemplate !== 'custom') {
                                            e.currentTarget.style.background = '#fff';
                                            e.currentTarget.style.borderColor = '#e0e0e0';
                                        }
                                    }}
                                >
                                    <div style={{ fontSize: '14px', fontWeight: '600', marginBottom: '4px' }}>+ Custom Document</div>
                                    <div style={{ fontSize: '12px', color: '#666', textAlign: 'center', lineHeight: '1.3' }}>
                                        Start with a blank document
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </Stack>
                
                <div style={navigationStyle}>
                        <div></div>
                        <div
                            className="nav-button forward-button"
                            onClick={canProceedToStep2 ? goToNextStep : undefined}
                            aria-disabled={!canProceedToStep2}
                            tabIndex={canProceedToStep2 ? 0 : -1}
                            style={{
                                background: '#f4f4f6',
                                border: '2px solid #e1dfdd',
                                borderRadius: '0px',
                                width: '48px',
                                height: '48px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                cursor: canProceedToStep2 ? 'pointer' : 'not-allowed',
                                opacity: canProceedToStep2 ? 1 : 0.5,
                                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                boxShadow: '0 1px 2px rgba(6,23,51,0.04)',
                                position: 'relative',
                                overflow: 'hidden',
                                pointerEvents: canProceedToStep2 ? 'auto' : 'none',
                            }}
                            onMouseEnter={canProceedToStep2 ? (e) => {
                                e.currentTarget.style.background = '#ffefed';
                                e.currentTarget.style.border = '2px solid #D65541';
                                e.currentTarget.style.borderRadius = '0px';
                                e.currentTarget.style.width = '180px';
                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(214,85,65,0.08)';
                            } : undefined}
                            onMouseLeave={canProceedToStep2 ? (e) => {
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
                                    color: canProceedToStep2 ? '#D65541' : '#999',
                                    position: 'absolute',
                                    left: '50%',
                                    top: '50%',
                                    transform: 'translate(-50%, -50%)',
                                }}
                            >
                                <path 
                                    d="M5 12h14M12 5l7 7-7 7" 
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
                                Continue to Editor
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
            </div>
        );
    }
    
    // Step 2: Editor & Template Fields Page
    if (currentStep === 2) {
        return (
            <div className="matter-opening-card" style={{
                opacity: 1,
                animation: 'fadeIn 0.3s ease-out'
            }}>
                <style>
                    {`
                        @keyframes fadeIn {
                            from { opacity: 0; transform: translateY(10px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                    `}
                </style>
                <Stack tokens={{ childrenGap: 20 }}>
                    <div>
                        <div style={{ 
                            display: 'flex', 
                            gap: '20px', 
                            flexDirection: 'row'
                        }}>
                            {/* Interactive Template Editor Section */}
                            <div style={{ 
                                flex: '1', 
                                minWidth: '0'
                            }}>
                                <div style={questionBannerStyle}>
                                    Interactive Template Editor
                                </div>
                                
                                <div style={{ 
                                    border: '1px solid #e1e5e9',
                                    borderRadius: '4px',
                                    padding: '16px',
                                    minHeight: '300px',
                                    fontFamily: 'Raleway, sans-serif',
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                    whiteSpace: 'pre-wrap',
                                    backgroundColor: '#fff',
                                    cursor: 'text'
                                }}>
                                    {renderEditableTemplateContent(documentContent)}
                                </div>
                            </div>
                        </div>
                    </div>
                </Stack>
                
                {/* Navigation Below Content */}
                <div style={navigationStyle}>
                    <div
                        className="nav-button back-button"
                        onClick={goToPreviousStep}
                        tabIndex={0}
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
                                transform: 'translate(-50%, -50%) rotate(180deg)',
                            }}
                        >
                            <path 
                                d="M5 12h14M12 5l7 7-7 7" 
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
                            Back to Selection
                        </span>
                    </div>
                    <div
                        className="nav-button forward-button"
                        onClick={canProceedToStep3 ? goToNextStep : undefined}
                        aria-disabled={!canProceedToStep3}
                        tabIndex={canProceedToStep3 ? 0 : -1}
                        style={{
                            background: '#f4f4f6',
                            border: '2px solid #e1dfdd',
                            borderRadius: '0px',
                            width: '48px',
                            height: '48px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: canProceedToStep3 ? 'pointer' : 'not-allowed',
                            opacity: canProceedToStep3 ? 1 : 0.5,
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            boxShadow: '0 1px 2px rgba(6,23,51,0.04)',
                            position: 'relative',
                            overflow: 'hidden',
                            pointerEvents: canProceedToStep3 ? 'auto' : 'none',
                        }}
                        onMouseEnter={canProceedToStep3 ? (e) => {
                            e.currentTarget.style.background = '#ffefed';
                            e.currentTarget.style.border = '2px solid #D65541';
                            e.currentTarget.style.borderRadius = '0px';
                            e.currentTarget.style.width = '160px';
                            e.currentTarget.style.boxShadow = '0 2px 8px rgba(214,85,65,0.08)';
                        } : undefined}
                        onMouseLeave={canProceedToStep3 ? (e) => {
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
                                color: canProceedToStep3 ? '#D65541' : '#999',
                                position: 'absolute',
                                left: '50%',
                                top: '50%',
                                transform: 'translate(-50%, -50%)',
                            }}
                        >
                            <path 
                                d="M5 12h14M12 5l7 7-7 7" 
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
                            Continue to Preview
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    
    // Step 3: Preview & Actions Page
    if (currentStep === 3) {
        return (
            <div className="matter-opening-card" style={{
                opacity: 1,
                animation: 'fadeIn 0.3s ease-out'
            }}>
                <style>
                    {`
                        @keyframes fadeIn {
                            from { opacity: 0; transform: translateY(10px); }
                            to { opacity: 1; transform: translateY(0); }
                        }
                    `}
                </style>
                <Stack tokens={{ childrenGap: 20 }}>
                    {/* Message Bar */}
                    {message && (
                        <MessageBar
                            messageBarType={message.type}
                            onDismiss={() => setMessage(null)}
                            styles={{ root: { marginBottom: '20px' } }}
                        >
                            {message.text}
                        </MessageBar>
                    )}
                    
                    <div>
                        <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: 600 }}>
                            Step 3: Preview & Actions
                        </h2>
                        <p style={{ marginBottom: '24px', color: '#666' }}>
                            Review your document and choose your delivery method.
                        </p>
                        
                        <div style={{ 
                            display: 'flex', 
                            gap: '20px', 
                            minHeight: '500px',
                            flexDirection: windowWidth < 1200 ? 'column' : 'row'
                        }}>
                            {/* Document Preview */}
                            <div style={{ 
                                flex: '1', 
                                minWidth: '0'
                            }}>
                                <div style={questionBannerStyle}>
                                    Final Document Preview
                                </div>
                                <div style={{ 
                                    border: '1px solid #e1e5e9',
                                    borderRadius: '4px',
                                    padding: '20px',
                                    backgroundColor: '#f8f9fa',
                                    height: windowWidth < 1200 ? '300px' : '450px',
                                    overflow: 'auto',
                                    fontFamily: 'Raleway, sans-serif',
                                    fontSize: '14px',
                                    lineHeight: '1.6',
                                    whiteSpace: 'pre-wrap'
                                }}>
                                    {renderTemplateContentForPreview(documentContent)}
                                </div>
                            </div>
                            
                            {/* Actions Panel */}
                            <div style={{ 
                                width: windowWidth < 1200 ? '100%' : '350px', 
                                flexShrink: windowWidth < 1200 ? 1 : 0,
                                minWidth: windowWidth < 1200 ? '100%' : '300px'
                            }}>
                                <div style={questionBannerStyle}>
                                    Actions & Delivery
                                </div>
                                <div style={{ 
                                    border: '1px solid #e1e5e9', 
                                    borderRadius: '4px', 
                                    padding: '20px',
                                    backgroundColor: '#fff',
                                    height: windowWidth < 1200 ? '300px' : '450px'
                                }}>
                                    <Stack tokens={{ childrenGap: 16 }}>
                                        <div
                                            className="action-button"
                                            onClick={() => setMessage({ type: MessageBarType.success, text: 'Email functionality coming soon!' })}
                                            style={{
                                                background: '#D65541',
                                                color: 'white',
                                                border: 'none',
                                                borderRadius: '0px',
                                                width: '100%',
                                                padding: '12px 16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#B54533';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#D65541';
                                            }}
                                        >
                                            <Icon iconName="Mail" />
                                            Send via Email
                                        </div>
                                        
                                        <div
                                            className="action-button"
                                            onClick={() => setMessage({ type: MessageBarType.info, text: 'PDF download coming soon!' })}
                                            style={{
                                                background: '#f4f4f6',
                                                color: '#333',
                                                border: '1px solid #e1dfdd',
                                                borderRadius: '0px',
                                                width: '100%',
                                                padding: '12px 16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#e6e6e8';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#f4f4f6';
                                            }}
                                        >
                                            <Icon iconName="Download" />
                                            Download PDF
                                        </div>
                                        
                                        <div
                                            className="action-button"
                                            onClick={() => setMessage({ type: MessageBarType.success, text: 'Draft saved successfully!' })}
                                            style={{
                                                background: '#f4f4f6',
                                                color: '#333',
                                                border: '1px solid #e1dfdd',
                                                borderRadius: '0px',
                                                width: '100%',
                                                padding: '12px 16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#e6e6e8';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#f4f4f6';
                                            }}
                                        >
                                            <Icon iconName="Save" />
                                            Save as Draft
                                        </div>
                                        
                                        <div
                                            className="action-button"
                                            onClick={() => {
                                                navigator.clipboard.writeText(generateTemplateContent());
                                                setMessage({ type: MessageBarType.success, text: 'Document copied to clipboard!' });
                                            }}
                                            style={{
                                                background: '#f4f4f6',
                                                color: '#333',
                                                border: '1px solid #e1dfdd',
                                                borderRadius: '0px',
                                                width: '100%',
                                                padding: '12px 16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                gap: '8px',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s ease',
                                                fontSize: '14px',
                                                fontWeight: 600,
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.background = '#e6e6e8';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.background = '#f4f4f6';
                                            }}
                                        >
                                            <Icon iconName="Copy" />
                                            Copy to Clipboard
                                        </div>
                                        
                                        <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
                                            <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Document Summary</h4>
                                            <p style={{ margin: '0', fontSize: '12px', color: '#666' }}>
                                                Template: {selectedTemplate === 'ccl' ? 'Client Care Letter' : 'Custom Document'}
                                            </p>
                                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                                                Word count: {generateTemplateContent().split(/\s+/).filter(word => word.length > 0).length}
                                            </p>
                                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#666' }}>
                                                Fields filled: {Object.values(templateFields).filter(v => v.trim() !== '').length}/{Object.keys(templateFields).length}
                                            </p>
                                        </div>
                                    </Stack>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div style={navigationStyle}>
                        <div
                            className="nav-button back-button"
                            onClick={goToPreviousStep}
                            tabIndex={0}
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
                                e.currentTarget.style.width = '120px';
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
                                    transform: 'translate(-50%, -50%) rotate(180deg)',
                                }}
                            >
                                <path 
                                    d="M5 12h14M12 5l7 7-7 7" 
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
                                Back to Editor
                            </span>
                        </div>
                        <div
                            className="nav-button complete-button"
                            onClick={() => setMessage({ type: MessageBarType.success, text: 'Document completed successfully!' })}
                            tabIndex={0}
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
                            {/* Checkmark Icon */}
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
                                    d="M20 6L9 17l-5-5" 
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
                                Complete Document
                            </span>
                        </div>
                    </div>
                </Stack>
            </div>
        );
    }
    
    // Add preset panel that shows globally
    const presetPanel = showPresets && presetField && (
        <>
            {/* Backdrop */}
            <div
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0.1)',
                    zIndex: 1000
                }}
                onClick={closePresets}
            />
            
            {/* Preset Panel */}
            <div
                style={{
                    position: 'fixed',
                    left: Math.min(presetPosition.x - 150, window.innerWidth - 320),
                    top: Math.min(presetPosition.y, window.innerHeight - 300),
                    width: '300px',
                    maxHeight: '280px',
                    backgroundColor: '#fff',
                    border: '1px solid #e1e5e9',
                    borderRadius: '8px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
                    zIndex: 1001,
                    overflow: 'hidden'
                }}
            >
                {/* Header */}
                <div style={{
                    padding: '12px 16px',
                    borderBottom: '1px solid #e1e5e9',
                    backgroundColor: '#f8f9fa',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#333' }}>
                        Choose Preset for {presetField?.replace(/_/g, ' ')}
                    </div>
                    <button
                        onClick={closePresets}
                        style={{
                            background: 'none',
                            border: 'none',
                            fontSize: '16px',
                            cursor: 'pointer',
                            color: '#666',
                            padding: '2px'
                        }}
                    >
                        ×
                    </button>
                </div>
                
                {/* Preset Options */}
                <div style={{
                    maxHeight: '220px',
                    overflowY: 'auto',
                    padding: '8px'
                }}>
                    {(FIELD_PRESETS[presetField as keyof typeof FIELD_PRESETS] || []).map((preset, index) => (
                        <div
                            key={index}
                            onClick={() => handlePresetSelect(preset)}
                            style={{
                                padding: '8px 12px',
                                cursor: 'pointer',
                                borderRadius: '4px',
                                fontSize: '13px',
                                color: '#333',
                                backgroundColor: 'transparent',
                                border: '1px solid #e1e5e9',
                                margin: '4px 0',
                                transition: 'all 0.2s ease',
                                lineHeight: '1.3'
                            }}
                            onMouseEnter={(e) => {
                                e.currentTarget.style.backgroundColor = '#f8f9fa';
                                e.currentTarget.style.borderColor = colours.cta;
                                e.currentTarget.style.color = colours.cta;
                            }}
                            onMouseLeave={(e) => {
                                e.currentTarget.style.backgroundColor = 'transparent';
                                e.currentTarget.style.borderColor = '#e1e5e9';
                                e.currentTarget.style.color = '#333';
                            }}
                        >
                            {preset}
                        </div>
                    ))}
                    
                    {/* Custom input option */}
                    <div
                        onClick={closePresets}
                        style={{
                            padding: '10px 12px',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            fontSize: '13px',
                            color: '#666',
                            backgroundColor: 'transparent',
                            border: '1px dashed #ccc',
                            transition: 'all 0.2s ease',
                            margin: '8px 0 2px 0',
                            textAlign: 'center',
                            fontStyle: 'italic'
                        }}
                        onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = '#f8f9fa';
                            e.currentTarget.style.borderColor = '#999';
                        }}
                        onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.borderColor = '#ccc';
                        }}
                    >
                        Type my own...
                    </div>
                </div>
            </div>
        </>
    );

    return (
        <>
            {/* Render the appropriate step */}
            {currentStep === 1 && (
                <div className="matter-opening-card">
                    <Stack tokens={{ childrenGap: 20 }}>
                        <div>
                            <div style={{ 
                                display: 'flex', 
                                gap: '20px', 
                                minHeight: '600px',
                                flexDirection: 'row'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={questionBannerStyle}>
                                        Template Selection
                                    </div>
                                    <div style={{ 
                                        display: 'grid', 
                                        gridTemplateColumns: '1fr 1fr', 
                                        gap: '16px',
                                        paddingTop: '16px'
                                    }}>
                                        {/* CCL Template */}
                                        <div
                                            style={{
                                                ...templateCardStyle,
                                                border: selectedTemplate === 'ccl' ? `2px solid ${colours.cta}` : '2px solid #e1e5e9',
                                                backgroundColor: selectedTemplate === 'ccl' ? '#f8f9fa' : '#fff'
                                            }}
                                            onClick={() => handleTemplateSelect('ccl')}
                                        >
                                            <Icon iconName="FileTemplate" style={{ fontSize: '48px', color: colours.cta, marginBottom: '16px' }} />
                                            <div style={{ fontWeight: 600, fontSize: '18px', color: colours.darkBlue, marginBottom: '8px' }}>
                                                Client Care Letter
                                            </div>
                                            <div style={{ color: colours.greyText, fontSize: '14px' }}>
                                                Professional engagement letter template with all standard clauses
                                            </div>
                                        </div>
                                        
                                        {/* Custom Template */}
                                        <div
                                            style={{
                                                ...templateCardStyle,
                                                border: selectedTemplate === 'custom' ? `2px solid ${colours.cta}` : '2px solid #e1e5e9',
                                                backgroundColor: selectedTemplate === 'custom' ? '#f8f9fa' : '#fff'
                                            }}
                                            onClick={() => handleTemplateSelect('custom')}
                                        >
                                            <Icon iconName="Edit" style={{ fontSize: '48px', color: colours.cta, marginBottom: '16px' }} />
                                            <div style={{ fontWeight: 600, fontSize: '18px', color: colours.darkBlue, marginBottom: '8px' }}>
                                                Custom Document
                                            </div>
                                            <div style={{ color: colours.greyText, fontSize: '14px' }}>
                                                Start with a blank document and create your own
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Stack>
                </div>
            )}
            
            {currentStep === 2 && (
                <div className="matter-opening-card">
                    <Stack tokens={{ childrenGap: 20 }}>
                        <div>
                            <div style={{ 
                                display: 'flex', 
                                gap: '20px', 
                                minHeight: '600px',
                                flexDirection: 'row'
                            }}>
                                <div style={{ flex: 1 }}>
                                    <div style={questionBannerStyle}>
                                        Interactive Template Editor
                                    </div>
                                    
                                    <div style={{ 
                                        border: '1px solid #e1e5e9',
                                        borderRadius: '4px',
                                        padding: '16px',
                                        height: '500px',
                                        overflow: 'auto',
                                        fontFamily: 'Raleway, sans-serif',
                                        fontSize: '14px',
                                        lineHeight: '1.6',
                                        whiteSpace: 'pre-wrap',
                                        backgroundColor: '#fff',
                                        cursor: 'text'
                                    }}>
                                        {renderTemplateContentForPreview(documentContent)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </Stack>
                </div>
            )}

            {currentStep === 3 && (
                <div className="matter-opening-card">
                    <Stack tokens={{ childrenGap: 20 }}>
                        <div>
                            <div style={questionBannerStyle}>
                                Preview & Actions
                            </div>
                            <div style={{ 
                                border: '1px solid #e1e5e9', 
                                borderRadius: '4px',
                                padding: '16px',
                                backgroundColor: '#ffffff',
                                overflowY: 'auto',
                                maxHeight: '400px',
                                whiteSpace: 'pre-wrap',
                                fontFamily: 'Raleway, sans-serif',
                                fontSize: '14px',
                                lineHeight: '1.5',
                                marginBottom: '20px'
                            }}>
                                {renderTemplateContentForPreview(documentContent)}
                            </div>
                            
                            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
                                <div
                                    className="action-button"
                                    onClick={() => setMessage({ type: MessageBarType.success, text: 'Document saved successfully!' })}
                                    style={{
                                        background: '#20b26c',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0px',
                                        padding: '12px 24px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#1a9959';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#20b26c';
                                    }}
                                >
                                    Save Document
                                </div>
                                <div
                                    className="action-button"
                                    onClick={() => setMessage({ type: MessageBarType.success, text: 'Document completed successfully!' })}
                                    style={{
                                        background: '#D65541',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '0px',
                                        padding: '12px 24px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        fontSize: '14px',
                                        fontWeight: 600,
                                    }}
                                    onMouseEnter={(e) => {
                                        e.currentTarget.style.background = '#B54533';
                                    }}
                                    onMouseLeave={(e) => {
                                        e.currentTarget.style.background = '#D65541';
                                    }}
                                >
                                    Complete
                                </div>
                            </div>
                        </div>
                    </Stack>
                </div>
            )}
            
            {/* Render preset panel */}
            {presetPanel}
            
            {/* Hover tooltip */}
            {hoveredField && (
                <div style={tooltipStyle}>
                    {FIELD_DISPLAY_NAMES[hoveredField as keyof typeof FIELD_DISPLAY_NAMES] || hoveredField}
                </div>
            )}
        </>
    );
    
    return null;
};

export default DocumentsV3;
