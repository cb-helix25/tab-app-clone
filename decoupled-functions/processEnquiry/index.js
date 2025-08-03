const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');
const sql = require('mssql');
const { getSqlPool } = require('../sqlClient');

const keyVaultName = process.env.KEY_VAULT_NAME;
if (!keyVaultName && !process.env.KEY_VAULT_URL) {
  throw new Error('Key Vault not specified! Set KEY_VAULT_NAME or KEY_VAULT_URL');
}
const vaultUrl = process.env.KEY_VAULT_URL || `https://${keyVaultName}.vault.azure.net/`;
const credential = new DefaultAzureCredential();
const secretClient = new SecretClient(vaultUrl, credential);
let passwordPromise;

async function ensureDbPassword() {
  if (process.env.DB_PASSWORD) return process.env.DB_PASSWORD;
  if (!passwordPromise) {
    const secretName = process.env.DB_PASSWORD_SECRET || 'instructionsadmin-password';
    passwordPromise = secretClient.getSecret(secretName).then(s => {
      process.env.DB_PASSWORD = s.value;
      return s.value;
    });
  }
  return passwordPromise;
}

// ──────────────────────────────────────────────────────────────────────────────
// SOURCE SCHEMA MAPPINGS - Add new sources here as they're integrated
// Database Schema: [id] [datetime] [stage] [claim] [poc] [pitch] [aow] [tow] [moc] 
//                  [rep] [first] [last] [email] [phone] [value] [notes] [rank] 
//                  [rating] [acid] [card_id] [source] [url] [contact_referrer] 
//                  [company_referrer] [gclid]
// ──────────────────────────────────────────────────────────────────────────────

const SOURCE_MAPPINGS = {
  'cta_processing': {
    // Maps fields from the C# cta_processing function output
    datetime: (data) => data.Date_Created || data.dateCreated || new Date(),
    stage: (data) => 'new enquiry',
    claim: (data) => null, // Will be set later when claimed
    poc: (data) => data.Point_of_Contact || data.pointOfContact || 'team@helix-law.com',
    pitch: (data) => null, // Will be set later when pitch is assigned
    aow: (data) => data.Area_of_Work || data.areaOfWork || data.formType || null,
    tow: (data) => null, // Type of work - will be refined later
    moc: (data) => data.Method_of_Contact || data.methodOfContact || 'web form',
    rep: (data) => null, // Representative - assigned later
    first: (data) => data.First_Name || data.firstName || data.first_name || null,
    last: (data) => data.Last_Name || data.lastName || data.last_name || null,
    email: (data) => data.Email || data.email || null,
    phone: (data) => data.Phone_Number || data.phoneNumber || data.phone || null,
    value: (data) => data.Value || data.value || data.amountRange || null,
    notes: (data) => data.Initial_first_call_notes || data.initialNotes || data.details || null,
    rank: (data) => data.Gift_Rank || data.giftRank || '4',
    rating: (data) => null, // Will be set after initial contact
    acid: (data) => data.ID || data.contactId || null, // ActiveCampaign ID
    card_id: (data) => null, // Card ID - set later if applicable
    source: (data) => data.source || 'cta_processing',
    url: (data) => data.Referral_URL || data.referralUrl || data.formUrl || null,
    contact_referrer: (data) => null, // Individual referrer
    company_referrer: (data) => null, // Company referrer  
    gclid: (data) => data.gclid || (data.url && data.url.includes('gclid') ? extractGclid(data.url) : null)
  },

  'web_form': {
    // Example mapping for direct web form submissions
    datetime: (data) => data.submissionDate ? new Date(data.submissionDate) : new Date(),
    stage: (data) => 'new enquiry',
    claim: (data) => null,
    poc: (data) => data.assignedTo || 'team@helix-law.com',
    pitch: (data) => null,
    aow: (data) => data.practiceArea || data.serviceType || 'general',
    tow: (data) => data.typeOfWork || null,
    moc: (data) => 'web form',
    rep: (data) => null,
    first: (data) => data.firstName || data.first_name || null,
    last: (data) => data.lastName || data.last_name || null,
    email: (data) => data.email || data.contactEmail || null,
    phone: (data) => data.phone || data.phoneNumber || null,
    value: (data) => data.estimatedValue || null,
    notes: (data) => data.message || data.notes || data.enquiry || null,
    rank: (data) => data.priority || '4',
    rating: (data) => null,
    acid: (data) => data.activecampaignId || null,
    card_id: (data) => null,
    source: (data) => 'web_form',
    url: (data) => data.referrerUrl || data.pageUrl || null,
    contact_referrer: (data) => data.referredBy || null,
    company_referrer: (data) => data.referringCompany || null,
    gclid: (data) => data.gclid || (data.referrerUrl && data.referrerUrl.includes('gclid') ? extractGclid(data.referrerUrl) : null)
  },

  'phone_enquiry': {
    // Example mapping for phone enquiries
    datetime: (data) => data.callDate ? new Date(data.callDate) : new Date(),
    stage: (data) => 'new enquiry',
    claim: (data) => null,
    poc: (data) => data.handledBy || 'reception',
    pitch: (data) => null,
    aow: (data) => data.practiceArea || 'general',
    tow: (data) => data.typeOfWork || null,
    moc: (data) => 'phone call',
    rep: (data) => data.assignedRep || null,
    first: (data) => data.callerFirstName || data.firstName || null,
    last: (data) => data.callerLastName || data.lastName || null,
    email: (data) => data.email || null,
    phone: (data) => data.callerPhone || data.phone || null,
    value: (data) => data.estimatedValue || null,
    notes: (data) => data.callNotes || data.notes || null,
    rank: (data) => data.urgency || '4',
    rating: (data) => null,
    acid: (data) => null,
    card_id: (data) => null,
    source: (data) => 'phone_enquiry',
    url: (data) => data.referralSource || null,
    contact_referrer: (data) => data.referredByContact || null,
    company_referrer: (data) => data.referredByCompany || null,
    gclid: (data) => null
  },

  'generic': {
    // Fallback mapping for unknown sources - tries common field names
    datetime: (data) => data.datetime || data.date || data.timestamp ? new Date(data.datetime || data.date || data.timestamp) : new Date(),
    stage: (data) => data.stage || 'new enquiry',
    claim: (data) => data.claim || null,
    poc: (data) => data.poc || data.pointOfContact || data.assignedTo || 'team@helix-law.com',
    pitch: (data) => data.pitch || null,
    aow: (data) => data.aow || data.areaOfWork || data.practice || data.service || 'general',
    tow: (data) => data.tow || data.typeOfWork || null,
    moc: (data) => data.moc || data.methodOfContact || data.channel || 'unknown',
    rep: (data) => data.rep || data.representative || null,
    first: (data) => data.first || data.firstName || data.first_name || data.fname || null,
    last: (data) => data.last || data.lastName || data.last_name || data.lname || null,
    email: (data) => data.email || data.emailAddress || null,
    phone: (data) => data.phone || data.phoneNumber || data.tel || null,
    value: (data) => data.value || data.amount || data.estimatedValue || null,
    notes: (data) => data.notes || data.message || data.details || null,
    rank: (data) => data.rank || data.priority || '4',
    rating: (data) => data.rating || null,
    acid: (data) => data.acid || data.activecampaignId || data.contactId || null,
    card_id: (data) => data.card_id || data.cardId || null,
    source: (data) => data.source || 'generic',
    url: (data) => data.url || data.referralUrl || null,
    contact_referrer: (data) => data.contact_referrer || data.referredBy || null,
    company_referrer: (data) => data.company_referrer || data.referringCompany || null,
    gclid: (data) => data.gclid || (data.url && data.url.includes('gclid') ? extractGclid(data.url) : null)
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// DATA TRANSFORMATION UTILITIES
// ──────────────────────────────────────────────────────────────────────────────

function extractGclid(url) {
  if (!url) return null;
  const match = url.match(/[?&]gclid=([^&]+)/);
  return match ? match[1] : null;
}

function transformPhoneNumber(phone) {
  if (!phone) return null;
  
  // Remove all non-digits
  const digitsOnly = phone.replace(/\D/g, '');
  
  // UK phone number transformations
  if (digitsOnly.startsWith('07') && digitsOnly.length === 11) {
    return `+44${digitsOnly.substring(1)}`;
  } else if (digitsOnly.startsWith('447') && digitsOnly.length === 12) {
    return `+${digitsOnly}`;
  }
  
  return phone; // Return original if no transformation needed
}

function transformName(name) {
  if (!name) return null;
  
  // Title case transformation
  return name.toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

function transformEmail(email) {
  if (!email) return null;
  return email.toLowerCase().trim();
}

function validateRank(rank) {
  const validRanks = ['1', '2', '3', '4', '5'];
  return validRanks.includes(String(rank)) ? String(rank) : '4';
}

function ensureDateTime(dateValue) {
  if (!dateValue) return new Date();
  if (dateValue instanceof Date) return dateValue;
  if (typeof dateValue === 'string') {
    // Try parsing the date string
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  }
  return new Date();
}

// ──────────────────────────────────────────────────────────────────────────────
// CORE MAPPING FUNCTION
// ──────────────────────────────────────────────────────────────────────────────

function mapEnquiryData(sourceData, sourceType = 'generic') {
  const mapping = SOURCE_MAPPINGS[sourceType] || SOURCE_MAPPINGS['generic'];
  
  const mappedData = {};
  
  // Apply all field mappings
  for (const [dbField, mapperFunction] of Object.entries(mapping)) {
    try {
      mappedData[dbField] = mapperFunction(sourceData);
    } catch (error) {
      console.warn(`Warning: Failed to map field ${dbField} from source ${sourceType}:`, error.message);
      mappedData[dbField] = null;
    }
  }
  
  // Apply post-mapping transformations
  mappedData.phone = transformPhoneNumber(mappedData.phone);
  mappedData.first = transformName(mappedData.first);
  mappedData.last = transformName(mappedData.last);
  mappedData.email = transformEmail(mappedData.email);
  mappedData.rank = validateRank(mappedData.rank);
  mappedData.datetime = ensureDateTime(mappedData.datetime);
  
  return mappedData;
}

// ──────────────────────────────────────────────────────────────────────────────
// MAIN FUNCTION
// ──────────────────────────────────────────────────────────────────────────────

module.exports = async function (context, req) {
  context.log('processEnquiry function triggered');
  
  // ──────────────────────────────────────────────────────────────────────────────
  // PAYLOAD LOGGING - ALWAYS LOG FOR DEBUGGING
  // ──────────────────────────────────────────────────────────────────────────────
  context.log('=== PAYLOAD LOGGING START ===');
  context.log('Request method:', req.method);
  context.log('Request query:', JSON.stringify(req.query, null, 2));
  context.log('Request headers:', JSON.stringify(req.headers, null, 2));
  context.log('Request body (raw):', JSON.stringify(req.body, null, 2));
  context.log('=== PAYLOAD LOGGING END ===');

  if (req.method !== 'POST') {
    context.res = { status: 405, body: 'Method not allowed' };
    return;
  }

  try {
    // Parse request body
    const requestBody = req.body;
    if (!requestBody) {
      context.log('ERROR: Request body is empty or null');
      context.res = { status: 400, body: 'Request body is required' };
      return;
    }

    // Extract source type and data
    const sourceType = req.query.source || requestBody.source || 'generic';
    const sourceData = requestBody.data || requestBody;
    
    context.log(`Processing enquiry from source: ${sourceType}`);
    context.log('Source data received:', JSON.stringify(sourceData, null, 2));

    // Map the source data to our database schema
    const mappedData = mapEnquiryData(sourceData, sourceType);
    context.log('Mapped enquiry data:', JSON.stringify(mappedData, null, 2));

    // Validate required fields - at least email or phone required
    if (!mappedData.email && !mappedData.phone) {
      context.log('ERROR: Validation failed - neither email nor phone provided');
      context.res = { 
        status: 400, 
        body: { 
          error: 'Either email or phone is required',
          receivedData: sourceData,
          mappedData: mappedData
        } 
      };
      return;
    }

    // Connect to database
    context.log('Connecting to database...');
    await ensureDbPassword();
    const pool = await getSqlPool();
    context.log('Database connection established');

    // Prepare SQL insert query - note: [id] is IDENTITY so we don't insert it
    const insertQuery = `
      INSERT INTO [dbo].[enquiries] (
        [datetime], [stage], [claim], [poc], [pitch], [aow], [tow], [moc], 
        [rep], [first], [last], [email], [phone], [value], [notes], [rank], 
        [rating], [acid], [card_id], [source], [url], [contact_referrer], 
        [company_referrer], [gclid]
      ) VALUES (
        @datetime, @stage, @claim, @poc, @pitch, @aow, @tow, @moc, 
        @rep, @first, @last, @email, @phone, @value, @notes, @rank, 
        @rating, @acid, @card_id, @source, @url, @contact_referrer, 
        @company_referrer, @gclid
      )`;

    const request = pool.request();

    // Add parameters with proper type handling
    request.input('datetime', sql.DateTime, mappedData.datetime);
    request.input('stage', sql.NVarChar(50), mappedData.stage);
    request.input('claim', sql.DateTime, mappedData.claim);
    request.input('poc', sql.NVarChar(100), mappedData.poc);
    request.input('pitch', sql.Int, mappedData.pitch);
    request.input('aow', sql.NVarChar(100), mappedData.aow);
    request.input('tow', sql.NVarChar(100), mappedData.tow);
    request.input('moc', sql.NVarChar(50), mappedData.moc);
    request.input('rep', sql.NVarChar(100), mappedData.rep);
    request.input('first', sql.NVarChar(100), mappedData.first);
    request.input('last', sql.NVarChar(100), mappedData.last);
    request.input('email', sql.NVarChar(255), mappedData.email);
    request.input('phone', sql.NVarChar(50), mappedData.phone);
    request.input('value', sql.NVarChar(100), mappedData.value);
    request.input('notes', sql.NVarChar(sql.MAX), mappedData.notes);
    request.input('rank', sql.NVarChar(50), mappedData.rank);
    request.input('rating', sql.NVarChar(50), mappedData.rating);
    request.input('acid', sql.NVarChar(100), mappedData.acid);
    request.input('card_id', sql.NVarChar(100), mappedData.card_id);
    request.input('source', sql.NVarChar(100), mappedData.source);
    request.input('url', sql.NVarChar(sql.MAX), mappedData.url);
    request.input('contact_referrer', sql.NVarChar(100), mappedData.contact_referrer);
    request.input('company_referrer', sql.NVarChar(100), mappedData.company_referrer);
    request.input('gclid', sql.NVarChar(255), mappedData.gclid);

    context.log('Executing SQL insert...');
    context.log('SQL Query:', insertQuery);
    
    // Execute the insert
    const result = await request.query(insertQuery);
    
    context.log(`SUCCESS: Enquiry inserted from source ${sourceType}. Rows affected: ${result.rowsAffected[0]}`);

    // Return success response
    context.res = {
      status: 201,
      headers: {
        'Content-Type': 'application/json'
      },
      body: {
        success: true,
        message: 'Enquiry inserted successfully',
        sourceType: sourceType,
        rowsAffected: result.rowsAffected[0],
        insertedData: mappedData,
        timestamp: new Date().toISOString()
      }
    };

  } catch (err) {
    context.log.error('=== ERROR in processEnquiry ===');
    context.log.error('Error message:', err.message);
    context.log.error('Error stack:', err.stack);
    context.log.error('Request source type:', req.query.source || req.body?.source || 'unknown');
    context.log.error('Request body:', JSON.stringify(req.body, null, 2));
    
    // Determine if it's a validation error or system error
    const isValidationError = err.message && (
      err.message.includes('Invalid column name') ||
      err.message.includes('Cannot insert') ||
      err.message.includes('constraint') ||
      err.message.includes('duplicate') ||
      err.message.includes('foreign key')
    );

    context.res = { 
      status: isValidationError ? 400 : 500, 
      body: { 
        error: isValidationError ? 'Data validation error' : 'Failed to process enquiry', 
        detail: err.message,
        sourceType: req.query.source || req.body?.source || 'unknown',
        timestamp: new Date().toISOString()
      } 
    };
  }
};
