export const env = {
  appBaseUrl:
    import.meta.env.VITE_APP_BASE_URL || 'https://triviagames.cristache.net',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  posthogHost: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
  posthogKey: import.meta.env.VITE_POSTHOG_KEY || '',
  consentMode: import.meta.env.VITE_CONSENT_MODE || 'manual',
} as const
