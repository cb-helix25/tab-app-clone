// Normalise instruction stages:
// - Find instructions stuck at 'initialised' that look instructed (ID verification passed or internalStatus indicates instructed)
// - Preview by default; apply updates when --apply is provided
require('dotenv').config();
const sql = require('mssql');

function toLowerSafe(v) {
  return typeof v === 'string' ? v.toLowerCase() : '';
}

/** Infer if an ID verification row indicates a pass */
function idvLooksPassed(row) {
  if (!row) return false;
  // Check common status/result fields
  const keys = Object.keys(row);
  for (const k of keys) {
    const v = row[k];
    const vk = toLowerSafe(String(v));
    const kk = toLowerSafe(k);
    if (typeof v === 'boolean' && v) return true;
    if (kk.includes('status') || kk.includes('result') || kk.includes('outcome')) {
      if (vk.includes('pass') || vk.includes('verified') || vk === 'ok' || vk === 'true') return true;
    }
    if (kk.includes('verified') && (vk === 'true' || vk === '1')) return true;
  }
  return false;
}

/** Infer if the internalStatus implies instructed */
function internalStatusImpliesInstructed(v) {
  const s = toLowerSafe(v);
  return s === 'poid' || s === 'paid' || s === 'instructed' || s === 'complete' || s === 'completed';
}

async function main() {
  const apply = process.argv.includes('--apply');
  const cs = process.env.INSTRUCTIONS_SQL_CONNECTION_STRING;
  if (!cs) {
    console.error('Missing INSTRUCTIONS_SQL_CONNECTION_STRING');
    process.exit(2);
  }
  const pool = await sql.connect(cs);
  try {
    // Pull recent initialised instructions to keep scope safe (last 180 days)
    const instrQ = `
      SELECT InstructionRef, Stage, InternalStatus, SubmissionDate, SubmissionTime, LastUpdated
      FROM dbo.Instructions
      WHERE Stage = 'initialised'
        AND (SubmissionDate IS NULL OR SubmissionDate >= DATEADD(day, -180, CAST(GETUTCDATE() as date)))
    `;
    const instr = (await pool.request().query(instrQ)).recordset;
    if (!instr.length) {
      console.log('No initialised instructions found in recent window.');
      return;
    }

    // Load any IDV rows for these refs (one per ref is fine; if multiple, pick the most recent by whatever date exists)
    const refs = instr.map(r => r.InstructionRef);
    // Chunk to avoid parameter limits
    const chunks = [];
    for (let i = 0; i < refs.length; i += 200) chunks.push(refs.slice(i, i + 200));
    const idvByRef = new Map();
    for (const chunk of chunks) {
      const inList = chunk.map(r => `'${r.replace(/'/g, "''")}'`).join(',');
      const idvQ = `SELECT * FROM dbo.IDVerifications WHERE InstructionRef IN (${inList})`;
      const rows = (await pool.request().query(idvQ)).recordset;
      for (const row of rows) {
        // Keep the latest per ref by a likely timestamp if present; else overwrite arbitrarily
        const key = row.InstructionRef;
        const prev = idvByRef.get(key);
        // Prefer row with a later date if we find fields named Updated/Created/Date/LastUpdated
        const candidateDate = new Date(
          row.LastUpdated || row.Updated || row.Created || row.Date || row.Timestamp || 0
        ).getTime();
        const prevDate = prev ? new Date(
          prev.LastUpdated || prev.Updated || prev.Created || prev.Date || prev.Timestamp || 0
        ).getTime() : -1;
        if (!prev || candidateDate >= prevDate) idvByRef.set(key, row);
      }
    }

    // Decide candidates
    const candidates = [];
    for (const r of instr) {
      const idv = idvByRef.get(r.InstructionRef);
      const passed = idvLooksPassed(idv);
      const internal = internalStatusImpliesInstructed(r.InternalStatus);
      if (passed || internal) {
        candidates.push({ ref: r.InstructionRef, internalStatus: r.InternalStatus, hasIdv: !!idv, stage: r.Stage });
      }
    }

    console.log(`Found ${candidates.length} candidate(s) to set Stage='proof-of-id-complete'.`);
    for (const c of candidates.slice(0, 20)) {
      console.log(c);
    }
    if (candidates.length > 20) console.log(`... and ${candidates.length - 20} more`);

    if (!apply || candidates.length === 0) return;

    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      let total = 0;
      for (const c of candidates) {
        const res = await new sql.Request(tx)
          .input('ref', sql.VarChar(64), c.ref)
          .query("UPDATE dbo.Instructions SET Stage='proof-of-id-complete', LastUpdated=GETUTCDATE() WHERE InstructionRef=@ref AND Stage='initialised'");
        total += Array.isArray(res.rowsAffected) ? (res.rowsAffected[0] || 0) : (res.rowsAffected || 0);
      }
      await tx.commit();
      console.log(`Updated ${total} row(s).`);
    } catch (err) {
      await tx.rollback();
      throw err;
    }
  } finally {
    await pool.close();
  }
}

main().catch((e) => {
  console.error('ERROR:', e.message || e);
  process.exit(1);
});
