
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://narzeblpnlmnvpbfoufv.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5hcnplYmxwbmxtbnZwYmZvdWZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTgxMTU5OSwiZXhwIjoyMDkxMzg3NTk5fQ.w-WGG4EJhGKLwyMwBajYLmzNZFyVEcAfuJjdrUWUicE';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function clearCustomers() {
    console.log('Fetching customers...');
    const { data: customers, error: fetchError } = await supabase
        .from('users')
        .select('id, username')
        .eq('role', 'customer');

    if (fetchError) {
        console.error('Error fetching customers:', fetchError);
        return;
    }

    console.log(`Found ${customers.length} customers.`);

    for (const customer of customers) {
        console.log(`Deleting customer: ${customer.username} (${customer.id})`);
        
        // Delete from public.users
        const { error: profileError } = await supabase
            .from('users')
            .delete()
            .eq('id', customer.id);
        
        if (profileError) {
            console.error(`Error deleting profile for ${customer.id}:`, profileError);
        }

        // Delete from auth.users
        const { error: authError } = await supabase.auth.admin.deleteUser(customer.id);
        if (authError) {
            console.error(`Error deleting auth user for ${customer.id}:`, authError);
        }
    }

    console.log('Finished clearing customers.');
}

clearCustomers();
