import React, { CSSProperties, useState } from 'react';
import {
  Panel,
  PanelType,
  Text,
  Stack,
  TextField,
  DefaultButton,
  PrimaryButton,
  IconButton,
  Separator,
  Label,
} from '@fluentui/react';
import { DocumentEntry } from './documentIndex';
import { useTheme } from '../../../app/functionality/ThemeContext';
import { colours } from '../../../app/styles/colours';

export interface PromptPaneProps {
  doc: DocumentEntry;
  isOpen: boolean;
  onClose: () => void;
}

interface WizardInputs {
  clientName: string;
  caseReference: string;
  keyDetails: string;
}

function generateDraftPrompt(doc: DocumentEntry): string {
  return `
Please generate a bespoke "${doc.title}" with the following details:

- Client Name: [Client Name]
- Case Reference: [Case Reference]
- Key Details: [Insert key details here]
  
Reference the perfect example below:

${doc.fullContent}

Make sure to replace all placeholders with the actual data and maintain the structure.
  `.trim();
}

const PromptPane: React.FC<PromptPaneProps> = ({ doc, isOpen, onClose }) => {
  const { isDarkMode } = useTheme();

  const [wizardData, setWizardData] = useState<WizardInputs>({
    clientName: '',
    caseReference: '',
    keyDetails: '',
  });
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [draftPrompt, setDraftPrompt] = useState<string>(generateDraftPrompt(doc));

  const updateDraftPromptFromWizard = () => {
    const base = generateDraftPrompt(doc);
    const replaced = base
      .replace('[Client Name]', wizardData.clientName || '...')
      .replace('[Case Reference]', wizardData.caseReference || '...')
      .replace('[Insert key details here]', wizardData.keyDetails || '...');
    setDraftPrompt(replaced);
  };

  const goNextStep = () => {
    if (wizardStep < 3) {
      setWizardStep(wizardStep + 1);
    } else {
      updateDraftPromptFromWizard();
    }
  };

  const goPrevStep = () => {
    if (wizardStep > 1) {
      setWizardStep(wizardStep - 1);
    }
  };

  const renderWizardContent = () => {
    switch (wizardStep) {
      case 1:
        return (
          <Stack tokens={{ childrenGap: 10 }}>
            <Label>Step 1: Client Name</Label>
            <TextField
              placeholder="e.g. John Doe"
              value={wizardData.clientName}
              onChange={(_, v) => setWizardData((prev) => ({ ...prev, clientName: v || '' }))}
            />
          </Stack>
        );
      case 2:
        return (
          <Stack tokens={{ childrenGap: 10 }}>
            <Label>Step 2: Case Reference</Label>
            <TextField
              placeholder="e.g. REF12345"
              value={wizardData.caseReference}
              onChange={(_, v) => setWizardData((prev) => ({ ...prev, caseReference: v || '' }))}
            />
          </Stack>
        );
      case 3:
      default:
        return (
          <Stack tokens={{ childrenGap: 10 }}>
            <Label>Step 3: Key Details</Label>
            <TextField
              placeholder="e.g. A short summary of the dispute..."
              multiline
              rows={3}
              value={wizardData.keyDetails}
              onChange={(_, v) => setWizardData((prev) => ({ ...prev, keyDetails: v || '' }))}
            />
          </Stack>
        );
    }
  };

  const panelContentStyle: CSSProperties = {
    padding: '20px',
    backgroundColor: isDarkMode ? colours.dark.background : colours.light.background,
    height: '100%',
    overflowY: 'auto', // This is now correctly typed
    fontFamily: 'Raleway, sans-serif',
  };

  const panelHeaderStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    paddingBottom: '10px',
    borderBottom: `1px solid ${isDarkMode ? '#444' : '#ddd'}`,
    marginBottom: '20px',
  };

  return (
    <Panel
      isOpen={isOpen}
      onDismiss={onClose}
      type={PanelType.largeFixed}
      headerText={doc.title}
      closeButtonAriaLabel="Close"
    >
      <div style={panelContentStyle}>
        <div style={panelHeaderStyle}>
          <Text variant="xLarge" styles={{ root: { fontWeight: 700 } }}>
            {doc.title}
          </Text>
        </div>

        <Stack horizontal tokens={{ childrenGap: 20 }} styles={{ root: { marginBottom: '20px' } }}>
          <Stack
            styles={{
              root: {
                flex: 1,
                border: `1px solid ${isDarkMode ? '#444' : '#ddd'}`,
                padding: '10px',
                borderRadius: '4px',
              },
            }}
          >
            <Text variant="medium" styles={{ root: { fontWeight: 600, marginBottom: '10px' } }}>
              Perfect Example
            </Text>
            <Text variant="small" styles={{ root: { whiteSpace: 'pre-wrap', maxHeight: '250px', overflowY: 'auto' } }}>
              {doc.fullContent}
            </Text>
          </Stack>

          <Stack
            styles={{
              root: {
                flex: 1,
                border: `1px solid ${isDarkMode ? '#444' : '#ddd'}`,
                padding: '10px',
                borderRadius: '4px',
              },
            }}
          >
            <Text variant="medium" styles={{ root: { fontWeight: 600, marginBottom: '10px' } }}>
              Requirements
            </Text>
            <Text variant="small" styles={{ root: { whiteSpace: 'pre-wrap' } }}>
              {doc.requirements}
            </Text>
          </Stack>
        </Stack>

        <Stack tokens={{ childrenGap: 15 }} styles={{ root: { marginBottom: '20px' } }}>
          <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
            Populate Key Fields (Optional)
          </Text>
          <Separator />
          {renderWizardContent()}
          <Stack horizontal tokens={{ childrenGap: 10 }} styles={{ root: { marginTop: 10 } }}>
            <DefaultButton text="Previous" disabled={wizardStep === 1} onClick={goPrevStep} />
            <PrimaryButton text={wizardStep < 3 ? 'Next' : 'Apply to Prompt'} onClick={goNextStep} />
          </Stack>
        </Stack>

        <Stack tokens={{ childrenGap: 15 }}>
          <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
            Draft Prompt for Language Model
          </Text>
          <TextField
            label="Your Draft Prompt"
            multiline
            rows={6}
            value={draftPrompt}
            onChange={(_, val) => setDraftPrompt(val || '')}
          />
          <Text variant="small" styles={{ root: { marginTop: '10px', fontStyle: 'italic' } }}>
            Copy the above prompt into your language model interface after filling any remaining placeholders.
          </Text>
        </Stack>

        <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 10 }} styles={{ root: { marginTop: '20px' } }}>
          <PrimaryButton text="Use This Template" onClick={() => console.log('Proceed with template generation...')} />
          <DefaultButton text="Close" onClick={onClose} />
        </Stack>

        <Stack horizontal horizontalAlign="end" styles={{ root: { marginTop: '20px' } }}>
          <IconButton
            iconProps={{ iconName: 'Cancel' }}
            title="Close Panel"
            ariaLabel="Close Panel"
            onClick={onClose}
          />
        </Stack>
      </div>
    </Panel>
  );
};

export default PromptPane;
