// invisible change 3
// src/functions/getMatterOverview.ts

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import fetch from "node-fetch";
import { URLSearchParams } from "url";

interface GetMatterOverviewRequest {
  matterId: number;
}

/**
 * Helper: Convert a ReadableStream to a string using TextDecoder.
 */
async function streamToString(stream: ReadableStream<any>): Promise<string> {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let result = "";
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    result += decoder.decode(value, { stream: true });
  }
  result += decoder.decode(); // flush remaining bytes
  return result;
}

export async function getMatterOverviewHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Invocation started for getMatterOverview Azure Function.");

  // Retrieve matterId from either req.body (for POST) or req.query (for GET)
  let matterId: number | undefined;
  if (req.method === "POST") {
    let requestBody: any;
    if (typeof req.body === "string") {
      try {
        requestBody = JSON.parse((req.body as string).trim());
      } catch (err) {
        context.error("Invalid JSON format in request body.", err);
        return { status: 400, body: "Invalid JSON format in request body." };
      }
    } else if (req.body instanceof ReadableStream) {
      const bodyText = (await streamToString(req.body)).trim();
      try {
        requestBody = JSON.parse(bodyText);
      } catch (err) {
        context.error("Invalid JSON format in request body (from stream).", err);
        return { status: 400, body: "Invalid JSON format in request body." };
      }
    } else {
      // Assume req.body is already parsed as an object
      requestBody = req.body;
    }
    matterId = requestBody?.matterId;
  } else if (req.method === "GET") {
    // req.query is a URLSearchParams instance; use get() to retrieve the value
    const queryMatterId = req.query.get("matterId");
    matterId = queryMatterId ? Number(queryMatterId) : undefined;
  }

  if (!matterId || isNaN(matterId)) {
    context.log("matterId not provided or invalid.");
    return { status: 400, body: "matterId is required and must be a valid number." };
  }

  // Key Vault URI and secret names
  const kvUri = "https://helix-keys.vault.azure.net/";
  const clioRefreshTokenSecretName = "clio-teamhubv1-refreshtoken";
  const clioSecretName = "clio-teamhubv1-secret";
  const clioClientIdSecretName = "clio-teamhubv1-clientid";

  // Clio endpoints and matter details
  const clioTokenUrl = "https://eu.app.clio.com/oauth/token";
  const clioApiBaseUrl = "https://eu.app.clio.com/api/v4";
  const matterFields =
    "display_number,created_at,open_date,close_date,id,description,practice_area,client{id,name,initials,type,primary_email_address,primary_phone_number},maildrop_address,status,matter_budget,custom_field_values{field_name,field_type,id,value,custom_field,picklist_option},responsible_attorney{id,name,rate,subscription_type},originating_attorney{id,name,rate,subscription_type},user{id,name,rate,subscription_type},account_balances,matter_bill_recipients,relationships";
  const matterUrl = `${clioApiBaseUrl}/matters/${matterId}.json?fields=${encodeURIComponent(matterFields)}`;

  try {
    // Retrieve Clio OAuth credentials from Key Vault
    const credential = new DefaultAzureCredential();
    const secretClient = new SecretClient(kvUri, credential);

    const [refreshTokenSecret, clientSecret, clientIdSecret] = await Promise.all([
      secretClient.getSecret(clioRefreshTokenSecretName),
      secretClient.getSecret(clioSecretName),
      secretClient.getSecret(clioClientIdSecretName),
    ]);

    const refreshToken = refreshTokenSecret.value;
    const clientSecretValue = clientSecret.value;
    const clientId = clientIdSecret.value;

    if (!refreshToken || !clientSecretValue || !clientId) {
      context.error("One or more Clio OAuth credentials are missing.");
      return { status: 500, body: "One or more Clio OAuth credentials are missing." };
    }

    context.log("Retrieved Clio OAuth credentials from Key Vault.");

    // Refresh the access token using the refresh token
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecretValue,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    const tokenResponse = await fetch(`${clioTokenUrl}?${params.toString()}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      context.error("Failed to obtain Clio access token:", errorText);
      return { status: 500, body: `Failed to obtain Clio access token: ${errorText}` };
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;
    context.log("Obtained Clio access token.");

    // Call Clio API to get the matter overview details
    const matterResponse = await fetch(matterUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!matterResponse.ok) {
      const errorText = await matterResponse.text();
      context.error("Failed to fetch matter overview:", errorText);
      return { status: 500, body: `Failed to fetch matter overview: ${errorText}` };
    }

    const matterData = await matterResponse.json();
    context.log("Matter overview data retrieved successfully.");

    return { status: 200, body: JSON.stringify(matterData) };
  } catch (error) {
    context.error("Error in getMatterOverview:", error);
    return { status: 500, body: "Error retrieving matter overview." };
  } finally {
    context.log("Invocation completed for getMatterOverview Azure Function.");
  }
}

app.http("getMatterOverview", {
  methods: ["POST"],
  authLevel: "function",
  handler: getMatterOverviewHandler,
});

export default app;
