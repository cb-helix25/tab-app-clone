import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Stack, Text, Icon, Pivot, PivotItem, TextField } from '@fluentui/react';
import { colours } from '../../../app/styles/colours';
import { TemplateBlock } from '../../../app/customisation/ProductionTemplateBlocks';
import SnippetEditPopover from './SnippetEditPopover';
import { placeholderSuggestions } from '../../../app/customisation/InsertSuggestions';
import { wrapInsertPlaceholders } from './emailUtils';




// Utility to render text with [PLACEHOLDER]s styled
function renderWithPlaceholders(text: string) {
  const regex = /\[([^\]]+)\]/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  let key = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <span
        key={key++}
        style={{
          color: '#888',
          background: '#f4f4f4',
          fontStyle: 'italic',
          borderRadius: 3,
          padding: '0 4px',
          border: '1px dashed #bbb',
          margin: '0 2px',
          opacity: 0.85
        }}
      >
        [{match[1]}]
      </span>
    );
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

// Escape HTML for safe injection
function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// Build HTML string with placeholder spans
function buildPlaceholderHTML(text: string) {
  const regex = /\[([^\]]+)\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let html = '';
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      html += escapeHtml(text.slice(lastIndex, match.index));
    }
    const inner = escapeHtml(match[1]);
    html += `<span style="color:#666;background:#f4f4f4;font-style:italic;border:1px dashed #bbb;border-radius:3px;padding:0 4px;margin:0 2px;opacity:.9;">[${inner}]</span>`;
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    html += escapeHtml(text.slice(lastIndex));
  }
  return html || '';
}

interface InlineEditableAreaProps {
  value: string;
  onChange: (v: string) => void;
  edited: boolean;
  minHeight?: number;
}

interface UndoRedoState {
  history: string[];
  currentIndex: number;
}

const InlineEditableArea: React.FC<InlineEditableAreaProps> = ({ value, onChange, edited, minHeight = 48 }) => {
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [showToolbar, setShowToolbar] = useState(false);
  const [undoRedoState, setUndoRedoState] = useState<UndoRedoState>({
    history: [value],
    currentIndex: 0
  });
  // Flag to distinguish internal programmatic updates from external prop changes
  const internalUpdateRef = useRef(false);
  const previousValueRef = useRef(value);
  const [highlightRanges, setHighlightRanges] = useState<{ start: number; end: number }[]>([]); // green edited ranges (currently at most 1 active)
  const replacingPlaceholderRef = useRef<{ start: number; end: number } | null>(null); // original placeholder bounds
  const activeReplacementRangeRef = useRef<{ start: number; end: number } | null>(null); // growing inserted content

  // Sync external value changes (e.g. selecting a different template) without destroying internal history mid-edit
  useEffect(() => {
    const last = undoRedoState.history[undoRedoState.currentIndex];
    if (value !== last && !internalUpdateRef.current) {
      // External change -> reset history seed
      setUndoRedoState({ history: [value], currentIndex: 0 });
    }
    // Clear flag after render cycle
    internalUpdateRef.current = false;
  }, [value]);

  // Auto resize
  useEffect(() => {
    const ta = taRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    }
  }, [value]);

  // Add to undo history (debounced)
  const timeoutRef = useRef<NodeJS.Timeout>();
  const addToHistory = (newValue: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      setUndoRedoState(prev => {
        const currentValue = prev.history[prev.currentIndex];
        if (currentValue === newValue) return prev;

        const newHistory = prev.history.slice(0, prev.currentIndex + 1);
        newHistory.push(newValue);
        
        // Limit history size
        if (newHistory.length > 50) {
          newHistory.shift();
          return {
            history: newHistory,
            currentIndex: newHistory.length - 1
          };
        }
        
        return {
          history: newHistory,
          currentIndex: newHistory.length - 1
        };
      });
    }, 300); // Reduced debounce for more responsive undo
  };

  // Undo function
  const handleUndo = () => {
    setUndoRedoState(prev => {
      if (prev.currentIndex > 0) {
        const newIndex = prev.currentIndex - 1;
        const newValue = prev.history[newIndex];
  internalUpdateRef.current = true;
        onChange(newValue);
        return {
          ...prev,
          currentIndex: newIndex
        };
      }
      return prev;
    });
  };

  // Redo function
  const handleRedo = () => {
    setUndoRedoState(prev => {
      if (prev.currentIndex < prev.history.length - 1) {
        const newIndex = prev.currentIndex + 1;
        const newValue = prev.history[newIndex];
  internalUpdateRef.current = true;
        onChange(newValue);
        return {
          ...prev,
          currentIndex: newIndex
        };
      }
      return prev;
    });
  };

  // Handle content changes with history tracking
  const handleContentChange = (newValue: string) => {
  internalUpdateRef.current = true;
    const oldValue = previousValueRef.current;
    const oldLen = oldValue.length;
    const newLen = newValue.length;
    const delta = newLen - oldLen;
    const ta = taRef.current;
    const caretPos = ta ? ta.selectionStart : newLen; // after change

    // If we're actively replacing a placeholder (selection existed), establish/expand active replacement range
    if (replacingPlaceholderRef.current) {
      const rep = replacingPlaceholderRef.current;
      // Determine inserted length = newLen - (oldLen - placeholderLength)
      const placeholderLength = rep.end - rep.start;
      const insertedLength = Math.max(0, newLen - (oldLen - placeholderLength));
      // Safety: if insertedLength seems to consume trailing content (negative or too large), fallback to simple diff
      if (insertedLength < 0 || rep.start + insertedLength > newLen) {
        replacingPlaceholderRef.current = null;
      } else {
      const newRange = { start: rep.start, end: rep.start + insertedLength };
      activeReplacementRangeRef.current = newRange;
      setHighlightRanges([newRange]);
      replacingPlaceholderRef.current = null; // consumed
      }
    } else if (activeReplacementRangeRef.current && delta !== 0) {
      const range = activeReplacementRangeRef.current;
      // If typing at the end of the active range, extend it
      if (caretPos >= range.end && caretPos <= range.end + 1 && delta > 0) {
        range.end += delta;
        setHighlightRanges([ { ...range } ]);
      } else if (caretPos < range.start || caretPos > range.end + 1) {
        // Cursor moved away: finalize (do nothing further, but keep highlight)
        activeReplacementRangeRef.current = null;
      }
    }

    // NOTE: We do not shift ranges manually; we rebuild only for active range operations above.

    onChange(newValue);
    addToHistory(newValue);
    previousValueRef.current = newValue;
  };

  // Select placeholder token at cursor to prep for replacement
  const selectPlaceholderAtCursor = () => {
    const ta = taRef.current;
    if (!ta) return;
    if (ta.selectionStart !== ta.selectionEnd) return; // already has selection
    
    const pos = ta.selectionStart;
    const regex = /\[[^\]]+\]/g;
    let match: RegExpExecArray | null;
    
    // Find placeholder that contains cursor position
    while ((match = regex.exec(value)) !== null) {
      const start = match.index;
      const end = start + match[0].length;
      
  // If cursor is inside placeholder but NOT sitting exactly at the end boundary
  // Using strict < end avoids accidental selection when clicking just after token
  if (pos >= start && pos < end) {
        // Select the entire placeholder
        ta.setSelectionRange(start, end);
        replacingPlaceholderRef.current = { start, end };
        activeReplacementRangeRef.current = null;
        break;
      }
    }
  };

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Ctrl+Z: Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      handleUndo();
      return;
    }

    // Ctrl+Y or Ctrl+Shift+Z: Redo
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      handleRedo();
      return;
    }

    // Ctrl+Backspace: Clear all content
    if ((e.ctrlKey || e.metaKey) && e.key === 'Backspace') {
      e.preventDefault();
      const newValue = '';
  internalUpdateRef.current = true;
  onChange(newValue);
      addToHistory(newValue);
      return;
    }
    
    // Alt+Backspace: Delete word backwards
    if (e.altKey && e.key === 'Backspace') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      if (start !== end) {
        // If there's a selection, just delete it
        const newValue = value.slice(0, start) + value.slice(end);
        handleContentChange(newValue);
        setTimeout(() => {
          if (textarea) {
            textarea.setSelectionRange(start, start);
          }
        }, 0);
        return;
      }
      
      // Find word boundary backwards
      let wordStart = start;
      while (wordStart > 0 && /\w/.test(value[wordStart - 1])) {
        wordStart--;
      }
      
      // If we didn't find a word character, delete whitespace backwards
      if (wordStart === start) {
        while (wordStart > 0 && /\s/.test(value[wordStart - 1])) {
          wordStart--;
        }
      }
      
      const newValue = value.slice(0, wordStart) + value.slice(start);
      handleContentChange(newValue);
      
      setTimeout(() => {
        if (textarea) {
          textarea.setSelectionRange(wordStart, wordStart);
        }
      }, 0);
      return;
    }
  };

  return (
    <div
      ref={wrapperRef}
      style={{
        position: 'relative',
        fontSize: 13,
        lineHeight: 1.4,
        border: 'none',
        background: 'transparent',
        borderRadius: 0,
        padding: 0,
        minHeight,
        overflow: 'hidden'
      }}
      onMouseEnter={() => setShowToolbar(true)}
      onMouseLeave={() => setShowToolbar(false)}
    >
      {/* Floating toolbar */}
      {showToolbar && (
        <div style={{
          position: 'absolute',
          top: -2,
          right: 4,
          zIndex: 10,
          display: 'flex',
          gap: 2,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '1px solid #e1e5e9',
          borderRadius: 4,
          padding: '2px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          opacity: 1,
          transition: 'opacity 0.2s ease'
        }}>
          <button
            onClick={handleUndo}
            disabled={undoRedoState.currentIndex <= 0}
            style={{
              padding: '4px 6px',
              fontSize: 11,
              backgroundColor: 'transparent',
              color: undoRedoState.currentIndex <= 0 ? '#ccc' : '#666',
              border: 'none',
              borderRadius: 2,
              cursor: undoRedoState.currentIndex <= 0 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
            title="Undo (Ctrl+Z)"
          >
            <Icon iconName="Undo" styles={{ root: { fontSize: 12 } }} />
          </button>
          <button
            onClick={handleRedo}
            disabled={undoRedoState.currentIndex >= undoRedoState.history.length - 1}
            style={{
              padding: '4px 6px',
              fontSize: 11,
              backgroundColor: 'transparent',
              color: undoRedoState.currentIndex >= undoRedoState.history.length - 1 ? '#ccc' : '#666',
              border: 'none',
              borderRadius: 2,
              cursor: undoRedoState.currentIndex >= undoRedoState.history.length - 1 ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
            title="Redo (Ctrl+Y)"
          >
            <Icon iconName="Redo" styles={{ root: { fontSize: 12 } }} />
          </button>
          <div style={{
            width: 1,
            height: 16,
            backgroundColor: '#e1e5e9',
            margin: '0 2px'
          }} />
          <button
            onClick={() => {
              const newValue = '';
              internalUpdateRef.current = true;
              onChange(newValue);
              addToHistory(newValue);
            }}
            style={{
              padding: '4px 6px',
              fontSize: 11,
              backgroundColor: 'transparent',
              color: '#666',
              border: 'none',
              borderRadius: 2,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 2
            }}
            title="Clear all (Ctrl+Backspace)"
          >
            <Icon iconName="Clear" styles={{ root: { fontSize: 12 } }} />
          </button>
        </div>
      )}
      
      <pre
        aria-hidden="true"
        style={{
          margin: 0,
          padding: '4px 6px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          fontFamily: 'inherit',
          color: '#222',
          pointerEvents: 'none',
          visibility: 'visible'
        }}
        dangerouslySetInnerHTML={{ __html: (() => {
          // Simple placeholder highlighting - only show complete [TOKEN] as blue
          const placeholders: { start: number; end: number }[] = [];
          const regex = /\[[^\]]+\]/g;
          let match: RegExpExecArray | null;
          while ((match = regex.exec(value)) !== null) {
            placeholders.push({ start: match.index, end: match.index + match[0].length });
          }
          
          const markers: { start: number; end: number; type: 'placeholder' | 'edited' }[] = [];
          placeholders.forEach(p => markers.push({ ...p, type: 'placeholder' }));
          highlightRanges.forEach(r => markers.push({ ...r, type: 'edited' }));
          markers.sort((a,b) => a.start - b.start);
          
          let cursor = 0;
          let html = '';
          const pushPlain = (to: number) => { 
            if (to > cursor) html += escapeHtml(value.slice(cursor, to)); 
            cursor = to; 
          };
          
          markers.forEach(mark => {
            if (mark.start < cursor) return; // skip overlaps
            pushPlain(mark.start);
            const segment = value.slice(mark.start, mark.end);
            if (mark.type === 'placeholder') {
              html += `<span style="color:#0a4d8c;background:#e0f0ff;font-style:italic;border:1px dashed #8bbbe8;border-radius:3px;padding:0 4px;margin:0 2px;">${escapeHtml(segment)}</span>`;
            } else {
              html += `<span style="background:#d4edda;color:#155724;border:1px solid #9ad1ac;border-radius:3px;padding:0 3px;margin:0 1px;">${escapeHtml(segment)}</span>`;
            }
            cursor = mark.end;
          });
          pushPlain(value.length);
          return html || '';
        })() }}
      />
      <textarea
        ref={taRef}
        value={value}
        onChange={e => handleContentChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => setTimeout(selectPlaceholderAtCursor, 0)}
        onClick={() => setTimeout(selectPlaceholderAtCursor, 0)}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          resize: 'none',
          background: 'transparent',
          color: 'transparent', // hide raw text, rely on highlighted layer
          caretColor: '#222',
          font: 'inherit',
          lineHeight: 1.4,
          border: 'none',
          padding: '4px 6px',
          outline: 'none',
          whiteSpace: 'pre-wrap',
          overflow: 'hidden'
        }}
        spellCheck={true}
        title="Shortcuts: Ctrl+Z (undo), Ctrl+Y (redo), Ctrl+Backspace (clear all), Alt+Backspace (delete word)"
      />
    </div>
  );
};

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
  markBlockAsEdited?: (blockTitle: string, edited: boolean) => void;
  initialNotes?: string;
  subject: string;
  setSubject: (subject: string) => void;
  // Deal capture props
  initialScopeDescription?: string;
  onScopeDescriptionChange?: (value: string) => void;
  amount?: string;
  onAmountChange?: (value: string) => void;
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
  markBlockAsEdited,
  initialNotes,
  subject,
  setSubject,
  // Deal capture props
  initialScopeDescription,
  onScopeDescriptionChange,
  amount,
  onAmountChange
}) => {
  // State for removed blocks
  const [removedBlocks, setRemovedBlocks] = useState<{ [key: string]: boolean }>({});
  // Local editable contents per block
  const [blockContents, setBlockContents] = useState<{ [key: string]: string }>({});

  // Deal capture state
  const [scopeDescription, setScopeDescription] = useState(initialScopeDescription || '');
  const [amountValue, setAmountValue] = useState(amount || '');
  const [amountError, setAmountError] = useState<string | null>(null);
  // Removed PIC placeholder insertion feature per user request
  const [isNotesPinned, setIsNotesPinned] = useState(false);
  const [showSubjectHint, setShowSubjectHint] = useState(false);

  // --- Create floating pin button with portal to render outside component tree ---
  // Global sticky notes with portal when pinned
  const GlobalStickyNotes = () => {
    if (!initialNotes || !isNotesPinned) return null;
    
    return createPortal(
      <div style={{
        position: 'fixed',
        top: 10,
        left: 20,
        right: 20,
        maxWidth: '600px',
        margin: '0 auto',
        zIndex: 9999,
        backgroundColor: isDarkMode ? colours.dark.cardBackground : '#ffffff',
        padding: '12px',
        borderRadius: '8px',
        border: `2px solid ${colours.blue}`,
        boxShadow: '0 4px 12px rgba(0,120,212,0.15)',
        transition: 'all 0.3s ease-in-out'
      }}>
        <div style={{
          fontSize: 12,
          fontWeight: 600,
          color: isDarkMode ? colours.blue : colours.darkBlue,
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 4,
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon iconName="Info" styles={{ root: { fontSize: 12 } }} />
            Enquiry Notes
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: 10,
              fontWeight: 600,
              color: isDarkMode ? colours.blue : colours.darkBlue,
              backgroundColor: isDarkMode ? colours.dark.inputBackground : '#f4f4f4',
              border: `1px solid ${isDarkMode ? colours.dark.border : '#e1e5e9'}`,
              borderRadius: 4,
              padding: '2px 8px',
              marginLeft: 6,
              letterSpacing: 0.5,
              textTransform: 'uppercase',
              lineHeight: 1.2
            }}>
              <Icon iconName="Pinned" styles={{ root: { fontSize: 12, marginRight: 4, color: isDarkMode ? colours.blue : colours.darkBlue } }} />
              PINNED
            </span>
          </div>
          <button
            onClick={() => setIsNotesPinned(false)}
            style={{
              padding: '2px 8px',
              fontSize: 10,
              backgroundColor: isDarkMode ? colours.dark.inputBackground : '#f4f4f4',
              color: isDarkMode ? colours.blue : colours.darkBlue,
              border: `1px solid ${isDarkMode ? colours.dark.border : '#e1e5e9'}`,
              borderRadius: 4,
              cursor: 'pointer',
              fontWeight: 600,
              transition: 'all 0.2s ease',
              boxShadow: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4
            }}
            title="Unpin notes"
          >
            <Icon iconName="Unpin" styles={{ root: { fontSize: 12, color: isDarkMode ? colours.blue : colours.darkBlue } }} />
            UNPIN
          </button>
        </div>
        <div style={{
          fontSize: 13,
          lineHeight: 1.5,
          color: isDarkMode ? colours.dark.text : colours.darkBlue,
          backgroundColor: isDarkMode ? colours.dark.inputBackground : '#f8f9fa',
          border: `1px solid ${isDarkMode ? colours.dark.border : '#e1e5e9'}`,
          borderRadius: 6,
          padding: '12px 16px',
          maxHeight: '200px',
          overflowY: 'auto',
          whiteSpace: 'pre-wrap'
        }}>
          {initialNotes}
        </div>
      </div>,
      document.body
    );
  };

  // PIC feature removed

  // Initialize and ensure [AMOUNT] placeholder line present
  useEffect(() => {
    // Only ensure [AMOUNT] is present if not already in description
  }, []);

  // Replace placeholders with actual values when amount changes
  useEffect(() => {
    if (amountValue && scopeDescription && scopeDescription.includes('[AMOUNT]')) {
      const formattedAmount = `£${parseFloat(amountValue).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      const updatedScope = scopeDescription.replace(/\[AMOUNT\]/g, formattedAmount);
      setScopeDescription(updatedScope);
      onScopeDescriptionChange?.(updatedScope);
    }
  }, [amountValue]);

  // Handle removing a block
  const handleRemoveBlock = (block: TemplateBlock) => {
    // Mark the block as removed
    setRemovedBlocks(prev => ({
      ...prev,
      [block.title]: true
    }));
    
    // Clear the selection for this block
    if (block.isMultiSelect) {
      handleMultiSelectChange(block.title, []);
    } else {
      handleSingleSelectChange(block.title, '');
    }
  };

  // Handle re-inserting a removed block
  const handleReinsertBlock = (block: TemplateBlock) => {
    // Remove from removed blocks to show it again
    setRemovedBlocks(prev => {
      const newState = { ...prev };
      delete newState[block.title];
      return newState;
    });
  };

  // Deal capture event handlers
  const handleScopeDescriptionChange = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    const value = newValue || '';
    setScopeDescription(value);
    
    // Process the value to replace placeholders with actual values
    let processedValue = value;
    
    // Replace [AMOUNT] placeholder with actual amount if available
    if (amountValue && processedValue.includes('[AMOUNT]')) {
      const formattedAmount = `£${parseFloat(amountValue).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      processedValue = processedValue.replace(/\[AMOUNT\]/g, formattedAmount);
    }
    
    onScopeDescriptionChange?.(processedValue);
  };

  const handleAmountChange = (event: React.FormEvent<HTMLInputElement | HTMLTextAreaElement>, newValue?: string) => {
    const value = newValue || '';
    setAmountValue(value);
    
    // Validate amount
    if (value && isNaN(Number(value))) {
      setAmountError('Please enter a valid number');
    } else {
      setAmountError(null);
    }
    
    // Auto-update scope description by replacing [AMOUNT] placeholders
    if (scopeDescription) {
      let updatedScope = scopeDescription;
      
      if (value && !isNaN(Number(value))) {
        // Format the amount with currency and proper formatting
        const numericValue = parseFloat(value);
        const formattedAmount = `£${numericValue.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        
        // Replace existing [AMOUNT] placeholders with the actual formatted amount
        if (updatedScope.includes('[AMOUNT]')) {
          updatedScope = updatedScope.replace(/\[AMOUNT\]/g, formattedAmount);
        } else if (!updatedScope.includes('Estimated fee:') && !updatedScope.includes('£')) {
          // Add the amount if it doesn't exist yet
          updatedScope = updatedScope + '\n\nEstimated fee: ' + formattedAmount;
        } else if (updatedScope.includes('Estimated fee:')) {
          // Replace existing amount in "Estimated fee:" line
          updatedScope = updatedScope.replace(/(Estimated fee:\s*)£[\d,]+\.[\d]{2}/g, `$1${formattedAmount}`);
        }
      } else if (value === '') {
        // If amount is cleared, revert back to placeholder
        updatedScope = updatedScope.replace(/£[\d,]+\.[\d]{2}/g, '[AMOUNT]');
      }
      
      setScopeDescription(updatedScope);
      onScopeDescriptionChange?.(updatedScope);
    }
    
    onAmountChange?.(value);
  };

  // Initialise blockContents when selections appear (do not overwrite if user already edited)
  useEffect(() => {
    const updates: { [k: string]: string } = {};
    templateBlocks.forEach(block => {
      const selectedOptions = selectedTemplateOptions[block.title];
      const isMultiSelect = block.isMultiSelect;
      const hasSelections = isMultiSelect
        ? Array.isArray(selectedOptions) && selectedOptions.length > 0
        : !!selectedOptions && selectedOptions !== '';
      if (hasSelections && blockContents[block.title] === undefined) {
        const base = block.editableContent || (isMultiSelect
          ? block.options.filter(opt => Array.isArray(selectedOptions) && selectedOptions.includes(opt.label)).map(o => o.previewText).join('\n\n')
          : block.options.find(opt => opt.label === selectedOptions)?.previewText || '');
        updates[block.title] = base;
      }
    });
    if (Object.keys(updates).length) {
      setBlockContents(prev => ({ ...prev, ...updates }));
    }
  }, [templateBlocks, selectedTemplateOptions]);

  const handleBlockContentChange = (block: TemplateBlock, newValue?: string) => {
    const value = newValue ?? '';
    setBlockContents(prev => ({ ...prev, [block.title]: value }));
    if (!editedBlocks[block.title]) {
      markBlockAsEdited?.(block.title, true);
    }
  };

  return (
    <>
      {/* Global sticky notes portal */}
      <GlobalStickyNotes />
      {/* Hover-reveal button styles (scoped by class names) */}
      <style>{`
        .inline-reveal-btn {display:inline-flex;align-items:center;gap:0;overflow:hidden;position:relative;}
        .inline-reveal-btn .label{max-width:0;opacity:0;transform:translateX(-4px);margin-left:0;white-space:nowrap;transition:max-width .45s ease,opacity .45s ease,transform .45s ease,margin-left .45s ease;}
        .inline-reveal-btn:hover .label,.inline-reveal-btn:focus-visible .label{max-width:90px;opacity:1;transform:translateX(0);margin-left:6px;}
      `}</style>

      <Stack tokens={{ childrenGap: 8 }} styles={{ root: { marginTop: 8 } }}>
        {/* Combined Email and Pitch Composition Section */}
        <div style={{
          border: '1px solid #e1e5e9',
          borderRadius: '8px',
            backgroundColor: isDarkMode ? colours.dark.cardBackground : '#ffffff',
          // Allow sticky children to work
          overflow: 'visible'
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            backgroundColor: isDarkMode ? colours.dark.inputBackground : '#f8f9fa',
            borderBottom: `1px solid ${isDarkMode ? colours.dark.border : '#e1e5e9'}`,
            display: 'flex',
            alignItems: 'center',
            gap: 8
          }}>
            <Icon iconName="Mail" styles={{ root: { fontSize: 14, color: colours.blue } }} />
            <span style={{
              fontSize: 13,
              fontWeight: 600,
              color: isDarkMode ? colours.dark.text : colours.darkBlue
            }}>
              Email and Pitch Composition
            </span>
          </div>

          <div style={{ padding: 16 }}>
            {/* Subject Line - Primary Focus */}
            <div style={{ marginBottom: initialNotes ? 16 : 0 }}>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: colours.blue,
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                <Icon iconName="Edit" styles={{ root: { fontSize: 12 } }} />
                Subject Line
              </div>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Craft your email subject based on the context below..."
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  fontSize: 14,
                  fontWeight: 500,
                  border: `2px solid ${isDarkMode ? colours.dark.border : '#e1e5e9'}`,
                  borderRadius: 8,
                  backgroundColor: isDarkMode ? colours.dark.inputBackground : '#ffffff',
                  color: isDarkMode ? colours.dark.text : colours.darkBlue,
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = colours.blue;
                  e.target.style.boxShadow = `0 0 0 3px ${colours.blue}20`;
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = isDarkMode ? colours.dark.border : '#e1e5e9';
                  e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
                }}
              />
            </div>

            {/* Context Notes - Supporting Information */}
            {initialNotes && !isNotesPinned && (
              <div style={{
                backgroundColor: isDarkMode ? colours.dark.cardBackground : '#ffffff',
                padding: '0',
                borderRadius: '0',
                border: 'none',
                boxShadow: 'none',
                marginBottom: '0',
                transition: 'all 0.3s ease-in-out'
              }}>
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: isDarkMode ? colours.blue : colours.darkBlue,
                  marginBottom: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  position: 'relative'
                }}>
                  <span
                    onMouseEnter={() => setShowSubjectHint(true)}
                    onMouseLeave={() => setShowSubjectHint(false)}
                    style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <Icon iconName="Info" styles={{ root: { fontSize: 12 } }} />
                  </span>
                  Enquiry Notes
                  {isNotesPinned && (
                    <span style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      fontSize: 10,
                      fontWeight: 600,
                      color: isDarkMode ? colours.blue : colours.darkBlue,
                      backgroundColor: isDarkMode ? colours.dark.inputBackground : '#f4f4f4',
                      border: `1px solid ${isDarkMode ? colours.dark.border : '#e1e5e9'}`,
                      borderRadius: 4,
                      padding: '2px 8px',
                      marginLeft: 6,
                      letterSpacing: 0.5,
                      textTransform: 'uppercase',
                      lineHeight: 1.2
                    }}>
                      <Icon iconName="Pinned" styles={{ root: { fontSize: 12, marginRight: 4, color: isDarkMode ? colours.blue : colours.darkBlue } }} />
                      PINNED
                    </span>
                  )}
                  {showSubjectHint && (
                    <span style={{
                      position: 'absolute',
                      left: 0,
                      top: '100%',
                      marginTop: 2,
                      background: isDarkMode ? colours.dark.inputBackground : '#fff',
                      color: isDarkMode ? colours.blue : colours.darkBlue,
                      fontSize: 10,
                      fontWeight: 400,
                      fontStyle: 'italic',
                      border: `1px solid ${isDarkMode ? colours.dark.border : '#e1e5e9'}`,
                      borderRadius: 4,
                      padding: '4px 8px',
                      zIndex: 10,
                      whiteSpace: 'nowrap',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}>
                      (use this to inform your subject line)
                    </span>
                  )}
                  <div style={{ marginLeft: 'auto' }}>
                    <button
                      onClick={() => setIsNotesPinned(!isNotesPinned)}
                      style={{
                        padding: '2px 10px',
                        fontSize: 10,
                        backgroundColor: isNotesPinned ? (isDarkMode ? colours.dark.inputBackground : '#f4f4f4') : '#fff',
                        color: isNotesPinned ? (isDarkMode ? colours.blue : colours.darkBlue) : colours.blue,
                        border: `1px solid ${isNotesPinned ? (isDarkMode ? colours.dark.border : '#e1e5e9') : colours.blue}`,
                        borderRadius: 4,
                        cursor: 'pointer',
                        fontWeight: 600,
                        transition: 'all 0.2s ease',
                        boxShadow: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4
                      }}
                      title={isNotesPinned ? "Unpin notes from top" : "Pin notes to top while scrolling"}
                    >
                      <Icon iconName={isNotesPinned ? "Pinned" : "PinSolid"} styles={{ root: { fontSize: 12, marginRight: 4, color: isNotesPinned ? (isDarkMode ? colours.blue : colours.darkBlue) : colours.blue } }} />
                      {isNotesPinned ? 'PINNED' : 'PIN'}
                    </button>
                  </div>
                </div>
                <div style={{
                  fontSize: 13,
                  lineHeight: 1.5,
                  color: isDarkMode ? colours.dark.text : '#666',
                  whiteSpace: 'pre-wrap',
                  backgroundColor: isDarkMode ? colours.dark.inputBackground : '#f8f9fa',
                  padding: 12,
                  borderRadius: 6,
                  border: `1px solid ${isDarkMode ? colours.dark.border : '#e1e5e9'}`,
                  position: 'relative'
                }}>
                  {initialNotes}
                  {/* Visual connector arrow pointing up to subject */}
                  <div style={{
                    position: 'absolute',
                    top: -8,
                    right: 20,
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderBottom: `8px solid ${isDarkMode ? colours.dark.inputBackground : '#f8f9fa'}`,
                    zIndex: 2
                  }} />
                  <div style={{
                    position: 'absolute',
                    top: -9,
                    right: 20,
                    width: 0,
                    height: 0,
                    borderLeft: '8px solid transparent',
                    borderRight: '8px solid transparent',
                    borderBottom: `8px solid ${isDarkMode ? colours.dark.border : '#e1e5e9'}`,
                    zIndex: 1
                  }} />
                </div>
              </div>
            )}

            {/* Deal Capture Section */}
            <div style={{ marginTop: initialNotes ? 16 : 0 }}>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: colours.blue,
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                <Icon iconName="BusinessHoursClock" styles={{ root: { fontSize: 12 } }} />
                Scope & Quote Description
              </div>
              <Stack tokens={{ childrenGap: 12 }}>
                <div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'flex-start',
                    marginBottom: 8,
                    gap: 6,
                    flexWrap: 'wrap'
                  }}>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      <button
                        onClick={() => {
                          const template = `Advice and representation in relation to a commercial, shareholder or partnership dispute.\n\nOur service includes:\n- Initial review of relevant agreements and correspondence\n- Assessment of legal position and available remedies\n- Strategic advice on next steps and resolution options\n- Clear cost estimate and timescales\n\nEstimated fee: [AMOUNT]`;
                          setScopeDescription(template);
                          onScopeDescriptionChange?.(template);
                        }}
                        style={{
                          padding: '4px 8px',
                          fontSize: 11,
                          backgroundColor: isDarkMode ? colours.dark.inputBackground : '#f8f9fa',
                          color: isDarkMode ? colours.dark.text : colours.darkBlue,
                          border: `1px solid ${isDarkMode ? colours.dark.border : '#d1d1d1'}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 400,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? colours.dark.border : '#e8f4fd';
                          e.currentTarget.style.borderColor = colours.blue;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? colours.dark.inputBackground : '#f8f9fa';
                          e.currentTarget.style.borderColor = isDarkMode ? colours.dark.border : '#d1d1d1';
                        }}
                        title="Insert commercial/shareholder dispute template"
                      >Commercial/Shareholder Dispute</button>
                      <button
                        onClick={() => {
                          const template = `Advice and representation for construction disputes, including adjudication.\n\nOur service includes:\n- Review of contract documents and payment history\n- Assessment of breach, termination or payment issues\n- Guidance on adjudication or court process\n- Practical advice to protect your position\n\nEstimated fee: [AMOUNT]`;
                          setScopeDescription(template);
                          onScopeDescriptionChange?.(template);
                        }}
                        style={{
                          padding: '4px 8px',
                          fontSize: 11,
                          backgroundColor: isDarkMode ? colours.dark.inputBackground : '#f8f9fa',
                          color: isDarkMode ? colours.dark.text : colours.darkBlue,
                          border: `1px solid ${isDarkMode ? colours.dark.border : '#d1d1d1'}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 400,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? colours.dark.border : '#e8f4fd';
                          e.currentTarget.style.borderColor = colours.blue;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? colours.dark.inputBackground : '#f8f9fa';
                          e.currentTarget.style.borderColor = isDarkMode ? colours.dark.border : '#d1d1d1';
                        }}
                        title="Insert construction dispute template"
                      >Construction Dispute</button>
                      <button
                        onClick={() => {
                          const template = `Advice and representation in relation to property disputes or evictions.\n\nOur service includes:\n- Review of lease, tenancy or title documents\n- Assessment of grounds for possession or dispute\n- Guidance on process and timescales\n- Practical steps to protect your interests\n\nEstimated fee: [AMOUNT]`;
                          setScopeDescription(template);
                          onScopeDescriptionChange?.(template);
                        }}
                        style={{
                          padding: '4px 8px',
                          fontSize: 11,
                          backgroundColor: isDarkMode ? colours.dark.inputBackground : '#f8f9fa',
                          color: isDarkMode ? colours.dark.text : colours.darkBlue,
                          border: `1px solid ${isDarkMode ? colours.dark.border : '#d1d1d1'}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 400,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? colours.dark.border : '#e8f4fd';
                          e.currentTarget.style.borderColor = colours.blue;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? colours.dark.inputBackground : '#f8f9fa';
                          e.currentTarget.style.borderColor = isDarkMode ? colours.dark.border : '#d1d1d1';
                        }}
                        title="Insert property dispute template"
                      >Property Dispute</button>
                      <button
                        onClick={() => {
                          const template = `Advice and action in relation to debt recovery or statutory demands.\n\nOur service includes:\n- Review of debt and supporting documents\n- Assessment of recovery options and risks\n- Preparation and service of statutory demand or claim\n- Guidance on defended claims and court process\n\nEstimated fee: [AMOUNT]`;
                          setScopeDescription(template);
                          onScopeDescriptionChange?.(template);
                        }}
                        style={{
                          padding: '4px 8px',
                          fontSize: 11,
                          backgroundColor: isDarkMode ? colours.dark.inputBackground : '#f8f9fa',
                          color: isDarkMode ? colours.dark.text : colours.darkBlue,
                          border: `1px solid ${isDarkMode ? colours.dark.border : '#d1d1d1'}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 400,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? colours.dark.border : '#e8f4fd';
                          e.currentTarget.style.borderColor = colours.blue;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? colours.dark.inputBackground : '#f8f9fa';
                          e.currentTarget.style.borderColor = isDarkMode ? colours.dark.border : '#d1d1d1';
                        }}
                        title="Insert debt recovery template"
                      >Debt Recovery</button>
                      <button
                        onClick={() => {
                          const template = `Advice and representation in relation to other commercial disputes.\n\nOur service includes:\n- Initial review and assessment of your issue\n- Guidance on process, options and likely outcomes\n- Clear cost estimate and timescales\n\nEstimated fee: [AMOUNT]`;
                          setScopeDescription(template);
                          onScopeDescriptionChange?.(template);
                        }}
                        style={{
                          padding: '4px 8px',
                          fontSize: 11,
                          backgroundColor: isDarkMode ? colours.dark.inputBackground : '#f8f9fa',
                          color: isDarkMode ? colours.dark.text : colours.darkBlue,
                          border: `1px solid ${isDarkMode ? colours.dark.border : '#d1d1d1'}`,
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontWeight: 400,
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? colours.dark.border : '#e8f4fd';
                          e.currentTarget.style.borderColor = colours.blue;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = isDarkMode ? colours.dark.inputBackground : '#f8f9fa';
                          e.currentTarget.style.borderColor = isDarkMode ? colours.dark.border : '#d1d1d1';
                        }}
                        title="Insert other dispute template"
                      >Other</button>
                    </div>
                  </div>
                  <TextField
                    multiline
                    autoAdjustHeight
                    rows={3}
                    value={scopeDescription}
                    onChange={handleScopeDescriptionChange}
                    placeholder="Describe what we will be doing and charging..."
                    styles={{
                      field: { 
                        fontSize: 13,
                        backgroundColor: isDarkMode ? colours.dark.inputBackground : '#ffffff',
                        color: isDarkMode ? colours.dark.text : colours.darkBlue,
                        resize: 'vertical' // Allow manual resize too
                      },
                      fieldGroup: { 
                        border: `1px solid ${isDarkMode ? colours.dark.border : '#d2d0ce'}`,
                        borderRadius: '4px'
                      }
                    }}
                  />
                </div>
                
                {/* Amount input - now integrated with scope */}
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  backgroundColor: isDarkMode ? colours.dark.inputBackground : '#f8f9fa',
                  border: `1px solid ${isDarkMode ? colours.dark.border : '#e1e5e9'}`,
                  borderRadius: '4px'
                }}>
                  <Icon iconName="Calculator" styles={{ root: { fontSize: 14, color: colours.blue } }} />
                  <span style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: isDarkMode ? colours.dark.text : colours.darkBlue,
                    minWidth: '80px'
                  }}>
                    Amount (£):
                  </span>
                  <TextField
                    value={amountValue}
                    onChange={handleAmountChange}
                    placeholder="5000"
                    errorMessage={amountError || undefined}
                    styles={{
                      root: { flex: 1, maxWidth: '150px' },
                      field: { 
                        fontSize: 13,
                        backgroundColor: isDarkMode ? colours.dark.cardBackground : '#ffffff',
                        color: isDarkMode ? colours.dark.text : colours.darkBlue,
                        fontWeight: 600
                      },
                      fieldGroup: { 
                        border: `1px solid ${isDarkMode ? colours.dark.border : '#d2d0ce'}`,
                        borderRadius: '4px'
                      }
                    }}
                  />
                  <span style={{
                    fontSize: 11,
                    color: isDarkMode ? colours.dark.text : '#666',
                    fontStyle: 'italic'
                  }}>
                    Updates scope description automatically
                  </span>
                </div>
              </Stack>
            </div>
          </div>

        {/* Show removed blocks section if there are any */}
        {Object.keys(removedBlocks).length > 0 && (
          <div style={{
            border: '1px solid #f0f0f0',
            borderRadius: '6px',
            backgroundColor: '#f8f9fa',
            padding: '12px',
            margin: '16px 16px 0 16px'
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

        {/* Progressive reveal template blocks */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 16 }}>
            {templateBlocks
              .filter(block => !removedBlocks[block.title])
              .map((block, blockIndex) => {
                // Progressive reveal logic: show Introduction always, others only after Introduction has selections
                const isIntroduction = blockIndex === 0;
                const introBlock = templateBlocks[0];
                const introSelectedOptions = selectedTemplateOptions[introBlock?.title];
                const introHasSelections = introBlock?.isMultiSelect
                  ? Array.isArray(introSelectedOptions) && introSelectedOptions.length > 0
                  : introSelectedOptions && introSelectedOptions !== '';

                // Show Introduction always, show others only after Introduction has selections
                if (!isIntroduction && !introHasSelections) {
                  return null;
                }

                const selectedOptions = selectedTemplateOptions[block.title];
                const isMultiSelect = block.isMultiSelect;
                const hasSelections = isMultiSelect 
                  ? Array.isArray(selectedOptions) && selectedOptions.length > 0
                  : selectedOptions && selectedOptions !== '';
                
                return (
                  <div
                    key={`block-${block.title}-${blockIndex}`}
                    className="block-editor"
                    style={{
                      // Visual states:
                      // 1. Edited (green)
                      // 2. Selected but not edited (blue)
                      // 3. Not selected (neutral)
                      border: editedBlocks[block.title]
                        ? '1px solid #28a745'
                        : hasSelections
                          ? `1px solid ${colours.blue}`
                          : '1px solid #e1e5e9',
                      // Keep background neutral (white) regardless of state to avoid distraction
                      background: '#ffffff',
                      borderRadius: '6px',
                      overflow: 'hidden'
                    }}
                  >
                    {/* Block Header */}
                    <div style={{
                      padding: '12px 16px',
                      background: editedBlocks[block.title]
                        ? '#f0f8f0'
                        : hasSelections
                          ? '#eef6ff'
                          : '#f8f9fa',
                      borderBottom: '1px solid #e1e5e9',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <h3 style={{
                          margin: 0,
                          fontSize: 14,
                          fontWeight: 700,
                          color: '#0d3955'
                        }}>
                          {block.title}
                        </h3>
                        <span 
                          style={{
                            fontSize: 11,
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: 12,
                            backgroundColor: editedBlocks[block.title]
                              ? '#d4edda'
                              : hasSelections
                                ? '#e0f0ff'
                                : '#e9ecef',
                            color: editedBlocks[block.title]
                              ? '#155724'
                              : hasSelections
                                ? colours.blue
                                : '#6c757d'
                          }}
                        >
                          {hasSelections ? (editedBlocks[block.title] ? 'edited' : 'included') : 'not included'}
                        </span>
                        {hasSelections && (
                          <span style={{
                            fontSize: 12,
                            color: '#666',
                            fontWeight: 500
                          }}>
                            {isIntroduction 
                              ? (Array.isArray(selectedOptions) && selectedOptions.length > 0 ? selectedOptions[0] : '')
                              : isMultiSelect 
                                ? Array.isArray(selectedOptions) 
                                  ? selectedOptions.join(', ') 
                                  : selectedOptions
                                : selectedOptions}
                          </span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        {hasSelections && (
                          <>
                            <button
                              onClick={() => {
                                if (isIntroduction) {
                                  handleMultiSelectChange(block.title, []);
                                } else if (isMultiSelect) {
                                  handleMultiSelectChange(block.title, []);
                                } else {
                                  handleSingleSelectChange(block.title, '');
                                }
                              }}
                              className="inline-reveal-btn"
                              aria-label="Change selection"
                              style={{
                                padding: '6px 10px',
                                backgroundColor: editedBlocks[block.title] ? '#f4f4f4' : '#f4faff',
                                color: colours.blue,
                                border: `1px solid ${colours.blue}`,
                                borderRadius: 4,
                                fontSize: 12,
                                fontWeight: 500,
                                cursor: 'pointer',
                                boxShadow: 'none',
                                transition: 'background-color .2s ease,border-color .2s ease'
                              }}
                              title="Change selection"
                            >
                              <Icon iconName="Edit" />
                              <span className="label">Change</span>
                            </button>
                            <button
                              onClick={() => handleRemoveBlock(block)}
                              className="inline-reveal-btn"
                              aria-label="Remove section"
                              style={{
                                padding: '6px 10px',
                                backgroundColor: colours.cta,
                                color: 'white',
                                border: '1px solid ' + colours.cta,
                                borderRadius: 4,
                                fontSize: 12,
                                fontWeight: 500,
                                cursor: 'pointer',
                                boxShadow: 'none',
                                transition: 'background-color .2s ease'
                              }}
                              title="Remove this section"
                            >
                              <Icon iconName="Delete" />
                              <span className="label">Remove</span>
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    {/* Special handling for Introduction block */}
                    {isIntroduction ? (
                      <div style={{ padding: hasSelections ? 8 : 16 }}>
                        {!hasSelections ? (
                          <>
                            <div style={{
                              fontSize: 13,
                              color: '#666',
                              marginBottom: 12,
                              fontWeight: 500
                            }}>
                              Select an introduction style:
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {block.options.map(option => {
                                return (
                                  <div
                                    key={option.label}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      gap: 8,
                                      padding: '8px 12px',
                                      borderRadius: 6,
                                      border: '2px solid transparent',
                                      background: '#fafbfc',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => {
                                      // For Introduction, use single select behavior
                                      handleMultiSelectChange(block.title, [option.label]);
                                    }}
                                  >
                                    <div style={{
                                      width: 20,
                                      height: 20,
                                      border: '2px solid #ccc',
                                      borderRadius: '50%',
                                      background: '#fff',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                      marginTop: 2
                                    }}>
                                    </div>
                                    
                                    <div style={{ flex: 1 }}>
                                      <div style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: '#333',
                                        marginBottom: 4
                                      }}>
                                        {option.label}
                                      </div>
                                      <div style={{
                                        fontSize: 12,
                                        color: '#666',
                                        lineHeight: 1.4,
                                        maxHeight: 60,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}>
                                        {option.previewText.replace(/<[^>]+>/g, '').substring(0, 150)}
                                        {option.previewText.length > 150 ? '...' : ''}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <>
                            <InlineEditableArea
                              value={blockContents[block.title] ?? ''}
                              onChange={(v) => handleBlockContentChange(block, v)}
                              edited={!!editedBlocks[block.title]}
                            />
                          </>
                        )}
                      </div>
                    ) : (
                      /* Regular template blocks */
                      <div style={{ padding: hasSelections ? 8 : 16 }}>
                        {!hasSelections && (
                          <>
                            <div style={{
                              fontSize: 13,
                              color: '#666',
                              marginBottom: 12,
                              fontWeight: 500
                            }}>
                              Select options to include in this section:
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                              {block.options.map(option => {
                                const isSelected = isMultiSelect
                                  ? Array.isArray(selectedOptions) && selectedOptions.includes(option.label)
                                  : selectedOptions === option.label;
                                return (
                                  <div
                                    key={option.label}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'flex-start',
                                      gap: 8,
                                      padding: '8px 12px',
                                      borderRadius: 6,
                                      border: isSelected ? `2px solid ${colours.blue}` : '2px solid transparent',
                                      background: isSelected ? '#f0f6ff' : '#fafbfc',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease'
                                    }}
                                    onClick={() => {
                                      if (isMultiSelect) {
                                        const currentSelections = Array.isArray(selectedOptions) ? selectedOptions : [];
                                        if (isSelected) {
                                          const updated = currentSelections.filter(s => s !== option.label);
                                          handleMultiSelectChange(block.title, updated);
                                        } else {
                                          const updated = [...currentSelections, option.label];
                                          handleMultiSelectChange(block.title, updated);
                                        }
                                      } else {
                                        if (isSelected) {
                                          handleSingleSelectChange(block.title, '');
                                        } else {
                                          handleSingleSelectChange(block.title, option.label);
                                        }
                                      }
                                    }}
                                  >
                                    <div style={{
                                      width: 20,
                                      height: 20,
                                      border: isSelected ? `2px solid ${colours.blue}` : '2px solid #ccc',
                                      borderRadius: isMultiSelect ? 4 : '50%',
                                      background: isSelected ? colours.blue : '#fff',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      flexShrink: 0,
                                      marginTop: 2
                                    }}>
                                      {isSelected && (
                                        <Icon
                                          iconName="CheckMark"
                                          styles={{ root: { fontSize: 12, color: '#fff', fontWeight: 'bold' } }}
                                        />
                                      )}
                                    </div>
                                    <div style={{ flex: 1 }}>
                                      <div style={{
                                        fontSize: 13,
                                        fontWeight: 600,
                                        color: isSelected ? colours.blue : '#333',
                                        marginBottom: 4
                                      }}>
                                        {option.label}
                                      </div>
                                      <div style={{
                                        fontSize: 12,
                                        color: '#666',
                                        lineHeight: 1.4,
                                        maxHeight: 60,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                      }}>
                                        {option.previewText.replace(/<[^>]+>/g, '').substring(0, 150)}
                                        {option.previewText.length > 150 ? '...' : ''}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        )}
                        {hasSelections && (
                          <InlineEditableArea
                            value={blockContents[block.title] ?? ''}
                            onChange={(v) => handleBlockContentChange(block, v)}
                            edited={!!editedBlocks[block.title]}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </div>
      </Stack>
    </>
  );
};

export default EditorAndTemplateBlocks;
