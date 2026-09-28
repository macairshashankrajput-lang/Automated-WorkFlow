import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!);

async function check() {
  const { data: notifications, error } = await supabase.from('notifications').select('*').limit(1);
  console.log('Notifications sample:', notifications, error);
}

check();
