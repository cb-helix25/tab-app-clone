const {
  getInstructionByRef,
  getDealForInstruction,
  getEnquiryById,
  getPaymentsForInstruction,
  getDocumentsForInstruction,
  getPitchContentForPitch,
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
      if (deal?.ProspectId !== undefined && deal.ProspectId !== null) {
        enquiry = await getEnquiryById(secretClient, deal.ProspectId);
      }

      let pitchContent = [];
      if (enquiry?.instructionRef) {
        pitchContent = await getPitchContentForPitch(secretClient, instructionRef);
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
      console.error(
        `[INSTRUCTIONS] Failed to load instruction ${req.params.instructionRef}: ${error.message}`,
        {
          instructionRef: req.params.instructionRef,
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