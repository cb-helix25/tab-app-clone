// src/functions/getComplianceData.ts

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { Connection, Request as SqlRequest, TYPES } from "tedious";

interface ComplianceData {
  [key: string]: any;
}

/**
 * Azure Function handler for fetching compliance data from the periodic-compliance table.
 * Returns only entries where [Matter ID] and [Client ID] match.
 */
export async function getComplianceDataHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Invocation started for getComplianceData Azure Function.");

  // Retrieve matterId and clientId from request body (POST) or query (GET)
  let matterId: string | undefined;
  let clientId: string | undefined;

  if (req.method === "POST") {
    let requestBody: any;
    try {
      requestBody = await req.json();
    } catch (err) {
      context.error("Invalid JSON in request body.", err);
      return { status: 400, body: "Invalid JSON format in request body." };
    }
    context.log("Request body:", requestBody);
    matterId = requestBody?.matterId;
    clientId = requestBody?.clientId;
  } else if (req.method === "GET") {
    // Assuming req.query is a URLSearchParams instance:
    matterId = req.query.get("matterId") || undefined;
    clientId = req.query.get("clientId") || undefined;
  }

  if (!matterId || !clientId) {
    context.log("matterId and clientId must be provided.");
    return { status: 400, body: "matterId and clientId are required." };
  }

  // Key Vault URI and secret name for SQL password
  const kvUri = "https://helix-keys.vault.azure.net/";
  const passwordSecretName = "sql-databaseserver-password";

  // SQL server and database details (using helix-core-data as in getEnquiries)
  const sqlServer = "helix-database-server.database.windows.net";
  const sqlDatabase = "helix-core-data";

  try {
    // 1) Retrieve SQL password from Azure Key Vault
    const secretClient = new SecretClient(kvUri, new DefaultAzureCredential());
    const passwordSecret = await secretClient.getSecret(passwordSecretName);
    const password = passwordSecret.value || "";
    context.log("Retrieved SQL password from Key Vault.");

    // 2) Build SQL connection configuration using a helper function.
    const connectionString = `Server=${sqlServer};Database=${sqlDatabase};User ID=helix-database-server;Password=${password};Encrypt=true;TrustServerCertificate=false;`;
    const config = parseConnectionString(connectionString, context);

    // 3) Execute the SQL query and return the compliance data.
    const complianceData = await queryComplianceData(matterId, clientId, config, context);
    return { status: 200, body: JSON.stringify(complianceData) };
  } catch (error) {
    context.error("Error in getComplianceData:", error);
    return { status: 500, body: "Error retrieving compliance data." };
  } finally {
    context.log("Invocation completed for getComplianceData Azure Function.");
  }
}

/**
 * Executes a parameterized SQL query to retrieve compliance data.
 * Returns only entries where [Matter ID] and [Client ID] match, ordered by [Compliance Date] descending.
 */
async function queryComplianceData(
  matterId: string,
  clientId: string,
  config: any,
  context: InvocationContext
): Promise<ComplianceData[]> {
  return new Promise((resolve, reject) => {
    const connection = new Connection(config);

    connection.on("error", (err) => {
      context.error("SQL Connection Error (Compliance):", err);
      reject("An error occurred with the SQL connection.");
    });

    connection.on("connect", (err) => {
      if (err) {
        context.error("SQL Connection Error (Compliance):", err);
        reject("Failed to connect to SQL database.");
        return;
      }
      context.log("Successfully connected to SQL database (Compliance).");

      const query = `
        SELECT
          [Compliance Date],
          [Compliance Expiry],
          [ACID],
          [Client ID],
          [Matter ID],
          [Check ID],
          [Check Result],
          [Risk Assessor],
          [Client Type],
          [Client Type_Value],
          [Destination Of Funds],
          [Destination Of Funds_Value],
          [Funds Type],
          [Funds Type_Value],
          [How Was Client Introduced],
          [How Was Client Introduced_Value],
          [Limitation],
          [Limitation_Value],
          [Source Of Funds],
          [Source Of Funds_Value],
          [Value Of Instruction],
          [Value Of Instruction_Value],
          [Risk Assessment Result],
          [Risk Score],
          [Risk Score Increment By],
          [Client Risk Factors Considered],
          [Transaction Risk Factors Considered],
          [Transaction Risk Level],
          [Firm-Wide AML Policy Considered],
          [Firm-Wide Sanctions Risk Considered],
          [PEP and Sanctions Check Result],
          [Address Verification Check Result]
        FROM [dbo].[periodic-compliance]
        WHERE [Matter ID] = @matterId AND [Client ID] = @clientId
        ORDER BY [Compliance Date] DESC
      `;
      context.log("SQL Query (Compliance):", query);

      const sqlRequest = new SqlRequest(query, (err, rowCount) => {
        if (err) {
          context.error("SQL Query Execution Error (Compliance):", err);
          reject("SQL query failed.");
          connection.close();
          return;
        }
        context.log(`SQL query executed successfully (Compliance). Rows returned: ${rowCount}`);
      });

      const results: ComplianceData[] = [];
      sqlRequest.on("row", (columns) => {
        const row: ComplianceData = {};
        columns.forEach((col: { metadata: { colName: string | number; }; value: any; }) => {
          row[col.metadata.colName] = col.value;
        });
        results.push(row);
      });

      sqlRequest.on("requestCompleted", () => {
        context.log("Compliance data retrieved successfully.");
        resolve(results);
        connection.close();
      });

      // Bind parameters to ensure only matching entries are returned
      sqlRequest.addParameter("matterId", TYPES.NVarChar, matterId);
      sqlRequest.addParameter("clientId", TYPES.NVarChar, clientId);

      context.log("Executing SQL query with parameters (Compliance):", { matterId, clientId });
      connection.execSql(sqlRequest);
    });

    connection.connect();
  });
}

/**
 * Parses a SQL connection string into a configuration object for Tedious.
 */
function parseConnectionString(connectionString: string, context: InvocationContext): any {
  const parts = connectionString.split(";");
  const config: any = { options: {} };

  parts.forEach((part) => {
    const [key, value] = part.split("=");
    if (!key || !value) return;

    switch (key.trim()) {
      case "Server":
        config.server = value;
        break;
      case "Database":
        config.options.database = value;
        break;
      case "User ID":
        config.authentication = { type: "default", options: { userName: value, password: "" } };
        break;
      case "Password":
        if (!config.authentication) {
          config.authentication = { type: "default", options: { userName: "", password: "" } };
        }
        config.authentication.options.password = value;
        break;
      case "Encrypt":
        config.options.encrypt = value.toLowerCase() === "true";
        break;
      case "TrustServerCertificate":
        config.options.trustServerCertificate = value.toLowerCase() === "true";
        break;
      case "Connect Timeout":
        config.options.connectTimeout = parseInt(value, 10);
        break;
      default:
        break;
    }
  });

  context.log("Parsed SQL connection configuration:", config);
  return config;
}

app.http("getComplianceData", {
  methods: ["POST"],
  authLevel: "function",
  handler: getComplianceDataHandler,
});

export default app;
