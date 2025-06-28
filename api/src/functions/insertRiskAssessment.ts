import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { DefaultAzureCredential } from "@azure/identity";
import { SecretClient } from "@azure/keyvault-secrets";

export async function insertRiskAssessmentHandler(req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log("insertRiskAssessmentHandler invoked");

    if (req.method !== "POST") {
        return { status: 405, body: "Method not allowed" };
    }

    let body: any;
    try {
        body = await req.json();
    } catch (error) {
        context.error("Invalid JSON body", error);
        return { status: 400, body: "Invalid JSON" };
    }

    const baseUrl = process.env.RISK_ASSESSMENT_BASE_URL ||
        "https://instructions-vnet-functions.azurewebsites.net/api/recordRiskAssessment";

    let code = process.env.RISK_ASSESSMENT_CODE;
    if (!code) {
        const secretName = process.env.RISK_ASSESSMENT_CODE_SECRET || "recordRiskAssessment-code";
        const secretClient = new SecretClient("https://helix-keys.vault.azure.net/", new DefaultAzureCredential());
        try {
            const secret = await secretClient.getSecret(secretName);
            code = secret.value;
        } catch (err) {
            context.error("Failed to retrieve risk assessment code", err);
            return { status: 500, body: "Unable to retrieve risk assessment code" };
        }
    }

    const url = `${baseUrl}?code=${code}`;

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });
        if (!response.ok) {
            const text = await response.text();
            context.error("Risk assessment service error:", text);
            return { status: 500, body: "Failed to insert risk assessment" };
        }
        const data = await response.text();
        return { status: 200, body: data, headers: { "Content-Type": "application/json" } };
    } catch (err) {
        context.error("Error calling risk assessment service", err);
        return { status: 500, body: "Error calling risk assessment service" };
    }
}

app.http("insertRiskAssessment", {
    methods: ["POST"],
    authLevel: "function",
    handler: insertRiskAssessmentHandler,
});

export default app;
