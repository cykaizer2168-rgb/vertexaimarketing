// Builds the n8n "Prospect Scraper (Oxylabs Google Maps)" workflow JSON.
// Run: node generate-prospect-scraper-workflow.js
const fs = require('fs');
const path = require('path');

const jsCode = fs.readFileSync(path.join(__dirname, 'prospect-scraper-code-node.js'), 'utf8');

const workflow = {
  name: 'Balcony Solar PH — Prospect Scraper (Oxylabs Google Maps)',
  nodes: [
    {
      parameters: {
        httpMethod: 'POST',
        path: 'balcony-prospect-scraper',
        responseMode: 'lastNode',
        options: {},
      },
      id: 'webhook-001',
      name: 'Webhook',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: [240, 400],
    },
    {
      // Placeholder HTTP call to Oxylabs. During setup, replace this with the
      // Oxylabs AI Studio node (Search/Scraper) using the Hostinger credits
      // credential, querying Google Maps: "{{ $json.body.type }} in {{ $json.body.area }}".
      parameters: {
        method: 'POST',
        url: 'https://realtime.oxylabs.io/v1/queries',
        authentication: 'genericCredentialType',
        sendBody: true,
        specifyBody: 'json',
        jsonBody:
          '={{ JSON.stringify({ source: "google_maps", query: ($json.body.type + " in " + $json.body.area), pages: 1, parse: true }) }}',
        options: {},
      },
      id: 'oxylabs-002',
      name: 'Oxylabs Google Maps',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [480, 400],
    },
    {
      parameters: { jsCode },
      id: 'normalize-003',
      name: 'Normalize',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [720, 400],
    },
    {
      parameters: {
        method: 'POST',
        url: 'https://balcony-solar-ph.vercel.app/api/leads/import',
        sendHeaders: true,
        headerParameters: {
          parameters: [{ name: 'x-import-secret', value: '={{ $env.OUTREACH_IMPORT_SECRET }}' }],
        },
        sendBody: true,
        specifyBody: 'json',
        jsonBody: '={{ JSON.stringify($json) }}',
        options: {},
      },
      id: 'send-004',
      name: 'Send to CRM',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [960, 400],
    },
  ],
  connections: {
    Webhook: { main: [[{ node: 'Oxylabs Google Maps', type: 'main', index: 0 }]] },
    'Oxylabs Google Maps': { main: [[{ node: 'Normalize', type: 'main', index: 0 }]] },
    Normalize: { main: [[{ node: 'Send to CRM', type: 'main', index: 0 }]] },
  },
  settings: { executionOrder: 'v1' },
  active: false,
};

const outPath = path.join(__dirname, 'balcony-prospect-scraper-workflow.json');
fs.writeFileSync(outPath, JSON.stringify(workflow, null, 2));
console.log('Prospect scraper workflow written to:', outPath);
console.log('Flow: Webhook → Oxylabs Google Maps → Normalize → Send to CRM');
