import React, { useState, useRef, useEffect } from 'react';
import { Stack, Text, Icon, Pivot, PivotItem } from '@fluentui/react';
import { colours } from '../../../app/styles/colours';
import { TemplateBlock } from '../../../app/customisation/ProductionTemplateBlocks';
import SnippetEditPopover from './SnippetEditPopover';
import { placeholderSuggestions } from '../../../app/customisation/InsertSuggestions';
import { wrapInsertPlaceholders } from './emailUtils';

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
  const [snippetEditState, setSnippetEditState] = useState<{
    blockTitle: string;
    label: string;
    content: string;
    sortOrder: number;
    isNew: boolean;
  } | null>(null);
  const [showOriginal, setShowOriginal] = useState<Record<string, boolean>>({});
  const [autoInsertedOnLoad, setAutoInsertedOnLoad] = useState<Record<string, boolean>>({});
  const [showActionPopup, setShowActionPopup] = useState<{[key: string]: boolean}>({});
  const [popupPosition, setPopupPosition] = useState<{[key: string]: {x: number, y: number}}>({});
  const [editedContent, setEditedContent] = useState<Record<string, Record<string, string>>>({});
  const [collapsedBlocks, setCollapsedBlocks] = useState<Record<string, boolean>>({});
  const [removedBlocks, setRemovedBlocks] = useState<Record<string, boolean>>({});
  const editorRefs = useRef<Record<string, HTMLDivElement>>({});
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add missing handler functions
  const handleAddPlaceholder = (event: React.MouseEvent, blockTitle: string, optionLabel: string) => {
    event.stopPropagation();
    const editorKey = `${blockTitle}-${optionLabel}`;
    const editorEl = editorRefs.current[editorKey];
    
    if (editorEl) {
      // Get current selection/cursor position
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Create placeholder span
        const placeholderSpan = document.createElement('span');
        placeholderSpan.className = 'insert-placeholder';
        placeholderSpan.setAttribute('data-insert', '');
        placeholderSpan.setAttribute('tabindex', '0');
        placeholderSpan.setAttribute('role', 'button');
        placeholderSpan.style.cssText = 'background-color: #fff3cd; color: #856404; padding: 2px 4px; border-radius: 3px; font-weight: 500; cursor: pointer;';
        placeholderSpan.textContent = '[INSERT details]';
        
        // Insert the placeholder at cursor position
        range.deleteContents();
        range.insertNode(placeholderSpan);
        
        // Move cursor after the placeholder
        range.setStartAfter(placeholderSpan);
        range.setEndAfter(placeholderSpan);
        selection.removeAllRanges();
        selection.addRange(range);
        
        // Update the edited content
        handleContentEdit(blockTitle, optionLabel, editorEl.innerHTML);
      }
    }
    
    // Close the popup
    closeActionPopup(editorKey);
  };

  const handleLockToggle = (blockTitle: string, optionLabel: string) => {
    const key = `${blockTitle}-${optionLabel}`;
    setCollapsedBlocks(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleRemoveBlock = (block: TemplateBlock) => {
    // Mark block as removed so it's hidden from the UI
    setRemovedBlocks(prev => ({ ...prev, [block.title]: true }));
    
    // Also call the parent's clear handler to remove from main editor
    if (handleClearBlock) {
      handleClearBlock(block);
    }
  };

  const handleReinsertBlock = (block: TemplateBlock) => {
    // Remove from removed blocks to show it again
    setRemovedBlocks(prev => {
      const newState = { ...prev };
      delete newState[block.title];
      return newState;
    });
    
    const selectedOption = getSelectedOption(block);
    insertTemplateBlock(block, selectedOption, false);
  };

  // Helper: get selected option for a block
  const getSelectedOption = (block: TemplateBlock): string => {
    const sel = selectedTemplateOptions[block.title];
    if (typeof sel === 'string') return sel;
    if (Array.isArray(sel) && sel.length > 0) return sel[0];
    return block.options[0]?.label || '';
  };

  // Auto-insert default content on component mount
  useEffect(() => {
    templateBlocks
      .filter(block => !removedBlocks[block.title]) // Only process non-removed blocks
      .forEach(block => {
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
  }, [templateBlocks, selectedTemplateOptions, insertedBlocks, autoInsertedOnLoad, insertTemplateBlock, removedBlocks]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  // Add event listener for placeholder interaction
  useEffect(() => {
    const handlePlaceholderClick = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target.classList.contains('insert-placeholder')) {
        e.preventDefault();
        e.stopPropagation();
        
        // Simple placeholder editing - make it editable temporarily
        target.style.backgroundColor = '#fff3cd';
        target.style.border = '1px dashed #856404';
        target.contentEditable = 'true';
        target.focus();
        
        const handleBlur = () => {
          target.contentEditable = 'false';
          target.style.border = 'none';
          target.removeEventListener('blur', handleBlur);
          target.removeEventListener('keydown', handleEnter);
        };
        
        const handleEnter = (e: KeyboardEvent) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            target.blur();
          }
        };
        
        target.addEventListener('blur', handleBlur);
        target.addEventListener('keydown', handleEnter);
      }
    };

    document.addEventListener('click', handlePlaceholderClick);
    return () => {
      document.removeEventListener('click', handlePlaceholderClick);
    };
  }, []);

  const handleTabChange = (block: TemplateBlock, optionKey: string) => {
    handleSingleSelectChange(block.title, optionKey);
    // Content will be updated by the useEffect below
  };

  // Update content when selected option changes (but not when editing content)
  useEffect(() => {
    templateBlocks
      .filter(block => !removedBlocks[block.title]) // Only process non-removed blocks
      .forEach(block => {
      const selectedOption = getSelectedOption(block);
      const editorKey = `${block.title}-${selectedOption}`;
      const editorEl = editorRefs.current[editorKey];
      
      if (editorEl) {
        const selectedOpt = block.options.find(opt => opt.label === selectedOption);
        if (selectedOpt) {
          // Only update content if the editor is not currently focused (to avoid cursor jumping)
          if (document.activeElement !== editorEl) {
            const editedText = editedContent[block.title]?.[selectedOption];
            const contentToShow = editedText || wrapInsertPlaceholders(selectedOpt.previewText);
            
            // Only update if content is different to avoid cursor jumping
            if (editorEl.innerHTML !== contentToShow) {
              // Use a timeout to avoid React conflicts
              setTimeout(() => {
                if (editorEl && document.activeElement !== editorEl) {
                  editorEl.innerHTML = contentToShow;
                }
              }, 0);
            }
          }
        }
      }
    });
  }, [selectedTemplateOptions, removedBlocks]); // Added removedBlocks as dependency

  // Set initial content when editors are first created
  useEffect(() => {
    templateBlocks
      .filter(block => !removedBlocks[block.title]) // Only process non-removed blocks
      .forEach(block => {
      const selectedOption = getSelectedOption(block);
      const editorKey = `${block.title}-${selectedOption}`;
      const editorEl = editorRefs.current[editorKey];
      
      if (editorEl && (!editorEl.innerHTML || editorEl.innerHTML.trim() === '')) {
        const selectedOpt = block.options.find(opt => opt.label === selectedOption);
        if (selectedOpt) {
          const editedText = editedContent[block.title]?.[selectedOption];
          const contentToShow = editedText || wrapInsertPlaceholders(selectedOpt.previewText);
          // Use a timeout to avoid React conflicts
          setTimeout(() => {
            if (editorEl && (!editorEl.innerHTML || editorEl.innerHTML.trim() === '')) {
              editorEl.innerHTML = contentToShow;
            }
          }, 0);
        }
      }
    });
  }, [templateBlocks, removedBlocks]);

  // Get content with edited changes or original
  const getProcessedContent = (blockTitle: string, optionLabel: string, originalContent: string): string => {
    const editedText = editedContent[blockTitle]?.[optionLabel];
    if (editedText !== undefined) {
      return editedText;
    }
    return wrapInsertPlaceholders(originalContent);
  };

  // Wrap [INSERT] placeholders with contentEditable styling
  const wrapInsertPlaceholders = (text: string): string => {
    return text.replace(
      /\[INSERT[^\]]*\]/gi,
      (match) => `<span style="background-color: #fff3cd; color: #856404; padding: 2px 4px; border-radius: 3px; font-weight: 500;">${match}</span>`
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

    // Debounced sync to main body for preview (300ms delay to avoid excessive updates)
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    
    syncTimeoutRef.current = setTimeout(() => {
      const block = templateBlocks.find(b => b.title === blockTitle);
      if (block && insertedBlocks[blockTitle]) {
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
    }, 300);
  };

  // Handle auto-insert when user finishes editing (on blur)
  const handleContentBlur = (blockTitle: string, optionLabel: string) => {
    // Clear any pending sync timeout since we're syncing immediately on blur
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }

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

  const toggleOriginalView = (blockTitle: string, optionLabel: string) => {
    const key = `${blockTitle}-${optionLabel}`;
    
    // Update the showOriginal state first
    setShowOriginal(prev => {
      const newState = {
        ...prev,
        [key]: !prev[key]
      };
      
      // Handle content update after state change
      setTimeout(() => {
        const editorEl = editorRefs.current[key];
        if (editorEl) {
          const block = templateBlocks.find(b => b.title === blockTitle);
          const option = block?.options.find(opt => opt.label === optionLabel);
          
          if (block && option) {
            const isShowingOriginal = newState[key];
            
            if (isShowingOriginal) {
              // Store current content before showing original
              const currentContent = editorEl.innerHTML;
              setEditedContent(prev => ({
                ...prev,
                [blockTitle]: {
                  ...prev[blockTitle],
                  [optionLabel]: currentContent
                }
              }));
            } else {
              // When hiding original, restore edited content if it exists
              const editedText = editedContent[blockTitle]?.[optionLabel];
              if (editedText && editorEl) {
                editorEl.innerHTML = editedText;
              }
            }
          }
        }
      }, 0);
      
      return newState;
    });
  };

  const handleSaveSnippet = async (event: React.MouseEvent, blockTitle: string, optionLabel: string) => {
    event.stopPropagation();
    
    const block = templateBlocks.find(b => b.title === blockTitle);
    const option = block?.options.find(opt => opt.label === optionLabel);
    
    if (block && option) {
      const content = editedContent[blockTitle]?.[optionLabel] || option.previewText;
      const sortOrder = block.options.indexOf(option);
      
      setSnippetEditState({
        blockTitle,
        label: optionLabel,
        content: content.replace(/<br\s*\/?>/gi, '\n'),
        sortOrder,
        isNew: false
      });
    }
  };

  const handleSnippetSave = async (data: { label: string; sortOrder: number; isNew: boolean; }) => {
    if (snippetEditState && saveCustomSnippet) {
      try {
        await saveCustomSnippet(snippetEditState.blockTitle, data.label, data.sortOrder, data.isNew);
        setSnippetEditState(null);
      } catch (error) {
        console.error('Failed to save snippet:', error);
      }
    }
  };

  const handleEditorClick = (blockTitle: string, optionLabel: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const key = `${blockTitle}-${optionLabel}`;
    
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
      <style>
        {`
          @keyframes slideInFromRight {
            from {
              opacity: 0;
              transform: translateX(100%);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
        `}
      </style>
      <Stack tokens={{ childrenGap: 8 }} styles={{ root: { marginTop: 8 } }}>
        {/* Show removed blocks section if there are any */}
        {Object.keys(removedBlocks).length > 0 && (
          <div style={{
            border: '1px solid #f0f0f0',
            borderRadius: '6px',
            backgroundColor: '#f8f9fa',
            padding: '12px'
          }}>
            <Text styles={{ root: { fontSize: 11, fontWeight: 500, color: '#666', marginBottom: '8px' } }}>
              Removed Blocks (click to add back):
            </Text>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {templateBlocks
                .filter(block => removedBlocks[block.title])
                .map(block => (
                  <div
                    key={`removed-${block.title}`}
                    style={{
                      padding: '4px 8px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e1dfdd',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontSize: '11px',
                      color: colours.highlight,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      transition: 'all 0.2s ease'
                    }}
                    onClick={() => handleReinsertBlock(block)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#f0f8ff';
                      e.currentTarget.style.borderColor = colours.highlight;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.borderColor = '#e1dfdd';
                    }}
                    title={`Add back "${block.title}" block`}
                  >
                    <Icon iconName="Add" styles={{ root: { fontSize: '10px' } }} />
                    <span>{block.title}</span>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* Consolidated Email Editor */}
        <div style={{
          border: '1px solid #e1e5e9',
          borderRadius: '6px',
          backgroundColor: '#fff',
          position: 'relative'
        }}>
          {templateBlocks
            .filter(block => !removedBlocks[block.title]) // Filter out removed blocks
            .map((block, blockIndex) => {
            const selectedOption = getSelectedOption(block);
            const selectedOpt = block.options.find(opt => opt.label === selectedOption);
            
            if (!selectedOpt) return null;
            
            return (
              <div key={`${block.title}-${selectedOpt.label}-${blockIndex}`} style={{ 
                borderBottom: blockIndex < templateBlocks.length - 1 ? '1px solid #f0f0f0' : 'none',
                padding: '12px',
                position: 'relative'
              }}>
                {/* Block Title and Tabs */}
                {!collapsedBlocks[`${block.title}-${selectedOpt.label}`] && (
                  <div style={{ 
                    display: 'flex',
                    alignItems: 'center',
                    marginBottom: '12px',
                    gap: '8px'
                  }}>
                    <Text styles={{
                      root: { 
                        fontSize: 11, 
                        fontWeight: 500, 
                        letterSpacing: '0.05px',
                        whiteSpace: 'nowrap'
                      } 
                    }}>
                      {block.title}:
                    </Text>
                    
                    {block.options.length > 1 && (
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center', flex: 1 }}>
                        {block.options.map((option) => {
                          const isSelected = option.label === selectedOption;
                          return (
                            <div
                              key={option.label}
                              style={{
                                padding: '4px 8px',
                                cursor: 'pointer',
                                fontSize: '12px',
                                fontWeight: isSelected ? 600 : 400,
                                color: isSelected ? colours.highlight : 'rgba(30,30,30,0.45)',
                                borderBottom: isSelected ? `2px solid ${colours.highlight}` : '2px solid transparent',
                                position: 'relative'
                              }}
                              onClick={() => handleTabChange(block, option.label)}
                            >
                              {option.label}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Remove block button - thin cross */}
                    <div
                      style={{
                        marginLeft: 'auto',
                        cursor: 'pointer',
                        color: '#999',
                        fontSize: '16px',
                        fontWeight: 300,
                        lineHeight: 1,
                        padding: '2px',
                        borderRadius: '2px',
                        transition: 'color 0.2s ease'
                      }}
                      onClick={() => handleRemoveBlock(block)}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#d32f2f';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#999';
                      }}
                      title="Remove this block"
                    >
                      ×
                    </div>
                  </div>
                )}

                {/* Committed content display */}
                {collapsedBlocks[`${block.title}-${selectedOpt.label}`] && (
                  <div 
                    style={{
                      padding: '8px',
                      border: `2px solid ${colours.green}`,
                      borderRadius: '4px',
                      fontSize: '13px',
                      lineHeight: '1.4',
                      whiteSpace: 'pre-wrap',
                      backgroundColor: 'rgba(32, 178, 108, 0.05)',
                      minHeight: '40px',
                      position: 'relative',
                      opacity: 0.9,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleLockToggle(block.title, selectedOpt.label)}
                    title="Click to unlock"
                  >
                    {/* Committed content */}
                    <div dangerouslySetInnerHTML={{
                      __html: editedContent[block.title]?.[selectedOpt.label] || wrapInsertPlaceholders(selectedOpt.previewText)
                    }} />
                    
                    {/* Locked badge */}
                    <div style={{
                      position: 'absolute',
                      top: '4px',
                      right: '4px',
                      backgroundColor: colours.green,
                      color: 'white',
                      padding: '2px 6px',
                      borderRadius: '3px',
                      fontSize: '9px',
                      fontWeight: 600,
                      pointerEvents: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '3px'
                    }}>
                      <Icon iconName="Lock" styles={{ root: { fontSize: '8px' } }} />
                      LOCKED
                    </div>
                  </div>
                )}

                {/* Content Editor - 50/50 side by side when showing original */}
                {!collapsedBlocks[`${block.title}-${selectedOpt.label}`] && (
                  <div style={{ display: 'flex', gap: '12px' }}>
                    {/* Main editor - takes 50% when original is shown, full width when not */}
                    <div style={{ 
                      flex: showOriginal[`${block.title}-${selectedOpt.label}`] ? 1 : '1 1 100%',
                      transition: 'all 0.3s ease'
                    }}>
                      <div
                        ref={(el) => {
                          if (el) {
                            editorRefs.current[`${block.title}-${selectedOpt.label}`] = el;
                            // Set initial content immediately if empty
                            if (!el.innerHTML || el.innerHTML.trim() === '') {
                              const editedText = editedContent[block.title]?.[selectedOpt.label];
                              const contentToShow = editedText || wrapInsertPlaceholders(selectedOpt.previewText);
                              el.innerHTML = contentToShow;
                            }
                          }
                        }}
                        contentEditable={true}
                        suppressContentEditableWarning={true}
                        style={{
                          padding: '8px',
                          border: '1px solid #e8e8e8',
                          borderRadius: '4px',
                          fontSize: '13px',
                          lineHeight: '1.4',
                          whiteSpace: 'pre-wrap',
                          cursor: 'text',
                          outline: 'none',
                          backgroundColor: '#ffffff',
                          minHeight: '40px'
                        }}
                        onClick={(e) => handleEditorClick(block.title, selectedOpt.label, e)}
                        onInput={(e) => {
                          const content = (e.target as HTMLElement).innerHTML;
                          handleContentEdit(block.title, selectedOpt.label, content);
                        }}
                        onBlur={() => handleContentBlur(block.title, selectedOpt.label)}
                      />
                    </div>

                    {/* Original reference - slides in from right when shown */}
                    {showOriginal[`${block.title}-${selectedOpt.label}`] && (
                      <div style={{ 
                        flex: 1,
                        animation: 'slideInFromRight 0.3s ease-out'
                      }}>
                        <div
                          style={{
                            padding: '8px',
                            border: '1px solid #e8e8e8',
                            borderRadius: '4px',
                            fontSize: '13px',
                            lineHeight: '1.4',
                            whiteSpace: 'pre-wrap',
                            backgroundColor: '#f8f9fa',
                            minHeight: '40px',
                            color: '#666',
                            overflow: 'hidden'
                          }}
                        >
                          {wrapInsertPlaceholders(selectedOpt.previewText).replace(/<[^>]*>/g, '')}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Action Popup */}
                {showActionPopup[`${block.title}-${selectedOpt.label}`] && !collapsedBlocks[`${block.title}-${selectedOpt.label}`] && (
                  <>
                    {/* Backdrop to close popup */}
                    <div 
                      style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        zIndex: 998
                      }}
                      onClick={() => closeActionPopup(`${block.title}-${selectedOpt.label}`)}
                    />
                    
                    {/* Popup Actions */}
                    <div
                      style={{
                        position: 'absolute',
                        bottom: '-50px',
                        right: '8px',
                        zIndex: 999,
                        backgroundColor: '#ffffff',
                        border: '1px solid #e1dfdd',
                        borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                        padding: '8px',
                        display: 'flex',
                        gap: '6px',
                        alignItems: 'center'
                      }}
                    >
                      {/* Add Placeholder */}
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
                        }}
                        onClick={(e) => handleAddPlaceholder(e, block.title, selectedOpt.label)}
                      >
                        <Icon iconName="Add" styles={{ root: { fontSize: '10px' } }} />
                        <span>Add Placeholder</span>
                      </div>

                      {/* Show Original */}
                      <div 
                        style={{
                          fontSize: '11px',
                          color: showOriginal[`${block.title}-${selectedOpt.label}`] ? colours.highlight : '#666',
                          padding: '4px 8px',
                          backgroundColor: showOriginal[`${block.title}-${selectedOpt.label}`] ? '#d6e8ff' : '#ffffff',
                          border: `1px solid ${showOriginal[`${block.title}-${selectedOpt.label}`] ? colours.highlight : '#e1dfdd'}`,
                          borderRadius: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                          cursor: 'pointer',
                        }}
                        onClick={() => toggleOriginalView(block.title, selectedOpt.label)}
                      >
                        <Icon iconName={showOriginal[`${block.title}-${selectedOpt.label}`] ? "Hide" : "Preview"} styles={{ root: { fontSize: '10px' } }} />
                        <span>{showOriginal[`${block.title}-${selectedOpt.label}`] ? "Hide" : "Original"}</span>
                      </div>

                      {/* Lock/Unlock Toggle */}
                      {(() => {
                        const editorKey = `${block.title}-${selectedOpt.label}`;
                        const isLocked = collapsedBlocks[editorKey];
                        return (
                          <div
                            style={{
                              padding: '4px 8px',
                              backgroundColor: isLocked ? 'rgba(32, 178, 108, 0.1)' : '#ffffff',
                              border: `1px solid ${isLocked ? colours.green : '#e1dfdd'}`,
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              color: isLocked ? colours.green : '#666',
                              cursor: 'pointer',
                            }}
                            onClick={() => handleLockToggle(block.title, selectedOpt.label)}
                          >
                            <Icon iconName={isLocked ? "Lock" : "Unlock"} styles={{ root: { fontSize: '10px' } }} />
                            <span>{isLocked ? "Locked" : "Lock"}</span>
                          </div>
                        );
                      })()}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Stack>

      {/* TODO: Add snippet editor when needed */}
    </>
  );
};

export default EditorAndTemplateBlocks;
