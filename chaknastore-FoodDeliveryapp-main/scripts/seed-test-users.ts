import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables. Please set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
});

const TEST_USERS = [
    {
        email: 'customer@test.com',
        password: 'password123',
        username: 'testcustomer',
        name: 'Test Customer',
        role: 'customer',
        phone: '9999999999'
    },
    {
        email: 'vendor@test.com',
        password: 'password123',
        username: 'testvendor',
        name: 'Test Vendor',
        role: 'vendor',
        phone: '8888888888',
        business_name: 'Test Chakna Shop'
    }
];

async function seedTestUsers() {
    console.log('Seeding test users...');

    for (const user of TEST_USERS) {
        // Check if auth user exists
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        if (listError) throw listError;

        let authUser = users.find(u => u.email === user.email);

        if (authUser) {
            console.log(`User ${user.email} already exists in Auth. Updating password...`);
            const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
                password: user.password,
                user_metadata: {
                    role: user.role,
                    name: user.name,
                    username: user.username,
                    businessName: user.business_name
                }
            });
            if (updateError) console.error(`Failed to update ${user.email}:`, updateError.message);
        } else {
            console.log(`Creating user ${user.email}...`);
            const { data: createData, error: createError } = await supabase.auth.admin.createUser({
                email: user.email,
                password: user.password,
                email_confirm: true,
                user_metadata: {
                    role: user.role,
                    name: user.name,
                    username: user.username,
                    businessName: user.business_name
                }
            });
            if (createError) {
                console.error(`Failed to create ${user.email}:`, createError.message);
                continue;
            }
            authUser = createData.user;
        }

        if (authUser) {
            // Seed profile in users table
            const profile = {
                id: authUser.id,
                username: user.username,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: user.role,
                status: 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { error: profileError } = await supabase.from('users').upsert(profile, { onConflict: 'id' });
            if (profileError) {
                console.error(`Failed to seed profile for ${user.email}:`, profileError.message);
            } else {
                console.log(`Successfully seeded profile for ${user.email}`);
            }
        }
    }

    console.log('Test user seeding complete.');
}

seedTestUsers().catch(console.error);
