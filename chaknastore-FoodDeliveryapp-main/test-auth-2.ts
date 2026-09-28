import { supabase } from './lib/supabase-service';

async function test() {
  const { data, error } = await supabase.auth.signInWithPassword({ email: 'test@user.com', password: 'password' });
  console.log('SignIn:', { data, error });
}
test();
