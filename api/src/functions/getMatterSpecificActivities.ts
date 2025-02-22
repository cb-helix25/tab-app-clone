import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";
import fetch, { Response as NodeFetchResponse } from "node-fetch";
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

/**
 * Helper: Refresh the Clio access token.
 */
async function refreshAccessToken(context: InvocationContext): Promise<string> {
  // Key Vault URI and secret names
  const kvUri = "https://helix-keys.vault.azure.net/";
  const clioRefreshTokenSecretName = "clio-teamhubv1-refreshtoken";
  const clioSecretName = "clio-teamhubv1-secret";
  const clioClientIdSecretName = "clio-teamhubv1-clientid";

  // Clio endpoints and API details
  const clioTokenUrl = "https://eu.app.clio.com/oauth/token";

  context.log("Refreshing Clio access token...");

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
    throw new Error("One or more Clio OAuth credentials are missing.");
  }

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
    throw new Error(`Failed to obtain Clio access token: ${errorText}`);
  }
  const tokenData = await tokenResponse.json();
  const newAccessToken = tokenData.access_token;
  context.log(`Refreshed access token; new token length: ${newAccessToken.length} characters.`);
  return newAccessToken;
}

/**
 * Helper: Fetch all pages by following the "next" paging URL.
 * A delay is added between requests to avoid overwhelming the API.
 * If an authentication error occurs, the token is refreshed and the request retried.
 */
async function fetchAllPages(initialUrl: string, initialAccessToken: string, context: InvocationContext): Promise<any[]> {
  let allData: any[] = [];
  let nextUrl: string | null = initialUrl;
  let accessToken = initialAccessToken;

  while (nextUrl) {
    context.log(`Fetching page: ${nextUrl}`);
    let response: NodeFetchResponse;
    try {
      response = await fetch(nextUrl, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${accessToken}`
        }
      }) as unknown as NodeFetchResponse;
    } catch (err) {
      context.error("Error during fetch:", err);
      throw err;
    }
    
    // If unauthorized, refresh the token and retry the current page
    if (response.status === 401) {
      context.log("Received 401 Unauthorized. Refreshing token and retrying current page.");
      accessToken = await refreshAccessToken(context);
      // Retry the current page with the new token
      continue;
    }
    
    if (!response.ok) {
      const errorText: string = await response.text();
      context.error(`Failed to fetch activities: ${errorText}`);
      throw new Error(`Failed to fetch activities: ${errorText}`);
    }
    
    const pageData: any = await response.json();
    if (Array.isArray(pageData.data)) {
      allData = allData.concat(pageData.data);
    } else {
      context.warn("Unexpected data format on page:", pageData);
    }
    
    nextUrl = pageData.meta?.paging?.next || null;
    
    if (nextUrl) {
      // Delay for 2 seconds before fetching the next page
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
  return allData;
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
    if (req.body && typeof req.body === "object" && "getReader" in req.body) {
      rawBody = await streamToString(req.body as unknown as ReadableStream<any>);
    } else if (typeof req.body === "string") {
      rawBody = req.body;
    } else if (req.body) {
      rawBody = JSON.stringify(req.body);
    }
    
    context.log("Received raw request body: " + rawBody);
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

    // Instead of fetching a single page, fetch all pages with pagination.
    context.log("Fetching all pages of activities...");
    const allActivities = await fetchAllPages(activitiesUrl, accessToken, context);
    context.log(`Fetched total activities count: ${allActivities.length}`);

    return { status: 200, body: JSON.stringify({ data: allActivities }) };
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
