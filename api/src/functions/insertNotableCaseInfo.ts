import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Connection, Request as SqlRequest, TYPES } from "tedious";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import axios from "axios";

// Interface for the request body
interface InsertNotableCaseInfoRequest {
  initials: string;
  display_number: string;
  summary: string;
  value_in_dispute?: string;
  c_reference_status: boolean;
  counsel_instructed: boolean;
  counsel_name?: string;
}

// Interface for matter lookup results
interface Matter {
  display_number: string;
  client_name: string;
  matter_description: string;
  fee_earner: string;
  // Add other relevant matter fields as needed
}

// Interface for notable case entries from database
interface NotableCaseEntry {
  id: string;
  initials: string;
  display_number: string;
  summary: string;
  value_in_dispute?: string;
  c_reference_status: boolean;
  counsel_instructed: boolean;
  counsel_name?: string;
  created_at: Date;
}

// Interface for the insert result
interface InsertResult {
  success: boolean;
  message: string;
  insertedId?: string;
  emailSent?: boolean;
}

/**
 * Helper function to read and parse the HTTP request body.
 */
async function getRequestBody(req: HttpRequest): Promise<any> {
  if (req.body && typeof req.body === 'object' && !(req.body as any).getReader) {
    return req.body;
  }
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch (err) {
      throw new Error("Unable to parse request body string as JSON.");
    }
  }
  if (req.body && typeof (req.body as any).getReader === 'function') {
    const reader = (req.body as any).getReader();
    let chunks = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      chunks += typeof value === "string" ? value : new TextDecoder().decode(value);
    }
    try {
      return JSON.parse(chunks);
    } catch (err) {
      throw new Error("Unable to parse streamed request body as JSON.");
    }
  }
  return {};
}

/**
 * Helper function to parse SQL connection string.
 */
function parseConnectionString(connectionString: string, context: InvocationContext): any {
  const parts = connectionString.split(";");
  const config: any = {};

  parts.forEach(part => {
    const [key, value] = part.split("=");
    if (!key || !value) {
      return;
    }

    switch (key.trim()) {
      case "Server":
        config.server = value;
        break;
      case "Database":
        config.options = { ...config.options, database: value };
        break;
      case "User ID":
        config.authentication = {
          type: "default",
          options: { userName: value, password: "" }
        };
        break;
      case "Password":
        if (!config.authentication) {
          config.authentication = { type: "default", options: { userName: "", password: "" } };
        }
        config.authentication.options.password = value;
        break;
      case "Encrypt":
        config.options = { ...config.options, encrypt: value.toLowerCase() === "true" };
        break;
      case "TrustServerCertificate":
        config.options = { ...config.options, trustServerCertificate: value.toLowerCase() === "true" };
        break;
      case "Connect Timeout":
        config.options = { ...config.options, connectTimeout: parseInt(value, 10) };
        break;
      default:
        break;
    }
  });

  return config;
}

/**
 * Lookup additional matters with the same display number
 */
async function lookupRelatedMatters(
  displayNumber: string,
  config: any,
  context: InvocationContext
): Promise<Matter[]> {
  context.log(`=== LOOKUP RELATED MATTERS START ===`);
  context.log(`Looking up related matters for display number: ${displayNumber}`);
  context.log(`Config for database connection: ${JSON.stringify({ ...config, authentication: { ...config.authentication, options: { ...config.authentication?.options, password: '***' } } }, null, 2)}`);

  return new Promise<Matter[]>((resolve, reject) => {
    const connection = new Connection(config);

    connection.on("error", (err) => {
      context.error("SQL Connection Error (lookupRelatedMatters):", err);
      context.error("Connection error details:", JSON.stringify(err, null, 2));
      reject("An error occurred with the SQL connection for matter lookup.");
    });

    connection.on("connect", (err) => {
      if (err) {
        context.error("SQL Connection Error (lookupRelatedMatters):", err);
        context.error("Connect error details:", JSON.stringify(err, null, 2));
        reject("Failed to connect to SQL database for matter lookup.");
        return;
      }

      context.log("Successfully connected to SQL database for matter lookup.");

      // Query to find all notable case entries with the same display number
      const query = `
        SELECT 
          [display_number],
          [initials] as [client_name],
          [summary] as [matter_description],
          [initials] as [fee_earner]
        FROM [dbo].[notable_case_info] 
        WHERE [display_number] = @DisplayNumber
        ORDER BY [created_at] DESC;
      `;

      context.log("Executing query:", query);
      context.log("Query parameter DisplayNumber:", displayNumber);

      const matters: Matter[] = [];

      const sqlRequest = new SqlRequest(query, (err, rowCount) => {
        if (err) {
          context.error("SQL Query Execution Error (lookupRelatedMatters):", err);
          context.error("Query error details:", JSON.stringify(err, null, 2));
          reject("SQL query failed for matter lookup.");
          connection.close();
          return;
        }
        context.log(`Matter lookup query executed successfully. Rows found: ${rowCount}`);
      });

      sqlRequest.on("row", (columns) => {
        context.log("Processing row with columns:", columns.map(c => ({ name: c.metadata.colName, value: c.value })));
        const matter: Matter = {
          display_number: columns.find(c => c.metadata.colName === "display_number")?.value || "",
          client_name: columns.find(c => c.metadata.colName === "client_name")?.value || "",
          matter_description: columns.find(c => c.metadata.colName === "matter_description")?.value || "",
          fee_earner: columns.find(c => c.metadata.colName === "fee_earner")?.value || "",
        };
        context.log("Created matter object:", matter);
        matters.push(matter);
      });

      sqlRequest.on("requestCompleted", () => {
        context.log(`Found ${matters.length} related matters for display number: ${displayNumber}`);
        context.log("All matters found:", matters);
        connection.close();
        context.log("=== LOOKUP RELATED MATTERS END ===");
        resolve(matters);
      });

      sqlRequest.addParameter("DisplayNumber", TYPES.NVarChar, displayNumber);
      connection.execSql(sqlRequest);
    });

    context.log("Initiating database connection...");
    connection.connect();
  });
}

/**
 * Insert notable case info into the database
 */
async function insertNotableCaseInfo(
  requestData: InsertNotableCaseInfoRequest,
  config: any,
  context: InvocationContext
): Promise<InsertResult> {
  context.log("=== INSERT NOTABLE CASE INFO START ===");
  context.log("Starting notable case info insertion into database.");
  context.log("Request data to insert:", {
    initials: requestData.initials,
    display_number: requestData.display_number,
    summary: requestData.summary.substring(0, 100) + (requestData.summary.length > 100 ? '...' : ''),
    value_in_dispute: requestData.value_in_dispute,
    c_reference_status: requestData.c_reference_status,
    counsel_instructed: requestData.counsel_instructed,
    counsel_name: requestData.counsel_name
  });

  return new Promise<InsertResult>((resolve, reject) => {
    const connection = new Connection(config);

    connection.on("error", (err) => {
      context.error("SQL Connection Error (insertNotableCaseInfo):", err);
      context.error("Connection error details:", JSON.stringify(err, null, 2));
      reject("An error occurred with the SQL connection for notable case insertion.");
    });

    connection.on("connect", (err) => {
      if (err) {
        context.error("SQL Connection Error (insertNotableCaseInfo):", err);
        context.error("Connect error details:", JSON.stringify(err, null, 2));
        reject("Failed to connect to SQL database for notable case insertion.");
        return;
      }

      context.log("Successfully connected to SQL database for notable case insertion.");

      const query = `
        INSERT INTO [dbo].[notable_case_info] 
          ([initials], [display_number], [summary], [value_in_dispute], [c_reference_status], [counsel_instructed], [counsel_name])
        VALUES 
          (@Initials, @DisplayNumber, @Summary, @ValueInDispute, @CReferenceStatus, @CounselInstructed, @CounselName);
      `;

      context.log("Executing insert query:", query);

      let insertedId: string | undefined;

      const sqlRequest = new SqlRequest(query, (err, rowCount) => {
        if (err) {
          context.error("SQL Query Execution Error (insertNotableCaseInfo):", err);
          context.error("Insert query error details:", JSON.stringify(err, null, 2));
          reject("SQL query failed for notable case insertion.");
          connection.close();
          return;
        }
        context.log(`Notable case insertion query executed successfully. Rows affected: ${rowCount}`);
      });

      sqlRequest.on("row", (columns) => {
        context.log(`DEBUG: Row event fired with ${columns.length} columns`);
        context.log("Insert result row columns:", columns.map(c => ({ name: c.metadata.colName, value: c.value, type: typeof c.value })));
        
        // Try different approaches to find the ID
        const id = columns.find(c => c.metadata.colName === "InsertedId")?.value;
        const idByIndex = columns[0]?.value; // Try first column
        
        context.log(`DEBUG: ID by column name: ${id}`);
        context.log(`DEBUG: ID by index [0]: ${idByIndex}`);
        
        if (id) {
          insertedId = id as string;
          context.log("SUCCESS: Extracted inserted ID by name:", insertedId);
        } else if (idByIndex) {
          insertedId = idByIndex as string;
          context.log("SUCCESS: Extracted inserted ID by index:", insertedId);
        } else {
          context.log("WARNING: No ID found in any column");
        }
      });

      sqlRequest.on("requestCompleted", () => {
        context.log("DEBUG: Insert request completed event fired");
        context.log("DEBUG: Final insertedId value:", insertedId);
        context.log("Insert request completed. Closing connection.");
        connection.close();
        // Always resolve successfully if we got here - the insert worked
        const result = {
          success: true,
          message: "Notable case info inserted successfully.",
          insertedId: insertedId || "ID not captured (but insert successful)"
        };
        context.log("Insert successful, resolving with:", result);
        context.log("=== INSERT NOTABLE CASE INFO END ===");
        resolve(result);
      });

      // Bind parameters
      context.log("Adding parameters to SQL request...");
      sqlRequest.addParameter("Initials", TYPES.NVarChar, requestData.initials);
      sqlRequest.addParameter("DisplayNumber", TYPES.NVarChar, requestData.display_number);
      sqlRequest.addParameter("Summary", TYPES.Text, requestData.summary);
      sqlRequest.addParameter("ValueInDispute", TYPES.NVarChar, requestData.value_in_dispute || null);
      sqlRequest.addParameter("CReferenceStatus", TYPES.Bit, requestData.c_reference_status);
      sqlRequest.addParameter("CounselInstructed", TYPES.Bit, requestData.counsel_instructed);
      sqlRequest.addParameter("CounselName", TYPES.NVarChar, requestData.counsel_name || null);

      context.log("Parameters added. Executing SQL request...");
      connection.execSql(sqlRequest);
    });

    context.log("Initiating database connection for insert...");
    connection.connect();
  });
}

/**
 * Fetch all notable case entries for a specific matter
 */
async function fetchNotableCaseHistory(
  displayNumber: string,
  context: InvocationContext
): Promise<NotableCaseEntry[]> {
  context.log(`Fetching notable case history for matter: ${displayNumber}`);

  const connectionString = process.env.TeamsSQLConnectionString;
  if (!connectionString) {
    throw new Error("SQL connection string not found");
  }
  
  const config = parseConnectionString(connectionString, context);
  
  return new Promise<NotableCaseEntry[]>((resolve, reject) => {
    const connection = new Connection(config);

    connection.on("error", (err) => {
      context.error("SQL Connection Error:", err);
      reject(new Error("Database connection failed"));
    });

    connection.on("connect", (err) => {
      if (err) {
        context.error("SQL Connection Error:", err);
        reject(new Error("Failed to connect to database"));
        return;
      }

      const query = `
        SELECT 
          id,
          initials,
          display_number,
          summary,
          value_in_dispute,
          c_reference_status,
          counsel_instructed,
          counsel_name,
          created_at
        FROM notable_case_info
        WHERE display_number = @DisplayNumber
        ORDER BY created_at DESC
      `;

      const request = new SqlRequest(query, (err, rowCount) => {
        if (err) {
          context.error("SQL Query Error:", err);
          reject(new Error("Failed to fetch notable case history"));
          connection.close();
          return;
        }
        context.log(`Retrieved ${rowCount} historical entries for matter ${displayNumber}`);
      });

      request.addParameter('DisplayNumber', TYPES.VarChar, displayNumber);

      const results: NotableCaseEntry[] = [];

      request.on('row', (columns) => {
        const entry: NotableCaseEntry = {
          id: columns[0].value,
          initials: columns[1].value,
          display_number: columns[2].value,
          summary: columns[3].value,
          value_in_dispute: columns[4].value,
          c_reference_status: columns[5].value,
          counsel_instructed: columns[6].value,
          counsel_name: columns[7].value,
          created_at: columns[8].value
        };
        results.push(entry);
      });

      request.on('requestCompleted', () => {
        resolve(results);
        connection.close();
      });

      connection.execSql(request);
    });

    connection.connect();
  });
}

/**
 * Send notification email using Microsoft Graph
 */
async function sendNotificationEmail(
  requestData: InsertNotableCaseInfoRequest,
  relatedMatters: Matter[],
  context: InvocationContext
): Promise<{ success: boolean; message?: string; error?: string }> {
  context.log("Sending notification email for notable case info submission.");

  try {
    // Fetch historical notable case entries for this matter
    let historicalEntries: NotableCaseEntry[] = [];
    try {
      historicalEntries = await fetchNotableCaseHistory(requestData.display_number, context);
      context.log(`Retrieved ${historicalEntries.length} historical entries for matter ${requestData.display_number}`);
    } catch (error) {
      context.log(`Warning: Failed to fetch historical entries: ${error}`);
      // Continue without historical data rather than failing completely
    }

    const tenantId = "7fbc252f-3ce5-460f-9740-4e1cb8bf78b8";

    const kvUri = "https://helix-keys.vault.azure.net/";
    const clientIdSecretName = "graph-pitchbuilderemailprovider-clientid";
    const clientSecretName = "graph-pitchbuilderemailprovider-clientsecret";

    context.log("Initializing Key Vault client for email credentials...");
    const credential = new DefaultAzureCredential();
    const secretClient = new SecretClient(kvUri, credential);

    const [clientIdSecret, clientSecretSecret] = await Promise.all([
      secretClient.getSecret(clientIdSecretName),
      secretClient.getSecret(clientSecretName)
    ]);

    const clientId = clientIdSecret.value;
    const clientSecret = clientSecretSecret.value;

    if (!clientId || !clientSecret) {
      throw new Error("Missing email credentials from Key Vault.");
    }

    // Get access token
    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    );

    const accessToken = tokenResponse.data.access_token;
    if (!accessToken) {
      throw new Error("Failed to retrieve access token.");
    }

    // Build email content
    const mattersTable = relatedMatters.length > 0 ? `
      <h3>Related Matters:</h3>
      <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%;">
        <thead>
          <tr style="background-color: #f0f0f0;">
            <th>Display Number</th>
            <th>Client Name</th>
            <th>Matter Description</th>
            <th>Fee Earner</th>
          </tr>
        </thead>
        <tbody>
          ${relatedMatters.map(matter => `
            <tr>
              <td>${matter.display_number}</td>
              <td>${matter.client_name}</td>
              <td>${matter.matter_description}</td>
              <td>${matter.fee_earner}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p><em>No related matters found for this display number.</em></p>';

    // Build historical entries table
    const historicalTable = historicalEntries.length > 0 ? `
      <h3>Previous Notable Case Entries for this Matter:</h3>
      <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
        <thead>
          <tr style="background-color: #e8f4fd;">
            <th>Date Submitted</th>
            <th>Submitted By</th>
            <th>Summary</th>
            <th>Value in Dispute</th>
            <th>Client Reference</th>
            <th>Counsel</th>
          </tr>
        </thead>
        <tbody>
          ${historicalEntries.map(entry => `
            <tr>
              <td>${new Date(entry.created_at).toLocaleDateString('en-GB')}</td>
              <td>${entry.initials}</td>
              <td>${entry.summary}</td>
              <td>${entry.value_in_dispute || 'Not specified'}</td>
              <td>${entry.c_reference_status ? 'Yes' : 'No'}</td>
              <td>${entry.counsel_instructed ? (entry.counsel_name || 'Yes') : 'No'}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    ` : '<p><em>No previous notable case entries found for this matter.</em></p>';

    const emailContent = {
      message: {
        subject: `Notable Case Information Submitted - ${requestData.display_number}`,
        body: {
          contentType: "HTML",
          content: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                <h2>Notable Case Information Submission</h2>
                
                <p>A new notable case information entry has been submitted:</p>
                
                <table border="1" cellpadding="5" cellspacing="0" style="border-collapse: collapse; margin-bottom: 20px;">
                  <tr>
                    <td><strong>Submitted by (FE):</strong></td>
                    <td>${requestData.initials}</td>
                  </tr>
                  <tr>
                    <td><strong>File Reference:</strong></td>
                    <td>${requestData.display_number}</td>
                  </tr>
                  <tr>
                    <td><strong>Brief Summary:</strong></td>
                    <td>${requestData.summary}</td>
                  </tr>
                  <tr>
                    <td><strong>Indication of Value:</strong></td>
                    <td>${requestData.value_in_dispute || 'Not specified'}</td>
                  </tr>
                  <tr>
                    <td><strong>Client Prepared to Provide Reference:</strong></td>
                    <td>${requestData.c_reference_status ? 'Yes' : 'No'}</td>
                  </tr>
                  <tr>
                    <td><strong>Counsel Instructed:</strong></td>
                    <td>${requestData.counsel_instructed ? 'Yes' : 'No'}</td>
                  </tr>
                  ${requestData.counsel_instructed ? `
                  <tr>
                    <td><strong>Counsel Name:</strong></td>
                    <td>${requestData.counsel_name || 'Not specified'}</td>
                  </tr>
                  ` : ''}
                </table>
                
                ${mattersTable}
                
                ${historicalTable}
                
                <p style="font-size: 12px; color: #666; margin-top: 30px;">
                  This email was automatically generated by the Helix Hub system.
                </p>
              </body>
            </html>
          `,
        },
        toRecipients: [
          {
            emailAddress: {
              address: "lz@helix-law.com",
            },
          },
          {
            emailAddress: {
              address: "ac@helix-law.com",
            },
          },
          {
            emailAddress: {
              address: "cb@helix-law.com",
            },
          },
        ],
        from: {
          emailAddress: {
            address: "automations@helix-law.com",
          },
        },
      },
      saveToSentItems: "false",
    };

    context.log("Sending email via Microsoft Graph API...");
    const emailResponse = await axios.post(
      `https://graph.microsoft.com/v1.0/users/automations@helix-law.com/sendMail`,
      emailContent,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (emailResponse.status === 202) {
      context.log("Notification email sent successfully.");
      return { success: true, message: "Notification email sent successfully." };
    } else {
      context.warn(`Unexpected response status from email API: ${emailResponse.status}`);
      return { success: false, error: `Unexpected response status: ${emailResponse.status}` };
    }
  } catch (error) {
    context.error("Error sending notification email:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown email error" };
  }
}

/**
 * Handler for the insertNotableCaseInfo Azure Function
 */
export async function insertNotableCaseInfoHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("=== INVOCATION STARTED: insertNotableCaseInfo Azure Function ===");
  context.log(`Request method: ${req.method}`);
  context.log(`Request URL: ${req.url}`);
  context.log(`Request headers: ${JSON.stringify(req.headers)}`);
  context.log(`Environment variables check: SQL_CONNECTION_STRING exists = ${!!process.env.SQL_CONNECTION_STRING}`);
  context.log(`Environment variables check: TeamsSQLConnectionString exists = ${!!process.env.TeamsSQLConnectionString}`);

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle OPTIONS preflight request
  if (req.method === "OPTIONS") {
    context.log("Handling OPTIONS preflight request");
    return {
      status: 204,
      headers: corsHeaders,
    };
  }

  // Ensure the request method is POST
  if (req.method !== "POST") {
    context.warn(`Unsupported HTTP method: ${req.method}`);
    return {
      status: 405,
      headers: corsHeaders,
      body: "Method Not Allowed. Please use POST.",
    };
  }

  // Parse and validate the request body
  let requestBody: InsertNotableCaseInfoRequest;
  try {
    context.log("Attempting to parse request body...");
    context.log(`Request body type: ${typeof req.body}`);
    context.log(`Request body length: ${req.body ? JSON.stringify(req.body).length : 'null'}`);
    
    requestBody = await getRequestBody(req);
    context.log("Request body parsed successfully:");
    context.log(`Parsed request body: ${JSON.stringify(requestBody, null, 2)}`);
  } catch (error) {
    context.error("Error parsing request body:", error);
    context.error(`Error details: ${error instanceof Error ? error.message : String(error)}`);
    return {
      status: 400,
      headers: corsHeaders,
      body: "Invalid request body. Ensure it's valid JSON.",
    };
  }

  const { initials, display_number, summary } = requestBody;
  context.log(`Extracted fields - initials: "${initials}", display_number: "${display_number}", summary length: ${summary?.length || 0}`);

  // Validate required fields
  if (!initials || !display_number || !summary) {
    context.warn("Missing required fields in request body.");
    context.warn(`Field validation - initials: ${!!initials}, display_number: ${!!display_number}, summary: ${!!summary}`);
    return {
      status: 400,
      headers: corsHeaders,
      body: "Missing required fields: 'initials', 'display_number', and 'summary' are required.",
    };
  }

  try {
    context.log("=== STARTING NOTABLE CASE INFO PROCESSING ===");

    // Step 1: Get database configuration for helix-project-data
    // For local development, use the connection credentials but override database
    // For production, use Key Vault
    const kvUri = "https://helix-keys.vault.azure.net/";
    const passwordSecretName = "sql-databaseserver-password";
    const sqlServer = "helix-database-server.database.windows.net";
    const sqlDatabase = "helix-project-data"; // Always use project data for notable case info
    
    context.log(`Database configuration - Server: ${sqlServer}, Database: ${sqlDatabase}`);
    
    let password: string;
    
    // Check if we have local connection string (extract password from it)
    const localConnectionString = process.env.SQL_CONNECTION_STRING;
    context.log(`Local connection string available: ${!!localConnectionString}`);
    context.log(`Local connection string preview: ${localConnectionString ? localConnectionString.substring(0, 50) + '...' : 'N/A'}`);
    
    if (localConnectionString) {
      // Running locally - extract password from local connection string
      context.log("Using local SQL credentials with helix-project-data database.");
      const passwordMatch = localConnectionString.match(/Password=([^;]+)/);
      password = passwordMatch ? passwordMatch[1] : "";
      context.log(`Password extraction successful: ${!!password}`);
      if (!password) {
        throw new Error("Could not extract password from local connection string");
      }
    } else {
      // Running in production - retrieve password from Azure Key Vault
      context.log("Retrieving SQL password from Azure Key Vault for production.");
      const secretClient = new SecretClient(kvUri, new DefaultAzureCredential());
      const passwordSecret = await secretClient.getSecret(passwordSecretName);
      password = passwordSecret.value || "";
      context.log("Retrieved SQL password from Key Vault - success:", !!password);
    }

    // Build connection string for helix-project-data
    const connectionString = `Server=${sqlServer};Database=${sqlDatabase};User ID=helix-database-server;Password=${password};Encrypt=true;TrustServerCertificate=false;`;
    context.log(`Built connection string (masked): Server=${sqlServer};Database=${sqlDatabase};User ID=helix-database-server;Password=***;Encrypt=true;TrustServerCertificate=false;`);
    
    const config = parseConnectionString(connectionString, context);
    context.log(`Parsed config: ${JSON.stringify({ ...config, authentication: { ...config.authentication, options: { ...config.authentication?.options, password: '***' } } }, null, 2)}`);

    // Step 2: Look up related matters with the same display number
    context.log(`=== STEP 2: Looking up related matters for display number: ${display_number} ===`);
    const relatedMatters = await lookupRelatedMatters(display_number, config, context);
    context.log(`Found ${relatedMatters.length} related matters:`, relatedMatters);

    // Step 3: Insert notable case info into the database
    context.log("=== STEP 3: Inserting notable case info into database ===");
    const insertResult = await insertNotableCaseInfo(requestBody, config, context);
    context.log("Notable case info inserted successfully:", insertResult);

    // Step 4: Send notification email
    context.log("=== STEP 4: Sending notification email ===");
    const emailResult = await sendNotificationEmail(requestBody, relatedMatters, context);
    context.log("Email result:", emailResult);
    
    if (!emailResult.success) {
      context.warn("Email sending failed:", emailResult.error);
      // Don't fail the entire operation if email fails, just log warning
    } else {
      context.log("Notification email sent successfully.");
    }

    const finalResponse = {
      message: "Notable case information submitted successfully.",
      insertedId: insertResult.insertedId,
      emailSent: emailResult.success,
      relatedMattersFound: relatedMatters.length,
    };

    context.log("=== FINAL RESPONSE ===", finalResponse);

    return {
      status: 201,
      headers: corsHeaders,
      body: JSON.stringify(finalResponse),
    };

  } catch (error) {
    context.error("=== ERROR PROCESSING NOTABLE CASE INFO SUBMISSION ===");
    context.error("Error details:", error);
    context.error("Error message:", error instanceof Error ? error.message : String(error));
    context.error("Error stack:", error instanceof Error ? error.stack : 'No stack trace');
    return {
      status: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: "Error processing notable case info submission.",
        details: error instanceof Error ? error.message : String(error)
      }),
    };
  } finally {
    context.log("=== INVOCATION COMPLETED: insertNotableCaseInfo Azure Function ===");
  }
}

// Register the function
app.http("insertNotableCaseInfo", {
  methods: ["POST", "OPTIONS"],
  authLevel: "function",
  handler: insertNotableCaseInfoHandler,
});

export default app;
