import React, { useState, useRef, useEffect } from 'react';
import { Stack, Text, Icon, Pivot, PivotItem } from '@fluentui/react';
import { colours } from '../../../app/styles/colours';
import { TemplateBlock, TemplateOption } from '../../../app/customisation/ProductionTemplateBlocks';
import SnippetEditPopover from './SnippetEditPopover';
import { placeholderSuggestions } from '../../../app/customisation/InsertSuggestions';

interface EditorAndTemplateBlocksProps {
  templateBlocks: TemplateBlock[];
  selectedTemplateOptions: { [key: string]: string | string[] };
  handleSingleSelectChange: (blockTitle: string, selectedOption: string) => void;
  userLockedBlocks: { [key: string]: boolean };
  handleLockToggle: (blockTitle: string, optionLabel: string) => void;
  insertedBlocks: { [key: string]: boolean };
  handleAddPlaceholder: (event: React.MouseEvent, blockTitle: string, optionLabel: string) => void;
  showSnippetEditor: { [key: string]: boolean };
  setShowSnippetEditor: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>;
  saveCustomSnippet?: (blockTitle: string, label: string, sortOrder: number, isNew: boolean) => Promise<void>;
  insertTemplateBlock: (block: TemplateBlock, optionLabel: string | string[], focus?: boolean) => void;
}

const EditorAndTemplateBlocks: React.FC<EditorAndTemplateBlocksProps> = ({
  templateBlocks,
  selectedTemplateOptions,
  handleSingleSelectChange,
  userLockedBlocks,
  handleLockToggle,
  insertedBlocks,
  handleAddPlaceholder,
  showSnippetEditor,
  setShowSnippetEditor,
  saveCustomSnippet,
  insertTemplateBlock,
}) => {
  // Wrap [INSERT] placeholders with contentEditable styling
  const wrapInsertPlaceholders = (text: string): string => {
    return text.replace(
      /\[INSERT[^\]]*\]/gi,
      (match) => `<span style="background-color: #fff3cd; color: #856404; padding: 2px 4px; border-radius: 3px; font-weight: 500;">${match}</span>`
    );
  };

  const [snippetEditState, setSnippetEditState] = useState<{
    target: HTMLElement;
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
  }, [templateBlocks, selectedTemplateOptions, insertedBlocks, autoInsertedOnLoad, insertTemplateBlock]);

  const handleTabChange = (block: TemplateBlock, optionKey: string) => {
    handleSingleSelectChange(block.title, optionKey);
    // Don't automatically insert - let user edit in the editor area first
  };

  // Get content with edited changes or original
  const getProcessedContent = (blockTitle: string, optionLabel: string, originalContent: string): string => {
    const editedText = editedContent[blockTitle]?.[optionLabel];
    if (editedText !== undefined) {
      return editedText;
    }
    return wrapInsertPlaceholders(originalContent);
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
  };

  // Handle auto-insert when user finishes editing (on blur)
  const handleContentBlur = (blockTitle: string, optionLabel: string) => {
    const content = editedContent[blockTitle]?.[optionLabel];
    if (content) {
      const block = templateBlocks.find(b => b.title === blockTitle);
      if (block) {
        const modifiedBlock = {
          ...block,
          options: block.options.map((opt: TemplateOption) => 
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
    setShowOriginal(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleSaveSnippet = async (event: React.MouseEvent, blockTitle: string, optionLabel: string) => {
    event.stopPropagation();
    
    const block = templateBlocks.find((b: TemplateBlock) => b.title === blockTitle);
    const option = block?.options.find((opt: TemplateOption) => opt.label === optionLabel);
    
    if (block && option) {
      const content = editedContent[blockTitle]?.[optionLabel] || option.previewText;
      const sortOrder = block.options.indexOf(option as TemplateOption);
      
      setSnippetEditState({
        target: event.target as HTMLElement,
        blockTitle,
        label: optionLabel,
        content: content.replace(/<br\s*\/?>/gi, '\n'),
        sortOrder,
        isNew: false
      });
    }
  };

  const handleSnippetSave = async (data: { label: string; sortOrder: number; isNew: boolean }) => {
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
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    const key = `${blockTitle}-${optionLabel}`;
    
    setPopupPosition(prev => ({
      ...prev,
      [key]: {
        x: rect.right - 200,
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
      <Stack tokens={{ childrenGap: 8 }} styles={{ root: { marginTop: 8 } }}>
        {/* Consolidated Email Editor */}
        <div style={{
          border: '1px solid #e1e5e9',
          borderRadius: '6px',
          backgroundColor: '#fff',
          position: 'relative'
        }}>
          {templateBlocks.map((block, blockIndex) => {
            const selectedOption = getSelectedOption(block);
            const selectedOpt = block.options.find(opt => opt.label === selectedOption);
            
            if (!selectedOpt) return null;
            
            return (
              <div key={block.title} style={{ 
                borderBottom: blockIndex < templateBlocks.length - 1 ? '1px solid #f0f0f0' : 'none',
                padding: '12px'
              }}>
                {/* Subtle block header with tabs */}
                <div style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  marginBottom: '8px',
                  gap: '8px'
                }}>
                  <Text styles={{
                    root: { 
                      fontSize: 11, 
                      fontWeight: 500, 
                      color: colours.highlight, 
                      letterSpacing: '0.05px',
                      whiteSpace: 'nowrap'
                    } 
                  }}>
                    {block.title}:
                  </Text>
                  
                  {block.options.length > 1 && (
                    <Pivot
                      selectedKey={selectedOption}
                      onLinkClick={item => handleTabChange(block, item?.props.itemKey || '')}
                      styles={{
                        root: {
                          minWidth: 0,
                          width: 'max-content',
                          display: 'inline-flex',
                          alignItems: 'center'
                        },
                        link: {
                          fontSize: 10,
                          color: 'rgba(30,30,30,0.45)',
                          fontWeight: 400,
                          padding: '2px 6px',
                          marginLeft: 0,
                          marginRight: 2,
                          borderRadius: 2,
                        },
                        linkIsSelected: {
                          color: colours.highlight,
                          background: 'rgba(54,144,206,0.05)',
                          fontWeight: 500,
                        },
                      }}
                    >
                      {block.options.map((opt: TemplateOption) => (
                        <PivotItem
                          headerText={opt.label}
                          itemKey={opt.label}
                          key={opt.label}
                        />
                      ))}
                    </Pivot>
                  )}
                </div>

                {/* Content Editor */}
                <div
                  ref={(el) => {
                    if (el) {
                      editorRefs.current[`${block.title}-${selectedOpt.label}`] = el;
                    }
                  }}
                  contentEditable={!userLockedBlocks[`${block.title}-${selectedOpt.label}`]}
                  suppressContentEditableWarning={true}
                  dangerouslySetInnerHTML={{
                    __html: getProcessedContent(block.title, selectedOpt.label, selectedOpt.previewText)
                  }}
                  style={{
                    padding: '8px',
                    border: '1px solid #e8e8e8',
                    borderRadius: '4px',
                    fontSize: '13px',
                    lineHeight: '1.4',
                    whiteSpace: 'pre-wrap',
                    cursor: userLockedBlocks[`${block.title}-${selectedOpt.label}`] ? 'default' : 'text',
                    outline: 'none',
                    backgroundColor: userLockedBlocks[`${block.title}-${selectedOpt.label}`] ? '#f8f9fa' : '#ffffff',
                    minHeight: '40px',
                    opacity: userLockedBlocks[`${block.title}-${selectedOpt.label}`] ? 0.7 : 1
                  }}
                  onClick={(e) => handleEditorClick(block.title, selectedOpt.label, e)}
                  onInput={(e) => {
                    if (!userLockedBlocks[`${block.title}-${selectedOpt.label}`]) {
                      const content = (e.target as HTMLElement).innerHTML;
                      handleContentEdit(block.title, selectedOpt.label, content);
                    }
                  }}
                  onBlur={() => handleContentBlur(block.title, selectedOpt.label)}
                />

                {/* Action Popup */}
                {showActionPopup[`${block.title}-${selectedOpt.label}`] && (
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
                        position: 'fixed',
                        top: popupPosition[`${block.title}-${selectedOpt.label}`]?.y || 0,
                        left: popupPosition[`${block.title}-${selectedOpt.label}`]?.x || 0,
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

                      {/* Lock/Unlock */}
                      {(() => {
                        const editorKey = `${block.title}-${selectedOpt.label}`;
                        const isLocked = userLockedBlocks[editorKey];
                        return (
                          <div
                            style={{
                              padding: '4px 8px',
                              backgroundColor: isLocked ? '#e8f5e8' : '#ffffff',
                              border: `1px solid ${isLocked ? '#107c10' : '#e1dfdd'}`,
                              borderRadius: '4px',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '11px',
                              color: isLocked ? '#107c10' : '#666',
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

      {/* Snippet Editor Popup */}
      {snippetEditState && (
        <SnippetEditPopover
          target={snippetEditState.target}
          onSave={handleSnippetSave}
          onDismiss={() => setSnippetEditState(null)}
          previewText={snippetEditState.content}
        />
      )}
    </>
  );
};

export default EditorAndTemplateBlocks;
