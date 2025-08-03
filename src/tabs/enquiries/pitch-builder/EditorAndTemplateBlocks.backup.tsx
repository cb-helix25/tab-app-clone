
import React, { useState, useRef, useEffect } from 'react';
import { TemplateBlock } from '../../../app/customisation/ProductionTemplateBlocks';
import { Stack, Text, Pivot, PivotItem, Icon, Callout, DirectionalHint } from '@fluentui/react';
import { colours } from '../../../app/styles/colours';
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
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});
  const [autoInsertedOnLoad, setAutoInsertedOnLoad] = useState<Record<string, boolean>>({});
  const [showActionPopup, setShowActionPopup] = useState<{[key: string]: boolean}>({});
  const [popupPosition, setPopupPosition] = useState<{[key: string]: {x: number, y: number}}>({});
  const editorRefs = useRef<Record<string, HTMLDivElement>>({});

  // Helper: get selected option for a block
  const getSelectedOption = (block: TemplateBlock): string => {
    const sel = selectedTemplateOptions[block.title];
    if (typeof sel === 'string') return sel;
    if (Array.isArray(sel) && sel.length > 0) return sel[0];
    return block.options[0]?.label || '';
  };

  // Auto-insert default content on component mount
  useEffect(() => {
    templateBlocks.forEach(block => {
      const selectedOption = getSelectedOption(block);
      if (!autoInsertedOnLoad[block.title] && 
          !insertedBlocks[block.title] && 
          !insertedBlocks[`${block.title}-${selectedOption}`]) {
        
        // Mark as auto-inserted
        setAutoInsertedOnLoad(prev => ({ ...prev, [block.title]: true }));
        
        // Auto-insert the selected option
        setTimeout(() => {
          insertTemplateBlock(block, selectedOption, false);
        }, 100);
      }
    });
  }, [templateBlocks]); // Only run when templateBlocks change

  const handleTabChange = (block: TemplateBlock, optionKey: string) => {
    if (block.options.length > 1) {
      handleSingleSelectChange(block.title, optionKey);
      // Don't automatically insert - let user edit in the editor area first
    }
  };

  // Get content for an option (either edited or original)
  const getOptionContent = (blockTitle: string, optionLabel: string, originalContent: string): string => {
    const edited = editedContent[blockTitle]?.[optionLabel];
    if (edited) {
      return edited; // Return the edited content as-is, don't re-wrap placeholders
    }
    return wrapInsertPlaceholders(originalContent);
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
    
    // Don't auto-insert on every keystroke - only save the content locally
    // This prevents cursor jumping issues
  };

  // Handle auto-insert when user finishes editing (on blur)
  const handleContentBlur = (blockTitle: string, optionLabel: string) => {
    const content = editedContent[blockTitle]?.[optionLabel];
    if (content) {
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
        insertTemplateBlock(modifiedBlock, optionLabel, false);
      }
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

  // Toggle original content visibility
  const toggleOriginalView = (blockTitle: string, optionLabel: string) => {
    const key = `${blockTitle}-${optionLabel}`;
    setShowOriginal(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
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
  const handleInsertToMainEditor = (blockTitle: string, optionLabel: string) => {
    const editorKey = `${blockTitle}-${optionLabel}`;
    const isCurrentlyLocked = userLockedBlocks[editorKey];
    
    // Always ensure content is inserted when clicking the lock button
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
        insertTemplateBlock(modifiedBlock, optionLabel, !isCurrentlyLocked); // Focus only when locking
      }
    }
    
    // Toggle lock state
    setUserLockedBlocks(prev => ({
      ...prev,
      [editorKey]: !isCurrentlyLocked
    }));
  };

  // New lock toggle function - just for protection, content always displays
  const handleLockToggle = (blockTitle: string, optionLabel: string) => {
    const editorKey = `${blockTitle}-${optionLabel}`;
    
    // Toggle lock state only
    setUserLockedBlocks(prev => ({
      ...prev,
      [editorKey]: !prev[editorKey]
    }));
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

  const handleEditorClick = (blockTitle: string, optionLabel: string, event: React.MouseEvent) => {
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const key = `${blockTitle}-${optionLabel}`;
    
    setPopupPosition(prev => ({
      ...prev,
      [key]: {
        x: rect.right - 200, // Position popup to the right
        y: rect.top - 40
      }
    }));
    
    setShowActionPopup(prev => ({
      ...prev,
      [key]: true
    }));
  };

  const closeActionPopup = (key: string) => {
    setShowActionPopup(prev => ({
      ...prev,
      [key]: false
    }));
  };

  return (
    <>
      <Stack tokens={{ childrenGap: 16 }} styles={{ root: { marginTop: 8 } }}>
        {templateBlocks.map((block) => (
          <Stack key={block.title} tokens={{ childrenGap: 6 }} styles={{ root: { marginBottom: 4 } }}>
            {block.options.length > 1 ? (
              <div style={{ 
                overflowX: 'auto', 
                overflowY: 'hidden', 
                WebkitOverflowScrolling: 'touch', 
                marginBottom: 4,
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Text styles={{
                  root: { 
                    fontSize: 12, 
                    fontWeight: 500, 
                    color: colours.highlight, 
                    letterSpacing: '0.05px',
                    whiteSpace: 'nowrap',
                    marginRight: '4px'
                  } 
                }}>
                  {block.title}:
                </Text>
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
                      fontSize: 11,
                      color: 'rgba(30,30,30,0.55)',
                      fontWeight: 400,
                      padding: '4px 8px',
                      marginLeft: 0,
                      marginRight: 3,
                      borderRadius: 3,
                    },
                    linkIsSelected: {
                      color: colours.highlight,
                      background: 'rgba(54,144,206,0.06)',
                      fontWeight: 500,
                    },
                  }}
                >
                  {block.options.map((opt, idx) => (
                    <PivotItem
                      headerText={opt.label}
                      itemKey={opt.label}
                      key={opt.label}
                      style={idx === 0 ? { marginLeft: 0 } : {}}
                    />
                  ))}
                </Pivot>
              </div>
            ) : (
              <Text styles={{
                root: { 
                  fontSize: 12, 
                  fontWeight: 500, 
                  color: colours.highlight, 
                  marginBottom: 4, 
                  letterSpacing: '0.05px' 
                } 
              }}>
                {block.title}:
              </Text>
            )}
            {block.options
              .filter(opt => opt.label === getSelectedOption(block))
              .map(opt => (
                <div key={opt.label} style={{ marginTop: 12 }}>
                  {/* Editor-style interface */}
                  <div 
                    style={{
                      border: '1px solid #e1e5e9',
                      borderRadius: '4px',
                      backgroundColor: '#fff',
                      marginBottom: '16px',
                      position: 'relative'
                    }}
                    onMouseEnter={(e) => {
                      const toolbar = e.currentTarget.querySelector('.editor-toolbar') as HTMLElement;
                      if (toolbar) toolbar.style.opacity = '1';
                    }}
                    onMouseLeave={(e) => {
                      const toolbar = e.currentTarget.querySelector('.editor-toolbar') as HTMLElement;
                      if (toolbar) toolbar.style.opacity = '0';
                    }}
                  >
                    {/* Toolbar - Hidden by default, shows on hover */}
                    <div 
                      className="editor-toolbar"
                      style={{
                      borderBottom: '1px solid #e1e5e9',
                      padding: '6px',
                      display: 'flex',
                      gap: '4px',
                      backgroundColor: '#fafafa',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      opacity: '0',
                      transition: 'opacity 0.2s ease',
                    }}>
                      {/* Left side buttons */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <div
                          style={{
                            padding: '4px 8px',
                            backgroundColor: '#ffffff',
                            border: '1px solid #e1dfdd',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '11px',
                            color: colours.highlight,
                            transition: 'all 0.2s ease',
                          }}
                          onClick={(e) => handleAddPlaceholder(e, block.title, opt.label)}
                          onMouseEnter={(e) => {
                            const target = e.currentTarget as HTMLElement;
                            target.style.backgroundColor = '#d6e8ff';
                            target.style.borderColor = colours.highlight;
                          }}
                          onMouseLeave={(e) => {
                            const target = e.currentTarget as HTMLElement;
                            target.style.backgroundColor = '#ffffff';
                            target.style.borderColor = '#e1dfdd';
                          }}
                        >
                          <Icon iconName="Add" styles={{ root: { fontSize: '11px' } }} />
                          <span>Add Placeholder</span>
                        </div>
                        {saveCustomSnippet && (
                          <div
                            style={{
                              padding: '4px 8px',
                              backgroundColor: '#ffffff',
                              border: '1px solid #e1dfdd',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
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
                            <Icon iconName="Save" styles={{ root: { fontSize: '13px' } }} />
                            <span>Save Snippet</span>
                          </div>
                        )}
                      </div>

                      {/* Right side - Show Original and Lock */}
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <div 
                          style={{
                            fontSize: '11px',
                            color: showOriginal[`${block.title}-${opt.label}`] ? colours.highlight : '#666',
                            padding: '4px 8px',
                            backgroundColor: showOriginal[`${block.title}-${opt.label}`] ? '#d6e8ff' : '#ffffff',
                            border: `1px solid ${showOriginal[`${block.title}-${opt.label}`] ? colours.highlight : '#e1dfdd'}`,
                            borderRadius: '4px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease'
                          }}
                          onClick={() => toggleOriginalView(block.title, opt.label)}
                          onMouseEnter={(e) => {
                            const target = e.currentTarget as HTMLElement;
                            if (!showOriginal[`${block.title}-${opt.label}`]) {
                              target.style.backgroundColor = '#d6e8ff';
                              target.style.borderColor = colours.highlight;
                              target.style.color = colours.highlight;
                            }
                          }}
                          onMouseLeave={(e) => {
                            const target = e.currentTarget as HTMLElement;
                            if (!showOriginal[`${block.title}-${opt.label}`]) {
                              target.style.backgroundColor = '#ffffff';
                              target.style.borderColor = '#e1dfdd';
                              target.style.color = '#666';
                            }
                          }}
                        >
                          <Icon iconName={showOriginal[`${block.title}-${opt.label}`] ? "Hide" : "Preview"} styles={{ root: { fontSize: '10px' } }} />
                          <span style={{ fontWeight: 500 }}>{showOriginal[`${block.title}-${opt.label}`] ? "Hide Original" : "Show Original"}</span>
                        </div>
                        {(() => {
                          const editorKey = `${block.title}-${opt.label}`;
                          const isLocked = userLockedBlocks[editorKey];
                          return (
                            <div
                              style={{
                                padding: '4px 8px',
                                backgroundColor: isLocked ? '#e8f5e8' : '#ffffff',
                                border: `1px solid ${isLocked ? '#107c10' : '#e1dfdd'}`,
                                borderRadius: '4px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                color: isLocked ? '#107c10' : '#666',
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
                                  target.style.borderColor = '#107c10';
                                }
                              }}
                              onMouseLeave={(e) => {
                                const target = e.currentTarget as HTMLElement;
                                target.style.backgroundColor = isLocked ? '#e8f5e8' : '#ffffff';
                                target.style.borderColor = isLocked ? '#107c10' : '#e1dfdd';
                              }}
                            >
                              <Icon iconName={isLocked ? "Lock" : "Unlock"} styles={{ root: { fontSize: '10px' } }} />
                              <span style={{ fontWeight: 500 }}>{isLocked ? "Locked" : "Lock"}</span>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Content area - main editor with optional original on the right */}
                    <div style={{ display: 'flex', minHeight: '50px' }}>
                      {/* Main editor - always visible */}
                      <div style={{ 
                        flex: showOriginal[`${block.title}-${opt.label}`] ? 1 : '1 1 100%',
                        display: 'flex',
                        flexDirection: 'column'
                      }}>
                        <div
                          ref={(el) => {
                            if (el) {
                              editorRefs.current[`${block.title}-${opt.label}`] = el;
                              // Always set innerHTML on initial load - content should display by default
                              const editorKey = `${block.title}-${opt.label}`;
                              if (el.innerHTML === '' || !editedContent[block.title]?.[opt.label]) {
                                el.innerHTML = getOptionContent(block.title, opt.label, opt.previewText.replace(/\n/g, '<br />'));
                              }
                            }
                          }}
                          contentEditable={!userLockedBlocks[`${block.title}-${opt.label}`]}
                          suppressContentEditableWarning={true}
                          style={{
                            flex: 1,
                            padding: '8px',
                            fontFamily: 'Raleway, sans-serif',
                            fontSize: '13px',
                            lineHeight: '1.3',
                            whiteSpace: 'pre-wrap',
                            cursor: userLockedBlocks[`${block.title}-${opt.label}`] ? 'default' : 'text',
                            outline: 'none',
                            backgroundColor: userLockedBlocks[`${block.title}-${opt.label}`] ? '#f8f9fa' : '#ffffff',
                            minHeight: '50px',
                            borderRight: showOriginal[`${block.title}-${opt.label}`] ? '1px solid #e1e5e9' : 'none',
                            opacity: userLockedBlocks[`${block.title}-${opt.label}`] ? 0.7 : 1
                          }}
                          onInput={(e) => {
                            if (!userLockedBlocks[`${block.title}-${opt.label}`]) {
                              const content = (e.target as HTMLElement).innerHTML;
                              handleContentEdit(block.title, opt.label, content);
                            }
                          }}
                          onBlur={() => {
                            if (!userLockedBlocks[`${block.title}-${opt.label}`]) {
                              handleContentBlur(block.title, opt.label);
                            }
                          }}
                          onClick={(e) => {
                            if (!userLockedBlocks[`${block.title}-${opt.label}`]) {
                              handlePlaceholderClick(e, block.title, opt.label);
                            }
                          }}
                          onFocus={(e) => {
                            if (!userLockedBlocks[`${block.title}-${opt.label}`]) {
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
                            }
                          }}
                        />
                      </div>

                      {/* Original content - only shown when toggled */}
                      {showOriginal[`${block.title}-${opt.label}`] && (
                        <div style={{
                          flex: 1,
                          display: 'flex',
                          flexDirection: 'column',
                          backgroundColor: '#fafbfc',
                          borderRadius: '0 3px 3px 0',
                          overflow: 'hidden'
                        }}>
                          {/* Header */}
                          <div style={{
                            padding: '12px 16px',
                            backgroundColor: 'linear-gradient(135deg, #f8f9fa 0%, #f1f3f4 100%)',
                            borderBottom: '1px solid #e8eaed',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.04)'
                          }}>
                            <div style={{
                              width: '6px',
                              height: '6px',
                              borderRadius: '50%',
                              backgroundColor: '#34a853'
                            }} />
                            <span style={{
                              fontSize: '12px',
                              fontWeight: 600,
                              color: '#5f6368',
                              letterSpacing: '0.5px',
                              textTransform: 'uppercase'
                            }}>
                              Template Original
                            </span>
                            <div style={{
                              marginLeft: 'auto',
                              padding: '2px 8px',
                              backgroundColor: '#e8f0fe',
                              borderRadius: '12px',
                              fontSize: '10px',
                              fontWeight: 500,
                              color: '#1a73e8'
                            }}>
                              Read-only
                            </div>
                          </div>

                          {/* Content */}
                          <div style={{
                            flex: 1,
                            padding: '16px',
                            fontFamily: 'Raleway, sans-serif',
                            fontSize: '14px',
                            lineHeight: '1.5',
                            whiteSpace: 'pre-wrap',
                            overflow: 'auto',
                            color: '#3c4043',
                            position: 'relative'
                          }}>
                            {/* Subtle background pattern */}
                            <div style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,0,0,0.02) 1px, transparent 0)`,
                              backgroundSize: '12px 12px',
                              pointerEvents: 'none'
                            }} />
                            
                            <div 
                              style={{
                                position: 'relative',
                                zIndex: 1
                              }}
                              dangerouslySetInnerHTML={{
                                __html: wrapInsertPlaceholders(opt.previewText.replace(/\n/g, '<br />'))
                                  .replace(
                                    /class="insert-placeholder"/g,
                                    'class="insert-placeholder-preview"'
                                  )
                                  .replace(
                                    /style="[^"]*"/g,
                                    'style="background: linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%); color: #ef6c00; padding: 4px 8px; border-radius: 6px; font-weight: 500; border: 1px solid #ffb74d; box-shadow: 0 1px 3px rgba(239,108,0,0.2); display: inline-block; margin: 0 2px; font-size: 13px; position: relative; transform: translateY(-1px);"'
                                  )
                              }}
                            />
                          </div>

                          {/* Footer info */}
                          <div style={{
                            padding: '8px 16px',
                            backgroundColor: '#f8f9fa',
                            borderTop: '1px solid #e8eaed',
                            fontSize: '11px',
                            color: '#5f6368',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px'
                          }}>
                            <Icon iconName="Info" styles={{ root: { fontSize: '10px', color: '#5f6368' } }} />
                            <span>This is the original template content for reference</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
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
          onSave={handleSnippetSave}
          onDismiss={() => setSnippetEditState(null)}
          originalText=""
          editedText=""
        />
      )}
    </>
  );
};

export default EditorAndTemplateBlocks;

// CLEANUP: File should end here. All code below this line has been removed.
