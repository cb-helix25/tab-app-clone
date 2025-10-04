/**
 * Utilities to normalize enquiry source across inconsistent fields.
 * Keeps logic self-contained and side-effect free so the UI can rely on a consistent label.
 */

export type NormalizedEnquirySource = {
  /** Human-friendly label used for grouping in the UI */
  label: string;
  /** Machine-friendly category key for downstream use if needed */
  key: string;
  /** Optional detail such as referrer name or campaign */
  detail?: string;
};

const toStr = (v: unknown): string => (typeof v === 'string' ? v : v == null ? '' : String(v));

function safeLower(v: unknown): string {
  return toStr(v).trim().toLowerCase();
}

function extractDomain(url: string): string | null {
  try {
    const u = new URL(url);
    return u.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function getUtmParams(url: string): { source?: string; medium?: string; campaign?: string } {
  try {
    const u = new URL(url);
    const params = u.searchParams;
    return {
      source: params.get('utm_source') || undefined,
      medium: params.get('utm_medium') || undefined,
      campaign: params.get('utm_campaign') || undefined,
    };
  } catch {
    return {};
  }
}

function hasGclid(v: unknown): boolean {
  // Some rows store GCLID in its own column; sometimes within the URL
  const s = safeLower(v);
  if (!s) return false;
  return s.includes('gclid=') || s.length > 0; // explicit column is often a long token
}

function looksLikeFacebookLead(notes: string, campaign: string): boolean {
  const n = notes.toLowerCase();
  const c = campaign.toLowerCase();
  return n.includes('facebook lead id') || c.includes('facebook');
}

/**
 * Derive a normalized source from an enquiry record with mixed schema.
 * Priority order:
 * 1) Paid search (Google Ads): explicit gclid OR utm_source=google with cpc/ppc OR ultimate_source contains 'google ads'
 * 2) ChatGPT: utm_source chatgpt or referral domain includes chatgpt.com/searchgpt
 * 3) Facebook Lead Ads: indicators in notes/campaign or referral domain facebook
 * 4) Organic search: explicit label or utm_medium=organic
 * 5) Direct email, Phone call, Website form (from method_of_contact)
 * 6) Referral: Contact_Referrer / Referring_Company present
 * 7) Operations (explicit)
 * 8) Website (helix-law domain without UTM)
 * 9) Unknown
 */
export function getNormalizedEnquirySource(raw: unknown): NormalizedEnquirySource {
  const e = (raw ?? {}) as Record<string, unknown>;
  const ultimate = safeLower(e.Ultimate_Source ?? (e as any).source ?? (e as any).Source);
  const moc = safeLower(e.Method_of_Contact ?? (e as any).method_of_contact ?? (e as any).moc);
  const contactRef = toStr(e.Contact_Referrer ?? (e as any).contact_referrer).trim();
  const referringCompany = toStr(e.Referring_Company ?? (e as any).referring_company).trim();
  const url = toStr(e.Referral_URL ?? (e as any).referral_url).trim();
  const campaign = toStr(e.Campaign ?? (e as any).campaign).trim();
  const gclid = toStr(e.GCLID ?? (e as any).gclid).trim();
  const notes = toStr(e.Initial_first_call_notes ?? (e as any).notes).trim();

  // 1) Google Ads / Paid Search
  const utm = url ? getUtmParams(url) : {};
  const hasPaidMedium = safeLower(utm.medium).includes('cpc') || safeLower(utm.medium).includes('ppc');
  if (
    hasGclid(gclid) ||
    (safeLower(utm.source) === 'google' && (hasPaidMedium || ultimate.includes('paid') || ultimate.includes('ads'))) ||
    ultimate.includes('google ads')
  ) {
    return { key: 'google_ads', label: 'Google Ads', detail: campaign || utm.campaign };
  }

  // 2) ChatGPT
  const domain = url ? extractDomain(url) : null;
  if (
    domain === 'chatgpt.com' ||
    ultimate.includes('searchgpt') || safeLower(e['utm_source']).includes('chatgpt') ||
    url.includes('utm_source=chatgpt')
  ) {
    return { key: 'chatgpt', label: 'ChatGPT', detail: utm.campaign };
  }

  // 3) Facebook Lead Ads
  if (
    domain === 'facebook.com' || domain === 'm.facebook.com' ||
    looksLikeFacebookLead(notes, campaign)
  ) {
    return { key: 'facebook_lead_ads', label: 'Facebook Lead Ads', detail: campaign };
  }

  // 4) Organic Search
  if (ultimate.includes('organic search') || moc === 'organic search' || safeLower(utm.medium) === 'organic') {
    return { key: 'organic', label: 'Organic search' };
  }

  // 5) Method-of-contact based
  if (moc === 'direct email') return { key: 'direct_email', label: 'Direct email' };
  if (moc === 'call in' || moc === 'phone' || moc === 'phone call') return { key: 'phone', label: 'Phone call' };
  if (moc === 'web form' || moc === 'website form' || moc === 'online form') return { key: 'web_form', label: 'Website form' };

  // 6) Referral sources
  if (referringCompany) return { key: 'referral_company', label: `Referral: ${referringCompany}`, detail: referringCompany };
  if (contactRef) return { key: 'referral_contact', label: 'Referral', detail: contactRef };

  // 7) Operations (explicit flag often used internally)
  if (ultimate === 'operations') return { key: 'operations', label: 'Operations' };

  // 8) Website (no UTM)
  if (domain && (domain.endsWith('helix-law.co.uk') || domain.endsWith('helix-law.co.uk/'))) {
    return { key: 'website', label: 'Website' };
  }

  // Fallback
  if (ultimate) return { key: ultimate.replace(/\s+/g, '_'), label: toStr(e.Ultimate_Source as any) || toStr((e as any).Source) };
  return { key: 'unknown', label: 'Unknown' };
}

export function getNormalizedEnquirySourceLabel(raw: unknown): string {
  return getNormalizedEnquirySource(raw).label;
}
