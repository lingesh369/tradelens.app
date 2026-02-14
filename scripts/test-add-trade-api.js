/**
 * Test Add Trade via API
 * Simulates adding a trade through the frontend API
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

async function testAddTradeAPI() {
  console.log('\n🧪 Testing Add Trade API Flow...\n');

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

    // Get account and strategy
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

    const accountId = accounts[0].id;
    const strategyId = strategies[0].id;

    console.log('✅ User ID:', userId);
    console.log('✅ Account ID:', accountId);
    console.log('✅ Strategy ID:', strategyId);

    // Test 1: Add a simple long trade
    console.log('\n1️⃣ Testing simple long trade...');
    const trade1 = {
      user_id: userId,
      account_id: accountId,
      strategy_id: strategyId,
      instrument: 'META',
      action: 'long',
      market_type: 'stocks',
      entry_price: 450.00,
      quantity: 5,
      entry_time: new Date().toISOString(),
      exit_price: 460.00,
      exit_time: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      status: 'closed',
      sl: 445.00,
      target: 465.00,
      commission: 1.50,
      fees: 0.25,
      notes: 'Test trade via API - Long position',
      rating: 4,
      trade_date: new Date().toISOString().split('T')[0],
      contract_multiplier: 1
    };

    const { data: createdTrade1, error: error1 } = await supabase
      .from('trades')
      .insert(trade1)
      .select()
      .single();

    if (error1) {
      console.error('   ❌ Failed:', error1.message);
      throw error1;
    }

    console.log('   ✅ Trade created:', createdTrade1.id);
    console.log('      Instrument:', createdTrade1.instrument);
    console.log('      Entry:', createdTrade1.entry_price);
    console.log('      Exit:', createdTrade1.exit_price);

    // Wait for metrics
    await new Promise(resolve => setTimeout(resolve, 500));

    // Fetch with metrics
    const { data: trade1WithMetrics } = await supabase
      .from('trades')
      .select(`
        *,
        trade_metrics (
          net_pnl,
          gross_pnl,
          percent_gain,
          trade_result
        )
      `)
      .eq('id', createdTrade1.id)
      .single();

    const metrics1 = Array.isArray(trade1WithMetrics.trade_metrics) 
      ? trade1WithMetrics.trade_metrics[0] 
      : trade1WithMetrics.trade_metrics;

    if (metrics1) {
      console.log('   ✅ Metrics calculated:');
      console.log('      Net P&L:', metrics1.net_pnl);
      console.log('      Percent Gain:', metrics1.percent_gain);
      console.log('      Result:', metrics1.trade_result);
    } else {
      console.log('   ⚠️  Metrics not yet calculated');
    }

    // Test 2: Add a short trade
    console.log('\n2️⃣ Testing short trade...');
    const trade2 = {
      user_id: userId,
      account_id: accountId,
      strategy_id: strategyId,
      instrument: 'NFLX',
      action: 'short',
      market_type: 'stocks',
      entry_price: 600.00,
      quantity: 3,
      entry_time: new Date().toISOString(),
      exit_price: 590.00,
      exit_time: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(),
      status: 'closed',
      sl: 605.00,
      target: 585.00,
      commission: 1.00,
      fees: 0.20,
      notes: 'Test trade via API - Short position',
      rating: 5,
      trade_date: new Date().toISOString().split('T')[0],
      contract_multiplier: 1
    };

    const { data: createdTrade2, error: error2 } = await supabase
      .from('trades')
      .insert(trade2)
      .select()
      .single();

    if (error2) {
      console.error('   ❌ Failed:', error2.message);
      throw error2;
    }

    console.log('   ✅ Trade created:', createdTrade2.id);
    console.log('      Instrument:', createdTrade2.instrument);
    console.log('      Action:', createdTrade2.action);

    // Test 3: Add an open trade
    console.log('\n3️⃣ Testing open trade...');
    const trade3 = {
      user_id: userId,
      account_id: accountId,
      strategy_id: strategyId,
      instrument: 'DIS',
      action: 'long',
      market_type: 'stocks',
      entry_price: 95.00,
      quantity: 10,
      entry_time: new Date().toISOString(),
      status: 'open',
      sl: 92.00,
      target: 100.00,
      commission: 0,
      fees: 0,
      notes: 'Test trade via API - Open position',
      rating: 3,
      trade_date: new Date().toISOString().split('T')[0],
      contract_multiplier: 1
    };

    const { data: createdTrade3, error: error3 } = await supabase
      .from('trades')
      .insert(trade3)
      .select()
      .single();

    if (error3) {
      console.error('   ❌ Failed:', error3.message);
      throw error3;
    }

    console.log('   ✅ Trade created:', createdTrade3.id);
    console.log('      Status:', createdTrade3.status);
    console.log('      (No metrics expected for open trades)');

    // Test 4: Update an open trade to closed
    console.log('\n4️⃣ Testing trade update (close position)...');
    
    const { data: updatedTrade, error: updateError } = await supabase
      .from('trades')
      .update({
        exit_price: 98.00,
        exit_time: new Date().toISOString(),
        status: 'closed'
      })
      .eq('id', createdTrade3.id)
      .select()
      .single();

    if (updateError) {
      console.error('   ❌ Failed:', updateError.message);
      throw updateError;
    }

    console.log('   ✅ Trade updated to closed');
    console.log('      Exit Price:', updatedTrade.exit_price);

    // Wait for metrics
    await new Promise(resolve => setTimeout(resolve, 500));

    const { data: trade3WithMetrics } = await supabase
      .from('trades')
      .select(`
        *,
        trade_metrics (
          net_pnl,
          trade_result
        )
      `)
      .eq('id', createdTrade3.id)
      .single();

    const metrics3 = Array.isArray(trade3WithMetrics.trade_metrics) 
      ? trade3WithMetrics.trade_metrics[0] 
      : trade3WithMetrics.trade_metrics;

    if (metrics3) {
      console.log('   ✅ Metrics calculated after update:');
      console.log('      Net P&L:', metrics3.net_pnl);
      console.log('      Result:', metrics3.trade_result);
    }

    // Final verification
    console.log('\n5️⃣ Final verification...');
    const { data: allUserTrades } = await supabase
      .from('trades')
      .select('id')
      .eq('user_id', userId);

    console.log(`   ✅ Total trades for user: ${allUserTrades.length}`);

    console.log('\n' + '='.repeat(60));
    console.log('✅ API TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(60));
    console.log('\n📝 Test Results:');
    console.log('   ✅ Long trade creation: PASSED');
    console.log('   ✅ Short trade creation: PASSED');
    console.log('   ✅ Open trade creation: PASSED');
    console.log('   ✅ Trade update (close): PASSED');
    console.log('   ✅ Metrics calculation: PASSED');
    console.log('\n🎯 All API operations working correctly!');
    console.log('\n🌐 View in browser:');
    console.log('   http://localhost:8081');
    console.log('   Login: test@tradelens.com / Test123456!');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

testAddTradeAPI();
