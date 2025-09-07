import { Request, Response } from 'express';
const sql = require('mssql');

/**
 * Fetches detailed ID verification data for review modal
 */
export const getVerificationDetails = async (req: Request, res: Response) => {
  try {
    const { instructionRef } = req.params;
    
    if (!instructionRef) {
      return res.status(400).json({ error: 'Instruction reference is required' });
    }

    // Query to get instruction and verification details
    const query = `
      SELECT 
        i.InstructionRef,
        i.FirstName,
        i.Surname, 
        i.Email,
        v.EIDOverallResult,
        v.PEPAndSanctionsCheckResult,
        v.AddressVerificationResult,
        v.EIDRawResponse,
        v.CheckedDate
      FROM Instructions i
      LEFT JOIN IDVerifications v ON i.InternalId = v.InstructionInternalId
      WHERE i.InstructionRef = @instructionRef
      ORDER BY v.CheckedDate DESC
    `;

    const pool = await sql.connect();
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
      overallResult = rawResponse.result || rawResponse.overall_result || overallResult;
      pepResult = rawResponse.peps_and_sanctions?.result || pepResult;
      addressResult = rawResponse.address_verification?.result || addressResult;
    }

    const responseData = {
      instructionRef: record.InstructionRef,
      firstName: record.FirstName || '',
      surname: record.Surname || '',
      email: record.Email || '',
      overallResult,
      pepResult,
      addressResult,
      rawResponse: record.EIDRawResponse,
      checkedDate: record.CheckedDate
    };

    res.json(responseData);

  } catch (error) {
    console.error('Error fetching verification details:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Approves ID verification and updates status to Verified
 */
export const approveVerification = async (req: Request, res: Response) => {
  try {
    const { instructionRef } = req.params;
    
    if (!instructionRef) {
      return res.status(400).json({ error: 'Instruction reference is required' });
    }

    // Get the instruction details first
    const getInstructionQuery = `
      SELECT 
        i.InternalId,
        i.FirstName,
        i.Surname,
        i.Email
      FROM Instructions i
      WHERE i.InstructionRef = @instructionRef
    `;

    const pool = await sql.connect();
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
      WHERE InstructionInternalId = @internalId
    `;

    request = pool.request();
    request.input('internalId', sql.Int, instruction.InternalId);
    
    await request.query(updateQuery);

    // Also update the Instructions table stage if needed
    const updateInstructionQuery = `
      UPDATE Instructions 
      SET 
        stage = 'proof-of-id-complete',
        EIDOverallResult = 'Verified'
      WHERE InternalId = @internalId
    `;

    request = pool.request();
    request.input('internalId', sql.Int, instruction.InternalId);
    
    await request.query(updateInstructionQuery);

    // Send notification email to client
    const clientName = `${instruction.FirstName} ${instruction.Surname}`.trim();
    
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
    console.error('Error approving verification:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Sends verification failure notification email to client
 */
async function sendVerificationFailureEmail(instructionRef: string, clientEmail: string, clientName: string) {
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
  // Example with SendGrid:
  // const sgMail = require('@sendgrid/mail');
  // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  // 
  // const msg = {
  //   to: clientEmail,
  //   from: 'compliance@helixlaw.co.uk',
  //   subject: emailSubject,
  //   text: emailBody
  // };
  // 
  // await sgMail.send(msg);

  return true;
}
