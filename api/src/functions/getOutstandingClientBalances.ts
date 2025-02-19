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

export async function getOutstandingClientBalancesHandler(
  req: HttpRequest,
  context: InvocationContext
): Promise<HttpResponseInit> {
  context.log("Invocation started for getOutstandingClientBalances Azure Function.");

  // No additional parameters are needed from the request.
  
  // Key Vault URI and secret names
  const kvUri = "https://helix-keys.vault.azure.net/";
  const clioRefreshTokenSecretName = "clio-teamhubv1-refreshtoken";
  const clioSecretName = "clio-teamhubv1-secret";
  const clioClientIdSecretName = "clio-teamhubv1-clientid";

  // Clio endpoints and API details
  const clioTokenUrl = "https://eu.app.clio.com/oauth/token";
  const clioApiBaseUrl = "https://eu.app.clio.com/api/v4";
  // Define the fields for the outstanding client balances call
  const outstandingFields = "id,created_at,updated_at,associated_matter_ids,contact{id,etag,name,first_name,middle_name,last_name,date_of_birth,type,created_at,updated_at,prefix,title,initials,clio_connect_email,locked_clio_connect_email,client_connect_user_id,primary_email_address,secondary_email_address,primary_phone_number,secondary_phone_number,ledes_client_id,has_clio_for_clients_permission,is_client,is_clio_for_client_user,is_co_counsel,is_bill_recipient,sales_tax_number,currency},total_outstanding_balance,last_payment_date,last_shared_date,newest_issued_bill_due_date,pending_payments_total,reminders_enabled,currency{id,etag,code,sign,created_at,updated_at},outstanding_bills{id,etag,number,issued_at,created_at,due_at,tax_rate,secondary_tax_rate,updated_at,subject,purchase_order,type,memo,start_at,end_at,balance,state,kind,total,paid,paid_at,pending,due,discount_services_only,can_update,credits_issued,shared,last_sent_at,services_secondary_tax,services_sub_total,services_tax,services_taxable_sub_total,services_secondary_taxable_sub_total,taxable_sub_total,secondary_taxable_sub_total,sub_total,tax_sum,secondary_tax_sum,total_tax,available_state_transitions}";
  const balancesUrl = `${clioApiBaseUrl}/outstanding_client_balances.json?fields=${encodeURIComponent(outstandingFields)}`;

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

    // Call Clio API to get the outstanding client balances
    const balancesResponse = await fetch(balancesUrl, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!balancesResponse.ok) {
      const errorText = await balancesResponse.text();
      context.error("Failed to fetch outstanding client balances:", errorText);
      return { status: 500, body: `Failed to fetch outstanding client balances: ${errorText}` };
    }

    const balancesData = await balancesResponse.json();
    context.log("Outstanding client balances retrieved successfully.");

    return { status: 200, body: JSON.stringify(balancesData) };
  } catch (error) {
    context.error("Error in getOutstandingClientBalances:", error);
    return { status: 500, body: "Error retrieving outstanding client balances." };
  } finally {
    context.log("Invocation completed for getOutstandingClientBalances Azure Function.");
  }
}

app.http("getOutstandingClientBalances", {
  methods: ["GET"],
  authLevel: "function",
  handler: getOutstandingClientBalancesHandler,
});

export default app;
