const express = require('express');
const { getSecret } = require('../utils/getSecret');
const sql = require('mssql');
const router = express.Router();

// Database connection configuration
let dbConfig = null;

async function getDbConfig() {
  if (dbConfig) return dbConfig;
  
  // Use the INSTRUCTIONS_SQL_CONNECTION_STRING from .env
  const connectionString = process.env.INSTRUCTIONS_SQL_CONNECTION_STRING;
  if (!connectionString) {
    throw new Error('INSTRUCTIONS_SQL_CONNECTION_STRING not found in environment');
  }
  
  // Parse connection string into config object
  const params = new URLSearchParams(connectionString.split(';').join('&'));
  const server = params.get('Server').replace('tcp:', '').split(',')[0];
  const database = params.get('Initial Catalog');
  const user = params.get('User ID');
  const password = params.get('Password');
  
  dbConfig = {
    server,
    database, 
    user,
    password,
    options: {
      encrypt: true,
      trustServerCertificate: false,
      connectTimeout: 30000,
      requestTimeout: 30000
    }
  };
  
  return dbConfig;
}

// Generate unique request ID for logging
function generateRequestId() {
  return Math.random().toString(36).substring(2, 10);
}

// Test direct database connection
router.get('/test-db', async (req, res) => {
  const requestId = generateRequestId();
  // Testing direct database connection

  try {
    const config = await getDbConfig();
    const pool = new sql.ConnectionPool(config);
    await pool.connect();
    
    // Test query - get a few deals to verify connection
    const result = await pool.request()
      .query('SELECT TOP 3 DealId, ProspectId, ServiceDescription, InstructionRef FROM Deals ORDER BY DealId DESC');
    
    await pool.close();

    res.json({
      status: 'success',
      message: 'Direct database connection working!',
      data: {
        rowCount: result.recordset.length,
        sampleDeals: result.recordset,
        connectionInfo: {
          server: config.server,
          database: config.database
        }
      },
      requestId,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`[${requestId}] Database test failed`, error);
    res.status(500).json({
      status: 'error',
      message: 'Direct database connection failed',
      error: error.message,
      requestId,
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint
router.get('/test', (req, res) => {
  const requestId = generateRequestId();
  // Instructions route
  
  res.json({
    status: 'success',
    message: 'Instructions route is working!',
    timestamp: new Date().toISOString(),
    endpoint: '/api/instructions'
  });
});

// Main instructions endpoint - direct database access
router.get('/', async (req, res) => {
  const requestId = generateRequestId();
  // Instructions request (direct DB)

  // Handle deal update via query parameters (workaround for route issues)
  if (req.query.updateDeal && req.query.dealId) {
    // Deal update via query
    try {
      const dealId = parseInt(req.query.dealId);
      const updates = JSON.parse(req.query.updates || '{}');
      
      const config = await getDbConfig();
      const pool = new sql.ConnectionPool(config);
      await pool.connect();
      
      // Build dynamic update query
      const updateParts = [];
      const request = pool.request().input('dealId', sql.Int, dealId);
      
      if (updates.ServiceDescription !== undefined) {
        updateParts.push('ServiceDescription = @serviceDescription');
        request.input('serviceDescription', sql.NVarChar, updates.ServiceDescription);
      }
      
      if (updates.Amount !== undefined) {
        updateParts.push('Amount = @amount');
        request.input('amount', sql.Decimal(18, 2), updates.Amount);
      }
      
      // Do not assume UpdatedAt column exists
      
      const updateQuery = `UPDATE Deals SET ${updateParts.join(', ')} WHERE DealId = @dealId`;
      // Executing update
      
      const result = await request.query(updateQuery);
      
      if (result.rowsAffected[0] === 0) {
        return res.status(404).json({ error: 'Deal not found', requestId });
      }
      
      // Deal updated successfully
      return res.json({ success: true, updated: true, dealId, requestId });
      
    } catch (error) {
      console.error(`[${requestId}] ❌ Update error`, error);
      return res.status(500).json({ error: 'Update failed', details: error.message, requestId });
    }
  }

  try {
    const config = await getDbConfig();
    const pool = new sql.ConnectionPool(config);
    await pool.connect();

    const initials = req.query.initials;
    const prospectId = req.query.prospectId && Number(req.query.prospectId);
    const instructionRef = req.query.instructionRef;
    const dealId = req.query.dealId && Number(req.query.dealId);

    // Query params processed

    // ─── Deals pitched by this user with related data ────────────────────
    let deals = [];
    if (initials) {
      const dealsResult = await pool.request()
        .input('initials', sql.NVarChar, initials)
        .query('SELECT * FROM Deals WHERE PitchedBy=@initials ORDER BY DealId DESC');
      deals = dealsResult.recordset || [];
    } else {
      const dealsResult = await pool.request()
        .query('SELECT * FROM Deals ORDER BY DealId DESC');
      deals = dealsResult.recordset || [];
    }

    // Deals count

    for (const d of deals) {
      const jointRes = await pool.request()
        .input('dealId', sql.Int, d.DealId)
        .query('SELECT * FROM DealJointClients WHERE DealId=@dealId ORDER BY DealJointClientId');
      d.jointClients = jointRes.recordset || [];

      if (d.InstructionRef) {
        const instRes = await pool.request()
          .input('ref', sql.NVarChar, d.InstructionRef)
          .query('SELECT * FROM Instructions WHERE InstructionRef=@ref');
        const inst = instRes.recordset[0] || null;
        if (inst) {
          const docRes = await pool.request()
            .input('ref', sql.NVarChar, d.InstructionRef)
            .query('SELECT * FROM Documents WHERE InstructionRef=@ref ORDER BY DocumentId');
          inst.documents = docRes.recordset || [];

          const riskRes = await pool.request()
            .input('ref', sql.NVarChar, d.InstructionRef)
            .query('SELECT * FROM IDVerifications WHERE InstructionRef=@ref ORDER BY InternalId DESC');
          inst.idVerifications = riskRes.recordset || [];

          const riskAssessRes = await pool.request()
            .input('ref', sql.NVarChar, d.InstructionRef)
            .query('SELECT * FROM RiskAssessment WHERE InstructionRef=@ref ORDER BY ComplianceDate DESC');
          inst.riskAssessments = riskAssessRes.recordset || [];
          d.instruction = inst;
        }
      }
    }

    // ─── Single deal by ID when requested ───────────────────────────────
    let deal = null;
    if (dealId != null) {
      const dealRes = await pool.request()
        .input('dealId', sql.Int, dealId)
        .query('SELECT * FROM Deals WHERE DealId=@dealId');
      deal = dealRes.recordset[0] || null;
      if (deal) {
        const jointRes = await pool.request()
          .input('dealId', sql.Int, dealId)
          .query('SELECT * FROM DealJointClients WHERE DealId=@dealId ORDER BY DealJointClientId');
        deal.jointClients = jointRes.recordset || [];

        if (deal.InstructionRef) {
          const instRes = await pool.request()
            .input('ref', sql.NVarChar, deal.InstructionRef)
            .query('SELECT * FROM Instructions WHERE InstructionRef=@ref');
          const inst = instRes.recordset[0] || null;
          if (inst) {
            const docRes = await pool.request()
              .input('ref', sql.NVarChar, deal.InstructionRef)
              .query('SELECT * FROM Documents WHERE InstructionRef=@ref ORDER BY DocumentId');
            inst.documents = docRes.recordset || [];

            const riskRes = await pool.request()
              .input('ref', sql.NVarChar, deal.InstructionRef)
              .query('SELECT * FROM IDVerifications WHERE InstructionRef=@ref ORDER BY InternalId DESC');
            inst.idVerifications = riskRes.recordset || [];

            const riskAssessRes = await pool.request()
              .input('ref', sql.NVarChar, deal.InstructionRef)
              .query('SELECT * FROM RiskAssessment WHERE InstructionRef=@ref ORDER BY ComplianceDate DESC');
            inst.riskAssessments = riskAssessRes.recordset || [];
            deal.instruction = inst;
          }
        }
      }
    }

    // ─── Instructions for this user ──────────────────────────────────────
    let instructions = [];
    const allIdVerifications = [];
    if (initials) {
      const instrResult = await pool.request()
        .input('initials', sql.NVarChar, initials)
        .query('SELECT * FROM Instructions WHERE HelixContact=@initials ORDER BY InstructionRef DESC');
      instructions = instrResult.recordset || [];
    } else {
      const instrResult = await pool.request()
        .query('SELECT * FROM Instructions ORDER BY InstructionRef DESC');
      instructions = instrResult.recordset || [];
    }

    // Instructions count

    for (const inst of instructions) {
      const docRes = await pool.request()
        .input('ref', sql.NVarChar, inst.InstructionRef)
        .query('SELECT * FROM Documents WHERE InstructionRef=@ref ORDER BY DocumentId');
      inst.documents = docRes.recordset || [];

      const riskRes = await pool.request()
        .input('ref', sql.NVarChar, inst.InstructionRef)
        .query('SELECT * FROM IDVerifications WHERE InstructionRef=@ref ORDER BY InternalId DESC');
      inst.idVerifications = riskRes.recordset || [];

      const riskAssessRes = await pool.request()
        .input('ref', sql.NVarChar, inst.InstructionRef)
        .query('SELECT * FROM RiskAssessment WHERE InstructionRef=@ref ORDER BY ComplianceDate DESC');
      inst.riskAssessments = riskAssessRes.recordset || [];
      allIdVerifications.push(...inst.idVerifications);

      // Fetch matter data to populate MatterId
      const matterRes = await pool.request()
        .input('ref', sql.NVarChar, inst.InstructionRef)
        .query('SELECT MatterID, DisplayNumber FROM Matters WHERE InstructionRef=@ref ORDER BY OpenDate DESC');
      const matter = matterRes.recordset[0];
      if (matter) {
        inst.MatterId = matter.MatterID;
        inst.DisplayNumber = matter.DisplayNumber;
        inst.matters = [matter]; // Also provide as array for compatibility
      }

      const dealRes = await pool.request()
        .input('ref', sql.NVarChar, inst.InstructionRef)
        .query('SELECT * FROM Deals WHERE InstructionRef=@ref');
      const d = dealRes.recordset[0];
      if (d) {
        const jointRes = await pool.request()
          .input('dealId', sql.Int, d.DealId)
          .query('SELECT * FROM DealJointClients WHERE DealId=@dealId ORDER BY DealJointClientId');
        d.jointClients = jointRes.recordset || [];
        inst.deal = d;
      }

      // Fetch payment data
      const paymentRes = await pool.request()
        .input('ref', sql.NVarChar, inst.InstructionRef)
        .query('SELECT * FROM Payments WHERE instruction_ref=@ref ORDER BY created_at DESC');
      inst.payments = paymentRes.recordset || [];
    }

    // ─── Single instruction by reference when requested ─────────────────
    let instruction = null;
    if (instructionRef) {
      const instRes = await pool.request()
        .input('ref', sql.NVarChar, instructionRef)
        .query('SELECT * FROM Instructions WHERE InstructionRef=@ref');
      instruction = instRes.recordset[0] || null;

      if (instruction) {
        const docRes = await pool.request()
          .input('ref', sql.NVarChar, instructionRef)
          .query('SELECT * FROM Documents WHERE InstructionRef=@ref ORDER BY DocumentId');
        instruction.documents = docRes.recordset || [];

        const riskRes = await pool.request()
          .input('ref', sql.NVarChar, instructionRef)
          .query('SELECT * FROM IDVerifications WHERE InstructionRef=@ref ORDER BY InternalId DESC');
        instruction.idVerifications = riskRes.recordset || [];

        const riskAssessRes = await pool.request()
          .input('ref', sql.NVarChar, instructionRef)
          .query('SELECT * FROM RiskAssessment WHERE InstructionRef=@ref ORDER BY ComplianceDate DESC');
        instruction.riskAssessments = riskAssessRes.recordset || [];

        // Fetch matter data to populate MatterId
        const matterRes = await pool.request()
          .input('ref', sql.NVarChar, instructionRef)
          .query('SELECT MatterID, DisplayNumber FROM Matters WHERE InstructionRef=@ref ORDER BY OpenDate DESC');
        const matter = matterRes.recordset[0];
        if (matter) {
          instruction.MatterId = matter.MatterID;
          instruction.DisplayNumber = matter.DisplayNumber;
          instruction.matters = [matter]; // Also provide as array for compatibility
        }

        const dealRes = await pool.request()
          .input('ref', sql.NVarChar, instructionRef)
          .query('SELECT * FROM Deals WHERE InstructionRef=@ref');
        const d = dealRes.recordset[0];
        if (d) {
          const jointRes = await pool.request()
            .input('dealId', sql.Int, d.DealId)
            .query('SELECT * FROM DealJointClients WHERE DealId=@dealId ORDER BY DealJointClientId');
          d.jointClients = jointRes.recordset || [];
          instruction.deal = d;
        }

        // Fetch payment data
        const paymentRes = await pool.request()
          .input('ref', sql.NVarChar, instructionRef)
          .query('SELECT * FROM Payments WHERE instruction_ref=@ref ORDER BY created_at DESC');
        instruction.payments = paymentRes.recordset || [];
      }
    }

    // ─── ID verifications by ProspectId or instruction refs ─────────────
    let idVerifications = [];
    if (prospectId != null) {
      const riskRes = await pool.request()
        .input('pid', sql.Int, prospectId)
        .query('SELECT * FROM IDVerifications WHERE ProspectId=@pid ORDER BY InternalId DESC');
      idVerifications = riskRes.recordset || [];
    } else if (initials) {
      idVerifications = allIdVerifications;
    } else {
      const riskRes = await pool.request()
        .query('SELECT * FROM IDVerifications ORDER BY InternalId DESC');
      idVerifications = riskRes.recordset || [];
    }

    // ─── Documents by instruction ref when requested ────────────────────
    let documents = [];
    if (instructionRef && !instruction) {
      const docRes = await pool.request()
        .input('ref', sql.NVarChar, instructionRef)
        .query('SELECT * FROM Documents WHERE InstructionRef=@ref ORDER BY DocumentId');
      documents = docRes.recordset || [];
    } else if (!instructionRef) {
      const docRes = await pool.request()
        .query('SELECT * FROM Documents ORDER BY DocumentId');
      documents = docRes.recordset || [];
    }

    await pool.close();

    // Instruction data fetched

    // Transform the data to match frontend expectations
    // The frontend expects all items in a single 'instructions' array
    const transformedInstructions = [];
    
    // Add real instructions to the array
    instructions.forEach(inst => {
      transformedInstructions.push({
        ...inst,
        isRealInstruction: true,
        deal: inst.deal || null,
        documents: inst.documents || [],
        idVerifications: inst.idVerifications || [],
        riskAssessments: inst.riskAssessments || [],
        payments: inst.payments || []
      });
    });
    
    // Add standalone deals (deals without instructions) to the same array
    const standaloneDeals = deals.filter(deal => {
      // Only include deals that don't have a corresponding instruction
      const hasInstruction = deal.InstructionRef && instructions.some(inst => inst.InstructionRef === deal.InstructionRef);
      return !hasInstruction;
    });
    
    standaloneDeals.forEach(deal => {
      transformedInstructions.push({
        InstructionRef: `deal-${deal.DealId}`,
        isRealInstruction: false,
        deal: deal,
        documents: [],
        idVerifications: [],
        riskAssessments: [],
        payments: []
      });
    });

    // Transformed data prepared

    const transformedData = {
      instructions: transformedInstructions, // All items in single array as expected by frontend
      deals,
      deal,
      instruction,
      idVerifications,
      documents,
      count: transformedInstructions.length,
      computedServerSide: true,
      directDatabase: true,
      requestId,
      timestamp: new Date().toISOString()
    };

    res.json(transformedData);

  } catch (error) {
    console.error(`[${requestId}] Direct database instruction fetch failed`, error);
    res.status(500).json({
      error: 'Failed to fetch instruction data from database',
      detail: error.message,
      instructions: [],
      deals: [],
      count: 0,
      requestId,
      timestamp: new Date().toISOString()
    });
  }
});

// Test endpoint to verify routes are working
router.get('/test-route', async (req, res) => {
  const requestId = generateRequestId();
  // Test route hit
  res.json({ message: 'Route is working', requestId, timestamp: new Date().toISOString() });
});

// Update deal endpoint - Added for deal editing functionality
router.put('/deals/:dealId', async (req, res) => {
  const requestId = generateRequestId();
  const dealId = parseInt(req.params.dealId);
  const { ServiceDescription, Amount } = req.body;
  
  // Deal update request
  
  if (!dealId || (!ServiceDescription && Amount === undefined)) {
    return res.status(400).json({ error: 'Deal ID and at least one field to update are required', requestId });
  }

  try {
    const config = await getDbConfig();
    const pool = await sql.connect(config);
    
    // Build dynamic update query based on provided fields
    const updates = [];
    const request = pool.request().input('dealId', sql.Int, dealId);
    
    if (ServiceDescription !== undefined) {
      updates.push('ServiceDescription = @serviceDescription');
      request.input('serviceDescription', sql.NVarChar, ServiceDescription);
    }
    
    if (Amount !== undefined) {
      updates.push('Amount = @amount');
      request.input('amount', sql.Decimal(18, 2), Amount);
    }
    
    // Add updated timestamp
    updates.push('UpdatedAt = GETDATE()');
    
    const updateQuery = `
      UPDATE Deals 
      SET ${updates.join(', ')} 
      WHERE DealId = @dealId
    `;
    
    // Executing update query
    
    const result = await request.query(updateQuery);
    
    if (result.rowsAffected[0] === 0) {
      return res.status(404).json({ error: 'Deal not found', requestId });
    }
    
    // Fetch the updated deal to return
    const updatedDealQuery = `
      SELECT DealId, ServiceDescription, Amount, UpdatedAt 
      FROM Deals 
      WHERE DealId = @dealId
    `;
    
    const updatedResult = await pool.request()
      .input('dealId', sql.Int, dealId)
      .query(updatedDealQuery);
    
    
    res.json({
      success: true,
      deal: updatedResult.recordset[0],
      requestId
    });
    
  } catch (error) {
    console.error(`[${requestId}] ❌ Error updating deal`, error);
    res.status(500).json({ error: 'Failed to update deal', details: error.message, requestId });
  }
});

module.exports = router;
