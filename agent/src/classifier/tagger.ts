import { GoogleGenerativeAI } from '@google/generative-ai'
import { Opportunity } from '../config/supabase'
import { getGeminiKey } from '../utils/gemini-keys'

export async function classifyOpportunity(opp: Opportunity): Promise<Opportunity | null> {
  try {
    const genAI = new GoogleGenerativeAI(getGeminiKey())
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

    const prompt = `Analyze this opportunity and extract structured information.
CRITICAL: Evaluate if this specific opportunity is relevant and eligible for a 3rd-year Computer Science Engineering (CSE) student based in India. 
Reject general career portals, index pages, season schedules (e.g. MLH Seasons), past events, or non-actionable links.
ABSOLUTELY REJECT any opportunity where the application deadline has passed, the event has already concluded, or it is explicitly marked as closed/expired.

Title: ${opp.title}
Company: ${opp.company}
Category: ${opp.category || 'internship'}
Description: ${opp.description || 'N/A'}
Location: ${opp.location || 'N/A'}

Extract:
1. Is it relevant for a 3rd-year CSE student in India? (true/false)
2. Tags (choose from: internship, remote, stipend, OA, referral, fulltime, ppo_possible, ai_hackathon, fellowship, mlh, gsoc_style, prize_high, team_event, solo_event, beginner_friendly)
3. Is it remote? (true/false)
4. Stipend amount (if mentioned)
5. Application deadline (YYYY-MM-DD or null)
6. PPO/pre-placement possible? (true/false)

Respond ONLY in valid JSON format:
{
  "is_relevant": true/false,
  "tags": ["tag1", "tag2"],
  "is_remote": true/false,
  "stipend": "amount or null",
  "deadline": "YYYY-MM-DD or null",
  "ppo_possible": true/false
}`

    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()
    
    const cleanedText = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()
    const parsed = JSON.parse(cleanedText)
    
    if (parsed.is_relevant === false) {
      console.log(`    ⚠️ Rejected irrelevant opportunity: ${opp.title}`)
      return null;
    }

    return {
      ...opp,
      tags: parsed.tags || [],
      is_remote: parsed.is_remote || false,
      stipend: parsed.stipend || opp.stipend,
      deadline: parsed.deadline || opp.deadline,
      ppo_possible: parsed.ppo_possible || opp.ppo_possible || false,
    }
    
  } catch (error) {
    console.error('Classification error:', error)
  }
  
  // Fallback: basic keyword matching
  const text = `${opp.title} ${opp.description} ${opp.prize_pool || ''}`.toLowerCase()
  const tags: string[] = []
  
  // Internship tags
  if (text.includes('intern')) tags.push('internship')
  if (text.includes('remote')) tags.push('remote')
  if (text.includes('stipend') || text.includes('$') || text.includes('paid')) tags.push('stipend')
  if (text.includes('oa') || text.includes('assessment') || text.includes('coding challenge')) tags.push('OA')
  if (text.includes('referral') || text.includes('employee referral')) tags.push('referral')
  
  // Hackathon/fellowship tags
  if (text.includes('ppo') || text.includes('pre-placement') || text.includes('return offer')) {
    tags.push('ppo_possible')
  }
  if (text.includes('ai') || text.includes('ml') || text.includes('machine learning')) {
    tags.push('ai_hackathon')
  }
  if (text.includes('fellowship')) tags.push('fellowship')
  if (text.includes('mlh') || text.includes('major league')) tags.push('mlh')
  if (text.includes('gsoc') || text.includes('google summer')) tags.push('gsoc_style')
  if (text.includes('beginner') || text.includes('all levels') || text.includes('open to all')) {
    tags.push('beginner_friendly')
  }
  
  // Prize detection
  const prizeAmount = opp.prize_pool || ''
  const hasHighPrize = /₹\s*[1-9]\d{5,}|₹\s*\d+,\d{2},\d{3}|\$\s*[1-9]\d{3,}/.test(prizeAmount)
  if (hasHighPrize) tags.push('prize_high')
  
  // Team size detection
  if (opp.team_size) {
    const teamSize = opp.team_size.toLowerCase()
    if (teamSize.includes('1-') || teamSize.includes('team')) {
      tags.push('team_event')
    } else if (teamSize === '1' || teamSize.includes('solo') || teamSize.includes('individual')) {
      tags.push('solo_event')
    }
  }
  
  return {
    ...opp,
    tags,
    is_remote: text.includes('remote') || opp.is_remote,
    ppo_possible: tags.includes('ppo_possible') || opp.ppo_possible || false,
  }
}
