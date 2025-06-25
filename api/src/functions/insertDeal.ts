import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const DEAL_CAPTURE_BASE_URL =
  process.env.DEAL_CAPTURE_BASE_URL ||
  "https://instructions-vnet-functions.azurewebsites.net/api/dealCapture";


interface ClientInfo {
  clientId?: number;
  prospectId?: number;
  clientEmail: string;
  isLeadClient?: boolean;
}

interface DealRequest {
  serviceDescription: string;
  amount: number;
  areaOfWork: string;
  prospectId: string;
  pitchedBy: string;
  isMultiClient: boolean;
  leadClientEmail: string;
  leadClientId: number;
  clients?: ClientInfo[];
  passcode?: string;
}

import axios from "axios";

async function sendTestDealEmail(
  context: InvocationContext,
  serviceDescription: string,
  amount: number,
  passcode: string
) {
  try {
    const tenantId = "7fbc252f-3ce5-460f-9740-4e1cb8bf78b8";
    const kvUri = "https://helix-keys.vault.azure.net/";
    const credential = new DefaultAzureCredential();
    const secretClient = new SecretClient(kvUri, credential);

    const clientId = (await secretClient.getSecret(
      "graph-pitchbuilderemailprovider-clientid"
    )).value;
    const clientSecret = (await secretClient.getSecret(
      "graph-pitchbuilderemailprovider-clientsecret"
    )).value;

    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: clientId ?? "",
        client_secret: clientSecret ?? "",
        scope: "https://graph.microsoft.com/.default",
        grant_type: "client_credentials",
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    const accessToken = tokenResponse.data.access_token;

    const checkoutUrl = process.env.DEAL_CHECKOUT_URL
      ? `${process.env.DEAL_CHECKOUT_URL}?passcode=${passcode}`
      : `https://example.com/checkout?passcode=${passcode}`;

    const emailContent = {
      message: {
        subject: `Test: Deal captured for ${serviceDescription}`,
        body: {
          contentType: "HTML",
          content: `<p>This is a preview of the email a client will receive when a deal is created.</p><p><a href="${checkoutUrl}">Enter the workflow</a> to get started.</p><p><strong>Service:</strong> ${serviceDescription}<br/><strong>Amount:</strong> ${amount}</p>`,
        },
        toRecipients: [
          {
            emailAddress: { address: "lz@helix-law.com" },
          },
        ],
        from: {
          emailAddress: { address: "automations@helix-law.com" },
        },
      },
      saveToSentItems: "false",
    };

    await axios.post(
      `https://graph.microsoft.com/v1.0/users/automations@helix-law.com/sendMail`,
      emailContent,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (err) {
    context.error("Failed to send test email", err);
  }
}

export async function insertDealHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
  context.log("insertDealHandler invoked");

  if (req.method !== "POST") {
    return { status: 405, body: "Method not allowed" };
  }

  let body: DealRequest;
  try {
    body = await req.json() as DealRequest;
  } catch (error) {
    context.error("Invalid JSON body", error);
    return { status: 400, body: "Invalid JSON" };
  }

const {
  serviceDescription,
  amount,
  areaOfWork,
  prospectId,
  pitchedBy,
  isMultiClient,
  leadClientEmail,
  leadClientId,
  clients
} = body;

  // Generate a 5 digit numerical passcode if not provided
  const passcode = body.passcode || Math.floor(10000 + Math.random() * 90000).toString();

  if (!serviceDescription || amount === undefined || !areaOfWork || !prospectId || !pitchedBy || !leadClientEmail) {
    return { status: 400, body: "Missing required fields" };
  }

  try {
    const kvUri = "https://helix-keys.vault.azure.net/";

    let code = process.env.DEAL_CAPTURE_CODE;
    if (!code) {
      const secretClient = new SecretClient(kvUri, new DefaultAzureCredential());
      const secret = await secretClient.getSecret("dealCapture-code");
      code = secret.value;
    }

    if (!code) {
      context.error("Deal capture code missing in configuration");
      return { status: 500, body: "Deal capture code not configured" };
    }

    const url = `${DEAL_CAPTURE_BASE_URL}?code=${code}`;

    const payload = {
      serviceDescription,
      amount,
      areaOfWork,
      prospectId,
      passcode,
      pitchedBy,
      isMultiClient,
      leadClientEmail,
      clients: (clients || []).map(c => ({
        clientId: c.clientId,
        prospectId: c.prospectId,
        clientEmail: c.clientEmail,
        isLeadClient: c.isLeadClient ?? false,
      })),
    };

    const response = await axios.post(url, payload);
    if (response.status >= 200 && response.status < 300) {
      const result = typeof response.data === 'object' ? response.data : {};
      await sendTestDealEmail(context, serviceDescription, amount, passcode);
      return {
        status: 200,
        body: JSON.stringify({
          message: "Deal captured",
          passcode,
          ...result,
        }),
        headers: { "Content-Type": "application/json" },
      };
    }
    return { status: response.status, body: response.statusText };
  } catch (error: any) {
    context.error("Error capturing deal", error);
    const message = error.response?.data || error.message || "Unknown error";
    return { status: 500, body: `Error capturing deal: ${message}` };
  }
}

app.http("insertDeal", {
  methods: ["POST"],
  authLevel: "function",
  handler: insertDealHandler,
});

export default app;