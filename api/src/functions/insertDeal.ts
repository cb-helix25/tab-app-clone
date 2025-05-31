import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

const DEAL_CAPTURE_BASE_URL = "https://instructions-functions.azurewebsites.net/api/dealCapture";
interface ClientInfo {
  firstName: string;
  lastName: string;
  email: string;
}

interface DealRequest {
  serviceDescription: string;
  amount: number;
  areaOfWork: string;
  prospectId: string;
  pitchedBy: string;
  isMultiClient: boolean;
  leadClientEmail: string;
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

  const { serviceDescription, amount, areaOfWork, prospectId, pitchedBy, isMultiClient, leadClientEmail, clients } = body;

  if (!serviceDescription || amount === undefined || !areaOfWork || !prospectId || !pitchedBy || !leadClientEmail) {
    return { status: 400, body: "Missing required fields" };
  }

  try {
    const kvUri = "https://helix-keys.vault.azure.net/";
    const secretClient = new SecretClient(kvUri, new DefaultAzureCredential());
    const secret = await secretClient.getSecret("dealCapture-code");
    const code = secret.value;

    const url = `${DEAL_CAPTURE_BASE_URL}?code=${code}`;
    const now = new Date();
    const formatDate = (d: Date) => d.toISOString().split("T")[0];
    const formatTime = (d: Date) => d.toISOString().split("T")[1].split(".")[0];

    const payload = {
      InstructionRef: null,
      ProspectId: prospectId,
      ServiceDescription: serviceDescription,
      Amount: amount,
      AreaOfWork: areaOfWork,
      PitchedBy: pitchedBy,
      PitchedDate: formatDate(now),
      PitchedTime: formatTime(now),
      PitchValidUntil: formatDate(new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)),
      Status: "pitched",
      IsMultiClient: isMultiClient ? 1 : 0,
      LeadClientId: null,
      LeadClientEmail: leadClientEmail,
      Clients: clients || [],
      CloseDate: null,
      CloseTime: null
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