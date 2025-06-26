import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

export async function getSnippetEditsHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log("getSnippetEdits invoked");

    if (req.method !== "GET") {
        return { status: 405, body: "Method not allowed" };
    }

    const baseUrl =
        process.env.SNIPPET_EDITS_BASE_URL ||
        "https://instructions-vnet-functions.azurewebsites.net/api/fetchSnippetEdits";

    let code = process.env.SNIPPET_EDITS_CODE;
    if (!code) {
        const secretName = process.env.SNIPPET_EDITS_CODE_SECRET || "fetchSnippetEdits-code";
        const secretClient = new SecretClient("https://helix-keys.vault.azure.net/", new DefaultAzureCredential());
        try {
            const secret = await secretClient.getSecret(secretName);
            code = secret.value;
        } catch (err) {
            context.error("Failed to retrieve snippet edits code", err);
            return { status: 500, body: "Unable to retrieve snippet edits code" };
        }
    }

    const url = `${baseUrl}?code=${code}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "getSnippetEdits" }),
        });
        if (!response.ok) {
            const text = await response.text();
            context.error("Snippet edits service error:", text);
            return { status: 500, body: "Failed to fetch snippet edits" };
        }
        const data = await response.text();
        return { status: 200, body: data, headers: { "Content-Type": "application/json" } };
    } catch (err) {
        context.error("Error calling snippet edits service", err);
        return { status: 500, body: "Error calling snippet edits service" };
    }
}

app.http("getSnippetEdits", {
    methods: ["GET"],
    authLevel: "function",
    handler: getSnippetEditsHandler,
});

export default app;