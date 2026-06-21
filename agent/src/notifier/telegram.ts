import { Telegraf } from 'telegraf'

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN!)
const chatId = process.env.TELEGRAM_CHAT_ID!

export async function notifyNewOpportunities(count: number) {
  try {
    await bot.telegram.sendMessage(
      chatId,
      `🔔 Found ${count} new opportunities!\n\nCheck OpGrid to view them.`
    )
    
    console.log('✓ Telegram notification sent')
    
  } catch (error) {
    console.error('Telegram notification error:', error)
  }
}

export async function notifyDeadline(opportunity: any) {
  try {
    await bot.telegram.sendMessage(
      chatId,
      `⚠️ *Deadline Alert*\n\n` +
      `${opportunity.title} at ${opportunity.company}\n` +
      `Deadline: ${new Date(opportunity.deadline).toLocaleDateString()}\n` +
      `(${opportunity.days_remaining} days remaining)\n\n` +
      `Apply now: ${opportunity.url}`,
      { parse_mode: 'Markdown' }
    )
    
  } catch (error) {
    console.error('Telegram deadline notification error:', error)
  }
}
