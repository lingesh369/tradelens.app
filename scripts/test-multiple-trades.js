/**
 * Test Multiple Trades
 * Creates multiple trades to test dashboard, analytics, and filtering
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

console.log('🔗 Connected to Supabase:', supabaseUrl);

async function createMultipleTrades() {
  console.log('\n📊 Creating Multiple Test Trades...\n');

  try {
    // Get test user - use service role to bypass email confirmation
    const testEmail = 'test@tradelens.com';
    
    // Get user directly from database
    const { data: users, error: userError } = await supabase
      .from('app_users')
      .select('id')
      .eq('email', testEmail)
      .limit(1);

    if (userError || !users || users.length === 0) {
      throw new Error('Test user not found. Run test-trade-flow.js first.');
    }

    const userId = users[0].id;
    console.log('✅ Found test user:', userId);

    // Get existing account and strategy
    const { data: accounts } = await supabase
      .from('accounts')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    const { data: strategies } = await supabase
      .from('strategies')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (!accounts || accounts.length === 0) {
      throw new Error('No account found. Run test-trade-flow.js first.');
    }

    if (!strategies || strategies.length === 0) {
      throw new Error('No strategy found. Run test-trade-flow.js first.');
    }

    const accountId = accounts[0].id;
    const strategyId = strategies[0].id;

    console.log('📁 Using Account:', accountId);
    console.log('📋 Using Strategy:', strategyId);

    // Create multiple trades with different scenarios
    const trades = [
      {
        instrument: 'TSLA',
        action: 'long',
        market_type: 'stocks',
        entry_price: 200.00,
        exit_price: 210.00,
        quantity: 5,
        sl: 195.00,
        target: 215.00,
        commission: 1.50,
        fees: 0.25,
        notes: 'Strong breakout trade',
        rating: 5,
        status: 'closed'
      },
      {
        instrument: 'GOOGL',
        action: 'long',
        market_type: 'stocks',
        entry_price: 140.00,
        exit_price: 138.00,
        quantity: 8,
        sl: 137.00,
        target: 145.00,
        commission: 2.00,
        fees: 0.30,
        notes: 'Failed support test',
        rating: 2,
        status: 'closed'
      },
      {
        instrument: 'MSFT',
        action: 'long',
        market_type: 'stocks',
        entry_price: 380.00,
        exit_price: 390.00,
        quantity: 3,
        sl: 375.00,
        target: 395.00,
        commission: 1.00,
        fees: 0.20,
        notes: 'Earnings play',
        rating: 4,
        status: 'closed'
      },
      {
        instrument: 'NVDA',
        action: 'short',
        market_type: 'stocks',
        entry_price: 500.00,
        exit_price: 490.00,
        quantity: 4,
        sl: 505.00,
        target: 485.00,
        commission: 1.75,
        fees: 0.25,
        notes: 'Resistance rejection',
        rating: 5,
        status: 'closed'
      },
      {
        instrument: 'AMZN',
        action: 'long',
        market_type: 'stocks',
        entry_price: 175.00,
        quantity: 6,
        sl: 170.00,
        target: 185.00,
        commission: 0,
        fees: 0,
        notes: 'Currently holding',
        rating: 3,
        status: 'open'
      },
      {
        instrument: 'BTC/USD',
        action: 'long',
        market_type: 'crypto',
        entry_price: 45000.00,
        exit_price: 46500.00,
        quantity: 0.5,
        sl: 44000.00,
        target: 48000.00,
        commission: 25.00,
        fees: 5.00,
        notes: 'Crypto momentum trade',
        rating: 4,
        status: 'closed'
      },
      {
        instrument: 'EUR/USD',
        action: 'short',
        market_type: 'forex',
        entry_price: 1.0850,
        exit_price: 1.0820,
        quantity: 10000,
        sl: 1.0870,
        target: 1.0800,
        commission: 0,
        fees: 2.50,
        notes: 'Dollar strength play',
        rating: 4,
        status: 'closed'
      }
    ];

    console.log(`\n📝 Creating ${trades.length} trades...\n`);

    const createdTrades = [];
    const now = new Date();

    for (let i = 0; i < trades.length; i++) {
      const trade = trades[i];
      const entryTime = new Date(now.getTime() - (trades.length - i) * 24 * 60 * 60 * 1000); // Spread over days
      const exitTime = trade.status === 'closed' 
        ? new Date(entryTime.getTime() + 3 * 60 * 60 * 1000) // 3 hours later
        : null;

      const tradeData = {
        user_id: userId,
        account_id: accountId,
        strategy_id: strategyId,
        ...trade,
        entry_time: entryTime.toISOString(),
        exit_time: exitTime?.toISOString(),
        trade_date: entryTime.toISOString().split('T')[0],
        contract_multiplier: 1
      };

      const { data, error } = await supabase
        .from('trades')
        .insert(tradeData)
        .select()
        .single();

      if (error) {
        console.error(`   ❌ Failed to create ${trade.instrument}:`, error.message);
      } else {
        createdTrades.push(data);
        console.log(`   ✅ ${i + 1}. ${trade.instrument} (${trade.action}) - ${trade.status}`);
      }
    }

    // Wait for triggers
    console.log('\n⏳ Waiting for metrics calculation...');
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify all trades
    console.log('\n📊 Verifying trades...');
    const { data: allTrades, error: fetchError } = await supabase
      .from('trades')
      .select(`
        id,
        instrument,
        action,
        status,
        entry_price,
        exit_price,
        trade_metrics (
          net_pnl,
          trade_result
        )
      `)
      .eq('user_id', userId)
      .order('entry_time', { ascending: false });

    if (fetchError) {
      throw fetchError;
    }

    console.log(`\n✅ Total trades in database: ${allTrades.length}`);
    console.log('\n📈 Trade Summary:');
    
    let wins = 0;
    let losses = 0;
    let open = 0;
    let totalPnL = 0;

    allTrades.forEach((trade, i) => {
      const metrics = Array.isArray(trade.trade_metrics) ? trade.trade_metrics[0] : trade.trade_metrics;
      const pnl = metrics?.net_pnl || 0;
      const result = metrics?.trade_result || 'open';
      
      if (trade.status === 'open') {
        open++;
      } else if (result === 'win') {
        wins++;
        totalPnL += pnl;
      } else if (result === 'loss') {
        losses++;
        totalPnL += pnl;
      }

      console.log(`   ${i + 1}. ${trade.instrument.padEnd(10)} ${trade.action.padEnd(6)} ${trade.status.padEnd(8)} P&L: $${pnl.toFixed(2)}`);
    });

    console.log('\n' + '='.repeat(60));
    console.log('📊 STATISTICS');
    console.log('='.repeat(60));
    console.log(`   Total Trades: ${allTrades.length}`);
    console.log(`   Wins: ${wins}`);
    console.log(`   Losses: ${losses}`);
    console.log(`   Open: ${open}`);
    console.log(`   Win Rate: ${wins > 0 ? ((wins / (wins + losses)) * 100).toFixed(2) : 0}%`);
    console.log(`   Total P&L: $${totalPnL.toFixed(2)}`);
    console.log('='.repeat(60));

    console.log('\n🌐 Next Steps:');
    console.log('   1. Open http://localhost:8081 in your browser');
    console.log(`   2. Login with: ${testEmail} / Test123456!`);
    console.log('   3. Check Dashboard for statistics');
    console.log('   4. Check Trades page for all trades');
    console.log('   5. Check Analytics for charts and insights');
    console.log('   6. Test filtering by account, strategy, date range');
    console.log('   7. Try adding a new trade through the UI');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

createMultipleTrades();
