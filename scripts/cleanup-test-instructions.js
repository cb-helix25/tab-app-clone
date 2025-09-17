const fs = require('fs');
const path = require('path');
// Load env vars from .env.local or .env for connection strings
try {
  const envLocal = path.resolve(process.cwd(), '.env.local');
  const envRoot = path.resolve(process.cwd(), '.env');
  if (fs.existsSync(envLocal)) {
    require('dotenv').config({ path: envLocal });
  } else if (fs.existsSync(envRoot)) {
    require('dotenv').config({ path: envRoot });
  }
} catch {}

const sql = require('mssql');
const { getSqlPool } = require('../decoupled-functions/sqlClient');

let instructionsPoolPromise;
function getPool() {
  const cs = process.env.INSTRUCTIONS_SQL_CONNECTION_STRING;
  if (cs && typeof cs === 'string' && cs.trim().length > 0) {
    if (!instructionsPoolPromise) {
      instructionsPoolPromise = sql.connect(cs);
    }
    return instructionsPoolPromise;
  }
  return getSqlPool();
}

async function identifyTestRecords() {
  try {
    const pool = await getPool();
    // Query to identify potential test records using only InstructionRef
    const query = `
      SELECT InstructionRef
      FROM Instructions 
      WHERE 
        InstructionRef LIKE '%TEST%'
        OR InstructionRef LIKE '%test%'
        OR InstructionRef LIKE '%ABCD%'
        OR InstructionRef LIKE '%12345%'
        OR InstructionRef NOT LIKE 'HLX-%'
        OR LEN(InstructionRef) < 10
      ORDER BY InstructionRef DESC
    `;
    
    const result = await pool.request().query(query);
    
    console.log(`Found ${result.recordset.length} potential test records:\n`);
    
    // Group by type for easier review
    const testPatterns = {
      'Test in InstructionRef': [],
      'Malformed Refs': []
    };
    
    result.recordset.forEach(record => {
      const ref = record.InstructionRef || '';
      if (ref.toLowerCase().includes('test') || ref.includes('ABCD') || ref.includes('12345')) {
        testPatterns['Test in InstructionRef'].push({ InstructionRef: ref });
      }
      if (!ref.startsWith('HLX-') || ref.length < 10) {
        testPatterns['Malformed Refs'].push({ InstructionRef: ref });
      }
    });
    
    // Display results by category
    Object.keys(testPatterns).forEach(category => {
      const records = testPatterns[category];
      if (records.length > 0) {
        console.log(`\n=== ${category} (${records.length} records) ===`);
        records.forEach(record => {
          console.log(`${record.InstructionRef}`);
        });
      }
    });
    
    return testPatterns;
    
  } catch (error) {
    console.error('Error identifying test records:', error);
    throw error;
  }
}

async function getProductionRecords() {
  try {
    const pool = await getPool();
    // Query for what appears to be real production data using only InstructionRef
    const query = `
      SELECT InstructionRef
      FROM Instructions 
      WHERE 
        InstructionRef = 'HLX-27367-94842' -- health indicator
        OR (
          InstructionRef LIKE 'HLX-%'
          AND LEN(InstructionRef) >= 10
          AND InstructionRef NOT LIKE '%TEST%'
          AND InstructionRef NOT LIKE '%test%'
          AND InstructionRef NOT LIKE '%ABCD%'
          AND InstructionRef NOT LIKE '%12345%'
        )
      ORDER BY InstructionRef DESC
    `;
    
    const result = await pool.request().query(query);
    
    console.log(`\n=== Production Records to Keep (${result.recordset.length} records) ===`);
    result.recordset.forEach(record => {
      console.log(`${record.InstructionRef}`);
    });
    
    return result.recordset;
    
  } catch (error) {
    console.error('Error getting production records:', error);
    throw error;
  }
}

async function createDeleteScript(testPatterns) {
  console.log('\n=== Generated DELETE Statements ===');
  console.log('-- REVIEW CAREFULLY BEFORE EXECUTING --\n');
  
  // Get all instruction refs to delete
  const allTestRefs = [];
  Object.values(testPatterns).forEach(records => {
    records.forEach(record => {
      if (record.InstructionRef && record.InstructionRef !== 'HLX-27367-94842') { // Keep Luke Test
        allTestRefs.push(record.InstructionRef);
      }
    });
  });
  
  // Remove duplicates
  const uniqueRefs = [...new Set(allTestRefs)];
  
  console.log('-- Delete from related tables first (referential integrity)');
  console.log('DELETE FROM RiskAssessment WHERE InstructionRef IN (');
  uniqueRefs.forEach((ref, index) => {
    console.log(`  '${ref}'${index < uniqueRefs.length - 1 ? ',' : ''}`);
  });
  console.log(');\n');
  
  console.log('DELETE FROM IDVerifications WHERE InstructionRef IN (');
  uniqueRefs.forEach((ref, index) => {
    console.log(`  '${ref}'${index < uniqueRefs.length - 1 ? ',' : ''}`);
  });
  console.log(');\n');
  
  console.log('DELETE FROM Documents WHERE InstructionRef IN (');
  uniqueRefs.forEach((ref, index) => {
    console.log(`  '${ref}'${index < uniqueRefs.length - 1 ? ',' : ''}`);
  });
  console.log(');\n');
  
  console.log('DELETE FROM Deals WHERE InstructionRef IN (');
  uniqueRefs.forEach((ref, index) => {
    console.log(`  '${ref}'${index < uniqueRefs.length - 1 ? ',' : ''}`);
  });
  console.log(');\n');
  
  console.log('-- Finally delete from Instructions table');
  console.log('DELETE FROM Instructions WHERE InstructionRef IN (');
  uniqueRefs.forEach((ref, index) => {
    console.log(`  '${ref}'${index < uniqueRefs.length - 1 ? ',' : ''}`);
  });
  console.log(');\n');
  
  console.log(`-- Total records to delete: ${uniqueRefs.length}`);
  console.log('-- Luke Test record (HLX-27367-94842) will be PRESERVED as health indicator');
}

function collectTestRefs(testPatterns) {
  const refs = [];
  Object.values(testPatterns).forEach(records => {
    records.forEach(record => {
      if (record.InstructionRef && record.InstructionRef !== 'HLX-27367-94842') {
        refs.push(record.InstructionRef);
      }
    });
  });
  return [...new Set(refs)];
}

async function deleteByRefs(uniqueRefs) {
  if (!Array.isArray(uniqueRefs) || uniqueRefs.length === 0) return { deleted: 0 };
  const MAX_DELETE = 2000;
  if (uniqueRefs.length > MAX_DELETE) throw new Error(`Refusing to delete ${uniqueRefs.length} records (> ${MAX_DELETE}). Narrow selection.`);

  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  const relatedTables = ['RiskAssessment', 'IDVerifications', 'Documents', 'Matters', 'Deals'];
  const chunkSize = 100;
  let totalDeleted = 0;
  await tx.begin();
  try {
    // Delete from related tables first
    for (const table of relatedTables) {
      for (let i = 0; i < uniqueRefs.length; i += chunkSize) {
        const chunk = uniqueRefs.slice(i, i + chunkSize);
        const req = new sql.Request(tx);
        chunk.forEach((r, idx) => req.input(`r${idx}`, sql.VarChar, r));
        const inList = chunk.map((_, idx) => `@r${idx}`).join(', ');
        await req.query(`DELETE FROM ${table} WHERE InstructionRef IN (${inList})`);
      }
    }
    // Delete from Instructions
    for (let i = 0; i < uniqueRefs.length; i += chunkSize) {
      const chunk = uniqueRefs.slice(i, i + chunkSize);
      const req = new sql.Request(tx);
      chunk.forEach((r, idx) => req.input(`r${idx}`, sql.VarChar, r));
      const inList = chunk.map((_, idx) => `@r${idx}`).join(', ');
      const res = await req.query(`DELETE FROM Instructions WHERE InstructionRef IN (${inList})`);
      if (Array.isArray(res.rowsAffected) && res.rowsAffected.length > 0) {
        totalDeleted += res.rowsAffected[0] || 0;
      } else if (typeof res.rowsAffected === 'number') {
        totalDeleted += res.rowsAffected;
      }
    }
    await tx.commit();
    return { deleted: totalDeleted };
  } catch (err) {
    await tx.rollback();
    throw err;
  }
}

async function main() {
  console.log('=== Instruction Data Cleanup Analysis ===\n');
  
  try {
    const args = process.argv.slice(2);
    const doList = args.includes('--list');
    const doDelete = args.includes('--delete');
    const confirmed = args.includes('--confirm');
    const refsArg = (args.find(a => a.startsWith('--refs=')) || '').split('=')[1] || '';
    const explicitRefs = refsArg
      .split(',')
      .map(s => s && s.trim())
      .filter(Boolean)
      .filter(r => r !== 'HLX-27367-94842'); // always preserve health indicator

    // Identify targets
    console.log('1. Identifying test records...');
    let testPatterns;
    if (explicitRefs.length > 0) {
      testPatterns = { Explicit: explicitRefs.map(r => ({ InstructionRef: r })) };
      console.log(`Using explicit refs (${explicitRefs.length}):`);
      explicitRefs.forEach(r => console.log(` - ${r}`));
    } else {
      testPatterns = await identifyTestRecords();
    }

    const total = Object.values(testPatterns).reduce((s, a) => s + (a?.length || 0), 0);
    console.log(`\nSummary: ${total} potential test records across ${Object.keys(testPatterns).length} categories.`);

    if (doList || (!doDelete && !confirmed)) {
      console.log('\n2. Identifying production records to keep...');
      await getProductionRecords();

      console.log('\n3. Generating cleanup script (dry-run)...');
      await createDeleteScript(testPatterns);

      if (!doDelete) {
        console.log('\nRun with --delete --confirm to execute deletions.');
        console.log('Make sure to backup the database before running cleanup!');
        return;
      }
    }

    if (doDelete) {
      if (!confirmed) {
        console.log('\nRefusing to delete without --confirm.');
        return;
      }
      const refs = collectTestRefs(testPatterns);
      console.log(`\nDeleting ${refs.length} Instructions (excluding health indicator HLX-27367-94842)...`);
      const { deleted } = await deleteByRefs(refs);
      console.log(`\nDeleted ${deleted} rows from Instructions (dependent tables cleaned first).`);
    }

    console.log('\n=== Complete ===');
    
  } catch (error) {
    console.error('Error during analysis:', error);
  }
}

// Run if called directly
if (require.main === module) {
  main().then(() => process.exit(0)).catch(err => {
    console.error(err);
    process.exit(1);
  });
}

module.exports = { identifyTestRecords, getProductionRecords, createDeleteScript };
