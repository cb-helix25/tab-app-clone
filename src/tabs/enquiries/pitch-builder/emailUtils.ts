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
  const normalized = html
    .replace(/\r\n/g, '\n')
    .replace(/(<br \/>){2,}/g, '\n\n')
    .replace(/<\/div>\s*<br \/>/g, '</div>');
  const paragraphs = normalized.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const wrapped = paragraphs.map((paragraph) => `<p>${paragraph.trim()}</p>`);
  return wrapped.join('');
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
 * Strips all the highlight <span> attributes (data-placeholder, data-inserted, etc.)
 * so final email doesn't have bright highlighting.
 */
export function removeHighlightSpans(html: string): string {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  // Elements that should be fully removed
  const removeSelectors =
    '.lock-toggle, .block-sidebar, .sentence-delete, .block-option-list, .option-bubble';
  tempDiv.querySelectorAll(removeSelectors).forEach((el) => el.remove());

  // Remove highlight attributes/classes but keep user content
  const cleanupSelectors =
    '[data-placeholder], [data-inserted], [data-link], [data-sentence], .block-main';
  tempDiv.querySelectorAll(cleanupSelectors).forEach((el) => {
    el.removeAttribute('data-placeholder');
    el.removeAttribute('data-inserted');
    el.removeAttribute('data-link');
    el.removeAttribute('data-sentence');
    el.removeAttribute('style');
    el.removeAttribute('contenteditable');
    if ((el as HTMLElement).classList.contains('block-main')) {
      (el as HTMLElement).classList.remove('block-main');
    }
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
  return trimmedTemplate
    .split('\n')
    .map(line => line.trim())
    .join('<br />')
    .replace(/(<br \/>)+$/, '');
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
  checkoutLink?: string
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

  const finalCheckoutLink = checkoutLink ||
    (passcode
      ? `${process.env.REACT_APP_CHECKOUT_URL}?passcode=${passcode}`
      : process.env.REACT_APP_CHECKOUT_URL || '#');

  return text
    .replace(/\[FE\]/g, userInitials)
    .replace(/\[ACID\]/g, enquiryID)
    .replace(/\[Position\]/g, userRole)
    .replace(/\[Rate\]/g, formattedRate)
    .replace(/\[Amount\]/g, formattedAmount)
    .replace(/\[Passcode\]/g, passcode || '[Passcode]')
    .replace(/\[CheckoutLink\]/g, finalCheckoutLink);
}