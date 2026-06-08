// Normalizes Oxylabs Google Maps results -> { product, businessType, area, prospects[] }
// for the CRM /api/leads/import endpoint. n8n Code node, "Run Once for All Items".
//
// Expects the webhook body (product, type, area) available on the first item's json
// via $('Webhook').first().json.body, and Oxylabs results in $input.

const wh = $('Webhook').first().json.body || {};
const product = wh.product || '';
const businessType = wh.type || '';
const area = wh.area || '';

// Oxylabs result shape varies by node; handle the common "organic/local" arrays.
const items = $input.all();
const out = [];

for (const item of items) {
  const d = item.json;
  const results =
    d?.results ||
    d?.data?.results ||
    d?.local_results ||
    (Array.isArray(d) ? d : [d]);

  for (const r of results || []) {
    const name = r.title || r.name || r.business_name;
    if (!name) continue;
    out.push({
      name: String(name),
      phone: r.phone || r.phone_number || null,
      website: r.website || r.url || null,
      email: r.email || null, // filled by a later enrichment node if present
      address: r.address || r.formatted_address || null,
      sourceUrl: r.link || r.url || r.website || null,
      externalId:
        r.place_id ||
        r.cid ||
        `${String(name).toLowerCase().replace(/\s+/g, '-')}|${(r.phone || '').replace(/\D/g, '')}`,
    });
  }
}

return [{ json: { product, businessType, area, prospects: out } }];
