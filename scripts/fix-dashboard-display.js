/**
 * Fix Dashboard Display
 * Analyzes and fixes why trades aren't showing
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

async function fixDashboard() {
  console.log('\n🔧 Fixing Dashboard Display Issue...\n');

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
    console.log('✅ User ID:', userId);

    // Get all trades with their entry times
    const { data: trades } = await supabase
      .from('trades')
      .select('id, instrument, entry_time, status, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    console.log(`\n📊 Found ${trades.length} trades\n`);

    // Analyze entry times
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const allTimeStart = new Date('2020-01-01');

    console.log('📅 Date Analysis:');
    console.log(`   Today: ${today.toISOString()}`);
    console.log(`   Now: ${now.toISOString()}`);
    console.log(`   All Time Start: ${allTimeStart.toISOString()}`);

    console.log('\n📋 Trade Entry Times:');
    trades.forEach((trade, i) => {
      const entryTime = new Date(trade.entry_time);
      const isInFuture = entryTime > now;
      const isBeforeAllTime = entryTime < allTimeStart;
      
      console.log(`   ${i + 1}. ${trade.instrument.padEnd(12)} ${entryTime.toISOString()} ${isInFuture ? '⚠️ FUTURE' : ''} ${isBeforeAllTime ? '⚠️ TOO OLD' : ''}`);
    });

    // Find problematic trades
    const futureTradesCount = trades.filter(t => new Date(t.entry_time) > now).length;
    const oldTrades = trades.filter(t => new Date(t.entry_time) < allTimeStart).length;

    if (futureTradesCount > 0) {
      console.log(`\n⚠️  WARNING: ${futureTradesCount} trade(s) have future entry times!`);
      console.log('   This might cause filtering issues.');
      console.log('\n   Fix: Update entry times to current or past dates');
    }

    if (oldTrades > 0) {
      console.log(`\n⚠️  WARNING: ${oldTrades} trade(s) are before 2020!`);
      console.log('   These won\'t show with "All Time" filter (starts 2020-01-01)');
    }

    // Check the most recent trade
    const mostRecent = trades[0];
    console.log('\n🔍 Most Recent Trade:');
    console.log(`   Instrument: ${mostRecent.instrument}`);
    console.log(`   Entry Time: ${mostRecent.entry_time}`);
    console.log(`   Status: ${mostRecent.status}`);
    console.log(`   Created: ${mostRecent.created_at}`);

    const entryDate = new Date(mostRecent.entry_time);
    const isWithinAllTime = entryDate >= allTimeStart && entryDate <= now;
    
    console.log(`\n   Within "All Time" range? ${isWithinAllTime ? '✅ YES' : '❌ NO'}`);

    if (!isWithinAllTime) {
      console.log('\n💡 SOLUTION:');
      console.log('   The most recent trade is outside the "All Time" filter range.');
      console.log('   Options:');
      console.log('   1. Update the trade entry_time to today');
      console.log('   2. Extend the "All Time" filter range');
      console.log('   3. Use a custom date range that includes this date');
    }

    // Provide fix options
    console.log('\n🔧 FIX OPTIONS:\n');
    
    console.log('Option 1: Update trade entry_time to now');
    console.log('   Run this in Supabase Studio SQL Editor:');
    console.log(`   UPDATE trades SET entry_time = NOW() WHERE id = '${mostRecent.id}';`);
    
    console.log('\nOption 2: Clear browser filters');
    console.log('   1. Open: scripts/clear-browser-cache.html');
    console.log('   2. Click "Clear Everything"');
    console.log('   3. Refresh browser');
    
    console.log('\nOption 3: Check browser console');
    console.log('   1. Open DevTools (F12)');
    console.log('   2. Look for date filter logs');
    console.log('   3. Check if trade is being filtered out');

    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 SUMMARY');
    console.log('='.repeat(60));
    console.log(`   Total Trades: ${trades.length}`);
    console.log(`   Future Trades: ${futureTradesCount}`);
    console.log(`   Old Trades (before 2020): ${oldTrades}`);
    console.log(`   Most Recent: ${mostRecent.instrument} (${mostRecent.status})`);
    console.log(`   Entry Time: ${mostRecent.entry_time}`);
    console.log(`   Within Filter Range: ${isWithinAllTime ? 'YES ✅' : 'NO ❌'}`);

  } catch (error) {
    console.error('\n❌ FAILED:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixDashboard();
