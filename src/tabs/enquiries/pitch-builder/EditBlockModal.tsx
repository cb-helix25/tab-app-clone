import React, { useState } from 'react';
import {
  Modal,
  Stack,
  TextField,
  IconButton,
  DefaultButton,
  PrimaryButton,
  Dropdown,
  IDropdownOption,
  ChoiceGroup,
  IChoiceGroupOption,
  ComboBox,
  IComboBoxOption,
  IComboBox,
  Text,
  mergeStyles,
} from '@fluentui/react';
import { colours } from '../../../app/styles/colours';
import {
  sharedPrimaryButtonStyles,
  sharedDefaultButtonStyles,
} from '../../../app/styles/ButtonStyles';
import { inputFieldStyle, dropdownStyle } from '../../../CustomForms/BespokeForms';
import { TemplateBlock } from '../../../app/customisation/TemplateBlockSets';

interface ReferenceBlockPayload {
  title: string;
  option?: string;
  notes?: string;
}

export interface EditRequestPayload {
  block: string;
  level: 'block' | 'option';
  option?: string;
  proposedContent: string;
  notes: string;
  referenceBlock?: ReferenceBlockPayload;
}

interface EditBlockModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback when the modal should be closed without saving */
  onDismiss: () => void;
  /** Title of the block being edited */
  blockTitle: string;
  /** Preview of the original template content */
  previewContent: React.ReactNode;
  /** Original block details including options and placeholder */
  block: TemplateBlock;
  /** Handler when the user saves their changes */
  onSubmit: (payload: EditRequestPayload) => Promise<void> | void;
  /** Initial text for the block editor */
  initialContent?: string;
  /** Initial notes text */
  initialNotes?: string;
  /** Initially selected block reference */
  initialReference?: string;
  /** Initially selected option on reference block */
  initialReferenceOption?: string;
  /** Initial notes about referencing */
  initialReferenceNotes?: string;
  /** Blocks that can be referenced from this editor */
  referenceOptions: { key: string; text: string }[];
  /** Map of block titles to their option labels */
  blockOptionsMap: { [blockTitle: string]: string[] };
  /** Whether dark mode styles should be used */
  isDarkMode: boolean;
}

const EditBlockModal: React.FC<EditBlockModalProps> = ({
  isOpen,
  onDismiss,
  blockTitle,
  previewContent,
  block,
  onSubmit,
  initialContent = '',
  initialNotes = '',
  initialReference,
  initialReferenceOption,
  initialReferenceNotes,
  referenceOptions,
  blockOptionsMap,
  isDarkMode,
}) => {
  const [content, setContent] = useState<string>(initialContent);
  const [notes, setNotes] = useState<string>(initialNotes);
  const [reference, setReference] = useState<string | undefined>(initialReference);
  const [referenceOption, setReferenceOption] = useState<string | undefined>(initialReferenceOption);
  const [referenceNotes, setReferenceNotes] = useState<string>(initialReferenceNotes || '');
  const [level, setLevel] = useState<'block' | 'option'>('block');
  const [optionToEdit, setOptionToEdit] = useState<string | undefined>(block.options[0]?.label);
  const [step, setStep] = useState<'edit' | 'confirm'>('edit');

  const containerClass = mergeStyles({
    padding: 0,
    borderRadius: 8,
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
    backgroundColor: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
    transition: 'box-shadow 0.2s',
    selectors: {
      ':hover': {
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      },
    },
    fontFamily: 'Raleway, sans-serif',
  });

  const headerClass = mergeStyles({
    padding: '12px 20px',
    borderBottom: `1px solid ${isDarkMode ? colours.dark.border : colours.light.border}`,
    backgroundColor: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    color: colours.highlight,
    fontWeight: 600,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  });

  const renderOriginal = (
    <Stack tokens={{ childrenGap: 8 }}>
      <Text variant="small">{block.description}</Text>
      <div>{previewContent}</div>
    </Stack>
  );

  const originalOptionText = optionToEdit
    ? block.options.find((o) => o.label === optionToEdit)?.previewText || ''
    : '';

  const renderConfirm = (
    <Stack tokens={{ childrenGap: 20 }} styles={{ root: { padding: 20 } }}>
      <Text variant="small">Please review your suggestion before submitting.</Text>
      <Text variant="small">Change level: {level}{level === 'option' ? ` (${optionToEdit})` : ''}</Text>
      <Stack horizontal tokens={{ childrenGap: 20 }}>
        <Stack style={{ width: '50%' }} tokens={{ childrenGap: 8 }}>
          <Text variant="mediumPlus">Current</Text>
          {level === 'option' ? (
            <div style={{ whiteSpace: 'pre-wrap' }}>{originalOptionText}</div>
          ) : (
            <div>{previewContent}</div>
          )}
        </Stack>
        <Stack style={{ width: '50%' }} tokens={{ childrenGap: 8 }}>
          <Text variant="mediumPlus">Proposed</Text>
          <div
            style={{ whiteSpace: 'pre-wrap' }}
            dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br />') }}
          />
        </Stack>
      </Stack>
      {notes && <Text variant="small">Notes: {notes}</Text>}
      {reference && (
        <Text variant="small">
          References {reference}
          {referenceOption ? `: ${referenceOption}` : ''}. {referenceNotes}
        </Text>
      )}
      <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 10 }}>
        <PrimaryButton
          text="Submit Suggestion"
          styles={sharedPrimaryButtonStyles}
          onClick={() =>
            onSubmit({
              block: blockTitle,
              level,
              option: level === 'option' ? optionToEdit : undefined,
              proposedContent: content,
              notes,
              referenceBlock: reference
                ? {
                  title: reference,
                  option: referenceOption,
                  notes: referenceNotes,
                }
                : undefined,
            })
          }
        />
        <DefaultButton text="Back" styles={sharedDefaultButtonStyles} onClick={() => setStep('edit')} />
      </Stack>
    </Stack>
  );

  const renderEdit = (
    <Stack tokens={{ childrenGap: 20 }} styles={{ root: { padding: 20 } }}>
      <Text variant="small">Update the content below or explain how this block should change.</Text>
      <ChoiceGroup
        label="Change scope"
        options={[
          { key: 'block', text: 'Block' },
          { key: 'option', text: 'Option' },
        ]}
        selectedKey={level}
        onChange={(
          _e?: React.FormEvent<HTMLElement | HTMLInputElement>,
          opt?: IChoiceGroupOption
        ) => {
          if (opt) setLevel(opt.key as 'block' | 'option');
        }}
      />
      {level === 'option' && (
        <Dropdown
          label="Option to change"
          selectedKey={optionToEdit}
          options={block.options.map((o) => ({ key: o.label, text: o.label }))}
          onChange={(
            _e: React.FormEvent<HTMLDivElement>,
            opt?: IDropdownOption
          ) => setOptionToEdit(opt?.key as string)}
          styles={{ dropdown: dropdownStyle }}
        />
      )}
      <Stack horizontal tokens={{ childrenGap: 20 }}>
        <Stack style={{ width: '50%' }} tokens={{ childrenGap: 12 }}>
          {renderOriginal}
        </Stack>
        <Stack style={{ width: '50%' }} tokens={{ childrenGap: 12 }}>
          <TextField
            label="Proposed content"
            multiline
            autoAdjustHeight
            value={content}
            onChange={(
              _e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
              v?: string
            ) => setContent(v || '')}
            styles={{ fieldGroup: inputFieldStyle }}
          />
          <Dropdown
            label="Reference another block (optional)"
            selectedKey={reference}
            options={referenceOptions}
            onChange={(
              _e: React.FormEvent<HTMLDivElement>,
              option?: IDropdownOption
            ) => {
              setReference(option?.key as string);
              setReferenceOption(undefined);
            }}
            styles={{ dropdown: dropdownStyle }}
          />
          {reference && (
            <ComboBox
              label="Reference option"
              selectedKey={referenceOption}
              allowFreeform
              options={(blockOptionsMap[reference] || []).map((o) => ({ key: o, text: o })) as IComboBoxOption[]}
              onChange={(
                _e: React.FormEvent<IComboBox>,
                option?: IComboBoxOption,
                _index?: number,
                value?: string
              ) =>
                setReferenceOption((option ? option.key : value) as string)
              }
              styles={{
                root: [dropdownStyle, { width: '100%' }],
                input: { height: '32px', lineHeight: '32px', padding: '0 5px', border: 'none' },
                callout: { minWidth: '100%' },
              }}
            />
          )}
          <TextField
            label="Notes"
            multiline
            autoAdjustHeight
            value={notes}
            onChange={(
              _e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
              v?: string
            ) => setNotes(v || '')}
            styles={{ fieldGroup: inputFieldStyle }}
          />
          {reference && (
            <TextField
              label="Notes about referencing the other block"
              multiline
              autoAdjustHeight
              value={referenceNotes}
              onChange={(
                _e: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>,
                v?: string
              ) => setReferenceNotes(v || '')}
              styles={{ fieldGroup: inputFieldStyle }}
            />
          )}
        </Stack>
      </Stack>
      <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 10 }}>
        <PrimaryButton text="Review" styles={sharedPrimaryButtonStyles} onClick={() => setStep('confirm')} />
        <DefaultButton text="Cancel" styles={sharedDefaultButtonStyles} onClick={onDismiss} />
      </Stack>
    </Stack>
  );

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} isBlocking={false}>
      <div className={containerClass}>
        <div className={headerClass}>
          {blockTitle}
          <IconButton iconProps={{ iconName: 'Cancel' }} onClick={onDismiss} />
        </div>
        {step === 'edit' ? renderEdit : renderConfirm}
      </div>
    </Modal>
  );
};

export default EditBlockModal;
