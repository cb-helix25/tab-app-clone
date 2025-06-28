import React from 'react';
import {
  Stack,
  Text,
  MessageBar,
  MessageBarType,
  Separator,
  Panel,
  PanelType,
  PrimaryButton,
  DefaultButton,
  Checkbox,
  IconButton,
} from '@fluentui/react';
import { colours } from '../../../app/styles/colours';
import {
  sharedPrimaryButtonStyles,
  sharedDefaultButtonStyles,
  sharedDraftConfirmedButtonStyles,
} from '../../../app/styles/ButtonStyles';
import {
  removeHighlightSpans,
  markUnfilledPlaceholders,
  removeUnfilledPlaceholders,
  applyDynamicSubstitutions,
  convertDoubleBreaksToParagraphs,
} from './emailUtils';
import ExperimentalAssistant from './ExperimentalAssistant';
import { isInTeams } from '../../../app/functionality/isInTeams';
import { TemplateBlock } from '../../../app/customisation/ProductionTemplateBlocks';

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function removeAutoInsertedBlocks(
  html: string,
  autoBlocks: { [key: string]: boolean },
  editedBlocks: { [key: string]: boolean }
): string {
  let result = html;
  Object.keys(autoBlocks).forEach((title) => {
    if (!autoBlocks[title]) return;
    if (editedBlocks[title]) return;
    const escaped = escapeRegExp(title);
    const regex = new RegExp(
      `<!--START_BLOCK:${escaped}-->[\\s\\S]*?<!--END_BLOCK:${escaped}-->`,
      'g'
    );
    result = result.replace(regex, '');
  });
  return result;
}

interface EmailPreviewProps {
  isPreviewOpen: boolean;
  onDismiss: () => void;
  enquiry: any; // Ideally, replace with the appropriate type e.g., Enquiry
  subject: string;
  body: string;
  templateBlocks: TemplateBlock[];
  attachments: string[];
  followUp?: string;
  fullName: string;
  userData: any;
  serviceDescription?: string;
  clients?: { firstName: string; lastName: string; email: string }[];
  to: string;
  autoInsertedBlocks: { [key: string]: boolean };
  editedBlocks: { [key: string]: boolean };
  sendEmail: () => void;
  handleDraftEmail: () => void;
  isSuccessVisible: boolean;
  isDraftConfirmed: boolean;
  amount?: string;
  passcode?: string;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({
  isPreviewOpen,
  onDismiss,
  enquiry,
  subject,
  body,
  templateBlocks,
  attachments,
  followUp,
  fullName,
  userData,
  serviceDescription,
  clients,
  to,
  autoInsertedBlocks,
  editedBlocks,
  sendEmail,
  handleDraftEmail,
  isSuccessVisible,
  isDraftConfirmed,
  amount,
  passcode,
}) => {
  // Strip blocks auto inserted by the system unless edited
  const withoutAutoBlocks = removeAutoInsertedBlocks(
    body,
    autoInsertedBlocks,
    editedBlocks
  );
  
  // Process body HTML using imported functions
  const sanitized = removeHighlightSpans(withoutAutoBlocks);
  const substituted = applyDynamicSubstitutions(
    sanitized,
    userData,
    enquiry,
    amount,
    passcode,
    passcode ? `${process.env.REACT_APP_CHECKOUT_URL}?passcode=${passcode}` : undefined
  );
  const highlightedBody = markUnfilledPlaceholders(substituted, templateBlocks);
  const finalBody = convertDoubleBreaksToParagraphs(highlightedBody);
const previewRef = React.useRef<HTMLDivElement>(null);

  const [isAiOpen, setIsAiOpen] = React.useState(false);
  const [isConfirmed, setIsConfirmed] = React.useState(false);
  React.useEffect(() => {
    if (isPreviewOpen) {
      setIsConfirmed(false);
    }
  }, [isPreviewOpen]);
  const inTeams = isInTeams();
  const useLocalData =
    process.env.REACT_APP_USE_LOCAL_DATA === 'true' || !inTeams;
  const allowedInitials = ['LZ', 'AC'];
  const userInitials = userData?.[0]?.Initials?.toUpperCase() || '';
  const canUseAi = useLocalData || allowedInitials.includes(userInitials);
  const showAiAssistButton = false;

  // Example follow-up options (you may wish to pass these in or centralise them)
  const followUpOptions: { [key: string]: string } = {
    '1_day': '1 day',
    '2_days': '2 days',
    '3_days': '3 days',
    '7_days': '7 days',
    '14_days': '14 days',
    '30_days': '30 days',
  };

function formatCurrency(val?: string): string {
  if (!val) return 'N/A';
  const num = parseFloat(val.replace(/,/g, ''));
  if (isNaN(num)) return val;
  return num.toLocaleString('en-GB', {
    style: 'currency',
    currency: 'GBP',
    minimumFractionDigits: 2,
  });
}

  return (
    <Panel
      isOpen={isPreviewOpen}
      onDismiss={onDismiss}
      type={PanelType.custom}
      customWidth="600px"
      hasCloseButton={false}
      styles={{
        main: {
          padding: '12px',
          backgroundColor: colours.light.previewBackground,
          color: colours.light.text,
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        },
      }}
    >
      <Stack tokens={{ childrenGap: 10 }} styles={{ root: { flex: 1 } }}>
        {/* Header with close button */}
        <Stack
          horizontal
          verticalAlign="center"
          styles={{ root: { justifyContent: 'space-between' } }}
        >
          <Text variant="medium" styles={{ root: { fontWeight: 600 } }}>
            You're sending an email to {fullName || 'N/A'}
          </Text>
          <IconButton
            iconProps={{ iconName: 'Cancel' }}
            ariaLabel="Close preview"
            onClick={onDismiss}
          />
        </Stack>

        {/* Combined summary section */}
        <Stack
          tokens={{ childrenGap: 8 }}
          styles={{ root: { backgroundColor: colours.grey, padding: 8, borderRadius: 4 } }}
        >
          <Text variant="medium" styles={{ root: { color: colours.greyText } }}>
            {enquiry.Point_of_Contact || 'N/A'}
          </Text>
          <Stack tokens={{ childrenGap: 8 }}>
            <Stack tokens={{ childrenGap: 4 }}>
              <Text variant="medium" styles={{ root: { fontWeight: 600, color: colours.highlight } }}>
                Deal Details
              </Text>
              <Text variant="medium">
                <strong>Service:</strong> {serviceDescription || 'N/A'}
              </Text>
              <Text variant="medium">
                <strong>Amount:</strong> {formatCurrency(amount)}
              </Text>
              {clients && clients.length > 0 && (
                <Stack tokens={{ childrenGap: 2 }}>
                  <Text variant="medium" styles={{ root: { marginTop: 6 } }}>
                    <strong>Clients Requiring ID:</strong>
                  </Text>
                  {clients.map((c, idx) => (
                    <Text key={idx} variant="medium" styles={{ root: { marginLeft: 12 } }}>
                      {c.firstName} {c.lastName} - {c.email}
                    </Text>
                  ))}
                </Stack>
              )}
            </Stack>
            <Stack tokens={{ childrenGap: 4 }}>
              <Text variant="medium" styles={{ root: { fontWeight: 600, color: colours.highlight } }}>
                Subject
              </Text>
              <Text variant="medium" styles={{ root: { whiteSpace: 'pre-wrap' } }}>
                {subject || 'N/A'}
              </Text>
            </Stack>
          </Stack>
        </Stack>

        {isSuccessVisible && (
          <MessageBar
            messageBarType={MessageBarType.success}
            isMultiline={false}
            onDismiss={() => {}}
            dismissButtonAriaLabel="Close"
            styles={{ root: { borderRadius: 0, marginTop: '10px' } }}
          >
            Email drafted successfully!
          </MessageBar>
        )}
        <Separator />

        {/* Body */}
        <Stack tokens={{ childrenGap: 6 }} styles={{ root: { flexGrow: 1 } }}>
          <Text variant="medium" styles={{ root: { fontWeight: 600, color: colours.highlight, marginBottom: 5 } }}>
            Body:
          </Text>
          <div
            ref={previewRef}
            style={{ whiteSpace: 'pre-wrap', maxHeight: '60vh', overflowY: 'auto' }}
            dangerouslySetInnerHTML={{ __html: finalBody }}
          />
        </Stack>

        {/*
          Attachments preview disabled. Retained code for future use.
        {attachments.length > 0 && (
          <>
            <Separator />
            <Stack tokens={{ childrenGap: 6 }}>
              <Text variant="large" styles={{ root: { fontWeight: '600', color: colours.highlight, marginBottom: '5px' } }}>
                Attachments:
              </Text>
              <Stack tokens={{ childrenGap: 5 }}>
                {attachments.map((att: string) => (
                  <Text key={att} variant="medium">
                    - {att}
                  </Text>
                ))}
              </Stack>
            </Stack>
          </>
        )}
        */}

      {followUp && (
        <>
          <Separator />
          <Stack tokens={{ childrenGap: 6 }}>
            <Text variant="large" styles={{ root: { fontWeight: '600', color: colours.highlight, marginBottom: '5px' } }}>
              Follow Up:
            </Text>
            <Text variant="medium">
              {followUpOptions[followUp] || followUp}
            </Text>
          </Stack>
        </>
      )}

      </Stack>
      <Checkbox
        label="Looks good"
        checked={isConfirmed}
        onChange={(_e, checked) => setIsConfirmed(!!checked)}
        styles={{ root: { marginTop: 10 } }}
      />

      <Stack horizontal styles={{ root: { marginTop: 20, justifyContent: 'space-between', alignItems: 'center' } }}>
        <Stack horizontal tokens={{ childrenGap: 15 }}>
          <PrimaryButton
            text="Send Email"
            onClick={sendEmail}
            styles={sharedPrimaryButtonStyles}
            disabled
            title="Sending is disabled in testing mode. Use Draft Email."
          />
          <DefaultButton
            text={isDraftConfirmed ? 'Drafted' : 'Draft Email'}
            onClick={handleDraftEmail}
            styles={isDraftConfirmed ? sharedDraftConfirmedButtonStyles : sharedDefaultButtonStyles}
            disabled={!isConfirmed || isDraftConfirmed}
            iconProps={isDraftConfirmed ? { iconName: 'CheckMark' } : undefined}
          />
        </Stack>
        {canUseAi && showAiAssistButton && (
          <DefaultButton
            text="AI Assist"
            styles={sharedDefaultButtonStyles}
            onClick={() => setIsAiOpen(true)}
            iconProps={{ iconName: 'Robot' }}
            title="Send this email to OpenAI for suggestions"
          />
        )}
        <DefaultButton
          text="Copy to Clipboard"
          styles={sharedDefaultButtonStyles}
          onClick={() => {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = finalBody;
            navigator.clipboard.writeText(tempDiv.innerText || tempDiv.textContent || '');
          }}
          iconProps={{ iconName: 'Copy' }}
          title="Copy the email preview text to your clipboard"
        />
      </Stack>
      {canUseAi && showAiAssistButton && (
        <ExperimentalAssistant
          isOpen={isAiOpen}
          onDismiss={() => setIsAiOpen(false)}
          emailText={`Subject: ${subject}\n\n${previewRef.current?.innerText || ''}`}
        />
      )}
    </Panel>
  );
};

export default EmailPreview;