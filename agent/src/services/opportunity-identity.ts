const TRACKING_PARAMS = new Set(['fbclid', 'gclid', 'mc_cid', 'mc_eid', 'ref', 'referrer', 'source'])

export function canonicalOpportunityUrl(value: string): string {
  try {
    const url = new URL(value.trim())
    url.hash = ''
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith('utm_') || TRACKING_PARAMS.has(key.toLowerCase())) url.searchParams.delete(key)
    }
    url.searchParams.sort()
    url.pathname = url.pathname.replace(/\/+$/, '') || '/'
    return url.toString()
  } catch {
    return value.trim()
  }
}

function text(value: string | null | undefined) {
  return String(value || '').trim().toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
}

export function opportunityFingerprint(opportunity: { company?: string | null; title?: string | null }) {
  return `${text(opportunity.company)}\u0000${text(opportunity.title)}`
}
