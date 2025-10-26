// Quick test to verify Supabase Storage is configured correctly
// Run this in browser console (F12) after logging in

import { supabase } from './lib/supabase'

async function testStorageSetup() {
  console.log('🔍 Testing Supabase Storage Setup...\n')
  
  try {
    // Test 1: Check if bucket exists
    console.log('Test 1: Checking if profile-photos bucket exists...')
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    
    if (bucketError) {
      console.error('❌ Error listing buckets:', bucketError)
      return false
    }
    
    const profilePhotosBucket = buckets.find(b => b.id === 'profile-photos')
    if (!profilePhotosBucket) {
      console.error('❌ Bucket "profile-photos" not found!')
      console.log('📝 Please create it in Supabase Dashboard → Storage → New Bucket')
      return false
    }
    
    console.log('✅ Bucket exists:', profilePhotosBucket)
    console.log('   - Name:', profilePhotosBucket.name)
    console.log('   - Public:', profilePhotosBucket.public)
    
    if (!profilePhotosBucket.public) {
      console.warn('⚠️  Bucket is NOT public! Please make it public in Supabase Dashboard')
    }
    
    // Test 2: Try to upload a test file
    console.log('\nTest 2: Testing file upload...')
    const testBlob = new Blob(['test'], { type: 'text/plain' })
    const testFileName = `test_${Date.now()}.txt`
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(testFileName, testBlob, {
        contentType: 'text/plain',
        cacheControl: '3600',
        upsert: false
      })
    
    if (uploadError) {
      console.error('❌ Upload failed:', uploadError)
      console.log('📝 Please check storage policies in Supabase Dashboard')
      return false
    }
    
    console.log('✅ Upload successful:', uploadData)
    
    // Test 3: Get public URL
    console.log('\nTest 3: Getting public URL...')
    const { data: urlData } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(testFileName)
    
    console.log('✅ Public URL generated:', urlData.publicUrl)
    
    // Test 4: Clean up test file
    console.log('\nTest 4: Cleaning up test file...')
    const { error: deleteError } = await supabase.storage
      .from('profile-photos')
      .remove([testFileName])
    
    if (deleteError) {
      console.warn('⚠️  Could not delete test file:', deleteError)
    } else {
      console.log('✅ Test file deleted')
    }
    
    console.log('\n🎉 All tests passed! Storage is configured correctly.')
    console.log('📸 Photo upload should work perfectly now!')
    return true
    
  } catch (error) {
    console.error('❌ Test failed with error:', error)
    return false
  }
}

// Run the test
testStorageSetup()
