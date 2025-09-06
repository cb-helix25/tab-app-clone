import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { Connection, Request as SqlRequest, TYPES } from "tedious";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

interface Deal {
  DealId: number;
  ProspectId: number;
  InstructionRef?: string;
  ServiceDescription: string;
  Status: string;
  CreatedDate?: string;
  ModifiedDate?: string;
  firstName?: string;
  lastName?: string;
  isPitchedDeal: boolean;
}

interface Instruction {
  ref: string;
  status?: string;
  stage?: string;
  workflow?: string;
  payments?: any;
}

export async function getAllDealsHandler(
    req: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    context.log("getAllDealsHandler invoked");

    if (req.method !== "GET") {
        return { status: 405, body: "Method not allowed" };
    }

    // Get connection string from Key Vault
    const secretClient = new SecretClient(
        "https://helix-keys.vault.azure.net/",
        new DefaultAzureCredential()
    );

    let connectionString: string;
    try {
        const secret = await secretClient.getSecret("instructions-db-connection-string");
        connectionString = secret.value!;
    } catch (err) {
        context.error("Failed to retrieve connection string", err);
        return {
            status: 500,
            body: JSON.stringify({ error: "Unable to retrieve database connection" }),
        };
    }

    return new Promise((resolve) => {
        const connection = new Connection({
            server: 'instructions.database.windows.net',
            authentication: {
                type: 'default',
                options: {
                    userName: process.env.DB_USERNAME,
                    password: process.env.DB_PASSWORD
                }
            },
            options: {
                database: 'instructions',
                encrypt: true,
                trustServerCertificate: false
            }
        });

        const deals: Deal[] = [];
        const instructions: Instruction[] = [];

        connection.on('connect', (err) => {
            if (err) {
                context.error("Connection failed", err);
                resolve({
                    status: 500,
                    body: JSON.stringify({ error: "Database connection failed" }),
                });
                return;
            }

            // First get all deals
            const dealsQuery = `
                SELECT DealId, ProspectId, InstructionRef, ServiceDescription, Status, 
                       CreatedDate, ModifiedDate
                FROM Deals 
                ORDER BY DealId DESC
            `;

            const dealsRequest = new SqlRequest(dealsQuery, (err) => {
                if (err) {
                    context.error("Deals query failed", err);
                    connection.close();
                    resolve({
                        status: 500,
                        body: JSON.stringify({ error: "Deals query failed" }),
                    });
                    return;
                }

                // Then get all instructions
                const instructionsQuery = `
                    SELECT ref, status, stage, workflow, payments
                    FROM instructions
                `;

                const instructionsRequest = new SqlRequest(instructionsQuery, (err) => {
                    if (err) {
                        context.error("Instructions query failed", err);
                        connection.close();
                        resolve({
                            status: 500,
                            body: JSON.stringify({ error: "Instructions query failed" }),
                        });
                        return;
                    }

                    // Merge the data
                    const transformedData = deals.map(deal => ({
                        ...deal,
                        isPitchedDeal: deal.Status === 'pitched' && !deal.InstructionRef,
                        instruction: instructions.find(inst => inst.ref === deal.InstructionRef)
                    }));

                    const result = {
                        count: transformedData.length,
                        computedServerSide: true,
                        timestamp: new Date().toISOString(),
                        deals: transformedData.filter(d => d.Status === 'pitched'), // Only pitched deals for pitches tab
                        instructions: transformedData.filter(d => d.instruction), // Only deals with instructions
                    };

                    connection.close();
                    resolve({
                        status: 200,
                        body: JSON.stringify(result),
                        headers: { "Content-Type": "application/json" },
                    });
                });

                instructionsRequest.on('row', (columns) => {
                    const instruction: Instruction = {
                        ref: columns[0].value,
                        status: columns[1].value,
                        stage: columns[2].value,
                        workflow: columns[3].value,
                        payments: columns[4].value ? JSON.parse(columns[4].value) : null,
                    };
                    instructions.push(instruction);
                });

                connection.execSql(instructionsRequest);
            });

            dealsRequest.on('row', (columns) => {
                const deal: Deal = {
                    DealId: columns[0].value,
                    ProspectId: columns[1].value,
                    InstructionRef: columns[2].value,
                    ServiceDescription: columns[3].value,
                    Status: columns[4].value,
                    CreatedDate: columns[5].value,
                    ModifiedDate: columns[6].value,
                    isPitchedDeal: columns[4].value === 'pitched' && !columns[2].value,
                };
                deals.push(deal);
            });

            connection.execSql(dealsRequest);
        });

        connection.connect();
    });
}

app.http("getAllDeals", {
    methods: ["GET"],
    authLevel: "function",
    handler: getAllDealsHandler,
});

export default app;
