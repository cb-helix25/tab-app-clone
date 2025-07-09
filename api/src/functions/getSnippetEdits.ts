// invisible change
import {
    app,
    HttpRequest,
    HttpResponseInit,
    InvocationContext,
} from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

export async function getSnippetEditsHandler(
    req: HttpRequest,
    context: InvocationContext,
): Promise<HttpResponseInit> {
    context.log("--- Function getSnippetEdits invoked ---");
    context.log(`HTTP Method: ${req.method}`);

    if (req.method !== "GET") {
        return { status: 405, body: "Method not allowed" };
    }

    const baseUrl =
        process.env.SNIPPET_EDITS_BASE_URL ||
        "https://instructions-vnet-functions.azurewebsites.net/api/fetchSnippetEdits";
    context.log(`Using base URL: ${baseUrl}`);

    let code = process.env.SNIPPET_EDITS_CODE;
    if (!code) {
        const secretName =
            process.env.SNIPPET_EDITS_CODE_SECRET || "fetchSnippetEdits-code";
        context.log(
            `Retrieving snippet edits function code from Key Vault secret: ${secretName}`,
        );
        const vaultUrl =
            process.env.KEY_VAULT_URL || "https://helix-keys.vault.azure.net/";
        const secretClient = new SecretClient(
            vaultUrl,
            new DefaultAzureCredential(),
        );
        try {
            const secret = await secretClient.getSecret(secretName);
            code = secret.value;
            context.log("Successfully retrieved snippet edits code from Key Vault.");
        } catch (err) {
            context.error("Failed to retrieve snippet edits code", err);
            return { status: 500, body: "Unable to retrieve snippet edits code" };
        }
    }

    const url = `${baseUrl}?code=${code}`;
    context.log(`Calling snippet edits service at: ${url}`);

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "getSnippetEdits" }),
        });
        context.log(
            `Snippet edits service responded with ${response.status} ${response.statusText}`,
        );
        const text = await response.text();
        if (!response.ok) {
            context.error(
                `Snippet edits service error (status ${response.status})`,
                text,
            );
            return { status: 500, body: "Failed to fetch snippet edits" };
        }
        context.log("Snippet edits service response length:", text.length);
        return {
            status: 200,
            body: text,
            headers: { "Content-Type": "application/json" },
        };
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