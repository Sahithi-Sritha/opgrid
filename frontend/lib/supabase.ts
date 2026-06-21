// Supabase client for frontend
// Uses @supabase/supabase-js for direct database access (from, rpc, channel, etc.)
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Re-export types from api-client for backward compatibility
export type { Opportunity, Application, Notification } from './api-client'

// Additional types
export type ResumeAnalysis = {
  id: string
  jd_text: string
  resume_text: string
  missing_keywords: string[]
  present_keywords: string[]
  match_score: number
  suggestions: string | null
  created_at: string
}

export type NotifLog = {
  id: string
  type: 'email' | 'telegram' | 'push'
  payload: Record<string, any>
  sent_at: string
}
