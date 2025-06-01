import React, { useState } from 'react';
import { Panel, PanelType, TextField, PrimaryButton, Stack, DefaultButton } from '@fluentui/react';

interface OpenAIAssistantProps {
  isOpen: boolean;
  onDismiss: () => void;
  emailText: string;
}

const OpenAIAssistant: React.FC<OpenAIAssistantProps> = ({ isOpen, onDismiss, emailText }) => {
  const [prompt, setPrompt] = useState<string>('Check this email for typos and suggest improvements.');
  const [response, setResponse] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const apiKey = process.env.REACT_APP_OPENAI_API_KEY;

  async function runPrompt() {
    setLoading(true);
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            { role: 'system', content: 'You are an assistant that helps improve emails.' },
            { role: 'user', content: `${prompt}\n\n${emailText}` },
          ],
        }),
      });
      const json = await res.json();
      setResponse(json.choices?.[0]?.message?.content || 'No response');
    } catch (err) {
      console.error(err);
      setResponse('Error contacting OpenAI');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Panel
      isOpen={isOpen}
      onDismiss={onDismiss}
      headerText="AI Assistant"
      closeButtonAriaLabel="Close"
      type={PanelType.medium}
    >
      <Stack tokens={{ childrenGap: 10 }}>
        <TextField
          label="Prompt"
          multiline
          value={prompt}
          onChange={(_, val) => setPrompt(val || '')}
        />
        <PrimaryButton text={loading ? 'Running...' : 'Run'} onClick={runPrompt} disabled={loading} />
        <TextField label="Response" multiline value={response} readOnly />
        <DefaultButton text="Close" onClick={onDismiss} />
      </Stack>
    </Panel>
  );
};

export default OpenAIAssistant;
