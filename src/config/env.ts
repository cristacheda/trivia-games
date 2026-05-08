export const env = {
  appBaseUrl:
    import.meta.env.VITE_APP_BASE_URL || 'https://triviagames.cristache.net',
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || '',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  analyticsMeasurementId: import.meta.env.VITE_ANALYTICS_MEASUREMENT_ID || '',
  consentMode: import.meta.env.VITE_CONSENT_MODE || 'manual',
} as const
