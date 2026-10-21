import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = Boolean(url && anonKey)

// Only the public anon key belongs in the frontend. Access control is enforced by RLS.
export const supabase = createClient(url ?? 'http://localhost', anonKey ?? 'missing-key', {
  auth: { persistSession: true, autoRefreshToken: true },
})

/** Usernames map to synthetic emails so Supabase Auth can hash the PIN as a password. */
export const AUTH_EMAIL_DOMAIN = 'ielts.local'
export const usernameToEmail = (username: string) => `${username.trim().toLowerCase()}@${AUTH_EMAIL_DOMAIN}`
