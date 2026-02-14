/**
 * Test script for Community Page functionality
 * Tests edge functions and database views
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testCommunityPage() {
  console.log('🧪 Testing Community Page Functionality\n');

  // Test 1: Check if community_feed view is accessible
  console.log('1️⃣ Testing community_feed view access...');
  try {
    const { data, error } = await supabase
      .from('community_feed')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error accessing community_feed view:', error.message);
      console.error('   Details:', error);
    } else {
      console.log(`✅ community_feed view accessible (${data?.length || 0} records)`);
      if (data && data.length > 0) {
        console.log('   Sample record:', JSON.stringify(data[0], null, 2));
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  console.log('\n2️⃣ Testing community-feed edge function...');
  try {
    const { data, error } = await supabase.functions.invoke('community-feed', {
      body: {
        sortBy: 'recent',
        searchQuery: '',
        limit: 5,
        offset: 0
      }
    });

    if (error) {
      console.error('❌ Error calling community-feed function:', error.message);
      console.error('   Details:', error);
    } else {
      console.log(`✅ community-feed function works (${data?.data?.length || 0} records)`);
      if (data?.data && data.data.length > 0) {
        console.log('   Sample trade:', JSON.stringify(data.data[0], null, 2));
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  console.log('\n3️⃣ Testing community_traders_view access...');
  try {
    const { data, error } = await supabase
      .from('community_traders_view')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ Error accessing community_traders_view:', error.message);
      console.error('   Details:', error);
    } else {
      console.log(`✅ community_traders_view accessible (${data?.length || 0} records)`);
      if (data && data.length > 0) {
        console.log('   Sample trader:', JSON.stringify(data[0], null, 2));
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  console.log('\n4️⃣ Testing community-traders edge function...');
  try {
    const { data, error } = await supabase.functions.invoke('community-traders', {
      body: {
        sortBy: 'followers',
        searchQuery: '',
        limit: 5,
        offset: 0
      }
    });

    if (error) {
      console.error('❌ Error calling community-traders function:', error.message);
      console.error('   Details:', error);
    } else {
      console.log(`✅ community-traders function works (${data?.data?.length || 0} records)`);
      if (data?.data && data.data.length > 0) {
        console.log('   Sample trader:', JSON.stringify(data.data[0], null, 2));
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  console.log('\n5️⃣ Checking for shared trades in database...');
  try {
    const { data, error } = await supabase
      .from('trades')
      .select('id, instrument, is_shared, shared_at, user_id')
      .eq('is_shared', true)
      .limit(5);

    if (error) {
      console.error('❌ Error querying trades:', error.message);
    } else {
      console.log(`✅ Found ${data?.length || 0} shared trades`);
      if (data && data.length > 0) {
        data.forEach((trade, idx) => {
          console.log(`   ${idx + 1}. ${trade.instrument} (ID: ${trade.id}, Shared: ${trade.shared_at})`);
        });
      } else {
        console.log('   ⚠️  No shared trades found - this is why the community page is empty!');
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  console.log('\n6️⃣ Checking trader profiles...');
  try {
    const { data, error } = await supabase
      .from('trader_profiles')
      .select('user_id, bio, is_public, total_trades')
      .eq('is_public', true)
      .limit(5);

    if (error) {
      console.error('❌ Error querying trader_profiles:', error.message);
    } else {
      console.log(`✅ Found ${data?.length || 0} public trader profiles`);
      if (data && data.length > 0) {
        data.forEach((profile, idx) => {
          console.log(`   ${idx + 1}. User: ${profile.user_id}, Trades: ${profile.total_trades}, Public: ${profile.is_public}`);
        });
      } else {
        console.log('   ⚠️  No public trader profiles found!');
      }
    }
  } catch (err) {
    console.error('❌ Exception:', err.message);
  }

  console.log('\n✅ Community page test complete!\n');
}

testCommunityPage().catch(console.error);
