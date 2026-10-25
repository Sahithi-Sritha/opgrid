import { AsyncLocalStorage } from 'node:async_hooks'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_KEY
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY

const missingCredentials = [
  !supabaseUrl && 'SUPABASE_URL',
  !supabaseKey && 'SUPABASE_SERVICE_KEY',
  !supabaseAnonKey && 'SUPABASE_ANON_KEY',
].filter(Boolean)

if (missingCredentials.length) {
  throw new Error(`Missing required environment variables: ${missingCredentials.join(', ')}`)
}

export const serviceSupabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false },
})

const requestClients = new AsyncLocalStorage<SupabaseClient>()

export function createUserClient(accessToken: string) {
  if (!supabaseAnonKey) throw new Error('Missing SUPABASE_ANON_KEY in .env')
  return createClient(supabaseUrl!, supabaseAnonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  })
}

export function runWithUserClient<T>(accessToken: string, callback: () => T) {
  return requestClients.run(createUserClient(accessToken), callback)
}

// Route code uses the authenticated request client; scheduled jobs retain service access.
export const supabase = new Proxy(serviceSupabase, {
  get(target, property, receiver) {
    return Reflect.get(requestClients.getStore() || target, property, receiver)
  },
}) as SupabaseClient

// Export type placeholder for backward compatibility
export type Opportunity = any

export default supabase
