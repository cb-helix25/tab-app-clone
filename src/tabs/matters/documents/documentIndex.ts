// src/tabs/matters/documentIndex.ts

// Define a type for a document entry
export interface DocumentEntry {
    id: number;
    title: string;
    preview: string;
    requirements: string; // formatted string listing required data
    fullContent: string;
    icon: string;
    type?: string;
  }
  
  // Group documents by litigation area
  export interface DocumentIndex {
    Commercial: DocumentEntry[];
    Construction: DocumentEntry[];
    Employment: DocumentEntry[];
    Property: DocumentEntry[];
  }
  
  // Expanded index file with sample document entries for each category
  const documentIndex: DocumentIndex = {
    Commercial: [
      {
        id: 1,
        title: "Commercial Litigation Template",
        preview: "Template to initiate commercial litigation with a clear statement of claim and supporting evidence.",
        requirements: "Requires client details, contract terms, summary of evidence, and relevant communications.",
        fullContent: "Full content for the Commercial Litigation Template.",
        icon: "Money",
      },
      {
        id: 2,
        title: "Client Care Letter",
        preview: "Formal letter to maintain client engagement and outline next steps.",
        requirements: "Requires client contact details, case background, and next steps for engagement.",
        fullContent: "Full content for the Client Care Letter.",
        icon: "Contact",
      },
      {
        id: 3,
        title: "End of Case Letter",
        preview: "Letter to formally close a case, summarizing outcomes and final communications.",
        requirements: "Requires case outcome, final financial summary, and closure details.",
        fullContent: "Full content for the End of Case Letter.",
        icon: "Completed",
      },
      {
        id: 4,
        title: "Settlement Agreement Template",
        preview: "Draft settlement agreement for resolving commercial disputes outside of court.",
        requirements: "Requires settlement terms, party details, and dispute resolution clauses.",
        fullContent: "Full content for the Settlement Agreement Template.",
        icon: "Agreement",
      },
      {
        id: 14,
        title: "Pre-Action Protocol Letter",
        preview: "Letter outlining steps before litigation, complying with pre-action protocols.",
        requirements: "Requires details of the claim, timeline of events, and a summary of issues.",
        fullContent: "Full content for the Pre-Action Protocol Letter.",
        icon: "PreAction",
      },
      {
        id: 15,
        title: "Demand Letter for Breach of Contract",
        preview: "A letter demanding performance or compensation following a breach of contract.",
        requirements: "Requires contract details, breach evidence, and a clear demand for remedy.",
        fullContent: "Full content for the Demand Letter for Breach of Contract.",
        icon: "Demand",
      },
      {
        id: 16,
        title: "Disclosure Checklist",
        preview: "A checklist template to ensure all relevant documents are disclosed.",
        requirements: "Requires a list of documents, descriptions, and status of disclosure.",
        fullContent: "Full content for the Disclosure Checklist.",
        icon: "Checklist",
      },
      {
        id: 17,
        title: "Litigation Bundle Index",
        preview: "An index template for compiling documents used in litigation bundles.",
        requirements: "Requires document titles, reference numbers, and summaries for each item.",
        fullContent: "Full content for the Litigation Bundle Index.",
        icon: "Index",
      },
    ],
    Construction: [
      {
        id: 5,
        title: "Construction Dispute Brief",
        preview: "Brief outlining the details of a construction dispute including delays and defects.",
        requirements: "Requires project timelines, contract details, and history of disputes.",
        fullContent: "Full content for the Construction Dispute Brief.",
        icon: "ConstructionCone",
      },
      {
        id: 6,
        title: "Construction Claim Notice",
        preview: "Notice to initiate a claim regarding construction defects or delays.",
        requirements: "Requires project details, basis for claim, and supporting documentation.",
        fullContent: "Full content for the Construction Claim Notice.",
        icon: "Alert",
      },
      {
        id: 7,
        title: "Expert Report Template",
        preview: "Template for structuring expert evidence in construction disputes.",
        requirements: "Requires expert witness details, inspection findings, and timeline of events.",
        fullContent: "Full content for the Expert Report Template.",
        icon: "ReportDocument",
      },
      {
        id: 18,
        title: "Extension of Time Claim",
        preview: "Claim document for seeking an extension of time due to delays.",
        requirements: "Requires project schedule, reasons for delay, and supporting correspondence.",
        fullContent: "Full content for the Extension of Time Claim.",
        icon: "TimeExtension",
      },
      {
        id: 19,
        title: "Payment Application Document",
        preview: "Template for submitting payment applications during construction projects.",
        requirements: "Requires payment schedule, work completed details, and certification.",
        fullContent: "Full content for the Payment Application Document.",
        icon: "Payment",
      },
      {
        id: 20,
        title: "Variation Claim Form",
        preview: "Form to claim variations due to changes in project scope or conditions.",
        requirements: "Requires original scope, details of variation, and cost implications.",
        fullContent: "Full content for the Variation Claim Form.",
        icon: "Variation",
      },
      {
        id: 21,
        title: "Site Inspection Report",
        preview: "Report template for documenting findings during a site inspection.",
        requirements: "Requires inspection dates, observations, photographs, and expert comments.",
        fullContent: "Full content for the Site Inspection Report.",
        icon: "Inspection",
      },
    ],
    Employment: [
      {
        id: 8,
        title: "Employment Law Claim Template",
        preview: "Template for drafting claims related to wrongful dismissal or discrimination.",
        requirements: "Requires employee records, employment contract, and incident report.",
        fullContent: "Full content for the Employment Law Claim Template.",
        icon: "People",
      },
      {
        id: 9,
        title: "Witness Statement Template",
        preview: "Template for witness statements in employment disputes.",
        requirements: "Requires witness details, chronology of events, and supporting evidence.",
        fullContent: "Full content for the Witness Statement Template.",
        icon: "Chat",
      },
      {
        id: 10,
        title: "Grievance Procedure Document",
        preview: "Structured outline of the grievance procedure to be followed in disputes.",
        requirements: "Requires company policies, incident details, and meeting records.",
        fullContent: "Full content for the Grievance Procedure Document.",
        icon: "ReportWarning",
      },
      {
        id: 22,
        title: "Settlement Agreement for Employment Disputes",
        preview: "Settlement agreement template designed for resolving employment disputes.",
        requirements: "Requires settlement terms, employee details, and dispute resolution clauses.",
        fullContent: "Full content for the Settlement Agreement for Employment Disputes.",
        icon: "Settlement",
      },
      {
        id: 23,
        title: "Disciplinary Hearing Minutes",
        preview: "Template for recording minutes during disciplinary hearings.",
        requirements: "Requires meeting date, participants, key discussion points, and outcomes.",
        fullContent: "Full content for the Disciplinary Hearing Minutes.",
        icon: "Minutes",
      },
      {
        id: 24,
        title: "Notice of Dismissal Appeal",
        preview: "Template for drafting a notice of appeal against a dismissal decision.",
        requirements: "Requires details of dismissal, grounds for appeal, and supporting evidence.",
        fullContent: "Full content for the Notice of Dismissal Appeal.",
        icon: "Appeal",
      },
      {
        id: 25,
        title: "Employment Tribunal Claim Form",
        preview: "Claim form template for submitting an employment tribunal claim.",
        requirements: "Requires claimant details, summary of claim, and relevant evidence.",
        fullContent: "Full content for the Employment Tribunal Claim Form.",
        icon: "Tribunal",
      },
    ],
    Property: [
      {
        id: 11,
        title: "Property Litigation Brief",
        preview: "Detailed brief for property disputes covering boundary conflicts and lease issues.",
        requirements: "Requires property deeds, lease agreements, and survey reports.",
        fullContent: "Full content for the Property Litigation Brief.",
        icon: "Home",
      },
      {
        id: 12,
        title: "Witness Statement for Property Dispute",
        preview: "Template for witness statements in property litigation.",
        requirements: "Requires witness identification, timeline of events, and supporting evidence.",
        fullContent: "Full content for the Witness Statement for Property Dispute.",
        icon: "Pill",
      },
      {
        id: 13,
        title: "Lease Dispute Summary Document",
        preview: "Outline for summarizing key issues in lease disputes.",
        requirements: "Requires lease contract details, payment history, and correspondence records.",
        fullContent: "Full content for the Lease Dispute Summary Document.",
        icon: "Document",
      },
      {
        id: 26,
        title: "Boundary Dispute Report",
        preview: "Report template for documenting boundary disputes.",
        requirements: "Requires property surveys, title deeds, and photographic evidence.",
        fullContent: "Full content for the Boundary Dispute Report.",
        icon: "Boundary",
      },
      {
        id: 27,
        title: "Possession Claim Template",
        preview: "Template for initiating a claim to regain possession of property.",
        requirements: "Requires tenancy details, breach of terms, and eviction notices.",
        fullContent: "Full content for the Possession Claim Template.",
        icon: "Possession",
      },
      {
        id: 28,
        title: "Rent Arrears Demand Letter",
        preview: "Demand letter template for addressing rent arrears issues.",
        requirements: "Requires tenant details, arrears calculation, and payment history.",
        fullContent: "Full content for the Rent Arrears Demand Letter.",
        icon: "Demand",
      },
      {
        id: 29,
        title: "Title Deed Analysis Report",
        preview: "Template for analyzing title deeds in property disputes.",
        requirements: "Requires property title documents, historical data, and legal opinion.",
        fullContent: "Full content for the Title Deed Analysis Report.",
        icon: "Analysis",
      },
      {
        id: 30,
        title: "Planning Permission Objection Letter",
        preview: "Objection letter template for challenging planning permission decisions.",
        requirements: "Requires planning documents, grounds for objection, and supporting evidence.",
        fullContent: "Full content for the Planning Permission Objection Letter.",
        icon: "Objection",
      },
    ],
  };
  
  export default documentIndex;
  