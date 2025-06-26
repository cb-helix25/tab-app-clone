import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

export async function approveSnippetEditHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log("approveSnippetEdit invoked");

    if (req.method !== "POST") {
        return { status: 405, body: "Method not allowed" };
    }

    const baseUrl =
        process.env.SNIPPET_APPROVE_BASE_URL ||
        "https://instructions-vnet-functions.azurewebsites.net/api/approveSnippetEdit";

    let code = process.env.SNIPPET_APPROVE_CODE;
    if (!code) {
        const secretName = process.env.SNIPPET_APPROVE_CODE_SECRET || "approveSnippetEdit-code";
        const secretClient = new SecretClient("https://helix-keys.vault.azure.net/", new DefaultAzureCredential());
        try {
            const secret = await secretClient.getSecret(secretName);
            code = secret.value;
        } catch (err) {
            context.error("Failed to retrieve approve snippet code", err);
            return { status: 500, body: "Unable to retrieve approve snippet code" };
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
            body: JSON.stringify(body),
        });
        if (!response.ok) {
            const text = await response.text();
            context.error("Approve snippet service error:", text);
            return { status: 500, body: "Failed to approve snippet edit" };
        }
        const data = await response.text();
        return { status: 200, body: data, headers: { "Content-Type": "application/json" } };
    } catch (err) {
        context.error("Error calling approve snippet service", err);
        return { status: 500, body: "Error calling approve snippet service" };
    }
}

app.http("approveSnippetEdit", {
    methods: ["POST"],
    authLevel: "function",
    handler: approveSnippetEditHandler,
});

export default app;
