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
    matter_id: number;
    bill_id: number;
    contact_id: number;
    id: number;
    date: string;
    created_at: string;
    kind: string;
    type: string;
    activity_type: string;
    description: string;
    sub_total: number;
    tax: number;
    secondary_tax: number;
    user_id: number;
    user_name: string;
    payment_allocated: number;
    payment_date: string;
}

interface POID {
    poid_id: string;
    type?: string;
    terms_acceptance?: boolean;
    submission_url?: string;
    submission_date?: string;
    id_docs_folder?: string;
    acid?: number;
    card_id?: string;
    poc?: string;
    nationality_iso?: string;
    nationality?: string;
    gender?: string;
    first?: string;
    last?: string;
    prefix?: string;
    date_of_birth?: string;
    best_number?: string;
    email?: string;
    passport_number?: string;
    drivers_license_number?: string;
    house_building_number?: string;
    street?: string;
    city?: string;
    county?: string;
    post_code?: string;
    country?: string;
    country_code?: string;
    company_name?: string;
    company_number?: string;
    company_house_building_number?: string;
    company_street?: string;
    company_city?: string;
    company_county?: string;
    company_post_code?: string;
    company_country?: string;
    company_country_code?: string;
    stage?: string;
    check_result?: string;
    check_id?: string;
    additional_id_submission_id?: string;
    additional_id_submission_url?: string;
    additional_id_submission_date?: string;
    client_id?: string;
    related_client_id?: string;
    matter_id?: string;
    risk_assessor?: string;
    risk_assessment_date?: string;
}

interface Transaction {
    intake_id: number;
    intake_date: string;
    transaction_id: string;
    matter_ref: string;
    matter_description: string;
    fe: string;
    amount: number;
    transaction_date: string;
    from_client: boolean;
    money_sender: string | null;
    type: string;
    status?: string | null;
}

interface OutstandingClientContact {
    id: number;
    etag: string;
    name: string;
    first_name: string;
    middle_name?: string | null;
    last_name: string;
    date_of_birth: string;
    type: string;
    created_at: string;
    updated_at: string;
    prefix?: string | null;
    title: string;
    initials: string;
    clio_connect_email?: string | null;
    locked_clio_connect_email?: string | null;
    client_connect_user_id?: string | null;
    primary_email_address: string;
    secondary_email_address?: string | null;
    primary_phone_number: string;
    secondary_phone_number?: string | null;
    ledes_client_id?: string | null;
    has_clio_for_clients_permission: boolean;
    is_client: boolean;
    is_clio_for_client_user: boolean;
    is_co_counsel: boolean;
    is_bill_recipient: boolean;
    sales_tax_number?: string | null;
    currency: { id: number | null };
}

interface OutstandingBill {
    id: number;
    etag: string;
    number: string;
    issued_at: string;
    created_at: string;
    due_at: string;
    tax_rate: number;
    secondary_tax_rate: number;
    updated_at: string;
    subject?: string | null;
    purchase_order?: string | null;
    type: string;
    memo?: string | null;
    start_at: string;
    end_at: string;
    balance: number;
    state: string;
    kind: string;
    total: number;
    paid: number;
    paid_at?: string | null;
    pending: number;
    due: number;
    discount_services_only: boolean;
    can_update: boolean;
    credits_issued: number;
    shared: boolean;
    last_sent_at?: string | null;
    services_secondary_tax: number;
    services_sub_total: number;
    services_tax: number;
    services_taxable_sub_total: number;
    services_secondary_taxable_sub_total: number;
    taxable_sub_total: number;
    secondary_taxable_sub_total: number;
    sub_total: number;
    tax_sum: number;
    secondary_tax_sum: number;
    total_tax: number;
    available_state_transitions: string[];
}

interface OutstandingClientBalance {
    id: number;
    created_at: string;
    updated_at: string;
    associated_matter_ids: number[];
    contact: OutstandingClientContact;
    total_outstanding_balance: number;
    last_payment_date: string;
    last_shared_date?: string | null;
    newest_issued_bill_due_date: string;
    pending_payments_total: number;
    reminders_enabled: boolean;
    currency: { id: number | null; redacted?: boolean };
    outstanding_bills: OutstandingBill[];
}

interface OutstandingClientBalancesResponse {
    meta: {
        paging: any;
        records: number;
    };
    data: OutstandingClientBalance[];
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

// Helper function to assign column values safely for CollectedTimeData
function assignColumnValue(row: CollectedTimeData, colName: keyof CollectedTimeData, value: any) {
    switch (colName) {
        case "matter_id":
        case "bill_id":
        case "contact_id":
        case "id":
        case "sub_total":
        case "tax":
        case "secondary_tax":
        case "user_id":
        case "payment_allocated":
            row[colName] = value != null ? Number(value) : 0;
            break;
        case "date":
        case "created_at":
        case "kind":
        case "type":
        case "activity_type":
        case "description":
        case "user_name":
        case "payment_date":
            row[colName] = value != null ? String(value) : "";
            break;
    }
}

// Helper function to assign column values safely for POID
function assignPOIDColumnValue(row: POID, colName: keyof POID, value: any) {
    switch (colName) {
        case "acid":
            row[colName] = value != null ? Number(value) : undefined;
            break;
        case "terms_acceptance":
            row[colName] = value != null ? Boolean(value) : undefined;
            break;
        case "poid_id":
            // For required field, default to an empty string if value is null.
            row[colName] = value != null ? String(value) : "";
            break;
        case "type":
        case "submission_url":
        case "submission_date":
        case "id_docs_folder":
        case "card_id":
        case "poc":
        case "nationality_iso":
        case "nationality":
        case "gender":
        case "first":
        case "last":
        case "prefix":
        case "date_of_birth":
        case "best_number":
        case "email":
        case "passport_number":
        case "drivers_license_number":
        case "house_building_number":
        case "street":
        case "city":
        case "county":
        case "post_code":
        case "country":
        case "country_code":
        case "company_name":
        case "company_number":
        case "company_house_building_number":
        case "company_street":
        case "company_city":
        case "company_county":
        case "company_post_code":
        case "company_country":
        case "company_country_code":
        case "stage":
        case "check_result":
        case "check_id":
        case "additional_id_submission_id":
        case "additional_id_submission_url":
        case "additional_id_submission_date":
        case "client_id":
        case "related_client_id":
        case "matter_id":
        case "risk_assessor":
        case "risk_assessment_date":
            row[colName] = value != null ? String(value) : undefined;
            break;
    }
}

// Helper function to assign column values safely for Transaction
function assignTransactionColumnValue(row: Transaction, colName: keyof Transaction, value: any) {
    switch (colName) {
        case "intake_id":
        case "amount":
            row[colName] = value != null ? Number(value) : 0;
            break;
        case "from_client":
            row[colName] = value != null ? Boolean(value) : false;
            break;
        case "money_sender":
            row[colName] = value != null ? String(value) : null;
            break;
        case "intake_date":
        case "transaction_id":
        case "matter_ref":
        case "matter_description":
        case "fe":
        case "transaction_date":
        case "type":
        case "status":
            row[colName] = value != null ? String(value) : "";
            break;
    }
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
    const clioApiBaseUrl = "https://eu.app.clio.com/api/v4";
    const outstandingFields = "id,created_at,updated_at,associated_matter_ids,contact{id,etag,name,first_name,middle_name,last_name,date_of_birth,type,created_at,updated_at,prefix,title,initials,clio_connect_email,locked_clio_connect_email,client_connect_user_id,primary_email_address,secondary_email_address,primary_phone_number,secondary_phone_number,ledes_client_id,has_clio_for_clients_permission,is_client,is_clio_for_client_user,is_co_counsel,is_bill_recipient,sales_tax_number,currency},total_outstanding_balance,last_payment_date,last_shared_date,newest_issued_bill_due_date,pending_payments_total,reminders_enabled,currency{id,etag,code,sign,created_at,updated_at},outstanding_bills{id,etag,number,issued_at,created_at,due_at,tax_rate,secondary_tax_rate,updated_at,subject,purchase_order,type,memo,start_at,end_at,balance,state,kind,total,paid,paid_at,pending,due,discount_services_only,can_update,credits_issued,shared,last_sent_at,services_secondary_tax,services_sub_total,services_tax,services_taxable_sub_total,services_secondary_taxable_sub_total,taxable_sub_total,secondary_taxable_sub_total,sub_total,tax_sum,secondary_tax_sum,total_tax,available_state_transitions}";
    const balancesUrl = `${clioApiBaseUrl}/outstanding_client_balances.json?fields=${encodeURIComponent(outstandingFields)}`;

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

        // Fetch recoveredFees (last 24 months, individual records)
        if (datasets.includes("recoveredFees")) {
            const { dateFrom, dateTo } = getLast24Months();
            responseData.recoveredFees = await new Promise<CollectedTimeData[]>((resolve, reject) => {
                const result: CollectedTimeData[] = [];
                const query = `
                    SELECT 
                        matter_id,
                        bill_id,
                        contact_id,
                        id,
                        date,
                        created_at,
                        kind,
                        type,
                        activity_type,
                        description,
                        sub_total,
                        tax,
                        secondary_tax,
                        user_id,
                        user_name,
                        payment_allocated,
                        CONVERT(VARCHAR(10), payment_date, 120) AS payment_date
                    FROM collectedTime
                    WHERE payment_date BETWEEN @DateFrom AND @DateTo
                    ORDER BY payment_date DESC
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
                    const row: CollectedTimeData = {
                        matter_id: 0,
                        bill_id: 0,
                        contact_id: 0,
                        id: 0,
                        date: "",
                        created_at: "",
                        kind: "",
                        type: "",
                        activity_type: "",
                        description: "",
                        sub_total: 0,
                        tax: 0,
                        secondary_tax: 0,
                        user_id: 0,
                        user_name: "",
                        payment_allocated: 0,
                        payment_date: ""
                    };
                    columns.forEach((column) => {
                        assignColumnValue(row, column.metadata.colName as keyof CollectedTimeData, column.value);
                    });
                    result.push(row);
                });

                request.on("requestCompleted", () => resolve(result));
                connection.execSql(request);
            });
        }

        // Fetch outstandingBalances (via Clio API)
        if (datasets.includes("outstandingBalances")) {
            const accessToken = await getClioAccessToken(clioTokenUrl, clientId, clientSecretValue, refreshToken, context);
            context.log("Fetching outstanding client balances from Clio API.");
            const balancesResponse = await fetch(balancesUrl, {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
            });

            if (!balancesResponse.ok) {
                const errorText = await balancesResponse.text();
                context.error("Failed to fetch outstanding client balances:", errorText);
                throw new Error(`Failed to fetch outstanding client balances: ${errorText}`);
            }

            const balancesData: OutstandingClientBalancesResponse = await balancesResponse.json();
            responseData.outstandingBalances = balancesData;
            context.log("Outstanding client balances retrieved successfully.");
        }

        // Fetch poidData (POID entries from the last 6 years)
        if (datasets.includes("poidData")) {
            const today = new Date();
            const thresholdDate = new Date(today);
            thresholdDate.setFullYear(today.getFullYear() - 6);
            const formattedThresholdDate = thresholdDate.toISOString().split('T')[0];
        
            responseData.poidData = await new Promise<POID[]>((resolve, reject) => {
                const result: POID[] = [];
                const query = `
                    SELECT 
                        poid_id,
                        type,
                        terms_acceptance,
                        submission_url,
                        CONVERT(VARCHAR(10), submission_date, 120) AS submission_date,
                        id_docs_folder,
                        acid,
                        card_id,
                        poc,
                        nationality_iso,
                        nationality,
                        gender,
                        first,
                        last,
                        prefix,
                        date_of_birth,
                        best_number,
                        email,
                        passport_number,
                        drivers_license_number,
                        house_building_number,
                        street,
                        city,
                        county,
                        post_code,
                        country,
                        country_code,
                        company_name,
                        company_number,
                        company_house_building_number,
                        company_street,
                        company_city,
                        company_county,
                        company_post_code,
                        company_country,
                        company_country_code,
                        stage,
                        check_result,
                        check_id,
                        additional_id_submission_id,
                        additional_id_submission_url,
                        additional_id_submission_date,
                        client_id,
                        related_client_id,
                        matter_id,
                        risk_assessor,
                        risk_assessment_date
                    FROM poid
                    WHERE submission_date >= @ThresholdDate
                    ORDER BY submission_date DESC
                `;
                const request = new SqlRequest(query, (err) => {
                    if (err) {
                        context.error("SQL Query Error (poidData):", err);
                        reject(err);
                    }
                });
                request.addParameter("ThresholdDate", TYPES.DateTime, formattedThresholdDate);
        
                request.on("row", (columns) => {
                    const row: POID = {
                        poid_id: "", // Assuming this is required; adjust if not
                        type: undefined,
                        terms_acceptance: undefined,
                        submission_url: undefined,
                        submission_date: undefined,
                        id_docs_folder: undefined,
                        acid: undefined,
                        card_id: undefined,
                        poc: undefined,
                        nationality_iso: undefined,
                        nationality: undefined,
                        gender: undefined,
                        first: undefined,
                        last: undefined,
                        prefix: undefined,
                        date_of_birth: undefined,
                        best_number: undefined,
                        email: undefined,
                        passport_number: undefined,
                        drivers_license_number: undefined,
                        house_building_number: undefined,
                        street: undefined,
                        city: undefined,
                        county: undefined,
                        post_code: undefined,
                        country: undefined,
                        country_code: undefined,
                        company_name: undefined,
                        company_number: undefined,
                        company_house_building_number: undefined,
                        company_street: undefined,
                        company_city: undefined,
                        company_county: undefined,
                        company_post_code: undefined,
                        company_country: undefined,
                        company_country_code: undefined,
                        stage: undefined,
                        check_result: undefined,
                        check_id: undefined,
                        additional_id_submission_id: undefined,
                        additional_id_submission_url: undefined,
                        additional_id_submission_date: undefined,
                        client_id: undefined,
                        related_client_id: undefined,
                        matter_id: undefined,
                        risk_assessor: undefined,
                        risk_assessment_date: undefined,
                    };
                    columns.forEach((column) => {
                        assignPOIDColumnValue(row, column.metadata.colName as keyof POID, column.value);
                    });
                    result.push(row);
                });
        
                request.on("requestCompleted", () => resolve(result));
                connection.execSql(request);
            });
        }

        // Fetch transactions
        if (datasets.includes("transactions")) {
            responseData.transactions = await new Promise<Transaction[]>((resolve, reject) => {
                const result: Transaction[] = [];
                const query = `
                    SELECT *
                    FROM transactions
                    ORDER BY transaction_date DESC
                `;
                const request = new SqlRequest(query, (err) => {
                    if (err) {
                        context.error("SQL Query Error (transactions):", err);
                        reject(err);
                    }
                });

                request.on("row", (columns) => {
                    const row: Transaction = {
                        intake_id: 0,
                        intake_date: "",
                        transaction_id: "",
                        matter_ref: "",
                        matter_description: "",
                        fe: "",
                        amount: 0,
                        transaction_date: "",
                        from_client: false,
                        money_sender: null,
                        type: "",
                        status: null,
                    };
                    columns.forEach((column) => {
                        assignTransactionColumnValue(row, column.metadata.colName as keyof Transaction, column.value);
                    });
                    result.push(row);
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