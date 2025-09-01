// Quick test script for notable case/prospect submissions
// Run with: node scripts/test_notable_case_submissions.js

const fetch = global.fetch || require('node-fetch');

// Use correct port for TypeScript Azure Functions host (7072)
let BASE = process.env.TEST_BASE || process.env.REACT_APP_PROXY_BASE_URL || 'http://localhost:7072';
if (BASE.endsWith('/')) BASE = BASE.slice(0,-1);
const API_BASE = BASE.endsWith('/api') ? BASE : BASE + '/api';
const PATH = process.env.REACT_APP_INSERT_NOTABLE_CASE_INFO_PATH || 'insertNotableCaseInfo';
const CODE = process.env.REACT_APP_INSERT_NOTABLE_CASE_INFO_CODE || process.env.FUNC_CODE || '';

function url() {
  const base = BASE.endsWith('/') ? BASE.slice(0, -1) : BASE;
  const codePart = CODE ? `?code=${CODE}` : '';
  return `${API_BASE}/${PATH}${codePart}`;
}

async function submit(payload) {
  const res = await fetch(url(), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const text = await res.text();
  let data = text;
  try { data = JSON.parse(text); } catch {}
  return { status: res.status, data };
}

(async () => {
  console.log('Testing Client Matter submission...');
  const clientPayload = {
    initials: 'AB',
    context_type: 'C',
    display_number: 'TEST-CLIENT-001',
    prospect_id: null,
    merit_press: 'High profile dispute likely to attract trade press.',
    summary: 'Dispute over software license fees between major vendors.',
    value_in_dispute: '£500,001 or more',
    value_in_dispute_exact: '750000',
    c_reference_status: true,
    counsel_instructed: true,
    counsel_name: 'Jane Doe KC'
  };
  console.log(await submit(clientPayload));

  console.log('\nTesting Prospect submission...');
  const prospectPayload = {
    initials: 'AB',
    context_type: 'P',
    display_number: null,
    prospect_id: 'P-ENQ-123',
    merit_press: 'Potential landmark claim once formalized.',
    summary: 'Prospect enquiring about misrepresentation in share sale.',
    value_in_dispute: '£100,001 - £500,000',
    value_in_dispute_exact: null,
    c_reference_status: false,
    counsel_instructed: false,
    counsel_name: null
  };
  console.log(await submit(prospectPayload));
})();
