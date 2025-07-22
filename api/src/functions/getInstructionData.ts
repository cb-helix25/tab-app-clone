// invisible change 2
import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

export async function getInstructionDataHandler(
    req: HttpRequest,
    context: InvocationContext
): Promise<HttpResponseInit> {
    context.log("getInstructionDataHandler invoked");

    if (req.method !== "GET") {
        return { status: 405, body: "Method not allowed" };
    }

    // Safely read query params via URLSearchParams API
    const initials =
        req.query.get("initials") || req.query.get("userInitials") || undefined;
    const prospectId = req.query.get("prospectId") || undefined;
    const instructionRef = req.query.get("instructionRef") || undefined;
    const dealId = req.query.get("dealId") || undefined;

    // Build the URL to the real Instructions function
    const baseUrl =
        process.env.INSTRUCTIONS_FUNC_BASE_URL ||
        "https://instructions-vnet-functions.azurewebsites.net/api/fetchInstructionData";

    let code = process.env.INSTRUCTIONS_FUNC_CODE;
    if (!code) {
        const secretName =
            process.env.INSTRUCTIONS_FUNC_CODE_SECRET || "fetchInstructionData-code";
        const secretClient = new SecretClient(
            "https://helix-keys.vault.azure.net/",
            new DefaultAzureCredential()
        );
        try {
            const secret = await secretClient.getSecret(secretName);
            code = secret.value;
        } catch (err) {
            context.error("Failed to retrieve instructions function code", err);
            return {
                status: 500,
                body: "Unable to retrieve instructions function code",
            };
        }
    }

    const params = new URLSearchParams({ code });
    if (initials) params.append("initials", initials);
    if (prospectId) params.append("prospectId", prospectId);
    if (instructionRef) params.append("instructionRef", instructionRef);
    if (dealId) params.append("dealId", dealId);

    const url = `${baseUrl}?${params.toString()}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const text = await response.text();
            context.error("Instructions function error:", text);
            return { status: 500, body: "Failed to fetch instruction data" };
        }
        const data = await response.text();
        return {
            status: 200,
            body: data,
            headers: { "Content-Type": "application/json" },
        };
    } catch (err) {
        context.error("Error calling instructions function", err);
        return { status: 500, body: "Error calling instructions service" };
    }
}

app.http("getInstructionData", {
    methods: ["GET"],
    authLevel: "function",
    handler: getInstructionDataHandler,
});

export default app;
