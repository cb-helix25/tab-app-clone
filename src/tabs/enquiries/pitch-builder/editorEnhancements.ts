import { TemplateBlock } from '../../../app/customisation/ProductionTemplateBlocks';

/**
 * Enhanced text formatting utilities
 */
export class EditorFormatter {
  private static instance: EditorFormatter;
  
  static getInstance(): EditorFormatter {
    if (!EditorFormatter.instance) {
      EditorFormatter.instance = new EditorFormatter();
    }
    return EditorFormatter.instance;
  }

  /**
   * Safely execute document commands with error handling
   */
  executeCommand(command: string, value?: string): boolean {
// invisible change
    try {
      return document.execCommand(command, false, value);
    } catch (error) {
      console.warn(`Failed to execute command ${command}:`, error);
      return false;
    }
  }

  /**
   * Get current format state with error handling
   */
  getFormatState(command: string): boolean {
    try {
      return document.queryCommandState(command);
    } catch (error) {
      console.warn(`Failed to get state for ${command}:`, error);
      return false;
    }
  }

  /**
   * Enhanced link insertion with validation
   */
  insertLink(url?: string): boolean {
    if (!url) {
      const inputUrl = prompt('Enter the URL:');
      if (!inputUrl) return false;
      url = inputUrl;
    }

    // Basic URL validation
    const urlPattern = /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/;
    if (!urlPattern.test(url)) {
      // Try to fix common URL issues
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }
    }

    return this.executeCommand('createLink', url);
  }

  /**
   * Enhanced list creation with better formatting
   */
  createList(type: 'bullet' | 'number' | 'letter'): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    switch (type) {
      case 'bullet':
        return this.executeCommand('insertUnorderedList');
      case 'number':
        return this.executeCommand('insertOrderedList');
      case 'letter':
        return this.createLetteredList();
      default:
        return false;
    }
  }

  /**
   * Create a properly formatted lettered list
   */
  private createLetteredList(): boolean {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return false;

    const range = selection.getRangeAt(0);
    
    try {
      const ol = document.createElement('ol');
      ol.style.listStyleType = 'lower-alpha';
      ol.style.paddingLeft = '20px';
      ol.style.marginLeft = '0';
      
      const li = document.createElement('li');
      li.style.marginBottom = '4px';
      
      if (range.collapsed) {
        ol.appendChild(li);
        range.insertNode(ol);
        
        // Position cursor inside the list item
        const newRange = document.createRange();
        newRange.setStart(li, 0);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      } else {
        const content = range.extractContents();
        li.appendChild(content);
        ol.appendChild(li);
        range.insertNode(ol);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to create lettered list:', error);
      return false;
    }
  }
}

/**
 * Content validation and cleanup utilities
 */
export class ContentValidator {
  /**
   * Validate and clean HTML content
   */
  static cleanHtml(html: string): string {
    // Remove potentially dangerous elements
    const dangerousPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /<object[^>]*>.*?<\/object>/gi,
      /<embed[^>]*>.*?<\/embed>/gi,
      /on\w+\s*=\s*"[^"]*"/gi, // Remove event handlers
    ];

    let cleaned = html;
    dangerousPatterns.forEach(pattern => {
      cleaned = cleaned.replace(pattern, '');
    });

    return cleaned;
  }

  /**
   * Validate template block content
   */
  static validateBlockContent(block: TemplateBlock, content: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for required placeholders
    if (block.placeholder && !content.includes(block.placeholder)) {
      warnings.push(`Block placeholder "${block.placeholder}" not found in content`);
    }

    // Check content length
    if (content.length > 10000) {
      warnings.push('Content is very long and may affect performance');
    }

    // Check for empty content
    if (!content.trim()) {
      errors.push('Content cannot be empty');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }
}

/**
 * Performance optimization utilities
 */
export class PerformanceOptimizer {
  private static debounceTimers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Debounce function calls to improve performance
   */
  static debounce<T extends (...args: any[]) => any>(
    func: T,
    delay: number,
    key: string
  ): (...args: Parameters<T>) => void {
    return (...args: Parameters<T>) => {
      const existingTimer = this.debounceTimers.get(key);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const timer = setTimeout(() => {
        func(...args);
        this.debounceTimers.delete(key);
      }, delay);

      this.debounceTimers.set(key, timer);
    };
  }

  /**
   * Throttle function calls
   */
  static throttle<T extends (...args: any[]) => any>(
    func: T,
    delay: number
  ): (...args: Parameters<T>) => void {
    let lastCall = 0;
    
    return (...args: Parameters<T>) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }
}

/**
 * Enhanced keyboard shortcut handler
 */
export class KeyboardHandler {
  private shortcuts: Map<string, () => void> = new Map();

  /**
   * Register a keyboard shortcut
   */
  register(shortcut: string, callback: () => void): void {
    this.shortcuts.set(shortcut.toLowerCase(), callback);
  }

  /**
   * Handle keyboard events
   */
  handleKeyEvent(event: KeyboardEvent): boolean {
    const { key, ctrlKey, metaKey, shiftKey, altKey } = event;
    
    const modifiers = [];
    if (ctrlKey || metaKey) modifiers.push('ctrl');
    if (shiftKey) modifiers.push('shift');
    if (altKey) modifiers.push('alt');
    
    const shortcut = [...modifiers, key.toLowerCase()].join('+');
    
    const callback = this.shortcuts.get(shortcut);
    if (callback) {
      event.preventDefault();
      callback();
      return true;
    }
    
    return false;
  }

  /**
   * Get all registered shortcuts
   */
  getShortcuts(): string[] {
    return Array.from(this.shortcuts.keys());
  }
}

/**
 * State management helper for complex editor state
 */
export class EditorStateManager {
  private state: Map<string, any> = new Map();
  private listeners: Map<string, Set<(value: any) => void>> = new Map();

  /**
   * Set a state value
   */
  setState<T>(key: string, value: T): void {
    this.state.set(key, value);
    this.notifyListeners(key, value);
  }

  /**
   * Get a state value
   */
  getState<T>(key: string): T | undefined {
    return this.state.get(key);
  }

  /**
   * Subscribe to state changes
   */
  subscribe<T>(key: string, listener: (value: T) => void): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }
    
    this.listeners.get(key)!.add(listener);
    
    // Return unsubscribe function
    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(listener);
        if (keyListeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  /**
   * Notify listeners of state changes
   */
  private notifyListeners(key: string, value: any): void {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach(listener => listener(value));
    }
  }

  /**
   * Clear all state
   */
  clear(): void {
    this.state.clear();
    this.listeners.clear();
  }
}

// Export singleton instances for easy use
export const editorFormatter = EditorFormatter.getInstance();
export const performanceOptimizer = PerformanceOptimizer;
export const contentValidator = ContentValidator;
