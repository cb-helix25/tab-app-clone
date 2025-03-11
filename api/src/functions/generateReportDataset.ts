// src/functions/generateReportDataset.ts
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { Connection, Request as SqlRequest, TYPES } from "tedious";
import fetch from "node-fetch";
import { URLSearchParams } from "url";

// Define interfaces
interface UserData {
    [key: string]: any;
    "Created Date"?: string;
    "Created Time"?: string;
    "Full Name"?: string;
    "Last"?: string;
    "First"?: string;
    "Nickname"?: string;
    "Initials"?: string;
    "Email"?: string;
    "Entra ID"?: string;
    "Clio ID"?: string;
    "Rate"?: number;
    "Role"?: string;
    "AOW"?: string;
    "holiday_entitlement"?: number;
    "status"?: string;
}

interface TeamData extends UserData {}

interface EnquiryData {
    [key: string]: any;
}

interface MatterData {
    [key: string]: any;
}

interface ClioActivity {
    [key: string]: any;
    id?: number;
    date?: string;
    created_at?: string;
    updated_at?: string;
    type?: string;
    matter?: { id: number; display_number: string };
    quantity_in_hours?: number;
    note?: string;
    total?: number;
    price?: number;
    expense_category?: any;
    activity_description?: { id: number; name: string };
    user?: { id: number };
    bill?: { id: number };
    billed?: boolean;
}

interface CollectedTimeData {
    [key: string]: any;
    totalPaymentAllocated?: number;
}

interface RequestBody {
    datasets: string[];
    clioId?: string;
    email?: string;
    fullName?: string;
    initials?: string;
    dateFrom?: string;
    dateTo?: string;
    entraId: string;
}

// Handler function
export async function generateReportDatasetHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log("generateReportDataset function triggered.");

    if (req.method !== "POST") {
        return {
            status: 405,
            body: "Method Not Allowed. Please use POST.",
        };
    }

    let body: RequestBody;
    try {
        body = (await req.json()) as RequestBody;
        context.log("Parsed request body:", body);
    } catch (error) {
        context.error("Error parsing JSON body:", error);
        return {
            status: 400,
            body: "Invalid JSON format in request body.",
        };
    }

    const { datasets, entraId } = body;

    if (!datasets || !Array.isArray(datasets) || datasets.length === 0) {
        return {
            status: 400,
            body: "Missing or invalid 'datasets' array in request body.",
        };
    }

    if (!entraId) {
        return {
            status: 400,
            body: "Missing 'entraId' in request body. A user is required via Teams context.",
        };
    }

    const responseData: { [key: string]: any } = {};

    const kvUri = process.env.KV_URI || "https://helix-keys.vault.azure.net/";
    const passwordSecretName = process.env.SQL_PASSWORD_SECRET_NAME || "sql-databaseserver-password";
    const sqlServer = process.env.SQL_SERVER || "helix-database-server.database.windows.net";
    const sqlDatabase = process.env.SQL_DATABASE || "helix-core-data";
    const clioRefreshTokenSecretName = "clio-pbi-refreshtoken";
    const clioSecretName = "clio-pbi-secret";
    const clioClientIdSecretName = "clio-pbi-clientid";
    const clioTokenUrl = "https://eu.app.clio.com/oauth/token";
    const clioActivitiesUrl = "https://eu.app.clio.com/api/v4/activities.json";

    const secretClient = new SecretClient(kvUri, new DefaultAzureCredential());
    const [passwordSecret, refreshTokenSecret, clientSecret, clientIdSecret] = await Promise.all([
        secretClient.getSecret(passwordSecretName),
        secretClient.getSecret(clioRefreshTokenSecretName),
        secretClient.getSecret(clioSecretName),
        secretClient.getSecret(clioClientIdSecretName),
    ]);

    const password = passwordSecret.value;
    const refreshToken = refreshTokenSecret.value;
    const clientSecretValue = clientSecret.value;
    const clientId = clientIdSecret.value;

    // Validate Clio credentials
    if (!refreshToken || !clientSecretValue || !clientId) {
        context.error("Missing Clio OAuth credentials from Key Vault.");
        return {
            status: 500,
            body: "Missing Clio OAuth credentials.",
        };
    }

    const config = {
        server: sqlServer,
        authentication: {
            type: "default",
            options: {
                userName: process.env.SQL_USER || "helix-database-server",
                password: password,
            },
        },
        options: {
            database: sqlDatabase,
            encrypt: true,
            trustServerCertificate: false,
        },
    };

    const connection = new Connection(config);

    try {
        // SQL Connection
        await new Promise<void>((resolve, reject) => {
            connection.on("connect", (err) => {
                if (err) {
                    context.error("SQL Connection Error:", err);
                    reject(err);
                } else {
                    resolve();
                }
            });
            connection.on("error", (err) => {
                context.error("Connection Error:", err);
                reject(err);
            });
            connection.connect();
        });

        // Fetch userData
        if (datasets.includes("userData")) {
            responseData.userData = await new Promise<UserData[]>((resolve, reject) => {
                const result: UserData[] = [];
                const query = `SELECT * FROM [dbo].[team] WHERE [Entra ID] = @entraId`;
                const request = new SqlRequest(query, (err) => {
                    if (err) {
                        context.error("SQL Query Error (userData):", err);
                        reject(err);
                    }
                });
                request.addParameter("entraId", TYPES.NVarChar, entraId);

                request.on("row", (columns) => {
                    const row: UserData = {};
                    columns.forEach((column) => {
                        row[column.metadata.colName] = column.value;
                    });
                    result.push(row);
                });

                request.on("requestCompleted", () => resolve(result));
                connection.execSql(request);
            });
        }

        // Fetch teamData
        if (datasets.includes("teamData")) {
            responseData.teamData = await new Promise<TeamData[]>((resolve, reject) => {
                const result: TeamData[] = [];
                const query = `
                    SELECT 
                        [Created Date],
                        [Created Time],
                        [Full Name],
                        [Last],
                        [First],
                        [Nickname],
                        [Initials],
                        [Email],
                        [Entra ID],
                        [Clio ID],
                        [Rate],
                        [Role],
                        [AOW],
                        [holiday_entitlement],
                        [status]
                    FROM [dbo].[team]
                `;
                const request = new SqlRequest(query, (err) => {
                    if (err) {
                        context.error("SQL Query Error (teamData):", err);
                        reject(err);
                    }
                });

                request.on("row", (columns) => {
                    const row: TeamData = {};
                    columns.forEach((column) => {
                        row[column.metadata.colName] = column.value;
                    });
                    result.push(row);
                });

                request.on("requestCompleted", () => resolve(result));
                connection.execSql(request);
            });
        }

        // Fetch enquiries
        if (datasets.includes("enquiries")) {
            const { dateFrom, dateTo } = getLast24Months();
            responseData.enquiries = await new Promise<EnquiryData[]>((resolve, reject) => {
                const result: EnquiryData[] = [];
                const query = `
                    SELECT *
                    FROM enquiries
                    WHERE Touchpoint_Date BETWEEN @DateFrom AND @DateTo
                    ORDER BY Touchpoint_Date DESC
                `;
                const request = new SqlRequest(query, (err) => {
                    if (err) {
                        context.error("SQL Query Error (enquiries):", err);
                        reject(err);
                    }
                });
                request.addParameter("DateFrom", TYPES.Date, dateFrom);
                request.addParameter("DateTo", TYPES.Date, dateTo);

                request.on("row", (columns) => {
                    const row: EnquiryData = {};
                    columns.forEach((column) => {
                        row[column.metadata.colName] = column.value;
                    });
                    result.push(row);
                });

                request.on("requestCompleted", () => resolve(result));
                connection.execSql(request);
            });
        }

        // Fetch allMatters
        if (datasets.includes("allMatters")) {
            responseData.allMatters = await new Promise<MatterData[]>((resolve, reject) => {
                const result: MatterData[] = [];
                const query = `
                    SELECT *
                    FROM matters
                `;
                const request = new SqlRequest(query, (err) => {
                    if (err) {
                        context.error("SQL Query Error (allMatters):", err);
                        reject(err);
                    }
                });

                request.on("row", (columns) => {
                    const row: MatterData = {};
                    columns.forEach((column) => {
                        row[column.metadata.colName] = column.value;
                    });
                    result.push(row);
                });

                request.on("requestCompleted", () => resolve(result));
                connection.execSql(request);
            });
        }

        // Fetch wip (week-to-date for all users via Clio API)
        if (datasets.includes("wip")) {
            const accessToken = await getClioAccessToken(clioTokenUrl, clientId, clientSecretValue, refreshToken, context);
            const { startDate, endDate } = getWeekToDateRange();
            responseData.wip = await fetchClioActivities(clioActivitiesUrl, startDate, endDate, accessToken, context);
        }

        // Fetch recoveredFees (last 24 months for all users)
        if (datasets.includes("recoveredFees")) {
            const { dateFrom, dateTo } = getLast24Months();
            responseData.recoveredFees = await new Promise<CollectedTimeData>((resolve, reject) => {
                const result: CollectedTimeData = { totalPaymentAllocated: 0 };
                const query = `
                    SELECT SUM(payment_allocated) AS totalPaymentAllocated
                    FROM collectedTime
                    WHERE payment_date BETWEEN @DateFrom AND @DateTo
                `;
                const request = new SqlRequest(query, (err) => {
                    if (err) {
                        context.error("SQL Query Error (recoveredFees):", err);
                        reject(err);
                    }
                });
                request.addParameter("DateFrom", TYPES.Date, dateFrom);
                request.addParameter("DateTo", TYPES.Date, dateTo);

                request.on("row", (columns) => {
                    columns.forEach((column) => {
                        if (column.metadata.colName === "totalPaymentAllocated") {
                            result.totalPaymentAllocated = column.value || 0;
                        }
                    });
                });

                request.on("requestCompleted", () => resolve(result));
                connection.execSql(request);
            });
        }

        connection.close();
        return {
            status: 200,
            body: JSON.stringify(responseData),
        };
    } catch (error) {
        context.error("Error processing request:", error);
        connection.close();
        return {
            status: 500,
            body: "Internal Server Error",
        };
    }
}

// Register the function
app.http("generateReportDataset", {
    methods: ["POST"],
    authLevel: "function",
    handler: generateReportDatasetHandler,
});

// Date range for last 24 months
function getLast24Months(): { dateFrom: string; dateTo: string } {
    const now = new Date();
    const dateTo = new Date(now.getFullYear(), now.getMonth() + 1, 0); // Last day of current month
    const dateFrom = new Date(now.getFullYear(), now.getMonth() - 23, 1); // First day, 24 months back
    return {
        dateFrom: dateFrom.toISOString().split('T')[0],
        dateTo: dateTo.toISOString().split('T')[0],
    };
}

// Week-to-date range (Monday 00:01 to now, BST)
function getWeekToDateRange(): { startDate: string; endDate: string } {
    const now = new Date();
    const bstOffset = 1 * 60 * 60 * 1000; // BST is UTC+1
    const bstNow = new Date(now.getTime() + bstOffset);

    const startOfWeek = new Date(bstNow);
    const day = startOfWeek.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Adjust to Monday
    startOfWeek.setDate(startOfWeek.getDate() + diff);
    startOfWeek.setHours(0, 1, 0, 0); // Monday 00:01 BST

    const startDate = formatDateTimeForClio(startOfWeek);
    const endDate = formatDateTimeForClio(bstNow);
    return { startDate, endDate };
}

// Format date for Clio API (YYYY-MM-DDTHH:MM:SS)
function formatDateTimeForClio(date: Date): string {
    const year = date.getUTCFullYear();
    const month = (`0${date.getUTCMonth() + 1}`).slice(-2);
    const day = (`0${date.getUTCDate()}`).slice(-2);
    const hours = (`0${date.getUTCHours()}`).slice(-2);
    const minutes = (`0${date.getUTCMinutes()}`).slice(-2);
    const seconds = (`0${date.getUTCSeconds()}`).slice(-2);
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// Get Clio access token
async function getClioAccessToken(
    tokenUrl: string,
    clientId: string,
    clientSecret: string,
    refreshToken: string,
    context: InvocationContext
): Promise<string> {
    const params = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
    });

    const response = await fetch(tokenUrl, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: params.toString(),
    });

    if (!response.ok) {
        const errorBody = await response.text();
        context.error("Failed to obtain Clio access token:", errorBody);
        throw new Error("Failed to obtain Clio access token.");
    }

    const tokenData: { access_token: string } = await response.json();
    return tokenData.access_token;
}

// Fetch Clio activities (week-to-date, all users)
async function fetchClioActivities(
    activitiesUrl: string,
    startDate: string,
    endDate: string,
    accessToken: string,
    context: InvocationContext
): Promise<ClioActivity[]> {
    let allActivities: ClioActivity[] = [];
    let offset = 0;
    const limit = 200;
    const fields = "id,date,created_at,updated_at,type,matter,quantity_in_hours,note,total,price,expense_category,activity_description,user,bill,billed";

    while (true) {
        const params = new URLSearchParams({
            created_since: startDate,
            created_before: endDate,
            fields: fields,
            limit: limit.toString(),
            offset: offset.toString(),
        });
        const url = `${activitiesUrl}?${params.toString()}`;

        context.log(`Fetching Clio activities: ${url}`);
        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorBody = await response.text();
            context.error("Failed to fetch Clio activities:", errorBody);
            throw new Error("Failed to fetch Clio activities.");
        }

        const data: { data: ClioActivity[]; meta: { paging: { next?: string; records: number } } } = await response.json();
        if (data.data && Array.isArray(data.data)) {
            allActivities = allActivities.concat(data.data);
        }

        if (!data.meta?.paging?.next || data.data.length < limit) {
            break; // No more pages
        }
        offset += limit;
    }

    return allActivities;
}

export default app;