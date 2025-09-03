// src/functions/claimEnquiry.ts

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { Connection, Request as SqlRequest, TYPES } from "tedious";

// Define the interface for the request body
interface ClaimEnquiryRequest {
    enquiryId: string;
    userEmail: string;
}

/**
 * Claims an enquiry by updating the Point_of_Contact field in the enquiries table.
 * This changes the enquiry from unclaimed (team@helix-law.com) to claimed (user's email).
 */
export async function claimEnquiryHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log("claimEnquiry function invoked");

    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return {
            status: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': '*'
            },
            body: ''
        };
    }

    if (req.method !== 'POST') {
        return {
            status: 405,
            body: JSON.stringify({ error: "Method not allowed", allowed: ["POST"] }),
            headers: { "Content-Type": "application/json" },
        };
    }

    let body: ClaimEnquiryRequest;
    try {
        body = await req.json() as ClaimEnquiryRequest;
        context.log('Claim request received:', { enquiryId: body.enquiryId, userEmail: body.userEmail });
    } catch (error) {
        context.error("Invalid JSON body", error);
        return {
            status: 400,
            body: JSON.stringify({ error: "Invalid JSON", details: String(error) }),
            headers: { "Content-Type": "application/json" },
        };
    }

    const { enquiryId, userEmail } = body;

    if (!enquiryId || !userEmail) {
        context.warn("Missing enquiryId or userEmail in request body");
        return {
            status: 400,
            body: JSON.stringify({ error: "Missing enquiryId or userEmail" }),
            headers: { "Content-Type": "application/json" },
        };
    }

    // Validate email format
    if (!userEmail.includes('@helix-law.com')) {
        context.warn("Invalid email domain - must be @helix-law.com");
        return {
            status: 400,
            body: JSON.stringify({ error: "Invalid email domain" }),
            headers: { "Content-Type": "application/json" },
        };
    }

    try {
        const result = await updateEnquiryPointOfContact(enquiryId, userEmail, context);
        
        if (result.rowsAffected === 0) {
            return {
                status: 404,
                body: JSON.stringify({ error: "Enquiry not found or already claimed" }),
                headers: { "Content-Type": "application/json" },
            };
        }

        context.log(`Successfully claimed enquiry ${enquiryId} for ${userEmail}`);
        
        return {
            status: 200,
            body: JSON.stringify({ 
                success: true, 
                message: "Enquiry claimed successfully",
                enquiryId,
                claimedBy: userEmail,
                timestamp: new Date().toISOString()
            }),
            headers: { 
                "Content-Type": "application/json",
                'Access-Control-Allow-Origin': '*'
            },
        };
    } catch (error) {
        context.error("Error claiming enquiry:", error);
        return {
            status: 500,
            body: JSON.stringify({ error: "Error claiming enquiry", details: String(error) }),
            headers: { "Content-Type": "application/json" },
        };
    }
}

/**
 * Updates the Point_of_Contact field in the enquiries table to claim an enquiry
 */
async function updateEnquiryPointOfContact(
    enquiryId: string, 
    userEmail: string, 
    context: InvocationContext
): Promise<{ rowsAffected: number }> {
    const kvUri = "https://helix-keys.vault.azure.net/";
    const passwordSecretName = "sql-databaseserver-password";
    const sqlServer = "helix-database-server.database.windows.net";
    const sqlDatabase = "helix-core-data";

    const secretClient = new SecretClient(kvUri, new DefaultAzureCredential());
    const passwordSecret = await secretClient.getSecret(passwordSecretName);
    const password = passwordSecret.value;

    const connectionString = `Server=${sqlServer};Database=${sqlDatabase};User ID=helix-database-server;Password=${password};Encrypt=true;TrustServerCertificate=false;`;
    const config = parseConnectionString(connectionString, context);

    return new Promise<{ rowsAffected: number }>((resolve, reject) => {
        const connection = new Connection(config);

        connection.on("error", (err) => {
            context.error("SQL Connection Error:", err);
            reject(err);
        });

        connection.on("connect", (err) => {
            if (err) {
                context.error("SQL Connection Error on connect:", err);
                reject("Failed to connect to SQL database.");
                return;
            }

            context.log("Connected to SQL. Updating enquiry point of contact...");

            // Update query - only claim if currently unclaimed (team@helix-law.com)
            const query = `
                UPDATE [dbo].[enquiries]
                SET [Point_of_Contact] = @UserEmail
                WHERE [ID] = @EnquiryId 
                AND [Point_of_Contact] = 'team@helix-law.com'
            `;

            const request = new SqlRequest(query, (sqlErr, rowCount) => {
                if (sqlErr) {
                    context.error("SQL query error:", sqlErr);
                    connection.close();
                    reject(sqlErr);
                    return;
                }
                
                context.log(`Enquiry claim update completed. Rows affected: ${rowCount}`);
                connection.close();
                resolve({ rowsAffected: rowCount });
            });

            // Bind parameters
            request.addParameter("EnquiryId", TYPES.NVarChar, enquiryId);
            request.addParameter("UserEmail", TYPES.NVarChar, userEmail);

            context.log("Executing SQL query with parameters:", {
                EnquiryId: enquiryId,
                UserEmail: userEmail
            });

            connection.execSql(request);
        });

        connection.connect();
    });
}

// Helper function to parse SQL connection string
function parseConnectionString(connectionString: string, context: InvocationContext): any {
    const parts = connectionString.split(';');
    const config: any = {
        options: {
            encrypt: true,
            trustServerCertificate: false
        }
    };

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
            case 'Encrypt':
                config.options.encrypt = value.toLowerCase() === 'true';
                break;
            case 'TrustServerCertificate':
                config.options.trustServerCertificate = value.toLowerCase() === 'true';
                break;
            default:
                break;
        }
    });

    return config;
}

// Register the function
app.http("claimEnquiry", {
    methods: ["POST", "OPTIONS"],
    authLevel: "function",
    handler: claimEnquiryHandler
});

export default app;
