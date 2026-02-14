/**
 * Test script to verify trade data structure for edit modal
 * This helps debug the TradeEditModal issues
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('Missing VITE_SUPABASE_ANON_KEY in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTradeEditModal() {
  console.log('🔍 Testing Trade Edit Modal Data Structure\n');

  try {
    // Get test user
    const { data: { user }, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@tradelens.com',
      password: 'Test123456!'
    });

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError?.message);
      return;
    }

    console.log('✅ Authenticated as:', user.email);

    // Fetch a trade with partial exits
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'partially_closed')
      .limit(1);

    if (tradesError) {
      console.error('❌ Error fetching trades:', tradesError.message);
      return;
    }

    if (!trades || trades.length === 0) {
      console.log('⚠️  No partially closed trades found. Fetching any closed trade...');
      
      const { data: closedTrades, error: closedError } = await supabase
        .from('trades')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'closed')
        .limit(1);

      if (closedError || !closedTrades || closedTrades.length === 0) {
        console.log('❌ No trades found to test');
        return;
      }

      trades.push(closedTrades[0]);
    }

    const trade = trades[0];
    console.log('\n📊 Trade Data Structure:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('Trade ID:', trade.trade_id);
    console.log('Instrument:', trade.instrument);
    console.log('Action:', trade.action, '(type:', typeof trade.action + ')');
    console.log('Market Type:', trade.market_type, '(type:', typeof trade.market_type + ')');
    console.log('Quantity:', trade.quantity);
    console.log('Entry Price:', trade.entry_price);
    console.log('Exit Price:', trade.exit_price);
    console.log('Entry Time:', trade.entry_time);
    console.log('Exit Time:', trade.exit_time);
    console.log('Status:', trade.status);
    console.log('Remaining Quantity:', trade.remaining_quantity);
    console.log('Contract Multiplier:', trade.contract_multiplier);
    console.log('Strategy ID:', trade.strategy_id);
    console.log('Account ID:', trade.account_id);
    console.log('Target:', trade.target);
    console.log('Stop Loss:', trade.sl);
    
    console.log('\n📋 Partial Exits:');
    if (trade.partial_exits) {
      let partialExits;
      if (typeof trade.partial_exits === 'string') {
        partialExits = JSON.parse(trade.partial_exits);
      } else {
        partialExits = trade.partial_exits;
      }
      
      console.log('Type:', typeof trade.partial_exits);
      console.log('Count:', Array.isArray(partialExits) ? partialExits.length : 0);
      
      if (Array.isArray(partialExits) && partialExits.length > 0) {
        partialExits.forEach((exit, index) => {
          console.log(`\nExit ${index + 1}:`);
          console.log('  Action:', exit.action);
          console.log('  DateTime:', exit.datetime);
          console.log('  Quantity:', exit.quantity);
          console.log('  Price:', exit.price);
          console.log('  Fee:', exit.fee);
        });
      }
    } else {
      console.log('No partial exits');
    }

    console.log('\n🔄 Data Transformation for TradeEditModal:');
    console.log('═══════════════════════════════════════════════════════════');
    
    const modalData = {
      id: trade.trade_id,
      symbol: trade.instrument,
      action: trade.action,
      quantity: trade.quantity,
      entryPrice: trade.entry_price,
      exitPrice: trade.exit_price,
      entryDate: trade.entry_time,
      exitDate: trade.exit_time,
      marketType: trade.market_type,
      accountId: trade.account_id,
      strategy: trade.strategy_id,
      target: trade.target,
      stopLoss: trade.sl,
      contractMultiplier: trade.contract_multiplier,
      partialExits: trade.partial_exits
    };

    console.log(JSON.stringify(modalData, null, 2));

    console.log('\n✅ Test Complete!');
    console.log('\n📝 Key Findings:');
    console.log('1. Action field value:', trade.action);
    console.log('2. Market Type field value:', trade.market_type);
    console.log('3. Partial exits type:', typeof trade.partial_exits);
    console.log('4. Entry/Exit dates format:', {
      entry: trade.entry_time,
      exit: trade.exit_time
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

testTradeEditModal();
