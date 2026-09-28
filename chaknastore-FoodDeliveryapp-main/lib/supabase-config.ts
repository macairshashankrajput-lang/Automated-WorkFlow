/**
 * Supabase Configuration
 * Initializes Supabase with environment variables or fallback values.
 */

export const supabaseConfig = {
  url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? 'https://narzeblpnlmnvpbfoufv.supabase.co',
  anonKey:
    process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcnplYmxwbmxtbnZwYmZvdWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MTE1OTksImV4cCI6MjA5MTM4NzU5OX0.SNfRd7JNnVP_WdwPvJ4y_CNYPO3-8WhrmxukdjMM5H8',
  storageBucket: process.env.EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET ?? 'chakna-storage',
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? '',
};

export function validateSupabaseConfig(): boolean {
  const requiredKeys = ['url', 'anonKey', 'storageBucket'];
  return requiredKeys.every((key) => {
    const value = supabaseConfig[key as keyof typeof supabaseConfig];
    return value && typeof value === 'string' && value.length > 0;
  });
}

export default supabaseConfig;
