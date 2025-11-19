import type { Express, Request, Response } from "express";
import { SecretClient } from "@azure/keyvault-secrets";
import {
  getInstructionByRef,
  getDealForInstruction,
  getEnquiryById,
  getPaymentsForInstruction,
  getDocumentsForInstruction,
  getPitchContentForAcid,
  Enquiry,
  PitchContent
} from "../repositories/instructionsRepo";

export function registerInstructionsApi(app: Express, secretClient: SecretClient): void {
  app.get("/api/instructions/:instructionRef", async (req: Request, res: Response) => {
    try {
      const { instructionRef } = req.params;
      const instruction = await getInstructionByRef(secretClient, instructionRef);

      if (!instruction) {
        return res.status(404).json({ error: "Instruction not found" });
      }

      const deal = await getDealForInstruction(secretClient, instructionRef);

      let enquiry: Enquiry | null = null;
      if (deal?.enquiryId !== undefined && deal.enquiryId !== null) {
        enquiry = await getEnquiryById(secretClient, deal.enquiryId);
      }

      let pitchContent: PitchContent[] = [];
      if (enquiry?.acid) {
        pitchContent = await getPitchContentForAcid(secretClient, enquiry.acid);
      }

      const [payments, documents] = await Promise.all([
        getPaymentsForInstruction(secretClient, instructionRef),
        getDocumentsForInstruction(secretClient, instructionRef)
      ]);

      return res.json({
        instruction,
        deal,
        enquiry,
        payments,
        documents,
        pitchContent
      });
    } catch (error) {
      console.error("Failed to load instruction", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}