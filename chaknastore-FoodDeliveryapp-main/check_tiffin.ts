import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!);

async function check() {
  const { data: subs, error: subsError } = await supabase.from('tiffin_subscriptions').select('*').limit(1);
  console.log('Subscriptions sample:', subs, subsError);

  const { data: sched, error: schedError } = await supabase.from('tiffin_schedule').select('*').limit(1);
  console.log('Schedule sample:', sched, schedError);
}

check();
