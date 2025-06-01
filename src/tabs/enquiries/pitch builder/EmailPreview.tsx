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
} from '@fluentui/react';
import { colours } from '../../../app/styles/colours';
import {
  sharedPrimaryButtonStyles,
  sharedDefaultButtonStyles,
  sharedDraftConfirmedButtonStyles,
} from '../../../app/styles/ButtonStyles';
import {
  removeHighlightSpans,
  removeUnfilledPlaceholders,
  applyDynamicSubstitutions,
} from './emailUtils'; // Adjusted path
import ExperimentalAssistant from './ExperimentalAssistant';

interface EmailPreviewProps {
  isPreviewOpen: boolean;
  onDismiss: () => void;
  enquiry: any; // Ideally, replace with the appropriate type e.g., Enquiry
  subject: string;
  body: string;
  attachments: string[];
  followUp?: string;
  fullName: string;
  userData: any;
  serviceDescription?: string;
  clients?: { firstName: string; lastName: string; email: string }[];
  to: string;
  sendEmail: () => void;
  handleDraftEmail: () => void;
  isSuccessVisible: boolean;
  isDraftConfirmed: boolean;
  amount?: string;
}

const EmailPreview: React.FC<EmailPreviewProps> = ({
  isPreviewOpen,
  onDismiss,
  enquiry,
  subject,
  body,
  attachments,
  followUp,
  fullName,
  userData,
  serviceDescription,
  clients,
  to,
  sendEmail,
  handleDraftEmail,
  isSuccessVisible,
  isDraftConfirmed,
  amount,
}) => {
  // Process body HTML using imported functions
  const substituted = applyDynamicSubstitutions(
    removeHighlightSpans(body),
    userData,
    enquiry,
    amount
  );
const cleanBody = removeUnfilledPlaceholders(substituted);
const previewRef = React.useRef<HTMLDivElement>(null);

  const [isAiOpen, setIsAiOpen] = React.useState(false);
  const useLocalData = process.env.REACT_APP_USE_LOCAL_DATA === 'true';
  const allowedInitials = ['LZ', 'AC'];
  const userInitials = userData?.[0]?.Initials?.toUpperCase() || '';
  const canUseAi = useLocalData || allowedInitials.includes(userInitials);


// Detect missing placeholders in the clean body
const missingPlaceholders = cleanBody.match(/\[[^[\]]+]/g);

  // Example follow-up options (you may wish to pass these in or centralise them)
  const followUpOptions: { [key: string]: string } = {
    '1_day': '1 day',
    '2_days': '2 days',
    '3_days': '3 days',
    '7_days': '7 days',
    '14_days': '14 days',
    '30_days': '30 days',
  };

function highlightPlaceholders(html: string): string {
  return html.replace(
    /\[([^[\]]+)]/g,
    `<span style="color: ${colours.cta}; font-weight: bold;">[$1]</span>`
  );
}

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
      type={PanelType.largeFixed}
      headerText="Email Preview"
      closeButtonAriaLabel="Close"
      styles={{
        main: {
          padding: '20px',
          backgroundImage: `url('https://helix-law.co.uk/wp-content/uploads/2023/09/Asset-2-2.png')`,
          backgroundSize: 'cover',
          backgroundPosition: 'top left',
          backgroundRepeat: 'no-repeat',
          backgroundColor: 'rgba(240, 242, 245, 0.9)',
          color: colours.light.text,
          borderRadius: '8px',
          display: 'flex',
          flexDirection: 'column',
          height: '100%',
        },
      }}
    >
      <Stack tokens={{ childrenGap: 15 }} styles={{ root: { flex: 1 } }}>
        {missingPlaceholders && missingPlaceholders.length > 0 && (
          <MessageBar messageBarType={MessageBarType.warning}>
            <strong>Warning:</strong> There are unfilled placeholders in your email:
            <ul style={{ margin: '8px 0 0 18px' }}>
              {missingPlaceholders.map((ph, i) => (
                <li key={i}>{ph}</li>
              ))}
            </ul>
          </MessageBar>
        )}
        <Separator />
        <Text variant="medium">
          <strong style={{ color: colours.cta }}>
            You're sending an email to {fullName || 'N/A'}
          </strong>
          <span style={{ color: colours.greyText, margin: '0 8px' }}>•</span>
          {enquiry.Point_of_Contact || 'N/A'}
        </Text>
        <MessageBar
          messageBarType={MessageBarType.info}
          isMultiline={false}
          styles={{ root: { backgroundColor: colours.grey } }}
        >
          This is {enquiry.First_Name || 'the prospect'}'s first enquiry. You're responding on the same day.
        </MessageBar>

        {isSuccessVisible && (
          <MessageBar
            messageBarType={MessageBarType.success}
            isMultiline={false}
            onDismiss={() => {}}
            dismissButtonAriaLabel="Close"
            styles={{ root: { borderRadius: '4px', marginTop: '10px' } }}
          >
            Email drafted successfully!
          </MessageBar>
        )}

        <Separator />

        {/* Deal Details */}
        <Stack tokens={{ childrenGap: 4 }}>
          <Text variant="large" styles={{ root: { fontWeight: '600', color: colours.highlight, marginBottom: '5px' } }}>
            Deal Details:
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

        <Separator />

        {/* Subject */}
        <Stack tokens={{ childrenGap: 6 }}>
          <Text variant="large" styles={{ root: { fontWeight: '600', color: colours.highlight, marginBottom: '5px' } }}>
            Subject:
          </Text>
          <Text variant="medium" styles={{ root: { whiteSpace: 'pre-wrap' } }}>
            {subject || 'N/A'}
          </Text>
        </Stack>

        <Separator />

        {/* Body */}
        <Stack tokens={{ childrenGap: 6 }}>
          <Text variant="large" styles={{ root: { fontWeight: '600', color: colours.highlight, marginBottom: '5px' } }}>
            Body:
          </Text>
          <div
            ref={previewRef}
            style={{ whiteSpace: 'pre-wrap', maxHeight: 350, overflowY: 'auto' }}
            dangerouslySetInnerHTML={{ __html: highlightPlaceholders(cleanBody) }}
          />
        </Stack>

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
            disabled={isDraftConfirmed}
            iconProps={isDraftConfirmed ? { iconName: 'CheckMark' } : undefined}
          />
        </Stack>
        {canUseAi && (
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
            tempDiv.innerHTML = highlightPlaceholders(cleanBody);
            navigator.clipboard.writeText(tempDiv.innerText || tempDiv.textContent || '');
          }}
          iconProps={{ iconName: 'Copy' }}
          title="Copy the email preview text to your clipboard"
        />
      </Stack>
      {canUseAi && (
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