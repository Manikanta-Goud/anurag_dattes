// Check storage bucket usage for photos
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

async function checkStorageUsage() {
  console.log('📸 Checking Storage Usage for Photos...\n');

  try {
    // Get all buckets
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    if (bucketError) {
      console.error('Error listing buckets:', bucketError);
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📦 STORAGE BUCKETS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    let totalStorageSize = 0;
    let totalFiles = 0;

    for (const bucket of buckets) {
      console.log(`\n📂 Bucket: ${bucket.name}`);
      console.log(`   • ID: ${bucket.id}`);
      console.log(`   • Public: ${bucket.public ? '✅' : '❌'}`);
      console.log(`   • Created: ${new Date(bucket.created_at).toLocaleString()}`);

      // List all files in the bucket
      const { data: files, error: filesError } = await supabase.storage
        .from(bucket.name)
        .list('', {
          limit: 10000,
          sortBy: { column: 'created_at', order: 'desc' }
        });

      if (filesError) {
        console.log(`   ⚠️  Error listing files: ${filesError.message}`);
        continue;
      }

      const fileCount = files ? files.length : 0;
      let bucketSize = 0;

      if (files && files.length > 0) {
        // Calculate total size
        files.forEach(file => {
          if (file.metadata && file.metadata.size) {
            bucketSize += file.metadata.size;
          }
        });
      }

      totalFiles += fileCount;
      totalStorageSize += bucketSize;

      console.log(`   • Files: ${fileCount}`);
      console.log(`   • Size: ${(bucketSize / 1024).toFixed(2)} KB (${(bucketSize / 1024 / 1024).toFixed(2)} MB)`);

      // Show recent files
      if (files && files.length > 0) {
        console.log(`\n   📋 Recent files (up to 5):`);
        const recentFiles = files.slice(0, 5);
        recentFiles.forEach((file, index) => {
          const size = file.metadata?.size ? `${(file.metadata.size / 1024).toFixed(2)} KB` : 'Unknown';
          const created = file.created_at ? new Date(file.created_at).toLocaleString() : 'Unknown';
          console.log(`      ${index + 1}. ${file.name} - ${size} - ${created}`);
        });
      }
    }

    console.log('\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📊 TOTAL STORAGE SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`📦 Total Buckets: ${buckets.length}`);
    console.log(`📁 Total Files: ${totalFiles}`);
    console.log(`💾 Total Storage Used: ${(totalStorageSize / 1024).toFixed(2)} KB (${(totalStorageSize / 1024 / 1024).toFixed(2)} MB)`);
    
    // Supabase free tier is 1 GB = 1024 MB
    const freeTierMB = 1024;
    const usedPercentage = ((totalStorageSize / 1024 / 1024) / freeTierMB * 100).toFixed(2);
    const remainingMB = freeTierMB - (totalStorageSize / 1024 / 1024);
    
    console.log(`📈 Storage Used: ${usedPercentage}% of ${freeTierMB} MB free tier`);
    console.log(`🎯 Remaining: ${remainingMB.toFixed(2)} MB\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Storage check complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error checking storage:', error.message);
  }
}

checkStorageUsage();
