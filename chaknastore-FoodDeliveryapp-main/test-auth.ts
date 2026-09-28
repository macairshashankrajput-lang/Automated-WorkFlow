import { supabase } from './lib/supabase-service';

async function test() {
  const email = process.env.TEST_ADMIN_EMAIL;
  const password = process.env.TEST_ADMIN_PASSWORD;
  if (!email || !password) throw new Error('Set TEST_ADMIN_EMAIL and TEST_ADMIN_PASSWORD in your local environment.');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  console.log('SignIn:', { data, error });
}
test();
