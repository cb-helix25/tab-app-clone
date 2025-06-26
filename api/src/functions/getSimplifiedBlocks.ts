import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

export async function getSimplifiedBlocksHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log("getSimplifiedBlocks invoked");

    if (req.method !== "GET") {
        return { status: 405, body: "Method not allowed" };
    }

    const baseUrl =
        process.env.SIMPLIFIED_BLOCKS_BASE_URL ||
        "https://instructions-vnet-functions.azurewebsites.net/api/fetchSimplifiedBlocks";

    let code = process.env.SIMPLIFIED_BLOCKS_CODE;
    if (!code) {
        const secretName = process.env.SIMPLIFIED_BLOCKS_CODE_SECRET || "fetchSimplifiedBlocks-code";
        const secretClient = new SecretClient("https://helix-keys.vault.azure.net/", new DefaultAzureCredential());
        try {
            const secret = await secretClient.getSecret(secretName);
            code = secret.value;
        } catch (err) {
            context.error("Failed to retrieve blocks function code", err);
            return { status: 500, body: "Unable to retrieve blocks function code" };
        }
    }

    const url = `${baseUrl}?code=${code}`;

    try {
        const response = await fetch(url);
        if (!response.ok) {
            const text = await response.text();
            context.error("Blocks function error:", text);
            return { status: 500, body: "Failed to fetch simplified blocks" };
        }
        const data = await response.text();
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
