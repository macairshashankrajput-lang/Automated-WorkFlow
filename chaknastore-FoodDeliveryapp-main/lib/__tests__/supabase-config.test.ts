import { describe, it, expect } from 'vitest';
import { supabaseConfig, validateSupabaseConfig } from '../supabase-config';

describe('Supabase Configuration', () => {
  it('should have all required Supabase config values', () => {
    expect(supabaseConfig.url).toBe('https://narzeblpnlmnvpbfoufv.supabase.co');
    expect(supabaseConfig.anonKey).toBe(
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcnplYmxwbmxtbnZwYmZvdWZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4MTE1OTksImV4cCI6MjA5MTM4NzU5OX0.SNfRd7JNnVP_WdwPvJ4y_CNYPO3-8WhrmxukdjMM5H8'
    );
    expect(supabaseConfig.storageBucket).toBe('chakna-storage');
  });

  it('should validate Supabase configuration successfully', () => {
    const isValid = validateSupabaseConfig();
    expect(isValid).toBe(true);
  });

  it('should have valid Supabase URL format', () => {
    expect(supabaseConfig.url).toMatch(/^https:\/\/[a-z0-9-]+\.supabase\.co$/);
  });

  it('should have a non-empty anon key', () => {
    expect(supabaseConfig.anonKey.length).toBeGreaterThan(0);
  });
});
