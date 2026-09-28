import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!);

async function check() {
  const { data: tables, error } = await supabase.rpc('get_tables'); // This likely won't work unless rpc exists
  console.log('Tables:', tables, error);
  
  // Try to describe a table
  const { data: users, error: usersError } = await supabase.from('users').select('*').limit(1);
  console.log('Users sample:', users, usersError);

  const { data: menu, error: menuError } = await supabase.from('menu').select('*').limit(1);
  console.log('Menu sample:', menu, menuError);
}

check();
