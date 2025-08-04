export type EnquiryType = 'new' | 'existing' | 'expert';
export type ContactPreference = 'email' | 'phone';

export interface CallEvent {
    action: 'claim' | 'contact' | 'save' | 'abandon';
    enquiryType?: EnquiryType | null;
    contactPreference?: ContactPreference | null;
    email?: string;
    contactPhone?: string;
    callerName?: string;
    notes?: string;
    claimTime?: number | null;
    contactTime?: number | null;
    abandonTime?: number | null;
}

export interface ClientInfo {
    name: string;
    email: string;
    matters: string[];
}