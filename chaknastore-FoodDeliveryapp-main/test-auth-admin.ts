import { supabase } from './lib/supabase-service';
import { DEFAULT_ADMIN_CREDENTIALS } from './lib/default-credentials';

async function test() {
  try {
    const { username, password, name, email, phone } = DEFAULT_ADMIN_CREDENTIALS;
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                name,
                username,
                phone,
                role: 'admin',
                profileEmail: email,
            },
        },
    });
    console.log('Signup Result:', signUpData, signUpError);
    
    // Update role to admin in users table if needed
    const { error } = await supabase.from('users').update({ role: 'admin' }).eq('username', username);
    console.log('Updated role to admin', error);
  } catch (err) {
    console.error('Error:', err);
  }
}
test();
