import { Router } from 'express'
import { supabase } from '../config/supabase'
import Fuse from 'fuse.js'

const router = Router()

// POST /api/telegram/webhook
// Handle incoming Telegram messages for follow-up tracking
router.post('/webhook', async (req, res) => {
  try {
    const secret = process.env.TELEGRAM_WEBHOOK_SECRET
    if (!secret || req.header('x-telegram-bot-api-secret-token') !== secret) {
      return res.status(401).json({ error: 'Invalid webhook secret' })
    }
    const { message } = req.body

    if (!message || !message.text) {
      return res.status(400).json({ error: 'No message text' })
    }

    const text = message.text.toLowerCase()
    const chatId = message.chat.id

    // Check if message indicates follow-up sent
    const followUpIndicators = ['yes', 'done', 'sent', 'followed up', 'completed']
    const isFollowUpConfirmation = followUpIndicators.some(indicator => text.includes(indicator))

    if (!isFollowUpConfirmation) {
      return res.json({ ok: true })
    }

    const { data: link, error: linkError } = await supabase
      .from('telegram_links')
      .select('user_id')
      .eq('chat_id', String(chatId))
      .maybeSingle()
    if (linkError || !link) return res.json({ ok: true })

    // Get only this Telegram user's pending follow-ups.
    const { data: pendingApps } = await supabase
      .from('applications')
      .select('*, opportunities(*)')
      .eq('user_id', link.user_id)
      .eq('follow_up_sent', false)
      .eq('status', 'applied')

    if (!pendingApps || pendingApps.length === 0) {
      return res.json({ ok: true })
    }

    // Try to match company name from message
    let matchedApp = null

    // Extract potential company names from message
    const words = text.split(/\s+/)
    const fuse = new Fuse(pendingApps, {
      keys: ['opportunities.company', 'opportunities.title'],
      threshold: 0.4
    })

    // Try to match against each word
    for (const word of words) {
      const results = fuse.search(word)
      if (results.length > 0) {
        matchedApp = results[0].item
        break
      }
    }

    if (!matchedApp) {
      // If no match, update the most recent one
      matchedApp = pendingApps[0]
    }

    // Update follow-up status
    await supabase
      .from('applications')
      .update({
        follow_up_sent: true,
        follow_up_date: new Date().toISOString().split('T')[0]
      })
      .eq('id', matchedApp.id)

    const opp = (matchedApp as any).opportunities

    // Send confirmation
    const confirmMessage = `Got it! ✅ Marked follow-up sent for ${opp.title} at ${opp.company}.`
    
    await fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: confirmMessage
      })
    })

    res.json({ ok: true, matched: matchedApp.id })

  } catch (error) {
    console.error('Telegram webhook error:', error)
    res.status(500).json({ error: 'Webhook processing failed' })
  }
})

export default router
