const { createEnvBasedQueryRunner } = require('./sqlHelpers');

const runInstructionQuery = createEnvBasedQueryRunner('INSTRUCTIONS_SQL_CONNECTION_STRING');

const isVerboseLoggingEnabled = process.env.LOG_VERBOSE === 'true';

const logVerbose = (...args) => {
  if (isVerboseLoggingEnabled) {
    console.debug('[idVerificationDb]', ...args);
  }
};

async function insertIDVerification(instructionRef, email, response, prospectId = null) {
  console.info('[idVerificationDb] Saving ID verification response');
  logVerbose('Raw response:', JSON.stringify(response, null, 2));
  
  const now = new Date();
  
  // Handle case where response is an array (from our API)
  const responseData = Array.isArray(response) ? response[0] : response;
  logVerbose('Response data after array check:', JSON.stringify(responseData, null, 2));
  logVerbose('Response data keys:', Object.keys(responseData || {}));
  logVerbose('Has checkStatuses?', !!responseData?.checkStatuses);
  logVerbose('Has checks?', !!responseData?.checks);
  logVerbose('Has overallResult?', !!responseData?.overallResult);
  
  // Use correlationId from Tiller response as the checkId
  const correlation = responseData.correlationId || responseData.checkId || responseData.id || `manual-${Date.now()}`;
  logVerbose('Using correlation ID:', correlation);
  
  const payload = JSON.stringify(response);
  
  // Parse response for database fields
  const status = responseData.overallStatus?.status || 'Completed';
  logVerbose('Status:', status);
  
  const expiry = response.expiryDate ? new Date(response.expiryDate) : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
  
  // Extract check results from response
  let overall = 'pending';
  let pep = 'pending';
  let address = 'pending';
  
  logVerbose('Checking overallResult:', responseData.overallResult);
  if (responseData.overallResult?.result) {
    overall = responseData.overallResult.result.toLowerCase();
    logVerbose('Found overall result:', overall);
  }
  
  // Debug: Log the exact structure we're checking
  logVerbose('CheckStatuses type:', typeof responseData.checkStatuses);
  logVerbose('CheckStatuses is array:', Array.isArray(responseData.checkStatuses));
  if (responseData.checkStatuses) {
    logVerbose('CheckStatuses length:', responseData.checkStatuses.length);
    logVerbose('First checkStatus keys:', Object.keys(responseData.checkStatuses[0] || {}));
  }
  
  // Check for checkStatuses instead of checks (correct Tiller API structure)
  if (responseData.checkStatuses && Array.isArray(responseData.checkStatuses)) {
    logVerbose('Processing checkStatuses array:', responseData.checkStatuses.length);
    responseData.checkStatuses.forEach((checkStatus, index) => {
      logVerbose(`Processing check ${index + 1} - Type: ${checkStatus.checkTypeId}, Title: ${checkStatus.sourceResults?.title}`);
      logVerbose('Check result object:', JSON.stringify(checkStatus.result, null, 2));
      
      if (checkStatus.checkTypeId === 1) { // Address verification check
        address = (checkStatus.result?.result || 'pending').toLowerCase();
        logVerbose('Address result:', address);
      } else if (checkStatus.checkTypeId === 2) { // PEP & Sanctions check
        pep = (checkStatus.result?.result || 'pending').toLowerCase();
        logVerbose('PEP result:', pep);
      }
    });
  } else if (responseData.checks && Array.isArray(responseData.checks)) {
    // Legacy fallback for old structure
    logVerbose('Processing legacy checks array:', responseData.checks.length);
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
  
  logVerbose(`Final parsed verification: overall=${overall}, pep=${pep}, address=${address}, correlation=${correlation}`);
  
  try {
    const result = await runInstructionQuery((request, s) =>
      request
        .input('InstructionRef', s.NVarChar, instructionRef)
        .input('ProspectId', s.Int, prospectId)
        .input('ClientEmail', s.NVarChar, email)
        .input('IsLeadClient', s.Bit, true)
        .input('EIDCheckId', s.NVarChar, correlation)
        .input('EIDRawResponse', s.NVarChar, payload)
        .input('EIDCheckedDate', s.Date, now)
        .input('EIDCheckedTime', s.Time, now)
        .input('EIDStatus', s.VarChar, status)
        .input('EIDProvider', s.VarChar, 'tiller')
        .input('CheckExpiry', s.Date, expiry)
        .input('EIDOverallResult', s.NVarChar, overall)
        .input('PEPAndSanctionsCheckResult', s.NVarChar, pep)
        .input('AddressVerificationResult', s.NVarChar, address)
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
      `)
    );
    
    console.info('[idVerificationDb] ID verification saved', { instructionRef, correlation });
    
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
