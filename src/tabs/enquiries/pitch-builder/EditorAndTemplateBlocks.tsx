import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Stack, Text, Icon, Pivot, PivotItem, TextField } from '@fluentui/react';
import { FaBolt, FaEdit, FaFileAlt, FaEraser, FaInfoCircle, FaThumbtack, FaCalculator, FaExclamationTriangle, FaEnvelope, FaPaperPlane, FaChevronDown, FaChevronUp, FaCopy, FaEye, FaCheck } from 'react-icons/fa';
import DealCapture from './DealCapture';
import { colours } from '../../../app/styles/colours';
import { TemplateBlock } from '../../../app/customisation/ProductionTemplateBlocks';
import SnippetEditPopover from './SnippetEditPopover';
import { placeholderSuggestions } from '../../../app/customisation/InsertSuggestions';
import { wrapInsertPlaceholders } from './emailUtils';
import { SCENARIOS, SCENARIOS_VERSION } from './scenarios';
import EmailSignature from '../EmailSignature';
import { applyDynamicSubstitutions, convertDoubleBreaksToParagraphs } from './emailUtils';
import markUrl from '../../../assets/dark blue mark.svg';

// CSS animations for processing status icons
const animationStyles = `
@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { 
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.15);
    transform: scale(1); 
  }
  50% { 
    box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.08);
    transform: scale(1.02); 
  }
}

@keyframes morphToCheck {
  0% { 
    opacity: 1;
    transform: scale(1) rotate(0deg);
  }
  30% { 
    opacity: 0.3;
    transform: scale(0.8) rotate(180deg);
  }
  60% { 
    opacity: 0.3;
    transform: scale(0.8) rotate(270deg);
  }
  100% { 
    opacity: 1;
    transform: scale(1) rotate(360deg);
  }
}

@keyframes subtleFloat {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-1px); }
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
}
`;

// Inject animations into head
if (typeof document !== 'undefined' && !document.getElementById('processing-animations')) {
  const style = document.createElement('style');
  style.id = 'processing-animations';
  style.textContent = animationStyles;
  document.head.appendChild(style);
}

// NOTE: renderWithPlaceholders was removed; we use a simple highlighter overlay instead.
// Escape HTML for safe injection in the overlay layer
function escapeHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Remove visual divider lines made of dashes from text (used to hide auto-block separators in previews)
function stripDashDividers(text: string): string {
  return text
    .split('\n')
    .filter((line) => !/^\s*[-–—]{3,}\s*$/.test(line))
    .join('\n');
}

// Convert very basic HTML to plain text for textarea defaults and copy actions
function htmlToPlainText(html: string): string {
  const withBreaks = html
    .replace(/\r\n/g, '\n')
    .replace(/<br\s*\/?>(\s*)/gi, '\n')
    .replace(/<\/(p|div)>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<\/(ul|ol)>/gi, '\n');
  const withoutTags = withBreaks.replace(/<[^>]+>/g, '');
  return withoutTags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

// Removed local fallback passcode generation: must use ONLY server-issued passcode.

// Find placeholder tokens like [TOKEN]
function findPlaceholders(text: string): string[] {
  const matches = text.match(/\[[^\]]+\]/g);
  return matches ? matches : [];
}

// Wrap placeholders in red styling for preview HTML
function highlightPlaceholdersHtml(html: string): string {
  return html.replace(/\[[^\]]+\]/g, (m) => {
    return `<span style="color:#D65541;font-weight:700;">${escapeHtml(m)}</span>`;
  });
}

// Custom hook: auto-insert [RATE] and [ROLE] values and report inserted ranges
function useAutoInsertRateRole(
  body: string,
  setBody: (v: string) => void,
  userData?: any,
  setExternalHighlights?: (ranges: { start: number; end: number }[]) => void
) {
  const lastAppliedKeyRef = useRef<string>('');
  const lastProcessedBodyRef = useRef<string>('');

  useEffect(() => {
    const roleRaw = userData?.[0]?.['Role'];
    const rateRaw = userData?.[0]?.['Rate'];

    const roleStr = roleRaw == null ? '' : String(roleRaw).trim();
    const parseRate = (val: unknown): number | null => {
      if (val == null) return null;
      if (typeof val === 'number') return isFinite(val) ? val : null;
      const cleaned = String(val).replace(/[^0-9.\-]/g, '').trim();
      if (!cleaned) return null;
      const n = Number(cleaned);
      return isFinite(n) ? n : null;
    };
    const rateNumber = parseRate(rateRaw);
    const formatRateGBP = (n: number) =>
      `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} + VAT`;

    if (!body || (!roleStr && rateNumber == null)) {
      // No changes; clear any prior transient highlights
      setExternalHighlights?.([]);
      return;
    }

    const key = `${roleStr}|${rateNumber ?? ''}|${body}`;
    if (lastAppliedKeyRef.current === key && lastProcessedBodyRef.current) return;

    const TOKEN_LEN = (t: 'RATE' | 'ROLE') => `[${t}]`.length;
    let newBody = body;
    const ranges: { start: number; end: number }[] = [];
    const regex = /\[(RATE|ROLE)\]/gi;
    let m: RegExpExecArray | null;
    let shift = 0;

    while ((m = regex.exec(body)) !== null) {
      const token = (m[1] as string).toUpperCase() as 'RATE' | 'ROLE';
      const originalStart = m.index;
      const start = originalStart + shift;
      const end = start + TOKEN_LEN(token);
      let replacement: string | null = null;
      if (token === 'RATE' && rateNumber != null) replacement = formatRateGBP(rateNumber);
      else if (token === 'ROLE' && roleStr) replacement = roleStr;
      if (replacement != null) {
        newBody = newBody.slice(0, start) + replacement + newBody.slice(end);
        ranges.push({ start, end: start + replacement.length });
        shift += replacement.length - TOKEN_LEN(token);
      }
    }

    if (newBody !== body) {
      lastAppliedKeyRef.current = key;
      lastProcessedBodyRef.current = newBody;
      setBody(newBody);
      if (ranges.length) setExternalHighlights?.(ranges);
    } else {
      lastAppliedKeyRef.current = key;
      lastProcessedBodyRef.current = body;
      if (ranges.length === 0) setExternalHighlights?.([]);
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
  passcode?: string;
  enquiry?: any;
}

interface UndoRedoState {
  history: string[];
  currentIndex: number;
}

const InlineEditableArea: React.FC<InlineEditableAreaProps> = ({ value, onChange, edited, minHeight = 48, externalHighlights, allReplacedRanges, passcode, enquiry }) => {
  const taRef = useRef<HTMLTextAreaElement | null>(null);
  const preRef = useRef<HTMLPreElement | null>(null);
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
    // Sync by reference change only to keep dependency array stable across renders
    setSyncedExternalRanges((externalHighlights || []).slice());
  }, [externalHighlights]);
  useEffect(() => {
    // Sync by reference change only to keep dependency array stable across renders
    setSyncedPersistentRanges((allReplacedRanges || []).slice());
  }, [allReplacedRanges]);

  // Sync external value changes (e.g. selecting a different template or auto-inserted placeholders)
  useEffect(() => {
    // Only reset undo/redo state and highlights if this is NOT an internal update (i.e., not from user typing or undo/redo)
    if (!internalUpdateRef.current) {
      setUndoRedoState({ history: [value], currentIndex: 0 });
      setHighlightRanges([]);
      activeReplacementRangeRef.current = null;
      replacingPlaceholderRef.current = null;
      previousValueRef.current = value;
    }
    // Always clear the internal update flag after effect
    internalUpdateRef.current = false;
  }, [value]);

  // Note: Do not globally reset internalUpdateRef here to avoid race conditions with the [value] sync effect.

  // Auto resize
  useEffect(() => {
    const ta = taRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    }
  }, [value]);

  // Sync computed textarea styles to the overlay <pre> so highlights align exactly
  const syncPreStyles = useCallback(() => {
    const ta = taRef.current;
    const pre = preRef.current;
    if (!ta || !pre) return;
    try {
      const s = window.getComputedStyle(ta);
      const propsMap: { [k: string]: string } = {
        fontFamily: 'font-family',
        fontSize: 'font-size',
        fontWeight: 'font-weight',
        fontStyle: 'font-style',
        lineHeight: 'line-height',
        letterSpacing: 'letter-spacing',
        paddingTop: 'padding-top',
        paddingRight: 'padding-right',
        paddingBottom: 'padding-bottom',
        paddingLeft: 'padding-left',
        boxSizing: 'box-sizing',
        textRendering: 'text-rendering',
        textTransform: 'text-transform'
      };
      Object.keys(propsMap).forEach((p) => {
        const cssName = propsMap[p];
        const val = s.getPropertyValue(cssName);
        if (val) (pre.style as any)[p] = val;
      });
      // Ensure same white-space and wrapping behaviour
      pre.style.whiteSpace = 'pre-wrap';
      pre.style.wordBreak = 'break-word';
    } catch (err) {
      // swallow errors silently
    }
  }, []);

  useLayoutEffect(() => {
    syncPreStyles();
  }, [value, syncPreStyles]);

  useEffect(() => {
    let raf = 0 as number | null;
    const onResize = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => syncPreStyles());
    };
    window.addEventListener('resize', onResize);

    // Re-sync when web fonts finish loading
    const fonts = (document as any).fonts;
    const onFontsReady = () => syncPreStyles();
    if (fonts && typeof fonts.ready !== 'undefined') {
      // fonts.ready is a Promise
      (fonts as any).ready.then(onFontsReady).catch(() => {});
      try {
        fonts.addEventListener && fonts.addEventListener('loadingdone', onFontsReady);
      } catch {}
    }

    // ResizeObserver on wrapper to catch layout changes
    let ro: ResizeObserver | null = null;
    try {
        if (wrapperRef.current && (window as any).ResizeObserver) {
        ro = new (window as any).ResizeObserver(onResize);
        if (ro && wrapperRef.current) ro.observe(wrapperRef.current);
      }
    } catch {}

    return () => {
      window.removeEventListener('resize', onResize);
      try { fonts && fonts.removeEventListener && fonts.removeEventListener('loadingdone', onFontsReady); } catch {}
      if (ro && wrapperRef.current) ro.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, [syncPreStyles]);

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

  // Cleanup pending debounce on unmount to avoid late updates overriding current input
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
  lineHeight: 1,
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
            <FaEdit style={{ fontSize: 12, transform: 'scaleX(-1)' }} />
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
            <FaEdit style={{ fontSize: 12 }} />
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
            title="Clear all (Ctrl+Backspace)"
          >
            <FaEraser style={{ fontSize: 12 }} />
          </button>
        </div>
      )}
      
    <pre
        ref={preRef}
        aria-hidden="true"
        style={{
          margin: 0,
          padding: '4px 6px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
      font: 'inherit',
  lineHeight: 1,
      color: '#222',
          pointerEvents: 'none',
          visibility: 'visible'
        }}
        dangerouslySetInnerHTML={{ __html: (() => {
          // Detect special INSTRUCT_LINK markers ([[INSTRUCT_LINK::href]]) first so we can render the URL in-editor.
          const linkRegex = /\[\[INSTRUCT_LINK::([^\]]+)\]\]/g;
          const links: { start: number; end: number; href: string }[] = [];
          let lm: RegExpExecArray | null;
          while ((lm = linkRegex.exec(value)) !== null) {
            links.push({ start: lm.index, end: lm.index + lm[0].length, href: lm[1] });
          }

          // Simple placeholder highlighting - only show complete [TOKEN] as blue (skip those inside INSTRUCT_LINK ranges)
          const placeholders: { start: number; end: number }[] = [];
          const regex = /\[[^\]]+\]/g;
          let match: RegExpExecArray | null;
          while ((match = regex.exec(value)) !== null) {
            const start = match.index;
            const end = match.index + match[0].length;
            // Skip if this match falls inside any INSTRUCT_LINK range
            const insideLink = links.some(l => start >= l.start && end <= l.end);
            if (!insideLink) placeholders.push({ start, end });
          }
          
          const markers: { start: number; end: number; type: 'placeholder' | 'edited' | 'instructLink'; href?: string }[] = [];
          placeholders.forEach(p => markers.push({ ...p, type: 'placeholder' }));
          links.forEach(l => markers.push({ start: l.start, end: l.end, type: 'instructLink', href: l.href }));
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
            if (to > cursor) {
              const chunk = value.slice(cursor, to);
              // Split on newlines to style leading numeric markers per line
              let idx = 0;
              while (idx <= chunk.length) {
                const nl = chunk.indexOf('\n', idx);
                const isLast = nl === -1;
                const line = chunk.slice(idx, isLast ? chunk.length : nl);
                // Match: start spaces + number + dot + at least one space
                const m = line.match(/^(\s*)(\d+)\.(\s+)/);
                if (m) {
                  const pre = m[1] ?? '';
                  const num = m[2] ?? '';
                  const after = m[3] ?? '';
                  const rest = line.slice(m[0].length);
                  // Color only; avoid bold to preserve exact text metrics
                  html += `${escapeHtml(pre)}<span style="color:#D65541;">${escapeHtml(num + '.')}<\/span>${escapeHtml(after + rest)}`;
                } else {
                  html += escapeHtml(line);
                }
                if (!isLast) html += '\n';
                if (isLast) break;
                idx = nl + 1;
              }
            }
            cursor = to;
          };
          
          markers.forEach(mark => {
            if (mark.start < cursor) return; // skip overlaps
            pushPlain(mark.start);
            const segment = value.slice(mark.start, mark.end);
              if (mark.type === 'placeholder') {
              // Render the original token (including brackets) so the overlay text width exactly matches the textarea.
              // Use outline (doesn't affect layout) for dashed box appearance and avoid padding which would change width.
              html += `<span style="display:inline;background:#e0f0ff;outline:1px dashed #8bbbe8;padding:0;margin:0;border-radius:3px;font-style:inherit;color:#6b7280;font-weight:400">${escapeHtml(segment)}</span>`;
            } else if (mark.type === 'instructLink') {
              // Render the literal marker text so overlay width exactly matches textarea content
              // Style it to be recognizable without altering layout
              html += `<span style="color:#174ea6;text-decoration:underline">${escapeHtml(segment)}</span>`;
            } else {
              // Updated edited highlight: subtle green background only (no border/box), accessible text color
              html += `<span style="display:inline;background:#e9f9f1;padding:0;margin:0;border:none;font-style:inherit;color:#0b3d2c">${escapeHtml(segment)}</span>`;
            }
            cursor = mark.end;
          });
          pushPlain(value.length);
          // Keep markers literal in the overlay to preserve spacing/line wraps
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
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      width: '100%',
      height: '100%',
      resize: 'none',
      background: 'transparent',
      color: 'transparent', // hide raw text, rely on highlighted layer
      caretColor: '#222',
      font: 'inherit',
  lineHeight: 1,
      border: 'none',
      padding: '4px 6px',
      outline: 'none',
      whiteSpace: 'pre-wrap',
      wordBreak: 'break-word',
      overflow: 'hidden',
      boxSizing: 'border-box'
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
  showDealCapture?: boolean;
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
  // Email recipient props for send confirmation
  to?: string;
  cc?: string;
  bcc?: string;
  feeEarnerEmail?: string;
  // Inline status feedback
  dealCreationInProgress?: boolean;
  dealStatus?: 'idle' | 'processing' | 'ready' | 'error';
  emailStatus?: 'idle' | 'processing' | 'sent' | 'error';
  emailMessage?: string;
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
  showDealCapture = true,
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
  isDraftConfirmed,
  // Email recipient props for send confirmation
  to,
  cc,
  bcc,
  feeEarnerEmail,
  // Inline status feedback
  dealCreationInProgress,
  dealStatus,
  emailStatus,
  emailMessage
}) => {
  // State for removed blocks
  const [removedBlocks, setRemovedBlocks] = useState<{ [key: string]: boolean }>({});
  // Local editable contents per block
  const [blockContents, setBlockContents] = useState<{ [key: string]: string }>({});

  // Deal capture state
  const [scopeDescription, setScopeDescription] = useState(initialScopeDescription || '');
  // Default amount now 1500 if not supplied
  const [amountValue, setAmountValue] = useState(amount && amount.trim() !== '' ? amount : '1500');
  const [amountError, setAmountError] = useState<string | null>(null);
  // Removed PIC placeholder insertion feature per user request
  const [isNotesPinned, setIsNotesPinned] = useState(false);
  const [showSubjectHint, setShowSubjectHint] = useState(false);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('');
  const [isTemplatesCollapsed, setIsTemplatesCollapsed] = useState(false); // Start expanded for immediate selection
  const [showInlinePreview, setShowInlinePreview] = useState(false);
  // Email confirmation modal state
  const [showSendConfirmModal, setShowSendConfirmModal] = useState(false);
  const [confirmReady, setConfirmReady] = useState(false);
  const previewRef = useRef<HTMLDivElement | null>(null);
  // Copy feedback flags
  const [copiedToolbar, setCopiedToolbar] = useState(false);
  const [copiedFooter, setCopiedFooter] = useState(false);
  // Modal validation error
  const [modalError, setModalError] = useState<string | null>(null);
  // Track in-modal sending to disable actions and show progress inline
  const [modalSending, setModalSending] = useState<boolean>(false);
  // HMR tick to force re-render when scenarios module hot-reloads
  const [hmrTick, setHmrTick] = useState(0);
  // Prevent Draft visual state from being triggered by Send action
  const [hasSentEmail, setHasSentEmail] = useState(false);
  // Helper: apply simple [RATE]/[ROLE] substitutions and dynamic tokens ([InstructLink])
  const applyRateRolePlaceholders = useCallback((text: string) => {
    const u: any = Array.isArray(userData) ? (userData?.[0] ?? null) : userData;
    if (!u || !text) return text;
    const roleRaw = (u.Role ?? u.role ?? u.RoleName ?? u.roleName);
    const rateRaw = (u.Rate ?? u.rate ?? u.HourlyRate ?? u.hourlyRate);
    const roleStr = roleRaw == null ? '' : String(roleRaw).trim();
    const parseRate = (val: unknown): number | null => {
      if (val == null) return null;
      if (typeof val === 'number') return isFinite(val) ? val : null;
      const cleaned = String(val).replace(/[^0-9.\-]/g, '').trim();
      if (!cleaned) return null;
      const n = Number(cleaned);
      return isFinite(n) ? n : null;
    };
    const rateNumber = parseRate(rateRaw);
    const formatRateGBP = (n: number) => `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} + VAT`;
    let out = text;
    if (rateNumber != null) out = out.replace(/\[RATE\]/gi, formatRateGBP(rateNumber));
    if (roleStr) out = out.replace(/\[ROLE\]/gi, roleStr);
    // Also apply dynamic substitutions so [InstructLink] renders in the editor
    // For editor, compute an effective passcode (use provided passcode or a deterministic local one derived from enquiry ID)
  const effectivePass = passcode || undefined; // no fallback
    let substituted = applyDynamicSubstitutions(
      out,
      userData,
      enquiry,
      amount,
      effectivePass
    );
    // Replace the HTML anchor with a React anchor for in-editor display
    substituted = substituted.replace(
      /<a href="([^"]*)"[^>]*>Instruct Helix Law<\/a>/gi,
      (_match, href) => {
        // Use a unique marker for React rendering
        return `[[INSTRUCT_LINK::${href}]]`;
      }
    );
    return substituted;
  }, [userData, enquiry, amount, passcode]);
  // Track the last body we injected from a scenario so we can safely refresh on scenario edits
  const lastScenarioBodyRef = useRef<string>('');
  
  // Track the last passcode so we can re-process the editor content when it becomes available
  const lastPasscodeRef = useRef<string>('');

  // When passcode becomes available, re-process the editor content to update [InstructLink] tokens
  useEffect(() => {
  const effective = passcode || undefined; // no fallback
    if (effective && effective !== lastPasscodeRef.current && body) {
      const processedBody = applyRateRolePlaceholders(body);
      if (processedBody !== body) {
        setBody(processedBody);
      }
      lastPasscodeRef.current = effective;
    }
  }, [passcode, enquiry, body, applyRateRolePlaceholders, setBody]);

  // Accept hot updates to the scenarios module (CRA/Webpack HMR) and trigger a lightweight re-render
  useEffect(() => {
    const anyModule: any = module as any;
    if (anyModule && anyModule.hot) {
      const handler = () => setHmrTick((t) => t + 1);
      try {
        anyModule.hot.accept('./scenarios', handler);
      } catch {
        // no-op if HMR not available
      }
    }
  }, []);
  // Refresh selected scenario body when scenario definitions hot-update
  // Removed this effect as it was causing constant resets due to SCENARIOS_VERSION changing on every import
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
            <FaInfoCircle style={{ fontSize: 12 }} />
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
          <FaThumbtack style={{ fontSize: 14, color: isDarkMode ? colours.dark.text : colours.darkBlue }} />
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
  const [allBodyReplacedRanges, setAllBodyReplacedRanges] = useState<{ start: number; end: number }[]>([]);
  
  // Auto-insert handler: replace the persistent green highlights with the new set from auto-insert
  // This prevents accumulation/ghosting across scenario/template switches and ensures first-click visibility.
  const handleAutoInsertHighlights = useCallback((ranges: { start: number; end: number }[]) => {
    setAllBodyReplacedRanges(ranges.slice());
  }, []);
  
  useAutoInsertRateRole(body, setBody, userData, handleAutoInsertHighlights);
  // Also apply to subject so switching templates gets replacements too
  useAutoInsertRateRole(subject, setSubject, userData);

  return (
    <>
      {/* Design System CSS Variables */}
      <style>{`
        :root {
          --helix-navy: #061733;
          --helix-blue: #3690CE;
          --helix-grey: #F4F4F6;
          --helix-border: #E3E8EF;
          --helix-success: #10B981;
          --helix-warning: #F59E0B;
          --helix-error: #EF4444;
          --white: #FFFFFF;
          
          /* Raleway as default font family */
          --helix-font: 'Raleway', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        
        /* Apply Raleway to most elements in this component */
        .helix-professional-content * {
          font-family: var(--helix-font) !important;
        }
        /* EXCEPTION: Fluent UI font icons must keep their icon font family */
        .helix-professional-content .ms-Icon,
        .helix-professional-content i.ms-Icon,
        .helix-professional-content span.ms-Icon,
        .helix-professional-content [class*="ms-Icon"] {
          font-family: 'FabricMDL2Icons','Segoe MDL2 Assets' !important;
          speak: none;
          font-weight: normal;
          font-style: normal;
        }
        
        /* Custom text selection styling - softer blue for brand consistency */
        .helix-professional-content *::selection {
          background-color: rgba(54, 144, 206, 0.15);
          color: #1E293B;
        }
        
        .helix-professional-content *::-moz-selection {
          background-color: rgba(54, 144, 206, 0.15);
          color: #1E293B;
        }

        /* Keyframe animation for radio button check */
        @keyframes radio-check {
          from {
            transform: translate(-50%, -50%) scale(0);
          }
          to {
            transform: translate(-50%, -50%) scale(1);
          }
        }

        @keyframes cascadeIn {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
          --grey-50: #F9FAFB;
          --grey-100: #F3F4F6;
          --grey-200: #E5E7EB;
          --grey-300: #D1D5DB;
          --grey-400: #9CA3AF;
          --grey-500: #6B7280;
          --grey-600: #4B5563;
          --grey-700: #374151;
          --grey-800: #1F2937;
          --grey-900: #111827;
          --font-primary: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
          --text-xs: 0.75rem;
          --text-sm: 0.875rem;
          --text-base: 1rem;
          --text-lg: 1.125rem;
          --text-xl: 1.25rem;
          --weight-normal: 400;
          --weight-medium: 500;
          --weight-semibold: 600;
          --weight-bold: 700;
          --leading-tight: 1.25;
          --leading-normal: 1.5;
          --leading-relaxed: 1.625;
          --space-1: 0.25rem;
          --space-2: 0.5rem;
          --space-3: 0.75rem;
          --space-4: 1rem;
          --space-5: 1.25rem;
          --space-6: 1.5rem;
          --space-8: 2rem;
          --space-12: 3rem;
          --radius-base: 0.25rem;
          --radius-md: 0.375rem;
          --radius-lg: 0.5rem;
          --radius-xl: 0.75rem;
          --shadow-xs: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
          --shadow-sm: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
          --shadow-base: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
          --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
        }

        .helix-professional-content {
          padding: var(--space-8);
        }

        .helix-professional-input {
          font-family: var(--font-primary);
          border-radius: var(--radius-lg);
          border: 1px solid var(--grey-300);
          padding: var(--space-3) var(--space-4);
          font-size: var(--text-sm);
          background-color: var(--white);
          transition: var(--transition-base);
        }

        .helix-professional-input:focus {
          border-color: var(--helix-blue);
          outline: none;
          box-shadow: 0 0 0 3px rgba(54, 144, 206, 0.1);
        }

        .helix-professional-button {
          padding: var(--space-2) var(--space-4);
          border-radius: var(--radius-lg);
          border: 1px solid var(--grey-300);
          background-color: var(--white);
          color: var(--grey-700);
          cursor: pointer;
          font-size: var(--text-sm);
          font-weight: var(--weight-medium);
          transition: var(--transition-base);
          font-family: var(--font-primary);
        }

        .helix-professional-button:hover {
          border-color: var(--helix-blue);
          background-color: var(--grey-50);
        }

        .helix-professional-button-primary {
          background-color: var(--helix-blue);
          color: var(--white);
          border: none;
        }

        .helix-professional-button-primary:hover {
          background-color: #2980b9;
        }

        .helix-professional-label {
          font-size: var(--text-sm);
          font-weight: var(--weight-medium);
          color: var(--helix-navy);
          margin-bottom: var(--space-2);
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
      `}</style>

      {/* Global sticky notes portal */}
      <GlobalStickyNotes />
      
      {/* Content */}
      <div className="helix-professional-content">
      
      <Stack tokens={{ childrenGap: 8 }} styles={{ root: { marginTop: 0 } }}>
        {/* Direct content without Email Composer container */}
        <div style={{ padding: '0 0 16px 0' }}>
          {/* Scenario Picker (minimal, non-breaking) */}
          <div style={{
            background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
            borderRadius: '16px',
            padding: '24px',
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.06)',
            marginBottom: 20,
            fontFamily: 'Raleway, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
            position: 'relative'
          }}>
            {/* Subtle accent border */}
            <div style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '40px',
              height: '2px',
              background: 'linear-gradient(90deg, #3690CE, #60A5FA)',
              borderRadius: '0 0 6px 6px'
            }}></div>
            
            <div 
              style={{
                fontSize: '16px',
                fontWeight: 600,
                color: '#0F172A',
                marginBottom: isTemplatesCollapsed ? 0 : '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '10px',
                border: '1px solid rgba(54, 144, 206, 0.1)',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => setIsTemplatesCollapsed(!isTemplatesCollapsed)}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)';
                e.currentTarget.style.borderColor = 'rgba(54, 144, 206, 0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.7)';
                e.currentTarget.style.borderColor = 'rgba(54, 144, 206, 0.1)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FaBolt style={{ fontSize: 14, color: '#3690CE' }} />
                Quick Templates
                {isTemplatesCollapsed && selectedScenarioId && (
                  <span style={{ 
                    fontSize: '13px', 
                    fontWeight: 400, 
                    color: '#64748B',
                    marginLeft: '8px'
                  }}>
                    • {SCENARIOS.find(s => s.id === selectedScenarioId)?.name || 'Selected'}
                  </span>
                )}
              </div>
              {isTemplatesCollapsed ? 
                <FaChevronDown style={{ fontSize: 12, color: '#64748B' }} /> : 
                <FaChevronUp style={{ fontSize: 12, color: '#64748B' }} />
              }
            </div>
            
            {!isTemplatesCollapsed && (
              <div style={{ 
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gridTemplateRows: 'repeat(2, 1fr)',
                gap: '16px',
                padding: '16px',
                background: 'rgba(255, 255, 255, 0.5)',
                borderRadius: '12px',
                border: '1px solid rgba(203, 213, 225, 0.6)',
                animation: 'cascadeIn 0.3s ease-out',
                opacity: 1,
                transform: 'translateY(0)'
              }}>
                {SCENARIOS.map((s, index) => (
                  <button
                    key={s.id}
                    type="button"
                    className={`premium-professional-choice-card ${selectedScenarioId === s.id ? 'active' : ''}`}
                    aria-pressed={selectedScenarioId === s.id}
                    role="radio"
                    onClick={() => {
                      setSelectedScenarioId(s.id);
                      setIsTemplatesCollapsed(true); // Collapse after selection
          // Prefill only the body; subject is kept independent. Prepend a dynamic salutation.
                      const raw = stripDashDividers(s.body);
                      const greetingName = (() => {
                        const e = enquiry as any;
                        const first = e?.First_Name ?? e?.first_name ?? e?.FirstName ?? e?.firstName ?? e?.Name?.split?.(' ')?.[0] ?? e?.ContactName?.split?.(' ')?.[0] ?? '';
                        const name = String(first || '').trim();
                        return name.length > 0 ? name : 'there';
                      })();
                      const salutation = `Dear ${greetingName},\n\n`;
                      const composed = salutation + raw;
                      const projected = applyRateRolePlaceholders(composed);
                      lastScenarioBodyRef.current = projected;
                      setBody(projected);
                      // Optionally seed first block editable content to keep edit UX consistent
                      const firstBlock = templateBlocks[0];
                      if (firstBlock) {
                        setBlockContents(prev => ({ ...prev, [firstBlock.title]: projected }));
                      }
                    }}
                    style={{
                      position: 'relative',
                      background: '#ffffff',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '20px 24px',
                      cursor: 'pointer',
                      transition: 'all 0.25s ease',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '20px',
                      textAlign: 'left',
                      minHeight: '100px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                      transform: 'translateY(0)',
                      animation: `cascadeIn 0.4s ease-out ${index * 0.1}s both`,
                      opacity: 0,
                      animationFillMode: 'forwards',
                      overflow: 'hidden',
                      fontFamily: 'inherit'
                    }}
                    onMouseEnter={(e) => {
                      if (selectedScenarioId !== s.id) {
                        e.currentTarget.style.borderColor = '#061733';
                        e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.12)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.background = '#fafbfc';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedScenarioId !== s.id) {
                        e.currentTarget.style.borderColor = '#e5e7eb';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.background = '#ffffff';
                      }
                    }}
                  >
                    {selectedScenarioId === s.id && (
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        height: '3px',
                        background: '#061733',
                        borderRadius: '6px 6px 0 0'
                      }}></div>
                    )}
                    
                    <div className="premium-choice-content" style={{
                      flex: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}>
                      <div className="premium-choice-title" style={{
                        fontSize: '16px',
                        fontWeight: 600,
                        color: '#1E293B',
                        lineHeight: '1.3',
                        marginBottom: '6px'
                      }}>
                        {s.name}
                      </div>
                      <div className="premium-choice-description" style={{
                        fontSize: '14px',
                        color: '#6b7280',
                        lineHeight: '1.4',
                        fontWeight: 400
                      }}>
                        {s.name === 'Before call — Call' ? 'Send pitch email before scheduling consultation call' :
                         s.name === 'Before call — No call' ? 'Send pitch email without scheduling a call' :
                         s.name === 'After call — Probably can\'t assist' ? 'Polite follow-up when unable to take the case' :
                         s.name === 'After call — Want the instruction' ? 'Formal proposal after successful consultation' :
                         'Standard professional response template'}
                      </div>
                    </div>
                    
                    <div className="premium-choice-indicator" style={{
                      flexShrink: 0,
                      marginTop: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <div className="premium-choice-radio" style={{
                        width: '20px',
                        height: '20px',
                        border: '2px solid #d1d5db',
                        borderRadius: '50%',
                        background: '#ffffff',
                        position: 'relative',
                        transition: 'all 0.25s ease',
                        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)',
                        borderColor: selectedScenarioId === s.id ? '#061733' : '#d1d5db',
                        backgroundColor: selectedScenarioId === s.id ? '#061733' : '#ffffff'
                      }}>
                        {selectedScenarioId === s.id && (
                          <div style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            width: '5px',
                            height: '5px',
                            background: '#ffffff',
                            borderRadius: '50%',
                            transform: 'translate(-50%, -50%)',
                            animation: 'radio-check 0.25s ease 0.1s forwards'
                          }}></div>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            </div>
            {/* Scenario hot-update handled via top-level useEffect */}
            
            {/* Only show the rest of the form after a template is selected */}
            {selectedScenarioId && (
            <div style={{
              animation: 'cascadeIn 0.3s ease-out',
              opacity: 1,
              transform: 'translateY(0)'
            }}>
            
            {/* Subject Line - Primary Focus */}
            <div style={{
              background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
              marginBottom: initialNotes ? 20 : 0,
              fontFamily: 'Raleway, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#1E293B',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  padding: '6px',
                  background: 'rgba(54, 144, 206, 0.1)',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center'
                }}>
                  <FaEdit style={{ fontSize: 12, color: '#3690CE' }} />
                </div>
                Subject Line
              </div>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Craft your email subject based on the context below..."
                style={{
                  width: '100%',
                  padding: '14px 18px',
                  fontSize: '14px',
                  fontWeight: 400,
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  backgroundColor: '#FFFFFF',
                  color: '#0F172A',
                  outline: 'none',
                  transition: 'all 0.2s ease',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  fontFamily: 'inherit',
                  boxSizing: 'border-box'
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#3690CE';
                  e.target.style.borderWidth = '2px';
                  e.target.style.boxShadow = '0 0 0 3px rgba(54, 144, 206, 0.1), 0 4px 6px rgba(0,0,0,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#CBD5E1';
                  e.target.style.borderWidth = '1px';
                  e.target.style.boxShadow = '0 1px 3px rgba(0,0,0,0.1)';
                }}
              />
            </div>

            {/* Default subject is set via a top-level effect to respect Hooks rules */}

            {/* Email body / Preview (swap in place) */}
            <div style={{
              background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
              borderRadius: '12px',
              padding: '20px',
              border: '1px solid #E2E8F0',
              boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.06)',
              marginBottom: 18,
              fontFamily: 'Raleway, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            }}>
              <div style={{
                fontSize: '14px',
                fontWeight: 600,
                color: '#1E293B',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                justifyContent: 'space-between',
                padding: '8px 16px',
                background: 'rgba(255, 255, 255, 0.7)',
                borderRadius: '10px',
                border: '1px solid rgba(54, 144, 206, 0.1)'
              }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <div style={{
                    padding: '6px',
                    background: 'rgba(54, 144, 206, 0.1)',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center'
                  }}>
                    <FaFileAlt style={{ fontSize: 12, color: '#3690CE' }} />
                  </div>
                  {showInlinePreview ? 'Preview' : 'Email body'}
                </span>
                <div style={{ display: 'inline-flex', gap: 8 }}>
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
                        setCopiedToolbar(true);
                        setTimeout(() => setCopiedToolbar(false), 1200);
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
                      setCopiedToolbar(true);
                      setTimeout(() => setCopiedToolbar(false), 1200);
                    }}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: copiedToolbar ? '1px solid #16a34a' : '1px solid #3690CE',
                      color: copiedToolbar ? '#166534' : '#3690CE',
                      background: copiedToolbar ? '#e8f5e8' : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontWeight: 500,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      boxShadow: copiedToolbar ? '0 2px 4px rgba(22, 163, 74, 0.2)' : '0 1px 3px rgba(54, 144, 206, 0.15)'
                    }}
                    onMouseEnter={(e) => {
                      if (!copiedToolbar) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #EBF8FF 0%, #DBEAFE 100%)';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 6px rgba(54, 144, 206, 0.2)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!copiedToolbar) {
                        e.currentTarget.style.background = 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(54, 144, 206, 0.15)';
                      }
                    }}
                    title={showInlinePreview ? 'Copy preview text' : 'Copy plain text'}
                  >
                    {copiedToolbar ? (
                      <>
                        <FaCheck style={{ fontSize: 12 }} /> Copied
                      </>
                    ) : (
                      <>
                        <FaCopy style={{ fontSize: 12 }} /> Copy
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowInlinePreview(v => !v)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      borderRadius: '8px',
                      border: showInlinePreview ? '1px solid #CBD5E1' : '1px solid #D65541',
                      color: showInlinePreview ? '#64748B' : '#ffffff',
                      background: showInlinePreview
                        ? 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)'
                        : `linear-gradient(135deg, ${colours.red} 0%, #b04434 100%)`,
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontWeight: showInlinePreview ? 600 : 700,
                      transition: 'all 0.2s ease',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      boxShadow: showInlinePreview ? '0 1px 3px rgba(0, 0, 0, 0.08)' : '0 2px 4px rgba(214, 85, 65, 0.25)'
                    }}
                    onMouseEnter={(e) => {
                      if (showInlinePreview) {
                        e.currentTarget.style.borderColor = '#94A3B8';
                        e.currentTarget.style.color = '#475569';
                        e.currentTarget.style.background = 'linear-gradient(135deg, #F0F4F8 0%, #EFF6FF 100%)';
                      } else {
                        e.currentTarget.style.background = `linear-gradient(135deg, #c24a39 0%, #9e3d30 100%)`;
                        e.currentTarget.style.boxShadow = '0 3px 6px rgba(214, 85, 65, 0.30)';
                      }
                      e.currentTarget.style.transform = 'translateY(-1px)';
                    }}
                    onMouseLeave={(e) => {
                      if (showInlinePreview) {
                        e.currentTarget.style.borderColor = '#CBD5E1';
                        e.currentTarget.style.color = '#64748B';
                        e.currentTarget.style.background = 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)';
                        e.currentTarget.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.08)';
                      } else {
                        e.currentTarget.style.background = `linear-gradient(135deg, ${colours.red} 0%, #b04434 100%)`;
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(214, 85, 65, 0.25)';
                      }
                      e.currentTarget.style.transform = 'translateY(0)';
                    }}
                    title="Toggle inline preview"
                  >
                    <FaEye style={{ fontSize: 12 }} /> {showInlinePreview ? 'Back to editor' : 'Preview'}
                  </button>
                </div>
              </div>
              {!showInlinePreview && (
                <div className="smooth-appear" style={{
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #FFFFFF 0%, #FEFEFE 100%)',
                  padding: '6px',
                  position: 'relative',
                  overflow: 'hidden',
                  boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)'
                }}>
                  {/* Watermark */}
                  <div aria-hidden="true" style={{ position: 'absolute', top: 8, right: 8, width: 150, height: 150, opacity: 0.06, backgroundImage: `url(${markUrl})`, backgroundRepeat: 'no-repeat', backgroundPosition: 'top right', backgroundSize: 'contain', pointerEvents: 'none' }} />
                  <InlineEditableArea
                    value={body}
                    onChange={(v) => setBody(v)}
                    edited={false}
                    minHeight={140}
                    externalHighlights={undefined}
                    allReplacedRanges={allBodyReplacedRanges}
                    passcode={passcode}
                    enquiry={enquiry}
                  />
                </div>
              )}

              {showInlinePreview && (
                <div className="smooth-appear" style={{
                marginTop: 12,
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #FFFFFF 0%, #FEFEFE 100%)',
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
                    const withoutAutoBlocks = stripDashDividers(body || '');
                    const userDataLocal = (typeof userData !== 'undefined') ? userData : undefined;
                    const enquiryLocal = (typeof enquiry !== 'undefined') ? enquiry : undefined;
                    const sanitized = withoutAutoBlocks.replace(/\r\n/g, '\n').replace(/\n/g, '<br />');
                    // Use passcode in preview URL if available
                    const substituted = applyDynamicSubstitutions(
                      sanitized,
                      userDataLocal,
                      enquiryLocal,
                      amount,
                      passcode || undefined,
                      undefined // Let applyDynamicSubstitutions construct URL with passcode
                    );
                    const unresolvedBody = findPlaceholders(substituted);
                    const finalBody = convertDoubleBreaksToParagraphs(substituted);
                    const finalHighlighted = highlightPlaceholdersHtml(finalBody);
                    // Normalize any Instruct Helix Law anchors to use the project's highlight colour but preserve original href
                    const styledFinalHighlighted = finalHighlighted.replace(/<a\s+href="([^"]+)"[^>]*>\s*Instruct\s+Helix\s+Law\s*<\/a>/gi, (m, href) => {
                      const safe = escapeHtml(href);
                      return `<a href="${safe}" style="color:${colours.highlight};font-weight:700;text-decoration:underline">Instruct Helix Law</a>`;
                    });
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
                            <FaExclamationTriangle style={{ fontSize: 12, color: '#a8071a', marginRight: 6 }} />
                            {unresolvedBody.length} placeholder{unresolvedBody.length === 1 ? '' : 's'} to resolve: {unresolvedBody.join(', ')}
                          </div>
                        )}
                        <EmailSignature bodyHtml={styledFinalHighlighted} userData={userDataLocal} />
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
                      const sanitized = stripDashDividers(body || '').replace(/\r\n/g, '\n').replace(/\n/g, '<br />');
                      const effective = passcode || undefined; // no fallback
                      const checkoutPreviewUrl = 'https://instruct.helix-law.com/pitch';
                      const substitutedBody = applyDynamicSubstitutions(sanitized, userDataLocal, enquiryLocal, amount, effective, checkoutPreviewUrl);
                      const unresolvedBody = findPlaceholders(substitutedBody);
                      const unresolvedAny = unresolvedSubject.length > 0 || unresolvedBody.length > 0;
                      const disableDraft = !confirmReady || isDraftConfirmed || unresolvedAny;
                      const draftVisualConfirmed = isDraftConfirmed && !hasSentEmail;
                      const missingServiceSummary = !scopeDescription || !String(scopeDescription).trim();
                      const disableSend = unresolvedAny || missingServiceSummary; // Disable if placeholders unresolved or summary missing
                      const sendBtnTitle = unresolvedAny
                        ? 'Resolve placeholders before sending'
                        : (missingServiceSummary ? 'Service summary is required' : 'Send Email');
                      return (
                        <>
                          <button
                            onClick={() => setShowSendConfirmModal(true)}
                            disabled={disableSend}
                            title={sendBtnTitle}
                            style={{
                              padding: '6px 12px', 
                              borderRadius: 6, 
                              border: 'none', 
                              cursor: disableSend ? 'not-allowed' : 'pointer',
                              background: disableSend ? '#CCCCCC' : colours.blue, 
                              color: '#fff', 
                              fontWeight: 600, 
                              opacity: disableSend ? 0.6 : 1,
                              transition: 'all 0.2s ease',
                              transform: 'translateY(0)'
                            }}
                            onMouseEnter={(e) => {
                              if (!disableSend) {
                                e.currentTarget.style.background = '#2B7BC7';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(54, 144, 206, 0.3)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!disableSend) {
                                e.currentTarget.style.background = colours.blue;
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }
                            }}
                            onMouseDown={(e) => {
                              if (!disableSend) {
                                e.currentTarget.style.transform = 'translateY(1px)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(54, 144, 206, 0.2)';
                              }
                            }}
                            onMouseUp={(e) => {
                              if (!disableSend) {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 4px 8px rgba(54, 144, 206, 0.3)';
                              }
                            }}
                          >
                            <FaPaperPlane style={{ marginRight: 4 }} /> Send
                          </button>
                          <button
                            onClick={() => handleDraftEmail?.()}
                            disabled={disableDraft}
                            style={{
                              padding: '6px 12px', 
                              borderRadius: 6, 
                              border: `1px solid ${draftVisualConfirmed ? colours.green : '#e1e5e9'}`,
                              background: draftVisualConfirmed ? '#e8f5e8' : '#fff', 
                              color: draftVisualConfirmed ? colours.green : '#3c4043', 
                              fontWeight: 600,
                              cursor: disableDraft ? 'not-allowed' : 'pointer',
                              transition: 'all 0.2s ease',
                              transform: 'translateY(0)',
                              opacity: disableDraft ? 0.6 : 1
                            }}
                            onMouseEnter={(e) => {
                              if (!disableDraft && !draftVisualConfirmed) {
                                e.currentTarget.style.borderColor = colours.green;
                                e.currentTarget.style.background = '#f0f9f0';
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(32, 178, 108, 0.15)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!disableDraft && !draftVisualConfirmed) {
                                e.currentTarget.style.borderColor = '#e1e5e9';
                                e.currentTarget.style.background = '#fff';
                                e.currentTarget.style.transform = 'translateY(0)';
                                e.currentTarget.style.boxShadow = 'none';
                              }
                            }}
                            onMouseDown={(e) => {
                              if (!disableDraft && !draftVisualConfirmed) {
                                e.currentTarget.style.transform = 'translateY(1px)';
                                e.currentTarget.style.boxShadow = '0 1px 2px rgba(32, 178, 108, 0.1)';
                              }
                            }}
                            onMouseUp={(e) => {
                              if (!disableDraft && !draftVisualConfirmed) {
                                e.currentTarget.style.transform = 'translateY(-1px)';
                                e.currentTarget.style.boxShadow = '0 2px 4px rgba(32, 178, 108, 0.15)';
                              }
                            }}
                            title={draftVisualConfirmed ? 'Drafted' : (unresolvedAny ? 'Resolve placeholders before drafting' : 'Draft Email')}
                          >
                            {draftVisualConfirmed ? <FaCheck style={{ marginRight: 4 }} /> : <FaEnvelope style={{ marginRight: 4 }} />} {draftVisualConfirmed ? 'Drafted' : 'Draft Email'}
                          </button>
                        </>
                      );
                    })()}
                    <button
                      onClick={() => {
                        if (!previewRef.current) return;
                        const text = previewRef.current.innerText || '';
                        navigator.clipboard.writeText(text);
                        setCopiedFooter(true);
                        setTimeout(() => setCopiedFooter(false), 1200);
                      }}
                      style={{ 
                        padding: '6px 12px', 
                        borderRadius: 6, 
                        border: copiedFooter ? '1px solid #16a34a' : '1px solid #e1e5e9', 
                        background: copiedFooter ? '#e8f5e8' : '#fff', 
                        color: copiedFooter ? '#166534' : '#3c4043', 
                        fontWeight: 500,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        transform: 'translateY(0)'
                      }}
                      onMouseEnter={(e) => {
                        if (!copiedFooter) {
                          e.currentTarget.style.borderColor = '#3690CE';
                          e.currentTarget.style.background = '#f8fafc';
                          e.currentTarget.style.color = '#3690CE';
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(54, 144, 206, 0.15)';
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!copiedFooter) {
                          e.currentTarget.style.borderColor = '#e1e5e9';
                          e.currentTarget.style.background = '#fff';
                          e.currentTarget.style.color = '#3c4043';
                          e.currentTarget.style.transform = 'translateY(0)';
                          e.currentTarget.style.boxShadow = 'none';
                        }
                      }}
                      onMouseDown={(e) => {
                        if (!copiedFooter) {
                          e.currentTarget.style.transform = 'translateY(1px)';
                          e.currentTarget.style.boxShadow = '0 1px 2px rgba(54, 144, 206, 0.1)';
                        }
                      }}
                      onMouseUp={(e) => {
                        if (!copiedFooter) {
                          e.currentTarget.style.transform = 'translateY(-1px)';
                          e.currentTarget.style.boxShadow = '0 2px 4px rgba(54, 144, 206, 0.15)';
                        }
                      }}
                    >
                      {copiedFooter ? (
                        <>
                          <FaCheck style={{ marginRight: 4 }} /> Copied
                        </>
                      ) : (
                        <>
                          <FaCopy style={{ marginRight: 4 }} /> Copy
                        </>
                      )}
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
                background: 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
                borderRadius: '12px',
                padding: '20px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
                marginBottom: '16px',
                transition: 'all 0.3s ease-in-out',
                position: 'relative',
                fontFamily: 'Raleway, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
              }}>
                <div style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: '#1E293B',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  position: 'relative',
                  padding: '8px 16px',
                  background: 'rgba(255, 255, 255, 0.7)',
                  borderRadius: '10px',
                  border: '1px solid rgba(54, 144, 206, 0.1)'
                }}>
                  <span
                    onMouseEnter={() => setShowSubjectHint(true)}
                    onMouseLeave={() => setShowSubjectHint(false)}
                    style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}
                  >
                    <div style={{
                      padding: '6px',
                      background: 'rgba(54, 144, 206, 0.1)',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center'
                    }}>
                      <FaInfoCircle style={{ fontSize: 12, color: '#3690CE' }} />
                    </div>
                  </span>
                  Enquiry Notes
                  {showSubjectHint && (
                    <span style={{
                      position: 'absolute',
                      left: 0,
                      top: '100%',
                      marginTop: 8,
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                      color: '#1E293B',
                      fontSize: '11px',
                      fontWeight: 400,
                      fontStyle: 'italic',
                      border: '1px solid #CBD5E1',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      zIndex: 10,
                      whiteSpace: 'normal',
                      maxWidth: 420,
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
                    }}>
                      Source confirmation: these notes may be intake rep call notes, a web form message, or an auto‑parsed email.
                    </span>
                  )}
                </div>
                <div style={{
                  fontSize: '14px',
                  lineHeight: 1.6,
                  color: '#64748B',
                  whiteSpace: 'pre-wrap',
                  background: 'rgba(255, 255, 255, 0.8)',
                  padding: '16px',
                  borderRadius: '8px',
                  border: '1px solid rgba(203, 213, 225, 0.6)',
                  position: 'relative',
                  fontFamily: 'inherit'
                }}>
                  {/* Floating pin inside notes box */}
                  <button
                    onClick={() => setIsNotesPinned(true)}
                    title="Pin notes"
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                      border: '1px solid #CBD5E1',
                      color: '#1E293B',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      cursor: 'pointer',
                      zIndex: 2,
                      transition: 'all 0.2s ease'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = '#3690CE';
                      e.currentTarget.style.background = 'linear-gradient(135deg, #EBF8FF 0%, #DBEAFE 100%)';
                      e.currentTarget.style.transform = 'scale(1.05)';
                      e.currentTarget.style.boxShadow = '0 4px 8px rgba(54, 144, 206, 0.25)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = '#CBD5E1';
                      e.currentTarget.style.background = 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)';
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
                    }}
                  >
                    {/* Use a known glyph and strong contrast to ensure visibility */}
                    <FaThumbtack style={{ fontSize: 16, color: '#3690CE' }} />
                  </button>
                  {initialNotes}
                </div>
              </div>
            )}

            <DealCapture
              isDarkMode={isDarkMode}
              scopeDescription={scopeDescription}
              onScopeChange={(v) => { setScopeDescription(v); onScopeDescriptionChange?.(v); }}
              amount={amountValue}
              onAmountChange={(v) => { setAmountValue(v); onAmountChange?.(v); }}
              amountError={amountError}
            />

          {/* Template blocks removed in simplified flow */}
          </div>
        )}
        </div>
      </Stack>
      </div>

      {/* Additional styling for hover reveals and list styling */}
      <style>{`
        .inline-reveal-btn {display:inline-flex;align-items:center;gap:0;overflow:hidden;position:relative;}
        .inline-reveal-btn .label{max-width:0;opacity:0;transform:translateX(-4px);margin-left:0;white-space:nowrap;transition:max-width .45s ease,opacity .45s ease,transform .45s ease,margin-left .45s ease;}
        .inline-reveal-btn:hover .label,.inline-reveal-btn:focus-visible .label{max-width:90px;opacity:1;transform:translateX(0);margin-left:6px;}
        @keyframes fadeSlideIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
        @keyframes cascadeIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
        .smooth-appear{animation:fadeSlideIn .18s ease}
        
        /* Numbered list styling with CTA red numbers */
        ol:not(.hlx-numlist) {
          counter-reset: list-counter;
          list-style: none;
          padding-left: 0;
          margin: 16px 0;
        }
        ol:not(.hlx-numlist) li {
          counter-increment: list-counter;
          position: relative;
          padding-left: 2em;
          margin-bottom: 12px;
          line-height: 1.6;
        }
        ol:not(.hlx-numlist) li::before {
          content: counter(list-counter) ".";
          position: absolute;
          left: 0;
          top: 0;
          color: #D65541;
          font-weight: 700;
          margin: 0;
        }
        ol.hlx-numlist { list-style: none; padding-left: 0; margin: 16px 0; }
        ol.hlx-numlist li { margin: 0 0 12px 0; line-height: 1.6; position: relative; }
        ol.hlx-numlist li::before { content: none !important; }
        ol.hlx-numlist > li > span:first-child { color: #D65541; font-weight: 700; display: inline-block; min-width: 1.6em; }
      `}</style>

      {/* Email Send Confirmation Modal */}
      {showSendConfirmModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.7)' : 'rgba(0, 0, 0, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10000,
          backdropFilter: 'blur(2px)'
        }}>
          <div style={{
            background: isDarkMode 
              ? colours.dark.cardBackground 
              : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
            padding: '24px',
            borderRadius: '12px',
            maxWidth: '520px',
            width: '90%',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: isDarkMode 
              ? '0 20px 40px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.3)' 
              : '0 20px 40px rgba(0, 0, 0, 0.15), 0 8px 16px rgba(0, 0, 0, 0.08)',
            border: isDarkMode 
              ? `1px solid ${colours.dark.borderColor}` 
              : '1px solid rgba(255, 255, 255, 0.8)'
          }}>
            <h3 style={{
              margin: '0 0 20px 0',
              color: isDarkMode ? colours.dark.text : colours.darkBlue,
              fontSize: '20px',
              fontWeight: '600',
              letterSpacing: '-0.01em'
            }}>
              Confirm Email Send
            </h3>
            
            {/* Recipients Section - Primary Focus */}
            <div style={{ 
              marginBottom: '20px',
              padding: '16px',
              background: isDarkMode 
                ? 'rgba(59, 130, 246, 0.08)' 
                : 'linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)',
              border: `1px solid ${isDarkMode ? colours.dark.borderColor : '#E5E7EB'}`,
              borderRadius: '8px'
            }}>
              <h4 style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: isDarkMode ? colours.dark.text : colours.darkBlue,
                letterSpacing: '-0.005em'
              }}>
                Email Recipients
              </h4>

              {/* Sender (From) field - shows who the email will be sent from */}
              <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                <span style={{ 
                  fontWeight: '600', 
                  color: isDarkMode ? colours.blue : colours.darkBlue, 
                  minWidth: '50px', 
                  display: 'inline-block' 
                }}>From:</span>
                <span style={{ color: isDarkMode ? colours.dark.text : colours.darkBlue }}>
                  {userData?.[0]?.['Full Name'] || [userData?.[0]?.First, userData?.[0]?.Last].filter(Boolean).join(' ') || 'Fee Earner'} ({userData?.[0]?.Email || userData?.[0]?.WorkEmail || userData?.[0]?.Mail || userData?.[0]?.UserPrincipalName || userData?.[0]?.['Email Address'] || (userData?.[0]?.Initials ? `${userData[0].Initials.toLowerCase()}@helix-law.com` : 'automations@helix-law.com')})
                </span>
              </div>
              
              {to && (
                <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                  <span style={{ 
                    fontWeight: '600', 
                    color: isDarkMode ? colours.blue : colours.darkBlue, 
                    minWidth: '50px', 
                    display: 'inline-block' 
                  }}>To:</span>
                  <span style={{ color: isDarkMode ? colours.dark.text : colours.darkBlue }}>{to}</span>
                </div>
              )}
              
              {cc && (
                <div style={{ marginBottom: '8px', fontSize: '14px' }}>
                  <span style={{ 
                    fontWeight: '600', 
                    color: isDarkMode ? colours.blue : colours.darkBlue, 
                    minWidth: '40px', 
                    display: 'inline-block' 
                  }}>CC:</span>
                  <span style={{ color: isDarkMode ? colours.dark.text : colours.darkBlue }}>{cc}</span>
                </div>
              )}
              
              {/* Show current BCC plus fee earner email */}
              <div style={{ fontSize: '14px', marginBottom: '8px' }}>
                <span style={{ 
                  fontWeight: '600', 
                  color: isDarkMode ? colours.blue : colours.darkBlue, 
                  minWidth: '40px', 
                  display: 'inline-block' 
                }}>BCC:</span>
                <span style={{ color: isDarkMode ? colours.dark.text : colours.darkBlue }}>
                  {[bcc, feeEarnerEmail].filter(Boolean).join(', ')}
                </span>
              </div>
            </div>
            
            {/* Email Summary Section - Secondary */}
            <div style={{
              background: isDarkMode 
                ? colours.dark.inputBackground 
                : 'linear-gradient(135deg, #FEFEFE 0%, #F9FAFB 100%)',
              border: `1px solid ${isDarkMode ? colours.dark.border : '#E5E7EB'}`,
              borderRadius: '8px',
              padding: '14px',
              marginBottom: '16px'
            }}>
              <h4 style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: isDarkMode ? colours.dark.text : colours.darkBlue,
                letterSpacing: '-0.005em'
              }}>
                Email Content Summary
              </h4>
              
              {/* Replace Subject with Service Description */}
              {scopeDescription && (
                <div style={{ fontSize: '13px', marginBottom: '8px' }}>
                  <span style={{ fontWeight: '600', color: isDarkMode ? colours.dark.text : '#6B7280' }}>Service Description:</span>
                  <div style={{ 
                    marginTop: '4px',
                    color: isDarkMode ? colours.dark.text : colours.darkBlue,
                    lineHeight: '1.4',
                    maxHeight: '60px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {scopeDescription.length > 150 ? `${scopeDescription.substring(0, 150)}...` : scopeDescription}
                  </div>
                </div>
              )}
              
              {amountValue && (
                <div style={{ marginBottom: '8px', fontSize: '13px' }}>
                  <span style={{ fontWeight: '600', color: isDarkMode ? colours.dark.text : '#6B7280' }}>Amount:</span>
                  <div style={{ 
                    marginTop: '4px',
                    color: isDarkMode ? colours.blue : colours.darkBlue,
                    fontWeight: 600
                  }}>
                    £{parseFloat(amountValue).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} + VAT
                  </div>
                </div>
              )}
            </div>
            
            {/* Debug/Support Info Box */}
            <div style={{
              background: isDarkMode 
                ? 'rgba(59, 130, 246, 0.1)' 
                : 'linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(147, 197, 253, 0.08) 100%)',
              border: `1px solid ${isDarkMode ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.15)'}`,
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '24px',
              fontSize: '13px',
              fontFamily: 'Raleway, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
            }}>
              <h4 style={{
                margin: '0 0 12px 0',
                fontSize: '16px',
                fontWeight: '600',
                color: isDarkMode ? colours.dark.text : colours.darkBlue,
                letterSpacing: '-0.005em'
              }}>
                Support BCC (auto-added)
              </h4>
              <div style={{ 
                color: isDarkMode ? colours.blue : colours.darkBlue,
                fontFamily: 'inherit',
                fontSize: '12px',
                fontWeight: '500'
              }}>
                lz@helix-law.com, cb@helix-law.com
              </div>
            </div>

            {/* Processing Status Section - Animated Processing Feedback */}
            <div style={{
              background: isDarkMode
                ? 'rgba(16, 185, 129, 0.06)'
                : 'linear-gradient(135deg, rgba(16, 185, 129, 0.06) 0%, rgba(59, 130, 246, 0.04) 100%)',
              border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.25)' : '#E5E7EB'}`,
              borderRadius: 8,
              padding: '12px 14px',
              marginBottom: 16
            }}>
              <h4 style={{
                margin: '0 0 16px 0',
                fontSize: 16,
                fontWeight: 600,
                color: isDarkMode ? colours.dark.text : colours.darkBlue
              }}>
                Processing Status
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {/* Deal creation status with animated icon */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  fontSize: 14,
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: (dealCreationInProgress || dealStatus === 'processing') ? 
                    (isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)') : 
                    dealStatus === 'ready' ? 
                      (isDarkMode ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)') :
                      'transparent',
                  border: (dealCreationInProgress || dealStatus === 'processing') ? 
                    '1px solid rgba(59, 130, 246, 0.25)' : 
                    dealStatus === 'ready' ? 
                      '1px solid rgba(34, 197, 94, 0.25)' :
                      '1px solid transparent',
                  transition: 'all 0.3s ease'
                }}>
                  {/* Animated Deal Icon */}
                  <div style={{ 
                    width: 28, 
                    height: 28, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: (dealCreationInProgress || dealStatus === 'processing') ? 
                      'linear-gradient(135deg, #3B82F6, #60A5FA)' : 
                      dealStatus === 'ready' ? 
                        'linear-gradient(135deg, #22C55E, #4ADE80)' :
                        dealStatus === 'error' ? 
                          'linear-gradient(135deg, #EF4444, #F87171)' :
                          isDarkMode ? colours.dark.border : '#E5E7EB',
                    boxShadow: (dealCreationInProgress || dealStatus === 'processing') ? 
                      '0 0 0 2px rgba(59, 130, 246, 0.15)' : 
                      dealStatus === 'ready' ? 
                        '0 0 0 2px rgba(34, 197, 94, 0.15)' : 'none',
                    animation: (dealCreationInProgress || dealStatus === 'processing') ? 
                      'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite' : 
                      dealStatus === 'ready' ? 
                        'fadeIn 0.4s ease-out' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    {(dealCreationInProgress || dealStatus === 'processing') ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: 'white' }}>
                        <circle cx="12" cy="8" r="2" fill="currentColor"/>
                        <path d="M12 14c-4 0-6 2-6 4v2h12v-2c0-2-2-4-6-4z" fill="currentColor"/>
                        <path d="M16 8h4l-2-2m2 2l-2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7"/>
                      </svg>
                    ) : dealStatus === 'ready' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ 
                        color: 'white',
                        animation: 'morphToCheck 0.6s ease-in-out'
                      }}>
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : dealStatus === 'error' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: 'white' }}>
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: isDarkMode ? colours.dark.text : '#9CA3AF' }}>
                        <circle cx="12" cy="8" r="2" stroke="currentColor" strokeWidth="2"/>
                        <path d="M12 14c-4 0-6 2-6 4v2h12v-2c0-2-2-4-6-4z" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: isDarkMode ? colours.dark.text : '#1F2937', marginBottom: 2 }}>Deal capture</div>
                    <div style={{ 
                      fontSize: 13, 
                      color: (dealStatus === 'ready' ? '#166534' : dealStatus === 'error' ? '#991B1B' : isDarkMode ? colours.dark.text : '#6B7280'),
                      fontWeight: dealStatus === 'ready' ? 600 : 500
                    }}>
                      {dealCreationInProgress || dealStatus === 'processing' ? 'Processing deal information...' :
                        dealStatus === 'ready' ? 'Deal captured successfully' :
                        dealStatus === 'error' ? 'Failed to capture deal' : 'Waiting to process'}
                    </div>
                  </div>
                </div>

                {/* Email sending status with animated icon */}
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 12, 
                  fontSize: 14,
                  padding: '10px 12px',
                  borderRadius: '8px',
                  background: (emailStatus === 'processing' || modalSending) ? 
                    (isDarkMode ? 'rgba(59, 130, 246, 0.15)' : 'rgba(59, 130, 246, 0.08)') : 
                    emailStatus === 'sent' ? 
                      (isDarkMode ? 'rgba(34, 197, 94, 0.15)' : 'rgba(34, 197, 94, 0.08)') :
                      emailStatus === 'error' ?
                        (isDarkMode ? 'rgba(239, 68, 68, 0.15)' : 'rgba(239, 68, 68, 0.08)') :
                        'transparent',
                  border: (emailStatus === 'processing' || modalSending) ? 
                    '1px solid rgba(59, 130, 246, 0.25)' : 
                    emailStatus === 'sent' ? 
                      '1px solid rgba(34, 197, 94, 0.25)' :
                      emailStatus === 'error' ?
                        '1px solid rgba(239, 68, 68, 0.25)' :
                        '1px solid transparent',
                  transition: 'all 0.3s ease'
                }}>
                  {/* Animated Email Icon */}
                  <div style={{ 
                    width: 28, 
                    height: 28, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    borderRadius: '50%',
                    background: (emailStatus === 'processing' || modalSending) ? 
                      'linear-gradient(135deg, #3B82F6, #60A5FA)' : 
                      emailStatus === 'sent' ? 
                        'linear-gradient(135deg, #22C55E, #4ADE80)' :
                        emailStatus === 'error' ? 
                          'linear-gradient(135deg, #EF4444, #F87171)' :
                          isDarkMode ? colours.dark.border : '#E5E7EB',
                    boxShadow: (emailStatus === 'processing' || modalSending) ? 
                      '0 0 0 2px rgba(59, 130, 246, 0.15)' : 
                      emailStatus === 'sent' ? 
                        '0 0 0 2px rgba(34, 197, 94, 0.15)' : 'none',
                    animation: (emailStatus === 'processing' || modalSending) ? 
                      'subtleFloat 2s ease-in-out infinite' : 
                      emailStatus === 'sent' ? 
                        'fadeIn 0.4s ease-out' : 'none',
                    transition: 'all 0.3s ease'
                  }}>
                    {(emailStatus === 'processing' || modalSending) ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: 'white' }}>
                        <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <polyline points="22,6 12,13 2,6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : emailStatus === 'sent' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ 
                        color: 'white',
                        animation: 'morphToCheck 0.6s ease-in-out'
                      }}>
                        <path d="M4 12L8 16L20 4" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : emailStatus === 'error' ? (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: 'white' }}>
                        <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    ) : (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" style={{ color: isDarkMode ? colours.dark.text : '#9CA3AF' }}>
                        <path d="M3 8L10.89 13.26C11.2187 13.4793 11.6049 13.5963 12 13.5963C12.3951 13.5963 12.7813 13.4793 13.11 13.26L21 8M5 19H19C20.1046 19 21 18.1046 21 17V7C21 5.89543 20.1046 5 19 5H5C3.89543 5 3 5.89543 3 7V17C3 18.1046 3.89543 19 5 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, color: isDarkMode ? colours.dark.text : '#1F2937', marginBottom: 2 }}>Email delivery</div>
                    <div style={{ 
                      fontSize: 13, 
                      color: (emailStatus === 'sent' ? '#166534' : emailStatus === 'error' ? '#991B1B' : isDarkMode ? colours.dark.text : '#6B7280'),
                      fontWeight: emailStatus === 'sent' ? 600 : 500
                    }}>
                      {emailStatus === 'processing' ? 'Sending via Microsoft Graph...' : 
                       emailStatus === 'sent' ? 'Email delivered successfully' : 
                       emailStatus === 'error' ? 'Failed to send email' : 
                       modalSending ? 'Preparing to send...' : 'Ready to send'}
                    </div>
                    {!!emailMessage && emailMessage !== 'Sent' && emailMessage !== 'Error' && (
                      <div style={{ fontSize: 12, color: isDarkMode ? colours.dark.text : '#6B7280', marginTop: 4, fontStyle: 'italic' }}>
                        {emailMessage}
                      </div>
                    )}
                    {/* Enhanced Recipient Breakdown - show when processing or sent */}
                    {(emailStatus === 'processing' || emailStatus === 'sent' || modalSending) && (
                      <div style={{ marginTop: 8, padding: '8px 10px', background: isDarkMode ? 'rgba(30, 41, 59, 0.5)' : 'rgba(248, 250, 252, 0.8)', borderRadius: 6, border: `1px solid ${isDarkMode ? 'rgba(148, 163, 184, 0.15)' : 'rgba(203, 213, 225, 0.5)'}` }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: isDarkMode ? colours.dark.text : '#475569', marginBottom: 6 }}>Delivery Details:</div>
                        {to && (
                          <div style={{ fontSize: 11, color: isDarkMode ? colours.dark.text : '#64748B', marginBottom: 3 }}>
                            <span style={{ fontWeight: 500 }}>Primary:</span> {to.split(',').length > 1 ? `${to.split(',').length} recipients` : to.trim()}
                          </div>
                        )}
                        {cc && (
                          <div style={{ fontSize: 11, color: isDarkMode ? colours.dark.text : '#64748B', marginBottom: 3 }}>
                            <span style={{ fontWeight: 500 }}>CC:</span> {cc.split(',').length > 1 ? `${cc.split(',').length} recipients` : cc.trim()}
                          </div>
                        )}
                        {(bcc || feeEarnerEmail) && (
                          <div style={{ fontSize: 11, color: isDarkMode ? colours.dark.text : '#64748B', marginBottom: 3 }}>
                            <span style={{ fontWeight: 500 }}>BCC:</span> {[bcc, feeEarnerEmail, 'lz@helix-law.com', 'cb@helix-law.com'].filter(Boolean).join(', ').split(',').length} monitoring addresses
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            {/* Inline validation error (modal) */}
            {modalError && (
              <div style={{
                marginBottom: '16px',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #ffa39e',
                background: '#fff1f0',
                color: '#a8071a',
                fontSize: 12,
              }}>
                <FaExclamationTriangle style={{ fontSize: 12, color: '#a8071a', marginRight: 6 }} />
                {modalError}
              </div>
            )}
            
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => { if (!modalSending) setShowSendConfirmModal(false); }}
                style={{
                  padding: '10px 20px',
                  border: `1px solid ${isDarkMode ? colours.dark.borderColor : '#D1D5DB'}`,
                  background: isDarkMode 
                    ? 'transparent' 
                    : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)',
                  color: isDarkMode ? colours.dark.text : colours.darkBlue,
                  borderRadius: '8px',
                  cursor: modalSending ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '500',
                  transition: 'all 0.2s ease',
                  letterSpacing: '-0.005em'
                }}
                disabled={modalSending}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isDarkMode 
                    ? colours.dark.inputBackground 
                    : 'linear-gradient(135deg, #F0F4F8 0%, #EFF6FF 100%)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isDarkMode 
                    ? 'transparent' 
                    : 'linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                {emailStatus === 'sent' ? 'Close' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  // Validate essential fields locally before closing modal
                  const numericAmt = parseFloat(String(amountValue || '').replace(/[^0-9.]/g, ''));
                  const err = (() => {
                    if (!to || !to.trim()) return 'Recipient (To) is required.';
                    if (!subject || !subject.trim()) return 'Subject is required.';
                    if (!body || !body.trim()) return 'Email body is required.';
                    if (!scopeDescription || !scopeDescription.trim()) return 'Service description is required.';
                    if (!amountValue || !amountValue.trim() || isNaN(numericAmt) || numericAmt <= 0) return 'Estimated fee must be a positive number.';
                    return null;
                  })();
                  if (err) {
                    setModalError(err);
                    return;
                  }
                  setModalError(null);
                  try {
                    setModalSending(true);
                    setHasSentEmail(true);
                    await sendEmail?.();
                  } finally {
                    setModalSending(false);
                  }
                }}
                style={{
                  padding: '10px 20px',
                  border: 'none',
                  background: modalSending ? 'linear-gradient(90deg, #94A3B8, #CBD5E1)' : `linear-gradient(90deg, ${colours.blue}, #60A5FA)`,
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  cursor: modalSending ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: '600',
                  transition: 'all 0.2s ease',
                  letterSpacing: '-0.005em',
                  boxShadow: isDarkMode 
                    ? '0 4px 8px rgba(0, 0, 0, 0.3)' 
                    : '0 4px 8px rgba(54, 144, 206, 0.25)'
                }}
                disabled={modalSending}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'linear-gradient(90deg, #2563EB, #3B82F6)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = isDarkMode 
                    ? '0 6px 12px rgba(0, 0, 0, 0.4)' 
                    : '0 6px 12px rgba(54, 144, 206, 0.35)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = modalSending ? 'linear-gradient(90deg, #94A3B8, #CBD5E1)' : `linear-gradient(90deg, ${colours.blue}, #60A5FA)`;
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = isDarkMode 
                    ? '0 4px 8px rgba(0, 0, 0, 0.3)' 
                    : '0 4px 8px rgba(54, 144, 206, 0.25)';
                }}
              >
                {modalSending ? 'Sending…' : 'Send Email'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditorAndTemplateBlocks;

// Allow TS to understand Webpack HMR in CRA
declare const module: { hot?: { accept: (path?: string, cb?: () => void) => void } };
