// Check profile photos and their storage usage
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

async function checkProfilePhotos() {
  console.log('\n📸 Checking Profile Photos Storage...\n');

  try {
    // Get all profiles with photo information
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, profile_picture, created_at');

    if (profilesError) {
      console.error('❌ Error fetching profiles:', profilesError);
      return;
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('👤 PROFILE PHOTOS ANALYSIS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    const profilesWithPhotos = profiles.filter(p => p.profile_picture && p.profile_picture.trim() !== '');
    const profilesWithoutPhotos = profiles.filter(p => !p.profile_picture || p.profile_picture.trim() === '');

    console.log(`📊 PROFILE STATISTICS:`);
    console.log(`   • Total Profiles: ${profiles.length}`);
    console.log(`   • With Photos: ${profilesWithPhotos.length} (${((profilesWithPhotos.length / profiles.length) * 100).toFixed(1)}%)`);
    console.log(`   • Without Photos: ${profilesWithoutPhotos.length} (${((profilesWithoutPhotos.length / profiles.length) * 100).toFixed(1)}%)\n`);

    // Check storage buckets and calculate actual storage
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
    
    let totalStorageSize = 0;
    let totalFiles = 0;
    let photoFiles = [];

    if (!bucketError && buckets && buckets.length > 0) {
      console.log(`📦 STORAGE BUCKETS FOUND: ${buckets.length}\n`);
      
      for (const bucket of buckets) {
        console.log(`📂 Bucket: ${bucket.name}`);
        
        const { data: files, error: filesError } = await supabase.storage
          .from(bucket.name)
          .list('', { 
            limit: 10000,
            sortBy: { column: 'created_at', order: 'desc' }
          });

        if (filesError) {
          console.log(`   ⚠️  Error: ${filesError.message}\n`);
          continue;
        }

        const fileCount = files ? files.length : 0;
        let bucketSize = 0;

        if (files && files.length > 0) {
          files.forEach(file => {
            const fileSize = file.metadata?.size || 0;
            bucketSize += fileSize;
            photoFiles.push({
              bucket: bucket.name,
              name: file.name,
              size: fileSize,
              created: file.created_at
            });
          });
        }

        totalFiles += fileCount;
        totalStorageSize += bucketSize;

        console.log(`   • Files: ${fileCount}`);
        console.log(`   • Size: ${(bucketSize / 1024).toFixed(2)} KB (${(bucketSize / 1024 / 1024).toFixed(2)} MB)`);
        console.log(`   • Average per file: ${fileCount > 0 ? (bucketSize / fileCount / 1024).toFixed(2) : 0} KB\n`);
      }
    } else {
      console.log('ℹ️  No storage buckets configured yet.\n');
    }

    // Display detailed photo information
    if (profilesWithPhotos.length > 0) {
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('📋 PROFILES WITH PHOTOS');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

      profilesWithPhotos.slice(0, 10).forEach((profile, index) => {
        const urlParts = profile.profile_picture.split('/');
        const fileName = urlParts[urlParts.length - 1];
        console.log(`${index + 1}. ${profile.name || 'Unnamed'}`);
        console.log(`   URL: ${profile.profile_picture.substring(0, 80)}...`);
        console.log(`   File: ${fileName}\n`);
      });

      if (profilesWithPhotos.length > 10) {
        console.log(`   ... and ${profilesWithPhotos.length - 10} more profiles with photos\n`);
      }
    }

    // Calculate estimated storage based on typical photo sizes
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('💾 STORAGE CALCULATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    if (totalFiles > 0 && totalStorageSize > 0) {
      // Actual storage from buckets
      const storageMB = totalStorageSize / 1024 / 1024;
      const avgPhotoSizeKB = totalStorageSize / totalFiles / 1024;
      
      console.log('📊 ACTUAL STORAGE:');
      console.log(`   • Total Files: ${totalFiles}`);
      console.log(`   • Total Size: ${(totalStorageSize / 1024).toFixed(2)} KB (${storageMB.toFixed(2)} MB)`);
      console.log(`   • Average Photo Size: ${avgPhotoSizeKB.toFixed(2)} KB`);
      console.log(`   • Storage Used: ${(storageMB / 1024 * 100).toFixed(4)}% of 1 GB free tier`);
      console.log(`   • Remaining: ${(1024 - storageMB).toFixed(2)} MB\n`);
    } else if (profilesWithPhotos.length > 0) {
      // Estimate if actual storage data not available
      // Typical compressed profile photo: 200-500 KB
      const estimatedSizePerPhoto = 300; // KB
      const estimatedTotalKB = profilesWithPhotos.length * estimatedSizePerPhoto;
      const estimatedTotalMB = estimatedTotalKB / 1024;
      
      console.log('📊 ESTIMATED STORAGE (based on typical photo sizes):');
      console.log(`   • Photos with URLs: ${profilesWithPhotos.length}`);
      console.log(`   • Estimated Size per Photo: ~${estimatedSizePerPhoto} KB`);
      console.log(`   • Estimated Total: ~${estimatedTotalKB.toFixed(2)} KB (~${estimatedTotalMB.toFixed(2)} MB)`);
      console.log(`   • Estimated Usage: ~${(estimatedTotalMB / 1024 * 100).toFixed(2)}% of 1 GB free tier`);
      console.log(`   • Estimated Remaining: ~${(1024 - estimatedTotalMB).toFixed(2)} MB\n`);
      
      console.log('⚠️  Note: This is an estimate. Actual bucket data not accessible.');
      console.log('   Photos might be stored externally or bucket permissions need adjustment.\n');
    } else {
      console.log('ℹ️  No photos detected in profiles or storage.\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ Photo analysis complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkProfilePhotos();
