/**
 * Fix Future Trade
 * Updates the KAITOUSD trade to have current time
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

async function fixFutureTrade() {
  console.log('\n🔧 Fixing Future Trade...\n');

  try {
    // Find trades with future entry times
    const now = new Date();
    const { data: futureTrades } = await supabase
      .from('trades')
      .select('id, instrument, entry_time, exit_time')
      .gt('entry_time', now.toISOString());

    if (!futureTrades || futureTrades.length === 0) {
      console.log('✅ No future trades found!');
      return;
    }

    console.log(`Found ${futureTrades.length} trade(s) with future entry times:\n`);

    for (const trade of futureTrades) {
      console.log(`   ${trade.instrument}: ${trade.entry_time}`);
      
      // Update to current time
      const newEntryTime = new Date();
      const newExitTime = trade.exit_time ? new Date(newEntryTime.getTime() + 2 * 60 * 60 * 1000) : null; // 2 hours later

      const { error } = await supabase
        .from('trades')
        .update({
          entry_time: newEntryTime.toISOString(),
          exit_time: newExitTime?.toISOString(),
          trade_date: newEntryTime.toISOString().split('T')[0]
        })
        .eq('id', trade.id);

      if (error) {
        console.error(`   ❌ Failed to update ${trade.instrument}:`, error.message);
      } else {
        console.log(`   ✅ Updated ${trade.instrument}`);
        console.log(`      Old entry: ${trade.entry_time}`);
        console.log(`      New entry: ${newEntryTime.toISOString()}`);
      }
    }

    console.log('\n✅ All future trades fixed!');
    console.log('\n🌐 Next Steps:');
    console.log('   1. Refresh your browser (F5)');
    console.log('   2. Trades should now appear on dashboard');

  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixFutureTrade();
