import React, { useState, useRef, useEffect, useCallback, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Stack, Text, Icon, Pivot, PivotItem, TextField } from '@fluentui/react';
import { colours } from '../../../app/styles/colours';
import { TemplateBlock } from '../../../app/customisation/ProductionTemplateBlocks';
import SnippetEditPopover from './SnippetEditPopover';
import { placeholderSuggestions } from '../../../app/customisation/InsertSuggestions';
import { wrapInsertPlaceholders } from './emailUtils';
import { SCENARIOS, SCENARIOS_VERSION } from './scenarios';
import EmailSignature from '../EmailSignature';
import { applyDynamicSubstitutions, convertDoubleBreaksToParagraphs } from './emailUtils';
import markUrl from '../../../assets/dark blue mark.svg';

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

// Deterministic short passcode generator from an enquiry ID (used as fallback when real passcode is missing)
function computeLocalPasscode(id: string) {
  if (!id) return '';
  let h = 2166136261 >>> 0;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 16777619) >>> 0;
  }
  return (h >>> 0).toString(36);
}

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
      `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

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
        ref={preRef}
        aria-hidden="true"
        style={{
          margin: 0,
          padding: '4px 6px',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
      font: 'inherit',
      lineHeight: 1.4,
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
                  html += `${escapeHtml(pre)}<span style="color:#D65541;font-weight:700;">${escapeHtml(num + '.')}<\/span>${escapeHtml(after + rest)}`;
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
              // Use the temporary, static proof-of-identity URL per request
              const href = 'https://helix-law.co.uk/proof-of-identity/';
              const safe = escapeHtml(href);
              // Show the friendly label instead of the raw URL, keep link styling prominent and bold
              html += `<a href="${safe}" style="color:#174ea6;font-weight:700;text-decoration:underline">Instruct Helix Law</a>`;
            } else {
              // Updated edited highlight: subtle green background only (no border/box), accessible text color
              html += `<span style="display:inline;background:#e9f9f1;padding:0;margin:0;border:none;font-style:inherit;color:#0b3d2c">${escapeHtml(segment)}</span>`;
            }
            cursor = mark.end;
          });
          pushPlain(value.length);
          // Render any [[INSTRUCT_LINK::href]] markers as visible link text in the overlay
          try {
            const replaced = html.replace(/\[\[INSTRUCT_LINK::([^\]]+)\]\]/g, (_m, _href) => {
              // Use static temporary URL for instruct links
              const safeHref = escapeHtml('https://helix-law.co.uk/proof-of-identity/');
              // Render a friendly, bold blue anchor label for instruct links in the overlay
              return `<a href="${safeHref}" style="color:#174ea6;font-weight:700;text-decoration:underline">Instruct Helix Law</a>`;
            });
            return replaced || '';
          } catch (e) {
            return html || '';
          }
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
      lineHeight: 1.4,
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
  showDealCapture = false,
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
  // HMR tick to force re-render when scenarios module hot-reloads
  const [hmrTick, setHmrTick] = useState(0);
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
    const formatRateGBP = (n: number) => `£${n.toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    let out = text;
    if (rateNumber != null) out = out.replace(/\[RATE\]/gi, formatRateGBP(rateNumber));
    if (roleStr) out = out.replace(/\[ROLE\]/gi, roleStr);
    // Also apply dynamic substitutions so [InstructLink] renders in the editor
    // For editor, compute an effective passcode (use provided passcode or a deterministic local one derived from enquiry ID)
    const effectivePass = passcode || ((enquiry as any)?.ID ? computeLocalPasscode(String((enquiry as any).ID)) : undefined);
    let substituted = applyDynamicSubstitutions(
      out,
      userData,
      enquiry,
      amount,
      effectivePass,
      'https://helix-law.co.uk/proof-of-identity/'
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
    const effective = passcode || ((enquiry as any)?.ID ? computeLocalPasscode(String((enquiry as any).ID)) : undefined);
    if (effective && effective !== lastPasscodeRef.current && body) {
      const processedBody = applyRateRolePlaceholders(body);
      if (processedBody !== body) {
        setBody(processedBody);
      }
      lastPasscodeRef.current = effective;
    }
  }, [passcode, enquiry, body, applyRateRolePlaceholders, setBody]);

  // Auto-select the first quick scenario on mount if none is selected
  useEffect(() => {
    if (!selectedScenarioId && SCENARIOS.length > 0) {
      const firstScenario = SCENARIOS[0];
      setSelectedScenarioId(firstScenario.id);

      // Only inject scenario content if editor is empty or whitespace
      if (!body || body.trim() === '') {
        const raw = stripDashDividers(firstScenario.body);
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

        const firstBlock = templateBlocks[0];
        if (firstBlock) {
          setBlockContents(prev => ({ ...prev, [firstBlock.title]: projected }));
        }
      }
    }
  }, [selectedScenarioId, enquiry, body, setBody, applyRateRolePlaceholders, templateBlocks]);
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
      {/* Global sticky notes portal */}
      <GlobalStickyNotes />
      {/* Hover-reveal button styles (scoped by class names) */}
      <style>{`
        .inline-reveal-btn {display:inline-flex;align-items:center;gap:0;overflow:hidden;position:relative;}
        .inline-reveal-btn .label{max-width:0;opacity:0;transform:translateX(-4px);margin-left:0;white-space:nowrap;transition:max-width .45s ease,opacity .45s ease,transform .45s ease,margin-left .45s ease;}
        .inline-reveal-btn:hover .label,.inline-reveal-btn:focus-visible .label{max-width:90px;opacity:1;transform:translateX(0);margin-left:6px;}
      @keyframes fadeSlideIn{from{opacity:0;transform:translateY(4px)}to{opacity:1;transform:translateY(0)}}
      .smooth-appear{animation:fadeSlideIn .18s ease}
      
  /* Numbered list styling with CTA red numbers */
  /* Apply counters only to ordered lists that are NOT already number-inlined (.hlx-numlist) */
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
        font-size: 1em;
        line-height: 1.6;
      }
      /* Ensure proper indentation for multi-line list items */
  ol:not(.hlx-numlist) li p {
        margin: 0;
        padding: 0;
      }
  /* Lists generated with inline number spans */
  ol.hlx-numlist { list-style: none; padding-left: 0; margin: 16px 0; }
  ol.hlx-numlist li { margin: 0 0 12px 0; line-height: 1.6; position: relative; }
  ol.hlx-numlist li::before { content: none !important; }
  ol.hlx-numlist > li > span:first-child { color: #D65541; font-weight: 700; display: inline-block; min-width: 1.6em; }
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
            {/* Scenario hot-update handled via top-level useEffect */}
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
                  fontSize: 13, // match editor font size
                  fontWeight: 400,
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
                    const withoutAutoBlocks = stripDashDividers(body || '');
                    const userDataLocal = (typeof userData !== 'undefined') ? userData : undefined;
                    const enquiryLocal = (typeof enquiry !== 'undefined') ? enquiry : undefined;
                    const sanitized = withoutAutoBlocks.replace(/\r\n/g, '\n').replace(/\n/g, '<br />');
                    // Use temporary static URL for proof-of-identity links in preview
                    const checkoutPreviewUrl = 'https://helix-law.co.uk/proof-of-identity/';
                    const substituted = applyDynamicSubstitutions(
                      sanitized,
                      userDataLocal,
                      enquiryLocal,
                      amount,
                      undefined,
                      checkoutPreviewUrl
                    );
                    const unresolvedBody = findPlaceholders(substituted);
                    const finalBody = convertDoubleBreaksToParagraphs(substituted);
                    const finalHighlighted = highlightPlaceholdersHtml(finalBody);
                    // Ensure any Instruct Helix Law anchors are styled using the project's highlight colour and bold font
                    // Normalize any Instruct Helix Law anchors to use the project's highlight colour and static URL
                    const styledFinalHighlighted = finalHighlighted.replace(/<a\s+href="([^"]+)"[^>]*>\s*Instruct\s+Helix\s+Law\s*<\/a>/gi, (_m, _href) => {
                      const safe = escapeHtml('https://helix-law.co.uk/proof-of-identity/');
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
                            <Icon iconName="Warning" styles={{ root: { fontSize: 12, color: '#a8071a', marginRight: 6 } }} />
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
                      const effective = passcode || (enquiryLocal?.ID ? computeLocalPasscode(String(enquiryLocal.ID)) : undefined);
                      const checkoutPreviewUrl = 'https://helix-law.co.uk/proof-of-identity/';
                      const substitutedBody = applyDynamicSubstitutions(sanitized, userDataLocal, enquiryLocal, amount, effective, checkoutPreviewUrl);
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

            {/* Deal Capture Section (admin-gated) */}
            {showDealCapture && (
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
                <Icon iconName="Clock" styles={{ root: { fontSize: 12 } }} />
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
            )}
          </div>

          {/* Template blocks removed in simplified flow */}
        </div>
      </Stack>
    </>
  );
};

export default EditorAndTemplateBlocks;

// Allow TS to understand Webpack HMR in CRA
declare const module: { hot?: { accept: (path?: string, cb?: () => void) => void } };
