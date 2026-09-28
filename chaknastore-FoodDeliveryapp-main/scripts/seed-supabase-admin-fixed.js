require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing Supabase environment variables. Please set EXPO_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
});

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
const ADMIN_PHONE = process.env.SEED_ADMIN_PHONE;
const ADMIN_NAME = process.env.SEED_ADMIN_NAME;
const ADMIN_USERNAME = process.env.SEED_ADMIN_USERNAME;

if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !ADMIN_PHONE || !ADMIN_NAME || !ADMIN_USERNAME) {
    throw new Error('Set all SEED_ADMIN_* variables in your local .env before seeding.');
}

function formatPhoneForDb(phone) {
    const digits = phone.replace(/\\D/g, '');
    if (!digits) return '';
    if (digits.length === 10) return `+91${digits}`;
    if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
    if (digits.startsWith('91')) return `+${digits}`;
    return digits;
}

async function findAdminUser(email) {
    const { data: listResponse, error } = await supabase.auth.admin.listUsers({ page: 1, perPage: 100 });
    if (error) throw error;
    const users = listResponse?.users ?? [];
    return users.find((user) => user.email === email || user.user_metadata?.email === email);
}

async function main() {
    const dbPhone = formatPhoneForDb(ADMIN_PHONE);
    let adminUser = await findAdminUser(ADMIN_EMAIL);

    if (adminUser) {
        console.log(`Found existing admin auth user: ${adminUser.id}`);
        const { data, error } = await supabase.auth.admin.updateUserById(adminUser.id, {
            password: ADMIN_PASSWORD,
            user_metadata: {
                name: ADMIN_NAME,
                username: ADMIN_USERNAME,
                phone: dbPhone,
                role: 'admin',
                email: ADMIN_EMAIL,
            },
        });
        if (error) throw error;
        adminUser = data?.user ?? adminUser;
        console.log('Updated admin auth credentials.');
    } else {
        const { data, error } = await supabase.auth.admin.createUser({
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD,
            email_confirm: true,
            user_metadata: {
                name: ADMIN_NAME,
                username: ADMIN_USERNAME,
                phone: dbPhone,
                role: 'admin',
            },
        });
        if (error) throw error;
        adminUser = data?.user;
        if (!adminUser) throw new Error('Unable to create admin auth user.');
        console.log(`Created admin auth user: ${adminUser.id}`);
    }

    const profile = {
        id: adminUser.id,
        openId: adminUser.id,
        username: ADMIN_USERNAME,
        email: ADMIN_EMAIL,
        name: ADMIN_NAME,
        phone: dbPhone,
        role: 'admin',
        loginMethod: 'email',
        referral_code: null,
        points_balance: 0,
        createdAt: new Date().toISOString(),
    };

    const { error } = await supabase.from('users').upsert(profile, { onConflict: 'id' });
    if (error) throw error;

    console.log(`Admin profile seeded in "users" table for ${ADMIN_EMAIL}.`);
    console.log('Admin login: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}');
    console.log('Seed complete!');
}

main().catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
});

