import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!);

async function check() {
  const { data: orders, error: ordersError } = await supabase.from('orders').select('*').limit(1);
  console.log('Orders sample:', orders, ordersError);
}

check();
