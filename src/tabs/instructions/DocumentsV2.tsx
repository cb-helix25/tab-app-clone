import React, { useState, useEffect } from 'react';
import { Stack, TextField, PrimaryButton, DefaultButton, Label, MessageBar, MessageBarType, Toggle, Panel, Icon, Dropdown, IDropdownOption } from '@fluentui/react';
import { FaRegFile, FaFile, FaRegFileAlt, FaFileAlt } from 'react-icons/fa';
import { InstructionData, UserData } from '../../app/functionality/types';
import { schema as cclSchema, tokens as cclTokens } from '../../app/functionality/cclSchema';
import localUserData from '../../localData/localUserData.json';
import { dashboardTokens } from './componentTokens';
import QuickActionsCard from '../home/QuickActionsCard';
import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';
import { mergeStyles } from '@fluentui/react';
import '../../app/styles/MatterOpeningCard.css';

// Default CCL template content
const DEFAULT_CCL_TEMPLATE = `Dear {{insert_clients_name}} 

{{insert_heading_eg_matter_description}} 

Thank you for your instructions to act on your behalf in connection with {{matter}}. This Engagement Letter and the attached Terms of Business explain the basis on which we will be acting for you—together they form the contract between us. 

Please contact me if you have any difficulty understanding this Engagement Letter or other information we may provide, eg if anything in this letter is unclear or you require information to be provided in larger text, another format or a different language. 

Contact details and supervision 

The person dealing with your matter is {{name_of_person_handling_matter}}, who is a {{status}}. Their contact details are:

Telephone number: {{fee_earner_phone}}
Email address: {{fee_earner_email}}
Postal address: {{fee_earner_postal_address}}

The best way to contact {{name_of_person_handling_matter}} is {{email}}. 

If {{name_of_person_handling_matter}} is not available, the following members of staff may be able to deal with any queries you have: 

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

[[ REASON WHY ESTIMATE IS NOT POSSIBLE ]]. The next stage in your matter is [[ NEXT STAGE ]] and we estimate that our charges up to the completion of that stage will be in the region of £[[ ESTIMATED AMOUNT ]].] 

We reserve the right to increase the hourly rates if the work done is particularly complex or urgent, or the nature of your instructions require us to work outside normal office hours. If this happens, we will notify you in advance and agree an appropriate rate. 

We will review our hourly rates on a periodic basis. This is usually done annually each January. We will give you advance notice of any change to our hourly rates. 

Disbursements (expenses) 

Disbursements are expenses we must pay on your behalf. 

[Based on the information you have provided, we expect to incur the following disbursements: 

Description | Amount | VAT chargeable 
[Describe disbursement] | £[Insert estimated amount of disbursement] | [Yes OR No] 
[Describe disbursement] | £[Insert estimated amount of disbursement] | [Yes OR No] 
[Describe disbursement] | £[Insert estimated amount of disbursement] | [Yes OR No] 

OR 

We cannot give an exact figure for your disbursements, but this is likely to be in the region of £[[ ESTIMATED DISBURSEMENTS TOTAL ]] [[ DISBURSEMENTS SCOPE ]] including [[ DISBURSEMENTS EXAMPLES ]].] 

Costs you may have to pay another party 

We do not expect that you will have to pay another party's costs. This only tends to arise in litigation and is therefore not relevant to your matter. 

OR 

There is a risk that you may have to pay [[ OPPOSING PARTY ]] costs in this matter. This is explained in section 5, Funding and billing below. 

Funding and billing 

You are responsible for the legal costs set out in this Engagement Letter. 

Unless agreed otherwise, our interim bills are detailed bills and are final in respect of the period to which they relate, save that disbursements may be billed separately and later than the interim bill for our charges in respect of the same period. We will send you a final bill at the end of your matter which will cover our charges from the date of the last interim bill and any unbilled disbursements. You have the right to challenge any interim bill or the final bill by applying to the court to assess the bill under the Solicitors Act 1974. The usual time limit for applying to the court for an assessment is one month from the date of delivery of the interim or final bill. Please be aware that the time limit runs from the date of each individual bill. 

Invoices are due forthwith with interest payable from 14 days after the date of the invoice. 

Payment on account of costs 

Please provide us with £[[ PAYMENT ON ACCOUNT AMOUNT ]] on account of costs. Our account is: 

Helix Law General Client Account, Barclays Bank, Eastbourne, 20-27-91 93472434  

Please use the reference << Matter.Number >> 

We work with money on account at all times, unless otherwise agreed in writing. This means that you should pay any invoice in full immediately, even if we hold money on account. If you fail pay an invoice when due, fail to maintain a reasonable sum on account of costs and/or disbursements we may, at our discretion, suspend work. We may terminate the retainer if the invoice is more than 14 days overdue. We may also terminate the retainer if you refuse, neglect or are unable to pay a reasonable sum on account of costs and/or disbursements within a reasonable time of it being requested. For urgent matters or necessary steps that require immediate action that reasonable time may be measured in hours. 

Costs updates 

We have agreed to provide you with an update on the amount of costs when appropriate as the matter progresses[[ UPDATE FREQUENCY ]]. 

Risk analysis 

We have discussed whether the potential outcome of your matter justifies the expense and risk involved. Our preliminary assessment is that it does. 

Limitation 

Each cause of action has a strict time limit after which you cannot bring a claim. Contract claims could be 6 years from the date the sums claimed/damages fell due/accrued. 

If there is some fact that I have not been given or you disagree with my view on the limitation period then please let me know at once. 

Data protection 

We take your privacy very seriously. Our Privacy policy contains important information on how and why we collect, process and store your personal data. It also explains your rights in relation to your personal data. The Privacy policy is available on our website at  Helix Law Privacy Policy, but please contact us if you would like us to send a copy to you or if you would prefer us to explain our Privacy policy verbally.  

We use outside counsel, experts, software providers and an external file auditors so your confidential information will be shared with them. Each will be bound to confidentiality by the particular contract with us and/or their professional obligations to you and to us. 

Marketing 

We may use your personal data to send you updates (by email, text, telephone or post) about legal developments that might be of interest to you and/or information about our services, including exclusive offers, promotions or new services. You have the right to opt out of receiving promotional communications at any time, by: 

—contacting us at [[ MARKETING OPT OUT CONTACT ]]; 
—using the 'unsubscribe' link in emails or 'STOP' number in texts; 
—updating your marketing preferences on our [[ PREFERENCE CENTRE LINK ]].]] 

Prevention of money laundering, terrorist financing and proliferation financing 

We are required by law to obtain satisfactory evidence of the identity of our clients and also sometimes people related to them. This includes where monies are received from third parties on your behalf. This is because solicitors deal with money and property on behalf of clients and criminals can at times therefore attempt to use our services and accounts in an attempt to launder money.  We therefore need to obtain and retain evidence of your identity. Most Solicitor firms request that their clients provide evidence of their identity themselves. However, we recognise that this can be time consuming and we therefore obtain confirmation of your identity using a search service, at our cost. Please note that if you do not wish us to verify your identity electronically you must bring this to our immediate attention. The electronic search process does leave an electronic 'footprint' each time a search is conducted. Footprints detail the date, time and reason for a search and certain types of search footprints are used in credit scoring systems and may have a detrimental impact on a consumer's ability to obtain credit.  

Unfortunately if the report is unsuccessful i.e. if you have only recently moved address, we may need to ask you to send in certain documents for our records, such as a recent utility bill confirming your address, and photographic identity documents such as a passport or driving licence. If this is necessary the identity documents should be provided by you, as our client or, where our client is a limited company, by a Director of the company. If you wish to provide us with authority to discuss your matter with any third party we must have your authority confirmed in writing. Please contact me if you have any queries regarding this.   

Duties to the court 

Your matter [[ MAY OR WILL ]] involve court proceedings. All solicitors have a professional duty to uphold the rule of law and the proper administration of justice. We must comply with our duties to the court, even where this conflicts with our obligations to you. This means that we must not: 

o 	attempt to deceive or knowingly or recklessly mislead the court 
o 	be complicit in another person deceiving or misleading the court 
o 	place ourselves in contempt of court 
o 	make or offer payments to witnesses who depend on their evidence or the outcome of the case 

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

[Referral and fee sharing arrangement 

[[ REFERRAL ARRANGEMENT DETAILS ]] ] 

Right to cancel 

You have the right to cancel this contract within 14 days without giving any reason. We will not start work during the cancellation period unless you expressly ask us to. The 'Instructions for Cancellation' notice at [[ CANCELLATION INSTRUCTIONS LINK ]] explains: 

—how to cancel and the effect of cancellation; 
—what you will be liable for if you ask us to start work during the cancellation period. 

Action points 

The action list below explains what you need to do next. 

Action required by you | Additional information 
☐ Sign and return one copy of the Terms of Business below | If you don't sign but continue to give us instructions you will be deemed to have accepted the terms in this letter and the Terms of Business 
☐ [Insert next step you would like client to take (other than return or send documents), eg telephone me to discuss this letter and the next steps in your matter] | [State why this step is important] 
☐ Provide a payment on account of costs and disbursements of £[state amount] | If we do not receive a payment on account of costs and disbursements, there may be a delay in starting work on your behalf 
☐ If you would like us to start work during the 14-day cancellation period, sign and return the attached 'Request to start work during the cancellation period' form | This form is attached to this Engagement Letter 
☐ Alternatively, if wish to cancel your contract with us, tell us within 14 days | You can simply inform us of your decision to cancel by letter, telephone or e-mail] 
☐ Provide the following documents [and information] to allow me to take the next steps in your matter: 
[describe first document or information you need from your client] 
[describe second document or information you need from your client] 
[describe third document or information you need from your client] | Without these documents there may be a delay in your matter. 

Please contact me if you have any queries or concerns about your matter, this Engagement Letter or the attached Terms of Business.

{{name_of_person_handling_matter}}
For and on behalf of Helix Law Limited`;

interface DocumentsV2Props {
    selectedInstructionProp?: any;
    instructions?: InstructionData[];
    isDarkMode?: boolean;
    entryMode?: 'direct' | 'instruction-based'; // New prop to distinguish entry modes
    matterData?: any; // Optional matter data from matter opening workflow
}

const DocumentsV2: React.FC<DocumentsV2Props> = ({
    selectedInstructionProp,
    instructions,
    isDarkMode = false,
    entryMode = 'direct', // Default to direct entry
    matterData
}) => {
    const { isDarkMode: themeDarkMode } = useTheme();
    const effectiveDarkMode = isDarkMode || themeDarkMode;
    
    // Determine if we're in instruction-based mode
    const isInstructionBasedMode = entryMode === 'instruction-based' || selectedInstructionProp;
    
    // State management
    const [selectedInstruction, setSelectedInstruction] = useState<any>(selectedInstructionProp || null);
    const [documentContent, setDocumentContent] = useState<string>('');
    const [isTemplateMode, setIsTemplateMode] = useState<boolean>(true);
    const [templateFields, setTemplateFields] = useState<Record<string, string>>({});
    const [emailTo, setEmailTo] = useState<string>('');
    const [emailSubject, setEmailSubject] = useState<string>('Document from Helix Hub');
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [message, setMessage] = useState<{ text: string; type: MessageBarType } | null>(null);
    const [tokensOpen, setTokensOpen] = useState<boolean>(false);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('ccl');
    const [isTemplateFieldsExpanded, setIsTemplateFieldsExpanded] = useState(false);
    const [activeField, setActiveField] = useState<string | null>(null);
    const [touchedFields, setTouchedFields] = useState<{ [key: string]: boolean }>({});

    // Field styling functions similar to opponent fields
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

    // Helper to get field style
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
        boxShadow: "none",
        borderColor: "transparent"
    };

    // Available templates
    const templateOptions = [
        { key: 'blank', text: 'Blank Document', icon: 'Document' },
        { key: 'ccl', text: 'CCL Template', icon: 'FileTemplate' },
    ];

    // Load CCL template by default on component mount
    useEffect(() => {
        if (selectedTemplate === 'ccl' && !documentContent) {
            const templateContent = loadTemplate('ccl');
            setDocumentContent(templateContent);
            setIsTemplateMode(true);
        }
    }, []);

    // Load template content
    const loadTemplate = (templateKey: string) => {
        switch (templateKey) {
            case 'ccl':
                return DEFAULT_CCL_TEMPLATE;
            case 'matter-opening':
                return `Dear {{insert_clients_name}},

Thank you for instructing us in relation to {{matter}}. We are pleased to confirm our appointment as your solicitors.

{{insert_current_position_and_scope_of_retainer}}

{{next_steps}}

We look forward to working with you on this matter.

Yours sincerely,

{{name_of_person_handling_matter}}
For and on behalf of Helix Law Limited`;
            case 'update':
                return `Dear {{insert_clients_name}},

RE: {{matter}}

I am writing to update you on the progress of your matter.

{{insert_current_position_and_scope_of_retainer}}

{{next_steps}}

{{realistic_timescale}}

Please do not hesitate to contact me if you have any questions.

Yours sincerely,

{{name_of_person_handling_matter}}`;
            case 'completion':
                return `Dear {{insert_clients_name}},

RE: {{matter}}

I am pleased to confirm that we have now completed your matter.

{{insert_current_position_and_scope_of_retainer}}

Thank you for instructing us. We hope we have provided you with an excellent service.

Yours sincerely,

{{name_of_person_handling_matter}}`;
            default:
                return '';
        }
    };

    // Handle template selection
    const handleTemplateSelect = (templateKey: string) => {
        setSelectedTemplate(templateKey);
        const templateContent = loadTemplate(templateKey);
        setDocumentContent(templateContent);
        if (templateKey !== 'blank') {
            setIsTemplateMode(true);
        }
    };

    // Merge template fields with content
    const mergeTemplateFields = (template: string, fields: Record<string, string>) => {
        let mergedContent = template;
        Object.keys(fields).forEach(key => {
            const regex = new RegExp(`{{${key}}}`, 'g');
            mergedContent = mergedContent.replace(regex, fields[key] || `[${key}]`);
        });
        return mergedContent;
    };

    // Update document content when template fields change
    useEffect(() => {
        if (isTemplateMode && selectedTemplate !== 'blank') {
            const baseTemplate = loadTemplate(selectedTemplate);
            const mergedContent = mergeTemplateFields(baseTemplate, templateFields);
            setDocumentContent(mergedContent);
        }
    }, [templateFields, selectedTemplate, isTemplateMode]);

    // Initialize template fields from CCL schema
    useEffect(() => {
        const initialFields: Record<string, string> = {};
        Object.keys(cclSchema).forEach(key => {
            initialFields[key] = '';
        });
        
        // Pre-populate fields if we have instruction or matter data
        if (isInstructionBasedMode) {
            if (selectedInstruction) {
                // Populate from instruction data
                if (selectedInstruction.clientName) {
                    initialFields.insert_clients_name = selectedInstruction.clientName;
                }
                if (selectedInstruction.matter) {
                    initialFields.matter = selectedInstruction.matter;
                    initialFields.insert_heading_eg_matter_description = `RE: ${selectedInstruction.matter}`;
                }
                if (selectedInstruction.description) {
                    initialFields.insert_current_position_and_scope_of_retainer = selectedInstruction.description;
                }
            }
            
            if (matterData) {
                // Populate from matter opening data
                if (matterData.clientName) {
                    initialFields.insert_clients_name = matterData.clientName;
                }
                if (matterData.matterDescription) {
                    initialFields.matter = matterData.matterDescription;
                    initialFields.insert_heading_eg_matter_description = `RE: ${matterData.matterDescription}`;
                }
                if (matterData.solicitorName) {
                    initialFields.name_of_person_handling_matter = matterData.solicitorName;
                }
                if (matterData.solicitorEmail) {
                    initialFields.email = matterData.solicitorEmail;
                }
                if (matterData.retainer) {
                    initialFields.insert_current_position_and_scope_of_retainer = matterData.retainer;
                }
            }
        }
        
        setTemplateFields(initialFields);
    }, [isInstructionBasedMode, selectedInstruction, matterData]);

    // Sync with prop changes
    useEffect(() => {
        if (selectedInstructionProp) {
            setSelectedInstruction(selectedInstructionProp);
        }
    }, [selectedInstructionProp]);

    // Handle save
    const handleSave = async () => {
        setIsSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setMessage({ text: 'Document crafted successfully!', type: MessageBarType.success });
        } catch (error) {
            setMessage({ text: 'Failed to save document', type: MessageBarType.error });
        } finally {
            setIsSaving(false);
        }
    };

    // Handle email send
    const handleSendEmail = async () => {
        if (!emailTo) {
            setMessage({ text: 'Please enter an email address', type: MessageBarType.warning });
            return;
        }
        
        setIsSaving(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            setMessage({ text: 'Email sent successfully!', type: MessageBarType.success });
        } catch (error) {
            setMessage({ text: 'Failed to send email', type: MessageBarType.error });
        } finally {
            setIsSaving(false);
        }
    };

    // Generate content with template
    const generateTemplateContent = () => {
        let content = documentContent;
        Object.keys(templateFields).forEach(key => {
            const token = `{{${key}}}`;
            const value = templateFields[key] || `[${key}]`;
            content = content.replace(new RegExp(token, 'g'), value);
        });
        return content;
    };

    // Insert token
    const insertToken = (token: string) => {
        const textarea = document.getElementById('documentEditor') as HTMLTextAreaElement;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const newContent = documentContent.substring(0, start) + `{{${token}}}` + documentContent.substring(end);
            setDocumentContent(newContent);
            
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + token.length + 4, start + token.length + 4);
            }, 0);
        }
        setTokensOpen(false);
    };

    // Create instruction options for dropdown
    const instructionOptions: IDropdownOption[] = [
        { key: 'none', text: 'Select an instruction (optional)' },
        ...(instructions || []).map((instruction, index) => ({
            key: instruction.id || index.toString(),
            text: instruction.title || `Instruction ${index + 1}`,
            data: instruction
        }))
    ];

    const questionBannerStyle: React.CSSProperties = {
        background: `linear-gradient(to right, #ffffff, ${colours.light.grey})`,
        borderLeft: `3px solid ${colours.cta}`,
        padding: '4px 8px',
        fontWeight: '600',
        color: '#061733',
        marginBottom: '8px',
        fontSize: '14px',
        borderRadius: '0 4px 4px 0',
        fontFamily: 'Raleway, sans-serif'
    };

    return (
        <div className="matter-opening-card" style={{ padding: '20px', backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
            <Stack tokens={{ childrenGap: 20 }}>
                {/* Message Bar */}
                {message && (
                    <MessageBar
                        messageBarType={message.type}
                        onDismiss={() => setMessage(null)}
                        dismissButtonAriaLabel="Close"
                        styles={{ root: { marginBottom: '20px' } }}
                    >
                        {message.text}
                    </MessageBar>
                )}

                {/* Instruction Selection - Only show for direct entry mode */}
                {!isInstructionBasedMode && (
                    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <div style={questionBannerStyle}>
                            Select an instruction to work with (optional)
                        </div>
                        
                        {/* Instruction Cards Grid */}
                        <div 
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                gap: '16px',
                                marginTop: '16px'
                            }}
                        >
                            {/* Instruction Cards - Show all when none selected, show only selected when one is chosen */}
                            {(() => {
                                if (!instructions || instructions.length === 0) {
                                    return (
                                        <div style={{
                                            gridColumn: '1 / -1',
                                            textAlign: 'center',
                                            padding: '40px',
                                            color: colours.greyText,
                                            fontFamily: 'Raleway, sans-serif',
                                            fontSize: '16px'
                                        }}>
                                            No instructions available
                                        </div>
                                    );
                                }
                                
                                // If no instruction is selected, show all available instructions
                                if (!selectedInstruction) {
                                    return instructions.map((instruction) => (
                                        <div
                                            key={instruction.id}
                                            style={{
                                                position: 'relative',
                                                padding: '16px',
                                                borderRadius: '0px',
                                                width: '100%',
                                                minHeight: '120px',
                                                cursor: 'pointer',
                                                background: '#ffffff',
                                                boxSizing: 'border-box',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                fontFamily: 'Raleway, sans-serif',
                                                transition: 'box-shadow 0.3s ease, transform 0.3s ease',
                                                border: '1px solid #e1e5e9',
                                                opacity: 1,
                                                animation: 'dropIn 0.3s ease forwards'
                                            }}
                                            onClick={() => setSelectedInstruction(instruction)}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                            }}
                                        >
                                            {/* Background icon */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    right: '15px',
                                                    transform: 'translateY(-50%)',
                                                    fontSize: '60px',
                                                    color: colours.light.grey,
                                                    opacity: 0.1,
                                                    transition: 'opacity 0.2s ease',
                                                    zIndex: 0,
                                                    pointerEvents: 'none'
                                                }}
                                            >
                                                <Icon iconName="FileText" />
                                            </div>

                                            {/* Content */}
                                            <div style={{ position: 'relative', zIndex: 1 }}>
                                                <div style={{
                                                    fontWeight: 600,
                                                    color: colours.darkBlue,
                                                    fontFamily: 'Raleway, sans-serif',
                                                    fontSize: '16px',
                                                    lineHeight: '1.2',
                                                    marginBottom: '8px'
                                                }}>
                                                    {instruction.title || `Instruction ${instruction.id || instruction.prospectId}`}
                                                </div>
                                                <div style={{
                                                    color: colours.greyText,
                                                    fontFamily: 'Raleway, sans-serif',
                                                    fontSize: '14px',
                                                    lineHeight: '1.3',
                                                    marginBottom: '8px'
                                                }}>
                                                    {instruction.description || 'No description available'}
                                                </div>
                                                
                                                {/* Status/Type indicators */}
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                    {instruction.prospectId && (
                                                        <div style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            padding: '2px 6px',
                                                            fontSize: '11px',
                                                            fontWeight: 500,
                                                            borderRadius: '2px',
                                                            backgroundColor: colours.light.grey,
                                                            color: colours.darkBlue,
                                                            fontFamily: 'Raleway, sans-serif'
                                                        }}>
                                                            ID: {instruction.prospectId}
                                                        </div>
                                                    )}
                                                    {instruction.deals && instruction.deals.length > 0 && (
                                                        <div style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            padding: '2px 6px',
                                                            fontSize: '11px',
                                                            fontWeight: 500,
                                                            borderRadius: '2px',
                                                            backgroundColor: colours.light.background,
                                                            color: colours.cta,
                                                            fontFamily: 'Raleway, sans-serif'
                                                        }}>
                                                            {instruction.deals.length} Deal{instruction.deals.length > 1 ? 's' : ''}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ));
                                } else {
                                    // If an instruction is selected, show only that one
                                    return (
                                        <div
                                            key={selectedInstruction.id}
                                            style={{
                                                position: 'relative',
                                                padding: '16px',
                                                borderRadius: '0px',
                                                width: '100%',
                                                minHeight: '120px',
                                                cursor: 'pointer',
                                                background: 'linear-gradient(135deg, #3690CE22, #3690CE33)',
                                                boxSizing: 'border-box',
                                                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                                fontFamily: 'Raleway, sans-serif',
                                                transition: 'box-shadow 0.3s ease, transform 0.3s ease',
                                                border: `1px solid ${colours.highlight}`,
                                                gridColumn: instructions && instructions.length === 1 ? 'span 2' : undefined,
                                                opacity: 1,
                                                animation: 'dropIn 0.3s ease forwards'
                                            }}
                                            onClick={() => setSelectedInstruction(null)} // Click to deselect
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-2px)';
                                                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                            }}
                                        >
                                            {/* Selection indicator */}
                                            <Icon
                                                iconName="CheckMark"
                                                style={{
                                                    position: 'absolute',
                                                    top: '10px',
                                                    right: '10px',
                                                    fontSize: '24px',
                                                    color: colours.highlight
                                                }}
                                            />

                                            {/* Background icon */}
                                            <div
                                                style={{
                                                    position: 'absolute',
                                                    top: '50%',
                                                    right: '15px',
                                                    transform: 'translateY(-50%)',
                                                    fontSize: '60px',
                                                    color: colours.light.grey,
                                                    opacity: 0.3,
                                                    transition: 'opacity 0.2s ease',
                                                    zIndex: 0,
                                                    pointerEvents: 'none'
                                                }}
                                            >
                                                <Icon iconName="FileText" />
                                            </div>

                                            {/* Content */}
                                            <div style={{ position: 'relative', zIndex: 1 }}>
                                                <div style={{
                                                    fontWeight: 600,
                                                    color: colours.highlight,
                                                    fontFamily: 'Raleway, sans-serif',
                                                    fontSize: '16px',
                                                    lineHeight: '1.2',
                                                    marginBottom: '8px'
                                                }}>
                                                    {selectedInstruction.title || `Instruction ${selectedInstruction.id || selectedInstruction.prospectId}`}
                                                </div>
                                                <div style={{
                                                    color: colours.darkBlue,
                                                    fontFamily: 'Raleway, sans-serif',
                                                    fontSize: '14px',
                                                    lineHeight: '1.3',
                                                    marginBottom: '8px'
                                                }}>
                                                    {selectedInstruction.description || 'No description available'}
                                                </div>
                                                
                                                {/* Status/Type indicators */}
                                                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                                                    {selectedInstruction.prospectId && (
                                                        <div style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            padding: '2px 6px',
                                                            fontSize: '11px',
                                                            fontWeight: 500,
                                                            borderRadius: '2px',
                                                            backgroundColor: colours.light.grey,
                                                            color: colours.darkBlue,
                                                            fontFamily: 'Raleway, sans-serif'
                                                        }}>
                                                            ID: {selectedInstruction.prospectId}
                                                        </div>
                                                    )}
                                                    {selectedInstruction.deals && selectedInstruction.deals.length > 0 && (
                                                        <div style={{
                                                            display: 'inline-flex',
                                                            alignItems: 'center',
                                                            padding: '2px 6px',
                                                            fontSize: '11px',
                                                            fontWeight: 500,
                                                            borderRadius: '2px',
                                                            backgroundColor: colours.light.background,
                                                            color: colours.cta,
                                                            fontFamily: 'Raleway, sans-serif'
                                                        }}>
                                                            {selectedInstruction.deals.length} Deal{selectedInstruction.deals.length > 1 ? 's' : ''}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                            })()}
                        </div>
                    </div>
                )}

                {/* Instruction Summary - Show for instruction-based mode */}
                {isInstructionBasedMode && selectedInstruction && (
                    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <div style={questionBannerStyle}>
                            Working with instruction
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <Icon 
                                iconName="FileText" 
                                style={{ fontSize: '20px', color: colours.cta }} 
                            />
                            <div>
                                <div style={{ fontWeight: 600, color: colours.darkBlue, fontFamily: 'Raleway, sans-serif' }}>
                                    {selectedInstruction.clientName || 'Unknown Client'}
                                </div>
                                <div style={{ color: colours.greyText, fontSize: '14px', fontFamily: 'Raleway, sans-serif' }}>
                                    {selectedInstruction.matter || selectedInstruction.description || 'No description available'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Document Creation Section */}
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <div style={questionBannerStyle}>
                        Choose a template to get started
                    </div>
                    
                    {/* Template Selection Cards */}
                    <div 
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                            gap: '16px',
                            marginBottom: '20px'
                        }}
                    >
                        {templateOptions.map((template) => (
                            <div
                                key={template.key}
                                style={{
                                    position: 'relative',
                                    padding: '16px',
                                    borderRadius: '0px',
                                    width: '100%',
                                    minHeight: '120px',
                                    cursor: 'pointer',
                                    background: selectedTemplate === template.key ? 
                                        'linear-gradient(135deg, #3690CE22, #3690CE33)' : 
                                        '#ffffff',
                                    boxSizing: 'border-box',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                                    fontFamily: 'Raleway, sans-serif',
                                    transition: 'box-shadow 0.3s ease, transform 0.3s ease',
                                    border: selectedTemplate === template.key ? 
                                        `1px solid ${colours.highlight}` : 
                                        '1px solid #e1e5e9',
                                    opacity: 1,
                                    animation: 'dropIn 0.3s ease forwards'
                                }}
                                onClick={() => handleTemplateSelect(template.key)}
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                    e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.transform = 'translateY(0)';
                                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                                }}
                            >
                                {/* Selection indicator */}
                                {selectedTemplate === template.key && (
                                    <Icon
                                        iconName="CheckMark"
                                        style={{
                                            position: 'absolute',
                                            top: '10px',
                                            right: '10px',
                                            fontSize: '24px',
                                            color: colours.highlight
                                        }}
                                    />
                                )}

                                {/* Background icon */}
                                <div
                                    style={{
                                        position: 'absolute',
                                        top: '50%',
                                        right: '15px',
                                        transform: 'translateY(-50%)',
                                        zIndex: 0,
                                        pointerEvents: 'none',
                                        opacity: selectedTemplate === template.key ? 0.3 : 0.1,
                                        transition: 'opacity 0.2s ease',
                                        fontSize: '60px',
                                        color: colours.light.grey
                                    }}
                                >
                                    {selectedTemplate === template.key ? (
                                        template.icon === 'Document' ? <FaFile /> : <FaFileAlt />
                                    ) : (
                                        template.icon === 'Document' ? <FaRegFile /> : <FaRegFileAlt />
                                    )}
                                </div>

                                {/* Content */}
                                <div style={{ position: 'relative', zIndex: 1 }}>
                                    <div style={{
                                        fontWeight: 600,
                                        color: selectedTemplate === template.key ? colours.highlight : colours.darkBlue,
                                        fontFamily: 'Raleway, sans-serif',
                                        fontSize: '16px',
                                        lineHeight: '1.2',
                                        marginBottom: '8px'
                                    }}>
                                        {template.text}
                                    </div>
                                    <div style={{
                                        color: selectedTemplate === template.key ? colours.darkBlue : colours.greyText,
                                        fontFamily: 'Raleway, sans-serif',
                                        fontSize: '14px',
                                        lineHeight: '1.3'
                                    }}>
                                        {template.key === 'ccl' ? 'Client Care Letter template with merge fields' : 'Start with a blank document'}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {/* Mode Toggle */}
                    <div style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <QuickActionsCard
                            title="Template Mode"
                            icon={isTemplateMode ? "LightCheck" : "LightCancel"}
                            isDarkMode={effectiveDarkMode}
                            onClick={() => setIsTemplateMode(!isTemplateMode)}
                            iconColor={colours.highlight}
                            selected={isTemplateMode}
                            orientation="row"
                        />
                        <QuickActionsCard
                            title="Insert Token"
                            icon="LightAdd"
                            isDarkMode={effectiveDarkMode}
                            onClick={() => setTokensOpen(true)}
                            disabled={!isTemplateMode}
                            iconColor={colours.highlight}
                            orientation="row"
                        />
                        <QuickActionsCard
                            title="Download Template"
                            icon="LightDownload"
                            isDarkMode={effectiveDarkMode}
                            onClick={() => {
                                // Create a link to download the Word template
                                const link = document.createElement('a');
                                link.href = '/templates/cclTemplate.docx';
                                link.download = 'cclTemplate.docx';
                                link.click();
                            }}
                            iconColor={colours.highlight}
                            orientation="row"
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '20px', minHeight: '400px' }}>
                        {/* Main Editor */}
                        <div style={{ 
                            flex: '1',
                            maxWidth: isTemplateMode ? (isTemplateFieldsExpanded ? '50%' : 'calc(100% - 320px)') : '100%',
                            transition: 'max-width 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                            minWidth: '300px'
                        }}>
                            <TextField
                                id="documentEditor"
                                multiline
                                rows={20}
                                value={documentContent}
                                onChange={(_, value) => setDocumentContent(value || '')}
                                placeholder="Start crafting your document here..."
                                styles={{
                                    fieldGroup: { 
                                        height: '400px',
                                        border: '1px solid #e1e5e9',
                                        borderRadius: '0px'
                                    },
                                    field: {
                                        height: '100%',
                                        fontFamily: 'Raleway, sans-serif',
                                        fontSize: '14px',
                                        lineHeight: '1.5',
                                        padding: '12px'
                                    }
                                }}
                            />
                        </div>

                        {/* Template Fields Panel */}
                        {isTemplateMode && (
                            <div style={{ 
                                width: isTemplateFieldsExpanded ? '50%' : '300px',
                                flexShrink: 0,
                                display: 'flex', 
                                flexDirection: 'column',
                                transition: 'width 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                            }}>
                                <div style={{ 
                                    flex: 1, 
                                    overflowY: 'auto', 
                                    border: '2px solid #0078d4', 
                                    borderRadius: '0px',
                                    padding: '16px',
                                    backgroundColor: '#f8f9fa',
                                    maxHeight: '400px',
                                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                                }}>
                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'space-between', 
                                        alignItems: 'center',
                                        marginBottom: '16px'
                                    }}>
                                        <div style={{ ...questionBannerStyle, margin: 0 }}>
                                            Template Fields
                                        </div>
                                        <button
                                            onClick={() => setIsTemplateFieldsExpanded(!isTemplateFieldsExpanded)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                cursor: 'pointer',
                                                fontSize: '16px',
                                                color: '#0078d4',
                                                padding: '6px 10px',
                                                borderRadius: '0px',
                                                transition: 'background-color 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                                                display: 'flex',
                                                alignItems: 'center'
                                            }}
                                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e6f3ff'}
                                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            title={isTemplateFieldsExpanded ? 'Collapse fields panel' : 'Expand fields panel'}
                                        >
                                            <Icon iconName={isTemplateFieldsExpanded ? 'ChevronLeft' : 'ChevronRight'} />
                                        </button>
                                    </div>
                                    <div style={{ 
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '16px'
                                    }}>
                                        <div style={{ position: 'relative' }}>
                                            <TextField
                                                label="Client Name"
                                                value={templateFields.insert_clients_name || ''}
                                                onChange={(_, value) => {
                                                    setTemplateFields(prev => ({
                                                        ...prev,
                                                        insert_clients_name: value || ''
                                                    }));
                                                    setTouchedFields(prev => ({ ...prev, insert_clients_name: true }));
                                                }}
                                                placeholder="Enter client's full name..."
                                                styles={{ 
                                                    root: { marginBottom: '8px' },
                                                    fieldGroup: { 
                                                        ...getFieldStyle("insert_clients_name", templateFields.insert_clients_name || ''),
                                                        borderRadius: '0px',
                                                        backgroundColor: 'white',
                                                        border: "none"
                                                    },
                                                    field: { 
                                                        fontFamily: 'Raleway, sans-serif',
                                                        fontSize: '14px',
                                                        padding: '8px',
                                                        background: "transparent",
                                                        ...noFocusOutline
                                                    }
                                                }}
                                                onFocus={() => setActiveField("insert_clients_name")}
                                                onBlur={() => setActiveField(null)}
                                            />
                                            <Icon iconName="Contact" style={{ 
                                                position: 'absolute', 
                                                top: '4px', 
                                                right: '4px', 
                                                fontSize: '14px', 
                                                color: '#605e5c',
                                                pointerEvents: 'none'
                                            }} />
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <TextField
                                                label="Matter Description"
                                                value={templateFields.insert_heading_eg_matter_description || ''}
                                                onChange={(_, value) => {
                                                    setTemplateFields(prev => ({
                                                        ...prev,
                                                        insert_heading_eg_matter_description: value || ''
                                                    }));
                                                    setTouchedFields(prev => ({ ...prev, insert_heading_eg_matter_description: true }));
                                                }}
                                                placeholder="Enter matter description/heading..."
                                                styles={{ 
                                                    root: { marginBottom: '8px' },
                                                    fieldGroup: { 
                                                        ...getFieldStyle("insert_heading_eg_matter_description", templateFields.insert_heading_eg_matter_description || ''),
                                                        borderRadius: '0px',
                                                        backgroundColor: 'white',
                                                        border: "none"
                                                    },
                                                    field: { 
                                                        fontFamily: 'Raleway, sans-serif',
                                                        fontSize: '14px',
                                                        padding: '8px',
                                                        background: "transparent",
                                                        ...noFocusOutline
                                                    }
                                                }}
                                                onFocus={() => setActiveField("insert_heading_eg_matter_description")}
                                                onBlur={() => setActiveField(null)}
                                            />
                                            <Icon iconName="TextDocument" style={{ 
                                                position: 'absolute', 
                                                top: '4px', 
                                                right: '4px', 
                                                fontSize: '14px', 
                                                color: '#605e5c',
                                                pointerEvents: 'none'
                                            }} />
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <TextField
                                                label="Matter Name"
                                                value={templateFields.matter || ''}
                                                onChange={(_, value) => {
                                                    setTemplateFields(prev => ({
                                                        ...prev,
                                                        matter: value || ''
                                                    }));
                                                    setTouchedFields(prev => ({ ...prev, matter: true }));
                                                }}
                                                placeholder="Enter matter name..."
                                                styles={{ 
                                                    root: { marginBottom: '8px' },
                                                    fieldGroup: { 
                                                        ...getFieldStyle("matter", templateFields.matter || ''),
                                                        borderRadius: '0px',
                                                        backgroundColor: 'white',
                                                        border: "none"
                                                    },
                                                    field: { 
                                                        fontFamily: 'Raleway, sans-serif',
                                                        fontSize: '14px',
                                                        padding: '8px',
                                                        background: "transparent",
                                                        ...noFocusOutline
                                                    }
                                                }}
                                                onFocus={() => setActiveField("matter")}
                                                onBlur={() => setActiveField(null)}
                                            />
                                            <Icon iconName="LegalNavigation" style={{ 
                                                position: 'absolute', 
                                                top: '4px', 
                                                right: '4px', 
                                                fontSize: '14px', 
                                                color: '#605e5c',
                                                pointerEvents: 'none'
                                            }} />
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <TextField
                                                label="Fee Earner Name"
                                                value={templateFields.name_of_person_handling_matter || ''}
                                                onChange={(_, value) => {
                                                    setTemplateFields(prev => ({
                                                        ...prev,
                                                        name_of_person_handling_matter: value || ''
                                                    }));
                                                    setTouchedFields(prev => ({ ...prev, name_of_person_handling_matter: true }));
                                                }}
                                                placeholder="Enter fee earner's name..."
                                                styles={{ 
                                                    root: { marginBottom: '8px' },
                                                    fieldGroup: { 
                                                        ...getFieldStyle("name_of_person_handling_matter", templateFields.name_of_person_handling_matter || ''),
                                                        borderRadius: '0px',
                                                        backgroundColor: 'white',
                                                        border: "none"
                                                    },
                                                    field: { 
                                                        fontFamily: 'Raleway, sans-serif',
                                                        fontSize: '14px',
                                                        padding: '8px',
                                                        background: "transparent",
                                                        ...noFocusOutline
                                                    }
                                                }}
                                                onFocus={() => setActiveField("name_of_person_handling_matter")}
                                                onBlur={() => setActiveField(null)}
                                            />
                                            <Icon iconName="UserFollowed" style={{ 
                                                position: 'absolute', 
                                                top: '4px', 
                                                right: '4px', 
                                                fontSize: '14px', 
                                                color: '#605e5c',
                                                pointerEvents: 'none'
                                            }} />
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <TextField
                                                label="Fee Earner Title"
                                                value={templateFields.status || ''}
                                                onChange={(_, value) => {
                                                    setTemplateFields(prev => ({
                                                        ...prev,
                                                        status: value || ''
                                                    }));
                                                    setTouchedFields(prev => ({ ...prev, status: true }));
                                                }}
                                                placeholder="Enter fee earner's title/status..."
                                                styles={{ 
                                                    root: { marginBottom: '8px' },
                                                    fieldGroup: { 
                                                        ...getFieldStyle("status", templateFields.status || ''),
                                                        borderRadius: '0px',
                                                        backgroundColor: 'white',
                                                        border: "none"
                                                    },
                                                    field: { 
                                                        fontFamily: 'Raleway, sans-serif',
                                                        fontSize: '14px',
                                                        padding: '8px',
                                                        background: "transparent",
                                                        ...noFocusOutline
                                                    }
                                                }}
                                                onFocus={() => setActiveField("status")}
                                                onBlur={() => setActiveField(null)}
                                            />
                                            <Icon iconName="Ribbon" style={{ 
                                                position: 'absolute', 
                                                top: '4px', 
                                                right: '4px', 
                                                fontSize: '14px', 
                                                color: '#605e5c',
                                                pointerEvents: 'none'
                                            }} />
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <TextField
                                                label="Preferred Contact Method"
                                                value={templateFields.email || ''}
                                                onChange={(_, value) => {
                                                    setTemplateFields(prev => ({
                                                        ...prev,
                                                        email: value || ''
                                                    }));
                                                    setTouchedFields(prev => ({ ...prev, email: true }));
                                                }}
                                                placeholder="Enter preferred contact method..."
                                                styles={{ 
                                                    root: { marginBottom: '8px' },
                                                    fieldGroup: { 
                                                        ...getFieldStyle("email", templateFields.email || ''),
                                                        borderRadius: '0px',
                                                        backgroundColor: 'white',
                                                        border: "none"
                                                    },
                                                    field: { 
                                                        fontFamily: 'Raleway, sans-serif',
                                                        fontSize: '14px',
                                                        padding: '8px',
                                                        background: "transparent",
                                                        ...noFocusOutline
                                                    }
                                                }}
                                                onFocus={() => setActiveField("email")}
                                                onBlur={() => setActiveField(null)}
                                            />
                                            <Icon iconName="Mail" style={{ 
                                                position: 'absolute', 
                                                top: '4px', 
                                                right: '4px', 
                                                fontSize: '14px', 
                                                color: '#605e5c',
                                                pointerEvents: 'none'
                                            }} />
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <TextField
                                                label="Scope of Work"
                                                multiline
                                                rows={isTemplateFieldsExpanded ? 4 : 3}
                                                value={templateFields.insert_current_position_and_scope_of_retainer || ''}
                                                onChange={(_, value) => {
                                                    setTemplateFields(prev => ({
                                                        ...prev,
                                                        insert_current_position_and_scope_of_retainer: value || ''
                                                    }));
                                                    setTouchedFields(prev => ({ ...prev, insert_current_position_and_scope_of_retainer: true }));
                                                }}
                                                placeholder="Enter current position and scope of retainer..."
                                                styles={{ 
                                                    root: { marginBottom: '8px' },
                                                    fieldGroup: { 
                                                        ...getFieldStyle("insert_current_position_and_scope_of_retainer", templateFields.insert_current_position_and_scope_of_retainer || ''),
                                                        borderRadius: '0px',
                                                        backgroundColor: 'white',
                                                        border: "none"
                                                    },
                                                    field: { 
                                                        fontFamily: 'Raleway, sans-serif',
                                                        fontSize: '14px',
                                                        padding: '8px',
                                                        background: "transparent",
                                                        ...noFocusOutline
                                                    }
                                                }}
                                                onFocus={() => setActiveField("insert_current_position_and_scope_of_retainer")}
                                                onBlur={() => setActiveField(null)}
                                            />
                                            <Icon iconName="WorkItem" style={{ 
                                                position: 'absolute', 
                                                top: '4px', 
                                                right: '4px', 
                                                fontSize: '14px', 
                                                color: '#605e5c',
                                                pointerEvents: 'none'
                                            }} />
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <TextField
                                                label="Next Steps"
                                                multiline
                                                rows={isTemplateFieldsExpanded ? 4 : 2}
                                                value={templateFields.next_steps || ''}
                                                onChange={(_, value) => {
                                                    setTemplateFields(prev => ({
                                                        ...prev,
                                                        next_steps: value || ''
                                                    }));
                                                    setTouchedFields(prev => ({ ...prev, next_steps: true }));
                                                }}
                                                placeholder="Enter next steps in the matter..."
                                                styles={{ 
                                                    root: { marginBottom: '8px' },
                                                    fieldGroup: { 
                                                        ...getFieldStyle("next_steps", templateFields.next_steps || ''),
                                                        borderRadius: '0px',
                                                        backgroundColor: 'white',
                                                        border: "none"
                                                    },
                                                    field: { 
                                                        fontFamily: 'Raleway, sans-serif',
                                                        fontSize: '14px',
                                                        padding: '8px',
                                                        background: "transparent",
                                                        ...noFocusOutline
                                                    }
                                                }}
                                                onFocus={() => setActiveField("next_steps")}
                                                onBlur={() => setActiveField(null)}
                                            />
                                            <Icon iconName="Forward" style={{ 
                                                position: 'absolute', 
                                                top: '4px', 
                                                right: '4px', 
                                                fontSize: '14px', 
                                                color: '#605e5c',
                                                pointerEvents: 'none'
                                            }} />
                                        </div>
                                        <div style={{ position: 'relative' }}>
                                            <TextField
                                                label="Estimated Timeframe"
                                                value={templateFields.realistic_timescale || ''}
                                                onChange={(_, value) => {
                                                    setTemplateFields(prev => ({
                                                        ...prev,
                                                        realistic_timescale: value || ''
                                                    }));
                                                    setTouchedFields(prev => ({ ...prev, realistic_timescale: true }));
                                                }}
                                                placeholder="Enter realistic timescale..."
                                                styles={{ 
                                                    root: { marginBottom: '8px' },
                                                    fieldGroup: { 
                                                        ...getFieldStyle("realistic_timescale", templateFields.realistic_timescale || ''),
                                                        borderRadius: '0px',
                                                        backgroundColor: 'white',
                                                        border: "none"
                                                    },
                                                    field: { 
                                                        fontFamily: 'Raleway, sans-serif',
                                                        fontSize: '14px',
                                                        padding: '8px',
                                                        background: "transparent",
                                                        ...noFocusOutline
                                                    }
                                                }}
                                                onFocus={() => setActiveField("realistic_timescale")}
                                                onBlur={() => setActiveField(null)}
                                            />
                                            <Icon iconName="Clock" style={{ 
                                                position: 'absolute', 
                                                top: '4px', 
                                                right: '4px', 
                                                fontSize: '14px', 
                                                color: '#605e5c',
                                                pointerEvents: 'none'
                                            }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Live Preview (only when template mode is active) */}
                {isTemplateMode && (
                    <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                        <div style={questionBannerStyle}>
                            Live Preview
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
                            lineHeight: '1.5'
                        }}>
                            {generateTemplateContent() || 'Preview will appear here when you add content...'}
                        </div>
                    </div>
                )}

                {/* Actions & Delivery */}
                <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                    <div style={questionBannerStyle}>
                        Actions & Delivery
                    </div>
                    
                    <Stack tokens={{ childrenGap: 16 }}>
                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <QuickActionsCard
                                title="Save Document"
                                icon="Save"
                                isDarkMode={effectiveDarkMode}
                                onClick={handleSave}
                                disabled={isSaving}
                                iconColor={colours.green}
                                orientation="row"
                            />
                            <QuickActionsCard
                                title="Send Email"
                                icon="Mail"
                                isDarkMode={effectiveDarkMode}
                                onClick={handleSendEmail}
                                disabled={isSaving || !emailTo}
                                iconColor={colours.cta}
                                orientation="row"
                            />
                        </div>
                        
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <TextField
                                label="Email Address"
                                placeholder="recipient@example.com"
                                value={emailTo}
                                onChange={(_, value) => setEmailTo(value || '')}
                                styles={{ 
                                    root: { flex: 1 },
                                    fieldGroup: { border: '1px solid #e1e5e9' },
                                    field: { fontFamily: 'Raleway, sans-serif' }
                                }}
                            />
                            <TextField
                                label="Subject Line"
                                placeholder="Document from Helix Hub"
                                value={emailSubject}
                                onChange={(_, value) => setEmailSubject(value || '')}
                                styles={{ 
                                    root: { flex: 1 },
                                    fieldGroup: { border: '1px solid #e1e5e9' },
                                    field: { fontFamily: 'Raleway, sans-serif' }
                                }}
                            />
                        </div>
                    </Stack>
                </div>
            </Stack>

            {/* Token Panel */}
            <Panel
                isOpen={tokensOpen}
                onDismiss={() => setTokensOpen(false)}
                headerText="Insert Token"
                closeButtonAriaLabel="Close"
                type={4}
                styles={{
                    main: { backgroundColor: '#ffffff' },
                    header: { backgroundColor: '#f8f9fa' }
                }}
            >
                <Stack tokens={{ childrenGap: 12 }}>
                    <Label style={{ color: '#061733', fontWeight: 600 }}>Available Tokens:</Label>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {Object.keys(cclSchema).map(key => (
                            <DefaultButton
                                key={key}
                                text={key.replace(/([A-Z])/g, ' $1').trim()}
                                onClick={() => insertToken(key)}
                                styles={{ 
                                    root: { 
                                        textAlign: 'left',
                                        border: '1px solid #e1e5e9',
                                        borderRadius: '4px',
                                        padding: '8px 12px'
                                    }
                                }}
                            />
                        ))}
                    </div>
                </Stack>
            </Panel>
        </div>
    );
};

export default DocumentsV2;
