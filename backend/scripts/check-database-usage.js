// Check database usage - messages table
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env file manually
const envPath = path.join(__dirname, '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envLines = envContent.split('\n');

let supabaseUrl = '';
let supabaseKey = '';

envLines.forEach(line => {
  const [key, ...valueParts] = line.split('=');
  const value = valueParts.join('=').trim();
  if (key.trim() === 'NEXT_PUBLIC_SUPABASE_URL') {
    supabaseUrl = value;
  } else if (key.trim() === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
    supabaseKey = value;
  }
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabaseUsage() {
  console.log('📊 Checking Database Usage for Messages...\n');

  try {
    // Get total number of messages
    const { data: messages, error: messagesError, count } = await supabase
      .from('messages')
      .select('*', { count: 'exact' });

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return;
    }

    const totalMessages = count || messages?.length || 0;
    
    // Calculate approximate storage size
    let totalSize = 0;
    if (messages && messages.length > 0) {
      messages.forEach(msg => {
        // Estimate size of each field
        const idSize = msg.id ? msg.id.length : 0;
        const matchIdSize = msg.matchId ? msg.matchId.length : 0;
        const senderIdSize = msg.senderId ? msg.senderId.length : 0;
        const messageSize = msg.message ? msg.message.length : 0;
        const createdAtSize = 29; // Timestamp size in bytes
        
        totalSize += idSize + matchIdSize + senderIdSize + messageSize + createdAtSize;
      });
    }

    // Get all tables count
    const { count: profilesCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: likesCount } = await supabase
      .from('likes')
      .select('*', { count: 'exact', head: true });

    const { count: matchesCount } = await supabase
      .from('matches')
      .select('*', { count: 'exact', head: true });

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📈 DATABASE STATISTICS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log('📝 RECORDS COUNT:');
    console.log(`   • Profiles:  ${profilesCount || 0}`);
    console.log(`   • Likes:     ${likesCount || 0}`);
    console.log(`   • Matches:   ${matchesCount || 0}`);
    console.log(`   • Messages:  ${totalMessages}`);
    console.log(`   ────────────────────────`);
    console.log(`   • TOTAL:     ${(profilesCount || 0) + (likesCount || 0) + (matchesCount || 0) + totalMessages}\n`);

    console.log('💾 MESSAGES STORAGE:');
    console.log(`   • Total Messages: ${totalMessages}`);
    console.log(`   • Estimated Size: ${(totalSize / 1024).toFixed(2)} KB`);
    console.log(`   • Estimated Size: ${(totalSize / 1024 / 1024).toFixed(4)} MB\n`);

    console.log('📊 STORAGE BREAKDOWN:');
    console.log(`   • Average message size: ${totalMessages > 0 ? (totalSize / totalMessages).toFixed(0) : 0} bytes`);
    console.log(`   • Storage used: ${((totalSize / 1024 / 1024) / 500 * 100).toFixed(2)}% of 500 MB free tier\n`);

    console.log('🎯 CAPACITY:');
    const remainingMB = 500 - (totalSize / 1024 / 1024);
    const avgMessageSize = totalMessages > 0 ? totalSize / totalMessages : 200;
    const estimatedCapacity = Math.floor((remainingMB * 1024 * 1024) / avgMessageSize);
    console.log(`   • Remaining: ${remainingMB.toFixed(2)} MB`);
    console.log(`   • Estimated messages capacity: ${estimatedCapacity.toLocaleString()} more messages\n`);

    // Show recent messages
    if (messages && messages.length > 0) {
      console.log('📬 RECENT MESSAGES (Last 5):');
      const recentMessages = messages
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);
      
      recentMessages.forEach((msg, index) => {
        const msgPreview = msg.message.length > 50 
          ? msg.message.substring(0, 50) + '...' 
          : msg.message;
        const date = new Date(msg.createdAt).toLocaleString();
        console.log(`   ${index + 1}. [${date}] ${msgPreview} (${msg.message.length} chars)`);
      });
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Database check complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error checking database:', error.message);
  }
}

checkDatabaseUsage();
