import {
    app,
    HttpRequest,
    HttpResponseInit,
    InvocationContext,
} from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

export async function submitSnippetEditHandler(
    req: HttpRequest,
    context: InvocationContext,
): Promise<HttpResponseInit> {
    context.log("--- Function submitSnippetEdit invoked ---");
    context.log(`HTTP Method: ${req.method}`);

    if (req.method !== "POST") {
        return { status: 405, body: "Method not allowed" };
    }

    const baseUrl =
        process.env.ACTION_SNIPPET_BASE_URL ||
        "https://instructions-vnet-functions.azurewebsites.net/api/actionSnippet";
    context.log(`Using base URL: ${baseUrl}`);

    let code = process.env.ACTION_SNIPPET_CODE;
    if (!code) {
        const secretName =
            process.env.ACTION_SNIPPET_CODE_SECRET || "actionSnippetFunction-code";
        context.log(
            `Retrieving snippet function code from Key Vault secret: ${secretName}`,
        );
        const secretClient = new SecretClient(
            "https://helix-keys.vault.azure.net/",
            new DefaultAzureCredential(),
        );
        try {
            const secret = await secretClient.getSecret(secretName);
            code = secret.value;
            context.log(
                "Successfully retrieved snippet function code from Key Vault.",
            );
        } catch (err) {
            context.error("Failed to retrieve snippet edit code", err);
            return { status: 500, body: "Unable to retrieve snippet edit code" };
        }
    }

    const url = `${baseUrl}?code=${code}`;
    context.log(`Calling snippet edit service at: ${url}`);

    let body: any;
    try {
        body = await req.json();
        context.log("Parsed request body for snippet edit.");
    } catch (err) {
        context.error("Invalid JSON in request", err);
        return { status: 400, body: "Invalid JSON" };
    }

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "submitSnippetEdit", payload: body }),
        });
        context.log(
            `Snippet edit service responded with ${response.status} ${response.statusText}`,
        );
        const text = await response.text();
        if (!response.ok) {
            context.error(
                `Snippet edit service error (status ${response.status})`,
                text,
            );
            return { status: 500, body: "Failed to submit snippet edit" };
        }
        context.log("Snippet edit service response:", text);
        return {
            status: 200,
            body: text,
            headers: { "Content-Type": "application/json" },
        };
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
  