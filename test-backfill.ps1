# Test Backfill Script on Single Instruction
# This PowerShell script tests the backfill on HLX-27887-30406 (Faith Tinsley)

Write-Host "╔══════════════════════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║           Testing Backfill on Single Instruction (HLX-27887-30406)          ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Configuration
$instructionRef = "HLX-27887-30406"
$testEmail = "faithellen1@hotmail.com"
$initials = "BOD"

Write-Host "Instruction: $instructionRef" -ForegroundColor Yellow
Write-Host "Email: $testEmail" -ForegroundColor Yellow
Write-Host "Contact: $initials" -ForegroundColor Yellow
Write-Host ""

# First, run a dry run
Write-Host "═══ Step 1: Dry Run (no changes) ═══" -ForegroundColor Magenta
Write-Host ""
Write-Host "Running: node scripts/backfill-instruction-matters.js --dry-run --ref=$instructionRef" -ForegroundColor Gray
Write-Host ""

node scripts/backfill-instruction-matters.js --dry-run --ref=$instructionRef

Write-Host ""
Write-Host "═══ Dry Run Complete ═══" -ForegroundColor Magenta
Write-Host ""
Write-Host "Review the output above. If everything looks good, press Enter to execute actual backfill..." -ForegroundColor Yellow
$null = Read-Host

# Execute actual backfill
Write-Host ""
Write-Host "═══ Step 2: Execute Backfill ═══" -ForegroundColor Magenta
Write-Host ""
Write-Host "Running: node scripts/backfill-instruction-matters.js --ref=$instructionRef" -ForegroundColor Gray
Write-Host ""

node scripts/backfill-instruction-matters.js --ref=$instructionRef

Write-Host ""
Write-Host "═══ Backfill Complete ═══" -ForegroundColor Magenta
Write-Host ""

# Verify the results
Write-Host "═══ Step 3: Verify Results ═══" -ForegroundColor Magenta
Write-Host ""
Write-Host "Querying database to verify updates..." -ForegroundColor Gray
Write-Host ""

# This will show the updated instruction
node -e "
require('dotenv').config();
const sql = require('mssql');

async function verify() {
  try {
    const pool = await sql.connect(process.env.INSTRUCTIONS_SQL_CONNECTION_STRING);
    
    console.log('Instructions Table:');
    console.log('─'.repeat(80));
    const instResult = await pool.request()
      .input('ref', sql.NVarChar, '$instructionRef')
      .query('SELECT InstructionRef, ClientId, MatterId, Email, HelixContact FROM Instructions WHERE InstructionRef = @ref');
    
    if (instResult.recordset.length > 0) {
      const inst = instResult.recordset[0];
      console.log('InstructionRef:', inst.InstructionRef);
      console.log('ClientId:      ', inst.ClientId || 'NULL');
      console.log('MatterId:      ', inst.MatterId || 'NULL');
      console.log('Email:         ', inst.Email);
      console.log('Contact:       ', inst.HelixContact);
      console.log('');
      
      if (inst.ClientId && inst.MatterId) {
        console.log('✅ SUCCESS: Both ClientId and MatterId are populated!');
      } else {
        console.log('⚠️  WARNING: One or both IDs are still NULL');
      }
    } else {
      console.log('❌ ERROR: Instruction not found');
    }
    console.log('');
    
    console.log('Matters Table:');
    console.log('─'.repeat(80));
    const mattersResult = await pool.request()
      .input('ref', sql.NVarChar, '$instructionRef')
      .query('SELECT MatterID, InstructionRef, DisplayNumber, Status, ClientID, ClientName FROM Matters WHERE InstructionRef = @ref ORDER BY OpenDate DESC');
    
    if (mattersResult.recordset.length > 0) {
      mattersResult.recordset.forEach((m, i) => {
        console.log('Matter #' + (i + 1) + ':');
        console.log('  MatterID:      ', m.MatterID);
        console.log('  DisplayNumber: ', m.DisplayNumber || 'NULL');
        console.log('  Status:        ', m.Status);
        console.log('  ClientID:      ', m.ClientID || 'NULL');
        console.log('  ClientName:    ', m.ClientName || 'NULL');
        console.log('');
      });
      
      const realMatter = mattersResult.recordset.find(m => m.Status === 'Open' && m.ClientID);
      if (realMatter) {
        console.log('✅ SUCCESS: Found real Clio matter with Status=Open and ClientID!');
      } else {
        console.log('⚠️  WARNING: No real Clio matter found (only placeholders)');
      }
    } else {
      console.log('⚠️  No matters found for this instruction');
    }
    
    await pool.close();
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

verify();
"

Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "Test Complete!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "  1. Check the verification output above" -ForegroundColor Gray
Write-Host "  2. Test in the UI: Open Instructions tab and select $instructionRef" -ForegroundColor Gray
Write-Host "  3. Navigate to 'Matter' tab in workbench panel" -ForegroundColor Gray
Write-Host "  4. Verify client and matter information displays correctly" -ForegroundColor Gray
Write-Host "  5. If successful, run full backfill: node scripts/backfill-instruction-matters.js" -ForegroundColor Gray
