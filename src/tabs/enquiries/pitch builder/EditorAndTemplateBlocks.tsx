import React, { RefObject } from 'react';
import {
  Stack,
  Label,
  IconButton,
  Dropdown,
  IDropdownOption,
  Text,
  mergeStyles,
  Icon,
} from '@fluentui/react';
import { TemplateBlock, TemplateOption } from '../../../app/customisation/TemplateBlocks';
import { colours } from '../../../app/styles/colours';
import { sharedEditorStyle, sharedOptionsDropdownStyles } from '../../../app/styles/FilterStyles';

interface EditorAndTemplateBlocksProps {
  isDarkMode: boolean;
  body: string;
  setBody: React.Dispatch<React.SetStateAction<string>>;
  templateBlocks: TemplateBlock[];
  selectedTemplateOptions: { [key: string]: string | string[] };
  insertedBlocks: { [key: string]: boolean };
  handleMultiSelectChange: (blockTitle: string, selectedOptions: string[]) => void;
  handleSingleSelectChange: (blockTitle: string, selectedOption: string) => void;
  insertTemplateBlock: (block: TemplateBlock, selectedOption: string | string[]) => void;
  renderPreview: (block: TemplateBlock) => React.ReactNode;
  applyFormat: (command: string, value?: string) => void;
  saveSelection: () => void;
  handleBlur: () => void;
  handleClearBlock: (block: TemplateBlock) => void;
  highlightBlock: (blockTitle: string, highlight: boolean) => void;
  bodyEditorRef: RefObject<HTMLDivElement>;
  toolbarStyle: string;
  bubblesContainerStyle: string;
  bubbleStyle: string;
  filteredAttachments: { key: string; text: string }[];
}

const EditorAndTemplateBlocks: React.FC<EditorAndTemplateBlocksProps> = ({
  isDarkMode,
  body,
  setBody,
  templateBlocks,
  selectedTemplateOptions,
  insertedBlocks,
  handleMultiSelectChange,
  handleSingleSelectChange,
  insertTemplateBlock,
  renderPreview,
  applyFormat,
  saveSelection,
  handleBlur,
  handleClearBlock,
  highlightBlock,
  bodyEditorRef,
  toolbarStyle,
  bubblesContainerStyle,
  bubbleStyle,
  filteredAttachments,
}) => {
  const templatesContainerStyle = mergeStyles({
    flex: '1 1 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxHeight: '100%',
    overflowY: 'auto',
  });

  const templatesGridStyle = mergeStyles({
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxHeight: '100%',
  });

  const labelStyle = mergeStyles({
    fontWeight: '600',
    color: isDarkMode ? colours.dark.text : colours.light.text,
    paddingTop: '20px',
    paddingBottom: '5px',
  });

  const scrollToBlockWithHighlight = (blockTitle: string) => {
    const blockElement = document.getElementById(`template-block-${blockTitle.replace(/\s+/g, '-')}`);
    if (blockElement) {
      blockElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      blockElement.style.transition = 'background-color 0.5s';
      blockElement.style.backgroundColor = colours.highlightYellow;
      setTimeout(() => {
        blockElement.style.backgroundColor = isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground;
      }, 1000);
    }
  };

  const applyLetteredList = () => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !bodyEditorRef.current) return;

    const range = selection.getRangeAt(0);
    const selectedNode = range.commonAncestorContainer;

    // Check if selection is inside the editor
    if (!bodyEditorRef.current.contains(selectedNode)) return;

    saveSelection();

    // Check if we're already inside an ordered list with lower-alpha
    let parentList: Node | Element | null = selectedNode.nodeType === Node.ELEMENT_NODE 
      ? selectedNode 
      : selectedNode.parentElement;
    while (parentList && parentList !== bodyEditorRef.current) {
      if (
        parentList instanceof HTMLElement && 
        parentList.tagName === 'OL' && 
        parentList.style.listStyleType === 'lower-alpha'
      ) {
        // If inside a lettered list, unwrap it
        document.execCommand('insertUnorderedList', false, undefined); // Toggle off
        break;
      }
      parentList = (parentList as Element).parentElement;
    }

    if (!parentList || parentList === bodyEditorRef.current) {
      // Create a new ordered list with lower-alpha style
      const ol = document.createElement('ol');
      ol.style.listStyleType = 'lower-alpha';
      const li = document.createElement('li');
      ol.appendChild(li);

      if (range.collapsed) {
        // No selection: insert empty list item
        range.insertNode(ol);
        range.setStart(li, 0);
        range.collapse(true);
      } else {
        // Wrap selected content in the list
        const fragment = range.extractContents();
        li.appendChild(fragment);
        ol.appendChild(li);
        range.insertNode(ol);
      }

      selection.removeAllRanges();
      selection.addRange(range);
    }

    setBody(bodyEditorRef.current.innerHTML);
  };

  return (
    <Stack horizontal tokens={{ childrenGap: 20 }} style={{ width: '100%' }}>
      {/* Left Column: Editor + Attachments */}
      <Stack style={{ width: '50%' }} tokens={{ childrenGap: 20 }}>
        <Label className={labelStyle}>Email Body</Label>
        <Stack tokens={{ childrenGap: 20 }}>
          <Stack horizontal tokens={{ childrenGap: 20 }}>
            <Stack tokens={{ childrenGap: 6 }} grow>
              <div className={toolbarStyle}>
                <IconButton iconProps={{ iconName: 'Bold' }} ariaLabel="Bold" onClick={() => applyFormat('bold')} />
                <IconButton iconProps={{ iconName: 'Italic' }} ariaLabel="Italic" onClick={() => applyFormat('italic')} />
                <IconButton iconProps={{ iconName: 'Underline' }} ariaLabel="Underline" onClick={() => applyFormat('underline')} />
                <IconButton iconProps={{ iconName: 'BulletedList' }} ariaLabel="Bulleted List" onClick={() => applyFormat('insertUnorderedList')} />
                <IconButton iconProps={{ iconName: 'NumberedList' }} ariaLabel="Numbered List" onClick={() => applyFormat('insertOrderedList')} />
                <IconButton iconProps={{ iconName: 'SortLines' }} ariaLabel="Lettered List" onClick={applyLetteredList} />
                <IconButton
                  iconProps={{ iconName: 'Link' }}
                  ariaLabel="Insert Link"
                  onClick={() => {
                    const url = prompt('Enter the URL');
                    if (url) applyFormat('createLink', url);
                  }}
                />
              </div>
              <div
                contentEditable
                ref={bodyEditorRef}
                onBlur={handleBlur}
                suppressContentEditableWarning={true}
                className={sharedEditorStyle(isDarkMode)}
                style={{
                  flexGrow: 1,
                  overflowY: 'auto',
                  height: 'auto',
                  minHeight: '200px',
                  maxHeight: 'none',
                }}
                aria-label="Email Body Editor"
                onMouseUp={saveSelection}
                onKeyUp={saveSelection}
              />
            </Stack>
          </Stack>
          <Stack tokens={{ childrenGap: 6 }}>
            <Label className={labelStyle}>Attachments</Label>
            <div className={bubblesContainerStyle}>
              {filteredAttachments.map((att) => (
                <div
                  key={`attachment-${att.key}`}
                  className={bubbleStyle}
                  role="button"
                  tabIndex={0}
                  aria-label={`Attachment ${att.text} (Coming Soon)`}
                >
                  {att.text}
                </div>
              ))}
            </div>
          </Stack>
        </Stack>
      </Stack>

      {/* Right Column: Template Blocks */}
      <Stack style={{ width: '50%' }} tokens={{ childrenGap: 20 }}>
        <Label className={labelStyle}>Template Blocks</Label>
        <Stack className={templatesContainerStyle}>
          <div className={bubblesContainerStyle}>
            {templateBlocks.map((block: TemplateBlock) => (
              <div
                key={`bubble-${block.title}`}
                className={mergeStyles(bubbleStyle, {
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                })}
                role="button"
                tabIndex={0}
                onClick={() => scrollToBlockWithHighlight(block.title)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    scrollToBlockWithHighlight(block.title);
                  }
                }}
                aria-label={`Scroll to ${block.title} block`}
              >
                <Text>{block.title}</Text>
                {insertedBlocks[block.title] && (
                  <Icon
                    iconName="CheckMark"
                    styles={{
                      root: {
                        color: colours.green,
                        fontSize: '12px',
                      },
                    }}
                  />
                )}
              </div>
            ))}
          </div>
          <Stack className={templatesGridStyle}>
            {templateBlocks.map((block: TemplateBlock) => (
              <Stack
                key={block.title}
                id={`template-block-${block.title.replace(/\s+/g, '-')}`}
                className={mergeStyles({
                  padding: '15px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background-color 0.2s, box-shadow 0.2s',
                  backgroundColor: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
                  ':hover': {
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
                  },
                })}
                role="button"
                tabIndex={0}
                onClick={() => {
                  const selectedOption = selectedTemplateOptions[block.title];
                  if (selectedOption) {
                    insertTemplateBlock(block, selectedOption);
                  }
                }}
                aria-label={`Insert template block ${block.title}`}
              >
                <IconButton
                  iconProps={{ iconName: 'Cancel' }}
                  ariaLabel={`Clear ${block.title}`}
                  className={mergeStyles({
                    position: 'absolute',
                    top: '10px',
                    right: '10px',
                    backgroundColor: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    ':hover': {
                      backgroundColor: isDarkMode ? colours.dark.cardHover : colours.light.cardHover,
                    },
                    width: '24px',
                    height: '24px',
                    padding: '0',
                  })}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleClearBlock(block);
                  }}
                />
                <Stack tokens={{ childrenGap: 10 }}>
                  <Text variant="mediumPlus" styles={{ root: { fontWeight: '600', color: colours.highlight } }}>
                    {block.title}
                  </Text>
                  <Text variant="small" styles={{ root: { color: isDarkMode ? colours.dark.text : colours.light.text } }}>
                    {block.description}
                  </Text>
                  <Dropdown
                    placeholder={block.isMultiSelect ? 'Select options' : 'Select an option'}
                    multiSelect={block.isMultiSelect}
                    options={block.options.map((option: TemplateOption) => ({
                      key: option.label,
                      text: option.label,
                    }))}
                    onChange={(
                      _: React.FormEvent<HTMLDivElement>,
                      option?: IDropdownOption
                    ) => {
                      if (option) {
                        if (block.isMultiSelect) {
                          const currentSelections = Array.isArray(selectedTemplateOptions[block.title])
                            ? (selectedTemplateOptions[block.title] as string[])
                            : [];
                          const updatedSelections = option.selected
                            ? [...currentSelections, option.key as string]
                            : currentSelections.filter((key) => key !== option.key);
                          handleMultiSelectChange(block.title, updatedSelections);
                        } else {
                          handleSingleSelectChange(block.title, option.key as string);
                        }
                      }
                    }}
                    selectedKeys={
                      block.isMultiSelect
                        ? Array.isArray(selectedTemplateOptions[block.title])
                          ? (selectedTemplateOptions[block.title] as string[])
                          : []
                        : typeof selectedTemplateOptions[block.title] === 'string'
                        ? [selectedTemplateOptions[block.title] as string]
                        : []
                    }
                    styles={sharedOptionsDropdownStyles(isDarkMode)}
                    ariaLabel={`Select options for ${block.title}`}
                    onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                    onFocus={(e: React.FocusEvent<HTMLDivElement>) => e.stopPropagation()}
                  />
                  {renderPreview(block)}
                </Stack>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
  );
};

export default EditorAndTemplateBlocks;