#!/usr/bin/env node
/*
  Cleanup script for test enquiries in the main 'enquiries' table.
  - Lists or deletes rows matching clear test patterns (names/emails/IDs/notes)
  - Uses parameterised SQL; does not log secrets

  Usage (PowerShell):
    node scripts/cleanup-test-enquiries.js --list --for lz
    node scripts/cleanup-test-enquiries.js --list --for luke
    node scripts/cleanup-test-enquiries.js --list --for all
    node scripts/cleanup-test-enquiries.js --delete --for lz --confirm

  Env:
    SQL_CONNECTION_STRING must be set (same as used by /api/enquiries-unified)
*/
const sql = require('mssql');

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { action: 'list', scope: 'lz', confirm: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i].toLowerCase();
    if (a === '--list') opts.action = 'list';
    if (a === '--delete') opts.action = 'delete';
    if (a === '--confirm') opts.confirm = true;
    if (a === '--for' && i + 1 < args.length) {
      opts.scope = args[i + 1].toLowerCase();
      i++;
    }
  }
  return opts;
}

function buildWhere(scope) {
  // Obvious, conservative patterns only
  const clauses = [];
  const params = {};

  // Scope-specific and SAFE by default
  if (scope === 'lz') {
    // LZ test mailboxes (e.g., lz001@helix-law.com)
    clauses.push('(LOWER(Email) LIKE @lzSeed)');
    params['lzSeed'] = 'lz%@helix-law.com';
  } else if (scope === 'luke') {
    // Classic Luke test rows like "Luke Test"
    clauses.push(`(LOWER(First_Name) = @luke AND LOWER(Last_Name) LIKE @testLast)`);
    params['luke'] = 'luke';
    params['testLast'] = 'test%';
  } else if (scope === 'dummy' || scope === 'all') {
    // Generic dummy/test markers only when explicitly requested
    clauses.push(`(LOWER(First_Name + ' ' + Last_Name) LIKE @nameTest OR LOWER(Initial_first_call_notes) LIKE @notesDummy OR LOWER(Initial_first_call_notes) LIKE @notesTest)`);
    params['nameTest'] = '%test%';
    params['notesDummy'] = '%dummy%';
    params['notesTest'] = '%test%';

    // Known test emails
    clauses.push('(LOWER(Email) IN (@johnTest, @dummyHelix))');
    params['johnTest'] = 'john.testclaimer@example.com';
    params['dummyHelix'] = 'dummy@helix-law.com';

    // ENQ_DUMMY_* ids exist in some sources; main table ID may be numeric, so guard with TRY_CONVERT
    clauses.push(`(TRY_CONVERT(int, ID) IS NULL AND CAST(ID AS nvarchar(50)) LIKE @enqDummy)`);
    params['enqDummy'] = 'ENQ_DUMMY_%';

    // Known zero/placeholder IDs
    clauses.push(`(CAST(ID AS nvarchar(50)) IN (@idZero) OR CAST(ID AS nvarchar(50)) LIKE @idZeroLike)`);
    params['idZero'] = '00000';
    params['idZeroLike'] = '0%';
  } else {
    // Treat any other scope as a conservative custom email fragment filter
    clauses.push('(LOWER(Email) LIKE @customFrag)');
    params['customFrag'] = `%${scope}%`;
  }

  return { where: clauses.length ? '(' + clauses.join(' OR ') + ')' : '1=0', params };
}

async function main() {
  const { action, scope, confirm } = parseArgs();
  const connStr = process.env.SQL_CONNECTION_STRING;
  if (!connStr) {
    console.error('❌ SQL_CONNECTION_STRING not set. Aborting.');
    process.exit(1);
  }

  const pool = new sql.ConnectionPool(connStr);
  await pool.connect();

  const { where, params } = buildWhere(scope);

  // Preview
  const previewReq = pool.request();
  Object.entries(params).forEach(([k, v]) => previewReq.input(k, sql.NVarChar(255), v));
  const previewSql = `SELECT TOP 200 ID, Date_Created, First_Name, Last_Name, Email, Phone_Number, Area_of_Work, Initial_first_call_notes AS Notes FROM enquiries WHERE ${where} ORDER BY Date_Created DESC`;
  const preview = await previewReq.query(previewSql);

  console.log(`🔎 Preview (${preview.recordset.length} rows):`);
  preview.recordset.forEach((r) => {
    console.log(` - ID=${r.ID} | ${r.First_Name} ${r.Last_Name} | ${r.Email} | ${r.Area_of_Work}`);
  });

  if (action !== 'delete') {
    console.log('\nℹ️ Run with --delete --confirm to remove these rows.');
    await pool.close();
    return;
  }

  if (!confirm) {
    console.log('\n⚠️ Delete requested but --confirm not provided. Aborting.');
    await pool.close();
    process.exit(2);
  }

  // Delete
  const delReq = pool.request();
  Object.entries(params).forEach(([k, v]) => delReq.input(k, sql.NVarChar(255), v));
  const deleteSql = `DELETE FROM enquiries WHERE ${where}`;
  const result = await delReq.query(deleteSql);
  console.log(`🧹 Deleted rows: ${result.rowsAffected?.[0] ?? 0}`);

  await pool.close();
}

main().catch((err) => {
  console.error('❌ Cleanup error:', err && err.message ? err.message : err);
  process.exit(1);
});
