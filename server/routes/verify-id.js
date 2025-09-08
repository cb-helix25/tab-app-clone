const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.local'), override: false });

const express = require('express');
const sql = require('mssql');
const router = express.Router();

// Import our copied Tiller integration utilities
const { submitVerification } = require('../utils/tillerApi');
const { insertIDVerification } = require('../utils/idVerificationDb');

// Cache for team data to avoid repeated API calls
let teamDataCache = null;
let teamDataCacheTime = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch team data from API with caching
 */
async function getTeamData() {
  const now = Date.now();
  
  // Return cached data if still valid
  if (teamDataCache && teamDataCacheTime && (now - teamDataCacheTime) < CACHE_DURATION) {
    return teamDataCache;
  }
  
  try {
    const axios = require('axios');
    const teamApiKey = process.env.REACT_APP_GET_TEAM_DATA_CODE;
    
    if (!teamApiKey) {
      console.warn('[verify-id] No REACT_APP_GET_TEAM_DATA_CODE found, using fallback team data');
      // Fallback to hardcoded data if API key not available
      return require('../../data/team-sql-data.json');
    }
    
    const response = await axios.get(
      'https://helix-hub-api.azurewebsites.net/api/getTeamData',
      {
        params: { code: teamApiKey }
      }
    );
    
    if (response.data && Array.isArray(response.data)) {
      teamDataCache = response.data;
      teamDataCacheTime = now;
      console.log(`[verify-id] Team data refreshed from API (${response.data.length} records)`);
      return teamDataCache;
    } else {
      throw new Error('Invalid team data response format');
    }
  } catch (error) {
    console.error('[verify-id] Failed to fetch team data from API:', error.message);
    
    // Fallback to hardcoded data if API fails
    if (!teamDataCache) {
      console.log('[verify-id] Using fallback hardcoded team data');
      teamDataCache = require('../../data/team-sql-data.json');
    }
    
    return teamDataCache;
  }
}

/**
 * Convert Helix contact name or initials to email address
 * @param {string} contactName - Contact name or initials (e.g., "Al", "AC", "Alex")
 * @param {Array} teamData - Team data array from API or cache
 * @returns {string} - Email address (e.g., "ac@helix-law.com")
 */
function getContactEmail(contactName, teamData) {
  if (!contactName) return 'lz@helix-law.com'; // Fallback to LZ
  if (!teamData || !Array.isArray(teamData)) return 'lz@helix-law.com';

  const contact = teamData.find(person => {
    const fullName = person['Full Name'] || '';
    const initials = person.Initials || '';
    const firstName = person.First || '';
    const nickname = person.Nickname || '';
    
    return fullName === contactName ||
           initials === contactName.toUpperCase() ||
           firstName === contactName ||
           nickname === contactName;
  });

  if (contact && contact.Email) {
    return contact.Email;
  }

  // Fallback: if it looks like initials, convert to lowercase@helix-law.com
  if (contactName.length <= 4 && contactName.match(/^[A-Z]+$/)) {
    return `${contactName.toLowerCase()}@helix-law.com`;
  }

  // Default fallback
  return 'lz@helix-law.com'; // Final fallback to LZ
}

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
        ORDER BY EIDCheckedDate DESC
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
      clientName: `${record.FirstName || ''} ${record.LastName || ''}`.trim(),
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
 * Request additional documents via email
 * POST /api/verify-id/:instructionRef/request-documents
 */
router.post('/:instructionRef/request-documents', async (req, res) => {
  const { instructionRef } = req.params;
  
  if (!instructionRef) {
    return res.status(400).json({ error: 'Missing instructionRef' });
  }

  console.log(`[verify-id] Requesting documents for ${instructionRef}`);

  let pool;
  try {
    const connectionString = process.env.INSTRUCTIONS_SQL_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error('INSTRUCTIONS_SQL_CONNECTION_STRING not found in environment');
    }

    pool = await sql.connect(connectionString);

    // Get the instruction details and current verification status
    const getInstructionQuery = `
      SELECT 
        i.InstructionRef,
        i.FirstName,
        i.LastName,
        i.Email,
        i.HelixContact,
        d.PitchedBy,
        v.EIDOverallResult
      FROM Instructions i
      LEFT JOIN Deals d ON i.InstructionRef = d.InstructionRef
      LEFT JOIN IDVerifications v ON i.InstructionRef = v.InstructionRef
      WHERE i.InstructionRef = @instructionRef
    `;

    let request = pool.request();
    request.input('instructionRef', sql.VarChar(50), instructionRef);
    
    const instructionResult = await request.query(getInstructionQuery);
    
    if (instructionResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Instruction not found' });
    }

    const instruction = instructionResult.recordset[0];
    const clientName = `${instruction.FirstName || ''} ${instruction.LastName || ''}`.trim();
    const clientFirstName = instruction.FirstName || 'Client';

    // Check if documents have already been requested
    if (instruction.EIDOverallResult === 'Documents Requested') {
      return res.status(400).json({ 
        error: 'Documents have already been requested for this instruction',
        alreadyRequested: true
      });
    }

    // Determine the sending contact
    const sendingContact = instruction.HelixContact || instruction.PitchedBy;
    if (!sendingContact) {
      return res.status(400).json({ error: 'No Helix contact found for this instruction' });
    }

    // Send document request email
    try {
      await sendDocumentRequestEmail(instructionRef, instruction.Email, clientFirstName, sendingContact);
      
      // Update the verification status to indicate documents have been requested
      const updateQuery = `
        UPDATE IDVerifications 
        SET 
          EIDOverallResult = 'Documents Requested'
        WHERE InstructionRef = @instructionRef
      `;

      request = pool.request();
      request.input('instructionRef', sql.VarChar(50), instructionRef);
      
      await request.query(updateQuery);
      
      res.json({
        success: true,
        message: 'Document request email sent successfully',
        instructionRef,
        emailSent: true,
        recipient: 'lz@helix-law.com' // Test delivery address
      });
      
    } catch (emailError) {
      console.error('Failed to send document request email:', emailError);
      res.status(500).json({ 
        error: 'Failed to send email',
        details: emailError.message 
      });
    }

  } catch (error) {
    console.error('[verify-id] Error requesting documents:', error);
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
        i.Email,
        i.HelixContact,
        d.PitchedBy
      FROM Instructions i
      LEFT JOIN Deals d ON i.InstructionRef = d.InstructionRef
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
        EIDOverallResult = 'Verified'
      WHERE InstructionRef = @instructionRef
    `;

    request = pool.request();
    request.input('instructionRef', sql.VarChar(50), instructionRef);
    
    await request.query(updateQuery);

    // Also update the Instructions table stage if needed
    const updateInstructionQuery = `
      UPDATE Instructions 
      SET 
        stage = 'proof-of-id-complete'
      WHERE InstructionRef = @instructionRef
    `;

    request = pool.request();
    request.input('instructionRef', sql.VarChar(50), instructionRef);
    
    await request.query(updateInstructionQuery);

    // Send notification email to client
    const clientName = `${instruction.FirstName || ''} ${instruction.LastName || ''}`.trim();
    const clientFirstName = instruction.FirstName || 'Client';
    const sendingContact = instruction.HelixContact || instruction.PitchedBy || 'System';
    
    try {
      await sendVerificationFailureEmail(instructionRef, instruction.Email, clientFirstName, sendingContact);
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
 * Sends document request email to client using Microsoft Graph API
 */
async function sendDocumentRequestEmail(instructionRef, clientEmail, clientFirstName, sendingContact) {
  const axios = require('axios');
  const { getSecret } = require('../utils/getSecret');

  console.log(`[verify-id] Sending document request email to ${clientEmail} for ${instructionRef} from ${sendingContact}`);

  // Get team data from cache/API
  const teamData = await getTeamData();

  // Get the sender email address using the team data
  const senderEmail = getContactEmail(sendingContact, teamData);
  console.log(`[verify-id] Using sender email: ${senderEmail}`);
  
  // Get contact details for signature
  const contactDetails = teamData.find(person => {
    const fullName = person['Full Name'] || '';
    const initials = person.Initials || '';
    const firstName = person.First || '';
    const nickname = person.Nickname || '';
    
    return fullName === sendingContact ||
           initials === sendingContact.toUpperCase() ||
           firstName === sendingContact ||
           nickname === sendingContact;
  });

  console.log(`[verify-id] Contact lookup for '${sendingContact}':`, contactDetails);

  const contactName = contactDetails ? contactDetails['Full Name'] : sendingContact;
  const contactFirstName = contactDetails ? contactDetails['First'] : sendingContact;
  const contactRole = contactDetails ? contactDetails.Role : 'Legal Assistant';

  console.log(`[verify-id] Using contact: ${contactFirstName} (${contactRole})`);

  // Email HTML template with Helix Law branding
  const emailBody = `
    <div style="font-family: Raleway, sans-serif; color: #000;">
      <p>Dear ${clientFirstName || 'Client'},</p>
      
      <p>Thank you for submitting your proof of identity form. We initially aim to verify identities electronically.</p>
      
      <p>Unfortunately, we were unable to verify your identity through electronic means. Please be assured that this is a common occurrence and can result from various factors, such as recent relocation or a limited history at your current residence.</p>
      
      <p>To comply with anti-money laundering regulations and our know-your-client requirements, we kindly ask you to provide additional documents.</p>
      
      <p>Completing these steps is necessary for us to proceed with substantive actions on your behalf.</p>
      
      <p>We appreciate your cooperation and understanding in this matter.</p>
      
      <p><strong>Please provide 1 item from Section A and 1 item from Section B below:</strong></p>
      
      <p><strong>Section A</strong></p>
      <ul>
        <li>Passport (current and valid)</li>
        <li>Driving Licence</li>
        <li>Employer Identity Card</li>
        <li>Other Item showing your name, signature and address</li>
      </ul>
      
      <p><strong>Section B</strong></p>
      <ul>
        <li>Recent utility bill (not more than 3 months old)</li>
        <li>Recent Council Tax Bill</li>
        <li>Mortgage Statement (not more than 3 months old)</li>
        <li>Bank or Credit Card Statement (not more than 3 months old)</li>
        <li>Other item linking your name to your current address</li>
      </ul>
      
      <p>Please reply to this email with the requested documents attached as clear photographs or scanned copies.</p>
      
      <p>If you have any questions about these requirements, please don't hesitate to contact us.</p>
      
      <p>Best regards,</p>
    </div>
  `;

  // Generate full email with Helix Law signature
  const fullEmailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Helix Email</title>
</head>
<body style="margin:0; padding:0; font-family: Raleway, sans-serif; font-size:10pt; line-height:1.4; color:#000;">
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
    <tr>
      <td style="padding:10px; font-family:Raleway, sans-serif; font-size:10pt; color:#000;">
        ${emailBody}
        <p style="font-family: Raleway, sans-serif; font-size:10pt; line-height:1.4; color:#000; margin:16px 0 8px;">${contactFirstName}</p>
        <table border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin:0; padding:0; width:auto; font-family: Raleway, sans-serif; font-size:10pt; line-height:1.4; color:#000;">
          <tr>
            <td style="padding-bottom: 8px; font-family: Raleway, sans-serif; font-size:10pt; line-height:1.4; color:#000;">
              ${contactFirstName}<br />${contactRole}
            </td>
          </tr>
          <tr>
            <td style="padding-bottom: 8px; font-family: Raleway, sans-serif; color:#000;">
              <img src="https://helix-law.co.uk/wp-content/uploads/2025/01/50px-logo.png" alt="Helix Law Logo" style="height:50px; display:block; margin:15px 0;" />
            </td>
          </tr>
          <tr>
            <td style="padding-top: 8px; padding-bottom: 8px; font-family: Raleway, sans-serif; font-size:10pt; line-height:1.4; color:#000;">
              <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-size:10pt; line-height:1.4;">
                <tr>
                  <td style="padding-right:4px; vertical-align:middle;">
                    <img src="https://helix-law.co.uk/wp-content/uploads/2025/01/email.png" alt="Email Icon" style="height:12px; vertical-align:middle;" />
                  </td>
                  <td style="padding-right:15px; vertical-align:middle; font-family: Raleway, sans-serif; font-size:10pt; line-height:1.4;">
                    <a href="mailto:${senderEmail}" style="color:#3690CE; text-decoration:none;">
                      ${senderEmail}
                    </a>
                  </td>
                  <td style="padding-right:4px; vertical-align:middle;">
                    <img src="https://helix-law.co.uk/wp-content/uploads/2025/01/phone.png" alt="Phone Icon" style="height:12px; vertical-align:middle;" />
                  </td>
                  <td style="padding-right:15px; vertical-align:middle; font-family: Raleway, sans-serif; font-size:10pt; line-height:1.4;">
                    <a href="tel:+443453142044" style="color:#0D2F60; text-decoration:none;">
                      0345 314 2044
                    </a>
                  </td>
                  <td style="padding-right:4px; vertical-align:middle;">
                    <img src="https://helix-law.co.uk/wp-content/uploads/2025/01/website.png" alt="Website Icon" style="height:12px; vertical-align:middle;" />
                  </td>
                  <td style="padding-right:0; vertical-align:middle; font-family: Raleway, sans-serif; font-size:10pt; line-height:1.4;">
                    <a href="https://www.helix-law.com/" style="color:#3690CE; text-decoration:none;">
                      www.helix-law.com
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-top:8px; padding-bottom: 8px; font-family: Raleway, sans-serif; font-size:10pt; line-height:1.4;">
              <table border="0" cellpadding="0" cellspacing="0" style="border-collapse: collapse; font-size:10pt; line-height:1.4;">
                <tr>
                  <td style="padding-right:4px; vertical-align:middle;">
                    <img src="https://helix-law.co.uk/wp-content/uploads/2025/01/location.png" alt="Location Icon" style="height:12px; vertical-align:middle;" />
                  </td>
                  <td style="vertical-align:middle; color:#0D2F60; font-family: Raleway, sans-serif; font-size:10pt; line-height:1.4;">
                    Helix Law Ltd, Second Floor, Britannia House, 21 Station Street, Brighton, BN1 4DE
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding-top:8px; color:#D65541; font-size:7pt; line-height:1.5; font-family: Raleway, sans-serif;">
              DISCLAIMER: Please be aware of cyber-crime. Our bank account details will NOT change during the course of a transaction.
              Helix Law Limited will not be liable if you transfer money to an incorrect account.
              We accept no responsibility or liability for malicious or fraudulent emails purportedly coming from our firm,
              and it is your responsibility to ensure that any emails coming from us are genuine before relying on anything contained within them.
            </td>
          </tr>
          <tr>
            <td style="padding-top:8px; font-style:italic; font-size:7pt; line-height:1.5; color:#444; font-family: Raleway, sans-serif;">
              Helix Law Limited is a limited liability company registered in England and Wales. Registration Number 07845461. A list of Directors is available for inspection at the Registered Office: Second Floor, Britannia House, 21 Station Street, Brighton, BN1 4DE. Authorised and regulated by the Solicitors Regulation Authority. The term partner is a reference to a Director or senior solicitor of Helix Law Limited. Helix Law Limited does not accept service by email. This email is sent by and on behalf of Helix Law Limited. It may be confidential and may also be legally privileged. It is intended only for the stated addressee(s) and access to it by any other person is unauthorised. If you are not an addressee, you must not disclose, copy, circulate or in any other way use or rely on the information contained in this email. If you have received it in error, please inform us immediately and delete all copies. All copyright is reserved entirely on behalf of Helix Law Limited. Helix Law and applicable logo are exclusively owned trademarks of Helix Law Limited, registered with the Intellectual Property Office under numbers UK00003984532 and UK00003984535. The trademarks should not be used, copied or replicated without consent first obtained in writing.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  try {
    // Get Microsoft Graph API credentials from Key Vault
    const clientId = await getSecret('graph-pitchbuilderemailprovider-clientid');
    const clientSecret = await getSecret('graph-pitchbuilderemailprovider-clientsecret');
    const tenantId = '7fbc252f-3ce5-460f-9740-4e1cb8bf78b8'; // Same as used in other functions

    // Get access token
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenResponse.data.access_token;

    // Send email via Microsoft Graph API
    const messagePayload = {
      message: {
        subject: `Additional Documents Required - ${instructionRef}`,
        body: {
          contentType: 'HTML',
          content: fullEmailHtml
        },
        toRecipients: [{ emailAddress: { address: 'lz@helix-law.com' } }], // Test delivery only
        from: { emailAddress: { address: senderEmail } },
        ccRecipients: [{ emailAddress: { address: senderEmail } }] // CC the contact for testing
      },
      saveToSentItems: 'false'
    };

    const graphResponse = await axios.post(
      `https://graph.microsoft.com/v1.0/users/${senderEmail}/sendMail`,
      messagePayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (graphResponse.status === 202) {
      console.log(`[verify-id] Document request email sent successfully to ${clientEmail}`);
      return true;
    } else {
      throw new Error(`Unexpected Graph API status: ${graphResponse.status}`);
    }
  } catch (error) {
    console.error(`[verify-id] Failed to send document request email:`, error);
    throw error;
  }
}

/**
 * Sends draft document request email to fee earner for manual sending
 */
async function sendDraftDocumentRequestEmail(instructionRef, feeEarnerContact, clientFirstName, clientName, clientEmail) {
  const axios = require('axios');
  const { getSecret } = require('../utils/getSecret');

  console.log(`[verify-id] Sending draft document request to fee earner ${feeEarnerContact} for ${instructionRef}`);

  // Get team data from cache/API
  const teamData = await getTeamData();

  // Get the fee earner email address
  const feeEarnerEmail = getContactEmail(feeEarnerContact, teamData);
  console.log(`[verify-id] Sending draft to fee earner email: ${feeEarnerEmail}`);
  
  // Get contact details for the draft
  const contactDetails = teamData.find(person => {
    const fullName = person['Full Name'] || '';
    const initials = person.Initials || '';
    const firstName = person.First || '';
    const nickname = person.Nickname || '';
    
    return fullName === feeEarnerContact ||
           initials === feeEarnerContact.toUpperCase() ||
           firstName === feeEarnerContact ||
           nickname === feeEarnerContact;
  });

  const contactName = contactDetails ? contactDetails['Full Name'] : feeEarnerContact;
  const contactFirstName = contactDetails ? contactDetails['First'] : feeEarnerContact;
  const contactRole = contactDetails ? contactDetails.Role : 'Legal Assistant';

  // Draft email HTML for fee earner to manually send
  const draftEmailBody = `
    <div style="font-family: Raleway, sans-serif; color: #000;">
      <p><strong>DRAFT EMAIL FOR MANUAL SENDING</strong></p>
      <p><strong>Instruction Reference:</strong> ${instructionRef}</p>
      <p><strong>Client:</strong> ${clientName}</p>
      <p><strong>Client Email:</strong> ${clientEmail}</p>
      
      <hr style="margin: 20px 0; border: 1px solid #ccc;"/>
      
      <p><strong>Subject:</strong> Additional Documents Required - ${instructionRef}</p>
      
      <div style="border: 2px dashed #3690CE; padding: 15px; margin: 20px 0; background-color: #f8f9fa;">
        <p><em>Copy the content below and send directly to the client:</em></p>
        
        <div style="background: white; padding: 15px; border: 1px solid #ddd;">
          <p>Dear ${clientFirstName || 'Client'},</p>
          
          <p>Thank you for submitting your proof of identity form. We initially aim to verify identities electronically.</p>
          
          <p>Unfortunately, we were unable to verify your identity through electronic means. Please be assured that this is a common occurrence and can result from various factors, such as recent relocation or a limited history at your current residence.</p>
          
          <p>To comply with anti-money laundering regulations and our know-your-client requirements, we kindly ask you to provide additional documents.</p>
          
          <p>Completing these steps is necessary for us to proceed with substantive actions on your behalf.</p>
          
          <p>We appreciate your cooperation and understanding in this matter.</p>
          
          <p><strong>Please provide 1 item from Section A and 1 item from Section B below:</strong></p>
          
          <p><strong>Section A</strong></p>
          <ul>
            <li>Passport (current and valid)</li>
            <li>Driving Licence</li>
            <li>Employer Identity Card</li>
            <li>Other Item showing your name, signature and address</li>
          </ul>
          
          <p><strong>Section B</strong></p>
          <ul>
            <li>Recent utility bill (not more than 3 months old)</li>
            <li>Recent Council Tax Bill</li>
            <li>Mortgage Statement (not more than 3 months old)</li>
            <li>Bank or Credit Card Statement (not more than 3 months old)</li>
            <li>Other item linking your name to your current address</li>
          </ul>
          
          <p>Please reply to this email with the requested documents attached as clear photographs or scanned copies.</p>
          
          <p>If you have any questions about these requirements, please don't hesitate to contact us.</p>
          
          <p>Best regards,</p>
          <p>${contactFirstName}</p>
        </div>
      </div>
      
      <p><em>This draft email has been prepared for instruction ${instructionRef}. Please review and send directly to the client when appropriate.</em></p>
    </div>
  `;

  try {
    // Get Microsoft Graph API credentials from Key Vault
    const clientId = await getSecret('graph-pitchbuilderemailprovider-clientid');
    const clientSecret = await getSecret('graph-pitchbuilderemailprovider-clientsecret');
    const tenantId = '7fbc252f-3ce5-460f-9740-4e1cb8bf78b8';

    // Get access token
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenResponse.data.access_token;

    // Send draft email to fee earner
    const messagePayload = {
      message: {
        subject: `DRAFT: Document Request for ${clientName} (${instructionRef})`,
        body: {
          contentType: 'HTML',
          content: draftEmailBody
        },
        toRecipients: [{ emailAddress: { address: feeEarnerEmail } }],
        from: { emailAddress: { address: feeEarnerEmail } }
      },
      saveToSentItems: 'false'
    };

    const graphResponse = await axios.post(
      `https://graph.microsoft.com/v1.0/users/${feeEarnerEmail}/sendMail`,
      messagePayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (graphResponse.status === 202) {
      console.log(`[verify-id] Draft document request email sent to fee earner ${feeEarnerEmail}`);
      return true;
    } else {
      throw new Error(`Unexpected Graph API status: ${graphResponse.status}`);
    }
  } catch (error) {
    console.error(`[verify-id] Failed to send draft document request email:`, error);
    throw error;
  }
}

/**
 * Sends verification failure notification email to client
 */
async function sendVerificationFailureEmail(instructionRef, clientEmail, clientFirstName, sendingContact) {
  const axios = require('axios');
  const { getSecret } = require('../utils/getSecret');
  
  // Get team data from cache/API
  const teamData = await getTeamData();
  
  // Get the sender email address using the team data
  const senderEmail = getContactEmail(sendingContact, teamData);
  console.log(`[verify-id] Using sender email for failure notification: ${senderEmail}`);
  
  // Get contact details for signature
  const contactDetails = teamData.find(person => {
    const fullName = person['Full Name'] || '';
    const initials = person.Initials || '';
    const firstName = person.First || '';
    const nickname = person.Nickname || '';
    
    return fullName === sendingContact ||
           initials === sendingContact.toUpperCase() ||
           firstName === sendingContact ||
           nickname === sendingContact;
  });

  const contactName = contactDetails ? contactDetails['Full Name'] : sendingContact;
  const firstName = contactDetails ? contactDetails['First'] : sendingContact;  
  const contactRole = contactDetails ? contactDetails.Role : 'Legal Assistant';

  // Email content based on the template provided by user
  const emailSubject = 'Additional Documents Required for ID Verification - AML Compliance';
  
  const emailBody = `
Dear ${clientFirstName},

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

/**
 * Test state switching for development (local only)
 * POST /api/verify-id/:instructionRef/test-state
 */
router.post('/:instructionRef/test-state', async (req, res) => {
  // Only allow in development environment
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ error: 'Not available in production' });
  }

  const { instructionRef } = req.params;
  const { state } = req.body;
  
  if (!instructionRef || !state) {
    return res.status(400).json({ error: 'Missing instructionRef or state' });
  }

  const validStates = ['fresh-failure', 'documents-pending', 'documents-received', 'verified'];
  if (!validStates.includes(state)) {
    return res.status(400).json({ 
      error: 'Invalid state', 
      validStates 
    });
  }

  console.log(`[verify-id] Switching test state to '${state}' for ${instructionRef}`);

  let pool;
  try {
    const connectionString = process.env.INSTRUCTIONS_SQL_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error('INSTRUCTIONS_SQL_CONNECTION_STRING not found in environment');
    }

    pool = await sql.connect(connectionString);

    // Map state to database values
    let eidOverallResult;
    let instructionStage;
    
    switch (state) {
      case 'fresh-failure':
        eidOverallResult = 'Declined';
        instructionStage = 'proof-of-id-failed';
        break;
      case 'documents-pending':
        eidOverallResult = 'Documents Requested';
        instructionStage = 'proof-of-id-failed';
        break;
      case 'documents-received':
        eidOverallResult = 'Documents Received';
        instructionStage = 'proof-of-id-failed';
        break;
      case 'verified':
        eidOverallResult = 'Verified';
        instructionStage = 'proof-of-id-complete';
        break;
    }

    // Update IDVerifications table
    const updateVerificationQuery = `
      UPDATE IDVerifications 
      SET EIDOverallResult = @eidOverallResult
      WHERE InstructionRef = @instructionRef
    `;

    let request = pool.request();
    request.input('instructionRef', sql.VarChar(50), instructionRef);
    request.input('eidOverallResult', sql.VarChar(50), eidOverallResult);
    
    await request.query(updateVerificationQuery);

    // Update Instructions table (only stage, not EIDOverallResult)
    const updateInstructionQuery = `
      UPDATE Instructions 
      SET stage = @stage
      WHERE InstructionRef = @instructionRef
    `;

    request = pool.request();
    request.input('instructionRef', sql.VarChar(50), instructionRef);
    request.input('stage', sql.VarChar(50), instructionStage);
    
    await request.query(updateInstructionQuery);

    res.json({
      success: true,
      message: `Test state switched to '${state}'`,
      instructionRef,
      newState: state,
      eidOverallResult,
      instructionStage
    });

  } catch (error) {
    console.error('[verify-id] Error switching test state:', error);
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
 * Send draft document request email to fee earner
 * POST /api/verify-id/:instructionRef/draft-request
 */
router.post('/:instructionRef/draft-request', async (req, res) => {
  const { instructionRef } = req.params;
  
  console.log(`[verify-id] DRAFT REQUEST - Received request for instructionRef: ${instructionRef}`);
  console.log(`[verify-id] DRAFT REQUEST - Request method: ${req.method}`);
  console.log(`[verify-id] DRAFT REQUEST - Request URL: ${req.originalUrl}`);
  
  if (!instructionRef) {
    console.log(`[verify-id] DRAFT REQUEST - Missing instructionRef`);
    return res.status(400).json({ error: 'Missing instructionRef' });
  }

  console.log(`[verify-id] Sending draft document request for ${instructionRef}`);

  let pool;
  try {
    const connectionString = process.env.INSTRUCTIONS_SQL_CONNECTION_STRING;
    if (!connectionString) {
      throw new Error('INSTRUCTIONS_SQL_CONNECTION_STRING not found in environment');
    }

    pool = await sql.connect(connectionString);

    // Get the instruction details
    const getInstructionQuery = `
      SELECT 
        i.InstructionRef,
        i.FirstName,
        i.LastName,
        i.Email,
        i.HelixContact,
        d.PitchedBy
      FROM Instructions i
      LEFT JOIN Deals d ON i.InstructionRef = d.InstructionRef
      WHERE i.InstructionRef = @instructionRef
    `;

    let request = pool.request();
    request.input('instructionRef', sql.VarChar(50), instructionRef);
    
    const instructionResult = await request.query(getInstructionQuery);
    
    if (instructionResult.recordset.length === 0) {
      return res.status(404).json({ error: 'Instruction not found' });
    }

    const instruction = instructionResult.recordset[0];
    const clientName = `${instruction.FirstName || ''} ${instruction.LastName || ''}`.trim();
    const clientFirstName = instruction.FirstName || 'Client';

    // Determine the sending contact (fee earner)
    const feeEarner = instruction.HelixContact || instruction.PitchedBy;
    if (!feeEarner) {
      return res.status(400).json({ error: 'No Helix contact found for this instruction' });
    }

    // Send draft email to fee earner instead of client
    try {
      await sendDraftDocumentRequestEmail(instructionRef, feeEarner, clientFirstName, clientName, instruction.Email);
      
      res.json({
        success: true,
        message: 'Draft document request email sent to fee earner',
        instructionRef,
        emailSent: true,
        recipient: feeEarner
      });
      
    } catch (emailError) {
      console.error('Failed to send draft document request email:', emailError);
      res.status(500).json({ 
        error: 'Failed to send email',
        details: emailError.message 
      });
    }

  } catch (error) {
    console.error('[verify-id] Error sending draft document request:', error);
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

module.exports = router;
