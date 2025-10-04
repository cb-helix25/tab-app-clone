// invisible change 2
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { Connection, Request as SqlRequest, TYPES } from "tedious";

interface WeeklyAttendance {
  iso: number;
  attendance: string;
}

interface PersonAttendance {
  name: string;
  level: string;
  weeks: { [weekRange: string]: WeeklyAttendance };
}

export async function getAttendanceHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("Invocation started for getAttendance Azure Function.");

  // CORS headers per workspace guidelines
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    // Fast preflight
    return { status: 204, headers: corsHeaders };
  }

  try {
    // Build SQL config (env first, fallback to Key Vault for password)
    const coreDataConfig = await getSqlConfig(context);

    // Dates: Previous, Current, Next weeks
    const todayDate = new Date();
    const currentWeekStart = getStartOfWeek(todayDate);
    const currentWeekEnd = getEndOfWeek(currentWeekStart);
    const currentWeekRange = formatWeekRange(currentWeekStart, currentWeekEnd);

    const nextWeekStart = getNextWeekStart(currentWeekStart);
    const nextWeekEnd = getEndOfWeek(nextWeekStart);
    const nextWeekRange = formatWeekRange(nextWeekStart, nextWeekEnd);

    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    const previousWeekEnd = getEndOfWeek(previousWeekStart);
    const previousWeekRange = formatWeekRange(previousWeekStart, previousWeekEnd);

    context.log(`Previous Week Range: ${previousWeekRange}`);
    context.log(`Current Week Range: ${currentWeekRange}`);
    context.log(`Next Week Range: ${nextWeekRange}`);

    // Open ONE connection per invocation and reuse for both queries
    const connection = new Connection(coreDataConfig);
    await connectWithRetry(connection, context);

    try {
      const attendees: PersonAttendance[] = await queryAttendance(
        previousWeekRange,
        currentWeekRange,
        nextWeekRange,
        previousWeekStart,
        currentWeekStart,
        nextWeekStart,
        connection,
        context
      );

      const teamData = await queryTeamData(connection, context);

      return {
        status: 200,
        headers: corsHeaders,
        body: JSON.stringify({ attendance: attendees, team: teamData })
      };
    } finally {
      // Always close the connection for this invocation
      try { connection.close(); } catch { /* noop */ }
    }
  } catch (error) {
    context.error("Error retrieving attendance data:", error);
    return { status: 500, headers: corsHeaders, body: "Error retrieving attendance data." };
  } finally {
    context.log("Invocation completed for getAttendance Azure Function.");
  }
}

// Updated queryAttendance function with Date parameters
async function queryAttendance(
  previousWeekRange: string,
  currentWeekRange: string,
  nextWeekRange: string,
  previousWeekStart: Date,
  currentWeekStart: Date,
  nextWeekStart: Date,
  connection: Connection,
  context: InvocationContext
): Promise<PersonAttendance[]> {
  return new Promise((resolve, reject) => {
    const query = `
        WITH LatestAttendance AS (
          SELECT 
            [First_Name] AS name,
            [Level],
            [Week_Start],
            [Week_End],
            [ISO_Week] AS iso,
            [Attendance_Days] AS attendance,
            ROW_NUMBER() OVER (
              PARTITION BY [First_Name], [ISO_Week] 
              ORDER BY [Confirmed_At] DESC
            ) as rn
          FROM [dbo].[attendance]
          WHERE 
            [ISO_Week] IN (
              @PreviousISO, 
              @CurrentISO, 
              @NextISO
            )
        )
        SELECT name, Level, Week_Start, Week_End, iso, attendance
        FROM LatestAttendance
        WHERE rn = 1
        ORDER BY name;
      `;
    context.log("SQL Query (Attendance):", query);

    const sqlRequest = new SqlRequest(query, (err, rowCount) => {
      if (err) {
        context.error("SQL Query Execution Error (Attendance):", err);
        reject("SQL query failed.");
        return;
      }
      context.log(`SQL query executed successfully (Attendance). Rows returned: ${rowCount}`);
    });

    const attendanceMap: { [name: string]: PersonAttendance } = {};

    sqlRequest.on("row", (columns) => {
      const name = (columns.find(c => c.metadata.colName === "name")?.value as string) || "";
      const level = (columns.find(c => c.metadata.colName === "Level")?.value as string) || "";
      const weekStart = (columns.find(c => c.metadata.colName === "Week_Start")?.value as Date);
      const weekEnd = (columns.find(c => c.metadata.colName === "Week_End")?.value as Date);
      const iso = (columns.find(c => c.metadata.colName === "iso")?.value as number) || 0;
      const attendance = (columns.find(c => c.metadata.colName === "attendance")?.value as string) || "";

      const weekRange = formatWeekRange(weekStart, weekEnd);

      if (!attendanceMap[name]) {
        attendanceMap[name] = { name, level, weeks: {} };
      }

      // Use the latest attendance record (no combination needed)
      attendanceMap[name].weeks[weekRange] = { iso, attendance };
    });

    sqlRequest.on("requestCompleted", () => {
      const results = Object.values(attendanceMap);
      results.sort((a, b) => a.name.localeCompare(b.name));
      context.log("Weekly Attendance Data:", results);
      resolve(results);
    });

    const previousISO = getISOWeek(previousWeekStart);
    const currentISO = getISOWeek(currentWeekStart);
    const nextISO = getISOWeek(nextWeekStart);

    sqlRequest.addParameter("PreviousISO", TYPES.Int, previousISO);
    sqlRequest.addParameter("CurrentISO", TYPES.Int, currentISO);
    sqlRequest.addParameter("NextISO", TYPES.Int, nextISO);

    context.log("Executing SQL query with parameters (Attendance):", {
      PreviousISO: previousISO,
      CurrentISO: currentISO,
      NextISO: nextISO
    });

    execSqlWithRetry(connection, sqlRequest, context).catch(reject);
  });
}

// Team query using the same open connection
async function queryTeamData(connection: Connection, context: InvocationContext): Promise<{ First: string; Initials: string; ["Entra ID"]: string; Nickname?: string }[]> {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT [First], [Initials], [Entra ID], [Nickname]
      FROM [dbo].[team]
      WHERE [status] <> 'inactive';
    `;
    context.log("SQL Query (Team):", query);

    const sqlRequest = new SqlRequest(query, (err, rowCount) => {
      if (err) {
        context.error("SQL Query Execution Error (Team):", err);
        reject("SQL query failed.");
        return;
      }
      context.log(`SQL query executed successfully (Team). Rows returned: ${rowCount}`);
    });

    const teamData: { First: string; Initials: string; ["Entra ID"]: string; Nickname?: string }[] = [];

    sqlRequest.on("row", (columns) => {
      const obj: Record<string, unknown> = {};
      columns.forEach((col) => {
        obj[col.metadata.colName] = col.value;
      });
      teamData.push(obj as { First: string; Initials: string; ["Entra ID"]: string; Nickname?: string });
    });

    sqlRequest.on("requestCompleted", () => {
      context.log("Team Data Retrieved:", teamData);
      resolve(teamData);
    });

    execSqlWithRetry(connection, sqlRequest, context).catch(reject);
  });
}

function parseConnectionString(connectionString: string, context: InvocationContext): any {
  const parts = connectionString.split(";");
  const config: any = {};

  parts.forEach((part) => {
    const [key, value] = part.split("=");
    if (!key || !value) return;

    switch (key.trim()) {
      case "Server":
        // Support optional tcp:hostname,1433 form
        config.server = value.replace(/^tcp:/i, "").split(",")[0];
        break;
      case "Database":
        config.options = { ...config.options, database: value };
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

  // Sensible defaults to help with transient networking
  config.options = {
    requestTimeout: 30000,
    connectTimeout: config.options?.connectTimeout ?? 15000,
    rowCollectionOnRequestCompletion: false,
    ...config.options,
  };

  return config;
}

function getStartOfWeek(date: Date): Date {
  const day = date.getDay();
  const diff = (day === 0 ? -6 : 1) - day;
  const start = new Date(date);
  start.setDate(date.getDate() + diff);
  start.setHours(0, 0, 0, 0);
  return start;
}

function getNextWeekStart(currentWeekStart: Date): Date {
  const nextWeekStart = new Date(currentWeekStart);
  nextWeekStart.setDate(currentWeekStart.getDate() + 7);
  nextWeekStart.setHours(0, 0, 0, 0);
  return nextWeekStart;
}

function getEndOfWeek(startDate: Date): Date {
  const end = new Date(startDate);
  end.setDate(startDate.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function formatWeekRange(start: Date, end: Date): string {
  const options: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
  const startStr = start.toLocaleDateString("en-GB", options);
  const endStr = end.toLocaleDateString("en-GB", options);
  return `Monday, ${startStr} - Sunday, ${endStr}`;
}

function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  return Math.round(((d.getTime() - week1.getTime()) / 86400000 + 1) / 7) + 1;
}

export default app.http("getAttendance", {
  methods: ["POST", "OPTIONS"],
  authLevel: "function",
  handler: getAttendanceHandler,
});

// Helpers
function getCorsHeaders(req: HttpRequest): Record<string, string> {
  const origin = req.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, x-functions-key",
    "Vary": "Origin"
  };
}

async function getSqlConfig(context: InvocationContext): Promise<any> {
  // Prefer a full connection string if provided
  const raw = process.env.SQL_CONNECTION_STRING;
  if (raw && raw.trim().length > 0) {
    return parseConnectionString(raw, context);
  }

  // Otherwise assemble from discrete env vars, with Key Vault fallback for password
  const server = process.env.SQL_SERVER_FQDN || "helix-database-server.database.windows.net";
  const database = process.env.SQL_DATABASE_NAME || "helix-core-data";
  const user = process.env.SQL_USER_NAME || "helix-database-server";
  const encrypt = (process.env.SQL_ENCRYPT || "true").toLowerCase() === "true";
  const trust = (process.env.SQL_TRUST_SERVER_CERTIFICATE || "false").toLowerCase() === "true";

  let password = process.env.SQL_PASSWORD || "";
  if (!password) {
    const kvUri = process.env.KEY_VAULT_URI || "https://helix-keys.vault.azure.net/";
    const passwordSecretName = process.env.SQL_PASSWORD_SECRET_NAME || "sql-databaseserver-password";
    const secretClient = new SecretClient(kvUri, new DefaultAzureCredential());
    const passwordSecret = await secretClient.getSecret(passwordSecretName);
    password = passwordSecret.value || "";
    context.log("Retrieved SQL password from Key Vault.");
  }

  const cs = `Server=${server};Database=${database};User ID=${user};Password=${password};Encrypt=${encrypt};TrustServerCertificate=${trust};`;
  return parseConnectionString(cs, context);
}

async function connectWithRetry(connection: Connection, context: InvocationContext, attempts = 3): Promise<void> {
  let lastErr: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      await new Promise<void>((resolve, reject) => {
        const onError = (err: unknown) => { cleanup(); reject(err); };
        const onConnect = (err?: Error) => {
          if (err) { cleanup(); reject(err); return; }
          cleanup(); resolve();
        };
        const cleanup = () => {
          connection.off("error", onError as any);
          connection.off("connect", onConnect as any);
        };
        connection.on("error", onError as any);
        connection.on("connect", onConnect as any);
        connection.connect();
      });
      return; // success
    } catch (err) {
      lastErr = err;
      const delay = 150 * Math.pow(2, i);
      context.warn?.(`SQL connect attempt ${i + 1} failed; retrying in ${delay}ms`);
      await sleep(delay);
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("SQL connect failed");
}

async function execSqlWithRetry(connection: Connection, request: SqlRequest, context: InvocationContext, attempts = 2): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let tryCount = 0;
    const run = () => {
      tryCount++;
      connection.execSql(request);
    };

    const onError = (err: unknown) => {
      // Only retry once on transient network errors
      const msg = String((err as Error)?.message || "");
      const transient = /ESOCKET|ECONNRESET|ETIMEDOUT/i.test(msg);
      if (transient && tryCount < attempts) {
        const delay = 200 * tryCount;
        context.warn?.(`Transient SQL error; retrying in ${delay}ms`);
        setTimeout(run, delay);
      } else {
        cleanup();
        reject(err);
      }
    };

    const onRequestCompleted = () => {
      cleanup();
      resolve();
    };

    const cleanup = () => {
      request.off("error", onError as any);
      request.off("requestCompleted", onRequestCompleted as any);
    };

    request.on("error", onError as any);
    request.on("requestCompleted", onRequestCompleted as any);
    run();
  });
}

function sleep(ms: number): Promise<void> { return new Promise(res => setTimeout(res, ms)); }