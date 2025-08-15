import { Enquiry } from '../../../app/functionality/types';
import { colours } from '../../../app/styles/colours';
import { templateBlocks, TemplateBlock } from '../../../app/customisation/ProductionTemplateBlocks';

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
export function getLeftoverPlaceholders(blocks: TemplateBlock[] = templateBlocks): string[] {
  return [...blocks.map((b) => b.placeholder), '[Amount]'];
}

export const leftoverPlaceholders = getLeftoverPlaceholders();

/**
 * Utility: turn consecutive <br><br> lines into real paragraphs (<p>...).
 * Some email clients (especially Outlook) collapse repeated <br> tags.
 * Converting them into <p> ensures consistent spacing.
 */
export function convertDoubleBreaksToParagraphs(html: string): string {
  let normalized = html
// invisible change
    .replace(/\r\n/g, '\n')
    .replace(/(<br \/>){2,}/g, '\n\n')
    .replace(/<\/div>\s*<br \/>/g, '</div>');
    
  // Convert numbered lists to proper HTML ordered lists
  normalized = convertNumberedListsToHTML(normalized);
  
  const paragraphs = normalized.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const wrapped = paragraphs.map((paragraph) => {
    const t = paragraph.trim();
    // Keep block-level lists as-is to avoid invalid <p><ol> nesting in Outlook
    if (/^<ol\b/i.test(t) && /<\/ol>\s*$/i.test(t)) return t;
    return `<p>${t}</p>`;
  });
  return wrapped.join('');
}

/**
 * Convert plain text numbered lists to HTML ordered lists.
 * Looks for patterns like "1. " and "2. " and converts them to proper <ol><li> structure.
 */
export function convertNumberedListsToHTML(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  let inList = false;
  let listItems: { n: number; content: string }[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmedLine = line.trim();
    const listItemMatch = trimmedLine.match(/^(\d+)\.\s+(.+)$/);

    if (listItemMatch) {
      const n = Number(listItemMatch[1]);
      const itemContent = listItemMatch[2];
      if (!inList) {
        inList = true;
        listItems = [];
      }
      listItems.push({ n, content: itemContent });
    } else {
      if (inList) {
        const html =
          `<ol class="hlx-numlist" style="list-style:none;padding-left:0;margin:16px 0;">` +
          listItems
            .map(({ n, content }) =>
              `<li style="margin:0 0 12px 0;line-height:1.6;">` +
              `<span style="display:inline-block;min-width:1.6em;color:#D65541;font-weight:700;">${n}.` +
              `</span><span>${content}</span></li>`
            )
            .join('') +
          `</ol>`;
        result.push(html);
        inList = false;
        listItems = [];
      }
      result.push(trimmedLine ? line : '');
    }
  }

  if (inList && listItems.length > 0) {
    const html =
      `<ol class="hlx-numlist" style="list-style:none;padding-left:0;margin:16px 0;">` +
      listItems
        .map(({ n, content }) =>
          `<li style="margin:0 0 12px 0;line-height:1.6;">` +
          `<span style="display:inline-block;min-width:1.6em;color:#D65541;font-weight:700;">${n}.` +
          `</span><span>${content}</span></li>`
        )
        .join('') +
      `</ol>`;
    result.push(html);
  }

  return result.join('\n');
}

/**
 * Removes lines that contain leftover placeholders.
 * Also condenses multiple blank lines down to one.
 */
export function removeUnfilledPlaceholders(
  text: string,
  blocks: TemplateBlock[] = templateBlocks
): string {
  const placeholders = getLeftoverPlaceholders(blocks);

  // Remove placeholder tokens but keep surrounding copy
  let cleaned = text;
  placeholders.forEach((placeholder) => {
    const regex = new RegExp(escapeRegExp(placeholder), 'g');
    cleaned = cleaned.replace(regex, '');
  });

  const lines = cleaned.split('\n');

  const consolidated: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (
      trimmed === '' &&
      consolidated.length > 0 &&
      consolidated[consolidated.length - 1].trim() === ''
    ) {
      continue;
    }
    consolidated.push(trimmed);
  }

  return consolidated.join('\n').trim();
}

/**
 * Highlight leftover placeholders in CTA red so they stand out in previews
 */
export function markUnfilledPlaceholders(
  text: string,
  blocks: TemplateBlock[] = templateBlocks
): string {
  const placeholders = getLeftoverPlaceholders(blocks);
  let marked = text;
  placeholders.forEach((placeholder) => {
    const regex = new RegExp(escapeRegExp(placeholder), 'g');
    marked = marked.replace(
      regex,
      `<span style="color: ${colours.cta}; font-weight: bold;">${placeholder}</span>`
    );
  });
  // Also highlight generic [INSERT ...] placeholders that haven't been filled
  marked = marked.replace(/\[INSERT[^\]]*\]/gi, (m) => {
    return `<span style="color: ${colours.cta}; font-weight: bold;">${m}</span>`;
  });
  return marked;
}

/**
 * Strips all the highlight <span> attributes (data-placeholder, data-inserted, etc.)
 * so final email doesn't have bright highlighting.
 */
export function removeHighlightSpans(html: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Elements that should be fully removed
  const removeSelectors =
    '.lock-toggle, .block-sidebar, .sentence-delete, .sentence-handle';
  tempDiv.querySelectorAll(removeSelectors).forEach((el) => el.remove());

  // Unwrap placeholder containers. If no option is selected, keep the first
  // option's content so that default previews still render.
  tempDiv.querySelectorAll('.block-option-list').forEach((el) => {
    const parent = el.parentNode;
    if (!parent) return;

    const bubbles = Array.from(el.querySelectorAll('.option-bubble')) as HTMLElement[];
    let keep = bubbles.find(
      (b) => b.classList.contains('active') || b.classList.contains('selected')
    );
    if (!keep && bubbles.length > 0) {
      keep = bubbles[0];
    }

    bubbles.forEach((bubble) => {
      const bubbleEl = bubble as HTMLElement;
      if (bubbleEl === keep) {
        const bubbleParent = bubbleEl.parentNode;
        if (!bubbleParent) return;

        // Remove option headers so only the main content remains
        bubbleEl.querySelectorAll('strong').forEach((el) => el.remove());

        // Unwrap option-preview containers to avoid indentation styles
        bubbleEl.querySelectorAll('.option-preview').forEach((preview) => {
          const previewParent = preview.parentNode;
          if (!previewParent) return;
          while (preview.firstChild)
            previewParent.insertBefore(preview.firstChild, preview);
          previewParent.removeChild(preview);
        });

        while (bubbleEl.firstChild)
          bubbleParent.insertBefore(bubbleEl.firstChild, bubbleEl);
        bubbleParent.removeChild(bubbleEl);
      } else {
        bubbleEl.remove();
      }
    });

    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
  });

  // Remove highlight attributes/classes but keep user content
  const cleanupSelectors =
    '[data-placeholder], [data-inserted], [data-link], [data-sentence], [data-insert], [data-snippet], [data-block-title], .insert-placeholder, .block-main, .block-container';
  tempDiv.querySelectorAll(cleanupSelectors).forEach((el) => {
    el.removeAttribute('data-placeholder');
    el.removeAttribute('data-inserted');
    el.removeAttribute('data-link');
    el.removeAttribute('data-sentence');
    el.removeAttribute('data-insert');
    el.removeAttribute('data-snippet');
    el.removeAttribute('data-block-title');
    el.removeAttribute('style');
    el.removeAttribute('contenteditable');
    if ((el as HTMLElement).classList.contains('block-main')) {
      (el as HTMLElement).classList.remove('block-main');
    }
    if ((el as HTMLElement).classList.contains('block-container')) {
      (el as HTMLElement).classList.remove('block-container');
    }
    if ((el as HTMLElement).classList.contains('insert-placeholder')) {
      (el as HTMLElement).classList.remove('insert-placeholder');
    }
  });

  // Unwrap containers that are purely structural
  tempDiv.querySelectorAll('[data-block-title]').forEach((el) => {
    const parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
  });

  tempDiv.querySelectorAll('.block-main, .block-container').forEach((el) => {
    const parent = el.parentNode;
    if (!parent) return;
    while (el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
  });

  // Remove label helpers
  tempDiv
    .querySelectorAll('.block-label, .block-label-display')
    .forEach((el) => el.remove());

  return tempDiv.innerHTML;
}

/**
 * When we insert multiline text from the TemplateBlocks, we turn raw newlines into <br />.
 */
export function cleanTemplateString(template: string): string {
  // Trim the entire string to remove leading/trailing whitespace and newlines
  const trimmedTemplate = template.trim();
  let lines = trimmedTemplate.split('\n');

  // If the first line is a header followed by a blank line, drop both
  if (lines.length > 1 && lines[1].trim() === '') {
    lines = lines.slice(2);
  }

  return lines
    .map((line) => line.trim())
    .join('<br />')
    .replace(/(<br \/>)+$/, '');
}

/**
 * Wrap all [INSERT ...] placeholders in a span so we can detect them easily.
 */
export function wrapInsertPlaceholders(text: string): string {
  return text.replace(/\[INSERT[^\]]*\]/gi, (m) => {
    return `<span class="insert-placeholder" data-insert tabindex="0" role="button">${m}</span>`;
  });
}

/**
 * A quick helper: do we have an array of strings or a single string?
 */
export function isStringArray(value: string | string[]): value is string[] {
  return Array.isArray(value);
}

export function replacePlaceholders(
  template: string,
  intro: string,
  enquiry: Enquiry,
  userData: any,
  blocks: TemplateBlock[] = templateBlocks
): string {
  const userFirstName = userData?.[0]?.['First'] || 'Your';
  const userFullName = userData?.[0]?.['Full Name'] || 'Your Name';
  const userRole = userData?.[0]?.['Role'] || 'Your Position';
  // Get the raw rate value
  const userRate = userData?.[0]?.['Rate'];
  // Format the rate to include the £ symbol and VAT text
  const formattedRate =
    userRate && userRate !== '[Rate]' ? `£${userRate} + VAT` : '[Rate]';

  let result = template
    .replace(
      /\[Enquiry.First_Name\]/g,
      `<span style="background-color: ${colours.highlightYellow}; padding: 1px 3px;" data-placeholder="[Enquiry.First_Name]">${
        enquiry.First_Name || 'there'
      }</span>`
    )
    .replace(
      /\[Enquiry.Point_of_Contact\]/g,
      `<span style="background-color: ${colours.highlightYellow}; padding: 1px 3px;" data-placeholder="[Enquiry.Point_of_Contact]">${
        enquiry.Point_of_Contact || 'Our Team'
      }</span>`
    );

  // Insert placeholders for each template block
  blocks.forEach((block) => {
    const regex = new RegExp(escapeRegExp(block.placeholder), 'g');
    const optionBubbles = block.options
      .map((o) => {
        const preview = cleanTemplateString(o.previewText).replace(/<p>/g, `<p style="margin: 0;">`);
        return `<div class="option-bubble" data-block-title="${block.title}" data-option-label="${o.label}"><strong>${o.label}</strong><div class="option-preview">${preview}</div></div>`;
      })
      .join('');
    result = result.replace(
      regex,
      `<span data-placeholder="${block.placeholder}" class="block-option-list"><span class="block-label" data-label-title="${block.title}">${block.title}</span>${optionBubbles}</span>`
    );
  });

  result = result
    .replace(
      /\[First Name\]/g,
      `<span data-placeholder="[First Name]" style="background-color: ${colours.grey}; padding: 1px 3px;">${userFirstName}</span>`
    )
    .replace(
      /\[Full Name\]/g,
      `<span data-placeholder="[Full Name]" style="background-color: ${colours.grey}; padding: 1px 3px;">${userFullName}</span>`
    )
    .replace(
      /\[Position\]/g,
      `<span data-placeholder="[Position]" style="background-color: ${colours.grey}; padding: 1px 3px;">${userRole}</span>`
    )
    .replace(
      /\[Rate\]/g,
      `<span data-placeholder="[Rate]" style="background-color: ${colours.grey}; padding: 1px 3px;">${formattedRate}</span>`
    );

  return result;
}

/**
 * Helper function to replace [FE] and [ACID] with dynamic values.
 */
export function applyDynamicSubstitutions(
  text: string,
  userData: any,
  enquiry: Enquiry,
  amount?: number | string,
  passcode?: string,
  instructionsLink?: string
): string {
  const userInitials = userData?.[0]?.['Initials'] || 'XX';
  const enquiryID = enquiry?.ID || '0000';
  const userRole = userData?.[0]?.['Role'] || '[Position]';
  const userRate = userData?.[0]?.['Rate']; // This is the raw rate value from SQL
  // Format the rate to include the pound symbol and " + VAT"
  const formattedRate =
    userRate && userRate !== '[Rate]' ? `£${userRate} + VAT` : '[Rate]';

  const formattedAmount =
    amount !== undefined && amount !== null && amount !== ''
      ? (() => {
          const num = Number(amount);
          if (isNaN(num)) return '[Amount]';
          const withDecimals = num.toLocaleString('en-GB', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });
          return `£${withDecimals.replace(/\.00$/, '')}`;
        })()
      : '[Amount]';

  // Prefer provided instructionsLink. Otherwise, if we have passcode and enquiry ID, use new path-based format.
  // New format: /pitch/prospectId-passcode or /pitch/passcode 
  const baseUrl = process.env.REACT_APP_INSTRUCTIONS_URL || 'https://instruct.helix-law.com';
  const finalInstructionsLink = instructionsLink
    || (passcode && enquiry?.ID
      ? `${baseUrl}/pitch/${enquiry.ID}-${passcode}`
      : passcode
        ? `${baseUrl}/pitch/${passcode}`
        : `${baseUrl}/pitch`);

  // Prebuild the anchor used in HTML previews/emails
  const instructAnchor = `<a href="${finalInstructionsLink}" target="_blank" rel="noopener noreferrer">Instruct Helix Law</a>`;

  return text
  // Support explicit marker syntax used in editor content
  .replace(/\[\[INSTRUCT_LINK::[^\]]*\]\]/gi, instructAnchor)
    .replace(/\[FE\]/g, userInitials)
    .replace(/\[ACID\]/g, enquiryID)
    .replace(/\[Position\]/g, userRole)
    .replace(/\[Rate\]/g, formattedRate)
    .replace(/\[Amount\]/g, formattedAmount)
    .replace(/\[Passcode\]/g, passcode || '[Passcode]')
  // Render a human-friendly hyperlink instead of a raw URL
  .replace(/\[InstructLink\]/g, instructAnchor);
}