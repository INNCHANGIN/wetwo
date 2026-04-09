import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || url === 'https://placeholder-url.supabase.co') {
    console.warn("⚠️ [Supabase] NEXT_PUBLIC_SUPABASE_URL is missing or placeholder. APK build might fail at login.");
  }

  return createBrowserClient(
    url || 'https://placeholder-url.supabase.co',
    anonKey || 'placeholder-anon-key'
  )
}
