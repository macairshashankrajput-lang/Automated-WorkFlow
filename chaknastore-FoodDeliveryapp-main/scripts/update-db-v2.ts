import postgres from 'postgres';
import * as dotenv from 'dotenv';
dotenv.config();

const sql = postgres(process.env.DATABASE_URL!);

async function migrate() {
    console.log('🚀 Starting database update...');

    try {
        await sql.begin(async (sql) => {
            // 1. Drop dependent tables/constraints
            console.log('Dropping dependent tables and constraints...');
            await sql`DROP TABLE IF EXISTS reviews CASCADE;`;
            await sql`DROP TABLE IF EXISTS order_items CASCADE;`;
            await sql`DROP TABLE IF EXISTS payments CASCADE;`;
            await sql`DROP TABLE IF EXISTS bills CASCADE;`;
            await sql`DROP TABLE IF EXISTS orders CASCADE;`;

            // 2. Recreate orders with varchar ID
            console.log('Creating orders table...');
            await sql`
                CREATE TABLE orders (
                    id VARCHAR(255) PRIMARY KEY,
                    user_id VARCHAR(255) NOT NULL REFERENCES users(id),
                    vendor_id VARCHAR(255) REFERENCES users(id),
                    type order_type NOT NULL,
                    subtotal INTEGER NOT NULL DEFAULT 0,
                    tax INTEGER NOT NULL DEFAULT 0,
                    delivery_fee INTEGER NOT NULL DEFAULT 0,
                    total_price INTEGER NOT NULL,
                    status order_status NOT NULL DEFAULT 'pending',
                    payment_status VARCHAR(50) DEFAULT 'pending',
                    payment_method VARCHAR(50),
                    receipt_image TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
                );
            `;

            // 3. Recreate order_items
            console.log('Creating order_items table...');
            await sql`
                CREATE TABLE order_items (
                    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
                    order_id VARCHAR(255) NOT NULL REFERENCES orders(id),
                    menu_id INTEGER REFERENCES menu(id),
                    quantity INTEGER NOT NULL,
                    price INTEGER NOT NULL,
                    notes TEXT
                );
            `;

            // 4. Create payments table
            console.log('Creating payments table...');
            await sql`
                CREATE TABLE payments (
                    id VARCHAR(255) PRIMARY KEY,
                    order_id VARCHAR(255) NOT NULL REFERENCES orders(id),
                    user_id VARCHAR(255) NOT NULL REFERENCES users(id),
                    amount INTEGER NOT NULL,
                    method VARCHAR(50) NOT NULL,
                    status VARCHAR(50) NOT NULL DEFAULT 'pending',
                    transaction_id VARCHAR(255),
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
                );
            `;

            // 5. Create bills table
            console.log('Creating bills table...');
            await sql`
                CREATE TABLE bills (
                    id VARCHAR(255) PRIMARY KEY,
                    order_id VARCHAR(255) NOT NULL REFERENCES orders(id),
                    bill_number VARCHAR(100) UNIQUE NOT NULL,
                    details JSONB,
                    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
                );
            `;

            // 6. Recreate reviews
            console.log('Creating reviews table...');
            await sql`
                CREATE TABLE reviews (
                    id INTEGER PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
                    user_id VARCHAR(255) NOT NULL REFERENCES users(id),
                    order_id VARCHAR(255) REFERENCES orders(id),
                    rating INTEGER NOT NULL,
                    comment TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
                );
            `;
        });

        console.log('✅ Database update completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error);
    } finally {
        await sql.end();
    }
}

migrate();
