import React, { useState } from 'react';
import {
  Modal,
  Stack,
  TextField,
  IconButton,
  DefaultButton,
  PrimaryButton,
  Dropdown,
  ComboBox,
  IComboBoxOption,
  Text,
  mergeStyles,
} from '@fluentui/react';
import { colours } from '../../../app/styles/colours';
import {
  sharedPrimaryButtonStyles,
  sharedDefaultButtonStyles,
} from '../../../app/styles/ButtonStyles';
import { inputFieldStyle } from '../../../CustomForms/BespokeForms';
import { TemplateBlock } from '../../../app/customisation/TemplateBlockSets';

interface ReferenceBlockPayload {
  title: string;
  option?: string;
  notes?: string;
}

export interface EditRequestPayload {
  block: string;
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
      <Text variant="small">Placeholder: {block.placeholder}</Text>
      <Text variant="small">Options:</Text>
      <ul style={{ margin: 0, paddingLeft: 16 }}>
        {block.options.map((opt) => (
          <li key={opt.label} style={{ marginBottom: 4 }}>
            <Text variant="small">
              {opt.label}: {opt.previewText}
            </Text>
          </li>
        ))}
      </ul>
      <div>{previewContent}</div>
    </Stack>
  );

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} isBlocking={false}>
      <div className={containerClass}>
        <div className={headerClass}>
          {blockTitle}
          <IconButton iconProps={{ iconName: 'Cancel' }} onClick={onDismiss} />
        </div>
        <Stack tokens={{ childrenGap: 20 }} styles={{ root: { padding: 20 } }}>
          <Text variant="small">
            Update the content below or explain how this block should change.
          </Text>
          <Stack horizontal tokens={{ childrenGap: 20 }}>
            <Stack style={{ width: '50%' }} tokens={{ childrenGap: 12 }}>
              {renderOriginal}
            </Stack>
            <Stack style={{ width: '50%' }} tokens={{ childrenGap: 12 }}>
              <TextField
                label="Content"
                multiline
                autoAdjustHeight
                value={content}
                onChange={(_, v) => setContent(v || '')}
                styles={{ fieldGroup: inputFieldStyle }}
              />
              <Dropdown
                label="Reference another block (optional)"
                selectedKey={reference}
                options={referenceOptions}
                onChange={(_, option) => {
                  setReference(option?.key as string);
                  setReferenceOption(undefined);
                }}
              />
              {reference && (
                <ComboBox
                  label="Reference option"
                  selectedKey={referenceOption}
                  allowFreeform
                  options={(blockOptionsMap[reference] || []).map((o) => ({ key: o, text: o })) as IComboBoxOption[]}
                  onChange={(_, option, __, value) => setReferenceOption((option ? option.key : value) as string)}
                  styles={{ root: { width: '100%' }, input: { height: '32px' } }}
                />
              )}
              <TextField
                label="Notes"
                multiline
                autoAdjustHeight
                value={notes}
                onChange={(_, v) => setNotes(v || '')}
                styles={{ fieldGroup: inputFieldStyle }}
              />
              {reference && (
                <TextField
                  label="Notes about referencing the other block"
                  multiline
                  autoAdjustHeight
                  value={referenceNotes}
                  onChange={(_, v) => setReferenceNotes(v || '')}
                  styles={{ fieldGroup: inputFieldStyle }}
                />
              )}
            </Stack>
          </Stack>
          <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 10 }}>
            <PrimaryButton
              text="Save"
              styles={sharedPrimaryButtonStyles}
              onClick={() =>
                onSubmit({
                  block: blockTitle,
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
            <DefaultButton
              text="Cancel"
              styles={sharedDefaultButtonStyles}
              onClick={onDismiss}
            />
          </Stack>
          {reference && (
            <Text variant="small">
              This edit affects {blockTitle} and references {reference}
              {referenceOption ? `: ${referenceOption}` : ''}. Notes: {referenceNotes || 'None'}.
            </Text>
          )}
        </Stack>
      </div>
    </Modal>
  );
};

export default EditBlockModal;