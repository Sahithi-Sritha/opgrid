import { supabase } from '../config/supabase'
import { sendDeadlineReminder } from '../notifier/email'
import { notifyDeadline } from '../notifier/telegram'

export async function checkDeadlines() {
  // Get opportunities expiring in 3 days
  const { data, error } = await supabase
    .rpc('get_expiring_soon')

  if (error) {
    console.error('Failed to check deadlines:', error)
    return
  }

  if (data && data.length > 0) {
    console.log(`⚠️  Found ${data.length} opportunities expiring soon`)

    for (const opp of data) {
      await sendDeadlineReminder(opp)
      await notifyDeadline(opp)
    }
  }
}

export async function checkFollowUps() {
  console.log('Follow-ups check not yet implemented')
}
