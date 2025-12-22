export interface Instruction {
  instructionRef: string;
  dealId?: string;
  status?: string;
  [key: string]: unknown;
}

export interface Deal {
  dealId: string;
  enquiryId?: string;
  instructionRef?: string;
  [key: string]: unknown;
}

export interface Enquiry {
  id?: string;
  acid?: string;
  prospectId?: string;
  pointOfContact?: string;
  areaOfWork?: string;
  tags?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  initialFirstCallNotes?: string;
  [key: string]: unknown;
}

export interface Payment {
  paymentId: string;
  instructionRef?: string;
  amount?: number;
  [key: string]: unknown;
}

export interface DocumentRecord {
  documentId: string;
  instructionRef?: string;
  type?: string;
  [key: string]: unknown;
}

export interface PitchContentRecord {
  pitchContentId: string;
  acid?: string;
  description?: string;
  [key: string]: unknown;
}

export interface InstructionResponse {
  instruction?: Instruction;
  deal?: Deal;
  enquiry?: Enquiry;
  coreEnquiry?: Enquiry;
  enquirySource?: "instructions" | "helix-core" | "both";
  payments?: Payment[];
  documents?: DocumentRecord[];
  pitchContent?: PitchContentRecord[];
}