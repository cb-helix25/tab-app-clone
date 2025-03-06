// src/tabs/matters/documentIndex.ts

// Define a type for individual requirement fields.
export interface RequirementField {
  field: string;
  description: string;
}

// Define a type for a document entry.
export interface DocumentEntry {
  id: number;
  title: string;
  preview: string;
  // Previously a single string, now split into individual fields.
  requirements: RequirementField[];
  fullContent: string; // Full or sample content of the template.
  icon: string;
  type?: string;
  metadata?: { [key: string]: string | number | boolean };
}

// Group documents by practice area.
export interface DocumentIndex {
  Commercial: DocumentEntry[];
  Employment: DocumentEntry[];
  Property: DocumentEntry[];
  Construction: DocumentEntry[];
}

// Document Index – Revised for Helix Law Ltd
const documentIndex: DocumentIndex = {
  // ------------------------------------------------
  // Commercial Group (includes Corporate, Commercial, and Debt Recovery)
  // ------------------------------------------------
  Commercial: [
    {
      id: 1,
      title: "Shareholders’ Agreement",
      preview:
        "Agreement setting out shareholder rights, share transfers, dividend policy and dispute resolution mechanisms.",
      requirements: [
        { field: "Company Name", description: "Requires company name." },
        { field: "Registration Number", description: "Requires registration number." },
        { field: "Shareholders", description: "Requires list of shareholders with share percentages." },
        { field: "Voting Rights", description: "Requires details of voting rights." },
        { field: "Dividend Policy", description: "Requires dividend policy." },
        { field: "Dispute Resolution Clauses", description: "Requires dispute resolution clauses." },
        { field: "Articles of Association", description: "Must be supported by the Articles of Association." },
      ],
      fullContent:
        "Template for a Shareholders’ Agreement – [Insert clause-by-clause breakdown]. Refer to the Articles of Association for corporate governance provisions.",
      icon: "Contract",
      metadata: {
        documentType: "Contract",
        governingLaw: "Companies Act 2006",
        version: "Standard Template v1.0",
        dependencies: "Articles of Association",
      },
    },
    {
      id: 2,
      title: "Partnership Agreement",
      preview:
        "Agreement outlining partner roles, profit-sharing, capital contributions, and exit/dissolution procedures.",
      requirements: [
        { field: "Firm Name", description: "Requires firm name." },
        { field: "Partner Identities", description: "Requires partner identities and addresses." },
        { field: "Capital Contributions", description: "Requires capital contributions." },
        { field: "Profit-Sharing Ratios", description: "Requires profit-sharing ratios." },
        { field: "Roles & Responsibilities", description: "Requires roles and responsibilities for each partner." },
        { field: "Dispute Resolution Process", description: "Requires dispute resolution process." },
      ],
      fullContent:
        "Template for a Partnership Agreement – [Detail partner obligations, dispute resolution, and dissolution procedure].",
      icon: "Contract",
      metadata: {
        documentType: "Contract",
        governingLaw: "Partnership Act 1890 (default rules if no agreement exists)",
        version: "Standard Template v1.0",
      },
    },
    {
      id: 3,
      title: "Board & Shareholder Meeting Minutes",
      preview:
        "Minutes and resolutions of board meetings, often key evidence in shareholder disputes.",
      requirements: [
        { field: "Meeting Date", description: "Requires meeting date." },
        { field: "Attendees", description: "Requires list of attendees." },
        { field: "Resolutions", description: "Requires resolutions passed." },
        { field: "Objections", description: "Requires any objections raised." },
        { field: "Supporting Documents", description: "Must reference supporting documents." },
      ],
      fullContent:
        "Template for Meeting Minutes – [Include resolution text and attendance records].",
      icon: "Minutes",
      metadata: {
        documentType: "Internal Record",
        storageReference: "Minute Book ID",
        version: "Standard Template v1.0",
      },
    },
    {
      id: 4,
      title: "Unfair Prejudice Petition",
      preview:
        "Court petition filed by a minority shareholder alleging unfair prejudice in company affairs.",
      requirements: [
        { field: "Petitioner Details", description: "Requires petitioner’s details and shareholding." },
        { field: "Respondent Details", description: "Requires respondents’ details." },
        { field: "Statement of Facts", description: "Requires detailed statement of facts (e.g. exclusion, withholding dividends)." },
        { field: "Breached Provisions", description: "Requires reference to breached provisions of the Shareholders’ Agreement and Articles." },
        { field: "Relief Sought", description: "Requires relief sought (e.g. share buyout order)." },
      ],
      fullContent:
        "Template for an Unfair Prejudice Petition – [Include sections for factual background, legal basis (Companies Act 2006, s.994), and remedy sought].",
      icon: "Gavel",
      metadata: {
        documentType: "Court Pleading",
        governingLaw: "Companies Act 2006 s.994",
        version: "Standard Petition v1.0",
      },
    },
    {
      id: 5,
      title: "Service Agreement",
      preview:
        "Contract between a service provider and a client outlining scope, fees, and obligations.",
      requirements: [
        { field: "Service Description", description: "Requires detailed service description." },
        { field: "Fee Structure", description: "Requires fee structure." },
        { field: "Term", description: "Requires term of the agreement." },
        { field: "Termination Clause", description: "Requires termination clause." },
        { field: "Confidentiality Clause", description: "Requires confidentiality clause." },
        { field: "Dispute Resolution Clause", description: "Should include a dispute resolution clause." },
      ],
      fullContent:
        "Template for a Service Agreement – [Insert standard clauses, with placeholders for service specifics].",
      icon: "Contract",
      metadata: {
        documentType: "Contract",
        governingLaw: "English Contract Law",
        version: "Standard Template v1.0",
      },
    },
    {
      id: 6,
      title: "Settlement Agreement",
      preview:
        "Agreement to settle commercial disputes with clear terms for payment, release of claims, and confidentiality.",
      requirements: [
        { field: "Settlement Amount", description: "Requires details of settlement amount." },
        { field: "Release Clauses", description: "Requires release clauses." },
        { field: "Confidentiality Terms", description: "Requires confidentiality terms." },
        { field: "Payment Schedule", description: "Requires payment schedule." },
        { field: "Reference Documents", description: "Must reference underlying dispute documents if litigation was pending." },
      ],
      fullContent:
        "Template for a Settlement Agreement – [Clause-by-clause settlement terms].",
      icon: "Settlement",
      metadata: {
        documentType: "Contract / Court Order",
        governingLaw: "Relevant Commercial Law",
        version: "Standard Template v1.0",
      },
    },
    {
      id: 7,
      title: "Investment Agreement",
      preview:
        "Agreement outlining investment terms, share allocations, representations, and warranties between investor and company.",
      requirements: [
        { field: "Investor Details", description: "Requires investor details." },
        { field: "Investment Amount", description: "Requires investment amount." },
        { field: "Ownership Percentage", description: "Requires percentage of ownership." },
        { field: "Valuation", description: "Requires company valuation." },
        { field: "Exit Rights", description: "Requires rights on exit." },
        { field: "Disclosure Obligations", description: "Must include disclosure obligations." },
      ],
      fullContent:
        "Template for an Investment Agreement – [Standard clauses with customizable fields].",
      icon: "Money",
      metadata: {
        documentType: "Contract",
        governingLaw: "Companies Act 2006 & Commercial Law",
        version: "Standard Template v1.0",
      },
    },
    {
      id: 8,
      title: "Loan Agreement",
      preview:
        "Formal contract for a loan, detailing the amount, repayment schedule, interest rate, and default clauses.",
      requirements: [
        { field: "Lender Details", description: "Requires lender details." },
        { field: "Borrower Details", description: "Requires borrower details." },
        { field: "Principal Amount", description: "Requires principal amount." },
        { field: "Interest Rate", description: "Requires interest rate." },
        { field: "Repayment Schedule", description: "Requires repayment schedule." },
        { field: "Security", description: "Requires details of any security provided." },
        { field: "Default Provisions", description: "Requires default provisions." },
        { field: "Repayment Ledger", description: "Must be supported by a repayment ledger." },
      ],
      fullContent:
        "Template for a Loan Agreement – [Include repayment and default provisions].",
      icon: "Payment",
      metadata: {
        documentType: "Contract",
        governingLaw: "Commercial and Contract Law",
        version: "Standard Template v1.0",
      },
    },
    {
      id: 9,
      title: "Letter Before Action (Debt/Investment)",
      preview:
        "Pre-litigation letter demanding remedy for breach of contract or unpaid investment amounts.",
      requirements: [
        { field: "Claimant Details", description: "Requires claimant details." },
        { field: "Respondent Details", description: "Requires respondent details." },
        { field: "Summary of Dispute", description: "Requires summary of dispute." },
        { field: "Contract Reference", description: "Requires reference to the underlying contract." },
        { field: "Clear Demand", description: "Requires a clear demand." },
        { field: "Deadline", description: "Requires a deadline for response." },
        { field: "Enclosures List", description: "Should include a list of enclosures." },
      ],
      fullContent:
        "Template for a Letter Before Action – [Customizable sections for facts, demands, and deadlines].",
      icon: "Letter",
      metadata: {
        documentType: "Demand Letter",
        governingLaw: "Civil Procedure Rules",
        version: "Standard Template v1.0",
      },
    },
    {
      id: 10,
      title: "Statutory Demand",
      preview:
        "Formal demand for payment under insolvency law. If unpaid within 21 days, enables the creditor to petition for bankruptcy or winding-up.",
      requirements: [
        { field: "Debtor Details", description: "Requires debtor details." },
        { field: "Amount Owed", description: "Requires amount owed." },
        { field: "Debt Origin", description: "Requires a clear statement of debt origin." },
        { field: "Deadline", description: "Requires a 21-day deadline." },
        { field: "Legal Threshold", description: "Must follow legal thresholds (e.g., £5k for individuals, £750 for companies)." },
      ],
      fullContent:
        "Template for a Statutory Demand – [Includes statutory language and fields for debtor and creditor details].",
      icon: "Demand",
      metadata: {
        documentType: "Insolvency Notice",
        governingLaw: "Insolvency Act 1986",
        version: "Standard Form (SD2 for individuals / 4.1 for companies)",
      },
    },
    {
      id: 11,
      title: "County Court Claim Form (Debt)",
      preview:
        "Court claim form to recover a debt when other measures have failed. Initiates legal proceedings for judgment.",
      requirements: [
        { field: "Creditor Details", description: "Requires creditor details." },
        { field: "Debtor Details", description: "Requires debtor details." },
        { field: "Amount Claimed", description: "Requires amount claimed (including interest if applicable)." },
        { field: "Particulars of Claim", description: "Requires brief particulars of claim." },
        { field: "Reference to Prior Demand", description: "Requires reference to prior demand or statutory notice." },
      ],
      fullContent:
        "Template for a County Court Claim Form – [Based on Form N1 with accompanying particulars (Form N119) if required].",
      icon: "Court",
      metadata: {
        documentType: "Court Pleading",
        governingLaw: "Civil Procedure Rules",
        version: "Standard Template v1.0",
      },
    },
  ],

  // ------------------------------
  // Employment
  // ------------------------------
  Employment: [
    {
      id: 12,
      title: "Employment Contract",
      preview:
        "Contract detailing employment terms including remuneration, duties, notice periods and benefits.",
      requirements: [
        { field: "Employee Name", description: "Requires employee’s full name." },
        { field: "Role", description: "Requires employee’s role." },
        { field: "Salary", description: "Requires salary details." },
        { field: "Benefits", description: "Requires list of benefits offered." },
        { field: "Notice Period", description: "Requires notice period." },
        { field: "Confidentiality Clause", description: "Requires confidentiality clause." },
        { field: "Non-Compete Clause", description: "Requires non-compete clause." },
        { field: "Dispute Resolution", description: "Requires dispute resolution terms." },
      ],
      fullContent:
        "Template for an Employment Contract – [Standard clauses for UK employment, with customizable fields].",
      icon: "Employee",
      metadata: {
        documentType: "Contract",
        governingLaw: "Employment Rights Act 1996",
        version: "Standard Template v1.0",
      },
    },
    {
      id: 13,
      title: "Disciplinary Procedure",
      preview:
        "Procedure document outlining steps for addressing misconduct, investigation, and potential disciplinary actions.",
      requirements: [
        { field: "Process Steps", description: "Requires step-by-step process for addressing misconduct." },
        { field: "Timeframes", description: "Requires expected timeframes for each process step." },
        { field: "Employer Rights", description: "Requires employer rights during the process." },
        { field: "Employee Rights", description: "Requires employee rights during the process." },
        { field: "Compliance", description: "Must be compliant with ACAS guidelines." },
      ],
      fullContent:
        "Template for a Disciplinary Procedure – [Detailed process description and forms for warnings, hearings, and appeals].",
      icon: "Warning",
      metadata: {
        documentType: "Procedure Document",
        governingLaw: "Employment Law and ACAS Guidelines",
        version: "Standard Template v1.0",
      },
    },
  ],

  // ------------------------------
  // Property Disputes & Evictions
  // ------------------------------
  Property: [
    {
      id: 14,
      title: "Commercial Lease Agreement",
      preview:
        "Lease agreement for commercial properties, setting out rental terms, obligations, and repair responsibilities.",
      requirements: [
        { field: "Property Address", description: "Requires property address." },
        { field: "Landlord Details", description: "Requires landlord details." },
        { field: "Tenant Details", description: "Requires tenant details." },
        { field: "Lease Duration", description: "Requires lease duration." },
        { field: "Rental Amount", description: "Requires rental amount and frequency." },
        { field: "Deposit Details", description: "Requires deposit details." },
        { field: "Repair Obligations", description: "Requires repair and maintenance obligations." },
      ],
      fullContent:
        "Template for a Commercial Lease Agreement – [Standard lease clauses with customizable fields].",
      icon: "Home",
      metadata: {
        documentType: "Contract",
        governingLaw: "Landlord and Tenant Act 1985 (plus commercial lease standards)",
        version: "Standard Template v1.0",
      },
    },
    {
      id: 15,
      title: "Section 21 Notice (No-Fault Eviction)",
      preview:
        "Notice under Section 21 of the Housing Act 1988 for terminating an assured shorthold tenancy without alleging fault.",
      requirements: [
        { field: "Tenant Details", description: "Requires tenant details." },
        { field: "Landlord Details", description: "Requires landlord details." },
        { field: "Property Address", description: "Requires property address." },
        { field: "Tenancy Start Date", description: "Requires tenancy start date." },
        { field: "Deposit Protection", description: "Requires confirmation of deposit protection compliance." },
        { field: "Notice Period", description: "Requires a notice period of at least 2 months." },
      ],
      fullContent:
        "Template for a Section 21 Notice – [Include statutory language and required fields per Form 6A].",
      icon: "Notice",
      metadata: {
        documentType: "Statutory Notice",
        governingLaw: "Housing Act 1988",
        version: "Form 6A Standard",
      },
    },
    {
      id: 16,
      title: "Section 8 Notice (For Cause Eviction)",
      preview:
        "Formal notice to terminate a tenancy for specific breaches such as rent arrears or other tenancy breaches.",
      requirements: [
        { field: "Tenant Details", description: "Requires tenant details." },
        { field: "Breach Details", description: "Requires details of the breach (e.g., outstanding rent)." },
        { field: "Statutory Grounds", description: "Requires reference to statutory grounds (e.g., Ground 8 for arrears)." },
      ],
      fullContent:
        "Template for a Section 8 Notice – [Include tick-box style ground selection and space for explanation].",
      icon: "Notice",
      metadata: {
        documentType: "Statutory Notice",
        governingLaw: "Housing Act 1988",
        version: "Standard Template v1.0",
      },
    },
  ],

  // ------------------------------
  // Construction Disputes & Adjudication
  // ------------------------------
  Construction: [
    {
      id: 17,
      title: "Construction Contract",
      preview:
        "Main construction contract (e.g. JCT or NEC) governing project delivery and payment, essential as the basis for any dispute.",
      requirements: [
        { field: "Project Name", description: "Requires project name." },
        { field: "Party Details", description: "Requires details of the parties involved." },
        { field: "Scope of Work", description: "Requires description of the scope of work." },
        { field: "Contract Price", description: "Requires contract price." },
        { field: "Key Dates", description: "Requires key dates such as start date, completion date, and payment schedule." },
        { field: "Bespoke Clauses", description: "Requires any bespoke clauses (e.g., variations, delays, termination)." },
      ],
      fullContent:
        "Standard Construction Contract Template – [Extract relevant clauses and incorporate standard forms such as JCT or NEC with amendments].",
      icon: "Contract",
      metadata: {
        documentType: "Contract",
        governingLaw: "English Construction Law",
        version: "Standard Template v1.0",
      },
    },
    {
      id: 18,
      title: "Notice of Adjudication",
      preview:
        "Formal notice to commence adjudication under the Housing Grants, Construction and Regeneration Act 1996.",
      requirements: [
        { field: "Dispute Details", description: "Requires details of the dispute." },
        { field: "Party Information", description: "Requires details of the parties involved." },
        { field: "Contract Reference", description: "Requires reference to the underlying construction contract." },
        { field: "Relief Sought", description: "Requires description of the relief or remedy being requested." },
      ],
      fullContent:
        "Template for a Notice of Adjudication – [Includes standard fields for project details, dispute description, and timeline].",
      icon: "Notice",
      metadata: {
        documentType: "Dispute Notice",
        governingLaw: "Housing Grants, Construction and Regeneration Act 1996",
        version: "Standard Template v1.0",
      },
    },
    {
      id: 19,
      title: "Referral Notice (Adjudication)",
      preview:
        "Detailed submission to the adjudicator outlining the claim, supporting evidence, and the relief sought.",
      requirements: [
        { field: "Narrative", description: "Requires a narrative of events." },
        { field: "Contractual References", description: "Requires references to contractual clauses." },
        { field: "Payment/Breach Details", description: "Requires details of payment claims or breaches." },
        { field: "Supporting Documents", description: "Requires a list of supporting documents." },
      ],
      fullContent:
        "Template for a Referral Notice – [Customizable sections for background facts, contractual references, and remedy sought].",
      icon: "Folder",
      metadata: {
        documentType: "Adjudication Pleading",
        governingLaw: "Housing Grants, Construction and Regeneration Act 1996",
        version: "Standard Template v1.0",
      },
    },
    {
      id: 20,
      title: "Project Records & Payment Notices",
      preview:
        "Compilation of payment applications, certificates, delay notices, and other project records that support a claim.",
      requirements: [
        { field: "Notice Log", description: "Requires a chronological log of all notices (payment, delay, variation)." },
        { field: "Supporting Invoices/Certificates", description: "Requires supporting invoices or certificates as evidence." },
        { field: "Issuance Dates", description: "Requires dates when notices were issued." },
      ],
      fullContent:
        "Not a template per se, but an indexable dataset record – to be uploaded as evidence in disputes.",
      icon: "Checklist",
      metadata: {
        documentType: "Data Log",
        usage: "Evidence for dispute resolution and adjudication",
      },
    },
  ],
};

export default documentIndex;
