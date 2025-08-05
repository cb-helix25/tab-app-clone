export type EnquiryType = 'new' | 'existing' | 'expert' | 'other';
export type ContactPreference = 'email' | 'phone';
export type CallKind = 'enquiry' | 'message';

export interface CallEvent {
    action: 'claim' | 'contact' | 'save' | 'abandon';
    callKind?: CallKind | null;
    enquiryType?: EnquiryType | null;
    contactPreference?: ContactPreference | null;
    email?: string;
    contactPhone?: string;
    callerFirstName?: string;
    callerLastName?: string;
    notes?: string;
    claimTime?: number | null;
    contactTime?: number | null;
    abandonTime?: number | null;
    teamMember?: string;
    ccTeamMember?: string;
    urgent?: boolean;
    urgentReason?: string;
    callerCategory?: string;
    messageFrom?: string;
    areaOfWork?: string;
    valueInDispute?: string;
    prospectDescription?: string;
    constructionOrHomeOwner?: string;
    propertyProfessional?: string;
    heardAboutUs?: string;
    searchTerm?: string;
    webPageVisited?: string;
}

export interface ClientInfo {
    name: string;
    email: string;
    matters: string[];
}
