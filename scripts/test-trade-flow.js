/**
 * Test Trade Flow
 * Tests the complete trade creation and display flow
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('VITE_SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '***' : 'missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

console.log('🔗 Connected to Supabase:', supabaseUrl);

async function testTradeFlow() {
  console.log('\n📊 Testing Trade Flow...\n');

  try {
    // Step 1: Get or create test user
    console.log('1️⃣ Checking for test user...');
    const testEmail = 'test@tradelens.com';
    const testPassword = 'Test123456!';

    let userId;
    
    // Try to sign in first
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword,
    });

    if (signInError) {
      console.log('   Creating new test user...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword,
        options: {
          data: {
            full_name: 'Test User',
          }
        }
      });

      if (signUpError) {
        throw new Error(`Failed to create user: ${signUpError.message}`);
      }

      userId = signUpData.user?.id;
      console.log('   ✅ Test user created:', userId);
    } else {
      userId = signInData.user?.id;
      console.log('   ✅ Test user found:', userId);
    }

    if (!userId) {
      throw new Error('No user ID available');
    }

    // Step 2: Create test account
    console.log('\n2️⃣ Creating test account...');
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .insert({
        user_id: userId,
        name: 'Test Trading Account',
        account_type: 'live',
        broker: 'Test Broker',
        initial_balance: 10000,
        current_balance: 10000,
        currency: 'USD'
      })
      .select()
      .single();

    if (accountError) {
      console.error('   ❌ Account creation failed:', accountError);
      throw accountError;
    }
    console.log('   ✅ Account created:', account.id);

    // Step 3: Create test strategy
    console.log('\n3️⃣ Creating test strategy...');
    const { data: strategy, error: strategyError } = await supabase
      .from('strategies')
      .insert({
        user_id: userId,
        name: 'Test Strategy',
        description: 'A test strategy for validation',
        total_trades: 0,
        winning_trades: 0,
        losing_trades: 0
      })
      .select()
      .single();

    if (strategyError) {
      console.error('   ❌ Strategy creation failed:', strategyError);
      throw strategyError;
    }
    console.log('   ✅ Strategy created:', strategy.id);

    // Step 4: Create test trade
    console.log('\n4️⃣ Creating test trade...');
    const entryTime = new Date();
    const exitTime = new Date(entryTime.getTime() + 2 * 60 * 60 * 1000); // 2 hours later
    
    const tradeData = {
      user_id: userId,
      account_id: account.id,
      strategy_id: strategy.id,
      instrument: 'AAPL',
      action: 'long',
      market_type: 'stocks',
      entry_price: 150.00,
      quantity: 10,
      entry_time: entryTime.toISOString(),
      exit_price: 155.00,
      exit_time: exitTime.toISOString(),
      status: 'closed',
      sl: 148.00,
      target: 156.00,
      commission: 2.50,
      fees: 0.50,
      notes: 'Test trade for validation',
      rating: 4,
      trade_date: entryTime.toISOString().split('T')[0],
      contract_multiplier: 1
    };

    const { data: trade, error: tradeError } = await supabase
      .from('trades')
      .insert(tradeData)
      .select()
      .single();

    if (tradeError) {
      console.error('   ❌ Trade creation failed:', tradeError);
      throw tradeError;
    }
    console.log('   ✅ Trade created:', trade.id);

    // Wait for triggers to complete
    console.log('\n⏳ Waiting for database triggers to complete...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 5: Verify trade metrics
    console.log('\n5️⃣ Verifying trade metrics...');
    const { data: metrics, error: metricsError } = await supabase
      .from('trade_metrics')
      .select('*')
      .eq('trade_id', trade.id)
      .single();

    if (metricsError) {
      console.error('   ⚠️  Metrics not found (might be expected for triggers):', metricsError.message);
    } else {
      console.log('   ✅ Trade metrics calculated:');
      console.log('      Net P&L:', metrics.net_pnl);
      console.log('      Gross P&L:', metrics.gross_pnl);
      console.log('      Percent Gain:', metrics.percent_gain);
      console.log('      Trade Result:', metrics.trade_result);
      console.log('      R-Multiple:', metrics.r_multiple);
    }

    // Step 6: Verify trade appears in trades table
    console.log('\n6️⃣ Verifying trade in trades table...');
    const { data: fetchedTrade, error: fetchError } = await supabase
      .from('trades')
      .select(`
        *,
        trade_metrics (
          net_pnl,
          gross_pnl,
          percent_gain,
          trade_result,
          r_multiple
        )
      `)
      .eq('id', trade.id)
      .single();

    if (fetchError) {
      console.error('   ❌ Failed to fetch trade:', fetchError);
      throw fetchError;
    }
    console.log('   ✅ Trade fetched successfully');
    console.log('      Instrument:', fetchedTrade.instrument);
    console.log('      Action:', fetchedTrade.action);
    console.log('      Entry Price:', fetchedTrade.entry_price);
    console.log('      Exit Price:', fetchedTrade.exit_price);
    console.log('      Status:', fetchedTrade.status);

    // Step 7: Verify trade count for user
    console.log('\n7️⃣ Verifying user trades...');
    const { data: userTrades, error: userTradesError } = await supabase
      .from('trades')
      .select('id, instrument, action, status')
      .eq('user_id', userId);

    if (userTradesError) {
      console.error('   ❌ Failed to fetch user trades:', userTradesError);
      throw userTradesError;
    }
    console.log(`   ✅ Found ${userTrades.length} trade(s) for user`);
    userTrades.forEach((t, i) => {
      console.log(`      ${i + 1}. ${t.instrument} (${t.action}) - ${t.status}`);
    });

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('✅ TRADE FLOW TEST COMPLETED SUCCESSFULLY');
    console.log('='.repeat(50));
    console.log('\n📝 Test Summary:');
    console.log(`   User ID: ${userId}`);
    console.log(`   Account ID: ${account.id}`);
    console.log(`   Strategy ID: ${strategy.id}`);
    console.log(`   Trade ID: ${trade.id}`);
    console.log(`   Trade Status: ${trade.status}`);
    console.log(`   Metrics Calculated: ${metrics ? 'Yes' : 'Pending'}`);
    console.log('\n🌐 Next Steps:');
    console.log('   1. Open http://localhost:8081 in your browser');
    console.log(`   2. Login with: ${testEmail} / ${testPassword}`);
    console.log('   3. Navigate to Dashboard to see the trade');
    console.log('   4. Navigate to Trades page to see detailed view');
    console.log('   5. Check if metrics are displayed correctly');

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the test
testTradeFlow();
