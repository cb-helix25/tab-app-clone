// invisible change 2
import {
  app,
  HttpRequest,
  HttpResponseInit,
  InvocationContext,
} from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

export async function approveSnippetEditHandler(
  req: HttpRequest,
  context: InvocationContext,
): Promise<HttpResponseInit> {
  context.log("--- Function approveSnippetEdit invoked ---");
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
      context.error("Failed to retrieve approve snippet code", err);
      return { status: 500, body: "Unable to retrieve approve snippet code" };
    }
  }

  const url = `${baseUrl}?code=${code}`;
  context.log(`Calling approve snippet service at: ${url}`);

  let body: any;
  try {
    body = await req.json();
    context.log("Parsed request body for approve snippet edit.");
  } catch (err) {
    context.error("Invalid JSON in request", err);
    return { status: 400, body: "Invalid JSON" };
  }

  const payload = {
    editId: body.editId ?? body.EditId,
    approvedBy: body.approvedBy ?? body.ApprovedBy,
    reviewNotes: body.reviewNotes ?? body.ReviewNotes,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "approveSnippetEdit", payload }),
    });
    context.log(
      `Approve snippet service responded with ${response.status} ${response.statusText}`,
    );
    const text = await response.text();
    if (!response.ok) {
      context.error(
        `Approve snippet service error (status ${response.status})`,
        text,
      );
      return { status: 500, body: "Failed to approve snippet edit" };
    }
    context.log("Approve snippet service response:", text);
    return {
      status: 200,
      body: text,
      headers: { "Content-Type": "application/json" },
    };
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
