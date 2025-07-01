import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { Connection, Request as SqlRequest } from "tedious";

// Table row interface
interface AnnualLeaveRecord {
  request_id: number;
  fe: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: string;
  days_taken: number;
  leave_type: string | null;
  rejection_notes: string | null;
  hearing_confirmation: boolean;
  hearing_details: string | null;
}

// Helper: Parse SQL connection string
function parseConnectionString(connectionString: string, context: InvocationContext): any {
  const parts = connectionString.split(";");
  const config: any = {};
  parts.forEach((part) => {
    const [key, value] = part.split("=");
    if (!key || !value) return;
    switch (key.trim()) {
      case "Server": config.server = value; break;
      case "Database": config.options = { ...config.options, database: value }; break;
      case "User ID": config.authentication = { type: "default", options: { userName: value, password: "" } }; break;
      case "Password":
        if (!config.authentication) config.authentication = { type: "default", options: { userName: "", password: "" } };
        config.authentication.options.password = value; break;
      case "Encrypt": config.options = { ...config.options, encrypt: value.toLowerCase() === "true" }; break;
      case "TrustServerCertificate": config.options = { ...config.options, trustServerCertificate: value.toLowerCase() === "true" }; break;
      case "Connect Timeout": config.options = { ...config.options, connectTimeout: parseInt(value, 10) }; break;
    }
  });
  return config;
}

// Helper: Format date as yyyy-mm-dd
function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = (`0${date.getMonth() + 1}`).slice(-2);
  const day = (`0${date.getDate()}`).slice(-2);
  return `${year}-${month}-${day}`;
}

// Main handler
export async function getAnnualLeaveAllHandler(_req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("getAnnualLeaveAll: Fetching all annual leave records.");

  try {
    // Get SQL password from Key Vault
    const kvUri = "https://helix-keys.vault.azure.net/";
    const passwordSecretName = "sql-databaseserver-password";
    const sqlServer = "helix-database-server.database.windows.net";
    const sqlDatabase = "helix-project-data";
    const secretClient = new SecretClient(kvUri, new DefaultAzureCredential());
    const passwordSecret = await secretClient.getSecret(passwordSecretName);
    const password = passwordSecret.value || "";

    // Connection config
    const connectionString = `Server=${sqlServer};Database=${sqlDatabase};User ID=helix-database-server;Password=${password};Encrypt=true;TrustServerCertificate=false;`;
    const config = parseConnectionString(connectionString, context);

    // Query all leave
    const query = `
      SELECT 
        [request_id],
        [fe],
        [start_date],
        [end_date],
        [reason],
        [status],
        [days_taken],
        [leave_type],
        [rejection_notes],
        [hearing_confirmation],
        [hearing_details]
      FROM [dbo].[annualLeave];
    `;

    // Query SQL and return all rows
    const data: AnnualLeaveRecord[] = await new Promise((resolve, reject) => {
      const connection = new Connection(config);

      connection.on("error", (err) => {
        context.error("SQL Connection Error:", err);
        reject("SQL connection error");
      });

      connection.on("connect", (err) => {
        if (err) {
          context.error("SQL Connection Error:", err);
          reject("Failed to connect to SQL database.");
          return;
        }

        const request = new SqlRequest(query, (err) => {
          if (err) {
            reject(err);
            connection.close();
            return;
          }
        });

        const results: AnnualLeaveRecord[] = [];
        request.on("row", (columns) => {
          const entry: any = {};
          columns.forEach((col: { metadata: { colName: string | number; }; value: any; }) => {
            entry[col.metadata.colName] = col.value;
          });
          results.push({
            request_id: entry.request_id,
            fe: entry.fe,
            start_date: formatDate(new Date(entry.start_date)),
            end_date: formatDate(new Date(entry.end_date)),
            reason: entry.reason,
            status: entry.status,
            days_taken: entry.days_taken,
            leave_type: entry.leave_type,
            rejection_notes: entry.rejection_notes,
            hearing_confirmation: entry.hearing_confirmation,
            hearing_details: entry.hearing_details,
          });
        });

        request.on("requestCompleted", () => {
          resolve(results);
          connection.close();
        });

        connection.execSql(request);
      });

      connection.connect();
    });

    return {
      status: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ all_data: data }),
    };
  } catch (error: any) {
    context.error("getAnnualLeaveAll error:", error);
    return {
      status: 500,
      body: "Error fetching all annual leave records.",
    };
  }
}

app.http("getAnnualLeaveAll", {
  methods: ["GET"],
  authLevel: "function",
  handler: getAnnualLeaveAllHandler,
});