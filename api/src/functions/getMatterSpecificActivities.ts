// getMatterSpecificActivities.ts

import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import fetch from "node-fetch";
import { URLSearchParams } from "url";

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

export async function getMatterSpecificActivitiesHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Invocation started for getMatterSpecificActivities Azure Function.");

  // Log basic request information
  context.log(`Request method: ${req.method}`);
  context.log(`Request URL: ${req.url}`);
  context.log(`Request headers: ${JSON.stringify(req.headers)}`);

  let rawBody: string = "";
  let parsedBody: any = {};

  try {
    // Check if req.body is a stream, a string, or already parsed as an object.
    if (req.body && typeof req.body === "object" && "getReader" in req.body) {
      // It's a ReadableStream
      rawBody = await streamToString(req.body as unknown as ReadableStream<any>);
    } else if (typeof req.body === "string") {
      rawBody = req.body;
    } else if (req.body) {
      // Already parsed as an object
      rawBody = JSON.stringify(req.body);
    }
    
    context.log("Received raw request body: " + rawBody);

    // Attempt to parse the raw body as JSON.
    parsedBody = rawBody ? JSON.parse(rawBody) : {};
    context.log("Parsed request body: " + JSON.stringify(parsedBody));
  } catch (error) {
    context.error("Invalid JSON in request body:", error);
    return { status: 400, body: "Invalid JSON in request body." };
  }

  const matterId: string = parsedBody.matterId;
  if (!matterId) {
    context.error("Missing matterId in request body.");
    return { status: 400, body: "Missing matterId in request body." };
  }

  // Log the matterId received.
  context.log(`Received matterId: ${matterId}`);

  // Key Vault URI and secret names
  const kvUri = "https://helix-keys.vault.azure.net/";
  const clioRefreshTokenSecretName = "clio-teamhubv1-refreshtoken";
  const clioSecretName = "clio-teamhubv1-secret";
  const clioClientIdSecretName = "clio-teamhubv1-clientid";

  // Clio endpoints and API details
  const clioTokenUrl = "https://eu.app.clio.com/oauth/token";
  const clioApiBaseUrl = "https://eu.app.clio.com/api/v4";

  // Define the fields for the activities call
  const activityFields = "id,type,date,created_at,quantity_in_hours,rounded_quantity_in_hours,price,note,billed,on_bill,total,non_billable,non_billable_total,activity_description{id,name},expense_category{id,name},bill{id,number,created_at,issued_at,due_at,tax_rate,subject,balance,state,kind,total,paid,paid_at,pending,due,services_tax,sub_total,tax_sum,total_tax},communication{id,subject,body,type,date,created_at}";
  const activitiesUrl = `${clioApiBaseUrl}/activities.json?matter_id=${matterId}&limit=200&fields=${encodeURIComponent(activityFields)}`;
  
  context.log(`Constructed Clio activities URL: ${activitiesUrl}`);

  try {
    // Retrieve Clio OAuth credentials from Key Vault
    context.log("Connecting to Key Vault for Clio credentials...");
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

    context.log("Successfully retrieved Clio OAuth credentials from Key Vault.");

    // Refresh the access token using the refresh token
    const params = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecretValue,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    });

    context.log("Requesting Clio access token...");
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
    context.log(`Obtained Clio access token. Token length: ${accessToken.length} characters.`);

    // Call Clio API to get activities for the specified matter
    context.log("Calling Clio API for activities...");
    const activitiesResponse = await fetch(activitiesUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!activitiesResponse.ok) {
      const errorText = await activitiesResponse.text();
      context.error("Failed to fetch activities:", errorText);
      return { status: 500, body: `Failed to fetch activities: ${errorText}` };
    }

    const activitiesData = await activitiesResponse.json();
    context.log("Successfully retrieved activities from Clio API.");

    return { status: 200, body: JSON.stringify(activitiesData) };
  } catch (error) {
    context.error("Error in getMatterSpecificActivities:", error);
    return { status: 500, body: "Error retrieving activities." };
  } finally {
    context.log("Invocation completed for getMatterSpecificActivities Azure Function.");
  }
}

app.http("getMatterSpecificActivities", {
  methods: ["POST"],
  authLevel: "function",
  handler: getMatterSpecificActivitiesHandler,
});

export default app;
