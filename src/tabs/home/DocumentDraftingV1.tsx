import React, { useCallback, useMemo, useState } from 'react';
import {
  DefaultButton,
  Dropdown,
  IconButton,
  IDropdownOption,
  PrimaryButton,
  Stack,
  Text,
  TextField,
} from '@fluentui/react';
import { useNavigate } from 'react-router-dom';

import { useTheme } from '../../app/functionality/ThemeContext';
import { colours } from '../../app/styles/colours';

interface DocumentDraftingV1FormData{
  firstName: string;
  lastName: string;
  email: string;
  companyName: string;
  companyAddress: string;
  internalMatterReference: string;
  date: string;
  matterTitle: string;
  retainerDetails: Record<string, string>;
  timeToCompleteDetails: Record<string, string>;
}

type DocumentDraftingV1StandardField = Exclude<
  keyof DocumentDraftingV1FormData,
  'retainerDetails' | 'timeToCompleteDetails'
>;

const initialFormData: DocumentDraftingV1FormData = {
  firstName: '',
  lastName: '',
  email: '',
  companyName: '',
  companyAddress: '',
  internalMatterReference: '',
  date: '',
  matterTitle: '',
  retainerDetails: {},
  timeToCompleteDetails: {},
};

const FOCUS_OPTIONS: IDropdownOption[] = [
  { key: 'adjudicationAdviceDispute', text: 'Adjudication Advice & Dispute' },
  { key: 'shareholderRightsDisputeAdvice', text: 'Shareholder Rights and Dispute Advice' },
];


const RETAINER_OPTIONS: IDropdownOption[] = [
  { key: 'termination', text: 'Termination' },
  { key: 'allegedBreach', text: 'Alleged breach' },
  { key: 'application', text: 'Application' },
  { key: 'funding', text: 'Funding' },
  { key: 'rightsBreaches', text: 'Rights and Breaches' },
  { key: 'paymentStatus', text: 'Payment status and evidence' },
  { key: 'exposureSecurity', text: 'Exposure and security' },
  { key: 'strategyTimelines', text: 'Provisional strategy and timelines' },
];

const RETAINER_OPTION_LABELS = RETAINER_OPTIONS.reduce<Record<string, string>>((accumulator, option) => {
  accumulator[String(option.key)] = option.text;
  return accumulator;
}, {});

const TIME_TO_COMPLETE_OPTIONS: IDropdownOption[] = [
  { key: 'adjudications', text: 'Adjudications' },
  { key: 'enforcement', text: 'Enforcement' },
  { key: 'scope', text: 'Scope' },
];

const TIME_TO_COMPLETE_LABELS = TIME_TO_COMPLETE_OPTIONS.reduce<Record<string, string>>((accumulator, option) => {
  accumulator[String(option.key)] = option.text;
  return accumulator;
}, {});

const DocumentDraftingV1: React.FC = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [formData, setFormData] = useState<DocumentDraftingV1FormData>(initialFormData);
  const [selectedFocus, setSelectedFocus] = useState<string | undefined>(undefined);

  const isAdjudicationFocus = selectedFocus === 'adjudicationAdviceDispute';

  const sectionStyles = useMemo(
    () => ({
      root: {
        backgroundColor: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
        borderRadius: 12,
        padding: 24,
        boxShadow: isDarkMode
          ? '0 4px 14px rgba(0, 0, 0, 0.35)'
          : '0 4px 14px rgba(6, 23, 51, 0.12)',
      },
    }),
    [isDarkMode],
  );

  const handleFieldChange = useCallback(
    (field: DocumentDraftingV1StandardField) =>
      (_event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        setFormData((current) => ({
          ...current,
          [field]: newValue ?? '',
        }));
      },
    [],
  );

  const handleRetainerSectionSelect = useCallback(
    (_event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
      if (!option) {
        return;
      }

      const key = String(option.key);
      setFormData((current) => {
        if (key in current.retainerDetails) {
          return current;
        }

        return {
          ...current,
          retainerDetails: {
            ...current.retainerDetails,
            [key]: '',
          },
        };
      });
    },
    [],
  );

  const handleRetainerDetailChange = useCallback(
    (key: string) =>
      (_event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        setFormData((current) => ({
          ...current,
          retainerDetails: {
            ...current.retainerDetails,
            [key]: newValue ?? '',
          },
        }));
      },
    [],
  );

  const handleRetainerSectionRemove = useCallback((key: string) => {
    setFormData((current) => {
      if (!(key in current.retainerDetails)) {
        return current;
      }

      const { [key]: _removed, ...remainingDetails } = current.retainerDetails;

      return {
        ...current,
        retainerDetails: remainingDetails,
      };
    });
  }, []);

  const handleTimeToCompleteSelect = useCallback(
    (_event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
      if (!option) {
        return;
      }

      const key = String(option.key);
      setFormData((current) => {
        if (key in current.timeToCompleteDetails) {
          return current;
        }

        return {
          ...current,
          timeToCompleteDetails: {
            ...current.timeToCompleteDetails,
            [key]: '',
          },
        };
      });
    },
    [],
  );

  const handleTimeToCompleteDetailChange = useCallback(
    (key: string) =>
      (_event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
        setFormData((current) => ({
          ...current,
          timeToCompleteDetails: {
            ...current.timeToCompleteDetails,
            [key]: newValue ?? '',
          },
        }));
      },
    [],
  );

  const handleTimeToCompleteRemove = useCallback((key: string) => {
    setFormData((current) => {
      if (!(key in current.timeToCompleteDetails)) {
        return current;
      }

      const { [key]: _removed, ...remainingDetails } = current.timeToCompleteDetails;

      return {
        ...current,
        timeToCompleteDetails: remainingDetails,
      };
    });
  }, []);

  const retainerDropdownOptions = useMemo(
    () =>
      isAdjudicationFocus
        ? RETAINER_OPTIONS.map((option) => ({
            ...option,
            disabled: option.key in formData.retainerDetails,
          }))
        : [],
    [formData.retainerDetails, isAdjudicationFocus],
  );

  const timeToCompleteDropdownOptions = useMemo(
    () =>
      isAdjudicationFocus
        ? TIME_TO_COMPLETE_OPTIONS.map((option) => ({
            ...option,
            disabled: option.key in formData.timeToCompleteDetails,
          }))
        : [],
    [formData.timeToCompleteDetails, isAdjudicationFocus],
  );

  const retainerDetailContainerStyles = useMemo(
    () => ({
      root: {
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
        borderRadius: 8,
        padding: 12,
        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#ffffff',
      },
    }),
    [isDarkMode],
  );

  const handleSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      // Placeholder for future submission handling logic
      // eslint-disable-next-line no-console
      console.log('Document drafting v1 form submitted', formData);
    },
    [formData],
  );

  const handleReset = useCallback((event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormData({ ...initialFormData });
    setSelectedFocus(undefined);
  }, []);

  const handleFocusChange = useCallback(
    (_event: React.FormEvent<HTMLDivElement>, option?: IDropdownOption) => {
      const nextFocus = option ? String(option.key) : undefined;
      setSelectedFocus(nextFocus);

      if (nextFocus !== 'adjudicationAdviceDispute') {
        setFormData((current) => ({
          ...current,
          retainerDetails: {},
          timeToCompleteDetails: {},
        }));
      }
    },
    [],
  );

  return (
    <form onSubmit={handleSubmit} onReset={handleReset} style={{ display: 'contents' }}>
      <Stack tokens={{ childrenGap: 24 }}>
        <DefaultButton
          text="Back to Home"
          onClick={() => navigate('/')}
          styles={{
            root: {
              alignSelf: 'flex-start',
              backgroundColor: isDarkMode ? colours.dark.buttonBackground : colours.light.buttonBackground,
              color: isDarkMode ? colours.dark.buttonText : colours.light.buttonText,
              borderColor: 'transparent',
            },
            rootHovered: {
              backgroundColor: isDarkMode ? colours.dark.hoverBackground : colours.light.hoverBackground,
              color: isDarkMode ? colours.dark.buttonText : colours.light.buttonText,
            },
            rootPressed: {
              backgroundColor: isDarkMode ? colours.dark.hoverBackground : colours.light.hoverBackground,
              color: isDarkMode ? colours.dark.buttonText : colours.light.buttonText,
            },
          }}
        />

        <Stack styles={sectionStyles} tokens={{ childrenGap: 16 }}>
          <Text variant="xLarge">Temp Testing!</Text>
          <Text variant="large">Testing prompts prior to LLM integration.</Text>
          <Stack tokens={{ childrenGap: 8 }}>
            <Text variant="medium">1. Go to Harvey Draft assistant and insert the template 'Using the Data provided, draft a paragraph based on the included PROMPT. Purely for the sake of context, this paragraph is under the scope of 'Current position, next steps & scope of retainer'. PROMPT: DATA: Termination = Alleged breach = Application = Funding = Rights and breaches = Payment status and evidence = Exposure and security = Provisional strategy and timelines = '</Text>
            <Text variant="medium">2. Place the prompt for the form into the 'Prompt' section</Text>
            <Text variant="medium">3. Place the data from form into the 'Data' section.</Text>
            <Text variant="medium">4. Submitted content (in future will appear in 'outputs section')</Text>
            <Text variant="medium">5. (Extra) Example data in git repo README</Text>
          </Stack>
        </Stack>

        <Dropdown
          label="Select matter focus"
          placeholder="Choose an option"
          options={FOCUS_OPTIONS}
          selectedKey={selectedFocus}
          onChange={handleFocusChange}
        />

        <Stack styles={sectionStyles} tokens={{ childrenGap: 16 }}>
          <Text variant="xLarge">Introduction</Text>
          <Stack tokens={{ childrenGap: 16 }}>
            <Stack tokens={{ childrenGap: 12 }}>
              <Text variant="large">Client Details</Text>
              <Stack tokens={{ childrenGap: 12 }}>
                <TextField
                  label="First name"
                  value={formData.firstName}
                  onChange={handleFieldChange('firstName')}
                  required
                />
                <TextField
                  label="Last name"
                  value={formData.lastName}
                  onChange={handleFieldChange('lastName')}
                  required
                />
                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={handleFieldChange('email')}
                  required
                />
                <TextField
                  label="Company name"
                  value={formData.companyName}
                  onChange={handleFieldChange('companyName')}
                />
                <TextField
                  label="Company address"
                  value={formData.companyAddress}
                  onChange={handleFieldChange('companyAddress')}
                  multiline
                  autoAdjustHeight
                />
              </Stack>
            </Stack>

            <TextField
              label="Internal matter reference"
              value={formData.internalMatterReference}
              onChange={handleFieldChange('internalMatterReference')}
            />

            <Stack horizontal tokens={{ childrenGap: 12 }} wrap>
              <TextField
                label="Date"
                type="date"
                value={formData.date}
                onChange={handleFieldChange('date')}
                styles={{ root: { minWidth: 200 } }}
              />
              <TextField
                label="Matter title/subject"
                value={formData.matterTitle}
                onChange={handleFieldChange('matterTitle')}
                styles={{ root: { minWidth: 280 } }}
              />
            </Stack>

          </Stack>
        </Stack>

        <Stack styles={sectionStyles} tokens={{ childrenGap: 16 }}>
          <Text variant="xLarge">Current position, next steps &amp; scope of retainer</Text>
          <Dropdown
            placeholder={isAdjudicationFocus ? 'Select a section to add' : 'Unavailable for this focus'}
            label="Add a focus area"
            options={retainerDropdownOptions}
            onChange={handleRetainerSectionSelect}
            selectedKey={undefined}
            disabled={!isAdjudicationFocus}
          />
          <Stack tokens={{ childrenGap: 12 }}>
            {Object.entries(formData.retainerDetails).map(([key, value]) => (
              <Stack key={key} tokens={{ childrenGap: 8 }} styles={retainerDetailContainerStyles}>
                <Stack horizontal verticalAlign="center" horizontalAlign="space-between">
                  <Text variant="large">{RETAINER_OPTION_LABELS[key] ?? key}</Text>
                  <IconButton
                    iconProps={{ iconName: 'Delete' }}
                    ariaLabel={`Remove ${RETAINER_OPTION_LABELS[key] ?? key}`}
                    onClick={() => handleRetainerSectionRemove(key)}
                  />
                </Stack>
                <TextField
                  multiline
                  autoAdjustHeight
                  value={value}
                  onChange={handleRetainerDetailChange(key)}
                  placeholder={`Enter details for ${(RETAINER_OPTION_LABELS[key] ?? key).toLowerCase()}`}
                />
              </Stack>
            ))}
            {isAdjudicationFocus && Object.keys(formData.retainerDetails).length === 0 && (
              <Stack tokens={{ childrenGap: 8 }}>
                <Text variant="medium" styles={{ root: { fontStyle: 'italic' } }}>
                  Use the dropdown above to add the areas you want to cover.
                </Text>
                <Text variant="smallPlus">
                  [prompt: Write a single cohesive paragraph (110–190 words) in formal UK legal English, using clear, declarative sentences and chronological order where helpful. Avoid headings and bullet points. Refer to parties on first mention by full name with a defined term in bold in brackets (e.g., Helix Construct (HC)); thereafter, use the defined term. Use day–month–year dates if provided. Open with the most material current development(s) (e.g., missed payments, suspensions, retention withheld, cash burn, termination), then summarise the relevant applications/certificates/pay less notices, and any notices served. Identify immediate objectives, key risks (including insolvency risk if relevant), funding (if given), and a provisional strategy. Where validity is disputed, use cautious language (e.g., “denies,” “alleges,” “it is possible that”). Cite statutes or use technical terms (e.g., Section 112 HGCRA, “smash and grab”, “true value”) only if included in the data. Express currency as “£[amount]”. Do not use headings, lists, or content beyond the data.]
                </Text>
              </Stack>
            )}
            <Stack tokens={{ childrenGap: 8 }}>
              <Stack horizontal tokens={{ childrenGap: 12 }}>
                <PrimaryButton type="button" text="Submit" />
                <DefaultButton type="button" text="Reset" />
              </Stack>
              <TextField
                label="Output"
                multiline
                readOnly
                resizable={false}
                placeholder="Submitted details will appear here."
              />
            </Stack>
          </Stack>
        </Stack>

        <Stack styles={sectionStyles} tokens={{ childrenGap: 16 }}>
          <Text variant="xLarge">Time to complete your case</Text>
          <Dropdown
            placeholder={isAdjudicationFocus ? 'Select a section to add' : 'Unavailable for this focus'}
            label="Add a focus area"
            options={timeToCompleteDropdownOptions}
            onChange={handleTimeToCompleteSelect}
            selectedKey={undefined}
            disabled={!isAdjudicationFocus}
          />
          <Stack tokens={{ childrenGap: 12 }}>
            {Object.entries(formData.timeToCompleteDetails).map(([key, value]) => (
              <Stack key={key} tokens={{ childrenGap: 8 }} styles={retainerDetailContainerStyles}>
                <Stack horizontal verticalAlign="center" horizontalAlign="space-between">
                  <Text variant="large">{TIME_TO_COMPLETE_LABELS[key] ?? key}</Text>
                  <IconButton
                    iconProps={{ iconName: 'Delete' }}
                    ariaLabel={`Remove ${TIME_TO_COMPLETE_LABELS[key] ?? key}`}
                    onClick={() => handleTimeToCompleteRemove(key)}
                  />
                </Stack>
                <TextField
                  multiline
                  autoAdjustHeight
                  value={value}
                  onChange={handleTimeToCompleteDetailChange(key)}
                  placeholder={`Enter details for ${(TIME_TO_COMPLETE_LABELS[key] ?? key).toLowerCase()}`}
                />
              </Stack>
            ))}
            {isAdjudicationFocus && Object.keys(formData.timeToCompleteDetails).length === 0 && (
              <Stack tokens={{ childrenGap: 8 }}>
                <Text variant="medium" styles={{ root: { fontStyle: 'italic' } }}>
                  Use the dropdown above to add timelines for your matter.
                </Text>
                <Text variant="smallPlus">
                  [prompt: Give an expected timeframe for the immediate scope and any procedural steps (e.g., target completion date for initial review, adjudication duration range in months, and any additional time for enforcement if needed).  Add any dependency notes that could extend or shorten these timings]
                </Text>
              </Stack>
            )}
            <Stack tokens={{ childrenGap: 8 }}>
              <Stack horizontal tokens={{ childrenGap: 12 }}>
                <PrimaryButton type="button" text="Submit" />
                <DefaultButton type="button" text="Reset" />
              </Stack>
              <TextField
                label="Output"
                multiline
                readOnly
                resizable={false}
                placeholder="Submitted timelines will appear here."
              />
            </Stack>
          </Stack>
        </Stack>

        <Stack horizontal tokens={{ childrenGap: 12 }}>
          <PrimaryButton type="submit" text="Submit" />
          <DefaultButton type="reset" text="Reset" />
        </Stack>
      </Stack>
    </form>
  );
};

export default DocumentDraftingV1;