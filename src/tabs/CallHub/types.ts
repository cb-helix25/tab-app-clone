export type EnquiryType = 'new' | 'existing' | 'expert';
export type ContactPreference = 'email' | 'phone';

export interface CallEvent {
    action: 'claim' | 'contact' | 'save';
    enquiryType?: EnquiryType | null;
    contactPreference?: ContactPreference | null;
    email?: string;
    contactPhone?: string;
    callerName?: string;
    notes?: string;
    claimTime?: number | null;
    contactTime?: number | null;
}

export interface ClientInfo {
    name: string;
    email: string;
    matters: string[];
}