const express = require('express');
const sql = require('mssql');
const router = express.Router();

router.get('/check-verification/:instructionRef', async (req, res) => {
  try {
    const { instructionRef } = req.params;
    
    const pool = await sql.connect(process.env.INSTRUCTIONS_SQL_CONNECTION_STRING);
    
    const result = await pool.request()
      .input('InstructionRef', sql.NVarChar, instructionRef)
      .query(`
        SELECT TOP 1 
          InstructionRef,
          ClientEmail,
          EIDCheckId,
          EIDCheckedDate,
          EIDCheckedTime,
          EIDStatus,
          EIDOverallResult,
          PEPAndSanctionsCheckResult,
          AddressVerificationResult
        FROM [dbo].[IDVerifications] 
        WHERE InstructionRef = @InstructionRef 
        ORDER BY EIDCheckedDate DESC, EIDCheckedTime DESC
      `);
    
    await pool.close();
    
    res.json({
      success: true,
      found: result.recordset.length > 0,
      data: result.recordset[0] || null
    });
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

module.exports = router;
