import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";

export async function getVerificationDetailsHandler(
    req: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    context.log("getVerificationDetailsHandler invoked");

    if (req.method !== "GET") {
        return { status: 405, body: "Method not allowed" };
    }

    try {
        const instructionRef = req.params.instructionRef;
        
        if (!instructionRef) {
            return { 
                status: 400, 
                body: JSON.stringify({ error: 'Instruction reference is required' }),
                headers: { "Content-Type": "application/json" }
            };
        }

        // Use the same approach as other functions - call the decoupled function
        const sql = require('mssql');
        
        // Database connection config matching existing pattern
        const config = {
            user: process.env.DB_USER || 'helix-database-server',
            password: process.env.DB_PASSWORD,
            server: 'instructions.database.windows.net', // Specific to instructions DB
            database: 'instructions',
            options: { 
                encrypt: true,
                trustServerCertificate: false
            }
        };

        // Query to get instruction and verification details
        const query = `
            SELECT 
                i.InstructionRef,
                i.FirstName,
                i.Surname, 
                i.Email,
                v.EIDOverallResult,
                v.PEPAndSanctionsCheckResult,
                v.AddressVerificationResult,
                v.EIDRawResponse,
                v.CheckedDate
            FROM Instructions i
            LEFT JOIN IDVerifications v ON i.InternalId = v.InstructionInternalId
            WHERE i.InstructionRef = @instructionRef
            ORDER BY v.CheckedDate DESC
        `;

        const pool = await sql.connect(config);
        const request = pool.request();
        request.input('instructionRef', sql.VarChar(50), instructionRef);
        
        const result = await request.query(query);
        
        if (result.recordset.length === 0) {
            return { 
                status: 404, 
                body: JSON.stringify({ error: 'Instruction not found' }),
                headers: { "Content-Type": "application/json" }
            };
        }

        const record = result.recordset[0];
        
        // Parse the raw response to determine actual status
        let rawResponse = null;
        try {
            rawResponse = record.EIDRawResponse ? JSON.parse(record.EIDRawResponse) : null;
        } catch (parseError) {
            context.error('Failed to parse EIDRawResponse:', parseError);
        }

        // Determine actual verification results from raw response
        let overallResult = record.EIDOverallResult || 'unknown';
        let pepResult = record.PEPAndSanctionsCheckResult || 'unknown';  
        let addressResult = record.AddressVerificationResult || 'unknown';

        if (rawResponse) {
            // Extract actual results from Tiller response
            overallResult = rawResponse.result || rawResponse.overall_result || overallResult;
            pepResult = rawResponse.peps_and_sanctions?.result || pepResult;
            addressResult = rawResponse.address_verification?.result || addressResult;
        }

        const responseData = {
            instructionRef: record.InstructionRef,
            firstName: record.FirstName || '',
            surname: record.Surname || '',
            email: record.Email || '',
            overallResult,
            pepResult,
            addressResult,
            rawResponse: record.EIDRawResponse,
            checkedDate: record.CheckedDate
        };

        return {
            status: 200,
            body: JSON.stringify(responseData),
            headers: { "Content-Type": "application/json" }
        };

    } catch (error: any) {
        context.error('Error fetching verification details:', error);
        return { 
            status: 500,
            body: JSON.stringify({ 
                error: 'Internal server error',
                details: error?.message || 'Unknown error'
            }),
            headers: { "Content-Type": "application/json" }
        };
    }
}

app.http("getVerificationDetails", {
    methods: ["GET"],
    authLevel: "function",
    route: "instructions/{instructionRef}/verification-details",
    handler: getVerificationDetailsHandler,
});
