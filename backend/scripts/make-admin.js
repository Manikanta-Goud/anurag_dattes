const path = require('path');
require(path.resolve(__dirname, '../../frontend/node_modules/dotenv')).config({ path: path.resolve(__dirname, '../../frontend/.env.local') });
const { createClient } = require(path.resolve(__dirname, '../../frontend/node_modules/@supabase/supabase-js'));

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Missing Supabase URL or Service Role Key in .env.local');
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function makeAdmin(email) {
    if (!email) {
        console.error('Usage: node make-admin.js <email>');
        process.exit(1);
    }

    console.log(`🔍 Looking for user with email: ${email}`);

    // 1. Check if user exists in 'profiles' or 'users' table
    // Note: Your schema seems to use 'profiles' for app data and 'users' for some auth data?
    // Based on your middleware, it checks 'users' table for 'is_admin'.

    // First, find the user in the 'users' table (if it exists) or 'profiles'
    // Let's check 'users' first as per middleware
    const { data: user, error: findError } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (findError) {
        console.log(`⚠️ User not found in 'users' table: ${findError.message}`);
        console.log("Checking 'profiles' table to see if we can sync/create...");

        // Fallback: Check profiles
        const { data: profile } = await supabaseAdmin
            .from('profiles')
            .select('*')
            .eq('email', email)
            .single();

        if (profile) {
            console.log(`✅ Found profile for ${email}. Creating/Updating 'users' entry...`);
            // Upsert into users table
            const { error: upsertError } = await supabaseAdmin
                .from('users')
                .upsert({
                    id: profile.id, // Assuming same ID
                    clerk_user_id: profile.clerk_user_id,
                    email: email,
                    is_admin: true,
                    role: 'admin',
                    name: profile.name,
                    created_at: new Date().toISOString()
                });

            if (upsertError) {
                console.error('❌ Failed to promote user:', upsertError);
            } else {
                console.log('🎉 User promoted to ADMIN successfully!');
            }
            return;
        }

        console.error('❌ User not found in database. Please sign up first.');
        return;
    }

    // 2. Update the user
    const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ is_admin: true, role: 'admin' })
        .eq('email', email);

    if (updateError) {
        console.error('❌ Failed to update user:', updateError);
        return;
    }

    console.log('🎉 User promoted to ADMIN successfully!');
}

const email = process.argv[2];
makeAdmin(email);
