// invisible change
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { Connection, Request as SqlRequest, TYPES } from "tedious";

// Define the handler function
export async function getPOID6YearsHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("Invocation started for getPOID6Years Azure Function.");

  // Calculate the threshold date: today minus 6 years
  const today = new Date();
  const thresholdDate = new Date(today);
  thresholdDate.setFullYear(today.getFullYear() - 6);
  const formattedThresholdDate = thresholdDate.toISOString().split('T')[0];

  try {
    context.log("Initiating SQL query to retrieve POID entries not older than 6 years.");
    const poidEntries = await queryPOID6YearsFromSQL(formattedThresholdDate, context);
    context.log("Successfully retrieved POID entries from SQL database.", { poidEntries });
    
    return {
      status: 200,
      body: JSON.stringify(poidEntries)
    };
  } catch (error) {
    context.error("Error retrieving POID entries:", error);
    return {
      status: 500,
      body: "Error retrieving POID entries."
    };
  } finally {
    context.log("Invocation completed for getPOID6Years Azure Function.");
  }
}

// Register the function
app.http("getPOID6Years", {
  methods: ["GET"],
  authLevel: "function",
  handler: getPOID6YearsHandler
});

// SQL query function
async function queryPOID6YearsFromSQL(thresholdDate: string, context: InvocationContext): Promise<any[]> {
  const kvUri = "https://helix-keys.vault.azure.net/";
  const passwordSecretName = "sql-databaseserver-password";
  const sqlServer = "helix-database-server.database.windows.net";
  const sqlDatabase = "helix-core-data";

  const secretClient = new SecretClient(kvUri, new DefaultAzureCredential());
  const passwordSecret = await secretClient.getSecret(passwordSecretName);
  const password = passwordSecret.value;

  const connectionString = `Server=${sqlServer};Database=${sqlDatabase};User ID=helix-database-server;Password=${password};`;
  const config = parseConnectionString(connectionString, context);

  return new Promise<any[]>((resolve, reject) => {
    const connection = new Connection(config);

    connection.on("error", (err) => {
      context.error("SQL Connection Error:", err);
      reject("An error occurred with the SQL connection.");
    });

    connection.on("connect", (err) => {
      if (err) {
        context.error("SQL Connection Error:", err);
        reject("Failed to connect to SQL database.");
        return;
      }

      // SQL query to fetch POID entries with submission_date >= threshold date
      const query = `
        SELECT * FROM poid
        WHERE submission_date >= @ThresholdDate
        ORDER BY submission_date DESC
      `;

      const sqlRequest = new SqlRequest(query, (err, rowCount) => {
        if (err) {
          context.error("SQL Query Execution Error:", err);
          reject("SQL query failed.");
          connection.close();
          return;
        }
        context.log(`SQL query executed successfully. Rows returned: ${rowCount}`);
      });

      const result: any[] = [];

      sqlRequest.on('row', (columns) => {
        const row: any = {};
        columns.forEach((column: { metadata: { colName: string }, value: any }) => {
          row[column.metadata.colName] = column.value;
        });
        result.push(row);
      });

      sqlRequest.on('requestCompleted', () => {
        resolve(result);
        connection.close();
      });

      // Add the threshold date parameter
      sqlRequest.addParameter('ThresholdDate', TYPES.DateTime, thresholdDate);

      connection.execSql(sqlRequest);
    });

    connection.connect();
  });
}

// Helper function to parse SQL connection string
function parseConnectionString(connectionString: string, context: InvocationContext): any {
  const parts = connectionString.split(';');
  const config: any = {};

  parts.forEach(part => {
    const [key, value] = part.split('=');
    if (!key || !value) {
      return;
    }
    switch (key.trim()) {
      case 'Server':
        config.server = value;
        break;
      case 'Database':
        config.options = { ...config.options, database: value };
        break;
      case 'User ID':
        config.authentication = {
          type: 'default',
          options: { userName: value, password: '' }
        };
        break;
      case 'Password':
        if (!config.authentication) {
          config.authentication = { type: 'default', options: { userName: '', password: '' } };
        }
        config.authentication.options.password = value;
        break;
      default:
        break;
    }
  });

  return config;
}

export default app;
