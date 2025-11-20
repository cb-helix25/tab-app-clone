const { queryReadOnly } = require("../db/readOnlyQuery");

async function getInstructionByRef(secretClient, instructionRef) {
  const results = await queryReadOnly(
    secretClient,
    "SELECT * FROM INSTRUCTIONS WHERE instructionRef = @instructionRef",
    { instructionRef }
  );
  return results[0] ?? null;
}

async function getDealForInstruction(secretClient, instructionRef) {
  const results = await queryReadOnly(
    secretClient,
    "SELECT * FROM DEALS WHERE instructionRef = @instructionRef",
    { instructionRef }
  );
  return results[0] ?? null;
}

async function getEnquiryById(secretClient, enquiryId) {
  const results = await queryReadOnly(
    secretClient,
    "SELECT * FROM ENQUIRIES WHERE enquiryId = @enquiryId",
    { enquiryId }
  );
  return results[0] ?? null;
}

async function getPaymentsForInstruction(secretClient, instructionRef) {
  return queryReadOnly(
    secretClient,
    "SELECT * FROM PAYMENTS WHERE instructionRef = @instructionRef ORDER BY paymentId DESC",
    { instructionRef }
  );
}

async function getDocumentsForInstruction(secretClient, instructionRef) {
  return queryReadOnly(
    secretClient,
    "SELECT * FROM DOCUMENTS WHERE instructionRef = @instructionRef ORDER BY documentId DESC",
    { instructionRef }
  );
}

async function getPitchContentForAcid(secretClient, acid) {
  return queryReadOnly(
    secretClient,
    "SELECT * FROM PITCH_CONTENT WHERE acid = @acid ORDER BY pitchContentId DESC",
    { acid }
  );
}

module.exports = {
  getInstructionByRef,
  getDealForInstruction,
  getEnquiryById,
  getPaymentsForInstruction,
  getDocumentsForInstruction,
  getPitchContentForAcid,
};