// Create warnings table in Supabase
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://hjlyprguxvumjuyyeyym.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhqbHlwcmd1eHZ1bWp1eXlleXltIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTQwMDg1NiwiZXhwIjoyMDc2OTc2ODU2fQ.Sddqm2VkARbAfYDaI7whOw4YQaCkaM6cRSaCUykrU04';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createWarningsTable() {
  console.log('🚀 Creating warnings table...\n');

  try {
    // Test if table already exists
    const { data: existingData, error: testError } = await supabase
      .from('warnings')
      .select('id')
      .limit(1);

    if (!testError) {
      console.log('✅ Warnings table already exists!');
      console.log('📊 Table is ready to use.\n');
      return;
    }

    console.log('📝 Table does not exist. Please create it manually in Supabase SQL Editor.\n');
    console.log('Copy and paste this SQL:\n');
    console.log(`
-- Create warnings table
CREATE TABLE IF NOT EXISTS warnings (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  message TEXT NOT NULL,
  "isRead" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE warnings ENABLE ROW LEVEL SECURITY;

-- Create policy for warnings
CREATE POLICY "Allow all operations on warnings" ON warnings FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_warnings_user ON warnings("userId");
CREATE INDEX IF NOT EXISTS idx_warnings_unread ON warnings("userId", "isRead");
    `);

    console.log('\n📌 Steps:');
    console.log('1. Go to https://supabase.com/dashboard/project/hjlyprguxvumjuyyeyym/sql/new');
    console.log('2. Paste the SQL above');
    console.log('3. Click "Run" to execute\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

createWarningsTable();
