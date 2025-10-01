/**
 * Backfill Instructions - Client and Matter Linkage
 * 
 * This script backfills missing ClientId and MatterId data for instructions that were
 * created but never completed the Matter Opening workflow.
 * 
 * Process:
 * 1. Query Instructions table for records with NULL ClientId or MatterId
 * 2. For each instruction with an email:
 *    - Search for existing Clio client by email
 *    - If not found, create new Clio client
 *    - Update Instructions.ClientId
 * 3. For each instruction with ClientId:
 *    - Create Clio matter
 *    - Update Instructions.MatterId
 *    - Update Matters table with real Clio data
 * 
 * Usage:
 *   node scripts/backfill-instruction-matters.js --dry-run    # Test without changes
 *   node scripts/backfill-instruction-matters.js              # Execute backfill
 *   node scripts/backfill-instruction-matters.js --ref HLX-27887-30406  # Single instruction
 */

require('dotenv').config();
const sql = require('mssql');
const { getSecret } = require('../server/utils/getSecret');

// Command line arguments
const args = process.argv.slice(2);
const isDryRun = args.includes('--dry-run');
const singleRef = args.find(arg => arg.startsWith('--ref='))?.split('=')[1];

// Stats tracking
const stats = {
  totalInstructions: 0,
  skipped: {
    alreadyComplete: 0,
    noEmail: 0,
    errors: 0
  },
  clientsCreated: 0,
  clientsLinked: 0,
  mattersCreated: 0,
  errors: []
};

/**
 * Get database connection string from environment
 */
function getDbConnectionString() {
  const connStr = process.env.INSTRUCTIONS_SQL_CONNECTION_STRING;
  if (!connStr) {
    throw new Error('INSTRUCTIONS_SQL_CONNECTION_STRING not found in environment');
  }
  return connStr;
}

/**
 * Get Clio access token for a user by initials
 */
async function getClioAccessToken(initials) {
  try {
    const clioClientId = await getSecret(`${initials.toLowerCase()}-clio-v1-clientid`);
    const clientSecret = await getSecret(`${initials.toLowerCase()}-clio-v1-clientsecret`);
    const refreshToken = await getSecret(`${initials.toLowerCase()}-clio-v1-refreshtoken`);

    if (!clioClientId || !clientSecret || !refreshToken) {
      throw new Error(`Clio credentials not found for ${initials}`);
    }

    // Refresh access token
    const tokenUrl = `https://eu.app.clio.com/oauth/token?client_id=${clioClientId}&client_secret=${clientSecret}&grant_type=refresh_token&refresh_token=${refreshToken}`;
    const tokenResp = await fetch(tokenUrl, { method: 'POST' });

    if (!tokenResp.ok) {
      const text = await tokenResp.text();
      throw new Error(`Token refresh failed: ${text}`);
    }

    const tokenData = await tokenResp.json();
    return tokenData.access_token;
  } catch (error) {
    console.error(`❌ Failed to get Clio token for ${initials}:`, error.message);
    throw error;
  }
}

/**
 * Search for existing Clio client by email
 */
async function searchClioClient(email, accessToken) {
  const searchUrl = `https://eu.app.clio.com/api/v4/contacts.json?fields=id,name,first_name,last_name,primary_email_address,type,email_addresses{address,name,default_email}&query=${encodeURIComponent(email)}&limit=20`;

  const response = await fetch(searchUrl, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Clio search failed: ${text}`);
  }

  const data = await response.json();
  const contacts = data.data || [];

  // Find exact email match (primary or secondary)
  const emailLower = email.toLowerCase();
  const match = contacts.find(contact => {
    // Check primary email
    if (contact.primary_email_address?.toLowerCase() === emailLower) {
      return true;
    }
    // Check secondary emails
    if (contact.email_addresses && Array.isArray(contact.email_addresses)) {
      return contact.email_addresses.some(e => e.address?.toLowerCase() === emailLower);
    }
    return false;
  });

  return match;
}

/**
 * Create new Clio client
 */
async function createClioClient(instruction, accessToken) {
  const isCompany = instruction.ClientType === 'Company';
  
  const clientData = {
    data: {
      type: isCompany ? 'Company' : 'Person',
      primary_email_address: instruction.Email?.trim(),
      phone_numbers: instruction.Phone ? [{
        name: 'Work',  // Must be: Work, Home, Billing, or Other
        number: instruction.Phone,
        default_number: true
      }] : []
    }
  };
  
  // For companies, use 'name' field
  if (isCompany) {
    clientData.data.name = instruction.CompanyName?.trim();
  } else {
    // For persons, use first_name and last_name (NOT 'name')
    clientData.data.first_name = instruction.FirstName?.trim();
    clientData.data.last_name = instruction.LastName?.trim();
  }

  // Add address if available
  if (instruction.Street || instruction.City || instruction.Postcode) {
    clientData.data.addresses = [{
      name: 'Home',
      street: instruction.Street || '',
      city: instruction.City || '',
      province: instruction.County || '',
      postal_code: instruction.Postcode || '',
      country: instruction.Country || 'United Kingdom'
    }];
  }

  const response = await fetch('https://eu.app.clio.com/api/v4/contacts.json', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(clientData)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create Clio client: ${text}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Create Clio matter for client
 */
async function createClioMatter(instruction, clientId, accessToken) {
  // Determine description from instruction data
  let description = 'Legal Services';
  if (instruction.ClientType === 'Company' && instruction.CompanyName) {
    description = `Legal Services for ${instruction.CompanyName}`;
  } else if (instruction.FirstName && instruction.LastName) {
    description = `Legal Services for ${instruction.FirstName} ${instruction.LastName}`;
  }

  const matterData = {
    data: {
      client: { id: parseInt(clientId) },
      description: description,
      status: 'Open',
      open_date: instruction.SubmissionDate || new Date().toISOString().split('T')[0],
      practice_area: {
        name: 'General Practice'
      }
    }
  };

  const response = await fetch('https://eu.app.clio.com/api/v4/matters.json', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(matterData)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Failed to create Clio matter: ${text}`);
  }

  const result = await response.json();
  return result.data;
}

/**
 * Update Instructions table with ClientId
 */
async function updateInstructionClientId(pool, instructionRef, clientId) {
  await pool.request()
    .input('instructionRef', sql.NVarChar, instructionRef)
    .input('clientId', sql.NVarChar, clientId.toString())
    .query(`
      UPDATE Instructions 
      SET ClientId = @clientId,
          LastUpdated = GETDATE()
      WHERE InstructionRef = @instructionRef
    `);
}

/**
 * Update Instructions table with MatterId
 */
async function updateInstructionMatterId(pool, instructionRef, matterId) {
  await pool.request()
    .input('instructionRef', sql.NVarChar, instructionRef)
    .input('matterId', sql.NVarChar, matterId.toString())
    .query(`
      UPDATE Instructions 
      SET MatterId = @matterId,
          LastUpdated = GETDATE()
      WHERE InstructionRef = @instructionRef
    `);
}

/**
 * Update Matters table with real Clio data
 */
async function updateMattersTable(pool, matter, instruction) {
  // First, check if a MatterRequest placeholder exists
  const existing = await pool.request()
    .input('instructionRef', sql.NVarChar, instruction.InstructionRef)
    .query(`
      SELECT MatterID 
      FROM Matters 
      WHERE InstructionRef = @instructionRef 
        AND Status = 'MatterRequest'
    `);

  const clientName = instruction.ClientType === 'Company'
    ? instruction.CompanyName
    : `${instruction.FirstName || ''} ${instruction.LastName || ''}`.trim();

  if (existing.recordset.length > 0) {
    // Update the FIRST placeholder, delete any others
    await pool.request()
      .input('instructionRef', sql.NVarChar, instruction.InstructionRef)
      .input('matterId', sql.NVarChar, matter.id.toString())
      .input('displayNumber', sql.NVarChar, matter.display_number || '')
      .input('status', sql.NVarChar, matter.status || 'Open')
      .input('clientId', sql.NVarChar, matter.client?.id?.toString() || '')
      .input('clientName', sql.NVarChar, clientName)
      .input('openDate', sql.Date, matter.open_date || new Date())
      .input('description', sql.NVarChar, matter.description || '')
      .query(`
        -- Update the first placeholder record
        UPDATE Matters
        SET MatterID = @matterId,
            DisplayNumber = @displayNumber,
            Status = @status,
            ClientID = @clientId,
            ClientName = @clientName,
            OpenDate = @openDate,
            Description = @description
        WHERE InstructionRef = @instructionRef
          AND Status = 'MatterRequest'
          AND MatterID = (
            SELECT TOP 1 MatterID 
            FROM Matters 
            WHERE InstructionRef = @instructionRef AND Status = 'MatterRequest'
          );
          
        -- Delete any additional placeholders
        DELETE FROM Matters
        WHERE InstructionRef = @instructionRef
          AND Status = 'MatterRequest'
          AND MatterID != @matterId;
      `);
  } else {
    // Insert new record
    await pool.request()
      .input('matterId', sql.NVarChar, matter.id.toString())
      .input('instructionRef', sql.NVarChar, instruction.InstructionRef)
      .input('displayNumber', sql.NVarChar, matter.display_number || '')
      .input('status', sql.NVarChar, matter.status || 'Open')
      .input('clientId', sql.NVarChar, matter.client?.id?.toString() || '')
      .input('clientName', sql.NVarChar, clientName)
      .input('openDate', sql.Date, matter.open_date || new Date())
      .input('description', sql.NVarChar, matter.description || '')
      .query(`
        INSERT INTO Matters (
          MatterID, InstructionRef, DisplayNumber, Status, 
          ClientID, ClientName, OpenDate, Description
        ) VALUES (
          @matterId, @instructionRef, @displayNumber, @status,
          @clientId, @clientName, @openDate, @description
        )
      `);
  }
}

/**
 * Process a single instruction
 */
async function processInstruction(pool, instruction) {
  const ref = instruction.InstructionRef;
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Processing: ${ref}`);
  console.log(`  Email: ${instruction.Email || 'N/A'}`);
  console.log(`  Name: ${instruction.ClientType === 'Company' ? instruction.CompanyName : `${instruction.FirstName} ${instruction.LastName}`}`);
  console.log(`  Current ClientId: ${instruction.ClientId || 'NULL'}`);
  console.log(`  Current MatterId: ${instruction.MatterId || 'NULL'}`);

  // Skip if already complete
  if (instruction.ClientId && instruction.MatterId) {
    console.log(`  ✓ Already has ClientId and MatterId - skipping`);
    stats.skipped.alreadyComplete++;
    return;
  }

  // Skip if no email
  if (!instruction.Email || instruction.Email.trim() === '') {
    console.log(`  ⚠ No email address - skipping`);
    stats.skipped.noEmail++;
    return;
  }

  // Skip if no contact assigned
  if (!instruction.HelixContact) {
    console.log(`  ⚠ No HelixContact assigned - skipping`);
    stats.skipped.noEmail++;
    return;
  }

  try {
    // Get Clio access token for this user
    const initials = instruction.HelixContact;
    console.log(`  → Getting Clio access token for ${initials}...`);
    const accessToken = await getClioAccessToken(initials);
    console.log(`  ✓ Access token obtained`);

    let clientId = instruction.ClientId;

    // Step 1: Get or create Clio client
    if (!clientId) {
      console.log(`  → Searching for existing Clio client...`);
      const existingClient = await searchClioClient(instruction.Email, accessToken);

      if (existingClient) {
        console.log(`  ✓ Found existing client: ${existingClient.name} (ID: ${existingClient.id})`);
        clientId = existingClient.id.toString();
        stats.clientsLinked++;
      } else {
        console.log(`  → No existing client found - creating new...`);
        if (isDryRun) {
          console.log(`  [DRY RUN] Would create new Clio client`);
          clientId = 'DRY_RUN_CLIENT';
        } else {
          const newClient = await createClioClient(instruction, accessToken);
          console.log(`  ✓ Created client: ${newClient.name} (ID: ${newClient.id})`);
          clientId = newClient.id.toString();
          stats.clientsCreated++;
        }
      }

      // Update Instructions table with ClientId
      if (!isDryRun) {
        console.log(`  → Updating Instructions.ClientId...`);
        await updateInstructionClientId(pool, ref, clientId);
        console.log(`  ✓ Instructions.ClientId updated`);
      } else {
        console.log(`  [DRY RUN] Would update Instructions.ClientId = ${clientId}`);
      }
    }

    // Step 2: Create Clio matter
    if (!instruction.MatterId && clientId !== 'DRY_RUN_CLIENT') {
      console.log(`  → Creating Clio matter...`);
      if (isDryRun) {
        console.log(`  [DRY RUN] Would create Clio matter for client ${clientId}`);
      } else {
        const matter = await createClioMatter(instruction, clientId, accessToken);
        console.log(`  ✓ Created matter: ${matter.display_number} (ID: ${matter.id})`);

        // Update Instructions table with MatterId
        console.log(`  → Updating Instructions.MatterId...`);
        await updateInstructionMatterId(pool, ref, matter.id.toString());
        console.log(`  ✓ Instructions.MatterId updated`);

        // Update Matters table with real data
        console.log(`  → Updating Matters table...`);
        await updateMattersTable(pool, matter, instruction);
        console.log(`  ✓ Matters table updated`);

        stats.mattersCreated++;
      }
    }

    console.log(`  ✅ Successfully processed ${ref}`);
  } catch (error) {
    console.error(`  ❌ Error processing ${ref}:`, error.message);
    stats.errors.push({ ref, error: error.message });
    stats.skipped.errors++;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
  console.log('║                  Instructions Backfill - Client & Matter Linkage            ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
  console.log();

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No changes will be made to database or Clio');
    console.log();
  }

  if (singleRef) {
    console.log(`🎯 Processing single instruction: ${singleRef}`);
    console.log();
  }

  let pool;

  try {
    // Connect to database
    console.log('→ Connecting to database...');
    pool = await sql.connect(getDbConnectionString());
    console.log('✓ Database connected');
    console.log();

    // Query instructions needing backfill
    let query = `
      SELECT 
        InstructionRef, ClientId, MatterId, ClientType,
        FirstName, LastName, CompanyName, Email, Phone,
        Street, City, County, Postcode, Country,
        HelixContact, SubmissionDate, Stage
      FROM Instructions
      WHERE (ClientId IS NULL OR MatterId IS NULL)
    `;

    if (singleRef) {
      query += ` AND InstructionRef = '${singleRef}'`;
    } else {
      query += ` AND Email IS NOT NULL AND Email != ''`;
    }

    query += ` ORDER BY SubmissionDate DESC`;

    console.log('→ Querying instructions...');
    const result = await pool.request().query(query);
    const instructions = result.recordset;

    stats.totalInstructions = instructions.length;
    console.log(`✓ Found ${instructions.length} instruction(s) to process`);
    console.log();

    if (instructions.length === 0) {
      console.log('No instructions found matching criteria.');
      return;
    }

    // Process each instruction
    for (const instruction of instructions) {
      await processInstruction(pool, instruction);
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Print summary
    console.log();
    console.log('╔══════════════════════════════════════════════════════════════════════════════╗');
    console.log('║                              Backfill Summary                                ║');
    console.log('╚══════════════════════════════════════════════════════════════════════════════╝');
    console.log();
    console.log(`Total Instructions Processed:    ${stats.totalInstructions}`);
    console.log(`  ✓ Clients Created:             ${stats.clientsCreated}`);
    console.log(`  ✓ Clients Linked (existing):   ${stats.clientsLinked}`);
    console.log(`  ✓ Matters Created:             ${stats.mattersCreated}`);
    console.log(`  ⚠ Already Complete:            ${stats.skipped.alreadyComplete}`);
    console.log(`  ⚠ No Email/Contact:            ${stats.skipped.noEmail}`);
    console.log(`  ❌ Errors:                     ${stats.skipped.errors}`);
    console.log();

    if (stats.errors.length > 0) {
      console.log('Errors encountered:');
      stats.errors.forEach(({ ref, error }) => {
        console.log(`  • ${ref}: ${error}`);
      });
      console.log();
    }

    if (isDryRun) {
      console.log('🔍 DRY RUN COMPLETE - No changes were made');
    } else {
      console.log('✅ BACKFILL COMPLETE');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.close();
      console.log('Database connection closed');
    }
  }
}

// Run the script
main().catch(console.error);
