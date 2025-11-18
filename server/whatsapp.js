const fetch = require('node-fetch');

const DEFAULT_PHONE_NUMBER = '447700900123';
const DEFAULT_USER_NAME = 'User';

// Helper to get secret from Key Vault
async function getSecret(secretClient, secretName) {
  try {
    const secret = await secretClient.getSecret(secretName);
    return secret.value;
  } catch (error) {
    console.error(`[KEY-VAULT] Failed to get ${secretName}:`, error.message);
    throw error;
  }
}

function registerWhatsAppRoutes(app) {
  if (!app || typeof app.post !== 'function' || typeof app.get !== 'function') {
    throw new TypeError('An Express app instance with get() and post() methods is required');
  }

  const handleOutboundMessage = async (req, res) => {
    console.log('/message endpoint invoked');

    try {
      const secretClient = req.app.locals.secretClient;
      const formData = req.body || {};
      const userPhone = formData.phone || DEFAULT_PHONE_NUMBER;
      const userName = formData.name || DEFAULT_USER_NAME;

      const payload = {
        messaging_product: 'whatsapp',
        to: userPhone,
        type: 'text',
        text: {
          body: `Hi ${userName}, thanks for contacting Helix Law! We'll be in touch soon.`,
        },
      };

      // Get phone number ID and access token from Key Vault
      const phoneNumberId = await getSecret(secretClient, 'whatsapp-phone-number-id');
      const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

      if (!accessToken) {
        console.error('Missing WhatsApp access token');
        return res.status(500).json({
          error: 'WhatsApp configuration missing',
          details: 'WHATSAPP_ACCESS_TOKEN environment variable is required',
        });
      }

      const response = await fetch(
        `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const result = await response.json();
      console.log('Message API result:', result);

      if (!response.ok) {
        return res.status(response.status).json({
          error: 'Failed to send WhatsApp message',
          details: result,
        });
      }

      res.status(200).json({ message: 'Message sent successfully!' });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // WhatsApp outbound message route (singular)
  app.post('/message', handleOutboundMessage);
  // WhatsApp outbound message route (plural alias for user convenience)
  app.post('/messages', handleOutboundMessage);

  // WhatsApp webhook verification (GET)
  app.get('/webhook', async (req, res) => {
    try {
      const secretClient = req.app.locals.secretClient;
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      // Get verify token from Key Vault
      const verifyToken = await getSecret(secretClient, 'whatsapp-verify-token');

      if (mode && token === verifyToken) {
        res.status(200).send(challenge);
      } else {
        res.sendStatus(403);
      }
    } catch (error) {
      console.error('[WEBHOOK] Verification error:', error.message);
      res.sendStatus(403);
    }
  });

  // WhatsApp webhook event receiver (POST)
  app.post('/webhook', (req, res) => {
    console.log('📩 Webhook event received:', JSON.stringify(req.body, null, 2));
    res.sendStatus(200);
  });
}

module.exports = { registerWhatsAppRoutes };