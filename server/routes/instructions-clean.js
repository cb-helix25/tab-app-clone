const express = require('express');
const router = express.Router();

// Generate unique request ID for logging
function generateRequestId() {
  return Math.random().toString(36).substring(2, 10);
}

// Test endpoint
router.get('/test', (req, res) => {
  const requestId = generateRequestId();
  console.log(`[${requestId}] Testing instructions route`);
  
  res.json({
    status: 'success',
    message: 'Instructions route is working!',
    timestamp: new Date().toISOString(),
    endpoint: '/api/instructions'
  });
});

// Main instructions endpoint - proxy to VNet fetchInstructionData function
router.get('/', async (req, res) => {
  const requestId = generateRequestId();
  console.log(`[${requestId}] Instructions request:`, {
    query: req.query,
    headers: req.headers['user-agent'],
    ip: req.ip
  });

  try {
    const { initials, prospectId, instructionRef, dealId } = req.query;
    
    // Build the URL to the VNet fetchInstructionData function - match the API function pattern
    const baseUrl = process.env.INSTRUCTIONS_FUNC_BASE_URL || 
                   'https://instructions-vnet-functions.azurewebsites.net/api/fetchInstructionData';
    
    let functionCode = process.env.INSTRUCTIONS_FUNC_CODE;
    if (!functionCode) {
      console.log(`[${requestId}] No direct function code, trying Key Vault...`);
      // For now, we'll need the function code to be provided directly
      // In production, this would use Key Vault like the API function does
      return res.status(500).json({
        error: 'VNet function code not configured',
        detail: 'INSTRUCTIONS_FUNC_CODE environment variable required',
        instructions: [],
        count: 0,
        requestId,
        timestamp: new Date().toISOString()
      });
    }
    
    const params = new URLSearchParams({ code: functionCode });
    if (initials) params.append('initials', initials);
    if (prospectId) params.append('prospectId', prospectId);
    if (instructionRef) params.append('instructionRef', instructionRef);
    if (dealId) params.append('dealId', dealId);
    
    const url = `${baseUrl}?${params.toString()}`;
    
    console.log(`[${requestId}] Calling VNet fetchInstructionData:`, url.replace(functionCode, '[REDACTED]'));
    
    const response = await fetch(url);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`[${requestId}] VNet fetchInstructionData error:`, response.status, errorText);
      return res.status(500).json({
        error: 'Failed to fetch instruction data from VNet',
        detail: `fetchInstructionData returned ${response.status}: ${errorText}`,
        instructions: [],
        count: 0,
        requestId,
        timestamp: new Date().toISOString()
      });
    }
    
    const data = await response.json();
    console.log(`[${requestId}] VNet fetchInstructionData success:`, {
      deals: data.deals?.length || 0,
      instructions: data.instructions?.length || 0,
      documents: data.documents?.length || 0,
      idVerifications: data.idVerifications?.length || 0
    });
    
    // Transform the data to match our frontend expectations with server-side business logic
    const transformedData = {
      instructions: data.instructions || [],
      deals: data.deals || [],
      documents: data.documents || [],
      idVerifications: data.idVerifications || [],
      count: (data.instructions?.length || 0) + (data.deals?.length || 0),
      computedServerSide: true,
      requestId,
      timestamp: new Date().toISOString()
    };
    
    console.log(`[${requestId}] Transformed response:`, {
      instructionCount: transformedData.instructions.length,
      dealCount: transformedData.deals.length,
      documentCount: transformedData.documents.length,
      idVerificationCount: transformedData.idVerifications.length
    });
    
    res.json(transformedData);
    
  } catch (error) {
    console.log(`[${requestId}] Instructions endpoint error:`, error.message);
    res.status(500).json({
      error: 'Failed to fetch instruction data',
      detail: error.message,
      instructions: [],
      count: 0,
      requestId,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
