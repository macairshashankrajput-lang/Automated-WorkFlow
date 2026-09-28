import { supabase } from './lib/supabase-service';

async function run() {
  const { data, error } = await supabase.from('users').select('*');
  console.log(data, error);
}
run();
