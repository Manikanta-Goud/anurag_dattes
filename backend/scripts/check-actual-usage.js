// Check actual Supabase usage - both storage and database
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

async function checkActualUsage() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║        📊 ACTUAL SUPABASE USAGE REPORT                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    // ========== PROFILES WITH PHOTOS ==========
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, profile_picture');

    const profilesWithPhotos = profiles ? profiles.filter(p => p.profile_picture && p.profile_picture.trim() !== '') : [];
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📸 PHOTOS IN SUPABASE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`Total profiles with photos: ${profilesWithPhotos.length}`);
    console.log(`Storage location: Supabase Storage (profile-photos bucket)\n`);

    // ========== MESSAGES ==========
    const { data: messages, count: messagesCount } = await supabase
      .from('messages')
      .select('*', { count: 'exact' });

    let totalMessagesSize = 0;
    if (messages && messages.length > 0) {
      messages.forEach(msg => {
        totalMessagesSize += JSON.stringify(msg).length;
      });
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💬 CHAT MESSAGES IN SUPABASE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`Total messages: ${messagesCount || 0}`);
    console.log(`Database size: ${(totalMessagesSize / 1024).toFixed(2)} KB (${(totalMessagesSize / 1024 / 1024).toFixed(4)} MB)`);
    
    if (messages && messages.length > 0) {
      console.log(`\nRecent messages (last 5):`);
      messages.slice(-5).forEach((msg, idx) => {
        const preview = msg.message.substring(0, 50);
        console.log(`  ${idx + 1}. "${preview}${msg.message.length > 50 ? '...' : ''}"`);
      });
    }

    // ========== OTHER TABLES ==========
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 ALL DATABASE TABLES');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const tables = ['profiles', 'messages', 'matches', 'likes', 'friend_requests', 'events', 'warnings'];
    let totalRecords = 0;
    
    for (const table of tables) {
      const { count } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      const emoji = {
        'profiles': '👤',
        'messages': '💬',
        'matches': '💕',
        'likes': '❤️',
        'friend_requests': '👥',
        'events': '📅',
        'warnings': '⚠️'
      }[table] || '📊';
      
      console.log(`${emoji} ${table.padEnd(20)}: ${(count || 0).toString().padStart(5)} records`);
      totalRecords += (count || 0);
    }

    console.log(`${'─'.repeat(35)}`);
    console.log(`📈 TOTAL                : ${totalRecords.toString().padStart(5)} records\n`);

    // ========== STORAGE ESTIMATION ==========
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💾 STORAGE USAGE ESTIMATE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Estimate photo storage (typical compressed profile photo: 200-400 KB)
    const avgPhotoSizeKB = 300;
    const estimatedPhotoStorageMB = (profilesWithPhotos.length * avgPhotoSizeKB) / 1024;
    
    console.log('📸 Profile Photos:');
    console.log(`   • Count: ${profilesWithPhotos.length} photos`);
    console.log(`   • Estimated size: ~${avgPhotoSizeKB} KB per photo`);
    console.log(`   • Total: ~${estimatedPhotoStorageMB.toFixed(2)} MB`);
    console.log(`   • Storage used: ~${(estimatedPhotoStorageMB / 1024 * 100).toFixed(2)}% of 1 GB\n`);

    console.log('💬 Messages Database:');
    console.log(`   • Count: ${messagesCount || 0} messages`);
    console.log(`   • Size: ${(totalMessagesSize / 1024).toFixed(2)} KB (${(totalMessagesSize / 1024 / 1024).toFixed(4)} MB)`);
    console.log(`   • Database used: ${((totalMessagesSize / 1024 / 1024) / 500 * 100).toFixed(4)}% of 500 MB\n`);

    const totalStorageMB = estimatedPhotoStorageMB + (totalMessagesSize / 1024 / 1024);
    
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('🎯 TOTAL SUPABASE USAGE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log(`📦 Total Data: ~${totalStorageMB.toFixed(2)} MB`);
    console.log(`   • Photos: ~${estimatedPhotoStorageMB.toFixed(2)} MB (in storage)`);
    console.log(`   • Messages: ${(totalMessagesSize / 1024 / 1024).toFixed(4)} MB (in database)`);
    console.log(`   • Other tables: < 0.01 MB (in database)\n`);
    
    console.log(`📊 Free Tier Limits:`);
    console.log(`   • Storage: 1 GB (1024 MB) - Using ~${(estimatedPhotoStorageMB / 1024 * 100).toFixed(2)}%`);
    console.log(`   • Database: 500 MB - Using ~${((totalMessagesSize / 1024 / 1024) / 500 * 100).toFixed(4)}%\n`);
    
    console.log(`✅ Remaining:`);
    console.log(`   • Storage: ~${(1024 - estimatedPhotoStorageMB).toFixed(2)} MB`);
    console.log(`   • Database: ~${(500 - (totalMessagesSize / 1024 / 1024)).toFixed(2)} MB\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    console.log('Note: Photo storage is estimated based on typical sizes.');
    console.log('For exact storage usage, check your Supabase Dashboard → Storage\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkActualUsage();
