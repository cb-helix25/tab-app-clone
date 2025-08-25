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

// Interface for the insert result
interface InsertResult {
  success: boolean;
  message: string;
  insertedId?: string;
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
  context.log(`Looking up related matters for display number: ${displayNumber}`);

  return new Promise<Matter[]>((resolve, reject) => {
    const connection = new Connection(config);

    connection.on("error", (err) => {
      context.error("SQL Connection Error (lookupRelatedMatters):", err);
      reject("An error occurred with the SQL connection for matter lookup.");
    });

    connection.on("connect", (err) => {
      if (err) {
        context.error("SQL Connection Error (lookupRelatedMatters):", err);
        reject("Failed to connect to SQL database for matter lookup.");
        return;
      }

      context.log("Successfully connected to SQL database for matter lookup.");

      // Query to find all matters with the same display number
      const query = `
        SELECT 
          [display_number],
          [client_name],
          [matter_description],
          [fee_earner]
        FROM [dbo].[matters_vnet_direct] 
        WHERE [display_number] = @DisplayNumber
        ORDER BY [client_name], [matter_description];
      `;

      const matters: Matter[] = [];

      const sqlRequest = new SqlRequest(query, (err, rowCount) => {
        if (err) {
          context.error("SQL Query Execution Error (lookupRelatedMatters):", err);
          reject("SQL query failed for matter lookup.");
          connection.close();
          return;
        }
        context.log(`Matter lookup query executed successfully. Rows found: ${rowCount}`);
      });

      sqlRequest.on("row", (columns) => {
        const matter: Matter = {
          display_number: columns.find(c => c.metadata.colName === "display_number")?.value || "",
          client_name: columns.find(c => c.metadata.colName === "client_name")?.value || "",
          matter_description: columns.find(c => c.metadata.colName === "matter_description")?.value || "",
          fee_earner: columns.find(c => c.metadata.colName === "fee_earner")?.value || "",
        };
        matters.push(matter);
      });

      sqlRequest.on("requestCompleted", () => {
        context.log(`Found ${matters.length} related matters for display number: ${displayNumber}`);
        connection.close();
        resolve(matters);
      });

      sqlRequest.addParameter("DisplayNumber", TYPES.NVarChar, displayNumber);
      connection.execSql(sqlRequest);
    });

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
  context.log("Starting notable case info insertion into database.");

  return new Promise<InsertResult>((resolve, reject) => {
    const connection = new Connection(config);

    connection.on("error", (err) => {
      context.error("SQL Connection Error (insertNotableCaseInfo):", err);
      reject("An error occurred with the SQL connection for notable case insertion.");
    });

    connection.on("connect", (err) => {
      if (err) {
        context.error("SQL Connection Error (insertNotableCaseInfo):", err);
        reject("Failed to connect to SQL database for notable case insertion.");
        return;
      }

      context.log("Successfully connected to SQL database for notable case insertion.");

      const query = `
        INSERT INTO [dbo].[notable_case_info] 
          ([initials], [display_number], [summary], [value_in_dispute], [c_reference_status], [counsel_instructed], [counsel_name])
        VALUES 
          (@Initials, @DisplayNumber, @Summary, @ValueInDispute, @CReferenceStatus, @CounselInstructed, @CounselName);
        SELECT CAST(SCOPE_IDENTITY() AS NVARCHAR(50)) AS InsertedId;
      `;

      let insertedId: string | undefined;

      const sqlRequest = new SqlRequest(query, (err, rowCount) => {
        if (err) {
          context.error("SQL Query Execution Error (insertNotableCaseInfo):", err);
          reject("SQL query failed for notable case insertion.");
          connection.close();
          return;
        }
        context.log(`Notable case insertion query executed successfully. Rows affected: ${rowCount}`);
      });

      sqlRequest.on("row", (columns) => {
        const id = columns.find(c => c.metadata.colName === "InsertedId")?.value;
        if (id) {
          insertedId = id as string;
        }
      });

      sqlRequest.on("requestCompleted", () => {
        connection.close();
        if (insertedId) {
          resolve({
            success: true,
            message: "Notable case info inserted successfully.",
            insertedId
          });
        } else {
          reject("Insert failed: No ID returned.");
        }
      });

      // Bind parameters
      sqlRequest.addParameter("Initials", TYPES.NVarChar, requestData.initials);
      sqlRequest.addParameter("DisplayNumber", TYPES.NVarChar, requestData.display_number);
      sqlRequest.addParameter("Summary", TYPES.Text, requestData.summary);
      sqlRequest.addParameter("ValueInDispute", TYPES.NVarChar, requestData.value_in_dispute || null);
      sqlRequest.addParameter("CReferenceStatus", TYPES.Bit, requestData.c_reference_status);
      sqlRequest.addParameter("CounselInstructed", TYPES.Bit, requestData.counsel_instructed);
      sqlRequest.addParameter("CounselName", TYPES.NVarChar, requestData.counsel_name || null);

      context.log("Executing notable case insertion with parameters:", {
        Initials: requestData.initials,
        DisplayNumber: requestData.display_number,
        Summary: requestData.summary.substring(0, 100) + "...", // Log truncated summary
        ValueInDispute: requestData.value_in_dispute,
        CReferenceStatus: requestData.c_reference_status,
        CounselInstructed: requestData.counsel_instructed,
        CounselName: requestData.counsel_name
      });

      connection.execSql(sqlRequest);
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
  context.log("Invocation started for insertNotableCaseInfo Azure Function.");

  // CORS headers
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  // Handle OPTIONS preflight request
  if (req.method === "OPTIONS") {
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
    requestBody = await getRequestBody(req);
    context.log("Request body parsed successfully.");
  } catch (error) {
    context.error("Error parsing request body:", error);
    return {
      status: 400,
      headers: corsHeaders,
      body: "Invalid request body. Ensure it's valid JSON.",
    };
  }

  const { initials, display_number, summary } = requestBody;

  // Validate required fields
  if (!initials || !display_number || !summary) {
    context.warn("Missing required fields in request body.");
    return {
      status: 400,
      headers: corsHeaders,
      body: "Missing required fields: 'initials', 'display_number', and 'summary' are required.",
    };
  }

  try {
    context.log("Starting notable case info processing...");

    // Step 1: Retrieve SQL password from Azure Key Vault
    const kvUri = "https://helix-keys.vault.azure.net/";
    const passwordSecretName = "sql-databaseserver-password";
    const sqlServer = "helix-database-server.database.windows.net";
    const sqlDatabase = "helix-project-data";

    const secretClient = new SecretClient(kvUri, new DefaultAzureCredential());
    const passwordSecret = await secretClient.getSecret(passwordSecretName);
    const password = passwordSecret.value || "";
    context.log("Retrieved SQL password from Key Vault.");

    // Step 2: Parse connection string
    const connectionString = `Server=${sqlServer};Database=${sqlDatabase};User ID=helix-database-server;Password=${password};Encrypt=true;TrustServerCertificate=false;`;
    const config = parseConnectionString(connectionString, context);

    // Step 3: Look up related matters with the same display number
    context.log(`Looking up related matters for display number: ${display_number}`);
    const relatedMatters = await lookupRelatedMatters(display_number, config, context);
    context.log(`Found ${relatedMatters.length} related matters.`);

    // Step 4: Insert notable case info into the database
    context.log("Inserting notable case info into database...");
    const insertResult = await insertNotableCaseInfo(requestBody, config, context);
    context.log("Notable case info inserted successfully:", insertResult);

    // Step 5: Send notification email
    context.log("Sending notification email...");
    const emailResult = await sendNotificationEmail(requestBody, relatedMatters, context);
    
    if (!emailResult.success) {
      context.warn("Email sending failed:", emailResult.error);
      // Don't fail the entire operation if email fails, just log warning
    } else {
      context.log("Notification email sent successfully.");
    }

    return {
      status: 201,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Notable case information submitted successfully.",
        insertedId: insertResult.insertedId,
        emailSent: emailResult.success,
        relatedMattersFound: relatedMatters.length,
      }),
    };

  } catch (error) {
    context.error("Error processing notable case info submission:", error);
    return {
      status: 500,
      headers: corsHeaders,
      body: "Error processing notable case info submission.",
    };
  } finally {
    context.log("Invocation completed for insertNotableCaseInfo Azure Function.");
  }
}

// Register the function
app.http("insertNotableCaseInfo", {
  methods: ["POST", "OPTIONS"],
  authLevel: "function",
  handler: insertNotableCaseInfoHandler,
});

export default app;
