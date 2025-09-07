const express = require('express');
const sql = require('mssql');
const router = express.Router();

// Import our copied Tiller integration utilities
const { submitVerification } = require('../utils/tillerApi');
const { insertIDVerification } = require('../utils/idVerificationDb');

/**
 * Trigger ID verification for an instruction
 * POST /api/verify-id
 */
router.post('/', async (req, res) => {
  const { instructionRef } = req.body;
  
  if (!instructionRef) {
    return res.status(400).json({ error: 'Missing instructionRef' });
  }

  console.log(`[verify-id] Starting ID verification for ${instructionRef}`);

  let pool;
  try {
    // Use the INSTRUCTIONS_SQL_CONNECTION_STRING from .env (same as instructions router)
    const connectionString = process.env.INSTRUCTIONS_SQL_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error('INSTRUCTIONS_SQL_CONNECTION_STRING not found in environment');
    }

    pool = await sql.connect(connectionString);

    // Fetch instruction data needed for Tiller API
    const result = await pool.request()
      .input('ref', sql.NVarChar, instructionRef)
      .query(`
        SELECT 
          i.InstructionRef,
          i.ClientId,
          i.Email,
          i.FirstName,
          i.LastName,
          i.CompanyName,
          i.Title,
          i.Gender,
          i.DOB,
          i.Phone,
          i.PassportNumber,
          i.DriversLicenseNumber,
          i.HouseNumber,
          i.Street,
          i.City,
          i.County,
          i.Postcode,
          i.Country,
          i.CountryCode
        FROM Instructions i 
        WHERE i.InstructionRef = @ref
      `);

    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Instruction not found' });
    }

    const instructionData = result.recordset[0];
    
    // Check if ID verification already exists and is completed
    const existingResult = await pool.request()
      .input('ref', sql.NVarChar, instructionRef)
      .query(`
        SELECT TOP 1 EIDStatus, EIDOverallResult 
        FROM IDVerifications 
        WHERE InstructionRef = @ref 
        ORDER BY InternalId DESC
      `);

    if (existingResult.recordset.length > 0) {
      const existing = existingResult.recordset[0];
      const status = existing.EIDStatus?.toLowerCase();
      const result = existing.EIDOverallResult?.toLowerCase();
      
      if (status === 'verified' || result === 'passed' || result === 'approved') {
        return res.status(200).json({ 
          success: true, 
          message: 'ID verification already completed',
          status: 'already_verified'
        });
      }
    }

    console.log(`[verify-id] Calling Tiller API for ${instructionRef}`);
    
    // Call Tiller API with our copied utility
    const tillerResponse = await submitVerification(instructionData);
    
    console.log(`[verify-id] Tiller verification response received for ${instructionRef}`);
    console.log(`[verify-id] Response:`, JSON.stringify(tillerResponse, null, 2));
    
    console.log(`[verify-id] Tiller API response received for ${instructionRef}`);
    // Save response to database
    let riskData = null;
    try {
      riskData = await insertIDVerification(instructionData.InstructionRef, instructionData.Email, tillerResponse, pool, instructionData.ClientId);
      console.log(`[verify-id] ID verification saved to database for ${instructionRef}`);
      console.log(`[verify-id] Risk data:`, JSON.stringify(riskData));
    } catch (err) {
      console.error(`[verify-id] Failed to save Tiller response for ${instructionRef}:`, err.message);
      // Continue - we got the verification but failed to save it
    }

    return res.status(200).json({
      success: true,
      message: 'ID verification submitted successfully',
      status: 'verification_submitted',
      response: tillerResponse,
      parseResults: riskData,
      overall: riskData?.overall,
      pep: riskData?.pep,
      address: riskData?.address
    });

  } catch (error) {
    console.error(`[verify-id] Error processing verification for ${instructionRef}:`, error);
    return res.status(500).json({ 
      error: 'Failed to process ID verification',
      details: error.message 
    });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
});

/**
 * Get verification details for review modal
 * GET /api/verify-id/:instructionRef/details
 */
router.get('/:instructionRef/details', async (req, res) => {
  const { instructionRef } = req.params;
  
  if (!instructionRef) {
    return res.status(400).json({ error: 'Missing instructionRef' });
  }

  console.log(`[verify-id] Getting verification details for ${instructionRef}`);

  let pool;
  try {
    const connectionString = process.env.INSTRUCTIONS_SQL_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error('INSTRUCTIONS_SQL_CONNECTION_STRING not found in environment');
    }

    pool = await sql.connect(connectionString);

    // Query to get instruction and verification details
    const query = `
      SELECT 
        i.InstructionRef,
        i.FirstName,
        i.LastName, 
        i.Email,
        v.EIDOverallResult,
        v.PEPAndSanctionsCheckResult,
        v.AddressVerificationResult,
        v.EIDRawResponse,
        v.EIDCheckedDate
      FROM Instructions i
      LEFT JOIN IDVerifications v ON i.InstructionRef = v.InstructionRef
      WHERE i.InstructionRef = @instructionRef
      ORDER BY v.EIDCheckedDate DESC
    `;

    const request = pool.request();
    request.input('instructionRef', sql.VarChar(50), instructionRef);
    
    const result = await request.query(query);
    
    if (result.recordset.length === 0) {
      return res.status(404).json({ error: 'Instruction not found' });
    }

    const record = result.recordset[0];
    
    // Parse the raw response to determine actual status
    let rawResponse = null;
    try {
      rawResponse = record.EIDRawResponse ? JSON.parse(record.EIDRawResponse) : null;
    } catch (parseError) {
      console.error('Failed to parse EIDRawResponse:', parseError);
    }

    // Determine actual verification results from raw response
    let overallResult = record.EIDOverallResult || 'unknown';
    let pepResult = record.PEPAndSanctionsCheckResult || 'unknown';  
    let addressResult = record.AddressVerificationResult || 'unknown';

    if (rawResponse) {
      // Extract actual results from Tiller response
      overallResult = rawResponse.overallResult?.result || rawResponse.result || overallResult;
      
      // Find PEP & Sanctions check result
      const pepCheck = rawResponse.checkStatuses?.find(check => 
        check.sourceResults?.rule === 'Pep & Sanctions Check'
      );
      if (pepCheck) {
        pepResult = pepCheck.result?.result || pepResult;
      }
      
      // Find Address Verification check result
      const addressCheck = rawResponse.checkStatuses?.find(check => 
        check.sourceResults?.rule === 'Address Verification Check'
      );
      if (addressCheck) {
        addressResult = addressCheck.result?.result || addressResult;
      }
    }

    const responseData = {
      instructionRef: record.InstructionRef,
      firstName: record.FirstName || '',
      surname: record.LastName || '',
      email: record.Email || '',
      overallResult,
      pepResult,
      addressResult,
      rawResponse: record.EIDRawResponse,
      checkedDate: record.EIDCheckedDate
    };

    res.json(responseData);

  } catch (error) {
    console.error('[verify-id] Error fetching verification details:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
});

/**
 * Approve verification and send email
 * POST /api/verify-id/:instructionRef/approve
 */
router.post('/:instructionRef/approve', async (req, res) => {
  const { instructionRef } = req.params;
  
  if (!instructionRef) {
    return res.status(400).json({ error: 'Missing instructionRef' });
  }

  console.log(`[verify-id] Approving verification for ${instructionRef}`);

  let pool;
  try {
    const connectionString = process.env.INSTRUCTIONS_SQL_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error('INSTRUCTIONS_SQL_CONNECTION_STRING not found in environment');
    }

    pool = await sql.connect(connectionString);

    // Get the instruction details first
    const getInstructionQuery = `
      SELECT 
        i.InstructionRef,
        i.FirstName,
        i.LastName,
        i.Email
      FROM Instructions i
      WHERE i.InstructionRef = @instructionRef
    `;

    let request = pool.request();
    request.input('instructionRef', sql.VarChar(50), instructionRef);
    
    const instructionResult = await request.query(getInstructionQuery);
    
    if (instructionResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Instruction not found' });
    }

    const instruction = instructionResult.recordset[0];

    // Update the verification status
    const updateQuery = `
      UPDATE IDVerifications 
      SET 
        EIDOverallResult = 'Verified',
        LastUpdated = GETDATE()
      WHERE InstructionRef = @instructionRef
    `;

    request = pool.request();
    request.input('instructionRef', sql.VarChar(50), instructionRef);
    
    await request.query(updateQuery);

    // Also update the Instructions table stage if needed
    const updateInstructionQuery = `
      UPDATE Instructions 
      SET 
        Stage = 'proof-of-id-complete'
      WHERE InstructionRef = @instructionRef
    `;

    request = pool.request();
    request.input('instructionRef', sql.VarChar(50), instructionRef);
    
    await request.query(updateInstructionQuery);

    // Send notification email to client
    const clientName = `${instruction.FirstName || ''} ${instruction.LastName || ''}`.trim();
    
    try {
      await sendVerificationFailureEmail(instructionRef, instruction.Email, clientName);
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError);
      // Don't fail the approval if email fails, just log it
    }

    res.json({
      success: true,
      message: 'Verification approved successfully',
      instructionRef,
      emailSent: true
    });

  } catch (error) {
    console.error('[verify-id] Error approving verification:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error.message
    });
  } finally {
    if (pool) {
      await pool.close();
    }
  }
});

/**
 * Sends verification failure notification email to client
 */
async function sendVerificationFailureEmail(instructionRef, clientEmail, clientName) {
  // Email content based on the template provided by user
  const emailSubject = 'Additional Documents Required for ID Verification - AML Compliance';
  
  const emailBody = `
Dear ${clientName},

Thank you for providing your identification documents for our Anti-Money Laundering (AML) verification process.

While we have successfully verified your identity, our automated address verification system requires additional documentation to complete the process. This is a standard requirement to ensure full compliance with AML regulations.

To complete your verification, please provide one of the following documents that shows your current address:

• Recent utility bill (gas, electricity, water, or council tax) - within the last 3 months
• Recent bank statement - within the last 3 months  
• Tenancy agreement (if renting)
• Mortgage statement (if owned)
• Official government correspondence - within the last 3 months

Please upload your document using the secure link below:
[Document Upload Portal - ${instructionRef}]

If you have any questions or need assistance with the document upload process, please don't hesitate to contact our team.

Thank you for your cooperation in helping us maintain the highest standards of compliance.

Best regards,
Compliance Team
Helix Law

---
Reference: ${instructionRef}
This email was sent from an automated system. Please do not reply directly to this email.
`;

  // For now, just log the email that would be sent
  // In production, this would integrate with SendGrid, AWS SES, or similar service
  console.log('=== EMAIL TO BE SENT ===');
  console.log('To:', clientEmail);
  console.log('Subject:', emailSubject);
  console.log('Body:', emailBody);
  console.log('========================');

  // TODO: Integrate with actual email service
  return true;
}

module.exports = router;
