const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function checkTradesSchema() {
  console.log('Checking trades table schema...\n');
  
  // Try to get the table structure by querying with all columns
  const { data, error } = await supabase
    .from('trades')
    .select('*')
    .limit(1);
  
  if (error) {
    console.error('Error querying trades:', error);
    return;
  }
  
  if (data && data.length > 0) {
    console.log('Available columns in trades table:');
    console.log(Object.keys(data[0]).sort().join('\n'));
  } else {
    console.log('No trades found in database');
  }
  
  // Try to insert a test trade to see what error we get
  console.log('\n\nTesting trade insertion with CSV data format...');
  
  const testTrade = {
    market_type: "Stocks", // Capital S as CSV sends it
    account_id: null,
    instrument: "TEST",
    contract: null,
    action: "buy",
    quantity: 1,
    entry_price: 100,
    entry_time: new Date().toISOString(),
    exit_price: 105,
    exit_time: new Date().toISOString(),
    commission: 1,
    fees: 1,
    notes: "Test trade",
    strategy_id: null,
    sl: 95,
    target: 110,
    chart_link: null,
    rating: null,
    contract_multiplier: 1,
    user_id: '00000000-0000-0000-0000-000000000000', // Dummy user ID
    partial_exits: null,
    tags: null,
    additional_images: null
  };
  
  const { data: insertData, error: insertError } = await supabase
    .from('trades')
    .insert([testTrade])
    .select();
  
  if (insertError) {
    console.error('Insert error:', insertError);
  } else {
    console.log('Insert successful:', insertData);
    
    // Clean up test trade
    if (insertData && insertData[0]) {
      await supabase.from('trades').delete().eq('id', insertData[0].id);
      console.log('Test trade cleaned up');
    }
  }
}

checkTradesSchema().then(() => process.exit(0));
