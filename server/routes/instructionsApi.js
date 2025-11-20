const {
  getInstructionByRef,
  getDealForInstruction,
  getEnquiryById,
  getPaymentsForInstruction,
  getDocumentsForInstruction,
  getPitchContentForAcid,
} = require("../repositories/instructionsRepo");

function registerInstructionsApi(app, secretClient) {
  app.get("/api/instructions/:instructionRef", async (req, res) => {
    try {
      const { instructionRef } = req.params;
      const instruction = await getInstructionByRef(secretClient, instructionRef);

      if (!instruction) {
        return res.status(404).json({ error: "Instruction not found" });
      }

      const deal = await getDealForInstruction(secretClient, instructionRef);

      let enquiry = null;
      if (deal?.enquiryId !== undefined && deal.enquiryId !== null) {
        enquiry = await getEnquiryById(secretClient, deal.enquiryId);
      }

      let pitchContent = [];
      if (enquiry?.acid) {
        pitchContent = await getPitchContentForAcid(secretClient, enquiry.acid);
      }

      const [payments, documents] = await Promise.all([
        getPaymentsForInstruction(secretClient, instructionRef),
        getDocumentsForInstruction(secretClient, instructionRef),
      ]);

      return res.json({
        instruction,
        deal,
        enquiry,
        payments,
        documents,
        pitchContent,
      });
    } catch (error) {
      console.error("Failed to load instruction", error);
      return res.status(500).json({ error: "Internal server error" });
    }
  });
}

module.exports = { registerInstructionsApi };