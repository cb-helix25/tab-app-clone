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
  Text,
  mergeStyles,
} from '@fluentui/react';
import { colours } from '../../../app/styles/colours';
import {
  sharedPrimaryButtonStyles,
  sharedDefaultButtonStyles,
} from '../../../app/styles/ButtonStyles';
import { inputFieldStyle } from '../../../CustomForms/BespokeForms';

interface EditBlockModalProps {
  /** Whether the modal is visible */
  isOpen: boolean;
  /** Callback when the modal should be closed without saving */
  onDismiss: () => void;
  /** Title of the block being edited */
  blockTitle: string;
  /** Preview of the original template content */
  previewContent: React.ReactNode;
  /** Handler when the user saves their changes */
  onSubmit: (content: string, notes: string, referenceBlock?: string) => Promise<void> | void;
  /** Initial text for the block editor */
  initialContent?: string;
  /** Initial notes text */
  initialNotes?: string;
  /** Initially selected block reference */
  initialReference?: string;
  /** Blocks that can be referenced from this editor */
  referenceOptions: IDropdownOption[];
  /** Whether dark mode styles should be used */
  isDarkMode: boolean;
}

const EditBlockModal: React.FC<EditBlockModalProps> = ({
  isOpen,
  onDismiss,
  blockTitle,
  previewContent,
  onSubmit,
  initialContent = '',
  initialNotes = '',
  initialReference,
  referenceOptions,
  isDarkMode,
}) => {
  const [content, setContent] = useState<string>(initialContent);
  const [notes, setNotes] = useState<string>(initialNotes);
  const [reference, setReference] = useState<string | undefined>(initialReference);

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

  return (
    <Modal isOpen={isOpen} onDismiss={onDismiss} isBlocking={false}>
      <div className={containerClass}>
        <div className={headerClass}>
          {blockTitle}
          <IconButton iconProps={{ iconName: 'Cancel' }} onClick={onDismiss} />
        </div>
        <Stack tokens={{ childrenGap: 20 }} styles={{ root: { padding: 20 } }}>
          <Text variant="small">
            Edit the content below or provide notes referencing another block.
          </Text>
          <div>{previewContent}</div>
          <TextField
            label="Content"
            multiline
            autoAdjustHeight
            value={content}
            onChange={(_, v) => setContent(v || '')}
            styles={{ fieldGroup: inputFieldStyle }}
          />
          <Dropdown
            label="Reference Block (optional)"
            selectedKey={reference}
            options={referenceOptions}
            onChange={(_, option) => setReference(option?.key as string)}
          />
          <TextField
            label="Notes"
            multiline
            autoAdjustHeight
            value={notes}
            onChange={(_, v) => setNotes(v || '')}
            styles={{ fieldGroup: inputFieldStyle }}
          />
          <Stack horizontal horizontalAlign="end" tokens={{ childrenGap: 10 }}>
            <PrimaryButton
              text="Save"
              styles={sharedPrimaryButtonStyles}
              onClick={() => onSubmit(content, notes, reference)}
            />
            <DefaultButton
              text="Cancel"
              styles={sharedDefaultButtonStyles}
              onClick={onDismiss}
            />
          </Stack>
        </Stack>
      </div>
    </Modal>
  );
};

export default EditBlockModal;