import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Stack, Text, Icon, Pivot, PivotItem, TextField } from '@fluentui/react';
import { colours } from '../../../app/styles/colours';
import { TemplateBlock } from '../../../app/customisation/ProductionTemplateBlocks';
import SnippetEditPopover from './SnippetEditPopover';
import { placeholderSuggestions } from '../../../app/customisation/InsertSuggestions';
import { wrapInsertPlaceholders } from './emailUtils';
import { SCENARIOS } from './scenarios';
import EmailSignature from '../EmailSignature';
import { applyDynamicSubstitutions, convertDoubleBreaksToParagraphs } from './emailUtils';
import markUrl from '../../../assets/dark blue mark.svg';




// NOTE: renderWithPlaceholders was removed due to corruption and is not used in this component.
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
    html += `<span style="display:inline;background:#e0f0ff;box-shadow:inset 0 0 0 1px #8bbbe8;padding:0;margin:0;border:none;font-style:inherit;color:#0a4d8c">[${inner}]</span>`;
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    html += escapeHtml(text.slice(lastIndex));
  }
  return html || '';
}

// Find placeholder tokens like [TOKEN] in a string (HTML or plain text)
function findPlaceholders(input: string): string[] {
  const matches = input.match(/\[([^\]]+)\]/g) || [];
  // Return unique token names without brackets
  const names = matches.map(m => m.slice(1, -1));
  return Array.from(new Set(names));
}

// Highlight placeholders inside an HTML string (assumes HTML not escaped)
function highlightPlaceholdersHtml(html: string): string {
  return html.replace(/\[([^\]]+)\]/g, (_m, p1) => {
    const inner = escapeHtml(p1);
    return `<span style="display:inline;background:#ffe9e9;box-shadow:inset 0 0 0 1px #f1a4a4;padding:0;margin:0;border:none;font-style:inherit;color:#a80000">[${inner}]</span>`;
  });
}

// Convert lightweight HTML (including preview scaffolding) to plain text safe for Outlook
function htmlToPlainText(input: string): string {
  let s = input || '';
  // Normalize line breaks for common tags
  s = s.replace(/\r\n/g, '\n');
  s = s.replace(/<br\s*\/?\s*>/gi, '\n');
  s = s.replace(/<\/(p|div|li|h[1-6])\s*>/gi, '\n');
  s = s.replace(/<li\b[^>]*>/gi, '• ');
  // Remove all remaining tags
  s = s.replace(/<[^>]+>/g, '');
  // Decode common entities
  s = s.replace(/&nbsp;/g, ' ')
       .replace(/&amp;/g, '&')
       .replace(/&lt;/g, '<')
       .replace(/&gt;/g, '>')
       .replace(/&quot;/g, '"')
       .replace(/&#39;/g, "'");
  // Collapse excessive blank lines
  s = s.replace(/\n{3,}/g, '\n\n');
  return s.trim();
}

// --- Auto-insert Rate and Role into [RATE] and [ROLE] placeholders in the body ---
function useAutoInsertRateRole(
  body: string,
  setBody: (v: string) => void,
  userData: any,
  setExternalHighlights?: (ranges: { start: number; end: number }[]) => void
) {
  const lastAppliedKeyRef = useRef<string | null>(null);
  useEffect(() => {
  if (!body || !userData) return;

  // Only run if tokens are present to avoid unnecessary resets
  const tokenRegex = /\[(RATE|ROLE)\]/i;
  if (!tokenRegex.test(body)) return;

  // Support userData being either a user object or an array of users (use first).
  const u: any = Array.isArray(userData) ? (userData[0] ?? null) : userData;
  if (!u) return;

    const roleRaw = (u.Role ?? u.role ?? u.RoleName ?? u.roleName);
    const rateRaw = (u.Rate ?? u.rate ?? u.HourlyRate ?? u.hourlyRate);

    const roleStr = roleRaw == null ? '' : String(roleRaw).trim();
    // Parse numeric/money rate robustly (supports number or string with £ and commas). 0 is valid.
    const parseRate = (val: unknown): number | null => {
      if (val == null) return null;
      if (typeof val === 'number') {
        return isFinite(val) ? val : null;
      }
      const cleaned = String(val).replace(/[^0-9.\-]/g, '').trim();
      if (!cleaned) return null;
      const n = Number(cleaned);
      return isFinite(n) ? n : null;
    };
    const rateNumber = parseRate(rateRaw);
    const formatRateGBP = (n: number) => `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (!roleStr && rateNumber == null) return;

    // Global replacement of [RATE] and [ROLE] wherever they appear.
    // Compute new body and collect highlight ranges for inserted values.
    const TOKEN_LEN = (t: 'RATE' | 'ROLE') => `[${t}]`.length;
    let newBody = body;
    const ranges: { start: number; end: number }[] = [];

    // We replace in a single left-to-right pass to keep indices stable while we compute highlights.
  const regex = /\[(RATE|ROLE)\]/gi;
    let m: RegExpExecArray | null;
    let shift = 0; // net length delta after prior replacements

    while ((m = regex.exec(body)) !== null) {
  const token = (m[1] as string).toUpperCase() as 'RATE' | 'ROLE';
      const originalStart = m.index;
      const start = originalStart + shift;
      const end = start + TOKEN_LEN(token);

      let replacement: string | null = null;
      if (token === 'RATE' && rateNumber != null) {
        replacement = formatRateGBP(rateNumber);
      } else if (token === 'ROLE' && roleStr) {
        replacement = roleStr;
      }

      if (replacement != null) {
        newBody = newBody.slice(0, start) + replacement + newBody.slice(end);
        // Record highlight for the inserted value
        ranges.push({ start, end: start + replacement.length });
        // Update shift for subsequent matches based on length delta
        shift += replacement.length - TOKEN_LEN(token);
      }
    }

    // Build a stable key to prevent reapplying for the same inputs
    const key = `${roleStr}|${rateNumber ?? ''}|${body}`;
    if (newBody !== body) {
      lastAppliedKeyRef.current = key;
      setBody(newBody);
      // Only emit highlights when we actually inserted something
      if (ranges.length) setExternalHighlights?.(ranges);
      return;
    }
    // If nothing changed and we've already applied for this key, do nothing
    if (lastAppliedKeyRef.current === key) return;
    // If nothing changed but we haven't emitted highlights for this content (rare), only emit if non-empty
    if (ranges.length) {
      lastAppliedKeyRef.current = key;
      setExternalHighlights?.(ranges);
    }
  }, [body, userData, setBody, setExternalHighlights]);
}

interface InlineEditableAreaProps {
  value: string;
  onChange: (v: string) => void;
  edited: boolean;
  minHeight?: number;
  externalHighlights?: { start: number; end: number }[];
  allReplacedRanges?: { start: number; end: number }[];
}

interface UndoRedoState {
  history: string[];
  currentIndex: number;
}

const InlineEditableArea: React.FC<InlineEditableAreaProps> = ({ value, onChange, edited, minHeight = 48, externalHighlights, allReplacedRanges }) => {
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
  // Local synced copies of external highlights so we can shift them as user types
  const [syncedExternalRanges, setSyncedExternalRanges] = useState<{ start: number; end: number }[]>([]);
  const [syncedPersistentRanges, setSyncedPersistentRanges] = useState<{ start: number; end: number }[]>([]);

  // Keep local copies in sync with props when they change from outside (e.g., auto-inserts)
  useEffect(() => {
    setSyncedExternalRanges((externalHighlights || []).slice());
  }, [externalHighlights?.length, ...(externalHighlights || []).flatMap(r => [r.start, r.end])]);
  useEffect(() => {
    setSyncedPersistentRanges((allReplacedRanges || []).slice());
  }, [allReplacedRanges?.length, ...(allReplacedRanges || []).flatMap(r => [r.start, r.end])]);

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

  // Utilities for robust range tracking
  const mergeRanges = (ranges: { start: number; end: number }[]) => {
    const sorted = ranges
      .filter(r => r.end > r.start)
      .sort((a, b) => a.start - b.start);
    const out: { start: number; end: number }[] = [];
    for (const r of sorted) {
      const last = out[out.length - 1];
      if (!last) { out.push({ ...r }); continue; }
      if (r.start <= last.end) {
        last.end = Math.max(last.end, r.end);
      } else {
        out.push({ ...r });
      }
    }
    return out;
  };

  const handleContentChange = (newValue: string) => {
    internalUpdateRef.current = true;
    const oldValue = previousValueRef.current;
    const oldLen = oldValue.length;
    const newLen = newValue.length;

    // Compute minimal diff window to locate edit region
    let p = 0;
    while (p < oldLen && p < newLen && oldValue[p] === newValue[p]) p++;
    let s = 0;
    while (
      s < (oldLen - p) &&
      s < (newLen - p) &&
      oldValue[oldLen - 1 - s] === newValue[newLen - 1 - s]
    ) s++;
    const changeStart = p;
    const oldChangeEnd = oldLen - s;
    const newChangeEnd = newLen - s;
    const removedLen = Math.max(0, oldChangeEnd - changeStart);
    const insertedLen = Math.max(0, newChangeEnd - changeStart);
    const delta = insertedLen - removedLen;
    const ta = taRef.current;
    const caretPos = ta ? ta.selectionStart : newChangeEnd; // caret after change

    // Map a position from old text to new text
    const mapPos = (pos: number) => {
      if (pos <= changeStart) return pos;
      if (pos >= oldChangeEnd) return pos + delta;
      // Inside the changed window: clamp into the inserted segment
      const offset = pos - changeStart;
      return changeStart + Math.min(insertedLen, Math.max(0, offset));
    };

    // Shift existing highlights to follow their content
    let updatedRanges = highlightRanges.map(r => ({ start: mapPos(r.start), end: mapPos(r.end) }));
    let updatedExternal = syncedExternalRanges.map(r => ({ start: mapPos(r.start), end: mapPos(r.end) }));
    let updatedPersistent = syncedPersistentRanges.map(r => ({ start: mapPos(r.start), end: mapPos(r.end) }));

    // If we are replacing a placeholder selection, add a new sticky highlight for the inserted content
    if (replacingPlaceholderRef.current) {
      const rep = replacingPlaceholderRef.current;
      // Only create if the edit intersects the placeholder bounds
      if (!(oldChangeEnd <= rep.start || changeStart >= rep.end)) {
        const newRange = { start: rep.start, end: rep.start + insertedLen };
        activeReplacementRangeRef.current = { ...newRange };
        updatedRanges.push(newRange);
      }
      replacingPlaceholderRef.current = null; // consumed
    } else if (activeReplacementRangeRef.current && delta !== 0) {
      // Keep growing active range when typing at or right after its end
      const r = activeReplacementRangeRef.current;
      const mapped = { start: mapPos(r.start), end: mapPos(r.end) };
      let grow = false;
      if (delta > 0 && removedLen === 0) {
        // Pure insertion: extend if insertion starts at end of the active range
        if (changeStart === mapped.end || caretPos === mapped.end + insertedLen) {
          mapped.end += insertedLen;
          grow = true;
        }
      }
      activeReplacementRangeRef.current = { ...mapped };
      updatedRanges = updatedRanges.map(x => (x.start === r.start && x.end === r.end) ? mapped : x);
      if (!grow && delta !== 0) {
        // If edit moved away, stop actively growing it
        if (caretPos < mapped.start || caretPos > mapped.end) {
          activeReplacementRangeRef.current = null;
        }
      }
    } else if (delta > 0 && removedLen === 0) {
      // No active range, but user inserted text: if insertion happens exactly at the end of any existing range, extend that range
      const tryExtend = (arr: { start: number; end: number }[]) => {
        for (let i = 0; i < arr.length; i++) {
          const r = arr[i];
          if (changeStart === r.end) {
            arr[i] = { start: r.start, end: r.end + insertedLen };
            // Make it active so further typing continues to grow this highlight
            activeReplacementRangeRef.current = { ...arr[i] };
            return true;
          }
        }
        return false;
      };
      // Prefer extending internal ranges, then external, then persistent
      if (!tryExtend(updatedRanges)) {
        if (!tryExtend(updatedExternal)) {
          tryExtend(updatedPersistent);
        }
      }
    }

    updatedRanges = mergeRanges(updatedRanges);
    updatedExternal = mergeRanges(updatedExternal);
    updatedPersistent = mergeRanges(updatedPersistent);
    setHighlightRanges(updatedRanges);
    setSyncedExternalRanges(updatedExternal);
    setSyncedPersistentRanges(updatedPersistent);

    onChange(newValue);
    addToHistory(newValue);
    previousValueRef.current = newValue;
  };

  // Select placeholder token at cursor to prep for replacement
  const selectPlaceholderAtCursor = () => {
    const ta = taRef.current;
    if (!ta) return;
    // Only act when there's no selection already
    if (ta.selectionStart !== ta.selectionEnd) return;

    const pos = ta.selectionStart;
    const text = ta.value;
    const regex = /\[[^\]]+\]/g;
    let m: RegExpExecArray | null;
    while ((m = regex.exec(text)) !== null) {
      const start = m.index;
      const end = start + m[0].length;
      // Select only if strictly inside the token (avoid snapping when clicking exactly at boundaries)
      if (pos > start && pos < end) {
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
          font: 'inherit',
          lineHeight: 1.4,
          fontKerning: 'none',
          fontVariantLigatures: 'none',
          letterSpacing: 'normal',
            
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
          // Merge internal highlights (active editing), synced external highlights (auto-inserted), and synced persistent ranges
          const allEdited = [
            ...highlightRanges,
            ...((syncedExternalRanges || []).filter((r: { start: number; end: number }) => r && r.end > r.start)),
            ...((syncedPersistentRanges || []).filter((r: { start: number; end: number }) => r && r.end > r.start))
          ];
          allEdited.forEach(r => markers.push({ ...r, type: 'edited' }));


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
              html += `<span style="display:inline;background:#e0f0ff;box-shadow:inset 0 0 0 1px #8bbbe8;padding:0;margin:0;border:none;font-style:inherit;color:#0a4d8c">${escapeHtml(segment)}</span>`;
            } else {
              // Updated edited highlight: softer green background, brand green border, accessible text color
              html += `<span style="display:inline;background:#e9f9f1;box-shadow:inset 0 0 0 1px #20b26c;padding:0;margin:0;border:none;font-style:inherit;color:#0b3d2c">${escapeHtml(segment)}</span>`;
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
        onFocus={selectPlaceholderAtCursor}
        onClick={selectPlaceholderAtCursor}
  onMouseDown={selectPlaceholderAtCursor}
  onMouseUp={selectPlaceholderAtCursor}
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
          fontKerning: 'none',
          fontVariantLigatures: 'none',
          letterSpacing: 'normal',
          border: 'none',
          padding: '4px 6px',
          outline: 'none',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
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
  // Inline preview dependencies
  userData?: any;
  enquiry?: any;
  passcode?: string;
  handleDraftEmail?: () => void;
  sendEmail?: () => void;
  isDraftConfirmed?: boolean;
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
  onAmountChange,
  // Inline preview dependencies
  userData,
  enquiry,
  passcode,
  handleDraftEmail,
  sendEmail,
  isDraftConfirmed
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
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [showInlinePreview, setShowInlinePreview] = useState(false);
  const [confirmReady, setConfirmReady] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);
  // Ensure a default subject without tying it to scenario templates
  const didSetDefaultSubject = useRef(false);
  useEffect(() => {
    if (!didSetDefaultSubject.current && (!subject || subject.trim() === '')) {
      didSetDefaultSubject.current = true;
      setSubject('Your Enquiry - Helix Law');
    }
  }, [subject, setSubject]);

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
          justifyContent: 'flex-start'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Icon iconName="Info" styles={{ root: { fontSize: 12 } }} />
            Enquiry Notes
          </div>
        </div>
        {/* Floating unpin icon */}
        <button
          onClick={() => setIsNotesPinned(false)}
          title="Unpin notes"
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            width: 28,
            height: 28,
            borderRadius: 14,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isDarkMode ? colours.dark.inputBackground : '#ffffff',
            border: `1px solid ${isDarkMode ? colours.dark.border : '#e1e5e9'}`,
            color: isDarkMode ? colours.dark.text : colours.darkBlue,
            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
            cursor: 'pointer'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = colours.blue;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = isDarkMode ? colours.dark.border : '#e1e5e9';
          }}
        >
          <Icon iconName="Unpin" styles={{ root: { fontSize: 14, color: isDarkMode ? colours.dark.text : colours.darkBlue } }} />
        </button>
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
          ? block.options
              .filter(opt => Array.isArray(selectedOptions) && selectedOptions.includes(opt.label))
              .map(o => htmlToPlainText(o.previewText))
              .join('\n\n')
          : htmlToPlainText(block.options.find(opt => opt.label === selectedOptions)?.previewText || ''));
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

  // Auto-insert Rate/Role highlight state and effect
  const [bodyAutoHighlights, setBodyAutoHighlights] = useState<{ start: number; end: number }[]>([]);
  const [allBodyReplacedRanges, setAllBodyReplacedRanges] = useState<{ start: number; end: number }[]>([]);
  
  // Track all placeholder replacements (both auto and manual) for consistent green highlighting
  const trackReplacedRange = useCallback((range: { start: number; end: number }) => {
    setAllBodyReplacedRanges(prev => {
      // Remove overlapping ranges and add the new one
      const filtered = prev.filter(r => !(r.start < range.end && r.end > range.start));
      return [...filtered, range];
    });
  }, []);
  
  // Enhanced auto-insert that also tracks replaced ranges
  const enhancedSetBodyAutoHighlights = useCallback((ranges: { start: number; end: number }[]) => {
    setBodyAutoHighlights(ranges);
    // Add these ranges to the persistent replaced ranges
    ranges.forEach(trackReplacedRange);
  }, [trackReplacedRange]);
  
  useAutoInsertRateRole(body, setBody, userData, enhancedSetBodyAutoHighlights);
  // Also apply to subject so switching templates gets replacements too
  useAutoInsertRateRole(subject, setSubject, userData);

  return (
    <>
      {/* Global sticky notes portal */}
      <GlobalStickyNotes />
      {/* Hover-reveal button styles (scoped by class names) */}
      <style>{`
        .inline-reveal-btn {display:inline-flex;align-items:center;gap:0;overflow:hidden;position:relative;}
        .inline-reveal-btn .label{max-width:0;opacity:0;transform:translateX(-4px);margin-left:0;white-space:nowrap;transition:max-width .45s ease,opacity .45s ease,transform .45s ease,margin-left .45s ease;}
        .inline-reveal-btn:hover .label,.inline-reveal-btn:focus-visible .label{max-width:90px;opacity:1;transform:translateX(0);margin-left:6px;}
      @keyframes fadeSlideIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
      .smooth-appear{animation:fadeSlideIn .18s ease}
      `}</style>

  <Stack tokens={{ childrenGap: 8 }} styles={{ root: { marginTop: 0 } }}>
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
            {/* Scenario Picker (minimal, non-breaking) */}
            <div style={{ marginBottom: 12 }}>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: colours.blue,
                marginBottom: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 4
              }}>
                <Icon iconName="LightningBolt" styles={{ root: { fontSize: 12 } }} />
                Quick scenarios
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {SCENARIOS.map(s => (
                  <button
                    key={s.id}
                    onClick={() => {
                      setSelectedScenarioId(s.id);
          // Prefill only the body; subject is kept independent
                      setBody(s.body);
                      // Optionally seed first block editable content to keep edit UX consistent
                      const firstBlock = templateBlocks[0];
                      if (firstBlock) {
                        setBlockContents(prev => ({ ...prev, [firstBlock.title]: s.body }));
                      }
                    }}
                    style={{
                      padding: '6px 10px',
                      fontSize: 12,
                      borderRadius: 6,
                      border: `1px solid ${selectedScenarioId === s.id ? colours.blue : '#e1e5e9'}`,
                      background: selectedScenarioId === s.id ? '#eef6ff' : '#fff',
                      color: selectedScenarioId === s.id ? colours.blue : '#333',
                      cursor: 'pointer'
                    }}
                    title={s.name}
                  >
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
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

            {/* Default subject is set via a top-level effect to respect Hooks rules */}

            {/* Email body / Preview (swap in place) */}
            <div style={{ marginBottom: 16 }}>
              <div style={{
                fontSize: 12,
                fontWeight: 600,
                color: colours.blue,
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                justifyContent: 'space-between'
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Icon iconName="TextDocument" styles={{ root: { fontSize: 12 } }} />
                  {showInlinePreview ? 'Preview' : 'Email body'}
                </span>
                <div style={{ display: 'inline-flex', gap: 6 }}>
                  <button
                    onClick={() => {
                      const plain = htmlToPlainText(body);
                      if (plain !== body) {
                        setBody(plain);
                      }
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: 11,
                      borderRadius: 4,
                      border: '1px solid #e1e5e9',
                      color: '#333',
                      background: '#fff',
                      cursor: 'pointer'
                    }}
                    title="Convert current content to plain text"
                  >
                    <Icon iconName="ClearFormatting" styles={{ root: { fontSize: 12 } }} /> Plain text
                  </button>
                  <button
                    onClick={() => {
                      if (showInlinePreview) {
                        if (!previewRef.current) return;
                        const text = previewRef.current.innerText || '';
                        try {
                          void navigator.clipboard.writeText(text);
                        } catch {
                          const ta = document.createElement('textarea');
                          ta.value = text;
                          document.body.appendChild(ta);
                          ta.select();
                          try { document.execCommand('copy'); } catch {}
                          document.body.removeChild(ta);
                        }
                        return;
                      }
                      const plain = htmlToPlainText(body);
                      try {
                        void navigator.clipboard.writeText(plain);
                      } catch {
                        // Fallback
                        const ta = document.createElement('textarea');
                        ta.value = plain;
                        document.body.appendChild(ta);
                        ta.select();
                        try { document.execCommand('copy'); } catch {}
                        document.body.removeChild(ta);
                      }
                    }}
                    style={{
                      padding: '4px 8px',
                      fontSize: 11,
                      borderRadius: 4,
                      border: `1px solid ${colours.blue}`,
                      color: colours.blue,
                      background: '#fff',
                      cursor: 'pointer'
                    }}
                    title={showInlinePreview ? 'Copy preview text' : 'Copy plain text'}
                  >
                    <Icon iconName="Copy" styles={{ root: { fontSize: 12 } }} /> Copy
                  </button>
                  <button
                    onClick={() => setShowInlinePreview(v => !v)}
                    style={{
                      padding: '4px 8px',
                      fontSize: 11,
                      borderRadius: 4,
                      border: `1px solid ${showInlinePreview ? colours.blue : '#e1e5e9'}`,
                      color: showInlinePreview ? colours.blue : '#333',
                      background: '#fff',
                      cursor: 'pointer'
                    }}
                    title="Toggle inline preview"
                  >
                    <Icon iconName="Preview" styles={{ root: { fontSize: 12 } }} /> {showInlinePreview ? 'Back to editor' : 'Preview here'}
                  </button>
                </div>
              </div>
              {!showInlinePreview && (
                <div className="smooth-appear" style={{
                  border: `1px solid ${isDarkMode ? colours.dark.border : '#e1e5e9'}`,
                  borderRadius: 6,
                  background: isDarkMode ? colours.dark.cardBackground : '#fff',
                  padding: 4,
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  {/* Watermark */}
                  <div aria-hidden="true" style={{ position: 'absolute', top: 8, right: 8, width: 150, height: 150, opacity: isDarkMode ? 0.08 : 0.08, backgroundImage: `url(${markUrl})`, backgroundRepeat: 'no-repeat', backgroundPosition: 'top right', backgroundSize: 'contain', pointerEvents: 'none' }} />
                  <InlineEditableArea
                    value={body}
                    onChange={(v) => setBody(v)}
                    edited={false}
                    minHeight={140}
                    externalHighlights={bodyAutoHighlights}
                    allReplacedRanges={allBodyReplacedRanges}
                  />
                </div>
              )}

              {showInlinePreview && (
                <div className="smooth-appear" style={{
                marginTop: 12,
                border: `1px solid ${isDarkMode ? colours.dark.border : '#e1e5e9'}`,
                borderRadius: 8,
                background: isDarkMode ? colours.dark.cardBackground : '#ffffff',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {/* Watermark */}
                <div aria-hidden="true" style={{ position: 'absolute', top: 10, right: 10, width: 160, height: 160, opacity: isDarkMode ? 0.08 : 0.08, backgroundImage: `url(${markUrl})`, backgroundRepeat: 'no-repeat', backgroundPosition: 'top right', backgroundSize: 'contain', pointerEvents: 'none' }} />
                <div style={{
                  padding: '10px 12px',
                  backgroundColor: isDarkMode ? colours.dark.inputBackground : '#f8f9fa',
                  borderBottom: `1px solid ${isDarkMode ? colours.dark.border : '#e1e5e9'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8
                }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: isDarkMode ? colours.dark.text : '#5f6368', letterSpacing: 0.4, textTransform: 'uppercase' }}>Inline Preview</span>
                  <span style={{ marginLeft: 'auto', fontSize: 11, color: '#888' }}>{subject || 'Your Enquiry - Helix Law'}</span>
                </div>
                <div ref={previewRef} style={{ padding: 12 }}>
                  {(() => {
                    // Build preview HTML with substitutions and signature
                    const withoutAutoBlocks = body || '';
                    const userDataLocal = (typeof userData !== 'undefined') ? userData : undefined;
                    const enquiryLocal = (typeof enquiry !== 'undefined') ? enquiry : undefined;
                    const sanitized = withoutAutoBlocks.replace(/\r\n/g, '\n').replace(/\n/g, '<br />');
                    const checkoutPreviewUrl = passcode && enquiryLocal?.ID ? `https://instruct.helix-law.com/pitch/${enquiryLocal.ID}-${passcode}` : '#';
                    const substituted = applyDynamicSubstitutions(
                      sanitized,
                      userDataLocal,
                      enquiryLocal,
                      amount,
                      passcode,
                      checkoutPreviewUrl
                    );
                    const unresolvedBody = findPlaceholders(substituted);
                    const finalBody = convertDoubleBreaksToParagraphs(substituted);
                    const finalHighlighted = highlightPlaceholdersHtml(finalBody);
                    return (
                      <>
                        {unresolvedBody.length > 0 && (
                          <div style={{
                            background: '#fff1f0',
                            border: '1px solid #ffa39e',
                            color: '#a8071a',
                            fontSize: 12,
                            padding: '8px 10px',
                            borderRadius: 6,
                            marginBottom: 10
                          }}>
                            <Icon iconName="Warning" styles={{ root: { fontSize: 12, color: '#a8071a', marginRight: 6 } }} />
                            {unresolvedBody.length} placeholder{unresolvedBody.length === 1 ? '' : 's'} to resolve: {unresolvedBody.join(', ')}
                          </div>
                        )}
                        <EmailSignature bodyHtml={finalHighlighted} userData={userDataLocal} />
                      </>
                    );
                  })()}
                </div>
                <div style={{
                  padding: '10px 12px',
                  backgroundColor: isDarkMode ? colours.dark.inputBackground : '#f8f9fa',
                  borderTop: `1px solid ${isDarkMode ? colours.dark.border : '#e1e5e9'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  flexWrap: 'wrap'
                }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 12, color: isDarkMode ? colours.dark.text : '#3c4043' }}>
                    <input type="checkbox" checked={confirmReady} onChange={e => setConfirmReady(e.currentTarget.checked)} />
                    Everything looks good, ready to proceed
                  </label>
                  <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {(() => {
                      // Determine unresolved placeholders across subject and body after substitution
                      const userDataLocal = (typeof userData !== 'undefined') ? userData : undefined;
                      const enquiryLocal = (typeof enquiry !== 'undefined') ? enquiry : undefined;
                      // Subject is independent; treat it directly
                      const unresolvedSubject = findPlaceholders(subject || '');
                      const sanitized = (body || '').replace(/\r\n/g, '\n').replace(/\n/g, '<br />');
                      const checkoutPreviewUrl = passcode && enquiryLocal?.ID ? `https://instruct.helix-law.com/pitch/${enquiryLocal.ID}-${passcode}` : '#';
                      const substitutedBody = applyDynamicSubstitutions(sanitized, userDataLocal, enquiryLocal, amount, passcode, checkoutPreviewUrl);
                      const unresolvedBody = findPlaceholders(substitutedBody);
                      const unresolvedAny = unresolvedSubject.length > 0 || unresolvedBody.length > 0;
                      const disableDraft = !confirmReady || isDraftConfirmed || unresolvedAny;
                      const disableSend = true; // still disabled in testing mode
                      return (
                        <>
                          <button
                            onClick={() => sendEmail?.()}
                            disabled={disableSend}
                            title={unresolvedAny ? 'Resolve placeholders before sending' : 'Sending is disabled in testing mode. Use Draft Email.'}
                            style={{
                              padding: '6px 12px', borderRadius: 6, border: 'none', cursor: 'not-allowed',
                              background: colours.blue, color: '#fff', fontWeight: 600, opacity: 0.6
                            }}
                          >
                            <Icon iconName="Send" /> Send
                          </button>
                          <button
                            onClick={() => handleDraftEmail?.()}
                            disabled={disableDraft}
                            style={{
                              padding: '6px 12px', borderRadius: 6, border: `1px solid ${isDraftConfirmed ? colours.green : '#e1e5e9'}`,
                              background: isDraftConfirmed ? '#e8f5e8' : '#fff', color: isDraftConfirmed ? colours.green : '#3c4043', fontWeight: 600
                            }}
                            title={isDraftConfirmed ? 'Drafted' : (unresolvedAny ? 'Resolve placeholders before drafting' : 'Draft Email')}
                          >
                            <Icon iconName={isDraftConfirmed ? 'CheckMark' : 'Mail'} /> {isDraftConfirmed ? 'Drafted' : 'Draft Email'}
                          </button>
                        </>
                      );
                    })()}
                    <button
                      onClick={() => {
                        if (!previewRef.current) return;
                        const text = previewRef.current.innerText || '';
                        navigator.clipboard.writeText(text);
                      }}
                      style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #e1e5e9', background: '#fff', color: '#3c4043', fontWeight: 500 }}
                    >
                      <Icon iconName="Copy" /> Copy
                    </button>
                  </div>
                </div>
              </div>
              )}

              {/* Close Email body / Preview container */}
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
                transition: 'all 0.3s ease-in-out',
                position: 'relative'
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
                      padding: '6px 8px',
                      zIndex: 10,
                      whiteSpace: 'normal',
                      maxWidth: 420,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
                    }}>
                      Source confirmation: these notes may be intake rep call notes, a web form message, or an auto‑parsed email.
                    </span>
                  )}
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
                  {/* Floating pin inside notes box */}
                  <button
                    onClick={() => setIsNotesPinned(true)}
                    title="Pin notes"
                    style={{
                      position: 'absolute',
                      top: 8,
                      right: 8,
                      width: 28,
                      height: 28,
                      borderRadius: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isDarkMode ? colours.dark.cardBackground : '#ffffff',
                      border: `1px solid ${isDarkMode ? colours.dark.border : '#e1e5e9'}`,
                      color: isDarkMode ? colours.dark.text : colours.darkBlue,
                      boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                      cursor: 'pointer',
                      zIndex: 2
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = colours.blue;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = isDarkMode ? colours.dark.border : '#e1e5e9';
                    }}
                  >
                    {/* Use a known glyph and strong contrast to ensure visibility */}
                    <Icon iconName="Pinned" styles={{ root: { fontSize: 16, color: colours.blue } }} />
                  </button>
                  {initialNotes}
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
                  {(() => {
                    const amt = parseFloat(amountValue);
                    if (!amountValue || isNaN(amt)) return null;
                    const vatRate = 0.2;
                    const vat = +(amt * vatRate).toFixed(2);
                    const total = +(amt + vat).toFixed(2);
                    const fmt = (n: number) => `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                    return (
                      <div
                        title={`Ex VAT: ${fmt(amt)}  •  VAT (20%): ${fmt(vat)}  •  Total inc VAT: ${fmt(total)}`}
                        style={{
                          marginLeft: 'auto',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          flexWrap: 'wrap',
                          background: isDarkMode ? colours.dark.cardBackground : '#ffffff',
                          border: `1px solid ${isDarkMode ? colours.dark.border : '#e1e5e9'}`,
                          borderRadius: 4,
                          padding: '4px 8px'
                        }}
                      >
                        <span style={{ fontSize: 11, color: isDarkMode ? colours.dark.text : '#666' }}>VAT 20%:</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: isDarkMode ? colours.dark.text : colours.darkBlue }}>{fmt(vat)}</span>
                        <span style={{ opacity: 0.4 }}>·</span>
                        <span style={{ fontSize: 11, color: isDarkMode ? colours.dark.text : '#666' }}>Total inc VAT:</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: colours.blue }}>{fmt(total)}</span>
                      </div>
                    );
                  })()}
                </div>
              </Stack>
            </div>
          </div>

          {/* Template blocks removed in simplified flow */}
        </div>
      </Stack>
    </>
  );
};

export default EditorAndTemplateBlocks;
