const sql = require('mssql');

async function insertIDVerification(instructionRef, email, response, pool, prospectId = null) {
  console.log('📝 Saving ID verification response to database');
  console.log('📄 Raw response:', JSON.stringify(response, null, 2));
  
  const now = new Date();
  
  // Handle case where response is an array (from our API)
  const responseData = Array.isArray(response) ? response[0] : response;
  console.log('📊 Response data after array check:', JSON.stringify(responseData, null, 2));
  console.log('🔑 Response data keys:', Object.keys(responseData || {}));
  console.log('🔍 Has checkStatuses?', !!responseData?.checkStatuses);
  console.log('🔍 Has checks?', !!responseData?.checks);
  console.log('🔍 Has overallResult?', !!responseData?.overallResult);
  
  // Use correlationId from Tiller response as the checkId
  const correlation = responseData.correlationId || responseData.checkId || responseData.id || `manual-${Date.now()}`;
  console.log('🔑 Using correlation ID:', correlation);
  
  const payload = JSON.stringify(response);
  
  // Parse response for database fields
  const status = responseData.overallStatus?.status || 'Completed';
  console.log('📈 Status:', status);
  
  const expiry = response.expiryDate ? new Date(response.expiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
  
  // Extract check results from response
  let overall = 'pending';
  let pep = 'pending';
  let address = 'pending';
  
  console.log('🔍 Checking overallResult:', responseData.overallResult);
  if (responseData.overallResult?.result) {
    overall = responseData.overallResult.result.toLowerCase();
    console.log('✅ Found overall result:', overall);
  }
  
  // Debug: Log the exact structure we're checking
  console.log('🔍 CheckStatuses type:', typeof responseData.checkStatuses);
  console.log('🔍 CheckStatuses is array:', Array.isArray(responseData.checkStatuses));
  if (responseData.checkStatuses) {
    console.log('🔍 CheckStatuses length:', responseData.checkStatuses.length);
    console.log('🔍 First checkStatus keys:', Object.keys(responseData.checkStatuses[0] || {}));
  }
  
  // Check for checkStatuses instead of checks (correct Tiller API structure)
  if (responseData.checkStatuses && Array.isArray(responseData.checkStatuses)) {
    console.log('🔍 Processing checkStatuses array:', responseData.checkStatuses.length);
    responseData.checkStatuses.forEach((checkStatus, index) => {
      console.log(`📋 Processing check ${index + 1} - Type: ${checkStatus.checkTypeId}, Title: ${checkStatus.sourceResults?.title}`);
      console.log(`📋 Check result object:`, JSON.stringify(checkStatus.result, null, 2));
      
      if (checkStatus.checkTypeId === 1) { // Address verification check
        address = (checkStatus.result?.result || 'pending').toLowerCase();
        console.log('🏠 Address result:', address);
      } else if (checkStatus.checkTypeId === 2) { // PEP & Sanctions check
        pep = (checkStatus.result?.result || 'pending').toLowerCase();
        console.log('👤 PEP result:', pep);
      }
    });
  } else if (responseData.checks && Array.isArray(responseData.checks)) {
    // Legacy fallback for old structure
    console.log('🔍 Processing legacy checks array:', responseData.checks.length);
    responseData.checks.forEach(check => {
      if (check.checkTypeId === 1) { // Identity check
        overall = check.result?.result || overall;
        
        // Look for PEP and address results in the detailed breakdown
        if (check.detail && check.detail.reasons) {
          check.detail.reasons.forEach(reason => {
            if (reason.key && reason.key.toLowerCase().includes('mortality')) {
              pep = reason.result || 'pending';
            }
            if (reason.key && (reason.key.toLowerCase().includes('address') || reason.key.toLowerCase().includes('name and address'))) {
              address = reason.result || 'pending';
            }
          });
        }
      }
    });
  }
  
  console.log(`📊 Final parsed verification: overall=${overall}, pep=${pep}, address=${address}, correlation=${correlation}`);
  
  try {
    const result = await pool.request()
      .input('InstructionRef', sql.NVarChar, instructionRef)
      .input('ProspectId', sql.Int, prospectId) // Use provided prospectId
      .input('ClientEmail', sql.NVarChar, email)
      .input('IsLeadClient', sql.Bit, true)
      .input('EIDCheckId', sql.NVarChar, correlation)
      .input('EIDRawResponse', sql.NVarChar, payload)
      .input('EIDCheckedDate', sql.Date, now)
      .input('EIDCheckedTime', sql.Time, now)
      .input('EIDStatus', sql.VarChar, status)
      .input('EIDProvider', sql.VarChar, 'tiller')
      .input('CheckExpiry', sql.Date, expiry)
      .input('EIDOverallResult', sql.NVarChar, overall)
      .input('PEPAndSanctionsCheckResult', sql.NVarChar, pep)
      .input('AddressVerificationResult', sql.NVarChar, address)
      .query(`
        INSERT INTO [dbo].[IDVerifications] (
            InstructionRef,
            ProspectId,
            ClientEmail,
            IsLeadClient,
            EIDCheckId,
            EIDRawResponse,
            EIDCheckedDate,
            EIDCheckedTime,
            EIDStatus,
            EIDProvider,
            CheckExpiry,
            EIDOverallResult,
            PEPAndSanctionsCheckResult,
            AddressVerificationResult
        ) VALUES (
            @InstructionRef,
            @ProspectId,
            @ClientEmail,
            @IsLeadClient,
            @EIDCheckId,
            @EIDRawResponse,
            @EIDCheckedDate,
            @EIDCheckedTime,
            @EIDStatus,
            @EIDProvider,
            @CheckExpiry,
            @EIDOverallResult,
            @PEPAndSanctionsCheckResult,
            @AddressVerificationResult
        )
      `);
    
    console.log('✅ ID verification saved to database');
    
    return {
      success: true,
      checkId: correlation,
      status,
      overall,
      pep,
      address
    };
  } catch (error) {
    console.error('❌ Failed to insert ID verification:', error);
    throw error;
  }
}

module.exports = { insertIDVerification };
