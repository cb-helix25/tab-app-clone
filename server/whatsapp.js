const fetch = require('node-fetch');

const DEFAULT_PHONE_NUMBER = '447700900123';
const DEFAULT_USER_NAME = 'User';
const WORKTYPE_OPTIONS = ['construction', 'commercial', 'property', 'employment'];
const userWorktypes = new Map();

const ICEBREAKER_ANSWERS = {
  property: {
    'Question 1': 'This is the PROPERTY answer to Question 1',
  },
  employment: {
    'Question 2': 'This is the EMPLOYMENT answer to Question 2',
  },
  commercial: {
    'Question 3': 'This is the COMMERCIAL answer to Question 3',
  },
  construction: {
    'Question 4': 'This is the CONSTRUCTION answer to Question 4',
  },
};

// Helper to get secret from Key Vault with fallback to environment variables
async function getSecret(secretClient, secretName, envVarName) {
  if (!secretClient) {
    const envValue = process.env[envVarName];
    if (envValue) {
      console.log(`[KEY-VAULT] Using environment variable ${envVarName}`);
      return envValue;
    }
    throw new Error(`Key Vault unavailable and environment variable ${envVarName} not set`);
  }
  
  try {
    const secret = await secretClient.getSecret(secretName);
    console.log(`[KEY-VAULT] Retrieved secret: ${secretName}`);
    return secret.value;
  } catch (error) {
    console.warn(`[KEY-VAULT] Failed to get ${secretName}, trying environment variable ${envVarName}`);
    const envValue = process.env[envVarName];
    if (envValue) {
      return envValue;
    }
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
      const icebreakers = Array.isArray(formData.icebreakerQuestions)
        ? formData.icebreakerQuestions.filter((question) => typeof question === 'string' && question.trim())
        : [];
      const worktype =
        typeof formData.worktype === 'string'
          ? formData.worktype.trim().toLowerCase()
          : '';
      const chosenWorktype = WORKTYPE_OPTIONS.includes(worktype) ? worktype : 'legal';

      userWorktypes.set(userPhone, chosenWorktype);

      const baseMessage = `Hi ${userName}.`;
      const icebreakerMessage = icebreakers.length
        ? `\n\nYou can reply with any of these quick questions:\n${icebreakers
            .map((question) => `- ${question}`)
            .join('\n')}`
        : '';
      
      const useFlowTemplate = !!formData.useFlowTemplate; // e.g. boolean from frontend

      let payload;

      if (useFlowTemplate) {
        payload = {
          messaging_product: 'whatsapp',
          to: userPhone,
          type: 'template',
          template: {
            name: 'message_templates_hello_helix_marketing_163ba', // your approved template name
            language: { code: 'en_US' },
          },
        };
      } else {
        payload = {
          messaging_product: 'whatsapp',
          to: userPhone,
          type: 'text',
          text: {
            body: `${baseMessage}${icebreakerMessage}`,
          },
        };
      }

      // Get phone number ID from Key Vault (or env var fallback)
      const phoneNumberId = await getSecret(secretClient, 'whatsapp-phone-number-id', 'WHATSAPP_PHONE_NUMBER_ID');
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

  // Get icebreaker questions for a specific worktype
  app.get('/api/icebreakers/:worktype', (req, res) => {
    const worktype = req.params.worktype?.toLowerCase();
    
    if (!WORKTYPE_OPTIONS.includes(worktype)) {
      return res.status(400).json({ 
        error: 'Invalid worktype',
        validOptions: WORKTYPE_OPTIONS 
      });
    }

    const questions = ICEBREAKER_ANSWERS[worktype];
    
    if (!questions) {
      return res.status(404).json({ 
        error: 'No icebreakers found for this worktype' 
      });
    }

    // Return just the question keys
    res.json({
      worktype,
      questions: Object.keys(questions)
    });
  });

  // WhatsApp webhook verification (GET)
  app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'Supersecrettoken2011';

    if (mode && token === verifyToken) {
      console.log('[WEBHOOK] Verification successful');
      res.status(200).send(challenge);
    } else {
      console.warn('[WEBHOOK] Verification failed - invalid token');
      res.sendStatus(403);
    }
  });

  // WhatsApp webhook event receiver (POST)
  app.post('/webhook', async(req, res) => {
    const body = req.body;
    console.log('📩 Webhook event received:', JSON.stringify(body, null, 2));

    if (body.object) {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0]?.value?.messages;
      
      if (changes) {
        const message = changes[0];
        const from = message.from; // WhatsApp number
        const text = message.text?.body;
        const messageType = message.type;

        const incomingText = typeof text === 'string' ? text.trim() : '';
        
        console.log(`[WEBHOOK] Received ${messageType} message from ${from}: ${text || '(no text)'}`);
        
        const userWorktype = userWorktypes.get(from);

        if (!userWorktype) {
          return res.sendStatus(200);
        }

        const answer =
          ICEBREAKER_ANSWERS[userWorktype] &&
          ICEBREAKER_ANSWERS[userWorktype][incomingText];

        if (!answer) {
          return res.sendStatus(200);
        }

        try {
          const secretClient = req.app.locals.secretClient;
          const phoneNumberId = await getSecret(
            secretClient,
            'whatsapp-phone-number-id',
            'WHATSAPP_PHONE_NUMBER_ID'
          );
          const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;

          if (!accessToken) {
            console.error('Missing WhatsApp access token');
            return res.sendStatus(200);
          }

          const response = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              to: from,
              type: 'text',
              text: {
                body: answer,
              },
            }),
          });

          const result = await response.json();
          console.log('Message API result:', result);

          if (!response.ok) {
            console.warn('Failed to send WhatsApp FAQ reply', result);
          }
        } catch (error) {
          console.error('Error sending FAQ response:', error);
        }

      }
      
      res.sendStatus(200);
    } else {
      console.warn('[WEBHOOK] Invalid webhook payload received');
      res.sendStatus(404);
    }
  });
}

module.exports = { registerWhatsAppRoutes }