import React, { RefObject } from 'react';
import {
  Stack,
  Label,
  IconButton,
  DefaultButton,
  Dropdown,
  IDropdownOption,
  Text,
  mergeStyles,
  Icon,
  TooltipHost,
  Separator,
  Callout,
} from '@fluentui/react';
import { TemplateBlock, TemplateOption } from '../../../app/customisation/TemplateBlocks';
import { colours } from '../../../app/styles/colours';
import { sharedEditorStyle, sharedOptionsDropdownStyles } from '../../../app/styles/FilterStyles';
import { leftoverPlaceholders } from './emailUtils';
import EditBlockModal from './EditBlockModal';

// Sticky toolbar CSS injection
if (typeof window !== 'undefined' && !document.getElementById('sticky-toolbar-style')) {
  const style = document.createElement('style');
  style.id = 'sticky-toolbar-style';
  style.innerHTML = `
    .sticky-toolbar {
      position: sticky;
      top: 0;
      z-index: 11;
      background: inherit;
      padding-bottom: 8px;
      transition: background 0.2s;
    }
  `;
  document.head.appendChild(style);
}

if (typeof window !== 'undefined' && !document.getElementById('fade-in-animation')) {
  const style = document.createElement('style');
  style.id = 'fade-in-animation';
  style.innerHTML = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

interface EditorAndTemplateBlocksProps {
  isDarkMode: boolean;
  body: string;
  setBody: React.Dispatch<React.SetStateAction<string>>;
  templateBlocks: TemplateBlock[];
  selectedTemplateOptions: { [key: string]: string | string[] };
  insertedBlocks: { [key: string]: boolean };
  lockedBlocks: { [key: string]: boolean };
  editedBlocks: { [key: string]: boolean };
  handleMultiSelectChange: (blockTitle: string, selectedOptions: string[]) => void;
  handleSingleSelectChange: (blockTitle: string, selectedOption: string) => void;
  insertTemplateBlock: (
    block: TemplateBlock,
    selectedOption: string | string[],
    shouldFocus?: boolean,
    append?: boolean
  ) => void;
  renderPreview: (block: TemplateBlock) => React.ReactNode;
  applyFormat: (command: string, value?: string) => void;
  saveSelection: () => void;
  handleInput: () => void;
  handleBlur: () => void;
  handleClearBlock: (block: TemplateBlock) => void;
  bodyEditorRef: RefObject<HTMLDivElement>;
  toolbarStyle: string;
  bubblesContainerStyle: string;
  bubbleStyle: string;
  filteredAttachments: { key: string; text: string }[];
  highlightBlock: (blockTitle: string, highlight: boolean, source?: 'editor' | 'template') => void;
}

const EditorAndTemplateBlocks: React.FC<EditorAndTemplateBlocksProps> = (props) => {
  const {
    isDarkMode,
    body,
    setBody,
    templateBlocks,
    selectedTemplateOptions,
    insertedBlocks,
    lockedBlocks,
    editedBlocks,
    handleMultiSelectChange,
    handleSingleSelectChange,
    insertTemplateBlock,
    renderPreview,
    applyFormat,
    saveSelection,
    handleInput,
    handleBlur,
    handleClearBlock,
    bodyEditorRef,
    toolbarStyle,
    bubblesContainerStyle,
    bubbleStyle,
    filteredAttachments,
    highlightBlock,
  } = props;

  const [isCheatSheetOpen, setIsCheatSheetOpen] = React.useState(false);
  const cheatSheetButtonRef = React.useRef<HTMLDivElement | null>(null);
  const containerStyle = mergeStyles({
    backgroundColor: isDarkMode ? colours.dark.grey : colours.light.grey,
    borderRadius: 12,
boxShadow: isDarkMode
  ? '0 4px 12px rgba(255, 255, 255, 0.1)'
  : '0 4px 12px rgba(0, 0, 0, 0.1)', // for light mode
    padding: 24,
    width: '100%',
    transition: 'background 0.3s, box-shadow 0.3s',
  });

  const placeholderInfo = React.useMemo(
    () => ({
      blocks: templateBlocks.map((block) => ({
        title: block.title,
        placeholder: block.placeholder,
        options: block.options.map((o) => o.label),
      })),
      additional: leftoverPlaceholders.filter(
        (ph) => !templateBlocks.some((tb) => tb.placeholder === ph)
      ),
    }),
    [templateBlocks]
  );

  const [collapsedBlocks, setCollapsedBlocks] = React.useState<{ [title: string]: boolean }>(
    () =>
      Object.fromEntries(
        templateBlocks.map((block) => [
          block.title,
          !(
            selectedTemplateOptions[block.title] &&
            ((Array.isArray(selectedTemplateOptions[block.title]) &&
              (selectedTemplateOptions[block.title] as string[]).length > 0) ||
              (typeof selectedTemplateOptions[block.title] === 'string' &&
                selectedTemplateOptions[block.title]))
          ),
        ])
      )
  );

const [blockToEdit, setBlockToEdit] = React.useState<TemplateBlock | null>(null);
  const [previewNode, setPreviewNode] = React.useState<React.ReactNode>(null);

  const openEditModal = (block: TemplateBlock) => {
    setPreviewNode(renderPreview(block));
    setBlockToEdit(block);
  };

  const requestChange = async (
    content: string,
    notes: string,
    referenceBlock?: string
  ) => {
    if (!blockToEdit) return;
    const payload = {
      block: blockToEdit.title.toLowerCase().replace(/\s+/g, ''),
      proposedContent: content,
      notes,
      referenceBlock,
    };
    try {
      await fetch(
        `${process.env.REACT_APP_PROXY_BASE_URL}/sendEmail?code=${process.env.REACT_APP_SEND_EMAIL_CODE}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email_contents: JSON.stringify(payload, null, 2),
            user_email: 'lz@helix-law.com',
          }),
        }
      );
    } catch (err) {
      console.error('Failed to send change request', err);
    } finally {
      setBlockToEdit(null);
    }
  };

  const toggleCollapse = (title: string) => {
    setCollapsedBlocks((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const collapseAll = () => {
    setCollapsedBlocks(
      Object.fromEntries(templateBlocks.map((b) => [b.title, true]))
    );
  };

  const expandAll = () => {
    setCollapsedBlocks(
      Object.fromEntries(templateBlocks.map((b) => [b.title, false]))
    );
  };

  React.useEffect(() => {
    setCollapsedBlocks(
      Object.fromEntries(
        templateBlocks.map((block) => [
          block.title,
          !(
            selectedTemplateOptions[block.title] &&
            ((Array.isArray(selectedTemplateOptions[block.title]) &&
              (selectedTemplateOptions[block.title] as string[]).length > 0) ||
              (typeof selectedTemplateOptions[block.title] === 'string' &&
                selectedTemplateOptions[block.title]))
          ),
        ])
      )
    );
  }, [templateBlocks]);

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
    fontWeight: 600,
    color: isDarkMode ? colours.dark.text : colours.light.text,
  });

  const toolbarButtonStyle = {
    root: {
      color: '#ffffff',
      width: 32,
      height: 32,
    },
    rootHovered: {
      backgroundColor: colours.blue,
      color: '#ffffff',
    },
    rootChecked: {
      backgroundColor: colours.blue,
      color: '#ffffff',
    },
    icon: { fontSize: 18 },
  };

  const [boldActive, setBoldActive] = React.useState(false);
  const [italicActive, setItalicActive] = React.useState(false);
  const [underlineActive, setUnderlineActive] = React.useState(false);

  function updateBoldActive() {
    setBoldActive(document.queryCommandState('bold'));
  }
  function updateItalicActive() {
    setItalicActive(document.queryCommandState('italic'));
  }
  function updateUnderlineActive() {
    setUnderlineActive(document.queryCommandState('underline'));
  }

  const applyLetteredList = () => {
    const selection = window.getSelection();
    if (!selection || !selection.rangeCount || !bodyEditorRef.current) return;

    const range = selection.getRangeAt(0);
    const selectedNode = range.commonAncestorContainer;

    if (!bodyEditorRef.current.contains(selectedNode)) return;

    saveSelection();

    let parentList: Node | Element | null =
      selectedNode.nodeType === Node.ELEMENT_NODE
        ? selectedNode
        : selectedNode.parentElement;

    while (parentList && parentList !== bodyEditorRef.current) {
      if (
        parentList instanceof HTMLElement &&
        parentList.tagName === 'OL' &&
        parentList.style.listStyleType === 'lower-alpha'
      ) {
        document.execCommand('insertUnorderedList', false, undefined);
        break;
      }
      parentList = (parentList as Element).parentElement;
    }

    if (!parentList || parentList === bodyEditorRef.current) {
      const ol = document.createElement('ol');
      ol.style.listStyleType = 'lower-alpha';
      const li = document.createElement('li');
      ol.appendChild(li);

      if (range.collapsed) {
        range.insertNode(ol);
        range.setStart(li, 0);
        range.collapse(true);
      } else {
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
    <>
      <EditBlockModal
        isOpen={!!blockToEdit}
        onDismiss={() => setBlockToEdit(null)}
        blockTitle={blockToEdit?.title || ''}
        previewContent={previewNode}
        onSubmit={requestChange}
        referenceOptions={templateBlocks.map((b) => ({ key: b.title, text: b.title }))}
        isDarkMode={isDarkMode}
      />
      <Stack horizontal tokens={{ childrenGap: 20 }} className={containerStyle}>
        <Stack style={{ width: '50%' }} tokens={{ childrenGap: 20 }}>
        <Stack
          horizontal
          verticalAlign="center"
          tokens={{ childrenGap: 6 }}
          styles={{ root: { paddingTop: '20px', paddingBottom: '5px' } }}
        >
          <Label className={labelStyle}>Email Body</Label>
          <div ref={cheatSheetButtonRef}>
            <IconButton
              iconProps={{ iconName: 'Info' }}
              title="Placeholder Cheat Sheet"
              ariaLabel="Placeholder Cheat Sheet"
              onClick={() => setIsCheatSheetOpen(!isCheatSheetOpen)}
            />
          </div>
        </Stack>
        {isCheatSheetOpen && (
          <Callout
            target={cheatSheetButtonRef.current}
            onDismiss={() => setIsCheatSheetOpen(false)}
            setInitialFocus
          >
            <div
              style={{
                maxHeight: 300,
                overflowY: 'auto',
                padding: 12,
                border: `1px dotted ${colours.greyText}`,
              }}
            >
              <Stack tokens={{ childrenGap: 12 }}>
                {placeholderInfo.blocks.map((info) => (
                  <Stack key={info.placeholder} tokens={{ childrenGap: 4 }}>
                    <Text>{info.placeholder}</Text>
                    <Text variant="small">{info.title}</Text>
                    {info.options.length > 0 && (
                      <ul style={{ margin: '0 0 0 16px' }}>
                        {info.options.map((opt) => (
                          <li key={opt} style={{ fontSize: '12px' }}>
                            {opt}
                          </li>
                        ))}
                      </ul>
                    )}
                  </Stack>
                ))}
                {placeholderInfo.additional.length > 0 && (
                  <Stack tokens={{ childrenGap: 4 }}>
                    <Separator />
                    <Text>Other Placeholders</Text>
                    {placeholderInfo.additional.map((ph) => (
                      <Text key={ph} variant="small">
                        {ph}
                      </Text>
                    ))}
                  </Stack>
                )}
              </Stack>
            </div>
          </Callout>
        )}

        <Stack tokens={{ childrenGap: 20 }}>
          <Stack horizontal tokens={{ childrenGap: 20 }}>
            <Stack tokens={{ childrenGap: 6 }} grow>
              <div className={toolbarStyle + ' sticky-toolbar'} style={{ backgroundColor: colours.darkBlue }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TooltipHost content="Bold (Ctrl+B)">
                    <IconButton
                      iconProps={{ iconName: 'Bold' }}
                      ariaLabel="Bold"
                      onClick={() => applyFormat('bold')}
                      checked={boldActive}
                      styles={toolbarButtonStyle}
                    />
                  </TooltipHost>
                  <TooltipHost content="Italic (Ctrl+I)">
                    <IconButton
                      iconProps={{ iconName: 'Italic' }}
                      ariaLabel="Italic"
                      onClick={() => applyFormat('italic')}
                      checked={italicActive}
                      styles={toolbarButtonStyle}
                    />
                  </TooltipHost>
                  <TooltipHost content="Underline (Ctrl+U)">
                    <IconButton
                      iconProps={{ iconName: 'Underline' }}
                      ariaLabel="Underline"
                      onClick={() => applyFormat('underline')}
                      checked={underlineActive}
                      styles={toolbarButtonStyle}
                    />
                  </TooltipHost>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '1px',
                      height: '24px',
                      background: '#ddd',
                      margin: '0 8px',
                    }}
                  />
                  <TooltipHost content="Bulleted List (Ctrl+Shift+8)">
                    <IconButton
                      iconProps={{ iconName: 'BulletedList' }}
                      ariaLabel="Bulleted List"
                      onClick={() => applyFormat('insertUnorderedList')}
                      styles={toolbarButtonStyle}
                    />
                  </TooltipHost>
                  <TooltipHost content="Numbered List (Ctrl+Shift+7)">
                    <IconButton
                      iconProps={{ iconName: 'NumberedList' }}
                      ariaLabel="Numbered List"
                      onClick={() => applyFormat('insertOrderedList')}
                      styles={toolbarButtonStyle}
                    />
                  </TooltipHost>
                  <TooltipHost content="A, B, C List">
                    <IconButton
                      iconProps={{ iconName: 'SortLines' }}
                      ariaLabel="Lettered List"
                      onClick={applyLetteredList}
                      styles={toolbarButtonStyle}
                    />
                  </TooltipHost>
                  <span
                    style={{
                      display: 'inline-block',
                      width: '1px',
                      height: '24px',
                      background: '#ddd',
                      margin: '0 8px',
                    }}
                  />
                  <TooltipHost content="Insert Link (Ctrl+K)">
                    <IconButton
                      iconProps={{ iconName: 'Link' }}
                      ariaLabel="Insert Link"
                      onClick={() => {
                        const url = prompt('Enter the URL');
                        if (url) applyFormat('createLink', url);
                      }}
                      styles={toolbarButtonStyle}
                    />
                  </TooltipHost>
                </div>
              </div>
              <div
                contentEditable
                ref={bodyEditorRef}
                onBlur={handleBlur}
                onInput={handleInput}
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
                onMouseUp={() => {
                  saveSelection();
                  updateBoldActive();
                  updateItalicActive();
                  updateUnderlineActive();
                }}
                onKeyUp={() => {
                  saveSelection();
                  updateBoldActive();
                  updateItalicActive();
                  updateUnderlineActive();
                }}
                onFocus={() => {
                  saveSelection();
                  updateBoldActive();
                  updateItalicActive();
                  updateUnderlineActive();
                }}
              />
            </Stack>
          </Stack>
          {/*
            Attachments are temporarily disabled. Preserve the code for future
            use but prevent rendering by wrapping it in a comment block.
          <Stack tokens={{ childrenGap: 6 }} styles={{ root: { paddingTop: '20px', paddingBottom: '5px' } }}>
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
          */}
          </Stack>
      </Stack>

      <Stack style={{ width: '50%' }} tokens={{ childrenGap: 20 }}>
        <Stack
          horizontal
          verticalAlign="center"
          tokens={{ childrenGap: 8 }}
          styles={{ root: { justifyContent: 'space-between', paddingTop: '20px', paddingBottom: '5px' } }}
        >
          <Label className={labelStyle}>Template Blocks</Label>
          <Stack
            horizontal
            verticalAlign="center"
            tokens={{ childrenGap: 8 }}
            styles={{ root: { paddingTop: '20px', paddingBottom: '5px' } }}
          >
            <span
              style={{ color: colours.highlight, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
              onClick={() => {
                const allCollapsed = Object.values(collapsedBlocks).every(c => c);
                allCollapsed ? expandAll() : collapseAll();
              }}
            >
              <Icon
                iconName={Object.values(collapsedBlocks).every(c => c) ? 'ChevronDown' : 'ChevronUp'}
                styles={{ root: { fontSize: 14, marginLeft: 4 } }}
              />
              {Object.values(collapsedBlocks).every(c => c) ? 'Expand All' : 'Collapse All'}
            </span>
          </Stack>
        </Stack>
        <Stack className={templatesContainerStyle}>
          <Stack className={templatesGridStyle}>
            {templateBlocks.map((block) => {
              const isCollapsed = collapsedBlocks[block.title];
              const isInserted = insertedBlocks[block.title] || false;
              const isEdited = editedBlocks[block.title] || false;
              return (
                <Stack
                  key={block.title}
                  id={`template-block-${block.title.replace(/\s+/g, '-')}`}
                  className={mergeStyles({
                    padding: '0',
                    borderRadius: '8px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                    marginBottom: '16px',
                    position: 'relative',
                    overflow: 'hidden',
                    backgroundColor: isDarkMode
                      ? colours.dark.cardBackground
                      : colours.light.cardBackground,
                    transition: 'background-color 0.2s, box-shadow 0.2s',
                  })}
                  role="button"
                  tabIndex={0}
                  onMouseEnter={() => highlightBlock(block.title, true, 'template')}
                  onMouseLeave={() => highlightBlock(block.title, false, 'template')}
                  onClick={() => {
                    const selectedOption = selectedTemplateOptions[block.title];
                    if (selectedOption) {
                      let append = false;
                      if (insertedBlocks[block.title] && editedBlocks[block.title]) {
                        const replace = window.confirm(
                          'This block has been edited. OK to replace with the selected template? Click Cancel to append.'
                        );
                        append = !replace;
                      }
                      insertTemplateBlock(block, selectedOption, true, append);
                    }
                  }}
                  aria-label={`Insert template block ${block.title}`}
                >
                  <Stack
                    id={`template-block-header-${block.title.replace(/\s+/g, '-')}`}
                    horizontal
                    verticalAlign="center"
                    tokens={{ childrenGap: 10 }}
                    styles={{
                      root: {
                        cursor: 'pointer',
                        padding: '12px 20px',
                        borderLeft: 'none',
                        backgroundColor: insertedBlocks[block.title]
                          ? lockedBlocks[block.title]
                            ? isDarkMode
                              ? 'rgba(16,124,16,0.1)'
                              : '#eafaea'
                            : editedBlocks[block.title]
                            ? colours.highlightBlue
                            : colours.highlightYellow
                          : 'transparent',
                        borderTopLeftRadius: 8,
                        borderTopRightRadius: 8,
                        borderBottomLeftRadius: isCollapsed ? 8 : 0,
                        borderBottomRightRadius: isCollapsed ? 8 : 0,
                      },
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleCollapse(block.title);
                    }}
                    aria-expanded={!isCollapsed}
                    aria-controls={`block-content-${block.title}`}
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation();
                        toggleCollapse(block.title);
                      }
                    }}
                  >
                    <Icon
                      iconName={isCollapsed ? 'ChevronRight' : 'ChevronDown'}
                      styles={{
                        root: { fontSize: 18, color: colours.highlight, marginRight: 6, marginLeft: 4 },
                      }}
                    />
                    <Text
                      variant="mediumPlus"
                      styles={{ root: { color: colours.highlight } }}
                    >
                      {block.title}
                    </Text>
                    {lockedBlocks[block.title] && (
                      <Icon
                        iconName="CheckMark"
                        styles={{ root: { color: colours.green, fontSize: 14, marginLeft: 6 } }}
                      />
                    )}
                    {!lockedBlocks[block.title] && editedBlocks[block.title] && (
                      <Icon
                        iconName="Edit"
                        styles={{
                          root: {
                            color: colours.highlight,
                            fontSize: 14,
                            marginLeft: 6,
                          },
                        }}
                      />
                    )}
                    <span style={{ flex: 1 }} />
                    <DefaultButton
                      text="✏ Edit"
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditModal(block);
                      }}
                      styles={{
                        root: {
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '0 4px',
                          height: 24,
                          fontSize: 12,
                          color: colours.greyText,
                        },
                        rootHovered: {
                          background: isDarkMode ? colours.dark.cardHover : colours.light.cardHover,
                        },
                      }}
                    />
                    <IconButton
                      iconProps={{ iconName: 'Cancel' }}
                      ariaLabel={`Clear ${block.title}`}
                      styles={{
                        root: {
                          background: 'transparent',
                          border: 'none',
                          cursor: 'pointer',
                          width: 24,
                          height: 24,
                          padding: 0,
                        },
                        rootHovered: {
                          background: isDarkMode ? colours.dark.cardHover : colours.light.cardHover,
                        },
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleClearBlock(block);
                      }}
                    />
                  </Stack>
                  {!isCollapsed && (
                    <Stack
                      tokens={{ childrenGap: 10 }}
                      id={`block-content-${block.title}`}
                      styles={{
                        root: {
                          padding: '0 16px 16px 16px',
                          borderTop: `1px solid ${
                            isDarkMode ? colours.dark.border : colours.light.border
                          }`,
                          animation: 'fadeIn .18s',
                          borderBottomLeftRadius: 8,
                          borderBottomRightRadius: 8,
                        },
                      }}
                    >
                      <Text
                        styles={{
                          root: {
                            color: isDarkMode ? colours.dark.text : colours.light.text,
                            paddingTop: 8,
                            fontSize: '13px',
                          },
                        }}
                      >
                        {block.description}
                      </Text>
                      <Dropdown
                        placeholder={block.isMultiSelect ? 'Select options' : 'Select an option'}
                        multiSelect={block.isMultiSelect}
                        options={block.options.map((option: TemplateOption) => ({
                          key: option.label,
                          text: option.label,
                        }))}
                        onChange={(_ev, option?: IDropdownOption) => {
                          if (option) {
                            if (block.isMultiSelect) {
                              const currentSelections = Array.isArray(
                                selectedTemplateOptions[block.title]
                              )
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
                       onRenderTitle={(opts, defaultRender) => {
                         if ((!opts || opts.length === 0) && isInserted) {
                           if (lockedBlocks[block.title]) {
                             return (
                               <span style={{ display: 'flex', alignItems: 'center' }}>
                                 <Icon
                                   iconName="CheckMark"
                                   styles={{ root: { color: colours.green, fontSize: 12, marginRight: 4 } }}
                                 />
                                 <span>Locked</span>
                               </span>
                             );
                           }
                           if (isEdited) {
                             return (
                               <span style={{ display: 'flex', alignItems: 'center' }}>
                                 <Icon
                                   iconName="Edit"
                                   styles={{ root: { color: colours.highlightBlue, fontSize: 12, marginRight: 4 } }}
                                 />
                                 <span>Customised</span>
                               </span>
                             );
                           }
                         }
                         return defaultRender ? defaultRender(opts) : null;
                       }}
                       styles={sharedOptionsDropdownStyles(isDarkMode)}
                       ariaLabel={`Select options for ${block.title}`}
                       onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}
                       onFocus={(e: React.FocusEvent<HTMLDivElement>) => e.stopPropagation()}
                      />
                      {renderPreview(block)}
                    </Stack>
                  )}
                </Stack>
              );
            })}
          </Stack>
        </Stack>
      </Stack>
    </Stack>
    </>
  );
};

export default EditorAndTemplateBlocks;
