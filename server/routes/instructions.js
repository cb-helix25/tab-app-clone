const express = require('express');
const { getSecret } = require('../utils/getSecret');
const sql = require('mssql');
const router = express.Router();

// Database connection config - will be initialized on first request
let poolConfig = null;
let pool = null;

async function ensureDbConnection() {
  if (pool && pool.connected) return pool;
  
  if (!poolConfig) {
    const password = await getSecret('instructionsadmin-password');
    poolConfig = {
      server: 'instructions.database.windows.net',
      database: 'Instructions',
      user: 'instructionsadmin',
      password: password,
      options: {
        encrypt: true,
        enableArithAbort: true,
        trustServerCertificate: false,
      },
      pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000,
      },
    };
  }
  
  if (!pool) {
    pool = new sql.ConnectionPool(poolConfig);
  }
  
  if (!pool.connected) {
    await pool.connect();
  }
  
  return pool;
}

// Business logic computation functions
function computeVerificationStatus(instruction, idVerifications) {
  const proofOfIdComplete = Boolean(instruction?.PassportNumber || instruction?.DriversLicenseNumber);
  const eid = idVerifications.find(id => id.InstructionRef === instruction.InstructionRef);
  const eidStatus = eid?.EIDStatus?.toLowerCase() ?? '';
  const poidResult = eid?.EIDOverallResult?.toLowerCase() ?? '';
  const poidPassed = poidResult === 'passed' || poidResult === 'approved';

  if (!eid || eidStatus === 'pending') {
    return proofOfIdComplete ? 'received' : 'pending';
  } else if (poidPassed) {
    return 'complete';
  } else {
    return 'review';
  }
}

function computeRiskStatus(riskAssessments, instructionRef) {
  const risk = riskAssessments.find(r => r.InstructionRef === instructionRef);
  if (!risk) return 'pending';
  
  const result = risk.RiskAssessmentResult?.toString().toLowerCase() ?? '';
  const isLowRisk = ['low', 'low risk', 'pass', 'approved'].includes(result);
  return isLowRisk ? 'complete' : 'flagged';
}

function computeNextAction(instruction, verificationStatus, riskStatus) {
  const paymentCompleted = (instruction?.PaymentResult?.toLowerCase() === 'successful');
  const hasMatter = Boolean(instruction?.MatterId);
  const poidPassed = verificationStatus === 'complete';

  if (verificationStatus !== 'complete') return 'verify-id';
  if (riskStatus === 'pending') return 'assess-risk';
  if (!hasMatter && poidPassed && paymentCompleted) return 'open-matter';
  if (hasMatter) return 'draft-ccl';
  return 'complete';
}

// Main route: GET /api/instructions
// Returns comprehensive instruction data with all related entities and computed business logic
router.get('/', async (req, res) => {
  const requestId = Date.now().toString(36);
  console.log(`🔵 [${requestId}] UNIFIED INSTRUCTIONS ROUTE CALLED`);
  console.log(`🔍 [${requestId}] Query parameters:`, req.query);
  console.log(`🔍 [${requestId}] Request URL:`, req.url);
  console.log(`🔍 [${requestId}] Request method:`, req.method);
  
  try {
    const { initials, includeAll } = req.query;
    console.log(`� [${requestId}] Processed params:`, { initials, includeAll });

    console.log(`🔌 [${requestId}] Establishing database connection...`);
    const pool = await ensureDbConnection();
    console.log(`✅ [${requestId}] Database connection established successfully`);

    console.log(`🔍 [${requestId}] Executing comprehensive SQL query...`);
    const startTime = Date.now();

    // Single comprehensive query with JOINs to get all related data efficiently
    const query = `
      WITH InstructionData AS (
        SELECT 
          i.*,
          d.DealId, d.ServiceDescription, d.Status as DealStatus, d.PitchedBy,
          d.LeadClientEmail, d.DealValue, d.DatePitched, d.Email as DealEmail,
          doc.DocumentId, doc.FileName, doc.FilePath, doc.UploadedAt, doc.FileSize,
          doc.DocumentType, doc.ClientEmail as DocClientEmail,
          id.InternalId as IDVerificationId, id.EIDStatus, id.EIDOverallResult, 
          id.EIDCheckedDate, id.PEPAndSanctionsCheckResult, id.AddressVerificationResult,
          ra.ComplianceDate, ra.RiskAssessmentResult, ra.MLRORisk, ra.SanctionsRisk,
          jc.DealJointClientId, jc.ClientEmail as JointClientEmail, jc.HasSubmitted,
          jc.SubmissionDateTime, jc.FirstName as JointFirstName, jc.LastName as JointLastName,
          m.MatterID, m.MatterType, m.Status as MatterStatus
        FROM Instructions i
        LEFT JOIN Deals d ON d.InstructionRef = i.InstructionRef
        LEFT JOIN Documents doc ON doc.InstructionRef = i.InstructionRef
        LEFT JOIN IDVerifications id ON id.InstructionRef = i.InstructionRef
        LEFT JOIN RiskAssessment ra ON ra.InstructionRef = i.InstructionRef
        LEFT JOIN DealJointClients jc ON jc.DealId = d.DealId
        LEFT JOIN Matters m ON m.InstructionRef = i.InstructionRef
        WHERE (@initials IS NULL OR i.HelixContact = @initials)
        AND (@includeAll = 'true' OR @initials IS NOT NULL OR i.HelixContact IS NOT NULL)
      )
      SELECT * FROM InstructionData
      ORDER BY InstructionRef DESC, DocumentId, InternalId, ComplianceDate DESC
    `;

    const result = await pool.request()
      .input('initials', sql.NVarChar, initials || null)
      .input('includeAll', sql.NVarChar, includeAll || 'false')
      .query(query);

    const queryTime = Date.now() - startTime;
    console.log(`✅ [${requestId}] Query executed in ${queryTime}ms`);
    console.log(`📊 [${requestId}] Raw result count: ${result.recordset?.length || 0} rows`);

    console.log(`🔄 [${requestId}] Processing and transforming results...`);

    // Transform flat result set into structured data
    const instructionMap = new Map();
    const rows = result.recordset || [];

    rows.forEach(row => {
      const instructionRef = row.InstructionRef;
      
      if (!instructionMap.has(instructionRef)) {
        // Initialize instruction with base data
        instructionMap.set(instructionRef, {
          instruction: {
            InstructionRef: row.InstructionRef,
            FirstName: row.FirstName,
            LastName: row.LastName,
            Forename: row.Forename,
            Surname: row.Surname,
            Email: row.Email,
            Phone: row.Phone,
            CompanyName: row.CompanyName,
            DateOfEnquiry: row.DateOfEnquiry,
            Stage: row.Stage,
            MatterId: row.MatterId,
            PaymentResult: row.PaymentResult,
            PassportNumber: row.PassportNumber,
            DriversLicenseNumber: row.DriversLicenseNumber,
            HelixContact: row.HelixContact,
          },
          deals: [],
          documents: [],
          idVerifications: [],
          riskAssessments: [],
          jointClients: [],
          matters: []
        });
      }

      const instructionData = instructionMap.get(instructionRef);

      // Add deal data (avoid duplicates)
      if (row.DealId && !instructionData.deals.find(d => d.DealId === row.DealId)) {
        instructionData.deals.push({
          DealId: row.DealId,
          InstructionRef: row.InstructionRef,
          ServiceDescription: row.ServiceDescription,
          Status: row.DealStatus,
          PitchedBy: row.PitchedBy,
          LeadClientEmail: row.LeadClientEmail,
          DealValue: row.DealValue,
          DatePitched: row.DatePitched,
          Email: row.DealEmail
        });
      }

      // Add document data (avoid duplicates)
      if (row.DocumentId && !instructionData.documents.find(d => d.DocumentId === row.DocumentId)) {
        instructionData.documents.push({
          DocumentId: row.DocumentId,
          InstructionRef: row.InstructionRef,
          FileName: row.FileName,
          FilePath: row.FilePath,
          UploadedAt: row.UploadedAt,
          FileSize: row.FileSize,
          DocumentType: row.DocumentType,
          ClientEmail: row.DocClientEmail
        });
      }

      // Add ID verification data (avoid duplicates)
      if (row.IDVerificationId && !instructionData.idVerifications.find(id => id.InternalId === row.IDVerificationId)) {
        instructionData.idVerifications.push({
          InternalId: row.IDVerificationId,
          InstructionRef: row.InstructionRef,
          EIDStatus: row.EIDStatus,
          EIDOverallResult: row.EIDOverallResult,
          EIDCheckedDate: row.EIDCheckedDate,
          PEPAndSanctionsCheckResult: row.PEPAndSanctionsCheckResult,
          AddressVerificationResult: row.AddressVerificationResult
        });
      }

      // Add risk assessment data (avoid duplicates)
      if (row.ComplianceDate && !instructionData.riskAssessments.find(r => 
        r.InstructionRef === row.InstructionRef && r.ComplianceDate === row.ComplianceDate)) {
        instructionData.riskAssessments.push({
          InstructionRef: row.InstructionRef,
          ComplianceDate: row.ComplianceDate,
          RiskAssessmentResult: row.RiskAssessmentResult,
          MLRORisk: row.MLRORisk,
          SanctionsRisk: row.SanctionsRisk
        });
      }

      // Add joint client data (avoid duplicates)
      if (row.DealJointClientId && !instructionData.jointClients.find(jc => jc.DealJointClientId === row.DealJointClientId)) {
        instructionData.jointClients.push({
          DealJointClientId: row.DealJointClientId,
          DealId: row.DealId,
          ClientEmail: row.JointClientEmail,
          HasSubmitted: row.HasSubmitted,
          SubmissionDateTime: row.SubmissionDateTime,
          FirstName: row.JointFirstName,
          LastName: row.JointLastName
        });
      }

      // Add matter data (avoid duplicates)
      if (row.MatterID && !instructionData.matters.find(m => m.MatterID === row.MatterID)) {
        instructionData.matters.push({
          MatterID: row.MatterID,
          InstructionRef: row.InstructionRef,
          MatterType: row.MatterType,
          Status: row.MatterStatus
        });
      }
    });

    // Convert to array and compute business logic server-side
    const instructions = Array.from(instructionMap.values()).map(item => {
      const verificationStatus = computeVerificationStatus(item.instruction, item.idVerifications);
      const riskStatus = computeRiskStatus(item.riskAssessments, item.instruction.InstructionRef);
      const nextAction = computeNextAction(item.instruction, verificationStatus, riskStatus);
      const matterLinked = item.matters.length > 0 || Boolean(item.instruction.MatterId);
      const paymentCompleted = (item.instruction.PaymentResult?.toLowerCase() === 'successful');

      return {
        ...item,
        // Computed business logic fields
        verificationStatus,
        riskStatus,
        nextAction,
        matterLinked,
        paymentCompleted,
        documentCount: item.documents.length,
        // Primary deal for compatibility
        deal: item.deals[0] || null,
        // Primary ID verification
        eid: item.idVerifications[0] || null,
        // Primary risk assessment
        risk: item.riskAssessments[0] || null
      };
    });

    console.log(`✅ [${requestId}] Successfully processed ${instructions.length} instructions with computed business logic`);
    console.log(`📤 [${requestId}] Sending response with clean data structure`);

    const response = {
      instructions,
      count: instructions.length,
      computedServerSide: true,
      timestamp: new Date().toISOString(),
      requestId
    };

    console.log(`🎯 [${requestId}] Response summary:`, {
      instructionCount: instructions.length,
      computedServerSide: response.computedServerSide,
      timestamp: response.timestamp
    });

    res.json(response);

  } catch (err) {
    console.error(`❌ [${requestId}] Error in unified instructions route:`, err.message);
    console.error(`📋 [${requestId}] Full error:`, err);
    console.error(`🔍 [${requestId}] Stack trace:`, err.stack);
    
    res.status(500).json({ 
      error: 'Failed to fetch instruction data',
      detail: err.message,
      instructions: [],
      count: 0,
      requestId,
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint to verify route is working
router.get('/test', async (req, res) => {
  console.log('🧪 Instructions test endpoint called');
  res.json({
    status: 'success',
    message: 'Instructions route is working!',
    timestamp: new Date().toISOString(),
    endpoint: '/api/instructions'
  });
});

module.exports = router;
