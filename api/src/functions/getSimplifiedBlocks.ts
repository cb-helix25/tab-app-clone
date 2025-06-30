import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

export async function getSimplifiedBlocksHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log("getSimplifiedBlocks invoked");
    context.log(`HTTP Method: ${req.method}`);

    if (req.method !== "GET") {
        return { status: 405, body: "Method not allowed" };
    }

    const baseUrl =
        process.env.ACTION_SNIPPET_BASE_URL ||
        "https://instructions-vnet-functions.azurewebsites.net/api/actionSnippet";
    context.log(`Using base URL: ${baseUrl}`);

    let code = process.env.ACTION_SNIPPET_CODE;
    if (!code) {
        const secretName = process.env.ACTION_SNIPPET_CODE_SECRET || "actionSnippetFunction-code";
        context.log(`Retrieving blocks function code from Key Vault secret: ${secretName}`);
        const secretClient = new SecretClient("https://helix-keys.vault.azure.net/", new DefaultAzureCredential());
        try {
            const secret = await secretClient.getSecret(secretName);
            code = secret.value;
            context.log("Successfully retrieved blocks function code from Key Vault");
        } catch (err) {
            context.error("Failed to retrieve blocks function code", err);
            return { status: 500, body: "Unable to retrieve blocks function code" };
        }
    }

    const url = `${baseUrl}?code=${code}`;
    context.log(`Calling blocks service at: ${url}`);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "getSimplifiedBlocks" }),
        });
        context.log(`Blocks service responded with ${response.status} ${response.statusText}`);
        if (!response.ok) {
            const text = await response.text();
            context.error("Blocks function error:", text);
            return { status: 500, body: "Failed to fetch simplified blocks" };
        }
        const data = await response.text();
        context.log("Blocks service response length:", data.length);
        return { status: 200, body: data, headers: { "Content-Type": "application/json" } };
    } catch (err) {
        context.error("Error calling blocks function", err);
        return { status: 500, body: "Error calling blocks service" };
    }
}

app.http("getSimplifiedBlocks", {
    methods: ["GET"],
    authLevel: "function",
    handler: getSimplifiedBlocksHandler,
});

export default app;
