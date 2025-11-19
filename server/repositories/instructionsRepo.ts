import { SecretClient } from "@azure/keyvault-secrets";
import { queryReadOnly } from "../db/readOnlyQuery";

export interface Instruction {
  instructionRef: string;
  dealId: string;
}

export interface Deal {
  dealId: string;
  enquiryId: string;
  instructionRef: string;
}

export interface Enquiry {
  enquiryId: string;
  acid: string;
  prospectId: string;
}

export interface Payment {
  paymentId: string;
  instructionRef: string;
}

export interface Document {
  documentId: string;
  instructionRef: string;
}

export interface PitchContent {
  pitchContentId: string;
  acid: string;
}

export async function getInstructionByRef(
  secretClient: SecretClient,
  instructionRef: string
): Promise<Instruction | null> {
  const results = await queryReadOnly<Instruction>(
    secretClient,
    "SELECT * FROM INSTRUCTIONS WHERE instructionRef = @instructionRef",
    { instructionRef }
  );
  return results[0] ?? null;
}

export async function getDealForInstruction(
  secretClient: SecretClient,
  instructionRef: string
): Promise<Deal | null> {
  const results = await queryReadOnly<Deal>(
    secretClient,
    "SELECT * FROM DEALS WHERE instructionRef = @instructionRef",
    { instructionRef }
  );
  return results[0] ?? null;
}

export async function getEnquiryById(
  secretClient: SecretClient,
  enquiryId: number | string
): Promise<Enquiry | null> {
  const results = await queryReadOnly<Enquiry>(
    secretClient,
    "SELECT * FROM ENQUIRIES WHERE enquiryId = @enquiryId",
    { enquiryId }
  );
  return results[0] ?? null;
}

export async function getPaymentsForInstruction(
  secretClient: SecretClient,
  instructionRef: string
): Promise<Payment[]> {
  return queryReadOnly<Payment>(
    secretClient,
    "SELECT * FROM PAYMENTS WHERE instructionRef = @instructionRef ORDER BY paymentId DESC",
    { instructionRef }
  );
}

export async function getDocumentsForInstruction(
  secretClient: SecretClient,
  instructionRef: string
): Promise<Document[]> {
  return queryReadOnly<Document>(
    secretClient,
    "SELECT * FROM DOCUMENTS WHERE instructionRef = @instructionRef ORDER BY documentId DESC",
    { instructionRef }
  );
}

export async function getPitchContentForAcid(
  secretClient: SecretClient,
  acid: string
): Promise<PitchContent[]> {
  return queryReadOnly<PitchContent>(
    secretClient,
    "SELECT * FROM PITCH_CONTENT WHERE acid = @acid ORDER BY pitchContentId DESC",
    { acid }
  );
}