import { Resend } from 'resend'
import { supabase } from '../config/supabase'

let resend: Resend | null = null

function getResend(): Resend {
  if (!resend) {
    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      throw new Error('Resend API key not configured. Set RESEND_API_KEY in the environment.')
    }
    resend = new Resend(apiKey)
  }
  return resend
}

function getRecipientEmail(): string {
  const recipient = process.env.DAILY_DIGEST_EMAIL
  if (!recipient) {
    throw new Error('Daily digest recipient not configured. Set DAILY_DIGEST_EMAIL.')
  }
  return recipient
}

export async function sendDailyDigest() {
  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: opportunities, error } = await supabase
      .from('opportunities')
      .select('*')
      .gte('created_at', yesterday)
      .order('created_at', { ascending: false })

    if (error || !opportunities || opportunities.length === 0) {
      console.log('No new opportunities for digest')
      return
    }

    const recipientEmail = getRecipientEmail()
    const { error: sendError } = await getResend().emails.send({
      from: 'OpGrid <noreply@opgrid.app>',
      to: recipientEmail,
      subject: `OpGrid Daily Digest - ${opportunities.length} New Opportunities`,
      html: generateDigestHTML(opportunities),
    })

    if (sendError) {
      console.error('Failed to send digest:', sendError)
      return
    }

    console.log('Daily digest sent')
    await supabase.from('notif_log').insert({
      type: 'email',
      payload: { count: opportunities.length, email: recipientEmail },
    })
  } catch (error) {
    console.error('Digest error:', error)
  }
}

export async function sendDeadlineReminder(opportunity: any) {
  try {
    const html = `
      <h2>Deadline Reminder</h2>
      <p>The application deadline for <strong>${opportunity.title}</strong> at <strong>${opportunity.company}</strong> is approaching.</p>
      <p>Deadline: <strong>${new Date(opportunity.deadline).toLocaleDateString()}</strong> (${opportunity.days_remaining} days remaining)</p>
      <a href="${opportunity.url}">Apply now</a>
    `

    await getResend().emails.send({
      from: 'OpGrid <noreply@opgrid.app>',
      to: getRecipientEmail(),
      subject: `Deadline in ${opportunity.days_remaining} days: ${opportunity.title}`,
      html,
    })

    console.log(`Deadline reminder sent for ${opportunity.title}`)
  } catch (error) {
    console.error('Deadline reminder error:', error)
  }
}

function generateDigestHTML(opportunities: any[]): string {
  const grouped = opportunities.reduce((acc, opportunity) => {
    if (!acc[opportunity.source]) acc[opportunity.source] = []
    acc[opportunity.source].push(opportunity)
    return acc
  }, {} as Record<string, any[]>)

  let html = `
    <h1>OpGrid Daily Digest</h1>
    <p>Found ${opportunities.length} new opportunities in the last 24 hours.</p>
  `

  for (const [source, sourceOpportunities] of Object.entries(grouped) as [string, any[]][]) {
    html += `<h2>${source} (${sourceOpportunities.length})</h2><ul>`

    for (const opportunity of sourceOpportunities) {
      html += `
        <li>
          <strong>${opportunity.title}</strong> at ${opportunity.company}
          ${opportunity.tags?.length ? `<br><small>${opportunity.tags.join(', ')}</small>` : ''}
          <br><a href="${opportunity.url}">View posting</a>
        </li>
      `
    }

    html += '</ul>'
  }

  return html
}
