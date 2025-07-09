// invisible change
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { Connection, Request as SqlRequest } from "tedious";

// Handler to retrieve transactions data from SQL
export async function getTransactionsHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("Invocation started for getTransactions Azure Function.");

  try {
    context.log("Initiating SQL query to retrieve transactions.");
    const transactions = await queryTransactionsFromSQL(context);
    context.log("Successfully retrieved transactions from SQL database.", { transactions });
    
    return {
      status: 200,
      body: JSON.stringify(transactions)
    };
  } catch (error) {
    context.error("Error retrieving transactions:", error);
    return {
      status: 500,
      body: "Error retrieving transactions."
    };
  } finally {
    context.log("Invocation completed for getTransactions Azure Function.");
  }
}

// Register the function with Azure Functions runtime
app.http("getTransactions", {
  methods: ["GET"],
  authLevel: "function",
  handler: getTransactionsHandler
});

// SQL query function for the transactions table (selects all columns)
async function queryTransactionsFromSQL(context: InvocationContext): Promise<any[]> {
  // Use the same key vault and database values as the POID6Years function
  const kvUri = "https://helix-keys.vault.azure.net/";
  const passwordSecretName = "sql-databaseserver-password";
  const sqlServer = "helix-database-server.database.windows.net";
  const sqlDatabase = "helix-core-data";

  const secretClient = new SecretClient(kvUri, new DefaultAzureCredential());
  const passwordSecret = await secretClient.getSecret(passwordSecretName);
  const password = passwordSecret.value;

  // Build connection string (update User ID as needed)
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

      // Query to select all data from the transactions table
      const query = `
        SELECT *
        FROM transactions
        ORDER BY transaction_date DESC
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

      connection.execSql(sqlRequest);
    });

    connection.connect();
  });
}

// Helper function to parse SQL connection string into a Tedious config
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

  config.options = {
    ...config.options,
    encrypt: true,
    rowCollectionOnDone: true,
    trustServerCertificate: false,
  };

  return config;
}

export default app;
