
import React, { useState, useRef, useEffect } from 'react';
import { TemplateBlock } from '../../../app/customisation/ProductionTemplateBlocks';
import { Stack, Text, Pivot, PivotItem, Icon, Callout, DirectionalHint } from '@fluentui/react';
import { placeholderSuggestions } from '../../../app/customisation/InsertSuggestions';
import { wrapInsertPlaceholders } from './emailUtils';
import SnippetEditPopover from './SnippetEditPopover';

interface EditorAndTemplateBlocksProps {
  isDarkMode: boolean;
  body: string;
  setBody: (body: string) => void;
  templateBlocks: TemplateBlock[];
  selectedTemplateOptions: { [key: string]: string | string[] };
  insertedBlocks: { [key: string]: boolean };
  lockedBlocks: { [key: string]: boolean };
  editedBlocks: { [key: string]: boolean };
  handleMultiSelectChange: (blockTitle: string, selectedOptions: string[]) => void;
  handleSingleSelectChange: (blockTitle: string, optionKey: string) => void;
  insertTemplateBlock: (block: TemplateBlock, optionLabel: string | string[], focus?: boolean) => void;
  renderPreview: (block: TemplateBlock) => React.ReactNode;
  applyFormat: (...args: any[]) => void;
  saveSelection: () => void;
  handleInput: (e: React.FormEvent<HTMLDivElement>) => void;
  handleBlur: (e: React.FocusEvent<HTMLDivElement>) => void;
  handleClearBlock: (block: TemplateBlock) => void;
  bodyEditorRef: React.RefObject<HTMLDivElement>;
  toolbarStyle?: any;
  bubblesContainerStyle?: any;
  saveCustomSnippet?: (blockTitle: string, label?: string, sortOrder?: number, isNew?: boolean) => Promise<void>;
}

const whiteButtonStyles = {
  root: {
    background: '#fff',
    color: '#0078d4',
    border: '1px solid #0078d4',
    borderRadius: 4,
    fontWeight: '500',
    minWidth: 80,
    marginLeft: 8
  },
  rootHovered: {
    background: '#f3f2f1',
    color: '#005a9e',
    border: '1px solid #005a9e'
  }
};

const EditorAndTemplateBlocks: React.FC<EditorAndTemplateBlocksProps> = ({
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
  saveCustomSnippet,
}) => {
  const [editedContent, setEditedContent] = useState<Record<string, Record<string, string>>>({});
  const [userLockedBlocks, setUserLockedBlocks] = useState<Record<string, boolean>>({});
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestionTarget, setSuggestionTarget] = useState<HTMLElement | null>(null);
  const [currentPlaceholder, setCurrentPlaceholder] = useState<string>('');
  const [currentBlockTitle, setCurrentBlockTitle] = useState<string>('');
  const [currentOptionLabel, setCurrentOptionLabel] = useState<string>('');
  const [snippetEditState, setSnippetEditState] = useState<{
    blockTitle: string;
    optionLabel: string;
    target: HTMLElement;
  } | null>(null);
  const editorRefs = useRef<Record<string, HTMLDivElement>>({});

  // Helper: get selected option for a block
  const getSelectedOption = (block: TemplateBlock): string => {
    const sel = selectedTemplateOptions[block.title];
    if (typeof sel === 'string') return sel;
    if (Array.isArray(sel) && sel.length > 0) return sel[0];
    return block.options[0]?.label || '';
  };

  // Auto-insert all template block content on component load for immediate preview
  useEffect(() => {
    templateBlocks.forEach(block => {
      const selectedOption = getSelectedOption(block);
      const selectedOpt = block.options.find(opt => opt.label === selectedOption);
      if (selectedOpt && selectedOption) {
        // Insert the default content immediately so preview shows all data
        insertTemplateBlock(block, selectedOption, false);
      }
    });
  }, [templateBlocks, selectedTemplateOptions, insertTemplateBlock]); // Include all relevant dependencies

  const handleTabChange = (block: TemplateBlock, optionKey: string) => {
    if (block.options.length > 1) {
      handleSingleSelectChange(block.title, optionKey);
      // Don't automatically insert - let user edit in the editor area first
    }
  };

  // Get content for an option (either edited or original)
  const getOptionContent = (blockTitle: string, optionLabel: string, originalContent: string): string => {
    const edited = editedContent[blockTitle]?.[optionLabel];
    return edited || wrapInsertPlaceholders(originalContent);
  };

  // Wrap [INSERT] placeholders with contentEditable styling
  const wrapInsertPlaceholders = (text: string): string => {
    return text.replace(
      /\[INSERT[^\]]*\]/gi,
      (match) => `<span class="insert-placeholder" contenteditable="true" data-placeholder="${match}" style="background-color: #f0f8ff; color: #0078d4; padding: 2px 4px; border-left: 1px dashed #0078d4; border-right: 1px dashed #0078d4; min-width: 20px; cursor: text; transition: all 0.2s ease; word-break: break-word; white-space: pre-wrap; box-sizing: border-box; position: relative; display: inline; outline: none;">${match}</span>`
    );
  };

  // Handle content editing
  const handleContentEdit = (blockTitle: string, optionLabel: string, content: string) => {
    setEditedContent(prev => ({
      ...prev,
      [blockTitle]: {
        ...prev[blockTitle],
        [optionLabel]: content
      }
    }));
    
    // Always auto-insert content to preview (regardless of lock state)
    // The lock only controls manual insertion, not the preview visibility
    const block = templateBlocks.find(b => b.title === blockTitle);
    if (block) {
      const modifiedBlock = {
        ...block,
        options: block.options.map(opt => 
          opt.label === optionLabel 
            ? { ...opt, previewText: content.replace(/<br\s*\/?>/gi, '\n') }
            : opt
        )
      };
      insertTemplateBlock(modifiedBlock, optionLabel, false); // Don't focus to avoid interrupting editing
    }
  };

  // Handle placeholder click to show suggestions
  const handlePlaceholderClick = (e: React.MouseEvent, blockTitle: string, optionLabel: string) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('insert-placeholder')) {
      const placeholder = target.getAttribute('data-placeholder') || '';
      setCurrentPlaceholder(placeholder);
      setCurrentBlockTitle(blockTitle);
      setCurrentOptionLabel(optionLabel);
      setSuggestionTarget(target);
      setShowSuggestions(true);
    }
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (suggestion: string) => {
    if (suggestionTarget && currentBlockTitle && currentOptionLabel) {
      // Replace the placeholder with the suggestion
      suggestionTarget.textContent = suggestion;
      suggestionTarget.style.backgroundColor = '#e8f5e8';
      suggestionTarget.style.borderColor = '#20b26c';
      
      // Update the content
      const editorKey = `${currentBlockTitle}-${currentOptionLabel}`;
      const editor = editorRefs.current[editorKey];
      if (editor) {
        const updatedContent = editor.innerHTML;
        handleContentEdit(currentBlockTitle, currentOptionLabel, updatedContent);
      }
    }
    setShowSuggestions(false);
  };

  // Handle adding a placeholder via + button
  const handleAddPlaceholder = (e: React.MouseEvent, blockTitle: string, optionLabel: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const editorKey = `${blockTitle}-${optionLabel}`;
    const editor = editorRefs.current[editorKey];
    if (!editor) return;

    // Insert a new [INSERT] placeholder at the cursor or at the end
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editor.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      const placeholderSpan = document.createElement('span');
      placeholderSpan.className = 'insert-placeholder';
      placeholderSpan.contentEditable = 'true';
      placeholderSpan.setAttribute('data-placeholder', '[INSERT]');
      placeholderSpan.style.cssText = 'background-color: #f0f8ff; color: #0078d4; padding: 2px 4px; border-left: 1px dashed #0078d4; border-right: 1px dashed #0078d4; min-width: 20px; cursor: text; transition: all 0.2s ease; word-break: break-word; white-space: pre-wrap; box-sizing: border-box; position: relative; display: inline; outline: none;';
      placeholderSpan.textContent = '[INSERT]';
      
      range.deleteContents();
      range.insertNode(placeholderSpan);
      range.setStartAfter(placeholderSpan);
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      // Insert at the end
      const placeholderHtml = `<span class="insert-placeholder" contenteditable="true" data-placeholder="[INSERT]" style="background-color: #f0f8ff; color: #0078d4; padding: 2px 4px; border-left: 1px dashed #0078d4; border-right: 1px dashed #0078d4; min-width: 20px; cursor: text; transition: all 0.2s ease; word-break: break-word; white-space: pre-wrap; box-sizing: border-box; position: relative; display: inline; outline: none;">[INSERT]</span>`;
      editor.innerHTML += ` ${placeholderHtml}`;
    }

    // Update the content
    const updatedContent = editor.innerHTML;
    handleContentEdit(blockTitle, optionLabel, updatedContent);
  };

  // Handle insert to main editor / lock toggle
  const handleLockToggle = (blockTitle: string, optionLabel: string) => {
    const editorKey = `${blockTitle}-${optionLabel}`;
    const isCurrentlyLocked = userLockedBlocks[editorKey];
    
    if (!isCurrentlyLocked) {
      // Lock the block and ensure content is inserted
      const editor = editorRefs.current[editorKey];
      if (editor) {
        const content = editor.innerHTML;
        const block = templateBlocks.find(b => b.title === blockTitle);
        if (block) {
          const modifiedBlock = {
            ...block,
            options: block.options.map(opt => 
              opt.label === optionLabel 
                ? { ...opt, previewText: content.replace(/<br\s*\/?>/gi, '\n') }
                : opt
            )
          };
          insertTemplateBlock(modifiedBlock, optionLabel, true);
        }
      }
    }
    
    // Toggle lock state
    setUserLockedBlocks(prev => ({
      ...prev,
      [editorKey]: !isCurrentlyLocked
    }));
  };

  // Remove the old functions we don't need anymore
  const handleInsertToMainEditor = (blockTitle: string, optionLabel: string) => {
    handleLockToggle(blockTitle, optionLabel);
  };

  const handleEditorClick = (blockTitle: string, optionLabel: string) => {
    // No longer used for committing
  };

  // Handle save snippet
  const handleSaveSnippet = (e: React.MouseEvent, blockTitle: string, optionLabel: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSnippetEditState({
      blockTitle,
      optionLabel,
      target: e.currentTarget as HTMLElement
    });
  };

  // Handle snippet save from popover
  const handleSnippetSave = async ({ label, sortOrder, isNew }: { label: string; sortOrder: number; isNew: boolean }) => {
    if (snippetEditState && saveCustomSnippet) {
      try {
        await saveCustomSnippet(snippetEditState.blockTitle, label, sortOrder, isNew);
        setSnippetEditState(null);
      } catch (error) {
        console.error('Failed to save snippet:', error);
      }
    }
  };

  return (
    <>
      <Stack tokens={{ childrenGap: 12 }}>
        {templateBlocks.map((block) => (
          <Stack key={block.title} tokens={{ childrenGap: 2 }} styles={{ root: { marginBottom: 12 } }}>
            <Text styles={{ root: { fontSize: 13, fontWeight: 500, color: 'rgba(30,30,30,0.55)', marginBottom: 6, letterSpacing: '0.1px' } }}>{block.title}</Text>
            {block.options.length > 1 ? (
              <div style={{ overflowX: 'auto', overflowY: 'hidden', WebkitOverflowScrolling: 'touch', marginBottom: 4 }}>
                <Pivot
                  selectedKey={getSelectedOption(block)}
                  onLinkClick={item => handleTabChange(block, item?.props.itemKey || '')}
                  styles={{
                    root: {
                      minWidth: 0,
                      width: 'max-content',
                      display: 'inline-flex',
                      alignItems: 'center',
                      paddingLeft: 0,
                      marginLeft: 0,
                    },
                    link: {
                      fontSize: 12,
                      color: 'rgba(30,30,30,0.45)',
                      fontWeight: 400,
                      padding: '2px 10px',
                      marginLeft: 0,
                      marginRight: 2,
                      borderRadius: 3,
                    },
                    linkIsSelected: {
                      color: '#0078d4',
                      background: 'rgba(0,120,212,0.07)',
                      fontWeight: 500,
                    },
                  }}
                >
                  {block.options.map((opt, idx) => (
                    <PivotItem
                      headerText={opt.label}
                      itemKey={opt.label}
                      key={opt.label}
                      // Remove left margin for the first tab to align with label
                      style={idx === 0 ? { marginLeft: 0 } : {}}
                    />
                  ))}
                </Pivot>
              </div>
            ) : null}
            {block.options
              .filter(opt => opt.label === getSelectedOption(block))
              .map(opt => (
                <div key={opt.label} style={{ marginTop: 4 }}>
                  {/* Editor-style interface */}
                  <div style={{
                    border: '1px solid #e1e5e9',
                    borderRadius: '4px',
                    backgroundColor: '#fff',
                    marginBottom: '8px'
                  }}>
                    {/* Toolbar */}
                    <div style={{
                      borderBottom: '1px solid #e1e5e9',
                      padding: '4px',
                      display: 'flex',
                      gap: '4px',
                      backgroundColor: '#f8f9fa',
                    }}>
                      <div
                        style={{
                          padding: '4px 8px',
                          backgroundColor: '#ffffff',
                          border: '1px solid #e1dfdd',
                          borderRadius: '2px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '12px',
                          color: '#0078d4',
                          transition: 'all 0.2s ease',
                        }}
                        onClick={(e) => handleAddPlaceholder(e, block.title, opt.label)}
                        onMouseEnter={(e) => {
                          const target = e.currentTarget as HTMLElement;
                          target.style.backgroundColor = '#e6f3ff';
                          target.style.borderColor = '#0078d4';
                        }}
                        onMouseLeave={(e) => {
                          const target = e.currentTarget as HTMLElement;
                          target.style.backgroundColor = '#ffffff';
                          target.style.borderColor = '#e1dfdd';
                        }}
                      >
                        <Icon iconName="Add" styles={{ root: { fontSize: '12px' } }} />
                        <span>Add Placeholder</span>
                      </div>
                      {(() => {
                        const editorKey = `${block.title}-${opt.label}`;
                        const isLocked = userLockedBlocks[editorKey];
                        return (
                          <div
                            style={{
                              padding: '4px 8px',
                              backgroundColor: isLocked ? '#e8f5e8' : '#ffffff',
                              border: `1px solid ${isLocked ? '#20b26c' : '#e1dfdd'}`,
                              borderRadius: '2px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '12px',
                              color: isLocked ? '#20b26c' : '#107c10',
                              transition: 'all 0.2s ease',
                            }}
                            onClick={() => handleLockToggle(block.title, opt.label)}
                            onMouseEnter={(e) => {
                              const target = e.currentTarget as HTMLElement;
                              if (isLocked) {
                                target.style.backgroundColor = '#d1edd1';
                                target.style.borderColor = '#107c10';
                              } else {
                                target.style.backgroundColor = '#f3f2f1';
                                target.style.borderColor = '#20b26c';
                              }
                            }}
                            onMouseLeave={(e) => {
                              const target = e.currentTarget as HTMLElement;
                              target.style.backgroundColor = isLocked ? '#e8f5e8' : '#ffffff';
                              target.style.borderColor = isLocked ? '#20b26c' : '#e1dfdd';
                            }}
                          >
                            <Icon iconName="Lock" styles={{ root: { fontSize: '12px' } }} />
                            <span>{isLocked ? "Locked" : "Lock"}</span>
                          </div>
                        );
                      })()}
                      {saveCustomSnippet && (
                        <div
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #e1dfdd',
                            borderRadius: '2px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            color: '#d83b01',
                            transition: 'all 0.2s ease',
                          }}
                          onClick={(e) => handleSaveSnippet(e, block.title, opt.label)}
                          onMouseEnter={(e) => {
                            const target = e.currentTarget as HTMLElement;
                            target.style.backgroundColor = '#fdf6f6';
                            target.style.borderColor = '#d83b01';
                          }}
                          onMouseLeave={(e) => {
                            const target = e.currentTarget as HTMLElement;
                            target.style.backgroundColor = '#ffffff';
                            target.style.borderColor = '#e1dfdd';
                          }}
                        >
                          <Icon iconName="Save" styles={{ root: { fontSize: '12px' } }} />
                          <span>Save Snippet</span>
                        </div>
                      )}
                    </div>

                    {/* Editable content area */}
                    <div
                      ref={(el) => {
                        if (el) editorRefs.current[`${block.title}-${opt.label}`] = el;
                      }}
                      contentEditable
                      suppressContentEditableWarning={true}
                      style={{
                        padding: '12px',
                        minHeight: '80px',
                        fontFamily: 'Raleway, sans-serif',
                        fontSize: '14px',
                        lineHeight: '1.3',
                        whiteSpace: 'pre-wrap',
                        cursor: userLockedBlocks[`${block.title}-${opt.label}`] ? 'default' : 'text',
                        outline: 'none',
                        backgroundColor: userLockedBlocks[`${block.title}-${opt.label}`] ? '#f8fffe' : '#ffffff',
                        border: userLockedBlocks[`${block.title}-${opt.label}`] ? '1px solid #e8f5e8' : 'none',
                        borderRadius: userLockedBlocks[`${block.title}-${opt.label}`] ? '3px' : '0',
                        margin: userLockedBlocks[`${block.title}-${opt.label}`] ? '4px' : '0',
                      }}
                      dangerouslySetInnerHTML={{
                        __html: getOptionContent(block.title, opt.label, opt.previewText.replace(/\n/g, '<br />')),
                      }}
                      onInput={(e) => {
                        const content = (e.target as HTMLElement).innerHTML;
                        handleContentEdit(block.title, opt.label, content);
                        // Auto-insert is now handled in handleContentEdit
                      }}
                      onClick={(e) => {
                        handlePlaceholderClick(e, block.title, opt.label);
                        // Auto-insert and lock toggle handled separately
                      }}
                      onFocus={(e) => {
                        // Add focus/blur handlers for placeholders
                        const setupPlaceholderHandlers = () => {
                          const placeholders = e.currentTarget.querySelectorAll('.insert-placeholder');
                          placeholders.forEach((ph) => {
                            const element = ph as HTMLElement;
                            element.addEventListener('focus', (focusEvent) => {
                              (focusEvent.target as HTMLElement).style.backgroundColor = '#e6f3ff';
                              (focusEvent.target as HTMLElement).style.borderStyle = 'solid';
                            });
                            element.addEventListener('blur', (blurEvent) => {
                              (blurEvent.target as HTMLElement).style.backgroundColor = '#f0f8ff';
                              (blurEvent.target as HTMLElement).style.borderStyle = 'dashed';
                            });
                            element.addEventListener('click', (clickEvent) => {
                              clickEvent.stopPropagation();
                              const placeholder = element.getAttribute('data-placeholder') || '';
                              setCurrentPlaceholder(placeholder);
                              setCurrentBlockTitle(block.title);
                              setCurrentOptionLabel(opt.label);
                              setSuggestionTarget(element);
                              setShowSuggestions(true);
                            });
                          });
                        };
                        setupPlaceholderHandlers();
                      }}
                    />
                  </div>

                  {/* Original preview for comparison */}
                  <details style={{ marginTop: '8px', fontSize: '12px', color: '#666' }}>
                    <summary style={{ cursor: 'pointer', userSelect: 'none' }}>Original Preview</summary>
                    <div style={{ marginTop: '4px', padding: '8px', backgroundColor: '#f8f9fa', borderRadius: '2px', fontSize: '13px' }}>
                      <div style={{ fontSize: '13px', lineHeight: '1.4' }}>
                        {opt.previewText.split('\n').map((line, index) => (
                          <div key={index} style={{ marginBottom: index < opt.previewText.split('\n').length - 1 ? '4px' : '0' }}>
                            {line}
                          </div>
                        ))}
                      </div>
                    </div>
                  </details>
                </div>
              ))}
          </Stack>
        ))}
      </Stack>

      {/* Suggestion callout */}
      {showSuggestions && suggestionTarget && (
        <Callout
          target={suggestionTarget}
          onDismiss={() => setShowSuggestions(false)}
          directionalHint={DirectionalHint.bottomCenter}
          isBeakVisible={true}
          styles={{
            root: {
              padding: '8px',
              borderRadius: '4px',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
              maxHeight: '200px',
              overflowY: 'auto',
              minWidth: '200px',
            },
          }}
        >
          <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#333' }}>
            Choose replacement for {currentPlaceholder}
          </div>
          {(placeholderSuggestions[currentPlaceholder] || ['the other party', 'the company', 'the relevant details']).map((suggestion, index) => (
            <div
              key={index}
              onClick={() => handleSuggestionSelect(suggestion)}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                borderRadius: '4px',
                fontSize: '13px',
                color: '#333',
                backgroundColor: 'transparent',
                border: '1px solid #e1e5e9',
                margin: '4px 0',
                transition: 'all 0.2s ease',
                lineHeight: '1.3',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = '#f8f9fa';
                (e.currentTarget as HTMLElement).style.borderColor = '#0078d4';
                (e.currentTarget as HTMLElement).style.color = '#0078d4';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent';
                (e.currentTarget as HTMLElement).style.borderColor = '#e1e5e9';
                (e.currentTarget as HTMLElement).style.color = '#333';
              }}
            >
              {suggestion}
            </div>
          ))}
        </Callout>
      )}

      {/* Snippet Edit Popover */}
      {snippetEditState && (
        <SnippetEditPopover
          target={snippetEditState.target}
          previewText={getOptionContent(
            snippetEditState.blockTitle, 
            snippetEditState.optionLabel, 
            templateBlocks
              .find(b => b.title === snippetEditState.blockTitle)
              ?.options.find(o => o.label === snippetEditState.optionLabel)
              ?.previewText || ''
          ).replace(/<[^>]*>/g, '')} // Strip HTML tags for preview
          onSave={handleSnippetSave}
          onDismiss={() => setSnippetEditState(null)}
        />
      )}
    </>
  );
};

export default EditorAndTemplateBlocks;

// CLEANUP: File should end here. All code below this line has been removed.
