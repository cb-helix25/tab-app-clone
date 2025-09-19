// Delete an instruction and all related rows by InstructionRef, safely and transactionally
// Usage: node scripts/deleteInstruction.js HLX-XXXX-XXXXX
require('dotenv').config();
const sql = require('mssql');

async function main() {
  const ref = process.argv[2];
  if (!ref) {
    console.error('Usage: node scripts/deleteInstruction.js <InstructionRef>');
    process.exit(2);
  }

  const cs = process.env.INSTRUCTIONS_SQL_CONNECTION_STRING;
  if (!cs) {
    console.error('Missing INSTRUCTIONS_SQL_CONNECTION_STRING in env');
    process.exit(2);
  }

  const pool = await sql.connect(cs);
  try {
    // Find all base tables that contain an InstructionRef column
    const listQ = `
      SELECT c.TABLE_SCHEMA, c.TABLE_NAME
      FROM INFORMATION_SCHEMA.COLUMNS c
      JOIN INFORMATION_SCHEMA.TABLES t
        ON c.TABLE_SCHEMA = t.TABLE_SCHEMA
       AND c.TABLE_NAME = t.TABLE_NAME
      WHERE c.COLUMN_NAME = 'InstructionRef'
        AND t.TABLE_TYPE = 'BASE TABLE'
    `;
    const { recordset } = await pool.request().query(listQ);

    // Delete from children first (everything except dbo.Instructions)
    const childTables = recordset.filter(
      (t) => !(t.TABLE_SCHEMA === 'dbo' && t.TABLE_NAME === 'Instructions')
    );

    const tx = new sql.Transaction(pool);
    await tx.begin();
    try {
      for (const t of childTables) {
        const delQ = `DELETE FROM [${t.TABLE_SCHEMA}].[${t.TABLE_NAME}] WHERE InstructionRef = @ref`;
        const r = await new sql.Request(tx)
          .input('ref', sql.VarChar(64), ref)
          .query(delQ);
        const count = Array.isArray(r.rowsAffected) ? r.rowsAffected[0] : r.rowsAffected;
        if (count) console.log(`Deleted ${count} from ${t.TABLE_SCHEMA}.${t.TABLE_NAME}`);
      }

      const delInstr = await new sql.Request(tx)
        .input('ref', sql.VarChar(64), ref)
        .query('DELETE FROM dbo.Instructions WHERE InstructionRef = @ref');
      const instrCount = Array.isArray(delInstr.rowsAffected)
        ? delInstr.rowsAffected[0]
        : delInstr.rowsAffected;
      console.log(`Deleted ${instrCount || 0} from dbo.Instructions`);

      await tx.commit();
    } catch (err) {
      await tx.rollback();
      throw err;
    }

    // Verify
    const verify = await pool
      .request()
      .input('ref', sql.VarChar(64), ref)
      .query('SELECT COUNT(*) AS c FROM dbo.Instructions WHERE InstructionRef = @ref');
    console.log(`Remaining in dbo.Instructions: ${verify.recordset[0].c}`);
  } finally {
    await pool.close();
  }
}

main().catch((e) => {
  console.error('ERROR:', e.message || e);
  process.exit(1);
});
