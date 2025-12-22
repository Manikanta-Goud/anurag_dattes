// Comprehensive usage check for entire platform
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

async function checkCompleteUsage() {
  console.log('\n');
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     🌐 ANURAG CONNECT - COMPLETE USAGE REPORT          ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('\n');

  try {
    // ========== DATABASE USAGE ==========
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 DATABASE USAGE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Get all table counts
    const tables = ['profiles', 'likes', 'matches', 'messages', 'friend_requests', 'events', 'warnings'];
    const tableCounts = {};
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        tableCounts[table] = count || 0;
      }
    }

    // Get messages with full data to calculate size
    const { data: messages, error: messagesError } = await supabase
      .from('messages')
      .select('*');

    let messagesSize = 0;
    if (messages && messages.length > 0) {
      messages.forEach(msg => {
        const idSize = msg.id ? msg.id.length : 0;
        const matchIdSize = msg.match_id ? msg.match_id.length : 0;
        const senderIdSize = msg.sender_id ? msg.sender_id.length : 0;
        const messageSize = msg.message ? msg.message.length : 0;
        const createdAtSize = 29;
        
        messagesSize += idSize + matchIdSize + senderIdSize + messageSize + createdAtSize;
      });
    }

    console.log('📝 TABLE RECORDS:');
    Object.entries(tableCounts).forEach(([table, count]) => {
      const emoji = table === 'profiles' ? '👤' : 
                    table === 'messages' ? '💬' : 
                    table === 'matches' ? '💕' :
                    table === 'friend_requests' ? '👥' :
                    table === 'events' ? '📅' :
                    table === 'warnings' ? '⚠️' : '📊';
      console.log(`   ${emoji} ${table.padEnd(20)}: ${count.toString().padStart(6)}`);
    });
    
    const totalRecords = Object.values(tableCounts).reduce((a, b) => a + b, 0);
    console.log(`   ${'─'.repeat(30)}`);
    console.log(`   📈 TOTAL RECORDS      : ${totalRecords.toString().padStart(6)}\n`);

    console.log('💾 MESSAGES DATA:');
    console.log(`   • Total Messages: ${tableCounts.messages || 0}`);
    console.log(`   • Storage Used: ${(messagesSize / 1024).toFixed(2)} KB (${(messagesSize / 1024 / 1024).toFixed(4)} MB)`);
    console.log(`   • Average Size: ${tableCounts.messages > 0 ? (messagesSize / tableCounts.messages).toFixed(0) : 0} bytes per message`);
    console.log(`   • Database Usage: ${((messagesSize / 1024 / 1024) / 500 * 100).toFixed(4)}% of 500 MB free tier\n`);

    // ========== STORAGE USAGE ==========
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📸 STORAGE USAGE (Photos & Files)');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    let totalStorageSize = 0;
    let totalFiles = 0;

    if (!bucketError && buckets && buckets.length > 0) {
      for (const bucket of buckets) {
        const { data: files, error: filesError } = await supabase.storage
          .from(bucket.name)
          .list('', { limit: 10000 });

        const fileCount = files ? files.length : 0;
        let bucketSize = 0;

        if (files && files.length > 0) {
          files.forEach(file => {
            if (file.metadata && file.metadata.size) {
              bucketSize += file.metadata.size;
            }
          });
        }

        totalFiles += fileCount;
        totalStorageSize += bucketSize;

        console.log(`📦 ${bucket.name}:`);
        console.log(`   • Files: ${fileCount}`);
        console.log(`   • Size: ${(bucketSize / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   • Public: ${bucket.public ? '✅ Yes' : '❌ No'}\n`);
      }
    } else {
      console.log('ℹ️  No storage buckets found or configured yet.\n');
    }

    // ========== SUMMARY ==========
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 COMPLETE SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const dbSizeMB = messagesSize / 1024 / 1024;
    const storageSizeMB = totalStorageSize / 1024 / 1024;
    const totalSizeMB = dbSizeMB + storageSizeMB;
    
    console.log('💾 DATABASE:');
    console.log(`   • Records: ${totalRecords}`);
    console.log(`   • Size: ${dbSizeMB.toFixed(4)} MB`);
    console.log(`   • Limit: 500 MB (Free Tier)`);
    console.log(`   • Used: ${(dbSizeMB / 500 * 100).toFixed(4)}%\n`);

    console.log('📸 STORAGE:');
    console.log(`   • Files: ${totalFiles}`);
    console.log(`   • Size: ${storageSizeMB.toFixed(2)} MB`);
    console.log(`   • Limit: 1024 MB (Free Tier)`);
    console.log(`   • Used: ${(storageSizeMB / 1024 * 100).toFixed(2)}%\n`);

    console.log('🎯 TOTAL PLATFORM USAGE:');
    console.log(`   • Combined Size: ${totalSizeMB.toFixed(2)} MB`);
    console.log(`   • Database Remaining: ${(500 - dbSizeMB).toFixed(2)} MB`);
    console.log(`   • Storage Remaining: ${(1024 - storageSizeMB).toFixed(2)} MB\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Complete usage check finished!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkCompleteUsage();
