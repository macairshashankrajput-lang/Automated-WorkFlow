import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.EXPO_PUBLIC_SUPABASE_URL!, process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!);

async function check() {
  const { data: chats, error: chatsError } = await supabase.from('chats').select('*').limit(1);
  console.log('Chats sample:', chats, chatsError);

  const { data: msgs, error: msgsError } = await supabase.from('chat_messages').select('*').limit(1);
  console.log('Messages sample:', msgs, msgsError);
}

check();
