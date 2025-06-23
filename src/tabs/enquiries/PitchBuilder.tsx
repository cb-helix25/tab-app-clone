// src/tabs/enquiries/PitchBuilder.tsx

import React, { useState, useEffect, useRef } from 'react';
import {
  Stack,
  IDropdownOption,
  PrimaryButton,
  DefaultButton,
  mergeStyles,
  Label,
  IIconProps,
  Icon,
  Callout,
  IconButton,
  Dropdown,
  FocusZone,
  FocusZoneDirection,
  DirectionalHint,
  Separator,
  Checkbox,
  ChoiceGroup,
  IChoiceGroupOption,
  Text,
} from '@fluentui/react';
import { Enquiry } from '../../app/functionality/types';
import { colours } from '../../app/styles/colours';
import BubbleTextField from '../../app/styles/BubbleTextField';
import { useTheme } from '../../app/functionality/ThemeContext';
import PracticeAreaPitch, { PracticeAreaPitchType } from '../../app/customisation/PracticeAreaPitch';
import { TemplateBlock, TemplateOption } from '../../app/customisation/ProductionTemplateBlocks';
import { getTemplateBlocks, TemplateSet, templateSetOptions } from '../../app/customisation/TemplateBlockSets';
import { availableAttachments, AttachmentOption } from '../../app/customisation/Attachments';
import {
  sharedPrimaryButtonStyles,
  sharedDefaultButtonStyles,
  sharedDraftConfirmedButtonStyles,
  inlineOptionButtonStyles,
} from '../../app/styles/ButtonStyles';
import {
  sharedEditorStyle,
  sharedOptionsDropdownStyles,
} from '../../app/styles/FilterStyles';
import ReactDOMServer from 'react-dom/server';
import EmailSignature from './EmailSignature';
import EmailPreview from './pitch-builder/EmailPreview';
import EditorAndTemplateBlocks from './pitch-builder/EditorAndTemplateBlocks';
import PitchHeaderRow from './pitch-builder/PitchHeaderRow';
import OperationStatusToast from './pitch-builder/OperationStatusToast';
import { isInTeams } from '../../app/functionality/isInTeams';
import {
  convertDoubleBreaksToParagraphs,
  removeUnfilledPlaceholders,
  removeHighlightSpans,
  cleanTemplateString,
  isStringArray,
  replacePlaceholders,
  applyDynamicSubstitutions,
} from './pitch-builder/emailUtils';
import { inputFieldStyle } from '../../CustomForms/BespokeForms';

interface PitchBuilderProps {
  enquiry: Enquiry;
  userData: any;
}

interface ClientInfo {
  firstName: string;
  lastName: string;
  email: string;
}


const boldIcon: IIconProps = { iconName: 'Bold' };
const italicIcon: IIconProps = { iconName: 'Italic' };
const underlineIcon: IIconProps = { iconName: 'Underline' };
const unorderedListIcon: IIconProps = { iconName: 'BulletedList' };
const orderedListIcon: IIconProps = { iconName: 'NumberedList' };
const linkIcon: IIconProps = { iconName: 'Link' };
const clearIcon: IIconProps = { iconName: 'Cancel' };
const letteredListIcon: IIconProps = { iconName: 'SortLines' };

// Simple 2D padlock icons used in template block bubbles
const lockedSvg =
  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';
const unlockedSvg =
  '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="10" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 9.9-1"/></svg>';

// Inject styles for inline block labels and option callout
if (typeof window !== 'undefined' && !document.getElementById('block-label-style')) {
  const style = document.createElement('style');
  style.id = 'block-label-style';
  style.innerHTML = `
    .block-controls {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 10px;
      color: ${colours.greyText};
      margin-top: 8px;
    }
    .block-controls .actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .block-controls .icon-btn {
      width: 16px;
      height: 16px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: ${colours.grey};
      color: ${colours.greyText};
      cursor: pointer;
      font-size: 10px;
      user-select: none;
    }
    .block-label {
      flex-grow: 1;
      position: relative;
      cursor: pointer;
      display: inline-block;
      font-weight: 600;
      margin-bottom: 4px;
    }
    .block-label:hover {
      text-decoration: underline;
      color: ${colours.highlight};
    }
    .block-label:hover::after {
      content: attr(data-selected);
      position: absolute;
      left: 0;
      top: 100%;
      background: ${colours.grey};
      color: ${colours.greyText};
      padding: 2px 6px;
      border-radius: 4px;
      white-space: nowrap;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transform: translateY(4px);
      opacity: 0;
      animation: fadeInBlockLabel 0.2s forwards;
      pointer-events: none;
      z-index: 10;
    }
    .option-bubble {
      display: block;
      background: ${colours.highlightBlue};
      color: ${colours.darkBlue};
      padding: 4px 6px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 11px;
      transition: background-color 0.2s;
      margin-bottom: 4px;
    }
    .option-bubble:hover {
      transform: scale(1.05);
      background: ${colours.blue};
    }
    .block-option-list {
      display: block;
      background: ${colours.grey};
      padding: 6px;
      border-radius: 6px;
    }
    .option-choice {
      background: ${colours.highlightBlue};
      color: ${colours.darkBlue};
      padding: 2px 6px;
      border-radius: 12px;
      cursor: pointer;
      font-size: 11px;
      transition: background-color 0.2s;
    }
    .option-choice:hover {
      background: ${colours.blue};
    }
    .inline-options-callout {
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.2);
      animation: fadeInScale 0.2s ease forwards;
      max-width: 280px;
    }
    .option-preview {
      font-size: 11px;
      padding: 0 4px;
      margin-top: 2px;
      display: block;
      text-align: left;
    }
    .selected-block {
      outline: 2px solid ${colours.cta};
      outline-offset: 2px;
    }
    .block-container {
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }
    .block-main {
      flex: 1;
    }
    .block-sidebar {
      border: 1px solid ${colours.grey};
      padding: 4px;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      gap: 4px;
      min-width: 120px;
    }
    .block-sidebar .option-choices {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .option-choice.selected {
      background: ${colours.blue};
      color: #ffffff;
    }
    .sentence-delete {
      font-weight: bold;
      margin-right: 4px;
      cursor: pointer;
      user-select: none;
      color: ${colours.red};
    }
    @keyframes fadeInScale {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes fadeInBlockLabel {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}

const PitchBuilder: React.FC<PitchBuilderProps> = ({ enquiry, userData }) => {
  const { isDarkMode } = useTheme();
  const userInitials = userData?.[0]?.Initials?.toUpperCase() || '';

  const [templateSet, setTemplateSet] = useState<TemplateSet>('Simplified');
  const templateBlocks = getTemplateBlocks(templateSet);

  function handleTemplateSetChange(newSet: TemplateSet) {
    setTemplateSet(newSet);
    const newBlocks = getTemplateBlocks(newSet);
    setBlocks(newBlocks);
    const newBody = generateInitialBody(newBlocks);
    setBody(newBody);
    if (bodyEditorRef.current) {
      bodyEditorRef.current.innerHTML = newBody;
    }
    setSelectedTemplateOptions({});
    setInsertedBlocks({});
    setLockedBlocks({});
    setEditedBlocks({});
    setOriginalBlockContent({});
  }

  // Service options
  const SERVICE_OPTIONS: IDropdownOption[] = [
    { key: 'Shareholder Dispute', text: 'Shareholder Dispute' },
    { key: 'Debt Recovery', text: 'Debt Recovery' },
    { key: 'Commercial Contract', text: 'Commercial Contract' },
    { key: 'Other', text: 'Other (bespoke)' },
  ];

  const initialOption = SERVICE_OPTIONS.find(opt => opt.text === enquiry.Type_of_Work);
  const [serviceDescription, setServiceDescription] = useState<string>(initialOption?.text || '');
  const [selectedOption, setSelectedOption] = useState<IDropdownOption | undefined>(initialOption);
  const [amount, setAmount] = useState<string>('');
  function handleAmountChange(val?: string) {
    setAmount(val ?? '');
  }
  function handleAmountBlur() {
    if (!amount) return;
    const numeric = parseFloat(amount.replace(/[^0-9.]/g, ''));
    if (!isNaN(numeric)) {
      setAmount(numeric.toFixed(2));
    }
  }

  function highlightBlock(
    blockTitle: string,
    highlight: boolean,
    source?: 'editor' | 'template'
  ) {
    const isLocked = lockedBlocks[blockTitle];
    const headerElement = document.getElementById(
      `template-block-header-${blockTitle.replace(/\s+/g, '-')}`
    );
    const baseScale = 0.03;
    const hoveredScale = 1 + baseScale * 0.25; // 75% less
    const otherScale = 1 + baseScale * 0.5; // 50% less
    const defaultScale = 1 + baseScale;
    let headerScale = 1;
    let editorScale = 1;

    if (highlight) {
      if (source === 'editor') {
        headerScale = otherScale;
        editorScale = hoveredScale;
      } else if (source === 'template') {
        headerScale = hoveredScale;
        editorScale = otherScale;
      } else {
        headerScale = defaultScale;
        editorScale = defaultScale;
      }
    }

    if (headerElement) {
      const lockedBg = isDarkMode ? 'rgba(16,124,16,0.1)' : '#eafaea';
      const blueBg = colours.highlightBlue;
      headerElement.style.transition = 'background-color 0.2s, transform 0.2s, font-weight 0.2s';
      let bg = 'transparent';

      const isInserted =
        insertedBlocks[blockTitle] ||
        document.querySelector(`span[data-inserted="${blockTitle}"]`);

      if (highlight || isInserted) {
        if (lockedBlocks[blockTitle]) {
          bg = lockedBg;
        } else if (Object.values(editedSnippets[blockTitle] || {}).some(Boolean)) {
          bg = blueBg;
        } else {
          bg = colours.highlightYellow;
        }
      }
      headerElement.style.backgroundColor = bg;
      const active = highlight && !isLocked;
      headerElement.style.fontWeight = active ? '600' : 'normal';
      headerElement.style.transform = `scale(${headerScale})`;
    }

    const insertedSpans = document.querySelectorAll(`span[data-inserted="${blockTitle}"]`);
    insertedSpans.forEach((span) => {
      if (!(span instanceof HTMLElement)) return;

      // pull lockedBg into scope here
      const lockedBg = isDarkMode ? 'rgba(16,124,16,0.1)' : '#eafaea';

      span.style.transition = 'background-color 0.2s, outline 0.2s, transform 0.2s, font-weight 0.2s';
      span.style.outline = highlight && !isLocked ? `1px dotted ${colours.cta}` : 'none';
      span.style.borderRadius = '0px';
      span.style.fontWeight = 'normal';
      span.style.transform = `scale(${editorScale})`;

      span.querySelectorAll('div[data-snippet]').forEach((snip) => {
        if (!(snip instanceof HTMLElement)) return;
        const label = snip.getAttribute('data-snippet') || '';
        let bg = colours.highlightYellow;
        if (lockedBlocks[blockTitle]) {
          bg = lockedBg;
        } else if (editedSnippets[blockTitle]?.[label]) {
          bg = colours.highlightBlue;
        }
        snip.style.backgroundColor = bg;
      });

      // now lockedBg is in scope here
      span.style.backgroundColor = lockedBlocks[blockTitle]
        ? lockedBg
        : colours.highlightYellow;
    });

    const block = templateBlocks.find((b) => b.title === blockTitle);
    if (block) {
      const placeholders = document.querySelectorAll(
        `span[data-placeholder="${block.placeholder}"]`
      );
      placeholders.forEach((ph) => {
        if (ph instanceof HTMLElement) {
          ph.style.transition = 'transform 0.2s, font-weight 0.2s';
          ph.style.transform = `scale(${editorScale})`;
        }
      });
    }
  }

  function toggleBlockLock(blockTitle: string) {
    setLockedBlocks(prev => {
      const locked = !prev[blockTitle];
      const updated = { ...prev, [blockTitle]: locked };
      const spans = bodyEditorRef.current?.querySelectorAll(
        `span[data-inserted="${blockTitle}"]`
      ) as NodeListOf<HTMLElement> | null;
      if (spans) {
        const lockedBg = isDarkMode ? 'rgba(16,124,16,0.1)' : '#eafaea';
        spans.forEach(span => {
          span.setAttribute('contenteditable', (!locked).toString());
          const icon = span.querySelector('.lock-toggle i') as HTMLElement | null;
          if (icon) {
            icon.className = `ms-Icon ms-Icon--${locked ? 'Lock' : 'Unlock'}`;
          }
        });
        highlightBlock(blockTitle, false);
      }
      return updated;
    });
  }

  function openSnippetOptions(
    e: MouseEvent,
    blockTitle: string,
    snippetLabel: string
  ) {
    e.stopPropagation();
    e.preventDefault();
    const block = templateBlocks.find((b) => b.title === blockTitle);
    if (block) {
      setSnippetOptionsTarget(e.currentTarget as HTMLElement);
      setSnippetOptionsBlock(block);
      setSnippetOptionsLabel(snippetLabel);
    }
  }

  function closeSnippetOptions() {
    setSnippetOptionsBlock(null);
    setSnippetOptionsTarget(null);
    setSnippetOptionsLabel('');
  }

  function insertBlockOption(blockTitle: string, optionLabel: string) {
    const block = templateBlocks.find((b) => b.title === blockTitle);
    if (!block) return;
    if (block.isMultiSelect) {
      const current = Array.isArray(selectedTemplateOptions[blockTitle])
        ? ([...(selectedTemplateOptions[blockTitle] as string[])])
        : [];
      if (current.includes(optionLabel)) return;
      const updated = [...current, optionLabel];
      handleMultiSelectChange(blockTitle, updated);
      if (insertedBlocks[blockTitle]) {
        appendSnippetOption(block, optionLabel);
      } else {
        insertTemplateBlock(block, updated, true, false);
      }
    } else {
      if (selectedTemplateOptions[blockTitle] === optionLabel && insertedBlocks[blockTitle]) {
        return;
      }
      handleSingleSelectChange(blockTitle, optionLabel);
      if (insertedBlocks[blockTitle]) {
        appendSnippetOption(block, optionLabel);
      } else {
        insertTemplateBlock(block, optionLabel, true);
      }
    }
  }

  function resetBlockOption(blockTitle: string) {
    const block = templateBlocks.find((b) => b.title === blockTitle);
    if (!block) return;
    const selected = selectedTemplateOptions[blockTitle];
    if (!selected) return;
    insertTemplateBlock(block, selected, true, false);
  }

  useEffect(() => {
    (window as any).toggleBlockLock = toggleBlockLock;
    (window as any).highlightBlock = highlightBlock;
    (window as any).openSnippetOptions = openSnippetOptions;
    (window as any).insertBlockOption = insertBlockOption;
    (window as any).resetBlockOption = resetBlockOption;
    (window as any).removeBlock = (title: string) => {
      const block = templateBlocks.find((b) => b.title === title);
      if (block) handleClearBlock(block);
    };
  }, [toggleBlockLock, highlightBlock, openSnippetOptions, insertBlockOption, resetBlockOption, templateBlocks]);

  // Simple helper to capitalize your "Area_of_Work" for the subject line
  function capitalizeWords(str: string): string {
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  const [blocks, setBlocks] = useState<TemplateBlock[]>(getTemplateBlocks('Simplified'));

  // Default subject
  const [subject, setSubject] = useState<string>(
    enquiry.Area_of_Work
      ? `Your ${capitalizeWords(enquiry.Area_of_Work)} Enquiry`
      : 'Your Enquiry'
  );

  // Default recipient fields
  const [to, setTo] = useState<string>(enquiry.Email || '');
  const [cc, setCc] = useState<string>('');
  const [bcc, setBcc] = useState<string>('1day@followupthen.com');

  function generateBaseTemplate(blocks: TemplateBlock[]): string {
    return `Dear [Enquiry.First_Name],\n\n${blocks
      .map((b) => b.placeholder)
      .join('\n\n')}\n\nKind Regards,<br>\n\n[First Name]<br>\n\n[Full Name]<br>\n[Position]`;
  }

  const BASE_TEMPLATE = React.useMemo(
    () => generateBaseTemplate(blocks),
    [blocks]
  );

  function generateInitialBody(blocks: TemplateBlock[]): string {
    return replacePlaceholders(
      generateBaseTemplate(blocks),
      '',
      enquiry,
      userData,
      blocks
    )
      .split('\n')
      .map((line) => line.trim())
      .join('\n');
  }

  function buildPlaceholder(block: TemplateBlock): string {
    const options = block.options
      .map((o) => {
        const preview = cleanTemplateString(o.previewText).replace(/<p>/g, `<p style="margin: 0;">`);
        return `<div class="option-bubble" data-block-title="${block.title}" data-option-label="${o.label}"><strong>${o.label}</strong><div class="option-preview">${preview}</div></div>`;
      })
      .join('');
    return `<span data-placeholder="${block.placeholder}" class="block-option-list"><span class="block-label" data-label-title="${block.title}">${block.title}</span>${options}</span>`;
  }

  const [body, setBody] = useState<string>(() => generateInitialBody(blocks));

  useEffect(() => {
    // No automatic insertion of default options
  }, [enquiry.Area_of_Work]);

  // Attachments, followUp, preview, error states, etc...
  const [attachments, setAttachments] = useState<string[]>([]);
  const [followUp, setFollowUp] = useState<string | undefined>(undefined);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState<boolean>(false);
  const [isErrorVisible, setIsErrorVisible] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // **New State: Confirmation State for Draft Email Button**
  const [isDraftConfirmed, setIsDraftConfirmed] = useState<boolean>(false);

  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
    loading?: boolean;
  } | null>(null);

  const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

  // Tab state to switch between email details and deals
  const [activeTab, setActiveTab] = useState<string>('details');

  // IDs returned after saving a deal
  const [dealId, setDealId] = useState<number | null>(null);
  const [dealPasscode, setDealPasscode] = useState<string>('');
  const [clientIds, setClientIds] = useState<number[]>([]);
  const [dealClients, setDealClients] = useState<ClientInfo[]>([]);
  const [isMultiClientFlag, setIsMultiClientFlag] = useState<boolean>(false);


  // Tracks selected template options for each block
  const [selectedTemplateOptions, setSelectedTemplateOptions] = useState<{
    [key: string]: string | string[];
  }>({});

  // Tracks which blocks have been inserted
  const [insertedBlocks, setInsertedBlocks] = useState<{ [key: string]: boolean }>({});

  const [lockedBlocks, setLockedBlocks] = useState<{ [key: string]: boolean }>({});

  const [editedBlocks, setEditedBlocks] = useState<{ [key: string]: boolean }>({});
  const [editedSnippets, setEditedSnippets] = useState<{
    [key: string]: { [label: string]: boolean };
  }>({});
  const [originalBlockContent, setOriginalBlockContent] = useState<{ [key: string]: string }>({});
  const [originalSnippetContent, setOriginalSnippetContent] = useState<{
    [key: string]: { [label: string]: string };
  }>({});
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);

  const [snippetOptionsBlock, setSnippetOptionsBlock] = useState<TemplateBlock | null>(null);
  const [snippetOptionsLabel, setSnippetOptionsLabel] = useState<string>('');
  const [snippetOptionsTarget, setSnippetOptionsTarget] = useState<HTMLElement | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<{
    block: TemplateBlock;
    option?: string;
    target: HTMLElement | null;
  } | null>(null);

  useEffect(() => {
    templateBlocks.forEach((block) => {
      highlightBlock(block.title, false);
    });
  }, [insertedBlocks, lockedBlocks, editedBlocks, isDarkMode, body]);

  // For the body editor
  const bodyEditorRef = useRef<HTMLDivElement>(null);
  const savedSelection = useRef<Range | null>(null);

  useEffect(() => {
    const editor = bodyEditorRef.current;
    if (!editor) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const del = (target as HTMLElement).closest('.sentence-delete');
      if (del) {
        const sentence = del.closest('[data-sentence]');
        if (sentence && editor.contains(sentence)) {
          sentence.remove();
          setBody(editor.innerHTML);
        }
        return;
      }

      const bubble = (target as HTMLElement).closest('.option-bubble');
      if (bubble) {
        const blockTitle = bubble.getAttribute('data-block-title');
        const optionLabel = bubble.getAttribute('data-option-label');
        if (blockTitle && optionLabel) {
          const block = templateBlocks.find((b) => b.title === blockTitle);
          if (!block) return;
          const isSelected = block.isMultiSelect
            ? Array.isArray(selectedTemplateOptions[blockTitle]) &&
            (selectedTemplateOptions[blockTitle] as string[]).includes(optionLabel)
            : selectedTemplateOptions[blockTitle] === optionLabel;
          if (isSelected) {
            if (Object.values(editedSnippets[blockTitle] || {}).some(Boolean)) {
              setRemoveConfirm({ block, option: optionLabel, target: bubble as HTMLElement });
            } else {
              removeBlockOption(block, optionLabel);
            }
          } else {
            insertBlockOption(blockTitle, optionLabel);
          }
          return;
        }
      }

      const choice = (target as HTMLElement).closest('.option-choice');
      if (choice) {
        const blockTitle = choice.getAttribute('data-block-title');
        const optionLabel = choice.getAttribute('data-option-label');
        if (blockTitle && optionLabel) {
          if (choice.classList.contains('reset-option')) {
            resetBlockOption(blockTitle);
            return;
          }
          const block = templateBlocks.find((b) => b.title === blockTitle);
          if (!block) return;
          const isSelected = block.isMultiSelect
            ? Array.isArray(selectedTemplateOptions[blockTitle]) &&
            (selectedTemplateOptions[blockTitle] as string[]).includes(optionLabel)
            : selectedTemplateOptions[blockTitle] === optionLabel;
          if (isSelected) {
            if (Object.values(editedSnippets[blockTitle] || {}).some(Boolean)) {
              setRemoveConfirm({ block, option: optionLabel, target: choice as HTMLElement });
            } else {
              removeBlockOption(block, optionLabel);
            }
          } else {
            insertBlockOption(blockTitle, optionLabel);
          }
          return;
        }
      }
    };
    editor.addEventListener('click', handleClick);
    return () => editor.removeEventListener('click', handleClick);
  }, [insertBlockOption, resetBlockOption]);

  /**
   * Save the user's cursor selection in the contentEditable, so we can insert text at that exact spot.
   */
  function saveSelection() {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelection.current = sel.getRangeAt(0).cloneRange();
    }
  }

  function restoreSelection() {
    const sel = window.getSelection();
    if (sel && savedSelection.current) {
      sel.removeAllRanges();
      sel.addRange(savedSelection.current);
    }
  }

  function isSelectionInsideEditor(): boolean {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return false;
    let node = sel.getRangeAt(0).commonAncestorContainer;
    if (node.nodeType === Node.TEXT_NODE) {
      node = node.parentNode!;
    }
    return bodyEditorRef.current?.contains(node) || false;
  }

  function normalizeHtml(html: string): string {
    const div = document.createElement('div');
    div.innerHTML = html;
    return (div.textContent || '').replace(/\s+/g, ' ').trim();
  }

  function isContentChanged(current: string, original: string): boolean {
    const clean = (html: string) =>
      html.replace(/<span class="lock-toggle"[^>]*>.*?<\/span>/, '');
    return normalizeHtml(clean(current)) !== normalizeHtml(clean(original));
  }

  function computeSnippetChanges() {
    if (!bodyEditorRef.current) return { blocks: {}, snippets: {} };
    const updatedBlocks: { [key: string]: boolean } = {};
    const updatedSnippets: { [key: string]: { [label: string]: boolean } } = {};

    const lockedBg = isDarkMode ? 'rgba(16,124,16,0.1)' : '#eafaea';

    Object.keys(insertedBlocks).forEach((title) => {
      if (!insertedBlocks[title]) return;
      const span = bodyEditorRef.current!.querySelector(
        `span[data-inserted="${title}"]`
      ) as HTMLElement | null;
      if (!span) return;

      const snippetEls = Array.from(
        span.querySelectorAll('div[data-snippet]')
      ) as HTMLElement[];
      snippetEls.forEach((el) => {
        const label = el.getAttribute('data-snippet') || '';
        const original = originalSnippetContent[title]?.[label];
        if (original === undefined) return;
        const changed = isContentChanged(el.innerHTML, original);
        if (!updatedSnippets[title]) updatedSnippets[title] = {};
        updatedSnippets[title][label] = changed;
        if (changed) updatedBlocks[title] = true;

        el.style.backgroundColor = lockedBlocks[title]
          ? lockedBg
          : changed
            ? colours.highlightBlue
            : colours.highlightYellow;
      });

      const headerElement = document.getElementById(
        `template-block-header-${title.replace(/\s+/g, '-')}`
      );
      if (headerElement) {
        let bg = 'transparent';
        if (lockedBlocks[title]) {
          bg = lockedBg;
        } else if (Object.values(updatedSnippets[title] || {}).some(Boolean)) {
          bg = colours.highlightBlue;
        } else if (insertedBlocks[title]) {
          bg = colours.highlightYellow;
        }
        headerElement.style.backgroundColor = bg;
      }

      if (!updatedBlocks[title]) updatedBlocks[title] = false;
    });

    return { blocks: updatedBlocks, snippets: updatedSnippets };
  }

  /**
   * Insert some HTML at the cursor. If there's no selection, we append at the end.
   */
  function insertAtCursor(html: string) {
    if (!isSelectionInsideEditor()) {
      setBody((prevBody) => prevBody + `\n\n${html}`);
      return;
    }

    restoreSelection();
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      const range = sel.getRangeAt(0);
      range.deleteContents();

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = html;
      const fragment = document.createDocumentFragment();
      let node: ChildNode | null;
      while ((node = tempDiv.firstChild)) {
        fragment.appendChild(node);
      }
      range.insertNode(fragment);

      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);

      saveSelection();

      if (bodyEditorRef.current) {
        setBody(bodyEditorRef.current.innerHTML);
      }
    }
  }

  /**
   * Insert a single template option's preview text at the current cursor
   * position, without wrapping it in block controls.
   */
  function insertOptionAtCursor(block: TemplateBlock, optionLabel: string) {
    const option = block.options.find((o) => o.label === optionLabel);
    if (!option) return;
    let html = option.previewText.trim().replace(/\n/g, '<br />');
    html = applyDynamicSubstitutions(
      html,
      userData,
      enquiry,
      amount,
      dealPasscode,
      dealPasscode
        ? `${process.env.REACT_APP_CHECKOUT_URL}?passcode=${dealPasscode}`
        : undefined
    );
    insertAtCursor(html);
  }

  /**
   * Insert a template block's text (either single or multiSelect) at the corresponding placeholder <span>.
   */
  function insertTemplateBlock(
    block: TemplateBlock,
    selectedOption: string | string[],
    shouldFocus: boolean = true,
    append: boolean = false
  ) {
    const snippetHtml: string[] = [];
    const snippetMap: { [label: string]: string } = {};
    if (block.isMultiSelect && isStringArray(selectedOption)) {
      selectedOption.forEach((opt) => {
        const option = block.options.find((o) => o.label === opt);
        if (!option) return;
        let text = option.previewText.trim().replace(/\n/g, '<br />');
        text = applyDynamicSubstitutions(
          text,
          userData,
          enquiry,
          amount,
          dealPasscode,
          dealPasscode
            ? `${process.env.REACT_APP_CHECKOUT_URL}?passcode=${dealPasscode}`
            : undefined
        );
        text = cleanTemplateString(text).replace(/<p>/g, `<p style="margin: 0;">`);
        const escLabel = opt.replace(/'/g, "&#39;");
        const sentences = text
          .split(/(?<=[.!?])\s+/)
          .filter((s) => s.trim().length > 0)
          .map(
            (s) =>
              `<span data-sentence contenteditable="true"><span class="sentence-delete" contenteditable="false">&times;</span>${s.trim()}</span>`
          )
          .join(' ');
        const html = `<div data-snippet="${escLabel}" style="margin-bottom:4px;">${sentences}</div>`;
        snippetHtml.push(html);
        snippetMap[opt] = html;
      });
    } else if (typeof selectedOption === 'string') {

      const option = block.options.find((o) => o.label === selectedOption);
      if (option) {
        let text = option.previewText.trim().replace(/\n/g, '<br />');
        text = applyDynamicSubstitutions(
          text,
          userData,
          enquiry,
          amount,
          dealPasscode,
          dealPasscode
            ? `${process.env.REACT_APP_CHECKOUT_URL}?passcode=${dealPasscode}`
            : undefined
        );
        text = cleanTemplateString(text).replace(/<p>/g, `<p style="margin: 0;">`);
        const escLabel = selectedOption.replace(/'/g, "&#39;");
        const sentences = text
          .split(/(?<=[.!?])\s+/)
          .filter((s) => s.trim().length > 0)
          .map(
            (s) =>
              `<span data-sentence contenteditable="true"><span class="sentence-delete" contenteditable="false">&times;</span>${s.trim()}</span>`
          )
          .join(' ');
        const html = `<div data-snippet="${escLabel}" style="margin-bottom:4px;">${sentences}</div>`;
        snippetHtml.push(html);
        snippetMap[selectedOption] = html;
      }

    }

    const replacementText = snippetHtml.join('');
    let selectedLabel = '';
    if (block.isMultiSelect && isStringArray(selectedOption)) {
      selectedLabel = selectedOption.join(', ');
    } else if (typeof selectedOption === 'string') {
      selectedLabel = selectedOption;
    }
    const containerTag = 'span';
    const style = `background-color: ${colours.highlightYellow}; padding: 7px; display: flex; align-items: flex-start; gap: 8px; border-radius: 0px; font-weight: normal;`;
    const innerHTML = cleanTemplateString(replacementText);
    const styledInnerHTML = innerHTML.replace(
      /<p>/g,
      `<p style="margin: 0;">`
    );
    const optionsHtml = block.options
      .map(o => {
        const isSel = block.isMultiSelect && Array.isArray(selectedOption)
          ? (selectedOption as string[]).includes(o.label)
          : selectedOption === o.label;
        return `<div class="option-choice${isSel ? ' selected' : ''}" data-block-title="${block.title}" data-option-label="${o.label}">${o.label}</div>`;
      })
      .join('');
    const controlsHTML = `<div class="block-sidebar"><span class="block-label" data-label-title="${block.title}" data-set="${templateSet}" data-selected="${selectedLabel}">${block.title} (${templateSet}: ${selectedLabel})</span><div class="actions"><span class="icon-btn lock-toggle" onclick="window.toggleBlockLock('${block.title}')"><i class="ms-Icon ms-Icon--Unlock"></i></span><span class="icon-btn" onclick="window.removeBlock('${block.title}')"><i class="ms-Icon ms-Icon--Delete"></i></span></div><div class="option-choices">${optionsHtml}</div></div>`;
    const highlightedReplacement = `<${containerTag} class="block-container" style="${style}" data-inserted="${block.title}" data-placeholder="${block.placeholder}" contenteditable="true"><div class="block-main">${styledInnerHTML}</div>${controlsHTML}</${containerTag}>`;

    // Simplified hover handlers to directly call highlightBlock
    const wrappedHTML = `<!--START_BLOCK:${block.title}--><span data-block-title="${block.title}" onmouseover="window.highlightBlock('${block.title}', true, 'editor')" onmouseout="window.highlightBlock('${block.title}', false, 'editor')">${highlightedReplacement}</span><!--END_BLOCK:${block.title}-->`;

    setBody((prevBody) => {
      const existingBlockRegex = new RegExp(
        `<!--START_BLOCK:${block.title}-->[\\s\\S]*?<!--END_BLOCK:${block.title}-->`,
        'g'
      );
      if (existingBlockRegex.test(prevBody)) {
        if (append) {
          return prevBody.replace(existingBlockRegex, (match) =>
            match.replace(
              `<!--END_BLOCK:${block.title}-->`,
              `${highlightedReplacement}<!--END_BLOCK:${block.title}-->`
            )
          );
        }
        return prevBody.replace(existingBlockRegex, wrappedHTML);
      }
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = prevBody;
      const target = tempDiv.querySelector(
        `span[data-placeholder="${block.placeholder}"]`
      );
      if (target) {
        (target as HTMLElement).innerHTML = wrappedHTML;
        const newHTML = tempDiv.innerHTML;
        bodyEditorRef.current &&
          (bodyEditorRef.current.innerHTML = newHTML);
        return newHTML;
      }
      const placeholderEsc = block.placeholder.replace(
        /[-[\]{}()*+?.,\\^$|#\s]/g,
        '\\$&'
      );
      const placeholderEscEncoded = block.placeholder
        .replace(/&/g, '&amp;')
        .replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      const placeholderRegex = new RegExp(
        `(<span[^>]*data-placeholder="(?:${placeholderEsc}|${placeholderEscEncoded})"[^>]*>)([\\s\\S]*?)(</span>)`,
        'g'
      );
      const newBody = prevBody.replace(placeholderRegex, `$1${wrappedHTML}$3`);
      bodyEditorRef.current &&
        (bodyEditorRef.current.innerHTML = newBody);
      return newBody;
    });

    // Remove grey placeholder styling once the block is inserted
    setTimeout(() => {
      const phSpan = bodyEditorRef.current?.querySelector(
        `span[data-placeholder="${block.placeholder}"]`
      ) as HTMLElement | null;
      if (phSpan) {
        phSpan.style.backgroundColor = 'transparent';
        phSpan.style.padding = '0';
        phSpan.style.display = 'contents';
      }
    }, 0);

    setInsertedBlocks((prev) => ({ ...prev, [block.title]: true }));
    setLockedBlocks((prev) => ({ ...prev, [block.title]: false }));

    setOriginalBlockContent((prev) => ({
      ...prev,
      [block.title]: append
        ? (prev[block.title] || '') + `${styledInnerHTML}${controlsHTML}`
        : `${styledInnerHTML}${controlsHTML}`,
    }));
    setOriginalSnippetContent((prev) => ({
      ...prev,
      [block.title]: { ...(prev[block.title] || {}), ...snippetMap },
    }));
    setEditedSnippets((prev) => ({
      ...prev,
      [block.title]: {
        ...(prev[block.title] || {}),
        ...Object.fromEntries(Object.keys(snippetMap).map((k) => [k, false])),
      },
    }));
    setEditedBlocks((prev) => ({ ...prev, [block.title]: false }));

    if (shouldFocus) {
      setTimeout(() => {
        if (bodyEditorRef.current) {
          const insertedSpan = bodyEditorRef.current.querySelector(
            `span[data-inserted="${block.title}"]`
          );
          if (insertedSpan) {
            const range = document.createRange();
            const sel = window.getSelection();
            range.setStartAfter(insertedSpan);
            range.collapse(true);
            if (sel) {
              sel.removeAllRanges();
              sel.addRange(range);
              saveSelection();
            }
          }

          // Attach helper functions to window for inline handlers
          (window as any).highlightBlock = highlightBlock;
          (window as any).toggleBlockLock = toggleBlockLock;
          (window as any).insertBlockOption = insertBlockOption;
        }
      }, 0);
    }
  }

  function replaceSnippetOption(
    block: TemplateBlock,
    previous: string,
    replacement: string
  ) {
    if (!bodyEditorRef.current) return;
    const span = bodyEditorRef.current.querySelector(
      `span[data-inserted="${block.title}"]`
    ) as HTMLElement | null;
    if (!span) return;
    const snippetEls = Array.from(
      span.querySelectorAll('div[data-snippet]')
    ) as HTMLElement[];
    const targetEl = snippetEls.find(
      (el) => el.getAttribute('data-snippet') === previous
    );
    if (!targetEl) return;

    const option = block.options.find((o) => o.label === replacement);
    if (!option) return;
    let text = option.previewText.trim().replace(/\n/g, '<br />');
    text = applyDynamicSubstitutions(
      text,
      userData,
      enquiry,
      amount,
      dealPasscode,
      dealPasscode
        ? `${process.env.REACT_APP_CHECKOUT_URL}?passcode=${dealPasscode}`
        : undefined
    );
    text = cleanTemplateString(text).replace(/<p>/g, `<p style="margin: 0;">`);
    targetEl.setAttribute('data-snippet', replacement);
    targetEl.innerHTML = `${text}`;

    setOriginalSnippetContent((prev) => {
      const blockMap = { ...(prev[block.title] || {}) };
      delete blockMap[previous];
      blockMap[replacement] = `<div data-snippet="${replacement.replace(/'/g, "&#39;")}" style="margin-bottom:4px;">${text}</div>`;
      return { ...prev, [block.title]: blockMap };
    });
    setEditedSnippets((prev) => {
      const blockMap = { ...(prev[block.title] || {}) } as { [label: string]: boolean };
      delete blockMap[previous];
      blockMap[replacement] = false;
      return { ...prev, [block.title]: blockMap };
    });

    setOriginalSnippetContent((prev) => ({
      ...prev,
      [block.title]: {
        ...(prev[block.title] || {}),
        [replacement]: `<div data-snippet="${replacement.replace(/'/g, "&#39;")}" style="margin-bottom:4px;">${text}</div>`,
      },
    }));
    setEditedSnippets((prev) => ({
      ...prev,
      [block.title]: { ...(prev[block.title] || {}), [replacement]: false },
    }));

    const optionDiv = span.querySelector('div.option-choices');
    if (optionDiv) {
      const currentSelected = block.isMultiSelect
        ? (selectedTemplateOptions[block.title] as string[])
        : selectedTemplateOptions[block.title];
      const newSelected = block.isMultiSelect
        ? (currentSelected as string[]).map((opt) =>
          opt === previous ? replacement : opt
        )
        : replacement;
      const optionsHtml = block.options
        .filter((o) =>
          block.isMultiSelect && Array.isArray(newSelected)
            ? !(newSelected as string[]).includes(o.label)
            : newSelected !== o.label
        )
        .map((o) => {
          const safe = o.label.replace(/'/g, "&#39;");
          return `<span class="option-choice" data-block-title="${block.title}" data-option-label="${safe}">${o.label}</span>`;
        })
        .join(' ');
      const resetHtml =
        Object.values(editedSnippets[block.title] || {}).some(Boolean) && newSelected
          ? `<span class="option-choice reset-option" data-block-title="${block.title}">Reset</span>`
          : '';
      const optionListContent = [optionsHtml, resetHtml]
        .filter(Boolean)
        .join(' ');
      optionDiv.innerHTML = optionListContent;
    }

    const updatedHtml = span.innerHTML;
    setOriginalBlockContent((prev) => ({ ...prev, [block.title]: updatedHtml }));
    setBody(bodyEditorRef.current.innerHTML);
    setBody(bodyEditorRef.current.innerHTML);

    if (block.isMultiSelect) {
      setSelectedTemplateOptions((prev) => {
        const arr = Array.isArray(prev[block.title])
          ? ([...prev[block.title]] as string[])
          : [];
        const idx = arr.indexOf(previous);
        if (idx !== -1) arr[idx] = replacement;
        return { ...prev, [block.title]: arr };
      });
    } else {
      setSelectedTemplateOptions((prev) => ({
        ...prev,
        [block.title]: replacement,
      }));
    }
  }
  function appendSnippetOption(block: TemplateBlock, optionLabel: string) {
    if (!bodyEditorRef.current) return;
    const span = bodyEditorRef.current.querySelector(
      `span[data-inserted="${block.title}"]`
    ) as HTMLElement | null;
    if (!span) return;
    const main = span.querySelector('.block-main') as HTMLElement | null;
    if (!main) return;

    const option = block.options.find((o) => o.label === optionLabel);
    if (!option) return;

    let text = option.previewText.trim().replace(/\n/g, '<br />');
    text = applyDynamicSubstitutions(
      text,
      userData,
      enquiry,
      amount,
      dealPasscode,
      dealPasscode
        ? `${process.env.REACT_APP_CHECKOUT_URL}?passcode=${dealPasscode}`
        : undefined
    );
    text = cleanTemplateString(text).replace(/<p>/g, `<p style="margin: 0;">`);
    const escLabel = optionLabel.replace(/'/g, "&#39;");
    const sentences = text
      .split(/(?<=[.!?])\s+/)
      .filter((s) => s.trim().length > 0)
      .map(
        (s) =>
          `<span data-sentence contenteditable="true"><span class="sentence-delete" contenteditable="false">&times;</span>${s.trim()}</span>`
      )
      .join(' ');
    const snippetHtml = `<div data-snippet="${escLabel}" style="margin-bottom:4px;">${sentences}</div>`;

    main.insertAdjacentHTML('beforeend', snippetHtml);

    setOriginalSnippetContent((prev) => ({
      ...prev,
      [block.title]: {
        ...(prev[block.title] || {}),
        [optionLabel]: snippetHtml,
      },
    }));
    setEditedSnippets((prev) => ({
      ...prev,
      [block.title]: { ...(prev[block.title] || {}), [optionLabel]: false },
    }));

    const optionDiv = span.querySelector('div.option-choices');
    if (optionDiv) {
      const currentSelected = block.isMultiSelect
        ? (selectedTemplateOptions[block.title] as string[])
        : selectedTemplateOptions[block.title];
      const newSelected = block.isMultiSelect
        ? [
          ...((Array.isArray(currentSelected)
            ? currentSelected
            : []) as string[]),
          optionLabel,
        ]
        : optionLabel;
      const optionsHtml = block.options
        .map((o) => {
          const isSel = block.isMultiSelect && Array.isArray(newSelected)
            ? (newSelected as string[]).includes(o.label)
            : newSelected === o.label;
          return `<div class="option-choice${isSel ? ' selected' : ''}" data-block-title="${block.title}" data-option-label="${o.label}">${o.label}</div>`;
        })
        .join('');
      optionDiv.innerHTML = optionsHtml;
    }

    const updatedHtml = span.innerHTML;
    setOriginalBlockContent((prev) => ({ ...prev, [block.title]: updatedHtml }));
    setBody(bodyEditorRef.current.innerHTML);
    setBody(bodyEditorRef.current.innerHTML);
  }

  function removeSnippetOption(block: TemplateBlock, optionLabel: string) {
    if (!bodyEditorRef.current) return;
    const span = bodyEditorRef.current.querySelector(
      `span[data-inserted="${block.title}"]`
    ) as HTMLElement | null;
    if (!span) return;
    const snippets = Array.from(
      span.querySelectorAll('div[data-snippet]')
    ) as HTMLElement[];
    const target = snippets.find(
      (el) => el.getAttribute('data-snippet') === optionLabel
    );
    if (target) target.remove();
    setOriginalSnippetContent((prev) => {
      const blockMap = { ...(prev[block.title] || {}) };
      delete blockMap[optionLabel];
      return { ...prev, [block.title]: blockMap };
    });
    setEditedSnippets((prev) => {
      const blockMap = { ...(prev[block.title] || {}) };
      delete blockMap[optionLabel];
      return { ...prev, [block.title]: blockMap };
    });

    const optionDiv = span.querySelector('div.option-choices');
    if (optionDiv) {
      const currentSelected = block.isMultiSelect
        ? (selectedTemplateOptions[block.title] as string[])
        : selectedTemplateOptions[block.title];
      const newSelected = block.isMultiSelect
        ? (currentSelected as string[]).filter((o) => o !== optionLabel)
        : '';
      const optionsHtml = block.options
        .map((o) => {
          const isSel = block.isMultiSelect && Array.isArray(newSelected)
            ? (newSelected as string[]).includes(o.label)
            : newSelected === o.label;
          return `<div class="option-choice${isSel ? ' selected' : ''}" data-block-title="${block.title}" data-option-label="${o.label}">${o.label}</div>`;
        })
        .join('');
      optionDiv.innerHTML = optionsHtml;
    }

    const updatedHtml = span.innerHTML;
    setOriginalBlockContent((prev) => ({ ...prev, [block.title]: updatedHtml }));
    setBody(bodyEditorRef.current.innerHTML);
  }

  function removeBlockOption(block: TemplateBlock, optionLabel: string) {
    if (block.isMultiSelect) {
      const current = Array.isArray(selectedTemplateOptions[block.title])
        ? ([...(selectedTemplateOptions[block.title] as string[])])
        : [];
      if (!current.includes(optionLabel)) return;
      const updated = current.filter((o) => o !== optionLabel);
      if (updated.length === 0) {
        handleClearBlock(block);
      } else {
        handleMultiSelectChange(block.title, updated);
        removeSnippetOption(block, optionLabel);
      }
    } else {
      if (selectedTemplateOptions[block.title] === optionLabel) {
        handleClearBlock(block);
      }
    }
  }

  /**
   * When the user chooses an attachment from the list, we either insert or remove it.
   */
  function toggleAttachment(attachment: AttachmentOption) {
    if (attachment.status === 'draft') {
      return;
    }
    if (attachments.includes(attachment.key)) {
      // remove
      setAttachments((prev) => prev.filter((key) => key !== attachment.key));
      removeAttachmentLink(attachment.key);
    } else {
      setAttachments((prev) => [...prev, attachment.key]);
      saveSelection();
      const linkHTML = `<span style="background-color: #ffe6e6; padding: 1px 3px;" data-link="${attachment.key}"><a href="${attachment.link}" style="color: #3690CE; text-decoration: none;">${attachment.text}</a></span>`;
      insertAtCursor(linkHTML);
    }
  }

  /**
   * Removes the <span data-link="..."> for an attachment
   */
  function removeAttachmentLink(key: string) {
    if (bodyEditorRef.current) {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = bodyEditorRef.current.innerHTML;
      const spans = tempDiv.querySelectorAll(`span[data-link="${key}"]`);
      spans.forEach((span) => {
        const parent = span.parentNode;
        if (parent) {
          parent.removeChild(span);
        }
      });
      const newBody = tempDiv.innerHTML;
      setBody(newBody);
    }
  }

  function getFilteredAttachments(): AttachmentOption[] {
    // Show only attachments relevant to the selected practice area
    const practiceArea = Object.keys(PracticeAreaPitch).find(
      (k) => PracticeAreaPitch[k as keyof PracticeAreaPitchType]
    ) || '';
    return availableAttachments.filter(
      (attachment) =>
        !attachment.applicableTo ||
        attachment.applicableTo.includes(practiceArea)
    );
  }

  function togglePreview() {
    setIsPreviewOpen(!isPreviewOpen);
  }

  /**
   * Reset the entire form
   */
  function resetForm() {
    setSubject('Your Practice Area Enquiry');
    setTo(enquiry.Email || '');
    setCc('');
    setBcc('2day@followupthen.com');
    // Re-load the base template
    const newBody = generateInitialBody(templateBlocks);
    setBody(newBody);
    if (bodyEditorRef.current) {
      bodyEditorRef.current.innerHTML = newBody;
    }
    setAttachments([]);
    setFollowUp(undefined);
    setIsPreviewOpen(false);
    setIsErrorVisible(false);
    setErrorMessage('');
    setSelectedTemplateOptions({});
    setInsertedBlocks({});
    setLockedBlocks({});
    setEditedBlocks({});
    setOriginalBlockContent({});
    setIsDraftConfirmed(false); // **Reset confirmation state**
    setDealId(null);
    setClientIds([]);

    // Immediately clear any highlight styles from the DOM
    templateBlocks.forEach((block) => {
      highlightBlock(block.title, false);
    });
  }

  /**
   * Validate mandatory fields
   */
  function validateForm(): boolean {
    if (!to.trim()) {
      setErrorMessage('To field cannot be empty.');
      setIsErrorVisible(true);
      return false;
    }
    if (!subject.trim()) {
      setErrorMessage('Subject cannot be empty.');
      setIsErrorVisible(true);
      return false;
    }
    if (!body.trim()) {
      setErrorMessage('Email body cannot be empty.');
      setIsErrorVisible(true);
      return false;
    }
    setIsErrorVisible(false);
    setErrorMessage('');
    return true;
  }

  async function insertDealIfNeeded() {
    try {
      const numericAmount = parseFloat(amount.replace(/,/g, '')) || 0;
      const url = `${process.env.REACT_APP_PROXY_BASE_URL}/${process.env.REACT_APP_INSERT_DEAL_PATH}?code=${process.env.REACT_APP_INSERT_DEAL_CODE}`;
      const payload = {
        serviceDescription,
        amount: numericAmount,
        areaOfWork: enquiry.Area_of_Work,
        prospectId: enquiry.ID,
        pitchedBy: userInitials,
        isMultiClient: isMultiClientFlag,
        leadClientEmail: enquiry.Email,
        ...(isMultiClientFlag && {
          clients: dealClients.map((c) => ({ clientEmail: c.email })),
        }),
      };
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.passcode) {
          setDealPasscode(data.passcode);
        }
      }

      // ✅ Trigger same confirmation message as draft/send
      setIsDraftConfirmed(true);
      setTimeout(() => setIsDraftConfirmed(false), 3000);

      return true;
    } catch (e) {
      console.error('Failed to insert deal:', e);
      return false;
    }
  }

  /**
   * If user hits "Send Email" in the preview, we might do something else.
   * For now, just console.log and reset.
   */
  async function sendEmail() {
    if (validateForm()) {
      setToast({ message: 'Saving deal...', type: 'info', loading: true });
      const dealOk = await insertDealIfNeeded();
      if (dealOk) {
        setToast({ message: 'Deal saved', type: 'success' });
      } else {
        setToast({ message: 'Failed to save deal', type: 'error' });
        setTimeout(() => setToast(null), 3000);
        return;
      }
      await delay(800);
      setToast({ message: 'Sending email...', type: 'info', loading: true });
      console.log('Email Sent:', {
        to,
        cc,
        bcc,
        subject,
        body,
        attachments,
        followUp,
      });
      setToast({ message: 'Email sent', type: 'success' });
      setIsSuccessVisible(true);
      resetForm();
      setTimeout(() => setToast(null), 3000);
    }
  }

  const inTeams = isInTeams();
  const useLocalData =
    process.env.REACT_APP_USE_LOCAL_DATA === 'true' || !inTeams;

  function initiateDraftEmail() {
    const allowed = ['LZ', 'AC', 'JD'];
    if (useLocalData || allowed.includes(userInitials)) {
      setActiveTab('deals');
    } else {
      handleDraftEmail();
      setActiveTab('details');
      setActiveTab('details');
    }
  }

  /**
   * handleDraftEmail: keep HTML, remove placeholders & highlights, convert <br><br> to <p>, then pass to EmailSignature.
   */
  async function handleDraftEmail() {
    if (!body || !enquiry.Point_of_Contact) {
      setErrorMessage('Email contents and user email are required.');
      setIsErrorVisible(true);
      return;
    }
    setToast({ message: 'Saving deal...', type: 'info', loading: true });
    const dealOk = await insertDealIfNeeded();
    if (dealOk) {
      setToast({ message: 'Deal saved', type: 'success' });
    } else {
      setToast({ message: 'Failed to save deal', type: 'error' });
      setTimeout(() => setToast(null), 3000);
      return;
    }
    await delay(800);
    setToast({ message: 'Drafting email...', type: 'info', loading: true });

    // Remove highlight spans
    let rawHtml = removeHighlightSpans(body);

    // Apply dynamic substitutions such as amount just before sending
    const checkoutLink = dealPasscode
      ? `${process.env.REACT_APP_CHECKOUT_URL}?passcode=${dealPasscode}`
      : undefined;
    rawHtml = applyDynamicSubstitutions(
      rawHtml,
      userData,
      enquiry,
      amount,
      dealPasscode,
      checkoutLink
    );

    // Remove leftover placeholders
    const noPlaceholders = removeUnfilledPlaceholders(rawHtml, templateBlocks);

    // After removing leftover placeholders/highlights in handleDraftEmail():
    const finalHtml = convertDoubleBreaksToParagraphs(noPlaceholders);

    // Instead of just passing finalHtml, wrap it in a table:
    const wrappedBody = `
      <table width="100%" border="0" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
        <tr>
          <td style="padding:10px; font-family:Raleway, sans-serif; font-size:10pt; color:#000;">
            ${finalHtml}
          </td>
        </tr>
      </table>
    `;

    const fullEmailHtml = ReactDOMServer.renderToStaticMarkup(
      <EmailSignature bodyHtml={wrappedBody} userData={userData} />
    );

    const requestBody = {
      email_contents: fullEmailHtml,
      user_email: enquiry.Point_of_Contact,
      subject_line: subject,
      to,
      cc,
      bcc,
    };

    try {
      setErrorMessage('');
      setIsErrorVisible(false);
      const response = await fetch(
        `${process.env.REACT_APP_PROXY_BASE_URL}/sendEmail?code=${process.env.REACT_APP_SEND_EMAIL_CODE}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to draft email.');
      }
      setToast({ message: 'Email drafted', type: 'success' });
      setIsSuccessVisible(true);
      setIsDraftConfirmed(true); // **Set confirmation state**
      setTimeout(() => {
        setIsDraftConfirmed(false);
      }, 3000);
      setTimeout(() => setToast(null), 3000);
    } catch (error: any) {
      console.error('Error drafting email:', error);
      setErrorMessage(error.message || 'An unknown error occurred.');
      setIsErrorVisible(true);
      setToast({ message: 'Failed to draft email', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  }

  function handleDealFormSubmit(data: {
    serviceDescription: string;
    amount: number;
    dealExpiry: string;
    isMultiClient: boolean;
    clients: { firstName: string; lastName: string; email: string }[];
  }) {
    setServiceDescription(data.serviceDescription);
    setAmount(data.amount.toString());
    setDealClients(data.clients);
    setIsMultiClientFlag(data.isMultiClient);
    setActiveTab('details');
  }

  /**
   * Hide success message automatically after 3s
   */
  useEffect(() => {
    if (isSuccessVisible) {
      const timer = setTimeout(() => setIsSuccessVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isSuccessVisible]);

  /**
   * Hide error after 5s
   */
  useEffect(() => {
    if (isErrorVisible) {
      const timer = setTimeout(() => setIsErrorVisible(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isErrorVisible]);

  /**
   * Keep the editor's HTML in sync with our `body` state
   */
  useEffect(() => {
    if (
      bodyEditorRef.current &&
      bodyEditorRef.current.innerHTML !== body &&
      document.activeElement !== bodyEditorRef.current
    ) {
      bodyEditorRef.current.innerHTML = body;
    }
  }, [body]);

  /**
   * Update selected template options for multi-select blocks
   */
  function handleMultiSelectChange(blockTitle: string, selectedOptions: string[]) {
    setSelectedTemplateOptions((prev) => ({
      ...prev,
      [blockTitle]: selectedOptions,
    }));
  }

  useEffect(() => {
    Object.entries(selectedTemplateOptions).forEach(([blockTitle, selectedOption]) => {
      const block = templateBlocks.find((b) => b.title === blockTitle);
      if (block && insertedBlocks[block.title]) {
        insertTemplateBlock(block, selectedOption, false);
      }
    });
  }, [amount]);

  /**
   * Update selected template options for single-select blocks
   */
  function handleSingleSelectChange(blockTitle: string, selectedOption: string) {
    setSelectedTemplateOptions((prev) => ({
      ...prev,
      [blockTitle]: selectedOption,
    }));
  }

  /**
   * For simple formatting commands (bold, italic, etc.)
   */
  function applyFormat(command: string, value?: string) {
    document.execCommand(command, false, value);
    if (bodyEditorRef.current) {
      setBody(bodyEditorRef.current.innerHTML);
    }
  }

  function handleInput() {
    if (!bodyEditorRef.current) return;
    setBody(bodyEditorRef.current.innerHTML);

    const { blocks, snippets } = computeSnippetChanges();
    if (Object.keys(blocks).length > 0) {
      setEditedBlocks((prev) => ({ ...prev, ...blocks }));
    }
    if (Object.keys(snippets).length > 0) {
      setEditedSnippets((prev) => {
        const copy = { ...prev } as { [key: string]: { [label: string]: boolean } };
        Object.entries(snippets).forEach(([title, map]) => {
          copy[title] = { ...(copy[title] || {}), ...map };
        });
        return copy;
      });
    }
  }

  function handleBlur() {
    if (bodyEditorRef.current) {
      setBody(bodyEditorRef.current.innerHTML);

      const { blocks, snippets } = computeSnippetChanges();

      if (Object.keys(snippets).length > 0) {
        setEditedSnippets((prev) => {
          const copy = { ...prev } as { [key: string]: { [label: string]: boolean } };
          Object.entries(snippets).forEach(([title, map]) => {
            copy[title] = { ...(copy[title] || {}), ...map };
          });
          return copy;
        });
      }

      if (Object.keys(blocks).length > 0) {
        setEditedBlocks((prev) => ({ ...prev, ...blocks }));
        Object.entries(blocks).forEach(([title, changed]) => {
          if (changed) {
            const block = templateBlocks.find((b) => b.title === title);
            setSelectedTemplateOptions((prev) => ({
              ...prev,
              [title]: block?.isMultiSelect ? [] : '',
            }));
          }
        });
      }
    }
  }

  /**
   * When you click "clear" on a block, we remove its inserted text, 
   * restoring the original placeholder <span>.
   */
  function handleClearBlock(block: TemplateBlock) {
    // Update state for the selected options and inserted block flag.
    setSelectedTemplateOptions((prev) => ({
      ...prev,
      [block.title]: block.isMultiSelect ? [] : '',
    }));
    setInsertedBlocks((prev) => {
      const copy = { ...prev };
      delete copy[block.title];
      return copy;
    });
    setLockedBlocks((prev) => {
      const copy = { ...prev };
      delete copy[block.title];
      return copy;
    });

    setEditedBlocks((prev) => {
      const copy = { ...prev };
      delete copy[block.title];
      return copy;
    });
    setOriginalBlockContent((prev) => {
      const copy = { ...prev };
      delete copy[block.title];
      return copy;
    });

    setOriginalSnippetContent((prev) => {
      const copy = { ...prev };
      delete copy[block.title];
      return copy;
    });
    setEditedSnippets((prev) => {
      const copy = { ...prev };
      delete copy[block.title];
      return copy;
    });

    if (bodyEditorRef.current) {
      // Build a regex to capture everything between the markers.
      const regex = new RegExp(
        `<!--START_BLOCK:${block.title}-->[\\s\\S]*?<!--END_BLOCK:${block.title}-->`,
        'g'
      );
      // Build the original placeholder markup.
      const placeholderHTML = buildPlaceholder(block);
      const update = (prevBody: string) => prevBody.replace(regex, placeholderHTML);
      // Replace the block immediately in state and DOM
      setBody((prevBody) => {
        const newBody = update(prevBody);
        bodyEditorRef.current!.innerHTML = newBody;
        return newBody;
      });
      // Remove highlight right away so the user sees immediate feedback
      highlightBlock(block.title, false);
    }
  }

  function clearAllBlocks() {
    if (bodyEditorRef.current) {
      let newBody = bodyEditorRef.current.innerHTML;
      templateBlocks.forEach((block) => {
        const regex = new RegExp(
          `<!--START_BLOCK:${block.title}-->[\\s\\S]*?<!--END_BLOCK:${block.title}-->`,
          'g'
        );
        const placeholderHTML = buildPlaceholder(block); newBody = newBody.replace(regex, placeholderHTML);
      });
      bodyEditorRef.current.innerHTML = newBody;
      setBody(newBody);
    }
    setSelectedTemplateOptions({});
    setInsertedBlocks({});
    setLockedBlocks({});
    setEditedBlocks({});
    setOriginalBlockContent({});
    setOriginalSnippetContent({});
    setEditedSnippets({});
    templateBlocks.forEach((block) => highlightBlock(block.title, false));
  }

  function reorderTemplateBlocks(start: number, end: number) {
    setBlocks((prev) => {
      const updated = Array.from(prev);
      const [moved] = updated.splice(start, 1);
      updated.splice(end, 0, moved);
      return updated;
    });
  }

  function duplicateTemplateBlock(index: number) {
    setBlocks((prev) => {
      const copy = [...prev];
      const block = { ...copy[index] };
      let base = block.title;
      let suffix = 1;
      let newTitle = `${base} Copy`;
      const titles = new Set(copy.map((b) => b.title));
      while (titles.has(newTitle)) {
        suffix += 1;
        newTitle = `${base} Copy ${suffix}`;
      }
      block.title = newTitle;
      copy.splice(index + 1, 0, block);
      return copy;
    });
  }

  /**
   * Renders the "preview" text for a selected block in the UI
   */
  function renderPreview(block: TemplateBlock) {
    const selectedOptions = selectedTemplateOptions[block.title];
    const isInserted = insertedBlocks[block.title] || false;

    const isEdited = Object.values(editedSnippets[block.title] || {}).some(Boolean);

    if (
      !selectedOptions ||
      (block.isMultiSelect &&
        Array.isArray(selectedOptions) &&
        selectedOptions.length === 0)
    ) {
      if (isInserted) {
        if (lockedBlocks[block.title]) {
          return (
            <div
              className={mergeStyles({
                marginTop: '6px',
                border: `1px solid ${isDarkMode ? 'rgba(16,124,16,0.1)' : '#eafaea'
                  }`,
                padding: '4px 6px',
                borderRadius: '4px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
              })}
            >
              <Icon
                iconName="CheckMark"
                styles={{ root: { color: colours.green, marginRight: 4 } }}
              />
              <span>Locked</span>
            </div>
          );
        }
        if (isEdited) {
          return (
            <div
              className={mergeStyles({
                marginTop: '6px',
                border: `1px solid ${colours.highlightBlue}`,
                padding: '4px 6px',
                borderRadius: '4px',
                fontSize: '12px',
                display: 'flex',
                alignItems: 'center',
              })}
            >
              <Icon
                iconName="Edit"
                styles={{ root: { color: colours.highlightBlue, marginRight: 4 } }}
              />
              <span>Customised</span>
            </div>
          );
        }
      }
      return null;
    }

    const formatPreviewText = (text: string) => {
      return text.replace(/\n/g, '<br />');
    };

    if (block.isMultiSelect && Array.isArray(selectedOptions)) {
      return (
        <div
          className={mergeStyles({
            marginTop: '6px',
            border: isInserted
              ? `1px solid ${lockedBlocks[block.title]
                ? isDarkMode
                  ? 'rgba(16,124,16,0.1)'
                  : '#eafaea'
                : isEdited
                  ? colours.highlightBlue
                  : colours.highlightYellow
              }`
              : `1px dashed ${colours.highlightBlue}`,
            padding: '6px 8px',
            borderRadius: '4px',
            fontSize: '13px',
          })}
        >
          <ul style={{ margin: 0, paddingLeft: '20px' }}>
            {selectedOptions.map((doc: string) => {
              const option = block.options.find((o) => o.label === doc);
              const preview = option ? option.previewText.trim() : doc;
              const dynamicPreview = applyDynamicSubstitutions(
                formatPreviewText(preview),
                userData,
                enquiry,
                amount,
                dealPasscode,
                dealPasscode
                  ? `${process.env.REACT_APP_CHECKOUT_URL}?passcode=${dealPasscode}`
                  : undefined
              );
              return (
                <li
                  key={doc}
                  style={{ marginBottom: 4 }}
                  dangerouslySetInnerHTML={{
                    __html: dynamicPreview,
                  }}
                ></li>
              );
            })}
          </ul>
        </div>
      );
    } else if (typeof selectedOptions === 'string') {
      const option = block.options.find((o) => o.label === selectedOptions);
      const preview = option ? option.previewText.trim() : '';
      const dynamicPreviewText = applyDynamicSubstitutions(
        formatPreviewText(preview),
        userData,
        enquiry,
        amount,
        dealPasscode,
        dealPasscode
          ? `${process.env.REACT_APP_CHECKOUT_URL}?passcode=${dealPasscode}`
          : undefined
      );
      return (
        <div
          className={mergeStyles({
            marginTop: '6px',
            border: isInserted
              ? `1px solid ${lockedBlocks[block.title]
                ? isDarkMode
                  ? 'rgba(16,124,16,0.1)'
                  : '#eafaea'
                : isEdited
                  ? colours.highlightBlue
                  : colours.highlightYellow
              }`
              : `1px dashed ${colours.highlightBlue}`,
            padding: '6px 8px',
            borderRadius: '4px',
            fontSize: '13px',
          })}
        >
          <span
            dangerouslySetInnerHTML={{
              __html: dynamicPreviewText,
            }}
          />
        </div>
      );
    }
    return null;
  }

  const DEFAULT_SINGLE_OPTION_BLOCKS = [
    'Risk Assessment',
    'Next Steps to Instruct Helix Law',
    'Closing Notes',
    'Closing',
  ];

  function autoInsertDefaultBlocks(blocksToUse: TemplateBlock[] = templateBlocks) {
    blocksToUse.forEach((block) => {
      if (
        DEFAULT_SINGLE_OPTION_BLOCKS.includes(block.title) &&
        block.options.length === 1
      ) {
        const autoOption = block.options[0].label;
        setSelectedTemplateOptions((prev) => ({
          ...prev,
          [block.title]: block.isMultiSelect ? [autoOption] : autoOption,
        }));
        insertTemplateBlock(
          block,
          block.isMultiSelect ? [autoOption] : autoOption
        );
      }

      if (
        enquiry.Area_of_Work &&
        (enquiry.Area_of_Work.toLowerCase() === 'commercial' ||
          enquiry.Area_of_Work.toLowerCase() === 'property')
      ) {
        const autoMap: Record<string, string> = {
          Introduction: 'Standard Acknowledgment',
          'Current Situation and Problem': 'The Dispute',
          'Issue Summary': 'The Dispute',
          'Scope of Work': 'Initial Review and Costs',
          'Scope & Cost': 'Initial Review & Advice',
          'Next Steps to Instruct Helix Law': 'Instruct Helix Law - Pitch',
          'Next Steps': 'Instruct Helix Law - Pitch',
          Closing: 'Closing',
        };

        const autoOptionLabel = autoMap[block.title];
        const optionExists = autoOptionLabel
          ? block.options.find((o) => o.label === autoOptionLabel)
          : undefined;

        if (optionExists) {
          setSelectedTemplateOptions((prev) => ({
            ...prev,
            [block.title]: block.isMultiSelect ? [autoOptionLabel] : autoOptionLabel,
          }));
          insertTemplateBlock(
            block,
            block.isMultiSelect ? [autoOptionLabel] : autoOptionLabel
          );
        }
      }
    });
  }

  // Some styling
  const containerStyle = mergeStyles({
    padding: 0,
    backgroundColor: 'transparent',
    borderRadius: '8px',
    boxShadow: isDarkMode
      ? '0 4px 12px rgba(255, 255, 255, 0.1)'
      : '0 4px 12px rgba(0, 0, 0, 0.1)',
    width: '100%',
    margin: '0 auto',
    fontFamily: 'Raleway, sans-serif',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    boxSizing: 'border-box',
    flex: 1,
    minHeight: 0,
  });

  const headerWrapperStyle = mergeStyles({
    backgroundColor: colours.sectionBackground,
    padding: 16,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  });

  const bodyWrapperStyle = mergeStyles({
    padding: 24,
    backgroundColor: '#fff',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  });

  const formContainerStyle = mergeStyles({
    flex: '1 1 0',
    minWidth: '300px',
    display: 'flex',
    flexDirection: 'column',
  });

  const templatesContainerStyle = mergeStyles({
    flex: '1 1 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxHeight: '100%',
    overflowY: 'auto',
  });

  const templatesGridStyle = mergeStyles({
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxHeight: '100%',
  });

  const buttonGroupStyle = mergeStyles({
    gap: '15px',
    marginTop: '20px',
    width: '100%',
  });

  const enquiryDetailsStyle = mergeStyles({
    background: isDarkMode ? colours.dark.sectionBackground : colours.light.sectionBackground,
    borderRadius: 8,
    padding: 16,
    boxShadow: isDarkMode
      ? `0 0 0 1px ${colours.dark.border}`
      : `0 0 0 1px ${colours.light.border}`,
  });


  const toolbarStyle = mergeStyles({
    display: 'flex',
    gap: '10px',
    marginBottom: '0',
    backgroundColor: colours.darkBlue,
    padding: '8px',
    borderTopLeftRadius: '8px',
    borderTopRightRadius: '8px',
    border: `1px solid ${isDarkMode ? colours.dark.cardHover : colours.light.cardHover}`,
    borderBottom: 'none',
  });

  const bubblesContainerStyle = mergeStyles({
    display: 'flex',
    flexWrap: 'wrap', // Allow bubbles to wrap to the next line
    padding: '10px 0',
    gap: '10px',
  });

  const bubbleStyle = mergeStyles({
    padding: '8px 12px',
    borderRadius: '12px',
    backgroundColor: isDarkMode ? colours.dark.cardBackground : colours.light.cardBackground,
    color: isDarkMode ? colours.dark.text : colours.light.text,
    cursor: 'pointer',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    flexShrink: 0,
    width: 'auto',
    ':hover': {
      backgroundColor: isDarkMode ? colours.dark.cardHover : colours.light.cardHover,
    },
  });

  const labelStyle = mergeStyles({
    fontWeight: '600',
    color: isDarkMode ? colours.dark.text : colours.light.text,
    paddingTop: '20px',
    paddingBottom: '5px',
  });

  // New style for greyed-out attachment bubbles
  const attachmentBubbleStyle = mergeStyles({
    padding: '8px 12px',
    borderRadius: '12px',
    backgroundColor: isDarkMode
      ? colours.dark.disabledBackground
      : colours.light.disabledBackground,
    color: colours.greyText,
    cursor: 'default',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    userSelect: 'none',
    flexShrink: 0,
    width: 'auto',
    border: `1px solid ${isDarkMode ? colours.dark.borderColor : colours.light.borderColor
      }`,
    ':hover': {
      backgroundColor: isDarkMode
        ? colours.dark.disabledBackground
        : colours.light.disabledBackground,
    },
  });

  const fullName = `${enquiry.First_Name || ''} ${enquiry.Last_Name || ''}`.trim();

  function handleScrollToBlock(blockTitle: string) {
    const headerElement = document.getElementById(
      `template-block-header-${blockTitle.replace(/\s+/g, '-')}`
    ) as HTMLElement | null;
    if (headerElement) {
      headerElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
      const lockedBg = isDarkMode ? 'rgba(16,124,16,0.1)' : '#eafaea';
      const startColor = lockedBlocks[blockTitle]
        ? lockedBg
        : Object.values(editedSnippets[blockTitle] || {}).some(Boolean)
          ? colours.highlightBlue
          : colours.highlightYellow;
      headerElement.style.transition = 'background-color 0.5s';
      headerElement.style.backgroundColor = startColor;
      setTimeout(() => {
        headerElement.style.backgroundColor = 'transparent';
      }, 1000);
    }
  }

  const filteredAttachments = getFilteredAttachments();

  return (
    <Stack className={containerStyle}>
      <header className={headerWrapperStyle}>
        <PitchHeaderRow
          enquiry={enquiry}
          to={to}
          setTo={setTo}
          cc={cc}
          setCc={setCc}
          bcc={bcc}
          setBcc={setBcc}
          subject={subject}
          setSubject={setSubject}
          serviceDescription={serviceDescription}
          setServiceDescription={setServiceDescription}
          selectedOption={selectedOption}
          setSelectedOption={setSelectedOption}
          SERVICE_OPTIONS={SERVICE_OPTIONS}
          amount={amount}
          handleAmountChange={handleAmountChange}
          handleAmountBlur={handleAmountBlur}
          handleDealFormSubmit={handleDealFormSubmit}
          dealId={dealId}
          clientIds={clientIds}
          isDarkMode={isDarkMode}
        />
      </header>

      <main className={bodyWrapperStyle}>
        {/* Row: Combined Email Editor and Template Blocks */}
        <EditorAndTemplateBlocks
          isDarkMode={isDarkMode}
          body={body}
          setBody={setBody}
          templateBlocks={blocks}
          templateSet={templateSet}
          onTemplateSetChange={handleTemplateSetChange}
          selectedTemplateOptions={selectedTemplateOptions}
          insertedBlocks={insertedBlocks}
          lockedBlocks={lockedBlocks}
          editedBlocks={editedBlocks}
          handleMultiSelectChange={handleMultiSelectChange}
          handleSingleSelectChange={handleSingleSelectChange}
          insertTemplateBlock={insertTemplateBlock}
          renderPreview={renderPreview}
          applyFormat={applyFormat}
          saveSelection={saveSelection}
          handleInput={handleInput}
          handleBlur={handleBlur}
          handleClearBlock={handleClearBlock}
          bodyEditorRef={bodyEditorRef}
          toolbarStyle={toolbarStyle}
          bubblesContainerStyle={bubblesContainerStyle}
          bubbleStyle={bubbleStyle}
          filteredAttachments={filteredAttachments.map(att => ({ key: att.key, text: att.text }))}
          highlightBlock={highlightBlock}
          onReorderBlocks={reorderTemplateBlocks}
          onDuplicateBlock={duplicateTemplateBlock}
          onClearAllBlocks={clearAllBlocks}
          showToast={(msg, type) => {
            setToast({ message: msg, type });
            setTimeout(() => setToast(null), 3000);
          }}
        />

        {snippetOptionsBlock && snippetOptionsTarget && (
          <Callout
            className="inline-options-callout"
            target={snippetOptionsTarget}
            onDismiss={closeSnippetOptions}
            setInitialFocus={false}
            directionalHint={DirectionalHint.bottomLeftEdge}
            directionalHintFixed
            styles={{
              root: {
                padding: 8,
                borderRadius: 8,
                boxShadow: '0 4px 16px rgba(0,0,0,0.2)',
                backgroundColor: isDarkMode ? colours.dark.inputBackground : '#ffffff',
                animation: 'fadeInScale 0.2s ease',
              },
            }}
          >
            <FocusZone direction={FocusZoneDirection.vertical} isCircularNavigation>
              <ChoiceGroup
                selectedKey={snippetOptionsLabel}
                onChange={(_e, opt?: IChoiceGroupOption) => {
                  if (!opt || !snippetOptionsBlock) return;
                  replaceSnippetOption(
                    snippetOptionsBlock,
                    snippetOptionsLabel,
                    opt.key as string
                  );
                  closeSnippetOptions();
                }}
                options={
                  snippetOptionsBlock.options.map((o) => {
                    const renderLabel = (
                      option?: IChoiceGroupOption,
                      defaultRender?: (option?: IChoiceGroupOption) => JSX.Element | null
                    ) => {
                      if (!option) return null;
                      const preview = applyDynamicSubstitutions(
                        snippetOptionsBlock.options.find((opt) => opt.label === option.key)?.previewText.replace(/\n/g, '<br />') || '',
                        userData,
                        enquiry,
                        amount,
                        dealPasscode,
                        dealPasscode ? `${process.env.REACT_APP_CHECKOUT_URL}?passcode=${dealPasscode}` : undefined
                      );
                      const isSelected = snippetOptionsLabel === option.key;
                      return (
                        <Stack
                          tokens={{ childrenGap: 2 }}
                          onMouseEnter={() => setHoveredOption(option.key as string)}
                          onMouseLeave={() => setHoveredOption(null)}
                        >
                          {defaultRender ? defaultRender(option) : option.text}
                          {(hoveredOption === option.key || isSelected) && (
                            <span className="option-preview" dangerouslySetInnerHTML={{ __html: preview }} />
                          )}
                        </Stack>
                      );
                    };

                    return {
                      key: o.label,
                      text: o.label,
                      onRenderLabel: renderLabel,
                    } as IChoiceGroupOption;
                  })
                }
                styles={{ flexContainer: { display: 'flex', flexDirection: 'column' } }}
              />
            </FocusZone>
          </Callout>
        )}

        {removeConfirm && removeConfirm.target && (
          <Callout
            target={removeConfirm.target}
            onDismiss={() => setRemoveConfirm(null)}
            setInitialFocus
            directionalHint={DirectionalHint.bottomLeftEdge}
            directionalHintFixed
          >
            <Stack tokens={{ childrenGap: 8 }} styles={{ root: { padding: 12 } }}>
              <Text>Clear this content?</Text>
              <Stack horizontal tokens={{ childrenGap: 8 }} horizontalAlign="end">
                <PrimaryButton
                  text="Clear"
                  styles={sharedPrimaryButtonStyles}
                  onClick={() => {
                    if (removeConfirm.option) {
                      removeBlockOption(removeConfirm.block, removeConfirm.option);
                    } else {
                      handleClearBlock(removeConfirm.block);
                    }
                    setRemoveConfirm(null);
                  }}
                />
                <DefaultButton
                  text="Cancel"
                  styles={sharedDefaultButtonStyles}
                  onClick={() => setRemoveConfirm(null)}
                />
              </Stack>
            </Stack>
          </Callout>
        )}

        {/* Row: Preview and Reset Buttons */}
        <Stack horizontal tokens={{ childrenGap: 15 }} styles={{ root: { marginTop: '20px' } }}>
          <PrimaryButton
            text="Preview Email"
            onClick={togglePreview}
            styles={sharedPrimaryButtonStyles}
            ariaLabel="Preview Email"
            iconProps={{ iconName: 'Preview' }}
          />
          <DefaultButton
            text="Reset"
            onClick={resetForm}
            styles={sharedDefaultButtonStyles}
            ariaLabel="Reset Form"
            iconProps={{ iconName: 'Refresh' }}
          />
        </Stack>

        {/* Preview Panel */}
        <EmailPreview
          isPreviewOpen={isPreviewOpen}
          onDismiss={togglePreview}
          enquiry={enquiry}
          subject={subject}
          body={body}
          templateBlocks={templateBlocks}
          attachments={attachments}
          followUp={followUp}
          fullName={`${enquiry.First_Name || ''} ${enquiry.Last_Name || ''}`.trim()}
          userData={userData}
          serviceDescription={serviceDescription}
          clients={dealClients}
          to={to}
          amount={amount}
          sendEmail={sendEmail}
          handleDraftEmail={handleDraftEmail}
          isSuccessVisible={isSuccessVisible}
          isDraftConfirmed={isDraftConfirmed}
          passcode={dealPasscode}
        />
        <OperationStatusToast
          visible={toast !== null}
          message={toast?.message || ''}
          type={toast?.type || 'info'}
          loading={toast?.loading}
        />
      </main>
    </Stack>
  );

};

export default PitchBuilder;