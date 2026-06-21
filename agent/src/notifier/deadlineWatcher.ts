import { supabase } from '../config/supabase'
import { differenceInDays, addDays, format } from 'date-fns'
import { notifyDeadline } from './telegram'

export async function checkDeadlines() {
  console.log('⏰ Checking deadlines...')
  
  const now = new Date()

  try {
    // Fetch opportunities with deadlines in next 14 days
    const { data: upcoming, error } = await supabase
      .from('opportunities')
      .select('*, applications(*)')
      .not('deadline', 'is', null)
      .gte('deadline', now.toISOString().split('T')[0])
      .lte('deadline', addDays(now, 14).toISOString().split('T')[0])
      .order('deadline', { ascending: true })

    if (error) {
      console.error('Failed to fetch deadlines:', error)
      return
    }

    if (!upcoming || upcoming.length === 0) {
      console.log('  No upcoming deadlines in next 14 days')
      return
    }

    let notifiedCount = 0

    for (const opp of upcoming) {
      const daysLeft = differenceInDays(new Date(opp.deadline), now)
      const alreadyApplied = (opp as any).applications?.length > 0
      const lastNotified = opp.last_notified_at ? new Date(opp.last_notified_at) : null

      // Skip if already applied
      if (alreadyApplied) {
        continue
      }

      // Determine if we should notify based on days left and last notification
      const shouldNotify = determineNotification(daysLeft, lastNotified)

      if (shouldNotify) {
        const urgencyLabel = 
          daysLeft <= 1 ? '🚨 LAST CHANCE' :
          daysLeft <= 3 ? '⚡ URGENT' :
          '📅 Upcoming'

        // Send Telegram notification
        await notifyDeadline({
          ...opp,
          urgency_label: urgencyLabel,
          days_remaining: daysLeft
        })

        // Create in-app notification
        await supabase.from('notifications').insert({
          type: 'deadline',
          title: `${urgencyLabel}: ${opp.title}`,
          body: `Deadline: ${format(new Date(opp.deadline), 'MMM d')} — ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`,
          related_id: opp.id
        })

        // Update last_notified_at
        await supabase
          .from('opportunities')
          .update({ last_notified_at: now.toISOString() })
          .eq('id', opp.id)

        notifiedCount++
      }
    }

    // Check for hackathons with registration closing soon
    await checkRegistrationDeadlines(now)

    console.log(`✓ Checked deadlines: ${notifiedCount} notifications sent`)

  } catch (error) {
    console.error('Deadline check error:', error)
  }
}

function determineNotification(daysLeft: number, lastNotified: Date | null): boolean {
  if (!lastNotified) return true

  const hoursSinceNotified = differenceInDays(new Date(), lastNotified) * 24

  // Notification thresholds:
  // <= 1 day: notify every 12 hours
  // <= 3 days: notify every 24 hours
  // <= 7 days: notify every 48 hours
  if (daysLeft <= 1 && hoursSinceNotified >= 12) return true
  if (daysLeft <= 3 && hoursSinceNotified >= 24) return true
  if (daysLeft <= 7 && hoursSinceNotified >= 48) return true

  return false
}

async function checkRegistrationDeadlines(now: Date) {
  const { data: hackathons } = await supabase
    .from('opportunities')
    .select('*')
    .eq('category', 'hackathon')
    .eq('registration_open', true)
    .not('deadline', 'is', null)
    .lte('deadline', addDays(now, 5).toISOString().split('T')[0])

  if (!hackathons || hackathons.length === 0) return

  for (const hackathon of hackathons) {
    const daysLeft = differenceInDays(new Date(hackathon.deadline), now)

    // Send registration closing alert
    await supabase.from('notifications').insert({
      type: 'registration_closing',
      title: `⏰ Registration closing: ${hackathon.title}`,
      body: `Registration closes in ${daysLeft} days. Event date may be later!`,
      related_id: hackathon.id
    })

    console.log(`  → Registration closing alert: ${hackathon.title}`)
  }
}

// Check for follow-up reminders
export async function checkFollowUps() {
  console.log('👋 Checking follow-ups...')

  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

  const { data: applications } = await supabase
    .from('applications')
    .select('*, opportunities(*)')
    .eq('status', 'applied')
    .eq('follow_up_sent', false)
    .lte('applied_date', sevenDaysAgo.toISOString().split('T')[0])

  if (!applications || applications.length === 0) {
    console.log('  No follow-ups needed')
    return
  }

  for (const app of applications) {
    const opp = (app as any).opportunities

    // Send Telegram reminder
    await supabase.from('notifications').insert({
      type: 'follow_up_due',
      title: `👋 Follow up on ${opp.company}`,
      body: `It's been 7 days since you applied to ${opp.title}. Time to follow up?`,
      related_id: app.id
    })

    console.log(`  → Follow-up reminder: ${opp.title} at ${opp.company}`)
  }
}
