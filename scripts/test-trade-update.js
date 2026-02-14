import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'http://127.0.0.1:54321';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testTradeUpdate() {
  console.log('🧪 Testing Trade Update Flow\n');
  console.log('='.repeat(60));

  try {
    // 1. Sign in
    console.log('\n1️⃣ Signing in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@tradelens.com',
      password: 'Test123456!'
    });

    if (authError) {
      console.error('❌ Auth error:', authError.message);
      return;
    }

    console.log('✅ Signed in');

    // 2. Get first trade
    console.log('\n2️⃣ Fetching trades...');
    const { data: trades, error: tradesError } = await supabase
      .from('trades')
      .select('*')
      .eq('user_id', authData.user.id)
      .limit(1);

    if (tradesError || !trades || trades.length === 0) {
      console.error('❌ No trades found');
      return;
    }

    const trade = trades[0];
    console.log('✅ Found trade:', trade.id);
    console.log('   Instrument:', trade.instrument);
    console.log('   Entry Price:', trade.entry_price);
    console.log('   Exit Price:', trade.exit_price);
    console.log('   Status:', trade.status);

    // 3. Update the trade
    console.log('\n3️⃣ Updating trade...');
    const newExitPrice = trade.exit_price ? trade.exit_price + 1 : trade.entry_price + 5;
    
    const { data: updated, error: updateError } = await supabase
      .from('trades')
      .update({
        exit_price: newExitPrice,
        updated_at: new Date().toISOString()
      })
      .eq('id', trade.id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Update error:', updateError.message);
      return;
    }

    console.log('✅ Trade updated');
    console.log('   New Exit Price:', updated.exit_price);

    // 4. Wait for triggers
    console.log('\n4️⃣ Waiting for database triggers...');
    await new Promise(resolve => setTimeout(resolve, 500));

    // 5. Fetch updated trade with metrics
    console.log('\n5️⃣ Fetching updated trade with metrics...');
    const { data: refreshed, error: refreshError } = await supabase
      .from('trades')
      .select(`
        *,
        trade_metrics!left (
          net_p_and_l,
          gross_p_and_l,
          percent_gain,
          trade_outcome,
          r2r
        )
      `)
      .eq('id', trade.id)
      .single();

    if (refreshError) {
      console.error('❌ Refresh error:', refreshError.message);
      return;
    }

    console.log('✅ Trade refreshed');
    console.log('   Exit Price:', refreshed.exit_price);
    console.log('   Status:', refreshed.status);
    
    const metrics = Array.isArray(refreshed.trade_metrics) 
      ? refreshed.trade_metrics[0] 
      : refreshed.trade_metrics;
    
    if (metrics) {
      console.log('   Net P&L:', metrics.net_p_and_l);
      console.log('   Percent Gain:', metrics.percent_gain);
      console.log('   Trade Outcome:', metrics.trade_outcome);
    } else {
      console.log('   ⚠️  No metrics found');
    }

    // 6. Test partial exit update
    console.log('\n6️⃣ Testing partial exit update...');
    const partialExits = [
      {
        action: trade.action === 'long' ? 'sell' : 'buy',
        datetime: new Date().toISOString(),
        quantity: Math.floor(trade.quantity / 2),
        price: newExitPrice,
        fee: 1
      }
    ];

    const { data: partialUpdated, error: partialError } = await supabase
      .from('trades')
      .update({
        partial_exits: partialExits,
        status: 'partially_closed',
        total_exit_quantity: Math.floor(trade.quantity / 2),
        remaining_quantity: trade.quantity - Math.floor(trade.quantity / 2),
        updated_at: new Date().toISOString()
      })
      .eq('id', trade.id)
      .select()
      .single();

    if (partialError) {
      console.error('❌ Partial exit error:', partialError.message);
    } else {
      console.log('✅ Partial exit added');
      console.log('   Status:', partialUpdated.status);
      console.log('   Remaining Quantity:', partialUpdated.remaining_quantity);
      console.log('   Partial Exits:', JSON.stringify(partialUpdated.partial_exits, null, 2));
    }

    // 7. Wait and fetch again
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { data: finalCheck, error: finalError } = await supabase
      .from('trades')
      .select(`
        *,
        trade_metrics!left (*)
      `)
      .eq('id', trade.id)
      .single();

    if (!finalError) {
      console.log('\n7️⃣ Final verification:');
      console.log('   Status:', finalCheck.status);
      console.log('   Partial Exits Count:', finalCheck.partial_exits?.length || 0);
      
      const finalMetrics = Array.isArray(finalCheck.trade_metrics) 
        ? finalCheck.trade_metrics[0] 
        : finalCheck.trade_metrics;
      
      if (finalMetrics) {
        console.log('   Metrics Updated:', finalMetrics.updated_at);
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ Trade update test completed!');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

testTradeUpdate();
