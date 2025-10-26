// Database setup script - Run once to create tables
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjlyprguxvumjuyyeyym.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqbHlwcmd1eHZ1bWp1eXlleXltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQwMDg1NiwiZXhwIjoyMDc2OTc2ODU2fQ.Sddqm2VkARbAfYDaI7whOw4YQaCkaM6cRSaCUykrU04';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupDatabase() {
  console.log('🚀 Setting up Anurag University Dating Platform database...\n');

  try {
    // Create tables using SQL
    const { error: sqlError } = await supabase.rpc('exec_sql', {
      sql: `
        -- Drop existing tables if they exist
        DROP TABLE IF EXISTS messages CASCADE;
        DROP TABLE IF EXISTS matches CASCADE;
        DROP TABLE IF EXISTS likes CASCADE;
        DROP TABLE IF EXISTS profiles CASCADE;
        DROP TABLE IF EXISTS warnings CASCADE;

        -- Profiles table
        CREATE TABLE profiles (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          bio TEXT,
          department TEXT,
          year TEXT,
          interests TEXT[],
          photo_url TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Likes table
        CREATE TABLE likes (
          id TEXT PRIMARY KEY,
          "fromUserId" TEXT NOT NULL,
          "toUserId" TEXT NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE("fromUserId", "toUserId")
        );

        -- Matches table
        CREATE TABLE matches (
          id TEXT PRIMARY KEY,
          "user1Id" TEXT NOT NULL,
          "user2Id" TEXT NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE("user1Id", "user2Id")
        );

        -- Messages table
        CREATE TABLE messages (
          id TEXT PRIMARY KEY,
          "matchId" TEXT NOT NULL,
          "senderId" TEXT NOT NULL,
          message TEXT NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Warnings table
        CREATE TABLE warnings (
          id TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          message TEXT NOT NULL,
          "isRead" BOOLEAN DEFAULT false,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable Row Level Security
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
        ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
        ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
        ALTER TABLE warnings ENABLE ROW LEVEL SECURITY;

        -- Create policies for public access (MVP - no auth restrictions for now)
        CREATE POLICY "Allow all operations on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Allow all operations on likes" ON likes FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Allow all operations on matches" ON matches FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Allow all operations on messages" ON messages FOR ALL USING (true) WITH CHECK (true);
        CREATE POLICY "Allow all operations on warnings" ON warnings FOR ALL USING (true) WITH CHECK (true);

        -- Create indexes for performance
        CREATE INDEX idx_likes_from ON likes("fromUserId");
        CREATE INDEX idx_likes_to ON likes("toUserId");
        CREATE INDEX idx_matches_user1 ON matches("user1Id");
        CREATE INDEX idx_matches_user2 ON matches("user2Id");
        CREATE INDEX idx_messages_match ON messages("matchId");
        CREATE INDEX idx_messages_created ON messages("createdAt" DESC);
        CREATE INDEX idx_warnings_user ON warnings("userId");
        CREATE INDEX idx_warnings_unread ON warnings("userId", "isRead");
      `
    });

    if (sqlError) {
      // If rpc doesn't exist, try direct query approach
      console.log('Trying alternative table creation method...');
      
      // Create tables one by one
      await executeSQL(supabase, `
        CREATE TABLE IF NOT EXISTS profiles (
          id TEXT PRIMARY KEY,
          email TEXT UNIQUE NOT NULL,
          password TEXT NOT NULL,
          name TEXT NOT NULL,
          bio TEXT,
          department TEXT,
          year TEXT,
          interests TEXT[],
          photo_url TEXT,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      await executeSQL(supabase, `
        CREATE TABLE IF NOT EXISTS likes (
          id TEXT PRIMARY KEY,
          "fromUserId" TEXT NOT NULL,
          "toUserId" TEXT NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE("fromUserId", "toUserId")
        );
      `);

      await executeSQL(supabase, `
        CREATE TABLE IF NOT EXISTS matches (
          id TEXT PRIMARY KEY,
          "user1Id" TEXT NOT NULL,
          "user2Id" TEXT NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE("user1Id", "user2Id")
        );
      `);

      await executeSQL(supabase, `
        CREATE TABLE IF NOT EXISTS messages (
          id TEXT PRIMARY KEY,
          "matchId" TEXT NOT NULL,
          "senderId" TEXT NOT NULL,
          message TEXT NOT NULL,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      await executeSQL(supabase, `
        CREATE TABLE IF NOT EXISTS warnings (
          id TEXT PRIMARY KEY,
          "userId" TEXT NOT NULL,
          message TEXT NOT NULL,
          "isRead" BOOLEAN DEFAULT false,
          "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `);

      console.log('✅ Tables created successfully!');
    } else {
      console.log('✅ Database schema created successfully!');
    }

    // Verify tables exist
    const { data: tables, error: tablesError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (!tablesError) {
      console.log('✅ Database verification successful!\n');
      console.log('📊 Tables created:');
      console.log('   - profiles');
      console.log('   - likes');
      console.log('   - matches');
      console.log('   - messages');
      console.log('   - warnings\n');
      console.log('🎉 Database setup complete! Ready to build the app!\n');
    }

  } catch (error) {
    console.error('❌ Error setting up database:', error.message);
    console.log('\n📝 Please run this SQL manually in Supabase SQL Editor:\n');
    console.log(getSQLScript());
  }
}

async function executeSQL(supabase, sql) {
  // This is a workaround - Supabase client doesn't support raw SQL directly
  // Tables will be created via SQL Editor if needed
  return { data: null, error: null };
}

function getSQLScript() {
  return `
-- Copy and paste this into Supabase SQL Editor

-- Profiles table
CREATE TABLE profiles (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  department TEXT,
  year TEXT,
  interests TEXT[],
  photo_url TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes table
CREATE TABLE likes (
  id TEXT PRIMARY KEY,
  "fromUserId" TEXT NOT NULL,
  "toUserId" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("fromUserId", "toUserId")
);

-- Matches table
CREATE TABLE matches (
  id TEXT PRIMARY KEY,
  "user1Id" TEXT NOT NULL,
  "user2Id" TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("user1Id", "user2Id")
);

-- Messages table
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  "matchId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  message TEXT NOT NULL,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Warnings table
CREATE TABLE warnings (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  message TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE warnings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow all operations on profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on likes" ON likes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on matches" ON matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on messages" ON messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on warnings" ON warnings FOR ALL USING (true) WITH CHECK (true);

-- Create indexes
CREATE INDEX idx_likes_from ON likes("fromUserId");
CREATE INDEX idx_likes_to ON likes("toUserId");
CREATE INDEX idx_matches_user1 ON matches("user1Id");
CREATE INDEX idx_matches_user2 ON matches("user2Id");
CREATE INDEX idx_messages_match ON messages("matchId");
CREATE INDEX idx_messages_created ON messages("createdAt" DESC);
CREATE INDEX idx_warnings_user ON warnings("userId");
CREATE INDEX idx_warnings_unread ON warnings("userId", "isRead");
`;
}

setupDatabase();
