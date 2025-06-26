import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

export async function submitSnippetEditHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log("submitSnippetEdit invoked");

    if (req.method !== "POST") {
        return { status: 405, body: "Method not allowed" };
    }

    const baseUrl =
        process.env.ACTION_SNIPPET_BASE_URL ||
        "https://instructions-vnet-functions.azurewebsites.net/api/actionSnippet";

    let code = process.env.ACTION_SNIPPET_CODE;
    if (!code) {
        const secretName = process.env.ACTION_SNIPPET_CODE_SECRET || "actionSnippetFunction-code";
        const secretClient = new SecretClient("https://helix-keys.vault.azure.net/", new DefaultAzureCredential());
        try {
            const secret = await secretClient.getSecret(secretName);
            code = secret.value;
        } catch (err) {
            context.error("Failed to retrieve snippet edit code", err);
            return { status: 500, body: "Unable to retrieve snippet edit code" };
        }
    }

    const url = `${baseUrl}?code=${code}`;

    let body: any;
    try {
        body = await req.json();
    } catch (err) {
        return { status: 400, body: "Invalid JSON" };
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "submitSnippetEdit", payload: body }),
        });
        if (!response.ok) {
            const text = await response.text();
            context.error("Snippet edit service error:", text);
            return { status: 500, body: "Failed to submit snippet edit" };
        }
        const data = await response.text();
        return { status: 200, body: data, headers: { "Content-Type": "application/json" } };
    } catch (err) {
        context.error("Error calling snippet edit service", err);
        return { status: 500, body: "Error calling snippet edit service" };
    }
}

app.http("submitSnippetEdit", {
    methods: ["POST"],
    authLevel: "function",
    handler: submitSnippetEditHandler,
});

export default app;