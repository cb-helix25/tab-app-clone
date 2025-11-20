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
        const instructionRef = req.params.instructionRef?.trim();

    if (!instructionRef) {
      return res.status(400).json({ error: "Instruction reference is required" });
    }
    try {
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
      console.error(
        `[INSTRUCTIONS] Failed to load instruction ${instructionRef}: ${error.message}`,
        {
          instructionRef,
          stack: error.stack,
        }
      );

      return res.status(500).json({
        error: "Internal server error",
        detail: error.message,
      });
    }
  });
}

module.exports = { registerInstructionsApi };