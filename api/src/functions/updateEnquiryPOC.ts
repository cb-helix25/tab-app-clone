// src/functions/updateEnquiryPOC.ts

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import { Connection, Request as SqlRequest, TYPES } from "tedious";

// Define the interface for the request body
interface UpdatePOCBody {
    ID: string;
    Point_of_Contact: string;
}

// Define the handler function
export async function updateEnquiryPOCHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log("Invocation started for updateEnquiryPOC Azure Function.");

    // Set CORS headers
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    };

    // Handle preflight OPTIONS request
    if (req.method === 'OPTIONS') {
        return {
            status: 200,
            headers: corsHeaders
        };
    }

    let body: UpdatePOCBody;

    try {
        body = await req.json() as UpdatePOCBody;
        context.log("Request body:", { ID: body.ID, Point_of_Contact: body.Point_of_Contact });
    } catch (error) {
        context.error("Error parsing JSON body:", error);
        return {
            status: 400,
            headers: corsHeaders,
            body: "Invalid JSON format in request body."
        };
    }

    const { ID, Point_of_Contact } = body;

    if (!ID || !Point_of_Contact) {
        context.warn("Missing 'ID' or 'Point_of_Contact' in request body.");
        return {
            status: 400,
            headers: corsHeaders,
            body: "Missing 'ID' or 'Point_of_Contact' in request body."
        };
    }

    try {
        context.log("Initiating SQL query to update enquiry Point of Contact.");
        await updatePOCInSQL(ID, Point_of_Contact, context);
        context.log("Successfully updated enquiry Point of Contact in SQL database.");

        return {
            status: 200,
            headers: corsHeaders,
            body: JSON.stringify({ 
                success: true, 
                message: "Point of Contact updated successfully.",
                updatedID: ID,
                newPOC: Point_of_Contact
            })
        };
    } catch (error) {
        context.error("Error updating enquiry Point of Contact:", error);
        return {
            status: 500,
            headers: corsHeaders,
            body: JSON.stringify({ 
                success: false, 
                message: "Error updating enquiry Point of Contact.",
                error: error instanceof Error ? error.message : "Unknown error"
            })
        };
    } finally {
        context.log("Invocation completed for updateEnquiryPOC Azure Function.");
    }
}

// Register the function
app.http("updateEnquiryPOC", {
    methods: ["POST", "OPTIONS"],
    authLevel: "function",
    handler: updateEnquiryPOCHandler
});

// Implement the SQL update function
async function updatePOCInSQL(ID: string, Point_of_Contact: string, context: InvocationContext): Promise<void> {
    const kvUri = "https://helix-keys.vault.azure.net/";
    const passwordSecretName = "sql-databaseserver-password";
    const sqlServer = "helix-database-server.database.windows.net";
    const sqlDatabase = "helix-core-data";

    const secretClient = new SecretClient(kvUri, new DefaultAzureCredential());
    const passwordSecret = await secretClient.getSecret(passwordSecretName);
    const password = passwordSecret.value;

    const connectionString = `Server=${sqlServer};Database=${sqlDatabase};User ID=helix-database-server;Password=${password};`;
    const config = parseConnectionString(connectionString, context);

    return new Promise<void>((resolve, reject) => {
        const connection = new Connection(config);

        connection.on("error", (err) => {
            context.error("SQL Connection Error:", err);
            reject(new Error("An error occurred with the SQL connection."));
        });

        connection.on("connect", (err) => {
            if (err) {
                context.error("SQL Connection Error:", err);
                reject(new Error("Failed to connect to SQL database."));
                return;
            }

            const query = `
                UPDATE enquiries
                SET Point_of_Contact = @Point_of_Contact
                WHERE ID = @ID
            `;

            const sqlRequest = new SqlRequest(query, (err, rowCount) => {
                if (err) {
                    context.error("SQL Query Execution Error:", err);
                    reject(new Error("SQL query failed."));
                    connection.close();
                    return;
                }

                if (rowCount === 0) {
                    context.warn(`No enquiry found with ID: ${ID}`);
                    reject(new Error("No enquiry found with the provided ID."));
                } else {
                    context.log(`Enquiry ID ${ID} Point of Contact updated successfully to: ${Point_of_Contact}`);
                    resolve();
                }

                connection.close();
            });

            sqlRequest.addParameter('Point_of_Contact', TYPES.NVarChar, Point_of_Contact);
            sqlRequest.addParameter('ID', TYPES.NVarChar, ID);

            connection.execSql(sqlRequest);
        });

        connection.connect();
    });
}

// Helper function to parse SQL connection string
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

    return config;
}

export default app;