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
} from '@fluentui/react';
import { Enquiry } from '../../app/functionality/types';
import { colours } from '../../app/styles/colours';
import BubbleTextField from '../../app/styles/BubbleTextField';
import { useTheme } from '../../app/functionality/ThemeContext';
import PracticeAreaPitch, { PracticeAreaPitchType } from '../../app/customisation/PracticeAreaPitch';
import { templateBlocks, TemplateBlock, TemplateOption } from '../../app/customisation/TemplateBlocks';
import { availableAttachments, AttachmentOption } from '../../app/customisation/Attachments';
import {
  sharedPrimaryButtonStyles,
  sharedDefaultButtonStyles,
  sharedDraftConfirmedButtonStyles,
} from '../../app/styles/ButtonStyles';
import {
  sharedEditorStyle,
  sharedOptionsDropdownStyles,
} from '../../app/styles/FilterStyles';
import ReactDOMServer from 'react-dom/server';
import EmailSignature from './EmailSignature';
import EmailPreview from './pitch builder/EmailPreview';
import EditorAndTemplateBlocks from './pitch builder/EditorAndTemplateBlocks';
import PitchHeaderRow from './pitch builder/PitchHeaderRow';
import {
  convertDoubleBreaksToParagraphs,
  removeUnfilledPlaceholders,
  removeHighlightSpans,
  cleanTemplateString,
  isStringArray,
  replacePlaceholders,
  applyDynamicSubstitutions,
  leftoverPlaceholders,
} from './pitch builder/emailUtils';
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


const PitchBuilder: React.FC<PitchBuilderProps> = ({ enquiry, userData }) => {
  const { isDarkMode } = useTheme();
  const userInitials = userData?.[0]?.Initials?.toUpperCase() || '';

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

function highlightBlock(blockTitle: string, highlight: boolean) {
  const headerElement = document.getElementById(
    `template-block-header-${blockTitle.replace(/\s+/g, '-')}`
  );
  if (headerElement) {
    const lockedBg = isDarkMode ? 'rgba(16,124,16,0.1)' : '#eafaea';
    const blueBg = colours.highlightBlue;
    headerElement.style.transition = 'background-color 0.2s';
    let bg = 'transparent';

    const isInserted =
      insertedBlocks[blockTitle] ||
      document.querySelector(`span[data-inserted="${blockTitle}"]`);

    if (highlight || isInserted) {
      if (lockedBlocks[blockTitle]) {
        bg = lockedBg;
      } else if (editedBlocks[blockTitle]) {
        bg = blueBg;
      } else {
        bg = colours.highlightYellow;
      }
    }
    headerElement.style.backgroundColor = bg;
  }

  const insertedSpans = document.querySelectorAll(
    `span[data-inserted="${blockTitle}"]`
  );
  insertedSpans.forEach((span) => {
    if (span instanceof HTMLElement) {
      const lockedBg = isDarkMode ? 'rgba(16,124,16,0.1)' : '#eafaea';
      const blueBg = colours.highlightBlue;
      span.style.transition = 'background-color 0.2s, outline 0.2s';
      let bg = colours.highlightYellow;
      if (lockedBlocks[blockTitle]) {
        bg = lockedBg;
      } else if (editedBlocks[blockTitle]) {
        bg = blueBg;
      }
      span.style.backgroundColor = bg;
      span.style.outline = highlight ? `1px dotted ${colours.cta}` : 'none';
    }
  });
}

function toggleBlockLock(blockTitle: string) {
  setLockedBlocks(prev => {
    const locked = !prev[blockTitle];
    const updated = { ...prev, [blockTitle]: locked };
const span = bodyEditorRef.current?.querySelector(
  `span[data-inserted="${blockTitle}"]`
) as HTMLElement | null;
if (span) {
      const lockedBg = isDarkMode ? 'rgba(16,124,16,0.1)' : '#eafaea';
      span.setAttribute('contenteditable', (!locked).toString());
      span.style.backgroundColor = locked
        ? lockedBg
        : editedBlocks[blockTitle]
        ? colours.highlightBlue
        : colours.highlightYellow;
      const icon = span.querySelector('.lock-toggle i') as HTMLElement | null;
      if (icon) {
        icon.className = `ms-Icon ms-Icon--${locked ? 'Lock' : 'Unlock'}`;
      }
    }
    return updated;
  });
}

let lockTimer: number | null = null;
function longLockStart(blockTitle: string) {
  lockTimer = window.setTimeout(() => {
    toggleBlockLock(blockTitle);
  }, 600);
}

function longLockEnd() {
  if (lockTimer) {
    clearTimeout(lockTimer);
    lockTimer = null;
  }
}

useEffect(() => {
  (window as any).toggleBlockLock = toggleBlockLock;
  (window as any).highlightBlock = highlightBlock;
  (window as any).longLockStart = longLockStart;
  (window as any).longLockEnd = longLockEnd;
}, [toggleBlockLock, highlightBlock, longLockStart, longLockEnd]);

  // Simple helper to capitalize your "Area_of_Work" for the subject line
  function capitalizeWords(str: string): string {
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

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

  // Basic template that includes placeholders
  const BASE_TEMPLATE = `Dear [Enquiry.First_Name],

[FE Introduction Placeholder]

[Current Situation and Problem Placeholder]

[Potential Causes of Action and Remedies Placeholder]

[Scope of Work Placeholder]

[Risk Assessment Placeholder]

[Costs and Budget Placeholder]

[Required Documents Placeholder]

[Follow-Up Instructions Placeholder]

[Meeting Link Placeholder]

[Closing Notes Placeholder]

[Google Review Placeholder]

Kind Regards,<br>

[First Name]<br>

[Full Name]<br>
[Position]`;

  // The main "body" of the editor content
  // We'll insert placeholders right away
  const [body, setBody] = useState<string>(() => {
    // Optionally you can do the placeholder replacements here if desired
    return replacePlaceholders(BASE_TEMPLATE, '', enquiry, userData)
      .split('\n')
      .map((line) => line.trim())
      .join('\n');
  });

  // Attachments, followUp, preview, error states, etc...
  const [attachments, setAttachments] = useState<string[]>([]);
  const [followUp, setFollowUp] = useState<string | undefined>(undefined);
  const [isPreviewOpen, setIsPreviewOpen] = useState<boolean>(false);
  const [isSuccessVisible, setIsSuccessVisible] = useState<boolean>(false);
  const [isErrorVisible, setIsErrorVisible] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // **New State: Confirmation State for Draft Email Button**
  const [isDraftConfirmed, setIsDraftConfirmed] = useState<boolean>(false);

  // Tab state to switch between email details and deals
  const [activeTab, setActiveTab] = useState<string>('details');

  // IDs returned after saving a deal
  const [dealId, setDealId] = useState<number | null>(null);
  const [clientIds, setClientIds] = useState<number[]>([]);
  const [dealClients, setDealClients] = useState<ClientInfo[]>([]);


  // Tracks selected template options for each block
  const [selectedTemplateOptions, setSelectedTemplateOptions] = useState<{
    [key: string]: string | string[];
  }>({});

  // Tracks which blocks have been inserted
  const [insertedBlocks, setInsertedBlocks] = useState<{ [key: string]: boolean }>({});

  const [lockedBlocks, setLockedBlocks] = useState<{ [key: string]: boolean }>({});

  const [editedBlocks, setEditedBlocks] = useState<{ [key: string]: boolean }>({});
  const [originalBlockContent, setOriginalBlockContent] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    templateBlocks.forEach(block => {
      highlightBlock(block.title, false);
    });
  }, [insertedBlocks, lockedBlocks, editedBlocks, isDarkMode]);

  // For the body editor
  const bodyEditorRef = useRef<HTMLDivElement>(null);
  const savedSelection = useRef<Range | null>(null);

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
   * Insert a template block's text (either single or multiSelect) at the corresponding placeholder <span>.
   */
  function insertTemplateBlock(
    block: TemplateBlock,
    selectedOption: string | string[],
    shouldFocus: boolean = true,
    append: boolean = false
  ) {
    let replacementText = '';
    if (block.isMultiSelect && isStringArray(selectedOption)) {
      if (block.title === 'Required Documents') {
        replacementText = `<ul>${selectedOption
          .map((doc: string) => {
            const option = block.options.find((o) => o.label === doc);
            return `<li>${option ? option.previewText.trim() : doc}</li>`;
          })
          .join('')}</ul>`;
      } else {
        replacementText = selectedOption
          .map((item: string) => {
            const option = block.options.find((o) => o.label === item);
            return option ? option.previewText.trim() : item;
          })
          .join('<br />');
      }
    } else if (!block.isMultiSelect && typeof selectedOption === 'string') {
      const option = block.options.find((o) => o.label === selectedOption);
      replacementText = option ? option.previewText.trim() : '';
      replacementText = replacementText.replace(/\n/g, '<br />');
    }
  
    replacementText = applyDynamicSubstitutions(
      replacementText,
      userData,
      enquiry,
      amount
    );
    let selectedLabel = '';
    if (block.isMultiSelect && isStringArray(selectedOption)) {
      selectedLabel = selectedOption.join(', ');
    } else if (typeof selectedOption === 'string') {
      selectedLabel = selectedOption;
    }
    const labelHTML = `<span class="block-label" style="display:block;font-size:10px;color:${colours.greyText};margin-top:8px;text-align:right;">${block.title}${selectedLabel ? ` - ${selectedLabel}` : ''}</span>`;
    const containerTag = 'span';
    const style = `background-color: ${colours.highlightYellow}; padding: 7px 7px; display: block;`;
    const innerHTML = cleanTemplateString(replacementText);
    const lockButtonStyle = `float:right;margin-left:4px;width:16px;height:16px;display:inline-flex;align-items:center;justify-content:center;border-radius:50%;background:${colours.grey};color:${colours.greyText};cursor:pointer;font-size:10px;user-select:none;`;
    const lockIcon = `<i class="ms-Icon ms-Icon--Unlock" aria-hidden="true" style="pointer-events:none;"></i>`;
    const lockButton = `<span class="lock-toggle" style="${lockButtonStyle}" onclick="window.toggleBlockLock('${block.title}')">${lockIcon}</span>`;    // Add inline style to <p> tags to remove bottom margin
    const styledInnerHTML = innerHTML.replace(
      /<p>/g,
      `<p style="margin-bottom: 0;">`
    );
    const highlightedReplacement = `<${containerTag} style="${style}" data-inserted="${block.title}" data-placeholder="${block.placeholder}" contenteditable="true" onmousedown="window.longLockStart('${block.title}')" onmouseup="window.longLockEnd()" onmouseleave="window.longLockEnd()">${lockButton}${styledInnerHTML}${labelHTML}</${containerTag}>`;
    // Simplified hover handlers to directly call highlightBlock
    const wrappedHTML = `<!--START_BLOCK:${block.title}--><span data-block-title="${block.title}" onmouseover="window.highlightBlock('${block.title}', true)" onmouseout="window.highlightBlock('${block.title}', false)">${highlightedReplacement}</span><!--END_BLOCK:${block.title}-->`;
    
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
      return prevBody.replace(
        new RegExp(
          `(<span[^>]*data-placeholder="${block.placeholder.replace(
            /[-[\]{}()*+?.,\\^$|#\s]/g,
            '\\$&'
          )}"[^>]*>)([\\s\\S]*?)(</span>)`,
          'g'
        ),
        `$1${wrappedHTML}$3`
      );
    });
  
    setInsertedBlocks((prev) => ({ ...prev, [block.title]: true }));
    setLockedBlocks((prev) => ({ ...prev, [block.title]: false }));

    setOriginalBlockContent((prev) => ({
      ...prev,
      [block.title]: append
        ? (prev[block.title] || '') + `${styledInnerHTML}${labelHTML}`
        : `${styledInnerHTML}${labelHTML}`,
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
          (window as any).longLockStart = longLockStart;
          (window as any).longLockEnd = longLockEnd;
        }
      }, 0);
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
    const newBody = replacePlaceholders(BASE_TEMPLATE, '', enquiry, userData)
      .split('\n')
      .map((line) => line.trim())
      .join('\n');
    setBody(newBody);
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

    // Reset any header highlights or leftover styles
    setTimeout(() => {
      templateBlocks.forEach((block) => {
        const header = document.getElementById(
          `template-block-header-${block.title.replace(/\s+/g, '-')}`
        );
        if (header) {
          (header as HTMLElement).style.backgroundColor = 'transparent';
        }
        const spans = document.querySelectorAll(
          `span[data-inserted="${block.title}"]`
        );
        spans.forEach((span) => {
          if (span instanceof HTMLElement) {
            span.style.backgroundColor = colours.highlightYellow;
            span.style.outline = 'none';
          }
        });
      });
    }, 0);
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

  /**
   * If user hits "Send Email" in the preview, we might do something else.
   * For now, just console.log and reset.
   */
  function sendEmail() {
    if (validateForm()) {
      console.log('Email Sent:', {
        to,
        cc,
        bcc,
        subject,
        body,
        attachments,
        followUp,
      });
      setIsSuccessVisible(true);
      resetForm();
    }
  }

  const useLocalData = process.env.REACT_APP_USE_LOCAL_DATA === 'true';

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

    // Remove highlight spans
    let rawHtml = removeHighlightSpans(body);

    // Apply dynamic substitutions such as amount just before sending
    rawHtml = applyDynamicSubstitutions(rawHtml, userData, enquiry, amount);

    // Remove leftover placeholders
    const noPlaceholders = removeUnfilledPlaceholders(rawHtml);

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
      setIsSuccessVisible(true);
      setIsDraftConfirmed(true); // **Set confirmation state**
      // Revert the confirmation state after 3 seconds
      setTimeout(() => {
        setIsDraftConfirmed(false);
      }, 3000);
    } catch (error: any) {
      console.error('Error drafting email:', error);
      setErrorMessage(error.message || 'An unknown error occurred.');
      setIsErrorVisible(true);
    }
  }

  async function handleDealFormSubmit(data: {
    serviceDescription: string;
    amount: number;
    dealExpiry: string;
    isMultiClient: boolean;
    clients: { firstName: string; lastName: string; email: string }[];
  }) {
    try {
      const url = `${process.env.REACT_APP_PROXY_BASE_URL}/${process.env.REACT_APP_INSERT_DEAL_PATH}?code=${process.env.REACT_APP_INSERT_DEAL_CODE}`;
      const payload = {
        serviceDescription: data.serviceDescription,
        amount: data.amount,
        dealExpiry: data.dealExpiry,
        areaOfWork: enquiry.Area_of_Work,
        prospectId: enquiry.ID,
        pitchedBy: userInitials,
        isMultiClient: data.isMultiClient,
        leadClientEmail: enquiry.Email,
        clients: data.clients,
      };
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Failed to save deal');
      }
      try {
        const json = await response.json();
        if (json?.dealId) setDealId(json.dealId);
        if (Array.isArray(json?.clientIds)) setClientIds(json.clientIds);
      } catch {
        // response did not contain JSON with IDs
      }
      setServiceDescription(data.serviceDescription);
      setAmount(data.amount.toString());
      setDealClients(data.clients);
      handleDraftEmail();
      setActiveTab('details');
    } catch (error: any) {
      setErrorMessage(error.message || 'Failed to save deal');
      setIsErrorVisible(true);
    }
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

    const updated: { [key: string]: boolean } = {};

    Object.keys(insertedBlocks).forEach((title) => {
      if (!insertedBlocks[title]) return;

      const span = bodyEditorRef.current!.querySelector(
        `span[data-inserted="${title}"]`
      ) as HTMLElement | null;

      if (span && originalBlockContent[title] !== undefined) {
        const changed = isContentChanged(span.innerHTML, originalBlockContent[title]);
        updated[title] = changed;

        const lockedBg = isDarkMode ? 'rgba(16,124,16,0.1)' : '#eafaea';
        span.style.backgroundColor = lockedBlocks[title]
          ? lockedBg
          : changed
          ? colours.highlightBlue
          : colours.highlightYellow;

        const headerElement = document.getElementById(
          `template-block-header-${title.replace(/\s+/g, '-')}`
        );
        if (headerElement) {
          let bg = 'transparent';
          if (lockedBlocks[title]) {
            bg = lockedBg;
          } else if (changed) {
            bg = colours.highlightBlue;
          } else if (insertedBlocks[title]) {
            bg = colours.highlightYellow;
          }
          headerElement.style.backgroundColor = bg;
        }
      }
    });

    if (Object.keys(updated).length > 0) {
      setEditedBlocks((prev) => ({ ...prev, ...updated }));
    }
  }

  function handleBlur() {
    if (bodyEditorRef.current) {
      setBody(bodyEditorRef.current.innerHTML);

      const sel = window.getSelection();
      if (sel && sel.rangeCount > 0) {
        let node: Node | null = sel.getRangeAt(0).startContainer;
        if (node.nodeType === Node.TEXT_NODE) node = node.parentNode;
        const span =
          node && node instanceof Element
            ? (node.closest('span[data-inserted]') as HTMLElement | null)
            : null;

        if (span) {
          const title = span.getAttribute('data-inserted');
          if (title && originalBlockContent[title] !== undefined) {
            const changed = isContentChanged(
              span.innerHTML,
              originalBlockContent[title]
            );
            setEditedBlocks((prev) => ({ ...prev, [title]: changed }));
            const lockedBg = isDarkMode ? 'rgba(16,124,16,0.1)' : '#eafaea';
            span.style.backgroundColor = lockedBlocks[title]
              ? lockedBg
              : changed
              ? colours.highlightBlue
              : colours.highlightYellow;
            if (changed) {
              const block = templateBlocks.find((b) => b.title === title);
              setSelectedTemplateOptions((prev) => ({
                ...prev,
                [title]: block?.isMultiSelect ? [] : '',
              }));
            }
          }
          return;
        }
      }

      Object.keys(insertedBlocks).forEach((title) => {
        if (insertedBlocks[title]) {
          const span = bodyEditorRef.current!.querySelector(
            `span[data-inserted="${title}"]`
          ) as HTMLElement | null;
          if (span && originalBlockContent[title] !== undefined) {
            const changed = isContentChanged(
              span.innerHTML,
              originalBlockContent[title]
            );
            setEditedBlocks((prev) => ({ ...prev, [title]: changed }));
            const lockedBg = isDarkMode ? 'rgba(16,124,16,0.1)' : '#eafaea';
            span.style.backgroundColor = lockedBlocks[title]
              ? lockedBg
              : changed
              ? colours.highlightBlue
              : colours.highlightYellow;
          }
        }
      });
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

    if (bodyEditorRef.current) {
      // Build a regex to capture everything between the markers.
      const regex = new RegExp(
        `<!--START_BLOCK:${block.title}-->[\\s\\S]*?<!--END_BLOCK:${block.title}-->`,
        'g'
      );
      // Build the original placeholder markup.
      const placeholderHTML = `<span data-placeholder="${block.placeholder}" style="background-color: ${colours.grey}; padding: 1px 3px;">${block.placeholder}</span>`;
      
      // Replace the entire wrapped block with the placeholder.
      setBody((prevBody) => prevBody.replace(regex, placeholderHTML));
      // Once the body and state update, clear any highlight from the block
      setTimeout(() => {
        const header = document.getElementById(
          `template-block-header-${block.title.replace(/\s+/g, '-')}`
        );
        if (header) {
          (header as HTMLElement).style.backgroundColor = 'transparent';
        }
        const spans = document.querySelectorAll(
          `span[data-inserted="${block.title}"]`
        );
        spans.forEach((span) => {
          if (span instanceof HTMLElement) {
            span.style.backgroundColor = colours.highlightYellow;
            span.style.outline = 'none';
          }
        });
      }, 0);
    }
  }

  /**
   * Renders the "preview" text for a selected block in the UI
   */
  function renderPreview(block: TemplateBlock) {
    const selectedOptions = selectedTemplateOptions[block.title];
    const isInserted = insertedBlocks[block.title] || false;

    const isEdited = editedBlocks[block.title] || false;

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
                border: `1px solid ${colours.green}`,
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
              ? `1px solid ${
                  lockedBlocks[block.title]
                    ? colours.green
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
                amount
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
        amount
      );
      return (
        <div
          className={mergeStyles({
            marginTop: '6px',
            border: isInserted
              ? `1px solid ${
                  lockedBlocks[block.title]
                    ? colours.green
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

  // Auto-insert single-option blocks for "Risk Assessment", "Next Steps", and "Closing Notes" on mount
  useEffect(() => {
    templateBlocks.forEach((block) => {
      if (
        ['Risk Assessment', 'Next Steps', 'Next Steps to Instruct Helix Law', 'Closing Notes'].includes(block.title) &&
        block.options.length === 1
      ) {
        const selectedOption = block.options[0].label;
        setSelectedTemplateOptions((prev) => ({
          ...prev,
          [block.title]: block.isMultiSelect ? [selectedOption] : selectedOption,
        }));
        insertTemplateBlock(
          block,
          block.isMultiSelect ? [selectedOption] : selectedOption
        );
      }
    });
  }, []);

  // Auto-insert additional blocks for Commercial and Property area of work
  useEffect(() => {
    if (
      enquiry.Area_of_Work &&
      (enquiry.Area_of_Work.toLowerCase() === 'commercial' ||
        enquiry.Area_of_Work.toLowerCase() === 'property')
    ) {
      templateBlocks.forEach((block) => {
        if (block.title === 'Introduction') {
          const autoOptionLabel = 'Standard Acknowledgment';
          const optionExists = block.options.find((o) => o.label === autoOptionLabel);
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
        if (block.title === 'Current Situation and Problem') {
          const autoOptionLabel = 'The Dispute';
          const optionExists = block.options.find((o) => o.label === autoOptionLabel);
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
        if (block.title === 'Potential Causes of Action and Remedies') {
          // Auto-insert this block if it has a single option
          if (block.options.length === 1) {
            const autoOptionLabel = block.options[0].label;
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
        if (block.title === 'Scope of Work') {
          const autoOptionLabel = 'Initial Review and Costs';
          const optionExists = block.options.find((o) => o.label === autoOptionLabel);
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
        if (block.title === 'Next Steps to Instruct Helix Law') {
          if (block.options.length === 1) {
            const autoOptionLabel = block.options[0].label;
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
  }, [enquiry.Area_of_Work]);   

  // Some styling
  const containerStyle = mergeStyles({
    padding: '30px',
    backgroundColor: isDarkMode ? colours.dark.background : colours.light.background,
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
    flex: 1,      // Let it fill the page if needed
    minHeight: 0, // So it won't overflow
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
    border: `1px solid ${
      isDarkMode ? colours.dark.borderColor : colours.light.borderColor
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
        : editedBlocks[blockTitle]
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
  
      {/* Row: Combined Email Editor and Template Blocks */}
      <EditorAndTemplateBlocks
        isDarkMode={isDarkMode}
        body={body}
        setBody={setBody}
        templateBlocks={templateBlocks}
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
        filteredAttachments={filteredAttachments.map((att) => ({
          key: att.key,
          text: att.text,
        }))}
      />
  
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
      />
    </Stack>
  );
  
};

export default PitchBuilder;
