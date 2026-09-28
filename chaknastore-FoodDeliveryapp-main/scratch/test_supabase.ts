import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('Testing Supabase Connection...');
console.log('URL:', url);

if (!url || !key) {
  console.error('Missing URL or Key in .env');
  process.exit(1);
}

const supabase = createClient(url, key);

async function test() {
  const { data, error } = await supabase.from('users').select('*').limit(1);
  if (error) {
    console.error('Connection Error:', error.message);
  } else {
    console.log('Connection Success!');
    if (data && data.length > 0) {
      console.log('Columns found:', Object.keys(data[0]));
      console.log('User data:', JSON.stringify(data[0], null, 2));
    } else {
      console.log('No users found to inspect schema.');
    }
  }
}

test();
