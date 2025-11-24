const { queryReadOnly } = require("../db/readOnlyQuery");

const toCamelCase = (key) =>
  key
    .replace(/[_\s]+(.)?/g, (_, chr) => (chr ? chr.toUpperCase() : ""))
    .replace(/^(\w)/, (match) => match.toLowerCase());

const normalizeRecord = (record) => {
  if (!record || typeof record !== "object") {
    return record;
  }

  return Object.entries(record).reduce((acc, [key, value]) => {
    acc[toCamelCase(key)] = value;
    return acc;
  }, {});
};

async function getInstructionByRef(secretClient, instructionRef) {
  const results = await queryReadOnly(
    secretClient,
    "SELECT * FROM dbo.Instructions WHERE InstructionRef = @instructionRef",
    { instructionRef }
  );
  return results[0] ?normalizeRecord(results[0]) : null;
}

async function getDealForInstruction(secretClient, instructionRef) {
  const results = await queryReadOnly(
    secretClient,
    "SELECT * FROM dbo.Deals WHERE InstructionRef = @instructionRef",
    { instructionRef }
  );
  return results[0] ?normalizeRecord(results[0]) : null;
}

async function getEnquiryById(secretClient, enquiryId) {
  const results = await queryReadOnly(
    secretClient,
    "SELECT * FROM dbo.enquiries WHERE enquiryId = @enquiryId",
    { enquiryId }
  );
  return results[0] ?normalizeRecord(results[0]) : null;
}

async function getPaymentsForInstruction(secretClient, instructionRef) {
  return queryReadOnly(
    secretClient,
    "SELECT * FROM dbo.Payments WHERE instruction_ref = @instructionRef ORDER BY id DESC",
    { instructionRef }
  );
}

async function getDocumentsForInstruction(secretClient, instructionRef) {
  return queryReadOnly(
    secretClient,
    "SELECT * FROM dbo.Documents WHERE InstructionRef = @instructionRef ORDER BY DocumentId DESC",
    { instructionRef }
  );
}

async function getPitchContentForAcid(secretClient, acid) {
  return queryReadOnly(
    secretClient,
    "SELECT * FROM dbo.PitchContent WHERE acid = @acid ORDER BY id DESC",
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