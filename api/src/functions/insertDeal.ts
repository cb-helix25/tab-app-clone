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
}

import axios from "axios";

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
      return { status: 200, body: "Deal captured" };
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