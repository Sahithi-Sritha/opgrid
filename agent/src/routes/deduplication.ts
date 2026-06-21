import { Router } from 'express'
import { supabase } from '../config/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'

const router = Router()
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')

// POST /api/opportunities/deduplicate
// Find and merge semantic duplicates
router.post('/deduplicate', async (req, res) => {
  try {
    console.log('→ Starting deduplication...')

    // Get all opportunities grouped by company
    const { data: opportunities } = await supabase
      .from('opportunities')
      .select('*')
      .order('company')

    if (!opportunities || opportunities.length === 0) {
      return res.json({ duplicates_found: 0, merged: 0 })
    }

    // Group by company
    const byCompany = opportunities.reduce((acc, opp) => {
      if (!acc[opp.company]) acc[opp.company] = []
      acc[opp.company].push(opp)
      return acc
    }, {} as Record<string, any[]>)

    let duplicatesFound = 0
    let merged = 0

    // Check each company's opportunities
    for (const [company, opps] of Object.entries(byCompany) as [string, any[]][]) {
      if (opps.length < 2) continue

      // Check pairs
      for (let i = 0; i < opps.length; i++) {
        for (let j = i + 1; j < opps.length; j++) {
          const opp1 = opps[i]
          const opp2 = opps[j]

          // Skip if already merged
          if (!opp1 || !opp2) continue

          // Ask Claude if they're duplicates
          const isDuplicate = await checkIfDuplicate(opp1, opp2)

          if (isDuplicate) {
            duplicatesFound++
            
            // Merge: keep the one with more data
            const primary = opp1.description ? opp1 : opp2
            const secondary = primary === opp1 ? opp2 : opp1

            console.log(`  → Merging: ${primary.title} (keeping) and ${secondary.title}`)

            // Update applications to point to primary
            await supabase
              .from('applications')
              .update({ opportunity_id: primary.id })
              .eq('opportunity_id', secondary.id)

            // Delete secondary
            await supabase
              .from('opportunities')
              .delete()
              .eq('id', secondary.id)

            merged++
          }
        }
      }
    }

    // Mark stale opportunities
    const twoDaysAgo = new Date()
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2)

    const { data: staleOpps } = await supabase
      .from('opportunities')
      .select('id')
      .not('deadline', 'is', null)
      .lt('deadline', new Date().toISOString().split('T')[0])
      .lt('created_at', twoDaysAgo.toISOString())

    if (staleOpps && staleOpps.length > 0) {
      // Archive or mark as stale
      await supabase
        .from('opportunities')
        .update({ registration_open: false })
        .in('id', staleOpps.map(o => o.id))

      console.log(`  → Marked ${staleOpps.length} opportunities as stale`)
    }

    res.json({
      duplicates_found: duplicatesFound,
      merged,
      stale_marked: staleOpps?.length || 0,
      message: `Deduplication complete: ${merged} merged, ${staleOpps?.length || 0} marked stale`
    })

  } catch (error) {
    console.error('Deduplication error:', error)
    res.status(500).json({ error: 'Deduplication failed' })
  }
})

async function checkIfDuplicate(opp1: any, opp2: any): Promise<boolean> {
  // Quick checks first
  if (opp1.url === opp2.url) return true
  
  // If titles are very similar and same company, likely duplicate
  const titleSimilarity = calculateSimilarity(opp1.title, opp2.title)
  if (titleSimilarity > 0.8 && opp1.company === opp2.company) {
    return true
  }

  // Use Gemini for semantic check
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const prompt = `Are these two job opportunities the same posting?

Opportunity 1:
Title: ${opp1.title}
Company: ${opp1.company}
Source: ${opp1.source}
Description: ${(opp1.description || '').slice(0, 200)}

Opportunity 2:
Title: ${opp2.title}
Company: ${opp2.company}
Source: ${opp2.source}
Description: ${(opp2.description || '').slice(0, 200)}

Answer with ONLY "yes" or "no".`

    const result = await model.generateContent(prompt)
    const answer = result.response.text()
    return answer.toLowerCase().includes('yes')
  } catch (error) {
    console.error('Gemini dedup check error:', error)
  }

  return false
}

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2
  const shorter = str1.length > str2.length ? str2 : str1
  
  if (longer.length === 0) return 1.0
  
  return (longer.length - editDistance(longer, shorter)) / longer.length
}

function editDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => 
    Array(str1.length + 1).fill(0)
  )

  for (let i = 0; i <= str1.length; i++) matrix[0][i] = i
  for (let j = 0; j <= str2.length; j++) matrix[j][0] = j

  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1,
        matrix[j - 1][i] + 1,
        matrix[j - 1][i - 1] + cost
      )
    }
  }

  return matrix[str2.length][str1.length]
}

export default router
