const assert = require('node:assert/strict')
const { canonicalOpportunityUrl, opportunityFingerprint } = require('../dist/services/opportunity-identity')

assert.equal(
  canonicalOpportunityUrl('https://example.com/jobs/123/?utm_source=newsletter&b=2&a=1#section'),
  'https://example.com/jobs/123?a=1&b=2',
)
assert.equal(canonicalOpportunityUrl('not a url'), 'not a url')
assert.equal(opportunityFingerprint({ company: 'Acme, Inc.', title: 'Software Intern!' }), 'acme inc\u0000software intern')
console.log('opportunity identity checks passed')
