const axios = require('axios');
const { DefaultAzureCredential } = require('@azure/identity');
const { SecretClient } = require('@azure/keyvault-secrets');

// Hard-coded tenant ID as used in other functions
const tenantId = '7fbc252f-3ce5-460f-9740-4e1cb8bf78b8';

// Use the instructions Key Vault
const vaultUrl = 'https://helixlaw-instructions.vault.azure.net/';
const credential = new DefaultAzureCredential();
const secretClient = new SecretClient(vaultUrl, credential);

async function getSecret(name) {
  const secret = await secretClient.getSecret(name);
  return secret.value;
}

module.exports = async function (context, req) {
  context.log('sendEmail function triggered');

  if (req.method !== 'POST') {
    context.res = { status: 405, body: 'Method not allowed' };
    return;
  }

  const body = req.body || {};
  const emailContents = body.email_contents;
  const userEmail = body.user_email;
  const subject = body.subject || 'Your Enquiry from Helix';
  const fromEmail = body.from_email || 'automations@helix-law.com';
  const ccEmails = body.cc_emails; // Optional CC field - can be array or single string (may be comma/semicolon separated)
  const bccEmails = body.bcc_emails; // Optional BCC field - can be array or single string (may be comma/semicolon separated)
  const bccEmail = body.bcc_email; // Backward compatibility

  if (!emailContents || !userEmail) {
    context.res = { status: 400, body: 'Missing email_contents or user_email' };
    return;
  }

  try {
    const clientId = await getSecret('graph-pitchbuilderemailprovider-clientid');
    const clientSecret = await getSecret('graph-pitchbuilderemailprovider-clientsecret');

    const tokenResponse = await axios.post(
      `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`,
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        scope: 'https://graph.microsoft.com/.default',
        grant_type: 'client_credentials'
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenResponse.data.access_token;

    // Normalize a string or array of emails into a flat, de-duplicated array of addresses
    const normalizeEmails = (emails) => {
      if (!emails) return [];
      const raw = Array.isArray(emails) ? emails : [emails];
      const splitRegex = /[,;]+/; // split on comma or semicolon
      const flattened = raw
        .flatMap((e) => (typeof e === 'string' ? e.split(splitRegex) : []))
        .map((e) => (e || '').trim())
        .filter((e) => e.length > 0);
      // de-duplicate while preserving order
      const seen = new Set();
      const unique = [];
      for (const addr of flattened) {
        if (!seen.has(addr)) {
          seen.add(addr);
          unique.push(addr);
        }
      }
      return unique;
    };

    // Helper to convert array of email strings to Graph recipient objects
    const formatRecipients = (emails) => {
      const list = normalizeEmails(emails);
      return list.map((address) => ({ emailAddress: { address } }));
    };

    // Build CC recipients
    const ccRecipients = formatRecipients(ccEmails);
    
    // Build BCC recipients (combine new bccEmails with old bccEmail for backward compatibility)
    const allBccEmails = normalizeEmails([bccEmails, bccEmail].filter(Boolean));
    const bccRecipients = formatRecipients(allBccEmails);

    const messagePayload = {
      message: {
        subject,
        body: {
          contentType: 'HTML',
          content: emailContents
        },
        toRecipients: [{ emailAddress: { address: userEmail } }],
        from: { emailAddress: { address: fromEmail } },
        ...(ccRecipients.length > 0 ? { ccRecipients } : {}),
        ...(bccRecipients.length > 0 ? { bccRecipients } : {})
      },
      saveToSentItems: 'false'
    };

    const graphResponse = await axios.post(
      `https://graph.microsoft.com/v1.0/users/${encodeURIComponent(fromEmail)}/sendMail`,
      messagePayload,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    if (graphResponse.status === 202) {
      context.res = { status: 200, body: 'Email sent' };
    } else {
      context.res = { status: 500, body: `Unexpected status: ${graphResponse.status}` };
    }
  } catch (err) {
    context.log.error('sendEmail error:', err);
    context.res = { status: 500, body: err.message || 'Failed to send email' };
  }
};