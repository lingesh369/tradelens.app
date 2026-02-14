/**
 * Verify Trade Display
 * Checks that trades appear in all expected places
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

async function verifyTradeDisplay() {
  console.log('\n🔍 Verifying Trade Display Across Platform...\n');

  try {
    const testEmail = 'test@tradelens.com';

    // Get user
    const { data: users } = await supabase
      .from('app_users')
      .select('id')
      .eq('email', testEmail)
      .limit(1);

    if (!users || users.length === 0) {
      throw new Error('Test user not found');
    }

    const userId = users[0].id;
    console.log('✅ Test User ID:', userId);

    // 1. Check trades table
    console.log('\n1️⃣ Checking trades table...');
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('id, instrument, action, status')
      .eq('user_id', userId);

    if (tradesError) throw tradesError;
    console.log(`   ✅ Found ${trades.length} trades in trades table`);

    // 2. Check trade_metrics table
    console.log('\n2️⃣ Checking trade_metrics table...');
    const { data: metrics, error: metricsError } = await supabase
      .from('trade_metrics')
      .select('trade_id, net_pnl, trade_result')
      .eq('user_id', userId);

    if (metricsError) throw metricsError;
    console.log(`   ✅ Found ${metrics.length} trade metrics`);

    const tradesWithoutMetrics = trades.filter(t => 
      t.status === 'closed' && !metrics.find(m => m.trade_id === t.id)
    );
    
    if (tradesWithoutMetrics.length > 0) {
      console.log(`   ⚠️  ${tradesWithoutMetrics.length} closed trades missing metrics:`);
      tradesWithoutMetrics.forEach(t => {
        console.log(`      - ${t.instrument} (${t.id})`);
      });
    }

    // 3. Check accounts table
    console.log('\n3️⃣ Checking accounts table...');
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name, current_balance')
      .eq('user_id', userId);

    if (accountsError) throw accountsError;
    console.log(`   ✅ Found ${accounts.length} account(s)`);
    accounts.forEach(acc => {
      console.log(`      - ${acc.name}: $${acc.current_balance}`);
    });

    // 4. Check strategies table
    console.log('\n4️⃣ Checking strategies table...');
    const { data: strategies, error: strategiesError } = await supabase
      .from('strategies')
      .select('id, name, total_trades, win_rate, total_pnl')
      .eq('user_id', userId);

    if (strategiesError) throw strategiesError;
    console.log(`   ✅ Found ${strategies.length} strateg(ies)`);
    strategies.forEach(strat => {
      console.log(`      - ${strat.name}: ${strat.total_trades} trades, ${strat.win_rate}% win rate, $${strat.total_pnl} P&L`);
    });

    // 5. Check trades with full details (as frontend would fetch)
    console.log('\n5️⃣ Checking trades with full details (frontend query)...');
    const { data: fullTrades, error: fullTradesError } = await supabase
      .from('trades')
      .select(`
        id,
        instrument,
        action,
        market_type,
        entry_price,
        exit_price,
        quantity,
        status,
        entry_time,
        exit_time,
        commission,
        fees,
        notes,
        rating,
        account_id,
        strategy_id,
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

    if (fullTradesError) throw fullTradesError;
    console.log(`   ✅ Successfully fetched ${fullTrades.length} trades with full details`);

    // 6. Verify data integrity
    console.log('\n6️⃣ Verifying data integrity...');
    
    let issues = 0;
    
    fullTrades.forEach((trade, index) => {
      const tradeMetrics = Array.isArray(trade.trade_metrics) 
        ? trade.trade_metrics[0] 
        : trade.trade_metrics;

      // Check closed trades have metrics
      if (trade.status === 'closed' && !tradeMetrics) {
        console.log(`   ⚠️  Trade ${index + 1} (${trade.instrument}) is closed but has no metrics`);
        issues++;
      }

      // Check required fields
      if (!trade.instrument) {
        console.log(`   ⚠️  Trade ${index + 1} missing instrument`);
        issues++;
      }
      if (!trade.entry_price) {
        console.log(`   ⚠️  Trade ${index + 1} missing entry_price`);
        issues++;
      }
      if (!trade.quantity) {
        console.log(`   ⚠️  Trade ${index + 1} missing quantity`);
        issues++;
      }
    });

    if (issues === 0) {
      console.log('   ✅ All trades have valid data');
    } else {
      console.log(`   ⚠️  Found ${issues} data integrity issue(s)`);
    }

    // 7. Calculate summary statistics
    console.log('\n7️⃣ Summary Statistics...');
    
    const closedTrades = fullTrades.filter(t => t.status === 'closed');
    const openTrades = fullTrades.filter(t => t.status === 'open');
    
    let totalPnL = 0;
    let wins = 0;
    let losses = 0;
    
    closedTrades.forEach(trade => {
      const metrics = Array.isArray(trade.trade_metrics) 
        ? trade.trade_metrics[0] 
        : trade.trade_metrics;
      
      if (metrics) {
        totalPnL += metrics.net_pnl || 0;
        if (metrics.trade_result === 'win') wins++;
        if (metrics.trade_result === 'loss') losses++;
      }
    });

    const winRate = wins + losses > 0 ? ((wins / (wins + losses)) * 100).toFixed(2) : 0;

    console.log(`   Total Trades: ${fullTrades.length}`);
    console.log(`   Closed Trades: ${closedTrades.length}`);
    console.log(`   Open Trades: ${openTrades.length}`);
    console.log(`   Wins: ${wins}`);
    console.log(`   Losses: ${losses}`);
    console.log(`   Win Rate: ${winRate}%`);
    console.log(`   Total P&L: $${totalPnL.toFixed(2)}`);

    // 8. Check for orphaned records
    console.log('\n8️⃣ Checking for orphaned records...');
    
    const { data: orphanedMetrics } = await supabase
      .from('trade_metrics')
      .select('trade_id')
      .not('trade_id', 'in', `(${trades.map(t => t.id).join(',')})`);

    if (orphanedMetrics && orphanedMetrics.length > 0) {
      console.log(`   ⚠️  Found ${orphanedMetrics.length} orphaned trade_metrics records`);
    } else {
      console.log('   ✅ No orphaned records found');
    }

    // Final summary
    console.log('\n' + '='.repeat(60));
    console.log('✅ VERIFICATION COMPLETE');
    console.log('='.repeat(60));
    console.log('\n📊 Platform Status:');
    console.log(`   ✅ Trades Table: ${trades.length} records`);
    console.log(`   ✅ Trade Metrics: ${metrics.length} records`);
    console.log(`   ✅ Accounts: ${accounts.length} records`);
    console.log(`   ✅ Strategies: ${strategies.length} records`);
    console.log(`   ${issues === 0 ? '✅' : '⚠️ '} Data Integrity: ${issues === 0 ? 'All good' : `${issues} issue(s)`}`);
    
    console.log('\n🌐 Ready for Testing:');
    console.log('   1. Open http://localhost:8081');
    console.log('   2. Login with: test@tradelens.com / Test123456!');
    console.log('   3. Verify trades appear on:');
    console.log('      - Dashboard (statistics and charts)');
    console.log('      - Trades page (full table)');
    console.log('      - Strategy page (strategy performance)');
    console.log('      - Account page (account performance)');
    console.log('      - Analytics page (detailed charts)');

  } catch (error) {
    console.error('\n❌ VERIFICATION FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

verifyTradeDisplay();
