// Builds the n8n "Appointment Emails" workflow JSON.
// Webhook (from CRM) -> emails the owner + the lead (Gmail). Handles both
// appointment_booked and appointment_reminder via the event_type field.
// Run: node generate-appointment-emails-workflow.js
const fs = require('fs');
const path = require('path');

const ownerSubject =
  "={{ ($json.body.event_type === 'appointment_reminder' ? '⏰ Reminder' : '📅 New appointment') + ': ' + $json.body.lead_name + ' — ' + $json.body.scheduled_label }}";
const ownerMessage =
  "={{ 'Lead: ' + $json.body.lead_name + ' (' + ($json.body.lead_email || 'walang email') + ')\\n' + 'Title: ' + $json.body.appointment_title + ' (' + $json.body.appointment_type + ')\\n' + 'Kailan: ' + $json.body.scheduled_label + '\\n' + 'Saan: ' + ($json.body.location || '-') + '\\n' + 'Notes: ' + ($json.body.notes || '-') }}";
const leadSubject =
  "={{ ($json.body.event_type === 'appointment_reminder' ? 'Reminder: ' : 'Confirmed: ') + 'ang inyong Balcony Solar appointment' }}";
const leadMessage =
  "={{ 'Hi ' + $json.body.lead_name + ',\\n\\n' + ($json.body.event_type === 'appointment_reminder' ? 'Paalala sa inyong ' : 'Confirmed ang inyong ') + $json.body.appointment_title + ' sa ' + $json.body.scheduled_label + ($json.body.location ? ' (' + $json.body.location + ')' : '') + '.\\n\\nSalamat!\\n— Balcony Solar PH' }}";

function gmailNode(id, name, sendTo, subject, message, pos) {
  return {
    parameters: {
      resource: 'message',
      operation: 'send',
      sendTo,
      subject,
      emailType: 'text',
      message,
      options: {},
    },
    id,
    name,
    type: 'n8n-nodes-base.gmail',
    typeVersion: 2.1,
    position: pos,
    continueOnFail: true,
    // credentials: { gmailOAuth2: { id: '...', name: 'Gmail account' } }  <- set in UI
  };
}

const workflow = {
  name: 'Balcony Solar PH — Appointment Emails',
  nodes: [
    {
      parameters: {
        httpMethod: 'POST',
        path: 'balcony-appointment-emails',
        responseMode: 'onReceived',
        options: {},
      },
      id: 'appt-webhook-001',
      name: 'Webhook',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 2,
      position: [240, 400],
    },
    gmailNode('appt-owner-002', 'Email Owner', '={{ $json.body.owner_email }}', ownerSubject, ownerMessage, [520, 300]),
    gmailNode('appt-lead-003', 'Email Lead', '={{ $json.body.lead_email }}', leadSubject, leadMessage, [520, 500]),
  ],
  connections: {
    Webhook: {
      main: [
        [
          { node: 'Email Owner', type: 'main', index: 0 },
          { node: 'Email Lead', type: 'main', index: 0 },
        ],
      ],
    },
  },
  settings: { executionOrder: 'v1' },
  active: false,
};

const outPath = path.join(__dirname, 'balcony-appointment-emails-workflow.json');
fs.writeFileSync(outPath, JSON.stringify(workflow, null, 2));
console.log('Appointment emails workflow written to:', outPath);
console.log('Flow: Webhook → Email Owner + Email Lead (Gmail)');
