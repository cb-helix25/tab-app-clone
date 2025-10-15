// New enquiry types for the database schema
export interface NewEnquiry {
  id: number;
  datetime: string;
  stage: string;
  claim: string | null;
  poc: string;
  pitch: number | null;
  aow: string;
  tow: string;
  moc: string;
  rep: string;
  first: string;
  last: string;
  email: string;
  phone: string;
  value: string;
  notes: string;
  rank: string;
  rating: string;
  acid: string;
  card_id: string | null;
  source: string;
  url: string | null;
  contact_referrer: string | null;
  company_referrer: string | null;
  gclid: string | null;
}

export const mockNewEnquiries: NewEnquiry[] = [];

