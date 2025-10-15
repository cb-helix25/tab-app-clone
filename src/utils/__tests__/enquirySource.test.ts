import { getNormalizedEnquirySource, getNormalizedEnquirySourceLabel } from '../enquirySource';

describe('enquirySource normalization', () => {
  test('detects Google Ads via gclid', () => {
    const e = { GCLID: 'EAIaIQob..._BwE', Referral_URL: 'https://helix-law.co.uk/?utm_source=google&utm_medium=cpc&utm_campaign=abc' };
    const s = getNormalizedEnquirySource(e);
    expect(s.key).toBe('google_ads');
    expect(getNormalizedEnquirySourceLabel(e)).toBe('Google Ads');
  });

  test('detects Organic search', () => {
    const e = { Ultimate_Source: 'organic search', Method_of_Contact: 'web form', Referral_URL: 'https://helix-law.co.uk/contact/' };
    const s = getNormalizedEnquirySource(e);
    expect(s.key).toBe('organic');
  });

  test('detects Facebook Lead Ads from notes', () => {
    const e = { Initial_first_call_notes: 'Facebook Lead ID: 12345', Campaign: '' };
    const s = getNormalizedEnquirySource(e);
    expect(s.key).toBe('meta_ads');
  });

  test('detects ChatGPT from utm_source', () => {
    const e = { Referral_URL: 'https://helix-law.co.uk/path?utm_source=chatgpt.com&utm_medium=referral' } as any;
    const s = getNormalizedEnquirySource(e);
    expect(s.key).toBe('chatgpt');
  });

  test('falls back to referral company', () => {
    const e = { Referring_Company: 'Acme Ltd' };
    const s = getNormalizedEnquirySource(e);
    expect(s.key).toBe('referral_company');
    expect(s.label).toBe('Referral: Acme Ltd');
  });

  test('method-of-contact bucket: not recorded when no source', () => {
    const e = { Method_of_Contact: 'call in' };
    const s = getNormalizedEnquirySource(e);
    expect(s.key).toBe('not_recorded');
  });

  test('not recorded fallback', () => {
    const s = getNormalizedEnquirySource({});
    expect(s.key).toBe('not_recorded');
    expect(s.label).toBe('Not Recorded');
  });
});
