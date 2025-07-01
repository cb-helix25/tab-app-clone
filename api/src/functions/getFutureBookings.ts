// src/functions/getFutureBookings.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { Connection, Request as SqlRequest } from "tedious";

// Define the interface for a booking result (from each table)
interface SpaceBookingResult {
  id: number;
  fee_earner: string;
  booking_date: string;  // 'YYYY-MM-DD'
  booking_time: string;  // 'HH:MM:SS'
  duration: number;
  reason: string;
  created_at: string;
  updated_at: string;
  spaceType: "Boardroom" | "Soundproof Pod";
}

// New interface for the grouped response
export interface FutureBookingsResponse {
  boardroomBookings: SpaceBookingResult[];
  soundproofBookings: SpaceBookingResult[];
}

export async function getFutureBookingsHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("getFutureBookingsHandler invoked.");

  // Allow GET requests
  if (req.method !== "GET") {
    context.warn(`Unsupported HTTP method: ${req.method}`);
    return { status: 405, body: "Method Not Allowed. Please use GET." };
  }

  try {
    context.log("Initiating SQL queries for future bookings.");
    const bookings = await fetchFutureBookings(context);
    context.log("Successfully fetched future bookings.", bookings);
    return {
      status: 200,
      body: JSON.stringify(bookings),
    };
  } catch (error) {
    context.error("Error fetching future bookings:", error);
    return { status: 500, body: "Error fetching future bookings." };
  } finally {
    context.log("getFutureBookingsHandler invocation completed.");
  }
}

async function runQuery(query: string, config: any, context: InvocationContext): Promise<any[]> {
  return new Promise<any[]>((resolve, reject) => {
    const connection = new Connection(config);
    const results: any[] = [];

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
      context.log("Connected to SQL database.");

      const sqlRequest = new SqlRequest(query, (err, rowCount) => {
        if (err) {
          context.error("SQL Query Execution Error:", err);
          reject("SQL query failed.");
          connection.close();
          return;
        }
        context.log(`SQL query executed successfully. Rows returned: ${rowCount}`);
      });

      // Here we convert booking_date & booking_time to simple strings:
      sqlRequest.on("row", (columns) => {
        const row: any = {};
        columns.forEach((column: { metadata: { colName: any; }; value: any; }) => {
          const colName = column.metadata.colName;
          const val = column.value;

          if (colName === "booking_date" && val instanceof Date) {
            // Convert to "YYYY-MM-DD"
            row[colName] = val.toISOString().substring(0, 10);
          } else if (colName === "booking_time" && val instanceof Date) {
            // Convert to "HH:MM:SS"
            // (first 19 chars => "1970-01-01T09:53:00", then substring from 11..19 => "09:53:00")
            const isoStr = val.toISOString(); // e.g. "1970-01-01T09:53:00.000Z"
            row[colName] = isoStr.substring(11, 19); // e.g. "09:53:00"
          } else {
            // Pass other columns through unchanged
            row[colName] = val;
          }
        });
        results.push(row);
      });

      sqlRequest.on("requestCompleted", () => {
        resolve(results);
        connection.close();
      });

      connection.execSql(sqlRequest);
    });

    connection.connect();
  });
}

async function fetchFutureBookings(context: InvocationContext): Promise<FutureBookingsResponse> {
  const kvUri = "https://helix-keys.vault.azure.net/";
  const passwordSecretName = "sql-databaseserver-password";
  const sqlServer = "helix-database-server.database.windows.net";
  const sqlDatabase = "helix-project-data"; // Adjust if necessary

  // Retrieve SQL password from Azure Key Vault
  const secretClient = new SecretClient(kvUri, new DefaultAzureCredential());
  const passwordSecret = await secretClient.getSecret(passwordSecretName);
  const password = passwordSecret.value || "";
  context.log("Retrieved SQL password from Key Vault.");

  const connectionString = `Server=${sqlServer};Database=${sqlDatabase};User ID=helix-database-server;Password=${password};Encrypt=true;TrustServerCertificate=false;`;
  const config = parseConnectionString(connectionString, context);

  // Define separate queries for each table
  const boardroomQuery = `
    SELECT id, fee_earner, booking_date, booking_time, duration, reason, created_at, updated_at
    FROM [dbo].[boardroom_bookings]
    WHERE booking_date >= CAST(GETDATE() AS date);
  `;
  const soundproofQuery = `
    SELECT id, fee_earner, booking_date, booking_time, duration, reason, created_at, updated_at
    FROM [dbo].[soundproofpod_bookings]
    WHERE booking_date >= CAST(GETDATE() AS date);
  `;

  // Run both queries in parallel
  const [boardroomResults, soundproofResults] = await Promise.all([
    runQuery(boardroomQuery, config, context),
    runQuery(soundproofQuery, config, context),
  ]);

  // Tag each entry based on its source table
  const boardroomTagged = boardroomResults.map((row) => ({
    ...row,
    spaceType: "Boardroom" as const,
  }));
  const soundproofTagged = soundproofResults.map((row) => ({
    ...row,
    spaceType: "Soundproof Pod" as const,
  }));

  // Return an object grouping the bookings by type
  const futureBookingsResponse: FutureBookingsResponse = {
    boardroomBookings: boardroomTagged,
    soundproofBookings: soundproofTagged,
  };

  return futureBookingsResponse;
}

function parseConnectionString(connectionString: string, context: InvocationContext): any {
  const parts = connectionString.split(";");
  const config: any = {};
  parts.forEach((part) => {
    const [key, value] = part.split("=");
    if (!key || !value) return;
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
          options: { userName: value, password: "" },
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

export default app.http("getFutureBookings", {
  methods: ["GET"],
  authLevel: "function",
  handler: getFutureBookingsHandler,
});
