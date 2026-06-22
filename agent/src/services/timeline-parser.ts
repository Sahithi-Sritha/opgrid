export const TRACKER_STATUSES = [
  'to_apply',
  'registered',
  'applied',
  'idea_submission',
  'idea_shortlisted',
  'video_submission',
  'assessment',
  'oa_received',
  'oa_done',
  'prototype_building',
  'hackathon_round',
  'semifinalist',
  'finalist',
  'presentation',
  'interview',
  'rejected',
  'offer',
  'winner',
  'ghosted',
] as const

export type TrackerStatus = typeof TRACKER_STATUSES[number]

export type ParsedTimeline = {
  company: string
  title: string
  deadline: string | null
  status: TrackerStatus
  notes: string | null
  url: string | null
}

const MONTHS: Record<string, number> = {
  jan: 0,
  january: 0,
  feb: 1,
  february: 1,
  mar: 2,
  march: 2,
  apr: 3,
  april: 3,
  may: 4,
  jun: 5,
  june: 5,
  jul: 6,
  july: 6,
  aug: 7,
  august: 7,
  sep: 8,
  sept: 8,
  september: 8,
  oct: 9,
  october: 9,
  nov: 10,
  november: 10,
  dec: 11,
  december: 11,
}

const pad = (value: number) => String(value).padStart(2, '0')

function validDate(year: number, month: number, day: number) {
  const date = new Date(Date.UTC(year, month, day))
  return date.getUTCFullYear() === year && date.getUTCMonth() === month && date.getUTCDate() === day
    ? `${year}-${pad(month + 1)}-${pad(day)}`
    : null
}

function inferYear(month: number, day: number, now: Date) {
  const currentYear = now.getUTCFullYear()
  const candidate = new Date(Date.UTC(currentYear, month, day))
  const sixMonthsAgo = new Date(now)
  sixMonthsAgo.setUTCMonth(sixMonthsAgo.getUTCMonth() - 6)
  return candidate < sixMonthsAgo ? currentYear + 1 : currentYear
}

export function extractDate(text: string, now = new Date()): string | null {
  const iso = text.match(/\b(20\d{2})-(\d{1,2})-(\d{1,2})\b/)
  if (iso) return validDate(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]))

  const numeric = text.match(/\b(\d{1,2})[/-](\d{1,2})[/-](20\d{2})\b/)
  if (numeric) return validDate(Number(numeric[3]), Number(numeric[2]) - 1, Number(numeric[1]))

  const monthFirst = text.match(
    /\b(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s+(20\d{2}))?\b/i,
  )
  if (monthFirst) {
    const month = MONTHS[monthFirst[1].toLowerCase()]
    const day = Number(monthFirst[2])
    const year = monthFirst[3] ? Number(monthFirst[3]) : inferYear(month, day, now)
    return validDate(year, month, day)
  }

  const dayFirst = text.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(?:of\s+)?(january|february|march|april|may|june|july|august|september|october|november|december|jan|feb|mar|apr|jun|jul|aug|sep|sept|oct|nov|dec)(?:,?\s+(20\d{2}))?\b/i,
  )
  if (dayFirst) {
    const month = MONTHS[dayFirst[2].toLowerCase()]
    const day = Number(dayFirst[1])
    const year = dayFirst[3] ? Number(dayFirst[3]) : inferYear(month, day, now)
    return validDate(year, month, day)
  }

  const lower = text.toLowerCase()
  const relative = new Date(now)
  if (/\btoday\b/.test(lower)) return relative.toISOString().slice(0, 10)
  if (/\btomorrow\b/.test(lower)) {
    relative.setUTCDate(relative.getUTCDate() + 1)
    return relative.toISOString().slice(0, 10)
  }

  return null
}

export function inferStatus(text: string): TrackerStatus {
  const value = text.toLowerCase()
  if (/\b(winner|won|winning)\b/.test(value)) return 'winner'
  if (/\b(rejected|not selected|declined)\b/.test(value)) return 'rejected'
  if (/\b(offer|ppo received|selected for ppo)\b/.test(value)) return 'offer'
  if (/\bghosted\b/.test(value)) return 'ghosted'
  if (/\b(finalist|grand finale|final round)\b/.test(value)) return 'finalist'
  if (/\b(semi[- ]?final|semifinal)\b/.test(value)) return 'semifinalist'
  if (/\b(presentation|pitching|demo day)\b/.test(value)) return 'presentation'
  if (/\b(prototype|building phase|build phase)\b/.test(value)) return 'prototype_building'
  if (/\b(hackathon round|onsite hackathon|offline hackathon)\b/.test(value)) return 'hackathon_round'
  if (/\b(video submission|submit(?:ted)? (?:a )?video|video round)\b/.test(value)) return 'video_submission'
  if (/\b(idea shortlisted|shortlisted idea|idea selected)\b/.test(value)) return 'idea_shortlisted'
  if (/\b(idea submission|submit(?:ted)? (?:an )?idea|proposal submission|abstract submission)\b/.test(value)) {
    return 'idea_submission'
  }
  if (/\b(oa done|assessment completed|test completed)\b/.test(value)) return 'oa_done'
  if (/\b(oa received|assessment invite|test invite)\b/.test(value)) return 'oa_received'
  if (/\b(assessment|coding test|aptitude test|quiz round)\b/.test(value)) return 'assessment'
  if (/\b(interview|technical round|hr round)\b/.test(value)) return 'interview'
  if (/\b(registered|registration complete)\b/.test(value)) return 'registered'
  if (/\b(applied|application submitted|submitted application)\b/.test(value)) return 'applied'
  return 'to_apply'
}

function cleanLead(text: string) {
  return text
    .replace(/https?:\/\/\S+/gi, '')
    .replace(/^[\s•*\-\d.)]+/, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function inferCompanyAndTitle(line: string) {
  const lead = cleanLead(line)
    .split(/\b(?:deadline|closes?|closing|apply by|due|register by|registration|applications? open|applications? close|idea submission|video submission|interview|assessment|oa)\b/i)[0]
    .replace(/[:–—-]\s*$/, '')
    .trim()

  const separator = lead.match(/^(.+?)\s+(?:at|@)\s+(.+)$/i)
  if (separator) return { company: separator[2].trim(), title: separator[1].trim() }

  const colon = lead.split(/\s*(?:\||:|–|—)\s*/).filter(Boolean)
  if (colon.length >= 2) return { company: colon[0], title: colon.slice(1).join(' - ') }

  const words = lead.split(/\s+/).filter(Boolean)
  if (words.length === 0) return { company: '', title: 'Unknown Opportunity' }
  if (words.length === 1) return { company: words[0], title: 'Unknown Opportunity' }

  return { company: words[0], title: words.slice(1).join(' ') }
}

function splitTimelineText(text: string) {
  const normalized = text.replace(/\r/g, '').trim()
  const lines = normalized
    .split(/\n+|(?<=[.!?])\s+(?=[A-Z0-9•*-])/)
    .map(line => line.trim())
    .filter(line => line.length >= 3)

  return lines.length > 0 ? lines : [normalized]
}

export function parseTimelinesFallback(text: string, now = new Date()): ParsedTimeline[] {
  const parsed = splitTimelineText(text)
    .map(line => {
      const url = line.match(/https?:\/\/[^\s<>"')\]]+/i)?.[0] || null
      const { company, title } = inferCompanyAndTitle(line)
      return {
        company,
        title: title || 'Unknown Opportunity',
        deadline: extractDate(line, now),
        status: inferStatus(line),
        notes: line,
        url,
      }
    })
    .filter(item => item.company)

  const unique = new Map<string, ParsedTimeline>()
  for (const item of parsed) {
    unique.set(`${item.company.toLowerCase()}|${item.title.toLowerCase()}|${item.deadline || ''}`, item)
  }
  return Array.from(unique.values())
}

export function normalizeParsedTimeline(value: any): ParsedTimeline | null {
  if (!value || typeof value !== 'object' || !String(value.company || '').trim()) return null
  const requestedStatus = String(value.status || 'to_apply') as TrackerStatus
  return {
    company: String(value.company).trim(),
    title: String(value.title || 'Unknown Opportunity').trim(),
    deadline: typeof value.deadline === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.deadline)
      ? value.deadline
      : null,
    status: TRACKER_STATUSES.includes(requestedStatus) ? requestedStatus : inferStatus(String(value.notes || '')),
    notes: value.notes ? String(value.notes).trim() : null,
    url: typeof value.url === 'string' && /^https?:\/\//i.test(value.url) ? value.url.trim() : null,
  }
}
