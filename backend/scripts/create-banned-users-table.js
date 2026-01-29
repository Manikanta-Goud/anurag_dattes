require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing required environment variables: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY')
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function createBannedUsersTable() {
  try {
    console.log('Creating banned_users table...')
    
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS banned_users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          "userId" UUID NOT NULL,
          reason TEXT NOT NULL,
          "bannedBy" TEXT NOT NULL,
          "bannedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          "isActive" BOOLEAN DEFAULT true,
          UNIQUE("userId")
        );

        CREATE INDEX IF NOT EXISTS idx_banned_users_userId ON banned_users("userId");
        CREATE INDEX IF NOT EXISTS idx_banned_users_isActive ON banned_users("isActive");
      `
    })

    if (error) {
      console.error('Error creating table:', error)
      console.log('\n⚠️  If exec_sql function does not exist, please run this SQL directly in Supabase SQL Editor:')
      console.log(`
CREATE TABLE IF NOT EXISTS banned_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  reason TEXT NOT NULL,
  "bannedBy" TEXT NOT NULL,
  "bannedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "isActive" BOOLEAN DEFAULT true,
  UNIQUE("userId")
);

CREATE INDEX IF NOT EXISTS idx_banned_users_userId ON banned_users("userId");
CREATE INDEX IF NOT EXISTS idx_banned_users_isActive ON banned_users("isActive");
      `)
      return
    }

    console.log('✅ banned_users table created successfully!')
    console.log('✅ Indexes created successfully!')
    
    // Test the table
    const { data: testData, error: testError } = await supabase
      .from('banned_users')
      .select('*')
      .limit(1)
    
    if (testError) {
      console.log('⚠️  Table verification failed:', testError.message)
    } else {
      console.log('✅ Table verified and ready to use!')
    }
    
  } catch (error) {
    console.error('Error:', error)
  }
}

createBannedUsersTable()
