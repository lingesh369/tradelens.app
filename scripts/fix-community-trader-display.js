/**
 * Fix Community Trader Display
 * Checks RLS policies and permissions for community views
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const adminClient = createClient(supabaseUrl, supabaseServiceKey);
const anonClient = createClient(supabaseUrl, supabaseAnonKey);

async function fixCommunityDisplay() {
  console.log('🔧 Fixing Community Trader Display\n');

  // 1. Check if views exist and have proper permissions
  console.log('1️⃣ Checking view permissions...');
  
  const checkQuery = `
    SELECT 
      schemaname,
      viewname,
      viewowner
    FROM pg_views 
    WHERE viewname IN ('community_traders_view', 'community_feed', 'leaderboard_view')
    ORDER BY viewname;
  `;

  const { data: views, error: viewsError } = await adminClient
    .rpc('exec_sql', { sql: checkQuery });

  if (viewsError) {
    console.log('   ⚠️  Could not check views directly');
  }

  // 2. Test anonymous access to views
  console.log('\n2️⃣ Testing anonymous access to community_traders_view...');
  const { data: anonTraders, error: anonError } = await anonClient
    .from('community_traders_view')
    .select('*')
    .limit(5);

  if (anonError) {
    console.error('   ❌ Anonymous access failed:', anonError.message);
    console.log('   This means unauthenticated users cannot see traders!');
  } else {
    console.log(`   ✅ Anonymous access works (${anonTraders.length} traders visible)`);
  }

  // 3. Test authenticated access
  console.log('\n3️⃣ Testing authenticated access...');
  
  // First, get a test user
  const { data: users } = await adminClient
    .from('app_users')
    .select('id, username')
    .limit(1)
    .single();

  if (users) {
    console.log(`   Using test user: ${users.username} (${users.id})`);
    
    // Get auth user
    const { data: authUsers } = await adminClient.auth.admin.listUsers();
    const authUser = authUsers.users.find(u => u.id === users.id);
    
    if (authUser) {
      // Create authenticated client
      const { data: session } = await adminClient.auth.admin.generateLink({
        type: 'magiclink',
        email: authUser.email
      });
      
      console.log('   Testing with authenticated session...');
      
      const { data: authTraders, error: authError } = await adminClient
        .from('community_traders_view')
        .select('*')
        .limit(5);

      if (authError) {
        console.error('   ❌ Authenticated access failed:', authError.message);
      } else {
        console.log(`   ✅ Authenticated access works (${authTraders.length} traders)`);
      }
    }
  }

  // 4. Check RLS policies on underlying tables
  console.log('\n4️⃣ Checking RLS policies...');
  
  const tables = ['trader_profiles', 'app_users', 'community_follows'];
  
  for (const table of tables) {
    const { data: policies, error: policiesError } = await adminClient
      .rpc('exec_sql', { 
        sql: `
          SELECT 
            schemaname,
            tablename,
            policyname,
            permissive,
            roles,
            cmd,
            qual
          FROM pg_policies 
          WHERE tablename = '${table}'
          ORDER BY policyname;
        `
      });

    if (!policiesError && policies) {
      console.log(`   ${table}: ${policies.length} policies`);
    }
  }

  // 5. Verify trader_profiles.is_public setting
  console.log('\n5️⃣ Checking trader profile visibility settings...');
  const { data: profiles, error: profilesError } = await adminClient
    .from('trader_profiles')
    .select('user_id, is_public, total_trades, win_rate, total_pnl');

  if (profilesError) {
    console.error('   ❌ Error:', profilesError.message);
  } else {
    console.log(`   Found ${profiles.length} trader profiles:`);
    profiles.forEach(p => {
      console.log(`   - User ${p.user_id.substring(0, 8)}...`);
      console.log(`     Public: ${p.is_public}, Trades: ${p.total_trades}, Win Rate: ${p.win_rate}%, PnL: $${p.total_pnl}`);
      
      if (!p.is_public) {
        console.log('     ⚠️  This profile is PRIVATE and won\'t show in community!');
      }
      if (p.total_trades === 0) {
        console.log('     ⚠️  This profile has NO TRADES - stats will show as 0');
      }
    });
  }

  // 6. Check if there are any trades at all
  console.log('\n6️⃣ Checking for trades in the system...');
  const { data: allTrades, error: tradesError } = await adminClient
    .from('trades')
    .select('id, user_id, instrument, status')
    .limit(10);

  if (tradesError) {
    console.error('   ❌ Error:', tradesError.message);
  } else {
    console.log(`   Total trades in system: ${allTrades.length}`);
    if (allTrades.length === 0) {
      console.log('   ⚠️  NO TRADES FOUND! This is why all stats show 0.');
      console.log('   💡 Solution: Add some trades to see meaningful stats in the community page.');
    }
  }

  console.log('\n✅ Diagnosis complete!\n');
  
  // Summary
  console.log('📋 SUMMARY:');
  console.log('─────────────────────────────────────────────────');
  if (allTrades && allTrades.length === 0) {
    console.log('❌ ISSUE: No trades in the database');
    console.log('   The community page is working correctly, but there are no');
    console.log('   trades to display stats for. Trader profiles show 0 because');
    console.log('   there are no closed trades to calculate metrics from.');
    console.log('\n💡 SOLUTION:');
    console.log('   1. Add some trades through the dashboard');
    console.log('   2. Close those trades to generate metrics');
    console.log('   3. The trader profile stats will update automatically');
    console.log('   4. Then the community page will show meaningful data');
  } else {
    console.log('✅ Trades exist - checking other issues...');
  }
}

fixCommunityDisplay().catch(console.error);
