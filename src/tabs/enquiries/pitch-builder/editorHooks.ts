import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { TemplateBlock } from '../../../app/customisation/ProductionTemplateBlocks';
import { editorFormatter, performanceOptimizer, KeyboardHandler } from './editorEnhancements';

/**
 * Enhanced editor state hook with performance optimizations
 */
export const useEditorState = () => {
  const [boldActive, setBoldActive] = useState(false);
  const [italicActive, setItalicActive] = useState(false);
  const [underlineActive, setUnderlineActive] = useState(false);
  const [editorFocused, setEditorFocused] = useState(false);

  // Debounced state update to prevent excessive re-renders
  const updateFormattingState = useCallback(
    performanceOptimizer.debounce(() => {
      setBoldActive(editorFormatter.getFormatState('bold'));
      setItalicActive(editorFormatter.getFormatState('italic'));
      setUnderlineActive(editorFormatter.getFormatState('underline'));
// invisible change
    }, 100, 'formatting-state'),
    []
  );

  return {
    formattingState: {
      boldActive,
      italicActive,
      underlineActive,
      editorFocused,
    },
    actions: {
      updateFormattingState,
      setEditorFocused,
    },
  };
};

/**
 * Enhanced keyboard shortcuts hook
 */
export const useKeyboardShortcuts = (callbacks: {
  onBold: () => void;
  onItalic: () => void;
  onUnderline: () => void;
  onBulletList: () => void;
  onNumberedList: () => void;
  onLetteredList: () => void;
  onLink: () => void;
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
}) => {
  const keyboardHandler = useRef<KeyboardHandler>(new KeyboardHandler());

  useEffect(() => {
    const handler = keyboardHandler.current;
    
    // Register shortcuts
    handler.register('ctrl+b', callbacks.onBold);
    handler.register('ctrl+i', callbacks.onItalic);
    handler.register('ctrl+u', callbacks.onUnderline);
    handler.register('ctrl+shift+8', callbacks.onBulletList);
    handler.register('ctrl+shift+7', callbacks.onNumberedList);
    handler.register('ctrl+shift+l', callbacks.onLetteredList);
    handler.register('ctrl+k', callbacks.onLink);
    
    if (callbacks.onSave) {
      handler.register('ctrl+s', callbacks.onSave);
    }
    if (callbacks.onUndo) {
      handler.register('ctrl+z', callbacks.onUndo);
    }
    if (callbacks.onRedo) {
      handler.register('ctrl+y', callbacks.onRedo);
    }

    return () => {
      // Cleanup is handled by the KeyboardHandler class
    };
  }, [callbacks]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    keyboardHandler.current.handleKeyEvent(event.nativeEvent);
  }, []);

  return { handleKeyDown };
};

/**
 * Template block management hook with performance optimizations
 */
export const useTemplateBlocks = (
  initialBlocks: TemplateBlock[],
  onBlockChange?: (blocks: TemplateBlock[]) => void
) => {
  const [blocks, setBlocks] = useState(initialBlocks);
  const [selectedOptions, setSelectedOptions] = useState<{
    [key: string]: string | string[];
  }>({});
  const [insertedBlocks, setInsertedBlocks] = useState<{ [key: string]: boolean }>({});
  const [lockedBlocks, setLockedBlocks] = useState<{ [key: string]: boolean }>({});
  const [editedBlocks, setEditedBlocks] = useState<{ [key: string]: boolean }>({});

  // Memoized computations
  const activeBlocks = useMemo(
    () => blocks.filter(block => insertedBlocks[block.title]),
    [blocks, insertedBlocks]
  );

  const unlockedActiveBlocks = useMemo(
    () => activeBlocks.filter(block => !lockedBlocks[block.title]),
    [activeBlocks, lockedBlocks]
  );

  const editableBlocks = useMemo(
    () => unlockedActiveBlocks.filter(block => editedBlocks[block.title]),
    [unlockedActiveBlocks, editedBlocks]
  );

  // Optimized block manipulation functions
  const insertBlock = useCallback((blockTitle: string, option: string | string[]) => {
    setInsertedBlocks(prev => ({ ...prev, [blockTitle]: true }));
    setSelectedOptions(prev => ({ ...prev, [blockTitle]: option }));
    setEditedBlocks(prev => ({ ...prev, [blockTitle]: false }));
  }, []);

  const removeBlock = useCallback((blockTitle: string) => {
    setInsertedBlocks(prev => {
      const newState = { ...prev };
      delete newState[blockTitle];
      return newState;
    });
    setSelectedOptions(prev => {
      const newState = { ...prev };
      delete newState[blockTitle];
      return newState;
    });
    setEditedBlocks(prev => {
      const newState = { ...prev };
      delete newState[blockTitle];
      return newState;
    });
    setLockedBlocks(prev => {
      const newState = { ...prev };
      delete newState[blockTitle];
      return newState;
    });
  }, []);

  const toggleBlockLock = useCallback((blockTitle: string) => {
    setLockedBlocks(prev => ({ ...prev, [blockTitle]: !prev[blockTitle] }));
  }, []);

  const markBlockAsEdited = useCallback((blockTitle: string, edited: boolean = true) => {
    setEditedBlocks(prev => ({ ...prev, [blockTitle]: edited }));
  }, []);

  const clearAllBlocks = useCallback(() => {
    setInsertedBlocks({});
    setSelectedOptions({});
    setEditedBlocks({});
    setLockedBlocks({});
  }, []);

  // Notify parent of changes
  useEffect(() => {
    if (onBlockChange) {
      onBlockChange(blocks);
    }
  }, [blocks, onBlockChange]);

  return {
    state: {
      blocks,
      selectedOptions,
      insertedBlocks,
      lockedBlocks,
      editedBlocks,
      activeBlocks,
      unlockedActiveBlocks,
      editableBlocks,
    },
    actions: {
      setBlocks,
      insertBlock,
      removeBlock,
      toggleBlockLock,
      markBlockAsEdited,
      clearAllBlocks,
    },
  };
};

/**
 * Enhanced undo/redo functionality hook
 */
export const useUndoRedo = <T>(initialState: T, maxHistorySize: number = 50) => {
  const [state, setState] = useState(initialState);
  const [history, setHistory] = useState<T[]>([initialState]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  const pushState = useCallback((newState: T) => {
    setHistory(prev => {
      const newHistory = prev.slice(0, currentIndex + 1);
      newHistory.push(newState);
      
      // Limit history size
      if (newHistory.length > maxHistorySize) {
        return newHistory.slice(-maxHistorySize);
      }
      
      return newHistory;
    });
    setCurrentIndex(prev => Math.min(prev + 1, maxHistorySize - 1));
    setState(newState);
  }, [currentIndex, maxHistorySize]);

  const undo = useCallback(() => {
    if (canUndo) {
      const newIndex = currentIndex - 1;
      setCurrentIndex(newIndex);
      setState(history[newIndex]);
    }
  }, [canUndo, currentIndex, history]);

  const redo = useCallback(() => {
    if (canRedo) {
      const newIndex = currentIndex + 1;
      setCurrentIndex(newIndex);
      setState(history[newIndex]);
    }
  }, [canRedo, currentIndex, history]);

  const clearHistory = useCallback(() => {
    setHistory([state]);
    setCurrentIndex(0);
  }, [state]);

  return {
    state,
    actions: {
      setState: pushState,
      undo,
      redo,
      clearHistory,
    },
    canUndo,
    canRedo,
  };
};

/**
 * Auto-save functionality hook
 */
export const useAutoSave = <T>(
  data: T,
  saveFunction: (data: T) => Promise<void>,
  interval: number = 30000, // 30 seconds
  enabled: boolean = true
) => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const dataRef = useRef(data);

  // Update ref when data changes
  useEffect(() => {
    dataRef.current = data;
  }, [data]);

  // Auto-save effect
  useEffect(() => {
    if (!enabled) return;

    const saveData = async () => {
      try {
        setIsSaving(true);
        setSaveError(null);
        await saveFunction(dataRef.current);
        setLastSaved(new Date());
      } catch (error) {
        setSaveError(error instanceof Error ? error.message : 'Save failed');
        console.error('Auto-save failed:', error);
      } finally {
        setIsSaving(false);
      }
    };

    const intervalId = setInterval(saveData, interval);
    
    return () => clearInterval(intervalId);
  }, [saveFunction, interval, enabled]);

  const manualSave = useCallback(async () => {
    try {
      setIsSaving(true);
      setSaveError(null);
      await saveFunction(dataRef.current);
      setLastSaved(new Date());
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : 'Save failed');
      console.error('Manual save failed:', error);
      throw error;
    } finally {
      setIsSaving(false);
    }
  }, [saveFunction]);

  return {
    lastSaved,
    isSaving,
    saveError,
    manualSave,
  };
};

/**
 * Content validation hook
 */
export const useContentValidation = () => {
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [validationWarnings, setValidationWarnings] = useState<string[]>([]);

  const validateContent = useCallback((content: string, rules?: {
    minLength?: number;
    maxLength?: number;
    requiredPatterns?: RegExp[];
    forbiddenPatterns?: RegExp[];
  }) => {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (rules) {
      // Length validation
      if (rules.minLength && content.length < rules.minLength) {
        errors.push(`Content must be at least ${rules.minLength} characters long`);
      }
      if (rules.maxLength && content.length > rules.maxLength) {
        errors.push(`Content must not exceed ${rules.maxLength} characters`);
      }

      // Pattern validation
      if (rules.requiredPatterns) {
        rules.requiredPatterns.forEach((pattern, index) => {
          if (!pattern.test(content)) {
            warnings.push(`Required pattern ${index + 1} not found`);
          }
        });
      }

      if (rules.forbiddenPatterns) {
        rules.forbiddenPatterns.forEach((pattern, index) => {
          if (pattern.test(content)) {
            errors.push(`Forbidden pattern ${index + 1} found`);
          }
        });
      }
    }

    setValidationErrors(errors);
    setValidationWarnings(warnings);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }, []);

  return {
    validationErrors,
    validationWarnings,
    validateContent,
  };
};
