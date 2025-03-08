import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { Connection, Request as SqlRequest, TYPES } from "tedious";
import axios from "axios";

interface AttendancePayload {
  firstName: string;
  initials: string;
  weekStart: string;
  attendanceDays: string;
}

export async function insertAttendance(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("Invocation started for insertAttendance Azure Function.");

  const kvUri = "https://helix-keys.vault.azure.net/";
  const sqlServer = "helix-database-server.database.windows.net";
  const coreDataDb = "helix-core-data";
  const clioTokenUrl = "https://eu.app.clio.com/oauth/token";
  const clioCalendarUrl = "https://eu.app.clio.com/api/v4/calendar_entries";
  const calendarId = 288748;

  try {
    // 1) Retrieve secrets from Key Vault
    const secretClient = new SecretClient(kvUri, new DefaultAzureCredential());
    const [passwordSecret, clientIdSecret, clientSecretSecret, refreshTokenSecret] = await Promise.all([
      secretClient.getSecret("sql-databaseserver-password"),
      secretClient.getSecret("clio-officeattendance-clientid"),
      secretClient.getSecret("clio-officeattendance-clientsecret"),
      secretClient.getSecret("clio-officeattendance-refreshtoken"),
    ]);
    const password = passwordSecret.value || "";
    const clientId = clientIdSecret.value || "";
    const clientSecret = clientSecretSecret.value || "";
    const refreshToken = refreshTokenSecret.value || "";
    context.log("Retrieved secrets from Key Vault.");

    // 2) Get Clio access token
    const tokenResponse = await axios.post(clioTokenUrl, {
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });
    const accessToken = tokenResponse.data.access_token;
    context.log("Clio access token obtained.");

    // 3) Parse and validate request body
    const rawUpdates = await req.json();
    if (!Array.isArray(rawUpdates) || !rawUpdates.every(isAttendancePayload)) {
      throw new Error("Invalid payload: expected an array of AttendancePayload objects.");
    }
    const updates: AttendancePayload[] = rawUpdates;
    if (updates.length === 0) {
      throw new Error("Empty payload: no updates provided.");
    }
    context.log("Received updates:", updates);

    // 4) SQL connection config
    const config = parseConnectionString(
      `Server=${sqlServer};Database=${coreDataDb};User ID=helix-database-server;Password=${password};Encrypt=true;TrustServerCertificate=false;`,
      context
    );

    // 5) Process each update
    const results = await Promise.all(
      updates.map((update) =>
        processAttendanceUpdate(update, accessToken, config, clioCalendarUrl, calendarId, context)
      )
    );

    return {
      status: 200,
      body: JSON.stringify(results),
    };
  } catch (error) {
    context.error("Error processing attendance updates:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      status: 500,
      body: `Error processing attendance updates: ${errorMessage}`,
    };
  } finally {
    context.log("Invocation completed for insertAttendance Azure Function.");
  }
}

// Type guard for AttendancePayload
function isAttendancePayload(item: any): item is AttendancePayload {
  return (
    typeof item === "object" &&
    typeof item.firstName === "string" &&
    typeof item.initials === "string" &&
    typeof item.weekStart === "string" &&
    typeof item.attendanceDays === "string"
  );
}

async function processAttendanceUpdate(
  update: AttendancePayload,
  accessToken: string,
  config: any,
  clioCalendarUrl: string,
  calendarId: number,
  context: InvocationContext
): Promise<any> {
  const { firstName, initials, weekStart, attendanceDays } = update;
  const weekEnd = getEndOfWeek(new Date(weekStart)).toISOString().split("T")[0];
  const isoWeek = getISOWeek(new Date(weekStart));

  await deleteExistingEntries(accessToken, initials, weekStart, isoWeek, config, clioCalendarUrl, context);
  const entryId = await createClioEntries(accessToken, firstName, attendanceDays, weekStart, clioCalendarUrl, calendarId, context);
  await upsertAttendanceRecord(
    entryId,
    firstName,
    initials,
    weekStart,
    weekEnd,
    isoWeek,
    attendanceDays,
    config,
    context
  );
  return { entryId, weekStart, attendanceDays };
}

async function deleteExistingEntries(
  accessToken: string,
  initials: string,
  weekStart: string,
  isoWeek: number,
  config: any,
  clioCalendarUrl: string,
  context: InvocationContext
): Promise<void> {
  const connection = await connectToSql(config, context);
  try {
    const query = `
      SELECT [Entry_ID], [Attendance_Days]
      FROM [dbo].[attendance]
      WHERE [Initials] = @Initials
        AND [Week_Start] = @WeekStart
        AND [Attendance_Days] != ''
    `;
    const rows = await executeQuery(connection, query, [
      { name: "Initials", type: TYPES.NVarChar, value: initials },
      { name: "WeekStart", type: TYPES.Date, value: weekStart },
    ], context);

    const deletePromises = rows.map(async (row: any) => {
      const entryId = row.Entry_ID;
      const url = `${clioCalendarUrl}/${entryId}.json`;
      const headers = { Authorization: `Bearer ${accessToken}` };

      const checkResponse = await axios.get(url, { headers });
      if (checkResponse.status === 200) {
        await axios.delete(url, { headers });
        context.log(`Deleted Clio entry ${entryId}`);
      }
    });
    await Promise.all(deletePromises);

    if (rows.length > 0) {
      const deleteQuery = `
        DELETE FROM [dbo].[attendance]
        WHERE [Initials] = @Initials
          AND [Week_Start] = @WeekStart
          AND [Attendance_Days] != ''
      `;
      await executeQuery(connection, deleteQuery, [
        { name: "Initials", type: TYPES.NVarChar, value: initials },
        { name: "WeekStart", type: TYPES.Date, value: weekStart },
      ], context);
      context.log(`Deleted ${rows.length} SQL rows for ${initials}, week ${weekStart}`);
    }
  } finally {
    connection.close();
  }
}

async function createClioEntries(
  accessToken: string,
  name: string,
  attendanceDays: string,
  weekStart: string,
  clioCalendarUrl: string,
  calendarId: number,
  context: InvocationContext
): Promise<number> {
  if (!attendanceDays) {
    return getNextEntryId(context); // No Clio entry needed, just a new ID
  }

  const daysMap: { [key: string]: number } = {
    Monday: 0,
    Tuesday: 1,
    Wednesday: 2,
    Thursday: 3,
    Friday: 4,
  };
  const dayOffsets = attendanceDays.split(",").map((day) => daysMap[day.trim()]).sort((a, b) => a - b);

  let currentBlock: number[] = [];
  const blocks: number[][] = [];
  for (const offset of dayOffsets) {
    if (currentBlock.length === 0 || offset === currentBlock[currentBlock.length - 1] + 1) {
      currentBlock.push(offset);
    } else {
      blocks.push([...currentBlock]);
      currentBlock = [offset];
    }
  }
  if (currentBlock.length > 0) blocks.push(currentBlock);

  let entryId: number = 0;
  for (const block of blocks) {
    const startDate = new Date(weekStart);
    startDate.setDate(startDate.getDate() + block[0]);
    const endDate = new Date(weekStart);
    endDate.setDate(endDate.getDate() + block[block.length - 1] + 1); // Exclusive end

    const headers = { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" };
    const data = {
      data: {
        all_day: true,
        calendar_owner: { id: calendarId },
        start_at: startDate.toISOString(),
        end_at: endDate.toISOString(),
        summary: name,
      },
    };
    const response = await axios.post(`${clioCalendarUrl}.json`, data, { headers });
    entryId = response.data.data.id;
    context.log(`Created Clio entry ${entryId} for ${name}, ${startDate} to ${endDate}`);
  }
  return entryId || getNextEntryId(context);
}

async function upsertAttendanceRecord(
  entryId: number,
  firstName: string,
  initials: string,
  weekStart: string,
  weekEnd: string,
  isoWeek: number,
  attendanceDays: string,
  config: any,
  context: InvocationContext
): Promise<void> {
  const connection = await connectToSql(config, context);
  try {
    const query = `
      MERGE [dbo].[attendance] AS target
      USING (VALUES (@EntryId, @FirstName, @Initials, @WeekStart, @WeekEnd, @IsoWeek, @AttendanceDays, GETDATE()))
        AS source (Entry_ID, First_Name, Initials, Week_Start, Week_End, ISO_Week, Attendance_Days, Confirmed_At)
      ON (target.Initials = source.Initials AND target.Week_Start = source.Week_Start)
      WHEN MATCHED THEN
        UPDATE SET 
          Entry_ID = source.Entry_ID,
          First_Name = source.First_Name,
          Attendance_Days = source.Attendance_Days,
          Confirmed_At = source.Confirmed_At
      WHEN NOT MATCHED THEN
        INSERT (Entry_ID, First_Name, Initials, Level, Week_Start, Week_End, ISO_Week, Attendance_Days, Confirmed_At)
        VALUES (
          source.Entry_ID,
          source.First_Name,
          source.Initials,
          (SELECT [Level] FROM [dbo].[team] WHERE Initials = source.Initials),
          source.Week_Start,
          source.Week_End,
          source.ISO_Week,
          source.Attendance_Days,
          source.Confirmed_At
        );
    `;
    await executeQuery(connection, query, [
      { name: "EntryId", type: TYPES.Int, value: entryId },
      { name: "FirstName", type: TYPES.NVarChar, value: firstName },
      { name: "Initials", type: TYPES.NVarChar, value: initials },
      { name: "WeekStart", type: TYPES.Date, value: weekStart },
      { name: "WeekEnd", type: TYPES.Date, value: weekEnd },
      { name: "IsoWeek", type: TYPES.Int, value: isoWeek },
      { name: "AttendanceDays", type: TYPES.NVarChar, value: attendanceDays },
    ], context);
    context.log(`Upserted attendance for ${initials}, week ${weekStart}`);
  } finally {
    connection.close();
  }
}

async function connectToSql(config: any, context: InvocationContext): Promise<Connection> {
  return new Promise((resolve, reject) => {
    const connection = new Connection(config);
    connection.on("connect", (err) => {
      if (err) reject(err);
      else resolve(connection);
    });
    connection.on("error", (err) => reject(err));
    connection.connect();
  });
}

async function executeQuery(
  connection: Connection,
  query: string,
  params: { name: string; type: any; value: any }[],
  context: InvocationContext
): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const request = new SqlRequest(query, (err) => {
      if (err) reject(err);
    });
    const rows: any[] = [];
    request.on("row", (columns) => {
      const row: any = {};
      columns.forEach((col) => (row[col.metadata.colName] = col.value));
      rows.push(row);
    });
    request.on("requestCompleted", () => resolve(rows));
    params.forEach((param) => request.addParameter(param.name, param.type, param.value));
    connection.execSql(request);
  });
}

async function getNextEntryId(context: InvocationContext): Promise<number> {
  const config = parseConnectionString(
    `Server=helix-database-server.database.windows.net;Database=helix-core-data;User ID=helix-database-server;Password=${(await new SecretClient("https://helix-keys.vault.azure.net/", new DefaultAzureCredential()).getSecret("sql-databaseserver-password")).value};Encrypt=true;TrustServerCertificate=false;`,
    context
  );
  const connection = await connectToSql(config, context);
  try {
    const rows = await executeQuery(
      connection,
      "SELECT ISNULL(MAX(Entry_ID), 0) + 1 AS NextId FROM [dbo].[attendance]",
      [],
      context
    );
    return rows[0].NextId;
  } finally {
    connection.close();
  }
}

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
      case "Password": config.authentication.options.password = value; break;
      case "Encrypt": config.options = { ...config.options, encrypt: value.toLowerCase() === "true" }; break;
      case "TrustServerCertificate": config.options = { ...config.options, trustServerCertificate: value.toLowerCase() === "true" }; break;
    }
  });
  return config;
}

function getEndOfWeek(startDate: Date): Date {
  const end = new Date(startDate);
  end.setDate(startDate.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
}

function getISOWeek(date: Date): number {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  return Math.round(((d.getTime() - week1.getTime()) / 86400000 + 1) / 7) + 1;
}

export default app.http("insertAttendance", {
  methods: ["POST"],
  authLevel: "function",
  handler: insertAttendance,
});