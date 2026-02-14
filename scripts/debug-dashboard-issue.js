/**
 * Debug Dashboard Issue
 * Check why trades aren't showing on dashboard
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugDashboard() {
  console.log('\n🔍 Debugging Dashboard Issue...\n');

  try {
    const testEmail = 'test@tradelens.com';

    // Get user
    const { data: users } = await supabase
      .from('app_users')
      .select('id, email')
      .eq('email', testEmail)
      .limit(1);

    if (!users || users.length === 0) {
      throw new Error('Test user not found');
    }

    const userId = users[0].id;
    console.log('✅ User ID:', userId);
    console.log('   Email:', users[0].email);

    // Check total trades
    console.log('\n1️⃣ Checking all trades in database...');
    const { data: allTrades, error: allTradesError } = await supabase
      .from('trades')
      .select('id, instrument, action, status, entry_time, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (allTradesError) {
      console.error('   ❌ Error fetching trades:', allTradesError);
      throw allTradesError;
    }

    console.log(`   ✅ Found ${allTrades.length} total trades`);
    console.log('\n   Recent trades:');
    allTrades.slice(0, 5).forEach((trade, i) => {
      console.log(`      ${i + 1}. ${trade.instrument} (${trade.action}) - ${trade.status}`);
      console.log(`         Created: ${trade.created_at}`);
      console.log(`         Entry: ${trade.entry_time}`);
    });

    // Check what the frontend query would return
    console.log('\n2️⃣ Testing frontend query (with metrics)...');
    const { data: frontendTrades, error: frontendError } = await supabase
      .from('trades')
      .select(`
        *,
        trade_metrics (
          net_pnl,
          gross_pnl,
          percent_gain,
          trade_result,
          r_multiple,
          trade_duration
        )
      `)
      .eq('user_id', userId)
      .order('entry_time', { ascending: false });

    if (frontendError) {
      console.error('   ❌ Error with frontend query:', frontendError);
      throw frontendError;
    }

    console.log(`   ✅ Frontend query returned ${frontendTrades.length} trades`);

    // Check for trades without metrics
    const tradesWithoutMetrics = frontendTrades.filter(t => {
      const metrics = Array.isArray(t.trade_metrics) ? t.trade_metrics[0] : t.trade_metrics;
      return t.status === 'closed' && !metrics;
    });

    if (tradesWithoutMetrics.length > 0) {
      console.log(`\n   ⚠️  ${tradesWithoutMetrics.length} closed trades missing metrics:`);
      tradesWithoutMetrics.forEach(t => {
        console.log(`      - ${t.instrument} (ID: ${t.id})`);
      });
    }

    // Check RLS policies
    console.log('\n3️⃣ Checking RLS policies...');
    const { data: policies, error: policiesError } = await supabase
      .rpc('pg_policies')
      .select('*')
      .eq('tablename', 'trades');

    if (!policiesError && policies) {
      console.log(`   ✅ Found ${policies.length} RLS policies for trades table`);
    } else {
      console.log('   ⚠️  Could not check RLS policies (this is normal)');
    }

    // Test with anon key (like frontend)
    console.log('\n4️⃣ Testing with anon key (simulating frontend)...');
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
    
    if (!anonKey) {
      console.log('   ⚠️  VITE_SUPABASE_ANON_KEY not found in .env.local');
    } else {
      const anonClient = createClient(supabaseUrl, anonKey);
      
      // Try to fetch without auth (should fail)
      const { data: unauthTrades, error: unauthError } = await anonClient
        .from('trades')
        .select('id')
        .eq('user_id', userId);

      if (unauthError) {
        console.log('   ✅ Correctly blocked unauthenticated access');
      } else {
        console.log(`   ⚠️  Unauthenticated query returned ${unauthTrades?.length || 0} trades (should be 0)`);
      }
    }

    // Check the most recent trade
    console.log('\n5️⃣ Checking most recent trade...');
    const mostRecent = allTrades[0];
    if (mostRecent) {
      console.log('   Most recent trade:');
      console.log(`      ID: ${mostRecent.id}`);
      console.log(`      Instrument: ${mostRecent.instrument}`);
      console.log(`      Status: ${mostRecent.status}`);
      console.log(`      Created: ${mostRecent.created_at}`);
      console.log(`      Entry Time: ${mostRecent.entry_time}`);

      // Get full details
      const { data: fullTrade } = await supabase
        .from('trades')
        .select('*')
        .eq('id', mostRecent.id)
        .single();

      if (fullTrade) {
        console.log('\n   Full trade data:');
        console.log(`      User ID: ${fullTrade.user_id}`);
        console.log(`      Account ID: ${fullTrade.account_id}`);
        console.log(`      Strategy ID: ${fullTrade.strategy_id}`);
        console.log(`      Entry Price: ${fullTrade.entry_price}`);
        console.log(`      Exit Price: ${fullTrade.exit_price}`);
        console.log(`      Quantity: ${fullTrade.quantity}`);
      }
    }

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`   Total Trades: ${allTrades.length}`);
    console.log(`   Frontend Query Returns: ${frontendTrades.length}`);
    console.log(`   Trades Without Metrics: ${tradesWithoutMetrics.length}`);
    console.log('\n💡 RECOMMENDATIONS:');
    
    if (allTrades.length === frontendTrades.length) {
      console.log('   ✅ All trades are accessible via frontend query');
    } else {
      console.log('   ⚠️  Some trades not returned by frontend query');
    }

    if (tradesWithoutMetrics.length > 0) {
      console.log('   ⚠️  Some closed trades missing metrics - check triggers');
    }

    console.log('\n🔍 NEXT STEPS:');
    console.log('   1. Check browser console for errors');
    console.log('   2. Check Network tab for API calls');
    console.log('   3. Verify user is logged in with correct ID');
    console.log('   4. Check if trades are filtered by date/account');
    console.log('   5. Try hard refresh (Ctrl+Shift+R)');

  } catch (error) {
    console.error('\n❌ DEBUG FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

debugDashboard();
