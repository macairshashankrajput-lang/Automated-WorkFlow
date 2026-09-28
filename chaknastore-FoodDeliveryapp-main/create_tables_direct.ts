import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  try {
    console.log('Creating tables...');
    await sql`
      CREATE TABLE IF NOT EXISTS chats (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id TEXT NOT NULL REFERENCES users(id),
        vendor_id TEXT NOT NULL REFERENCES users(id),
        last_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log('Created chats table');

    await sql`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        chat_id UUID NOT NULL REFERENCES chats(id),
        sender_id TEXT NOT NULL REFERENCES users(id),
        content TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log('Created chat_messages table');

    await sql`
      CREATE TABLE IF NOT EXISTS notifications (
        id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
        user_id TEXT NOT NULL REFERENCES users(id),
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT DEFAULT 'info',
        is_read BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    console.log('Created notifications table');

    // Also check if users table has delivery_location as jsonb
    // And if points_balance exists
    
    console.log('All tables verified/created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    await sql.end();
  }
}

run();
