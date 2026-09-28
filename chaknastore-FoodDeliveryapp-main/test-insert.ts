import { supabase } from './lib/supabase-service';
import { DEFAULT_ADMIN_CREDENTIALS } from './lib/default-credentials';

async function test() {
  const { username, name, email, phone } = DEFAULT_ADMIN_CREDENTIALS;
  const insertData = {
      id: '88370edc-639f-4139-8674-4b0f83634ec5',
      email: email,
      name: name,
      phone: phone,
      username: username,
      role: 'admin',
  };
  const { error } = await supabase.from('users').insert(insertData);
  console.log('Insert Error:', error);
}
test();
