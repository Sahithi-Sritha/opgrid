import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase credentials in .env')
}

export const supabase = createClient(supabaseUrl, supabaseKey)

// Export type placeholder for backward compatibility
export type Opportunity = any

export default supabase
