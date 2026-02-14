/**
 * Diagnose Trader Profiles Issue
 * Check why trader profiles aren't showing correct stats
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function diagnoseTraderProfiles() {
  console.log('🔍 Diagnosing Trader Profiles Issue\n');

  // 1. Check trader_profiles table
  console.log('1️⃣ Checking trader_profiles table...');
  const { data: profiles, error: profilesError } = await supabase
    .from('trader_profiles')
    .select('*');

  if (profilesError) {
    console.error('❌ Error:', profilesError.message);
  } else {
    console.log(`✅ Found ${profiles.length} trader profiles`);
    profiles.forEach(p => {
      console.log(`   - User: ${p.user_id}`);
      console.log(`     Public: ${p.is_public}, Trades: ${p.total_trades}, Win Rate: ${p.win_rate}%, PnL: ${p.total_pnl}`);
    });
  }

  // 2. Check if users have trades
  console.log('\n2️⃣ Checking trades for each user...');
  for (const profile of profiles || []) {
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('id, instrument, status, user_id')
      .eq('user_id', profile.user_id);

    if (tradesError) {
      console.error(`   ❌ Error for user ${profile.user_id}:`, tradesError.message);
    } else {
      console.log(`   User ${profile.user_id}: ${trades.length} trades`);
      if (trades.length > 0) {
        console.log(`     Sample: ${trades[0].instrument} (${trades[0].status})`);
      }
    }
  }

  // 3. Check trade_metrics
  console.log('\n3️⃣ Checking trade_metrics...');
  const { data: metrics, error: metricsError } = await supabase
    .from('trade_metrics')
    .select('trade_id, net_pnl, percent_gain, trade_result');

  if (metricsError) {
    console.error('❌ Error:', metricsError.message);
  } else {
    console.log(`✅ Found ${metrics.length} trade metrics records`);
  }

  // 4. Check community_traders_view
  console.log('\n4️⃣ Checking community_traders_view...');
  const { data: viewData, error: viewError } = await supabase
    .from('community_traders_view')
    .select('*');

  if (viewError) {
    console.error('❌ Error:', viewError.message);
  } else {
    console.log(`✅ View returns ${viewData.length} traders`);
    viewData.forEach(t => {
      console.log(`   - ${t.username}: ${t.total_trades} trades, ${t.win_rate}% win rate, $${t.total_pnl} PnL`);
    });
  }

  // 5. Manually calculate stats for a user
  if (profiles && profiles.length > 0) {
    const testUser = profiles[0];
    console.log(`\n5️⃣ Manually calculating stats for user ${testUser.user_id}...`);

    const { data: userTrades, error: userTradesError } = await supabase
      .from('trades')
      .select(`
        id,
        status,
        trade_metrics (
          net_pnl,
          trade_result
        )
      `)
      .eq('user_id', testUser.user_id)
      .eq('status', 'closed');

    if (userTradesError) {
      console.error('❌ Error:', userTradesError.message);
    } else {
      const totalTrades = userTrades.length;
      const wins = userTrades.filter(t => t.trade_metrics?.trade_result === 'win').length;
      const totalPnL = userTrades.reduce((sum, t) => sum + (t.trade_metrics?.net_pnl || 0), 0);
      const winRate = totalTrades > 0 ? (wins / totalTrades) * 100 : 0;

      console.log(`   Calculated Stats:`);
      console.log(`   - Total Trades: ${totalTrades}`);
      console.log(`   - Wins: ${wins}`);
      console.log(`   - Win Rate: ${winRate.toFixed(2)}%`);
      console.log(`   - Total PnL: $${totalPnL.toFixed(2)}`);
      console.log(`\n   Stored in trader_profiles:`);
      console.log(`   - Total Trades: ${testUser.total_trades}`);
      console.log(`   - Win Rate: ${testUser.win_rate}%`);
      console.log(`   - Total PnL: $${testUser.total_pnl}`);

      if (totalTrades !== testUser.total_trades || Math.abs(winRate - testUser.win_rate) > 0.1) {
        console.log('\n   ⚠️  MISMATCH DETECTED! Stats need to be synced.');
      }
    }
  }

  // 6. Try to sync stats for test user
  if (profiles && profiles.length > 0) {
    console.log('\n6️⃣ Attempting to sync stats...');
    try {
      const { data, error } = await supabase
        .rpc('update_trader_profile_stats_by_user', { p_user_id: profiles[0].user_id });
      
      if (error) {
        console.log('   ⚠️  Sync function error:', error.message);
      } else {
        console.log('   ✅ Sync function executed successfully');
      }
    } catch (err) {
      console.log('   ⚠️  Could not execute sync:', err.message);
    }
  }

  console.log('\n✅ Diagnosis complete!\n');
}

diagnoseTraderProfiles().catch(console.error);
