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

// Mock data for local development
export const mockNewEnquiries: NewEnquiry[] = [
  {
    id: 1,
    datetime: '2025-06-28T14:30:00',
    stage: 'enquiry',
    claim: '2025-06-28T14:30:00',
    poc: 'LZ',
    pitch: null,
    aow: 'commercial',
    tow: 'Contract Dispute',
    moc: 'phone',
    rep: 'LZ',
    first: 'Emma',
    last: 'Example',
    email: 'lead1@example.com',
    phone: '0101010101',
    value: '£2,500',
    notes: 'Client called about urgent contract dispute with supplier. Need advice on breach of contract terms.',
    rank: 'A',
    rating: 'Good',
    acid: 'ENQ-001-2025',
    card_id: null,
    source: 'organic',
    url: null,
    contact_referrer: null,
    company_referrer: null,
    gclid: null,
  },
  {
    id: 2,
    datetime: '2025-07-02T16:15:00',
    stage: 'enquiry',
    claim: '2025-07-02T16:15:00',
    poc: 'LZ',
    pitch: null,
    aow: 'commercial',
    tow: 'Shareholder Dispute',
    moc: 'email',
    rep: 'LZ',
    first: 'Alice',
    last: 'Anderson',
    email: 'lead2@example.com',
    phone: '0202020202',
    value: '£3,000',
    notes: 'Email enquiry about shareholder rights in family business. Concerns about corporate governance.',
    rank: 'A',
    rating: 'Good',
    acid: 'ENQ-002-2025',
    card_id: null,
    source: 'referral',
    url: null,
    contact_referrer: 'John Smith',
    company_referrer: 'Previous Client',
    gclid: null,
  },
  {
    id: 3,
    datetime: '2025-07-04T11:20:00',
    stage: 'enquiry',
    claim: '2025-07-04T11:20:00',
    poc: 'LZ',
    pitch: null,
    aow: 'commercial',
    tow: 'Construction Dispute',
    moc: 'web_form',
    rep: 'LZ',
    first: 'Bob',
    last: 'Bennett',
    email: 'lead3@example.com',
    phone: '0303030303',
    value: '£4,000',
    notes: 'Web form submission regarding construction adjudication dispute. Payment dispute with contractor.',
    rank: 'A',
    rating: 'Good',
    acid: 'ENQ-003-2025',
    card_id: null,
    source: 'google_ads',
    url: null,
    contact_referrer: null,
    company_referrer: null,
    gclid: 'Gclid_abc123def456',
  },
  {
    id: 4,
    datetime: '2025-07-15T09:45:00',
    stage: 'enquiry',
    claim: '2025-07-15T09:45:00',
    poc: 'LZ',
    pitch: null,
    aow: 'employment',
    tow: 'Unfair Dismissal',
    moc: 'phone',
    rep: 'LZ',
    first: 'Sarah',
    last: 'Worker',
    email: 'sarah.worker@email.com',
    phone: '0404040404',
    value: '£1,500',
    notes: 'Phone call about unfair dismissal. Employee dismissed without proper procedure followed.',
    rank: 'A',
    rating: 'Good',
    acid: 'ENQ-004-2025',
    card_id: null,
    source: 'organic',
    url: null,
    contact_referrer: null,
    company_referrer: null,
    gclid: null,
  },
  {
    id: 5,
    datetime: '2025-07-10T13:30:00',
    stage: 'enquiry',
    claim: '2025-07-10T13:30:00',
    poc: 'LZ',
    pitch: null,
    aow: 'property',
    tow: 'Boundary Dispute',
    moc: 'email',
    rep: 'LZ',
    first: 'David',
    last: 'Property',
    email: 'david.property@home.co.uk',
    phone: '0505050505',
    value: '£3,500',
    notes: 'Email about boundary dispute with neighbour. Land registry documents show conflicting boundaries.',
    rank: 'A',
    rating: 'Good',
    acid: 'ENQ-005-2025',
    card_id: null,
    source: 'referral',
    url: null,
    contact_referrer: 'Local Solicitor',
    company_referrer: 'Smith & Partners',
    gclid: null,
  },
];
