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

  const kvUri = "https://helix-keys.vault.azure.net/";
  const passwordSecretName = "sql-databaseserver-password";
  const sqlServer = "helix-database-server.database.windows.net";
  const coreDataDb = "helix-core-data";

  try {
    // 1) Retrieve SQL password from Azure Key Vault
    const secretClient = new SecretClient(kvUri, new DefaultAzureCredential());
    const passwordSecret = await secretClient.getSecret(passwordSecretName);
    const password = passwordSecret.value || "";
    context.log("Retrieved SQL password from Key Vault.");

    // 2) Parse SQL connection config for core-data only
    const coreDataConfig = parseConnectionString(
      `Server=${sqlServer};Database=${coreDataDb};User ID=helix-database-server;Password=${password};Encrypt=true;TrustServerCertificate=false;`,
      context
    );

    // 3) Determine date ranges (Previous, Current, Next)
    const todayDate = new Date(); // March 8, 2025
    const currentWeekStart = getStartOfWeek(todayDate); // 2025-03-03
    const currentWeekEnd = getEndOfWeek(currentWeekStart); // 2025-03-09
    const currentWeekRange = formatWeekRange(currentWeekStart, currentWeekEnd); // "Monday, 03/03/2025 - Sunday, 09/03/2025"

    const nextWeekStart = getNextWeekStart(currentWeekStart); // 2025-03-10
    const nextWeekEnd = getEndOfWeek(nextWeekStart); // 2025-03-16
    const nextWeekRange = formatWeekRange(nextWeekStart, nextWeekEnd); // "Monday, 10/03/2025 - Sunday, 16/03/2025"

    const previousWeekStart = new Date(currentWeekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7); // 2025-02-24
    const previousWeekEnd = getEndOfWeek(previousWeekStart); // 2025-03-02
    const previousWeekRange = formatWeekRange(previousWeekStart, previousWeekEnd); // "Monday, 24/02/2025 - Sunday, 02/03/2025"

    context.log(`Previous Week Range: ${previousWeekRange}`);
    context.log(`Current Week Range: ${currentWeekRange}`);
    context.log(`Next Week Range: ${nextWeekRange}`);

    // 4) Query the attendance data from the new table
    const attendees: PersonAttendance[] = await queryAttendance(
      previousWeekRange,
      currentWeekRange,
      nextWeekRange,
      previousWeekStart,  // Pass Date objects
      currentWeekStart,
      nextWeekStart,
      coreDataConfig,
      context
    );

    // 5) Query team data (unchanged)
    const teamData = await queryTeamData(coreDataConfig, context);

    return {
      status: 200,
      body: JSON.stringify({
        attendance: attendees,
        team: teamData
      })
    };
  } catch (error) {
    context.error("Error retrieving attendance data:", error);
    return {
      status: 500,
      body: "Error retrieving attendance data."
    };
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
  config: any,
  context: InvocationContext
): Promise<PersonAttendance[]> {
  return new Promise((resolve, reject) => {
    const connection = new Connection(config);

    connection.on("error", (err) => {
      context.error("SQL Connection Error (Attendance):", err);
      reject("An error occurred with the SQL connection.");
    });

    connection.on("connect", (err) => {
      if (err) {
        context.error("SQL Connection Error (Attendance):", err);
        reject("Failed to connect to SQL database.");
        return;
      }

      context.log("Successfully connected to SQL database (Attendance).");

      const query = `
        SELECT 
          [First_Name] AS name,
          [Level],
          [Week_Start],
          [Week_End],
          [ISO_Week] AS iso,
          [Attendance_Days] AS attendance
        FROM [dbo].[attendance]
        WHERE 
          [ISO_Week] IN (
            @PreviousISO, 
            @CurrentISO, 
            @NextISO
          )
        ORDER BY [First_Name];
      `;
      context.log("SQL Query (Attendance):", query);

      const sqlRequest = new SqlRequest(query, (err, rowCount) => {
        if (err) {
          context.error("SQL Query Execution Error (Attendance):", err);
          reject("SQL query failed.");
          connection.close();
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
          attendanceMap[name] = {
            name,
            level,
            weeks: {}
          };
        }

        // Combine attendance for the same week
        if (!attendanceMap[name].weeks[weekRange]) {
          attendanceMap[name].weeks[weekRange] = { iso, attendance };
        } else {
          const existing = attendanceMap[name].weeks[weekRange].attendance;
          const combined = [existing, attendance]
            .filter(Boolean)
            .join(",")
            .split(",")
            .map(day => day.trim())
            .filter((day, idx, arr) => day && arr.indexOf(day) === idx) // Remove duplicates
            .join(",");
          attendanceMap[name].weeks[weekRange].attendance = combined;
        }
      });

      sqlRequest.on("requestCompleted", () => {
        const results = Object.values(attendanceMap);
        results.sort((a, b) => a.name.localeCompare(b.name));
        context.log("Weekly Attendance Data:", results);
        resolve(results);
        connection.close();
      });

      const previousISO = getISOWeek(previousWeekStart); // 9
      const currentISO = getISOWeek(currentWeekStart);   // 10
      const nextISO = getISOWeek(nextWeekStart);         // 11

      sqlRequest.addParameter("PreviousISO", TYPES.Int, previousISO);
      sqlRequest.addParameter("CurrentISO", TYPES.Int, currentISO);
      sqlRequest.addParameter("NextISO", TYPES.Int, nextISO);

      context.log("Executing SQL query with parameters (Attendance):", {
        PreviousISO: previousISO,
        CurrentISO: currentISO,
        NextISO: nextISO
      });

      connection.execSql(sqlRequest);
    });

    connection.connect();
  });
}

// Unchanged functions below (team query and utilities remain the same)
async function queryTeamData(config: any, context: InvocationContext): Promise<{ First: string; Initials: string; ["Entra ID"]: string; Nickname?: string }[]> {
  return new Promise((resolve, reject) => {
    const connection = new Connection(config);

    connection.on("error", (err) => {
      context.error("SQL Connection Error (Team):", err);
      reject("An error occurred with the SQL connection.");
    });

    connection.on("connect", (err) => {
      if (err) {
        context.error("SQL Connection Error (Team):", err);
        reject("Failed to connect to SQL database.");
        return;
      }

      context.log("Successfully connected to SQL database (Team).");

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
          connection.close();
          return;
        }
        context.log(`SQL query executed successfully (Team). Rows returned: ${rowCount}`);
      });

      const teamData: { First: string; Initials: string; ["Entra ID"]: string; Nickname?: string }[] = [];

      sqlRequest.on("row", (columns) => {
        const obj: any = {};
        columns.forEach((col) => {
          obj[col.metadata.colName] = col.value;
        });
        teamData.push(obj);
      });

      sqlRequest.on("requestCompleted", () => {
        context.log("Team Data Retrieved:", teamData);
        resolve(teamData);
        connection.close();
      });

      connection.execSql(sqlRequest);
    });

    connection.connect();
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
        config.server = value;
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
  methods: ["POST"],
  authLevel: "function",
  handler: getAttendanceHandler,
});