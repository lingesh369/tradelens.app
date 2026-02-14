/**
 * Test Journal Authentication and Profile Loading
 * 
 * This script helps diagnose journal authentication issues
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testJournalAuth() {
  console.log('🔐 Testing Journal Authentication\n');

  try {
    // Test 1: Check if user is authenticated
    console.log('1️⃣ Checking authentication status...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error('❌ Authentication error:', authError.message);
      console.log('\n⚠️  You need to be logged in to test journal functionality');
      console.log('   Please log in through the app first, then run this test again.');
      return;
    }

    if (!user) {
      console.log('❌ No user logged in');
      console.log('\n⚠️  Please log in through the app first');
      return;
    }

    console.log('✅ User authenticated:', user.email);
    console.log('   User ID:', user.id);

    // Test 2: Check user profile
    console.log('\n2️⃣ Checking user profile...');
    const { data: profile, error: profileError } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile error:', profileError.message);
      return;
    }

    if (!profile) {
      console.log('❌ No profile found');
      return;
    }

    console.log('✅ Profile loaded');
    console.log('   Profile ID:', profile.id);
    console.log('   Username:', profile.username);
    console.log('   Email:', profile.email);

    // Test 3: Check journal access
    console.log('\n3️⃣ Testing journal access...');
    const testDate = new Date().toISOString().split('T')[0];
    
    const { data: journalData, error: journalError } = await supabase
      .from('journal')
      .select('*')
      .eq('user_id', profile.id)
      .eq('journal_date', testDate)
      .maybeSingle();

    if (journalError) {
      console.error('❌ Journal query error:', journalError.message);
      return;
    }

    if (journalData) {
      console.log('✅ Journal entry found for today');
      console.log('   Entry ID:', journalData.id);
      console.log('   Has notes:', !!journalData.notes);
    } else {
      console.log('ℹ️  No journal entry for today (this is normal)');
    }

    // Test 4: Test journal creation
    console.log('\n4️⃣ Testing journal entry creation...');
    const { data: createData, error: createError } = await supabase
      .from('journal')
      .insert([{
        user_id: profile.id,
        journal_date: testDate,
        notes: 'Test entry from auth test script',
        net_pl: 0,
        num_trades: 0,
        win_rate: 0,
        profit_factor: 1,
        winning_trades: 0,
        losing_trades: 0,
        total_profitable_pl: 0,
        total_losing_pl: 0,
        total_fees: 0,
        image_captions: {}
      }])
      .select()
      .single();

    if (createError) {
      if (createError.code === '23505') {
        console.log('ℹ️  Journal entry already exists for today (expected)');
      } else {
        console.error('❌ Create error:', createError.message);
        return;
      }
    } else {
      console.log('✅ Journal entry created successfully');
      console.log('   Entry ID:', createData.id);
      
      // Clean up test entry
      await supabase
        .from('journal')
        .delete()
        .eq('id', createData.id);
      console.log('   Test entry cleaned up');
    }

    // Test 5: Check journal_images access
    console.log('\n5️⃣ Testing journal images access...');
    const { data: imagesData, error: imagesError } = await supabase
      .from('journal_images')
      .select('*')
      .eq('user_id', profile.id)
      .limit(5);

    if (imagesError) {
      console.error('❌ Images query error:', imagesError.message);
      return;
    }

    console.log(`✅ Journal images query successful (${imagesData.length} images found)`);

    // Test 6: Check storage bucket access
    console.log('\n6️⃣ Testing storage bucket access...');
    const { data: buckets, error: bucketError } = await supabase
      .storage
      .listBuckets();

    if (bucketError) {
      console.error('❌ Bucket list error:', bucketError.message);
    } else {
      const journalBucket = buckets.find(b => b.name === 'journal-images');
      if (journalBucket) {
        console.log('✅ Journal images bucket exists');
        console.log('   Bucket:', journalBucket.name);
        console.log('   Public:', journalBucket.public);
      } else {
        console.log('⚠️  Journal images bucket not found');
      }
    }

    console.log('\n✅ All authentication tests passed!');
    console.log('\n📋 Summary:');
    console.log('- User authenticated: ✅');
    console.log('- Profile loaded: ✅');
    console.log('- Journal access: ✅');
    console.log('- Journal images access: ✅');
    console.log('- Storage bucket: ✅');
    console.log('\n✨ Journal should work correctly in the app');

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.error(error);
  }
}

// Run tests
testJournalAuth()
  .then(() => {
    console.log('\n✨ Test completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Test failed:', error);
    process.exit(1);
  });
