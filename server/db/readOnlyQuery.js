const { getInstructionsPool } = require("./instructionsDb");

async function queryReadOnly(secretClient, sqlText, params) {
  const normalized = sqlText.trim().toUpperCase();

  if (!normalized.startsWith("SELECT")) {
    throw new Error("Read-only mode: only SELECT queries are allowed");
  }

  const pool = await getInstructionsPool(secretClient);
  const request = pool.request();

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      request.input(key, value);
    }
  }

  const result = await request.query(sqlText);
  return result.recordset;
}

module.exports = { queryReadOnly };