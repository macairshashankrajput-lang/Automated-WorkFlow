import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function run() {
  try {
    console.log('Adding vendor_id to menu table...');
    await sql`
      ALTER TABLE menu ADD COLUMN IF NOT EXISTS vendor_id TEXT REFERENCES users(id);
    `;
    console.log('Added vendor_id to menu table');
  } catch (err) {
    console.error('Error updating menu table:', err);
  } finally {
    await sql.end();
  }
}

run();
