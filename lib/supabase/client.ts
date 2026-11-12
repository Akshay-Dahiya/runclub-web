import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseConfig } from './config'

let browserClient: ReturnType<typeof createBrowserClient> | undefined

export function createClient() {
  if (browserClient) return browserClient

  const config = getSupabaseConfig()
  if (!config) {
    throw new Error('Runner sign-in is not configured in this environment.')
  }

  browserClient = createBrowserClient(config.url, config.key, {
    cookieOptions: { secure: process.env.NODE_ENV === 'production' },
  })
  return browserClient
}
