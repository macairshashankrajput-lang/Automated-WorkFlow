-- Create or extend the public users profile table for Supabase auth-backed customer/admin accounts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'users'
  ) THEN
    CREATE TABLE public.users (
      id TEXT PRIMARY KEY,
      openId TEXT UNIQUE NOT NULL,
      username TEXT UNIQUE NOT NULL,
      name TEXT,
      email TEXT,
      phone TEXT,
      role TEXT NOT NULL DEFAULT 'customer',
      loginMethod TEXT,
      referral_code TEXT,
      points_balance INT DEFAULT 0,
      createdAt TIMESTAMPTZ DEFAULT NOW(),
      updatedAt TIMESTAMPTZ DEFAULT NOW(),
      lastSignedIn TIMESTAMPTZ DEFAULT NOW()
    );
  END IF;

  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS openId TEXT UNIQUE;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS name TEXT;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone TEXT;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'customer';
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS loginMethod TEXT;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS referral_code TEXT;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS points_balance INT DEFAULT 0;
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS createdAt TIMESTAMPTZ DEFAULT NOW();
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMPTZ DEFAULT NOW();
  ALTER TABLE public.users ADD COLUMN IF NOT EXISTS lastSignedIn TIMESTAMPTZ DEFAULT NOW();
END$$;
